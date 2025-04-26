# OpenAI Scanner Service

A Python microservice that integrates with OpenAI to perform website scanning and analysis.

## Overview

This service provides:
- Scanner configuration management
- Prompt compilation based on scanner type
- OpenAI API integration with error handling
- JSON response parsing with metrics extraction

## Setup

1. Install dependencies:
   ```
   pip install fastapi uvicorn python-dotenv openai pydantic
   ```

2. Configure environment variables:
   Copy the `.env.example` file to `.env` and update:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: Port for the service (default: 8000)
   - `CONFIG_PATH`: Path to scanner configurations (default: config/scanners)

3. Run the service:
   ```
   ./start.sh
   ```
   or
   ```
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

- `GET /`: Root endpoint, health check
- `GET /scanners`: List all available scanners
- `POST /run`: Run a scanner prompt
- `GET /health`: Service health check

## Scanner Configuration

Scanner configuration files define the metrics, prompts, and parameters for each scan type. 
They are located in the `config/scanners` directory and follow this format:

```json
{
  "scannerKey": "example",
  "name": "Example Scanner",
  "description": "Description of scanner functionality",
  "version": "1.0.0",
  "enabled": true,
  "creditsPerScan": 1,
  "tierAccess": ["lite", "deep", "ultimate", "enterprise"],
  "model": "gpt-4o",
  "tokenLimit": 2048,
  "metrics": [
    {
      "key": "metricKey",
      "name": "Metric Name",
      "description": "Description of the metric",
      "unit": "unit-type"
    }
  ]
}
```