from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings


password_hash = PasswordHash.recommended()
_dummy_hash: str | None = None


class TokenDecodeError(Exception):
    pass


@dataclass(frozen=True)
class RefreshTokenData:
    token: str
    jti: str
    expires_at: datetime


@dataclass(frozen=True)
class TokenPayload:
    user_id: int
    token_type: str
    jti: str | None


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, password_hash_value: str) -> bool:
    try:
        return password_hash.verify(password, password_hash_value)
    except Exception:
        return False


def get_dummy_hash() -> str:
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = hash_password("studypal-dummy-password")
    return _dummy_hash


def _create_token(
    user_id: int,
    token_type: str,
    expires_delta: timedelta,
    jti: str | None = None,
) -> tuple[str, datetime]:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta
    payload = {
        "sub": str(user_id),
        "token_type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    if jti is not None:
        payload["jti"] = jti
    token = jwt.encode(
        payload,
        settings.jwt_secret.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    return token, expires_at


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    token, _expires_at = _create_token(
        user_id,
        "access",
        expires_delta or timedelta(minutes=settings.access_token_ttl_minutes),
    )
    return token


def create_refresh_token(user_id: int, expires_delta: timedelta | None = None) -> RefreshTokenData:
    settings = get_settings()
    jti = uuid4().hex
    token, expires_at = _create_token(
        user_id,
        "refresh",
        expires_delta or timedelta(days=settings.refresh_token_ttl_days),
        jti=jti,
    )
    return RefreshTokenData(token=token, jti=jti, expires_at=expires_at)


def decode_token(token: str, expected_type: str) -> TokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub", "token_type"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenDecodeError("Invalid token") from exc

    if payload.get("token_type") != expected_type:
        raise TokenDecodeError("Invalid token type")

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise TokenDecodeError("Invalid token subject") from exc

    jti = payload.get("jti")
    if expected_type == "refresh" and not isinstance(jti, str):
        raise TokenDecodeError("Missing refresh token identifier")

    return TokenPayload(user_id=user_id, token_type=expected_type, jti=jti)
