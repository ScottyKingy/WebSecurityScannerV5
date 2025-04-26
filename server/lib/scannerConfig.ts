import fs from 'fs';
import path from 'path';

/**
 * Load scanner configuration from a config file
 * @param key Scanner key identifier
 * @returns Scanner configuration object
 */
export function loadScannerConfig(key: string): any {
  try {
    const file = path.resolve("config/scanners", `${key}.config.json`);
    if (!fs.existsSync(file)) {
      console.error(`Scanner config file not found: ${file}`);
      return null;
    }
    const data = fs.readFileSync(file, "utf-8");
    return JSON.parse(data);
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
    const dir = path.resolve("config/scanners");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created scanner config directory: ${dir}`);
      return [];
    }
    
    return fs.readdirSync(dir)
      .filter(f => f.endsWith(".config.json"))
      .map(f => {
        const configKey = f.replace(".config.json", "");
        return loadScannerConfig(configKey);
      })
      .filter(cfg => cfg && cfg.enabled)
      .map(cfg => cfg.scannerKey);
  } catch (error) {
    console.error("Error getting enabled scanners:", error);
    return [];
  }
}