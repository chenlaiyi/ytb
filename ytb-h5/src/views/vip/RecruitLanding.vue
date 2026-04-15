<template>
  <div class="recruit-landing-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <van-loading size="24px" vertical>
        {{ loadingText }}
      </van-loading>
    </div>

    <!-- 内容区域 -->
    <div v-else class="content-wrapper">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <van-nav-bar
          :title="pageTitle"
          left-arrow
          @click-left="goBack"
          :z-index="1000"
        />
      </div>

      <!-- 状态指示器 -->
      <div class="status-indicator" v-if="showStatusIndicator">
        <div class="status-dots">
          <span class="dot" :class="{ active: currentStep >= 1 }"></span>
          <span class="dot" :class="{ active: currentStep >= 2 }"></span>
          <span class="dot" :class="{ active: currentStep >= 3 }"></span>
        </div>
      </div>

      <!-- 智能状态卡片 -->
      <transition name="status-card" appear>
        <div v-if="smartStatus.show" class="smart-status-card" :class="smartStatus.type">
          <div class="status-icon">
            <van-icon :name="smartStatus.icon" size="32px" />
          </div>
          <div class="status-content">
            <h3 class="status-title">{{ smartStatus.title }}</h3>
            <p class="status-message">{{ smartStatus.message }}</p>
            <div class="status-actions" v-if="smartStatus.actions.length > 0">
              <van-button
                v-for="action in smartStatus.actions"
                :key="action.key"
                :type="action.type"
                :size="action.size"
                @click="handleStatusAction(action)"
                class="status-action-btn"
              >
                {{ action.text }}
              </van-button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 推荐人信息卡片 - 精致版 -->
      <transition name="slide-up" appear>
        <div class="referrer-card-compact" v-if="displayReferrerInfo.id">
          <div class="referrer-main">
            <div class="referrer-avatar-wrapper">
              <van-image
                round
                width="48"
                height="48"
                :src="displayReferrerInfo.avatar"
                :error-content="'头像'"
                fit="cover"
              />
              <div class="vip-badge-compact">VIP</div>
            </div>
            <div class="referrer-info-compact">
              <div class="referrer-name-compact">{{ displayReferrerInfo.name }}</div>
              <div class="invite-text-compact">{{ getInviteText() }}</div>
            </div>
            <div class="arrow-icon">
              <van-icon name="arrow" color="#999" size="16px" />
            </div>
          </div>
        </div>
      </transition>

      <!-- 精致的VIP信息卡片 -->
      <transition name="fade-in" appear>
        <div v-if="shouldShowVipIntro" class="vip-info-card">
          <div class="vip-header">
            <van-icon name="diamond" color="#ff6b35" size="24px" />
            <span class="vip-title">VIP终身会员</span>
          </div>
          <div class="vip-price">
            <span class="price-symbol">¥</span>
            <span class="price-number">{{ vipPrice.current }}</span>
            <span class="price-label">一次付费，终身享受</span>
          </div>
          <div class="vip-benefits">
            <div class="benefit-item">
              <van-icon name="gold-coin-o" size="16px" color="#52c41a" />
              <span>分红收益</span>
            </div>
            <div class="benefit-item">
              <van-icon name="friends-o" size="16px" color="#52c41a" />
              <span>推荐提成</span>
            </div>
            <div class="benefit-item">
              <van-icon name="service-o" size="16px" color="#52c41a" />
              <span>专属服务</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 主要操作按钮 -->
      <div class="action-section">
        <van-button
          v-if="primaryAction.show"
          :type="primaryAction.type"
          :size="primaryAction.size"
          :disabled="primaryAction.disabled"
          :loading="primaryAction.loading"
          @click="handlePrimaryAction"
          class="primary-action-btn"
          round
          block
        >
          {{ primaryAction.text }}
        </van-button>
        
        <!-- 辅助操作 -->
        <div class="secondary-actions" v-if="secondaryActions.length > 0">
          <van-button
            v-for="action in secondaryActions"
            :key="action.key"
            :type="action.type"
            :size="action.size"
            @click="handleSecondaryAction(action)"
            class="secondary-action-btn"
          >
            {{ action.text }}
          </van-button>
        </div>
      </div>

      <!-- 信任标识 -->
      <div class="trust-indicators">
        <div class="trust-item">
          <van-icon name="shield-o" size="20px" color="#52c41a" />
          <span>安全保障</span>
        </div>
        <div class="trust-item">
          <van-icon name="certificate" size="20px" color="#52c41a" />
          <span>官方认证</span>
        </div>
        <div class="trust-item">
          <van-icon name="clock-o" size="20px" color="#52c41a" />
          <span>即时生效</span>
        </div>
      </div>
    </div>

    <!-- 简化后不需要这些弹窗了 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast, Dialog } from 'vant'

