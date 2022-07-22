//socket : 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);

//서버와 연결
socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

//메시지
socket.addEventListener("message", (message) => {
  console.log("New message : ", message.data, "from the Server");
});

//서버 연결 종료
socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

setTimeout(() => {
  socket.send("hello from the browser!");
}, 5000);
