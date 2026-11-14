from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    avatar_url: str | None
    streak_days: int = Field(ge=0)
    level: int = Field(ge=1)


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    avatar_url: str

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("avatar_url must not be empty")
        if len(value) > 2048:
            raise ValueError("avatar_url must be at most 2048 characters")
        if any(character.isspace() for character in value):
            raise ValueError("avatar_url must not contain whitespace")

        parsed = urlsplit(value)
        if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
            raise ValueError("avatar_url must be an http or https URL with a host")
        return value
