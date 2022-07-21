import express from "express";

const app = express();

app.set('view engine', "pug");

const handleListen = () => console.log("Listening ong http://localhost:3000");

app.listen(3000, handleListen)