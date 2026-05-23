// src/routes/products.js
// REST API endpoints for the frontend.

import { Router } from "express";
import db from "../db/index.js";
import { analyzeProduct, computeSummaryStats } from "../utils/analysis.js";

const router = Router();

// ── Helper: build full analyzed product object ─────────────────────────────
function buildProduct(product) {
  const amazonPrice = db.prepare(`
    SELECT * FROM current_prices WHERE product_id = ? AND platform = 'amazon'
  `).get(product.id);

  const flipkartPrice = db.prepare(`
    SELECT * FROM current_prices WHERE product_id = ? AND platform = 'flipkart'
  `).get(product.id);

  // Price history (last 30 days, both platforms)
  const priceHistory = db.prepare(`
    SELECT platform, price, scraped_at FROM price_snapshots
    WHERE product_id = ?
      AND scraped_at >= datetime('now', '-30 days')
    ORDER BY scraped_at DESC
    LIMIT 60
  `).all(product.id);

  const analysis = analyzeProduct(product, amazonPrice, flipkartPrice, priceHistory);

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory,
    emoji: product.emoji,
    imageUrl: product.image_url,
    amazonUrl: product.amazon_url,
    flipkartUrl: product.flipkart_url,
    listedDate: product.listed_date,
    analysis,
    priceHistory: priceHistory.map(h => ({
      platform: h.platform,
      price: h.price,
      date: h.scraped_at,
    })),
  };
}

// ── GET /api/products ───────────────────────────────────────────────────────
// Query params:
//   category    - filter by category
//   q           - search query
//   sort        - savings_desc | discount_desc | value_score | price_asc | price_desc
//   valueFilter - all | excellent | good | poor_value
//   page        - pagination (default 1)
//   limit       - per page (default 20, max 100)

router.get("/", (req, res) => {
  const {
    category,
    q,
    sort = "savings_desc",
    valueFilter = "all",
    page = 1,
    limit: limitParam = 20,
  } = req.query;

  const limit = Math.min(parseInt(limitParam), 100);
  const offset = (parseInt(page) - 1) * limit;

  // ── Base product query ─────────────────────────────────────────────────────
  let sql = `SELECT * FROM products WHERE is_active = 1`;
  const params = [];

  if (category && category !== "All") {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (q) {
    sql += ` AND name LIKE ?`;
    params.push(`%${q}%`);
  }

  const products = db.prepare(sql).all(...params);

  // ── Analyze all products ───────────────────────────────────────────────────
  let analyzed = products
    .map(buildProduct)
    .filter(p => p.analysis); // skip products with no price data

  // ── Value filter ───────────────────────────────────────────────────────────
  if (valueFilter === "excellent") {
    analyzed = analyzed.filter(p => p.analysis.valueScore === "excellent");
  } else if (valueFilter === "good") {
    analyzed = analyzed.filter(p => ["excellent", "good"].includes(p.analysis.valueScore));
  } else if (valueFilter === "poor_value") {
    analyzed = analyzed.filter(p => ["poor", "overpriced"].includes(p.analysis.valueScore));
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  const VALUE_ORDER = ["excellent", "good", "average", "poor", "overpriced"];

  analyzed.sort((a, b) => {
    const aa = a.analysis, ba = b.analysis;
    switch (sort) {
      case "savings_desc":  return ba.saving - aa.saving;
      case "discount_desc": return ba.discountPct - aa.discountPct;
      case "price_asc":     return aa.cheapestPrice - ba.cheapestPrice;
      case "price_desc":    return ba.cheapestPrice - aa.cheapestPrice;
      case "value_score":   return VALUE_ORDER.indexOf(aa.valueScore) - VALUE_ORDER.indexOf(ba.valueScore);
      default:              return ba.saving - aa.saving;
    }
  });

  const total = analyzed.length;
  const paginated = analyzed.slice(offset, offset + limit);
  const summary = computeSummaryStats(analyzed);

  res.json({
    success: true,
    data: paginated,
    summary,
    pagination: {
      total,
      page: parseInt(page),
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// ── GET /api/products/categories ───────────────────────────────────────────
router.get("/categories", (req, res) => {
  const rows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM products WHERE is_active = 1
    GROUP BY category ORDER BY count DESC
  `).all();

  res.json({ success: true, data: rows });
});

// ── GET /api/products/:id ──────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const product = db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  res.json({ success: true, data: buildProduct(product) });
});

// ── POST /api/products ─────────────────────────────────────────────────────
// Add a new product to track.
// Body: { name, category, subcategory?, emoji?, amazonAsin?, amazonUrl?, flipkartPid?, flipkartUrl? }

router.post("/", (req, res) => {
  const {
    name, category, subcategory, emoji = "🛍️",
    imageUrl, amazonAsin, amazonUrl, flipkartPid, flipkartUrl,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, error: "name and category are required" });
  }

  if (!amazonAsin && !amazonUrl && !flipkartPid && !flipkartUrl) {
    return res.status(400).json({
      success: false,
      error: "At least one of amazonAsin, amazonUrl, flipkartPid, or flipkartUrl is required",
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO products (name, category, subcategory, emoji, image_url, amazon_asin, amazon_url, flipkart_pid, flipkart_url, listed_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
    `).run(name, category, subcategory || null, emoji, imageUrl || null,
      amazonAsin || null, amazonUrl || null, flipkartPid || null, flipkartUrl || null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ success: false, error: "Product with this ASIN/PID already exists" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/products/:id ───────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  db.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

export default router;
