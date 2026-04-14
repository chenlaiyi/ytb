<template>
  <div class="wechat-address-selector">
    <el-button 
      type="primary" 
      :icon="Location" 
      :loading="loading" 
      @click="selectWechatAddress"
    >
      {{ buttonText }}
    </el-button>
    <div v-if="error" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { ref, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'WechatAddressSelector',
  props: {
    buttonText: {
      type: String,
      default: '从微信选择地址'
    }
  },
  emits: ['address-selected'],
  setup(props, { emit }) {
    const loading = ref(false)
    const error = ref(false)
    const errorMessage = ref('')

    // 选择微信地址
    const selectWechatAddress = async () => {
      // 检查是否在微信环境中
      const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent)
      if (!isWechatBrowser) {
        error.value = true
        errorMessage.value = '请在微信内打开页面使用此功能'
        ElMessage.warning('请在微信内打开页面使用此功能')
        return
      }

      try {
        loading.value = true
        error.value = false

        // 调用微信地址选择接口
        if (typeof wx === 'undefined' || typeof wx.openAddress !== 'function') {
          throw new Error('微信接口不可用')
        }

        wx.openAddress({
          success: async (res) => {
            
            try {
              // 调用后端接口处理地址数据
              const response = await axios.post('/api/admin/installation-bookings/wechat-address', {
                address_data: res
              })
              
              if (response.data && response.data.data) {
                // 触发地址选择事件
                emit('address-selected', response.data.data)
                ElMessage.success('地址选择成功')
              } else {
                throw new Error('处理地址数据失败')
              }
            } catch (apiError) {
              console.error('处理地址数据失败:', apiError)
              error.value = true
              errorMessage.value = '处理地址数据失败: ' + (apiError.message || '未知错误')
              ElMessage.error('处理地址数据失败')
            }
          },
          fail: (err) => {
            console.error('微信地址选择失败:', err)
            error.value = true
            errorMessage.value = '微信地址选择失败: ' + (err.errMsg || '未知错误')
            ElMessage.warning('您已取消选择地址或选择失败')
          },
          complete: () => {
            loading.value = false
          }
        })
      } catch (err) {
        console.error('调用微信地址选择接口失败:', err)
        loading.value = false
        error.value = true
        errorMessage.value = '调用微信地址选择接口失败: ' + (err.message || '未知错误')
        ElMessage.error('调用微信地址选择接口失败')
      }
    }

    return {
      loading,
      error,
      errorMessage,
      selectWechatAddress,
      Location
    }
  }
}
</script>

<style scoped>
.wechat-address-selector {
  margin-bottom: 15px;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}
</style>
