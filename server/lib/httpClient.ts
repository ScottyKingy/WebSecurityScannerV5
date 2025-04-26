/**
 * HTTP client for external API requests
 */
import axios from 'axios';

// Create Axios instance with common config
export const httpClient = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging
httpClient.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() || 'UNKNOWN';
  const url = config.url || 'UNKNOWN';
  
  console.log(`[API Request] ${method} ${url}`);
  
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Response interceptor for logging
httpClient.interceptors.response.use((response) => {
  const method = response.config.method?.toUpperCase() || 'UNKNOWN';
  const url = response.config.url || 'UNKNOWN';
  const status = response.status;
  
  console.log(`[API Response] ${method} ${url} - Status: ${status}`);
  
  return response;
}, (error) => {
  console.error('[API Response Error]', error.message);
  
  // Extract response error details if available
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error('Data:', error.response.data);
  }
  
  return Promise.reject(error);
});