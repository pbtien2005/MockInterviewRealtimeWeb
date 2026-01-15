import { config } from "../config"; // 1. Lấy cấu hình

// 2. Import cả 2 loại công nghệ vào đây
import { SFUCallProvider, useSFUCall } from "../videoCallBySFU/SFUCallContext";
import { MeshCallProvider, useMeshCall } from "./MeshCallContext";

// 3. Xác định chế độ đang chạy (Mặc định là MESH nếu quên config)
// Giá trị này nên là 'SFU' hoặc 'MESH'
const CURRENT_MODE = config.CALL_MODE || "MESH";

// In ra console để dev biết đang chạy cái gì (Debug cho dễ)
console.log(`🎥 Video Call System is running in mode: [${CURRENT_MODE}]`);

// 4. Xuất khẩu (Export) đúng cái cần dùng
// Nếu mode là SFU -> Xuất bộ SFU
// Nếu mode là MESH -> Xuất bộ MESH
export const MultiCallProvider =
  CURRENT_MODE === "SFU" ? SFUCallProvider : MeshCallProvider;

export const useMultiCall = CURRENT_MODE === "SFU" ? useSFUCall : useMeshCall;
