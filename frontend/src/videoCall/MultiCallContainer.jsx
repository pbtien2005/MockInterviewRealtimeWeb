// src/videoCall/MultiCallContainer.jsx
import React from "react";
import { Loader2 } from "lucide-react";
import { config } from "../config";
import { useMultiCall } from "./context";
import MeshCallUI from "./MeshCallUI";
import SFUCallUI from "../videoCallBySFU/SFUCallUI";

const CURRENT_MODE = config.CALL_MODE;

export default function MultiCallContainer() {
  const { meeting, connectionState } = useMultiCall();

  console.log(
    `📞 MultiCallContainer - Mode: ${CURRENT_MODE}, State: ${connectionState}`,
  );

  if (CURRENT_MODE === "SFU") {
    // Đợi meeting object từ RealtimeKit SDK
    if (!meeting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
          <p className="text-lg font-medium">
            Đang kết nối tới máy chủ Cloudflare...
          </p>
        </div>
      );
    }

    // Render giao diện SFU
    return <SFUCallUI />;
  }

  if (connectionState === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
        <p className="text-lg font-medium">Đang kết nối...</p>
      </div>
    );
  }

  // Render giao diện Mesh
  return <MeshCallUI />;
}
