const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");

// Models (require according to your project's structure)
const Job = require("../src/models/Job");
const ChatMessage = require("../src/models/ChatMessage");
const LocationTracking = require("../src/models/LocationTracking");
const Notification = require("../src/models/Notification");
const User = require("../src/models/User");

class SocketManager {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Redis adapter - optional
    if (process.env.REDIS_URL) {
      try {
        const Redis = require("ioredis");
        const redisAdapter = require("@socket.io/redis-adapter");
        const pubClient = new Redis(process.env.REDIS_URL);
        const subClient = pubClient.duplicate();
        this.io.adapter(redisAdapter(pubClient, subClient));
        console.log("✓ Socket.IO using Redis adapter");
      } catch (err) {
        console.warn("⚠️  Redis adapter not available, using memory adapter");
      }
    }

    this.initializeMiddleware();
    this.initializeHandlers();
  }

  initializeMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication token required"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.role = decoded.role;
        socket.userName = decoded.name || decoded.username || null;

        await redis.set(`socket:${socket.userId}`, socket.id, "EX", 3600);

        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });
  }

  initializeHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.userId} (${socket.id})`);

      socket.join(`user:${socket.userId}`);
      socket.join(`tenant:${socket.tenantId}`);

      this.handleJobEvents(socket);
      this.handleChatEvents(socket);
      this.handleTrackingEvents(socket);
      this.handleDisconnect(socket);
    });
  }

  handleJobEvents(socket) {
    socket.on("job:join", (jobId) => {
      socket.join(`job:${jobId}`);
      console.log(`User ${socket.userId} joined job ${jobId}`);
    });

    socket.on("job:leave", (jobId) => {
      socket.leave(`job:${jobId}`);
      console.log(`User ${socket.userId} left job ${jobId}`);
    });

    socket.on("job:status-update", async (data) => {
      const { jobId, status, location, customerId } = data;
      try {
        await Job.findByIdAndUpdate(jobId, {
          $set: { status },
          $push: {
            status_history: {
              status,
              timestamp: new Date(),
              updated_by: socket.userId,
            },
          },
        });

        this.io.to(`job:${jobId}`).emit("job:status-changed", {
          jobId,
          status,
          updatedBy: socket.userId,
          timestamp: new Date(),
        });

        if (status === "accepted" || status === "on_the_way") {
          await this.sendNotification(customerId, {
            type: `job_${status}`,
            jobId,
            title: `Job ${status.replace("_", " ")}`,
            body: `Your service provider has ${status.replace("_", " ")}`,
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to update job status" });
      }
    });
  }

  handleChatEvents(socket) {
    socket.on("chat:send", async (data) => {
      const { jobId, recipientId, messageType, content, mediaUrl } = data;
      try {
        const message = await ChatMessage.create({
          tenant_id: socket.tenantId,
          job_id: jobId,
          sender_id: socket.userId,
          sender_role: socket.role,
          recipient_id: recipientId,
          message: { type: messageType, content, media_url: mediaUrl },
          timestamp: new Date(),
        });

        const recipientSocketId = await redis.get(`socket:${recipientId}`);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("chat:message", {
            messageId: message._id,
            jobId,
            senderId: socket.userId,
            senderName: socket.userName,
            messageType,
            content,
            mediaUrl,
            timestamp: message.timestamp,
          });
        }

        this.io.to(`job:${jobId}`).emit("chat:message", {
          messageId: message._id,
          jobId,
          senderId: socket.userId,
          messageType,
          content,
          timestamp: message.timestamp,
        });

        socket.emit("chat:sent", {
          messageId: message._id,
          timestamp: message.timestamp,
        });

        if (!recipientSocketId) {
          await this.sendNotification(recipientId, {
            type: "new_message",
            jobId,
            title: `New message from ${socket.userName || "User"}`,
            body: content,
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:typing", (data) => {
      const { jobId, isTyping } = data;
      this.io
        .to(`job:${jobId}`)
        .emit("chat:typing", { userId: socket.userId, isTyping });
    });

    socket.on("chat:mark-read", async (data) => {
      const { jobId, messageIds } = data;
      try {
        await ChatMessage.updateMany(
          { _id: { $in: messageIds }, recipient_id: socket.userId },
          { $set: { read: true, read_at: new Date() } }
        );
        this.io.to(`job:${jobId}`).emit("chat:messages-read", {
          messageIds,
          readBy: socket.userId,
          readAt: new Date(),
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });
  }

  handleTrackingEvents(socket) {
    socket.on("tracking:update", async (data) => {
      const { jobId, latitude, longitude, accuracy, speed, heading, status } =
        data;
      try {
        await LocationTracking.create({
          tenant_id: socket.tenantId,
          job_id: jobId,
          provider_id: socket.userId,
          location: { type: "Point", coordinates: [longitude, latitude] },
          accuracy,
          speed,
          heading,
          status,
          timestamp: new Date(),
        });

        await redis.setex(
          `location:${jobId}`,
          300,
          JSON.stringify({
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            status,
            timestamp: new Date(),
          })
        );

        this.io.to(`job:${jobId}`).emit("tracking:location-update", {
          providerId: socket.userId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          status,
          timestamp: new Date(),
        });

        const job = await Job.findById(jobId);
        if (job && status === "on_the_way") {
          const eta = await this.calculateETA(
            { latitude, longitude },
            job.location.coordinates
          );
          this.io.to(`job:${jobId}`).emit("tracking:eta-update", {
            jobId,
            etaMinutes: eta,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    socket.on("tracking:get-location", async (data) => {
      const { jobId } = data;
      try {
        const cachedLocation = await redis.get(`location:${jobId}`);
        if (cachedLocation) {
          socket.emit("tracking:location-update", JSON.parse(cachedLocation));
          return;
        }

        const lastLocation = await LocationTracking.findOne({
          job_id: jobId,
        }).sort({ timestamp: -1 });
        if (lastLocation) {
          socket.emit("tracking:location-update", {
            latitude: lastLocation.location.coordinates[1],
            longitude: lastLocation.location.coordinates[0],
            accuracy: lastLocation.accuracy,
            speed: lastLocation.speed,
            heading: lastLocation.heading,
            status: lastLocation.status,
            timestamp: lastLocation.timestamp,
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to get location" });
      }
    });

    socket.on("tracking:start", (data) => {
      const { jobId } = data;
      socket.trackingJobId = jobId;
      socket.trackingInterval = setInterval(() => {
        socket.emit("tracking:request-location", { jobId });
      }, 10000);
    });

    socket.on("tracking:stop", () => {
      if (socket.trackingInterval) {
        clearInterval(socket.trackingInterval);
        socket.trackingInterval = null;
      }
    });
  }

  handleDisconnect(socket) {
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.userId} (${socket.id})`);

      if (socket.trackingInterval) {
        clearInterval(socket.trackingInterval);
      }

      await redis.del(`socket:${socket.userId}`);

      if (socket.role === "provider" && socket.trackingJobId) {
        await User.findByIdAndUpdate(socket.userId, {
          "availability.is_available": false,
        });
        this.io.to(`tenant:${socket.tenantId}`).emit("provider:offline", {
          providerId: socket.userId,
          timestamp: new Date(),
        });
      }
    });
  }

  async sendNotification(userId, notification) {
    const socketId = await redis.get(`socket:${userId}`);
    if (socketId) {
      this.io.to(socketId).emit("notification", notification);
    }

    await Notification.create({
      ...notification,
      user_id: userId,
      channel: "push",
      status: "sent",
    });
  }

  async calculateETA(from, to) {
    const R = 6371;
    const dLat = this.deg2rad(to[1] - from.latitude);
    const dLon = this.deg2rad(to[0] - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.latitude)) *
        Math.cos(this.deg2rad(to[1])) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const avgSpeed = 30;
    const eta = (distance / avgSpeed) * 60;
    return Math.round(eta);
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  async emitToUser(userId, event, data) {
    const socketId = await redis.get(`socket:${userId}`);
    if (socketId) this.io.to(socketId).emit(event, data);
  }

  emitToTenant(tenantId, event, data) {
    this.io.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToJob(jobId, event, data) {
    this.io.to(`job:${jobId}`).emit(event, data);
  }
}

module.exports = SocketManager;
