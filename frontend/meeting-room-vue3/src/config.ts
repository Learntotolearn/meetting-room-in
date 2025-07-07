// API 配置文件
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  // 基础 URL，根据环境配置
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:8015/api',
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 401 未授权，清除 token，但不自动跳转首页
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 不自动跳转，让前端自己处理
    }
    return Promise.reject(error)
  }
)

export default api 