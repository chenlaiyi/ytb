<template>
  <div class="branch-settings-container">
    <van-nav-bar
      title="设置"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="settings-content">
      <!-- 个人资料 -->
      <div class="settings-section">
        <van-cell title="个人资料" is-link @click="goToProfile">
          <template #icon>
            <van-icon name="user-circle-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="实名认证" is-link @click="goToVerification">
          <template #icon>
            <van-icon name="idcard" class="cell-icon" />
          </template>
          <template #right-icon>
            <van-tag type="primary" v-if="userInfo.isVerified">已认证</van-tag>
            <van-tag type="warning" v-else>未认证</van-tag>
          </template>
        </van-cell>
        <van-cell title="账号安全" is-link @click="goToSecurity">
          <template #icon>
            <van-icon name="shield-o" class="cell-icon" />
          </template>
        </van-cell>
      </div>
      
      <!-- 分支机构专属设置 -->
      <div class="settings-section">
        <div class="section-title">分支机构专属</div>
        <van-cell title="机构信息" is-link @click="goToBranchInfo">
          <template #icon>
            <van-icon name="shop-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="权限管理" is-link @click="goToPermissions">
          <template #icon>
            <van-icon name="manager-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="数据同步" is-link @click="goToDataSync">
          <template #icon>
            <van-icon name="exchange" class="cell-icon" />
          </template>
          <template #right-icon>
            <van-tag type="success" v-if="syncStatus === 'synced'">已同步</van-tag>
            <van-tag type="warning" v-else-if="syncStatus === 'syncing'">同步中</van-tag>
            <van-tag type="danger" v-else>需同步</van-tag>
          </template>
        </van-cell>
      </div>
      
      <!-- 支付设置 -->
      <div class="settings-section">
        <van-cell title="支付管理" is-link @click="goToPayment">
          <template #icon>
            <van-icon name="balance-pay" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="提现/结算管理" is-link @click="goToBankCard">
          <template #icon>
            <van-icon name="credit-pay" class="cell-icon" />
          </template>
        </van-cell>
      </div>
      
      <!-- 应用设置 -->
      <div class="settings-section">
        <van-cell title="通知设置" is-link @click="goToNotification">
          <template #icon>
            <van-icon name="bell" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="隐私设置" is-link @click="goToPrivacy">
          <template #icon>
            <van-icon name="eye-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="清除缓存" is-link @click="clearCache">
          <template #icon>
            <van-icon name="delete" class="cell-icon" />
          </template>
          <template #right-icon>
            <span class="cache-size">{{ cacheSize }}</span>
          </template>
        </van-cell>
      </div>
      
      <!-- 关于我们 -->
      <div class="settings-section">
        <van-cell title="关于我们" is-link @click="goToAbout">
          <template #icon>
            <van-icon name="info-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="用户协议" is-link @click="goToAgreement">
          <template #icon>
            <van-icon name="notes-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell title="隐私政策" is-link @click="goToPrivacyPolicy">
          <template #icon>
            <van-icon name="label-o" class="cell-icon" />
          </template>
        </van-cell>
      </div>
      
      <!-- 应用信息 -->
      <div class="settings-app-info">
        <img src="/images/logo.png" alt="点点够Logo" class="app-logo" />
        <div class="app-name">点点够 - {{ branchInfo.name }}</div>
        <div class="app-version">版本 1.0.409 (分支机构版)</div>
        <div class="branch-code">机构代码: {{ branchInfo.code }}</div>
      </div>
      
      <!-- 退出登录 -->
      <div class="settings-logout">
        <van-button round block color="#ff4d4f" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchUserInfo, logout as branchLogout } from '@/api/branchUser'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const cacheSize = ref('12.5MB')
const syncStatus = ref('synced') // synced, syncing, need_sync

// 用户信息
const userInfo = ref({
  isVerified: false
})

