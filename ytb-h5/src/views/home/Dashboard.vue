<template>
  <div class="dashboard-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-avatar">
          <VanImage
            round
            width="60"
            height="60"
            :src="userStore.userAvatar || '/app/images/profile/default-avatar.png'"
          />
        </div>
        <div class="user-info">
          <div class="user-name">{{ userStore.userName || '用户' }}</div>
          <div class="user-role">{{ getUserRoleText() }}</div>
        </div>
        <div class="user-action">
          <Button size="small" type="primary" plain @click="$router.push('/user/settings')">设置</Button>
        </div>
      </div>
      
      <!-- 工作台入口 -->
      <div class="workspace-card">
        <div class="card-title">工作台</div>
        <Grid :column-num="2" :border="false" square>
          <GridItem v-for="(workspace, index) in availableWorkspaces" :key="index" :to="workspace.path">
            <Icon :name="workspace.icon" size="32" :color="workspace.color" />
            <div class="text">{{ workspace.name }}</div>
            <div class="desc">{{ workspace.desc }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 快捷功能 -->
      <div class="function-card">
        <div class="card-title">快捷功能</div>
        <Grid :column-num="4" :border="false" square>
          <GridItem v-for="(func, index) in quickFunctions" :key="index" :to="func.path">
            <Icon :name="func.icon" size="28" :color="func.color" />
            <div class="text">{{ func.name }}</div>
          </GridItem>
        </Grid>
      </div>
      
      <!-- 系统通知 -->
      <div class="notice-card" v-if="systemNotices.length > 0">
        <div class="card-title">系统通知</div>
        <div class="notice-list">
          <div class="notice-item" v-for="(notice, index) in systemNotices" :key="index">
            <div class="notice-icon">
              <Icon name="info-o" size="16" color="#1989fa" />
            </div>
            <div class="notice-content">
              <div class="notice-title">{{ notice.title }}</div>
              <div class="notice-time">{{ notice.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Grid, GridItem, Image as VanImage, Icon, Button } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 获取用户角色文本
const getUserRoleText = () => {
  const userInfo = userStore.userInfo
  if (!userInfo) return '普通用户'
  
  if (userInfo.is_admin) return '系统管理员'
  if (userInfo.is_merchant) return '商户'
  if (userInfo.is_vip) return 'VIP会员'
  if (userInfo.is_agent) return '渠道商'
  if (userInfo.is_salesman) return '业务员'
  if (userInfo.is_engineer) return '工程师'
  if (userInfo.is_institution) return '支付机构'
  if (userInfo.is_water_purifier_user) return '净水器用户'
  
  return '普通用户'
}

// 可用的工作台
const availableWorkspaces = computed(() => {
  const workspaces = []
  const userInfo = userStore.userInfo
  
  if (!userInfo) return workspaces
  
  if (userInfo.is_admin) {
    workspaces.push({
      name: '管理员工作台',
      desc: '系统管理',
      icon: 'manager-o',
      color: '#1989fa',
      path: '/admin'
    })
  }
  
  if (userInfo.is_merchant) {
    workspaces.push({
      name: '商户工作台',
      desc: '交易管理',
      icon: 'shop-o',
      color: '#07c160',
      path: '/merchant/dashboard'
    })
  }
  
  if (userInfo.is_vip) {
    workspaces.push({
      name: 'VIP工作台',
      desc: '分红管理',
      icon: 'diamond-o',
      color: '#ff9500',
      path: '/vip'
    })
  }
  
  if (userInfo.is_agent) {
    workspaces.push({
      name: '渠道商工作台',
      desc: '销售管理',
      icon: 'cluster-o',
      color: '#7232dd',
      path: '/agent'
    })
  }
  
  if (userInfo.is_salesman) {
    workspaces.push({
      name: '业务员工作台',
      desc: '客户管理',
      icon: 'contact',
      color: '#ee0a24',
      path: '/salesman'
    })
  }
  
  if (userInfo.is_engineer) {
    workspaces.push({
      name: '工程师工作台',
      desc: '工单管理',
      icon: 'service-o',
      color: '#ff6034',
      path: '/engineer'
    })
  }
  
  if (userInfo.is_institution) {
    workspaces.push({
      name: '支付机构工作台',
      desc: '交易统计',
      icon: 'balance-o',
      color: '#1e4c8f',
      path: '/institution'
    })
  }
  
  return workspaces
})

// 快捷功能
const quickFunctions = ref([
  { name: '社区论坛', icon: 'chat-o', path: '/forum', color: '#646cff' },
  { name: '我的钱包', icon: 'gold-coin-o', path: '/user/wallet', color: '#ff9500' },
  { name: '我的订单', icon: 'orders-o', path: '/user/orders', color: '#1989fa' },
  { name: '收货地址', icon: 'location-o', path: '/user/address', color: '#07c160' },
  { name: '帮助中心', icon: 'question-o', path: '/user/help', color: '#969799' }
])

// 系统通知
const systemNotices = ref([
  {
    title: '系统维护通知',
    time: '2024-01-20 10:00',
    content: '系统将于今晚进行例行维护'
  }
])

onMounted(() => {
  // 页面加载时的初始化操作
})
</script>

<style scoped>
.dashboard-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 12px;
}

/* 用户信息卡片 */
.user-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  margin-right: 15px;
}

.user-info {
  flex: 1;
}

.user-action {
  margin-left: 10px;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.user-role {
  font-size: 14px;
  color: #999;
}

/* 工作台卡片 */
.workspace-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333;
}

/* 功能卡片 */
.function-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* 网格项样式 */
:deep(.van-grid-item__content) {
  padding: 15px 8px;
  flex-direction: column;
}

:deep(.van-grid-item__text) {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
}

.desc {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

/* 通知卡片 */
.notice-card {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.notice-list {
  margin-top: 10px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-icon {
  margin-right: 10px;
  margin-top: 2px;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 12px;
  color: #999;
}
</style> 
