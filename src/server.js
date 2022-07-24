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
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

//publicRoom을 반환하는 함수
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";

  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });

  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    //하나의 socket에만 메시지 보내기
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    //모든 socket에 메시지 보내기
    wsServer.sockets.emit("room_change", publicRooms());
  });

  //방에서 나가기 바로 직전에 실행된다. 아직 방에서 나가지는 않은 상태
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  //방에서 나간 상태
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

// // http서버 위에 wss만들기
// const wss = new WebSocket.Server({ server }); //webSocket 서버 + http 서버를 합쳐서 하나의 포트를 사용하기 위해서
// const sockets = [];
// wss.on("connection", (socket) => {
//   //socket : 연결된 브라우저

//   //연결된 브라우저들을 sockets 배열에 넣어주기
//   sockets.push(socket);
//   socket["nickname"] = "Anon"; //닉네임을 설정하지 않은 경우
//   console.log("Connected to browser ✅");
//   //브라우저와 연결 종료
//   socket.on("close", () => {
//     console.log("Disconnected from the Browser ❌");
//   });

//   //브라우저에서 메세지 받기
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname} : ${message.payload}`)
//         );
//       case "nickname":
//         //socket 객체에 nickname을 추가
//         socket["nickname"] = message.payload;
//     }
//   });

//   //브라우저에 메시지 보내기
//   // socket.send("hello");
// });

const handleListen = () => console.log("Listening ong http://localhost:3000");
httpServer.listen(3000, handleListen);
