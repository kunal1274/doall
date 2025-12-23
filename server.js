require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/database");
const SocketManager = require("./src/socket/socket");
const { errorHandler } = require("./src/middleware/errorHandler.middleware");

// Initialize express
const app = express();
const server = http.createServer(app);

// Connect to database
connectDB();

// Initialize Socket.io
const socketManager = new SocketManager(server);
app.set("socketManager", socketManager);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
);

// API Routes
app.use("/api/v1/auth", require("./src/routes/auth.routes"));
app.use("/api/v1/jobs", require("./src/routes/job.routes"));
app.use("/api/v1/payments", require("./src/routes/payment.routes"));

// 404
app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    })
);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
