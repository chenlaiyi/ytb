<template>
  <div class="salesman-container">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="header-left">
        <div class="back-button" @click="goBack">
          <van-icon name="arrow-left" size="20" color="#ffffff" />
        </div>
      </div>
      <div class="header-center">
        <h2 class="page-title">分支机构业务中心</h2>
      </div>
      <div class="header-right">
        <!-- 右侧可以放置其他功能按钮 -->
      </div>
    </div>
    
    <!-- 业务员信息卡片 -->
    <div class="salesman-info-card">
      <div class="salesman-header">
        <div class="salesman-avatar">
          <img :src="salesmanInfo.avatar || '/default-avatar.png'" alt="业务员头像" />
          <div class="salesman-status online">在线</div>
        </div>
        <div class="salesman-details">
          <h3>{{ salesmanInfo.name || '未设置姓名' }}</h3>
          <p class="salesman-level">{{ salesmanInfo.level || '初级业务员' }}</p>
          <p class="salesman-id">工号：{{ salesmanInfo.employee_id || '000000' }}</p>
          <p class="salesman-performance">本月业绩：¥{{ salesmanInfo.month_performance || '0.00' }}</p>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="quick-actions">
      <div class="quick-grid">
        <div class="quick-item" @click="goToInstallations">
          <div class="quick-icon installations">
            <van-icon name="add-o" size="24" />
          </div>
          <div class="quick-text">邀请安装</div>
        </div>
        
        <!-- 邀请取水功能 -->
        <div class="quick-item" @click="goToInviteWater">
          <div class="quick-icon invite-water">
            <van-icon name="qr-invalid" size="24" />
          </div>
          <div class="quick-text">邀请取水</div>
        </div>
        
        <!-- 积分商城功能 -->
        <div class="quick-item" @click="goToPointsMall">
          <div class="quick-icon points-mall">
            <van-icon name="gift-o" size="24" />
          </div>
          <div class="quick-text">积分商城</div>
        </div>
      </div>
    </div>

    <!-- 业绩统计 -->
    <div class="performance-card">
      <div class="performance-header">
        <h3>业绩统计</h3>
      </div>
      <div class="performance-content">
        <div class="performance-grid">
          <div class="performance-item">
            <div class="performance-value">{{ performanceStats.total_customers || 0 }}</div>
            <div class="performance-label">客户总数</div>
          </div>
          <div class="performance-item">
            <div class="performance-value">{{ performanceStats.month_new_customers || 0 }}</div>
            <div class="performance-label">本月新增</div>
          </div>
          <div class="performance-item">
            <div class="performance-value">¥{{ performanceStats.total_commission || '0.00' }}</div>
            <div class="performance-label">累计佣金</div>
          </div>
          <div class="performance-item">
            <div class="performance-value">¥{{ performanceStats.month_commission || '0.00' }}</div>
            <div class="performance-label">本月佣金</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 目标完成进度 -->
    <div class="target-card">
      <div class="target-header">
        <h3>目标完成进度</h3>
        <span class="target-period">本月目标</span>
      </div>
      <div class="target-content">
        <div class="target-item">
          <div class="target-info">
            <span class="target-name">客户开发</span>
            <span class="target-progress">{{ targetProgress.customers.current }}/{{ targetProgress.customers.target }}</span>
          </div>
          <van-progress 
            :percentage="targetProgress.customers.percentage" 
            stroke-width="8" 
            color="#1989fa"
          />
        </div>
        <div class="target-item">
          <div class="target-info">
            <span class="target-name">销售业绩</span>
            <span class="target-progress">¥{{ targetProgress.sales.current }}/¥{{ targetProgress.sales.target }}</span>
          </div>
          <van-progress 
            :percentage="targetProgress.sales.percentage" 
            stroke-width="8" 
            color="#07c160"
          />
        </div>
      </div>
    </div>

    <!-- 客户管理 -->
    <div class="customer-card">
      <div class="customer-header">
        <h3>客户管理</h3>
        <van-button type="primary" size="small" @click="goToCustomerList">
          查看全部
        </van-button>
      </div>
      <div class="customer-content">
        <!-- 客户状态统计 -->
        <div class="customer-stats">
          <div class="customer-stat-item">
            <div class="stat-number">{{ customerStats.potential || 0 }}</div>
            <div class="stat-label">潜在客户</div>
          </div>
          <div class="customer-stat-item">
            <div class="stat-number">{{ customerStats.contacted || 0 }}</div>
            <div class="stat-label">已联系</div>
          </div>
          <div class="customer-stat-item">
            <div class="stat-number">{{ customerStats.converted || 0 }}</div>
            <div class="stat-label">已转化</div>
          </div>
        </div>
        
        <!-- 最近客户列表 -->
        <div class="recent-customers">
          <h4>最近客户</h4>
          <div class="customer-list">
            <div 
              v-for="customer in recentCustomers" 
              :key="customer.id"
              class="customer-item"
              @click="viewCustomerDetail(customer)"
            >
              <div class="customer-avatar">
                <img :src="customer.avatar || '/default-avatar.png'" alt="客户头像" />
              </div>
              <div class="customer-info">
                <div class="customer-name">{{ customer.name }}</div>
                <div class="customer-phone">{{ customer.phone }}</div>
              </div>
              <div class="customer-status">
                <van-tag :type="getCustomerStatusType(customer.status)" size="small">
                  {{ customer.status_text }}
                </van-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- 业绩排行榜 -->
    <div class="ranking-card">
      <div class="ranking-header">
        <h3>业绩排行榜</h3>
        <span class="ranking-period">本月排行</span>
      </div>
      <div class="ranking-content">
        <div 
          v-for="(item, index) in rankingList" 
          :key="item.id"
          class="ranking-item"
          :class="{ 'top-three': index < 3 }"
        >
          <div class="ranking-position">
            <span v-if="index < 3" class="medal">{{ ['🥇', '🥈', '🥉'][index] }}</span>
            <span v-else class="rank-number">{{ index + 1 }}</span>
          </div>
          <div class="ranking-info">
            <div class="ranking-name">{{ item.name }}</div>
            <div class="ranking-performance">¥{{ item.performance }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBranchSalesmanInfo, getBranchSalesmanStats, getBranchSalesmanCustomers, getBranchSalesmanRanking } from '@/api/branchSalesman'
