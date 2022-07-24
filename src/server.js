import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
//어떤 경로를 들어와도 항상 /로 리다이렉트
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app); //http 서버
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  //peer A에서 보낸 offer 받아서 Peer B에게 offer 보내기
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  //peer B에게 받은 answer을 방에있는 모든 사람들에게 보내기
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  //받은 ice를 보내기
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log("Listening ong http://localhost:3000");
httpServer.listen(3000, handleListen);
