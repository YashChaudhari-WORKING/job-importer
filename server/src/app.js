const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");

// Routes
const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");
const importLogRoutes = require("./routes/importLogRoutes");
const jobRoutes = require("./routes/jobRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// --- Middleware ---
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/feeds", feedRoutes);
app.use("/api/imports", importLogRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Cron status endpoint
app.get("/api/cron-status", (req, res) => {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setMinutes(0, 0, 0);
  nextRun.setHours(nextRun.getHours() + 1);
  res.json({
    schedule: env.CRON_SCHEDULE,
    nextRun: nextRun.toISOString(),
    serverTime: now.toISOString(),
  });
});

// --- Error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
