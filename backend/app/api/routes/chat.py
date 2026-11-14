import asyncio
import json
from collections.abc import AsyncIterator
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import ChatMessage, User
from app.schemas.chat import (
    ChatStreamRequest,
    ConversationHistoryResponse,
    ConversationListResponse,
    ConversationResponse,
    MessageResponse,
)
from app.services.chat_provider import ChatProvider, ChatProviderError, get_chat_provider
from app.services.chat_service import (
    ChatService,
    ConversationNotFoundError,
    StreamingReplyInProgressError,
)


router = APIRouter(prefix="/chat", tags=["chat"])


def _sse(event: str, data: dict[str, object]) -> str:
    serialized = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {serialized}\n\n"


def _iso(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    conversation = ChatService(db).create_conversation(current_user.id)
    return ConversationResponse.model_validate(conversation)


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationListResponse:
    conversations = ChatService(db).list_conversations(current_user.id)
    return ConversationListResponse(
        items=[ConversationResponse.model_validate(item) for item in conversations]
    )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationHistoryResponse,
)
def list_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationHistoryResponse:
    service = ChatService(db)
    try:
        conversation = service.get_conversation(current_user.id, conversation_id)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from exc

    messages = service.list_messages(conversation.id)
    return ConversationHistoryResponse(
        conversation=ConversationResponse.model_validate(conversation),
        items=[MessageResponse.model_validate(message) for message in messages],
    )


@router.post("/conversations/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: int,
    payload: ChatStreamRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    provider: ChatProvider = Depends(get_chat_provider),
) -> StreamingResponse:
    service = ChatService(db)
    try:
        service.get_conversation(current_user.id, conversation_id)
        service.ensure_can_start(conversation_id)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from exc
    except StreamingReplyInProgressError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reply is already in progress",
        ) from exc

    if not provider.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured",
        )

    model_messages = service.build_model_messages(
        current_user.id,
        conversation_id,
        payload.content,
        payload.learning_context,
    )
    _conversation, user_message, assistant_message = service.start_exchange(
        current_user.id,
        conversation_id,
        payload.content,
    )

    async def event_stream() -> AsyncIterator[str]:
        content_parts: list[str] = []
        yield _sse(
            "meta",
            {
                "conversation_id": conversation_id,
                "user_message_id": user_message.id,
                "assistant_message_id": assistant_message.id,
            },
        )

        try:
            async for chunk in provider.stream_reply(model_messages):
                if await request.is_disconnected():
                    service.fail_assistant(assistant_message, "".join(content_parts))
                    return
                content_parts.append(chunk)
                yield _sse("delta", {"content": chunk})
        except asyncio.CancelledError:
            service.fail_assistant(assistant_message, "".join(content_parts))
            raise
        except ChatProviderError:
            service.fail_assistant(assistant_message, "".join(content_parts))
            yield _sse(
                "error",
                {
                    "code": "provider_error",
                    "message": "AI 服务暂时不可用，请稍后重试。",
                },
            )
            return
        except Exception:
            service.fail_assistant(assistant_message, "".join(content_parts))
            yield _sse(
                "error",
                {
                    "code": "provider_error",
                    "message": "AI 服务暂时不可用，请稍后重试。",
                },
            )
            return

        completed = service.complete_assistant(assistant_message, "".join(content_parts))
        yield _sse(
            "done",
            {
                "message_id": completed.id,
                "status": completed.status,
                "created_at": _iso(completed.created_at),
            },
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
