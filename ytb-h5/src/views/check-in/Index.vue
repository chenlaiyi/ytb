<template>
  <div class="check-in-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="扫码取水"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="loading-center">
      加载中...
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

    <!-- 签到内容 -->
    <div v-else-if="waterPoint" class="check-in-content">
      <!-- 取水点信息卡片 -->
      <div class="water-point-card">
        <div class="point-header">
          <h2 class="point-name">{{ waterPoint.name }}</h2>
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
          
          <div class="info-item" v-if="waterPoint.business_hours">
            <van-icon name="clock-o" />
            <span>{{ waterPoint.business_hours }}</span>
          </div>
          
          <div class="info-item" v-if="waterPoint.contact_phone">
            <van-icon name="phone-o" />
            <span>{{ waterPoint.contact_phone }}</span>
          </div>
        </div>

        <!-- 评分 -->
        <div class="rating-section" v-if="waterPoint.rating > 0">
          <van-rate
            v-model="waterPoint.rating"
            :size="16"
            color="#ffd21e"
            void-color="#eee"
            readonly
          />
          <span class="rating-text">{{ waterPoint.rating }}/5.0</span>
        </div>
      </div>

      <!-- 取水状态卡片 -->
      <div class="check-in-status-card">
        <div v-if="hasCheckedInToday" class="checked-in-status">
          <van-icon name="success" color="#07c160" size="24" />
          <div class="status-text">
            <h3>今日已取水</h3>
            <p>取水时间：{{ todayCheckInTime }}</p>
            <p>累计取水：{{ totalCheckIns }} 次</p>
          </div>
        </div>
        
        <div v-else class="not-checked-in">
          <van-icon name="clock-o" color="#969799" size="24" />
          <div class="status-text">
            <h3>今日尚未取水</h3>
            <p v-if="totalCheckIns > 0">您已累计取水 {{ totalCheckIns }} 次</p>
            <p v-else>这是您的第一次取水</p>
          </div>
        </div>
      </div>

      <!-- 取水表单 -->
      <div v-if="!hasCheckedInToday && canCheckIn" class="check-in-form-card">
        <div class="form-title">请完善信息以完成取水</div>
        
        <van-form @submit="onSubmit" ref="formRef">
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入您的手机号"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]"
            maxlength="11"
            type="tel"
            clearable
          />
          
          <van-field
            v-model="form.name"
            name="name"
            label="姓名"
            placeholder="请输入您的姓名（可选）"
            maxlength="20"
            clearable
          />

          <!-- 位置信息 -->
          <div class="location-section">
            <div class="location-title">
              <van-icon name="location-o" />
              当前位置
            </div>
            <div v-if="currentLocation.address" class="location-info">
              <span class="location-text">{{ currentLocation.address }}</span>
              <van-button 
                type="primary" 
                size="mini" 
                @click="getLocation"
                :loading="locationLoading"
              >
                重新定位
              </van-button>
            </div>
            <div v-else class="location-error">
              <span>位置获取失败</span>
              <van-button 
                type="primary" 
                size="mini" 
                @click="getLocation"
                :loading="locationLoading"
              >
                获取位置
              </van-button>
            </div>
          </div>

          <div class="form-footer">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit"
              :loading="submitting"
              size="large"
            >
              确认取水
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 不能取水的提示 -->
      <div v-else-if="!canCheckIn" class="cannot-check-in">
        <van-notice-bar
          left-icon="warning-o"
          text="该取水点暂不开放取水，请选择其他取水点"
          type="warning"
        />
      </div>

      <!-- 我的取水记录 -->
      <div class="my-records-card" v-if="userPhone">
        <div class="card-header">
          <h3>我的取水记录</h3>
          <van-button 
            type="primary" 
            size="mini" 
            @click="viewAllRecords"
          >
            查看全部
          </van-button>
        </div>
        
        <div v-if="recentRecords.length > 0" class="records-list">
          <div 
            v-for="record in recentRecords" 
            :key="record.id"
            class="record-item"
          >
            <div class="record-info">
              <div class="record-point">{{ record.water_point?.name || '未知取水点' }}</div>
              <div class="record-time">{{ formatDateTime(record.created_at) }}</div>
            </div>
            <div class="record-method">
              <van-tag size="mini">{{ getMethodText(record.check_in_method) }}</van-tag>
            </div>
          </div>
        </div>
        
        <van-empty v-else description="暂无取水记录" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import { checkInApi } from '@/api/checkIn'
import { branchCheckInApi } from '@/api/branchCheckIn'
import { getWaterPointDetail } from '@/api/waterPoint'
import { branchWaterPointApi } from '@/api/branchWaterPoint'

const route = useRoute()
const router = useRouter()

// 数据状态
const loading = ref(true)
const error = ref('')
const waterPoint = ref(null)
const submitting = ref(false)
const locationLoading = ref(false)

// 签到状态
const hasCheckedInToday = ref(false)
const todayCheckInTime = ref('')
const totalCheckIns = ref(0)
const userPhone = ref('')

// 表单数据
const form = reactive({
  phone: '',
  name: ''
})

