<template>
  <div class="wechat-check-in-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="微信扫码取水"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="loading-center">
      {{ loadingText }}
    </van-loading>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <van-empty
        image="error"
        :description="error"
      >
        <van-button type="primary" @click="refresh" round>
          重新加载
        </van-button>
      </van-empty>
    </div>

    <!-- 微信授权步骤 -->
    <div v-else-if="!isWechatAuthorized && !checkInSuccess" class="auth-step">
      <div class="auth-card">
        <div class="auth-header">
          <van-icon name="wechat" color="#07C160" size="60" />
          <h2>微信授权登录</h2>
          <p>需要获取您的微信头像和昵称用于取水</p>
        </div>
        
        <div class="water-point-preview" v-if="waterPoint">
          <h3>取水点信息</h3>
          <div class="point-info">
            <div class="point-name">{{ waterPoint.name }}</div>
            <div class="point-address">{{ waterPoint.address }}</div>
            <div class="point-manager" v-if="manager">
              负责人：{{ manager.name }}
            </div>
          </div>
        </div>
        
        <div class="auth-actions">
          <van-button 
            type="primary" 
            size="large" 
            @click="startWechatAuth"
            :loading="authLoading"
            block
          >
            <van-icon name="wechat" />
            微信授权登录
          </van-button>
        </div>
      </div>
    </div>

    <!-- 取水表单 -->
    <div v-else-if="isWechatAuthorized && !checkInSuccess" class="check-in-form">
      <div class="user-info-card">
        <div class="user-avatar">
          <van-image
            :src="wechatUser.avatar"
            round
            width="60"
            height="60"
            fit="cover"
          >
            <template v-slot:error>
              <van-icon name="photo-fail" />
            </template>
          </van-image>
        </div>
        <div class="user-details">
          <div class="user-name">{{ wechatUser.nickname }}</div>
          <div class="user-tip">微信用户</div>
        </div>
      </div>

      <div class="water-point-card">
        <div class="point-header">
          <h3>{{ waterPoint.name }}</h3>
          <div class="point-status" :class="getStatusClass(waterPoint.status)">
            {{ getStatusText(waterPoint.status) }}
          </div>
        </div>
        
        <div class="point-info">
          <div class="info-item">
            <van-icon name="location-o" />
            <span>{{ waterPoint.address }}</span>
          </div>
          
          <div class="info-item" v-if="waterPoint.price">
            <van-icon name="gold-coin-o" />
            <span>{{ waterPoint.price }}</span>
          </div>
          
          <div class="info-item" v-if="manager">
            <van-icon name="manager-o" />
            <span>负责人：{{ manager.name }}</span>
          </div>
        </div>
      </div>

      <!-- 剩余天数显示区域 - 移到表单之前 -->
      <div class="water-days-info" v-if="showWaterDaysInfo">
        <div class="days-card">
          <div class="days-header">
            <van-icon name="water-o" color="#1989fa" size="22" />
            <span class="days-title">剩余取水天数</span>
          </div>
          <div class="days-content">
            <div class="days-number" :class="{ 'insufficient': userWaterDays <= 0 }">
              {{ waterDaysLoading ? '...' : userWaterDays }}
            </div>
            <div class="days-unit">天</div>
          </div>
          <div class="days-status" :class="{ 'insufficient': userWaterDays <= 0 }">
            <van-icon 
              :name="userWaterDays > 0 ? 'success' : 'warning-o'" 
              :color="userWaterDays > 0 ? '#07c160' : '#ff976a'" 
              size="16" 
            />
            <span>{{ userWaterDays > 0 ? '可以取水' : '请联系服务人员充值天数' }}</span>
          </div>
        </div>
      </div>

      <van-form @submit="onSubmit" ref="formRef">
        <van-cell-group inset>
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]"
            @input="onPhoneInput"
          />
          
          <van-field
            v-model="form.name"
            name="name"
            label="姓名"
            placeholder="请输入姓名（可选）"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button 
            type="primary" 
            size="large" 
            native-type="submit"
            :loading="submitLoading"
            :disabled="!canTakeWater"
            :class="{ 'disabled-button': !canTakeWater }"
            block
          >
            {{ canTakeWater ? '确认取水' : '天数不足，无法取水' }}
          </van-button>
          
          <!-- 天数不足时的提示 -->
          <div v-if="showWaterDaysInfo && userWaterDays <= 0" class="insufficient-tip">
            <van-icon name="info-o" color="#ff6b6b" size="16" />
            <span>请联系服务人员为您充值取水天数</span>
          </div>
        </div>
      </van-form>
    </div>

    <!-- 取水成功 -->
    <div v-else-if="checkInSuccess" class="success-state">
      <div class="success-card">
        <van-icon name="success" color="#07C160" size="80" />
        <h2>取水成功！</h2>
        
        <div class="success-info">
          <div class="info-row">
            <span class="label">取水时间：</span>
            <span class="value">{{ checkInResult.check_in_time }}</span>
          </div>
          
          <div class="info-row">
            <span class="label">取水次数：</span>
            <span class="value">第 {{ checkInResult.check_in_count }} 次</span>
          </div>
          
          <div class="info-row" v-if="checkInResult.referral_info.is_new_user && checkInResult.referral_info.referrer_bound">
            <span class="label">推荐人：</span>
            <span class="value">{{ checkInResult.referral_info.referrer_name }}</span>
          </div>
        </div>

        <!-- 积分商城推广 -->
        <div class="points-mall-promotion">
          <div class="promotion-content">
            <van-icon name="gift-o" color="#FF6B35" size="24" />
            <div class="promotion-text">
              <p class="promotion-title">恭喜你获得水之净积分商城积分</p>
              <p class="promotion-subtitle">兑换生活必需品！</p>
            </div>
          </div>
          <van-button 
            type="primary" 
            size="small" 
            @click="goToPointsMall"
            class="promotion-button"
            round
          >
            点击这里领取
          </van-button>
        </div>
        
        <div class="success-actions">
          <van-button type="primary" @click="goToRecords" round>
            查看取水记录
          </van-button>
          <van-button type="default" @click="goBack" round>
            返回
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showFailToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import { wechatAuthApi, checkInApi } from '@/api/mobile'

