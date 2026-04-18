// 预约安装相关API统一封装
import request from '@/utils/request';

// 新版 YTB 安装相关 API 统一前缀
const API_BASE = '/api/ytb/install';

/**
 * 1. 创建预约工单
 */
export function createBooking(data) {
  return request({
    url: `${API_BASE}/orders`,
    method: 'post',
    data,
    forceAppAuth: true
  });
}

/**
 * 2. 获取用户的工单列表
 */
export function getBookingList(params) {
  return request({
    url: `${API_BASE}/orders`,
    method: 'get',
    params,
    forceAppAuth: true
  });
}

/**
 * 3. 获取工单详情 (包含配件和水质报告)
 */
export function getBookingDetail(id) {
  const orderId = typeof id === 'object' ? id.id : id;
  return request({
    url: `${API_BASE}/orders/${orderId}`,
    method: 'get',
    forceAppAuth: true
  });
}

/**
 * 4. 模拟支付安装预付费
 */
export function payInstallFee(id) {
  return request({
    url: `${API_BASE}/orders/${id}/pay`,
    method: 'post',
    forceAppAuth: true
  });
}

/**
 * 9. 用户评价/确认配件费支付
 */
export function payAccessoryFee(id) {
  return request({
    url: `${API_BASE}/orders/${id}/accessory-pay`,
    method: 'post',
    forceAppAuth: true
  });
}

/**
 * 11. 用户最终确认水质检测及安装完成
 */
export function confirmInstallation(id) {
  return request({
    url: `${API_BASE}/orders/${id}/confirm`,
    method: 'post',
    forceAppAuth: true
  });
}

/**
 * 获取可用的套餐进行安装费支付和绑定 (替代旧的 plans)
 */
export function getInstallationPlans() {
  return request({
    url: `/api/ytb/packages`,
    method: 'get'
  }).then(res => {
    if (res && res.code === 0) {
      // 兼容旧格式
      return {
        code: 0,
        data: {
          plans: res.data.map(p => ({
            key: p.code,
            label: p.name + ' · ' + p.price + '元',
            description: p.description,
            plan_type: p.type === 'yearly' ? 'flat' : 'metered',
            billing_rate: p.price,
            upfront_amount: p.type === 'yearly' ? p.price : 0
          })),
          installation_fee: 120,
          deposit: {
            amount: 0,
            pay_score_threshold: 600
          }
        }
      }
    }
    return res;
  });
}

// 兼容旧组件可能的调用名
export const syncPaymentStatus = payInstallFee;
export const getBookingDetails = getBookingDetail;

// 激活与支付套餐 (新YTB API)
export function activateInstall(id, data) {
  return request({
    url: `/api/ytb/install/orders/${id}/activate`,
    method: 'post',
    data
  })
}

export default {
  createBooking,
  getBookingList,
  getBookingDetail,
  payInstallFee,
  payAccessoryFee,
  confirmInstallation,
  syncPaymentStatus,
  getBookingDetails,
  getInstallationPlans,
  activateInstall
};
