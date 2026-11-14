"""create chat conversation and message tables

Revision ID: 20261114_0002
Revises: 20261114_0001
Create Date: 2026-11-14 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261114_0002"
down_revision: Union[str, Sequence[str], None] = "20261114_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_conversations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), server_default=sa.text("'新对话'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_chat_conversations_user_id_updated_at",
        "chat_conversations",
        ["user_id", "updated_at"],
        unique=False,
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("conversation_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role IN ('user', 'assistant')", name="ck_chat_messages_role"),
        sa.CheckConstraint(
            "status IN ('streaming', 'completed', 'failed')",
            name="ck_chat_messages_status",
        ),
        sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_chat_messages_conversation_id_created_at",
        "chat_messages",
        ["conversation_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "uq_chat_messages_streaming_conversation",
        "chat_messages",
        ["conversation_id"],
        unique=True,
        sqlite_where=sa.text("role = 'assistant' AND status = 'streaming'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_chat_messages_streaming_conversation",
        table_name="chat_messages",
    )
    op.drop_index("ix_chat_messages_conversation_id_created_at", table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index(
        "ix_chat_conversations_user_id_updated_at",
        table_name="chat_conversations",
    )
    op.drop_table("chat_conversations")