const route = useRoute()
const router = useRouter()

// 检查用户剩余天数
const checkUserWaterAccess = async (phone, openid) => {
  try {
    // 判断是否为分支机构
    const isBranch = route.query.branch_code || (waterPoint.value && waterPoint.value.is_branch)
    
    let result
    if (isBranch) {
      // 分支机构使用专用API
      console.log('分支机构模式，使用分支API查询剩余天数')
      const { branchCheckInApi } = await import('@/api/branchCheckIn')
      
      const params = {}
      if (phone) {
        params.phone = phone
        console.log('分支机构使用手机号查询剩余天数:', phone)
      } else if (openid) {
        params.openid = openid
        console.log('分支机构使用openid查询剩余天数:', openid)
      } else {
        console.error('分支机构缺少查询参数: phone和openid都为空')
        return { code: 1, message: '缺少查询参数' }
      }
      
      console.log('分支机构API请求参数:', params)
      result = await branchCheckInApi.getUserWaterDays(params)
      console.log('分支机构API返回结果:', result)
    } else {
      // 官方取水点使用原有API
      console.log('官方取水点模式，使用官方API查询剩余天数')
      let apiUrl = '/admin/api/water/get_user_days.php?'
      const params = new URLSearchParams()
      
      // 优先使用手机号查询
      if (phone) {
        params.append('phone', phone)
        console.log('官方使用手机号查询剩余天数:', phone)
      } else if (openid) {
        params.append('openid', openid)
        console.log('官方使用openid查询剩余天数:', openid)
      } else {
        console.error('官方缺少查询参数: phone和openid都为空')
        return { code: 1, message: '缺少查询参数' }
      }
      
      apiUrl += params.toString()
      console.log('官方API请求URL:', apiUrl)
      
      // 直接调用原生PHP接口
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      result = await response.json()
      console.log('官方API返回结果:', result)
    }
    
    return result
  } catch (error) {
    console.error('检查用户剩余天数失败:', error)
    return { code: 1, message: error.message || '检查失败' }
  }
}

