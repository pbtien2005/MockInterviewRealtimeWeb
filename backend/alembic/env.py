# alembic/env.py
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import create_engine
from sqlalchemy import pool
from core.config import settings # <-- Đảm bảo dòng này đúng
from core.db import Base         # <-- Import Base
from alembic import context

# ✅ BƯỚC 1: IMPORT TẤT CẢ CÁC MODEL CỦA BẠN
# Alembic cần "thấy" được tất cả các class này
from models.user import User, Coach, Student, Admin
from models.user_certificates import UserCertificate
from models.conversation_state import ConversationState
from models.conversations import Conversation
from models.message_requests import MessageRequest
from models.messages import Message
from models.coacher_availability import CoacherAvailability
from models.open_slots import OpenSlot
from models.booking_requests import BookingRequest
from models.booking_request_items import BookingRequestItem
from models.session import Session
from models.meeting_participants import MeetingParticipant
from models.meeting_rooms import MeetingRoom

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

# ✅ BƯỚC 2: KÍCH HOẠT DÒNG NÀY
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    ... (phần này giữ nguyên) ...
    """
    url = settings.DB_URL
    context.configure(
        url=url,
        target_metadata=target_metadata, # <-- Dòng này giờ sẽ hoạt động
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    ... (phần này giữ nguyên) ...
    """
    connectable = create_engine(settings.DB_URL)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata # <-- Dòng này giờ sẽ hoạt động
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()