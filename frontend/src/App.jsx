import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "savings_desc",  label: "Best Savings ₹" },
  { value: "discount_desc", label: "Highest Discount %" },
  { value: "value_score",   label: "Best Value for Money" },
  { value: "price_asc",     label: "Price: Low to High" },
  { value: "price_desc",    label: "Price: High to Low" },
];
const VALUE_FILTERS = [
  { key: "all",        label: "All Deals" },
  { key: "excellent",  label: "🔥 Excellent Only" },
  { key: "good",       label: "✅ Good+" },
  { key: "poor_value", label: "⚠️ Poor Value Alerts" },
];
const VALUE_COLORS = {
  excellent:  { bg: "#00c853", text: "#fff", label: "🔥 Excellent Deal" },
  good:       { bg: "#64dd17", text: "#fff", label: "✅ Good Deal" },
  average:    { bg: "#ffd600", text: "#222", label: "⚡ Average Deal" },
  poor:       { bg: "#ff6d00", text: "#fff", label: "⚠️ Poor Value" },
  overpriced: { bg: "#d50000", text: "#fff", label: "❌ Overpriced" },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f14; --surface: #161a24; --surface2: #1e2434;
    --border: #2a3045; --text: #e8eaf2; --text-muted: #7b85a0;
    --amazon: #ff9900; --flipkart: #2874f0; --accent: #7c3aed;
    --accent2: #06b6d4; --red: #ef4444; --green: #22c55e;
    --radius: 16px; --shadow: 0 4px 32px rgba(0,0,0,0.4);
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  #root { min-height: 100vh; }
  .app { max-width: 1400px; margin: 0 auto; padding: 0 20px 60px; }

  .header { padding: 36px 0 28px; border-bottom: 1px solid var(--border); margin-bottom: 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .logo { display: flex; align-items: center; gap: 14px; }
  .logo-icon { width: 52px; height: 52px; border-radius: 14px;
    background: linear-gradient(135deg, var(--amazon), var(--accent));
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; box-shadow: 0 0 24px rgba(255,153,0,0.3); }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-tag { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .header-stats { display: flex; gap: 24px; }
  .stat { text-align: right; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--accent2); }
  .stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

  .refresh-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-muted); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
  .refresh-btn:hover { border-color: var(--accent2); color: var(--accent2); }
  .refresh-btn.spinning { animation: spin 1s linear infinite; pointer-events: none; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
  .summary-num { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
  .summary-desc { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .num-amazon { color: var(--amazon); } .num-flipkart { color: var(--flipkart); }
  .num-green { color: var(--green); } .num-accent { color: var(--accent2); }

  .search-bar { position: relative; margin-bottom: 24px; }
  .search-input { width: 100%; padding: 16px 20px 16px 52px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; }
  .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
  .search-input::placeholder { color: var(--text-muted); }
  .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.5; }
  .search-clear { position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px; }

  .controls { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; align-items: center; }
  .cat-btn { padding: 8px 18px; border-radius: 999px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-muted); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .cat-btn:hover { border-color: var(--accent); color: var(--text); }
  .cat-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .sort-select { margin-left: auto; padding: 8px 14px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none; }
  .view-toggle { display: flex; gap: 6px; }
  .view-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-muted); cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .view-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

  .filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-tab { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-muted); font-size: 12px; cursor: pointer; transition: all 0.15s; }
  .filter-tab:hover { color: var(--text); border-color: var(--text-muted); }
  .filter-tab.active { border-color: var(--accent2); color: var(--accent2); background: rgba(6,182,212,0.08); }

  .results-header { font-size: 13px; color: var(--text-muted); margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px; }
  .results-count { color: var(--accent2); font-weight: 600; }
  .last-updated { margin-left: auto; font-size: 11px; color: var(--text-muted); }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
  .list { display: flex; flex-direction: column; gap: 14px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; animation: fadeIn 0.3s ease both; }
  .card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .card-top { padding: 18px 18px 14px; display: flex; gap: 14px; align-items: flex-start; }
  .card-emoji { font-size: 36px; width: 60px; height: 60px; display: flex; align-items: center;
    justify-content: center; background: var(--surface2); border-radius: 12px; flex-shrink: 0; }
  .card-info { flex: 1; min-width: 0; }
  .card-category { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 4px; }
  .card-name { font-size: 14px; font-weight: 600; line-height: 1.4; display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .value-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
    border-radius: 6px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .badge-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .trend-badge { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
  .trend-falling { background: rgba(34,197,94,0.15); color: var(--green); }
  .trend-rising  { background: rgba(239,68,68,0.15);  color: var(--red); }
  .trend-stable  { background: rgba(123,133,160,0.15); color: var(--text-muted); }
  .atl-badge { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600;
    background: rgba(255,153,0,0.15); color: var(--amazon); }
  .age-warn { font-size: 10px; color: #f59e0b; background: rgba(245,158,11,0.1);
    border-radius: 4px; padding: 2px 7px; display: inline-flex; align-items: center; gap: 3px; }

  .price-compare { padding: 0 18px 16px; }
  .platform-row { display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
    border: 1px solid transparent; transition: background 0.15s; }
  .platform-row.cheaper  { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.2); }
  .platform-row.expensive{ background: var(--surface2); opacity: 0.75; }
  .platform-name { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
  .platform-dot  { width: 8px; height: 8px; border-radius: 50%; }
  .dot-amazon   { background: var(--amazon); } .dot-flipkart { background: var(--flipkart); }
  .price-info   { text-align: right; }
  .price-main   { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; }
  .price-mrp    { font-size: 11px; color: var(--text-muted); text-decoration: line-through; }
  .price-off    { font-size: 11px; color: var(--green); font-weight: 600; margin-left: 4px; }
  .oos-badge    { font-size: 10px; background: rgba(239,68,68,0.15); color: var(--red); border-radius: 4px; padding: 2px 6px; }
  .winner-tag   { font-size: 10px; color: var(--green); font-weight: 600; display: flex; align-items: center; gap: 3px; margin-top: 3px; }

  .saving-section { padding: 12px 18px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; }
  .saving-label  { font-size: 12px; color: var(--text-muted); }
  .saving-amount { font-family: 'Syne', sans-serif; font-size: 15px; color: var(--green); font-weight: 700; }
  .saving-pct    { font-size: 11px; color: var(--text-muted); margin-left: 4px; }
  .buy-btn { padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s; text-decoration: none; display: inline-block; }
  .buy-btn.amazon   { background: var(--amazon); color: #111; }
  .buy-btn.flipkart { background: var(--flipkart); color: #fff; }
  .buy-btn:hover    { filter: brightness(1.1); transform: scale(1.03); }

  .list-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px 20px; display: grid; grid-template-columns: 56px 1fr auto auto auto;
    gap: 16px; align-items: center; transition: all 0.2s; animation: fadeIn 0.3s ease both; }
  .list-card:hover { border-color: var(--accent); transform: translateX(3px); }
  .list-name { font-size: 14px; font-weight: 500; }
  .list-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .list-platform { text-align: center; }
  .list-platform-name { font-size: 12px; font-weight: 600; }
  .list-price { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; text-align: right; }
  .list-save  { font-size: 11px; color: var(--green); text-align: right; }

  /* ── SKELETON LOADING ── */
  .skeleton { background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .skeleton-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; height: 240px; display: flex; flex-direction: column; gap: 12px; }
  .sk-top   { display: flex; gap: 12px; align-items: flex-start; }
  .sk-icon  { width: 60px; height: 60px; border-radius: 12px; flex-shrink: 0; }
  .sk-info  { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .sk-line  { height: 12px; } .sk-line.short { width: 40%; } .sk-line.med { width: 70%; } .sk-line.full { width: 100%; }

  /* ── ERROR / EMPTY ── */
  .empty { text-align: center; padding: 80px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.4; }
  .empty-text { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
  .error-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex;
    align-items: flex-start; gap: 12px; }
  .error-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
  .error-title { font-weight: 600; color: var(--red); margin-bottom: 4px; }
  .error-msg { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
  .retry-btn { margin-top: 10px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--red);
    background: transparent; color: var(--red); font-size: 12px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .retry-btn:hover { background: var(--red); color: #fff; }

  /* ── PAGINATION ── */
  .pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 36px; }
  .page-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-muted); cursor: pointer; font-size: 13px;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; }
  .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-info { font-size: 12px; color: var(--text-muted); padding: 0 8px; }

  /* ── ADD PRODUCT MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
    padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.5px; margin-bottom: 6px; display: block; font-weight: 600; }
  .form-input, .form-select { width: 100%; padding: 10px 14px; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 10px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text-muted); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
  .btn-primary { flex: 1; padding: 11px; border-radius: 10px; border: none;
    background: var(--accent); color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { padding: 11px 20px; border-radius: 10px; border: 1px solid var(--border);
    background: transparent; color: var(--text-muted); font-size: 14px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-secondary:hover { border-color: var(--text); color: var(--text); }
  .add-product-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--accent);
    background: rgba(124,58,237,0.1); color: var(--accent); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
  .add-product-btn:hover { background: var(--accent); color: #fff; }
  .success-msg { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3);
    border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--green); margin-top: 12px; }

  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .summary-strip { grid-template-columns: repeat(2, 1fr); }
    .list-card { grid-template-columns: 40px 1fr; grid-template-rows: auto auto auto; }
    .header-stats { display: none; }
    .form-row { grid-template-columns: 1fr; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const fmtFull = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
async function fetchProducts({ category, q, sort, valueFilter, page, limit = 12 }) {
  const params = new URLSearchParams({ sort, valueFilter, page, limit });
  if (category && category !== "All") params.set("category", category);
  if (q) params.set("q", q);
  const res = await fetch(`${API_BASE}/products?${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE}/products/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

async function addProduct(data) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function triggerScrape() {
  const res = await fetch(`${API_BASE}/admin/scrape`, { method: "POST" });
  return res.json();
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-top">
        <div className="skeleton sk-icon" />
        <div className="sk-info">
          <div className="skeleton sk-line short" />
          <div className="skeleton sk-line full" />
          <div className="skeleton sk-line med" />
        </div>
      </div>
      <div className="skeleton sk-line full" style={{ height: 60, borderRadius: 10 }} />
      <div className="skeleton sk-line full" style={{ height: 60, borderRadius: 10 }} />
    </div>
  );
}

// ─── ADD PRODUCT MODAL ────────────────────────────────────────────────────────
function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "", category: "Electronics", subcategory: "", emoji: "🛍️",
    amazonAsin: "", amazonUrl: "", flipkartPid: "", flipkartUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.category) { setError("Name and category are required."); return; }
    if (!form.amazonAsin && !form.amazonUrl && !form.flipkartPid && !form.flipkartUrl) {
      setError("At least one Amazon or Flipkart identifier is required."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await addProduct(form);
      if (res.success) { setSuccess(true); setTimeout(() => { onAdded(); onClose(); }, 1500); }
      else setError(res.error || "Failed to add product.");
    } catch { setError("Could not connect to backend."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">➕ Track a New Product</div>
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input className="form-input" placeholder="e.g. Sony WH-1000XM5 Headphones" value={form.name} onChange={set("name")} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={set("category")}>
              {["Electronics","Fashion","Home & Kitchen","Beauty & Health","Sports","Books","Toys"].map(c =>
                <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Emoji Icon</label>
            <input className="form-input" placeholder="🛍️" value={form.emoji} onChange={set("emoji")} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Subcategory</label>
          <input className="form-input" placeholder="e.g. Smartphones, Footwear" value={form.subcategory} onChange={set("subcategory")} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, padding: "8px 12px",
          background: "var(--surface2)", borderRadius: 8 }}>
          💡 Provide Amazon ASIN (from URL: amazon.in/dp/<b>ASIN</b>) and/or Flipkart PID
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amazon ASIN</label>
            <input className="form-input" placeholder="B09XS7JWHH" value={form.amazonAsin} onChange={set("amazonAsin")} />
          </div>
          <div className="form-group">
            <label className="form-label">Flipkart PID</label>
            <input className="form-input" placeholder="MOBGTAGPTB3VS24W" value={form.flipkartPid} onChange={set("flipkartPid")} />
          </div>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 4 }}>⚠️ {error}</div>}
        {success && <div className="success-msg">✅ Product added! Refreshing...</div>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || success}>
            {loading ? "Adding..." : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, view }) {
  const { analysis, name, category, subcategory, emoji, amazonUrl, flipkartUrl } = product;
  if (!analysis) return null;

  const vcolor = VALUE_COLORS[analysis.valueScore] || VALUE_COLORS.average;
  const trendClass = { falling: "trend-falling", rising: "trend-rising", stable: "trend-stable" }[analysis.priceTrend] || "trend-stable";
  const trendLabel = { falling: "📉 Falling", rising: "📈 Rising", stable: "➡️ Stable" }[analysis.priceTrend] || "➡️ Stable";

  const platforms = [
    { key: "amazon",   label: "Amazon",   dot: "dot-amazon",   data: analysis.amazon,   url: amazonUrl },
    { key: "flipkart", label: "Flipkart", dot: "dot-flipkart", data: analysis.flipkart, url: flipkartUrl },
  ].filter(p => p.data);

  const cheaperUrl = analysis.cheapestPlatform === "amazon" ? amazonUrl : flipkartUrl;

  if (view === "list") {
    return (
      <div className="list-card">
        <div className="card-emoji" style={{ fontSize: 26, width: 44, height: 44, borderRadius: 10,
          background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {emoji}
        </div>
        <div>
          <div className="list-name">{name}</div>
          <div className="list-meta">{category}{subcategory ? ` › ${subcategory}` : ""} • {analysis.ageMonths}mo listed</div>
          <span className="value-badge" style={{ background: vcolor.bg, color: vcolor.text }}>{vcolor.label}</span>
        </div>
        <div className="list-platform" style={{ color: analysis.cheapestPlatform === "amazon" ? "var(--amazon)" : "var(--flipkart)" }}>
          <div className="list-platform-name">{analysis.cheapestPlatform === "amazon" ? "Amazon" : "Flipkart"}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Cheaper</div>
        </div>
        <div>
          <div className="list-price">{fmtFull(analysis.cheapestPrice)}</div>
          {analysis.saving > 0 && <div className="list-save">Save {fmtFull(analysis.saving)}</div>}
        </div>
        <a href={cheaperUrl || "#"} className={`buy-btn ${analysis.cheapestPlatform}`} target="_blank" rel="noopener noreferrer">Buy</a>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-emoji">{emoji}</div>
        <div className="card-info">
          <div className="card-category">{category}{subcategory ? ` › ${subcategory}` : ""}</div>
          <div className="card-name">{name}</div>
          <div className="badge-row">
            <span className="value-badge" style={{ background: vcolor.bg, color: vcolor.text }}>{vcolor.label}</span>
            <span className={`trend-badge ${trendClass}`}>{trendLabel}</span>
            {analysis.isAllTimeLow && <span className="atl-badge">🏆 All-Time Low</span>}
            {analysis.ageMonths > 18 && <span className="age-warn">⏳ {analysis.ageMonths}mo old</span>}
          </div>
        </div>
      </div>

      <div className="price-compare">
        {platforms.map(({ key, label, dot, data, url }) => {
          const isCheaper = analysis.cheapestPlatform === key;
          const discPct = data.mrp > data.price ? ((data.mrp - data.price) / data.mrp * 100).toFixed(0) : 0;
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
                  {discPct > 0 && <span className="price-off">{discPct}% off</span>}
                </div>
                {data.rating && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    ⭐ {data.rating} ({data.reviewCount ? `${(data.reviewCount/1000).toFixed(1)}k` : "—"})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="saving-section">
        <div>
          {analysis.saving > 0 ? (
            <>
              <div className="saving-label">Save by choosing {analysis.cheapestPlatform}</div>
              <div>
                <span className="saving-amount">{fmtFull(analysis.saving)}</span>
                <span className="saving-pct">({analysis.savingPct}% cheaper)</span>
              </div>
            </>
          ) : (
            <div className="saving-label" style={{ color: "var(--text-muted)" }}>Same price on both platforms</div>
          )}
        </div>
        <a href={cheaperUrl || "#"} className={`buy-btn ${analysis.cheapestPlatform}`}
          target="_blank" rel="noopener noreferrer">
          Buy on {analysis.cheapestPlatform === "amazon" ? "Amazon" : "Flipkart"}
        </a>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts]       = useState([]);
  const [summary, setSummary]         = useState(null);
  const [pagination, setPagination]   = useState(null);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [scraping, setScraping]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory]     = useState("All");
  const [sort, setSort]             = useState("savings_desc");
  const [view, setView]             = useState("grid");
  const [valueFilter, setValueFilter] = useState("all");
  const [page, setPage]             = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(query); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(r => r.success && setCategories(r.data.map(c => c.category)))
      .catch(() => {});
  }, []);

  // Load products
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetchProducts({ category, q: debouncedQ, sort, valueFilter, page });
      if (!res.success) throw new Error(res.error || "Failed to load");
      setProducts(res.data);
      setSummary(res.summary);
      setPagination(res.pagination);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Could not connect to backend. Is the server running on port 3001?");
    } finally {
      setLoading(false);
    }
  }, [category, debouncedQ, sort, valueFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [category, debouncedQ, sort, valueFilter]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      await triggerScrape();
      await load();
    } catch { }
    finally { setScraping(false); }
  };

  const allCategories = ["All", ...categories];

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── HEADER ── */}
        <div className="header">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            <div>
              <div className="logo-text">DealDekho</div>
              <div className="logo-tag">Amazon vs Flipkart · Live Price Comparison</div>
            </div>
          </div>
          <div className="header-right">
            {summary && (
              <div className="header-stats">
                <div className="stat">
                  <div className="stat-val">{summary.total}</div>
                  <div className="stat-label">Products</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{fmt(summary.totalSavings)}</div>
                  <div className="stat-label">Total Savings</div>
                </div>
              </div>
            )}
            <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
              ➕ Add Product
            </button>
            <button className={`refresh-btn`} onClick={handleScrape} disabled={scraping}>
              <span style={scraping ? { display: "inline-block", animation: "spin 1s linear infinite" } : {}}>🔄</span>
              {scraping ? "Scraping..." : "Scrape Now"}
            </button>
          </div>
        </div>

        {/* ── SUMMARY STRIP ── */}
        {summary && (
          <div className="summary-strip">
            <div className="summary-card">
              <div className="summary-num num-amazon">{summary.amazonCheaper}</div>
              <div className="summary-desc">Amazon cheaper</div>
            </div>
            <div className="summary-card">
              <div className="summary-num num-flipkart">{summary.flipkartCheaper}</div>
              <div className="summary-desc">Flipkart cheaper</div>
            </div>
            <div className="summary-card">
              <div className="summary-num num-green">{summary.excellentDeals}</div>
              <div className="summary-desc">🔥 Excellent deals</div>
            </div>
            <div className="summary-card">
              <div className="summary-num num-accent">{summary.avgDiscount}%</div>
              <div className="summary-desc">Avg discount</div>
            </div>
          </div>
        )}

        {/* ── SEARCH ── */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input className="search-input"
            placeholder="Search products... (e.g. iPhone, Air Fryer, Jeans)"
            value={query} onChange={e => setQuery(e.target.value)} />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")}>✕</button>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <div className="controls">
          {allCategories.map(c => (
            <button key={c} className={`cat-btn${category === c ? " active" : ""}`}
              onClick={() => setCategory(c)}>{c}</button>
          ))}
          <div className="view-toggle">
            <button className={`view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")} title="Grid">⊞</button>
            <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")} title="List">≡</button>
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="filter-tabs">
          {VALUE_FILTERS.map(f => (
            <button key={f.key} className={`filter-tab${valueFilter === f.key ? " active" : ""}`}
              onClick={() => setValueFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="error-box">
            <div className="error-icon">⚠️</div>
            <div>
              <div className="error-title">Could not load products</div>
              <div className="error-msg">{error}</div>
              <div className="error-msg" style={{ marginTop: 6 }}>
                Make sure your backend is running: <code>cd backend && npm run dev</code>
              </div>
              <button className="retry-btn" onClick={load}>Retry</button>
            </div>
          </div>
        )}

        {/* ── RESULTS HEADER ── */}
        {!error && (
          <div className="results-header">
            {loading ? (
              <span style={{ color: "var(--text-muted)" }}>Loading...</span>
            ) : (
              <>
                <span className="results-count">{pagination?.total ?? 0}</span> products found
                {debouncedQ && <span>· matching "<strong>{debouncedQ}</strong>"</span>}
                {category !== "All" && <span>· in <strong>{category}</strong></span>}
                {lastUpdated && (
                  <span className="last-updated">Updated {timeAgo(lastUpdated)}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {loading ? (
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="empty">
            <div className="empty-icon">🕵️</div>
            <div className="empty-text">No products found</div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>
              {debouncedQ ? "Try a different search term" : "Add products to start tracking deals"}
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}
              onClick={() => setShowAddModal(true)}>
              ➕ Add Your First Product
            </button>
          </div>
        ) : (
          <div className={view}>
            {products.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
                <ProductCard product={p} view={view} />
              </div>
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {pagination && pagination.pages > 1 && !loading && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <span className="page-info">of {pagination.pages}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>›</button>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 12,
          lineHeight: 1.8, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          <div style={{ marginBottom: 6 }}>
            ⚡ <strong>DealDekho</strong> · Open Source · Amazon vs Flipkart
          </div>
          <div>Value score factors in discount % AND product age — so stale fake discounts are flagged.</div>
          <div style={{ marginTop: 6 }}>
            Backend: <code style={{ color: "var(--accent2)" }}>{API_BASE}</code>
            {" · "}
            <a href="https://github.com/yourusername/dealdekho" style={{ color: "var(--accent)" }}>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* ── ADD PRODUCT MODAL ── */}
      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onAdded={load} />
      )}
    </>
  );
}
