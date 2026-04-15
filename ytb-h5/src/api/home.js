import request from '@/utils/request'

const staticRequestOptions = {
  skipErrorToast: true,
  skipAuthErrorToast: true,
  skipAuthError: true
}

// 公开首页聚合数据（未登录可用）
export function getPublicHeroMetrics() {
  return request({
    url: '/api/mobile/v1/home/hero',
    method: 'get',
    timeout: 8000,
    ...staticRequestOptions
  }).catch(error => {
    console.warn('获取公开英雄数据失败，使用默认占位', error)
    return { data: {} }
  })
}

export function getPublicWaterInsights() {
  return request({
    url: '/api/mobile/v1/home/water-insights',
    method: 'get',
    timeout: 8000,
    ...staticRequestOptions
  }).catch(error => {
    console.warn('获取公开净水数据失败，使用默认占位', error)
    return { data: {} }
  })
}

export function getPublicMerchantInsights() {
  return request({
    url: '/api/mobile/v1/home/merchant-insights',
    method: 'get',
    timeout: 8000,
    ...staticRequestOptions
  }).catch(error => {
    console.warn('获取公开商户数据失败，使用默认占位', error)
    return { data: {} }
  })
}

export function getPublicMallHighlights(params = {}) {
  return request({
    url: '/api/mobile/v1/home/mall-highlights',
    method: 'get',
    params,
    timeout: 8000,
    ...staticRequestOptions
  }).catch(error => {
    console.warn('获取公开商城数据失败，使用默认占位', error)
    return { data: [] }
  })
}

export function getPublicContentFeed() {
  return request({
    url: '/api/mobile/v1/home/content',
    method: 'get',
    timeout: 8000,
    ...staticRequestOptions
  }).catch(error => {
    console.warn('获取公开内容失败，使用默认占位', error)
    return { data: {} }
  })
}

/**
 * 获取首页Banner轮播图
 * @returns {Promise<Array>} Banner列表
 */
export function getBanners() {
  // 新链路：Mobile API v1
  return request({
    url: '/api/mobile/v1/config-app/banners',
    method: 'get',
    params: { position: 'home' },
    timeout: 10000,
    retry: 1,
    ...staticRequestOptions
  })
    .then(res => {
      if (Array.isArray(res?.data)) return res
      throw new Error('banner data empty')
    })
    .catch(error => {
      console.warn('获取Banner失败，尝试系统接口:', error)
      // 兼容旧 SystemController 接口
      return request({
        url: '/api/app/v1/system/banners',
        method: 'get',
        params: { platform: 'h5' },
        timeout: 8000,
        retry: 1,
        ...staticRequestOptions
      }).catch(sysErr => {
        console.error('获取Banner失败(系统与旧接口):', sysErr)
        // 如果新API失败，尝试旧PHP接口
        return request({
          url: '/Tapp/admin/api/banners.php',
          method: 'get',
          baseURL: ''
        }).catch(fallbackError => {
          console.error('获取Banner失败(旧API):', fallbackError)
          return { code: 0, message: '获取Banner失败', data: [] }
        })
      })
    })
}

/**
 * 获取商品分类列表
 * @returns {Promise<Array>} 分类列表
 */
export function getCategories() {
  return request({
    url: '/api/app/v1/shop/products/categories',
    method: 'get',
    params: { parent_id: 0 }
  }).then(res => {
    const categories = res.data?.categories ?? []
    return {
      ...res,
      data: categories
    }
  }).catch(error => {
    console.error('获取分类失败:', error)
    return request({
      url: '/Tapp/admin/api/categories.php',
      method: 'get',
      baseURL: ''
    })
  })
}

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.categoryId 分类ID
 * @returns {Promise<Object>} 商品列表及分页信息
 */
export function getProducts(params) {
  const query = {
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? params?.page_size ?? 10,
    category_id: params?.categoryId ?? params?.category_id ?? undefined,
    keyword: params?.keyword ?? undefined,
    sort_by: params?.sortBy ?? params?.sort_by ?? undefined,
    sort_order: params?.sortOrder ?? params?.sort_order ?? undefined,
    is_hot: params?.is_hot ?? undefined,
    is_recommend: params?.is_recommend ?? undefined,
    is_new: params?.is_new ?? undefined
  }

  return request({
    url: '/api/app/v1/shop/products/list',
    method: 'get',
    params: query
  }).then(res => {
    const pagination = res.data?.pagination ?? {}
    const products = res.data?.products ?? []

    return {
      ...res,
      data: {
        list: products,
        total: pagination.total ?? 0,
        current_page: pagination.current_page ?? query.page,
        page_size: pagination.page_size ?? query.page_size,
        total_pages: pagination.total_pages ?? 0
      }
    }
  }).catch(error => {
    console.error('获取商品列表失败:', error)
    return request({
      url: '/Tapp/admin/api/products.php',
      method: 'get',
      baseURL: '',
      params
    })
  })
}

/**
 * 获取商品详情
 * @param {number} id 商品ID
 * @returns {Promise<Object>} 商品详情
 */
export function getProductDetail(id) {
  return request({
    url: '/api/app/v1/shop/products/detail',
    method: 'get',
    params: { product_id: id }
  }).catch(error => {
    console.error('获取商品详情失败:', error)
    return request({
      url: '/Tapp/admin/api/product_detail.php',
      method: 'get',
      baseURL: '',
      params: { id }
    })
  })
}

