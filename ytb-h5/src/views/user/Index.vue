<template>
  <div class="user-container">
    <!-- 个人信息完善提醒 -->
    <ProfileCompletionReminder />

    <!-- 头部背景和用户信息 -->
    <div class="user-header">
      <div class="header-bg"></div>
      
      <div class="user-profile">
        <div class="avatar-container">
          <template v-if="(userInfo.userId || userStore.isSimulateMode) && (
            userStore.isSimulateMode 
              ? (userStore.userInfo.wechat_avatar || userStore.userInfo.avatar)
              : (userInfo.wechat_avatar || userInfo.avatar)
          )">
            <VanImage
              round
              width="76"
              height="76"
              :src="userStore.isSimulateMode 
                ? (userStore.userInfo.wechat_avatar || userStore.userInfo.avatar)
                : (userInfo.wechat_avatar || userInfo.avatar)"
              :error-content="'头像'"
              class="user-avatar"
              @load="() => console.log('头像加载成功')"
              @error="handleAvatarError"
            />
          </template>
          <div v-else class="avatar-fallback">头像</div>
          <div class="vip-badge" v-if="hasRole('is_vip')">VIP</div>
        </div>
        
        <div class="user-info-content">
          <div v-if="userInfo.userId || userStore.isSimulateMode" class="user-name-row">
            <span class="user-name">{{ 
              userStore.isSimulateMode 
                ? (userStore.userInfo.name || userStore.userInfo.wechat_nickname || userStore.userInfo.nickname || '用户' + userStore.userInfo.userId)
                : (userInfo.name || userInfo.wechat_nickname || userInfo.nickname || '用户' + userInfo.userId)
            }}</span>
            <div class="user-id">ID: {{ userStore.isSimulateMode ? userStore.userInfo.userId : userInfo.userId }}</div>
          </div>
          <div v-else class="login-btn" @click="handleLogin">点击登录/注册</div>
          
          <!-- 用户角色标签 - 优化显示方式 -->
          <div class="role-tags" v-if="userInfo.userId || userStore.isSimulateMode">
            <div class="role-chips">
              <!-- 每种角色显示不同颜色的图标 -->
              <span 
                v-for="(role, index) in userInfo.roles" 
                :key="index" 
                class="role-dot" 
                :class="getRoleClass(role)"
                :title="role"
              >
                <van-icon :name="getRoleIcon(role)" />
              </span>
            </div>
          </div>
        </div>
        
        <div class="settings-btn" @click="$router.push('/user/settings')">
          <van-icon name="setting-o" size="22" />
        </div>
      </div>
      
      <!-- 资产卡片 -->
      <div class="assets-card">
        <div class="asset-item" @click="$router.push('/user/wallet')">
          <div class="asset-value">{{ userAssets.balance }}</div>
          <div class="asset-label">钱包余额</div>
        </div>
        <div class="asset-item" @click="$router.push('/user/points')">
          <div class="asset-value">{{ userAssets.points }}</div>
          <div class="asset-label">我的积分</div>
        </div>
        <div class="asset-item" @click="$router.push('/user/coupons')">
          <div class="asset-value">{{ userAssets.coupons }}</div>
          <div class="asset-label">优惠券</div>
        </div>
      </div>
    </div>
    
    <!-- 我的工作台卡片 -->
    <div class="section workspace-card" v-if="userInfo.userId || userStore.isSimulateMode">
      <div class="section-header">
        <span class="section-title">我的工作台</span>
        <div class="view-all">
          <span>快捷入口</span>
        </div>
      </div>
      
      <div class="workspace-quick-grid">
        <!-- 社区论坛入口 - 所有用户可见 -->
        <div class="quick-item" v-if="showForumEntry" @click="$router.push('/forum')">
          <div class="quick-icon community">
            <van-icon name="chat-o" size="24" />
          </div>
          <div class="quick-text">社区论坛</div>
        </div>

        <!-- 茶农助手入口 - 添加到所有用户可见 -->
        <div class="quick-item" @click="$router.push('/tea-farmer')">
          <div class="quick-icon tea-farmer">
            <van-icon name="todo-list-o" class="icon-todo" size="24" />
          </div>
          <div class="quick-text">茶农助手</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_pay_institution')" @click="$router.push('/institution')">
          <div class="quick-icon institution">
            <van-icon name="balance-o" size="24" />
          </div>
          <div class="quick-text">支付机构</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_water_purifier_user')" @click="$router.push('/purifier')">
          <div class="quick-icon purifier">
            <van-icon name="filter-o" size="24" />
          </div>
          <div class="quick-text">净水管理</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_engineer')" @click="handleEngineerClick">
          <div class="quick-icon engineer">
            <van-icon name="service-o" size="24" />
          </div>
          <div class="quick-text">工程师</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_water_purifier_agent')" @click="$router.push('/agent')">
          <div class="quick-icon agent">
            <van-icon name="friends-o" size="24" />
          </div>
          <div class="quick-text">渠道管理</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_pay_merchant')" @click="$router.push('/merchant')">
          <div class="quick-icon merchant">
            <van-icon name="shop-o" size="24" />
          </div>
          <div class="quick-text">商户管理</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_vip')" @click="$router.push('/vip')">
          <div class="quick-icon vip">
            <van-icon name="gem-o" size="24" />
          </div>
          <div class="quick-text">VIP中心</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_salesman')" @click="$router.push('/salesman')">
          <div class="quick-icon salesman">
            <van-icon name="manager-o" size="24" />
          </div>
          <div class="quick-text">业务中心</div>
        </div>

        <div class="quick-item" v-if="hasRole('is_admin')" @click="$router.push('/admin')">
          <div class="quick-icon admin">
            <van-icon name="setting-o" size="24" />
          </div>
          <div class="quick-text">管理员</div>
        </div>
      </div>
    </div>
    
    <!-- 订单导航 -->
    <div class="section order-section" v-if="false">
      <div class="section-header">
        <span class="section-title">我的订单</span>
        <div class="view-all" @click="$router.push('/user/orders')">
          <span>全部订单</span>
          <van-icon name="arrow" />
        </div>
      </div>
      
      <div class="order-nav">
        <div class="order-nav-item" @click="$router.push('/user/orders?status=unpaid')">
          <div class="nav-icon-wrap">
            <van-icon name="balance-pay" size="28" />
            <div class="order-badge" v-if="orderStats.unpaid > 0">{{ orderStats.unpaid }}</div>
          </div>
          <div class="nav-text">待付款</div>
        </div>
        <div class="order-nav-item" @click="$router.push('/user/orders?status=unshipped')">
          <div class="nav-icon-wrap">
            <van-icon name="shop-o" size="28" />
            <div class="order-badge" v-if="orderStats.unshipped > 0">{{ orderStats.unshipped }}</div>
          </div>
          <div class="nav-text">待发货</div>
        </div>
        <div class="order-nav-item" @click="$router.push('/user/orders?status=shipped')">
          <div class="nav-icon-wrap">
            <van-icon name="logistics" size="28" />
            <div class="order-badge" v-if="orderStats.shipped > 0">{{ orderStats.shipped }}</div>
          </div>
          <div class="nav-text">待收货</div>
        </div>
        <div class="order-nav-item" @click="$router.push('/user/orders?status=completed')">
          <div class="nav-icon-wrap">
            <van-icon name="comment-o" size="28" />
            <div class="order-badge" v-if="orderStats.completed > 0">{{ orderStats.completed }}</div>
          </div>
          <div class="nav-text">待评价</div>
        </div>
        <div class="order-nav-item" @click="$router.push('/user/orders?status=after-sale')">
          <div class="nav-icon-wrap">
            <van-icon name="service-o" size="28" />
            <div class="order-badge" v-if="orderStats.afterSale > 0">{{ orderStats.afterSale }}</div>
          </div>
          <div class="nav-text">售后</div>
        </div>
      </div>
    </div>
    
    <!-- 常用功能 -->
    <div class="section menu-section" v-if="false">
      <div class="section-header">
        <span class="section-title">常用功能</span>
      </div>
      
      <div class="menu-list">
        <div class="menu-item" @click="$router.push('/user/wallet')">
          <div class="menu-icon money">
            <van-icon name="gold-coin-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">我的钱包</div>
            <div class="menu-desc">查看余额和交易记录</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/user/address')">
          <div class="menu-icon address">
            <van-icon name="location-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">收货地址</div>
            <div class="menu-desc">管理您的收货地址</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/purifier/devices')">
          <div class="menu-icon device">
            <van-icon name="apps-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">我的设备</div>
            <div class="menu-desc">管理已绑定的设备</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/water-point')">
          <div class="menu-icon water">
            <van-icon name="cluster-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">取水点</div>
            <div class="menu-desc">查找附近取水点</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/user/feedback')">
          <div class="menu-icon feedback">
            <van-icon name="comment-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">用户反馈</div>
            <div class="menu-desc">提交意见和建议</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/user/help')">
          <div class="menu-icon help">
            <van-icon name="question-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">帮助中心</div>
            <div class="menu-desc">常见问题解答</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        
        <div class="menu-item" @click="$router.push('/user/settings')">
          <div class="menu-icon settings">
            <van-icon name="setting-o" />
          </div>
          <div class="menu-content">
            <div class="menu-title">设置</div>
            <div class="menu-desc">账号安全与偏好设置</div>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
      </div>
      
      <!-- 退出登录 -->
      <div class="logout-btn" v-if="userInfo.userId" @click="handleLogout">
        退出登录
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Toast, Image as VanImage, Icon, Dialog } from 'vant'
import { getUserInfo, getUserAssets, getOrderStats, syncUserRoles } from '@/api/user'
import { getUserAssetsV1, getOrderStatsV1 } from '@/api/v1/auth'
import { getUserPoints } from '@/api/userPoints'
import { getInstitutionWorkspace } from '@/api/institution'
import { setShareMetadata } from '@/utils/share'
import { useUserStore } from '@/stores/user'
import ProfileCompletionReminder from '@/components/ProfileCompletionReminder.vue'

