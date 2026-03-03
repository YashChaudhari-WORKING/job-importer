const app = require("./src/app");
const connectDB = require("./src/config/db");
const { startWorker, stopWorker } = require("./src/queues/importWorker");
const { startCron, stopCron } = require("./src/cron/scheduler");
const env = require("./src/config/env");

const start = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start Express server
  const server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });

  // Start BullMQ worker
  startWorker();

  // Start cron scheduler
  startCron();

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    stopCron();
    await stopWorker();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