// 优化工具和增强功能
import { vipOptimizer } from '@/utils/vipRecruitOptimizer'
// import { ErrorHandler, createErrorHandler } from '@/utils/errorHandler'
// import { abTestManager, abTestHelper } from '@/utils/abTest'
// import { mobileOptimizer } from '@/utils/mobileOptimizer'
import { useUserStore } from '@/stores/user'

// 创建实例
// const errorHandler = createErrorHandler('VipRecruitLanding')

// 组合式API
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 基础状态
const loading = ref(true)
const loadingText = ref('正在加载...')
const currentStep = ref(1)

// 页面标题
const pageTitle = computed(() => {
  if (smartStatus.show && smartStatus.type === 'vip-already') {
    return 'VIP会员中心'
  }
  return 'VIP会员邀请'
})

// 推荐人信息（邀请链接中的推荐人）
const referrerInfo = reactive({
  id: null,
  name: '',
  avatar: '',
  title: '',
  stats: null
})

// 当前用户的推荐人信息（如果已绑定）
const currentReferrerInfo = reactive({
  id: null,
  name: '',
  avatar: '',
  title: '',
  stats: null
})

// 智能状态管理
const smartStatus = reactive({
  show: false,
  type: '', // vip-already, not-logged-in, self-invite, invalid-referrer
  icon: '',
  title: '',
  message: '',
  actions: []
})

// 招募状态
const recruitStatus = reactive({
  user_status: 'guest',
  bind_status: 'none',
  vip_status: 'none',
  action_needed: 'login',
  button_text: '立即加入VIP',
  button_action: 'upgrade'
})

// 获取推荐人ID
const referrerId = computed(() => {
  return parseInt(route.params.referrerId) || 0
})

// 价格信息
const vipPrice = reactive({
  current: 1888
})

// 主要操作按钮
const primaryAction = reactive({
  show: true,
  type: 'primary',
  size: 'large',
  disabled: false,
  loading: false,
  text: '立即加入VIP'
})

// 辅助操作按钮
const secondaryActions = reactive([])

// 简化后不需要这些弹窗了

// 计算属性
const showStatusIndicator = computed(() => {
  return recruitStatus.user_status !== 'guest'
})

const shouldShowVipIntro = computed(() => {
  return recruitStatus.vip_status !== 'active' && !smartStatus.show
})

// 显示的推荐人信息（根据用户状态决定显示哪个推荐人）
const displayReferrerInfo = computed(() => {
  // 如果用户已经是VIP或已有推荐人，显示当前推荐人信息
  if (recruitStatus.bind_status === 'bound' || recruitStatus.bind_status === 'conflict') {
    return currentReferrerInfo
  }
  // 否则显示邀请链接中的推荐人信息
  return referrerInfo
})

// 监听状态变化并更新按钮显示
watch(() => recruitStatus, (newStatus) => {
  console.log('🔄 更新按钮状态:', newStatus)
  
  // 更新按钮文本
  primaryAction.text = newStatus.button_text || '立即加入VIP'
  
  // 更新按钮类型
  switch (newStatus.button_action) {
    case 'wechat_login':
      primaryAction.type = 'primary'
      primaryAction.show = true
      break
    case 'upgrade_vip':
      primaryAction.type = 'primary'
      primaryAction.show = true
      break
    case 'bind_and_upgrade':
      primaryAction.type = 'primary'
      primaryAction.show = true
      break
    case 'vip_center':
      primaryAction.type = 'success'
      primaryAction.show = true
      break
    default:
      primaryAction.show = true
      primaryAction.type = 'primary'
  }
}, { deep: true, immediate: true })

// 方法
const getInviteText = () => {
  switch (recruitStatus.bind_status) {
    case 'self':
      return '您的专属邀请码'
    case 'bound':
      if (recruitStatus.vip_status === 'active') {
        return '您的VIP推荐人'
      } else {
        return '您的推荐人，邀请您升级VIP'
      }
    case 'conflict':
      return '您当前的推荐人'
    default:
      return '邀请您加入VIP会员'
  }
}

