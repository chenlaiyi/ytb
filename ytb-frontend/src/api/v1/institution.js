import request from '@/utils/request'

/**
 * 获取机构列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function fetchInstitutions(params = {}) {
  return request({
    url: '/api/admin/v1/institutions',
    method: 'get',
    params
  })
}

/**
 * 获取机构详情
 * @param {number} id 机构ID
 * @returns {Promise}
 */
export function fetchInstitutionDetail(id) {
  return request({
    url: `/api/admin/v1/institutions/${id}`,
    method: 'get'
  })
}

/**
 * 获取核心机构等级
 * @returns {Promise}
 */
export function fetchInstitutionCoreLevels() {
  return request({
    url: '/api/admin/v1/institutions/core-levels',
    method: 'get'
  })
}

/**
 * 更新机构状态
 * @param {number} id
 * @param {Object} data
 * @returns {Promise}
 */
export function updateInstitutionStatus(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/status`,
    method: 'post',
    data
  })
}

/**
 * 调整机构余额
 * @param {number} id
 * @param {Object} data
 * @returns {Promise}
 */
export function adjustInstitutionBalance(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/balance-adjustments`,
    method: 'post',
    data
  })
}

/**
 * 更新机构核心信息
 * @param {number} id
 * @param {Object} data
 * @returns {Promise}
 */
export function updateInstitutionCore(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/core`,
    method: 'post',
    data
  })
}

/**
 * 快速新增机构
 */
export function createInstitution(data) {
  return request({
    url: '/api/admin/v1/institutions',
    method: 'post',
    data
  })
}

/**
 * 快速编辑机构
 */
export function updateInstitution(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}`,
    method: 'put',
    data
  })
}

/**
 * 上级机构选项查询
 */
export function fetchInstitutionParentOptions(params = {}) {
  return request({
    url: '/api/admin/v1/institutions/parent-options',
    method: 'get',
    params
  })
}

/**
 * 切换业务员权限
 */
export function toggleInstitutionSalesman(id, enabled) {
  return request({
    url: `/api/admin/v1/institutions/${id}/salesman-toggle`,
    method: 'post',
    data: { enabled }
  })
}

/**
 * 切换美团业务标记
 */
export function toggleInstitutionMeituan(id, enabled) {
  return request({
    url: `/api/admin/v1/institutions/${id}/meituan-toggle`,
    method: 'post',
    data: { enabled }
  })
}

/**
 * 更新美团设置
 */
export function updateInstitutionMeituanSettings(id, data) {
  return request({
    url: `/api/admin/v1/institutions/${id}/meituan-settings`,
    method: 'post',
    data
  })
}

/**
 * 获取省份列表
 */
export function fetchInstitutionProvinces() {
  return request({
    url: '/api/admin/v1/institutions/provinces',
    method: 'get'
  })
}

/**
 * 获取城市列表
 * @param {string|number} provinceId
 */
export function fetchInstitutionCities(provinceId) {
  return request({
    url: '/api/admin/v1/institutions/cities',
    method: 'get',
    params: { province_id: provinceId }
  })
}

/**
 * 获取区县列表
 * @param {string|number} cityId
 */
export function fetchInstitutionDistricts(cityId) {
  return request({
    url: '/api/admin/v1/institutions/districts',
    method: 'get',
    params: { city_id: cityId }
  })
}
