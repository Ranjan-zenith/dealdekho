// src/scrapers/flipkart.js
// Scrapes Flipkart product pages for price, MRP, rating, stock.
// Flipkart uses React SSR — most data is in __NEXT_DATA__ or visible HTML.

import { chromium } from "playwright";
import UserAgent from "user-agents";
import { logger } from "../utils/logger.js";
import { sleep, randomBetween } from "../utils/helpers.js";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.flipkart.com";
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "3000");

/**
 * Scrape a single Flipkart product by URL or PID.
 *
 * @param {object} options
 * @param {string} options.pid   - Flipkart Product ID (e.g. MOBJ5FYGW3FVZSXX)
 * @param {string} [options.url] - Full product URL
 * @param {object} options.page  - Playwright Page instance
 */
export async function scrapeFlipkartProduct({ pid, url, page }) {
  const productUrl = url || `${BASE_URL}/p/${pid}`;

  try {
    await page.goto(productUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await sleep(randomBetween(800, 1800));

    // ── Handle login popup (dismiss if present) ──────────────────────────────
    const closeBtn = await page.$("button._2KpZ6l._2doB4z");
    if (closeBtn) await closeBtn.click();

    // ── Try to extract from __NEXT_DATA__ first (most reliable) ─────────────
    const nextData = await page.evaluate(() => {
      try {
        const el = document.querySelector("#__NEXT_DATA__");
        if (el) return JSON.parse(el.textContent);
      } catch { return null; }
      return null;
    });

    // ── Fallback: scrape from DOM ────────────────────────────────────────────
    const domData = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.textContent?.trim() || null;

      // Product name
      const name =
        getText(".B_NuCI") ||             // most products
        getText("h1._35KyD6 span") ||     // some variants
        getText("h1.yhB1nd");

      // Current price — Flipkart has different layouts per category
      const priceSelectors = [
        "._30jeq3._16Jk6d",   // standard "special price"
        "._30jeq3",            // general price
        ".CEmiEU ._30jeq3",    // fashion
        "._25b18c ._30jeq3",   // some electronics
      ];
      let priceText = null;
      for (const sel of priceSelectors) {
        priceText = document.querySelector(sel)?.textContent?.trim();
        if (priceText) break;
      }

      // MRP
      const mrpSelectors = [
        "._3I9_wc._2p6lqe",   // struck-through MRP
        "._3I9_wc",
        ".CAlfwX",
      ];
      let mrpText = null;
      for (const sel of mrpSelectors) {
        mrpText = document.querySelector(sel)?.textContent?.trim();
        if (mrpText) break;
      }

      // Rating
      const ratingText = getText("._3LWZlK") || getText("div._1lRcqv span");

      // Review count
      const reviewText = getText("._2_R_DZ span") || getText("span._13vcmD");

      // Stock: look for "Add to Cart" or "Buy Now" button
      const addToCart = document.querySelector("._2KpZ6l._2U9uOA");
      const buyNow = document.querySelector("._2KpZ6l.WQGjeb");
      const soldOut = document.querySelector("._1dVbu9");
      const inStock = (!!addToCart || !!buyNow) && !soldOut;

      // Image
      const imageUrl =
        document.querySelector("._396cs4._2amPTt._3qGmMb")?.getAttribute("src") ||
        document.querySelector("img._396cs4")?.getAttribute("src");

      return { name, priceText, mrpText, ratingText, reviewText, inStock, imageUrl };
    });

    if (!domData.priceText && !nextData) {
      logger.warn(`[Flipkart] No price found for PID ${pid}`);
      return null;
    }

    // ── Normalize ────────────────────────────────────────────────────────────
    const parsePrice = (str) => {
      if (!str) return null;
      return parseFloat(str.replace(/[^0-9.]/g, "")) || null;
    };

    const parseReviews = (str) => {
      if (!str) return null;
      const n = str.replace(/[^0-9]/g, "");
      return n ? parseInt(n) : null;
    };

    const price = parsePrice(domData.priceText);
    const mrp = parsePrice(domData.mrpText) || price;

    if (!price) return null;

    return {
      platform: "flipkart",
      pid,
      url: productUrl,
      name: domData.name,
      price,
      mrp,
      rating: domData.ratingText ? parseFloat(domData.ratingText) : null,
      reviewCount: parseReviews(domData.reviewText),
      inStock: domData.inStock,
      imageUrl: domData.imageUrl,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error(`[Flipkart] Error scraping PID ${pid}: ${err.message}`);
    return null;
  }
}

/**
 * Scrape multiple Flipkart products in one browser session.
 *
 * @param {Array<{pid: string, url?: string}>} products
 * @returns {Array} results
 */
export async function scrapeFlipkartBatch(products) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const results = [];

  try {
    const context = await browser.newContext({
      userAgent: new UserAgent({ deviceCategory: "desktop" }).toString(),
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        "Accept-Language": "en-IN,en;q=0.9",
      },
    });

    // Block heavy assets
    await context.route("**/*.{png,jpg,jpeg,gif,webp,woff,woff2,ttf}", (route) =>
      route.abort()
    );

    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    for (const product of products) {
      logger.info(`[Flipkart] Scraping: ${product.pid}`);
      const result = await scrapeFlipkartProduct({ ...product, page });
      if (result) results.push(result);
      await sleep(DELAY_MS + randomBetween(0, 1500));
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return results;
}
