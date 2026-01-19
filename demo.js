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
      console.error("❌ Keepa /query API error:", err.response?.data || err.message);
      // If API key is invalid or API fails, return empty results
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid Keepa API key. Please set KEEPA_KEY environment variable.");
      }
      throw new Error(`Keepa API error: ${err.response?.data?.error || err.message}`);
    }

    // Check if we got valid response
    if (!queryRes.data || !queryRes.data.asinList) {
      console.log("⚠️  No ASINs found in Keepa API response");
      return [];
    }

    const asins = queryRes.data.asinList;
    
    if (!asins || asins.length === 0) {
      console.log("⚠️  No ASINs found for keyword:", keyword);
      return [];
    }

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
      console.error("❌ Keepa /product API error:", err.response?.data || err.message);
      // If API key is invalid or API fails, return empty results
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid Keepa API key. Please set KEEPA_KEY environment variable.");
      }
      throw new Error(`Keepa API error: ${err.response?.data?.error || err.message}`);
    }

    // Check if we got valid response
    if (!productRes.data || !productRes.data.products) {
      console.log("⚠️  No products found in Keepa API response");
      return [];
    }

    // Keepa API returns products as an object with ASIN as key
    const productsObject = productRes.data.products;
    const products = Object.values(productsObject);

    // 4️⃣ Format output - extract relevant fields from Keepa product data
    const result = products
      .filter(p => p && p.asin) // Filter out invalid products
      .map(p => ({
        asin: p.asin,
        title: p.title || "N/A",
        brand: p.brand || p.manufacturer || "N/A",
        manufacturer: p.manufacturer || p.brand || "N/A"
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

