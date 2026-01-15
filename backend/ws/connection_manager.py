import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str,WebSocket]={}
        self.rooms: dict[str, set[str]] = {}
    
    async def connect(self,websocket: WebSocket,id_client: str):
        self.active_connections[id_client]=websocket
        print(self.active_connections)

        payload1 = {
            "type": "user.online",
            "sender_id": id_client,
        }
        await self.broadcast(payload1)
   
    def list_online_user(self,id_client):
        others_online = [uid for uid in self.active_connections.keys() if uid != id_client]
        print(others_online)
        return others_online

    
    async def user_created_room(self, room_id: int, host_id: str):
        """
        Gọi khi user tạo room (HTTP /meeting/create)
        - Lưu host vào room
        - Gửi lại cho host danh sách participants hiện tại (chỉ có nó)
        """
        # tạo set room nếu chưa có
        users = self.rooms.setdefault(str(room_id), set())
        users.add(str(host_id))

        # nhớ user đang ở room nào (nếu cần dùng sau này)
    


    async def disconnect(self,id_client: str):
        self.active_connections.pop(id_client,None)
      
        room_id = None
        for r_id, users in self.rooms.items():
            if str(id_client) in users:
                room_id = r_id
                break
        if not room_id:
            return 
        
        await self.leave_room(room_id=room_id,user_id=id_client)
        payload = {
            "type":"user.offline",
            "sender_id": id_client,
        }
        for ws in self.active_connections.values():
            await ws.send_text(json.dumps(payload))
    async def send_personal_message(self, payload,websocket: WebSocket):
        """Gửi lại cho chính client (echo)"""
        await websocket.send_text(json.dumps(payload))


    async def broadcast(self, payload):
        """Gửi cho tất cả mọi người (bao gồm cả người gửi, tùy bạn)"""
        for ws in self.active_connections.values():
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                continue  # tránh crash nếu WS đã đóng


    async def send_1_to_1(self, payload):
        """Gửi riêng 1-1"""
        ws = self.active_connections.get(str(payload["receiver_id"])) 
        print("đã gửi ",payload["receiver_id"],ws)
        if ws:
            await ws.send_text(json.dumps(payload))

    
    def list_room_members(self, room_id: str) -> list[str]:
        """Lấy danh sách userId trong 1 room"""
        return list(self.rooms.get(room_id, set()))
    
    async def join_room(self, room_id: str, user_id: str):
        print("?")
        """
        User join vào room.
        - room_id: id phòng (str)
        - user_id: id user (str)
        """
        if room_id not in self.rooms:
            print("lỗi này")
            self.rooms[room_id] = set()
        self.rooms[room_id].add(user_id)

        # Gửi về cho chính user: danh sách member hiện tại trong room
        ws = self.active_connections.get(user_id)
        print(self.list_room_members(room_id))
        if ws:
            payload_self = {
                "type": "room.participants",
                "room_id": room_id,
                "participants": self.list_room_members(room_id),
            }
            await ws.send_text(json.dumps(payload_self))

        # Broadcast cho các member khác trong room biết user mới join
        payload_joined = {
            "type": "room.user_joined",
            "room_id": room_id,
            "user_id": user_id,
        }
        await self.broadcast_to_room(room_id, payload_joined, exclude=user_id)

    async def leave_room(self, room_id: str, user_id: str):
        """User rời 1 room cụ thể"""
        members = self.rooms.get(room_id)
        if not members:
            print("Không có thành viên trong phòng mà gửi room.leave")
            print(room_id)
            print(self.rooms)
            return

        if user_id in members:
            members.remove(user_id)
            print("đã gửi room.leave cho id:"+ user_id)
            # Thông báo cho các member khác
            payload_left = {
                "type": "room.leave",   
                "room_id": room_id,
                "user_id": user_id,
            }
            await self.broadcast_to_room(room_id, payload_left, exclude=user_id)

        # Nếu room trống → xóa
        if not members:
            self.rooms.pop(room_id, None)

    async def broadcast_to_room(self, room_id: str, payload: dict, exclude: str | None = None):
        """Gửi message cho TẤT CẢ user trong 1 room (trừ exclude nếu có)"""
        members = self.rooms.get(room_id, set())
        for uid in members:
            if exclude and uid == exclude:
                continue
            ws = self.active_connections.get(uid)
            if not ws:
                continue
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                # Nếu lỗi, có thể bỏ qua hoặc log
                continue