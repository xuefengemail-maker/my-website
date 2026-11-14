import json
from collections.abc import AsyncIterator
from typing import Protocol

import httpx

from app.core.config import Settings, get_settings


class ChatProviderError(Exception):
    pass


class ChatProvider(Protocol):
    @property
    def is_configured(self) -> bool: ...

    def stream_reply(self, messages: list[dict[str, str]]) -> AsyncIterator[str]: ...


class DeepSeekChatProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def is_configured(self) -> bool:
        if self.settings.deepseek_api_key is None:
            return False
        return bool(self.settings.deepseek_api_key.get_secret_value().strip())

    async def stream_reply(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if not self.is_configured or self.settings.deepseek_api_key is None:
            raise ChatProviderError("DeepSeek is not configured")

        url = f"{self.settings.deepseek_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.deepseek_api_key.get_secret_value()}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        payload = {
            "model": self.settings.deepseek_model,
            "messages": messages,
            "stream": True,
        }
        timeout = httpx.Timeout(connect=10.0, read=120.0, write=20.0, pool=10.0)

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code >= 400:
                        raise ChatProviderError("DeepSeek request failed")

                    async for line in response.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if not data or data == "[DONE]":
                            if data == "[DONE]":
                                break
                            continue

                        try:
                            event = json.loads(data)
                        except json.JSONDecodeError:
                            continue

                        choices = event.get("choices")
                        if not isinstance(choices, list) or not choices:
                            continue
                        delta = choices[0].get("delta")
                        if not isinstance(delta, dict):
                            continue
                        content = delta.get("content")
                        if isinstance(content, str) and content:
                            yield content
        except httpx.HTTPError as exc:
            raise ChatProviderError("DeepSeek request failed") from exc


def get_chat_provider() -> ChatProvider:
    return DeepSeekChatProvider(get_settings())
