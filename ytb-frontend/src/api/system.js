import axios from 'axios';
import { getAdminToken } from '@/utils/admin-token-bridge'

// 创建axios实例
const service = axios.create({
    baseURL: window.location.origin,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// 请求拦截器
service.interceptors.request.use(
    config => {
        const token = getAdminToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
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
        return response.data;
    },
    error => {
        console.error('响应错误:', error);
        return Promise.reject(error);
    }
);

// 获取服务器信息
export const getServerInfo = () => {
    return service.get('/Tapp/admin/api/system/server-info.php');
};

// 获取服务器进程列表
export const getServerProcesses = (params = {}) => {
    return service.get('/Tapp/admin/api/system/processes.php', { params });
};

// 获取服务器日志
export const getServerLogs = (params = {}) => {
    return service.get('/Tapp/admin/api/system/logs.php', { params });
};

// 获取服务状态
export const getServiceStatus = () => {
    return service.get('/Tapp/admin/api/system/services.php');
};

// 重启服务
export const restartService = (serviceName) => {
    return service.post('/Tapp/admin/api/system/restart-service.php', { service: serviceName });
};

// 停止服务
export const stopService = (serviceName) => {
    return service.post('/Tapp/admin/api/system/stop-service.php', { service: serviceName });
};

// 启动服务
export const startService = (serviceName) => {
    return service.post('/Tapp/admin/api/system/start-service.php', { service: serviceName });
};

// 获取系统配置
export const getSystemConfig = () => {
    return service.get('/Tapp/admin/api/system/config.php');
};

// 更新系统配置
export const updateSystemConfig = (data) => {
    return service.post('/Tapp/admin/api/system/config.php', data);
};

export default {
    getServerInfo,
    getServerProcesses,
    getServerLogs,
    getServiceStatus,
    restartService,
    stopService,
    startService,
    getSystemConfig,
    updateSystemConfig
}; 