const router = useRouter()
const loading = ref(false)
const userStore = useUserStore()

// 用户信息 - 在模拟登录模式下使用用户store，否则使用本地状态
const localUserInfo = ref({
  id: '',
  userId: '',
  nickname: '',
  wechat_nickname: '',
  avatar: '',
  wechat_avatar: '',
  phone: '',
  email: '',
  gender: '',
  is_pay_institution: 0,
  is_water_purifier_user: 0,
  is_engineer: 0,
  is_water_purifier_agent: 0,
  is_pay_merchant: 0,
  is_vip: 0,
  is_salesman: 0,
  is_admin: 0,
  roles: [],
  name: ''
})

const userInfo = computed(() => {
  // 如果是模拟登录模式，使用用户store中的信息
  if (userStore.isSimulateMode) {
    console.log('计算属性：使用模拟登录用户信息', userStore.userInfo)
    return userStore.userInfo
  }
  // 否则使用本地状态
  console.log('计算属性：使用本地用户信息', localUserInfo.value)
  return localUserInfo.value
})

const PHONE_PROMPT_COOLDOWN = 60 * 1000
const phonePrompting = ref(false)
const lastPhonePromptAt = ref(Number(localStorage.getItem('phonePromptAt') || 0))
const ROLE_SYNC_COOLDOWN = 5 * 60 * 1000
const roleSyncing = ref(false)
const lastRoleSyncPhone = ref(localStorage.getItem('roleSyncPhone') || '')
const lastRoleSyncAt = ref(Number(localStorage.getItem('roleSyncAt') || 0))
let cachedWorkspace = null
try {
  cachedWorkspace = JSON.parse(localStorage.getItem('institutionWorkspace') || 'null')
} catch (error) {
  cachedWorkspace = null
}
const institutionWorkspace = ref(cachedWorkspace)

const shouldPromptBindPhone = computed(() => {
  if (!userStore.isLoggedIn) {
    return false
  }

  const currentRoute = router.currentRoute.value
  if (currentRoute && currentRoute.path === '/bind-phone') {
    return false
  }

  const info = userStore.isSimulateMode ? userStore.userInfo : localUserInfo.value
  if (!info) {
    return false
  }

  let wechatInfo = {}
  try {
    wechatInfo = JSON.parse(localStorage.getItem('wechat_info') || '{}')
  } catch (error) {
    wechatInfo = {}
  }
  const isBranchUser = Boolean(wechatInfo.branch_id || info.branch_id)
  if (isBranchUser) {
    return false
  }

  return !(info.phone && String(info.phone).trim().length > 0)
})

