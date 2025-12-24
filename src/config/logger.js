const winston = require("winston");
const path = require("path");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which logs to show based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "info";
};

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/error.log"),
    level: "error",
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/combined.log"),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helper methods for common logging patterns
logger.logRequest = (req, message = "Request received") => {
  logger.info(`${message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
};

logger.logError = (error, context = "") => {
  const errorMessage = error.stack || error.message || error;
  logger.error(`${context ? context + " - " : ""}${errorMessage}`);
};

logger.logUserAction = (userId, action, details = {}) => {
  logger.info(`User ${userId} - ${action} - ${JSON.stringify(details)}`);
};

logger.logApiCall = (endpoint, method, userId, status) => {
  logger.info(`API: ${method} ${endpoint} - User: ${userId} - Status: ${status}`);
};

module.exports = logger;
