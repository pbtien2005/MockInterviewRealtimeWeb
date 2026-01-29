import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { apiFetch } from "../api/api";

const SFUCallContext = createContext(null);

export const useSFUCall = () => {
  const ctx = useContext(SFUCallContext);
  if (!ctx) throw new Error("useSFUCall must be used within SFUCallProvider");
  return ctx;
};

export const SFUCallProvider = ({ children }) => {
  // 1. Hook khởi tạo Client
  const [meeting, initMeeting] = useRealtimeKitClient();

  const [connectionState, setConnectionState] = useState("idle");

  const createRoom = useCallback(
    async (name) => {
      if (connectionState === "connecting") return; // Chống spam click
      setConnectionState("connecting");

      try {
        const res = await apiFetch("/meeting/cloudflare/create", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });
        const data = await res.json();

        if (!data?.token) throw new Error("Server không trả về Token");
        // Khởi tạo SDK
        const tmp = initMeeting({ authToken: data.token });
        console.log("đây là meeting", tmp);
        // // QUAN TRỌNG: Set trạng thái in-call NGAY LẬP TỨC
        setConnectionState("in-call");
        return true;
      } catch (error) {
        console.error("Create Room Error:", error);
        setConnectionState("error");
        return false;
      }
    },
    [initMeeting, connectionState],
  );

  // HÀM VÀO PHÒNG
  const joinRoomByCode = useCallback(
    async (roomCode) => {
      if (connectionState === "connecting") return;
      setConnectionState("connecting");
      try {
        const res = await apiFetch("/meeting/cloudflare/join", {
          method: "POST",
          body: JSON.stringify({ roomCode }),
        });
        const data = await res.json();

        if (!data?.token) throw new Error("Sai mã phòng");

        await initMeeting({ authToken: data.token });

        setConnectionState("in-call");
        return true;
      } catch (error) {
        console.error("Join Room Error:", error);
        setConnectionState("error");
        return false;
      }
    },
    [initMeeting, connectionState],
  );
  const leaveRoom = useCallback(() => {
    if (window.confirm("Rời cuộc gọi?")) {
      window.location.reload();
    }
  }, []);
  const value = {
    meeting,
    connectionState,
    setConnectionState,
    createRoom,
    joinRoomByCode,
    leaveRoom,
  };

  return (
    <SFUCallContext.Provider value={value}>{children}</SFUCallContext.Provider>
  );
};
