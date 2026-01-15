import React, { useState } from "react";
import { Video, Users, Plus, LogIn, List, ArrowLeft } from "lucide-react";
import { apiFetch } from "../api/api";
import MultiVideoCall from "../videoCall/MultiVideoCall";
import { useMultiCall } from "../videoCall/GroupCallContext";

export default function MeetingRoom() {
  const [activeTab, setActiveTab] = useState("home");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState([]);

  const {
    room,
    connectionState,
    createRoom,
    joinRoomByCode,
    leaveRoom,
    participants,
  } = useMultiCall();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    const ok = await createRoom(roomName.trim());
    if (!ok) {
      alert("tạo phòng thất bại, vui lòng thử lại");
      return;
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    const joined = await joinRoomByCode(roomCode.trim());
    if (!joined) {
      alert("Không tham gia được phòng! Kiểm tra lại mã phòng.");
      return;
    }
    setRoomCode("");
  };
  const handleLeaveCall = async () => {
    await leaveRoom();
    setActiveTab("home");
  };
  if (connectionState == "in-call") {
    return (
      <MultiVideoCall
        room={room}
        onLeave={handleLeaveCall}
        participants={participants}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-10 h-10 text-pink-300" />
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">
              Gọi Nhóm
            </h1>
          </div>
          <p className="text-purple-200 text-base sm:text-lg">
            Kết nối và học tập cùng nhau
          </p>
        </div>

        {/* Nội dung từng tab */}
        {activeTab === "home" && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <Video className="w-20 h-20 sm:w-24 sm:h-24 text-pink-300 mx-auto mb-6" />
            <h2 className="text-2xl  sm:text-3xl font-bold text-pink-300 mb-4">
              Chưa có cuộc gọi nào
            </h2>
            <p className="text-purple-200 text-base sm:text-lg mb-8">
              Bắt đầu cuộc gọi mới, tham gia phòng, hoặc xem danh sách phòng!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveTab("create")}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Khởi tạo phòng
              </button>
              <button
                onClick={() => setActiveTab("join")}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Tham gia phòng
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Danh sách phòng
              </button>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl">
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-2 text-purple-200 hover:text-pink-300 transition-all mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-8 h-8 text-pink-300" />
              <h2 className="text-2xl sm:text-3xl font-bold text-pink-300">
                Khởi tạo phòng
              </h2>
            </div>
            <p className="text-purple-200 mb-6">
              Tạo phòng gọi mới và mời bạn bè tham gia
            </p>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Nhập tên phòng..."
              className="w-full px-6 py-4 bg-white bg-opacity-10 border-2 border-purple-400 rounded-2xl text-black placeholder-purple-300 focus:outline-none focus:border-pink-400 mb-6"
            />
            <button
              onClick={handleCreateRoom}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Tạo phòng ngay
            </button>
          </div>
        )}

        {activeTab === "join" && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl">
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-2 text-purple-200 hover:text-pink-300 transition-all mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <LogIn className="w-8 h-8 text-pink-300" />
              <h2 className="text-2xl sm:text-3xl font-bold text-pink-300">
                Tham gia phòng
              </h2>
            </div>
            <p className="text-purple-200 mb-6">
              Nhập mã phòng để tham gia cuộc gọi
            </p>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Nhập mã phòng..."
              className="w-full px-6 py-4 bg-white bg-opacity-10 border-2 border-purple-400 rounded-2xl text-black placeholder-purple-300 focus:outline-none focus:border-pink-400 mb-6"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Tham gia ngay
            </button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl">
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-2 text-purple-200 hover:text-pink-300 transition-all mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <List className="w-8 h-8 text-pink-300" />
              <h2 className="text-2xl sm:text-3xl font-bold text-pink-300">
                Danh sách phòng
              </h2>
            </div>
            <p className="text-purple-200 mb-6">Các phòng bạn đã tham gia</p>

            {rooms.length === 0 ? (
              <p className="text-purple-200 italic">
                Hiện chưa có phòng nào. Hãy thử tạo một phòng mới.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white bg-opacity-10 rounded-2xl p-6 hover:bg-opacity-20 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {room.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-purple-300 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {room.participants} người
                            </span>
                            <span>{room.time}</span>
                          </div>
                        </div>
                      </div>
                      <button className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all">
                        Tham gia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
