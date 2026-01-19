import express from "express";
import cors from "cors";
import { demoKeepaBrandDiscovery } from "./demo.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Keepa API Demo Server",
    endpoints: {
      "GET /api/search?keyword=tablecraft": "Search products by keyword",
      "POST /api/search": "Search products by keyword (body: { keyword: 'tablecraft' })",
      "GET /health": "Health check"
    },
    example: "http://localhost:3000/api/search?keyword=tablecraft"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET endpoint: /api/search?keyword=tablecraft
app.get("/api/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({
        error: "Missing keyword parameter",
        example: "/api/search?keyword=tablecraft"
      });
    }

    console.log(`🔍 API Request: Searching for "${keyword}"`);
    
    const results = await demoKeepaBrandDiscovery(keyword);

    res.json({
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
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// POST endpoint: /api/search (body: { keyword: "tablecraft" })
app.post("/api/search", async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({
        error: "Missing keyword in request body",
        example: { keyword: "tablecraft" }
      });
    }

    console.log(`🔍 API Request: Searching for "${keyword}"`);
    
    const results = await demoKeepaBrandDiscovery(keyword);

    res.json({
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
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Keepa API Demo Server running on http://localhost:${PORT}`);
  console.log(`📝 Try: http://localhost:${PORT}/api/search?keyword=tablecraft\n`);
});

