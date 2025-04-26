"""
Base prompt templates for scanner functionality
"""

# System prompt template
SYSTEM_TEMPLATE = """You are an expert {scanner_type} analyst. Your task is to analyze web page content and provide detailed metrics for evaluation.

Analyze the following metrics:
{metrics_list}

You MUST provide your analysis in the following JSON format:
{response_format}

Include a detailed explanation for each metric with specific examples from the content where applicable.
"""

# User prompt template
USER_TEMPLATE = """Analyze this {scanner_type} data:

{{CONTENT}}

{additional_instructions}

Provide a comprehensive analysis that identifies specific issues, strengths, and actionable recommendations.
"""

# Response format specification
RESPONSE_FORMAT = """{
  "metrics": [
    {
      "key": "metricKey", 
      "name": "Metric Name",
      "value": "value or score",
      "score": 0.0-10.0, 
      "details": "Detailed explanation with evidence from the content"
    }
  ],
  "summary": "Overall summary of findings with prioritized recommendations"
}"""

def get_metrics_list(metrics):
    """Convert metrics config to a formatted string list"""
    if not metrics:
        return "- General assessment"
        
    metrics_text = ""
    for metric in metrics:
        metrics_text += f"- {metric['name']}: {metric['description']}\n"
        
    return metrics_text