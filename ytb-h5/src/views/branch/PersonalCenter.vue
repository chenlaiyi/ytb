<template>
  <div class="personal-center-container">
    <!-- 用户头部区域 -->
    <div class="user-header">
      <div class="header-bg"></div>
      <div class="user-profile">
        <div class="avatar-container">
          <van-image
            round
            width="76"
            height="76"
            :src="userInfo.wechat_avatar || userInfo.avatar || '/images/default-avatar.png'"
            class="user-avatar"
            @error="handleAvatarError"
          >
            <template #error>
              <div class="avatar-fallback">头像</div>
            </template>
          </van-image>
          <!-- 移除分支标签，不显示 -->
          <div class="vip-badge" v-if="userInfo.is_vip">VIP</div>
        </div>
        
        <div class="user-info-content">
          <div v-if="userInfo.userId" class="user-name-row">
            <span class="user-name">{{ 
              userInfo.wechat_nickname || userInfo.name || userInfo.nickname || '用户' + userInfo.userId
            }}</span>
            <div class="user-id">ID: {{ userInfo.userId }}</div>
          </div>
          <div v-else class="login-btn" @click="handleLogin">点击登录/注册</div>
          
          <!-- 分支机构信息 - 隐藏 -->
          <!-- <div class="branch-info" v-if="userInfo.userId">
            <div class="branch-name">{{ branchInfo.name }}</div>
            <div class="branch-code">机构代码: {{ branchInfo.code }}</div>
          </div> -->
          
          <!-- 用户角色标签 -->
          <div class="role-tags" v-if="userInfo.userId && hasAnyRole()">
            <div class="role-chips">
              <span 
                v-if="hasRole('is_vip')"
                class="role-badge vip" 
                title="VIP会员"
              >
                <van-icon name="gem-o" size="12" />
                <span class="role-text">VIP</span>
              </span>
              <span 
                v-if="hasRole('is_salesman')"
                class="role-badge salesman" 
                title="业务员"
              >
                <van-icon name="manager-o" size="12" />
                <span class="role-text">业务员</span>
              </span>
              <span 
                v-if="hasRole('is_pay_institution')"
                class="role-badge institution" 
                title="支付机构"
              >
                <van-icon name="credit-pay" size="12" />
                <span class="role-text">支付机构</span>
              </span>
              <span 
                v-if="hasRole('is_water_purifier_user')"
                class="role-badge purifier" 
                title="净水器用户"
              >
                <van-icon name="cluster-o" size="12" />
                <span class="role-text">净水器</span>
              </span>
              <span
                v-if="hasRole('is_admin')"
                class="role-badge admin clickable"
                title="点击进入管理后台"
                @click="handleAdminEntry"
              >
                <van-icon name="setting-o" size="12" />
                <span class="role-text">管理员</span>
              </span>
            </div>
          </div>
        </div>
        
        <div class="settings-btn" @click="$router.push('/branch/settings')">
          <van-icon name="setting-o" size="22" />
        </div>
      </div>
    </div>

    <!-- 资产卡片 -->
    <div class="section assets-section" v-if="userInfo.userId">
      <div class="assets-card">
        <div class="assets-header">
          <span class="assets-title">我的资产</span>
          <span class="assets-link" @click="$router.push('/branch/wallet')">查看详情</span>
        </div>
        <div class="assets-content">
          <div class="asset-item" @click="$router.push('/branch/wallet')">
            <div class="asset-value">¥0.00</div>
            <div class="asset-label">余额</div>
          </div>
          <div class="asset-item" @click="$router.push('/branch/points')">
            <div class="asset-value">0</div>
            <div class="asset-label">积分</div>
          </div>
          <div class="asset-item" @click="$router.push('/branch/benefits')">
            <div class="asset-value">0</div>
            <div class="asset-label">专属福利</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="section quick-section" v-if="userInfo.userId">
      <div class="quick-functions">
        <div class="quick-item" v-if="hasRole('is_vip')" @click="$router.push('/branch/vip')">
          <div class="quick-icon vip">
            <van-icon name="gem-o" size="24" />
          </div>
          <div class="quick-text">VIP中心</div>
        </div>
        
        <div class="quick-item" v-if="hasRole('is_salesman')" @click="$router.push('/branch/salesman')">
          <div class="quick-icon salesman">
            <van-icon name="manager-o" size="24" />
          </div>
          <div class="quick-text">业务员中心</div>
        </div>
        
        <div class="quick-item" v-if="hasRole('is_pay_institution')" @click="$router.push('/branch/institution')">
          <div class="quick-icon institution">
            <van-icon name="credit-pay" size="24" />
          </div>
          <div class="quick-text">支付机构</div>
        </div>
        
        <div class="quick-item" v-if="hasRole('is_water_purifier_user')" @click="$router.push('/branch/purifier')">
          <div class="quick-icon purifier">
            <van-icon name="cluster-o" size="24" />
          </div>
          <div class="quick-text">净水器管理</div>
        </div>
      </div>
    </div>

    <!-- 分支机构专区 - 暂时隐藏 -->
    <!-- <div class="section branch-workspace-card" v-if="userInfo.userId">
      <div class="section-header">
        <span class="section-title">分支机构专区</span>
        <div class="view-all">
          <span>专属服务</span>
        </div>
      </div>
      
      <div class="workspace-grid">
        <div class="workspace-item" @click="$router.push('/branch/products')">
          <div class="workspace-icon products">
            <van-icon name="goods-collect-o" size="28" />
          </div>
          <div class="workspace-text">产品中心</div>
        </div>
        
        <div class="workspace-item" @click="$router.push('/branch/events')">
          <div class="workspace-icon events">
            <van-icon name="calendar-o" size="28" />
          </div>
          <div class="workspace-text">活动中心</div>
        </div>
        
        <div class="workspace-item" @click="$router.push('/branch/members')">
          <div class="workspace-icon members">
            <van-icon name="friends-o" size="28" />
          </div>
          <div class="workspace-text">会员管理</div>
        </div>
        
        <div class="workspace-item" @click="$router.push('/branch/revenue')">
          <div class="workspace-icon revenue">
            <van-icon name="bar-chart-o" size="28" />
          </div>
          <div class="workspace-text">营收统计</div>
        </div>
      </div>
    </div> -->

    <!-- 常用功能 - 暂时隐藏 -->
    <!--
    <div class="section menu-section" v-if="userInfo.userId">
      <div class="section-header">
        <span class="section-title">常用功能</span>
      </div>
      
      <div class="menu-list">
        <div class="menu-item" @click="$router.push('/branch/wallet')">
          <div class="menu-icon money">
            <van-icon name="gold-coin-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">我的钱包</div>
            <div class="menu-desc">查看余额和交易记录</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/branch/orders')">
          <div class="menu-icon orders">
            <van-icon name="orders-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">我的订单</div>
            <div class="menu-desc">查看订单状态和历史</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/branch/address')">
          <div class="menu-icon address">
            <van-icon name="location-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">收货地址</div>
            <div class="menu-desc">管理您的收货地址</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/branch/devices')">
          <div class="menu-icon device">
            <van-icon name="apps-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">我的设备</div>
            <div class="menu-desc">管理已绑定的设备</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/branch/feedback')">
          <div class="menu-icon feedback">
            <van-icon name="comment-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">用户反馈</div>
            <div class="menu-desc">提交意见和建议</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/branch/help')">
          <div class="menu-icon help">
            <van-icon name="question-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">帮助中心</div>
            <div class="menu-desc">常见问题解答</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
      </div>
      
      <div class="logout-btn" v-if="userInfo.userId" @click="handleLogout">
        退出登录
      </div>
    </div>
    -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchUserInfo, getBranchUserAssets, logout as branchLogout } from '@/api/branchUser'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const loading = ref(false)

