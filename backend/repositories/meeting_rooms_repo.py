from sqlalchemy.orm import Session
from models.meeting_rooms import MeetingRoom

class MeetingRoomRepository:
    def __init__(self,db:Session):
        self.db=db

    def create_room(
        self,
        *,
        host_id: int,
        name: str,
        room_code: str,
    ) -> MeetingRoom:
      
        room = MeetingRoom(
            host_id=host_id,
            name=name,
            room_code=room_code,
            status="active",
        )
        self.db.add(room) 
        self.db.flush() 
        self.db.refresh(room)
     
        return room
    
    def get_room_by_code(self,roomCode):
        return self.db.query(MeetingRoom).filter(MeetingRoom.room_code==roomCode).first()