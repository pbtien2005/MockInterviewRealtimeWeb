from fastapi import APIRouter, FastAPI, HTTPException,WebSocket, WebSocketDisconnect,Request,Depends
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import json
from fastapi.staticfiles import StaticFiles
from ws.connection_manager import ConnectionManager
from auth.dependencies import get_current_user
from core.db import get_db
import time
from auth.dependencies import rotate_refresh_and_issue_access

ws_router=APIRouter()

        
wsManager=ConnectionManager()


@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket,db: Session=Depends(get_db)):
    subprotocols = websocket.headers.get("sec-websocket-protocol")
    token = subprotocols.split(",")[0].strip() if subprotocols else None
    await websocket.accept(subprotocol=token)
    try:
        user=get_current_user(token,db)
    except HTTPException as e:
        await websocket.send_text(json.dumps({"type": "error.token", "data": ""}))
        await websocket.close()
        return

    client_id=user.user_id
    await wsManager.connect(websocket,str(user.user_id)) #Nhan ket noi tu client 
    try:
        while True:
            data=await websocket.receive_text()
            payload = json.loads(data)
            await wsManager.send_1_to_1(payload)
            print(payload)
    except WebSocketDisconnect or Exception:
        await wsManager.disconnect(client_id)