// 用户信息
const userInfo = ref({
  userId: '',
  nickname: '',
  wechat_nickname: '',
  avatar: '',
  wechat_avatar: '',
  phone: '',
  email: '',
  name: '',
  roles: [],
  is_pay_institution: 0,
  is_water_purifier_user: 0,
  is_engineer: 0,
  is_water_purifier_agent: 0,
  is_pay_merchant: 0,
  is_vip: 0,
  is_salesman: 0,
  is_admin: 0
})

// 分支机构信息
const branchInfo = ref({
  name: '厦门分支机构',
  code: 'XM0001'
})

// 用户资产
const userAssets = ref({
  balance: '0.00',
  points: '0',
  benefits: '0'
})

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.log('头像加载失败，显示默认头像内容')
}

// 处理登录
const handleLogin = () => {
  const branchCode = localStorage.getItem('branch_code') || 'XM0001'
  router.push(`/branch-login?branch_code=${branchCode}`)
}

// 处理退出登录
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

// 处理管理员入口
const handleAdminEntry = async () => {
  try {
    showToast.loading({
      message: '正在进入管理后台...',
      forbidClick: true
    })

    // 验证管理员权限
    if (!hasRole('is_admin')) {
      showToast.clear()
      showToast.fail('您没有管理员权限')
      return
    }

    // 获取当前用户信息
    const token = localStorage.getItem('branch_token')
    const branchCode = localStorage.getItem('branch_code') || 'XM0001'

    if (!token) {
      showToast.clear()
      showToast.fail('登录状态已过期，请重新登录')
      handleLogin()
      return
    }

    // 由于管理后台和分支机构使用不同的认证系统，
    // 我们需要将用户重定向到管理后台，让管理后台处理认证
    // 管理后台会检查用户的管理员权限并自动登录

    // 构建管理后台URL，传递分支机构信息
    const adminUrl = `${window.location.origin}/app/#/admin/login?auto_login=1&branch_code=${branchCode}&source=branch_personal_center`

    showToast.clear()
    showToast.success('正在跳转到管理后台')

    // 跳转到管理后台登录页，管理后台会自动处理认证
    window.location.href = adminUrl

  } catch (error) {
    console.error('进入管理后台失败:', error)
    showToast.clear()
    showToast.fail('进入管理后台失败，请重试')
  }
}

