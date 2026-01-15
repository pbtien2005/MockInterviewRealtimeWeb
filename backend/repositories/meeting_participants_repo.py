from datetime import datetime
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.meeting_participants import MeetingParticipant
class MeetingParticipantsRepository:
    def __init__(self,db: Session):
        self.db=db
    
    def create(
        self,
        meeting_room_id: int,
        user_id: int,
        role_user: str = "participant",
    ) -> MeetingParticipant:
        
        participant = (
            self.db.query(MeetingParticipant)
            .filter_by(meeting_room_id=meeting_room_id, user_id=user_id)
            .first()
        )

        if participant:
            participant.left_at = None
            participant.status = "joined"
            participant.joined_at = func.now()
            participant.role_user = role_user

            return participant

        participant = MeetingParticipant(
            meeting_room_id=meeting_room_id,
            user_id=user_id,
            role_user=role_user,
        )

        self.db.add(participant)
        return participant
    
    def mark_left(
        self,
        meeting_room_id: int,
        user_id: int,
        status: str = "left",
    ) -> Optional[MeetingParticipant]:
        participant = self.get(
            meeting_room_id=meeting_room_id,
            user_id=user_id,
        )
        if not participant:
            return None

        participant.left_at =  datetime.now().astimezone()
        participant.status = status
        return participant
    
    def get(self, meeting_room_id: int, user_id: int) -> Optional[MeetingParticipant]:
        return (
            self.db.query(MeetingParticipant)
            .filter(
                MeetingParticipant.meeting_room_id == meeting_room_id,
                MeetingParticipant.user_id == user_id,
            )
            .first()
        )
