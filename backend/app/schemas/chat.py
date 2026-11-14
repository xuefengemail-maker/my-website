import json
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Literal["user", "assistant"]
    content: str
    status: Literal["streaming", "completed", "failed"]
    created_at: datetime


class ConversationHistoryResponse(BaseModel):
    conversation: ConversationResponse
    items: list[MessageResponse]


class ChatStreamRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=4000)
    learning_context: dict[str, Any] | None = None

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("content must not be blank")
        return value

    @field_validator("learning_context")
    @classmethod
    def validate_learning_context(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        if value is None:
            return None
        serialized = json.dumps(value, ensure_ascii=False)
        if len(serialized) > 4000:
            raise ValueError("learning_context must be at most 4000 characters")
        return value