const triggerBindPhonePrompt = async () => {
  const now = Date.now()
  if (phonePrompting.value) {
    return
  }
  if (now - lastPhonePromptAt.value < PHONE_PROMPT_COOLDOWN) {
    return
  }

  phonePrompting.value = true
  localStorage.setItem('needBindPhone', 'true')

  try {
    await Dialog.confirm({
      title: '绑定手机号',
      message: '为保障账户安全并完成角色匹配，请先绑定手机号码。',
      confirmButtonText: '去绑定',
      cancelButtonText: '稍后',
      confirmButtonColor: '#ff4d55',
      cancelButtonColor: '#8a8a8a'
    })
    router.push({
      path: '/bind-phone',
      query: {
        redirect: router.currentRoute.value?.fullPath || '/user'
      }
    })
  } catch (error) {
    // 用户选择稍后处理时保留needBindPhone标记
  } finally {
    lastPhonePromptAt.value = now
    localStorage.setItem('phonePromptAt', String(now))
    phonePrompting.value = false
  }
}

const ensureBindPhonePrompt = () => {
  if (shouldPromptBindPhone.value) {
    triggerBindPhonePrompt()
  }
}

// watchers and lifecycle hooks moved below after helper declarations

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.log('头像加载失败，显示默认头像内容')
  // 不再设置src，避免循环加载
}

// 计算是否有角色
const hasRoles = computed(() => {
  return (
    userInfo.value.is_pay_institution === 1 ||
    userInfo.value.is_water_purifier_user === 1 ||
    userInfo.value.is_engineer === 1 ||
    userInfo.value.is_water_purifier_agent === 1 ||
    userInfo.value.is_pay_merchant === 1 ||
    userInfo.value.is_vip === 1 ||
    userInfo.value.is_salesman === 1 ||
    userInfo.value.is_admin === 1
  )
})

const showForumEntry = false

// 判断是否拥有特定角色
const hasRole = (role) => {
  // 如果用户未登录，直接返回false
  if (!userInfo.value || !userInfo.value.userId) {
    return false
  }

  // 优先从localStorage获取最新的用户信息，确保角色判断的准确性
  let roleValue = userInfo.value[role]
  
  // 如果当前userInfo中的角色值不存在或为0，尝试从localStorage获取
  if (!roleValue || roleValue === 0 || roleValue === '0') {
    try {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (storedUserInfo && storedUserInfo[role]) {
        roleValue = storedUserInfo[role]
      }
    } catch (e) {
      // 忽略解析错误，使用当前值
    }
  }

  // 根据角色标记判断
  let result = false
  switch (role) {
    case 'is_pay_institution':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_water_purifier_user':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_engineer':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_water_purifier_agent':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_pay_merchant':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_vip':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_salesman':
      result = roleValue === 1 || roleValue === '1'
      break
    case 'is_admin':
      result = roleValue === 1 || roleValue === '1'
      break
    default:
      result = false
  }

  // 调试信息 - 仅在用户ID为78时输出
  if (userInfo.value.userId === 78 || userInfo.value.userId === '78') {
    console.log(`角色检测 [${role}]: ${result}, 当前值: ${userInfo.value[role]}, localStorage值: ${roleValue}, 用户ID: ${userInfo.value.userId}`)
  }

  return result
}

// 获取角色标签的样式类
const getRoleClass = (role) => {
  switch (role) {
    case '支付机构':
      return 'tag-institution'
    case '净水器用户':
      return 'tag-purifier'
    case '工程师':
      return 'tag-engineer'
    case '净水器渠道商':
      return 'tag-agent'
    case '支付商户':
      return 'tag-merchant'
    case 'VIP会员':
      return 'tag-vip'
    case '业务员':
      return 'tag-salesman'
    case '管理员':
      return 'tag-admin'
    default:
      return 'tag-normal'
  }
}

// 获取角色图标
const getRoleIcon = (role) => {
  switch (role) {
    case '支付机构':
      return 'balance-o'
    case '净水器用户':
      return 'filter-o'
    case '工程师':
      return 'bulb-o'
    case '净水器渠道商':
      return 'friends-o'
    case '支付商户':
      return 'shop-o'
    case 'VIP会员':
      return 'gem-o'
    case '业务员':
      return 'manager-o'
    case '管理员':
      return 'setting-o'
    default:
      return 'contact'
  }
}

// 用户资产
const userAssets = ref({
  balance: '0.00',
  points: '0',
  coupons: '0'
})

// 订单统计
const orderStats = ref({
  unpaid: 0,
  unshipped: 0,
  shipped: 0,
  completed: 0,
  afterSale: 0
})

// 强制设置VIP状态的函数
const forceVipStatus = () => {
  // 在模拟登录模式下，VIP状态由用户store管理
  if (userStore.isSimulateMode) {
    console.log('模拟登录模式下，VIP状态由用户store管理')
    return
  }
  
  const vipBackup = localStorage.getItem('is_vip_backup')
  console.log('页面直接检查VIP备份标记:', vipBackup)
  
  if (vipBackup === '1') {
    console.log('forceVipStatus: 发现VIP备份标记为1，直接覆盖localUserInfo中的VIP状态')
    // 直接修改响应式对象
    if (localUserInfo.value) {
      localUserInfo.value.is_vip = 1
      
      // 确保角色数组中包含VIP会员
      if (!localUserInfo.value.roles) {
        localUserInfo.value.roles = []
      }
      
      if (!localUserInfo.value.roles.includes('VIP会员')) {
        localUserInfo.value.roles.push('VIP会员')
      }
      
      console.log('forceVipStatus: 已强制设置VIP状态，当前localUserInfo:', localUserInfo.value)
    }
  }
}

// 获取用户手机号
const getUserPhone = () => {
  // 尝试多种方式获取用户手机号
  const userPhone = localStorage.getItem('user_phone') || 
                   localStorage.getItem('userPhone') || 
                   JSON.parse(localStorage.getItem('userInfo') || '{}').phone ||
                   localUserInfo.value.phone
  return userPhone
}

