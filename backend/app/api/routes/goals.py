from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.analytics import (
    GoalCreate,
    GoalListResponse,
    GoalResponse,
    GoalUpdate,
)
from app.services.goal_service import GoalNotFoundError, GoalService


router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=GoalListResponse)
def list_goals(
    goal_date: date = Query(alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalListResponse:
    goals = GoalService(db).list_goals(current_user.id, goal_date)
    return GoalListResponse(
        items=[GoalResponse.model_validate(goal) for goal in goals]
    )


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalResponse:
    goal = GoalService(db).create_goal(current_user.id, payload)
    return GoalResponse.model_validate(goal)


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalResponse:
    try:
        goal = GoalService(db).get_goal(current_user.id, goal_id)
    except GoalNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        ) from exc
    return GoalResponse.model_validate(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalResponse:
    try:
        goal = GoalService(db).update_status(
            current_user.id,
            goal_id,
            payload.status,
        )
    except GoalNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        ) from exc
    return GoalResponse.model_validate(goal)
