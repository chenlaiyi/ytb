/**
 * API迁移配置
 * 控制V1 API的启用状态
 */

export const API_MIGRATION_CONFIG = {
  // 认证相关API迁移开关
  auth: {
    enabled: false,           // 是否启用V1认证API
    fallbackEnabled: true,    // 是否启用降级到原生API
    
    // 具体功能开关
    wechatLogin: false,       // 微信登录
    smsLogin: false,          // 短信登录
    userInfo: false,          // 用户信息获取
    logout: false             // 登出
  },
  
  // VIP相关API迁移开关
  vip: {
    enabled: true,            // VIP API已迁移完成
    fallbackEnabled: false    // VIP不需要降级
  },
  
  // 全局开关
  global: {
    enableV1Migration: false, // 全局V1迁移开关
    debugMode: true           // 调试模式，显示详细日志
  }
};

/**
 * 检查特定模块是否启用V1 API
 */
export function isV1Enabled(module) {
  return API_MIGRATION_CONFIG[module]?.enabled || false;
}

/**
 * 检查是否启用降级
 */
export function isFallbackEnabled(module) {
  return API_MIGRATION_CONFIG[module]?.fallbackEnabled || false;
}

/**
 * 启用V1 API迁移
 */
export function enableV1Migration(module) {
  if (API_MIGRATION_CONFIG[module]) {
    API_MIGRATION_CONFIG[module].enabled = true;
    console.log(`✅ 已启用${module}模块的V1 API`);
  }
}
