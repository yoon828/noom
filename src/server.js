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

const handleListen = () => console.log("Listening ong http://localhost:3000");
httpServer.listen(3000, handleListen);
