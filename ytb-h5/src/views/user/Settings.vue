<template>
  <div class="settings-container">
    <!-- 移除蓝色导航条，界面更简洁 -->
    
    <div class="settings-content">
      <!-- 个人资料 -->
      <div class="settings-section">
        <Cell title="个人资料" is-link @click="goToProfile">
          <template #icon>
            <Icon name="user-circle-o" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="实名认证" is-link @click="goToVerification">
          <template #icon>
            <Icon name="idcard" class="cell-icon" />
          </template>
          <template #right-icon>
            <Tag type="primary" v-if="userInfo.isVerified">已认证</Tag>
            <Tag type="warning" v-else>未认证</Tag>
          </template>
        </Cell>
        <Cell title="账号安全" is-link @click="goToSecurity">
          <template #icon>
            <Icon name="shield-o" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <!-- 支付设置 -->
      <div class="settings-section">
        <Cell title="支付管理" is-link @click="goToPayment">
          <template #icon>
            <Icon name="balance-pay" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="提现/结算管理" is-link @click="goToBankCard">
          <template #icon>
            <Icon name="credit-pay" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <!-- 应用设置 -->
      <div class="settings-section">
        <Cell title="通知设置" is-link @click="goToNotification">
          <template #icon>
            <Icon name="bell" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="隐私设置" is-link @click="goToPrivacy">
          <template #icon>
            <Icon name="eye-o" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="清除缓存" is-link @click="clearCache">
          <template #icon>
            <Icon name="delete" class="cell-icon" />
          </template>
          <template #right-icon>
            <span class="cache-size">{{ cacheSize }}</span>
          </template>
        </Cell>
      </div>
      
      <!-- 关于我们 -->
      <div class="settings-section">
        <Cell title="关于我们" is-link @click="goToAbout">
          <template #icon>
            <Icon name="info-o" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="用户协议" is-link @click="goToAgreement">
          <template #icon>
            <Icon name="notes-o" class="cell-icon" />
          </template>
        </Cell>
        <Cell title="隐私政策" is-link @click="goToPrivacyPolicy">
          <template #icon>
            <Icon name="label-o" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <!-- 应用信息 -->
      <div class="settings-app-info">
        <img src="/images/logo.png" alt="点点够Logo" class="app-logo" />
        <div class="app-name">点点够</div>
        <div 
          class="app-version" 
          :class="{ 'version-clickable': true, 'version-checking': isCheckingUpdate, 'version-has-update': hasUpdate }"
          @click="checkForUpdate"
        >
          {{ versionDisplay }}
        </div>
        <div v-if="updateStatus" class="update-status" :class="updateStatusClass">
          {{ updateStatus }}
        </div>
      </div>
      
      <!-- 退出登录 -->
      <div class="settings-logout">
        <Button round block color="#ff4d4f" @click="handleLogout">
          退出登录
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Cell, Button, Icon, Tag } from 'vant'
import { getUserInfo, getVerificationStatus, logout as userLogout } from '@/api/user'
import { useUserStore } from '@/stores/user'
import Toast from '@/utils/toast-fix'
import request from '@/utils/request'

const router = useRouter()
const cacheSize = ref('12.5MB')

// 用户信息
const userInfo = ref({
  isVerified: false, // 实名认证状态
  is_pay_institution: 0 // 支付机构角色
})

const verificationSummary = ref({
  status: 'none',
  source: '',
  idCard: '',
  idCardImages: []
})

// 版本管理相关
const currentVersion = ref('1.0.409')
const currentBuildNumber = ref('409')
const latestVersion = ref('')
const latestBuildNumber = ref('')
const isCheckingUpdate = ref(false)
const updateStatus = ref('')
const lastCheckTime = ref(0)
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

