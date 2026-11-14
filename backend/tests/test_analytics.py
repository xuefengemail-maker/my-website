import calendar
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy import func, select

from app.core.config import get_settings
from app.models import LearningGoal, StudySession, UserAchievement
from app.services.analytics_service import (
    local_day_start_utc,
    month_bounds,
    week_start_for,
)


def register_and_login(client, email: str = "analytics@example.com"):
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert registration.status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert login.status_code == 200
    return registration.json(), login.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def local_today() -> date:
    return datetime.now(get_settings().timezone_info).date()


def create_session(
    client,
    token: str,
    subject: str,
    minutes: int,
    studied_on: date,
) -> dict:
    response = client.post(
        "/api/v1/study-sessions",
        headers=auth_headers(token),
        json={
            "subject": subject,
            "duration_minutes": minutes,
            "studied_on": studied_on.isoformat(),
        },
    )
    assert response.status_code == 201
    return response.json()


def create_goal(client, token: str, title: str, target_date: date) -> dict:
    response = client.post(
        "/api/v1/goals",
        headers=auth_headers(token),
        json={
            "title": title,
            "category": "算法",
            "target_date": target_date.isoformat(),
        },
    )
    assert response.status_code == 201
    return response.json()


def test_analytics_endpoints_require_authentication(client):
    requests = [
        (
            "post",
            "/api/v1/study-sessions",
            {
                "subject": "算法",
                "duration_minutes": 30,
                "studied_on": local_today().isoformat(),
            },
        ),
        (
            "get",
            f"/api/v1/study-sessions?from={local_today()}&to={local_today()}",
            None,
        ),
        ("get", "/api/v1/study-sessions/1", None),
        ("get", f"/api/v1/goals?date={local_today()}", None),
        (
            "post",
            "/api/v1/goals",
            {
                "title": "复习",
                "category": "算法",
                "target_date": local_today().isoformat(),
            },
        ),
        ("get", "/api/v1/goals/1", None),
        ("patch", "/api/v1/goals/1", {"status": "completed"}),
        ("get", "/api/v1/analytics/overview", None),
        ("get", f"/api/v1/analytics/calendar?month={local_today():%Y-%m}", None),
        ("get", "/api/v1/analytics/achievements", None),
    ]

    for method, path, payload in requests:
        response = client.request(method, path, json=payload)
        assert response.status_code == 401, (method, path, response.text)