// 检查用户角色
const hasRole = (role) => {
  return userInfo.value[role] === 1 || userInfo.value[role] === '1'
}

// 检查是否有任何角色
const hasAnyRole = () => {
  return hasRole('is_vip') || hasRole('is_salesman') || hasRole('is_pay_institution') || 
         hasRole('is_water_purifier_user') || hasRole('is_admin')
}

// 获取角色样式类
const getRoleClass = (role) => {
  const roleMap = {
    'VIP会员': 'vip',
    '业务员': 'salesman',
    '支付机构': 'institution',
    '净水器用户': 'purifier',
    '工程师': 'engineer',
    '代理商': 'agent',
    '商户': 'merchant',
    '管理员': 'admin'
  }
  return roleMap[role] || 'default'
}

// 获取角色图标
const getRoleIcon = (role) => {
  const iconMap = {
    'VIP会员': 'gem-o',
    '业务员': 'manager-o',
    '支付机构': 'credit-pay',
    '净水器用户': 'cluster-o',
    '工程师': 'service-o',
    '代理商': 'friends-o',
    '商户': 'shop-o',
    '管理员': 'setting-o'
  }
  return iconMap[role] || 'user-o'
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    loading.value = true
    const res = await getBranchUserInfo()
    
    if (res.code === 0 && res.data) {
      userInfo.value = {
        ...userInfo.value,
        ...res.data,
        userId: res.data.id || res.data.userId || '',
        roles: res.data.roles || []
      }
      
      // 获取用户资产
      await fetchUserAssets()
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  } finally {
    loading.value = false
  }
}

// 获取用户资产
const fetchUserAssets = async () => {
  try {
    const res = await getBranchUserAssets()
    if (res.code === 0 && res.data) {
      userAssets.value = {
        balance: res.data.balance || '0.00',
        points: res.data.points || '0',
        benefits: res.data.benefits || '0'
      }
    }
  } catch (error) {
    console.error('获取用户资产失败', error)
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
  getBranchInfo()
  fetchUserInfo()
})
</script>

<style scoped>
.personal-center-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

/* 用户头部区域 */
.user-header {
  position: relative;
  padding-bottom: 16px;
}

