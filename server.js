require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
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

// Security middleware - Modified for PWA
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:11100",
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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

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
app.use("/api/v1/users", require("./src/routes/user.routes"));
app.use("/api/v1/services", require("./src/routes/service.routes"));
app.use("/api/v1/jobs", require("./src/routes/job.routes"));
app.use("/api/v1/payments", require("./src/routes/payment.routes"));
app.use("/api/v1/pricing", require("./src/routes/pricing.routes"));
app.use("/api/v1/promo-codes", require("./src/routes/promoCode.routes"));
app.use("/api/v1/admin", require("./src/routes/admin.routes"));
app.use("/api/v1/tracking", require("./src/routes/tracking.routes"));
app.use("/api/v1/chat", require("./src/routes/chat.routes"));
app.use("/api/v1/geo", require("./src/routes/geo.routes"));

// Driver Bulaao Service Routes
app.use(
  "/api/v1/driver-service/dispatcher",
  require("./src/routes/dispatcher.routes")
);
app.use(
  "/api/v1/driver-service/drivers",
  require("./src/routes/driverService.routes")
);
app.use(
  "/api/v1/driver-service/customer",
  require("./src/routes/customerDriver.routes")
);

// Serve index.html for all non-API routes (SPA support)
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 for API routes only
app.use("/api/*", (req, res) =>
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "API route not found" },
  })
);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 11000;
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
