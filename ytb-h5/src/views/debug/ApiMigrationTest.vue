<template>
  <div class="api-migration-test">
    <van-nav-bar title="V1 API迁移测试" left-arrow @click-left="$router.back()" />
    
    <van-cell-group>
      <van-cell title="当前API模式" :value="apiStatus.mode" />
      <van-cell title="V1 API启用" :value="apiStatus.useV1 ? '是' : '否'" />
      <van-cell title="降级功能" :value="apiStatus.fallbackEnabled ? '启用' : '禁用'" />
    </van-cell-group>

    <van-cell-group title="迁移控制">
      <van-cell>
        <template #title>
          <van-switch v-model="useV1Mode" @change="toggleV1Mode" />
          <span style="margin-left: 10px;">启用V1 API</span>
        </template>
      </van-cell>
      
      <van-cell>
        <template #title>
          <van-switch v-model="fallbackMode" @change="toggleFallback" />
          <span style="margin-left: 10px;">启用API降级</span>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group title="API测试">
      <van-cell title="微信登录URL" is-link @click="testWechatUrl" />
      <van-cell title="用户信息获取" is-link @click="testUserInfo" />
      <van-cell title="短信验证码" is-link @click="testSmsCode" />
    </van-cell-group>

    <van-cell-group title="测试结果">
      <div class="test-results">
        <pre>{{ testResults }}</pre>
      </div>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NavBar, CellGroup, Cell, Switch, Toast } from 'vant'
import authService from '@/api/v1/authService'

const useV1Mode = ref(false)
const fallbackMode = ref(true)
const apiStatus = ref({})
const testResults = ref('等待测试...')

// 更新API状态
function updateStatus() {
  apiStatus.value = authService.getStatus()
  useV1Mode.value = apiStatus.value.useV1
  fallbackMode.value = apiStatus.value.fallbackEnabled
}

// 切换V1模式
function toggleV1Mode(value) {
  if (value) {
    authService.enableV1()
    Toast.success('已启用V1 API模式')
  } else {
    authService.useV1 = false
    Toast.success('已切换到原生PHP API模式')
  }
  updateStatus()
}

// 切换降级模式
function toggleFallback(value) {
  if (!value) {
    authService.disableFallback()
    Toast.success('已禁用API降级')
  } else {
    authService.fallbackToOld = true
    Toast.success('已启用API降级')
  }
  updateStatus()
}

// 测试微信登录URL
async function testWechatUrl() {
  try {
    testResults.value = '正在测试微信登录URL...'
    const result = await authService.getWechatLoginUrl({ state: 'test' })
    testResults.value = `微信登录URL测试成功:\n${JSON.stringify(result, null, 2)}`
    Toast.success('微信URL获取成功')
  } catch (error) {
    testResults.value = `微信登录URL测试失败:\n${error.message}`
    Toast({ type: 'fail', message: '微信URL获取失败' })
  }
}

// 测试用户信息
async function testUserInfo() {
  try {
    testResults.value = '正在测试用户信息获取...'
    const result = await authService.getUserInfo()
    testResults.value = `用户信息测试成功:\n${JSON.stringify(result, null, 2)}`
    Toast.success('用户信息获取成功')
  } catch (error) {
    testResults.value = `用户信息测试失败:\n${error.message}`
    Toast({ type: 'fail', message: '用户信息获取失败' })
  }
}

// 测试短信验证码
async function testSmsCode() {
  try {
    testResults.value = '正在测试短信验证码...'
    const result = await authService.sendSmsCode({ 
      phone: '18888888888', 
      type: 'test' 
    })
    testResults.value = `短信验证码测试成功:\n${JSON.stringify(result, null, 2)}`
    Toast.success('短信验证码发送成功')
  } catch (error) {
    testResults.value = `短信验证码测试失败:\n${error.message}`
    Toast({ type: 'fail', message: '短信验证码发送失败' })
  }
}

onMounted(() => {
  updateStatus()
})
</script>

<style scoped>
.test-results {
  padding: 16px;
  background: #f5f5f5;
  margin: 16px;
  border-radius: 8px;
}

.test-results pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
