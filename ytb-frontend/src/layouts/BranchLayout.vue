<template>
  <div class="branch-layout">
    <!-- 顶部导航栏 -->
    <div class="branch-header">
      <div class="header-left">
        <el-button @click="goBack" type="text" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回总后台
        </el-button>
        <div class="branch-info">
          <h2>{{ branchInfo.name }}管理后台</h2>
          <span class="branch-code">机构代码: {{ branchInfo.code }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            <el-avatar :size="32" :src="userInfo.avatar" />
            <span class="username">{{ userInfo.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 侧边栏和内容区域 -->
    <div class="branch-container">
      <!-- 侧边栏菜单 -->
      <div class="branch-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="branch-menu"
          router
          :collapse="false"
        >
          <el-menu-item :index="`/branch/${branchId}/dashboard`">
            <el-icon><Monitor /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统</span>
            </template>
            <el-menu-item :index="`/branch/${branchId}/system/admins`">后台管理员</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/system/dividend-config`">分红配置</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="members">
            <template #title>
              <el-icon><User /></el-icon>
              <span>会员</span>
            </template>
            <el-menu-item :index="`/branch/${branchId}/members/app-users`">APP会员</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/members/vip-users`">VIP会员</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/members/salesman`">业务员管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="wechat">
            <template #title>
              <el-icon><ChatDotRound /></el-icon>
              <span>公众号</span>
            </template>
            <el-menu-item :index="`/branch/${branchId}/wechat/menu`">自定义菜单</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/wechat/auto-reply`">自动回复</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="devices">
            <template #title>
              <el-icon><Tools /></el-icon>
              <span>净水器</span>
            </template>
            <el-menu-item :index="`/branch/${branchId}/devices/inventory`">设备库存</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/devices/activated`">已激活设备</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/devices/water-points`">取水点管理</el-menu-item>
            <el-menu-item :index="`/branch/${branchId}/devices/installation`">安装管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 主内容区域 -->
      <div class="branch-main">
        <div class="content-wrapper">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowDown, Monitor, Setting, User, ChatDotRound, Tools } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// 获取分支机构ID
const branchId = computed(() => route.params.branchId)

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 分支机构信息
const branchInfo = reactive({
  name: '',
  code: '',
  status: '',
  wechat_account: null
})

// 用户信息
const userInfo = reactive({
  name: '管理员',
  avatar: '/images/default-avatar.png'
})

// 获取分支机构信息
const fetchBranchInfo = async () => {
  try {
    const response = await axios.get(`https://pay.itapgo.com/api/admin/v1/branch-organizations/${branchId.value}`)
    if (response.data.code === 0) {
      Object.assign(branchInfo, response.data.data)
    } else {
      ElMessage.error('获取分支机构信息失败')
    }
  } catch (error) {
    console.error('获取分支机构信息失败:', error)
    ElMessage.error('获取分支机构信息失败')
  }
}

// 返回总后台
const goBack = () => {
  router.push('/system/branch-organizations')
}

// 处理用户操作
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'logout':
      router.push('/login')
      break
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchBranchInfo()
})
</script>

<style scoped>
.branch-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.branch-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  color: #409eff;
  font-size: 14px;
}

.branch-info h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.branch-code {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
}

.branch-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.branch-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.branch-menu {
  border: none;
  height: 100%;
}

.branch-main {
  flex: 1;
  background: #f0f2f5;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

/* 菜单样式优化 */
.branch-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
}

.branch-menu .el-sub-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  padding-left: 50px !important;
}

.branch-menu .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}
</style> 
