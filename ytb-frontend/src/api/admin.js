import axios from 'axios';
import { getAdminToken } from '@/utils/admin-token-bridge'
import request from '@/utils/request'

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

// 管理后台API
export default {
    // 登录接口
    login(data) {
        return service.post('/api/admin/login', data);
    },

    // 获取菜单数据
    getMenus() {
        return service.get('/api/admin/v1/menus?tree=1')
            .then(response => {
                if (response && (response.code === 0 || response.code === 200) && Array.isArray(response.data)) {
                    return {
                        code: 200,
                        message: response.message || '获取成功',
                        data: response.data
                    };
                }
                throw new Error('菜单数据格式不正确');
            })
            .catch(error => {
                console.error('获取菜单失败:', error);
                // 直接抛出错误，让调用方处理
                throw error;
            });
    },

    // 退出登录
    logout() {
        return service.post('/api/admin/logout');
    },

    // 获取当前用户信息
    getCurrentUser() {
        return service.get('/api/admin/v1/auth/me');
    },

    // 获取通知列表
    getNotifications(params = {}) {
        return service.get('/api/admin/v1/notifications', { params });
    },

    // 获取未读通知数量
    getUnreadNotificationCount() {
        return service.get('/api/admin/v1/notifications/unread-count');
    },

    // 获取最新通知
    getLatestNotifications(limit = 5) {
        return service.get('/api/admin/v1/notifications/latest', { params: { limit } });
    },

    // 标记通知为已读
    markNotificationAsRead(id) {
        return service.post(`/api/admin/v1/notifications/${id}/read`);
    },

    // 标记所有通知为已读
    markAllNotificationsAsRead() {
        return service.post('/api/admin/v1/notifications/mark-all-read');
    },

    // 获取通知详情
    getNotificationDetail(id) {
        return service.get(`/api/admin/v1/notifications/${id}`);
    },

    // 删除通知
    deleteNotification(id) {
        return service.delete(`/api/admin/v1/notifications/${id}`);
    },

    // 创建通知
    createNotification(data) {
        return service.post('/api/admin/v1/notifications', data);
    },

    // 获取管理员列表
    getAdminUsers(params) {
        return service.get('/api/admin/admins', { params });
    },

    // 创建管理员
    createAdminUser(data) {
        return service.post('/api/admin/admins', data);
    },

    // 更新管理员
    updateAdminUser(id, data) {
        return service.put(`/api/admin/admins/${id}`, data);
    },

    // 删除管理员
    deleteAdminUser(id) {
        return service.delete(`/api/admin/admins/${id}`);
    },

    // 获取系统设置
    getSiteSettings() {
        return service.get('/api/settings/basic');
    },

    // 更新系统设置
    updateSiteSettings(data) {
        return service.post('/api/settings/basic', data);
    },

    // 获取微信配置
    getWechatConfig() {
        return service.get('/api/settings/wechat');
    },

    // 保存微信配置
    saveWechatConfig(data) {
        return service.post('/api/settings/wechat', data);
    },

    // 获取短信配置
    getSmsConfig() {
        return service.get('/api/settings/sms');
    },

    // 保存短信配置
    saveSmsConfig(data) {
        return service.post('/api/settings/sms', data);
    },

    // 测试短信
    testSms(data) {
        return service.post('/api/sms/test', data);
    },

    // 获取导航配置
    getNavConfig() {
        return service.get('/admin/api/nav_manager.php?type=tabbar');
    },

    // 保存导航配置
    saveNavConfig(data) {
        // 转换数据格式以适配后端API
        const payload = data.map(item => ({
            nav_id: item.nav_id,
            nav_name: item.nav_name,
            icon: item.icon,
            path: item.path,
            highlight: item.highlight,
            status: item.status,
            sort_order: item.sort_order
        }));
        
        // 使用批量更新的方式保存配置
        return this.batchUpdateNavConfig(payload);
    },

    // 批量更新导航配置
    batchUpdateNavConfig(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // 先删除现有配置，再批量添加新配置
                const deletePromises = [];
                const addPromises = [];
                
                // 获取现有配置
                const existingConfig = await service.get('/admin/api/nav_manager.php?type=tabbar');
                
                // 删除现有项目
                if (existingConfig && existingConfig.data && Array.isArray(existingConfig.data)) {
                    existingConfig.data.forEach(item => {
                        deletePromises.push(
                            service.delete(`/admin/api/nav_manager.php?type=tabbar&id=${item.id}`)
                        );
                    });
                }
                
                // 等待删除完成
                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                }
                
                // 添加新配置
                data.forEach(item => {
                    addPromises.push(
                        service.post('/admin/api/nav_manager.php?type=tabbar', item)
                    );
                });
                
                // 等待添加完成
                const results = await Promise.all(addPromises);
                
                resolve({
                    code: 0,
                    message: '保存成功',
                    data: results
                });
                
            } catch (error) {
                console.error('批量更新导航配置失败:', error);
                reject(error);
            }
        });
    },

    // 上传Logo
    uploadLogo(formData) {
        return service.post('/api/admin/upload-logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // 上传Favicon
    uploadFavicon(formData) {
        return service.post('/api/admin/settings/upload-favicon', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // 获取设备列表
    getDeviceList(params) {
        return service.get('/api/admin/v1/devices', { params });
    },

    // 获取设备详情
    getDeviceDetail(id) {
        return service.get(`/api/admin/v1/devices/${id}`);
    },

    // 更新设备
    updateDevice(id, data) {
        return service.put(`/api/admin/v1/devices/${id}`, data);
    },

    // 删除设备
    deleteDevice(id) {
        return service.delete(`/api/admin/v1/devices/${id}`);
    },

    // 获取模块配置
    getModuleConfigs(module) {
        return service.get(`/api/settings/${module}`);
    },

    // 保存模块配置
    saveModuleConfig(module, data) {
        return service.post(`/api/settings/${module}`, data);
    },

    // 更新个人资料
    updateProfile(data) {
        return service.post('/api/admin/v1/auth/update-profile', data);
    },

    // 修改密码
    changePassword(data) {
        return service.post('/api/admin/v1/auth/change-password', data);
    },

    // 获取菜单详情
    getMenu(id) {
        return service.get(`/api/admin/v1/menus/${id}`);
    },

    // 语音通知相关API
    // 获取需要语音播报的通知
    getVoiceNotifications() {
        return service.get('/api/admin/v1/voice-notifications/list');
    },

    // 标记语音通知已播放
    markVoiceNotificationPlayed(data) {
        return service.post('/api/admin/v1/voice-notifications/played', data);
    },

    // 批量标记语音通知已播放
    batchMarkVoiceNotificationPlayed(data) {
        return service.post('/api/admin/v1/voice-notifications/batch-played', data);
    },

    // 测试语音播报
    testVoiceNotification(data) {
        return service.post('/api/admin/v1/voice-notifications/test', data);
    }
};

// 管理员管理
export function getAdmins(params) {
    return request({
        url: '/api/admin/v1/system/admins',
        method: 'get',
        params
    })
}

export function getAdmin(id) {
    return request({
        url: `/api/admin/v1/system/admins/${id}`,
        method: 'get'
    })
}

export function createAdmin(data) {
    return request({
        url: '/api/admin/v1/system/admins',
        method: 'post',
        data
    })
}

export function updateAdmin(id, data) {
    return request({
        url: `/api/admin/v1/system/admins/${id}`,
        method: 'put',
        data
    })
}

export function deleteAdmin(id) {
    return request({
        url: `/api/admin/v1/system/admins/${id}`,
        method: 'delete'
    })
}

export function updateAdminStatus(id, status) {
    return request({
        url: `/api/admin/v1/system/admins/${id}/status`,
        method: 'put',
        data: { status }
    })
}

export function resetAdminPassword(id) {
    return request({
        url: `/api/admin/v1/system/admins/${id}/reset-password`,
        method: 'post'
    })
}

export function getAdminRoles() {
    return request({
        url: '/api/admin/v1/system/admins/roles',
        method: 'get'
    })
}

// 分支机构管理
export function getBranchOrganizations(params) {
    return request({
        url: '/api/admin/v1/branch-organizations',
        method: 'get',
        params
    })
}

export function getBranchOrganization(id) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'get'
    })
}

