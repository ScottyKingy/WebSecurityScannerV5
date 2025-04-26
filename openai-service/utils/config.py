"""
Scanner configuration loader
"""
import json
import os
from typing import Dict, Any, Optional

def load_scanner_config(key: str) -> Dict[str, Any]:
    """
    Load a scanner configuration file by key
    
    Args:
        key: Scanner key identifier (e.g., 'performance', 'seo')
        
    Returns:
        The scanner configuration as a dictionary
        
    Raises:
        FileNotFoundError: If the scanner config file doesn't exist
        json.JSONDecodeError: If the config file contains invalid JSON
    """
    base_path = os.getenv("CONFIG_PATH", "config/scanners")
    path = os.path.join(base_path, f"{key}.config.json")
    
    try:
        with open(path, "r") as f:
            config = json.load(f)
            
        # Ensure the config has the required fields
        if "scannerKey" not in config or config["scannerKey"] != key:
            raise ValueError(f"Invalid scanner configuration: scannerKey mismatch or missing for {key}")
            
        return config
    except FileNotFoundError:
        raise FileNotFoundError(f"Scanner configuration not found for key: {key}")
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON in scanner configuration for key: {key}")

def get_enabled_scanners() -> list:
    """
    Get a list of all enabled scanner keys
    
    Returns:
        List of enabled scanner keys
    """
    base_path = os.getenv("CONFIG_PATH", "config/scanners")
    
    if not os.path.exists(base_path):
        return []
        
    scanner_files = [
        f for f in os.listdir(base_path)
        if f.endswith(".config.json")
    ]
    
    enabled_scanners = []
    for file in scanner_files:
        try:
            key = file.replace(".config.json", "")
            config = load_scanner_config(key)
            if config.get("enabled", False):
                enabled_scanners.append(key)
        except Exception as e:
            print(f"Error loading scanner config {file}: {str(e)}")
            
    return enabled_scanners