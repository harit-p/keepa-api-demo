import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const KEEPA_KEY = process.env.KEEPA_KEY;
const DOMAIN_ID = 1; // Amazon.com

// Validate API key
if (!KEEPA_KEY || KEEPA_KEY === "demo-key") {
  console.warn("⚠️  WARNING: KEEPA_KEY not set or using demo key. API calls will fail.");
}

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
    // Check if API key is set FIRST
    if (!KEEPA_KEY || KEEPA_KEY === "demo-key") {
      console.error("❌ KEEPA_KEY is missing or invalid");
      throw new Error("Invalid Keepa API key. Please set KEEPA_KEY environment variable.");
    }
    
    console.log(`🔑 API Key present: ${KEEPA_KEY.substring(0, 10)}...`);
    console.log(`🔍 Searching for keyword: "${keyword}"`);

    // 1️⃣ Build queryJSON for Keepa /query API
    // Use "title" field for keyword search according to Keepa API docs
    // Minimum perPage is 50 according to Keepa API documentation
    const queryJSON = {
      title: keyword,
      page: 0,
      perPage: 50
    };

    // 2️⃣ Call /query API - Keepa API
    // GET format: /query?key=<key>&domain=<domainId>&selection=<queryJSON>
    const encodedSelection = encodeURIComponent(JSON.stringify(queryJSON));
    const queryUrl =
      "https://api.keepa.com/query" +
      `?key=${KEEPA_KEY}` +
      `&domain=${DOMAIN_ID}` +
      `&selection=${encodedSelection}`;
    
    console.log(`📡 Calling Keepa /query API...`);
    console.log(`📋 Query JSON:`, JSON.stringify(queryJSON, null, 2));
    console.log(`🔗 Query URL (partial):`, `https://api.keepa.com/query?key=***&domain=${DOMAIN_ID}&selection=${encodedSelection.substring(0, 100)}...`);

    let queryRes;
    try {
      queryRes = await axios.get(queryUrl);
    } catch (err) {
      console.error("❌ Keepa /query API error:", JSON.stringify(err.response?.data, null, 2) || err.message);
      // If API key is invalid or API fails, throw error
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid Keepa API key. Please set KEEPA_KEY environment variable.");
      }
      if (err.response?.status === 429) {
        const rateLimitMsg = err.response?.data?.error?.message || "Rate limit exceeded";
        console.error(`⏱️  Rate limit details:`, JSON.stringify(err.response?.data, null, 2));
        throw new Error(`Keepa API rate limit exceeded: ${rateLimitMsg}. Please wait and try again.`);
      }
      const errorMsg = err.response?.data?.error?.message || JSON.stringify(err.response?.data?.error) || err.message;
      throw new Error(`Keepa API error: ${errorMsg}`);
    }

    // Check if we got valid response
    if (!queryRes.data) {
      console.log("⚠️  Invalid response from Keepa API");
      console.log("📋 Full response:", JSON.stringify(queryRes, null, 2));
      return [];
    }

    // Log full response for debugging
    console.log("📋 Keepa /query API response:", JSON.stringify(queryRes.data, null, 2));
    console.log("📊 Response keys:", Object.keys(queryRes.data || {}));
    console.log("📊 asinList:", queryRes.data.asinList);
    console.log("📊 totalResults:", queryRes.data.totalResults);

    // Keepa API returns asinList in the response
    const asins = queryRes.data.asinList || [];
    
    if (!asins || asins.length === 0) {
      console.log("⚠️  No ASINs found for keyword:", keyword);
      console.log("📋 Full query response:", JSON.stringify(queryRes.data, null, 2));
      console.log("💡 This might mean:");
      console.log("   - The keyword doesn't match any products");
      console.log("   - The query format might need adjustment");
      console.log("   - Try a more specific keyword");
      return [];
    }

    console.log(`📦 Found ${asins.length} ASINs: ${asins.join(", ")}`);

    // Limit to first 1 ASIN for low token plans (reduces cost from ~6-7 tokens to ~2-3 tokens per search)
    // Change to 5 if you have 20+ tokens/minute plan
    const asinsToFetch = asins.slice(0, 1);
    console.log(`📦 Fetching product details for ${asinsToFetch.length} ASIN(s): ${asinsToFetch.join(", ")}`);
    console.log(`💡 Token usage: ~2-3 tokens (reduced from 6-7 by fetching 1 ASIN instead of 5)`);

    // 3️⃣ Call /product (hydrate ASINs)
    // Keepa API format: /product?key=<key>&domain=<domainId>&asin=<asin1,asin2,...>
    const productUrl =
      "https://api.keepa.com/product" +
      `?key=${KEEPA_KEY}` +
      `&domain=${DOMAIN_ID}` +
      `&asin=${asinsToFetch.join(",")}`;

    let productRes;
    try {
      productRes = await axios.get(productUrl);
    } catch (err) {
      console.error("❌ Keepa /product API error:", JSON.stringify(err.response?.data, null, 2) || err.message);
      // If API key is invalid or API fails, throw error
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid Keepa API key. Please set KEEPA_KEY environment variable.");
      }
      if (err.response?.status === 429) {
        const rateLimitMsg = err.response?.data?.error?.message || "Rate limit exceeded";
        console.error(`⏱️  Rate limit details:`, JSON.stringify(err.response?.data, null, 2));
        throw new Error(`Keepa API rate limit exceeded: ${rateLimitMsg}. Please wait and try again.`);
      }
      const errorMsg = err.response?.data?.error?.message || JSON.stringify(err.response?.data?.error) || err.message;
      throw new Error(`Keepa API error: ${errorMsg}`);
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

