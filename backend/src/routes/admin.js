// src/routes/admin.js
// Admin endpoints: trigger scrape, view logs, stats

import { Router } from "express";
import db from "../db/index.js";
import { runScrapeJob } from "../jobs/scrapeAll.js";
import { logger } from "../utils/logger.js";

const router = Router();

// ── POST /api/admin/scrape ─────────────────────────────────────────────────
// Manually trigger a scrape run (useful for testing/CI)
router.post("/scrape", async (req, res) => {
  logger.info("[Admin] Manual scrape triggered via API");
  try {
    // Run async, return immediately so request doesn't time out
    const result = await runScrapeJob();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/admin/logs ────────────────────────────────────────────────────
router.get("/logs", (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM scrape_log ORDER BY started_at DESC LIMIT 50
  `).all();
  res.json({ success: true, data: logs });
});

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  const productCount = db.prepare(`SELECT COUNT(*) as n FROM products WHERE is_active = 1`).get().n;
  const priceCount = db.prepare(`SELECT COUNT(*) as n FROM price_snapshots`).get().n;
  const lastScrape = db.prepare(`SELECT * FROM scrape_log ORDER BY started_at DESC LIMIT 1`).get();
  const categories = db.prepare(`SELECT category, COUNT(*) as n FROM products WHERE is_active = 1 GROUP BY category`).all();

  res.json({
    success: true,
    data: {
      productCount,
      priceSnapshotCount: priceCount,
      lastScrape,
      categories,
    },
  });
});

export default router;
