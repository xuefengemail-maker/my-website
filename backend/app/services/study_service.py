from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import StudySession
from app.schemas.analytics import CalendarDay, StudySessionCreate
from app.services.analytics_service import AnalyticsService


class StudySessionNotFoundError(Exception):
    pass


class StudyService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_session(
        self,
        user_id: int,
        payload: StudySessionCreate,
    ) -> tuple[StudySession, CalendarDay]:
        session = StudySession(
            user_id=user_id,
            subject=payload.subject,
            duration_minutes=payload.duration_minutes,
            studied_on=payload.studied_on,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        analytics = AnalyticsService(self.db)
        analytics.refresh_profile_metrics(user_id)
        analytics.sync_achievements(user_id)
        return session, analytics.daily_summary(user_id, session.studied_on)

    def get_session(self, user_id: int, session_id: int) -> StudySession:
        session = self.db.scalar(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.user_id == user_id,
            )
        )
        if session is None:
            raise StudySessionNotFoundError
        return session

    def list_sessions(
        self,
        user_id: int,
        start: date,
        end: date,
    ) -> list[StudySession]:
        return list(
            self.db.scalars(
                select(StudySession)
                .where(
                    StudySession.user_id == user_id,
                    StudySession.studied_on >= start,
                    StudySession.studied_on <= end,
                )
                .order_by(StudySession.studied_on.desc(), StudySession.id.desc())
            )
        )
