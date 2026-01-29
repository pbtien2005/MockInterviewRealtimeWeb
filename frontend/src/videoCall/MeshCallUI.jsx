import React, { useState, useRef, useEffect } from "react";
import { useMeshCall } from "./MeshCallContext";

// =======================
// 1. Ô video cho từng participant
// =======================
function VideoTile({
  participant,
  localStreamRef,
  remoteStreamsRef,
  isVideoOn,
  isMicOn,
}) {
  const videoRef = useRef(null);
  const attachedRef = useRef(false); // đã gán stream chưa

  useEffect(() => {
    const stream = participant.isSelf
      ? localStreamRef.current
      : remoteStreamsRef.current[Number(participant.userId)];

    if (!videoRef.current || !stream) return;

    // tránh gán lại nếu stream cũ
    if (videoRef.current.srcObject === stream && attachedRef.current) return;

    videoRef.current.srcObject = stream;
    attachedRef.current = true;
  }, [
    participant.userId,
    participant.isSelf,
    participant.hasVideo, // khi ontrack set true thì chạy lại
    localStreamRef,
    remoteStreamsRef,
  ]);

  // self: phải hasVideo && isVideoOn; remote: chỉ cần hasVideo
  const showVideo = participant.isSelf
    ? participant.hasVideo && isVideoOn
    : participant.hasVideo;

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden group">
      <div className="w-full h-full relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          className={`w-full h-full object-cover transform scale-x-[-1] ${
            showVideo ? "" : "hidden"
          }`}
        />

        {!showVideo && (
          <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <p className="text-white font-semibold">{participant.name}</p>
            <p className="text-gray-400 text-sm">
              {participant.isSelf ? "Bạn đang tắt camera" : "Camera tắt"}
            </p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <p className="text-white font-semibold text-sm">{participant.name}</p>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {participant.isSelf && !isMicOn && (
            <div className="bg-red-500 rounded-full p-2">
              <span>🔇</span>
            </div>
          )}
          {participant.isHost && (
            <div className="bg-blue-500 px-2 py-1 rounded text-white text-xs font-semibold">
              Host
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =======================
// 2. MultiVideoCall
// =======================
export default function MeshCallUI() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const {
    participants,
    room,
    localStreamRef,
    remoteStreamsRef,
    isVideoOn,
    isMicOn,
    toggleMic,
    toggleVideo,
    leaveRoom,
  } = useMeshCall();
  const onLeave = () => {
    leaveRoom();
  };
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: "Bạn",
        text: newMessage,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setNewMessage("");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">{room.name}</h1>
          <p className="text-gray-400 text-sm">
            {participants.length} người tham gia
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all text-sm"
          >
            <span>{copiedCode ? "✓ Đã copy" : `📋 Mã: ${room.roomCode}`}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 bg-black p-4 flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 auto-rows-fr">
            {participants.map((participant) => (
              <VideoTile
                key={participant.userId}
                participant={participant}
                localStreamRef={localStreamRef}
                remoteStreamsRef={remoteStreamsRef}
                isVideoOn={isVideoOn}
                isMicOn={isMicOn}
              />
            ))}
          </div>

          {/* Control Bar */}
          <div className="flex justify-center items-center gap-4 bg-gray-900 rounded-full px-6 py-4 w-fit mx-auto">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all ${
                isMicOn
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              title={isMicOn ? "Tắt mic" : "Bật mic"}
            >
              <span className="text-xl">{isMicOn ? "🎤" : "🔇"}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoOn
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              title={isVideoOn ? "Tắt camera" : "Bật camera"}
            >
              <span className="text-xl">{isVideoOn ? "📹" : "🚫"}</span>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all"
              title="Chat"
            >
              <span className="text-xl">💬</span>
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all"
              title="Danh sách người tham gia"
            >
              <span className="text-xl">👥</span>
            </button>

            <button
              onClick={onLeave}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all"
              title="Rời cuộc gọi"
            >
              <span className="text-xl">📞</span>
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">
                      {msg.name}
                    </p>
                    <p className="text-gray-400 text-xs">{msg.time}</p>
                  </div>
                  <p className="text-gray-300 text-sm bg-gray-800 rounded-lg px-3 py-2 w-fit max-w-xs">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 px-4 py-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">
                Danh sách ({participants.length})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {participants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {p.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {p.isHost ? "Host" : "Khách"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {p.hasVideo ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                        ✕
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
