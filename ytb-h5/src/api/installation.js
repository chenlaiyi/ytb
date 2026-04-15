// 预约安装相关API统一封装
import request from '@/utils/request';

const INSTALLATION_BASES = ['/Tapp/admin/api/installation', '/api/installation', '/installation'];

const normalizeUrl = (base, endpoint) => {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${trimmedBase}/${trimmedEndpoint}`;
};

const shouldRetry = (error) => {
  if (!error) return false;
  if (!error.response) {
    // 网络层面问题（超时、断网）可以重试
    return true;
  }
  const status = error.response.status;
  return status === 404 || status === 502 || status === 503;
};

const requestInstallation = (endpoint, options = {}) => {
  const bases = INSTALLATION_BASES;
  let lastError = null;
  let attempt = 0;

  const execute = () => {
    if (attempt >= bases.length) {
      return Promise.reject(lastError || new Error('安装预约服务不可用'));
    }

    const isLastAttempt = attempt === bases.length - 1;
    const url = normalizeUrl(bases[attempt], endpoint);
    const config = { ...options, url };
    // 所有安装预约接口都应该走 App Token，而不是根据 URL 自动判定为后台接口
    config.forceAppAuth = true;
    if (!isLastAttempt && typeof config.skipErrorToast === 'undefined') {
      config.skipErrorToast = true;
    }

    return request(config)
      .then((res) => {
        return res;
      })
      .catch(error => {
        lastError = error;
        if (!shouldRetry(error) || attempt === bases.length - 1) {
          throw error;
        }
        attempt += 1;
        return execute();
      });
  };

  return execute();
};

/**
 * 创建安装预约
 * @param {Object} data - 预约信息
 * @returns {Promise}
 */
export function createBooking(data) {
  return requestInstallation('create_booking.php', {
    method: 'post',
    data
  });
}

/**
 * 获取安装预约列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getBookingList(params) {
  return requestInstallation('list_bookings.php', {
    method: 'get',
    params
  });
}

/**
 * 获取安装预约详情
 * @param {Number|Object} id - 预约ID或包含id的对象
 * @returns {Promise}
 */
export function getBookingDetail(id) {
  let params;
  
  if (typeof id === 'object') {
    // 如果传入的是对象，直接使用
    params = id;
  } else {
    // 如果传入的是ID数字，构造对象
    params = { id };
  }
  
  return requestInstallation('get_booking_details.php', {
    method: 'get',
    params
  });
}

/**
 * 取消安装预约
 * @param {Number|Object} id - 预约ID或包含id或booking_id的对象
 * @returns {Promise}
 */
export function cancelBooking(id) {
  let data;
  
  if (typeof id === 'object') {
    // 如果传入的是对象，直接使用
    data = id;
  } else {
    // 如果传入的是ID数字，构造对象
    data = { id };
  }
  
  return requestInstallation('cancel_booking.php', {
    method: 'post',
    data
  });
}

/**
 * 获取可用安装时间段
 * @returns {Promise}
 */
export function getAvailableTimeSlots() {
  return requestInstallation('get_available_time_slots.php', {
    method: 'get'
  });
}

/**
 * 创建支付订单
 * @param {Object} data - 订单数据
 * @returns {Promise}
 */
export function createPayment(data) {
  return requestInstallation('create_payment.php', {
    method: 'post',
    data
  });
}

/**
 * 同步支付状态
 * @param {Object} data - 支付数据
 * @returns {Promise}
 */
export function syncPayment(data) {
  return requestInstallation('sync_payment.php', {
    method: 'post',
    data
  });
}

/**
 * 更新支付状态
 * @param {Object} data - 支付状态数据
 * @returns {Promise}
 */
export function updatePaymentStatus(data) {
  return requestInstallation('update_payment_status.php', {
    method: 'post',
    data
  });
}

/**
 * 获取微信JSSDK配置
 * @param {Object} params - 请求参数
 * @returns {Promise}
 */
export function getJssdkConfig(params) {
  return request({
    url: '/wechat/get_jssdk_config.php',
    method: 'get',
    params
  })
}

/**
 * 获取预约详情（兼容旧版接口）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getBookingDetails(params) {
  return requestInstallation('get_booking_details.php', {
    method: 'get',
    params
  });
}

/**
 * 获取预约信息（兼容旧版接口）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getBooking(params) {
  return requestInstallation('get_booking.php', {
    method: 'get',
    params
  });
}

/**
 * 获取扣费计划
 * @returns {Promise}
 */
export function getInstallationPlans() {
  return requestInstallation('get_plans.php', {
    method: 'get'
  });
}

/**
 * 创建净水器安装预约 (完整套餐版)
 * 
 * @param {Object} data 预约信息对象
 * @param {string} data.contact_name - 联系人姓名
 * @param {string} data.contact_phone - 联系电话 
 * @param {string} data.install_address - 安装地址
 * @param {string} data.install_time - 安装时间 (格式: YYYY-MM-DD HH:MM:SS)
 * @param {string} data.package_type - 套餐类型 (personal,unlimited,business_year,business_flow)
 * @param {string} [data.remarks] - 备注信息 (可选)
 * @param {number} [data.referrer_id] - 推荐人ID (可选)
 * @returns {Promise} - 返回预约创建结果
 */
export function createBookingFullPackage(data) {
  return requestInstallation('create_booking.php', {
    method: 'post',
    data
  });
}

/**
 * 同步安装预约支付状态
 * 
 * @param {Object} data 支付信息对象
 * @param {number} data.booking_id - 预约ID
 * @param {string} data.order_no - 订单号
 * @returns {Promise} - 返回同步结果
 */
export function syncPaymentStatus(data) {
  return requestInstallation('sync_payment.php', {
    method: 'post',
    data
  });
}

// 导出默认对象，保持与原有代码兼容
export default {
  createBooking,
  getBookingList,
  getBookingDetail,
  cancelBooking,
  getAvailableTimeSlots,
  createPayment,
  syncPayment,
  updatePaymentStatus,
  getJssdkConfig,
  getBookingDetails,
  getBooking,
  getInstallationPlans,
  createBookingFullPackage,
  syncPaymentStatus
}
