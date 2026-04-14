import request from '@/utils/request';

// 库存记录列表
export function fetchStockRecords(params) {
  return request({
    url: '/api/admin/v1/tea-stock-records',
    method: 'get',
    params
  });
}

// 获取单条库存记录
export function getStockRecord(id) {
  return request({
    url: `/api/admin/v1/tea-stock-records/${id}`,
    method: 'get'
  });
}

// 导出库存记录
export function exportStockRecords(params) {
  return request({
    url: '/api/admin/v1/tea-stock-records/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}