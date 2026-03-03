require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/job-importer",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "super-secret-key-change-in-production",
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 50,
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY) || 3,
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || "0 */1 * * *",
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
