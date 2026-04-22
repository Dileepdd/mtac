import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info("server.started", { port: env.PORT });
    });
  } catch (error) {
    logger.error("server.start_failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
