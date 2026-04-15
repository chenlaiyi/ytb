<template>
  <div class="recruit-ranking-page">
    <van-nav-bar
      title="VIP招募排行榜"
      left-arrow
      @click-left="onClickLeft"
      fixed
    />

    <div class="content">
      <div class="header-card">
        <div class="month-selector">
          <van-button 
            icon="arrow-left" 
            size="small" 
            type="primary" 
            plain
            @click="previousMonth"
            :disabled="loading"
          />
          <div class="month-title">{{ formatMonthDisplay(selectedMonth) }}排行榜</div>
          <van-button 
            icon="arrow" 
            size="small" 
            type="primary" 
            plain
            @click="nextMonth"
            :disabled="loading || isCurrentMonth"
          />
        </div>
        <div class="subtitle">按{{ formatMonthDisplay(selectedMonth) }}新增VIP团队人数排名</div>
      </div>

      <div class="ranking-list">
        <div v-if="loading" class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
          <div class="loading-text">加载中...</div>
        </div>

        <template v-else>
          <!-- 前三名特殊显示 -->
          <div class="top-three" v-if="rankingList.length > 0">
            <div class="rank-item rank-2" v-if="rankingList.length > 1">
              <div class="rank-number">2</div>
              <van-image
                round
                width="60"
                height="60"
                :src="rankingList[1].display_avatar"
                fit="cover"
              />
              <div class="user-name">{{ rankingList[1].display_name }}</div>
              <div class="recruit-count">{{ rankingList[1].recruit_count }}人</div>
            </div>

            <div class="rank-item rank-1" v-if="rankingList.length > 0">
              <div class="rank-number">1</div>
              <van-image
                round
                width="70"
                height="70"
                :src="rankingList[0].display_avatar"
                fit="cover"
              />
              <div class="user-name">{{ rankingList[0].display_name }}</div>
              <div class="recruit-count">{{ rankingList[0].recruit_count }}人</div>
            </div>

            <div class="rank-item rank-3" v-if="rankingList.length > 2">
              <div class="rank-number">3</div>
              <van-image
                round
                width="60"
                height="60"
                :src="rankingList[2].display_avatar"
                fit="cover"
              />
              <div class="user-name">{{ rankingList[2].display_name }}</div>
              <div class="recruit-count">{{ rankingList[2].recruit_count }}人</div>
            </div>
          </div>

          <!-- 其他排名列表 -->
          <div class="other-ranks">
            <div
              v-for="(item, index) in rankingList.slice(3)"
              :key="item.id"
              class="rank-list-item"
            >
              <div class="rank-number">{{ index + 4 }}</div>
              <van-image
                round
                width="40"
                height="40"
                :src="item.display_avatar"
                fit="cover"
              />
              <div class="user-info">
                <div class="user-name">{{ item.display_name }}</div>
              </div>
              <div class="recruit-count">{{ item.recruit_count }}人</div>
            </div>
          </div>

          <div v-if="rankingList.length === 0" class="empty-data">
            <van-empty description="暂无排行数据" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { NavBar, Loading, Tag, Image as VanImage, Button as VanButton, Empty as VanEmpty } from 'vant'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { getVipRecruitRanking } from '@/api/vip'

const router = useRouter()
const loading = ref(true)
const rankingList = ref([])
const selectedMonth = ref('')
const currentRealMonth = ref('')

// 计算是否为当前月份
const isCurrentMonth = computed(() => {
  return selectedMonth.value === currentRealMonth.value
})

