// src/jobs/scrapeAll.js
// Orchestrates scraping both Amazon and Flipkart for all active products.
// Called by the cron scheduler and can also be run manually:
//   node src/jobs/scrapeAll.js

import db from "../db/index.js";
import { scrapeAmazonBatch } from "../scrapers/amazon.js";
import { scrapeFlipkartBatch } from "../scrapers/flipkart.js";
import { logger } from "../utils/logger.js";
import pLimit from "p-limit";

const CONCURRENCY = parseInt(process.env.SCRAPE_CONCURRENCY || "2");

/**
 * Save scraped results to the DB:
 * 1. Insert into price_snapshots (history)
 * 2. Upsert into current_prices (latest)
 */
function saveResults(results) {
  const insertSnapshot = db.prepare(`
    INSERT INTO price_snapshots (product_id, platform, price, mrp, rating, review_count, in_stock)
    VALUES (@productId, @platform, @price, @mrp, @rating, @reviewCount, @inStock)
  `);

  const upsertCurrent = db.prepare(`
    INSERT INTO current_prices (product_id, platform, price, mrp, rating, review_count, in_stock, updated_at)
    VALUES (@productId, @platform, @price, @mrp, @rating, @reviewCount, @inStock, datetime('now'))
    ON CONFLICT(product_id, platform) DO UPDATE SET
      price        = excluded.price,
      mrp          = excluded.mrp,
      rating       = excluded.rating,
      review_count = excluded.review_count,
      in_stock     = excluded.in_stock,
      updated_at   = excluded.updated_at
  `);

  const updateProduct = db.prepare(`
    UPDATE products SET updated_at = datetime('now') WHERE id = ?
  `);

  const saveMany = db.transaction((rows) => {
    for (const row of rows) {
      insertSnapshot.run(row);
      upsertCurrent.run(row);
      updateProduct.run(row.productId);
    }
  });

  saveMany(results);
}

/**
 * Main scrape job.
 * Fetches all active products from DB, scrapes both platforms,
 * saves results, and logs the run.
 */
export async function runScrapeJob() {
  const startedAt = Date.now();
  logger.info("🚀 Starting scrape job...");

  // ── Load active products ───────────────────────────────────────────────────
  const products = db.prepare(`
    SELECT id, name, amazon_asin, amazon_url, flipkart_pid, flipkart_url
    FROM products
    WHERE is_active = 1
  `).all();

  if (!products.length) {
    logger.warn("No active products in DB. Add products via the admin API or seed script.");
    return;
  }

  logger.info(`📦 Scraping ${products.length} products from both platforms`);

  // ── Split into platform batches ────────────────────────────────────────────
  const amazonProducts = products
    .filter(p => p.amazon_asin || p.amazon_url)
    .map(p => ({ productId: p.id, asin: p.amazon_asin, url: p.amazon_url }));

  const flipkartProducts = products
    .filter(p => p.flipkart_pid || p.flipkart_url)
    .map(p => ({ productId: p.id, pid: p.flipkart_pid, url: p.flipkart_url }));

  // ── Scrape with concurrency limit ─────────────────────────────────────────
  const limit = pLimit(CONCURRENCY);
  let amazonOk = 0, amazonFail = 0;
  let flipkartOk = 0, flipkartFail = 0;

  const [amazonResults, flipkartResults] = await Promise.all([
    limit(() => scrapeAmazonBatch(amazonProducts).catch(e => {
      logger.error("[Job] Amazon batch failed:", e.message);
      return [];
    })),
    limit(() => scrapeFlipkartBatch(flipkartProducts).catch(e => {
      logger.error("[Job] Flipkart batch failed:", e.message);
      return [];
    })),
  ]);

  // ── Map results back to product IDs ───────────────────────────────────────
  const toSave = [];

  for (const result of amazonResults) {
    const product = amazonProducts.find(
      p => p.asin === result.asin || p.url === result.url
    );
    if (product && result.price) {
      toSave.push({
        productId: product.productId,
        platform: "amazon",
        price: result.price,
        mrp: result.mrp,
        rating: result.rating,
        reviewCount: result.reviewCount,
        inStock: result.inStock ? 1 : 0,
      });
      amazonOk++;
    } else {
      amazonFail++;
    }
  }

  for (const result of flipkartResults) {
    const product = flipkartProducts.find(
      p => p.pid === result.pid || p.url === result.url
    );
    if (product && result.price) {
      toSave.push({
        productId: product.productId,
        platform: "flipkart",
        price: result.price,
        mrp: result.mrp,
        rating: result.rating,
        reviewCount: result.reviewCount,
        inStock: result.inStock ? 1 : 0,
      });
      flipkartOk++;
    } else {
      flipkartFail++;
    }
  }

  // ── Save to DB ─────────────────────────────────────────────────────────────
  if (toSave.length) {
    try {
      saveResults(toSave);
      logger.info(`💾 Saved ${toSave.length} price snapshots to DB`);
    } catch (err) {
      logger.error("DB save error:", err.message);
    }
  }

  const duration = Date.now() - startedAt;
  const totalOk = amazonOk + flipkartOk;
  const totalFail = amazonFail + flipkartFail;
  const status = totalFail === 0 ? "success" : totalOk === 0 ? "failed" : "partial";

  // ── Log the run ───────────────────────────────────────────────────────────
  db.prepare(`
    INSERT INTO scrape_log (platform, status, products_ok, products_fail, duration_ms)
    VALUES (?, ?, ?, ?, ?)
  `).run("all", status, totalOk, totalFail, duration);

  logger.info(`✅ Scrape job done in ${(duration / 1000).toFixed(1)}s — OK: ${totalOk}, Failed: ${totalFail}`);

  return { status, totalOk, totalFail, duration };
}

// ── Allow direct execution ─────────────────────────────────────────────────
if (process.argv[1].endsWith("scrapeAll.js")) {
  runScrapeJob()
    .then(() => process.exit(0))
    .catch(e => { logger.error(e); process.exit(1); });
}
