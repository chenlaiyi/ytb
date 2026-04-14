// Vant兼容层 - 使用Element Plus组件替代vant功能
import { ElMessage, ElMessageBox } from 'element-plus'

// 替代vant的showToast
export function showToast(options) {
  if (typeof options === 'string') {
    ElMessage.info(options)
  } else {
    const type = options.type || 'info'
    const message = options.message || options
    ElMessage({
      type: type === 'success' ? 'success' : type === 'fail' ? 'error' : 'info',
      message: message
    })
  }
}

// 替代vant的showConfirmDialog
export function showConfirmDialog(options) {
  return ElMessageBox.confirm(
    options.message || options,
    options.title || '确认',
    {
      confirmButtonText: options.confirmButtonText || '确定',
      cancelButtonText: options.cancelButtonText || '取消',
      type: 'warning'
    }
  )
}

// 导出默认的toast函数
export const Toast = {
  success: (message) => ElMessage.success(message),
  fail: (message) => ElMessage.error(message),
  info: (message) => ElMessage.info(message)
}

// 导出默认的Dialog函数
export const Dialog = {
  confirm: showConfirmDialog
} 