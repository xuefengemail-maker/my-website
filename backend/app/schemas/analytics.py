from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


GoalStatus = Literal["pending", "completed"]


def _required_text(value: str, field_name: str, max_length: int) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{field_name} must not be blank")
    if len(value) > max_length:
        raise ValueError(f"{field_name} must be at most {max_length} characters")
    return value


class StudySessionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=1, max_length=120)
    duration_minutes: int = Field(ge=1, le=1440)
    studied_on: date

    @field_validator("subject")
    @classmethod
    def normalize_subject(cls, value: str) -> str:
        return _required_text(value, "subject", 120)


class StudySessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    duration_minutes: int
    studied_on: date
    created_at: datetime
    updated_at: datetime


class StudySessionListResponse(BaseModel):
    items: list[StudySessionResponse]


class CalendarDay(BaseModel):
    date: date
    minutes: int
    sessions: int
    completed_goals: int
    is_today: bool
    is_future: bool


class StudySessionCreateResponse(BaseModel):
    session: StudySessionResponse
    daily: CalendarDay


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=60)
    target_date: date

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return _required_text(value, "title", 120)

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return _required_text(value, "category", 60)


class GoalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: GoalStatus


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    target_date: date
    status: GoalStatus
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class GoalListResponse(BaseModel):
    items: list[GoalResponse]


class StatItem(BaseModel):
    id: str
    label: str
    value: int | float
    unit: str
    description: str


class TrendPoint(BaseModel):
    label: str
    value: float


class TrendResponse(BaseModel):
    view: Literal["week", "month"]
    points: list[TrendPoint]


class GoalSummary(BaseModel):
    completed: int
    total: int
    progress: int


class OverviewResponse(BaseModel):
    stats: list[StatItem]
    trend: TrendResponse
    streak_days: int
    level: int
    goal_summary: GoalSummary


class CalendarResponse(BaseModel):
    month: str
    timezone: str
    days: list[CalendarDay]


class AchievementItem(BaseModel):
    code: str
    title: str
    description: str
    target: int
    progress: int
    unlocked: bool
    unlocked_at: datetime | None


class AchievementListResponse(BaseModel):
    items: list[AchievementItem]