/**
 * 获取导航菜单
 * @param {Object} [params] 查询参数
 * @param {boolean} [params.return_default] 是否返回默认数据
 * @returns {Promise<Array>} 导航菜单列表
 */
export function getNavItems(params = {}) {
  console.log('请求底部导航API...', params)

  const defaultNavItems = [
    { nav_id: 'home', nav_name: '首页', icon: 'home-o', path: '/', status: 1, sort_order: 10 },
    { nav_id: 'device', nav_name: '设备', icon: 'cluster-o', path: '/device', status: 1, sort_order: 20 },
    { nav_id: 'water', nav_name: '取水点', icon: 'location-o', path: '/water-point', status: 1, sort_order: 30 },
    { nav_id: 'merchant', nav_name: '商家', icon: 'shop-o', path: '/merchant', status: 1, sort_order: 40 },
    { nav_id: 'forum', nav_name: '社区', icon: 'chat-o', path: '/forum', status: 1, sort_order: 45 },
    { nav_id: 'user', nav_name: '我的', icon: 'user-o', path: '/user', status: 1, sort_order: 50 }
  ]

  const buildDefaultResponse = () => ({
    code: 0,
    message: '返回默认底部导航',
    data: defaultNavItems.map(item => ({ ...item }))
  })

  // 从Laravel API获取导航配置
  return request({
    url: '/api/app/public/tabbar',
    method: 'get',
    params
  }).then(res => {
    if (!res || res.code !== 0) {
      console.warn('底部导航API返回格式异常，使用默认数据:', res)
      return buildDefaultResponse()
    }

    if (!Array.isArray(res.data) || res.data.length === 0) {
      console.warn('底部导航API返回空数据，使用默认数据')
      return buildDefaultResponse()
    }

    const normalizedItems = res.data.map(item => ({
      ...item,
      nav_id: item.nav_id || item.id || item.path || '',
      nav_name: item.nav_name || item.title || item.name || '未命名',
      title: item.title || item.nav_name || item.name || '未命名',
      icon: item.icon || item.vant_icon || 'home-o',
      path: item.path || item.url || '/',
      status: Number(item.status ?? 1),
      highlight: Number(item.highlight ?? 0),
      sort_order: Number(item.sort_order ?? item.sort ?? 0)
    }))

    return {
      ...res,
      data: normalizedItems
    }
  }).catch(error => {
    console.error('获取导航菜单失败，使用默认配置:', error)
    return buildDefaultResponse()
  })
}

/**
 * 获取首页导航菜单
 * @param {Object} [params] 查询参数
 * @param {boolean} [params.return_default] 是否返回默认数据
 * @returns {Promise<Array>} 首页导航菜单列表
 */
export function getHomeNavItems(params = {}) {
  console.log('请求首页导航API...', params)

  // 直接返回默认数据，不再请求API
  return Promise.resolve({
    code: 0,
    message: '返回默认首页导航',
    data: [
      { title: '分类', icon: 'apps-o', path: '/category', status: 1, sort_order: 1 },
      { title: '每日特惠', icon: 'gift-o', path: '/daily-special', status: 1, sort_order: 2 },
      { title: '净水充值', icon: 'balance-o', path: '/water-recharge', status: 1, sort_order: 3 },
      { title: '取水点', icon: 'location-o', path: '/water-point', status: 1, sort_order: 4 },
      { title: '客户服务', icon: 'service-o', path: '/user/service', status: 1, sort_order: 5 }
    ]
  });
}

/**
 * 获取精选推荐商品
 * @param {Object} params 查询参数
 * @param {number} params.limit 获取数量限制
 * @returns {Promise<Array>} 精选商品列表
 */
export function getFeaturedProducts(params) {
  return request({
    url: '/api/app/v1/shop/products/recommend',
    method: 'get',
    params: { limit: params?.limit ?? 10 }
  }).catch(error => {
    console.error('获取精选商品失败:', error)
    // 如果新API失败，尝试旧API
    return request({
      url: '/Tapp/admin/api/products.php',
      method: 'get',
      baseURL: '',
      params: { ...params, featured: 1 }
    }).catch(fallbackError => {
      console.error('获取精选商品失败(旧API):', fallbackError)
      return {
        code: 0,
        message: '返回默认精选商品',
        data: []
      }
    })
  })
}

/**
 * 获取商城信息
 * @returns {Promise<Object>} 商城信息
 */
export function getMallInfo() {
  return request({
    url: '/api/app/v1/system/mall-info',
    method: 'get',
    timeout: 10000
  }).catch(error => {
    console.error('获取商城信息失败:', error)
    return request({
      url: '/Tapp/admin/api/mall_info.php',
      method: 'get',
      baseURL: ''
    })
  })
}

/**
 * 更新商品标签
 * @param {Object} data 标签数据
 * @param {number} data.id 商品ID
 * @param {boolean} [data.is_hot] 是否热销
 * @param {boolean} [data.is_new] 是否新品
 * @param {boolean} [data.is_recommend] 是否推荐
 * @param {boolean} [data.is_premium] 是否精品
 * @returns {Promise<Object>} 更新结果
 */
export function updateProductTags(data) {
  return request({
    url: '/Tapp/admin/api/update_product_tags.php', // 使用完整的绝对路径
    method: 'post',
    baseURL: '', // 使用空baseURL
    data
  })
}
