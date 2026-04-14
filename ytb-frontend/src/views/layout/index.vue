<template>
  <div class="app-container">
    <el-container class="layout-container">
      <el-aside width="220px" class="aside" :class="{ 'is-collapsed': isCollapse }">
        <div class="logo">
          <img src="/images/logo.png" alt="Logo" />
          <span v-if="!isCollapse">点点够管理后台</span>
        </div>

        <div class="menu-container">
          <!-- 动态生成菜单 -->
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            :collapse="isCollapse"
            :collapse-transition="false"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
            router
          >
            <template v-for="route in menuRoutes" :key="route.id">
              <!-- 有子菜单的情况 -->
              <el-sub-menu v-if="route.children && route.children.length > 0" :index="route.id.toString()">
                <template #title>
                  <el-icon>
                    <component :is="resolveIcon(route.meta?.icon)" />
                  </el-icon>
                  <span>{{ route.meta?.title || '未命名菜单' }}</span>
                </template>
                <el-menu-item
                  v-for="child in route.children"
                  :key="child.id"
                  :index="child.path || 'menu-' + child.id"
                  @click="handleMenuClick(child.path)"
                >
                  <el-icon>
                    <component :is="resolveIcon(child.meta?.icon)" />
                  </el-icon>
                  <span>{{ child.meta?.title || '未命名菜单' }}</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- 没有子菜单的情况 -->
              <el-menu-item v-else :index="route.path || 'menu-' + route.id" @click="handleMenuClick(route.path)">
                <el-icon>
                  <component :is="resolveIcon(route.meta?.icon)" />
                </el-icon>
                <span>{{ route.meta?.title || '未命名菜单' }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="sidebar-toggle" @click="toggleSidebar">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <template v-for="(item, index) in breadcrumbList" :key="index">
                <el-breadcrumb-item :to="item.path">{{ item.title }}</el-breadcrumb-item>
              </template>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <!-- 通知下拉菜单 -->
            <el-dropdown @command="handleNotificationCommand" class="notification-dropdown">
              <div class="notification-trigger">
                <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
                  <div class="notification-icon-wrapper">
                    <i class="notification-icon">🔔</i>
                  </div>
                </el-badge>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="notification-menu">
                  <div class="notification-header">
                    <span>系统通知</span>
                    <el-button 
                      v-if="unreadCount > 0" 
                      type="text" 
                      size="small" 
                      @click="markAllAsRead"
                    >
                      全部已读
                    </el-button>
                  </div>
                  <div class="notification-list" v-loading="notificationLoading">
                    <div 
                      v-if="notifications.length === 0" 
                      class="no-notifications"
                    >
                      暂无通知
                    </div>
                    <div 
                      v-for="notification in notifications" 
                      :key="notification.id"
                      class="notification-item"
                      :class="{ 'unread': !notification.is_read }"
                      @click="handleNotificationClick(notification)"
                    >
                      <div class="notification-content">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-text">{{ notification.content }}</div>
                        <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
                      </div>
                      <div v-if="!notification.is_read" class="unread-dot"></div>
                    </div>
                  </div>
                  <div class="notification-footer">
                    <el-dropdown-item command="viewAll">查看全部通知</el-dropdown-item>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 管理员下拉菜单 -->
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                {{ username }} <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="password">修改密码</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import adminApi from '@/api/admin';
import { clearAdminToken } from '@/utils/admin-token-bridge'
import {
  Menu, Document, Setting, Monitor, UserFilled,
  User, List, Box, Location, Timer, Operation,
  Fold, Expand, ArrowDown, Cellphone, ShoppingCart,
  Plus, Clock, CircleClose,
  HomeFilled, Tools, Shop, Grid, Bell
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
  'fa-users': User,
  'fa-user': User,
  'fa-dashboard': HomeFilled,
  'fa-users': UserFilled,
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
  'el-icon-user-filled': UserFilled,
  'el-icon-lock': Setting,
  'Avatar': UserFilled,
  'Bell': Bell
};

export default {
  name: 'Layout',
  components: {
    ...ElementPlusIconsVue,
    Menu, Document, Setting, Monitor, UserFilled,
    User, List, Box, Location, Timer, Operation,
    Fold, Expand, ArrowDown, Cellphone, ShoppingCart,
    Plus, Clock, CircleClose, Grid, Tools, Shop, Bell
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const isCollapse = ref(false);
    const menuRoutes = ref([]);

    // 通知相关状态
    const notifications = ref([]);
    const unreadCount = ref(0);
    const notificationLoading = ref(false);

    const username = computed(() => {
      const currentUser = store.getters.currentUser;
      return (currentUser && currentUser.name) || '管理员';
    });

    const activeMenu = computed(() => {
      return route.path;
    });

    const breadcrumbList = computed(() => {
      const result = [];
      const currentPath = route.path;

      // 如果菜单数据还未加载，返回空数组
      if (menuRoutes.value.length === 0) {
        return result;
      }

      // 遍历一级菜单查找匹配
      for (const menu of menuRoutes.value) {
        // 处理路径，确保格式一致
        let menuPath = menu.path;
        if (!menuPath.startsWith('/')) {
          menuPath = '/' + menuPath;
        }
        
        // 检查一级菜单是否匹配
        if (menuPath === currentPath) {
          result.push({
            title: menu.meta?.title || '未命名菜单',
            path: menuPath
          });
          return result;
        }

        // 检查子菜单是否匹配
        if (menu.children && menu.children.length > 0) {
          for (const child of menu.children) {
            // 处理子菜单路径
            let childPath = child.path;
            if (!childPath.startsWith('/')) {
              childPath = '/' + childPath;
            }
            
            if (childPath === currentPath) {
              // 添加父级菜单
              result.push({
                title: menu.meta?.title || '未命名菜单',
                path: menuPath
              });
              // 添加当前菜单
              result.push({
                title: child.meta?.title || '未命名菜单',
                path: childPath
              });
              return result;
            }
          }
        }
      }

      // 如果没有找到匹配项，使用硬编码的映射
      if (currentPath === '/users/admins') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '后台管理员', path: '/users/admins' });
      } else if (currentPath === '/users/salesmen') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
      } else if (currentPath === '/users/salesmen/statistics') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
        result.push({ title: '业务员统计分析', path: '/users/salesmen/statistics' });
      } else if (currentPath === '/users/salesmen/performance') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
        result.push({ title: '绩效管理', path: '/users/salesmen/performance' });
      } else if (currentPath === '/users/salesmen/training') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
        result.push({ title: '培训管理', path: '/users/salesmen/training' });
      } else if (currentPath === '/users/salesmen/team') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
        result.push({ title: '团队管理', path: '/users/salesmen/team' });
      } else if (currentPath === '/users/salesmen/salary') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '业务员管理', path: '/users/salesmen' });
        result.push({ title: '薪酬管理', path: '/users/salesmen/salary' });
      } else if (currentPath === '/users/app-users') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'APP用户', path: '/users/app-users' });
      } else if (currentPath === '/users/vip-list') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP会员列表', path: '/users/vip-list' });
      } else if (currentPath === '/users/vip-dividends') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP分红管理', path: '/users/vip-dividends' });
      } else if (currentPath === '/users/vip-rankings') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP排行榜', path: '/users/vip-rankings' });
      } else if (currentPath === '/users/vip-balance') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP余额管理', path: '/users/vip-balance' });
      } else if (currentPath === '/users/vip-levels') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP等级管理', path: '/users/vip-levels' });
      } else if (currentPath === '/users/vip-statistics') {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: 'VIP统计分析', path: '/users/vip-statistics' });
      } else if (currentPath.startsWith('/users/')) {
        result.push({ title: '用户管理', path: '/users' });
        result.push({ title: '用户详情', path: currentPath });
      } else if (currentRouteMeta.value.title) {
        // 如果没有找到匹配项，但有当前路由meta信息，至少显示当前页面
        result.push({
          title: currentRouteMeta.value.title,
          path: currentPath
        });
      }
      
      return result;
    });

    const currentRouteMeta = computed(() => {
      // 查找当前路由对应的菜单项
      if (!route.path || menuRoutes.value.length === 0) return {};

      // 在一级菜单中查找
      for (const menu of menuRoutes.value) {
        if (menu.path === route.path) {
          return menu.meta || {};
        }

        // 在子菜单中查找
        if (menu.children) {
          for (const child of menu.children) {
            if (child.path === route.path) {
              return child.meta || {};
            }
          }
        }
      }

      return {};
    });

    // 解析图标名称
    const resolveIcon = (iconName) => {
      if (!iconName) return Menu; // 默认图标

      // 从映射表中获取图标组件
      if (iconMap[iconName]) {
        return iconMap[iconName];
      }

      // 检查ElementPlus图标库
      for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        // 不区分大小写比较
        if (key.toLowerCase() === iconName.toLowerCase()) {
          return component;
        }
      }

      return Menu; // 默认图标
    };

    // 获取菜单数据
    const fetchMenus = async () => {
      try {
        const response = await adminApi.getMenus();

        // 检查响应格式
        if (Array.isArray(response)) {
          // 直接返回了菜单数组
          menuRoutes.value = response;
        } else if (response && response.code === 0 && response.data) {
          // 标准响应格式
          menuRoutes.value = response.data;
        } else if (response && Array.isArray(response.data)) {
          // 数据在data字段中
          menuRoutes.value = response.data;
        } else {
          console.error('菜单数据格式不正确:', response);
          ElMessage.warning('菜单数据格式不正确，使用默认菜单');
          // 使用默认菜单
          menuRoutes.value = getDefaultMenus();
        }

        // 确保每个菜单项都有id
        ensureMenuIds(menuRoutes.value);
        injectMobileHomeMenu(menuRoutes.value);
      } catch (error) {
        console.error('获取菜单失败:', error);
        ElMessage.error('获取菜单失败，使用默认菜单');
        // 使用默认菜单
        menuRoutes.value = getDefaultMenus();
        // 确保每个菜单项都有id
        ensureMenuIds(menuRoutes.value);
        injectMobileHomeMenu(menuRoutes.value);
      }
    };

    // 确保菜单项都有id
    const ensureMenuIds = (menus, parentId = 0) => {
      if (!menus || !Array.isArray(menus)) return;

      menus.forEach((menu, index) => {
        // 如果没有id，生成一个
        if (!menu.id) {
          menu.id = `${parentId}-${index + 1}`;
        }

        // 处理子菜单
        if (menu.children && menu.children.length > 0) {
          ensureMenuIds(menu.children, menu.id);
        }
      });
    };

    // 默认菜单数据
    const getDefaultMenus = () => {
      return [
        {
          id: 1,
          path: 'dashboard',
          meta: { title: '控制面板', icon: 'Monitor' },
          children: []
        },
        {
          id: 2,
          path: 'users',
          meta: { title: '用户管理', icon: 'User' },
          children: [
            { id: 21, path: 'users/app-users', meta: { title: 'APP用户', icon: 'Avatar' } },
            { id: 22, path: 'users/admins', meta: { title: '后台管理员', icon: 'UserFilled' } }
          ]
        },
        {
          id: 3,
          path: 'system',
          meta: { title: '系统管理', icon: 'Setting' },
          children: [
            { id: 31, path: 'system/menu', meta: { title: '菜单管理', icon: 'Menu' } },
            { id: 32, path: 'system/nav', meta: { title: '导航管理', icon: 'Operation' } },
            { id: 33, path: 'system/mobile-home', meta: { title: '移动端首页', icon: 'Cellphone' } },
            { id: 34, path: 'system/api-management', meta: { title: 'API接口管理', icon: 'Connection' } }
          ]
        }
      ];
    };

    const injectMobileHomeMenu = (menus) => {
      if (!Array.isArray(menus)) return;

      const normalize = (path = '') => (path.startsWith('/') ? path : `/${path}`);
      const systemMenu = menus.find((menu) => normalize(menu.path) === '/system');

      if (!systemMenu) {
        menus.push({
          id: Date.now(),
          path: 'system',
          meta: { title: '系统管理', icon: 'Setting' },
          children: [
            { id: Date.now() + 1, path: 'system/mobile-home', meta: { title: '移动端首页', icon: 'Cellphone' } }
          ]
        });
        return;
      }

      if (!Array.isArray(systemMenu.children)) {
        systemMenu.children = [];
      }

      const existsIndex = systemMenu.children.findIndex((child) => normalize(child.path) === '/system/mobile-home');
      if (existsIndex === -1) {
        systemMenu.children.unshift({
          id: Date.now() + systemMenu.children.length + 1,
          path: 'system/mobile-home',
          meta: { title: '移动端首页', icon: 'Cellphone' }
        });
      }
    };

    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value;
    };

    const handleCommand = (command) => {
      if (command === 'logout') {
        ElMessageBox.confirm('确定要退出登录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          try {
            const response = await adminApi.logout();
            
            // 支持不同的响应格式
            if (response && (response.code === 0 || response.code === 200)) {
              // 清除本地存储
              clearAdminToken();
              localStorage.removeItem('user');
              store.dispatch('user/logout');
              ElMessage.success('退出登录成功');
              router.push('/login');
            } else {
              throw new Error(response?.message || '退出登录失败');
            }
          } catch (error) {
            console.error('退出登录失败:', error);
            // 即使API调用失败，也强制清除本地状态
            clearAdminToken();
            localStorage.removeItem('user');
            store.dispatch('user/logout');
            ElMessage.warning('已强制退出登录');
            router.push('/login');
          }
        }).catch(() => {});
      } else if (command === 'profile') {
        // 跳转到个人信息页面
        router.push('/profile');
      } else if (command === 'password') {
        // 跳转到修改密码页面
        router.push('/change-password');
      }
    };

    const handleMenuClick = (path) => {
      // 如果路径为空则不做任何操作
      if (!path) {
        return;
      }

      try {
        // 确保路径不包含重复的前缀
        const cleanPath = path.replace(/^\//, '');

        // 检查路径是否有效，如果是相对路径则拼接前缀
        if (!cleanPath.startsWith('/') && !cleanPath.startsWith('http')) {
          router.push('/' + cleanPath);
        } else {
          router.push(cleanPath);
        }
      } catch (error) {
        console.error('路由跳转错误:', error);
        ElMessage.error(`页面跳转失败: ${error.message}`);
      }
    };

    // 通知相关方法
    // 获取未读通知数量
    const fetchUnreadCount = async () => {
      try {

        const response = await adminApi.getUnreadNotificationCount();
        
        if (response && (response.code === 0 || response.code === 200)) {
          unreadCount.value = response.data?.count || 0;

        } else {
          console.warn('获取未读通知数量失败:', response);
          // 如果是认证失败，不设置为0，保持当前值
          if (response && response.code !== 1002) {
            unreadCount.value = 0;
          }
        }
      } catch (error) {
        console.error('获取未读通知数量失败:', error);
        // 如果是网络错误或其他错误，不设置为0，保持当前值
        // unreadCount.value = 0;
      }
    };

    // 获取最新通知
    const fetchLatestNotifications = async () => {
      try {

        notificationLoading.value = true;
        const response = await adminApi.getLatestNotifications(5);
        
        if (response && (response.code === 0 || response.code === 200)) {
          notifications.value = response.data || [];

        } else {
          console.warn('获取最新通知失败:', response);
          notifications.value = [];
        }
      } catch (error) {
        console.error('获取最新通知失败:', error);
        notifications.value = [];
      } finally {
        notificationLoading.value = false;
      }
    };

    // 标记所有通知为已读
    const markAllAsRead = async () => {
      try {
        const response = await adminApi.markAllNotificationsAsRead();
        if (response && (response.code === 0 || response.code === 200)) {
          ElMessage.success('已标记全部通知为已读');
          unreadCount.value = 0;
          // 更新通知列表中的已读状态
          notifications.value.forEach(notification => {
            notification.is_read = true;
          });
        } else {
          ElMessage.error('操作失败: ' + (response?.message || '未知错误'));
        }
      } catch (error) {
        console.error('标记全部已读失败:', error);
        ElMessage.error('操作失败: ' + (error.message || '网络错误'));
      }
    };

    // 处理通知点击
    const handleNotificationClick = async (notification) => {
      try {
        // 如果未读，标记为已读
        if (!notification.is_read) {
          await adminApi.markNotificationAsRead(notification.id);
          notification.is_read = true;
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }

        // 如果有操作链接，跳转到对应页面
        if (notification.action_url) {
          router.push(notification.action_url);
        } else {
          // 否则跳转到通知详情页面
          router.push(`/system/notifications/${notification.id}`);
        }
      } catch (error) {
        console.error('处理通知点击失败:', error);
      }
    };

    // 处理通知下拉菜单命令
    const handleNotificationCommand = (command) => {
      if (command === 'viewAll') {
        router.push('/system/notifications');
      }
    };

    // 格式化时间
    const formatTime = (timeString) => {
      const time = new Date(timeString);
      const now = new Date();
      const diff = now - time;
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚';
      }
      
      // 小于1小时
      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      }
      
      // 小于1天
      if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      }
      
      // 小于7天
      if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
      }
      
      // 超过7天显示具体日期
      return time.toLocaleDateString();
    };

    onMounted(() => {
      fetchMenus();
      fetchUnreadCount();
      fetchLatestNotifications();
      
      // 定时刷新通知数量（每30秒）
      setInterval(() => {
        fetchUnreadCount();
      }, 30000);
    });

    return {
      isCollapse,
      username,
      activeMenu,
      currentRouteMeta,
      menuRoutes,
      breadcrumbList,
      notifications,
      unreadCount,
      notificationLoading,
      toggleSidebar,
      handleCommand,
      handleMenuClick,
      handleNotificationCommand,
      handleNotificationClick,
      markAllAsRead,
      formatTime,
      resolveIcon
    };
  }
};
</script>