// 删除了showPrivilegeDetail方法



const handlePrimaryAction = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    // 检查登录状态
    if (!userStore.isLoggedIn) {
      console.log('👤 用户未登录，开始微信登录流程')
      await handleWechatLogin()
      return
    }
    
    // 检查用户状态
    const currentUserId = userStore.user?.id
    if (currentUserId == referrerId.value) {
      // 用户扫描自己的邀请码
      if (userStore.user?.vip_level > 0) {
        Toast('这是您自己的邀请码')
        router.push('/vip')
      } else {
        Toast('无法邀请自己')
        router.push('/vip/upgrade')
      }
      return
    }
    
    // 其他用户：调用主要处理逻辑
    console.log('👤 其他用户点击按钮，调用主要处理逻辑')
    await handleMainAction()
    
  } catch (error) {
    console.error('操作失败:', error)
    Toast({ type: 'fail', message: '操作失败，请重试' })
  } finally {
    loading.value = false
  }
}

const handleSecondaryAction = (action) => {
  // 处理辅助操作
}

const handleStatusAction = (action) => {
  console.log('🎯 状态卡片操作:', action)
  handleSmartStatusAction(action.key)
}



const handleUpgradeVip = async () => {
  primaryAction.loading = true
  
  try {
    loadingText.value = '正在创建订单...'
    
    // 调用VIP升级API
    const response = await vipOptimizer.checkRecruitStatus(referrerId.value)
    
    if (response.code === 0 && response.data.order_info) {
      const orderData = response.data.order_info
      
      // 记录VIP升级尝试
      console.log('VIP升级尝试:', {
        referrer_id: referrerId.value,
        amount: vipPrice.current
      })
      
      // 跳转到支付页面
      router.push(`/payment?order_id=${orderData.order_id}&from=vip_recruit`)
      
    } else {
      throw new Error(response.message || '创建订单失败')
    }
    
  } catch (error) {
    console.error('VIP升级失败:', error)
    Toast({ type: 'fail', message: error.message || '操作失败，请重试' })
    
  } finally {
    primaryAction.loading = false
    loadingText.value = '加载中...'
  }
}

const handleBindReferrer = async () => {
  primaryAction.loading = true
  try {
    // 调用绑定推荐人的API（这里需要实际的API调用）
    const response = await fetch('/admin/api/user/bind_referrer.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        referrer_id: referrerId.value,
        bind_type: 'bind'
      })
    })
    
    const data = await response.json()
    if (data.code === 0) {
      Toast.success('绑定成功')
      await checkUserRecruitStatus() // 重新检查状态
    } else {
      Toast({ type: 'fail', message: data.message || '绑定失败' })
    }
  } catch (error) {
    console.error('绑定推荐人失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
  } finally {
    primaryAction.loading = false
  }
}

