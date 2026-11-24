import "dotenv/config";

import app from "./src/app.js";
import connectDB from "./db/db.js";
import redis from "./src/config/redis.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    await redis.ping();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down server...`);

      server.close(async () => {
        try {
          await redis.quit();
          console.log("Redis connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
