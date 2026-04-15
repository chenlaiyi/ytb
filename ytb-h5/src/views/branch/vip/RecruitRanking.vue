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
import { getBranchVipRecruitRanking } from '@/api/branchVip'

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
    // 获取用户ID和分支机构代码
    const userId = localStorage.getItem('user_id')
    const branchCode = localStorage.getItem('branch_code')
    
    const params = {
      user_id: userId,
      branch_code: branchCode,
      month: selectedMonth.value
    }
    const res = await getBranchVipRecruitRanking(params)

    if (res.code === 0 && res.data) {
      rankingList.value = res.data.ranking || []
      
      // 处理排行榜数据，添加显示字段
      rankingList.value = rankingList.value.map(item => ({
        ...item,
        id: item.user_id || item.id,
        display_name: item.name || item.nickname || `用户${item.user_id || item.id}`,
        display_avatar: item.avatar || '/admin/images/default-avatar.png',
        recruit_count: item.month_vip_count || 0
      }))
      
      console.log('分支机构排行榜数据:', rankingList.value)
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

// 初始化数据
onMounted(() => {
  // 设置当前月份
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 46px;
}

.content {
  padding: 20px 16px;
}

.header-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-align: center;
  flex: 1;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.loading-text {
  color: white;
  margin-top: 16px;
  font-size: 14px;
}

.top-three {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 32px;
  padding: 0 20px;
}

.rank-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.rank-1 {
  order: 2;
  margin: 0 20px;
  transform: translateY(-10px);
}

.rank-2 {
  order: 1;
}

.rank-3 {
  order: 3;
}

.rank-number {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 2;
}

.rank-1 .rank-number {
  background: linear-gradient(135deg, #ffd700, #ffb347);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.rank-2 .rank-number {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
}

.rank-3 .rank-number {
  background: linear-gradient(135deg, #cd7f32, #b8860b);
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
}

.user-name {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recruit-count {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.other-ranks {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rank-list-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rank-list-item:last-child {
  border-bottom: none;
}

.rank-list-item .rank-number {
  position: static;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-info {
  flex: 1;
  margin-left: 12px;
}

.rank-list-item .user-name {
  margin: 0;
  font-size: 16px;
  max-width: none;
}

.rank-list-item .recruit-count {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffd700;
}

.empty-data {
  text-align: center;
  padding: 60px 0;
}

.empty-data .van-empty {
  background: transparent;
}

.empty-data .van-empty__description {
  color: rgba(255, 255, 255, 0.6);
}
</style> 