<style scoped>
.app-container {
  height: 100vh;
  margin: 0 !important;
  padding: 0 !important;
  background-color: transparent !important;
}

.layout-container {
  height: 100%;
  margin: 0 !important;
  padding: 0 !important;
}

.aside {
  background-color: #304156;
  color: #bfcbd9;
  transition: width 0.3s;
  overflow: hidden;
}

.is-collapsed {
  width: 64px !important;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.menu-container {
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}

.el-menu-vertical {
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 220px;
}

.el-menu--collapse {
  width: 64px !important;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 60px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.sidebar-toggle {
  font-size: 20px;
  margin-right: 16px;
  cursor: pointer;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.main {
  background-color: #f0f2f5;
  padding: 0;
  overflow-y: auto;
}

.main-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

/* 通知相关样式 */
.notification-dropdown {
  margin-right: 20px;
}

.notification-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.notification-trigger:hover {
  background-color: #f0f2f5;
  transform: translateY(-1px);
}

.notification-badge {
  position: relative;
}

.notification-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.notification-trigger:hover .notification-icon-wrapper {
  background-color: #e3f2fd;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.notification-icon {
  font-size: 16px;
  color: #606266;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
}

.notification-trigger:hover .notification-icon {
  color: #409eff;
}

/* 自定义徽章样式 */
.notification-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
  border: 2px solid #fff;
  font-size: 10px;
  height: 16px;
  line-height: 12px;
  padding: 0 4px;
  min-width: 16px;
  border-radius: 8px;
  right: -2px;
  top: -2px;
  transform: translateX(50%) translateY(-50%);
}

.notification-badge :deep(.el-badge__content.is-fixed) {
  position: absolute;
}

.notification-menu {
  width: 320px;
  max-height: 400px;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f8f9fa;
  font-weight: 500;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.notification-item {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #409eff;
}

.notification-content {
  padding-right: 20px;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread-dot {
  position: absolute;
  top: 16px;
  right: 12px;
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
}

.notification-footer {
  padding: 8px 0;
  border-top: 1px solid #ebeef5;
  background-color: #f8f9fa;
  text-align: center;
}

.notification-footer .el-dropdown-menu__item {
  color: #409eff;
  font-size: 13px;
}

.notification-footer .el-dropdown-menu__item:hover {
  background-color: #ecf5ff;
}
</style>
