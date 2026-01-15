from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import (
    String, Integer, DateTime, Enum,
    ForeignKey, CheckConstraint, UniqueConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.db import Base

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    __table_args__ = (
        # 1 user chỉ có 1 record trong 1 phòng
        UniqueConstraint(
            "meeting_room_id", "user_id",
            name="uq_meeting_participants_room_user"
        ),
        # Nếu có left_at thì phải >= joined_at
        CheckConstraint(
            "left_at IS NULL OR joined_at <= left_at",
            name="ck_meeting_participants_time_order"
        ),
    )

    meeting_room_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_rooms.id", ondelete="CASCADE"),
        primary_key=True,
        doc="FK tới meeting_rooms.id, xoá phòng thì xoá luôn participants."
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True,
        doc="FK tới users.user_id, xoá user thì xoá luôn record tham gia."
    )

    role_user: Mapped[str] = mapped_column(
        Enum("host", "co_host", "participant", name="meeting_participant_role"),
        nullable=False,
        server_default="participant",
        doc="Vai trò: host | co_host | participant."
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Thời điểm join phòng, default NOW()."
    )

    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Thời điểm rời phòng, null nếu chưa rời."
    )

    status: Mapped[str] = mapped_column(
        Enum("joined", "left", "kicked", name="meeting_participant_status"),
        nullable=False,
        server_default="joined",
        doc="Trạng thái tham gia: joined | left | kicked."
    )

    # --- relationships ---
    meeting_room: Mapped["MeetingRoom"] = relationship(
        back_populates="participants"
    )

    user: Mapped["User"] = relationship(
        back_populates="meeting_participations"
    )