// src/db/seed.js
// Seeds the database with sample products to track.
// Add your own products here, or use the POST /api/products API.
// Run: node src/db/seed.js

import db from "./index.js";

const PRODUCTS = [
  // ── Electronics ─────────────────────────────────────────────────────────
  {
    name: "boAt Rockerz 450 Bluetooth Headphone",
    category: "Electronics", subcategory: "Audio", emoji: "🎧",
    amazon_asin: "B07BSCTWRN",
    amazon_url: "https://www.amazon.in/dp/B07BSCTWRN",
    flipkart_pid: "ACCFHS7HMTQJYVNW",
    flipkart_url: "https://www.flipkart.com/boat-rockerz-450/p/ACCFHS7HMTQJYVNW",
    listed_date: "2022-03-15",
  },
  {
    name: "Apple iPhone 15 (128GB) - Black",
    category: "Electronics", subcategory: "Smartphones", emoji: "📱",
    amazon_asin: "B0CHX1W1XY",
    amazon_url: "https://www.amazon.in/dp/B0CHX1W1XY",
    flipkart_pid: "MOBGTAGPTB3VS24W",
    flipkart_url: "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/MOBGTAGPTB3VS24W",
    listed_date: "2023-09-22",
  },
  {
    name: "Samsung 108cm (43\") Ultra HD Smart LED TV",
    category: "Electronics", subcategory: "Television", emoji: "📺",
    amazon_asin: "B09XNMQ6MF",
    amazon_url: "https://www.amazon.in/dp/B09XNMQ6MF",
    flipkart_pid: "TVSFHS7JNXSQNZB3",
    flipkart_url: "https://www.flipkart.com/samsung-108-cm-43-inch-ultra-hd-4k-smart-led-tv/p/TVSFHS7JNXSQNZB3",
    listed_date: "2021-11-05",
  },
  {
    name: "Kindle Paperwhite (8GB) E-Reader",
    category: "Electronics", subcategory: "E-Readers", emoji: "📖",
    amazon_asin: "B09TMF6742",
    amazon_url: "https://www.amazon.in/dp/B09TMF6742",
    flipkart_pid: "ACCES4HZGQ9HFXB3",
    flipkart_url: "https://www.flipkart.com/kindle-paperwhite/p/ACCES4HZGQ9HFXB3",
    listed_date: "2023-10-15",
  },
  // ── Fashion ──────────────────────────────────────────────────────────────
  {
    name: "Nike Air Max 270 Running Shoes",
    category: "Fashion", subcategory: "Footwear", emoji: "👟",
    amazon_asin: "B079RN4HWX",
    amazon_url: "https://www.amazon.in/dp/B079RN4HWX",
    flipkart_pid: "SHOEZJHQRGNGH3M9",
    flipkart_url: "https://www.flipkart.com/nike-air-max-270/p/SHOEZJHQRGNGH3M9",
    listed_date: "2023-06-01",
  },
  {
    name: "Levi's Men's 511 Slim Fit Jeans",
    category: "Fashion", subcategory: "Clothing", emoji: "👖",
    amazon_asin: "B07BSMPKNM",
    amazon_url: "https://www.amazon.in/dp/B07BSMPKNM",
    flipkart_pid: "JEANFHS7BMPKNMJK",
    flipkart_url: "https://www.flipkart.com/levis-mens-511-slim-fit-jeans/p/JEANFHS7BMPKNMJK",
    listed_date: "2019-04-20",
  },
  // ── Home & Kitchen ────────────────────────────────────────────────────────
  {
    name: "Prestige Iris 750W Mixer Grinder",
    category: "Home & Kitchen", subcategory: "Appliances", emoji: "🥣",
    amazon_asin: "B00MH0F1E4",
    amazon_url: "https://www.amazon.in/dp/B00MH0F1E4",
    flipkart_pid: "MGRNF2HYYDCNMH2Z",
    flipkart_url: "https://www.flipkart.com/prestige-iris-750-w-mixer-grinder/p/MGRNF2HYYDCNMH2Z",
    listed_date: "2020-08-12",
  },
  {
    name: "Philips Air Fryer HD9252/90 (1400W)",
    category: "Home & Kitchen", subcategory: "Appliances", emoji: "🍟",
    amazon_asin: "B09G3HRMVG",
    amazon_url: "https://www.amazon.in/dp/B09G3HRMVG",
    flipkart_pid: "AFFG3HRMVGYGJB3N",
    flipkart_url: "https://www.flipkart.com/philips-hd9252-90-air-fryer/p/AFFG3HRMVGYGJB3N",
    listed_date: "2022-01-30",
  },
  // ── Beauty & Health ───────────────────────────────────────────────────────
  {
    name: "Nivea Men Face Wash (100ml) Pack of 3",
    category: "Beauty & Health", subcategory: "Skincare", emoji: "🧴",
    amazon_asin: "B01N9SPQH6",
    amazon_url: "https://www.amazon.in/dp/B01N9SPQH6",
    flipkart_pid: "SKNCFGYHSPQH6C2K",
    flipkart_url: "https://www.flipkart.com/nivea-men-face-wash-pack-3/p/SKNCFGYHSPQH6C2K",
    listed_date: "2021-05-10",
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO products
    (name, category, subcategory, emoji, amazon_asin, amazon_url, flipkart_pid, flipkart_url, listed_date)
  VALUES
    (@name, @category, @subcategory, @emoji, @amazon_asin, @amazon_url, @flipkart_pid, @flipkart_url, @listed_date)
`);

const seedAll = db.transaction((products) => {
  let count = 0;
  for (const p of products) {
    const result = insert.run(p);
    if (result.changes) count++;
  }
  return count;
});

const inserted = seedAll(PRODUCTS);
console.log(`✅ Seeded ${inserted} new products (${PRODUCTS.length - inserted} already existed)`);
