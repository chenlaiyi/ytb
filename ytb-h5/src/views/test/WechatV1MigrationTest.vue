<template>
  <div class="wechat-v1-test">
    <van-nav-bar
      title="微信V1 API迁移测试"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />
    
    <van-cell-group inset style="margin-top: 16px;">
      <van-cell>
        <template #title>
          <span class="test-title">🔄 微信登录API迁移测试</span>
        </template>
        <template #label>
          <div class="test-description">
            测试前端微信登录API从原生PHP API迁移到V1 Laravel API的功能
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px;">
      <van-cell title="原生API (user.js)" :label="oldApiStatus" @click="testOldApi">
        <template #right-icon>
          <van-icon name="arrow" />
        </template>
      </van-cell>
      
      <van-cell title="V1 API (v1/auth.js)" :label="v1ApiStatus" @click="testV1Api">
        <template #right-icon>
          <van-icon name="arrow" />
        </template>
      </van-cell>
      
      <van-cell title="兼容模式 (自动降级)" :label="compatApiStatus" @click="testCompatApi">
        <template #right-icon>
          <van-icon name="arrow" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px;">
      <van-cell>
        <template #title>
          <span class="result-title">📊 测试结果</span>
        </template>
      </van-cell>
      
      <van-cell v-if="testResults.length === 0" title="暂无测试结果" />
      
      <van-cell 
        v-for="(result, index) in testResults" 
        :key="index"
        :title="result.name"
        :label="result.message"
        :value="result.status"
        :class="result.success ? 'success-result' : 'error-result'"
      />
    </van-cell-group>

    <div class="test-actions" style="padding: 16px;">
      <van-button 
        type="primary" 
        block 
        @click="runAllTests"
        :loading="isRunningTests"
      >
        运行所有测试
      </van-button>
      
      <van-button 
        type="default" 
        block 
        style="margin-top: 8px;"
        @click="clearResults"
      >
        清除结果
      </van-button>
    </div>

    <!-- 测试详情弹窗 -->
    <van-popup v-model:show="showDetailPopup" position="bottom" style="height: 80%;">
      <van-nav-bar
        title="API响应详情"
        left-text="关闭"
        @click-left="showDetailPopup = false"
      />
      
      <div style="padding: 16px;">
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ popupContent }}</pre>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { getWechatLoginUrl, wechatLoginCallback } from '@/api/user'
import { getWechatLoginUrlV1, wechatLoginCallbackV1, getWechatLoginUrlCompat, wechatLoginCallbackCompat } from '@/api/v1/auth'