// 获取用户剩余天数并更新UI显示
const getUserWaterDays = async (phone, openid) => {
  try {
    waterDaysLoading.value = true
    console.log('开始获取用户剩余天数:', { phone, openid })
    
    const response = await checkUserWaterAccess(phone, openid)
    console.log('获取到的完整响应数据:', JSON.stringify(response, null, 2))
    
    if (response.code === 0 && response.data) {
      console.log('响应数据的remaining_days:', response.data.remaining_days)
      console.log('响应数据的water_access_remaining_days:', response.data.water_access_remaining_days)
      
      const rawDays = response.data.remaining_days || response.data.water_access_remaining_days || 0
      console.log('原始天数值:', rawDays, '类型:', typeof rawDays)
      
      const parsedDays = parseInt(rawDays)
      console.log('解析后的天数:', parsedDays, '类型:', typeof parsedDays)
      
      userWaterDays.value = parsedDays
      showWaterDaysInfo.value = true
      
      console.log('最终设置的userWaterDays.value:', userWaterDays.value)
      console.log('最终设置的showWaterDaysInfo.value:', showWaterDaysInfo.value)
    } else {
      console.log('获取剩余天数失败:', response.message)
      console.log('失败的响应数据:', response)
      // 即使获取失败也显示0天数，让用户知道状态
      userWaterDays.value = 0
      showWaterDaysInfo.value = true
    }
  } catch (error) {
    console.error('获取用户剩余天数异常:', error)
    // 出错时显示0天数
    userWaterDays.value = 0
    showWaterDaysInfo.value = true
  } finally {
    waterDaysLoading.value = false
  }
}

// 响应式数据
const loading = ref(true)
const loadingText = ref('加载中...')
const error = ref('')
const authLoading = ref(false)
const submitLoading = ref(false)

// 微信授权相关
const isWechatAuthorized = ref(false)
const wechatUser = ref({})
const wechatUserKey = ref('')

// 取水点和管理员信息
const waterPoint = ref(null)
const manager = ref(null)

// 取水相关
const checkInSuccess = ref(false)
const checkInResult = ref({})

// 剩余天数相关
const userWaterDays = ref(0)
const showWaterDaysInfo = ref(false)
const waterDaysLoading = ref(false)

// 表单数据
const form = reactive({
  phone: '',
  name: ''
})

// 计算属性
const isWechatBrowser = computed(() => {
  return /MicroMessenger/i.test(navigator.userAgent)
})

// 是否可以取水
const canTakeWater = computed(() => {
  if (!showWaterDaysInfo.value) {
    return true // 如果还没查询到天数信息，允许点击
  }
  return userWaterDays.value > 0
})

// 生命周期
onMounted(() => {
  initPage()
})

