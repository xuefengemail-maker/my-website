import os
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.db.session import configure_sqlite_engine
from app.models import (
    ChatConversation,
    ChatMessage,
    LearningGoal,
    RefreshToken,
    StudySession,
    User,
    UserAchievement,
    UserProfile,
)


BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_SECRET = "test-secret-0123456789abcdef0123456789abcdef"


def run_alembic(db_path: Path, *args: str) -> None:
    env = os.environ.copy()
    env["STUDYPAL_DATABASE_URL"] = f"sqlite:///{db_path}"
    env["STUDYPAL_JWT_SECRET"] = TEST_SECRET
    env["STUDYPAL_TIMEZONE"] = "Asia/Shanghai"
    subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND_DIR,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def test_migration_schema_constraints_and_cascade(tmp_path):
    db_path = tmp_path / "migration.db"
    run_alembic(db_path, "upgrade", "head")

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    configure_sqlite_engine(engine)

    with engine.connect() as connection:
        assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1

    inspector = inspect(engine)
    assert {
        "users",
        "user_profiles",
        "refresh_tokens",
        "chat_conversations",
        "chat_messages",
        "study_sessions",
        "learning_goals",
        "user_achievements",
    } <= set(inspector.get_table_names())
    assert inspector.get_unique_constraints("users")
    assert inspector.get_unique_constraints("refresh_tokens")
    assert inspector.get_unique_constraints("user_achievements")
    assert inspector.get_check_constraints("user_profiles")
    assert inspector.get_check_constraints("chat_messages")
    assert inspector.get_check_constraints("study_sessions")
    assert inspector.get_check_constraints("learning_goals")
    assert any(
        index["name"] == "ix_refresh_tokens_user_id_expires_at"
        for index in inspector.get_indexes("refresh_tokens")
    )
    assert any(
        index["name"] == "ix_chat_conversations_user_id_updated_at"
        for index in inspector.get_indexes("chat_conversations")
    )
    assert any(
        index["name"] == "ix_chat_messages_conversation_id_created_at"
        for index in inspector.get_indexes("chat_messages")
    )
    assert any(
        index["name"] == "uq_chat_messages_streaming_conversation"
        for index in inspector.get_indexes("chat_messages")
    )
    assert any(
        index["name"] == "ix_study_sessions_user_id_studied_on"
        for index in inspector.get_indexes("study_sessions")
    )
    assert any(
        index["name"] == "ix_learning_goals_user_id_target_date"
        for index in inspector.get_indexes("learning_goals")
    )
    assert any(
        index["name"] == "ix_user_achievements_user_id"
        for index in inspector.get_indexes("user_achievements")
    )

    with Session(engine) as session:
        user = User(
            email="migration@example.com",
            password_hash="hash",
            profile=UserProfile(streak_days=2, level=3),
        )
        user.refresh_tokens.append(
            RefreshToken(
                jti="a" * 32,
                expires_at=utcnow() + timedelta(days=1),
            )
        )
        conversation = ChatConversation(user=user, title="迁移测试")
        conversation.messages.extend(
            [
                ChatMessage(role="user", content="你好", status="completed"),
                ChatMessage(role="assistant", content="你好，我是 StudyPal。", status="completed"),
            ]
        )
        user.study_sessions.append(
            StudySession(
                subject="TypeScript 泛型",
                duration_minutes=45,
                studied_on=date(2026, 11, 14),
            )
        )
        user.learning_goals.append(
            LearningGoal(
                title="复习泛型约束",
                category="前端基础",
                target_date=date(2026, 11, 14),
                status="completed",
                completed_at=utcnow(),
            )
        )
        user.achievements.append(UserAchievement(code="first_session"))
        session.add(user)
        session.commit()
        user_id = user.id
        conversation_id = conversation.id
        study_session_id = user.study_sessions[0].id
        goal_id = user.learning_goals[0].id
        achievement_id = user.achievements[0].id

        assert session.get(User, user_id) is not None
        assert session.get(UserProfile, user_id) is not None
        assert session.scalar(select(RefreshToken)) is not None
        assert session.get(ChatConversation, conversation_id) is not None
        assert session.scalar(select(ChatMessage)) is not None
        assert session.get(StudySession, study_session_id) is not None
        assert session.get(LearningGoal, goal_id) is not None
        assert session.get(UserAchievement, achievement_id) is not None

        session.delete(user)
        session.commit()

        assert session.get(User, user_id) is None
        assert session.get(UserProfile, user_id) is None
        assert session.scalar(select(RefreshToken)) is None
        assert session.get(ChatConversation, conversation_id) is None
        assert session.scalar(select(ChatMessage)) is None
        assert session.get(StudySession, study_session_id) is None
        assert session.get(LearningGoal, goal_id) is None
        assert session.get(UserAchievement, achievement_id) is None

    engine.dispose()


