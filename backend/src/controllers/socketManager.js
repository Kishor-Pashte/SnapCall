// src/controllers/socketManager.js

import mongoose from "mongoose";
import { Server } from "socket.io";

const { connection } = mongoose;

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("SOMETHING CONNECTED");
    socket.on("join-call", (path) => {
      if (!connections[path]) connections[path] = [];
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-messages",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          return !isFound && roomValue.includes(socket.id)
            ? [roomKey, true]
            : [room, isFound];
        },
        ["", false]
      );

      if (found) {
        if (!messages[matchingRoom]) messages[matchingRoom] = [];

        messages[matchingRoom].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        connections[matchingRoom].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      const disconnectTime = Math.abs(timeOnline[socket.id] - new Date());

      for (const [key, users] of Object.entries(connections)) {
        const index = users.indexOf(socket.id);
        if (index !== -1) {
          users.splice(index, 1);
          users.forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          if (users.length === 0) delete connections[key];
        }
      }
    });
  });

  return io;
};