// 统一的状态检测函数
const checkUserRecruitStatus = async () => {
  if (!referrerId.value) {
    Toast({ type: 'fail', message: '无效的邀请链接' })
    return
  }

  loading.value = true
  loadingText.value = '正在检测状态...'

  try {
    console.log('🔍 开始检测VIP招募状态...')
    const res = await vipOptimizer.checkRecruitStatus(referrerId.value, true)

    if (res.code === 0) {
      console.log('✅ 状态检测成功:', res.data)

      // 更新推荐人信息
      if (res.data.referrer_info) {
        Object.assign(referrerInfo, res.data.referrer_info)
      }

      // 关键判断：检查用户是否扫描自己的邀请码
      console.log('🔍 检查用户状态:', {
        isLoggedIn: userStore.isLoggedIn,
        userId: userStore.user?.id,
        referrerId: referrerId.value,
        isSelfScan: userStore.user?.id == referrerId.value
      })
      
      if (userStore.isLoggedIn && userStore.user && userStore.user.id == referrerId.value) {
        console.log('🔄 用户扫描自己的邀请码，覆盖状态')
        console.log('🔄 用户VIP等级:', userStore.user.vip_level)
        
        if (userStore.user.vip_level && userStore.user.vip_level > 0) {
          // 如果用户已经是VIP，显示自己是VIP的状态
          Object.assign(recruitStatus, {
            user_status: 'vip',
            bind_status: 'self',
            vip_status: 'active', 
            action_needed: 'none',
            button_text: '进入VIP中心',
            button_action: 'vip_center'
          })

          smartStatus.show = true
          smartStatus.type = 'self-scan-vip'
          smartStatus.icon = 'diamond'
          smartStatus.title = '这是您自己的邀请码'
          smartStatus.message = `您已经是VIP${userStore.user.vip_level}级会员，可以分享此码邀请他人`
          smartStatus.actions = [
            { key: 'vip_center', text: 'VIP中心', type: 'primary', size: 'small' },
            { key: 'share', text: '分享邀请', type: 'default', size: 'small' }
          ]
        } else {
          // 如果用户还不是VIP，提示不能邀请自己
          Object.assign(recruitStatus, {
            user_status: 'logged_in',
            bind_status: 'self',
            vip_status: 'none',
            action_needed: 'none',
            button_text: '直接升级VIP',
            button_action: 'upgrade_vip_direct'
          })

          smartStatus.show = true
          smartStatus.type = 'self-scan-non-vip'
          smartStatus.icon = 'info'
          smartStatus.title = '这是您自己的邀请码'
          smartStatus.message = '不能通过自己的邀请码成为VIP，请直接升级'
          smartStatus.actions = [
            { key: 'upgrade_direct', text: '直接升级', type: 'primary', size: 'small' }
          ]
        }
      } else {
        // 正常情况，使用API返回的状态
        Object.assign(recruitStatus, {
          user_status: res.data.user_status,
          bind_status: res.data.bind_status,
          vip_status: res.data.vip_status,
          action_needed: res.data.action_needed,
          button_text: res.data.button_text,
          button_action: res.data.button_action
        })
      }

      console.log('📊 当前状态:', recruitStatus.value)

    } else {
      console.error('❌ 状态检测失败:', res.message)

      // 如果是推荐人相关的错误，直接显示错误
      if (res.code === 404 || res.code === 403) {
        smartStatus.show = true
        smartStatus.type = 'invalid-referrer'
        smartStatus.icon = 'close'
        smartStatus.title = '推荐人信息获取失败'
        smartStatus.message = res.message || '推荐人信息获取失败'
        smartStatus.actions = [
          { key: 'retry', text: '重试', type: 'primary', size: 'small' }
        ]
        loading.value = false
        return
      } else {
        // 其他错误可能是认证问题，尝试降级处理
        console.log('🔄 尝试降级处理，仅获取推荐人基本信息...')
        await fallbackToBasicInfo()
      }
    }
  } catch (error) {
    console.error('❌ 状态检测异常:', error)

    // 网络错误或其他异常，尝试降级处理
    console.log('🔄 发生异常，尝试降级处理...')
    await fallbackToBasicInfo()
  } finally {
    loading.value = false
  }
}

// 降级处理：仅获取推荐人基本信息
const fallbackToBasicInfo = async () => {
  try {
    console.log('📋 降级处理：仅获取推荐人基本信息')
    const response = await fetch('/admin/api/user/get_referrer_info.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ referrer_id: referrerId.value })
    })
    const res = await response.json()

    if (res.code === 0) {
      console.log('✅ 推荐人信息获取成功')
      Object.assign(referrerInfo, res.data)

      // 检查用户登录状态和VIP状态
      await checkUserStatusAndUpdate()

      // 推荐人信息获取成功，显示正常状态
      smartStatus.show = false
      loading.value = false
    } else {
      smartStatus.show = true
      smartStatus.type = 'invalid-referrer'
      smartStatus.icon = 'close'
      smartStatus.title = '推荐人信息获取失败'
      smartStatus.message = res.message || '获取推荐人信息失败'
      smartStatus.actions = [
        { key: 'retry', text: '重试', type: 'primary', size: 'small' }
      ]
    }
  } catch (error) {
    console.error('❌ 降级处理也失败:', error)
    smartStatus.show = true
    smartStatus.type = 'invalid-referrer'
    smartStatus.icon = 'close'
    smartStatus.title = '推荐人信息获取失败'
    smartStatus.message = '网络错误，请重试'
    smartStatus.actions = [
      { key: 'retry', text: '重试', type: 'primary', size: 'small' }
    ]
  }
}

