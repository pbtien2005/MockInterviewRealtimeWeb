from fastapi import APIRouter, Depends,Response,Request
from core.db import get_db
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user
from services.meeting_room_service import MeetingRoomService
from schemas.meeting_rooms_schema import CreateRoomRequest,MeetingRoomOut,JoinRoomRequest,LeaveRoomRequest
from ws.routes import wsManager

router=APIRouter(prefix="/meeting",tags=["meeting"])

@router.post("/create",response_model=MeetingRoomOut)
async def create_meeting(body: CreateRoomRequest ,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    service = MeetingRoomService(db)
    room=service.create_room(current_user.user_id,name=body.name)
    await wsManager.user_created_room(str(room.id),current_user.user_id)
    return room 

@router.post("/join",response_model=MeetingRoomOut)
async def join_meeting(body: JoinRoomRequest, db: Session=Depends(get_db),current_user=Depends(get_current_user)):
    service=MeetingRoomService(db)
    room=service.join_room(body.roomCode,current_user.user_id)
    await wsManager.join_room(str(room.id),str(current_user.user_id))
    return room


@router.post("/leave")
async def leave_meeting(body: LeaveRoomRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = MeetingRoomService(db)
    participant = service.leave_room(body.roomCode, current_user.user_id)

    await wsManager.leave_room(str(body.room_id), str(current_user.user_id))

    return {
        "message": "User left room",
        "participant": participant
    }