export function createBranchOrganization(data) {
    return request({
        url: '/api/admin/v1/branch-organizations',
        method: 'post',
        data
    })
}

export function updateBranchOrganization(id, data) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'put',
        data
    })
}

export function deleteBranchOrganization(id) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}`,
        method: 'delete'
    })
}

export function updateBranchOrganizationStatus(id, status) {
    return request({
        url: `/api/admin/v1/branch-organizations/${id}/status`,
        method: 'put',
        data: { status }
    })
}

export function getBranchOrganizationOptions() {
    return request({
        url: '/api/admin/v1/branch-organizations/options',
        method: 'get'
    })
}

// 分公司分红配置管理
export function getBranchDividendConfigs(params) {
    return request({
        url: '/api/admin/v1/branch-dividend-configs',
        method: 'get',
        params
    })
}

export function getBranchDividendConfig(id) {
    return request({
        url: `/api/admin/v1/branch-dividend-configs/${id}`,
        method: 'get'
    })
}

export function createBranchDividendConfig(data) {
    return request({
        url: '/api/admin/v1/branch-dividend-configs',
        method: 'post',
        data
    })
}

export function updateBranchDividendConfig(id, data) {
    return request({
        url: `/api/admin/v1/branch-dividend-configs/${id}`,
        method: 'put',
        data
    })
}

export function deleteBranchDividendConfig(id) {
    return request({
        url: `/api/admin/v1/branch-dividend-configs/${id}`,
        method: 'delete'
    })
}

export function updateBranchDividendConfigStatus(id, is_active) {
    return request({
        url: `/api/admin/v1/branch-dividend-configs/${id}/status`,
        method: 'put',
        data: { is_active }
    })
}

// 新增的分红配置功能
export function getBranchDividendStatistics() {
    return request({
        url: '/api/admin/v1/branch-dividend-configs/statistics',
        method: 'get'
    })
}

export function getBranchDividendPreview(id) {
    return request({
        url: `/api/admin/v1/branch-dividend-configs/${id}/preview`,
        method: 'get'
    })
}

export function batchOperateBranchDividendConfigs(data) {
    return request({
        url: '/api/admin/v1/branch-dividend-configs/batch',
        method: 'post',
        data
    })
}

export function exportBranchDividendConfigs(params) {
    return request({
        url: '/api/admin/v1/branch-dividend-configs/export',
        method: 'post',
        params,
        responseType: 'blob'
    })
}

export function getBranchDividendBranchOptions() {
    return request({
        url: '/api/admin/v1/branch-dividend-configs/branch-options',
        method: 'get'
    })
}

// 通知管理
export function getNotificationStatistics() {
    return request({
        url: '/api/admin/v1/notifications/statistics',
        method: 'get'
    })
}

export function clearOldNotifications() {
    return request({
        url: '/api/admin/v1/notifications/clear-old',
        method: 'delete'
    })
}

// 语音通知管理
export function getPendingVoiceNotifications() {
    return request({
        url: '/api/admin/v1/voice-notifications/pending',
        method: 'get'
    })
}

export function getVoiceNotificationStatistics() {
    return request({
        url: '/api/admin/v1/voice-notifications/statistics',
        method: 'get'
    })
}

export function getVoiceNotificationSettings() {
    return request({
        url: '/api/admin/v1/voice-notifications/settings',
        method: 'get'
    })
}

export function updateVoiceNotificationSettings(data) {
    return request({
        url: '/api/admin/v1/voice-notifications/settings',
        method: 'post',
        data
    })
}

export function markVoiceNotificationAsPlayed(id) {
    return request({
        url: `/api/admin/v1/voice-notifications/${id}/mark-played`,
        method: 'post'
    })
}

export function testVoiceNotification(data) {
    return request({
        url: '/api/admin/v1/voice-notifications/test',
        method: 'post',
        data
    })
}

export function clearTestVoiceNotifications() {
    return request({
        url: '/api/admin/v1/voice-notifications/clear-test',
        method: 'delete'
    })
}

// 定时任务管理
export function getScheduledTasks(params) {
    return request({
        url: '/api/admin/v1/scheduled-tasks',
        method: 'get',
        params
    })
}

export function getScheduledTask(id) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}`,
        method: 'get'
    })
}