def test_study_sessions_are_isolated_and_filtered_by_date(client, db_session):
    _registration_a, tokens_a = register_and_login(client, "study-a@example.com")
    _registration_b, tokens_b = register_and_login(client, "study-b@example.com")
    today = local_today()
    first_day = today - timedelta(days=2)

    created_a = create_session(client, tokens_a["access_token"], "算法", 45, first_day)
    create_session(client, tokens_a["access_token"], "英语", 30, today)
    create_session(client, tokens_b["access_token"], "数据库", 90, today)

    assert created_a["session"]["subject"] == "算法"
    assert created_a["daily"] == {
        "date": first_day.isoformat(),
        "minutes": 45,
        "sessions": 1,
        "completed_goals": 0,
        "is_today": False,
        "is_future": False,
    }

    own_detail = client.get(
        f"/api/v1/study-sessions/{created_a['session']['id']}",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert own_detail.status_code == 200
    assert own_detail.json() == created_a["session"]

    other_detail = client.get(
        f"/api/v1/study-sessions/{created_a['session']['id']}",
        headers=auth_headers(tokens_b["access_token"]),
    )
    assert other_detail.status_code == 404
    assert other_detail.json()["detail"] == "Study session not found"

    missing_detail = client.get(
        "/api/v1/study-sessions/999999",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert missing_detail.status_code == 404

    range_url = (
        "/api/v1/study-sessions"
        f"?from={first_day.isoformat()}&to={today.isoformat()}"
    )
    own = client.get(range_url, headers=auth_headers(tokens_a["access_token"]))
    assert own.status_code == 200
    assert [(item["subject"], item["duration_minutes"]) for item in own.json()["items"]] == [
        ("英语", 30),
        ("算法", 45),
    ]

    other = client.get(range_url, headers=auth_headers(tokens_b["access_token"]))
    assert other.status_code == 200
    assert [item["subject"] for item in other.json()["items"]] == ["数据库"]

    empty_day = first_day + timedelta(days=1)
    empty = client.get(
        f"/api/v1/study-sessions?from={empty_day}&to={empty_day}",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert empty.status_code == 200
    assert empty.json() == {"items": []}

    assert db_session.scalar(select(func.count()).select_from(StudySession)) == 3


def test_invalid_study_sessions_and_ranges_do_not_write(client, db_session):
    _registration, tokens = register_and_login(client)
    headers = auth_headers(tokens["access_token"])
    today = local_today()

    invalid_payloads = [
        {"subject": "   ", "duration_minutes": 30, "studied_on": today.isoformat()},
        {"subject": "a" * 121, "duration_minutes": 30, "studied_on": today.isoformat()},
        {"subject": "算法", "duration_minutes": 0, "studied_on": today.isoformat()},
        {"subject": "算法", "duration_minutes": 1441, "studied_on": today.isoformat()},
        {"subject": "算法", "duration_minutes": 30, "studied_on": "2026-02-30"},
        {
            "subject": "算法",
            "duration_minutes": 30,
            "studied_on": today.isoformat(),
            "user_id": 999,
        },
    ]
    for payload in invalid_payloads:
        response = client.post("/api/v1/study-sessions", headers=headers, json=payload)
        assert response.status_code == 422, payload

    missing_range = client.get("/api/v1/study-sessions", headers=headers)
    assert missing_range.status_code == 422

    reversed_range = client.get(
        f"/api/v1/study-sessions?from={today}&to={today - timedelta(days=1)}",
        headers=headers,
    )
    assert reversed_range.status_code == 422
    assert reversed_range.json()["detail"] == "from must be on or before to"

    assert db_session.scalar(select(func.count()).select_from(StudySession)) == 0


def test_goal_lifecycle_and_user_isolation(client, db_session):
    _registration_a, tokens_a = register_and_login(client, "goal-a@example.com")
    _registration_b, tokens_b = register_and_login(client, "goal-b@example.com")
    today = local_today()

    goal = create_goal(client, tokens_a["access_token"], "完成算法题", today)
    assert goal["status"] == "pending"
    assert goal["completed_at"] is None

    own_detail = client.get(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert own_detail.status_code == 200
    assert own_detail.json() == goal

    other_detail = client.get(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_b["access_token"]),
    )
    assert other_detail.status_code == 404
    assert other_detail.json()["detail"] == "Goal not found"

    missing_detail = client.get(
        "/api/v1/goals/999999",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert missing_detail.status_code == 404

    own_list = client.get(
        f"/api/v1/goals?date={today}",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert own_list.status_code == 200
    assert [item["id"] for item in own_list.json()["items"]] == [goal["id"]]

    other_list = client.get(
        f"/api/v1/goals?date={today}",
        headers=auth_headers(tokens_b["access_token"]),
    )
    assert other_list.status_code == 200
    assert other_list.json() == {"items": []}

    other_patch = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_b["access_token"]),
        json={"status": "completed"},
    )
    assert other_patch.status_code == 404
    assert other_patch.json()["detail"] == "Goal not found"

    still_pending = client.get(
        f"/api/v1/goals?date={today}",
        headers=auth_headers(tokens_a["access_token"]),
    ).json()["items"][0]
    assert still_pending["status"] == "pending"
    assert still_pending["completed_at"] is None

    completed = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_a["access_token"]),
        json={"status": "completed"},
    )
    assert completed.status_code == 200
    completed_at = completed.json()["completed_at"]
    assert completed.json()["status"] == "completed"
    assert completed_at is not None

    completed_again = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_a["access_token"]),
        json={"status": "completed"},
    )
    assert completed_again.status_code == 200
    assert completed_again.json()["completed_at"] == completed_at

    pending_again = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_a["access_token"]),
        json={"status": "pending"},
    )
    assert pending_again.status_code == 200
    assert pending_again.json()["status"] == "pending"
    assert pending_again.json()["completed_at"] is None

    missing = client.patch(
        "/api/v1/goals/999999",
        headers=auth_headers(tokens_a["access_token"]),
        json={"status": "completed"},
    )
    assert missing.status_code == 404

    invalid_goals = [
        {"title": "   ", "category": "算法", "target_date": today.isoformat()},
        {"title": "a" * 121, "category": "算法", "target_date": today.isoformat()},
        {"title": "复习", "category": "c" * 61, "target_date": today.isoformat()},
        {"title": "复习", "category": "算法", "target_date": "2026-13-01"},
        {
            "title": "复习",
            "category": "算法",
            "target_date": today.isoformat(),
            "status": "completed",
        },
    ]
    for payload in invalid_goals:
        response = client.post(
            "/api/v1/goals",
            headers=auth_headers(tokens_a["access_token"]),
            json=payload,
        )
        assert response.status_code == 422, payload

    invalid_status = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=auth_headers(tokens_a["access_token"]),
        json={"status": "done"},
    )
    assert invalid_status.status_code == 422

    unchanged = client.get(
        f"/api/v1/goals?date={today}",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert unchanged.json()["items"][0]["status"] == "pending"
    assert db_session.scalar(select(func.count()).select_from(LearningGoal)) == 1


def test_overview_empty_week_month_and_invalid_range(client):
    _registration, tokens = register_and_login(client)
    headers = auth_headers(tokens["access_token"])

    empty_week = client.get("/api/v1/analytics/overview?range=week", headers=headers)
    assert empty_week.status_code == 200
    body = empty_week.json()
    assert [item["id"] for item in body["stats"]] == [
        "study_minutes",
        "completed_goals",
        "streak_days",
        "weekly_progress",
    ]
    assert all(item["value"] == 0 for item in body["stats"])
    assert body["trend"]["view"] == "week"
    assert len(body["trend"]["points"]) == 7
    assert all(point["value"] == 0 for point in body["trend"]["points"])
    assert body["streak_days"] == 0
    assert body["level"] == 1
    assert body["goal_summary"] == {"completed": 0, "total": 0, "progress": 0}

    empty_month = client.get("/api/v1/analytics/overview?range=month", headers=headers)
    assert empty_month.status_code == 200
    assert empty_month.json()["trend"]["view"] == "month"
    assert len(empty_month.json()["trend"]["points"]) == 4

    invalid = client.get("/api/v1/analytics/overview?range=year", headers=headers)
    assert invalid.status_code == 422

    today = local_today()
    create_session(client, tokens["access_token"], "算法", 100, today)
    create_session(client, tokens["access_token"], "英语", 50, today)
    goal = create_goal(client, tokens["access_token"], "今日复习", today)
    completed = client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=headers,
        json={"status": "completed"},
    )
    assert completed.status_code == 200

    populated = client.get("/api/v1/analytics/overview?range=week", headers=headers)
    assert populated.status_code == 200
    values = {item["id"]: item["value"] for item in populated.json()["stats"]}
    assert values["study_minutes"] == 150
    assert values["completed_goals"] == 1
    assert values["streak_days"] == 1
    assert values["weekly_progress"] == 100
    assert sum(point["value"] for point in populated.json()["trend"]["points"]) == 150

    month_view = client.get("/api/v1/analytics/overview?range=month", headers=headers)
    assert month_view.status_code == 200
    assert len(month_view.json()["trend"]["points"]) == 4
    assert sum(point["value"] for point in month_view.json()["trend"]["points"]) == 150


