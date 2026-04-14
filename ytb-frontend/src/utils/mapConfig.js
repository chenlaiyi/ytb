// 腾讯地图API配置
export const mapConfig = {
  // 腾讯地图API密钥 - 需要在腾讯位置服务申请
  tencentMapKey: 'KBXBZ-QLM67-MEHX4-P2QC2-552E2-W3FH6',
  
  // API接口地址
  apis: {
    // 行政区划查询
    district: 'https://apis.map.qq.com/ws/district/v1',
    // 地址解析（地址转坐标）
    geocoder: 'https://apis.map.qq.com/ws/geocoder/v1',
    // 逆地址解析（坐标转地址）
    reverseGeocoder: 'https://apis.map.qq.com/ws/geocoder/v1',
    // 地点搜索
    search: 'https://apis.map.qq.com/ws/place/v1/search'
  },
  
  // 默认配置
  defaults: {
    // 默认坐标（北京天安门）
    defaultLocation: {
      lng: 116.397477,
      lat: 39.908692
    },
    // 坐标精度
    precision: 6,
    // 请求超时时间
    timeout: 10000
  }
}

// 获取省份列表
export const getProvinces = async () => {
  try {
    const response = await fetch(`${mapConfig.apis.district}/list?key=${mapConfig.tencentMapKey}`)
    const data = await response.json()
    
    if (data.status === 0 && data.result && data.result[0]) {
      return data.result[0]
    } else {
      console.error('获取省份数据失败:', data.message)
      return getBackupProvinces()
    }
  } catch (error) {
    console.error('加载省份数据出错:', error)
    return getBackupProvinces()
  }
}

// 获取城市列表
export const getCities = async (provinceId) => {
  if (!provinceId) return []
  
  try {
    const response = await fetch(`${mapConfig.apis.district}/getchildren?id=${provinceId}&key=${mapConfig.tencentMapKey}`)
    const data = await response.json()
    
    if (data.status === 0 && data.result && data.result[0]) {
      return data.result[0]
    } else {
      console.error('获取城市数据失败:', data.message || '未知错误')
      return []
    }
  } catch (error) {
    console.error('加载城市数据出错:', error)
    return []
  }
}

// 获取区县列表
export const getDistricts = async (cityId) => {
  if (!cityId) return []
  
  try {
    const response = await fetch(`${mapConfig.apis.district}/getchildren?id=${cityId}&key=${mapConfig.tencentMapKey}`)
    const data = await response.json()
    
    if (data.status === 0 && data.result && data.result[0]) {
      return data.result[0]
    } else {
      console.error('获取区县数据失败:', data.message)
      return []
    }
  } catch (error) {
    console.error('加载区县数据出错:', error)
    return []
  }
}

// 地址解析（地址转坐标）
export const geocodeAddress = async (address) => {
  if (!address) return null
  
  try {
    const response = await fetch(`${mapConfig.apis.geocoder}/?address=${encodeURIComponent(address)}&key=${mapConfig.tencentMapKey}`)
    const data = await response.json()
    
    if (data.status === 0 && data.result && data.result.location) {
      return {
        lng: data.result.location.lng,
        lat: data.result.location.lat,
        address: data.result.address || address
      }
    } else {
      console.warn('地址解析失败:', data.message)
      return null
    }
  } catch (error) {
    console.error('地址解析出错:', error)
    return null
  }
}

// 逆地址解析（坐标转地址）
export const reverseGeocodeLocation = async (lng, lat) => {
  if (!lng || !lat) return null
  
  try {
    const response = await fetch(`${mapConfig.apis.reverseGeocoder}/?location=${lat},${lng}&key=${mapConfig.tencentMapKey}`)
    const data = await response.json()
    
    if (data.status === 0 && data.result) {
      return {
        address: data.result.address,
        formatted_addresses: data.result.formatted_addresses,
        address_component: data.result.address_component
      }
    } else {
      console.warn('逆地址解析失败:', data.message)
      return null
    }
  } catch (error) {
    console.error('逆地址解析出错:', error)
    return null
  }
}

