<template>
  <div class="three-column-layout">
    <!-- 左侧主菜单栏 -->
    <div class="main-sidebar" :class="{ 'collapsed': isCollapse, 'expanded': !isCollapse }" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <div class="logo-section">
        <!-- 隐藏折叠按钮 -->
        <!-- <div class="sidebar-toggle" @click="toggleSidebar">
          <el-icon>
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
        </div> -->
        <div class="logo-img">点</div>
        <span class="logo-text" v-show="!isCollapse">{{ siteSettings.site_name || '点点够管理后台' }}</span>
      </div>
      
      <div class="main-menu-container">
        <!-- 动态生成主菜单 -->
        <div 
          v-for="route in mainMenuRoutes" 
          :key="route.id"
          class="main-menu-item"
          :class="{ 'active': isActiveMainMenu(route) }"
          @click="selectMainMenu(route)"
        >
          <div class="menu-icon">
            <el-icon><component :is="resolveIcon(route.meta?.icon)" /></el-icon>
          </div>
          <span class="menu-title" v-show="!isCollapse">{{ route.title }}</span>
          <span v-if="route.badge" class="menu-badge">{{ route.badge }}</span>
        </div>
      </div>
    </div>

    <!-- 中间二级菜单栏 -->
    <div class="sub-sidebar">
      <div class="sub-menu-header">
        <h3>{{ getActiveMainMenuTitle() }}</h3>
      </div>
      
      <div class="sub-menu-container">
        <!-- 显示当前主菜单的子菜单 -->
        <template v-if="activeMainMenu && activeMainMenu.children">
          <div 
            v-for="child in activeMainMenu.children" 
            :key="child.id"
            class="sub-menu-item"
            :class="{ 'active': isActiveSubMenu(child) }"
            @click="navigateToSubMenu(child)"
          >
            <div class="sub-menu-icon">
              <el-icon><component :is="resolveIcon(child.meta?.icon)" /></el-icon>
            </div>
            <span class="sub-menu-title">{{ child.meta?.title || '未命名菜单' }}</span>
            <div v-if="child.badge" class="sub-menu-badge">{{ child.badge }}</div>
          </div>
        </template>
        
        <!-- 如果没有子菜单，显示当前菜单项 -->
        <template v-else-if="activeMainMenu && !activeMainMenu.children">
          <div 
            class="sub-menu-item active"
            @click="navigateToSubMenu(activeMainMenu)"
          >
            <div class="sub-menu-icon">
              <el-icon><component :is="resolveIcon(activeMainMenu.meta?.icon)" /></el-icon>
            </div>
            <span class="sub-menu-title">{{ activeMainMenu.meta?.title || '未命名菜单' }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area">
      <!-- 顶部导航栏 -->
      <div class="top-header">
        <div class="header-left">
          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">
              <el-icon><HomeFilled /></el-icon>
              首页
            </el-breadcrumb-item>
            <template v-for="(item, index) in breadcrumbList" :key="index">
              <el-breadcrumb-item :to="item.path">{{ item.title }}</el-breadcrumb-item>
            </template>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 通知图标 -->
          <div class="notification-icon" @click="goToNotifications">
            <el-badge :value="unreadNotificationCount" :hidden="unreadNotificationCount === 0" :max="99">
              <el-icon size="18" class="notification-bell">
                <Bell />
              </el-icon>
            </el-badge>
          </div>
          
          <!-- 用户下拉菜单 -->
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <span class="user-info">
              <div class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
              <span class="username">{{ username }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>

    <!-- 语音通知组件 -->
    <VoiceNotification />
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import adminApi from '@/api/admin';
import VoiceNotification from '@/components/VoiceNotification.vue';
import {
  Menu, Document, Setting, Monitor, UserFilled, User, List, Box, Location, Timer, Operation,
  Fold, Expand, ArrowDown, Cellphone, ShoppingCart, Plus, Clock, CircleClose, Lock,
  HomeFilled, Tools, Shop, Grid, Bell, SwitchButton, DataAnalysis, CreditCard,
  House, Wrench, TrendCharts, Management, Briefcase, Picture, RefreshLeft, Calendar,
  ChatDotRound
} from '@element-plus/icons-vue';

// 图标映射表
const iconMap = {
  'Monitor': Monitor,
  'Operation': Operation,
  'User': User,
  'UserFilled': UserFilled,
  'CircleClose': CircleClose,
  'Menu': Menu,
  'Timer': Timer,
  'ShoppingCart': ShoppingCart,
  'List': List,
  'Box': Box,
  'Document': Document,
  'DocumentCheck': Document,
  'DocumentChecked': Document,
  'el-icon-user-filled': UserFilled,
  'el-icon-lock': Lock,
  'Location': Location,
  'Setting': Setting,
  'Cellphone': Cellphone,
  'Clock': Clock,
  'Grid': Grid,
  'Tools': Tools,
  'Shop': Shop,
  'Shopping': ShoppingCart,
  'Goods': Box,
  'dashboard': HomeFilled,
  'Briefcase': Briefcase,
  'GoldMedal': Plus,
  'Avatar': User,
  'Folder': Document,
  'Picture': Picture,
  'fa-users': UserFilled,
  'fa-user': User,
  'fa-dashboard': HomeFilled,
  'fa-shopping-cart': ShoppingCart,
  'fa-list': List,
  'fa-cubes': Box,
  'fa-file-text': Document,
  'fa-tint': Document,
  'fa-map-marker': Location,
  'fa-gears': Setting,
  'fa-clock-o': Clock,
  'fa-gear': Setting,
  'fa-user-circle': UserFilled,
  'fa-mobile-phone': Cellphone,
  'HomeFilled': HomeFilled,
  'Bell': Bell,
  'SwitchButton': SwitchButton,
  'DataAnalysis': DataAnalysis,
  'CreditCard': CreditCard,
  'Wrench': Wrench,
  'TrendCharts': TrendCharts,
  'Management': Management,
  'RefreshLeft': RefreshLeft,
  'Calendar': Calendar,
  'ChatDotRound': ChatDotRound
};

export default {
  name: 'Layout',
  components: {
    ...ElementPlusIconsVue,
    VoiceNotification
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    
    // 响应式数据
    const isCollapse = ref(true); // 默认折叠状态
    const menuRoutes = ref([]);
    const activeMainMenu = ref(null);
    const notifications = ref([]);
    const unreadNotificationCount = ref(0);
    let notificationCheckInterval = null;
    
    // 站点设置
    const siteSettings = ref({
      site_name: '点点够管理后台',
      copyright: '©2025 点点够 版权所有'
    });
    
    // 用户信息
    const username = computed(() => store.getters.username || '管理员');
    
    // 主菜单路由（只包含顶级菜单）
    const mainMenuRoutes = computed(() => {
      return menuRoutes.value.filter(route => !route.parent_id || route.parent_id === 0);
    });
    
    // 面包屑导航
    const breadcrumbList = computed(() => {
      const path = route.path;
      const breadcrumbs = [];
      
      // 根据当前路径生成面包屑
      if (path !== '/dashboard') {
        const pathSegments = path.split('/').filter(segment => segment);
        let currentPath = '';
        
        pathSegments.forEach((segment, index) => {
          currentPath += '/' + segment;
          
          // 查找对应的菜单项
          let title = segment;
          const findMenuByPath = (routes, targetPath) => {
            for (const route of routes) {
              if (route.path === targetPath) {
                return route.meta?.title || route.name;
              }
              if (route.children) {
                const found = findMenuByPath(route.children, targetPath);
                if (found) return found;
              }
            }
            return null;
          };
          
          const foundTitle = findMenuByPath(menuRoutes.value, currentPath);
          if (foundTitle) {
            title = foundTitle;
          }
          
          breadcrumbs.push({
            path: currentPath,
            title: title
          });
        });
      }
      
      return breadcrumbs;
    });

    // 方法
    const resolveIcon = (iconName) => {
      return iconMap[iconName] || Menu;
    };

    const handleMouseEnter = () => {
      // 鼠标悬停时自动展开（仅在折叠状态下）
      if (isCollapse.value) {
        isCollapse.value = false;
      }
    };

    const handleMouseLeave = () => {
      // 鼠标离开时自动折叠（恢复到默认折叠状态）
      if (!isCollapse.value) {
        isCollapse.value = true;
      }
    };

    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value;
    };

    const isActiveMainMenu = (route) => {
      if (!activeMainMenu.value) return false;
      return activeMainMenu.value.id === route.id;
    };

    const selectMainMenu = (route) => {
      activeMainMenu.value = route;
      
      // 如果有子菜单，不直接跳转
      if (route.children && route.children.length > 0) {
        return;
      }
      
      // 如果没有子菜单，直接跳转
      const targetPath = route.path && route.path.startsWith('/') ? route.path : '/' + (route.path || 'menu-' + route.id);
      router.push(targetPath);
    };

    const getActiveMainMenuTitle = () => {
      return activeMainMenu.value ? (activeMainMenu.value.meta?.title || '未命名菜单') : '';
    };

    const isActiveSubMenu = (child) => {
      const targetPath = child.path && child.path.startsWith('/') ? child.path : '/' + (child.path || 'menu-' + child.id);
      return route.path === targetPath;
    };

    const navigateToSubMenu = (child) => {
      const targetPath = child.path && child.path.startsWith('/') ? child.path : '/' + (child.path || 'menu-' + child.id);
      router.push(targetPath);
    };

    const goToNotifications = () => {
      router.push('/notifications');
    };

    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile');
          break;
        case 'password':
          router.push('/password');
          break;
        case 'logout':
          ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            store.dispatch('logout');
            router.push('/login');
          });
          break;
      }
    };

    // 获取菜单数据
    const fetchMenus = async () => {
      try {
        const response = await adminApi.getMenus();
        if (response.data && response.data.code === 200) {
          menuRoutes.value = response.data.data || [];
          
          // 确保菜单数据结构正确
          
          // 等待下一个tick，确保computed属性已更新
          await nextTick();
          
          // 根据当前路由设置活跃的主菜单
          setActiveMainMenuByRoute();
          
                    // 如果仍然没有活跃菜单，强制设置第一个
          if (!activeMainMenu.value && mainMenuRoutes.value.length > 0) {
            activeMainMenu.value = mainMenuRoutes.value[0];
          }
        } else {
          // 如果没有菜单数据，创建一个默认的主菜单以确保二级菜单栏显示
          activeMainMenu.value = {
            id: 'default',
            title: '用户管理',
            meta: { title: '用户管理', icon: 'UserFilled' },
            children: [
              { id: 'app-users', meta: { title: 'APP用户管理', icon: 'User' }, path: '/users/app-users' },
              { id: 'vip-members', meta: { title: 'VIP会员', icon: 'UserFilled' }, path: '/users/vip-members' }
            ]
          };
        }
      } catch (error) {
        console.error('获取菜单失败:', error);
        ElMessage.error('获取菜单失败');
        
        // 即使获取菜单失败，也要设置一个默认的主菜单以显示二级菜单栏
        if (mainMenuRoutes.value.length > 0) {
          activeMainMenu.value = mainMenuRoutes.value[0];
        }
      }
    };

    // 根据当前路由设置活跃的主菜单
    const setActiveMainMenuByRoute = () => {
      const currentPath = route.path;

      
      // 查找包含当前路径的主菜单
      for (const mainMenu of mainMenuRoutes.value) {
        // 检查主菜单本身
        if (mainMenu.path === currentPath) {
          activeMainMenu.value = mainMenu;

          return;
        }
        
        // 检查子菜单
        if (mainMenu.children) {
          for (const child of mainMenu.children) {
            const childPath = child.path && child.path.startsWith('/') ? child.path : '/' + (child.path || 'menu-' + child.id);
            if (childPath === currentPath) {
              activeMainMenu.value = mainMenu;

              return;
            }
          }
        }
        
        // 模糊匹配：检查当前路径是否以主菜单路径开头
        if (mainMenu.path && currentPath.startsWith(mainMenu.path)) {
          activeMainMenu.value = mainMenu;

          return;
        }
      }
      
      // 路径段匹配：根据路径的第一段来匹配主菜单
      const pathSegments = currentPath.split('/').filter(segment => segment);
      if (pathSegments.length > 0) {
        const firstSegment = pathSegments[0];
        for (const mainMenu of mainMenuRoutes.value) {
          if (mainMenu.path && mainMenu.path.includes(firstSegment)) {
            activeMainMenu.value = mainMenu;

            return;
          }
        }
      }
      
      // 如果没有找到匹配的，设置第一个主菜单为活跃状态
      if (mainMenuRoutes.value.length > 0) {
        activeMainMenu.value = mainMenuRoutes.value[0];

      }
    };

    // 获取通知数据
    const fetchNotifications = async () => {
      try {
        // 调用实际的通知API
        const response = await adminApi.getUnreadNotificationCount();
        if (response && response.code === 200) {
          unreadNotificationCount.value = response.data.count || 0;
        } else {
          console.warn('获取未读通知数量失败:', response);
          unreadNotificationCount.value = 0;
        }
      } catch (error) {
        console.error('获取通知失败:', error);
        unreadNotificationCount.value = 0;
      }
    };

    // 监听路由变化
    watch(() => route.path, () => {
      setActiveMainMenuByRoute();
    });

    // 生命周期
    onMounted(() => {
      // 立即设置一个默认的主菜单，确保二级菜单栏显示
      if (!activeMainMenu.value) {
        activeMainMenu.value = {
          id: 'default',
          title: '用户管理',
          meta: { title: '用户管理', icon: 'UserFilled' },
          children: [
            { id: 'app-users', meta: { title: 'APP用户管理', icon: 'User' }, path: '/users/app-users' },
            { id: 'vip-members', meta: { title: 'VIP会员', icon: 'UserFilled' }, path: '/users/vip-members' }
          ]
        };
      }
      
      fetchMenus();
      fetchNotifications();
      
      // 设置定时检查通知
      notificationCheckInterval = setInterval(fetchNotifications, 30000);
    });

    onUnmounted(() => {
      if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
      }
    });

    return {
      isCollapse,
      menuRoutes,
      mainMenuRoutes,
      activeMainMenu,
      breadcrumbList,
      unreadNotificationCount,
      siteSettings,
      username,
      resolveIcon,
      handleMouseEnter,
      handleMouseLeave,
      toggleSidebar,
      isActiveMainMenu,
      selectMainMenu,
      getActiveMainMenuTitle,
      isActiveSubMenu,
      navigateToSubMenu,
      goToNotifications,
      handleCommand
    };
  }
};
</script>

