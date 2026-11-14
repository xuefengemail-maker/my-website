from __future__ import annotations

import calendar as calendar_module
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.base import as_utc, utcnow
from app.models import LearningGoal, StudySession, UserAchievement, UserProfile
from app.schemas.analytics import (
    AchievementItem,
    AchievementListResponse,
    CalendarDay,
    CalendarResponse,
    GoalSummary,
    OverviewResponse,
    StatItem,
    TrendPoint,
    TrendResponse,
)


WEEKDAY_LABELS = ("周一", "周二", "周三", "周四", "周五", "周六", "周日")


@dataclass(frozen=True)
class AchievementDefinition:
    code: str
    title: str
    description: str
    target: int


ACHIEVEMENTS = (
    AchievementDefinition(
        code="first_session",
        title="初次启程",
        description="完成第一条学习记录",
        target=1,
    ),
    AchievementDefinition(
        code="streak_7",
        title="七日坚持",
        description="连续学习 7 天",
        target=7,
    ),
    AchievementDefinition(
        code="hours_10",
        title="十小时里程碑",
        description="累计学习 10 小时",
        target=600,
    ),
    AchievementDefinition(
        code="goals_20",
        title="目标达成者",
        description="完成 20 个学习目标",
        target=20,
    ),
)


def week_start_for(day: date) -> date:
    return day - timedelta(days=day.weekday())


def month_bounds(month: str) -> tuple[date, date, date]:
    first = date.fromisoformat(f"{month}-01")
    last = date(
        first.year,
        first.month,
        calendar_module.monthrange(first.year, first.month)[1],
    )
    if first.month == 12:
        next_first = date(first.year + 1, 1, 1)
    else:
        next_first = date(first.year, first.month + 1, 1)
    return first, last, next_first


def local_day_start_utc(day: date, tz: ZoneInfo) -> datetime:
    return datetime.combine(day, time.min, tzinfo=tz).astimezone(timezone.utc)


