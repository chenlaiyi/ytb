<template>
  <div class="branch-home-container">
    <!-- 分支机构头部 -->
    <div class="branch-header">
      <div class="header-bg"></div>
      <div class="branch-info">
        <div class="branch-logo">
          <van-image
            round
            width="60"
            height="60"
            :src="branchInfo.logo || '/images/default-branch-logo.png'"
            :error-content="'LOGO'"
            class="logo-image"
          />
        </div>
        <div class="branch-details">
          <h2 class="branch-name">{{ branchInfo.name || '分支机构' }}</h2>
          <p class="branch-code">机构代码: {{ branchInfo.code || 'XM0001' }}</p>
          <div class="branch-status">
            <span class="status-badge" :class="branchInfo.status">
              {{ getStatusText(branchInfo.status) }}
            </span>
          </div>
        </div>
        <div class="user-avatar" @click="$router.push('/branch/profile')">
          <van-image
            round
            width="40"
            height="40"
            :src="userInfo.avatar || '/images/default-avatar.png'"
            :error-content="'头像'"
          />
        </div>
      </div>
    </div>

    <!-- 快速统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" @click="$router.push('/branch/members')">
        <div class="stat-number">{{ stats.totalMembers }}</div>
        <div class="stat-label">会员总数</div>
      </div>
      <div class="stat-card" @click="$router.push('/branch/orders')">
        <div class="stat-number">{{ stats.todayOrders }}</div>
        <div class="stat-label">今日订单</div>
      </div>
      <div class="stat-card" @click="$router.push('/branch/revenue')">
        <div class="stat-number">¥{{ stats.totalRevenue }}</div>
        <div class="stat-label">累计营收</div>
      </div>
    </div>

    <!-- 分支机构服务 -->
    <div class="section services-section">
      <div class="section-header">
        <span class="section-title">分支机构服务</span>
        <div class="view-all">
          <span>全部服务</span>
          <van-icon name="arrow" />
        </div>
      </div>
      
      <div class="services-grid">
        <div class="service-item" @click="$router.push('/branch/products')">
          <div class="service-icon products">
            <van-icon name="goods-collect-o" size="24" />
          </div>
          <div class="service-text">商品服务</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/booking')">
          <div class="service-icon booking">
            <van-icon name="calendar-o" size="24" />
          </div>
          <div class="service-text">预约服务</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/events')">
          <div class="service-icon events">
            <van-icon name="gift-o" size="24" />
          </div>
          <div class="service-text">活动专区</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/support')">
          <div class="service-icon support">
            <van-icon name="service-o" size="24" />
          </div>
          <div class="service-text">客户服务</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/community')">
          <div class="service-icon community">
            <van-icon name="friends-o" size="24" />
          </div>
          <div class="service-text">社区互动</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/news')">
          <div class="service-icon news">
            <van-icon name="newspaper-o" size="24" />
          </div>
          <div class="service-text">分支动态</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/contact')">
          <div class="service-icon contact">
            <van-icon name="phone-o" size="24" />
          </div>
          <div class="service-text">联系我们</div>
        </div>
        
        <div class="service-item" @click="$router.push('/branch/more')">
          <div class="service-icon more">
            <van-icon name="ellipsis" size="24" />
          </div>
          <div class="service-text">更多</div>
        </div>
      </div>
    </div>

    <!-- 最新动态 -->
    <div class="section news-section">
      <div class="section-header">
        <span class="section-title">最新动态</span>
        <div class="view-all" @click="$router.push('/branch/news')">
          <span>查看更多</span>
          <van-icon name="arrow" />
        </div>
      </div>
      
      <div class="news-list">
        <div 
          v-for="(news, index) in newsList" 
          :key="index"
          class="news-item"
          @click="$router.push(`/branch/news/${news.id}`)"
        >
          <div class="news-content">
            <h4 class="news-title">{{ news.title }}</h4>
            <p class="news-summary">{{ news.summary }}</p>
            <div class="news-meta">
              <span class="news-time">{{ formatTime(news.created_at) }}</span>
              <span class="news-tag" :class="news.type">{{ news.type_text }}</span>
            </div>
          </div>
          <div class="news-image" v-if="news.image">
            <van-image
              width="80"
              height="60"
              :src="news.image"
              fit="cover"
              :error-content="'图片'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 联系信息 -->
    <div class="section contact-section">
      <div class="section-header">
        <span class="section-title">联系我们</span>
      </div>
      
      <div class="contact-info">
        <div class="contact-item" @click="callPhone(branchInfo.phone)">
          <van-icon name="phone-o" size="20" />
          <span>{{ branchInfo.phone || '400-000-0000' }}</span>
        </div>
        <div class="contact-item" @click="openLocation">
          <van-icon name="location-o" size="20" />
          <span>{{ branchInfo.address || '分支机构地址' }}</span>
        </div>
        <div class="contact-item" @click="$router.push('/branch/wechat-menu')">
          <van-icon name="wechat" size="20" />
          <span>微信服务</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

