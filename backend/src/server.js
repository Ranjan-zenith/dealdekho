// src/server.js
// DealDekho Backend — Express API server + cron scheduler

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import productsRouter from "./routes/products.js";
import adminRouter from "./routes/admin.js";
import { runScrapeJob } from "./jobs/scrapeAll.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Performance Middleware ─────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(express.json());

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  message: { success: false, error: "Too many requests" },
}));

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/products", productsRouter);
app.use("/api/admin",    adminRouter);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 DealDekho API running on http://localhost:${PORT}`);
  logger.info(`   Allowed origins: ${allowedOrigins.join(", ")}`);
});

// ── Cron Scheduler ────────────────────────────────────────────────────────
// Default: every 6 hours. Change SCRAPE_CRON in .env
const cronSchedule = process.env.SCRAPE_CRON || "0 */6 * * *";

if (process.env.NODE_ENV !== "test") {
  cron.schedule(cronSchedule, () => {
    logger.info(`⏰ Cron triggered scrape job (schedule: ${cronSchedule})`);
    runScrapeJob().catch(e => logger.error("Cron scrape error:", e.message));
  });

  logger.info(`⏰ Scraper scheduled: ${cronSchedule}`);
}

export default app;
