"""
OpenAI API integration for scanner service
"""
import os
import time
import logging
from typing import Dict, Any, Optional
import openai
from openai import OpenAI
from models.schemas import TokenUsage

# Set up logging
logger = logging.getLogger(__name__)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def call_openai(payload: Dict[str, Any], retries: int = 3, backoff_factor: float = 1.5) -> Dict[str, Any]:
    """
    Call the OpenAI API with retry logic
    
    Args:
        payload: The OpenAI API request payload
        retries: Number of retry attempts for rate limits
        backoff_factor: Exponential backoff factor between retries
        
    Returns:
        Dictionary containing the response content and usage statistics
        
    Raises:
        ValueError: If OpenAI API key is not set or other API errors
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    # Track token usage
    token_usage = None
    attempt = 0
    
    while attempt < retries:
        try:
            logger.info(f"Calling OpenAI API with model: {payload.get('model', 'unknown')}")
            
            # Make API call
            response = client.chat.completions.create(**payload)
            
            # Extract response content
            content = response.choices[0].message.content
            
            # Extract token usage if available
            if hasattr(response, 'usage'):
                token_usage = TokenUsage(
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens
                )
                logger.info(f"Token usage: {token_usage.total_tokens} total tokens")
            
            # Return the response with usage statistics
            return {
                "content": content,
                "tokens_used": token_usage.total_tokens if token_usage else None
            }
            
        except openai.RateLimitError:
            attempt += 1
            if attempt >= retries:
                raise ValueError("Rate limit exceeded after multiple retries")
                
            # Exponential backoff
            sleep_time = backoff_factor ** attempt
            logger.warning(f"Rate limit hit, retrying in {sleep_time:.2f} seconds (attempt {attempt}/{retries})")
            time.sleep(sleep_time)
            
        except openai.APIError as e:
            raise ValueError(f"OpenAI API error: {str(e)}")
            
        except Exception as e:
            raise ValueError(f"Error calling OpenAI API: {str(e)}")
            
    # This should not be reached due to the raises above
    raise ValueError("Failed to get response from OpenAI API after multiple attempts")