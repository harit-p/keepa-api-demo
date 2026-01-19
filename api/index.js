// Vercel serverless function for root/homepage
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Return API information
  return res.status(200).json({
    message: "Keepa API Demo Server",
    version: "1.0.0",
    endpoints: {
      "GET /api/search?keyword=tablecraft": "Search products by keyword",
      "POST /api/search": "Search products by keyword (body: { keyword: 'tablecraft' })"
    },
    examples: {
      "Search Tablecraft": "https://demo-fb3xv677j-harit-ps-projects.vercel.app/api/search?keyword=tablecraft",
      "Search Kitchen": "https://demo-fb3xv677j-harit-ps-projects.vercel.app/api/search?keyword=kitchen",
      "Search Coffee": "https://demo-fb3xv677j-harit-ps-projects.vercel.app/api/search?keyword=coffee"
    },
    howItWorks: {
      step1: "Call Keepa's /query API with keyword to discover ASINs",
      step2: "Call /product API with ASINs to fetch product details (brand, manufacturer)",
      step3: "ASIN is the join key between the two API calls"
    }
  });
}

