import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import ioconnection from "./ioconnection";

const app = express();
const server = createServer(app);
const io = new SocketServer(server);
io.on("connection", ioconnection);

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
