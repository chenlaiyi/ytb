import request from '@/utils/request';

// 茶品列表
export function fetchTeaProducts(params) {
  return request({
    url: '/api/admin/v1/tea-products',
    method: 'get',
    params
  });
}

// 获取单个茶品信息
export function getTeaProduct(id) {
  return request({
    url: `/api/admin/v1/tea-products/${id}`,
    method: 'get'
  });
}

// 创建茶品
export function createTeaProduct(data) {
  return request({
    url: '/api/admin/v1/tea-products',
    method: 'post',
    data
  });
}

// 更新茶品信息
export function updateTeaProduct(id, data) {
  return request({
    url: `/api/admin/v1/tea-products/${id}`,
    method: 'put',
    data
  });
}

// 增加库存
export function increaseStock(data) {
  return request({
    url: '/api/admin/v1/tea-products/increase-stock',
    method: 'post',
    data
  });
}

// 减少库存
export function decreaseStock(data) {
  return request({
    url: '/api/admin/v1/tea-products/decrease-stock',
    method: 'post',
    data
  });
}