import React, { useEffect, useState } from "react";
import {
  RealtimeKitProvider,
  useRealtimeKitMeeting,
} from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { useSFUCall } from "./SFUCallContext";

// --- PHẦN 1: NỘI DUNG CUỘC GỌI ---
const CallContent = () => {
  const { meeting } = useSFUCall(); // Giả sử hook lấy meeting từ đây
  const [isCopied, setIsCopied] = useState(false);

  // Lấy ID cần hiển thị (dùng optional chaining ?. để tránh lỗi nếu dữ liệu chưa về)
  const displayId = meeting?.meta?.meetingId || "Đang tải...";

  const handleCopy = () => {
    if (meeting?.meta?.meetingId) {
      navigator.clipboard.writeText(meeting.meta.meetingId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    // 1. Container bao ngoài: Cần relative để định vị các thành phần con
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* 2. Phần hiển thị ID (Header Overlay) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 10, // Đảm bảo nằm trên video
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)", // Gradient nhẹ cho dễ nhìn
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          color: "white",
        }}
      >
        {/* Hiển thị ID */}
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "500" }}>
          Meeting ID: <span style={{ fontWeight: "bold" }}>{displayId}</span>
        </h1>

        {/* Nút Copy */}
        <button
          onClick={handleCopy}
          style={{
            padding: "5px 10px",
            fontSize: "12px",
            cursor: "pointer",
            backgroundColor: isCopied ? "#4CAF50" : "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            borderRadius: "4px",
          }}
        >
          {isCopied ? "Đã copy" : "Copy"}
        </button>
      </div>

      {/* 3. Component Meeting (Nền) */}
      <RtkMeeting mode="fill" meeting={meeting} showSetupScreen={true} />
    </div>
  );
};
// --- PHẦN 2: CONTAINER ---
export default function SFUCallUI() {
  const { meeting, connectionState } = useSFUCall();

  console.log("🛠 SFUCallUI Check:", {
    hasMeeting: !!meeting,
    sessionId: meeting?.sessionId,
    peerId: meeting?.peerId, // 👈 Đây là cái gây lỗi nếu thiếu
  });

  // 🔥 FIX QUAN TRỌNG NHẤT:
  // Thêm điều kiện !meeting.peerId
  // Nếu chưa có PeerID (chưa định danh xong), bắt buộc phải hiện Loading
  if (
    !meeting ||
    !meeting.peerId || // 👈 Thêm dòng này
    connectionState !== "in-call"
  ) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse font-medium">
          {!meeting
            ? "Đang khởi tạo..."
            : !meeting.sessionId
              ? "Đang xác thực Session..."
              : "Đang lấy Peer ID..."}
        </p>
      </div>
    );
  }

  return (
    <RealtimeKitProvider value={meeting}>
      <CallContent />
    </RealtimeKitProvider>
  );
}
