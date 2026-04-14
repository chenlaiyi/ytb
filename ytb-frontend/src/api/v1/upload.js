import request from '@/utils/request'

/**
 * 上传图片
 * @param {FormData} formData 图片文件数据
 * @returns {Promise}
 */
export function uploadImage(formData) {
  return request({
    url: '/api/admin/v1/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 增加超时时间到60秒
  }).catch(error => {
    console.error('上传API错误:', error)
    // 重新抛出错误，让调用方处理
    throw error
  })
}

/**
 * 获取上传配置
 * @returns {Promise}
 */
export function getUploadConfig() {
  return request({
    url: '/api/admin/v1/upload/config',
    method: 'get'
  })
}

/**
 * 删除图片
 * @param {string} path 图片路径
 * @returns {Promise}
 */
export function deleteImage(path) {
  return request({
    url: '/api/admin/v1/upload',
    method: 'delete',
    data: { path }
  })
}

/**
 * 上传取水点图片
 * @param {FormData} formData 图片文件
 * @returns {Promise} 上传结果
 */
export function uploadWaterPointImage(formData) {
  return request({
    url: '/api/admin/v1/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 