from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import (
    String, Integer, DateTime, Enum,
    ForeignKey, CheckConstraint, UniqueConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base


class MeetingRoom(Base):
    __tablename__ = "meeting_rooms"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    room_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now()
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[str] = mapped_column(
        Enum("active", "ended", name="meeting_room_status"),
        nullable=False, server_default="active"
    )

    host: Mapped["User"] = relationship(back_populates="hosted_meeting_rooms")

    participants: Mapped[List["MeetingParticipant"]] = relationship(
        back_populates="meeting_room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )