// frontend/src/api.js
// Drop-in API client for the DealDekho backend.
// Replace MOCK_PRODUCTS in DealDekho.jsx with calls to these functions.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Fetch products from the backend with filtering/sorting.
 */
export async function fetchProducts({
  category = "All",
  q = "",
  sort = "savings_desc",
  valueFilter = "all",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams({ sort, valueFilter, page, limit });
  if (category && category !== "All") params.set("category", category);
  if (q) params.set("q", q);

  const res = await fetch(`${API_BASE}/products?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json(); // { success, data, summary, pagination }
}

/**
 * Fetch categories with product counts.
 */
export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/products/categories`);
  return res.json();
}

/**
 * Fetch a single product with full price history.
 */
export async function fetchProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  return res.json();
}

/**
 * Add a new product to track.
 */
export async function addProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  return res.json();
}

/**
 * Trigger a manual scrape (admin).
 */
export async function triggerScrape() {
  const res = await fetch(`${API_BASE}/admin/scrape`, { method: "POST" });
  return res.json();
}