def test_calendar_grid_isolation_and_invalid_months(client):
    _registration_a, tokens_a = register_and_login(client, "calendar-a@example.com")
    _registration_b, tokens_b = register_and_login(client, "calendar-b@example.com")
    today = local_today()
    month = today.strftime("%Y-%m")
    headers_a = auth_headers(tokens_a["access_token"])

    empty = client.get(f"/api/v1/analytics/calendar?month={month}", headers=headers_a)
    assert empty.status_code == 200
    body = empty.json()
    assert body["month"] == month
    expected_days = calendar.monthrange(today.year, today.month)[1]
    assert len(body["days"]) == expected_days
    for item in body["days"]:
        item_date = date.fromisoformat(item["date"])
        assert item["minutes"] == 0
        assert item["sessions"] == 0
        assert item["completed_goals"] == 0
        assert item["is_today"] is (item_date == today)
        assert item["is_future"] is (item_date > today)

    create_session(client, tokens_a["access_token"], "算法", 45, today)
    create_session(client, tokens_b["access_token"], "数据库", 90, today)
    goal = create_goal(client, tokens_a["access_token"], "今日目标", today)
    client.patch(
        f"/api/v1/goals/{goal['id']}",
        headers=headers_a,
        json={"status": "completed"},
    )

    populated = client.get(
        f"/api/v1/analytics/calendar?month={month}",
        headers=headers_a,
    )
    assert populated.status_code == 200
    today_item = next(
        item for item in populated.json()["days"] if item["date"] == today.isoformat()
    )
    assert today_item == {
        "date": today.isoformat(),
        "minutes": 45,
        "sessions": 1,
        "completed_goals": 1,
        "is_today": True,
        "is_future": False,
    }

    for invalid_month in ("2026-13", "2026-00", "2026-1", "not-a-month"):
        response = client.get(
            f"/api/v1/analytics/calendar?month={invalid_month}",
            headers=headers_a,
        )
        assert response.status_code == 422, invalid_month