// 获取用户积分信息
const fetchUserPointsInfo = async () => {
  // 暂时禁用积分信息获取，因为积分兑换链路还未开发完成
  return
  /*
  try {
    const phone = getUserPhone()
    if (!phone) {
      console.warn('未找到用户手机号，跳过积分信息获取')
      return
    }

    const res = await getUserPoints()
    if (res.code === 0 && res.data) {
      const pointsData = res.data.points
      
      // 更新积分显示
      userAssets.value = {
        ...userAssets.value,
        points: pointsData.available_points || '0'
      }
      
      console.log('用户积分信息已更新:', pointsData.available_points)
    }
  } catch (error) {
    console.error('获取用户积分信息失败:', error)
    // 静默处理错误，不影响其他功能
  }
  */
}

// 获取用户数据
const fetchUserData = async () => {
  loading.value = true
  
  try {
    // 检查是否已登录或处于模拟登录模式
    const token = localStorage.getItem('token')
    const simulateMode = sessionStorage.getItem('simulate_mode')
    const simulateToken = sessionStorage.getItem('simulate_token')
    
    if (!token && !(simulateMode === 'true' && simulateToken)) {
      console.log('未检测到token，显示未登录状态')
      loading.value = false
      
      // 不直接跳转，而是显示未登录状态，让用户可以看到个人中心页面并选择登录
      // 清空用户信息，显示登录按钮
      localUserInfo.value = {
        id: '',
        userId: '',
        nickname: '',
        wechat_nickname: '',
        avatar: '',
        wechat_avatar: '',
        phone: '',
        email: '',
        gender: '',
        is_pay_institution: 0,
        is_water_purifier_user: 0,
        is_engineer: 0,
        is_water_purifier_agent: 0,
        is_pay_merchant: 0,
        is_vip: 0,
        is_salesman: 0,
        is_admin: 0,
        roles: [],
        name: ''
      }
      return
    }
    
    // 如果是模拟登录模式，确保用户store已经设置了模拟用户信息
    if (simulateMode === 'true' && simulateToken) {
      console.log('检测到模拟登录模式，检查用户store状态')
      
      // 如果用户store还没有设置模拟模式，则设置它
      if (!userStore.isSimulateMode) {
        console.log('用户store未设置模拟模式，正在设置...')
        try {
          const simulateUserInfo = JSON.parse(sessionStorage.getItem('simulate_user_info') || '{}')
          if (simulateUserInfo && (simulateUserInfo.id || simulateUserInfo.userId)) {
            userStore.setSimulateMode(simulateToken, simulateUserInfo)
            console.log('已设置用户store模拟模式')
          }
        } catch (error) {
          console.error('设置用户store模拟模式失败:', error)
        }
      }
      
      // 处理角色信息
      processRoles()
      
      console.log('模拟登录模式处理完成，用户信息:', userStore.userInfo.name || userStore.userInfo.phone)
      loading.value = false
      return
    }
    
    console.log('开始请求用户数据')
    
    // 先尝试从localStorage获取用户信息进行显示
    try {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (storedUserInfo && (storedUserInfo.id || storedUserInfo.userId)) {
        console.log('从localStorage加载用户信息')
        
        // 检查VIP备份标记
        const vipBackup = localStorage.getItem('is_vip_backup')
        console.log('检查到VIP备份标记:', vipBackup)
        
        if (vipBackup === '1') {
          console.log('发现VIP备份标记为1，强制设置用户为VIP状态')
          storedUserInfo.is_vip = 1
          
          // 确保角色数组中包含VIP会员
          if (!storedUserInfo.roles) {
            storedUserInfo.roles = []
          }
          
          if (!storedUserInfo.roles.includes('VIP会员')) {
            storedUserInfo.roles.push('VIP会员')
            console.log('已添加VIP会员角色到备份的用户角色列表中')
          }
        }
        
        // 确保id和userId字段一致
        if (storedUserInfo.id && !storedUserInfo.userId) {
          storedUserInfo.userId = storedUserInfo.id
        } else if (storedUserInfo.userId && !storedUserInfo.id) {
          storedUserInfo.id = storedUserInfo.userId
        }
        
        // 预先填充一些基本信息，以便在API请求前显示
        applyUserInfoUpdate(storedUserInfo)
      }
    } catch (e) {
      console.error('解析localStorage用户信息失败:', e)
    }
    
    // 请求用户信息API
    try {
      const userInfoRes = await getUserInfo()
      
      if (userInfoRes.code === 0 && userInfoRes.data) {
        // 用户信息获取成功，处理数据
        const userData = { ...userInfoRes.data }
        console.log('🔍 成功获取用户信息，详细数据:', {
          id: userData.id,
          userId: userData.userId,
          name: userData.name,
          nickname: userData.nickname,
          phone: userData.phone,
          email: userData.email,
          open_id: userData.open_id,
          wechat_openid: userData.wechat_openid,
          wechat_nickname: userData.wechat_nickname,
          is_vip: userData.is_vip,
          is_salesman: userData.is_salesman,
          is_admin: userData.is_admin
        })
        
        console.log('📱 H5端微信登录匹配信息:', {
          current_user_id: userData.id,
          openid_used: userData.open_id || userData.wechat_openid,
          login_method: 'WeChat H5 OpenID Match'
        })
        
        // 完全依赖服务器返回的用户数据，移除本地硬编码逻辑
        console.log('使用服务器返回的用户数据，VIP状态:', userData.is_vip)
        
        // 确保id和userId字段一致
        if (userData.id && !userData.userId) {
          userData.userId = userData.id
        } else if (userData.userId && !userData.id) {
          userData.id = userData.userId
        }
        
        // 确保微信头像URL是可访问的
        let wechatAvatar = userData.wechat_avatar || ''
        if (wechatAvatar && !wechatAvatar.startsWith('http')) {
          wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
        }
        
        // 更新用户信息
        applyUserInfoUpdate({
          ...userData,
          wechat_avatar: wechatAvatar
        })
        await ensureInstitutionRoleSync()
        
        // 获取资产和订单数据
        try {
          const [userAssetsRes, orderStatsRes] = await Promise.all([
            getUserAssetsV1().catch(() => getUserAssets()), // 优先使用V1 API，失败后降级
            getOrderStatsV1().catch(() => getOrderStats()) // 优先使用V1 API，失败后降级
          ])
          
          if (userAssetsRes.code === 0) {
            const balanceValue = userAssetsRes.data?.balance ?? '0.00'
            const pointsDetail = userAssetsRes.data?.points_detail || {}
            const pointsValue = pointsDetail.available_points ?? userAssetsRes.data?.points ?? 0

            userAssets.value = {
              balance: Number(balanceValue).toFixed(2),
              points: Number(pointsValue).toFixed(2),
              coupons: userAssetsRes.data?.coupons || userAssetsRes.data?.coupon_count || '0'
            }
            console.log('💰 用户资产更新成功:', userAssets.value, pointsDetail)
          }
          
          if (orderStatsRes.code === 0) {
            orderStats.value = orderStatsRes.data || {
              unpaid: 0,
              unshipped: 0,
              shipped: 0,
              completed: 0,
              afterSale: 0
            }
          }
          
          // 尝试获取新的积分系统数据
          await fetchUserPointsInfo()
          
        } catch (e) {
          console.error('获取用户资产或订单统计失败:', e)
        }
      } else if (userInfoRes.code === 1001 || userInfoRes.code === 1002) {
        // 认证失败（token无效或过期）
        console.error('用户认证失败，code:', userInfoRes.code, '，message:', userInfoRes.message)
        
        // 清除token但不直接跳转，显示未登录状态
        localStorage.removeItem('token')
        
        // 清空用户信息，显示登录按钮
        localUserInfo.value = {
          id: '',
          userId: '',
          nickname: '',
          wechat_nickname: '',
          avatar: '',
          wechat_avatar: '',
          phone: '',
          email: '',
          gender: '',
          is_pay_institution: 0,
          is_water_purifier_user: 0,
          is_engineer: 0,
          is_water_purifier_agent: 0,
          is_pay_merchant: 0,
          is_vip: 0,
          is_salesman: 0,
          is_admin: 0,
          roles: [],
          name: ''
        }
        
        // 显示提示信息但不强制跳转
        Toast({ type: 'fail', message: '登录已失效，请重新登录' })
      } else {
        console.error('获取用户信息API返回错误:', userInfoRes.message || '未知错误')
        
        // API错误时也显示未登录状态，而不是空白页面
        localUserInfo.value = {
          id: '',
          userId: '',
          nickname: '',
          wechat_nickname: '',
          avatar: '',
          wechat_avatar: '',
          phone: '',
          email: '',
          gender: '',
          is_pay_institution: 0,
          is_water_purifier_user: 0,
          is_engineer: 0,
          is_water_purifier_agent: 0,
          is_pay_merchant: 0,
          is_vip: 0,
          is_salesman: 0,
          is_admin: 0,
          roles: [],
          name: ''
        }
      }
    } catch (error) {
      console.error('请求用户信息API失败:', error)
    }
  } catch (error) {
    console.error('获取用户数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理用户角色信息
function processRoles() {
  // 在模拟登录模式下，角色信息已经在用户store中正确设置，无需额外处理
  if (userStore.isSimulateMode) {
    console.log('模拟登录模式下，角色信息已正确设置')
    return
  }
  
  // 防止userInfo为空
  if (!localUserInfo.value) {
    console.error('processRoles: localUserInfo is undefined');
    return;
  }

  console.log('开始处理用户角色信息:', JSON.stringify(localUserInfo.value));
  console.log('VIP状态详细信息:');
  console.log('- is_vip值:', localUserInfo.value.is_vip);
  console.log('- is_vip类型:', typeof localUserInfo.value.is_vip);
  console.log('- 来自localStorage的userInfo:', localStorage.getItem('userInfo'));
  console.log('- VIP备份标记:', localStorage.getItem('is_vip_backup'));

  // 重置角色数组，确保每次都重新生成
  localUserInfo.value.roles = [];
  
  // 根据用户权限添加角色
  if (localUserInfo.value.is_pay_institution == 1) {
    localUserInfo.value.roles.push('支付机构');
  }
  
  if (localUserInfo.value.is_water_purifier_user == 1) {
    localUserInfo.value.roles.push('净水器用户');
  }
  
  if (localUserInfo.value.is_engineer == 1) {
    localUserInfo.value.roles.push('工程师');
  }
  
  if (localUserInfo.value.is_water_purifier_agent == 1) {
    localUserInfo.value.roles.push('净水器渠道商');
  }
  
  if (localUserInfo.value.is_pay_merchant == 1) {
    localUserInfo.value.roles.push('支付商户');
  }
  
  if (localUserInfo.value.is_vip == 1) {
    localUserInfo.value.roles.push('VIP会员');
  }
  
  if (localUserInfo.value.is_salesman == 1) {
    localUserInfo.value.roles.push('业务员');
  }
  
  if (localUserInfo.value.is_admin == 1) {
    localUserInfo.value.roles.push('管理员');
  }
  
  // 检查VIP备份标记并确保VIP角色存在
  const vipBackup = localStorage.getItem('is_vip_backup');
  if (vipBackup === '1') {
    console.log('发现VIP备份标记为1，确保userInfo.is_vip=1');
    // 更新用户对象
    localUserInfo.value.is_vip = 1;
    
    // 确保角色数组中包含VIP会员
    if (!localUserInfo.value.roles.includes('VIP会员')) {
      localUserInfo.value.roles.push('VIP会员');
      console.log('已添加VIP会员到用户角色列表:', localUserInfo.value.roles);
    }
  }

  console.log('角色处理完成，最终用户角色:', localUserInfo.value.roles);
  
  // 更新localStorage中的用户信息
  localStorage.setItem('userInfo', JSON.stringify(localUserInfo.value));
}

const normalizeUserPayload = (payload = {}) => {
  if (!payload) return null
  const base = { ...localUserInfo.value }
  let wechatAvatar = payload.wechat_avatar ?? base.wechat_avatar ?? ''
  if (wechatAvatar && typeof wechatAvatar === 'string' && !wechatAvatar.startsWith('http')) {
    wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
  }
  const id = payload.id || payload.userId || base.userId || ''
  const normalizeRoleFlag = (value, fallback = 0) => {
    if (value === undefined || value === null) return fallback
    return parseInt(value, 10) === 1 ? 1 : 0
  }

  return {
    ...base,
    ...payload,
    id,
    userId: id,
    nickname: payload.nickname || payload.wechat_nickname || payload.name || base.nickname || '用户',
    wechat_nickname: payload.wechat_nickname ?? base.wechat_nickname ?? '',
    avatar: payload.avatar || base.avatar || '',
    wechat_avatar: wechatAvatar,
    phone: payload.phone ?? base.phone ?? '',
    email: payload.email ?? base.email ?? '',
    name: payload.name ?? base.name ?? '',
    is_pay_institution: normalizeRoleFlag(payload.is_pay_institution, base.is_pay_institution || 0),
    is_water_purifier_user: normalizeRoleFlag(payload.is_water_purifier_user, base.is_water_purifier_user || 0),
    is_engineer: normalizeRoleFlag(payload.is_engineer, base.is_engineer || 0),
    is_water_purifier_agent: normalizeRoleFlag(payload.is_water_purifier_agent, base.is_water_purifier_agent || 0),
    is_pay_merchant: normalizeRoleFlag(payload.is_pay_merchant, base.is_pay_merchant || 0),
    is_vip: normalizeRoleFlag(payload.is_vip, base.is_vip || 0),
    is_salesman: normalizeRoleFlag(payload.is_salesman, base.is_salesman || 0),
    is_admin: normalizeRoleFlag(payload.is_admin, base.is_admin || 0),
    roles: payload.roles || base.roles || []
  }
}

const applyUserInfoUpdate = (payload = {}) => {
  const normalized = normalizeUserPayload(payload)
  if (!normalized) return
  localUserInfo.value = normalized
  localStorage.setItem('userInfo', JSON.stringify(normalized))
  processRoles()
}

const fetchInstitutionWorkspaceData = async () => {
  if (localUserInfo.value.is_pay_institution !== 1) {
    return
  }
  if (institutionWorkspace.value && Object.keys(institutionWorkspace.value || {}).length > 0) {
    return
  }
  try {
    const response = await getInstitutionWorkspace()
    if (response?.code === 0) {
      institutionWorkspace.value = response.data || {}
      localStorage.setItem('institutionWorkspace', JSON.stringify(institutionWorkspace.value))
      console.log('支付机构工作台数据已更新')
    }
  } catch (error) {
    console.error('获取支付机构工作台数据失败:', error)
  }
}

const ensureInstitutionRoleSync = async () => {
  const phone = (userInfo.value?.phone || '').trim()
  if (!phone) {
    return
  }
  if (roleSyncing.value) {
    return
  }
  const now = Date.now()
  const recentlySynced = phone === lastRoleSyncPhone.value && (now - lastRoleSyncAt.value) < ROLE_SYNC_COOLDOWN
  if (recentlySynced) {
    if (localUserInfo.value.is_pay_institution === 1 && !institutionWorkspace.value) {
      await fetchInstitutionWorkspaceData()
    }
    return
  }

  roleSyncing.value = true
  try {
    const res = await syncUserRoles()
    if (res?.code === 0) {
      const updatedUser = res.data?.user
      if (updatedUser) {
        applyUserInfoUpdate(updatedUser)
      }
      if ((updatedUser?.is_pay_institution ?? localUserInfo.value.is_pay_institution) === 1) {
        await fetchInstitutionWorkspaceData()
      }
      lastRoleSyncPhone.value = phone
      lastRoleSyncAt.value = now
      localStorage.setItem('roleSyncPhone', phone)
      localStorage.setItem('roleSyncAt', String(now))
    }
  } catch (error) {
    console.error('同步支付机构角色失败:', error)
  } finally {
    roleSyncing.value = false
  }
}

watch(
  shouldPromptBindPhone,
  (shouldPrompt) => {
    if (shouldPrompt) {
      triggerBindPhonePrompt()
    } else {
      localStorage.removeItem('needBindPhone')
    }
  },
  { immediate: true }
)

watch(
  () => userInfo.value?.phone,
  (phone) => {
    if (phone) {
      localStorage.removeItem('needBindPhone')
      ensureInstitutionRoleSync()
    }
  },
  { immediate: true }
)

watch(
  () => localUserInfo.value.is_pay_institution,
  (flag) => {
    if (flag === 1) {
      fetchInstitutionWorkspaceData()
    }
  },
  { immediate: true }
)

onMounted(() => {
  ensureBindPhonePrompt()
  ensureInstitutionRoleSync()
})

onActivated(() => {
  ensureBindPhonePrompt()
  ensureInstitutionRoleSync()
})

// 处理登录按钮点击
const handleLogin = () => {
  router.push('/user/login')
}

// 处理工程师入口点击
const handleEngineerClick = async () => {
  console.log('工程师入口被点击')
  
  // 确保用户已登录
  if (!userInfo.value || !userInfo.value.userId) {
    console.log('用户未登录，跳转到登录页面')
    router.push('/user/login')
    return
  }
  
  // 多重验证工程师身份
  const currentUserInfo = userInfo.value
  let storedUserInfo = {}
  
  try {
    storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch (e) {
    console.warn('解析localStorage用户信息失败:', e)
  }
  
  console.log('工程师身份验证详情:', {
    userId: currentUserInfo.userId,
    currentIsEngineer: currentUserInfo.is_engineer,
    storedIsEngineer: storedUserInfo.is_engineer,
    hasRoleResult: hasRole('is_engineer')
  })
  
  // 强制同步用户信息，确保角色数据一致性
  if (storedUserInfo.userId === currentUserInfo.userId) {
    // 更新当前用户信息中的所有角色字段
    const roleFields = ['is_engineer', 'is_vip', 'is_salesman', 'is_admin', 'is_water_purifier_user', 'is_water_purifier_agent', 'is_pay_institution', 'is_pay_merchant']
    
    roleFields.forEach(field => {
      if (storedUserInfo[field] !== undefined) {
        localUserInfo.value[field] = parseInt(storedUserInfo[field] || 0)
      }
    })
    
    // 重新处理角色信息
    processRoles()
    
    console.log('已同步用户角色信息，工程师状态:', localUserInfo.value.is_engineer)
  }
  
  // 等待一个微任务周期，确保响应式数据更新完成
  await new Promise(resolve => setTimeout(resolve, 0))
  
  // 最终验证工程师身份
  const isEngineer = hasRole('is_engineer') || 
                    localUserInfo.value.is_engineer === 1 || 
                    storedUserInfo.is_engineer === 1 || 
                    storedUserInfo.is_engineer === '1'
  
  if (isEngineer) {
    console.log('工程师身份验证通过，跳转到工程师工作台')
    // 使用replace避免在历史记录中留下重复项
    router.replace('/engineer')
  } else {
    console.log('工程师身份验证失败，显示提示信息')
    Toast({ type: 'fail', message: '您没有工程师权限，请联系管理员开通' })
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    // 调用退出登录API
    await logout()
  } catch (error) {
    console.error('退出登录API调用失败:', error)
  }
  
  // 清除所有登录状态
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('login_time')
  localStorage.removeItem('isLoggedIn')
  
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userInfo')
  sessionStorage.removeItem('login_time')
  
  // 清除cookie
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'login_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  
  // 清除全局变量
  delete window.TAPGO_AUTH
  
  // 清除store状态
  userStore.clearAuth()
  
  console.log('🚪 用户已退出登录，所有缓存已清除')
  
  // 跳转到登录页
  router.push('/user/login')
}

// 清除所有缓存数据（调试用）
const clearAllCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  
  // 清除所有cookie
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  })
  
  // 清除全局变量
  delete window.TAPGO_AUTH
  
  // 清除store状态
  userStore.clearAuth()
  
  console.log('🧹 所有缓存数据已清除')
  Toast.success('缓存已清除，请重新登录')
  
  // 跳转到登录页
  router.push('/user/login')
}

// 开发环境下暴露清除缓存方法到全局
if (import.meta.env.DEV || window.location.hostname === 'pay.itapgo.com') {
  window.clearAllCache = clearAllCache
  console.log('💡 调试提示：可在控制台执行 clearAllCache() 清除所有缓存')
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
  userStore.clearUserInfo()
  
  // 清除全局认证变量
  if (window.TAPGO_AUTH) {
    delete window.TAPGO_AUTH
  }
  window.TAPGO_TOKEN = null
  window.TAPGO_USER_INFO = null
  window.TAPGO_LOGIN_TIME = null
  
  // 重置本地状态
  localUserInfo.value = {
    id: '',
    userId: '',
    nickname: '',
    wechat_nickname: '',
    avatar: '',
    wechat_avatar: '',
    phone: '',
    email: '',
    gender: '',
    is_pay_institution: 0,
    is_water_purifier_user: 0,
    is_engineer: 0,
    is_water_purifier_agent: 0,
    is_pay_merchant: 0,
    is_vip: 0,
    is_salesman: 0,
    is_admin: 0,
    roles: [],
    name: ''
  }
  userAssets.value = {
    balance: '0.00',
    points: '0',
    coupons: '0'
  }
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    console.log('用户中心页面加载，检查登录状态...')
    
    // 检查是否从微信登录页面来
    const fromWechatLogin = localStorage.getItem('fromWechatLogin') === 'true' || 
                             document.referrer.includes('WechatCallback');
    
    if (fromWechatLogin) {
      console.log('从微信登录过来，尝试恢复登录状态')
      try {
        const authModule = await import('@/utils/auth')
        const restored = authModule.restoreAuthState()
        if (restored) {
          console.log('✅ 登录状态已恢复')
          // 更新本地用户信息
          const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          if (storedUserInfo && (storedUserInfo.id || storedUserInfo.userId)) {
            localUserInfo.value = {
              ...localUserInfo.value,
              ...storedUserInfo,
              userId: storedUserInfo.id || storedUserInfo.userId || '',
            }
          }
        }
      } catch (e) {
        console.error('恢复登录状态失败:', e)
      }
    }
    
    // 检查是否处于模拟登录模式
    const simulateMode = sessionStorage.getItem('simulate_mode')
    const simulateToken = sessionStorage.getItem('simulate_token')
    
    if (simulateMode === 'true' && simulateToken) {
      console.log('检测到模拟登录模式')
      
      // 确保用户store正确设置模拟模式
      if (!userStore.isSimulateMode) {
        userStore.checkSimulateMode()
      }
      console.log('模拟登录模式下的用户信息:', userStore.userInfo)
      
      // 在模拟登录模式下，强制触发计算属性更新
      setTimeout(() => {
        console.log('强制更新用户信息显示')
        // 触发响应式更新
        userStore.$patch({})
      }, 100)
      
      return
    }
    
    // 立即检查登录状态
    const token = localStorage.getItem('token')
    const userInfoStr = localStorage.getItem('userInfo')
    
    console.log('🔍 检查登录状态:', {
      hasToken: !!token,
      hasUserInfo: !!userInfoStr,
      tokenLength: token ? token.length : 0
    })
    
    if (!token || !userInfoStr) {
      console.log('❌ 未找到登录信息，显示登录按钮')
      loading.value = false
      return
    }
    
    // 解析用户信息
    try {
      const storedUserInfo = JSON.parse(userInfoStr)
      if (!storedUserInfo || !(storedUserInfo.id || storedUserInfo.userId)) {
        console.log('❌ 用户信息无效，显示登录按钮')
        loading.value = false
        return
      }
      
      console.log('✅ 找到有效的登录信息，用户ID:', storedUserInfo.id || storedUserInfo.userId)
      
      // 确保ID字段一致
      if (storedUserInfo.id && !storedUserInfo.userId) {
        storedUserInfo.userId = storedUserInfo.id
      } else if (storedUserInfo.userId && !storedUserInfo.id) {
        storedUserInfo.id = storedUserInfo.userId
      }
      
      // 立即显示用户信息，确保所有角色字段都正确设置
      localUserInfo.value = {
        ...localUserInfo.value,
        ...storedUserInfo,
        userId: storedUserInfo.id || storedUserInfo.userId || '',
        // 确保所有角色字段都是数字类型
        is_pay_institution: parseInt(storedUserInfo.is_pay_institution || 0),
        is_water_purifier_user: parseInt(storedUserInfo.is_water_purifier_user || 0),
        is_engineer: parseInt(storedUserInfo.is_engineer || 0),
        is_water_purifier_agent: parseInt(storedUserInfo.is_water_purifier_agent || 0),
        is_pay_merchant: parseInt(storedUserInfo.is_pay_merchant || 0),
        is_vip: parseInt(storedUserInfo.is_vip || 0),
        is_salesman: parseInt(storedUserInfo.is_salesman || 0),
        is_admin: parseInt(storedUserInfo.is_admin || 0),
      }
      
      // 处理角色信息
      processRoles()
      
      console.log('✅ 用户信息已加载，角色信息:', {
        is_engineer: localUserInfo.value.is_engineer,
        is_vip: localUserInfo.value.is_vip,
        is_salesman: localUserInfo.value.is_salesman,
        roles: localUserInfo.value.roles
      })
      console.log('✅ 开始获取最新数据')
      
    } catch (e) {
      console.error('❌ 解析用户信息失败:', e)
      loading.value = false
      return
    }
    
    // 检查是否从微信登录页面来
    const isFromWechatLogin = localStorage.getItem('fromWechatLogin') === 'true' || 
                             document.referrer.includes('WechatCallback')
    
    if (isFromWechatLogin) {
      // 清除fromWechatLogin标记，避免刷新页面时重复处理
      localStorage.removeItem('fromWechatLogin')
      
      // 从微信登录过来，延迟再请求API数据
      console.log('从微信登录跳转过来，延迟获取API数据')
      setTimeout(() => {
        fetchUserData()
      }, 2000)
      
      return
    }
    
    // 正常获取用户数据
    fetchUserData()
    
    // 配置页面分享（支持分支机构）
    import('@/utils/branch').then(({ getCurrentBranchCode }) => {
      const branchCode = getCurrentBranchCode()
      
      setShareMetadata({
        title: '点点够 - 我的个人中心',
        subtitle: '智能管家，多角色应用平台',
        logo: 'https://pay.itapgo.com/app/images/logo.png',
        url: 'https://pay.itapgo.com/app/#/user',
        branchCode: branchCode
      })
    }).catch(() => {
      // 如果导入失败，使用默认配置
      setShareMetadata({
        title: '点点够 - 我的个人中心',
        subtitle: '智能管家，多角色应用平台',
        logo: 'https://pay.itapgo.com/app/images/logo.png',
        url: 'https://pay.itapgo.com/app/#/user'
      })
    })
    
  } catch (error) {
    // 尝试基本初始化
    try {
      fetchUserData();
    } catch (e) {
      // 静默处理初始化失败
    }
  }
});
</script>>

