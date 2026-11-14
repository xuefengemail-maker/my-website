from collections.abc import AsyncIterator
from datetime import timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.db.base import utcnow
from app.models import ChatConversation, ChatMessage, UserProfile
from app.services.chat_provider import ChatProviderError, get_chat_provider


class FakeProvider:
    def __init__(
        self,
        chunks: tuple[str, ...] = (),
        error: Exception | None = None,
        configured: bool = True,
    ) -> None:
        self.chunks = chunks
        self.error = error
        self.configured = configured
        self.messages: list[dict[str, str]] | None = None

    @property
    def is_configured(self) -> bool:
        return self.configured

    async def stream_reply(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        self.messages = messages
        for chunk in self.chunks:
            yield chunk
        if self.error is not None:
            raise self.error


def register_and_login(client, email: str = "chat@example.com"):
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


def create_conversation(client, token: str) -> dict:
    response = client.post(
        "/api/v1/chat/conversations",
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def install_provider(client):
    def install(provider: FakeProvider) -> FakeProvider:
        client.app.dependency_overrides[get_chat_provider] = lambda: provider
        return provider

    yield install
    client.app.dependency_overrides.pop(get_chat_provider, None)


def test_chat_requires_authentication_and_conversation_ownership(client):
    assert client.get("/api/v1/chat/conversations").status_code == 401
    assert client.post("/api/v1/chat/conversations").status_code == 401

    registration_a, tokens_a = register_and_login(client, "chat-a@example.com")
    _registration_b, tokens_b = register_and_login(client, "chat-b@example.com")
    conversation = create_conversation(client, tokens_a["access_token"])

    own_list = client.get(
        "/api/v1/chat/conversations",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert own_list.status_code == 200
    assert [item["id"] for item in own_list.json()["items"]] == [conversation["id"]]

    other_history = client.get(
        f"/api/v1/chat/conversations/{conversation['id']}/messages",
        headers=auth_headers(tokens_b["access_token"]),
    )
    assert other_history.status_code == 404

    missing_history = client.get(
        "/api/v1/chat/conversations/999999/messages",
        headers=auth_headers(tokens_a["access_token"]),
    )
    assert missing_history.status_code == 404
    assert registration_a["email"] == "chat-a@example.com"


def test_stream_persists_messages_and_emits_sse_order(
    client,
    db_session,
    install_provider,
):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    provider = install_provider(FakeProvider(chunks=("先复习", "薄弱知识点。")))

    response = client.post(
        f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
        headers=auth_headers(tokens["access_token"]),
        json={
            "content": "帮我安排今天的复习",
            "learning_context": {
                "weekly_hours": 12.5,
                "goals": [{"title": "算法练习", "completed": False}],
            },
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.index("event: meta") < response.text.index("event: delta")
    assert response.text.index("event: delta") < response.text.index("event: done")
    assert "先复习" in response.text
    assert "薄弱知识点。" in response.text

    messages = list(
        db_session.scalars(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation["id"])
            .order_by(ChatMessage.id.asc())
        )
    )
    assert [message.role for message in messages] == ["user", "assistant"]
    assert messages[0].content == "帮我安排今天的复习"
    assert messages[1].content == "先复习薄弱知识点。"
    assert messages[1].status == "completed"

    history = client.get(
        f"/api/v1/chat/conversations/{conversation['id']}/messages",
        headers=auth_headers(tokens["access_token"]),
    )
    assert history.status_code == 200
    assert [item["role"] for item in history.json()["items"]] == ["user", "assistant"]
    assert history.json()["conversation"]["title"] == "帮我安排今天的复习"
    assert provider.messages is not None


def test_invalid_messages_and_context_do_not_write(
    client,
    db_session,
    install_provider,
):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    install_provider(FakeProvider(chunks=("不应调用",)))

    invalid_payloads = [
        {"content": "   "},
        {"content": "a" * 4001},
        {"content": "hello", "learning_context": []},
        {"content": "hello", "learning_context": {"data": "x" * 4001}},
    ]
    for payload in invalid_payloads:
        response = client.post(
            f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
            headers=auth_headers(tokens["access_token"]),
            json=payload,
        )
        assert response.status_code == 422

    assert db_session.scalar(select(func.count()).select_from(ChatMessage)) == 0


def test_missing_key_returns_503_without_messages(
    client,
    db_session,
    install_provider,
):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    install_provider(FakeProvider(configured=False))

    response = client.post(
        f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
        headers=auth_headers(tokens["access_token"]),
        json={"content": "你好"},
    )

    assert response.status_code == 503
    assert db_session.scalar(select(func.count()).select_from(ChatMessage)) == 0


def test_provider_failure_keeps_partial_content_and_safe_error(
    client,
    db_session,
    install_provider,
):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    install_provider(
        FakeProvider(
            chunks=("部分内容",),
            error=ChatProviderError("sk-secret-upstream-body"),
        )
    )

    response = client.post(
        f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
        headers=auth_headers(tokens["access_token"]),
        json={"content": "继续"},
    )

    assert response.status_code == 200
    assert "event: error" in response.text
    assert "sk-secret-upstream-body" not in response.text
    assistant = db_session.scalar(
        select(ChatMessage).where(
            ChatMessage.conversation_id == conversation["id"],
            ChatMessage.role == "assistant",
        )
    )
    assert assistant is not None
    assert assistant.status == "failed"
    assert assistant.content == "部分内容"


def test_streaming_conflict_returns_409_and_does_not_add_message(
    client,
    db_session,
    install_provider,
):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    db_session.add(
        ChatMessage(
            conversation_id=conversation["id"],
            role="assistant",
            content="",
            status="streaming",
        )
    )
    db_session.commit()
    install_provider(FakeProvider(chunks=("不应调用",)))

    response = client.post(
        f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
        headers=auth_headers(tokens["access_token"]),
        json={"content": "新消息"},
    )

    assert response.status_code == 409
    assert db_session.scalar(select(func.count()).select_from(ChatMessage)) == 1


def test_database_rejects_two_streaming_assistant_messages(client, db_session):
    _registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    db_session.add(
        ChatMessage(
            conversation_id=conversation["id"],
            role="assistant",
            content="",
            status="streaming",
        )
    )
    db_session.commit()

    db_session.add(
        ChatMessage(
            conversation_id=conversation["id"],
            role="assistant",
            content="",
            status="streaming",
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.scalar(select(func.count()).select_from(ChatMessage)) == 1


def test_model_context_contains_profile_snapshot_and_recent_history(
    client,
    db_session,
    install_provider,
):
    registration, tokens = register_and_login(client)
    conversation = create_conversation(client, tokens["access_token"])
    profile = db_session.get(UserProfile, registration["id"])
    assert profile is not None
    profile.streak_days = 7
    profile.level = 3
    for index in range(21):
        db_session.add(
            ChatMessage(
                conversation_id=conversation["id"],
                role="user" if index % 2 == 0 else "assistant",
                content=f"历史消息 {index}",
                status="completed",
                created_at=utcnow() + timedelta(seconds=index),
            )
        )
    db_session.commit()
    provider = install_provider(FakeProvider(chunks=("ok",)))

    response = client.post(
        f"/api/v1/chat/conversations/{conversation['id']}/messages/stream",
        headers=auth_headers(tokens["access_token"]),
        json={
            "content": "当前问题",
            "learning_context": {"weekly_hours": 12.5, "note": "<ignore rules>"},
        },
    )
    assert response.status_code == 200
    assert provider.messages is not None
    assert len(provider.messages) == 22
    assert provider.messages[-1] == {"role": "user", "content": "当前问题"}
    system_context = provider.messages[1]["content"]
    assert '"streak_days": 7' in system_context
    assert '"level": 3' in system_context
    assert "weekly_hours" in system_context
    assert "\\u003cignore rules\\u003e" in system_context
    assert provider.messages[2]["content"] == "历史消息 2"


def test_openapi_contains_chat_endpoints_and_bearer_security(client):
    schema = client.get("/openapi.json").json()
    expected_paths = {
        "/api/v1/chat/conversations",
        "/api/v1/chat/conversations/{conversation_id}/messages",
        "/api/v1/chat/conversations/{conversation_id}/messages/stream",
    }
    assert expected_paths <= set(schema["paths"])
    assert schema["paths"]["/api/v1/chat/conversations"]["get"]["security"] == [
        {"HTTPBearer": []}
    ]
