<template>
  <div class="branch-standalone-layout">
    <!-- 顶部导航栏 -->
    <div class="branch-header">
      <div class="header-left">
        <div class="brand-logo">
          <img :src="branchInfo.display_logo || '/images/logo.png'" alt="Logo" class="logo-img" />
          <div class="brand-text">
            <h1 class="brand-title">{{ branchInfo.display_name }}</h1>
            <span class="brand-subtitle">管理后台</span>
          </div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="branch-code">
          <el-tag type="primary" size="small">{{ branchInfo.code }}</el-tag>
        </div>
      </div>

      <div class="header-right">
        <!-- 通知图标 -->
        <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
          <el-button circle @click="showNotifications">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>

        <!-- 用户下拉菜单 -->
        <el-dropdown @command="handleUserCommand" class="user-dropdown">
          <div class="user-info">
            <el-avatar :size="36" :src="userInfo.avatar">
              {{ userInfo.name?.charAt(0) }}
            </el-avatar>
            <div class="user-text">
              <span class="username">{{ userInfo.name }}</span>
              <span class="user-role">{{ userInfo.role_name || '管理员' }}</span>
            </div>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="wechat-bind">
                <el-icon><ChatDotRound /></el-icon>
                微信绑定
              </el-dropdown-item>
              <el-dropdown-item command="change-password">
                <el-icon><Lock /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主体容器 -->
    <div class="branch-container">
      <!-- 侧边栏菜单 -->
      <div class="branch-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <el-menu
          :default-active="activeMenu"
          class="branch-menu"
          router
          :collapse="sidebarCollapsed"
          :unique-opened="true"
          v-loading="menuLoading"
        >
          <!-- 动态菜单渲染 - 严格区分一级和二级菜单 -->
          <template v-for="menu in menuList" :key="menu.id">
            <!-- 一级菜单：没有子菜单的直接菜单项 -->
            <el-menu-item 
              v-if="!menu.children || menu.children.length === 0"
              :index="`/branch/${branchInfo.id}/${menu.path}`"
              class="level-1-menu"
            >
              <el-icon>
                <component :is="menu.icon || 'Document'" />
              </el-icon>
              <template #title>{{ menu.title }}</template>
            </el-menu-item>
            
            <!-- 一级菜单组：包含二级子菜单 -->
            <el-sub-menu 
              v-else
              :index="menu.path"
              class="level-1-submenu"
            >
              <template #title>
                <el-icon>
                  <component :is="menu.icon || 'Folder'" />
                </el-icon>
                <span>{{ menu.title }}</span>
              </template>
              
              <!-- 二级子菜单：只允许二级，不允许三级嵌套 -->
              <el-menu-item 
                v-for="child in menu.children"
                :key="child.id"
                :index="`/branch/${branchInfo.id}/${child.path}`"
                class="level-2-menu"
              >
                <el-icon>
                  <component :is="child.icon || 'Document'" />
                </el-icon>
                <template #title>{{ child.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
          
          <!-- 如果没有菜单数据，显示默认菜单 -->
          <template v-if="menuList.length === 0 && !menuLoading">
            <el-menu-item :index="`/branch/${branchInfo.id}/dashboard`">
              <el-icon><Odometer /></el-icon>
              <template #title>仪表盘</template>
            </el-menu-item>
          </template>
        </el-menu>

        <!-- 折叠按钮移到底部 -->
        <div class="sidebar-footer">
          <el-button 
            class="collapse-btn"
            @click="toggleSidebar"
            circle
            size="small"
          >
            <el-icon>
              <Expand v-if="sidebarCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="branch-main" :class="{ expanded: sidebarCollapsed }">
        <!-- 内容区域 -->
        <div class="content-wrapper">
          <router-view />
        </div>
      </div>
    </div>

    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawer"
      title="通知消息"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-icon">
            <el-icon :color="notification.type === 'warning' ? '#f56c6c' : '#409eff'">
              <Warning v-if="notification.type === 'warning'" />
              <InfoFilled v-else />
            </el-icon>
          </div>
          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.content }}</p>
            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
          </div>
        </div>
        <div v-if="notifications.length === 0" class="no-notifications">
          <el-empty description="暂无通知" />
        </div>
      </div>
    </el-drawer>

    <!-- 个人信息对话框 -->
    <el-dialog v-model="profileVisible" title="个人信息" width="600px">
      <div class="profile-content">
        <el-form :model="profileForm" label-width="100px">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              action="/api/admin/v1/upload/avatar"
            >
              <el-avatar :size="80" :src="profileForm.avatar">
                {{ profileForm.name?.charAt(0) }}
              </el-avatar>
            </el-upload>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="profileForm.name" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="profileForm.phone" />
          </el-form-item>
          <el-form-item label="微信绑定">
            <div class="wechat-bind-status">
              <el-tag v-if="profileForm.wechat_openid" type="success">已绑定</el-tag>
              <el-tag v-else type="info">未绑定</el-tag>
              <el-button 
                type="primary" 
                size="small" 
                @click="showWechatBind"
                style="margin-left: 10px;"
              >
                {{ profileForm.wechat_openid ? '重新绑定' : '立即绑定' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="profileVisible = false">取消</el-button>
        <el-button type="primary" @click="updateProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 微信绑定对话框 -->
    <el-dialog v-model="wechatBindVisible" title="微信绑定" width="400px">
      <div class="wechat-bind-content">
        <div class="qr-container">
          <div class="qr-code">
            <div id="wechat-bind-qr" class="qr-inner"></div>
          </div>
          <p class="qr-tip">请使用微信扫描二维码完成绑定</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowDown, 
  User, 
  Lock, 
  SwitchButton,
  Bell,
  Expand,
  Fold,
  Setting,
  UserFilled,
  Avatar,
  Money,
  Iphone,
  Trophy,
  Suitcase,
  ChatDotRound,
  Menu,
  ChatLineRound,
  Star,
  Monitor,
  Box,
  CircleCheck,
  Tools,
  Wallet,
  TrendCharts,
  CreditCard,
  Coin,
  DataAnalysis,
  PieChart,
  Odometer,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getBranchMenusByBranchId } from '../api/branchMenu'

const route = useRoute()
const router = useRouter()

// 响应式数据
const sidebarCollapsed = ref(false)
const notificationDrawer = ref(false)
const profileVisible = ref(false)
const wechatBindVisible = ref(false)
const notificationCount = ref(0)

// 分支机构信息
const branchInfo = reactive({
  id: null,
  name: '分支机构',
  code: '',
  logo: '',
  wechat_account: null,
  status: 'active',
  display_name: '分支机构',
  display_logo: '/images/logo.png'
})

// 用户信息
const userInfo = reactive({
  id: null,
  name: '管理员',
  username: '',
  email: '',
  phone: '',
  avatar: '',
  role_name: '管理员',
  wechat_openid: ''
})

// 个人信息表单
const profileForm = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  avatar: '',
  wechat_openid: ''
})

