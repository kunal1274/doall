const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:11200", {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      console.warn(
        "⚠️  Redis connection failed after 3 retries. Caching will be disabled."
      );
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("✓ Redis connected on port 11200");
});

redis.on("error", (err) => {
  if (err.code === "ECONNREFUSED") {
    console.warn(
      "⚠️  Redis not available. Run 'docker-compose up -d redis' or update REDIS_URL in .env"
    );
  } else {
    console.error("Redis error:", err.message);
  }
});

// Attempt connection (non-blocking)
redis.connect().catch(() => {
  console.warn(
    "⚠️  Redis connection skipped. Application will run without caching."
  );
});

module.exports = redis;
