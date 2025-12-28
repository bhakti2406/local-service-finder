import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   CONNECT DB
========================= */
connectDB();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* 🔥 FIXED CORS (VERY IMPORTANT) */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://local-service-finder-2-22h0.onrender.com", // frontend
    ],
    credentials: true,
  })
);

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);

/* =========================
   SERVER + SOCKET.IO
========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://local-service-finder-2-22h0.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