def test_streak_level_and_profile_sync(client):
    today = local_today()
    users = {}
    for email in (
        "streak-a@example.com",
        "streak-b@example.com",
        "streak-c@example.com",
        "level@example.com",
    ):
        _registration, tokens = register_and_login(client, email)
        users[email] = tokens["access_token"]

    create_session(client, users["streak-a@example.com"], "算法", 100, today)
    create_session(
        client,
        users["streak-a@example.com"],
        "算法",
        100,
        today - timedelta(days=1),
    )
    create_session(
        client,
        users["streak-a@example.com"],
        "算法",
        100,
        today - timedelta(days=2),
    )
    create_session(
        client,
        users["streak-b@example.com"],
        "数据库",
        30,
        today - timedelta(days=2),
    )
    create_session(
        client,
        users["streak-c@example.com"],
        "英语",
        30,
        today - timedelta(days=1),
    )
    create_session(client, users["level@example.com"], "算法", 600, today)

    expected = {
        "streak-a@example.com": (3, 1),
        "streak-b@example.com": (0, 1),
        "streak-c@example.com": (1, 1),
        "level@example.com": (1, 2),
    }
    for email, (streak_days, level) in expected.items():
        profile = client.get(
            "/api/v1/users/me/profile",
            headers=auth_headers(users[email]),
        )
        assert profile.status_code == 200
        assert profile.json()["streak_days"] == streak_days
        assert profile.json()["level"] == level

    overview = client.get(
        "/api/v1/analytics/overview?range=week",
        headers=auth_headers(users["streak-a@example.com"]),
    )
    assert overview.status_code == 200
    assert overview.json()["streak_days"] == 3


def test_achievements_unlock_once_and_report_progress(client, db_session):
    _registration, tokens = register_and_login(client, "achievements@example.com")
    headers = auth_headers(tokens["access_token"])
    today = local_today()

    for offset in range(7):
        create_session(
            client,
            tokens["access_token"],
            "算法",
            100,
            today - timedelta(days=offset),
        )

    for index in range(20):
        goal = create_goal(client, tokens["access_token"], f"目标 {index + 1}", today)
        response = client.patch(
            f"/api/v1/goals/{goal['id']}",
            headers=headers,
            json={"status": "completed"},
        )
        assert response.status_code == 200

    first_read = client.get("/api/v1/analytics/achievements", headers=headers)
    assert first_read.status_code == 200
    items = first_read.json()["items"]
    assert [item["code"] for item in items] == [
        "first_session",
        "streak_7",
        "hours_10",
        "goals_20",
    ]
    assert all(item["unlocked"] for item in items)
    assert all(item["unlocked_at"] is not None for item in items)
    progress = {item["code"]: item["progress"] for item in items}
    assert progress == {
        "first_session": 1,
        "streak_7": 7,
        "hours_10": 600,
        "goals_20": 20,
    }
    assert [item["target"] for item in items] == [1, 7, 600, 20]

    unlocked_at = {item["code"]: item["unlocked_at"] for item in items}
    second_read = client.get("/api/v1/analytics/achievements", headers=headers)
    assert [item["unlocked_at"] for item in second_read.json()["items"]] == [
        unlocked_at[item["code"]] for item in second_read.json()["items"]
    ]

    overview = client.get("/api/v1/analytics/overview?range=week", headers=headers)
    assert overview.status_code == 200

    assert db_session.scalar(select(func.count()).select_from(UserAchievement)) == 4
    profile = client.get("/api/v1/users/me/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["streak_days"] == 7
    assert profile.json()["level"] == 2


def test_week_month_and_timezone_boundaries():
    assert week_start_for(date(2026, 11, 14)) == date(2026, 11, 9)
    assert week_start_for(date(2026, 11, 9)) == date(2026, 11, 9)

    assert month_bounds("2026-02") == (
        date(2026, 2, 1),
        date(2026, 2, 28),
        date(2026, 3, 1),
    )
    assert month_bounds("2026-12") == (
        date(2026, 12, 1),
        date(2026, 12, 31),
        date(2027, 1, 1),
    )
    with pytest.raises(ValueError):
        month_bounds("2026-13")

    assert local_day_start_utc(
        date(2026, 11, 14),
        ZoneInfo("Asia/Shanghai"),
    ) == datetime(2026, 11, 13, 16, tzinfo=timezone.utc)


def test_openapi_contains_analytics_endpoints_and_bearer_security(client):
    schema = client.get("/openapi.json").json()
    expected = {
        "/api/v1/study-sessions": {"get", "post"},
        "/api/v1/study-sessions/{session_id}": {"get"},
        "/api/v1/goals": {"get", "post"},
        "/api/v1/goals/{goal_id}": {"get", "patch"},
        "/api/v1/analytics/overview": {"get"},
        "/api/v1/analytics/calendar": {"get"},
        "/api/v1/analytics/achievements": {"get"},
    }
    for path, methods in expected.items():
        assert path in schema["paths"]
        assert methods <= set(schema["paths"][path])
        for method in methods:
            assert schema["paths"][path][method]["security"] == [{"HTTPBearer": []}]

    assert schema["components"]["securitySchemes"]["HTTPBearer"]["scheme"] == "bearer"