export function createScheduledTask(data) {
    return request({
        url: '/api/admin/v1/scheduled-tasks',
        method: 'post',
        data
    })
}

export function updateScheduledTask(id, data) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}`,
        method: 'put',
        data
    })
}

export function deleteScheduledTask(id) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}`,
        method: 'delete'
    })
}

export function updateScheduledTaskStatus(id, is_active) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}/status`,
        method: 'put',
        data: { is_active }
    })
}

export function runScheduledTask(id) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}/run`,
        method: 'post'
    })
}

export function getScheduledTaskLogs(id, params) {
    return request({
        url: `/api/admin/v1/scheduled-tasks/${id}/logs`,
        method: 'get',
        params
    })
}

export function getScheduledTaskStatistics() {
    return request({
        url: '/api/admin/v1/scheduled-tasks/statistics',
        method: 'get'
    })
}

// 系统管理
export function getSystemInfo() {
    return request({
        url: '/api/admin/v1/system/info',
        method: 'get'
    })
}

export function getSystemConfig() {
    return request({
        url: '/api/admin/v1/system/config',
        method: 'get'
    })
}

export function updateSystemConfig(data) {
    return request({
        url: '/api/admin/v1/system/config',
        method: 'post',
        data
    })
}

export function getSystemLogs(params) {
    return request({
        url: '/api/admin/v1/system/logs',
        method: 'get',
        params
    })
}

