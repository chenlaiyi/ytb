import service from '@/utils/axios';

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @returns {Promise} 商品列表
 */
export function getProducts(params) {
  return service({
    url: '/admin/api/app/products.php',
    method: 'get',
    params
  });
}

/**
 * 获取商品详情
 * @param {string} id 商品ID
 * @returns {Promise} 商品详情
 */
export function getProduct(id) {
  return service({
    url: '/admin/api/app/product_detail.php',
    method: 'get',
    params: { id }
  });
}

/**
 * 创建商品
 * @param {Object} data 商品数据
 * @returns {Promise} 创建结果
 */
export function createProduct(data) {
  return service({
    url: '/admin/api/app/create_product.php',
    method: 'post',
    data
  });
}

/**
 * 更新商品
 * @param {string} id 商品ID
 * @param {Object} data 商品数据
 * @returns {Promise} 更新结果
 */
export function updateProduct(id, data) {
  return service({
    url: '/admin/api/app/update_product.php',
    method: 'post',
    data: { id, ...data }
  });
}

/**
 * 删除商品
 * @param {string} id 商品ID
 * @returns {Promise} 删除结果
 */
export function deleteProduct(id) {
  return service({
    url: '/admin/api/app/delete_product.php',
    method: 'post',
    data: { id }
  });
}

/**
 * 获取商品分类列表
 * @param {Object} params 查询参数
 * @returns {Promise} 分类列表
 */
export function getProductCategories(params) {
  return service({
    url: '/admin/api/v1/categories/all',
    method: 'get',
    params
  });
}

/**
 * 获取商品分类树
 * @returns {Promise} 分类树
 */
export function getProductCategoryTree() {
  return service({
    url: '/admin/api/v1/categories/all',
    method: 'get'
  });
}

/**
 * 创建商品分类
 * @param {Object} data 分类数据
 * @returns {Promise} 创建结果
 */
export function createProductCategory(data) {
  return service({
    url: '/admin/api/v1/categories',
    method: 'post',
    data
  });
}

/**
 * 更新商品分类
 * @param {string} id 分类ID
 * @param {Object} data 分类数据
 * @returns {Promise} 更新结果
 */
export function updateProductCategory(id, data) {
  return service({
    url: `/admin/api/v1/categories/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除商品分类
 * @param {string} id 分类ID
 * @returns {Promise} 删除结果
 */
export function deleteProductCategory(id) {
  return service({
    url: `/admin/api/v1/categories/${id}`,
    method: 'delete'
  });
}

/**
 * 更新商品状态
 * @param {string} id 商品ID
 * @param {string} status 状态
 * @returns {Promise} 更新结果
 */
export function updateProductStatus(id, status) {
  return service({
    url: '/admin/api/app/update_product_status.php',
    method: 'post',
    data: { id, status }
  });
}

/**
 * 批量操作商品
 * @param {Array} ids 商品ID数组
 * @param {string} action 操作类型
 * @param {Object} data 操作数据
 * @returns {Promise} 操作结果
 */
export function batchOperateProducts(ids, action, data = {}) {
  return service({
    url: '/admin/api/app/batch_operate_products.php',
    method: 'post',
    data: { ids, action, ...data }
  });
}

/**
 * 上传商品图片
 * @param {FormData} formData 图片文件
 * @returns {Promise} 上传结果
 */
export function uploadProductImage(formData) {
  return service({
    url: '/admin/api/app/upload_product_image.php',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 获取商品库存
 * @param {string} id 商品ID
 * @returns {Promise} 库存信息
 */
export function getProductStock(id) {
  return service({
    url: '/admin/api/app/product_stock.php',
    method: 'get',
    params: { id }
  });
}

/**
 * 更新商品库存
 * @param {string} id 商品ID
 * @param {Object} data 库存数据
 * @returns {Promise} 更新结果
 */
export function updateProductStock(id, data) {
  return service({
    url: '/admin/api/app/update_product_stock.php',
    method: 'post',
    data: { id, ...data }
  });
}

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductCategoryTree,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  updateProductStatus,
  batchOperateProducts,
  uploadProductImage,
  getProductStock,
  updateProductStock
};