// 初始化页面
const initPage = async () => {
  try {
    loading.value = true
    loadingText.value = '加载取水点信息...'
    
    // 获取URL参数
    const waterPointId = route.query.water_point_id
    const managerId = route.query.manager_id
    const wechatUserKeyParam = route.query.wechat_user_key
    
    if (!waterPointId) {
      error.value = '缺少取水点信息'
      return
    }
    
    // 预填充用户信息（优先从本地缓存）
    const cachedPhone = localStorage.getItem('user_phone')
    const cachedName = localStorage.getItem('user_name')
    if (cachedPhone) {
      form.phone = cachedPhone
      form.name = cachedName || ''
      console.log('页面初始化时预填充用户信息:', { phone: cachedPhone, name: cachedName })
    }
    
    // 获取取水点信息
    await getWaterPointInfo(waterPointId)
    
    // 获取管理员信息（必须在获取取水点信息之后）
    if (managerId) {
      await getManagerInfo(managerId)
    }
    
    // 检查是否已经有微信用户信息
    if (wechatUserKeyParam) {
      await getWechatUserInfo(wechatUserKeyParam)
    }
    
  } catch (err) {
    console.error('初始化页面失败:', err)
    error.value = '页面加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 获取取水点信息
const getWaterPointInfo = async (waterPointId) => {
  try {
    // 检查是否是分支机构取水点
    const branchCode = route.query.branch_code || route.query.branch
    
    if (branchCode) {
      // 分支机构取水点
      const { branchWaterPointApi } = await import('@/api/branchWaterPoint')
      const response = await branchWaterPointApi.getWaterPointDetail(waterPointId, branchCode)
      if (response.code === 0) {
        waterPoint.value = response.data
        waterPoint.value.is_branch = true
        waterPoint.value.branch_code = branchCode
      } else {
        throw new Error(response.message || '获取分支机构取水点信息失败')
      }
    } else {
      // 官方取水点
      const response = await checkInApi.getWaterPointInfo(waterPointId)
      if (response.code === 0) {
        waterPoint.value = response.data.water_point
        waterPoint.value.is_branch = false
      } else {
        throw new Error(response.message || '获取取水点信息失败')
      }
    }
  } catch (err) {
    console.error('获取取水点信息失败:', err)
    throw err
  }
}

// 获取管理员信息
const getManagerInfo = async (managerId) => {
  try {
    // 如果取水点详情中已经包含负责人信息，直接使用
    if (waterPoint.value && waterPoint.value.manager_info) {
      manager.value = {
        id: waterPoint.value.manager_info.id,
        name: waterPoint.value.manager_info.name || '取水点负责人'
      }
      return
    }
    
    // 如果没有负责人信息，使用默认值
    manager.value = {
      id: managerId,
      name: '取水点负责人'
    }
  } catch (err) {
    console.error('获取管理员信息失败:', err)
    // 出错时使用默认值
    manager.value = {
      id: managerId,
      name: '取水点负责人'
    }
  }
}

// 获取微信用户信息
const getWechatUserInfo = async (userKey) => {
  try {
    loadingText.value = '获取微信用户信息...'
    
    const response = await wechatAuthApi.getUserInfo({ user_key: userKey })
    if (response.code === 0) {
      wechatUser.value = {
        openid: response.data.openid,
        nickname: response.data.nickname,
        avatar: response.data.avatar,
        sex: response.data.sex,
        province: response.data.province,
        city: response.data.city,
        country: response.data.country,
        branch_code: response.data.branch_code,
        branch_id: response.data.branch_id
      }
      wechatUserKey.value = userKey
      isWechatAuthorized.value = true
      
      // 检查用户是否已存在，如果存在则预填充信息
      await checkExistingUser(response.data.openid)
      
      console.log('微信授权成功，显示取水表单')
    } else {
      throw new Error(response.message || '获取微信用户信息失败')
    }
  } catch (err) {
    console.error('获取微信用户信息失败:', err)
    showFailToast('获取微信用户信息失败，请重新授权')
  }
}

// 检查用户是否已存在并预填充信息
const checkExistingUser = async (openid) => {
  try {
    // 首先从本地存储获取用户信息
    const cachedPhone = localStorage.getItem('user_phone')
    const cachedName = localStorage.getItem('user_name')
    
    if (cachedPhone) {
      form.phone = cachedPhone
      form.name = cachedName || ''
      console.log('从本地缓存预填充用户信息:', { phone: cachedPhone, name: cachedName })
      // 微信授权成功后延迟获取剩余天数，避免阻塞授权流程
      setTimeout(() => {
        getUserWaterDays(cachedPhone, openid)
      }, 100)
      return
    }
    
    // 通过openid查找用户信息
    const response = await wechatAuthApi.getUserByOpenid({ openid })
    if (response.code === 0 && response.data) {
      // 用户已存在，预填充信息并保存到本地缓存
      form.phone = response.data.phone || ''
      form.name = response.data.name || ''
      
      // 保存到本地存储
      if (response.data.phone) {
        localStorage.setItem('user_phone', response.data.phone)
      }
      if (response.data.name) {
        localStorage.setItem('user_name', response.data.name)
      }
      
      console.log('找到已存在用户，预填充信息:', response.data)
      
      // 微信授权成功后延迟获取剩余天数，避免阻塞授权流程
      setTimeout(() => {
        getUserWaterDays(response.data.phone, openid)
      }, 100)
    } else {
      console.log('用户不存在，需要填写信息')
      // 微信授权成功后延迟获取剩余天数，避免阻塞授权流程
      setTimeout(() => {
        getUserWaterDays(null, openid)
      }, 100)
    }
  } catch (err) {
    console.error('检查用户信息失败:', err)
    // 如果API失败，尝试使用本地缓存
    const cachedPhone = localStorage.getItem('user_phone')
    const cachedName = localStorage.getItem('user_name')
    
    if (cachedPhone) {
      form.phone = cachedPhone
      form.name = cachedName || ''
      console.log('API失败，使用本地缓存:', { phone: cachedPhone, name: cachedName })
      // 微信授权成功后延迟获取剩余天数，避免阻塞授权流程
      setTimeout(() => {
        getUserWaterDays(cachedPhone, openid)
      }, 100)
    }
  }
}

// 开始微信授权
const startWechatAuth = async () => {
  if (!isWechatBrowser.value) {
    showFailToast('请在微信中打开此页面')
    return
  }
  
  try {
    authLoading.value = true
    
    // 构建回调URL - 确保回调到当前取水页面
    const currentUrl = window.location.href
    let redirectUrl = currentUrl.split('?')[0] + '?water_point_id=' + route.query.water_point_id
    if (route.query.manager_id) {
      redirectUrl += '&manager_id=' + route.query.manager_id
    }
    if (route.query.branch_code) {
      redirectUrl += '&branch_code=' + route.query.branch_code
    }
    
    // 准备API请求数据，包含分支机构代码
    // 不在state中包含完整的return_url，而是在回调时重新构建，避免URL过长
    const authRequestData = {
      redirect_url: redirectUrl,
      state: JSON.stringify({
        type: 'wechat_check_in',
        water_point_id: route.query.water_point_id,
        manager_id: route.query.manager_id,
        branch_code: route.query.branch_code,
        timestamp: Date.now()
      })
    }
    
    // 如果有分支机构代码，添加到请求中
    if (route.query.branch_code) {
      authRequestData.branch_code = route.query.branch_code
    }
    
    // 获取微信授权URL
    const response = await wechatAuthApi.getAuthUrl(authRequestData)
    
    if (response.code === 0) {
      // 跳转到微信授权页面
      window.location.href = response.data.auth_url
    } else {
      throw new Error(response.message || '获取授权URL失败')
    }
  } catch (err) {
    console.error('微信授权失败:', err)
    showFailToast('微信授权失败，请重试')
  } finally {
    authLoading.value = false
  }
}

// 自动取水方法 - 供微信授权成功后调用
const submitCheckIn = async () => {
  if (!wechatUser.value.openid) {
    showFailToast('微信用户信息不完整')
    return
  }
  
  try {
    submitLoading.value = true
    showLoadingToast({ message: '正在自动取水...', forbidClick: true })
    
    // 使用新的字段名格式
    const checkInData = {
      water_point_id: route.query.water_point_id,
      manager_id: route.query.manager_id,
      openid: wechatUser.value.openid,
      nickname: wechatUser.value.nickname,
      avatar: wechatUser.value.avatar,
      check_in_method: 'qr_code'
    }
    
    // 如果是分支机构取水点，添加分支代码
    if (waterPoint.value.is_branch && waterPoint.value.branch_code) {
      checkInData.branch_code = waterPoint.value.branch_code
    } else if (route.query.branch_code) {
      checkInData.branch_code = route.query.branch_code
    }
    
    // 统一使用微信取水API
    const response = await checkInApi.wechatCheckIn(checkInData)
    
    if (response.code === 0) {
      checkInResult.value = response.data
      checkInSuccess.value = true
      showSuccessToast('取水成功！')
      
      // 取水成功后自动跳转到取水记录页面
      setTimeout(() => {
        goToRecords()
      }, 2000) // 2秒后自动跳转
      
      // 保存用户信息到本地存储（如果有的话）
      if (form.phone && form.phone.trim()) {
        localStorage.setItem('user_phone', form.phone)
      }
      if (form.name && form.name.trim()) {
        localStorage.setItem('user_name', form.name)
      }
      
      // 不再立即清除微信用户信息缓存，保留给下次使用
      // if (wechatUserKey.value) {
      //   await wechatAuthApi.clearUserInfo({ user_key: wechatUserKey.value })
      // }
    } else {
      throw new Error(response.message || '取水失败')
    }
  } catch (err) {
    console.error('自动取水失败:', err)
    closeToast()
    
    // 特殊处理重复取水的情况
    if (err.message && err.message.includes('您今日已在此取水点取水过了')) {
      handleDuplicateCheckIn()
    } else {
      showFailToast(err.message || '取水失败，请重试')
    }
  } finally {
    submitLoading.value = false
  }
}

// 提交取水
const onSubmit = async () => {
  // 手机号改为可选，支持纯微信用户取水
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) {
    showFailToast('手机号格式不正确')
    return
  }
  
  // 如果没有剩余天数，不允许取水
  if (showWaterDaysInfo.value && userWaterDays.value <= 0) {
    showFailToast('剩余取水天数不足，请联系服务人员充值')
    return
  }
  
  try {
    submitLoading.value = true
    showLoadingToast({ message: '取水中...', forbidClick: true })
    
    // 使用新的字段名格式
    const checkInData = {
      water_point_id: route.query.water_point_id,
      manager_id: route.query.manager_id,
      openid: wechatUser.value.openid,
      nickname: wechatUser.value.nickname,
      avatar: wechatUser.value.avatar,
      check_in_method: 'qr_code'
    }
    
    // 如果有手机号，添加到请求中
    if (form.phone && form.phone.trim()) {
      checkInData.phone = form.phone
    }
    
    // 如果有姓名，添加到请求中
    if (form.name && form.name.trim()) {
      checkInData.name = form.name
    }
    
    // 如果是分支机构取水点，添加分支代码
    if (waterPoint.value.is_branch && waterPoint.value.branch_code) {
      checkInData.branch_code = waterPoint.value.branch_code
    }
    
    let response
    if (waterPoint.value.is_branch) {
      // 分支机构取水点取水
      const { branchCheckInApi } = await import('@/api/branchCheckIn')
      response = await branchCheckInApi.wechatCheckIn(checkInData)
    } else {
      // 官方取水点取水
      response = await checkInApi.wechatCheckIn(checkInData)
    }
    
    if (response.code === 0) {
      checkInResult.value = response.data
      checkInSuccess.value = true
      
      // 保存用户手机号到本地存储，方便查看取水记录
      if (form.phone && form.phone.trim()) {
        localStorage.setItem('user_phone', form.phone)
      }
      
      // 保存用户姓名到本地存储
      if (form.name && form.name.trim()) {
        localStorage.setItem('user_name', form.name)
      }
      
      showSuccessToast('取水成功！')
      
      // 取水成功后自动跳转到取水记录页面
      setTimeout(() => {
        goToRecords()
      }, 2000) // 2秒后自动跳转
      
      // 取水成功后，刷新剩余天数（减少1天）
      if (showWaterDaysInfo.value && userWaterDays.value > 0) {
        userWaterDays.value = Math.max(0, userWaterDays.value - 1)
      }
      
      // 不再立即清除微信用户信息缓存，保留给下次使用
      // if (wechatUserKey.value) {
      //   await wechatAuthApi.clearUserInfo({ user_key: wechatUserKey.value })
      // }
    } else {
      throw new Error(response.message || '取水失败')
    }
  } catch (err) {
    console.error('取水失败:', err)
    
    // 详细的错误处理，支持400错误
    let errorMessage = '取水失败，请重试'
    
    if (err.response && err.response.data) {
      // 解析后端返回的错误信息
      if (typeof err.response.data === 'string') {
        try {
          const jsonData = JSON.parse(err.response.data)
          errorMessage = jsonData.message || errorMessage
        } catch (e) {
          errorMessage = err.response.data
        }
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message
      }
    } else if (err.message) {
      errorMessage = err.message
    }
    
    // 特殊处理重复取水的情况
    if (errorMessage && errorMessage.includes('您今日已在此取水点取水过了')) {
      handleDuplicateCheckIn()
    } else {
      showFailToast(errorMessage)
    }
  } finally {
    submitLoading.value = false
    closeToast()
  }
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    'active': 'status-active',
    'inactive': 'status-inactive',
    'maintenance': 'status-maintenance'
  }
  return statusMap[status] || 'status-unknown'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'active': '正常营业',
    'inactive': '暂停营业',
    'maintenance': '维护中'
  }
  return statusMap[status] || '未知状态'
}

