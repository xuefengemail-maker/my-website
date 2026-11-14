from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.analytics import LearningGoal, StudySession, UserAchievement
    from app.models.chat import ChatConversation
    from app.models.refresh_token import RefreshToken
    from app.models.user_profile import UserProfile


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    profile: Mapped[UserProfile] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    chat_conversations: Mapped[list[ChatConversation]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    study_sessions: Mapped[list[StudySession]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    learning_goals: Mapped[list[LearningGoal]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    achievements: Mapped[list[UserAchievement]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
