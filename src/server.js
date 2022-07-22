import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
//어떤 경로를 들어와도 항상 /로 리다이렉트
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening ong http://localhost:3000");

const server = http.createServer(app); //http 서버
// http서버 위에 wss만들기
const wss = new WebSocket.Server({ server }); //webSocket 서버 + http 서버를 합쳐서 하나의 포트를 사용하기 위해서

wss.on("connection", (socket) => {
  //socket : 연결된 브라우저
  console.log("Connected to browser ✅");
  console.log(socket);
  //브라우저와 연결 종료
  socket.on("close", () => {
    console.log("Disconnected from the Browser ❌");
  });

  //브라우저에서 메세지 받기
  socket.on("message", (message) => {
    console.log(message.toString());
  });

  //브라우저에 메시지 보내기
  socket.send("hello");
});

server.listen(3000, handleListen);