// 位置信息
const currentLocation = reactive({
  latitude: null,
  longitude: null,
  address: ''
})

// 签到记录
const recentRecords = ref([])

// 表单引用
const formRef = ref()

// 计算属性
const canCheckIn = computed(() => {
  return waterPoint.value && 
         waterPoint.value.status === 'active' && 
         waterPoint.value.is_open
})

// 页面加载
onMounted(async () => {
  await initPage()
})

// 初始化页面
const initPage = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const waterPointId = route.query.water_point_id || route.params.id
    
    if (!waterPointId) {
      error.value = '缺少取水点参数'
      return
    }

    // 获取取水点信息
    await fetchWaterPointInfo(waterPointId)
    
    // 自动获取用户位置
    await getLocation()
    
    // 从本地存储获取用户手机号
    const savedPhone = localStorage.getItem('user_phone')
    if (savedPhone) {
      form.phone = savedPhone
      userPhone.value = savedPhone
      await checkTodayStatus()
      await fetchRecentRecords()
    }
  } catch (err) {
    console.error('页面初始化失败:', err)
    error.value = '页面加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 获取取水点信息
const fetchWaterPointInfo = async (waterPointId) => {
  try {
    // 如果URL中包含branch_code参数，直接使用分支机构API
    const branchCode = route.query.branch_code || route.query.branch
    if (branchCode) {
      console.log('检测到分支机构代码，直接使用分支机构API:', branchCode)
      const response = await branchWaterPointApi.getWaterPointDetail(waterPointId, branchCode)
      if (response.code === 0) {
        waterPoint.value = response.data
        waterPoint.value.is_branch = true // 标记为分支机构取水点
        waterPoint.value.branch_code = branchCode
        return
      } else {
        throw new Error(response.message || '获取分支机构取水点信息失败')
      }
    }
    
    // 如果没有分支代码，尝试获取官方取水点信息
    try {
      const response = await getWaterPointDetail(waterPointId)
      if (response.code === 0) {
        waterPoint.value = response.data
        waterPoint.value.is_branch = false // 标记为官方取水点
        return
      }
    } catch (officialError) {
      console.log('官方取水点API失败，可能是分支机构取水点:', officialError)
      // 官方API失败，可能是分支机构取水点，但没有分支代码
      throw new Error('缺少分支机构代码，无法获取取水点信息')
    }
    
    throw new Error('取水点不存在')
  } catch (err) {
    console.error('获取取水点信息失败:', err)
    throw new Error(err.message || '获取取水点信息失败')
  }
}

// 检查今日签到状态
const checkTodayStatus = async () => {
  if (!form.phone || !waterPoint.value?.id) return
  
  try {
    let response
    
    if (waterPoint.value.is_branch) {
      // 分支机构取水点
      response = await branchCheckInApi.checkTodayStatus({
        phone: form.phone,
        water_point_id: waterPoint.value.id
      })
    } else {
      // 官方取水点
      response = await checkInApi.checkTodayStatus({
        phone: form.phone,
        water_point_id: waterPoint.value.id
      })
    }
    
    if (response.code === 0) {
      hasCheckedInToday.value = response.data.has_checked_in_today
      todayCheckInTime.value = response.data.check_in_time
      totalCheckIns.value = response.data.total_check_ins
    }
  } catch (err) {
    console.error('检查签到状态失败:', err)
  }
}

// 获取最近签到记录
const fetchRecentRecords = async () => {
  if (!form.phone) return
  
  try {
    let response
    
    if (waterPoint.value?.is_branch) {
      // 分支机构取水点
      response = await branchCheckInApi.getUserCheckIns({
        phone: form.phone,
        page: 1,
        page_size: 5
      })
    } else {
      // 官方取水点
      response = await checkInApi.getUserCheckIns({
        phone: form.phone,
        page: 1,
        page_size: 5
      })
    }
    
    if (response.code === 0) {
      recentRecords.value = response.data.list || response.data
    }
  } catch (err) {
    console.error('获取签到记录失败:', err)
  }
}

// 获取位置信息
const getLocation = async () => {
  locationLoading.value = true
  
  try {
    if (!navigator.geolocation) {
      throw new Error('浏览器不支持定位功能')
    }
    
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })
    
    currentLocation.latitude = position.coords.latitude
    currentLocation.longitude = position.coords.longitude
    
    // 逆地理编码获取地址
    await reverseGeocode(currentLocation.latitude, currentLocation.longitude)
  } catch (err) {
    console.error('获取位置失败:', err)
    showToast('获取位置失败，请手动开启定位权限')
  } finally {
    locationLoading.value = false
  }
}

