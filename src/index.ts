import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import ioconnection from "./ioconnection";

const originList = [
  "chrome-extension://pldibipgckolnegeiigfekiebjlmopjm",
  "https://192.168.0.102:8080",
  "https://192.168.1.102:8080",
  "https://25.65.222.22:8080",
];

const app = express();
app.use(express.json());
app.use(cors({ origin: originList }));
const server = createServer(app);
const io = new SocketServer(server, { cors: { origin: originList } });
io.on("connection", ioconnection);

import { router as AuthRouter } from "./auth";
import { router as PasswordsRouter } from "./passwords";
app.use("/auth", AuthRouter);
app.use("/passwords", PasswordsRouter);

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
