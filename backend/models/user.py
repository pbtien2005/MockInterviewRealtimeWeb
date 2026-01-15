from __future__ import annotations
from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text,
    UniqueConstraint, Index, func
)
from sqlalchemy.orm import Mapped,mapped_column,relationship
from typing import List, Optional

from core.db import Base
from enum import Enum
from datetime import datetime,date



class UserRole(str,Enum):
    COACHER="coacher" 
    STUDENT="student"
    ADMIN="admin"

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    username: Mapped[str]=mapped_column(String(255),nullable=True,default="none")
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    role: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.STUDENT.value)

    full_name: Mapped[str | None] = mapped_column(String(255))
    dob: Mapped[date | None] = mapped_column(Date)
    avatar_url: Mapped[str ] = mapped_column(String(2000),default="https://kenh14cdn.com/203336854389633024/2025/9/29/55608936113720574976099734364295725483729360n-1759142829408-17591428300561251128220.jpg")
    phone: Mapped[str | None] = mapped_column(String(32))
    job: Mapped[str | None] = mapped_column(String(255))
    
    # --- THÊM MỚI ---
    university: Mapped[str | None] = mapped_column(String(255))
    # ------------------
    
    introduction_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # các field tuỳ sơ đồ của bạn (site, city, etc.)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (
        CheckConstraint("role IN ('coacher','student','admin')", name="ck_users_role"),
    )


    certificates: Mapped[List["UserCertificate"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # role-extensions (1–1)
    coach: Mapped[Optional["Coach"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    student: Mapped[Optional["Student"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    admin: Mapped[Optional["Admin"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    # messaging relations
    sent_messages: Mapped[List["Message"]] = relationship(
        back_populates="sender", foreign_keys="Message.sender_id"
    )
    conversations_a: Mapped[List["Conversation"]] = relationship(
        back_populates="user_a", foreign_keys="Conversation.user_a_id"
    )
    conversations_b: Mapped[List["Conversation"]] = relationship(
        back_populates="user_b", foreign_keys="Conversation.user_b_id"
    )

    states: Mapped[List["ConversationState"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    message_requests_sent: Mapped[list["MessageRequest"]] = relationship(
        back_populates="requester",
        foreign_keys="MessageRequest.requester_id"
    )

    # Người nhận yêu cầu
    message_requests_received: Mapped[list["MessageRequest"]] = relationship(
        back_populates="target",
        foreign_keys="MessageRequest.target_id"
    )
    hosted_meeting_rooms: Mapped[List["MeetingRoom"]] = relationship(
        back_populates="host"
    )

    meeting_participations: Mapped[List["MeetingParticipant"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User id={self.user_id} email={self.email} role={self.role}>"

    

class Coach(Base):
    __tablename__ = "coaches"

    account_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    student_number: Mapped[int | None] = mapped_column(Integer)
    user: Mapped[User] = relationship(back_populates="coach")
    availabilities = relationship("CoacherAvailability", back_populates="coacher")


class Student(Base):
    __tablename__ = "students"

    account_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    goal: Mapped[str | None] = mapped_column(String(255))
    slot_quota: Mapped[int] = mapped_column(Integer, default=0)    # tổng slot được đăng ký
    slot_used: Mapped[int] = mapped_column(Integer, default=0)    # đã dùng

    __table_args__ = (
        CheckConstraint("slot_quota >= 0 AND slot_used >= 0", name="ck_student_slots_nonneg"),
        CheckConstraint("slot_used <= slot_quota", name="ck_student_slots_not_exceed"),
    )

    user: Mapped[User] = relationship(back_populates="student")


class Admin(Base):
    __tablename__ = "admins"

    account_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )

    user: Mapped[User] = relationship(back_populates="admin")