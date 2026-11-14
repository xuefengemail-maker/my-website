import os

os.environ["STUDYPAL_JWT_SECRET"] = "test-secret-0123456789abcdef0123456789abcdef"
os.environ["STUDYPAL_DATABASE_URL"] = "sqlite://"
os.environ["STUDYPAL_CORS_ORIGINS"] = "http://localhost:5173"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import configure_sqlite_engine, get_db
from app.main import create_app


@pytest.fixture()
def db_engine(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    configure_sqlite_engine(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    session_factory = sessionmaker(
        bind=db_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    session: Session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    application = create_app()

    def override_get_db():
        yield db_session

    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as test_client:
        yield test_client
