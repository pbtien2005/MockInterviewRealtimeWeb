// groupPeerConnection.js
// Dùng riêng cho gọi nhóm (multi-peer)

let localStream = null;

// Map lưu ICE queue theo từng pc để tránh lẫn giữa các peer
const iceQueueMap = new WeakMap();

function getIceQueue(pc) {
  let q = iceQueueMap.get(pc);
  if (!q) {
    q = [];
    iceQueueMap.set(pc, q);
  }
  return q;
}

// =======================
// 1. Local media
// =======================

export async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } catch (err) {
    // Nếu bị từ chối hoặc không tìm thấy device → fallback
    if (err.name === "NotFoundError" || err.name === "NotAllowedError") {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === "videoinput");
      const hasMic = devices.some((d) => d.kind === "audioinput");

      if (hasMic) {
        try {
          console.log("[GroupPeer] Chỉ có micro");
          localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } catch (e) {
          console.error(e);
        }
      } else if (hasCamera) {
        try {
          console.log("[GroupPeer] Chỉ có camera");
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        console.warn("[GroupPeer] Không có camera/mic nào");
        localStream = null;
      }
    } else {
      console.error(err);
    }
  }

  return localStream;
}

// =======================
// 2. Peer creation & tracks
// =======================

export function createPeer() {
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const pc = new RTCPeerConnection(configuration);

  pc.onconnectionstatechange = () => {
    console.log("[GroupPeer] connectionState:", pc.connectionState);
  };

  return pc;
}

export function attachLocalTracks(pc, stream) {
  const s = stream;

  if (s) {
    const at = s.getAudioTracks()[0];
    const vt = s.getVideoTracks()[0];

    if (at) {
      pc.addTrack(at, s);
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

    if (vt) {
      pc.addTrack(vt, s);
    } else {
      pc.addTransceiver("video", { direction: "recvonly" });
    }
  } else {
    // Không có stream local vẫn có thể nhận media từ peer
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.addTransceiver("video", { direction: "recvonly" });
  }
}

// =======================
// 3. ICE & remote track
// =======================

export function setIceHandler(pc, fn) {
  pc.onicecandidate = (e) => {
    if (e.candidate && typeof fn === "function") {
      fn(e.candidate);
    }
  };
}

export function onRemoteTrack(pc, fn) {
  pc.ontrack = (e) => {
    const remoteStream = e.streams?.[0];
    console.log(
      "[ontrack] fired. streams=",
      e.streams,
      " first=",
      remoteStream
    );
    if (remoteStream && typeof fn === "function") {
      fn(remoteStream);
    }
  };
}

// =======================
// 4. Offer / Answer
// =======================

export async function makeOffer(pc) {
  if (!pc) throw new Error("PC not initialized");
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log("[GroupPeer] Created offer");
  return offer;
}

export async function applyOfferAndMakeAnswer(pc, remoteOffer) {
  if (!pc) throw new Error("PC not initialized");

  await pc.setRemoteDescription(remoteOffer);

  // Áp ICE queue (nếu có) cho pc này
  const queue = getIceQueue(pc);
  while (queue.length > 0) {
    const candidate = queue.shift();
    try {
      await pc.addIceCandidate(candidate);
    } catch (e) {
      console.error("[GroupPeer] Lỗi khi thêm candidate từ queue:", e);
    }
  }

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  console.log("[GroupPeer] applyOfferAndMakeAnswer success");
  return answer;
}

export async function applyAnswer(pc, remoteAnswer) {
  if (!pc) throw new Error("PC not initialized");

  try {
    await pc.setRemoteDescription(remoteAnswer);
    console.log("[GroupPeer] Áp dụng answer thành công!");

    const queue = getIceQueue(pc);
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error("[GroupPeer] Lỗi khi thêm candidate từ hàng đợi:", e);
      }
    }
  } catch (error) {
    console.error("[GroupPeer] Lỗi khi áp dụng answer:", error);
  }
}

// =======================
// 5. ICE candidate
// =======================

export async function addIce(pc, candidate) {
  if (!pc || !candidate) return;

  if (!pc.remoteDescription) {
    // Chưa setRemoteDescription → lưu queue, lát nữa applyOffer/applyAnswer sẽ add
    const queue = getIceQueue(pc);
    queue.push(candidate);
  } else {
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error("[GroupPeer] Lỗi khi thêm ICE candidate:", error);
    }
  }
}

// =======================
// 6. Close peer + toggle tracks
// =======================

export function closePeer(pc) {
  if (!pc) return;
  console.log("[GroupPeer] closing pc...");

  try {
    pc.getSenders().forEach((sender) => sender.track?.stop());
  } catch (e) {
    console.error(e);
  }

  pc.close();
  console.log(
    "[GroupPeer] pc state:",
    pc.connectionState,
    "signaling:",
    pc.signalingState
  );
}

export function toggleMic(enabled) {
  if (!localStream) return;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}

export function toggleCam(enabled) {
  if (!localStream) return;
  console.log("[toggleCam] enabled=", enabled, "localStream=", localStream);
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = enabled;
  });
  console.log(
    "[toggleCam] tracks after toggle =",
    localStream.getVideoTracks().map((t) => t.enabled)
  );
}
