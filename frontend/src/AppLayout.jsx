import { Outlet } from "react-router-dom";
import { NavigationBar } from "./components/Navigation/NavigationBar";
import "./App.css";

export default function AppLayout() {
  return (
    // Div này giữ layout cố định toàn màn hình
    <div className="fixed inset-0 w-screen h-screen flex">
      <div className="navigation-bar">
        <NavigationBar />
      </div>
      <div className="flex-1 ml-20 h-full bg-neutral-900 overflow-y-auto">
        <Outlet /> {/* Hiển thị nội dung các trang con */}
      </div>
    </div>
  );
}
