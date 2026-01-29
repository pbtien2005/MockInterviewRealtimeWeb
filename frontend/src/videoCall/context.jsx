// src/videoCall/context.js
import { config } from "../config";
import { SFUCallProvider, useSFUCall } from "../videoCallBySFU/SFUCallContext";
import { MeshCallProvider, useMeshCall } from "./MeshCallContext";
import MeshCallUI from "./MeshCallUI";
import SFUCallUI from "../videoCallBySFU/SFUCallUI";
// Chọn Provider và Hook dựa trên config
const CURRENT_MODE = config.CALL_MODE;

console.log(`🎥 Video Call System is running in mode: [${CURRENT_MODE}]`);

// Export Provider phù hợp
export const MultiCallProvider =
  CURRENT_MODE === "SFU" ? SFUCallProvider : MeshCallProvider;

// Export Hook phù hợp
export const useMultiCall = CURRENT_MODE === "SFU" ? useSFUCall : useMeshCall;

// Export mode để các component khác sử dụng
export const CALL_MODE = CURRENT_MODE;
