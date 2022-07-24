const socket = io();

const myFace = document.getElementById("myFace"); //영상 화면
const muteBtn = document.getElementById("mute"); //음소거 설정
const cameraBtn = document.getElementById("camera"); //화면 설정
const cameraSelect = document.getElementById("cameras"); //카메라 종류

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices(); //현재 존재하는 device가져오기
    const cameras = devices.filter((device) => device.kind === "videoinput"); //videoinput인 device만 추출
    const currentCamer = myStream.getVideoTracks()[0]; //현재 사용하는 카메라
    cameras.forEach((camera) => {
      //존재하는 카메라를 select 옵션으로 추가하기
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamer.label === camera.label) {
        //현재 사용하는 카메라와 label이 동일하다면 select 를 true로
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  //deviceid가 없을 때 사용
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  // deviceId가 있을 때 사용
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      //최초 한번만 실행하도록
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

//음소거 on/off 함수
function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
//카메라 on/off
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}
//카메라 변경시
async function handleCameraChange() {
  await getMedia(cameraSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

//Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
//Peer A는 offer를 생성
socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer); //local desc를 설정
  console.log("sent the offer");
  //서버에 offer 보내기
  socket.emit("offer", offer, roomName);
});

//Peer B는 offer 받기
socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer); //peer의 remote desc
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer); //local desc를 설정
  socket.emit("answer", answer, roomName);
});

//peer A에서 answer 받기
socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

//candidate 받기
socket.on("ice", (ice) => {
  console.log("receive candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

//candidate를 서버에 보내기
function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}