.header-bg {
  height: 160px;
  background: linear-gradient(135deg, #1989fa, #0088ff);
  border-radius: 0 0 16px 16px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.user-profile {
  position: relative;
  z-index: 2;
  display: flex;
  padding: 20px 16px 0;
  align-items: center;
}

.avatar-container {
  position: relative;
  margin-right: 15px;
}

.user-avatar {
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-fallback {
  width: 76px;
  height: 76px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
}

.vip-badge {
  position: absolute;
  bottom: 0;
  right: -5px;
  background-color: #ff9500;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
}

.user-info-content {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-right: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.login-btn {
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.branch-info {
  margin-top: 4px;
}

.branch-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.branch-code {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.role-tags {
  margin-top: 8px;
}

.role-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.role-badge.vip { 
  background: linear-gradient(135deg, #ff9500, #ffb84d);
  box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
}
.role-badge.salesman { 
  background: linear-gradient(135deg, #1989fa, #4dabf7);
  box-shadow: 0 2px 4px rgba(25, 137, 250, 0.3);
}
.role-badge.institution { 
  background: linear-gradient(135deg, #07c160, #51cf66);
  box-shadow: 0 2px 4px rgba(7, 193, 96, 0.3);
}
.role-badge.purifier { 
  background: linear-gradient(135deg, #00d4aa, #38d9a9);
  box-shadow: 0 2px 4px rgba(0, 212, 170, 0.3);
}
.role-badge.admin {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.role-badge.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-badge.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.role-badge.clickable:active {
  transform: translateY(0);
}

.role-text {
  font-size: 10px;
  font-weight: 500;
}

.settings-btn {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

/* 通用区块样式 */
.section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.view-all {
  font-size: 12px;
  color: #969799;
}

/* 资产卡片 */
.assets-section {
  margin-top: -8px;
  padding: 0 16px;
}

.assets-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.assets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.assets-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.assets-link {
  font-size: 12px;
  color: #1989fa;
  cursor: pointer;
}

.assets-content {
  display: flex;
  justify-content: space-between;
}

.asset-item {
  text-align: center;
  flex: 1;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.asset-item:hover {
  background-color: #f7f8fa;
}

.asset-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.asset-label {
  font-size: 12px;
  color: #969799;
}

/* 快捷功能 */
.quick-section {
  padding: 0 16px;
}

.quick-functions {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
  border-radius: 8px;
  min-width: 60px;
}

.quick-item:hover {
  background-color: #f7f8fa;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #fff;
}

.quick-icon.vip { background: linear-gradient(135deg, #ff9500, #ffb84d); }
.quick-icon.salesman { background: linear-gradient(135deg, #1989fa, #4dabf7); }
.quick-icon.institution { background: linear-gradient(135deg, #07c160, #51cf66); }
.quick-icon.purifier { background: linear-gradient(135deg, #00d4aa, #38d9a9); }

.quick-text {
  font-size: 12px;
  color: #323233;
  text-align: center;
  line-height: 1.2;
}

/* 分支机构专区 */
.branch-workspace-card {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.workspace-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.workspace-item:hover {
  background-color: #f7f8fa;
}

.workspace-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #fff;
}

.workspace-icon.products { background: linear-gradient(135deg, #667eea, #764ba2); }
.workspace-icon.events { background: linear-gradient(135deg, #f093fb, #f5576c); }
.workspace-icon.members { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.workspace-icon.revenue { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.workspace-text {
  font-size: 12px;
  color: #323233;
  text-align: center;
}

/* 常用功能 */
.menu-section {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.menu-list {
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f7f8fa;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f7f8fa;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.menu-icon.money { background: linear-gradient(135deg, #ffd700, #ffed4e); }
.menu-icon.orders { background: linear-gradient(135deg, #ff6b6b, #ffa8a8); }
.menu-icon.address { background: linear-gradient(135deg, #4ecdc4, #7fdbda); }
.menu-icon.device { background: linear-gradient(135deg, #a8e6cf, #88d8c0); }
.menu-icon.feedback { background: linear-gradient(135deg, #ffd93d, #ffb74d); }
.menu-icon.help { background: linear-gradient(135deg, #74b9ff, #a29bfe); }

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 2px;
}

.menu-desc {
  font-size: 12px;
  color: #969799;
}

.menu-arrow {
  color: #c8c9cc;
}

.logout-btn {
  margin: 16px;
  padding: 12px 0;
  text-align: center;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: #ff7875;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .user-profile {
    padding: 16px 12px 0;
  }
  
  .user-name {
    font-size: 18px;
  }
  
  .assets-content {
    gap: 8px;
  }
  
  .quick-functions {
    padding: 16px 12px;
  }
  
  .workspace-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  
  .menu-item {
    padding: 12px;
  }
}
</style> 