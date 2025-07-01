// 后端API基础地址配置
// 例如：开发环境可用 http://localhost:8080，生产环境可用 /api
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8015';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api; 