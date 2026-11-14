from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.models import LearningGoal
from app.schemas.analytics import GoalCreate, GoalStatus
from app.services.analytics_service import AnalyticsService


class GoalNotFoundError(Exception):
    pass


class GoalService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_goal(self, user_id: int, payload: GoalCreate) -> LearningGoal:
        goal = LearningGoal(
            user_id=user_id,
            title=payload.title,
            category=payload.category,
            target_date=payload.target_date,
            status="pending",
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def list_goals(self, user_id: int, target_date: date) -> list[LearningGoal]:
        return list(
            self.db.scalars(
                select(LearningGoal)
                .where(
                    LearningGoal.user_id == user_id,
                    LearningGoal.target_date == target_date,
                )
                .order_by(LearningGoal.id.asc())
            )
        )

    def get_goal(self, user_id: int, goal_id: int) -> LearningGoal:
        goal = self.db.scalar(
            select(LearningGoal).where(
                LearningGoal.id == goal_id,
                LearningGoal.user_id == user_id,
            )
        )
        if goal is None:
            raise GoalNotFoundError
        return goal

    def update_status(
        self,
        user_id: int,
        goal_id: int,
        status_value: GoalStatus,
    ) -> LearningGoal:
        goal = self.get_goal(user_id, goal_id)

        if status_value == "completed":
            if goal.status != "completed" or goal.completed_at is None:
                goal.completed_at = utcnow()
            goal.status = "completed"
        else:
            goal.status = "pending"
            goal.completed_at = None

        self.db.commit()
        self.db.refresh(goal)

        analytics = AnalyticsService(self.db)
        analytics.refresh_profile_metrics(user_id)
        analytics.sync_achievements(user_id)
        return goal
