// src/db/migrate.js
// Runs once to create all tables. Re-run safely (IF NOT EXISTS).

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : "./data");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(process.env.DB_PATH || "./data/dealdekho.db");

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  -- ── PRODUCTS ────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    category      TEXT    NOT NULL,
    subcategory   TEXT,
    image_url     TEXT,
    emoji         TEXT    DEFAULT '🛍️',
    amazon_asin   TEXT    UNIQUE,          -- Amazon product ID
    flipkart_pid  TEXT    UNIQUE,          -- Flipkart product ID
    amazon_url    TEXT,
    flipkart_url  TEXT,
    listed_date   TEXT,                   -- First time we saw this product
    is_active     INTEGER DEFAULT 1,
    created_at    TEXT    DEFAULT (datetime('now')),
    updated_at    TEXT    DEFAULT (datetime('now'))
  );

  -- ── PRICE SNAPSHOTS (history) ───────────────────────────────────────────────
  -- One row per (product, platform, scrape_time)
  -- This is the core of the value-for-money analysis
  CREATE TABLE IF NOT EXISTS price_snapshots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform      TEXT    NOT NULL CHECK(platform IN ('amazon', 'flipkart')),
    price         REAL    NOT NULL,
    mrp           REAL    NOT NULL,
    rating        REAL,
    review_count  INTEGER,
    in_stock      INTEGER DEFAULT 1,
    scraped_at    TEXT    DEFAULT (datetime('now'))
  );

  -- ── CURRENT PRICES (materialized view updated after each scrape) ────────────
  -- Fast lookup: latest price per product per platform
  CREATE TABLE IF NOT EXISTS current_prices (
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform      TEXT    NOT NULL CHECK(platform IN ('amazon', 'flipkart')),
    price         REAL    NOT NULL,
    mrp           REAL    NOT NULL,
    rating        REAL,
    review_count  INTEGER,
    in_stock      INTEGER DEFAULT 1,
    updated_at    TEXT    DEFAULT (datetime('now')),
    PRIMARY KEY (product_id, platform)
  );

  -- ── SCRAPE LOG ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS scrape_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    platform      TEXT    NOT NULL,
    status        TEXT    NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
    products_ok   INTEGER DEFAULT 0,
    products_fail INTEGER DEFAULT 0,
    duration_ms   INTEGER,
    error_msg     TEXT,
    started_at    TEXT    DEFAULT (datetime('now'))
  );

  -- ── INDEXES ─────────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_snapshots_product_platform
    ON price_snapshots(product_id, platform, scraped_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category, is_active);

  CREATE INDEX IF NOT EXISTS idx_current_prices_product
    ON current_prices(product_id);
`);

console.log("✅ Database migrated successfully →", process.env.DB_PATH || "./data/dealdekho.db");
db.close();

export default db;