def test_migration_downgrade_removes_tables(tmp_path):
    db_path = tmp_path / "rollback.db"
    run_alembic(db_path, "upgrade", "head")
    run_alembic(db_path, "downgrade", "base")

    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    assert "users" not in table_names
    assert "user_profiles" not in table_names
    assert "refresh_tokens" not in table_names
    assert "chat_conversations" not in table_names
    assert "chat_messages" not in table_names
    assert "study_sessions" not in table_names
    assert "learning_goals" not in table_names
    assert "user_achievements" not in table_names
    engine.dispose()


def test_analytics_constraints_reject_invalid_values(tmp_path):
    db_path = tmp_path / "constraints.db"
    run_alembic(db_path, "upgrade", "head")

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    configure_sqlite_engine(engine)

    with Session(engine) as session:
        user = User(email="constraints@example.com", password_hash="hash")
        session.add(user)
        session.commit()
        user_id = user.id

        for invalid_duration in (0, 1441):
            session.add(
                StudySession(
                    user_id=user_id,
                    subject="无效记录",
                    duration_minutes=invalid_duration,
                    studied_on=date(2026, 11, 14),
                )
            )
            with pytest.raises(IntegrityError):
                session.commit()
            session.rollback()

        session.add(
            LearningGoal(
                user_id=user_id,
                title="无效状态",
                category="测试",
                target_date=date(2026, 11, 14),
                status="done",
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        session.add(UserAchievement(user_id=user_id, code="first_session"))
        session.commit()
        session.add(UserAchievement(user_id=user_id, code="first_session"))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

    engine.dispose()


def test_migration_downgrade_to_chat_revision_preserves_existing_tables(tmp_path):
    db_path = tmp_path / "downgrade-to-chat.db"
    run_alembic(db_path, "upgrade", "head")

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    configure_sqlite_engine(engine)
    with Session(engine) as session:
        user = User(
            email="rollback@example.com",
            password_hash="hash",
            profile=UserProfile(streak_days=4, level=2),
        )
        user.refresh_tokens.append(
            RefreshToken(
                jti="b" * 32,
                expires_at=utcnow() + timedelta(days=1),
            )
        )
        conversation = ChatConversation(user=user, title="回滚测试")
        conversation.messages.append(
            ChatMessage(role="user", content="保留我", status="completed")
        )
        user.study_sessions.append(
            StudySession(
                subject="回滚后应删除",
                duration_minutes=30,
                studied_on=date(2026, 11, 14),
            )
        )
        session.add(user)
        session.commit()
        user_id = user.id
        conversation_id = conversation.id
    engine.dispose()

    run_alembic(db_path, "downgrade", "20261114_0002")

    engine = create_engine(f"sqlite:///{db_path}")
    table_names = set(inspect(engine).get_table_names())

    assert {"users", "user_profiles", "refresh_tokens", "chat_conversations", "chat_messages"} <= table_names
    assert "study_sessions" not in table_names
    assert "learning_goals" not in table_names
    assert "user_achievements" not in table_names

    with Session(engine) as session:
        user = session.get(User, user_id)
        assert user is not None
        assert user.email == "rollback@example.com"
        assert session.get(UserProfile, user_id) is not None
        assert session.scalar(select(RefreshToken)) is not None
        conversation = session.get(ChatConversation, conversation_id)
        assert conversation is not None
        assert conversation.title == "回滚测试"
        assert session.scalar(select(ChatMessage)) is not None
    engine.dispose()
