let pc;
let localSTream;
let iceCandidateQueue = [];
let onIceCandidateHandler = null;
let onRemoteTrackHandler = null;

export async function getLocalStream() {
  try {
    localSTream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } catch (err) {
    if (err.name == "NotFoundError" || err.name == "NotAllowedError") {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === "videoinput");
      const hasMic = devices.some((d) => d.kind === "audioinput");
      if (hasMic) {
        try {
          console.log("Chỉ có micro");
          localSTream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } catch {}
      } else if (hasCamera) {
        try {
          console.log("Chỉ có camera");
          localSTream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {}
      } else {
        localSTream = null;
      }
    }
    console.log(err);
  }
  return localSTream;
}
export function attachLocalTracks(stream) {
  if (stream) {
    // Có track nào thì addTrack track đó
    const at = stream.getAudioTracks()[0];
    const vt = stream.getVideoTracks()[0];
    if (at) pc.addTrack(at, stream);
    else pc.addTransceiver("audio", { direction: "recvonly" }); // vẫn nhận audio từ peer

    if (vt) pc.addTrack(vt, stream);
    else pc.addTransceiver("video", { direction: "recvonly" }); // vẫn nhận video từ peer
  } else {
    // Không có quyền/thiết bị gì: vẫn có thể tạo kết nối dữ liệu và/hoặc chỉ nhận media
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.addTransceiver("video", { direction: "recvonly" });
  }
}
export function createPeer() {
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  pc = new RTCPeerConnection(configuration);
  pc.onicecandidate = (e) => {
    onIceCandidateHandler(e.candidate);
  };
  pc.ontrack = (e) => {
    const remoteStream = e.streams?.[0];
    onRemoteTrackHandler(remoteStream);
  };
  pc.onconnectionstatechange = (event) => {
    const state = pc.connectionState;
    console.log("[Peer] connectionState:", pc.connectionState);
  };
  return pc;
}
export function setIceHandler(fn) {
  onIceCandidateHandler = fn;
}

export function onRemoteTrack(fn) {
  onRemoteTrackHandler = fn;
}
export async function makeOffer() {
  if (!pc) throw new Error("PC not initialized");
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log("[Peer] Created offer");
  return offer;
}
export async function applyOfferAndMakeAnswer(remoteOffer) {
  await pc.setRemoteDescription(remoteOffer);
  while (iceCandidateQueue.length > 0) {
    const candidate = iceCandidateQueue.shift();
    try {
      await pc.addIceCandidate(candidate);
    } catch (e) {
      console.error("lỗi khi thêm candidate từ queue: ", e);
    }
  }
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  console.log("apply and create success");
  return answer;
}
export async function applyAnswer(remoteAnswer) {
  try {
    // Thiết lập mô tả từ xa (answer của người nhận)
    await pc.setRemoteDescription(remoteAnswer);
    console.log("Áp dụng answer thành công!");
    while (iceCandidateQueue.length > 0) {
      const candidate = iceCandidateQueue.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error("Lỗi khi thêm candidate từ hàng đợi:", e);
      }
    }
  } catch (error) {
    console.error("Lỗi khi áp dụng answer:", error);
  }
}
export async function addIce(candidate) {
  console.log(candidate);
  if (!pc.remoteDescription) {
    iceCandidateQueue.push(candidate);
  } else {
    try {
      if (candidate) {
        await pc.addIceCandidate(candidate);
      } else {
        console.log("ko co candidate");
      }
    } catch (error) {
      console.error("Lỗi khi thêm ICE candidate:", error);
    }
  }
  // Kiểm tra xem candidate có tồn tại không trước khi thêm
}

export function closePeer() {
  console.log("da chay pc.close();");
  pc.close();
  console.log("pc.state:", pc.connectionState);
  console.log("signaling:", pc.signalingState);
  pc.getSenders().forEach((sender) => sender.track?.stop());
}
export function toggleMic(enabled) {
  localSTream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}
export function toggleCam(enabled) {
  localSTream.getVideoTracks().forEach((track) => {
    track.enabled = enabled;
  });
}
