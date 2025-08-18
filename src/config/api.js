// Cấu hình API URL cho production và development
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5001/api'
  },
  production: {
    baseURL: 'https://lottery-api-lfe3.onrender.com/api'
  }
};

const environment = process.env.NODE_ENV || 'development';
const config = API_CONFIG[environment];

export const API_BASE_URL = config.baseURL;

// Helper function để tạo full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export default config
export default config; 