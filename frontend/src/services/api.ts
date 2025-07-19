import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加认证token等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 400:
          message.error(data.message || '请求参数错误');
          break;
        case 401:
          message.error('未授权，请重新登录');
          // 这里可以跳转到登录页
          break;
        case 403:
          message.error('拒绝访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接');
    } else {
      message.error('网络错误，请稍后重试');
    }
    
    return Promise.reject(error);
  }
);

export default api;