// 备用省份数据（当API失败时使用）
export const getBackupProvinces = () => {
  return [
    { id: '110000', fullname: '北京市' },
    { id: '120000', fullname: '天津市' },
    { id: '130000', fullname: '河北省' },
    { id: '140000', fullname: '山西省' },
    { id: '150000', fullname: '内蒙古自治区' },
    { id: '210000', fullname: '辽宁省' },
    { id: '220000', fullname: '吉林省' },
    { id: '230000', fullname: '黑龙江省' },
    { id: '310000', fullname: '上海市' },
    { id: '320000', fullname: '江苏省' },
    { id: '330000', fullname: '浙江省' },
    { id: '340000', fullname: '安徽省' },
    { id: '350000', fullname: '福建省' },
    { id: '360000', fullname: '江西省' },
    { id: '370000', fullname: '山东省' },
    { id: '410000', fullname: '河南省' },
    { id: '420000', fullname: '湖北省' },
    { id: '430000', fullname: '湖南省' },
    { id: '440000', fullname: '广东省' },
    { id: '450000', fullname: '广西壮族自治区' },
    { id: '460000', fullname: '海南省' },
    { id: '500000', fullname: '重庆市' },
    { id: '510000', fullname: '四川省' },
    { id: '520000', fullname: '贵州省' },
    { id: '530000', fullname: '云南省' },
    { id: '540000', fullname: '西藏自治区' },
    { id: '610000', fullname: '陕西省' },
    { id: '620000', fullname: '甘肃省' },
    { id: '630000', fullname: '青海省' },
    { id: '640000', fullname: '宁夏回族自治区' },
    { id: '650000', fullname: '新疆维吾尔自治区' },
    { id: '710000', fullname: '台湾省' },
    { id: '810000', fullname: '香港特别行政区' },
    { id: '820000', fullname: '澳门特别行政区' }
  ]
}

// 根据省份ID获取省份坐标（用于模拟坐标生成）
export const getProvinceCoordinates = (provinceId) => {
  const coordinates = {
    '110000': { lng: 116.4074, lat: 39.9042 }, // 北京
    '120000': { lng: 117.2008, lat: 39.0842 }, // 天津
    '130000': { lng: 114.5149, lat: 38.0428 }, // 河北
    '140000': { lng: 112.5489, lat: 37.8570 }, // 山西
    '150000': { lng: 111.6708, lat: 40.8183 }, // 内蒙古
    '210000': { lng: 123.4315, lat: 41.8057 }, // 辽宁
    '220000': { lng: 125.3245, lat: 43.8868 }, // 吉林
    '230000': { lng: 126.6420, lat: 45.7560 }, // 黑龙江
    '310000': { lng: 121.4737, lat: 31.2304 }, // 上海
    '320000': { lng: 118.7674, lat: 32.0415 }, // 江苏
    '330000': { lng: 120.1536, lat: 30.2650 }, // 浙江
    '340000': { lng: 117.2272, lat: 31.8206 }, // 安徽
    '350000': { lng: 119.3063, lat: 26.0745 }, // 福建
    '360000': { lng: 115.8921, lat: 28.6765 }, // 江西
    '370000': { lng: 117.0009, lat: 36.6758 }, // 山东
    '410000': { lng: 113.6401, lat: 34.7566 }, // 河南
    '420000': { lng: 114.2980, lat: 30.5844 }, // 湖北
    '430000': { lng: 112.9820, lat: 28.1941 }, // 湖南
    '440000': { lng: 113.2804, lat: 23.1291 }, // 广东
    '450000': { lng: 108.3201, lat: 22.8240 }, // 广西
    '460000': { lng: 110.3312, lat: 20.0311 }, // 海南
    '500000': { lng: 106.5516, lat: 29.5630 }, // 重庆
    '510000': { lng: 104.0665, lat: 30.5723 }, // 四川
    '520000': { lng: 106.7135, lat: 26.5783 }, // 贵州
    '530000': { lng: 102.7123, lat: 25.0406 }, // 云南
    '540000': { lng: 91.1322, lat: 29.6604 }, // 西藏
    '610000': { lng: 108.9486, lat: 34.2631 }, // 陕西
    '620000': { lng: 103.8236, lat: 36.0581 }, // 甘肃
    '630000': { lng: 101.7782, lat: 36.6171 }, // 青海
    '640000': { lng: 106.2586, lat: 38.4707 }, // 宁夏
    '650000': { lng: 87.6177, lat: 43.7928 }   // 新疆
  }
  
  return coordinates[provinceId] || mapConfig.defaults.defaultLocation
}

// 生成模拟坐标（在省份坐标基础上添加随机偏移）
export const generateSimulateCoordinates = (provinceId) => {
  const baseCoord = getProvinceCoordinates(provinceId)
  
  // 在省份坐标基础上添加随机偏移（±1度范围内）
  const lngOffset = (Math.random() - 0.5) * 2
  const latOffset = (Math.random() - 0.5) * 2
  
  return {
    lng: (baseCoord.lng + lngOffset).toFixed(mapConfig.defaults.precision),
    lat: (baseCoord.lat + latOffset).toFixed(mapConfig.defaults.precision)
  }
}

export default mapConfig 