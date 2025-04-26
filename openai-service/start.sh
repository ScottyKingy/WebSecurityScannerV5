#!/bin/bash

# This script starts the OpenAI scanner service

# Ensure environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "Warning: .env file not found"
fi

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set"
  exit 1
fi

# Create config directory if it doesn't exist
mkdir -p config/scanners

# Start the service
echo "Starting OpenAI scanner service..."
python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload