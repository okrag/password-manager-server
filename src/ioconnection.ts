import { Socket } from "socket.io";
import { checkScannerToken, checkToken } from "./auth";

export default (socket: Socket) => {
  socket.on("token", async (token) => {
    if (typeof token !== "string") {
      socket.emit("tokenValidity", false);
      socket.disconnect();
      return;
    }
    const clientId = await checkToken(token);
    if (!clientId) {
      socket.emit("tokenValidity", false);
      socket.disconnect();
      return;
    }
    socket.emit("tokenValidity", true);
    socket.join(clientId);
  });
  socket.on("scannerToken", async (token) => {
    if (typeof token !== "string") {
      socket.emit("tokenValidity", false);
      socket.disconnect();
      return;
    }
    const clientId = await checkScannerToken(token);
    if (!clientId) {
      socket.emit("tokenValidity", false);
      socket.disconnect();
      return;
    }
    socket.emit("tokenValidity", true);
    socket.on("scan", (value: string) => {
      socket.to(clientId).emit("scan", value);
    });
  });
};
