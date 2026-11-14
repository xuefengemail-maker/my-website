from sqlalchemy.orm import Session

from app.models import UserProfile


class ProfileNotFoundError(Exception):
    pass


class ProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_current(self, user_id: int) -> UserProfile:
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            raise ProfileNotFoundError
        return profile

    def update_avatar(self, user_id: int, avatar_url: str) -> UserProfile:
        profile = self.get_current(user_id)
        profile.avatar_url = avatar_url.strip()
        self.db.commit()
        self.db.refresh(profile)
        return profile
