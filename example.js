import { demoKeepaBrandDiscovery } from './demo.js';

// Example: Use the function programmatically
async function example() {
  console.log("Running Keepa API Demo Example\n");
  
  const keyword = "tablecraft";
  const results = await demoKeepaBrandDiscovery(keyword);
  
  console.log(`Found ${results.length} products for "${keyword}":\n`);
  
  results.forEach((product, index) => {
    console.log(`${index + 1}. ${product.title}`);
    console.log(`   Brand: ${product.brand}`);
    console.log(`   ASIN: ${product.asin}\n`);
  });
}

example().catch(console.error);

