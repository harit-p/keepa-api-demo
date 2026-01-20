#!/usr/bin/env node
/**
 * Quick test script to verify real-time Keepa data
 * Run: node test-realtime.js
 */

import { demoKeepaBrandDiscovery } from './demo.js';

const testKeywords = ['tablecraft', 'laptop', 'coffee', 'phone'];

console.log('🧪 Testing Real-Time Keepa Data\n');
console.log('='.repeat(60));
console.log('');

for (const keyword of testKeywords) {
  console.log(`📝 Testing keyword: "${keyword}"`);
  console.log('-'.repeat(60));
  
  try {
    const results = await demoKeepaBrandDiscovery(keyword);
    
    if (results.length === 0) {
      console.log('❌ No results found');
    } else {
      console.log(`✅ Found ${results.length} products`);
      console.log(`   First ASIN: ${results[0].asin}`);
      console.log(`   First Title: ${results[0].title.substring(0, 60)}...`);
      console.log(`   First Brand: ${results[0].brand}`);
      
      // Verify it's real data (not mock)
      const isRealData = results[0].asin.startsWith('B0') || results[0].asin.startsWith('B00');
      if (isRealData) {
        console.log('   ✅ Real ASIN detected');
      } else {
        console.log('   ⚠️  Suspicious ASIN format');
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

console.log('='.repeat(60));
console.log('\n✅ Verification Complete!');
console.log('\nIf you see:');
console.log('  - Different ASINs for different keywords ✅');
console.log('  - Real product titles ✅');
console.log('  - Valid brand names ✅');
console.log('  - ASINs starting with B0 or B00 ✅');
console.log('\nThen you\'re using REAL-TIME Keepa data! 🎉');