class AnalyticsService:
    def __init__(self, db: Session, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.tz = self.settings.timezone_info

    def today(self) -> date:
        return datetime.now(self.tz).date()

    def _study_day_map(
        self,
        user_id: int,
        start: date,
        end: date,
    ) -> dict[date, tuple[int, int]]:
        rows = self.db.execute(
            select(
                StudySession.studied_on,
                func.sum(StudySession.duration_minutes),
                func.count(StudySession.id),
            )
            .where(
                StudySession.user_id == user_id,
                StudySession.studied_on >= start,
                StudySession.studied_on <= end,
            )
            .group_by(StudySession.studied_on)
        ).all()
        return {
            studied_on: (int(total_minutes or 0), int(session_count or 0))
            for studied_on, total_minutes, session_count in rows
        }

    def _completed_goal_day_map(
        self,
        user_id: int,
        start: date,
        end_exclusive: date,
    ) -> dict[date, int]:
        start_utc = local_day_start_utc(start, self.tz)
        end_utc = local_day_start_utc(end_exclusive, self.tz)
        goals = self.db.scalars(
            select(LearningGoal).where(
                LearningGoal.user_id == user_id,
                LearningGoal.status == "completed",
                LearningGoal.completed_at.is_not(None),
                LearningGoal.completed_at >= start_utc,
                LearningGoal.completed_at < end_utc,
            )
        ).all()
        counts: dict[date, int] = {}
        for goal in goals:
            if goal.completed_at is None:
                continue
            local_day = as_utc(goal.completed_at).astimezone(self.tz).date()
            counts[local_day] = counts.get(local_day, 0) + 1
        return counts

    def _goal_counts(self, user_id: int, start: date, end: date) -> tuple[int, int]:
        total = self.db.scalar(
            select(func.count(LearningGoal.id)).where(
                LearningGoal.user_id == user_id,
                LearningGoal.target_date >= start,
                LearningGoal.target_date <= end,
            )
        ) or 0
        completed = self.db.scalar(
            select(func.count(LearningGoal.id)).where(
                LearningGoal.user_id == user_id,
                LearningGoal.target_date >= start,
                LearningGoal.target_date <= end,
                LearningGoal.status == "completed",
            )
        ) or 0
        return int(total), int(completed)

    def _study_days(self, user_id: int) -> list[date]:
        return list(
            self.db.scalars(
                select(StudySession.studied_on)
                .where(StudySession.user_id == user_id)
                .distinct()
                .order_by(StudySession.studied_on.desc())
            )
        )

    def _streak_days(self, user_id: int) -> int:
        days = self._study_days(user_id)
        if not days:
            return 0

        today = self.today()
        if days[0] == today:
            expected = today
        elif days[0] == today - timedelta(days=1):
            expected = today - timedelta(days=1)
        else:
            return 0

        streak = 0
        for day in days:
            if day == expected:
                streak += 1
                expected -= timedelta(days=1)
            elif day < expected:
                break
        return streak

    def _total_minutes(self, user_id: int) -> int:
        return int(
            self.db.scalar(
                select(func.coalesce(func.sum(StudySession.duration_minutes), 0)).where(
                    StudySession.user_id == user_id
                )
            )
            or 0
        )

    def _level(self, total_minutes: int) -> int:
        return max(1, total_minutes // 600 + 1)

    def _achievement_progress(self, user_id: int, streak_days: int, total_minutes: int) -> dict[str, int]:
        total_sessions = int(
            self.db.scalar(
                select(func.count(StudySession.id)).where(StudySession.user_id == user_id)
            )
            or 0
        )
        completed_goals = int(
            self.db.scalar(
                select(func.count(LearningGoal.id)).where(
                    LearningGoal.user_id == user_id,
                    LearningGoal.status == "completed",
                )
            )
            or 0
        )
        return {
            "first_session": total_sessions,
            "streak_7": streak_days,
            "hours_10": total_minutes,
            "goals_20": completed_goals,
        }

    def refresh_profile_metrics(self, user_id: int) -> UserProfile:
        streak_days = self._streak_days(user_id)
        level = self._level(self._total_minutes(user_id))
        profile = self.db.get(UserProfile, user_id)
        changed = False

        if profile is None:
            profile = UserProfile(user_id=user_id, streak_days=streak_days, level=level)
            self.db.add(profile)
            changed = True
        elif profile.streak_days != streak_days or profile.level != level:
            profile.streak_days = streak_days
            profile.level = level
            changed = True

        if changed:
            self.db.commit()
            self.db.refresh(profile)
        return profile

    def sync_achievements(self, user_id: int) -> dict[str, UserAchievement]:
        streak_days = self._streak_days(user_id)
        total_minutes = self._total_minutes(user_id)
        progress = self._achievement_progress(user_id, streak_days, total_minutes)
        existing = {
            achievement.code: achievement
            for achievement in self.db.scalars(
                select(UserAchievement).where(UserAchievement.user_id == user_id)
            )
        }

        new_records: list[UserAchievement] = []
        for definition in ACHIEVEMENTS:
            if (
                progress[definition.code] >= definition.target
                and definition.code not in existing
            ):
                record = UserAchievement(user_id=user_id, code=definition.code)
                self.db.add(record)
                new_records.append(record)

        if new_records:
            self.db.commit()
            for record in new_records:
                self.db.refresh(record)
                existing[record.code] = record
        return existing

    def daily_summary(self, user_id: int, day: date) -> CalendarDay:
        study_map = self._study_day_map(user_id, day, day)
        completed_map = self._completed_goal_day_map(user_id, day, day + timedelta(days=1))
        minutes, sessions = study_map.get(day, (0, 0))
        today = self.today()
        return CalendarDay(
            date=day,
            minutes=minutes,
            sessions=sessions,
            completed_goals=completed_map.get(day, 0),
            is_today=day == today,
            is_future=day > today,
        )

    def overview(self, user_id: int, range_value: str) -> OverviewResponse:
        today = self.today()
        week_start = week_start_for(today)
        week_end = week_start + timedelta(days=6)
        if range_value == "week":
            trend_start = week_start
            trend_end = week_end
        else:
            trend_start = week_start - timedelta(weeks=3)
            trend_end = week_end

        study_map = self._study_day_map(user_id, trend_start, trend_end)
        completed_goal_map = self._completed_goal_day_map(user_id, trend_start, trend_end + timedelta(days=1))
        weekly_minutes = sum(
            study_map.get(day, (0, 0))[0]
            for day in (week_start + timedelta(days=offset) for offset in range(7))
        )
        weekly_completed_goals = sum(
            completed_goal_map.get(day, 0)
            for day in (week_start + timedelta(days=offset) for offset in range(7))
        )
        total_goals, completed_goals = self._goal_counts(user_id, week_start, week_end)
        weekly_progress = (
            round(completed_goals / total_goals * 100) if total_goals > 0 else 0
        )
        streak_days = self._streak_days(user_id)
        total_minutes = self._total_minutes(user_id)
        level = self._level(total_minutes)

        self.refresh_profile_metrics(user_id)
        self.sync_achievements(user_id)

        if range_value == "week":
            points = [
                TrendPoint(
                    label=WEEKDAY_LABELS[offset],
                    value=float(study_map.get(week_start + timedelta(days=offset), (0, 0))[0]),
                )
                for offset in range(7)
            ]
        else:
            points = []
            for index in range(4):
                start = week_start - timedelta(weeks=3 - index)
                end = start + timedelta(days=6)
                minutes = sum(
                    study_map.get(start + timedelta(days=offset), (0, 0))[0]
                    for offset in range(7)
                )
                points.append(
                    TrendPoint(label=f"第 {index + 1} 周", value=float(minutes))
                )

        return OverviewResponse(
            stats=[
                StatItem(
                    id="study_minutes",
                    label="学习时长",
                    value=weekly_minutes,
                    unit="分钟",
                    description="本周累计学习",
                ),
                StatItem(
                    id="completed_goals",
                    label="完成任务数",
                    value=weekly_completed_goals,
                    unit="个",
                    description="本周完成目标",
                ),
                StatItem(
                    id="streak_days",
                    label="连续学习天数",
                    value=streak_days,
                    unit="天",
                    description="保持当前节奏" if streak_days > 0 else "今天开始学习",
                ),
                StatItem(
                    id="weekly_progress",
                    label="本周目标进度",
                    value=weekly_progress,
                    unit="%",
                    description=f"{completed_goals}/{total_goals} 个目标",
                ),
            ],
            trend=TrendResponse(view=range_value, points=points),
            streak_days=streak_days,
            level=level,
            goal_summary=GoalSummary(
                completed=completed_goals,
                total=total_goals,
                progress=weekly_progress,
            ),
        )

    def calendar(self, user_id: int, month: str) -> CalendarResponse:
        first, last, next_first = month_bounds(month)
        study_map = self._study_day_map(user_id, first, last)
        completed_goal_map = self._completed_goal_day_map(user_id, first, next_first)
        today = self.today()
        days: list[CalendarDay] = []
        for offset in range((last - first).days + 1):
            day = first + timedelta(days=offset)
            minutes, sessions = study_map.get(day, (0, 0))
            days.append(
                CalendarDay(
                    date=day,
                    minutes=minutes,
                    sessions=sessions,
                    completed_goals=completed_goal_map.get(day, 0),
                    is_today=day == today,
                    is_future=day > today,
                )
            )
        return CalendarResponse(month=month, timezone=self.settings.timezone, days=days)

    def achievements(self, user_id: int) -> AchievementListResponse:
        self.refresh_profile_metrics(user_id)
        records = self.sync_achievements(user_id)
        streak_days = self._streak_days(user_id)
        total_minutes = self._total_minutes(user_id)
        progress = self._achievement_progress(user_id, streak_days, total_minutes)
        items = [
            AchievementItem(
                code=definition.code,
                title=definition.title,
                description=definition.description,
                target=definition.target,
                progress=min(progress[definition.code], definition.target),
                unlocked=definition.code in records,
                unlocked_at=records[definition.code].unlocked_at
                if definition.code in records
                else None,
            )
            for definition in ACHIEVEMENTS
        ]
        return AchievementListResponse(items=items)
