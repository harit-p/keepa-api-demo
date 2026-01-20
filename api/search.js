// Vercel serverless function
import { demoKeepaBrandDiscovery } from "../demo.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let keyword;

    // Support both GET and POST
    if (req.method === 'GET') {
      keyword = req.query?.keyword;
    } else if (req.method === 'POST') {
      // Parse body if it's a string (Vercel sometimes sends string)
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      keyword = body?.keyword;
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!keyword) {
      return res.status(400).json({
        error: "Missing keyword parameter",
        example: "/api/search?keyword=tablecraft"
      });
    }

    // Log environment check
    console.log("🔍 Environment check - KEEPA_KEY exists:", !!process.env.KEEPA_KEY);
    console.log("🔍 KEEPA_KEY length:", process.env.KEEPA_KEY?.length || 0);
    
    let results;
    try {
      results = await demoKeepaBrandDiscovery(keyword);
    } catch (error) {
      // Handle Keepa API errors with detailed messages
      console.error("❌ Keepa API Error:", error.message);
      console.error("❌ Error stack:", error.stack);
      
      if (error.message.includes("Invalid Keepa API key") || error.message.includes("KEEPA_KEY")) {
        return res.status(401).json({
          success: false,
          error: "Keepa API key is missing or invalid",
          message: error.message,
          hint: "Please set KEEPA_KEY environment variable in Vercel dashboard",
          troubleshooting: "Go to Vercel Dashboard → Settings → Environment Variables → Add KEEPA_KEY"
        });
      }
      
      if (error.message.includes("rate limit")) {
        return res.status(429).json({
          success: false,
          error: "Keepa API rate limit exceeded",
          message: error.message,
          hint: "Please wait a few minutes and try again"
        });
      }
      
      // Return error details for debugging
      return res.status(500).json({
        success: false,
        error: "Keepa API error",
        message: error.message,
        keyword: keyword
      });
    }

    // Handle no results case
    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        keyword,
        count: 0,
        products: [],
        message: "No results found for this keyword",
        explanation: {
          step1: "Called Keepa's /query API with keyword to discover ASINs",
          step2: "No ASINs found for the given keyword",
          step3: "Try a different keyword"
        }
      });
    }

    return res.status(200).json({
      success: true,
      keyword,
      count: results.length,
      products: results,
      explanation: {
        step1: "Called Keepa's /query API with keyword to discover ASINs",
        step2: "Called /product API with ASINs to fetch product details (brand, manufacturer)",
        step3: "ASIN is the join key between the two API calls"
      }
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}

