"""
FastAPI server for OpenAI scanner integration
"""
import os
import logging
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables
load_dotenv()

# Import utility modules
from models.schemas import PromptRequest, OpenAIResponse
from utils.config import load_scanner_config, get_enabled_scanners
from utils.compiler import compile_prompt, parse_openai_response
from utils.openai_api import call_openai

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OpenAI Scanner Service",
    description="API for compiling prompts and running them against the OpenAI API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"status": "ok", "message": "OpenAI Scanner Service is running"}

@app.get("/scanners")
async def list_scanners():
    """List all available scanners"""
    try:
        enabled_scanners = get_enabled_scanners()
        scanner_info = []
        
        for key in enabled_scanners:
            try:
                config = load_scanner_config(key)
                scanner_info.append({
                    "key": key,
                    "name": config.get("name", key),
                    "description": config.get("description", ""),
                    "tier_access": config.get("tierAccess", []),
                    "metrics_count": len(config.get("metrics", [])),
                    "credits": config.get("creditsPerScan", 1)
                })
            except Exception as e:
                logger.error(f"Error loading scanner config for {key}: {str(e)}")
                
        return {"scanners": scanner_info}
    except Exception as e:
        logger.error(f"Error listing scanners: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run", response_model=OpenAIResponse)
async def run_prompt(data: PromptRequest):
    """
    Run a prompt against OpenAI API
    
    Args:
        data: The PromptRequest containing scanner key, content, and context
        
    Returns:
        OpenAIResponse with parsed metrics, summary, and usage statistics
    """
    try:
        # Log the request
        logger.info(f"Received request for scanner: {data.scanner_key}")
        
        # Load scanner configuration
        config = load_scanner_config(data.scanner_key)
        
        # Compile the prompt
        payload = compile_prompt(config, data.content, data.context)
        
        # Call OpenAI API
        response = await call_openai(payload)
        
        # Parse the response
        result = parse_openai_response(response["content"], data.scanner_key)
        
        # Add token usage information
        result["tokens_used"] = response.get("tokens_used")
        
        # Return the result
        return result
        
    except FileNotFoundError as e:
        logger.error(f"Scanner not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
        
    except ValueError as e:
        logger.error(f"Invalid request or configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check if OpenAI API key is set
    api_key = os.getenv("OPENAI_API_KEY")
    api_status = "available" if api_key else "unavailable"
    
    # Check if scanner configurations exist
    config_path = os.getenv("CONFIG_PATH", "config/scanners")
    config_status = "available" if os.path.exists(config_path) else "unavailable"
    
    return {
        "status": "healthy",
        "openai_api": api_status,
        "config": config_status,
        "scanners_available": len(get_enabled_scanners())
    }

if __name__ == "__main__":
    import uvicorn
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Start the server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)