// 通知列表
const notifications = ref([])

// 菜单数据
const menuList = ref([])
const menuLoading = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)



// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('branch_sidebar_collapsed', sidebarCollapsed.value)
}

const showNotifications = () => {
  notificationDrawer.value = true
  fetchNotifications()
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      showProfile()
      break
    case 'wechat-bind':
      showWechatBind()
      break
    case 'change-password':
      showChangePassword()
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 菜单数据验证和标准化 - 确保严格的二级结构
const validateAndNormalizeMenus = (menus) => {
  return menus.map(menu => {
    // 处理API返回的数据格式，可能包含meta字段
    const title = menu.title || (menu.meta && menu.meta.title) || ''
    const icon = menu.icon || (menu.meta && menu.meta.icon) || 'Document'
    
    // 一级菜单基本信息
    const normalizedMenu = {
      id: menu.id,
      title: title,
      icon: icon,
      path: menu.path,
      children: []
    }
    
    // 处理子菜单 - 只允许二级，忽略三级及以上
    if (menu.children && Array.isArray(menu.children)) {
      normalizedMenu.children = menu.children.map(child => {
        const childTitle = child.title || (child.meta && child.meta.title) || ''
        const childIcon = child.icon || (child.meta && child.meta.icon) || 'Document'
        
        return {
          id: child.id,
          title: childTitle,
          icon: childIcon,
          path: child.path
          // 注意：不处理 child.children，确保严格二级结构
        }
      }).filter(child => child.title && child.path) // 过滤无效的子菜单
    }
    
    return normalizedMenu
  }).filter(menu => menu.title && menu.path) // 过滤无效的一级菜单
}

// 获取菜单数据
const fetchMenus = async () => {
  if (!branchInfo.id) return
  
  try {
    menuLoading.value = true
    const response = await getBranchMenusByBranchId(branchInfo.id)
    if (response.code === 0) {
      // 验证和标准化菜单数据
      menuList.value = validateAndNormalizeMenus(response.data || [])
      console.log('获取菜单成功:', response.message)
    } else {
      console.error('获取菜单失败:', response.message)
      // 如果获取失败，使用默认菜单
      menuList.value = validateAndNormalizeMenus(getDefaultMenus())
    }
  } catch (error) {
    console.error('获取菜单异常:', error)
    // 如果获取失败，使用默认菜单
    menuList.value = validateAndNormalizeMenus(getDefaultMenus())
  } finally {
    menuLoading.value = false
  }
}

// 获取默认菜单（作为后备方案）
const getDefaultMenus = () => {
  return [
    {
      id: 1,
      title: '仪表盘',
      icon: 'Odometer',
      path: 'dashboard',
      children: []
    },
    {
      id: 3,
      title: '会员管理',
      icon: 'User',
      path: 'members',
      children: [
        { id: 31, title: 'APP会员', icon: 'Iphone', path: 'members/app-users' },
        { id: 32, title: 'VIP会员', icon: 'Trophy', path: 'members/vip-users' },
        { id: 33, title: '业务员', icon: 'Suitcase', path: 'members/salesman' },
        { id: 34, title: '会员等级', icon: 'Star', path: 'members/levels' }
      ]
    },
    {
      id: 4,
      title: '公众号管理',
      icon: 'ChatDotRound',
      path: 'wechat',
      children: [
        { id: 41, title: '自定义菜单', icon: 'Menu', path: 'wechat/menu' },
        { id: 42, title: '自动回复', icon: 'ChatLineRound', path: 'wechat/auto-reply' },
        { id: 43, title: '粉丝管理', icon: 'Star', path: 'wechat/fans' },
        { id: 44, title: '素材管理', icon: 'Picture', path: 'wechat/materials' },
        { id: 45, title: '消息群发', icon: 'Promotion', path: 'wechat/mass-message' }
      ]
    },
    {
      id: 5,
      title: '净水器',
      icon: 'Tools',
      path: 'devices',
      children: [
        { id: 51, title: '设备库存', icon: 'Box', path: 'devices/inventory' },
        { id: 52, title: '已激活设备', icon: 'CircleCheck', path: 'devices/activated' },
        { id: 56, title: '取水点管理', icon: 'Location', path: 'devices/water-points' },
        { id: 58, title: '安装管理', icon: 'Van', path: 'devices/installation' },
        { id: 57, title: '取水记录', icon: 'Calendar', path: 'devices/check-in-records' },
        { id: 53, title: '设备维护', icon: 'Tools', path: 'devices/maintenance' },
        { id: 54, title: '设备分配', icon: 'Connection', path: 'devices/allocation' },
        { id: 55, title: '设备监控', icon: 'View', path: 'devices/monitoring' }
      ]
    },
    {
      id: 6,
      title: '财务管理',
      icon: 'Wallet',
      path: 'finance',
      children: [
        { id: 61, title: '收入统计', icon: 'TrendCharts', path: 'finance/income' },
        { id: 62, title: '分红记录', icon: 'CreditCard', path: 'finance/dividend' },
        { id: 63, title: '提现管理', icon: 'Coin', path: 'finance/withdraw' },
        { id: 64, title: '费用管理', icon: 'Money', path: 'finance/expenses' },
        { id: 65, title: '对账管理', icon: 'Document', path: 'finance/reconciliation' }
      ]
    },
    {
      id: 7,
      title: '数据统计',
      icon: 'DataAnalysis',
      path: 'statistics',
      children: [
        { id: 71, title: '数据概览', icon: 'PieChart', path: 'statistics/overview' },
        { id: 72, title: '用户增长', icon: 'TrendCharts', path: 'statistics/user-growth' },
        { id: 73, title: '设备使用', icon: 'Monitor', path: 'statistics/device-usage' },
        { id: 74, title: '业绩分析', icon: 'DataBoard', path: 'statistics/performance' },
        { id: 75, title: '财务报表', icon: 'Document', path: 'statistics/financial-report' }
      ]
    },
    {
      id: 8,
      title: '商城管理',
      icon: 'Shop',
      path: 'mall',
      children: [
        { id: 81, title: '商品管理', icon: 'Goods', path: 'mall/products' },
        { id: 82, title: '订单管理', icon: 'List', path: 'mall/orders' },
        { id: 83, title: '分类管理', icon: 'Collection', path: 'mall/categories' },
        { id: 84, title: '库存管理', icon: 'Box', path: 'mall/inventory' },
        { id: 85, title: '促销活动', icon: 'Present', path: 'mall/promotions' }
      ]
    },
    {
      id: 9,
      title: '安装服务',
      icon: 'Tools',
      path: 'installation',
      children: [
        { id: 91, title: '预约管理', icon: 'Calendar', path: 'installation/bookings' },
        { id: 92, title: '安装师傅', icon: 'User', path: 'installation/installers' },
        { id: 93, title: '服务区域', icon: 'Location', path: 'installation/areas' },
        { id: 94, title: '服务评价', icon: 'Star', path: 'installation/reviews' },
        { id: 95, title: '费用结算', icon: 'Money', path: 'installation/settlements' }
      ]
    },
    {
      id: 2,
      title: '系统管理',
      icon: 'Setting',
      path: 'system',
      children: [
        { id: 21, title: '管理员', icon: 'UserFilled', path: 'system/admins' },
        { id: 22, title: '角色权限', icon: 'Avatar', path: 'system/roles' },
        { id: 23, title: '分红配置', icon: 'Money', path: 'system/dividend-config' },
        { id: 26, title: '积分设置', icon: 'StarFilled', path: 'settings/points' },
        { id: 24, title: '菜单管理', icon: 'Menu', path: 'system/menus' },
        { id: 25, title: '系统配置', icon: 'Operation', path: 'system/config' }
      ]
    }
  ]
}

const showProfile = () => {
  Object.assign(profileForm, userInfo)
  profileVisible.value = true
}

// 初始化
onMounted(async () => {
  // 从localStorage恢复侧边栏状态
  const savedCollapsed = localStorage.getItem('branch_sidebar_collapsed')
  if (savedCollapsed !== null) {
    sidebarCollapsed.value = JSON.parse(savedCollapsed)
  }
  
  // 从路由参数获取分支机构代码
  const branchCode = route.params.branchCode
  if (branchCode) {
    branchInfo.code = branchCode
    await fetchBranchInfo()
    await fetchMenus()
  }
})

// 监听分支机构变化
watch(() => branchInfo.id, (newId) => {
  if (newId) {
    fetchMenus()
  }
})

// 获取分支机构信息
const fetchBranchInfo = async () => {
  try {
    const storedBranchInfo = localStorage.getItem('branch_info')
    const storedAdminInfo = localStorage.getItem('branch_admin_info')
    
    if (storedBranchInfo && storedAdminInfo) {
      Object.assign(branchInfo, JSON.parse(storedBranchInfo))
      Object.assign(userInfo, JSON.parse(storedAdminInfo))
      return
    }
    
    if (!storedBranchInfo || !storedAdminInfo) {
      const branchId = route.params.branchId
      
      if (!branchId) {
        console.error('缺少分支机构ID参数')
        return
      }
      
      const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}`)
      
      if (response.code === 0) {
        const branch = response.data
        Object.assign(branchInfo, {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          logo: branch.logo,
          wechat_account: branch.wechat_account,
          status: branch.status
        })
        
        // 如果有关联的公众号，使用公众号信息作为显示信息
        if (branch.wechat_account) {
          branchInfo.display_name = branch.wechat_account.nick_name || branch.wechat_account.name || branch.name
          branchInfo.display_logo = branch.wechat_account.head_img || '/images/logo.png'
        } else {
          branchInfo.display_name = branch.name
          branchInfo.display_logo = '/images/logo.png'
        }
        
        // 保存到本地存储
        localStorage.setItem('branch_info', JSON.stringify({
          ...branch,
          display_name: branchInfo.display_name,
          display_logo: branchInfo.display_logo
        }))
      }
    }
    
    // 获取并应用站点配置
    await fetchAndApplySiteConfig()
  } catch (error) {
    console.error('获取分支机构信息失败:', error.message || error)
  }
}

const showWechatBind = () => {
  wechatBindVisible.value = true
  // 初始化微信绑定二维码
  setTimeout(() => {
    initWechatBindQR()
  }, 100)
}

const showChangePassword = () => {
  router.push(`/branch-standalone/${branchInfo.code}/profile/change-password`)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 清除本地存储
    localStorage.removeItem('branch_token')
    localStorage.removeItem('branch_user')
    localStorage.removeItem('branch_info')
    
    // 跳转到登录页
    router.push(`/branch-login/${branchInfo.code}`)
    
    ElMessage.success('已退出登录')
  } catch (error) {
    // 用户取消
  }
}

const updateProfile = async () => {
  try {
    const response = await request.put('/api/admin/v1/profile', profileForm)
    
    if (response.code === 0) {
      Object.assign(userInfo, profileForm)
      localStorage.setItem('branch_user', JSON.stringify(userInfo))
      profileVisible.value = false
      ElMessage.success('个人信息更新成功')
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新个人信息失败:', error)
    ElMessage.error('更新失败')
  }
}

const handleAvatarSuccess = (response) => {
  if (response.code === 0) {
    profileForm.avatar = response.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('头像上传失败')
  }
}

const initWechatBindQR = async () => {
  const container = document.getElementById('wechat-bind-qr')
  if (!container) return
  
  // 检查用户是否已经绑定微信
  if (userInfo.wechat_openid) {
    showWechatBoundStatus()
    return
  }
  
  try {
    // 获取微信绑定配置
    const response = await request.get('/api/admin/v1/auth/wechat/bind-url')
    
    if (response.code === 0 && response.data) {
      const { js_config, qrcode_url, auth_url, state } = response.data
      
      // 如果支持JS SDK，使用官方二维码
      if (js_config) {
        // 动态加载微信JS SDK
        if (!window.WxLogin) {
          await loadWechatSDK()
        }
        
        // 清空容器并创建微信登录二维码
        container.innerHTML = '<div id="wechat-bind-container" style="width: 200px; height: 200px; margin: 0 auto; overflow: hidden; display: flex; align-items: center; justify-content: center;"></div>'
        
        new window.WxLogin({
          self_redirect: false,
          id: 'wechat-bind-container',
          appid: js_config.appid,
          scope: js_config.scope,
          redirect_uri: js_config.redirect_uri,
          state: js_config.state,
          style: js_config.style || 'black',
          href: js_config.href || ''
        })
        
        // 开始检查绑定状态
        startWechatBindCheck(state)
      } else if (qrcode_url || auth_url) {
        // 使用直接跳转方式
        const bindUrl = qrcode_url || auth_url
        container.innerHTML = `
          <div class="wechat-bind-fallback">
            <div class="bind-qr-placeholder">
              <i class="el-icon-qrcode" style="font-size: 48px; color: #07c160; margin-bottom: 16px;"></i>
              <p style="margin: 0 0 16px; color: #606266;">点击下方按钮完成微信绑定</p>
              <button onclick="window.open('${bindUrl}', '_blank')" style="
                background: #07c160; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 14px;
              ">
                <i class="el-icon-chat-dot-round"></i> 打开微信授权
              </button>
            </div>
          </div>
        `
        
        // 开始检查绑定状态
        startWechatBindCheck(state)
      }
    } else {
      throw new Error('获取微信绑定配置失败')
    }
  } catch (error) {
    console.error('初始化微信绑定失败:', error)
    container.innerHTML = `
      <div class="bind-error">
        <div class="error-placeholder">
          <i class="el-icon-warning" style="font-size: 48px; color: #f56c6c; margin-bottom: 16px;"></i>
          <p style="margin: 0; color: #606266;">微信绑定功能暂时不可用</p>
          <small style="color: #909399;">请稍后重试或联系管理员</small>
        </div>
      </div>
    `
  }
}

// 动态加载微信SDK
const loadWechatSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.WxLogin) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js'
    script.onload = () => {
      console.log('微信SDK加载成功')
      resolve()
    }
    script.onerror = () => {
      console.error('微信SDK加载失败')
      reject(new Error('微信SDK加载失败'))
    }
    document.head.appendChild(script)
  })
}

// 开始检查微信绑定状态
let wechatBindCheckTimer = null
const startWechatBindCheck = (state) => {
  if (wechatBindCheckTimer) {
    clearInterval(wechatBindCheckTimer)
  }
  
  wechatBindCheckTimer = setInterval(async () => {
    try {
      const response = await request.get(`/api/admin/v1/auth/wechat/bind-status?state=${state}`)
      
      if (response.code === 0) {
        if (response.data.status === 'success') {
          // 绑定成功
          clearInterval(wechatBindCheckTimer)
          ElMessage.success('微信绑定成功！')
          
          // 更新用户信息
          if (response.data.user_info) {
            Object.assign(userInfo, response.data.user_info)
            localStorage.setItem('branch_user', JSON.stringify(userInfo))
          }
          
          // 重新初始化绑定区域，显示已绑定状态
          showWechatBoundStatus()
        } else if (response.data.status === 'expired') {
          // 二维码已过期
          clearInterval(wechatBindCheckTimer)
          ElMessage.warning('二维码已过期，请重新获取')
          initWechatBindQR() // 重新生成二维码
        }
      }
    } catch (error) {
      console.error('检查微信绑定状态失败:', error)
    }
  }, 2000) // 每2秒检查一次
}

// 显示微信已绑定状态
const showWechatBoundStatus = () => {
  const container = document.getElementById('wechat-bind-qr')
  if (!container) return
  
  container.innerHTML = `
    <div class="wechat-bound-status">
      <div class="bound-info">
        <i class="el-icon-check" style="font-size: 48px; color: #67c23a; margin-bottom: 16px;"></i>
        <p style="margin: 0 0 8px; color: #606266; font-weight: 600;">微信已绑定</p>
        <p style="margin: 0; color: #909399; font-size: 12px;">可以使用微信扫码登录</p>
      </div>
    </div>
  `
}

const fetchNotifications = async () => {
  try {
    const response = await request.get('/api/admin/v1/notifications')
    
    if (response.code === 0) {
      notifications.value = response.data.data || []
      notificationCount.value = notifications.value.filter(n => !n.read).length
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

const initBranchInfo = async () => {
  try {
    // 首先从本地存储获取分支机构信息
    const storedBranchInfo = localStorage.getItem('branch_info')
    const storedAdminInfo = localStorage.getItem('branch_admin_info')
    
    if (storedBranchInfo) {
      const branch = JSON.parse(storedBranchInfo)
      Object.assign(branchInfo, {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        logo: branch.logo,
        wechat_account: branch.wechat_account,
        status: branch.status || 'active',
        display_name: branch.display_name || branch.name,
        display_logo: branch.display_logo || '/images/logo.png'
      })
    }
    
    if (storedAdminInfo) {
      const admin = JSON.parse(storedAdminInfo)
      Object.assign(userInfo, {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        avatar: admin.avatar,
        last_login_at: admin.last_login_at
      })
    }
    
    // 如果没有本地存储的信息，则从API获取
    if (!storedBranchInfo || !storedAdminInfo) {
      const branchId = route.params.branchId
      
      if (!branchId) {
        console.error('缺少分支机构ID参数')
        return
      }
      
      const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}`)
      
      if (response.code === 0) {
        const branch = response.data
        Object.assign(branchInfo, {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          logo: branch.logo,
          wechat_account: branch.wechat_account,
          status: branch.status
        })
        
        // 如果有关联的公众号，使用公众号信息作为显示信息
        if (branch.wechat_account) {
          branchInfo.display_name = branch.wechat_account.nick_name || branch.wechat_account.name || branch.name
          branchInfo.display_logo = branch.wechat_account.head_img || '/images/logo.png'
        } else {
          branchInfo.display_name = branch.name
          branchInfo.display_logo = '/images/logo.png'
        }
        
        // 保存到本地存储
        localStorage.setItem('branch_info', JSON.stringify({
          ...branch,
          display_name: branchInfo.display_name,
          display_logo: branchInfo.display_logo
        }))
      }
    }
    
    // 获取并应用站点配置
    await fetchAndApplySiteConfig()
  } catch (error) {
    console.error('获取分支机构信息失败:', error.message || error)
  }
}

