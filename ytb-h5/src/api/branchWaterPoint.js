import request from '@/utils/request'

/**
 * 分支机构取水点API
 */
export const branchWaterPointApi = {
  /**
   * 获取分支机构取水点列表
   * @param {Object} params 查询参数
   * @param {string} params.branch_code 分支机构代码
   * @param {string} params.keyword 关键词搜索
   * @param {string} params.status 状态筛选 (all|active|inactive|maintenance)
   * @param {number} params.page 页码
   * @param {number} params.page_size 每页数量
   * @param {number} params.lat 纬度
   * @param {number} params.lng 经度
   * @param {number} params.radius 搜索半径（米）
   * @returns {Promise<Object>} 取水点列表数据
   */
  getWaterPoints(params = {}) {
    // 确保必要参数
    const branch_code = params.branch_code || localStorage.getItem('branch_code')
    if (!branch_code) {
      console.error('缺少分支机构代码')
      return Promise.resolve({
        code: -1,
        message: '缺少分支机构代码',
        data: { list: [], pagination: { has_more: false } }
      })
    }

    // 构建请求参数
    const requestParams = {
      branch_code,
      keyword: params.keyword || '',
      status: params.status || 'all',
      page: params.page || 1,
      page_size: params.page_size || 20,
      lat: params.lat || null,
      lng: params.lng || null,
      radius: params.radius || 10000,
      // 添加时间戳防止缓存
      _t: Date.now(),
      _r: Math.floor(Math.random() * 1000)
    }

    console.log('请求分支机构取水点列表:', requestParams)

    return request({
      url: 'branch/water_points.php',
      method: 'get',
      params: requestParams,
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json'
      },
      timeout: 15000,
      retry: 3,
      retryDelay: 1000,
      skipErrorHandler: true,
      skipAuthToken: true
    }).then(response => {
      console.log('分支机构取水点列表API响应:', response)
      
      if (response && response.code === 0 && response.data) {
        return response
      } else {
        console.error('分支机构取水点API返回错误:', response)
        throw new Error(response?.message || '获取取水点列表失败')
      }
    }).catch(error => {
      console.error('获取分支机构取水点列表失败:', error)
      
      // 返回空数据而不是抛出错误，避免页面崩溃
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          list: [],
          pagination: {
            total: 0,
            page: requestParams.page,
            page_size: requestParams.page_size,
            total_pages: 0,
            has_more: false
          },
          branch_info: {
            id: 0,
            name: '未知分支机构',
            code: branch_code
          }
        }
      }
    })
  },

  /**
   * 获取取水点详情
   * @param {number} id 取水点ID
   * @param {string} branch_code 分支机构代码
   * @returns {Promise<Object>} 取水点详情
   */
  getWaterPointDetail(id, branch_code = null) {
    if (!id) {
      return Promise.reject(new Error('取水点ID不能为空'))
    }

    const branchCode = branch_code || localStorage.getItem('branch_code')
    if (!branchCode) {
      return Promise.reject(new Error('缺少分支机构代码'))
    }

    return request({
      url: 'branch/water_point_detail.php',
      method: 'get',
      params: {
        id,
        branch_code: branchCode,
        _t: Date.now()
      },
      timeout: 10000,
      retry: 2,
      skipErrorHandler: true,
      skipAuthToken: true
    }).catch(error => {
      console.error('获取取水点详情失败:', error)
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          id: id,
          name: '取水点详情',
          address: '地址信息不可用',
          status: 'active',
          is_open: true,
          contact_phone: '',
          business_hours: '24小时',
          price: '免费',
          description: '暂无描述',
          images: [],
          facilities: [],
          tags: []
        }
      }
    })
  },

  /**
   * 搜索附近取水点
   * @param {Object} params 搜索参数
   * @param {number} params.lat 纬度
   * @param {number} params.lng 经度
   * @param {number} params.radius 搜索半径（米），默认5000
   * @param {string} params.branch_code 分支机构代码
   * @returns {Promise<Array>} 附近取水点列表
   */
  searchNearbyWaterPoints(params) {
    const { lat, lng, radius = 5000, branch_code } = params
    
    if (!lat || !lng) {
      return Promise.reject(new Error('缺少位置信息'))
    }

    return this.getWaterPoints({
      branch_code,
      lat,
      lng,
      radius,
      page: 1,
      page_size: 50
    }).then(response => {
      if (response && response.data && response.data.list) {
        return {
          code: 0,
          message: '搜索成功',
          data: response.data.list
        }
      }
      return {
        code: 0,
        message: '搜索成功',
        data: []
      }
    })
  },

  /**
   * 获取取水点负责人信息
   * @param {number} managerId 负责人ID
   * @param {string} branch_code 分支机构代码
   * @returns {Promise<Object>} 负责人信息
   */
  getManagerInfo(managerId, branch_code = null) {
    if (!managerId) {
      return Promise.reject(new Error('负责人ID不能为空'))
    }

    const branchCode = branch_code || localStorage.getItem('branch_code')
    if (!branchCode) {
      return Promise.reject(new Error('缺少分支机构代码'))
    }

    return request({
      url: 'branch/manager_info.php',
      method: 'get',
      params: {
        manager_id: managerId,
        branch_code: branchCode,
        _t: Date.now()
      },
      timeout: 8000,
      retry: 2,
      skipErrorHandler: true,
      skipAuthToken: true
    }).catch(error => {
      console.error('获取负责人信息失败:', error)
      // 返回默认数据而不是抛出错误
      return {
        code: 0,
        message: '使用默认数据',
        data: {
          id: managerId,
          name: '取水点负责人',
          nickname: '取水点负责人',
          display_name: '取水点负责人',
          phone: '',
          avatar: ''
        }
      }
    })
  }
}

// 导出默认API方法
export const {
  getWaterPoints,
  getWaterPointDetail,
  searchNearbyWaterPoints,
  getManagerInfo
} = branchWaterPointApi

export default branchWaterPointApi 