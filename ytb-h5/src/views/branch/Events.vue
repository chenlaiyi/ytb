<template>
  <div class="branch-events-container">
    <van-nav-bar 
      title="活动中心" 
      left-arrow 
      @click-left="$router.go(-1)"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 搜索弹出层 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }">
      <div class="search-container">
        <van-nav-bar title="搜索活动" left-arrow @click-left="showSearch = false" />
        <div class="search-content">
          <van-search
            v-model="searchKeyword"
            placeholder="请输入活动名称或关键词"
            @search="handleSearch"
            @clear="handleClearSearch"
          />
          
          <!-- 热门搜索 -->
          <div class="hot-search" v-if="!searchKeyword">
            <div class="hot-header">热门搜索</div>
            <div class="hot-tags">
              <van-tag 
                v-for="(item, index) in hotSearchWords"
                :key="index"
                @click="searchKeyword = item; handleSearch()"
                class="hot-tag"
                color="#f0f9ff"
                text-color="#1989fa"
              >
                {{ item }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <van-tabs v-model:active="activeCategory" @change="handleCategoryChange" sticky>
        <van-tab 
          v-for="category in categories" 
          :key="category.id" 
          :title="category.name"
          :name="category.id"
        />
      </van-tabs>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item" @click="showFilterPopup = true">
        <span>筛选</span>
        <van-icon name="filter-o" />
        <van-badge :content="filterCount" v-if="filterCount > 0" />
      </div>
      <div class="filter-item" @click="handleLocationFilter">
        <span>{{ currentLocation || '全部地区' }}</span>
        <van-icon name="location-o" />
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="events-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="events-list">
            <div 
              v-for="event in eventList"
              :key="event.id"
              class="event-card"
              @click="handleEventClick(event)"
            >
              <div class="event-image">
                <van-image
                  :src="event.image"
                  fit="cover"
                  :alt="event.title"
                >
                  <template #error>
                    <div class="image-error">
                      <van-icon name="photo-fail" size="32" />
                    </div>
                  </template>
                </van-image>
                
                <!-- 状态标签 -->
                <div class="event-status" :class="event.status">
                  {{ getStatusText(event.status) }}
                </div>
                
                <!-- 活动标签 -->
                <div class="event-tags" v-if="event.tags && event.tags.length > 0">
                  <van-tag 
                    v-for="tag in event.tags.slice(0, 2)"
                    :key="tag"
                    size="mini"
                    :color="getTagColor(tag)"
                  >
                    {{ tag }}
                  </van-tag>
                </div>
              </div>
              
              <div class="event-info">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-desc">{{ event.description }}</div>
                
                <div class="event-meta">
                  <div class="event-time">
                    <van-icon name="clock-o" />
                    <span>{{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</span>
                  </div>
                  <div class="event-location" v-if="event.location">
                    <van-icon name="location-o" />
                    <span>{{ event.location }}</span>
                  </div>
                </div>
                
                <div class="event-footer">
                  <div class="event-participants">
                    <span class="participants-count">{{ event.participantCount }}人参与</span>
                    <div class="participants-avatars" v-if="event.participants && event.participants.length > 0">
                      <van-image
                        v-for="(participant, index) in event.participants.slice(0, 3)"
                        :key="index"
                        :src="participant.avatar"
                        round
                        width="20"
                        height="20"
                        class="participant-avatar"
                      />
                    </div>
                  </div>
                  
                  <div class="event-action">
                    <van-button 
                      v-if="event.status === 'ongoing'"
                      type="primary" 
                      size="mini"
                      @click.stop="handleJoinEvent(event)"
                    >
                      立即参与
                    </van-button>
                    <van-button 
                      v-else-if="event.status === 'upcoming'"
                      type="warning" 
                      size="mini"
                      @click.stop="handleReserveEvent(event)"
                    >
                      预约报名
                    </van-button>
                    <span v-else class="status-text">已结束</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty 
            v-if="!loading && eventList.length === 0"
            description="暂无活动"
            image="search"
          >
            <van-button type="primary" @click="onRefresh">刷新试试</van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 筛选弹出层 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" closeable>
      <div class="filter-popup">
        <div class="popup-header">
          <span>筛选</span>
          <van-button type="primary" size="mini" plain @click="resetFilters">重置</van-button>
        </div>
        
        <!-- 活动状态 -->
        <div class="filter-section">
          <div class="filter-title">活动状态</div>
          <div class="filter-options">
            <van-radio-group v-model="filters.status">
              <van-radio name="">全部</van-radio>
              <van-radio name="upcoming">即将开始</van-radio>
              <van-radio name="ongoing">进行中</van-radio>
              <van-radio name="ended">已结束</van-radio>
            </van-radio-group>
          </div>
        </div>

        <!-- 活动类型 -->
        <div class="filter-section">
          <div class="filter-title">活动类型</div>
          <div class="filter-options">
            <van-checkbox-group v-model="filters.types">
              <van-checkbox 
                v-for="type in typeOptions"
                :key="type"
                :name="type"
                class="filter-checkbox"
              >
                {{ type }}
              </van-checkbox>
            </van-checkbox-group>
          </div>
        </div>

        <div class="filter-actions">
          <van-button @click="showFilterPopup = false" class="cancel-btn">取消</van-button>
          <van-button type="primary" @click="applyFilters" class="confirm-btn">确定</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 活动详情弹出层 -->
    <van-popup v-model:show="showEventDetail" position="bottom" :style="{ height: '90%' }" closeable>
      <div class="event-detail" v-if="selectedEvent">
        <div class="detail-header">
          <van-image
            :src="selectedEvent.image"
            fit="cover"
            class="detail-image"
          />
          
          <div class="detail-overlay">
            <div class="detail-status" :class="selectedEvent.status">
              {{ getStatusText(selectedEvent.status) }}
            </div>
            <div class="detail-tags" v-if="selectedEvent.tags">
              <van-tag 
                v-for="tag in selectedEvent.tags"
                :key="tag"
                size="mini"
                :color="getTagColor(tag)"
              >
                {{ tag }}
              </van-tag>
            </div>
          </div>
        </div>
        
        <div class="detail-content">
          <div class="detail-title">{{ selectedEvent.title }}</div>
          
          <div class="detail-meta">
            <div class="meta-item">
              <van-icon name="clock-o" />
              <span>{{ formatTime(selectedEvent.startTime) }} - {{ formatTime(selectedEvent.endTime) }}</span>
            </div>
            <div class="meta-item" v-if="selectedEvent.location">
              <van-icon name="location-o" />
              <span>{{ selectedEvent.location }}</span>
            </div>
            <div class="meta-item">
              <van-icon name="friends-o" />
              <span>{{ selectedEvent.participantCount }}人参与</span>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">活动介绍</div>
            <div class="section-content">{{ selectedEvent.description }}</div>
          </div>
          
          <div class="detail-section" v-if="selectedEvent.rules">
            <div class="section-title">参与规则</div>
            <div class="section-content">{{ selectedEvent.rules }}</div>
          </div>
          
          <div class="detail-section" v-if="selectedEvent.rewards">
            <div class="section-title">活动奖励</div>
            <div class="rewards-list">
              <div v-for="(reward, index) in selectedEvent.rewards" :key="index" class="reward-item">
                <van-icon name="gift-o" />
                <span>{{ reward }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">参与用户</div>
            <div class="participants-list">
              <div 
                v-for="(participant, index) in selectedEvent.participants" 
                :key="index" 
                class="participant-item"
              >
                <van-image
                  :src="participant.avatar"
                  round
                  width="32"
                  height="32"
                />
                <span class="participant-name">{{ participant.name }}</span>
                <span class="participant-time">{{ formatTime(participant.joinTime) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-actions" v-if="selectedEvent.status !== 'ended'">
          <van-button 
            v-if="selectedEvent.status === 'ongoing'"
            type="primary" 
            class="action-btn"
            @click="handleJoinEvent(selectedEvent)"
          >
            立即参与
          </van-button>
          <van-button 
            v-else-if="selectedEvent.status === 'upcoming'"
            type="warning" 
            class="action-btn"
            @click="handleReserveEvent(selectedEvent)"
          >
            预约报名
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

export default {
  name: 'BranchEvents',
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const showSearch = ref(false)
    const searchKeyword = ref('')
    const activeCategory = ref('all')
    const showFilterPopup = ref(false)
    const showEventDetail = ref(false)
    const selectedEvent = ref(null)
    const currentLocation = ref('')
    
    const refreshing = ref(false)
    const loading = ref(false)
    const finished = ref(false)
    
    const eventList = ref([])
    
    // 筛选器
    const filters = reactive({
      status: '',
      types: []
    })
    
    // 分类数据
    const categories = ref([
      { id: 'all', name: '全部' },
      { id: 'promotion', name: '促销活动' },
      { id: 'product', name: '产品体验' },
      { id: 'service', name: '服务活动' },
      { id: 'community', name: '社区活动' }
    ])
    
    // 筛选选项
    const typeOptions = ref(['限时优惠', '新品体验', '免费试用', '培训讲座', '社区聚会'])
    
    // 热门搜索词
    const hotSearchWords = ref(['优惠活动', '新品体验', '免费试用', '培训讲座'])
    
    // 计算属性
    const filterCount = computed(() => {
      let count = 0
      if (filters.status) count++
      if (filters.types.length > 0) count++
      return count
    })
    
    // 模拟活动数据
    const mockEvents = [
      {
        id: 1,
        title: '新品净水器免费试用',
        description: '全新智能净水器免费试用7天，体验纯净水生活',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        status: 'ongoing',
        startTime: '2024-01-15 09:00',
        endTime: '2024-01-31 18:00',
        location: '全市各分支机构',
        participantCount: 1256,
        category: 'product',
        tags: ['免费试用', '新品'],
        rules: '1. 仅限新用户参与\n2. 每户限申请一台\n3. 试用期7天\n4. 需支付押金，试用结束后退还',
        rewards: ['免费试用7天', '购买享8折优惠', '免费上门安装'],
        participants: [
          { name: '张先生', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg', joinTime: '2024-01-20 10:30' },
          { name: '李女士', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg', joinTime: '2024-01-20 11:15' },
          { name: '王先生', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg', joinTime: '2024-01-20 14:20' }
        ]
      },
      {
        id: 2,
        title: '春节特惠大促销',
        description: '春节期间全场商品8折起，更有神秘大奖等你来抽',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        status: 'upcoming',
        startTime: '2024-02-01 00:00',
        endTime: '2024-02-15 23:59',
        location: '线上线下同步',
        participantCount: 0,
        category: 'promotion',
        tags: ['限时优惠', '春节特惠'],
        rules: '1. 活动期间购买任意商品享8折优惠\n2. 满1000元可参与抽奖\n3. 每日限量特价商品先到先得',
        rewards: ['全场8折优惠', '满1000抽奖', '每日特价商品'],
        participants: []
      },
      {
        id: 3,
        title: '家电维护知识讲座',
        description: '专业师傅教你家电保养技巧，延长设备使用寿命',
        image: 'https://img.yzcdn.cn/vant/cat.jpeg',
        status: 'ended',
        startTime: '2024-01-10 14:00',
        endTime: '2024-01-10 16:00',
        location: '市中心分支机构',
        participantCount: 45,
        category: 'service',
        tags: ['培训讲座', '免费'],
        rules: '1. 免费参与\n2. 需提前报名\n3. 座位有限，先报先得',
        rewards: ['免费参与', '获得维护手册', '现场答疑'],
        participants: [
          { name: '陈先生', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg', joinTime: '2024-01-08 09:00' },
          { name: '刘女士', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg', joinTime: '2024-01-08 10:30' }
        ]
      }
    ]
    
    // 方法
    const handleSearch = () => {
      if (!searchKeyword.value.trim()) {
        showToast('请输入搜索关键词')
        return
      }
      
      showSearch.value = false
      onRefresh()
      showToast(`搜索 "${searchKeyword.value}"`)
    }
    
    const handleClearSearch = () => {
      searchKeyword.value = ''
    }
    
    const handleCategoryChange = (categoryId) => {
      activeCategory.value = categoryId
      onRefresh()
    }
    
    const handleLocationFilter = () => {
      showToast('选择地区功能')
    }
    
    const resetFilters = () => {
      filters.status = ''
      filters.types = []
    }
    
    const applyFilters = () => {
      showFilterPopup.value = false
      onRefresh()
      showToast('筛选已应用')
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'upcoming': '即将开始',
        'ongoing': '进行中',
        'ended': '已结束'
      }
      return statusMap[status] || '未知'
    }
    
    const getTagColor = (tag) => {
      const colorMap = {
        '免费试用': '#07c160',
        '新品': '#1989fa',
        '限时优惠': '#ff4444',
        '春节特惠': '#ff9800',
        '培训讲座': '#9c26b0',
        '免费': '#4caf50'
      }
      return colorMap[tag] || '#999'
    }
    
    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    const handleEventClick = (event) => {
      selectedEvent.value = event
      showEventDetail.value = true
    }
    
    const handleJoinEvent = (event) => {
      showConfirmDialog({
        title: '确认参与',
        message: `确定要参与"${event.title}"活动吗？`
      }).then(() => {
        showSuccessToast('参与成功')
        showEventDetail.value = false
      })
    }
    
    const handleReserveEvent = (event) => {
      showConfirmDialog({
        title: '确认预约',
        message: `确定要预约"${event.title}"活动吗？`
      }).then(() => {
        showSuccessToast('预约成功')
        showEventDetail.value = false
      })
    }
    
    const loadEvents = () => {
      // 模拟API调用
      let filteredEvents = [...mockEvents]
      
      // 分类筛选
      if (activeCategory.value !== 'all') {
        filteredEvents = filteredEvents.filter(e => e.category === activeCategory.value)
      }
      
      // 搜索筛选
      if (searchKeyword.value) {
        filteredEvents = filteredEvents.filter(e => 
          e.title.includes(searchKeyword.value) || 
          e.description.includes(searchKeyword.value)
        )
      }
      
      // 状态筛选
      if (filters.status) {
        filteredEvents = filteredEvents.filter(e => e.status === filters.status)
      }
      
      // 类型筛选
      if (filters.types.length > 0) {
        filteredEvents = filteredEvents.filter(e => 
          e.tags && e.tags.some(tag => filters.types.includes(tag))
        )
      }
      
      return filteredEvents
    }
    
    const onRefresh = () => {
      refreshing.value = true
      eventList.value = []
      finished.value = false
      
      setTimeout(() => {
        const events = loadEvents()
        eventList.value = events
        refreshing.value = false
        finished.value = true
      }, 1000)
    }
    
    const onLoad = () => {
      setTimeout(() => {
        loading.value = false
        finished.value = true
      }, 1000)
    }
    
    // 生命周期
    onMounted(() => {
      onRefresh()
    })
    
    return {
      // 响应式数据
      showSearch,
      searchKeyword,
      activeCategory,
      showFilterPopup,
      showEventDetail,
      selectedEvent,
      currentLocation,
      refreshing,
      loading,
      finished,
      eventList,
      filters,
      categories,
      typeOptions,
      hotSearchWords,
      filterCount,
      
      // 方法
      handleSearch,
      handleClearSearch,
      handleCategoryChange,
      handleLocationFilter,
      resetFilters,
      applyFilters,
      getStatusText,
      getTagColor,
      formatTime,
      handleEventClick,
      handleJoinEvent,
      handleReserveEvent,
      onRefresh,
      onLoad
    }
  }
}
</script>

<style scoped>
.branch-events-container {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 搜索容器 */
.search-container {
  background: #fff;
  height: 100%;
}

.search-content {
  padding: 16px;
}

.hot-search {
  margin-top: 20px;
}

.hot-header {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
}

/* 分类标签 */
.category-tabs {
  background: #fff;
  position: sticky;
  top: 46px;
  z-index: 99;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 90px;
  z-index: 98;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-right: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.filter-item .van-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 活动列表 */
.events-content {
  padding: 0 16px;
}

.events-list {
  margin-top: 12px;
}

.event-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.event-card:active {
  transform: scale(0.98);
}

.event-image {
  position: relative;
  height: 180px;
}

.event-image .van-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #ccc;
}

.event-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.event-status.upcoming {
  background: #ff9800;
}

.event-status.ongoing {
  background: #4caf50;
}

.event-status.ended {
  background: #999;
}

.event-tags {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.event-info {
  padding: 16px;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.event-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.event-meta {
  margin-bottom: 12px;
}

.event-time, .event-location {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.event-time .van-icon, .event-location .van-icon {
  margin-right: 4px;
  font-size: 12px;
}

.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-participants {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participants-count {
  font-size: 12px;
  color: #999;
}

.participants-avatars {
  display: flex;
  gap: 4px;
}

.participant-avatar {
  border: 1px solid #fff;
}

.event-action .status-text {
  font-size: 12px;
  color: #999;
}

/* 筛选弹出层 */
.filter-popup {
  background: #fff;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-checkbox {
  margin-bottom: 8px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
}

/* 活动详情弹出层 */
.event-detail {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  position: relative;
  height: 200px;
}

.detail-image {
  width: 100%;
  height: 100%;
}

.detail-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.detail-status.upcoming {
  background: #ff9800;
}

.detail-status.ongoing {
  background: #4caf50;
}

.detail-status.ended {
  background: #999;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.4;
}

.detail-meta {
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.meta-item .van-icon {
  margin-right: 8px;
  font-size: 14px;
  color: #999;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.section-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.reward-item .van-icon {
  margin-right: 8px;
  color: #ff9800;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.participant-time {
  font-size: 12px;
  color: #999;
}

.detail-actions {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.action-btn {
  width: 100%;
}
</style>