// 获取并应用站点配置
const fetchAndApplySiteConfig = async () => {
  try {
    const branchId = route.params.branchId
    
    if (!branchId) {
      return
    }
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/system-config`)
    
    if (response.code === 0 && response.data) {
      const config = response.data
      
      // 应用站点配置
      if (config.site) {
        // 设置页面标题
        if (config.site.site_name) {
          document.title = config.site.site_name
        }
        
        // 设置站点图标
        if (config.site.site_logo) {
          updateFavicon(config.site.site_logo)
        }
      }
    }
  } catch (error) {
    console.error('获取站点配置失败:', error.message || error)
  }
}

// 更新站点图标
const updateFavicon = (iconUrl) => {
  try {
    // 确保使用HTTPS协议
    let safeIconUrl = iconUrl
    if (iconUrl && iconUrl.startsWith('http://')) {
      safeIconUrl = iconUrl.replace('http://', 'https://')
    }
    
    // 移除现有的favicon
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    existingFavicons.forEach(favicon => favicon.remove())
    
    // 创建新的favicon
    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/x-icon'
    favicon.href = safeIconUrl
    
    document.head.appendChild(favicon)
  } catch (error) {
    console.error('更新站点图标失败:', error.message || error)
  }
}

const initUserInfo = () => {
  // 从localStorage获取用户信息
  const storedUserInfo = localStorage.getItem('branch_user')
  
  if (storedUserInfo) {
    Object.assign(userInfo, JSON.parse(storedUserInfo))
  }
}

// 初始化侧边栏状态
const initSidebarState = () => {
  const collapsed = localStorage.getItem('branch_sidebar_collapsed')
  if (collapsed !== null) {
    sidebarCollapsed.value = collapsed === 'true'
  }
}

// 组件挂载时初始化
onMounted(async () => {
  // 从路由参数获取分支机构ID
  const branchId = route.params.branchId
  if (branchId) {
    branchInfo.id = branchId
  }
  
  await initBranchInfo()
  // 确保获取站点配置
  await fetchAndApplySiteConfig()
  initUserInfo()
  initSidebarState()
  fetchNotifications()
})

// 监听路由变化
watch(() => route.params.branchCode, async (newCode) => {
  if (newCode && newCode !== branchInfo.code) {
    branchInfo.code = newCode
    await initBranchInfo()
  }
})

// 清理微信绑定检查定时器
onUnmounted(() => {
  if (wechatBindCheckTimer) {
    clearInterval(wechatBindCheckTimer)
  }
})
</script>

<style scoped>
.branch-standalone-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.branch-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 12px;
  color: #86909c;
  line-height: 1;
}

.header-center {
  display: flex;
  align-items: center;
}

.branch-code {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  cursor: pointer;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: #f2f3f5;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #86909c;
  line-height: 1;
}

.dropdown-icon {
  color: #86909c;
  transition: transform 0.2s;
}

.branch-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.branch-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e8eaec;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.branch-sidebar.collapsed {
  width: 64px;
}

.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-top: 1px solid #e8eaec;
  background: #fafbfc;
}

.collapse-btn {
  border: none;
  background: #f2f3f5;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background: #e9ecef;
  transform: scale(1.05);
}

.branch-menu {
  border: none;
  height: calc(100vh - 112px);
  overflow-y: auto;
  flex: 1;
}

.branch-menu:not(.el-menu--collapse) {
  width: 240px;
}

/* 菜单层级样式区分 */
/* 一级菜单样式 */
.level-1-menu {
  font-weight: 500;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: all 0.3s;
}

.level-1-menu:hover {
  border-left-color: #409eff;
  background-color: #ecf5ff !important;
}

.level-1-menu.is-active {
  border-left-color: #409eff;
  background-color: #409eff !important;
  color: white !important;
}

/* 一级菜单组样式 */
.level-1-submenu .el-sub-menu__title {
  font-weight: 500;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: all 0.3s;
}

.level-1-submenu .el-sub-menu__title:hover {
  border-left-color: #409eff;
  background-color: #ecf5ff !important;
}

.level-1-submenu.is-active .el-sub-menu__title {
  border-left-color: #409eff;
  background-color: #409eff !important;
  color: white !important;
}

/* 二级子菜单样式 */
.level-2-menu {
  font-weight: 400;
  font-size: 13px;
  padding-left: 40px !important;
  background-color: #f8f9fa;
  border-left: 2px solid transparent;
  margin-left: 8px;
  margin-right: 8px;
  border-radius: 4px;
  margin-bottom: 2px;
}

.level-2-menu:hover {
  border-left-color: #67c23a;
  background-color: #f0f9ff !important;
}

.level-2-menu.is-active {
  border-left-color: #67c23a;
  background-color: #67c23a !important;
  color: white !important;
}

/* 折叠状态下的菜单样式 */
.el-menu--collapse .level-1-menu,
.el-menu--collapse .level-2-menu {
  border-left: none;
}

/* 菜单图标统一样式 */
.branch-menu .el-menu-item .el-icon,
.branch-menu .el-sub-menu__title .el-icon {
  margin-right: 8px;
  width: 18px;
  height: 18px;
  font-size: 16px;
}

.branch-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s;
}

.branch-main.expanded {
  margin-left: 0;
}



.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f0f2f5;
}

.notification-list {
  padding: 16px 0;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e8eaec;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f2f3f5;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-icon {
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
}

.notification-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #86909c;
}

.no-notifications {
  padding: 40px 0;
}

.profile-content {
  padding: 16px 0;
}

.avatar-uploader {
  display: inline-block;
  cursor: pointer;
}

.wechat-bind-status {
  display: flex;
  align-items: center;
}

.wechat-bind-content {
  text-align: center;
  padding: 20px 0;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  margin-bottom: 16px;
}

.qr-inner {
  width: 200px;
  height: 200px;
  border: 1px solid #e8eaec;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  margin-bottom: 16px;
}

/* 微信绑定二维码样式 */
.qr-inner #wechat-bind-container {
  width: 240px !important;
  height: 240px !important;
  max-width: none !important;
  max-height: none !important;
  border: none !important;
  transform: scale(0.75) !important;
  transform-origin: center center !important;
  overflow: hidden !important;
}

.qr-inner #wechat-bind-container iframe {
  width: 240px !important;
  height: 240px !important;
  max-width: none !important;
  max-height: none !important;
  border: none !important;
  transform: none !important;
}

/* 微信绑定fallback样式 */
.wechat-bind-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.bind-qr-placeholder {
  text-align: center;
  padding: 20px;
}

/* 微信已绑定状态样式 */
.wechat-bound-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.bound-info {
  text-align: center;
  padding: 20px;
}

/* 微信绑定错误状态样式 */
.bind-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.error-placeholder {
  text-align: center;
  padding: 20px;
}

.qr-tip {
  color: #4e5969;
  font-size: 14px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .branch-header {
    padding: 0 16px;
  }
  
  .header-center {
    display: none;
  }
  
  .brand-title {
    font-size: 16px;
  }
  
  .content-wrapper {
    padding: 16px;
  }
  
  .branch-sidebar {
    width: 200px;
  }
  
  .branch-sidebar.collapsed {
    width: 0;
  }
}
</style> 