// 检查用户状态并更新界面
const checkUserStatusAndUpdate = async () => {
  console.log('🔍 检查用户状态...')
  
  // 检查用户是否登录
  if (!userStore.isLoggedIn || !userStore.user) {
    console.log('❌ 用户未登录')
    recruitStatus.value = {
      user_status: 'guest',
      bind_status: 'none',
      vip_status: 'none',
      action_needed: 'login',
      button_text: '微信登录',
      button_action: 'wechat_login'
    }
    return
  }

  const currentUser = userStore.user
  console.log('👤 当前用户:', currentUser)

  // 关键判断：检查用户是否扫描自己的邀请码
  if (currentUser.id == referrerId.value) {
    console.log('🔄 用户扫描自己的邀请码')
    
    if (currentUser.vip_level && currentUser.vip_level > 0) {
      // 如果用户已经是VIP，显示自己是VIP的状态
      recruitStatus.value = {
        user_status: 'vip',
        bind_status: 'self',
        vip_status: 'active', 
        action_needed: 'none',
        button_text: '进入VIP中心',
        button_action: 'vip_center'
      }

      smartStatus.show = true
      smartStatus.type = 'self-scan-vip'
      smartStatus.icon = 'diamond'
      smartStatus.title = '这是您自己的邀请码'
      smartStatus.message = `您已经是VIP${currentUser.vip_level}级会员，可以分享此码邀请他人`
      smartStatus.actions = [
        { key: 'vip_center', text: 'VIP中心', type: 'primary', size: 'small' },
        { key: 'share', text: '分享邀请', type: 'default', size: 'small' }
      ]
    } else {
      // 如果用户还不是VIP，提示不能邀请自己
      recruitStatus.value = {
        user_status: 'logged_in',
        bind_status: 'self',
        vip_status: 'none',
        action_needed: 'none',
        button_text: '直接升级VIP',
        button_action: 'upgrade_vip_direct'
      }

      smartStatus.show = true
      smartStatus.type = 'self-scan-non-vip'
      smartStatus.icon = 'info'
      smartStatus.title = '这是您自己的邀请码'
      smartStatus.message = '不能通过自己的邀请码成为VIP，请直接升级'
      smartStatus.actions = [
        { key: 'upgrade_direct', text: '直接升级', type: 'primary', size: 'small' }
      ]
    }
    return
  }

  // 检查用户是否已经是VIP
  if (currentUser.vip_level && currentUser.vip_level > 0) {
    console.log('✅ 用户已经是VIP')
    
    // 获取VIP用户的推荐人信息
    if (currentUser.referrer_id && currentUser.referrer_id > 0) {
      try {
        const vipReferrerResponse = await fetch('/admin/api/user/get_referrer_info.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ referrer_id: currentUser.referrer_id })
        })
        const vipReferrerData = await vipReferrerResponse.json()
        
        if (vipReferrerData.code === 0) {
          // 更新当前推荐人信息
          Object.assign(currentReferrerInfo, vipReferrerData.data)
          console.log('✅ VIP用户推荐人信息:', currentReferrerInfo)
        }
      } catch (error) {
        console.error('获取VIP用户推荐人信息失败:', error)
      }
    }
    
    recruitStatus.value = {
      user_status: 'vip',
      bind_status: 'bound',
      vip_status: 'active',
      action_needed: 'none',
      button_text: '进入VIP中心',
      button_action: 'vip_center'
    }

    // 显示VIP状态卡片
    smartStatus.show = true
    smartStatus.type = 'vip-already'
    smartStatus.icon = 'diamond'
    smartStatus.title = '您已经是VIP会员'
    smartStatus.message = `当前VIP等级：${currentUser.vip_level}级${currentReferrerInfo.name ? `，推荐人：${currentReferrerInfo.name}` : ''}`
    smartStatus.actions = [
      { key: 'vip_center', text: 'VIP中心', type: 'primary', size: 'small' },
      { key: 'share', text: '分享赚钱', type: 'default', size: 'small' }
    ]
    return
  }

  // 检查用户是否已经有推荐人
  if (currentUser.referrer_id && currentUser.referrer_id > 0) {
    console.log('👥 用户已有推荐人:', currentUser.referrer_id)
    
    // 获取当前推荐人信息
    try {
      const currentReferrerResponse = await fetch('/admin/api/user/get_referrer_info.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referrer_id: currentUser.referrer_id })
      })
      const currentReferrerData = await currentReferrerResponse.json()
      
      if (currentReferrerData.code === 0) {
        // 更新当前推荐人信息
        Object.assign(currentReferrerInfo, currentReferrerData.data)
        console.log('✅ 当前推荐人信息:', currentReferrerInfo)
      }
    } catch (error) {
      console.error('获取当前推荐人信息失败:', error)
    }
    
    if (currentUser.referrer_id == referrerId.value) {
      console.log('✅ 推荐人匹配，可以升级VIP')
      recruitStatus.value = {
        user_status: 'logged_in',
        bind_status: 'bound',
        vip_status: 'none',
        action_needed: 'upgrade',
        button_text: '立即升级VIP',
        button_action: 'upgrade_vip'
      }

      // 显示可升级状态
      smartStatus.show = false  // 隐藏状态卡片，显示正常界面
    } else {
      console.log('⚠️ 推荐人不匹配')
      recruitStatus.value = {
        user_status: 'logged_in',
        bind_status: 'conflict',
        vip_status: 'none',
        action_needed: 'upgrade',
        button_text: '立即升级VIP',
        button_action: 'upgrade_vip'
      }

      // 显示推荐人冲突状态
      smartStatus.show = true
      smartStatus.type = 'referrer-conflict'
      smartStatus.icon = 'warning'
      smartStatus.title = '您已有推荐人'
      smartStatus.message = `您的推荐人：${currentReferrerInfo.name || '未知'}，当前邀请无效`
      smartStatus.actions = []
    }
  } else {
    console.log('🔗 用户没有推荐人，可以绑定')
    recruitStatus.value = {
      user_status: 'logged_in',
      bind_status: 'none',
      vip_status: 'none',
      action_needed: 'bind',
      button_text: '绑定推荐人并升级VIP',
      button_action: 'bind_and_upgrade'
    }

    // 显示可绑定状态
    smartStatus.show = true
    smartStatus.type = 'can-bind'
    smartStatus.icon = 'info-o'
    smartStatus.title = '邀请您加入VIP'
    smartStatus.message = `推荐人：${referrerInfo.name || '华东南'}`
    smartStatus.actions = []
  }
}