export default {
  name: 'WechatV1MigrationTest',
  setup() {
    const testResults = ref([])
    const isRunningTests = ref(false)
    const showDetailPopup = ref(false)
    const popupContent = ref('')
    
    const oldApiStatus = ref('待测试')
    const v1ApiStatus = ref('待测试')
    const compatApiStatus = ref('待测试')

    // 测试原生API
    const testOldApi = async () => {
      oldApiStatus.value = '测试中...'
      try {
        console.log('🧪 [测试] 开始测试原生API')
        const response = await getWechatLoginUrl({ state: 'old_api_test' })
        
        const result = {
          name: '原生API测试',
          status: '✅ 成功',
          success: true,
          message: `响应码: ${response.code}, URL: ${response.data?.url ? '已获取' : '未获取'}`,
          data: response
        }
        
        testResults.value.unshift(result)
        oldApiStatus.value = '✅ 成功'
        showSuccessToast('原生API测试成功')
        
        popupContent.value = JSON.stringify(response, null, 2)
        showDetailPopup.value = true
        
      } catch (error) {
        console.error('❌ [测试] 原生API测试失败:', error)
        
        const result = {
          name: '原生API测试',
          status: '❌ 失败',
          success: false,
          message: error.message || '请求失败',
          data: error
        }
        
        testResults.value.unshift(result)
        oldApiStatus.value = '❌ 失败'
        showFailToast('原生API测试失败')
        
        popupContent.value = JSON.stringify(error, null, 2)
        showDetailPopup.value = true
      }
    }

    // 测试V1 API
    const testV1Api = async () => {
      v1ApiStatus.value = '测试中...'
      try {
        console.log('🧪 [测试] 开始测试V1 API')
        const response = await getWechatLoginUrlV1({ state: 'v1_api_test' })
        
        const result = {
          name: 'V1 API测试',
          status: '✅ 成功',
          success: true,
          message: `响应码: ${response.code}, URL: ${response.data?.url ? '已获取' : '未获取'}`,
          data: response
        }
        
        testResults.value.unshift(result)
        v1ApiStatus.value = '✅ 成功'
        showSuccessToast('V1 API测试成功')
        
        popupContent.value = JSON.stringify(response, null, 2)
        showDetailPopup.value = true
        
      } catch (error) {
        console.error('❌ [测试] V1 API测试失败:', error)
        
        const result = {
          name: 'V1 API测试',
          status: '❌ 失败',
          success: false,
          message: error.message || '请求失败',
          data: error
        }
        
        testResults.value.unshift(result)
        v1ApiStatus.value = '❌ 失败'
        showFailToast('V1 API测试失败')
        
        popupContent.value = JSON.stringify(error, null, 2)
        showDetailPopup.value = true
      }
    }

    // 测试兼容模式API
    const testCompatApi = async () => {
      compatApiStatus.value = '测试中...'
      try {
        console.log('🧪 [测试] 开始测试兼容模式API')
        const response = await getWechatLoginUrlCompat({ state: 'compat_api_test' })
        
        const result = {
          name: '兼容模式API测试',
          status: '✅ 成功',
          success: true,
          message: `响应码: ${response.code}, URL: ${response.data?.url ? '已获取' : '未获取'}`,
          data: response
        }
        
        testResults.value.unshift(result)
        compatApiStatus.value = '✅ 成功'
        showSuccessToast('兼容模式API测试成功')
        
        popupContent.value = JSON.stringify(response, null, 2)
        showDetailPopup.value = true
        
      } catch (error) {
        console.error('❌ [测试] 兼容模式API测试失败:', error)
        
        const result = {
          name: '兼容模式API测试',
          status: '❌ 失败',
          success: false,
          message: error.message || '请求失败',
          data: error
        }
        
        testResults.value.unshift(result)
        compatApiStatus.value = '❌ 失败'
        showFailToast('兼容模式API测试失败')
        
        popupContent.value = JSON.stringify(error, null, 2)
        showDetailPopup.value = true
      }
    }

    // 运行所有测试
    const runAllTests = async () => {
      isRunningTests.value = true
      clearResults()
      
      try {
        console.log('🚀 [测试] 开始运行所有API测试')
        await testV1Api()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        await testOldApi()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        await testCompatApi()
        
        showSuccessToast('所有测试完成')
      } catch (error) {
        console.error('❌ [测试] 批量测试出错:', error)
        showFailToast('测试过程中出现错误')
      } finally {
        isRunningTests.value = false
      }
    }

    // 清除结果
    const clearResults = () => {
      testResults.value = []
      oldApiStatus.value = '待测试'
      v1ApiStatus.value = '待测试'
      compatApiStatus.value = '待测试'
    }

    return {
      testResults,
      isRunningTests,
      showDetailPopup,
      popupContent,
      oldApiStatus,
      v1ApiStatus,
      compatApiStatus,
      testOldApi,
      testV1Api,
      testCompatApi,
      runAllTests,
      clearResults
    }
  }
}
</script>

<style scoped>
.wechat-v1-test {
  background: #f7f8fa;
  min-height: 100vh;
}

.test-title {
  font-weight: 600;
  color: #323233;
}

.test-description {
  color: #969799;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.result-title {
  font-weight: 600;
  color: #323233;
}

.success-result {
  background: #f0f9ff;
}

.success-result .van-cell__title {
  color: #07c160;
}

.error-result {
  background: #fef2f2;
}

.error-result .van-cell__title {
  color: #ee0a24;
}

.test-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #ebedf0;
}
</style> 