// 刷新页面
const refresh = () => {
  error.value = ''
  initPage()
}

// 返回
const goBack = () => {
  router.go(-1)
}

// 查看取水记录
const goToRecords = () => {
  // 获取用户手机号，优先从表单，然后从localStorage
  const phone = form.phone || localStorage.getItem('user_phone') || ''
  const openid = wechatUser.value?.openid || ''
  
  if (phone) {
    router.push(`/check-in/records?phone=${encodeURIComponent(phone)}`)
  } else if (openid) {
    // 如果没有手机号但有openid，传递openid参数
    router.push(`/check-in/records?openid=${encodeURIComponent(openid)}`)
  } else {
    router.push('/check-in/records')
  }
}

// 处理重复取水的情况
const handleDuplicateCheckIn = () => {
  showConfirmDialog({
    title: '取水提醒',
    message: '您今日已在此取水点取水过了',
    confirmButtonText: '查看取水记录',
    cancelButtonText: '我知道了',
    showCancelButton: true,
    confirmButtonColor: '#1989fa',
    cancelButtonColor: '#969799',
    closeOnClickOverlay: false
  }).then(() => {
    // 用户点击"查看取水记录"
    goToRecords()
  }).catch(() => {
    // 用户点击"我知道了"或关闭弹窗
    console.log('用户选择关闭重复取水提醒')
  })
}