// 获取推荐人信息（保留兼容性）
const fetchReferrerInfo = async () => {
  // 现在通过统一状态检测获取
  await checkUserRecruitStatus()
}

// 绑定推荐关系
const bindReferrerRelation = async () => {
  if (binding.value) return
  
  binding.value = true
  
  try {
    const response = await fetch('/admin/api/user/bind_referrer.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        referrer_id: referrerId.value,
        bind_type: 'immediate'
      })
    })
    const res = await response.json()
    
    if (res.code === 0) {
      const data = res.data
      bindStatus.value = data.bind_status
      
      if (data.bind_status === 'success') {
        Toast.success('推荐关系绑定成功！')
      } else if (data.bind_status === 'already_bound') {
        Toast.success('您已经是该用户的下级了')
      } else if (data.bind_status === 'conflict') {
        // 保存当前推荐人名称
        if (data.current_referrer_name) {
          currentReferrerName.value = data.current_referrer_name
        }
        Toast({ type: 'fail', message: data.message || '您已经有推荐人，不能修改' })
      } else {
        Toast({ type: 'fail', message: data.message || '绑定失败' })
      }
    } else {
      Toast({ type: 'fail', message: res.message || '绑定失败' })
    }
  } catch (error) {
    console.error('绑定推荐关系失败:', error)
    Toast({ type: 'fail', message: '网络错误，请重试' })
  } finally {
    binding.value = false
  }
}

// 获取状态图标
const getStatusIcon = () => {
  switch (bindStatus.value) {
    case 'success':
    case 'already_bound':
      return 'success'
    case 'conflict':
    case 'failed':
      return 'close'
    default:
      return 'info-o'
  }
}

// 获取状态颜色
const getStatusColor = () => {
  switch (bindStatus.value) {
    case 'success':
    case 'already_bound':
      return '#52c41a'
    case 'conflict':
    case 'failed':
      return '#ee0a24'
    default:
      return '#1989fa'
  }
}

// 获取按钮类型
const getButtonType = () => {
  switch (recruitStatus.value.button_action) {
    case 'wechat_login':
      return 'primary'
    case 'bind_referrer':
      return 'primary'
    case 'upgrade_vip':
      return 'success'
    case 'disabled':
      return 'default'
    default:
      return 'primary'
  }
}

