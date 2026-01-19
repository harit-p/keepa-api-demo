import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const KEEPA_KEY = process.env.KEEPA_KEY || "demo-key"; // Use dummy key for demo if not set
const DOMAIN_ID = 1; // Amazon.com

/**
 * Demo function that shows how Keepa API calls work together
 * 
 * Flow:
 * 1. Call /query API with keyword to discover ASINs
 * 2. Call /product API with ASINs to fetch product details
 * 3. Return list of products with title, brand, and manufacturer
 * 
 * @param {string} keyword - Search keyword (e.g., "tablecraft")
 * @returns {Promise<Array>} Array of products with asin, title, brand, manufacturer
 */
async function demoKeepaBrandDiscovery(keyword) {
  try {
    // 1️⃣ Build selection JSON
    const selection = {
      type: "SEARCH",
      term: keyword,
      domainId: DOMAIN_ID,
      perPage: 5,
      page: 0,
      productType: [0, 1, 2]
    };

    // 2️⃣ Call /query (Product Finder)
    const queryUrl =
      "https://api.keepa.com/query" +
      `?key=${KEEPA_KEY}` +
      `&selection=${encodeURIComponent(JSON.stringify(selection))}`;

    let queryRes;
    try {
      queryRes = await axios.get(queryUrl);
    } catch (err) {
      console.log("⚠️  Using demo fallback for /query (API call failed or using demo key)");
      queryRes = { data: null };
    }

    // DEMO fallback (if no real key or API fails)
    const asins =
      queryRes.data?.asinList || ["B000123456", "B000654321"];

    console.log(`📦 Found ${asins.length} ASINs: ${asins.join(", ")}`);

    // 3️⃣ Call /product (hydrate ASINs)
    const productUrl =
      "https://api.keepa.com/product" +
      `?key=${KEEPA_KEY}` +
      `&domain=${DOMAIN_ID}` +
      `&asin=${asins.join(",")}` +
      `&stats=180&history=0&offers=0`;

    let productRes;
    try {
      productRes = await axios.get(productUrl);
    } catch (err) {
      console.log("⚠️  Using demo fallback for /product (API call failed or using demo key)");
      productRes = { data: null };
    }

    // DEMO fallback products
    const products = productRes.data?.products || [
      {
        asin: "B000123456",
        title: "TableCraft Stainless Steel Sauce Cup",
        brand: "TableCraft",
        manufacturer: "TableCraft Products"
      },
      {
        asin: "B000654321",
        title: "Table Craft Salt & Pepper Shaker",
        brand: "Table Craft",
        manufacturer: "Table Craft Products Corp"
      }
    ];

    // 4️⃣ Format output
    const result = products.map(p => ({
      asin: p.asin,
      title: p.title,
      brand: p.brand,
      manufacturer: p.manufacturer
    }));

    return result;
  } catch (err) {
    console.error("❌ Demo error:", err.message);
    return [];
  }
}

// Example usage - run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const keyword = process.argv[2] || "tablecraft";
  
  console.log(`\n🔍 Searching for keyword: "${keyword}"\n`);
  console.log("📝 Explanation:");
  console.log("  1. We first call Keepa's /query API with a keyword to discover ASINs.");
  console.log("  2. Then we call /product with those ASINs to fetch product details like brand and manufacturer.");
  console.log("  3. ASIN is the join key.\n");
  console.log("─".repeat(60) + "\n");

  demoKeepaBrandDiscovery(keyword)
    .then(results => {
      console.log("✅ Results:\n");
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}

// Export for use in other modules
export { demoKeepaBrandDiscovery };

