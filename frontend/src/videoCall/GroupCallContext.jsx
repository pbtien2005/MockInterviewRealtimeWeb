import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

import { sendWS } from "../ws/socket.js";
import {
  getLocalStream,
  attachLocalTracks,
  createPeer,
  makeOffer,
  applyOfferAndMakeAnswer,
  setIceHandler,
  onRemoteTrack,
  closePeer,
  applyAnswer,
  toggleMic as toggleMicTrack,
  toggleCam as toggleCamTrack,
  addIce,
} from "./groupPeerConnection.js";
import { registerUI } from "../ws/dispatcher.js";
import { apiFetch } from "../api/api.js";
import MultiVideoCall from "./MultiVideoCall.jsx";

const MultiCallContext = createContext();

export const useMultiCall = () => {
  const ctx = useContext(MultiCallContext);
  if (!ctx) throw new Error("useMultiCall must be inside MultiCallProvider");
  return ctx;
};

export const MultiCallProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [connectionState, setConnectionState] = useState("idle");
  // idle | joining | in-call | error
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef({});
  const [localStreamState, setLocalStreamState] = useState(null);
  const joiningRef = useRef(false);
  const peersRef = useRef({});

  // -------------------------------------------------------
  // 2) ACTIONS PUBLIC (UI gọi)
  // -------------------------------------------------------

  // Tạo phòng
  const createRoom = async (name) => {
    /**
     * 1. Gọi API: POST /meeting-rooms
     * 2. Lấy room info → setRoom()
     * 3. Lấy localStream
     * 4. Connect WebSocket
     */
    try {
      const res = await apiFetch(`/meeting/create`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Create room failed:", errorData || res.statusText);
        alert("Tạo phòng thất bại. Vui lòng thử lại!");
        return;
      }

      const room = await res.json();
      console.log("response của /meeting/create", room);
      const newRoom = {
        id: room.id,
        name: name,
        participants: 1, // host vừa tạo → 1 người
        time: new Date(room.created_at).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        roomCode: room.room_code,
        status: room.status,
      };
      setRoom(newRoom);
      setConnectionState("joining");

      const localStream = await getLocalStream();
      localStreamRef.current = localStream || null;
      setLocalStreamState(localStream);

      const currentUser = JSON.parse(localStorage.getItem("user"));

      setParticipants([
        {
          userId: currentUser.user_id, // hoặc room.host_user.id nếu backend trả về
          name: currentUser.email, // hoặc room.host_user.name
          isHost: true,
          isSelf: true,
          hasVideo: !!localStream?.getVideoTracks()?.length,
          hasAudio: !!localStream?.getAudioTracks()?.length,
        },
      ]);
      setConnectionState("in-call");
      setActiveCall(true);
      return newRoom;
    } catch (err) {
      console.error(err);
      alert("Có lỗi mạng khi tạo phòng. Vui lòng thử lại!");
    }
  };

  // Join phòng bằng mã roomCode
  const joinRoomByCode = async (roomCode) => {
    try {
      setConnectionState("joining");

      const res = await apiFetch("/meeting/join", {
        method: "POST",
        body: JSON.stringify({ roomCode: roomCode }),
      });

      if (!res.ok) {
        setConnectionState("idle");
        return null;
      }

      const room = await res.json();
      const newRoom = {
        id: room.id,
        name: room.name,
        participants: room.participants_count, // host vừa tạo → 1 người
        time: new Date(room.created_at).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        roomCode: room.room_code,
        status: room.status,
      };

      setRoom(newRoom);
      if (!localStreamRef.current) {
        console.warn(
          "[handleRoomOffer] Chưa có localStream, gọi getLocalStream()"
        );
        const stream = await getLocalStream();
        localStreamRef.current = stream;
        setLocalStreamState(stream);
      }
      const localStream = localStreamRef.current;
      const currentUser = JSON.parse(localStorage.getItem("user"));
      setParticipants((prev) => [
        ...prev,
        {
          userId: currentUser.user_id,
          name: currentUser.email,
          isHost: false,
          isSelf: true,
          hasVideo: !!localStream?.getVideoTracks()?.length,
          hasAudio: !!localStream?.getAudioTracks()?.length,
        },
      ]);
      setConnectionState("in-call");
      return newRoom;
    } catch (e) {
      console.error(e);
      setConnectionState("idle");
      return null;
    }
  };

  // Rời phòng
  const leaveRoom = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const myId = currentUser.user_id;
    const roomCode = room.roomCode;
    console.log(roomCode);
    try {
      const res = await apiFetch("/meeting/leave", {
        method: "POST",
        body: JSON.stringify({
          roomCode: roomCode,
          room_id: room.id,
        }),
      });
      console.log(res);
    } catch (e) {
      console.warn(e);
    }

    // 2. Close tất cả peer
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    // 3. Dừng localStream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    // 4. Xoá remote streams
    remoteStreamsRef.current = {};

    // 5. Reset state
    setParticipants([]);
    setRoom(null);
    setConnectionState("idle");
  };

  // Toggle Mic
  const toggleMic = () => {
    setIsMicOn((prev) => {
      const next = !prev;

      toggleMicTrack(next);

      return next;
    });
  };

  // Toggle Video
  const toggleVideo = () => {
    setIsVideoOn((prev) => {
      const next = !prev;
      toggleCamTrack(next);
      return next;
    });
  };

  // -------------------------------------------------------
  // 3) INTERNAL HANDLERS – được gọi khi có sự kiện WS (private)
  // -------------------------------------------------------

  const handleUserJoined = (user) => {
    setParticipants((prev) => {
      const exists = prev.some((p) => p.userId === user.userId);
      if (exists) {
        return prev;
      }

      const newParticipants = [
        ...prev,
        {
          userId: user.userId,
          name: user.userId,
          isHost: !!user.isHost,
          isSelf: false,
          hasVideo: false,
          hasAudio: false,
        },
      ];

      return newParticipants;
    });

    setRoom((prevRoom) =>
      prevRoom
        ? {
            ...prevRoom,
            participants: (prevRoom.participants || 0) + 1,
          }
        : prevRoom
    );
  };
  const createPeerAndSendOffer = async (remoteUserId) => {
    remoteUserId = Number(remoteUserId);

    if (peersRef.current[remoteUserId]) {
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const myId = currentUser.user_id;

    const pc = createPeer();
    peersRef.current[remoteUserId] = pc;

    setIceHandler(pc, (candidate) => {
      sendWS({
        type: "room.ice",
        sender_id: myId,
        receiver_id: remoteUserId,
        data: candidate,
      });
    });

    onRemoteTrack(pc, (stream) => {
      remoteStreamsRef.current = {
        ...remoteStreamsRef.current,
        [remoteUserId]: stream,
      };

      setParticipants((prev) => {
        const updated = prev.map((p) =>
          Number(p.userId) === remoteUserId
            ? {
                ...p,
                hasVideo: !!stream.getVideoTracks().length,
                hasAudio: !!stream.getAudioTracks().length,
              }
            : p
        );

        return updated;
      });
    });

    if (!localStreamRef.current) {
      const stream = await getLocalStream();
      localStreamRef.current = stream;
      setLocalStreamState(stream);
    }

    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }

    const offer = await makeOffer(pc);

    sendWS({
      type: "room.offer",
      sender_id: myId,
      receiver_id: remoteUserId,
      data: offer,
    });
  };
  const handleRoomParticipants = async (payload) => {
    if (joiningRef.current) {
      return;
    }

    joiningRef.current = true;

    try {
      const { participants: list } = payload;
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const myId = currentUser.user_id;

      const others = list.filter((uid) => Number(uid) !== myId);

      setParticipants((prev) => {
        const newParticipants = [
          ...prev,
          ...others
            .filter((uid) => !prev.some((p) => p.userId === Number(uid)))
            .map((uid) => ({
              userId: Number(uid),
              name: uid,
              isHost: false,
              isSelf: false,
              hasVideo: false,
              hasAudio: false,
            })),
        ];

        return newParticipants;
      });

      for (const remoteUserId of others) {
        await createPeerAndSendOffer(Number(remoteUserId));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } finally {
      joiningRef.current = false;
    }
  };

  const handleRoomOffer = async (fromUserId, sdp) => {
    fromUserId = Number(fromUserId);

    let pc = peersRef.current[fromUserId];

    if (pc) {
      if (pc.signalingState === "have-local-offer") {
        await pc.setLocalDescription({ type: "rollback" });
      } else if (pc.signalingState !== "stable") {
        return;
      }
    } else {
      pc = createPeer(fromUserId);
      peersRef.current[fromUserId] = pc;

      const currentUser = JSON.parse(localStorage.getItem("user"));
      const myId = currentUser.user_id;

      setIceHandler(pc, (candidate) => {
        sendWS({
          type: "room.ice",
          sender_id: myId,
          receiver_id: fromUserId,
          data: candidate,
        });
      });

      onRemoteTrack(pc, (stream) => {
        remoteStreamsRef.current = {
          ...remoteStreamsRef.current,
          [fromUserId]: stream,
        };

        setParticipants((prev) => {
          const updated = prev.map((p) =>
            Number(p.userId) === fromUserId
              ? {
                  ...p,
                  hasVideo: !!stream.getVideoTracks().length,
                  hasAudio: !!stream.getAudioTracks().length,
                }
              : p
          );

          return updated;
        });
      });

      if (localStreamRef.current) {
        attachLocalTracks(pc, localStreamRef.current);
      }
    }

    const answer = await applyOfferAndMakeAnswer(pc, sdp);

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const myId = currentUser.user_id;

    sendWS({
      type: "room.answer",
      sender_id: myId,
      receiver_id: fromUserId,
      data: answer,
    });
  };

  const handleRoomAnswer = async (fromUserId, sdp, receiverId) => {
    fromUserId = Number(fromUserId);
    receiverId = Number(receiverId);
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const myId = currentUser.user_id;

    // 1. Nếu answer này không gửi cho mình → bỏ qua luôn
    if (receiverId !== myId) {
      console.log("lỗi ở đây");
      return;
    }

    const pc = peersRef.current[fromUserId];

    if (!pc) {
      console.log(fromUserId, receiverId, peersRef.current);
      console.warn("No peerConnection found for user", fromUserId);
      return;
    }

    // 2. Chỉ chấp nhận answer khi mình ĐÃ gửi offer
    console.log("[RoomAnswer] signalingState before apply:", pc.signalingState);

    if (
      pc.signalingState !== "have-local-offer" &&
      pc.signalingState !== "stable"
    ) {
      console.warn(`[ANSWER] Cannot apply answer, state: ${pc.signalingState}`);
      return;
    }

    try {
      await applyAnswer(pc, sdp);
      console.log(
        "[RoomAnswer] Apply answer OK, signalingState =",
        pc.signalingState
      );
    } catch (err) {
      console.error("Error applying answer from", fromUserId, err);
    }
  };

  const handleRoomIceCandidate = async (fromUserId, candidate) => {
    fromUserId = Number(fromUserId);
    const pc = peersRef.current[fromUserId];
    if (!pc) {
      console.warn("No peerConnection for ICE from user", fromUserId);
      return;
    }

    try {
      await addIce(pc, candidate); // nếu addIce signature là (pc, candidate)
    } catch (err) {
      console.error("Error adding ICE candidate from", fromUserId, err);
    }
  };

  const handleUserLeft = (userId) => {
    console.log("User left:", userId);
    userId = Number(userId);

    // 1. Đóng Peer Connection
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }

    // 2. Xóa Remote Stream (để giải phóng bộ nhớ)
    if (remoteStreamsRef.current[userId]) {
      delete remoteStreamsRef.current[userId];
    }

    // 3. Cập nhật UI (Quan trọng: Phải update state để UI re-render và mất video)
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  };

  // -------------------------------------------------------
  // 6) VALUE PUBLIC EXPORT CHO UI
  // -------------------------------------------------------
  const value = {
    room,
    participants,
    activeCall,
    localStreamRef,
    remoteStreamsRef,

    isMicOn,
    isVideoOn,
    connectionState,

    createRoom,
    joinRoomByCode,
    leaveRoom,
    toggleMic,
    toggleVideo,
    handleUserJoined,
    handleUserLeft,
    handleRoomAnswer,
    handleRoomIceCandidate,
    handleRoomOffer,
  };
  useEffect(
    () => {
      const unregister = registerUI({
        handleRoomParticipants,
        handleRoomUserJoined: (obj) =>
          handleUserJoined({
            userId: Number(obj.user_id),
            name: obj.name,
            isHost: obj.is_host,
          }),
        handleRoomOffer: (obj) => handleRoomOffer(obj.sender_id, obj.data),
        handleRoomAnswer: (obj) =>
          handleRoomAnswer(obj.sender_id, obj.data, obj.receiver_id),
        handleRoomIceCandidate: (obj) =>
          handleRoomIceCandidate(obj.sender_id, obj.data),
        handleRoomUserLeft: (obj) => handleUserLeft(obj.user_id),
      });

      return () => {
        if (typeof unregister === "function") unregister();
      };
    },
    [
      /* ✅ Bỏ deps để handlers luôn fresh */
    ]
  );
  return (
    <MultiCallContext.Provider value={value}>
      {children}
    </MultiCallContext.Provider>
  );
};