// 获取状态提示信息
const getStatusMessage = () => {
  switch (recruitStatus.value.bind_status) {
    case 'bound':
      return '✅ 推荐关系已绑定'
    case 'bound_other':
      return '⚠️ 您已有其他推荐人'
    case 'self':
      return '❌ 不能邀请自己'
    default:
      return ''
  }
}

// 获取状态文本（保留兼容性）
const getStatusText = () => {
  switch (bindStatus.value) {
    case 'success':
      return '推荐关系绑定成功！'
    case 'already_bound':
      return '您已经是该用户的下级了'
    case 'conflict':
      return currentReferrerName.value ? `您的推荐人是：${currentReferrerName.value}，不可修改` : '您已经有推荐人，不能修改'
    case 'failed':
      return '绑定失败，请重试'
    default:
      return ''
  }
}

// 页面跳转
const goBack = () => {
  router.back()
}

// 跳转到VIP中心
const goToVipCenter = () => {
  router.push('/vip')
}

// 跳转到VIP招募页面
const goToRecruit = () => {
  router.push('/vip/recruit')
}

// 删除了复杂的倒计时函数

// 生命周期
onMounted(async () => {
  console.log('🚀 VIP招募页面已挂载')
  
  try {
    // 性能跟踪开始
    // performanceTracker.startPageLoad()
    
    // 初始化A/B测试
    // await abTestManager.initialize(userStore.user?.id)
    
    // 获取A/B测试配置
    // abConfig.value = abTestHelper.getVipRecruitConfig()
    // abPricingConfig.value = abTestHelper.getPricingConfig()
    
    // 应用A/B测试主题
    // abTestHelper.applyThemeConfig(abConfig.value)
    
    // 记录页面浏览事件
    // abTestHelper.trackPageView('vip_recruit_landing')
    
    // 移动端优化初始化
    // if (mobileOptimizer.isWeChat) {
    //   loadingText.value = '微信环境检测中...'
    // }
    
    // 初始化页面
    await initializePage()
    
    // 性能跟踪结束
    // performanceTracker.endPageLoad()
    
  } catch (error) {
    // errorHandler.handleError(error, {
    //   context: 'page_initialization',
    //   referrerId: referrerId.value
    // })
  }
})

