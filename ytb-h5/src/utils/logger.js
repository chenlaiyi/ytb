/**
 * 日志工具类
 * 用于记录前端日志并发送到服务器
 */

// 日志级别
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// 日志类型
const LogType = {
  WECHAT_ADDRESS: 'wechat_address',
  WECHAT_PAYMENT: 'wechat_payment'
};

/**
 * 发送日志到服务器
 * 
 * @param {string} type 日志类型
 * @param {string} event 事件名称
 * @param {string} message 日志消息
 * @param {object} context 上下文数据
 * @param {string} level 日志级别
 * @returns {Promise} 发送结果
 */
const sendLog = async (type, event, message, context = {}, level = LogLevel.INFO) => {
  try {
    // 构建日志数据
    const logData = {
      event,
      message,
      context,
      level
    };

    // 确定API URL
    let apiUrl = '';
    switch (type) {
      case LogType.WECHAT_ADDRESS:
        apiUrl = '/api/logs/log_wechat_address.php';
        break;
      case LogType.WECHAT_PAYMENT:
        apiUrl = '/api/logs/log_wechat_payment.php';
        break;
      default:
        console.error(`[Logger] Unknown log type: ${type}`);
        return false;
    }

    // 发送日志
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });

    // 检查响应
    if (!response.ok) {
      console.error(`[Logger] Failed to send log: ${response.status} ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    return result.code === 0;
  } catch (error) {
    console.error('[Logger] Error sending log:', error);
    return false;
  }
};

/**
 * 记录微信地址选择日志
 * 
 * @param {string} event 事件名称
 * @param {string} message 日志消息
 * @param {object} context 上下文数据
 * @param {string} level 日志级别
 * @returns {Promise} 发送结果
 */
const logWechatAddress = (event, message, context = {}, level = LogLevel.INFO) => {
  // 同时在控制台输出日志
  console.log(`[WechatAddress][${event}] ${message}`, context);
  
  // 发送到服务器
  return sendLog(LogType.WECHAT_ADDRESS, event, message, context, level);
};

/**
 * 记录微信支付日志
 * 
 * @param {string} event 事件名称
 * @param {string} message 日志消息
 * @param {object} context 上下文数据
 * @param {string} level 日志级别
 * @returns {Promise} 发送结果
 */
const logWechatPayment = (event, message, context = {}, level = LogLevel.INFO) => {
  // 同时在控制台输出日志
  console.log(`[WechatPayment][${event}] ${message}`, context);
  
  // 发送到服务器
  return sendLog(LogType.WECHAT_PAYMENT, event, message, context, level);
};

// 导出日志工具
export {
  LogLevel,
  LogType,
  logWechatAddress,
  logWechatPayment
};
