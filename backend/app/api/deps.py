from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenDecodeError, decode_token
from app.db.session import get_db
from app.models import User


bearer_scheme = HTTPBearer(auto_error=False)


def unauthorized(detail: str = "Invalid authentication credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized()

    try:
        payload = decode_token(credentials.credentials, "access")
    except TokenDecodeError as exc:
        raise unauthorized() from exc

    user = db.get(User, payload.user_id)
    if user is None:
        raise unauthorized()
    return user
