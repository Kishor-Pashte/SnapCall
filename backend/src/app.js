import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import { Server } from "socket.io"; // (not directly used here but optional)
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

// Initialize Socket.io with the server
connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.get("/", (req, res) => {
  res.send("🎉 Welcome to ApnaVideoCall Backend API!");
});

// User-related API routes
app.use("/api/v1/users", userRoutes);

// MongoDB Connection and Server Start
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(
      "mongodb+srv://k24145798:CoderKishor123@cluster0.xgznqti.mongodb.net/"
    );
    console.log(`MONGO Connected: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

start();
