/**
 * Integration with the OpenAI Python microservice
 */
import { httpClient } from './httpClient';

// URL for the OpenAI microservice
const OPENAI_SERVICE_URL = process.env.OPENAI_SERVICE_URL || 'http://localhost:8000';

/**
 * Run a scanner prompt through the OpenAI service
 * @param scannerKey The scanner key (e.g., 'performance', 'seo', 'security')
 * @param content HTML content to analyze
 * @param context Additional context for the analysis
 */
export async function runScannerPrompt(scannerKey: string, content: string, context: Record<string, any> = {}) {
  try {
    console.log(`Sending ${scannerKey} scan request to OpenAI service`);
    
    const response = await httpClient.post(`${OPENAI_SERVICE_URL}/run`, {
      scanner_key: scannerKey,
      content,
      context
    });
    
    console.log(`Received ${scannerKey} scan results (${response.data.metrics?.length || 0} metrics)`);
    
    return response.data;
  } catch (error) {
    console.error(`Error calling OpenAI service for ${scannerKey} scan:`, error);
    
    // Attempt to extract meaningful error message from response
    if (error.response?.data?.detail) {
      throw new Error(`OpenAI service error: ${error.response.data.detail}`);
    }
    
    throw new Error(`Failed to run ${scannerKey} scan: ${error.message}`);
  }
}

/**
 * Get a list of available scanners from the service
 */
export async function getAvailableScanners() {
  try {
    const response = await httpClient.get(`${OPENAI_SERVICE_URL}/scanners`);
    return response.data.scanners || [];
  } catch (error) {
    console.error('Error fetching available scanners:', error);
    return [];
  }
}

/**
 * Check the health of the OpenAI service
 */
export async function checkOpenAIServiceHealth() {
  try {
    const response = await httpClient.get(`${OPENAI_SERVICE_URL}/health`);
    return {
      healthy: response.data.status === 'healthy',
      ...response.data
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'unavailable',
      error: error.message
    };
  }
}