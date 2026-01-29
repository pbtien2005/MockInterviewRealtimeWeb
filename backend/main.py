from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, students, admin
from fastapi.staticfiles import StaticFiles 
import os 
from routers import auth,students,conversation
from routers import chat, booking, coacher, user, availability , session,slot,call_meet

from ws.routes import ws_router


# --- SỬA Ở ĐÂY ---
AVATAR_UPLOAD_DIR = "static/avatars"
CERT_UPLOAD_DIR = "static/certificates" # <-- Thêm
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)
os.makedirs(CERT_UPLOAD_DIR, exist_ok=True) # <-- Thêm
# ------------------

app = FastAPI(
    debug=True,
    servers=[
        {"url": "http://127.0.0.1:8000", "description": "Local server"}
    ]
)

app.mount("/static", StaticFiles(directory="static"), name="static") 


app.include_router(auth.router)
app.include_router(booking.router)
app.include_router(students.router)
app.include_router(admin.router) 

app.include_router(chat.router)
app.include_router(ws_router)
app.include_router(conversation.router)
app.include_router(availability.router)
app.include_router(chat.router)
app.include_router(slot.router)
app.include_router(ws_router)

app.include_router(coacher.router)
app.include_router(user.router)
app.include_router(session.router)
app.include_router(call_meet.router)



origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://172.20.10.4:5173",
    "https://mock-interview-realtime-web.pbtien2005.workers.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # 👈 cho phép tất cả
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


