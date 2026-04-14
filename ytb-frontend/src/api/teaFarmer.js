import request from '@/utils/request';

// 茶农列表
export function fetchTeaFarmers(params) {
  return request({
    url: '/api/admin/v1/tea-farmers',
    method: 'get',
    params
  });
}

// 获取单个茶农信息
export function getTeaFarmer(id) {
  return request({
    url: `/api/admin/v1/tea-farmers/${id}`,
    method: 'get'
  });
}

// 创建茶农
export function createTeaFarmer(data) {
  return request({
    url: '/api/admin/v1/tea-farmers',
    method: 'post',
    data
  });
}

// 更新茶农信息
export function updateTeaFarmer(id, data) {
  return request({
    url: `/api/admin/v1/tea-farmers/${id}`,
    method: 'put',
    data
  });
}

// 更改茶农状态
export function updateTeaFarmerStatus(id, data) {
  return request({
    url: `/api/admin/v1/tea-farmers/${id}/status`,
    method: 'patch',
    data
  });
}

// 删除茶农
export function deleteTeaFarmer(id) {
  return request({
    url: `/api/admin/v1/tea-farmers/${id}`,
    method: 'delete'
  });
}