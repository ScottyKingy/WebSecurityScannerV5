"""
Prompt compiler for scanner configurations
"""
import json
from typing import Dict, Any, List
from prompts.base_prompt import SYSTEM_TEMPLATE, USER_TEMPLATE, RESPONSE_FORMAT, get_metrics_list

def compile_prompt(config: Dict[str, Any], content: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Compile a prompt based on the scanner configuration
    
    Args:
        config: Scanner configuration dictionary
        content: The website content to analyze
        context: Additional context variables for the prompt
        
    Returns:
        A dictionary containing the OpenAI API payload
    """
    # Extract configuration details
    scanner_type = config.get("name", "website")
    scanner_metrics = config.get("metrics", [])
    
    # Format the metrics list
    metrics_list = get_metrics_list(scanner_metrics)
    
    # Prepare system prompt
    system_prompt = SYSTEM_TEMPLATE.format(
        scanner_type=scanner_type,
        metrics_list=metrics_list,
        response_format=RESPONSE_FORMAT
    )
    
    # Prepare user prompt with content
    additional_instructions = context.get("additional_instructions", "")
    user_prompt = USER_TEMPLATE.format(
        scanner_type=scanner_type,
        additional_instructions=additional_instructions
    ).replace("{{CONTENT}}", content)
    
    # Determine the model to use
    model = config.get("model", "gpt-4o")
    token_limit = config.get("tokenLimit", 2048)
    
    # Prepare the OpenAI API payload
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": token_limit,
        "response_format": {"type": "json_object"}
    }
    
    # Log the compiled prompt for debugging
    print(f"Compiled prompt for {config.get('scannerKey')} scanner")
    
    return payload

def parse_openai_response(response_text: str, scanner_key: str) -> Dict[str, Any]:
    """
    Parse the OpenAI response into a structured format
    
    Args:
        response_text: Raw text response from OpenAI
        scanner_key: The scanner key used for the request
        
    Returns:
        Structured response dictionary
    """
    try:
        # Attempt to parse JSON from the response
        response_data = json.loads(response_text)
        
        # Ensure required fields exist
        if "metrics" not in response_data or "summary" not in response_data:
            raise ValueError("Response missing required fields")
            
        # Validate each metric has required fields
        for metric in response_data["metrics"]:
            if "key" not in metric or "name" not in metric or "value" not in metric:
                raise ValueError(f"Metric missing required fields: {metric}")
        
        # Return structured response
        return {
            "scanner_key": scanner_key,
            "metrics": response_data["metrics"],
            "summary": response_data["summary"],
            "raw_response": response_text
        }
        
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse JSON from OpenAI response: {response_text[:100]}...")