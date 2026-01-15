import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  MessageCircle,
  CalendarRange,
  Settings,
  Instagram,
  BellRing,
  ArrowRightLeft,
  LogOut, // ✅ 1. THÊM ICON LOGOUT
  Presentation,
} from "lucide-react";

export const NavigationBar = () => {
  const [activeNav, setActiveNav] = useState("message");
  // const notificationCount = 3; // (Bạn có thể thêm logic fetch count ở đây)
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user ? user.role : "student";
  const HOME_PATH = userRole === "coacher" ? "/coach/home" : "/";
  const REQUEST_PATH =
    userRole === "coacher" ? "/coach/dashboard" : "/requests/sent";

  const navItems = [
    // ... (Mảng navItems của bạn giữ nguyên)
    { id: "instagram", icon: Instagram, label: "Instagram", path: "/" },
    { id: "home", icon: Home, label: "Home", path: HOME_PATH },
    {
      id: "calendar",
      icon: CalendarRange,
      label: "Lịch học",
      path: "/my-schedule",
    },
    { id: "message", icon: MessageCircle, label: "Tin nhắn", path: "/message" },
    {
      id: "notifications",
      icon: ArrowRightLeft,
      label: "Thông báo",

      path: REQUEST_PATH,
    },
    {
      id: "meeting_call",
      icon: Presentation,
      label: "Gọi nhóm",
      path: "/call-room",
    },
  ];

  // ✅ 2. THÊM HÀM XỬ LÝ ĐĂNG XUẤT
  const handleLogout = () => {
    // Xóa hết dữ liệu user khỏi localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token"); // (Nên xóa cả refresh token nếu có)

    // Chuyển hướng về trang Login
    navigate("/login");
  };

  return (
    // Container chính
    <div className="fixed inset-y-0 w-20 bg-gradient-to-b from-[#E90000] to-[#FAA6FF] border-r border-[#ff1a1a] flex flex-col items-center py-6 space-y-6 transition-all duration-300 hover:w-21">
      {/* KHỐI 1: MAIN ICONS */}
      <div className="flex flex-col space-y-6 flex-1">
        {navItems.map((item, index) => {
          // ... (Code map navItems của bạn giữ nguyên)
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const isLogo = item.id === "instagram";

          return (
            <div
              key={item.id}
              className="w-full flex flex-col items-center group-hover:items-stretch group-hover:px-4"
            >
              <button
                onClick={() => {
                  setActiveNav(item.id);
                  navigate(item.path);
                }}
                className={`relative p-3 rounded-xl transition-all
                flex items-center justify-center 
                group-hover:justify-start group-hover:w-full
                gap-0 group-hover:gap-3 
                ${
                  isActive
                    ? "bg-white/25 text-white backdrop-blur-sm scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/15 hover:scale-105"
                }
                ${isLogo ? "mb-4" : ""}`}
                title={item.label}
              >
                <Icon
                  className={`w-6 h-6 ${isLogo ? "w-7 h-7" : ""} shrink-0`}
                />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium max-w-0 group-hover:max-w-xs overflow-hidden">
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold group-hover:static group-hover:ml-auto transition-all">
                    {item.badge}
                  </span>
                )}
              </button>
              {index === 0 && (
                <div className="border-t border-white/25 w-12 group-hover:w-full mt-6 transition-all duration-300"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* KHỐI 2: AVATAR */}
      <div className="w-full flex justify-center group-hover:px-4 py-4 border-t border-white/25 mt-auto">
        <Link to="/profile/edit" className="block">
          <button className="p-1 rounded-full ring-2 ring-white/60 bg-transparent hover:ring-4 transition-all hover:scale-110">
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          </button>
        </Link>
      </div>

      {/* ✅ KHỐI 4: ĐĂNG XUẤT (NÚT MỚI) */}
      <div className="w-full flex justify-center group-hover:px-4">
        <button
          onClick={handleLogout}
          className="p-3 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all hover:scale-110"
          title="Đăng xuất"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