// 逆地理编码
const reverseGeocode = async (lat, lng) => {
  try {
    // 这里可以调用地图API进行逆地理编码
    // 暂时使用简单的坐标显示
    currentLocation.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch (err) {
    console.error('逆地理编码失败:', err)
    currentLocation.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

// 提交签到
const onSubmit = async (values) => {
  if (submitting.value) return
  
  submitting.value = true
  
  try {
    const checkInData = {
      water_point_id: waterPoint.value.id,
      phone: values.phone,
      name: values.name,
      check_in_method: 'qr_code',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location_address: currentLocation.address
    }
    
    // 如果是分支机构取水点，添加分支代码
    if (waterPoint.value.is_branch && waterPoint.value.branch_code) {
      checkInData.branch_code = waterPoint.value.branch_code
    }
    
    let response
    
    if (waterPoint.value.is_branch) {
      // 分支机构取水点签到
      response = await branchCheckInApi.checkIn(checkInData)
    } else {
      // 官方取水点签到
      response = await checkInApi.checkIn(checkInData)
    }
    
    if (response.code === 0) {
      // 保存用户手机号到本地存储
      localStorage.setItem('user_phone', values.phone)
      userPhone.value = values.phone
      
      // 显示签到成功和积分奖励信息
      const pointsReward = response.data.points_reward
      // 暂时隐藏积分显示，因为积分兑换链路还未开发完成
      /*
      if (pointsReward && pointsReward.enabled && pointsReward.points_earned > 0) {
        let message = `签到成功！获得 ${pointsReward.points_earned} 积分`
        if (pointsReward.consecutive_days > 1) {
          message += `（连续签到 ${pointsReward.consecutive_days} 天）`
        }
        if (pointsReward.bonus_points > 0) {
          message += `，连续奖励 ${pointsReward.bonus_points} 积分`
        }
        message += `，当前积分：${pointsReward.total_points}`
        
        showSuccessToast({
          message: message,
          duration: 3000
        })
      } else {
        showSuccessToast('签到成功！')
      }
      */
      // 统一显示简单的签到成功提示
      showSuccessToast('取水成功！')
      
      // 更新签到状态
      hasCheckedInToday.value = true
      todayCheckInTime.value = response.data.check_in_time
      totalCheckIns.value = response.data.check_in_count
      
      // 刷新签到记录
      await fetchRecentRecords()
    } else {
      throw new Error(response.message)
    }
  } catch (err) {
    console.error('取水失败:', err)
    
    // 特殊处理重复取水的情况
    if (err.message && err.message.includes('您今日已在此取水点签到过了')) {
      handleDuplicateCheckIn()
    } else {
      showFailToast(err.message || '取水失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

// 查看全部记录
const viewAllRecords = () => {
  router.push(`/check-in/records?phone=${encodeURIComponent(userPhone.value)}`)
}

// 处理重复取水的情况
const handleDuplicateCheckIn = () => {
  showConfirmDialog({
    title: '取水提醒',
    message: '您今日已在此取水点取过水了',
    confirmButtonText: '查看取水记录',
    cancelButtonText: '我知道了',
    showCancelButton: true,
    confirmButtonColor: '#1989fa',
    cancelButtonColor: '#969799',
    closeOnClickOverlay: false
  }).then(() => {
    // 用户点击"查看取水记录"
    viewAllRecords()
  }).catch(() => {
    // 用户点击"我知道了"或关闭弹窗
    console.log('用户选择关闭重复取水提醒')
  })
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

// 刷新页面
const refresh = () => {
  initPage()
}

// 工具函数
const getStatusText = (status) => {
  const statusMap = {
    active: '营业中',
    inactive: '暂停营业',
    maintenance: '维护中'
  }
  return statusMap[status] || '未知状态'
}

const getStatusClass = (status) => {
  return {
    active: 'status-active',
    inactive: 'status-inactive', 
    maintenance: 'status-maintenance'
  }[status] || 'status-unknown'
}

const getMethodText = (method) => {
  const methodMap = {
    qr_code: '扫码取水',
    manual: '手动取水',
    auto: '自动取水'
  }
  return methodMap[method] || '未知方式'
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}
</script>

<style scoped>
.check-in-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.loading-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.error-state {
  padding: 60px 20px;
}

.check-in-content {
  padding: 16px;
}

.water-point-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.point-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.point-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #e8f5e8;
  color: #52c41a;
}

.status-inactive {
  background: #fff7e6;
  color: #faad14;
}

.status-maintenance {
  background: #fff2f0;
  color: #ff4d4f;
}

.point-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #646566;
  font-size: 14px;
}

.info-item .van-icon {
  margin-right: 8px;
  color: #969799;
}

.rating-section {
  display: flex;
  align-items: center;
}

.rating-text {
  margin-left: 8px;
  color: #646566;
  font-size: 14px;
}

.check-in-status-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.checked-in-status,
.not-checked-in {
  display: flex;
  align-items: center;
}

.status-text {
  margin-left: 12px;
}

.status-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.status-text p {
  margin: 2px 0;
  color: #646566;
  font-size: 14px;
}

.check-in-form-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
}

.location-section {
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
  margin: 16px 0;
}

.location-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #323233;
  margin-bottom: 8px;
}

.location-title .van-icon {
  margin-right: 4px;
}

.location-info,
.location-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.location-text {
  flex: 1;
  color: #646566;
  font-size: 13px;
  margin-right: 8px;
}

.form-footer {
  margin-top: 24px;
}

.cannot-check-in {
  margin-bottom: 16px;
}

.my-records-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.records-list {
  space-y: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  flex: 1;
}

.record-point {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #969799;
}
</style> 