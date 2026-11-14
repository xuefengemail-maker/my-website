from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.analytics import (
    AchievementListResponse,
    CalendarResponse,
    OverviewResponse,
    StudySessionCreate,
    StudySessionCreateResponse,
    StudySessionListResponse,
    StudySessionResponse,
)
from app.services.analytics_service import AnalyticsService, month_bounds
from app.services.study_service import StudyService, StudySessionNotFoundError


router = APIRouter(tags=["analytics"])


@router.post(
    "/study-sessions",
    response_model=StudySessionCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_session(
    payload: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySessionCreateResponse:
    session, daily = StudyService(db).create_session(current_user.id, payload)
    return StudySessionCreateResponse(
        session=StudySessionResponse.model_validate(session),
        daily=daily,
    )


@router.get("/study-sessions", response_model=StudySessionListResponse)
def list_study_sessions(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySessionListResponse:
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="from must be on or before to",
        )
    sessions = StudyService(db).list_sessions(current_user.id, from_date, to_date)
    return StudySessionListResponse(
        items=[StudySessionResponse.model_validate(item) for item in sessions]
    )


@router.get("/study-sessions/{session_id}", response_model=StudySessionResponse)
def get_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySessionResponse:
    try:
        session = StudyService(db).get_session(current_user.id, session_id)
    except StudySessionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        ) from exc
    return StudySessionResponse.model_validate(session)


@router.get("/analytics/overview", response_model=OverviewResponse)
def get_overview(
    range_value: Literal["week", "month"] = Query(default="week", alias="range"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    return AnalyticsService(db).overview(current_user.id, range_value)


@router.get("/analytics/calendar", response_model=CalendarResponse)
def get_calendar(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarResponse:
    try:
        month_bounds(month)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="month must be a valid YYYY-MM value",
        ) from exc
    return AnalyticsService(db).calendar(current_user.id, month)


@router.get("/analytics/achievements", response_model=AchievementListResponse)
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AchievementListResponse:
    return AnalyticsService(db).achievements(current_user.id)
