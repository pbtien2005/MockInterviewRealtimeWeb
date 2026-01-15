# services/meeting_room_service.py
from typing import Optional
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.meeting_rooms import MeetingRoom
from repositories.meeting_rooms_repo import MeetingRoomRepository
from repositories.meeting_participants_repo import MeetingParticipantsRepository


class MeetingRoomService:
    def __init__(self, db:Session):
        self.meetingRoomRepo = MeetingRoomRepository(db)
        self.meetingParticipantsRepo=MeetingParticipantsRepository(db)
        self.db=db

    def create_room(self, host_id: int, name: str):
        room_code=uuid4().hex[:8]
        room =self.meetingRoomRepo.create_room(
            host_id=host_id,
            name=name,
            room_code=room_code,
        )
        self.meetingParticipantsRepo.create(room.id,host_id,"host")
        self.db.commit()
        return room
    
    def join_room(self,room_code: str,user_id: int):
        room = self.meetingRoomRepo.get_room_by_code(room_code)
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.status != "active":
            raise HTTPException(status_code=400, detail="Room is not active")
        self.meetingParticipantsRepo.create(room.id,user_id)
        self.db.commit()
        return room
        
    def leave_room(self, room_code: str, user_id: int):
        room = self.meetingRoomRepo.get_room_by_code(room_code)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        participant = self.meetingParticipantsRepo.mark_left(
            meeting_room_id=room.id,
            user_id=user_id,
            status="left",
        )

        if not participant:
            raise HTTPException(
                status_code=404,
                detail="User is not a participant in this room",
            )

        self.db.commit()

        return participant

