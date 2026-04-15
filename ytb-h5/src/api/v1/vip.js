import request from '@/utils/request'

/**
 * VIP V1版本API接口 - Laravel RESTful API
 * 正确使用Laravel V1端点，支持branch_id=3为官方机构
 */

/**
 * 获取VIP团队信息
 */
export function getVipTeamInfoV1(params) {
  console.log('🔧 调用VIP团队信息V1 API (Laravel端点)');
  
  const { silentError, ...requestParams } = params || {};
  return request({
    url: '/api/mobile/v1/vip/team-info',
    method: 'post',
    data: requestParams,
    silentError: silentError
  }).then(response => {
    console.log('✅ V1团队API响应:', response);
    return response;
  }).catch(error => {
    console.error('V1团队API错误:', error);
    throw error;
  });
}

/**
 * 获取VIP奖金池信息
 */
export function getVipPoolInfoV1(params) {
  console.log('🔧 调用VIP奖金池信息V1 API (Laravel端点)');
  
  const { silentError, ...requestParams } = params || {};
  return request({
    url: '/api/mobile/v1/vip/pool-info',
    method: 'post',
    data: requestParams,
    silentError: silentError
  }).then(response => {
    console.log('✅ V1奖金池API响应:', response);
    return response;
  }).catch(error => {
    console.error('V1奖金池API错误:', error);
    throw error;
  });
}

/**
 * 获取VIP分红信息
 */
export function getVipDividendInfoV1(params) {
  console.log('🔧 调用VIP分红信息V1 API (Laravel端点)');
  
  const { silentError, ...requestParams } = params || {};
  return request({
    url: '/api/mobile/v1/vip/dividend-info',
    method: 'post',
    data: requestParams,
    silentError: silentError
  }).then(response => {
    console.log('✅ V1分红API响应:', response);
    return response;
  }).catch(error => {
    console.error('V1分红API错误:', error);
    throw error;
  });
}
