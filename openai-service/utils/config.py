"""
Scanner configuration loader
"""
import os
import json
import glob
from typing import Dict, Any, List

# Default scanner config directory
CONFIG_PATH = os.getenv("CONFIG_PATH", "config/scanners")

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
    config_file = f"{CONFIG_PATH}/{key}.config.json"
    
    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Scanner configuration not found: {key}")
    
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
            
        # Validate required fields
        required_fields = ["scannerKey", "name", "metrics"]
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Scanner config missing required field: {field}")
        
        # Ensure scanner is enabled
        if not config.get("enabled", True):
            raise ValueError(f"Scanner {key} is disabled")
            
        return config
        
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON in scanner config {key}: {str(e)}", e.doc, e.pos)

def get_enabled_scanners() -> list:
    """
    Get a list of all enabled scanner keys
    
    Returns:
        List of enabled scanner keys
    """
    scanner_keys = []
    
    # Get all .config.json files in the scanners directory
    config_files = glob.glob(f"{CONFIG_PATH}/*.config.json")
    
    for file_path in config_files:
        try:
            # Extract scanner key from filename
            file_name = os.path.basename(file_path)
            scanner_key = file_name.replace(".config.json", "")
            
            # Load config and check if enabled
            with open(file_path, 'r') as f:
                config = json.load(f)
                
            if config.get("enabled", True):
                scanner_keys.append(scanner_key)
                
        except Exception as e:
            print(f"Error loading scanner config {file_path}: {str(e)}")
            continue
            
    return scanner_keys