export function clearSystemLogs() {
    return request({
        url: '/api/admin/v1/system/logs',
        method: 'delete'
    })
}

export function getSystemCacheInfo() {
    return request({
        url: '/api/admin/v1/system/cache',
        method: 'get'
    })
}

export function clearSystemCache() {
    return request({
        url: '/api/admin/v1/system/cache',
        method: 'delete'
    })
}

export function getSystemDatabaseInfo() {
    return request({
        url: '/api/admin/v1/system/database',
        method: 'get'
    })
}

export function createSystemBackup() {
    return request({
        url: '/api/admin/v1/system/backup',
        method: 'post'
    })
}

export function getSystemBackups() {
    return request({
        url: '/api/admin/v1/system/backups',
        method: 'get'
    })
}

export function deleteSystemBackup(filename) {
    return request({
        url: `/api/admin/v1/system/backups/${filename}`,
        method: 'delete'
    })
}

export function restoreSystemBackup(filename) {
    return request({
        url: `/api/admin/v1/system/restore/${filename}`,
        method: 'post'
    })
}

// OSS存储配置
export function getOssConfig() {
    return request({
        url: '/api/admin/v1/oss/config',
        method: 'get'
    })
}

export function saveOssConfig(data) {
    return request({
        url: '/api/admin/v1/oss/config',
        method: 'post',
        data
    })
}

export function testOssConnection(data) {
    return request({
        url: '/api/admin/v1/oss/test-connection',
        method: 'post',
        data
    })
}

export function getOssStats() {
    return request({
        url: '/api/admin/v1/oss/stats',
        method: 'get'
    })
}

export function migrateToOss(data) {
    return request({
        url: '/api/admin/v1/oss/migrate',
        method: 'post',
        data
    })
}
