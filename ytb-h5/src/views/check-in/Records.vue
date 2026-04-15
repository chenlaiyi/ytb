<template>
  <div class="check-in-records">
    <!-- 导航栏 -->
    <van-nav-bar
      title="我的取水记录"
      left-arrow
      @click-left="$router.go(-1)"
      fixed
      placeholder
    />

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ stats.total_check_ins || 0 }}</div>
          <div class="stat-label">总取水</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.today_check_ins || 0 }}</div>
          <div class="stat-label">今日取水</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.this_month_check_ins || 0 }}</div>
          <div class="stat-label">本月取水</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <van-cell-group>
        <van-field
          v-model="filterForm.start_date"
          label="开始日期"
          placeholder="选择开始日期"
          readonly
          @click="showStartDatePicker = true"
        />
        <van-field
          v-model="filterForm.end_date"
          label="结束日期"
          placeholder="选择结束日期"
          readonly
          @click="showEndDatePicker = true"
        />
      </van-cell-group>
      
      <div class="filter-actions">
        <van-button @click="resetFilter" size="small">重置</van-button>
        <van-button type="primary" @click="applyFilter" size="small">筛选</van-button>
      </div>
    </div>

    <!-- 取水记录列表 -->
    <div class="records-section">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
        :immediate-check="false"
      >
        <div v-for="record in records" :key="record.id" class="record-card">
          <div class="record-header">
            <h3 class="water-point-name">{{ record.water_point?.name || '未知取水点' }}</h3>
            <van-tag :type="getMethodTagType(record.check_in_method)" size="mini">
              {{ getMethodText(record.check_in_method) }}
            </van-tag>
          </div>
          
          <div class="record-info">
            <div class="info-item">
              <van-icon name="location-o" />
              <span>{{ record.water_point?.address || '地址未知' }}</span>
            </div>
            
            <div class="info-item">
              <van-icon name="clock-o" />
              <span>{{ formatDateTime(record.created_at) }}</span>
            </div>
            
            <div v-if="record.location_address" class="info-item">
              <van-icon name="guide-o" />
              <span>{{ record.location_address }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty v-if="!loading && records.length === 0" description="暂无取水记录" />
      </van-list>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showStartDatePicker" position="bottom">
      <van-calendar
        v-model:show="showStartDatePicker"
        @confirm="onStartDateConfirm"
        title="选择开始日期"
        position="bottom"
      />
    </van-popup>

    <van-popup v-model:show="showEndDatePicker" position="bottom">
      <van-calendar
        v-model:show="showEndDatePicker"
        @confirm="onEndDateConfirm"
        title="选择结束日期"
        position="bottom"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { checkInApi } from '@/api/checkIn'

const route = useRoute()

// 数据状态
const loading = ref(false)
const finished = ref(false)
const records = ref([])
const stats = ref({})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

// 筛选条件
const filterForm = reactive({
  start_date: '',
  end_date: ''
})

// 日期选择器
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 用户手机号
const userPhone = ref('')

// 页面加载
onMounted(async () => {
  userPhone.value = route.query.phone || localStorage.getItem('user_phone') || ''
  
  // 如果没有手机号，尝试通过微信openid获取用户信息
  if (!userPhone.value) {
    const openid = route.query.openid || localStorage.getItem('wechat_openid') || ''
    if (openid) {
      try {
        const { wechatAuthApi } = await import('@/api/mobile')
        const response = await wechatAuthApi.getUserByOpenid({ openid })
        if (response.code === 0 && response.data.phone) {
          userPhone.value = response.data.phone
          localStorage.setItem('user_phone', response.data.phone)
        }
      } catch (error) {
        console.error('通过openid获取用户信息失败:', error)
      }
    }
  }
  
  if (!userPhone.value) {
    showToast('请先完成取水获取用户信息')
    return
  }
  
  // 初始加载
  onLoad()
})

// 加载数据
const onLoad = async () => {
  if (loading.value || !userPhone.value) return
  
  loading.value = true
  
  try {
    const params = {
      phone: userPhone.value,
      page: pagination.page,
      page_size: pagination.page_size,
      ...filterForm
    }
    
    // 优先尝试官方API，如果失败再尝试分支机构API
    let response
    let usedOfficialApi = false
    
    try {
      // 首先尝试官方API（Laravel API）
      response = await checkInApi.getUserCheckIns(params)
      usedOfficialApi = true
      console.log(`成功加载 ${newRecords.length} 条取水记录，使用${usedOfficialApi ? '官方' : '分支机构'}API`)
    } catch (officialError) {
      console.log('官方API调用失败，尝试分支机构API:', officialError.message)
      // 如果官方API失败，尝试分支机构API
      const { branchCheckInApi } = await import('@/api/branchCheckIn')
      response = await branchCheckInApi.getUserCheckIns(params)
      console.log('使用分支机构API获取取水记录')
    }
    
    if (response.code === 0) {
      const newRecords = response.data.list || []
      
      if (pagination.page === 1) {
        records.value = newRecords
        stats.value = response.data.stats || {}
      } else {
        records.value.push(...newRecords)
      }
      
      // 检查是否还有更多数据
      const hasMore = newRecords.length === pagination.page_size
      finished.value = !hasMore
      
      // 增加页码
      if (hasMore) {
        pagination.page++
      }
      
      console.log(`成功加载 ${newRecords.length} 条取水记录，使用${usedOfficialApi ? '官方' : '分支机构'}API`)
    } else {
      showToast(response.message || '获取取水记录失败')
      finished.value = true
    }
  } catch (error) {
    console.error('获取取水记录失败:', error)
    showToast('获取取水记录失败')
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 应用筛选
const applyFilter = () => {
  // 重置分页
  pagination.page = 1
  finished.value = false
  records.value = []
  
  // 重新加载数据
  onLoad()
}

// 重置筛选
const resetFilter = () => {
  filterForm.start_date = ''
  filterForm.end_date = ''
  applyFilter()
}

// 开始日期确认
const onStartDateConfirm = (value) => {
  filterForm.start_date = formatDate(value)
  showStartDatePicker.value = false
}

// 结束日期确认
const onEndDateConfirm = (value) => {
  filterForm.end_date = formatDate(value)
  showEndDatePicker.value = false
}

// 工具函数
const getMethodText = (method) => {
  const methodMap = {
    qr_code: '扫码取水',
    manual: '手动取水',
    auto: '自动取水'
  }
  return methodMap[method] || '未知方式'
}

const getMethodTagType = (method) => {
  const typeMap = {
    qr_code: 'primary',
    manual: 'success',
    auto: 'warning'
  }
  return typeMap[method] || 'default'
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatDate = (date) => {
  if (!date) return ''
  // 如果date是数组格式（van-calendar返回格式）
  if (Array.isArray(date) && date.length > 0) {
    const d = date[0]
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  }
  const d = new Date(date)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.check-in-records {
  min-height: 100vh;
  background: #f7f8fa;
}

.stats-section {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  background: #f7f8fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.filter-section {
  background: white;
  margin-bottom: 8px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
}

.records-section {
  padding: 0 16px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.water-point-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  flex: 1;
  margin-right: 8px;
}

.record-info {
  space-y: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #646566;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .van-icon {
  margin-right: 8px;
  color: #969799;
  font-size: 14px;
}
</style> 