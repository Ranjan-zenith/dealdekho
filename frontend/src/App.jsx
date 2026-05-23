import { useState, useEffect, useCallback } from "react";

// ─── MOCK DATA ENGINE ──────────────────────────────────────────────────────────
// In production, replace fetchProductData() with real API calls to your
// scraping backend (see README for architecture guide)

const MOCK_PRODUCTS = [
  {
    id: 1, name: "boAt Rockerz 450 Bluetooth Headphone",
    category: "Electronics", subcategory: "Audio",
    image: "🎧",
    amazon: { price: 1299, mrp: 3990, rating: 4.1, reviews: 89234, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-03-15" },
    flipkart: { price: 1199, mrp: 3990, rating: 4.0, reviews: 112000, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-03-15" },
  },
  {
    id: 2, name: "Apple iPhone 15 (128GB) - Black",
    category: "Electronics", subcategory: "Smartphones",
    image: "📱",
    amazon: { price: 69999, mrp: 79900, rating: 4.5, reviews: 45231, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-09-22" },
    flipkart: { price: 72999, mrp: 79900, rating: 4.4, reviews: 38900, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-09-22" },
  },
  {
    id: 3, name: "Samsung 108cm (43\") Ultra HD Smart LED TV",
    category: "Electronics", subcategory: "Television",
    image: "📺",
    amazon: { price: 32999, mrp: 64900, rating: 4.3, reviews: 21890, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2021-11-05" },
    flipkart: { price: 31499, mrp: 64900, rating: 4.2, reviews: 29100, url: "#", inStock: false, lastUpdated: "2024-01-10", listedDate: "2021-11-05" },
  },
  {
    id: 4, name: "Nike Air Max 270 Running Shoes",
    category: "Fashion", subcategory: "Footwear",
    image: "👟",
    amazon: { price: 8995, mrp: 11995, rating: 4.4, reviews: 5670, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-06-01" },
    flipkart: { price: 9499, mrp: 11995, rating: 4.3, reviews: 4320, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-06-01" },
  },
  {
    id: 5, name: "Prestige Iris 750W Mixer Grinder",
    category: "Home & Kitchen", subcategory: "Appliances",
    image: "🥣",
    amazon: { price: 2499, mrp: 4500, rating: 4.2, reviews: 33100, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2020-08-12" },
    flipkart: { price: 2349, mrp: 4500, rating: 4.1, reviews: 41200, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2020-08-12" },
  },
  {
    id: 6, name: "Kindle Paperwhite (8GB) E-Reader",
    category: "Electronics", subcategory: "E-Readers",
    image: "📖",
    amazon: { price: 9999, mrp: 13999, rating: 4.6, reviews: 78900, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-10-15" },
    flipkart: { price: 10499, mrp: 13999, rating: 4.4, reviews: 12300, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-10-15" },
  },
  {
    id: 7, name: "Levi's Men's 511 Slim Fit Jeans",
    category: "Fashion", subcategory: "Clothing",
    image: "👖",
    amazon: { price: 2039, mrp: 3999, rating: 4.0, reviews: 14500, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2019-04-20" },
    flipkart: { price: 1799, mrp: 3999, rating: 4.1, reviews: 22100, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2019-04-20" },
  },
  {
    id: 8, name: "Philips Air Fryer HD9252/90 (1400W)",
    category: "Home & Kitchen", subcategory: "Appliances",
    image: "🍟",
    amazon: { price: 7499, mrp: 12995, rating: 4.4, reviews: 28700, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-01-30" },
    flipkart: { price: 7999, mrp: 12995, rating: 4.3, reviews: 19800, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-01-30" },
  },
  {
    id: 9, name: "Nivea Men Face Wash (100ml) Pack of 3",
    category: "Beauty & Health", subcategory: "Skincare",
    image: "🧴",
    amazon: { price: 349, mrp: 549, rating: 4.3, reviews: 67800, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2021-05-10" },
    flipkart: { price: 319, mrp: 549, rating: 4.2, reviews: 45600, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2021-05-10" },
  },
  {
    id: 10, name: "Casio G-Shock GA-2100 Watch",
    category: "Fashion", subcategory: "Watches",
    image: "⌚",
    amazon: { price: 8995, mrp: 10495, rating: 4.5, reviews: 9800, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2023-02-14" },
    flipkart: { price: 9299, mrp: 10495, rating: 4.4, reviews: 7600, url: "#", inStock: false, lastUpdated: "2024-01-10", listedDate: "2023-02-14" },
  },
  {
    id: 11, name: "Himalaya Herbals Purifying Neem Face Pack (75ml)",
    category: "Beauty & Health", subcategory: "Skincare",
    image: "🌿",
    amazon: { price: 99, mrp: 170, rating: 4.3, reviews: 98200, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2018-07-01" },
    flipkart: { price: 89, mrp: 170, rating: 4.2, reviews: 112000, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2018-07-01" },
  },
  {
    id: 12, name: "LG 260L 3-Star Double Door Refrigerator",
    category: "Home & Kitchen", subcategory: "Refrigerators",
    image: "🧊",
    amazon: { price: 26990, mrp: 35990, rating: 4.4, reviews: 15600, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-06-10" },
    flipkart: { price: 25999, mrp: 35990, rating: 4.3, reviews: 18900, url: "#", inStock: true, lastUpdated: "2024-01-10", listedDate: "2022-06-10" },
  },
];

// ─── ANALYSIS ENGINE ───────────────────────────────────────────────────────────
function analyzeProduct(product) {
  const { amazon: a, flipkart: f } = product;
  const cheaperPlatform = a.price <= f.price ? "amazon" : "flipkart";
  const cheaperPrice = Math.min(a.price, f.price);
  const higherPrice = Math.max(a.price, f.price);
  const saving = higherPrice - cheaperPrice;
  const savingPct = ((saving / higherPrice) * 100).toFixed(1);

  // Value-for-money score: how good is the best price vs MRP, weighted by time since listing
  const mrp = a.mrp;
  const discountPct = ((mrp - cheaperPrice) / mrp) * 100;
  const listedDate = new Date(a.listedDate);
  const ageMonths = (new Date("2024-01-10") - listedDate) / (1000 * 60 * 60 * 24 * 30);

  // Value score: high discount is good, but if the product has been listed for long
  // and the price hasn't dropped much, it's NOT a great value deal
  const expectedDiscount = Math.min(70, ageMonths * 1.8); // older products should be cheaper
  const valueDelta = discountPct - expectedDiscount;
  let valueScore = "average";
  if (valueDelta >= 15) valueScore = "excellent";
  else if (valueDelta >= 5) valueScore = "good";
  else if (valueDelta >= -5) valueScore = "average";
  else if (valueDelta >= -15) valueScore = "poor";
  else valueScore = "overpriced";

  const priceDiffPct = ((higherPrice - cheaperPrice) / higherPrice * 100).toFixed(1);

  return {
    cheaperPlatform,
    cheaperPrice,
    saving,
    savingPct,
    discountPct: discountPct.toFixed(1),
    valueScore,
    valueDelta: valueDelta.toFixed(1),
    ageMonths: Math.floor(ageMonths),
    priceDiffPct,
  };
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Kitchen", "Beauty & Health"];
const SORT_OPTIONS = [
  { value: "savings_desc", label: "Best Savings ₹" },
  { value: "discount_desc", label: "Highest Discount %" },
  { value: "value_score", label: "Best Value for Money" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];
const VALUE_COLORS = {
  excellent: { bg: "#00c853", text: "#fff", label: "🔥 Excellent Deal" },
  good: { bg: "#64dd17", text: "#fff", label: "✅ Good Deal" },
  average: { bg: "#ffd600", text: "#222", label: "⚡ Average Deal" },
  poor: { bg: "#ff6d00", text: "#fff", label: "⚠️ Poor Value" },
  overpriced: { bg: "#d50000", text: "#fff", label: "❌ Overpriced" },
};

// ─── STYLES ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f14;
    --surface: #161a24;
    --surface2: #1e2434;
    --border: #2a3045;
    --text: #e8eaf2;
    --text-muted: #7b85a0;
    --amazon: #ff9900;
    --flipkart: #2874f0;
    --accent: #7c3aed;
    --accent2: #06b6d4;
    --red: #ef4444;
    --green: #22c55e;
    --radius: 16px;
    --shadow: 0 4px 32px rgba(0,0,0,0.4);
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .app { max-width: 1400px; margin: 0 auto; padding: 0 20px 60px; }

  /* ── HEADER ── */
  .header {
    padding: 36px 0 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .logo { display: flex; align-items: center; gap: 14px; }
  .logo-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: linear-gradient(135deg, var(--amazon), var(--accent));
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; box-shadow: 0 0 24px rgba(255,153,0,0.3);
  }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-tag { font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px; }
  .header-stats { display: flex; gap: 24px; }
  .stat { text-align: right; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--accent2); }
  .stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

  /* ── SEARCH BAR ── */
  .search-bar {
    position: relative; margin-bottom: 24px;
  }
  .search-input {
    width: 100%; padding: 16px 20px 16px 52px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
  .search-input::placeholder { color: var(--text-muted); }
  .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.5; }

  /* ── CONTROLS ── */
  .controls { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; align-items: center; }
  .cat-btn {
    padding: 8px 18px; border-radius: 999px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .cat-btn:hover { border-color: var(--accent); color: var(--text); }
  .cat-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .sort-select {
    margin-left: auto; padding: 8px 14px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    cursor: pointer; outline: none;
  }
  .view-toggle { display: flex; gap: 6px; }
  .view-btn {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .view-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* ── FILTER TABS ── */
  .filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-tab {
    padding: 6px 14px; border-radius: 8px;
    border: 1px solid var(--border); background: transparent;
    color: var(--text-muted); font-size: 12px; cursor: pointer;
    transition: all 0.15s;
  }
  .filter-tab:hover { color: var(--text); border-color: var(--text-muted); }
  .filter-tab.active { border-color: var(--accent2); color: var(--accent2); background: rgba(6,182,212,0.08); }

  /* ── RESULTS HEADER ── */
  .results-header {
    font-size: 13px; color: var(--text-muted);
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }
  .results-count { color: var(--accent2); font-weight: 600; }

  /* ── GRID ── */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
  .list { display: flex; flex-direction: column; gap: 14px; }

  /* ── PRODUCT CARD ── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    animation: fadeIn 0.3s ease both;
  }
  .card:hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--border); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .card-top { padding: 18px 18px 14px; display: flex; gap: 14px; align-items: flex-start; }
  .card-emoji { font-size: 36px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;
    background: var(--surface2); border-radius: 12px; flex-shrink: 0; }
  .card-info { flex: 1; min-width: 0; }
  .card-category { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 4px; }
  .card-name { font-size: 14px; font-weight: 600; line-height: 1.4; display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .value-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
    margin-top: 6px;
  }

  /* ── PRICE COMPARISON TABLE ── */
  .price-compare { padding: 0 18px 16px; }
  .platform-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px;
    margin-bottom: 6px; transition: background 0.15s;
    border: 1px solid transparent;
  }
  .platform-row.cheaper { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.2); }
  .platform-row.expensive { background: var(--surface2); opacity: 0.75; }
  .platform-name { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
  .platform-dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot-amazon { background: var(--amazon); }
  .dot-flipkart { background: var(--flipkart); }
  .price-info { text-align: right; }
  .price-main { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; }
  .price-mrp { font-size: 11px; color: var(--text-muted); text-decoration: line-through; }
  .price-off { font-size: 11px; color: var(--green); font-weight: 600; margin-left: 4px; }
  .oos-badge { font-size: 10px; background: rgba(239,68,68,0.15); color: var(--red); border-radius: 4px; padding: 2px 6px; }
  .winner-tag { font-size: 10px; color: var(--green); font-weight: 600; display: flex; align-items: center; gap: 3px; margin-top: 3px; }

  /* ── SAVING BAR ── */
  .saving-section { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .saving-label { font-size: 12px; color: var(--text-muted); }
  .saving-amount { font-family: 'Syne', sans-serif; font-size: 15px; color: var(--green); font-weight: 700; }
  .saving-pct { font-size: 11px; color: var(--text-muted); margin-left: 4px; }
  .buy-btn {
    padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
    text-decoration: none;
  }
  .buy-btn.amazon { background: var(--amazon); color: #111; }
  .buy-btn.flipkart { background: var(--flipkart); color: #fff; }
  .buy-btn:hover { filter: brightness(1.1); transform: scale(1.03); }

  /* ── LIST VIEW CARD ── */
  .list-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px 20px;
    display: grid; grid-template-columns: 56px 1fr auto auto auto;
    gap: 16px; align-items: center; transition: all 0.2s;
    animation: fadeIn 0.3s ease both;
  }
  .list-card:hover { border-color: var(--accent); transform: translateX(3px); }
  .list-name { font-size: 14px; font-weight: 500; }
  .list-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .list-platform { text-align: center; }
  .list-platform-name { font-size: 12px; font-weight: 600; }
  .list-price { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; text-align: right; }
  .list-save { font-size: 11px; color: var(--green); text-align: right; }

  /* ── EMPTY ── */
  .empty { text-align: center; padding: 80px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.4; }
  .empty-text { font-size: 18px; font-weight: 500; margin-bottom: 8px; }

  /* ── SUMMARY STRIP ── */
  .summary-strip {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;
  }
  .summary-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; text-align: center;
  }
  .summary-num { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
  .summary-desc { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .num-amazon { color: var(--amazon); }
  .num-flipkart { color: var(--flipkart); }
  .num-green { color: var(--green); }
  .num-accent { color: var(--accent2); }

  /* ── AGE WARNING ── */
  .age-warn { font-size: 10px; color: #f59e0b; background: rgba(245,158,11,0.1);
    border-radius: 4px; padding: 2px 7px; display: inline-flex; align-items: center; gap: 3px; }

  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .summary-strip { grid-template-columns: repeat(2, 1fr); }
    .list-card { grid-template-columns: 40px 1fr; grid-template-rows: auto auto auto; }
    .header-stats { display: none; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtFull(n) { return `₹${n.toLocaleString("en-IN")}`; }

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, view }) {
  const analysis = analyzeProduct(product);
  const { amazon: a, flipkart: f } = product;
  const vcolor = VALUE_COLORS[analysis.valueScore];

  if (view === "list") {
    return (
      <div className="list-card">
        <div className="card-emoji" style={{ fontSize: 28, width: 44, height: 44, borderRadius: 10 }}>{product.image}</div>
        <div>
          <div className="list-name">{product.name}</div>
          <div className="list-meta">{product.category} • {analysis.ageMonths}mo listed</div>
          <span className="value-badge" style={{ background: vcolor.bg, color: vcolor.text }}>{vcolor.label}</span>
        </div>
        <div className="list-platform" style={{ color: analysis.cheaperPlatform === "amazon" ? "var(--amazon)" : "var(--flipkart)" }}>
          <div className="list-platform-name">{analysis.cheaperPlatform === "amazon" ? "Amazon" : "Flipkart"}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Cheaper by</div>
        </div>
        <div>
          <div className="list-price">{fmtFull(analysis.cheaperPrice)}</div>
          <div className="list-save">Save {fmtFull(analysis.saving)}</div>
        </div>
        <a href={analysis.cheaperPlatform === "amazon" ? a.url : f.url}
          className={`buy-btn ${analysis.cheaperPlatform}`} target="_blank" rel="noopener noreferrer">
          Buy
        </a>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-emoji">{product.image}</div>
        <div className="card-info">
          <div className="card-category">{product.category} › {product.subcategory}</div>
          <div className="card-name">{product.name}</div>
          <span className="value-badge" style={{ background: vcolor.bg, color: vcolor.text }}>{vcolor.label}</span>
          {analysis.ageMonths > 18 && (
            <span className="age-warn" style={{ marginLeft: 6 }}>⏳ {analysis.ageMonths}mo listed</span>
          )}
        </div>
      </div>

      <div className="price-compare">
        {[
          { key: "amazon", label: "Amazon", dot: "dot-amazon", data: a },
          { key: "flipkart", label: "Flipkart", dot: "dot-flipkart", data: f },
        ].map(({ key, label, dot, data }) => {
          const isCheaper = analysis.cheaperPlatform === key;
          const discPct = (((data.mrp - data.price) / data.mrp) * 100).toFixed(0);
          return (
            <div key={key} className={`platform-row ${isCheaper ? "cheaper" : "expensive"}`}>
              <div>
                <div className="platform-name">
                  <span className={`platform-dot ${dot}`} />
                  {label}
                  {!data.inStock && <span className="oos-badge">Out of Stock</span>}
                </div>
                {isCheaper && <div className="winner-tag">✓ Best Price</div>}
              </div>
              <div className="price-info">
                <div className="price-main" style={{ color: isCheaper ? "var(--green)" : "var(--text)" }}>
                  {fmtFull(data.price)}
                </div>
                <div>
                  <span className="price-mrp">{fmtFull(data.mrp)}</span>
                  <span className="price-off">{discPct}% off</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="saving-section">
        <div>
          <div className="saving-label">You save choosing {analysis.cheaperPlatform === "amazon" ? "Amazon" : "Flipkart"}</div>
          <div>
            <span className="saving-amount">{fmtFull(analysis.saving)}</span>
            <span className="saving-pct">({analysis.priceDiffPct}% cheaper)</span>
          </div>
        </div>
        <a
          href={analysis.cheaperPlatform === "amazon" ? a.url : f.url}
          className={`buy-btn ${analysis.cheaperPlatform}`}
          target="_blank" rel="noopener noreferrer"
        >
          Buy on {analysis.cheaperPlatform === "amazon" ? "Amazon" : "Flipkart"}
        </a>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("savings_desc");
  const [view, setView] = useState("grid");
  const [valueFilter, setValueFilter] = useState("all");

  const VALUE_FILTERS = [
    { key: "all", label: "All Deals" },
    { key: "excellent", label: "🔥 Excellent Only" },
    { key: "good", label: "✅ Good+" },
    { key: "poor_value", label: "⚠️ Poor Value Alerts" },
  ];

  const filtered = MOCK_PRODUCTS
    .filter(p => {
      const a = analyzeProduct(p);
      if (category !== "All" && p.category !== category) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (valueFilter === "excellent" && a.valueScore !== "excellent") return false;
      if (valueFilter === "good" && !["excellent", "good"].includes(a.valueScore)) return false;
      if (valueFilter === "poor_value" && !["poor", "overpriced"].includes(a.valueScore)) return false;
      return true;
    })
    .sort((a, b) => {
      const aa = analyzeProduct(a), ba = analyzeProduct(b);
      if (sort === "savings_desc") return ba.saving - aa.saving;
      if (sort === "discount_desc") return parseFloat(ba.discountPct) - parseFloat(aa.discountPct);
      if (sort === "price_asc") return aa.cheaperPrice - ba.cheaperPrice;
      if (sort === "price_desc") return ba.cheaperPrice - aa.cheaperPrice;
      if (sort === "value_score") {
        const order = ["excellent", "good", "average", "poor", "overpriced"];
        return order.indexOf(aa.valueScore) - order.indexOf(ba.valueScore);
      }
      return 0;
    });

  // Summary stats
  const amazonWins = MOCK_PRODUCTS.filter(p => analyzeProduct(p).cheaperPlatform === "amazon").length;
  const flipkartWins = MOCK_PRODUCTS.length - amazonWins;
  const totalSavings = MOCK_PRODUCTS.reduce((sum, p) => sum + analyzeProduct(p).saving, 0);
  const excellentDeals = MOCK_PRODUCTS.filter(p => analyzeProduct(p).valueScore === "excellent").length;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            <div>
              <div className="logo-text">DealDekho</div>
              <div className="logo-tag">Amazon vs Flipkart · Real Price Comparison</div>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat">
              <div className="stat-val">{MOCK_PRODUCTS.length}</div>
              <div className="stat-label">Products Tracked</div>
            </div>
            <div className="stat">
              <div className="stat-val">{fmt(totalSavings)}</div>
              <div className="stat-label">Max Savings Available</div>
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-card">
            <div className="summary-num num-amazon">{amazonWins}</div>
            <div className="summary-desc">Amazon cheaper</div>
          </div>
          <div className="summary-card">
            <div className="summary-num num-flipkart">{flipkartWins}</div>
            <div className="summary-desc">Flipkart cheaper</div>
          </div>
          <div className="summary-card">
            <div className="summary-num num-green">{excellentDeals}</div>
            <div className="summary-desc">🔥 Excellent deals</div>
          </div>
          <div className="summary-card">
            <div className="summary-num num-accent">{fmt(totalSavings)}</div>
            <div className="summary-desc">Total savings today</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search for products... (e.g. iPhone, Air Fryer, Jeans)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Controls */}
        <div className="controls">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-btn${category === c ? " active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
          <div className="view-toggle">
            <button className={`view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")} title="Grid">⊞</button>
            <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")} title="List">≡</button>
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Value Filter Tabs */}
        <div className="filter-tabs">
          {VALUE_FILTERS.map(f => (
            <button key={f.key} className={`filter-tab${valueFilter === f.key ? " active" : ""}`}
              onClick={() => setValueFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {/* Results */}
        <div className="results-header">
          <span className="results-count">{filtered.length}</span> products found
          {query && <span>· matching "<strong>{query}</strong>"</span>}
          {category !== "All" && <span>· in <strong>{category}</strong></span>}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🕵️</div>
            <div className="empty-text">No products found</div>
            <div style={{ fontSize: 14 }}>Try a different search or category</div>
          </div>
        ) : (
          <div className={view}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
                <ProductCard product={p} view={view} />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 12, lineHeight: 1.8, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          <div style={{ marginBottom: 8 }}>⚡ <strong>DealDekho</strong> · Open Source Price Comparison · Amazon vs Flipkart</div>
          <div>Prices updated periodically. "Value for Money" score factors in MRP discount AND how long a product has been listed — so stale discounts are flagged.</div>
          <div style={{ marginTop: 8 }}>
            <strong style={{ color: "var(--accent2)" }}>For developers:</strong> Replace <code>MOCK_PRODUCTS</code> with your scraper API. See README for backend architecture →{" "}
            <a href="https://github.com/yourusername/dealdekho" style={{ color: "var(--accent)" }}>github.com/yourusername/dealdekho</a>
          </div>
        </div>
      </div>
    </>
  );
}
