import requests
import os
from repositories.meeting_rooms_repo import MeetingRoomRepository
from repositories.meeting_participants_repo import MeetingParticipantsRepository
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

CLOUDFLARE_ACCOUNT_ID=os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN=os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_APP_ID=os.getenv("CLOUDFLARE_APP_ID")

BASE_URL=f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/realtime/kit/{CLOUDFLARE_APP_ID}"
headers = {
    "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
    "Content-Type": "application/json"
}
class CloudFlareService:
    def __init__(self,db: Session):
        self.db=db
        self.meetingRoomRepo = MeetingRoomRepository(db)
        self.meetingParticipantsRepo=MeetingParticipantsRepository(db)

    
    def create_room(self,host_id:int ,name: str):
        url=f"{BASE_URL}/meetings"
        payload= {
            "title": name
        }
        print(url)
        try: 
            resp = requests.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            cf_meeting_id= data['data']['id']
            room=self.meetingRoomRepo.create_room(
                host_id=host_id,
                name= name,
                room_code=cf_meeting_id,
            )
            self.meetingParticipantsRepo.create(room.id,host_id,"host")
            self.db.commit()
            return room
        except Exception as e:
            self.db.rollback()
            print(f"❌ Error creating meeting: {e}")
            return None
    
    def join_room(self, room_code: str, user_id: int, user_name: str = "Guest"):

        room = self.meetingRoomRepo.get_room_by_code(room_code)
        if not room:
            print("❌ Room not found")
            return None
        
        url = f"{BASE_URL}/meetings/{room_code}/participants"
        
        payload = {
            "custom_participant_id": str(user_id),
            "preset_name": "group_call_host"
        }
        
        try:
            resp = requests.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            
            # Parse JSON trả về
            response_json = resp.json()
            
            participant_data = response_json.get('data', {})
            
            cf_token = participant_data.get('token')
            cf_participant_id = participant_data.get('id')

            if not cf_token:
                print("❌ Không tìm thấy Token trong response")
                return None

            self.meetingParticipantsRepo.create(
                meeting_room_id=room.id, # Hoặc room.id nếu repo yêu cầu ID nội bộ
                user_id=user_id, 
                
            )
            self.db.commit()

            # Trả về dữ liệu cho Frontend (React)
            return {
                "token": cf_token,       # React cần cái này để initMeeting
                "sessionId": cf_participant_id,
                "meetingId": room_code
            }

        except Exception as e:
            self.db.rollback()
            print(f"❌ Error joining meeting: {e}")
            # In chi tiết lỗi từ Cloudflare nếu có
            if 'resp' in locals():
                 print(f"Cloudflare details: {resp.text}")
            return None
            
