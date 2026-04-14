import request from '@/utils/axios'

// 获取商品分类列表
export function getCategoryList(params) {
  return request({
    url: '/api/admin/v1/categories',
    method: 'get',
    params
  })
}

// 获取商品分类详情
export function getCategoryDetail(id) {
  return request({
    url: `/api/admin/v1/categories/${id}`,
    method: 'get'
  })
}

// 创建商品分类
export function createCategory(data) {
  return request({
    url: '/api/admin/v1/categories',
    method: 'post',
    data
  })
}

// 更新商品分类
export function updateCategory(id, data) {
  return request({
    url: `/api/admin/v1/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除商品分类
export function deleteCategory(id) {
  return request({
    url: `/api/admin/v1/categories/${id}`,
    method: 'delete'
  })
}

// 获取商品列表
export function getProductList(params) {
  return request({
    url: '/api/admin/v1/products',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: `/api/admin/v1/products/${id}`,
    method: 'get'
  })
}

// 创建商品
export function createProduct(data) {
  return request({
    url: '/api/admin/v1/products',
    method: 'post',
    data
  })
}

// 更新商品
export function updateProduct(id, data) {
  return request({
    url: `/api/admin/v1/products/${id}`,
    method: 'put',
    data
  })
}

// 删除商品
export function deleteProduct(id) {
  return request({
    url: `/api/admin/v1/products/${id}`,
    method: 'delete'
  })
}

// 更新商品状态
export function updateProductStatus(id, status) {
  return request({
    url: `/api/admin/v1/products/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 批量更新商品
export function batchUpdateProducts(data) {
  return request({
    url: '/api/admin/v1/products/batch-update',
    method: 'put',
    data
  })
}

// 上传商品图片
export function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  return request({
    url: '/api/admin/v1/products/upload-image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 上传分类图标
export function uploadCategoryIcon(file) {
  const formData = new FormData();
  formData.append('icon', file);
  
  return request({
    url: '/api/admin/v1/categories/upload-icon',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 默认导出所有API函数
export default {
  getCategoryList,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductList,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  batchUpdateProducts,
  uploadProductImage,
  uploadCategoryIcon
}