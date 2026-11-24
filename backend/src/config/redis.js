import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 500, 5000);
      },
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 500, 5000);
      },
    });

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

export default redis;
