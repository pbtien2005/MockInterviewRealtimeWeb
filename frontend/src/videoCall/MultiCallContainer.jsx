import React from "react";
import { RealtimeKitProvider } from "@cloudflare/realtimekit-react";
import { Loader2 } from "lucide-react"; // Icon loading (nếu bạn cài lucide-react)

// 1. Import Hook tổng (để lấy cờ providerType và biến meeting)
import { useMultiCall } from "./context";

// 2. Import giao diện cũ (Mesh/Socket.io)
import MeshCallUI from "./MeshCallUI";

// 3. Import giao diện mới (SFU/Cloudflare) - Bạn cần tạo file này (xem bên dưới)
import SFUCallUI from "../videoCallBySFU/SFUCallUI";

export default function VideoCallContainer({ onLeave }) {
  // Lấy dữ liệu từ Context
  const { providerType, cfMeeting, room } = useMultiCall();

  // ---------------------------------------------------------
  // TRƯỜNG HỢP 1: CLOUDFLARE SFU
  // ---------------------------------------------------------
  if (providerType === "SFU") {
    // Nếu chưa có object meeting (đang connect API) -> Hiện Loading
    if (!cfMeeting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
          <p className="text-lg font-medium">
            Đang kết nối tới máy chủ Cloudflare...
          </p>
        </div>
      );
    }

    // Nếu đã có meeting -> Bọc Provider và render giao diện SFU
    return (
      <RealtimeKitProvider value={cfMeeting}>
        {/* Truyền roomName để hiển thị title */}
        <SFUCallUI onLeave={onLeave} roomName={room?.name} />
      </RealtimeKitProvider>
    );
  }

  // ---------------------------------------------------------
  // TRƯỜNG HỢP 2: MESH (Code cũ)
  // ---------------------------------------------------------
  // MeshCallUI tự dùng useMeshCall bên trong nó, không cần bọc gì thêm
  return <MeshCallUI onLeave={onLeave} />;
}