import { showToast } from 'vant'

export default {
  name: 'BranchSalesmanIndex',
  setup() {
    const router = useRouter()
    
    const salesmanInfo = reactive({
      avatar: '',
      name: '',
      level: '',
      employee_id: '',
      month_performance: '0.00'
    })

    const performanceStats = reactive({
      total_customers: 0,
      month_new_customers: 0,
      total_commission: '0.00',
      month_commission: '0.00'
    })

    const targetProgress = reactive({
      customers: {
        current: 0,
        target: 50,
        percentage: 0
      },
      sales: {
        current: '0.00',
        target: '10000.00',
        percentage: 0
      }
    })

    const customerStats = reactive({
      potential: 0,
      contacted: 0,
      converted: 0
    })

    const recentCustomers = ref([])
    const rankingList = ref([])

    // 获取客户状态类型
    const getCustomerStatusType = (status) => {
      const statusMap = {
        'potential': 'default',
        'contacted': 'warning',
        'converted': 'success'
      }
      return statusMap[status] || 'default'
    }

    // 加载数据
    const loadData = async () => {
      try {
        // 获取用户信息和分支机构代码 - 兼容多种登录状态格式
        let userInfo = {}
        let userId = null
        let branchCode = null
        
        // 尝试从多个地方获取用户信息
        try {
          // 优先使用 branch_userInfo
          const branchUserInfo = localStorage.getItem('branch_userInfo')
          if (branchUserInfo) {
            userInfo = JSON.parse(branchUserInfo)
            userId = userInfo.user_id || userInfo.id || userInfo.userId
          }
          
          // 如果没有，尝试使用 userInfo
          if (!userId) {
            const generalUserInfo = localStorage.getItem('userInfo')
            if (generalUserInfo) {
              userInfo = JSON.parse(generalUserInfo)
              userId = userInfo.user_id || userInfo.id || userInfo.userId
            }
          }
          
          // 如果还是没有，尝试直接从 user_id
          if (!userId) {
            userId = localStorage.getItem('user_id')
            if (userId) {
              userInfo = { user_id: userId, id: userId, userId: userId }
            }
          }
        } catch (e) {
          console.error('解析用户信息失败:', e)
        }
        
        // 获取分支机构代码
        branchCode = localStorage.getItem('branch_code') || 'YXY02' // 默认使用YXY02
        
        console.log('业务中心登录状态检查:', {
          userId,
          branchCode,
          userInfo,
          localStorage: {
            branch_userInfo: localStorage.getItem('branch_userInfo'),
            userInfo: localStorage.getItem('userInfo'),
            user_id: localStorage.getItem('user_id'),
            branch_code: localStorage.getItem('branch_code')
          }
        })
        
        if (!userId || !branchCode) {
          showToast('请先登录')
          return
        }

        // 调用真实API获取业务员信息
        const [infoRes, statsRes, customersRes, rankingRes] = await Promise.all([
          getBranchSalesmanInfo({ user_id: userId, branch_code: branchCode }),
          getBranchSalesmanStats({ user_id: userId, branch_code: branchCode }),
          getBranchSalesmanCustomers({ user_id: userId, branch_code: branchCode, limit: 3 }),
          getBranchSalesmanRanking({ branch_code: branchCode, type: 'month' })
        ])

        // 更新业务员基本信息
        if (infoRes.code === 0) {
          Object.assign(salesmanInfo, infoRes.data)
        }

        // 更新统计数据
        if (statsRes.code === 0) {
          Object.assign(performanceStats, statsRes.data)
        }

        // 更新客户数据
        if (customersRes.code === 0) {
          Object.assign(customerStats, customersRes.data.stats)
          recentCustomers.value = customersRes.data.list || []
        }

        // 更新排行榜数据
        if (rankingRes.code === 0) {
          rankingList.value = rankingRes.data || []
        }

        // 计算目标完成进度
        updateTargetProgress()

      } catch (error) {
        console.error('加载数据失败:', error)
        showToast('加载数据失败')
      }
    }

    // 更新目标完成进度
    const updateTargetProgress = () => {
      // 客户开发目标进度
      const customerTarget = 50
      const customerCurrent = performanceStats.month_new_customers
      targetProgress.customers = {
        current: customerCurrent,
        target: customerTarget,
        percentage: Math.min(Math.round((customerCurrent / customerTarget) * 100), 100)
      }

      // 销售业绩目标进度
      const salesTarget = 20000
      const salesCurrent = parseFloat(salesmanInfo.month_performance || '0')
      targetProgress.sales = {
        current: salesCurrent.toFixed(2),
        target: salesTarget.toFixed(2),
        percentage: Math.min(Math.round((salesCurrent / salesTarget) * 100), 100)
      }
    }

    // 跳转到客户列表
    const goToCustomerList = () => {
      showToast('客户列表功能开发中')
    }

    // 查看客户详情
    const viewCustomerDetail = (customer) => {
      showToast(`查看客户：${customer.name}`)
    }

    // 跳转到邀请安装
    const goToInstallations = () => {
      showToast('邀请安装功能开发中')
    }

    // 跳转到邀请取水
    const goToInviteWater = () => {
      router.push('/branch/salesman/invite-water')
    }

    // 跳转到积分商城
    const goToPointsMall = () => {
      window.open('https://h.7dingdong.com/#/?store_id=4350607', '_blank')
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    onMounted(() => {
      loadData()
    })

    return {
      salesmanInfo,
      performanceStats,
      targetProgress,
      customerStats,
      recentCustomers,
      rankingList,
      getCustomerStatusType,
      goToCustomerList,
      viewCustomerDetail,
      goToInstallations,
      goToInviteWater,
      goToPointsMall,
      goBack
    }
  }
}
</script>

<style scoped>
.salesman-container {
  padding: 0;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 页面头部导航栏 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left,
.header-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  text-align: center;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.back-button:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.4);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

/* 业务员信息卡片 */
.salesman-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin: 16px;
  margin-bottom: 16px;
  color: white;
}

