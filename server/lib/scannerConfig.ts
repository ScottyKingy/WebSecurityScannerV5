/**
 * Scanner configuration management
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default path for scanner configuration files
const CONFIG_PATH = process.env.SCANNER_CONFIG_PATH || path.join(__dirname, '../../openai-service/config/scanners');

/**
 * Load scanner configuration from a config file
 * @param key Scanner key identifier
 * @returns Scanner configuration object
 */
export function loadScannerConfig(key: string): any {
  try {
    const configPath = path.join(CONFIG_PATH, `${key}.config.json`);
    
    if (!fs.existsSync(configPath)) {
      console.error(`Scanner config not found: ${configPath}`);
      return null;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Error loading scanner config for ${key}:`, error);
    return null;
  }
}

/**
 * Get a list of enabled scanners from config files
 * @returns Array of enabled scanner keys
 */
export function getEnabledScanners(): string[] {
  try {
    const scanners: string[] = [];
    
    // Ensure the config directory exists
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error(`Scanner config directory not found: ${CONFIG_PATH}`);
      return scanners;
    }
    
    // Read all .config.json files in the directory
    const files = fs.readdirSync(CONFIG_PATH)
      .filter(file => file.endsWith('.config.json'));
      
    for (const file of files) {
      try {
        // Extract the scanner key from the filename
        const key = file.replace('.config.json', '');
        
        // Load the config to check if it's enabled
        const configPath = path.join(CONFIG_PATH, file);
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        if (config.enabled !== false) {
          scanners.push(key);
        }
      } catch (e) {
        console.error(`Error processing scanner config ${file}:`, e);
      }
    }
    
    return scanners;
  } catch (error) {
    console.error(`Error getting enabled scanners:`, error);
    return [];
  }
}