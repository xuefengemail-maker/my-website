from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import (
    TokenDecodeError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_dummy_hash,
    hash_password,
    normalize_email,
    verify_password,
)
from app.db.base import as_utc, utcnow
from app.models import RefreshToken, User, UserProfile


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


@dataclass(frozen=True)
class IssuedTokens:
    access_token: str
    refresh_token: str
    expires_in: int
    refresh_expires_in: int


@dataclass(frozen=True)
class IssuedAccessToken:
    access_token: str
    expires_in: int


class AuthService:
    def __init__(self, db: Session, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()

    def register(self, email: str, password: str) -> User:
        user = User(
            email=normalize_email(email),
            password_hash=hash_password(password),
            profile=UserProfile(streak_days=0, level=1),
        )
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise EmailAlreadyRegisteredError from exc
        self.db.refresh(user)
        return user

    def login(self, email: str, password: str) -> tuple[User, IssuedTokens]:
        user = self.db.scalar(
            select(User).where(User.email == normalize_email(email))
        )
        if user is None:
            verify_password(password, get_dummy_hash())
            raise InvalidCredentialsError
        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        self.db.add(
            RefreshToken(
                user_id=user.id,
                jti=refresh_token.jti,
                expires_at=refresh_token.expires_at,
            )
        )
        self.db.commit()

        return user, IssuedTokens(
            access_token=access_token,
            refresh_token=refresh_token.token,
            expires_in=self.settings.access_token_ttl_minutes * 60,
            refresh_expires_in=self.settings.refresh_token_ttl_days * 86400,
        )

    def refresh_access(self, refresh_token: str) -> IssuedAccessToken:
        try:
            payload = decode_token(refresh_token, "refresh")
        except TokenDecodeError as exc:
            raise InvalidRefreshTokenError from exc

        record = self.db.scalar(
            select(RefreshToken).where(
                RefreshToken.jti == payload.jti,
                RefreshToken.user_id == payload.user_id,
            )
        )
        if record is None or as_utc(record.expires_at) <= utcnow():
            raise InvalidRefreshTokenError

        user = self.db.get(User, payload.user_id)
        if user is None:
            raise InvalidRefreshTokenError

        return IssuedAccessToken(
            access_token=create_access_token(user.id),
            expires_in=self.settings.access_token_ttl_minutes * 60,
        )
