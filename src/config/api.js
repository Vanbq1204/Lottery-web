// Cấu hình API URL cho production và development
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5001/api'
  },
  production: {
    baseURL: 'https://lottery-api-lfe3.onrender.com/api'
  }
};

// Cấu hình API bên ngoài
const EXTERNAL_API_CONFIG = {
  development: {
    lotteryAPI: 'https://xoso188.net/api/front/open/lottery/history/list/game?limitNum=5&gameCode=hano'
  },
  production: {
    lotteryAPI: 'https://xoso188.net/api/front/open/lottery/history/list/5/miba'
  }
};

const environment = process.env.NODE_ENV || 'development';
const config = API_CONFIG[environment];
const externalConfig = EXTERNAL_API_CONFIG[environment];

export const API_BASE_URL = config.baseURL;
export const EXTERNAL_LOTTERY_API = externalConfig.lotteryAPI;

// Helper function để tạo full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export default config
export default config; 