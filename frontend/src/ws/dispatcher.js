import {
  addIce,
  applyAnswer,
  applyOfferAndMakeAnswer,
  createPeer,
} from "../videoCall/peerConnection.js";
import { tryParseJSON } from "./utils.js";
import { apiFetch } from "../api/api.js";
import { config } from "../config.js";
let ui = {
  addMessage: () => {},
  userStatusUpdate: () => {},
  handleCallAccepted: () => {},
  setCallState: (e) => {},
  setIncomingCall: (e) => {},
  handleCallOffer: () => {},
  endCall: () => {},
  pendingCallRef: "",
  handleRoomParticipants: () => {},
  handleRoomUserJoined: () => {},
  handleRoomAnswer: () => {},
  handleRoomIceCandidate: () => {},
  handleRoomOffer: () => {},
  handleRoomUserLeft: () => {},
};

export function registerUI(api) {
  Object.keys(api).forEach((key) => {
    ui[key] = api[key];
  });
}
export async function handleIncoming(rawString) {
  let obj;
  obj = tryParseJSON(rawString);
  if (obj.type == "error.token") {
    const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!refreshRes.ok) {
      localStorage.removeItem("access_token");
      return;
    }
    const data = await refreshRes.json();
    console.log(data);
    localStorage.setItem("access_token", data.access_token);
    response = await fetch(`${config.apiUrl}` + url, {
      ...options,
      Authorization: `Bearer ${data.access_token}`, // ✅
      "Content-Type": "application/json",
    });
  }
  // 🧩 4. Nếu là message chat thường
  if (obj.type == "user.online") {
    ui.userStatusUpdate(obj.sender_id, true);
    console.log(typeof obj.sender_id);
  }

  if (obj.type == "user.offline") {
    console.log("đã nhận user.offline");
    ui.userStatusUpdate(obj.sender_id, false);
  }
  if (obj.type == "message.send") {
    ui.addMessage(obj);
  }

  if (obj.type == "call.request") {
    console.log(obj);
    ui.setIncomingCall({
      calleeInfo: {
        id: obj.sender_id,
        username: obj.data.sender_name,
        avatar_url: obj.data.sender_avatar,
      },
      conversationId: obj.data.conversation_id,
    });
  }
  if (obj.type == "call.accept") {
    console.log("✅ Call accepted by callee");
    ui.handleCallAccepted();
  }
  if (obj.type == "call.offer") {
    console.log("📥 Received offer");
    ui.handleCallOffer(obj.data);
  }
  if (obj.type == "call.answer") {
    console.log("📥 Received answer");
    applyAnswer(obj.data);
    ui.setCallState((prev) => ({ ...prev, callStatus: "connected" }));
  }
  if (obj.type == "call.ice") {
    console.log(obj.data);
    await addIce(obj.data);
  }
  if (obj.type == "call.end") {
    console.log("🔴 Call ended by remote");
    ui.endCall();
  }

  if (obj.type == "call.decline") {
    console.log("❌ Call declined");
    ui.pendingCallRef.current = null;
    ui.setCallState({
      isInCall: false,
      isMinimized: false,
      isMuted: false,
      isVideoOff: false,
      callerInfo: null,
      calleeInfo: null,
      conversationId: null,
      callStatus: "idle",
      hasRemoteStream: false,
    });
  }
  if (obj.type == "call.cancel") {
    console.log("🚫 Call cancelled by caller");
    ui.setIncomingCall(null);
  }
  if (obj.type == "room.participants") {
    ui.handleRoomParticipants(obj);
  }
  if (obj.type == "room.user_joined") {
    ui.handleRoomUserJoined(obj);
  }
  if (obj.type === "room.offer") {
    ui.handleRoomOffer(obj);
  }

  if (obj.type === "room.answer") {
    ui.handleRoomAnswer(obj);
  }
  if (obj.type === "room.leave") {
    console.log("đã chạy hàm leave");
    ui.handleRoomUserLeft(obj);
  }
  if (obj.type === "room.ice") {
    ui.handleRoomIceCandidate(obj);
  }
}