// 跳转到积分商城
const goToPointsMall = () => {
  try {
    showSuccessToast('正在跳转到积分商城...')
    
    // 直接跳转到积分商城URL
    const pointsMallUrl = 'https://h.7dingdong.com/#/?store_id=4350607'
    window.open(pointsMallUrl, '_blank')
    
  } catch (error) {
    console.error('跳转积分商城失败:', error)
    showFailToast('跳转失败，请稍后重试')
  }
}

// 手机号输入监听
const onPhoneInput = async (value) => {
  // 当手机号格式正确时，查询剩余天数
  if (value && /^1[3-9]\d{9}$/.test(value)) {
    await getUserWaterDays(value, wechatUser.value.openid)
  }
  // 注意：不再隐藏天数信息，保持显示状态
}

// 获取用户剩余天数
const fetchUserWaterDays = async (phone) => {
  try {
    waterDaysLoading.value = true
    
    const response = await checkUserWaterAccess(phone, wechatUser.value.openid)
    
    if (response.code === 0) {
      userWaterDays.value = response.data.remaining_days || 0
      showWaterDaysInfo.value = true
      
      console.log('用户剩余取水天数:', userWaterDays.value)
    } else {
      // 用户不存在或查询失败，默认显示0天数
      userWaterDays.value = 0
      showWaterDaysInfo.value = true
      console.warn('查询用户剩余天数失败:', response.message)
    }
  } catch (error) {
    console.error('获取用户剩余天数异常:', error)
    // 查询异常时，默认显示0天数
    userWaterDays.value = 0
    showWaterDaysInfo.value = true
  } finally {
    waterDaysLoading.value = false
  }
}
</script>