const initializePage = async () => {
  try {
    currentStep.value = 1
    await checkUserRecruitStatus()
    currentStep.value = 2
    
    // 预加载相关数据
    if (referrerInfo.id) {
      // await vipOptimizer.batchPreload(referrerInfo.id)
    }
    currentStep.value = 3
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
}

// 验证用户真实登录状态
const validateUserRealLoginStatus = async () => {
  console.log('🔍 验证用户真实登录状态...')

  // 如果没有token，直接返回false
  if (!userStore.isLoggedIn || !userStore.token) {
    console.log('❌ 没有token，用户未登录')
    return false
  }

  // 检查用户信息是否完整
  const currentUser = userStore.user
  if (!currentUser || !currentUser.id) {
    console.log('⚠️ 有token但用户信息不完整，尝试获取用户信息...')

    try {
      // 尝试获取用户信息来验证token有效性
      await userStore.fetchUserInfo()
      const updatedUser = userStore.user

      if (!updatedUser || !updatedUser.id) {
        console.log('❌ 获取用户信息失败，token可能无效')
        // 静默清除无效的token和用户信息，不显示错误提示
        userStore.clearUserInfo()
        return false
      }

      console.log('✅ 用户信息获取成功，用户真实登录')
      return true
    } catch (error) {
      console.error('❌ 验证用户登录状态失败:', error)
      // 静默清除无效的token和用户信息，不显示错误提示
      userStore.clearUserInfo()
      return false
    }
  }

  console.log('✅ 用户信息完整，确认真实登录')
  return true
}
</script>

<style scoped>
.recruit-landing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.recruit-landing-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.content-wrapper {
  padding-bottom: 80px;
  position: relative;
  z-index: 1;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 状态指示器 - 现代化设计 */
.status-indicator {
  text-align: center;
  padding: 24px 20px;
}

.status-dots {
  display: inline-flex;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.4s ease;
  position: relative;
}

.dot.active {
  background: #fff;
  transform: scale(1.3);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

.dot.active::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 智能状态卡片 - 豪华设计 */
.smart-status-card {
  margin: 20px;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 1px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.smart-status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.8s ease;
}

.smart-status-card:hover::before {
  left: 100%;
}

.smart-status-card.vip-already {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
  box-shadow: 0 12px 40px rgba(255, 107, 107, 0.4);
}

.smart-status-card.invalid-referrer {
  background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
  color: #fff;
  box-shadow: 0 12px 40px rgba(255, 71, 87, 0.4);
}

.status-icon {
  flex-shrink: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-message {
  font-size: 15px;
  opacity: 0.95;
  margin: 0 0 20px 0;
  line-height: 1.6;
  font-weight: 500;
}

.status-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.status-action-btn {
  flex: 1;
  min-width: 100px;
  border-radius: 12px !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 精致的推荐人卡片样式 */
.referrer-card-compact {
  margin: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.referrer-card-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.referrer-card-compact:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.referrer-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.referrer-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.vip-badge-compact {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 8px;
  border: 2px solid #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.referrer-info-compact {
  flex: 1;
  min-width: 0;
}

.referrer-name-compact {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-text-compact {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  font-weight: 500;
}

.arrow-icon {
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.referrer-card-compact:hover .arrow-icon {
  opacity: 1;
  transform: translateX(2px);
}

/* 精致的VIP信息卡片样式 */
.vip-info-card {
  margin: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.vip-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.vip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}

.vip-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.vip-price {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.vip-price::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.price-symbol {
  font-size: 20px;
  font-weight: 700;
  vertical-align: top;
  opacity: 0.9;
}

.price-number {
  font-size: 42px;
  font-weight: 800;
  margin: 0 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.price-label {
  display: block;
  font-size: 14px;
  margin-top: 6px;
  opacity: 0.95;
  font-weight: 500;
}

.vip-benefits {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 16px 8px;
  background: linear-gradient(145deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.benefit-item:hover {
  transform: translateY(-2px);
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.benefit-item span {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  text-align: center;
  line-height: 1.3;
}

/* 操作按钮区域 */
.action-section {
  padding: 20px;
  position: relative;
}

.primary-action-btn {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border: none !important;
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  height: 50px !important;
  position: relative;
  overflow: hidden;
}

.primary-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.primary-action-btn:hover::before {
  left: 100%;
}

.primary-action-btn:active {
  transform: translateY(1px);
  box-shadow: 
    0 4px 15px rgba(102, 126, 234, 0.4),
    0 1px 4px rgba(0, 0, 0, 0.1) !important;
}

.secondary-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 导航栏美化 */
:deep(.van-nav-bar) {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: white;
  box-shadow: 0 2px 20px rgba(102, 126, 234, 0.3);
}

:deep(.van-nav-bar .van-nav-bar__title) {
  color: white !important;
  font-weight: 700;
  font-size: 18px;
}

:deep(.van-nav-bar .van-icon) {
  color: white !important;
}

:deep(.van-nav-bar .van-nav-bar__left .van-icon) {
  font-size: 20px;
}

/* 按钮样式统一 */
:deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  font-weight: 600;
}

:deep(.van-button--primary:active) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

:deep(.van-button--success) {
  background: linear-gradient(135deg, #10ac84, #00d2d3);
  border: none;
  box-shadow: 0 4px 15px rgba(16, 172, 132, 0.4);
}

:deep(.van-button--default) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #667eea;
  font-weight: 600;
}

/* 加载组件美化 */
:deep(.van-loading) {
  color: #667eea;
}

:deep(.van-loading__text) {
  color: #495057;
  font-weight: 500;
}

/* 响应式优化 */
@media (max-width: 375px) {
  .smart-status-card {
    margin: 16px 12px;
    padding: 24px 20px;
  }
  
  .referrer-card-compact,
  .vip-info-card {
    margin: 16px 12px;
    padding: 20px;
  }
  
  .vip-title {
    font-size: 18px;
  }
  
  .price-number {
    font-size: 36px;
  }
  
  .benefit-item {
    padding: 12px 6px;
  }
  
  .benefit-item span {
    font-size: 12px;
  }
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.status-card-enter-active {
  animation: slideInUp 0.6s ease;
}

.slide-up-enter-active {
  animation: slideInUp 0.8s ease;
}

.fade-in-enter-active {
  animation: fadeIn 1s ease;
}

/* 状态过渡动画 */
.status-card-enter-active,
.status-card-leave-active {
  transition: all 0.5s ease;
}

.status-card-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.status-card-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style> 