// 格式化月份显示
const formatMonthDisplay = (month) => {
  if (!month) return ''
  const [year, monthNum] = month.split('-')
  return `${year}年${monthNum}月`
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 上一个月
const previousMonth = () => {
  if (loading.value) return
  
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  date.setMonth(date.getMonth() - 1)
  
  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  selectedMonth.value = `${newYear}-${newMonth}`
  
  fetchRankingData()
}

// 下一个月
const nextMonth = () => {
  if (loading.value || isCurrentMonth.value) return
  
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  date.setMonth(date.getMonth() + 1)
  
  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  selectedMonth.value = `${newYear}-${newMonth}`
  
  fetchRankingData()
}

// 获取排行榜数据
const fetchRankingData = async () => {
  loading.value = true
  try {
    const params = selectedMonth.value ? { month: selectedMonth.value } : {}
    const res = await getVipRecruitRanking(params)

    if (res.code === 0 && res.data) {
      // 处理排行榜数据，添加显示字段
      console.log('🔍 完整API响应:', res)
      console.log('🔍 原始API数据:', res.data)
      
      // 正确获取排行榜数据，确保来源是res.data.ranking
      if (!res.data.ranking || !Array.isArray(res.data.ranking)) {
        console.error('❌ 排行榜数据格式异常:', res.data)
        showFailToast('排行榜数据格式异常')
        return
      }
      
      const ranking = res.data.ranking
      console.log('🔍 排行榜原始数据:', ranking.slice(0, 3))
      
      rankingList.value = ranking.map(item => {
        console.log(`🔍 用户${item.user_id}详细数据:`, {
          user_id: item.user_id,
          name: item.name,
          month_vip_count: item.month_vip_count,
          total_vip_count: item.total_vip_count,
          avatar: item.avatar
        })
        
        return {
          ...item,
          id: item.user_id,
          display_name: item.name || item.nickname || `用户${item.user_id}`,
          display_avatar: item.avatar || '/admin/images/default-avatar.png',
          // 确保使用正确的月度VIP招募数量
          recruit_count: parseInt(item.month_vip_count) || 0
        }
      })
      
      console.log('🔍 处理后排行榜数据:', rankingList.value.slice(0, 3))
    } else {
      showFailToast(res.message || '获取排行榜失败')
    }
  } catch (error) {
    console.error('获取排行榜错误:', error)
    showFailToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 初始化当前月份
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  selectedMonth.value = currentMonth
  currentRealMonth.value = currentMonth
  
  fetchRankingData()
})
</script>

<style scoped>
.recruit-ranking-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-top: 46px;
  padding-bottom: 20px;
}

.content {
  padding: 16px;
}

.header-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  background-image: linear-gradient(to right, #f8f9fa, #e9f5ff);
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.month-title {
  font-size: 22px;
  font-weight: bold;
  color: #323233;
  min-width: 200px;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.ranking-list {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 12px;
  color: #969799;
  font-size: 14px;
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 30px;
  padding: 20px 0;
  position: relative;
}

.top-three::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(to right, transparent, #e8e8e8, transparent);
}

.rank-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 12px;
}

.rank-1 {
  z-index: 3;
  transform: scale(1.1);
}

.rank-2, .rank-3 {
  margin-top: 20px;
}

.rank-number {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #fff;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.rank-1 .rank-number {
  background-color: #ff6b00;
  width: 30px;
  height: 30px;
  font-size: 16px;
}

.rank-2 .rank-number {
  background-color: #8c8c8c;
}

.rank-3 .rank-number {
  background-color: #cd7f32;
}

.user-name {
  margin-top: 10px;
  font-size: 14px;
  color: #323233;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.recruit-count {
  margin-top: 6px;
  font-size: 16px;
  font-weight: bold;
  color: #ff6b00;
  background-color: rgba(255, 107, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.other-ranks {
  margin-top: 20px;
}

.rank-list-item {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f2f3f5;
}

.rank-list-item:last-child {
  border-bottom: none;
}

.rank-list-item .rank-number {
  position: static;
  transform: none;
  width: 26px;
  height: 26px;
  background-color: #f2f3f5;
  color: #323233;
  margin-right: 12px;
  box-shadow: none;
}

.user-info {
  flex: 1;
  margin-left: 12px;
}

.rank-list-item .user-name {
  margin-top: 0;
  max-width: none;
  text-align: left;
  font-weight: 500;
}

.rank-list-item .recruit-count {
  margin-top: 0;
  background-color: rgba(255, 107, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-data {
  padding: 40px 0;
}

/* 添加响应式设计 */
@media screen and (max-width: 375px) {
  .content {
    padding: 12px;
  }

  .header-card {
    padding: 16px;
  }

  .month-title {
    font-size: 18px;
    min-width: 160px;
  }

  .month-selector {
    gap: 12px;
  }

  .rank-1 {
    transform: scale(1.05);
  }
}
</style>