// 分支机构信息
const branchInfo = ref({
  name: '厦门分支机构',
  code: 'XM0001'
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getBranchUserInfo()
    if (res.code === 0) {
      userInfo.value = res.data || {}
      
      // 处理认证状态
      if (res.data) {
        // 根据分支机构的认证逻辑处理
        if (res.data.name && res.data.phone) {
          userInfo.value.isVerified = true
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 页面跳转方法
const goToProfile = () => router.push('/branch/settings/profile')
const goToVerification = () => router.push('/branch/settings/verification')
const goToSecurity = () => router.push('/branch/settings/security')
const goToBranchInfo = () => router.push('/branch/settings/branch-info')
const goToPermissions = () => router.push('/branch/settings/permissions')
const goToDataSync = () => router.push('/branch/settings/data-sync')
const goToPayment = () => router.push('/branch/settings/payment')
const goToBankCard = () => router.push('/branch/settings/bank-card')
const goToNotification = () => router.push('/branch/settings/notification')
const goToPrivacy = () => router.push('/branch/settings/privacy')
const goToAbout = () => router.push('/branch/settings/about')
const goToAgreement = () => router.push('/branch/settings/agreement')
const goToPrivacyPolicy = () => router.push('/branch/settings/privacy-policy')

// 显示开发中提示
const showDevelopingToast = (feature) => {
  showToast(`${feature}功能开发中...`)
}

// 清除缓存
const clearCache = async () => {
  try {
    const result = await showDialog({
      title: '清除缓存',
      message: '确定要清除应用缓存吗？这将清除所有本地数据。',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    if (result === 'confirm') {
      showToast.loading({
        message: '清除中...',
        forbidClick: true,
        duration: 0
      })
      
      // 模拟清除缓存
      setTimeout(() => {
        // 清除localStorage中的缓存数据（保留重要的登录信息）
        const importantKeys = ['branch_code', 'branch_token', 'branch_user_info']
        const allKeys = Object.keys(localStorage)
        
        allKeys.forEach(key => {
          if (!importantKeys.includes(key)) {
            localStorage.removeItem(key)
          }
        })
        
        showToast.clear()
        showToast.success('缓存清除成功')
        cacheSize.value = '2.1MB'
      }, 2000)
    }
  } catch (error) {
    // 用户取消
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    const result = await showDialog({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    if (result === 'confirm') {
      showToast.loading({
        message: '退出中...',
        forbidClick: true
      })
      
      try {
        await branchLogout()
      } catch (error) {
        console.error('退出登录失败', error)
      }
      
      // 清除本地存储
      localStorage.removeItem('branch_token')
      localStorage.removeItem('branch_user_info')
      
      showToast.clear()
      showToast.success('已退出登录')
      
      // 跳转到分支机构登录页
      const branchCode = localStorage.getItem('branch_code') || 'XM0001'
      router.replace(`/branch-login?branch_code=${branchCode}`)
    }
  } catch (error) {
    // 用户取消
  }
}

// 获取分支机构信息
const getBranchInfo = () => {
  try {
    const storedBranchInfo = localStorage.getItem('branch_info')
    if (storedBranchInfo) {
      const info = JSON.parse(storedBranchInfo)
      branchInfo.value = {
        name: info.name || '厦门分支机构',
        code: info.code || 'XM0001'
      }
    }
  } catch (error) {
    console.error('获取分支机构信息失败', error)
  }
}

onMounted(() => {
  fetchUserInfo()
  getBranchInfo()
})
</script>

<style scoped>
.branch-settings-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.settings-content {
  padding: 16px;
}

.settings-section {
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 500;
  color: #646566;
  background-color: #f7f8fa;
}

.cell-icon {
  margin-right: 12px;
  color: #1989fa;
}

.cache-size {
  font-size: 12px;
  color: #969799;
}

.settings-app-info {
  text-align: center;
  padding: 32px 16px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.app-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  border-radius: 12px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.app-version {
  font-size: 14px;
  color: #969799;
  margin-bottom: 4px;
}

.branch-code {
  font-size: 12px;
  color: #1989fa;
  background-color: #f0f8ff;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.settings-logout {
  padding: 0 16px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .settings-content {
    padding: 12px;
  }
  
  .settings-app-info {
    padding: 24px 16px;
  }
  
  .app-logo {
    width: 50px;
    height: 50px;
  }
  
  .app-name {
    font-size: 16px;
  }
}
</style>