<style scoped>
.wechat-check-in-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.error-state {
  padding: 40px 20px;
}

.auth-step {
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-header h2 {
  margin: 20px 0 10px;
  color: #333;
  font-size: 24px;
}

.auth-header p {
  color: #666;
  margin-bottom: 30px;
}

.water-point-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.water-point-preview h3 {
  margin: 0 0 15px;
  color: #333;
  font-size: 16px;
}

.point-info {
  color: #666;
}

.point-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.point-address {
  margin-bottom: 8px;
}

.point-manager {
  color: #1989fa;
}

.auth-actions {
  margin-top: 30px;
}

.check-in-form {
  padding: 20px;
}

.user-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  margin-right: 15px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.user-tip {
  color: #666;
  font-size: 14px;
}

.water-point-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.point-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.point-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-active {
  background: #e8f5e8;
  color: #52c41a;
}

.status-inactive {
  background: #fff2e8;
  color: #fa8c16;
}

.status-maintenance {
  background: #f6f6f6;
  color: #666;
}

.point-info {
  color: #666;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .van-icon {
  margin-right: 8px;
  color: #1989fa;
}

.form-actions {
  padding: 20px;
}

.success-state {
  padding: 40px 20px;
}

.success-card {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.success-card h2 {
  margin: 20px 0 30px;
  color: #333;
  font-size: 24px;
}

.success-info {
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  color: #333;
  font-weight: bold;
}

.value.points {
  color: #ff6b35;
}

.success-actions {
  display: flex;
  gap: 15px;
}

.success-actions .van-button {
  flex: 1;
}

.points-mall-promotion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffbe6;
  border-radius: 8px;
  padding: 15px 20px;
  margin-top: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.promotion-content {
  display: flex;
  align-items: center;
}

.promotion-content .van-icon {
  margin-right: 10px;
}

.promotion-text {
  flex: 1;
}

.promotion-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.promotion-subtitle {
  font-size: 14px;
  color: #666;
}

.promotion-button {
  flex-shrink: 0;
}

/* 新增样式 */
.water-days-info {
  margin: 20px 0;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(79, 172, 254, 0.3);
  overflow: hidden;
  position: relative;
}

.water-days-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.days-card {
  padding: 24px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.days-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.days-header .van-icon {
  margin-right: 10px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.days-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.days-content {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 12px;
}

.days-number {
  font-size: 52px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 3px 6px rgba(0,0,0,0.2);
  line-height: 1;
}

.days-number.insufficient {
  color: #ffeb3b;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.days-unit {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-left: 8px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.days-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  padding: 8px 16px;
  backdrop-filter: blur(10px);
}

.days-status .van-icon {
  margin-right: 6px;
}

.days-status.insufficient {
  background: rgba(255,235,59,0.2);
}

.insufficient-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 14px;
  font-weight: 500;
}

.insufficient-tip .van-icon {
  margin-right: 8px;
}

.disabled-button {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  background: #cccccc !important;
  border-color: #cccccc !important;
}
</style> 