import axios from 'axios';
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

// 创建axios实例
const service = axios.create({
  baseURL: 'https://ytb.ddg.org.cn/', // 使用完整域名，API路径已经是绝对路径
  timeout: 120000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = getAdminToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 记录所有API请求路径，便于调试
    console.log('API请求:', config.method?.toUpperCase(), config.url);

    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 记录所有成功响应
    console.log('API响应:', response.config?.method?.toUpperCase(), response.config?.url, '状态:', response.status);

    // 处理两种不同的响应格式
    // 1. { code: 0, message: '...', data: [...] }
    // 2. { data: { code: 0, message: '...', data: [...] } }
    if (response.data && typeof response.data === 'object') {
      // 如果是嵌套格式，将其打平
      if (response.data.data && response.data.data.code !== undefined) {
        response.data = response.data.data;
      }
      
      // 检查业务状态码 - 只有真正的认证错误才退登
      if (response.data.code === 401 || response.data.code === 1002) {
        // 只有在真正的认证失败时才退登
        if (response.data.message && (
          response.data.message.includes('无效的令牌或已过期') ||
          response.data.message.includes('认证失败') ||
          response.data.message.includes('token无效') ||
          response.data.message.includes('未登录') ||
          response.data.message.includes('权限不足') ||
          response.data.message.includes('请先登录')
        )) {
          console.warn('业务层认证失败，清除令牌并跳转到登录页', {
            url: response.config?.url,
            code: response.data.code,
            message: response.data.message
          });
          clearAdminToken();
          localStorage.removeItem('user');
          
          // 避免重复跳转
          if (!window.location.href.includes('/login')) {
            const baseUrl = '/admin';
            const redirectUrl = baseUrl + '/#/login';
            window.location.href = redirectUrl;
          }
          
          return Promise.reject(new Error(response.data.message || '认证失败，请重新登录'));
        }
      }
    }

    // 返回response.data而不是response对象
    return response.data;
  },
  error => {
    console.error('响应错误:', error);

    // 详细记录错误信息
    const errorInfo = {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    };
    console.error('详细错误信息:', errorInfo);

    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        console.warn('HTTP 401错误，清除令牌并跳转到登录页');
        // 清除登录状态
        clearAdminToken();
        localStorage.removeItem('user');

        // 重定向到登录页
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          const baseUrl = '/admin';
          // 在控制台输出重定向信息，便于调试
          console.warn('认证失败，即将重定向到登录页面');
          const redirectUrl = baseUrl + '/#/login?redirect=' + encodeURIComponent(currentPath);
          window.location.href = redirectUrl;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default service;
