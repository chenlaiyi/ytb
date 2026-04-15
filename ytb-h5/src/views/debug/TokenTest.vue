<template>
  <div class="token-test">
    <van-nav-bar title="Token测试" left-arrow @click-left="$router.back()" />
    
    <div class="test-content">
      <van-cell-group>
        <van-cell title="当前Token" :value="currentToken" />
        <van-cell title="用户信息" :value="userInfo" />
        <van-cell title="业务员状态" :value="salesmanStatus" />
      </van-cell-group>
      
      <div class="test-buttons">
        <van-button type="primary" @click="testToken" :loading="testing">
          测试Token
        </van-button>
        <van-button type="warning" @click="testSalesmanAPI" :loading="testingSalesman">
          测试业务员API
        </van-button>
        <van-button type="danger" @click="clearToken">
          清除Token
        </van-button>
      </div>
      
      <div class="test-results" v-if="testResult">
        <van-cell-group title="测试结果">
          <van-cell title="状态" :value="testResult.status" />
          <van-cell title="消息" :value="testResult.message" />
          <van-cell title="调试信息" :value="testResult.debug" />
        </van-cell-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NavBar, CellGroup, Cell, Button } from 'vant'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import Toast from '@/utils/toast-fix'

const userStore = useUserStore()

const currentToken = ref('')
const userInfo = ref('')
const salesmanStatus = ref('')
const testing = ref(false)
const testingSalesman = ref(false)
const testResult = ref(null)

// 获取当前token信息
const getCurrentTokenInfo = () => {
  const token = localStorage.getItem('token')
  currentToken.value = token ? token.substring(0, 20) + '...' : '无'
  
  const user = userStore.userInfo
  userInfo.value = user ? `${user.name || user.id} (${user.phone || '无手机号'})` : '无'
  
  salesmanStatus.value = user?.is_salesman ? '是业务员' : '非业务员'
}

// 测试token
const testToken = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    const response = await request({
      url: '/test_token.php',
      method: 'get'
    })
    
    testResult.value = {
      status: '成功',
      message: response.user_info ? '用户验证成功' : '用户验证失败',
      debug: response.debug ? response.debug.join(', ') : '无调试信息'
    }
    
    Toast.success('Token测试完成')
  } catch (error) {
    testResult.value = {
      status: '失败',
      message: error.message || '测试失败',
      debug: error.response?.data?.debug?.join(', ') || '无调试信息'
    }
    
    Toast({ type: 'fail', message: 'Token测试失败' })
  } finally {
    testing.value = false
  }
}

// 测试业务员API
const testSalesmanAPI = async () => {
  testingSalesman.value = true
  
  try {
    const response = await request({
      url: '/salesman/workspace.php',
      method: 'get'
    })
    
    if (response.code === 0) {
      Toast.success('业务员API调用成功')
      testResult.value = {
        status: '成功',
        message: '业务员API正常',
        debug: '获取到业务员数据'
      }
    } else {
      Toast({ type: 'fail', message: '业务员API返回错误: ' + response.message })
      testResult.value = {
        status: '失败',
        message: response.message,
        debug: '业务员API返回错误'
      }
    }
  } catch (error) {
    Toast({ type: 'fail', message: '业务员API调用失败: ' + error.message })
    testResult.value = {
      status: '失败',
      message: error.message || '调用失败',
      debug: error.response?.data?.message || '网络错误'
    }
  } finally {
    testingSalesman.value = false
  }
}

// 清除token
const clearToken = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  userStore.logout()
  getCurrentTokenInfo()
  Toast.success('Token已清除')
}

onMounted(() => {
  getCurrentTokenInfo()
})
</script>

<style scoped>
.token-test {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.test-content {
  padding: 16px;
}

.test-buttons {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-results {
  margin-top: 16px;
}
</style> 