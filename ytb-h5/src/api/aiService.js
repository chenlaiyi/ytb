/**
 * AI智能客服相关API
 */

import request from '@/utils/request'

/**
 * 发送消息到AI客服
 * @param {Object} data 消息数据
 * @param {string} data.message 用户消息
 * @param {string} data.session_id 会话ID
 * @returns {Promise<Object>} AI回复
 */
export function sendAiMessage(data) {
  return request({
    url: '/api/app/v1/ai-service/chat',
    method: 'post',
    data
  })
}

/**
 * 获取会话历史记录
 * @param {string} sessionId 会话ID
 * @returns {Promise<Object>} 历史记录
 */
export function getAiHistory(sessionId) {
  return request({
    url: `/api/app/v1/ai-service/history/${sessionId}`,
    method: 'get'
  })
}

/**
 * 创建新的会话
 * @param {Object} data 会话数据
 * @param {number} data.user_id 用户ID
 * @returns {Promise<Object>} 会话信息
 */
export function createAiSession(data = {}) {
  return request({
    url: '/api/app/v1/ai-service/session',
    method: 'post',
    data
  })
}

/**
 * 获取AI客服配置
 * @returns {Promise<Object>} 配置信息
 */
export function getAiConfig() {
  return request({
    url: '/api/app/v1/ai-service/config',
    method: 'get'
  })
}

/**
 * 结束会话
 * @param {string} sessionId 会话ID
 * @returns {Promise<Object>} 结果
 */
export function endAiSession(sessionId) {
  return request({
    url: `/api/app/v1/ai-service/session/${sessionId}/end`,
    method: 'post'
  })
}

/**
 * 清除会话历史
 * @param {string} sessionId 会话ID
 * @returns {Promise<Object>} 结果
 */
export function clearAiHistory(sessionId) {
  return request({
    url: `/api/app/v1/ai-service/history/${sessionId}/clear`,
    method: 'delete'
  })
}