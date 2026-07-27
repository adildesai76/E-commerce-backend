import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
  console.log("Socket initialized");

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.2.28:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (!userId) return;

      socket.join(userId.toString());

      console.log(
        `User ${userId} joined room ${userId}`,
      );
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}`,
      );
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized.",
    );
  }

  return io;
};

export const emitNotification = (
  userId,
  notification,
) => {
  if (!io) return;

  io.to(userId.toString()).emit(
    "notification",
    notification,
  );
};