// 版本显示文本
const versionDisplay = computed(() => {
  if (isCheckingUpdate.value) {
    return `版本 ${currentVersion.value}+${currentBuildNumber.value} ⏳`
  }
  
  if (latestVersion.value && hasUpdate.value) {
    return `版本 ${currentVersion.value} (有更新: ${latestVersion.value}) 🔄`
  }
  
  if (latestVersion.value && !hasUpdate.value) {
    return `版本 ${currentVersion.value}+${currentBuildNumber.value} (最新)`
  }
  
  return `版本 ${currentVersion.value}+${currentBuildNumber.value}`
})

// 是否有更新
const hasUpdate = computed(() => {
  if (!latestVersion.value || !latestBuildNumber.value) return false
  return parseInt(latestBuildNumber.value) > parseInt(currentBuildNumber.value)
})

// 更新状态样式
const updateStatusClass = computed(() => {
  if (updateStatus.value.includes('有更新') || updateStatus.value.includes('发现新版本')) return 'update-available'
  if (updateStatus.value.includes('最新')) return 'update-latest'
  if (updateStatus.value.includes('检查中')) return 'update-checking'
  return 'update-info'
})

// 获取版本信息
const getVersionInfo = async (forceRefresh = false) => {
  const now = Date.now()
  const cachedData = localStorage.getItem('h5_version_cache')
  
  // 检查缓存
  if (!forceRefresh && cachedData && (now - lastCheckTime.value < CACHE_DURATION)) {
    try {
      const cached = JSON.parse(cachedData)
      if (cached.latestVersion && cached.latestBuildNumber) {
        latestVersion.value = cached.latestVersion
        latestBuildNumber.value = cached.latestBuildNumber
        lastCheckTime.value = cached.timestamp
        console.log('使用缓存的版本信息:', cached)
        return
      }
    } catch (e) {
      console.error('解析版本缓存失败:', e)
    }
  }
  
  try {
    console.log('开始获取最新版本信息...')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    
    const response = await request.get('/Tapp/admin/public/api/v1/version/check', {
      params: {
        platform: 'android',
        version: currentVersion.value,
        build_number: currentBuildNumber.value
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      skipErrorToast: true
    })
    
    console.log('版本检查API响应:', response.data)
    
    if (response.data && response.data.code === 0) {
      const data = response.data.data
      if (data.latest_version) {
        latestVersion.value = data.latest_version.version
        latestBuildNumber.value = data.latest_version.build_number.toString()
        
        // 缓存版本信息
        const cacheData = {
          latestVersion: latestVersion.value,
          latestBuildNumber: latestBuildNumber.value,
          timestamp: now
        }
        localStorage.setItem('h5_version_cache', JSON.stringify(cacheData))
        lastCheckTime.value = now
        
        console.log('版本信息已更新:', {
          current: `${currentVersion.value}+${currentBuildNumber.value}`,
          latest: `${latestVersion.value}+${latestBuildNumber.value}`,
          hasUpdate: hasUpdate.value
        })
      }
    } else {
      console.warn('版本检查API返回异常:', response.data)
    }
  } catch (error) {
    console.error('获取版本信息失败:', error)
    // 网络错误时使用本地版本，避免显示错误
    if (!latestVersion.value) {
      latestVersion.value = currentVersion.value
      latestBuildNumber.value = currentBuildNumber.value
    }
  }
}

// 检查更新
const checkForUpdate = async () => {
  if (isCheckingUpdate.value) return
  
  console.log('用户点击检查更新')
  isCheckingUpdate.value = true
  updateStatus.value = '正在检查更新...'
  
  try {
    await getVersionInfo(true) // 强制刷新
    
    if (hasUpdate.value) {
      updateStatus.value = `发现新版本 ${latestVersion.value}！`
      
      // 显示更新提示
      Toast.confirm({
        title: '发现新版本',
        message: `当前版本: ${currentVersion.value}+${currentBuildNumber.value}\n最新版本: ${latestVersion.value}+${latestBuildNumber.value}\n\n是否前往下载？`,
        confirmButtonText: '立即下载',
        confirmButtonColor: '#1989fa',
        cancelButtonText: '稍后再说',
        messageAlign: 'left'
      }).then(() => {
        // 跳转到下载页面
        const downloadUrl = 'https://pay.itapgo.com/app/download'
        window.open(downloadUrl, '_blank')
        
        // 记录下载统计
        recordDownload()
      }).catch(() => {
        console.log('用户取消下载')
      })
    } else {
      updateStatus.value = '已是最新版本'
      Toast.success('已是最新版本')
      
      // 3秒后清除状态
      setTimeout(() => {
        updateStatus.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    updateStatus.value = '检查更新失败'
    Toast.fail('检查更新失败，请稍后重试')
    
    // 3秒后清除状态
    setTimeout(() => {
      updateStatus.value = ''
    }, 3000)
  } finally {
    isCheckingUpdate.value = false
  }
}

// 记录下载统计
const recordDownload = async () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    await request.post('/Tapp/admin/public/api/v1/version/download', {
      version: latestVersion.value,
      build_number: latestBuildNumber.value,
      platform: 'android',
      source: 'h5_settings'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      skipErrorToast: true
    })
    console.log('下载统计已记录')
  } catch (error) {
    console.error('记录下载统计失败:', error)
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0) {
      userInfo.value = res.data || {}
    }

    // 获取实名认证详情，保持与认证页面一致
    try {
      const verificationRes = await getVerificationStatus()
      if (verificationRes?.success && verificationRes.data) {
        const summary = verificationRes.data
        verificationSummary.value = {
          status: summary.payment_status?.status || (summary.is_verified ? 'verified' : 'none'),
          source: summary.payment_status?.source || '',
          idCard: summary.user_info?.id_card || '',
          idCardImages: Array.isArray(summary.user_info?.id_card_images)
            ? summary.user_info.id_card_images
            : []
        }
        userInfo.value.isVerified = !!summary.is_verified
      } else if (verificationRes?.message) {
        console.warn('获取实名认证状态失败:', verificationRes.message)
        userInfo.value.isVerified = false
      }
    } catch (error) {
      console.warn('获取实名认证状态异常', error)
      userInfo.value.isVerified = false
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 页面跳转方法
const goToProfile = () => router.push('/user/settings/profile')
const goToVerification = () => router.push('/user/settings/verification')
const goToSecurity = () => router.push('/user/settings/security')
const goToPayment = () => router.push('/user/settings/payment')
const goToBankCard = () => {
  router.push({
    path: '/user/settings/bank-card',
    query: { tab: 'alipay' }
  })
}
const goToNotification = () => router.push('/user/settings/notification')
const goToPrivacy = () => router.push('/user/settings/privacy')
const goToAbout = () => router.push('/user/settings/about')
const goToAgreement = () => router.push('/user/settings/agreement')
const goToPrivacyPolicy = () => router.push('/user/settings/privacy-policy')

// 显示开发中提示
const showDevelopingToast = (feature) => {
  Toast(`${feature}功能开发中...`)
}

// 清除缓存
const clearCache = () => {
  Toast.confirm({
    title: '提示',
    message: '确定要清除应用缓存吗？',
    confirmButtonText: '清除',
    confirmButtonColor: '#1989fa',
    cancelButtonText: '取消',
    messageAlign: 'center'
  }).then(() => {
    // 显示加载中
    const loading = Toast.loading({
      message: '清除中...',
      forbidClick: true
    });
    
    // 模拟清除缓存
    setTimeout(() => {
      // 只清除非关键缓存
      try {
        // 清除localStorage中非关键数据
        const keysToKeep = ['token', 'userInfo'];
        Object.keys(localStorage).forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        // 清除sessionStorage
        sessionStorage.clear();
        
        // 不清除cookie，避免影响登录状态
        
        // 更新缓存大小显示
        cacheSize.value = '0MB';
        
        // 清除加载提示
        loading.clear();
        
        // 显示成功消息
        Toast.success('缓存清除成功');
      } catch (error) {
        console.error('清除缓存失败', error);
        loading.clear();
        Toast({ type: 'fail', message: '清除缓存失败' });
      }
    }, 1000);
  }).catch(() => {
    // 取消操作
  });
}

// 退出登录
const handleLogout = () => {
  Toast.confirm({
    title: '提示',
    message: '确定要退出登录吗？',
    confirmButtonText: '退出登录',
    confirmButtonColor: '#ff4d4f',
    cancelButtonText: '取消',
    messageAlign: 'center'
  }).then(async () => {
    try {
      // 调用后端登出API
      await userLogout()
      
      // 彻底清除所有登录状态
      clearAllAuthData()
      
      Toast.success('已退出登录')
      
      // 延迟跳转确保状态清除完成
      setTimeout(() => {
        // 强制刷新页面确保状态完全重置
        window.location.href = '/app/#/login'
      }, 100)
    } catch (error) {
      console.error('退出登录失败', error)
      
      // 即使API调用失败，也要清除本地状态
      clearAllAuthData()
      
      Toast.success('已退出登录')
      // 延迟跳转确保状态清除完成
      setTimeout(() => {
        // 强制刷新页面确保状态完全重置
        window.location.href = '/app/#/login'
      }, 100)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 彻底清除认证数据的函数
const clearAllAuthData = () => {
  // 清除localStorage
  localStorage.clear()
  
  // 清除sessionStorage
  sessionStorage.clear()
  
  // 清除cookie
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  })
  
  // 清除用户状态管理中的数据
  const userStore = useUserStore()
  userStore.clearUserInfo()
  
  // 清除全局认证变量
  if (window.TAPGO_AUTH) {
    delete window.TAPGO_AUTH
  }
  
  // 清除其他可能的认证相关变量
  window.TAPGO_TOKEN = null
  window.TAPGO_USER_INFO = null
  window.TAPGO_LOGIN_TIME = null
}

// 页面加载时获取数据
onMounted(() => {
  console.log('H5设置页面加载 - 版本管理已启用')
  
  // 强制隐藏底部导航 - 直接操作DOM确保TabBar被隐藏
  const tabbarElements = document.querySelectorAll('.van-tabbar, .tab-bar-container')
  tabbarElements.forEach(el => {
    if (el) {
      el.style.display = 'none'
    }
  })
  
  // 获取用户信息
  fetchUserInfo()
  
  // 自动获取版本信息（使用缓存）
  getVersionInfo()
})
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.settings-content {
  padding-bottom: 30px;
}

.settings-section {
  margin: 12px 0;
  background: #fff;
}

.cell-icon {
  margin-right: 5px;
  font-size: 18px;
  color: var(--primary-color, #1989fa);
}

.cache-size {
  font-size: 14px;
  color: #999;
}

.settings-app-info {
  margin-top: 24px;
  padding: 20px 0;
  text-align: center;
}

.app-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
}

.app-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.app-version {
  font-size: 12px;
  color: #999;
  transition: all 0.3s ease;
  user-select: none;
}

.version-clickable {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
  margin: 2px 0;
}

.version-clickable:hover {
  background-color: #f0f9ff;
  color: #1989fa;
  transform: translateY(-1px);
}

.version-clickable:active {
  transform: translateY(0);
}

.version-checking {
  color: #1989fa;
  animation: pulse 1.5s ease-in-out infinite;
}

.version-has-update {
  color: #fa8c16;
  font-weight: 500;
}

.update-status {
  font-size: 11px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
}

.update-available {
  background-color: #fff2e8;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.update-latest {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.update-checking {
  background-color: #f0f9ff;
  color: #1989fa;
  border: 1px solid #91d5ff;
}

.update-info {
  background-color: #f0f9ff;
  color: #1989fa;
  border: 1px solid #91d5ff;
}

.settings-logout {
  margin: 24px 16px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 375px) {
  .app-version {
    font-size: 11px;
  }
  
  .update-status {
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
