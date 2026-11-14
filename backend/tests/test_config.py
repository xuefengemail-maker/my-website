import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.main import create_app


def test_secret_key_is_not_exposed_in_settings_repr():
    secret = "sk-test-example-value-not-a-real-key"
    settings = Settings(jwt_secret="x" * 32, deepseek_api_key=secret, _env_file=None)

    assert secret not in repr(settings)
    assert settings.deepseek_api_key is not None


def test_default_timezone_is_asia_shanghai():
    settings = Settings(jwt_secret="x" * 32, _env_file=None)

    assert settings.timezone == "Asia/Shanghai"
    assert settings.timezone_info.key == "Asia/Shanghai"


def test_invalid_timezone_is_rejected_without_exposing_secret():
    secret = "sk-test-example-value-not-a-real-key"

    with pytest.raises(ValidationError) as exc_info:
        Settings(
            jwt_secret=secret,
            timezone="Not/A-Timezone",
            _env_file=None,
        )

    assert "STUDYPAL_TIMEZONE" in str(exc_info.value)
    assert secret not in str(exc_info.value)


def test_cors_preflight_allows_configured_origin_only(client):
    allowed = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"

    rejected = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://unconfigured.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in rejected.headers


def test_production_cors_allows_pages_origin_only(monkeypatch):
    pages_origin = "https://xuefengemail-maker.github.io"
    monkeypatch.setenv(
        "STUDYPAL_CORS_ORIGINS",
        f"{pages_origin},http://localhost:5173",
    )
    get_settings.cache_clear()
    application = create_app()

    try:
        with TestClient(application) as test_client:
            allowed = test_client.options(
                "/api/v1/auth/login",
                headers={
                    "Origin": pages_origin,
                    "Access-Control-Request-Method": "POST",
                },
            )
            assert allowed.status_code == 200
            assert allowed.headers["access-control-allow-origin"] == pages_origin

            rejected = test_client.options(
                "/api/v1/auth/login",
                headers={
                    "Origin": "https://unconfigured.example",
                    "Access-Control-Request-Method": "POST",
                },
            )
            assert rejected.status_code == 400
            assert "access-control-allow-origin" not in rejected.headers
    finally:
        get_settings.cache_clear()
