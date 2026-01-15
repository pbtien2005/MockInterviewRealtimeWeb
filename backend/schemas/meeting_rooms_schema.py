from pydantic import BaseModel
from datetime import datetime

class CreateRoomRequest(BaseModel):
    name: str

class MeetingRoomOut(BaseModel):
    id: int
    name: str
    room_code: str
    host_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class JoinRoomRequest(BaseModel):
    roomCode: str

class LeaveRoomRequest(BaseModel):
    room_id: int
    roomCode: str