export default {
  name: 'BranchHome',
  setup() {
    const router = useRouter()
    
    const branchInfo = ref({
      name: '厦门分支机构',
      code: 'XM0001',
      logo: '',
      status: 'active',
      phone: '0592-1234567',
      address: '厦门市思明区软件园二期'
    })
    
    const userInfo = ref({
      avatar: ''
    })
    
    const stats = ref({
      totalMembers: 1286,
      todayOrders: 23,
      totalRevenue: '156,789'
    })
    
    const newsList = ref([
      {
        id: 1,
        title: '分支机构春季促销活动开始啦！',
        summary: '全场商品8折起，更有惊喜好礼等你来拿...',
        image: '/images/news1.jpg',
        type: 'promotion',
        type_text: '促销',
        created_at: '2025-06-25 10:30:00'
      },
      {
        id: 2,
        title: '新增便民服务项目',
        summary: '为更好服务社区居民，我们新增了多项便民服务...',
        image: '/images/news2.jpg',
        type: 'service',
        type_text: '服务',
        created_at: '2025-06-24 15:20:00'
      },
      {
        id: 3,
        title: '分支机构获得优秀服务奖',
        summary: '在年度服务评比中，我们荣获优秀服务奖...',
        image: '',
        type: 'award',
        type_text: '荣誉',
        created_at: '2025-06-23 09:15:00'
      }
    ])

    const getStatusText = (status) => {
      const statusMap = {
        'active': '营业中',
        'inactive': '暂停营业',
        'maintenance': '维护中'
      }
      return statusMap[status] || '未知状态'
    }

    const formatTime = (timeStr) => {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return '今天'
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return date.toLocaleDateString()
      }
    }

    const callPhone = (phone) => {
      if (phone) {
        window.location.href = `tel:${phone}`
      } else {
        showToast('电话号码不可用')
      }
    }

    const openLocation = () => {
      // 这里可以集成地图API
      showToast('正在打开地图...')
    }

    const loadBranchInfo = async () => {
      try {
        // 从localStorage获取分支机构信息
        const branchCode = localStorage.getItem('branch_code') || 'XM0001'
        
        // TODO: 调用API获取分支机构详细信息
        console.log('加载分支机构信息:', branchCode)
        
        // 模拟API响应
        branchInfo.value = {
          name: '厦门分支机构',
          code: branchCode,
          logo: '',
          status: 'active',
          phone: '0592-1234567',
          address: '厦门市思明区软件园二期观日路34号'
        }
      } catch (error) {
        console.error('加载分支机构信息失败:', error)
      }
    }

    const loadUserInfo = async () => {
      try {
        // 从localStorage获取用户信息
        const userId = localStorage.getItem('user_id')
        if (userId) {
          // TODO: 调用API获取用户信息
          console.log('加载用户信息:', userId)
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    }

    const loadStats = async () => {
      try {
        // TODO: 调用API获取统计数据
        console.log('加载统计数据')
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    onMounted(() => {
      loadBranchInfo()
      loadUserInfo()
      loadStats()
    })

    return {
      branchInfo,
      userInfo,
      stats,
      newsList,
      getStatusText,
      formatTime,
      callPhone,
      openLocation
    }
  }
}
</script>

<style scoped>
.branch-home-container {
  padding-bottom: 60px;
  background: #f7f8fa;
  min-height: 100vh;
}

/* 分支机构头部 */
.branch-header {
  position: relative;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/images/branch-bg.png') center/cover;
  opacity: 0.1;
}

.branch-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.branch-logo .logo-image {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.branch-details {
  flex: 1;
}

.branch-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.branch-code {
  font-size: 12px;
  opacity: 0.8;
  margin: 0 0 8px 0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
}

.status-badge.active {
  background: rgba(7, 193, 96, 0.2);
  color: #07c160;
}

.user-avatar {
  cursor: pointer;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-top: -20px;
  position: relative;
  z-index: 1;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 通用区块样式 */
.section {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

/* 服务网格 */
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.service-item:active {
  transform: scale(0.95);
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.service-icon.products { background: linear-gradient(45deg, #ff6b6b, #ee5a24); }
.service-icon.booking { background: linear-gradient(45deg, #4834d4, #686de0); }
.service-icon.events { background: linear-gradient(45deg, #ff9ff3, #f368e0); }
.service-icon.support { background: linear-gradient(45deg, #54a0ff, #2e86de); }
.service-icon.community { background: linear-gradient(45deg, #5f27cd, #a55eea); }
.service-icon.news { background: linear-gradient(45deg, #00d2d3, #01a3a4); }
.service-icon.contact { background: linear-gradient(45deg, #feca57, #ff9ff3); }
.service-icon.more { background: linear-gradient(45deg, #48dbfb, #0abde3); }

.service-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 动态列表 */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.news-item:active {
  background: #ebedf0;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-summary {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.news-time {
  font-size: 11px;
  color: #999;
}

.news-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
}

.news-tag.promotion { background: #ff6b6b; }
.news-tag.service { background: #4834d4; }
.news-tag.award { background: #feca57; color: #333; }

.news-image {
  flex-shrink: 0;
}

/* 联系信息 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.contact-item:active {
  background: #ebedf0;
}

.contact-item span {
  font-size: 14px;
  color: #333;
}

@media (max-width: 480px) {
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .stats-cards {
    margin: -15px 12px 0;
    gap: 8px;
  }
  
  .section {
    margin: 8px 12px;
    padding: 12px;
  }
}
</style> 