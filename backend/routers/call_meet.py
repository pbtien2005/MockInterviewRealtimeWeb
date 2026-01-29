from fastapi import APIRouter, Depends, HTTPException,Response,Request
from core.db import get_db
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user
from services.meeting_room_service import MeetingRoomService
from schemas.meeting_rooms_schema import CreateRoomRequest,MeetingRoomOut,JoinRoomRequest,LeaveRoomRequest
from ws.routes import wsManager
from services.cloudflare_service import CloudFlareService

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

@router.post("/cloudflare/create")
async def create_cloudflare_meeting(
    body: CreateRoomRequest, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
 
    cf_service = CloudFlareService(db)
    
    room = cf_service.create_room(current_user.user_id, name=body.name)
    
    if not room:
        raise HTTPException(status_code=500, detail="Failed to create Cloudflare meeting")

    user_name = getattr(current_user, "full_name", current_user.username)
    
    join_data = cf_service.join_room(room.room_code, current_user.user_id, user_name)
    
    if not join_data:
        raise HTTPException(status_code=500, detail="Created room but failed to get host token")

    return {
        "id": room.id,               
        "roomCode": room.room_code,  
        "name": room.name,
        "token": join_data['token'],
        "sessionId": join_data['sessionId']
    }

@router.post("/cloudflare/join")
async def join_cloudflare_meeting(
    body: JoinRoomRequest, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
   
    cf_service = CloudFlareService(db)
    
    user_name = getattr(current_user, "full_name", current_user.username)
    
    # join_room trả về dict { token, sessionId, meetingId ... }
    result = cf_service.join_room(body.roomCode, current_user.user_id, user_name)
    
    if not result:
        raise HTTPException(status_code=404, detail="Room not found or Cloudflare error")
        
    return {
        "token": result['token'],
        "sessionId": result['sessionId'],
        "meetingId": result['meetingId'],
        "roomName": "Meeting Room" # Hoặc query tên phòng từ DB trả về
    }