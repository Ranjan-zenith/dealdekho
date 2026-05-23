// src/scrapers/amazon.js
// Scrapes Amazon India product pages for price, MRP, rating, stock status.
// Uses Playwright (headless Chromium) to handle JS-rendered pages.

import { chromium } from "playwright";
import UserAgent from "user-agents";
import { logger } from "../utils/logger.js";
import { sleep, randomBetween } from "../utils/helpers.js";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.amazon.in";
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "3000");

/**
 * Scrape a single Amazon product by ASIN or URL.
 * Returns normalized product data or null on failure.
 *
 * @param {object} options
 * @param {string} options.asin   - Amazon Standard Identification Number
 * @param {string} [options.url]  - Full product URL (if no ASIN)
 * @param {object} options.page   - Playwright Page instance (pass for reuse)
 */
export async function scrapeAmazonProduct({ asin, url, page }) {
  const productUrl = url || `${BASE_URL}/dp/${asin}`;

  try {
    await page.goto(productUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Random delay to mimic human behavior
    await sleep(randomBetween(800, 2000));

    // ── Check for CAPTCHA / bot detection ───────────────────────────────────
    const isCaptcha = await page.$('form[action="/errors/validateCaptcha"]');
    if (isCaptcha) {
      logger.warn(`[Amazon] CAPTCHA hit for ASIN ${asin}. Skipping.`);
      return null;
    }

    // ── Extract price data ───────────────────────────────────────────────────
    const data = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.textContent?.trim() || null;

      const getAttr = (selector, attr) =>
        document.querySelector(selector)?.getAttribute(attr) || null;

      // Product title
      const name =
        getText("#productTitle") ||
        getText("h1.a-size-large");

      // Current (offer) price — Amazon uses multiple selectors depending on product type
      const priceSelectors = [
        ".a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen",
        ".a-price[data-a-color='price'] .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        "#price_inside_buybox",
        ".a-price .a-offscreen",
      ];
      let priceText = null;
      for (const sel of priceSelectors) {
        priceText = document.querySelector(sel)?.textContent?.trim();
        if (priceText) break;
      }

      // MRP / Was price
      const mrpSelectors = [
        ".a-text-price .a-offscreen",
        "#priceblock_listprice",
        ".basisPrice .a-offscreen",
        '[data-a-strike="true"] .a-offscreen',
      ];
      let mrpText = null;
      for (const sel of mrpSelectors) {
        const el = document.querySelector(sel);
        if (el) { mrpText = el.textContent.trim(); break; }
      }

      // Rating and reviews
      const ratingText = getText("#acrPopover")?.match(/[\d.]+/)?.[0];
      const reviewCountText = getText("#acrCustomerReviewText")?.replace(/[^0-9]/g, "");

      // Stock status
      const addToCartBtn = document.querySelector("#add-to-cart-button");
      const outOfStock = document.querySelector("#availability .a-color-price");
      const inStock = !!addToCartBtn && !outOfStock?.textContent?.toLowerCase().includes("unavailable");

      // Product image
      const imageUrl =
        getAttr("#landingImage", "src") ||
        getAttr("#imgTagWrapperId img", "src");

      return { name, priceText, mrpText, ratingText, reviewCountText, inStock, imageUrl };
    });

    if (!data.priceText) {
      logger.warn(`[Amazon] No price found for ASIN ${asin}`);
      return null;
    }

    // ── Normalize price strings ──────────────────────────────────────────────
    const parsePrice = (str) => {
      if (!str) return null;
      return parseFloat(str.replace(/[^0-9.]/g, "")) || null;
    };

    const price = parsePrice(data.priceText);
    const mrp = parsePrice(data.mrpText) || price; // fallback MRP = price if not found

    if (!price) return null;

    return {
      platform: "amazon",
      asin,
      url: productUrl,
      name: data.name,
      price,
      mrp,
      rating: data.ratingText ? parseFloat(data.ratingText) : null,
      reviewCount: data.reviewCountText ? parseInt(data.reviewCountText) : null,
      inStock: data.inStock,
      imageUrl: data.imageUrl,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error(`[Amazon] Error scraping ASIN ${asin}: ${err.message}`);
    return null;
  }
}

/**
 * Scrape multiple Amazon products.
 * Manages a single browser session for efficiency.
 *
 * @param {Array<{asin: string, url?: string}>} products
 * @returns {Array} results
 */
export async function scrapeAmazonBatch(products) {
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
    // Create a fresh context with realistic settings
    const context = await browser.newContext({
      userAgent: new UserAgent({ deviceCategory: "desktop" }).toString(),
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      geolocation: { latitude: 28.6139, longitude: 77.209 }, // New Delhi
      permissions: ["geolocation"],
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    // Block images/fonts to speed up scraping
    await context.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}", (route) =>
      route.abort()
    );

    const page = await context.newPage();

    // Remove Playwright fingerprints
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    // Set Amazon India cookies (helps avoid bot detection)
    await context.addCookies([
      { name: "i18n-prefs", value: "INR", domain: ".amazon.in", path: "/" },
      { name: "lc-acbin", value: "en_IN", domain: ".amazon.in", path: "/" },
    ]);

    for (const product of products) {
      logger.info(`[Amazon] Scraping: ${product.asin}`);
      const result = await scrapeAmazonProduct({ ...product, page });
      if (result) results.push(result);
      await sleep(DELAY_MS + randomBetween(0, 1000));
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return results;
}
