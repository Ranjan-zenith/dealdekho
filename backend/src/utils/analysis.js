// src/utils/analysis.js
// Core value-for-money analysis engine.
// This is what makes DealDekho different from a plain price comparison —
// it detects "stale discounts" where the listed price hasn't meaningfully
// dropped since the product was first listed.

/**
 * VALUE SCORE TIERS
 *
 * excellent  → Great discount AND good relative to product age
 * good       → Decent discount, reasonable for its age
 * average    → Mediocre discount or product is old with little price movement
 * poor       → Product has been around a long time, discount is minimal
 * overpriced → Listed as "offer price" but barely off MRP, often for months
 */

export const VALUE_TIERS = {
  excellent: { label: "🔥 Excellent Deal", color: "#00c853" },
  good:      { label: "✅ Good Deal",      color: "#64dd17" },
  average:   { label: "⚡ Average Deal",   color: "#ffd600" },
  poor:      { label: "⚠️ Poor Value",     color: "#ff6d00" },
  overpriced:{ label: "❌ Overpriced",     color: "#d50000" },
};

/**
 * Analyze a product's pricing data and compute:
 * - Which platform is cheaper
 * - How much you save
 * - Value-for-money score
 *
 * @param {object} product - DB product row
 * @param {object} amazonPrice  - current_prices row for amazon
 * @param {object} flipkartPrice - current_prices row for flipkart
 * @param {Array}  priceHistory - array of price_snapshots (for trend)
 */
export function analyzeProduct(product, amazonPrice, flipkartPrice, priceHistory = []) {
  // ── Guard: need at least one platform ─────────────────────────────────────
  const hasAmazon = !!amazonPrice;
  const hasFlipkart = !!flipkartPrice;

  if (!hasAmazon && !hasFlipkart) return null;

  // ── Best price across available platforms ──────────────────────────────────
  const prices = [
    hasAmazon && amazonPrice.in_stock ? { platform: "amazon", ...amazonPrice } : null,
    hasFlipkart && flipkartPrice.in_stock ? { platform: "flipkart", ...flipkartPrice } : null,
  ].filter(Boolean);

  // If both OOS, still show data but flag it
  const allOos = prices.length === 0;
  const pricesIncludingOos = [
    hasAmazon ? { platform: "amazon", ...amazonPrice } : null,
    hasFlipkart ? { platform: "flipkart", ...flipkartPrice } : null,
  ].filter(Boolean);

  const workingPrices = allOos ? pricesIncludingOos : prices;
  workingPrices.sort((a, b) => a.price - b.price);

  const cheapest = workingPrices[0];
  const expensive = workingPrices[workingPrices.length - 1];

  const saving = expensive.price - cheapest.price;
  const savingPct = workingPrices.length > 1
    ? ((saving / expensive.price) * 100).toFixed(1)
    : "0.0";

  // ── Discount from MRP ──────────────────────────────────────────────────────
  const mrp = cheapest.mrp;
  const discountPct = mrp > cheapest.price
    ? ((mrp - cheapest.price) / mrp) * 100
    : 0;

  // ── Age factor ─────────────────────────────────────────────────────────────
  const listedDate = product.listed_date
    ? new Date(product.listed_date)
    : new Date();
  const nowDate = new Date();
  const ageMonths = Math.max(0,
    (nowDate - listedDate) / (1000 * 60 * 60 * 24 * 30.44)
  );

  // Expected discount: products should get ~1.5–2% cheaper per month of age
  // Cap at 70% expected (for very old products like commodities)
  const expectedDiscount = Math.min(70, ageMonths * 1.8);

  // valueDelta: positive = beating expectations, negative = underperforming
  const valueDelta = discountPct - expectedDiscount;

  let valueScore;
  if (valueDelta >= 20)       valueScore = "excellent";
  else if (valueDelta >= 5)   valueScore = "good";
  else if (valueDelta >= -5)  valueScore = "average";
  else if (valueDelta >= -20) valueScore = "poor";
  else                         valueScore = "overpriced";

  // ── Price trend (from history) ────────────────────────────────────────────
  // Compare current cheapest price to 30-day average for same platform
  let priceTrend = "stable"; // "falling" | "rising" | "stable"
  if (priceHistory.length >= 2) {
    const recent = priceHistory
      .filter(s => s.platform === cheapest.platform)
      .slice(0, 5);
    const older = priceHistory
      .filter(s => s.platform === cheapest.platform)
      .slice(-5);

    if (recent.length && older.length) {
      const recentAvg = recent.reduce((s, r) => s + r.price, 0) / recent.length;
      const olderAvg = older.reduce((s, r) => s + r.price, 0) / older.length;
      if (recentAvg < olderAvg * 0.97) priceTrend = "falling";
      else if (recentAvg > olderAvg * 1.03) priceTrend = "rising";
    }
  }

  // ── All-time low detection ─────────────────────────────────────────────────
  const allTimeLow = priceHistory.length > 0
    ? Math.min(...priceHistory.map(s => s.price))
    : cheapest.price;
  const isAllTimeLow = cheapest.price <= allTimeLow;

  return {
    cheapestPlatform: cheapest.platform,
    cheapestPrice: cheapest.price,
    expensivePlatform: expensive?.platform,
    expensivePrice: expensive?.price,
    saving: Math.round(saving),
    savingPct: parseFloat(savingPct),
    mrp,
    discountPct: parseFloat(discountPct.toFixed(1)),
    valueScore,
    valueDelta: parseFloat(valueDelta.toFixed(1)),
    ageMonths: Math.floor(ageMonths),
    priceTrend,
    isAllTimeLow,
    allOos,
    // Per-platform details
    amazon: hasAmazon ? {
      price: amazonPrice.price,
      mrp: amazonPrice.mrp,
      rating: amazonPrice.rating,
      reviewCount: amazonPrice.review_count,
      inStock: !!amazonPrice.in_stock,
      discountPct: amazonPrice.mrp > amazonPrice.price
        ? parseFloat(((amazonPrice.mrp - amazonPrice.price) / amazonPrice.mrp * 100).toFixed(1))
        : 0,
    } : null,
    flipkart: hasFlipkart ? {
      price: flipkartPrice.price,
      mrp: flipkartPrice.mrp,
      rating: flipkartPrice.rating,
      reviewCount: flipkartPrice.review_count,
      inStock: !!flipkartPrice.in_stock,
      discountPct: flipkartPrice.mrp > flipkartPrice.price
        ? parseFloat(((flipkartPrice.mrp - flipkartPrice.price) / flipkartPrice.mrp * 100).toFixed(1))
        : 0,
    } : null,
  };
}

/**
 * Compute summary stats across all analyzed products.
 * Used for the dashboard strip.
 */
export function computeSummaryStats(analyzedProducts) {
  const valid = analyzedProducts.filter(Boolean);
  return {
    total: valid.length,
    amazonCheaper: valid.filter(p => p.analysis?.cheapestPlatform === "amazon").length,
    flipkartCheaper: valid.filter(p => p.analysis?.cheapestPlatform === "flipkart").length,
    excellentDeals: valid.filter(p => p.analysis?.valueScore === "excellent").length,
    totalSavings: valid.reduce((sum, p) => sum + (p.analysis?.saving || 0), 0),
    avgDiscount: valid.length
      ? (valid.reduce((sum, p) => sum + (p.analysis?.discountPct || 0), 0) / valid.length).toFixed(1)
      : 0,
  };
}
