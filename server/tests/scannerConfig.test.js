// Simple test script for scanner configuration
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the scanner config functions
import { loadScannerConfig, getEnabledScanners } from '../lib/scannerConfig.js';

console.log('Testing scanner configuration loader...');

// Test loading performance scanner config
const performanceConfig = loadScannerConfig('performance');
console.log('Performance scanner loaded:', performanceConfig ? 'Yes' : 'No');
if (performanceConfig) {
  console.log('- Name:', performanceConfig.name);
  console.log('- Enabled:', performanceConfig.enabled);
  console.log('- Credits per scan:', performanceConfig.creditsPerScan);
  console.log('- Metrics count:', performanceConfig.metrics.length);
}

// Test loading SEO scanner config
const seoConfig = loadScannerConfig('seo');
console.log('\nSEO scanner loaded:', seoConfig ? 'Yes' : 'No');
if (seoConfig) {
  console.log('- Name:', seoConfig.name);
  console.log('- Enabled:', seoConfig.enabled);
  console.log('- Credits per scan:', seoConfig.creditsPerScan);
  console.log('- Metrics count:', seoConfig.metrics.length);
}

// Test loading security scanner config
const securityConfig = loadScannerConfig('security');
console.log('\nSecurity scanner loaded:', securityConfig ? 'Yes' : 'No');
if (securityConfig) {
  console.log('- Name:', securityConfig.name);
  console.log('- Enabled:', securityConfig.enabled);
  console.log('- Credits per scan:', securityConfig.creditsPerScan);
  console.log('- Metrics count:', securityConfig.metrics.length);
}

// Test getting all enabled scanners
const enabledScanners = getEnabledScanners();
console.log('\nEnabled scanners:', enabledScanners);
console.log('Total enabled scanners:', enabledScanners.length);

console.log('\nTesting complete!');