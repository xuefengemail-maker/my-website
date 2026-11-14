from datetime import timedelta

from app.core.security import create_access_token, create_refresh_token


def register_and_login(client, email: str = "learner@example.com"):
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert registration.status_code == 201
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert login_response.status_code == 200
    return registration.json(), login_response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_profile_requires_access_token(client):
    assert client.get("/api/v1/users/me/profile").status_code == 401
    assert client.patch(
        "/api/v1/users/me/profile",
        json={"avatar_url": "https://example.com/avatar.png"},
    ).status_code == 401
    assert client.get(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer invalid-token"},
    ).status_code == 401


def test_expired_access_and_refresh_as_access_are_rejected(client):
    registration, tokens = register_and_login(client)
    user_id = registration["id"]

    expired = create_access_token(user_id, timedelta(seconds=-1))
    missing_header = client.get(
        "/api/v1/users/me/profile",
        headers=auth_headers(expired),
    )
    assert missing_header.status_code == 401
    assert missing_header.headers["www-authenticate"] == "Bearer"

    refresh = create_refresh_token(user_id)
    assert client.get(
        "/api/v1/users/me/profile",
        headers=auth_headers(refresh.token),
    ).status_code == 401

    assert client.get(
        "/api/v1/users/me/profile",
        headers=auth_headers(tokens["refresh_token"]),
    ).status_code == 401


def test_default_profile_and_avatar_update(client):
    _registration, tokens = register_and_login(client)
    headers = auth_headers(tokens["access_token"])

    default = client.get("/api/v1/users/me/profile", headers=headers)
    assert default.status_code == 200
    assert default.json() == {"avatar_url": None, "streak_days": 0, "level": 1}

    updated = client.patch(
        "/api/v1/users/me/profile",
        headers=headers,
        json={"avatar_url": "https://cdn.example.com/learners/1.png"},
    )
    assert updated.status_code == 200
    assert updated.json() == {
        "avatar_url": "https://cdn.example.com/learners/1.png",
        "streak_days": 0,
        "level": 1,
    }

    assert client.get("/api/v1/users/me/profile", headers=headers).json() == updated.json()


def test_profile_is_isolated_by_token(client):
    registration_a, tokens_a = register_and_login(client, "a@example.com")
    _registration_b, tokens_b = register_and_login(client, "b@example.com")

    assert client.patch(
        "/api/v1/users/me/profile",
        headers=auth_headers(tokens_a["access_token"]),
        json={"avatar_url": "https://cdn.example.com/a.png"},
    ).status_code == 200

    profile_a = client.get(
        "/api/v1/users/me/profile",
        headers=auth_headers(tokens_a["access_token"]),
    )
    profile_b = client.get(
        "/api/v1/users/me/profile",
        headers=auth_headers(tokens_b["access_token"]),
    )
    assert profile_a.status_code == 200
    assert profile_a.json()["avatar_url"] == "https://cdn.example.com/a.png"
    assert profile_b.status_code == 200
    assert profile_b.json()["avatar_url"] is None
    assert profile_a.json() != profile_b.json()


def test_invalid_avatar_and_read_only_fields_do_not_change_profile(client):
    _registration, tokens = register_and_login(client)
    headers = auth_headers(tokens["access_token"])

    invalid_urls = [
        "ftp://example.com/avatar.png",
        "not-a-url",
        "https:///missing-host",
        "https://example.com/" + "a" * 2100,
    ]
    for invalid_url in invalid_urls:
        response = client.patch(
            "/api/v1/users/me/profile",
            headers=headers,
            json={"avatar_url": invalid_url},
        )
        assert response.status_code == 422

    read_only = client.patch(
        "/api/v1/users/me/profile",
        headers=headers,
        json={"avatar_url": "https://cdn.example.com/a.png", "streak_days": 10},
    )
    assert read_only.status_code == 422

    read_only_level = client.patch(
        "/api/v1/users/me/profile",
        headers=headers,
        json={"avatar_url": "https://cdn.example.com/a.png", "level": 10},
    )
    assert read_only_level.status_code == 422

    assert client.get("/api/v1/users/me/profile", headers=headers).json() == {
        "avatar_url": None,
        "streak_days": 0,
        "level": 1,
    }


def test_openapi_contains_profile_endpoints_and_bearer_security(client):
    schema = client.get("/openapi.json").json()
    assert "/api/v1/users/me/profile" in schema["paths"]
    assert schema["paths"]["/api/v1/users/me/profile"]["get"]["security"] == [
        {"HTTPBearer": []}
    ]
    assert schema["components"]["securitySchemes"]["HTTPBearer"]["scheme"] == "bearer"
