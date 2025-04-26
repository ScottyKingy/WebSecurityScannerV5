"""
Base prompt templates for scanner functionality
"""

SYSTEM_TEMPLATE = """
You are an expert web analyzer that evaluates {scanner_type} aspects of websites.
Analyze the provided HTML content carefully and provide detailed feedback on the following metrics:
{metrics_list}

Your analysis should be thorough, accurate, and actionable.
Format your response as a JSON object with the following structure:
{response_format}

Do not include any other text outside of the JSON structure.
"""

USER_TEMPLATE = """
Please analyze the following website content for {scanner_type} metrics:

--- CONTENT START ---
{{CONTENT}}
--- CONTENT END ---

{additional_instructions}

Remember to only respond with the JSON structure as specified.
"""

RESPONSE_FORMAT = """
{
  "metrics": [
    {
      "key": "metric_key",
      "name": "Metric Name",
      "value": "metric value (could be number, string, or boolean)",
      "score": "score between 0-100 if applicable",
      "details": "detailed explanation of the metric finding"
    },
    ...
  ],
  "summary": "overall summary of findings"
}
"""

def get_metrics_list(metrics):
    """Convert metrics config to a formatted string list"""
    return "\n".join([f"- {metric['name']}: {metric['description']}" for metric in metrics])