import "./App.css";
import { RegisterForm } from "./page/RegisterForm";
import { LoginForm } from "./page/LoginForm";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoachList from "./page/CoachList";
import CoachDetailPage from "./page/CoachDetailPage";
import EditProfilePage from "./page/EditProfilePage";
import CoachAvailabilityPage from "./page/CoachAvailabilityPage";
import CoachDashboard from "./page/CoachDashboard";
import CoachHome from "./page/CoachHome";
import MySchedulePage from "./page/MySchedulePage";
import MySlotsPage from "./page/MySlotsPage";
import MySentRequestsPage from "./page/MySentRequestsPage";

import AppLayout from "./AppLayout";
import { Message } from "./page/Message";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./components/admin/DashboardPage";
import StudentListPage from "./components/admin/StudentListPage";
import CoacherListPage from "./components/admin/CoacherListPage";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

import MeetingRooom from "./page/MeetingRoom";

import WebSocketProvider from "./ws/WebSocketProvider";
import { VideoCallProvider } from "./videoCall/VideoCallContext";
import { IncomingCallPopup } from "./videoCall/IncomingCallPopup";
import { RingingScreen } from "./videoCall/RingingScreen";
import { VideoCallWindow } from "./videoCall/VideoCallWindow";
import { config } from "./config";

import { MultiCallProvider } from "./videoCall/context";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <VideoCallProvider>
                <WebSocketProvider wsUrl={config.wsUrl}>
                  {/* 👇 Bọc toàn bộ layout + route con bằng MultiCallProvider */}
                  <MultiCallProvider>
                    <AppLayout />
                    <IncomingCallPopup />
                    <RingingScreen />
                    <VideoCallWindow />
                  </MultiCallProvider>
                </WebSocketProvider>
              </VideoCallProvider>
            </ProtectedRoute>
          }
        >
          {/* Các route user */}
          <Route path="/coach/home" element={<CoachHome />} />
          <Route path="/coach/dashboard" element={<CoachDashboard />} />
          <Route
            path="/coach/availability"
            element={<CoachAvailabilityPage />}
          />

          {/* Trang gọi nhóm */}
          <Route path="/call-room" element={<MeetingRooom />} />

          <Route path="/my-schedule" element={<MySchedulePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/coach/my-slots" element={<MySlotsPage />} />
          <Route path="/" element={<CoachList />} />
          <Route path="/message" element={<Message />} />
          <Route path="/requests/sent" element={<MySentRequestsPage />} />
          <Route path="/coacher/:coachId" element={<CoachDetailPage />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/students" element={<StudentListPage />} />
          <Route path="/admin/coachers" element={<CoacherListPage />} />
        </Route>

        {/* Auth */}
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
