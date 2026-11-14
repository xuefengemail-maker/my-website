from datetime import datetime, timedelta, timezone

import jwt
import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import (
    TokenDecodeError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    normalize_email,
    verify_password,
)
from app.models import User


def register(client, email: str = "learner@example.com", password: str = "correct-horse-battery"):
    return client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )


def login(client, email: str = "learner@example.com", password: str = "correct-horse-battery"):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


def test_email_normalization_and_password_hashing():
    assert normalize_email("  Learner@Example.COM ") == "learner@example.com"

    password = "correct-horse-battery"
    password_hash_value = hash_password(password)

    assert password_hash_value != password
    assert password_hash_value.startswith("$argon2")
    assert verify_password(password, password_hash_value) is True
    assert verify_password("wrong-password", password_hash_value) is False


def test_jwt_type_expiry_and_claims():
    access_token = create_access_token(7)
    refresh_token = create_refresh_token(7)

    access_payload = decode_token(access_token, "access")
    refresh_payload = decode_token(refresh_token.token, "refresh")

    assert access_payload.user_id == 7
    assert access_payload.token_type == "access"
    assert access_payload.jti is None
    assert refresh_payload.user_id == 7
    assert refresh_payload.token_type == "refresh"
    assert refresh_payload.jti == refresh_token.jti

    with pytest.raises(TokenDecodeError):
        decode_token(create_refresh_token(7, timedelta(seconds=-1)).token, "refresh")

    with pytest.raises(TokenDecodeError):
        decode_token(access_token, "refresh")

    settings = get_settings()
    missing_expiry = jwt.encode(
        {"sub": "7", "token_type": "access"},
        settings.jwt_secret.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(TokenDecodeError):
        decode_token(missing_expiry, "access")

    now = int(datetime.now(timezone.utc).timestamp())
    wrong_signature = jwt.encode(
        {
            "sub": "7",
            "token_type": "access",
            "iat": now,
            "exp": now + 3600,
        },
        "wrong-secret-0123456789abcdef0123456789abcdef",
        algorithm="HS256",
    )
    with pytest.raises(TokenDecodeError):
        decode_token(wrong_signature, "access")


def test_register_normalizes_email_and_hashes_password(client, db_session):
    response = register(client, "  Learner@Example.COM  ")
    assert response.status_code == 201
    assert response.json()["email"] == "learner@example.com"
    assert "password" not in response.json()
    assert "password_hash" not in response.json()

    db_session.expire_all()
    user = db_session.scalar(select(User).where(User.email == "learner@example.com"))
    assert user is not None
    assert user.password_hash != "correct-horse-battery"
    assert user.password_hash.startswith("$argon2")
    assert user.profile is not None
    assert user.profile.streak_days == 0
    assert user.profile.level == 1


def test_duplicate_email_returns_conflict(client):
    assert register(client).status_code == 201
    duplicate = register(client, "  LEARNER@EXAMPLE.COM  ")
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Email already registered"


def test_register_rejects_invalid_input(client):
    assert register(client, "not-an-email").status_code == 422
    assert register(client, "valid@example.com", "short").status_code == 422


def test_login_success_and_generic_failures(client):
    assert register(client).status_code == 201
    success = login(client)
    assert success.status_code == 200
    body = success.json()
    assert {"access_token", "refresh_token", "token_type", "expires_in", "refresh_expires_in"} <= set(body)
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 1800
    assert body["refresh_expires_in"] == 604800

    wrong_password = login(client, password="wrong-password")
    unknown_email = login(client, email="unknown@example.com")
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]
    assert wrong_password.json()["detail"] == "Invalid email or password"
    assert "access_token" not in wrong_password.json()


def test_login_validation_errors(client):
    assert client.post("/api/v1/auth/login", json={}).status_code == 422
    assert client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email", "password": "some-password"},
    ).status_code == 422


def test_refresh_flow_and_failure_boundaries(client):
    registration = register(client)
    login_response = login(client)
    assert registration.status_code == 201
    assert login_response.status_code == 200

    user_id = registration.json()["id"]
    tokens = login_response.json()
    refreshed = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refreshed.status_code == 200
    refreshed_body = refreshed.json()
    assert refreshed_body["token_type"] == "bearer"
    assert refreshed_body["expires_in"] == 1800
    assert decode_token(refreshed_body["access_token"], "access").user_id == user_id

    expired = create_refresh_token(user_id, timedelta(seconds=-1))
    assert client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": expired.token},
    ).status_code == 401

    unknown = create_refresh_token(user_id)
    assert client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": unknown.token},
    ).status_code == 401

    assert client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["access_token"]},
    ).status_code == 401

    assert client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": ""},
    ).status_code == 422


def test_openapi_contains_auth_endpoints(client):
    schema = client.get("/openapi.json").json()
    assert "/api/v1/auth/register" in schema["paths"]
    assert "/api/v1/auth/login" in schema["paths"]
    assert "/api/v1/auth/refresh" in schema["paths"]
