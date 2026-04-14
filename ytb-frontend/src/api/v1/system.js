import request from '@/utils/request'

// 获取服务器信息
export function getServerInfo() {
    return request({
        url: '/api/admin/v1/system/server-info',
        method: 'get'
    })
}

// 获取服务器进程列表
export function getServerProcesses(params = {}) {
    return request({
        url: '/api/admin/v1/system/processes',
        method: 'get',
        params
    })
}

// 获取服务器日志
export function getServerLogs(params = {}) {
    return request({
        url: '/api/admin/v1/system/logs',
        method: 'get',
        params
    })
}

// 获取服务状态
export function getServiceStatus() {
    return request({
        url: '/api/admin/v1/system/services',
        method: 'get'
    })
}

// 重启服务
export function restartService(serviceName) {
    return request({
        url: '/api/admin/v1/system/restart-service',
        method: 'post',
        data: { service: serviceName }
    })
}

// 停止服务
export function stopService(serviceName) {
    return request({
        url: '/api/admin/v1/system/stop-service',
        method: 'post',
        data: { service: serviceName }
    })
}

// 启动服务
export function startService(serviceName) {
    return request({
        url: '/api/admin/v1/system/start-service',
        method: 'post',
        data: { service: serviceName }
    })
}

// 获取系统配置
export function getSystemConfig() {
    return request({
        url: '/api/admin/v1/system/config',
        method: 'get'
    })
}

// 更新系统配置
export function updateSystemConfig(data) {
    return request({
        url: '/api/admin/v1/system/config',
        method: 'post',
        data
    })
}

// SSL证书管理相关接口

// 获取SSL证书列表
export function getSslCertificates() {
    return request({
        url: '/api/admin/v1/system/ssl-certificates',
        method: 'get'
    })
}

// 获取SSL证书详情
export function getSslCertificateDetail(domain, params = {}) {
    return request({
        url: `/api/admin/v1/system/ssl-certificates/${domain}`,
        method: 'get',
        params
    })
}

// 上传SSL证书
export function uploadSslCertificate(data) {
    return request({
        url: '/api/admin/v1/system/ssl-certificates',
        method: 'post',
        data
    })
}

// 续期SSL证书
export function renewSslCertificate(domain) {
    return request({
        url: `/api/admin/v1/system/ssl-certificates/${domain}/renew`,
        method: 'post'
    })
}

// 删除SSL证书
export function deleteSslCertificate(domain) {
    return request({
        url: `/api/admin/v1/system/ssl-certificates/${domain}`,
        method: 'delete'
    })
}

// 下载SSL证书
export function downloadSslCertificate(domain) {
    return request({
        url: `/api/admin/v1/system/ssl-certificates/${domain}/download`,
        method: 'get',
        responseType: 'blob'
    })
}

// 检查SSL证书状态
export function checkSslCertificateStatus(domain) {
    return request({
        url: `/api/admin/v1/system/ssl-certificates/${domain}/check`,
        method: 'post'
    })
}

// 申请Let's Encrypt证书
export function applyLetsEncryptCertificate(data) {
    return request({
        url: '/api/admin/v1/system/ssl-certificates/letsencrypt',
        method: 'post',
        data
    })
}

// 添加自定义证书
export function addCustomCertificate(data) {
    return request({
        url: '/api/admin/v1/system/ssl-certificates/custom',
        method: 'post',
        data
    })
}

// 终端管理相关API

// 执行终端命令
export function executeCommand(data) {
    return request({
        url: '/api/admin/v1/system/terminal/execute',
        method: 'post',
        data
    })
}

// AI命令建议
export function aiSuggestCommand(data) {
    return request({
        url: '/api/admin/v1/system/terminal/ai-suggest',
        method: 'post',
        data
    })
}

// 获取系统状态
export function getTerminalSystemStatus() {
    return request({
        url: '/api/admin/v1/system/terminal/system-status',
        method: 'get'
    })
}

// 获取命令历史
export function getCommandHistory() {
    return request({
        url: '/api/admin/v1/system/terminal/command-history',
        method: 'get'
    })
}