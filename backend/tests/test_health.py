from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.db.session import get_db
from app.main import create_app


def test_health_reports_database_ok_without_authentication(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_returns_503_without_exposing_database_details():
    application = create_app()

    class BrokenSession:
        def execute(self, *_args, **_kwargs):
            raise OperationalError(
                "SELECT 1",
                {},
                Exception("sqlite password=super-secret-database-password"),
            )

    def override_get_db():
        yield BrokenSession()

    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as test_client:
        response = test_client.get("/health")

    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "unavailable"}
    assert "super-secret-database-password" not in response.text
    assert "sqlite" not in response.text