/* 调整其他页面元素间距 */
.quick-actions,
.performance-card,
.customer-card,
.ranking-card {
  margin: 0 16px 16px 16px;
}

.salesman-header {
  display: flex;
  align-items: center;
}

.salesman-avatar {
  position: relative;
  margin-right: 16px;
}

.salesman-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.salesman-status {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #07c160;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
}

.salesman-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: bold;
}

.salesman-level {
  margin: 0 0 4px 0;
  font-size: 14px;
  opacity: 0.9;
}

.salesman-id {
  margin: 0 0 4px 0;
  font-size: 12px;
  opacity: 0.8;
}

.salesman-performance {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

/* 业绩统计卡片 */
.performance-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.performance-header h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.performance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.performance-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.performance-label {
  font-size: 12px;
  color: #666;
}

/* 目标进度卡片 */
.target-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.target-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.target-period {
  font-size: 12px;
  color: #666;
}

.target-item {
  margin-bottom: 16px;
}

.target-item:last-child {
  margin-bottom: 0;
}

.target-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.target-name {
  font-size: 14px;
  color: #333;
}

.target-progress {
  font-size: 12px;
  color: #666;
}

/* 客户管理卡片 */
.customer-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.customer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.customer-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.customer-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
  margin: 0 4px;
}

.stat-number {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.recent-customers h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.customer-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.customer-item:active {
  background: #e9ecef;
}

.customer-avatar {
  margin-right: 12px;
}

.customer-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.customer-info {
  flex: 1;
}

.customer-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.customer-phone {
  font-size: 12px;
  color: #666;
}

/* 快捷功能 */
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.quick-item:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: white;
}

.quick-icon.products {
  background: linear-gradient(45deg, #54a0ff, #2e86de);
}

.quick-icon.commissions {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
}

.quick-icon.installations {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
}

.quick-icon.training {
  background: linear-gradient(45deg, #5f27cd, #a55eea);
}

.quick-icon.invite-water {
  background: linear-gradient(45deg, #409eff, #67c23a);
}

.quick-icon.points-mall {
  background: linear-gradient(45deg, #f093fb, #f5576c);
}

.quick-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 排行榜卡片 */
.ranking-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ranking-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.ranking-period {
  font-size: 12px;
  color: #666;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.ranking-item:last-child {
  margin-bottom: 0;
}

.ranking-item.top-three {
  background: linear-gradient(45deg, #fff7e6, #fffbf0);
}

.ranking-position {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.medal {
  font-size: 20px;
}

.rank-number {
  font-size: 14px;
  font-weight: bold;
  color: #666;
}

.ranking-info {
  flex: 1;
}

.ranking-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.ranking-performance {
  font-size: 12px;
  color: #666;
}
</style> 