<style scoped>
.user-container {
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
  background: linear-gradient(135deg, #0088f5, #00b0ff);
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
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.login-btn {
  font-size: 18px;
  color: #fff;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* 用户角色标签 - 优化显示方式 */
.role-tags {
  margin-top: 4px;
}

.role-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 10px;
  color: white;
}

.role-dot :deep(.van-icon) {
  font-size: 10px;
}

/* 角色图标颜色样式 */
.tag-institution {
  background-color: #007aff;
}

.tag-purifier {
  background-color: #5ac8fa;
}

.tag-engineer {
  background-color: #ff9500;
}

.tag-agent {
  background-color: #4cd964;
}

.tag-merchant {
  background-color: #ff2d55;
}

.tag-vip {
  background-color: #ff9500;
  background-image: linear-gradient(45deg, #ff9500, #ffcc00);
}

.tag-salesman {
  background-color: #5856d6;
}

.tag-admin {
  background-color: #ff3b30;
}

.tag-normal {
  background-color: #8e8e93;
}

.settings-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* 资产卡片 */
.assets-card {
  margin: 15px 16px 0;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  padding: 16px 0;
  position: relative;
  z-index: 2;
}

.asset-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.asset-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: #f0f0f0;
}

.asset-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.asset-label {
  font-size: 12px;
  color: #999;
}

/* 通用部分样式 */
.section {
  margin: 16px 16px 0;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-all {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 13px;
}

.view-all .van-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 工作台样式 */
.workspace-card {
  margin-top: 16px;
  margin-bottom: 16px;
}

.workspace-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.quick-item:active {
  transform: scale(0.95);
}

.quick-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 24px;
  color: white;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.quick-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

/* 工作台图标颜色 */
.community {
  background-color: #646cff;
  background-image: linear-gradient(45deg, #8187ff, #4c51ff);
}

.tea-farmer {
  background-color: #10b981;
  background-image: linear-gradient(45deg, #10b981, #059669);
}

.icon-todo {
  color: white !important;
}

.institution {
  background-color: #007aff;
}

.purifier {
  background-color: #5ac8fa;
}

.engineer {
  background-color: #ff9500;
}

.agent {
  background-color: #4cd964;
}

.merchant {
  background-color: #ff2d55;
}

.vip {
  background-color: #ff9500;
  background-image: linear-gradient(45deg, #ff9500, #ffcc00);
}

.salesman {
  background-color: #5856d6;
}

.admin {
  background-color: #ff3b30;
}

/* 菜单列表样式 */
.menu-list {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
}

.menu-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 68px;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #f5f5f5;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
  font-size: 18px;
}

.menu-icon.money { background-color: #ff9500; }
.menu-icon.address { background-color: #0088f5; }
.menu-icon.device { background-color: #00b578; }
.menu-icon.water { background-color: #2eb57d; }
.menu-icon.feedback { background-color: #ff6034; }
.menu-icon.help { background-color: #7232dd; }
.menu-icon.settings { background-color: #323233; }

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.menu-desc {
  font-size: 12px;
  color: #999;
}

.menu-arrow {
  color: #c8c9cc;
  font-size: 14px;
}

/* 退出登录按钮 */
.logout-btn {
  margin: 20px 16px;
  background-color: #fff;
  border: 1px solid #ff4646;
  color: #ff4646;
  font-size: 15px;
  height: 44px;
  line-height: 44px;
  text-align: center;
  border-radius: 22px;
}

/* 订单导航样式 */
.order-nav {
  display: flex;
  justify-content: space-between;
  padding: 16px;
}

.order-nav-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.order-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #ff4646;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
}

.nav-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}
</style>
