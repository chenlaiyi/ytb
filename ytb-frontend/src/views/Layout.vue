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
            <!-- 提现申请通知图标 -->
            <el-badge 
              :value="withdrawalNotificationCount" 
              :hidden="withdrawalNotificationCount === 0" 
              class="notification-badge"
              style="margin-right: 20px;"
            >
              <el-button 
                circle 
                @click="showWithdrawalNotifications"
                :style="{ animation: withdrawalNotificationCount > 0 ? 'shake 0.5s infinite' : 'none' }"
              >
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>

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

    <!-- 提现申请通知抽屉 -->
    <el-drawer
      v-model="withdrawalDrawerVisible"
      title="提现申请通知"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div 
          v-for="notification in withdrawalNotifications" 
          :key="notification.id"
          class="notification-item"
          @click="goToWithdrawalAudit(notification.id)"
        >
          <div class="notification-icon">
            <el-icon color="#f56c6c" :size="20">
              <Money />
            </el-icon>
          </div>
          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
        </div>
        <el-empty v-if="withdrawalNotifications.length === 0" description="暂无提现申请" />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { getMenuTree } from '@/api/v1/menu';
import { logout } from '@/api/v1/auth';
import { getAdminToken } from '@/utils/admin-token-bridge'
import {
  Menu, Document, Setting, Monitor, UserFilled,
  User, List, Box, Location, Timer, Operation,
  Fold, Expand, ArrowDown, Cellphone, ShoppingCart,
  Plus, Clock, CircleClose,
  HomeFilled, Tools, Shop, Grid, Bell, Money
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
  'fa-mobile-phone': Cellphone
};

export default {
  name: 'Layout',
  components: {
    ...ElementPlusIconsVue,
    Menu, Document, Setting, Monitor, UserFilled,
    User, List, Box, Location, Timer, Operation,
    Fold, Expand, ArrowDown, Cellphone, ShoppingCart,
    Plus, Clock, CircleClose, Grid, Tools, Shop, Bell, Money
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const isCollapse = ref(false);
    const menuRoutes = ref([]);
    
    // 提现申请通知相关
    const withdrawalDrawerVisible = ref(false);
    const withdrawalNotifications = ref([]);
    const withdrawalNotificationCount = ref(0);
    const lastNotificationCount = ref(0);
    let notificationCheckTimer = null;
    let notificationAudio = null;

    const username = computed(() => {
      return store.getters.currentUser.name || '管理员';
    });

    const activeMenu = computed(() => {
      return route.path;
    });

    const breadcrumbList = computed(() => {
      const result = [];
      const currentPath = route.path;

      // 强制输出调试信息

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

      console.warn(`图标 "${iconName}" 未找到，使用默认图标`);
      return Menu; // 默认图标
    };

    // 获取菜单数据
    const fetchMenus = async () => {
      try {
        const response = await getMenuTree();
        if (response.code === 200 || response.code === 0) {
          menuRoutes.value = response.data;

          // 记录所有使用到的图标并检查是否存在
          const icons = [];
          menuRoutes.value.forEach(menu => {
            if (menu.meta?.icon) {
              icons.push({
                name: menu.meta.icon,
                exists: resolveIcon(menu.meta.icon) !== Menu
              });
            }

            if (menu.children) {
              menu.children.forEach(child => {
                if (child.meta?.icon) {
                  icons.push({
                    name: child.meta.icon,
                    exists: resolveIcon(child.meta.icon) !== Menu
                  });
                }
              });
            }
          });

        } else {
          ElMessage.error(response.message || '获取菜单失败');
        }
      } catch (error) {
        console.error('获取菜单失败:', error);
        ElMessage.error('获取菜单失败');
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
            const response = await logout();
            
            if (response && (response.code === 0 || response.code === 200)) {
              await store.dispatch('user/logout');
              ElMessage.success('退出登录成功');
              router.push('/login');
            } else {
              console.error('❌ 退出登录失败，响应码不正确:', response);
              throw new Error(response?.message || '退出登录失败');
            }
          } catch (error) {
            console.error('❌ 退出登录异常:', error);
            ElMessage.error('退出登录失败: ' + (error.message || '未知错误'));
          }
        }).catch(() => {});
      } else if (command === 'profile') {
        // 跳转到个人信息页面
      } else if (command === 'password') {
        // 跳转到修改密码页面
      }
    };

    const handleMenuClick = (path) => {
      // 如果路径为空则不做任何操作
      if (!path) {
        console.warn('菜单路径为空，跳过跳转');
        return;
      }

      try {
        // 规范化路径：确保路径以 / 开头
        let targetPath = path;
        if (!targetPath.startsWith('/') && !targetPath.startsWith('http')) {
          targetPath = '/' + targetPath;
        }

        console.log('菜单点击跳转:', {
          原始路径: path,
          目标路径: targetPath,
          当前路由: route.path
        });

        // 避免重复跳转到当前路由
        if (targetPath === route.path) {
          console.log('已在当前路由，跳过跳转');
          return;
        }

        // 执行路由跳转
        router.push(targetPath).catch(err => {
          // 忽略重复导航错误
          if (err.name !== 'NavigationDuplicated') {
            console.error('路由跳转失败:', err);
            ElMessage.error(`页面跳转失败: ${err.message}`);
          }
        });
      } catch (error) {
        console.error('路由跳转错误:', error);
        ElMessage.error(`页面跳转失败: ${error.message}`);
      }
    };

    // 监听路由变化，强制触发面包屑更新
    watch(() => route.path, (newPath, oldPath) => {
      // 强制触发面包屑计算
      const breadcrumbs = breadcrumbList.value;
    }, { immediate: true });

    // 监听菜单数据变化
    watch(() => menuRoutes.value, (newMenus) => {
      if (newMenus.length > 0) {
        // 强制触发面包屑计算
        const breadcrumbs = breadcrumbList.value;
      }
    }, { immediate: true });

    onMounted(() => {
      fetchMenus();
      
      // 初始化提现申请通知
      initWithdrawalNotification();
      
      // 每30秒检查一次新的提现申请
      notificationCheckTimer = setInterval(checkNewWithdrawals, 30000);
    });
    
    // 组件销毁时清理定时器
    onUnmounted(() => {
      if (notificationCheckTimer) {
        clearInterval(notificationCheckTimer);
      }
    });

    // 初始化提现申请通知
    const initWithdrawalNotification = async () => {
      try {
        console.log('[提现通知] 初始化通知系统...');
        
        // 使用Web Audio API创建提示音，不依赖外部文件
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const createNotificationSound = () => {
          try {
            console.log('[提现通知] 播放提示音...');
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // 频率
            oscillator.type = 'sine'; // 波形类型
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log('[提现通知] 提示音播放成功');
          } catch (error) {
            console.error('[提现通知] 播放提示音失败:', error);
          }
        };
        
        notificationAudio = createNotificationSound;
        
        // 首次检查
        await checkNewWithdrawals();
      } catch (error) {
        console.error('[提现通知] 初始化失败:', error);
      }
    };

    // 检查新的提现申请
    const checkNewWithdrawals = async () => {
      try {
        console.log('[提现通知] 检查新的提现申请...');
        const response = await fetch('/api/admin/v1/withdrawal-audit/check-new', {
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[提现通知] API响应:', data);
          
          if (data.code === 20000) {
            const newCount = data.data.count || 0;
            const newWithdrawals = data.data.withdrawals || [];
            
            console.log('[提现通知] 当前数量:', newCount, '上次数量:', lastNotificationCount.value);
            console.log('[提现通知] 提现列表:', newWithdrawals);
            
            // 更新通知数量
            withdrawalNotificationCount.value = newCount;
            
            // 更新通知列表
            withdrawalNotifications.value = newWithdrawals.map(w => ({
              id: w.withdrawal_id,
              title: `新的提现申请 - ${w.institution_name}`,
              message: `提现金额：¥${w.withdrawal_amount}`,
              time: w.created_at,
              amount: w.withdrawal_amount
            }));
            
            console.log('[提现通知] 格式化后的通知列表:', withdrawalNotifications.value);
            
            // 如果有新的提现申请，播放声音提醒
            if (newCount > lastNotificationCount.value && newCount > 0) {
              console.log('[提现通知] 检测到新申请，准备播放声音');
              playNotificationSound();
            }
            
            lastNotificationCount.value = newCount;
          }
        } else {
          console.error('[提现通知] API请求失败:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[提现通知] 检查失败:', error);
      }
    };

    // 播放提示音
    const playNotificationSound = () => {
      try {
        console.log('[提现通知] playNotificationSound 被调用');
        if (notificationAudio && typeof notificationAudio === 'function') {
          notificationAudio(); // 调用函数播放声音
        } else {
          console.warn('[提现通知] notificationAudio 未初始化或不是函数:', typeof notificationAudio);
        }
      } catch (error) {
        console.error('播放提示音错误:', error);
      }
    };

    // 显示提现通知抽屉
    const showWithdrawalNotifications = () => {
      withdrawalDrawerVisible.value = true;
    };

    // 跳转到提现审核页面
    const goToWithdrawalAudit = (withdrawalId) => {
      withdrawalDrawerVisible.value = false;
      router.push('/shengfutong/withdrawal-audit');
    };

    return {
      isCollapse,
      username,
      activeMenu,
      currentRouteMeta,
      menuRoutes,
      breadcrumbList,
      withdrawalDrawerVisible,
      withdrawalNotifications,
      withdrawalNotificationCount,
      toggleSidebar,
      handleCommand,
      handleMenuClick,
      resolveIcon,
      showWithdrawalNotifications,
      goToWithdrawalAudit
    };
  }
};
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

.aside {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: #ecf0f1;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.is-collapsed {
  width: 69px !important;
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
  transition: margin 0.3s ease;
}

/* 折叠状态下Logo优化 */
.is-collapsed .logo {
  justify-content: center;
  padding: 0;
}

.is-collapsed .logo img {
  margin-right: 0;
}

.is-collapsed .logo span {
  display: none;
}

.menu-container {
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 现代化菜单样式重设计 */
.el-menu-vertical {
  border-right: none;
  background: transparent !important;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 220px;
}

/* 折叠菜单样式完全重写 */
.el-menu--collapse {
  width: 69px !important;
  background: transparent !important;
}

/* 菜单项目基础样式 */
.el-menu-item,
.el-sub-menu__title {
  background: transparent !important;
  border-radius: 12px;
  margin: 6px 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

/* 折叠状态下的菜单项目 */
.el-menu--collapse .el-menu-item,
.el-menu--collapse .el-sub-menu__title {
  width: 52px !important;
  height: 48px !important;
  margin: 8px auto !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 折叠状态下的图标 */
.el-menu--collapse .el-menu-item .el-icon,
.el-menu--collapse .el-sub-menu__title .el-icon {
  font-size: 20px !important;
  color: #ecf0f1 !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 20px !important;
  height: 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 隐藏折叠状态下的文字 */
.el-menu--collapse .el-menu-item span,
.el-menu--collapse .el-sub-menu__title span {
  display: none !important;
}

/* 折叠状态下的悬停效果 */
.el-menu--collapse .el-menu-item:hover,
.el-menu--collapse .el-sub-menu__title:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
  border-color: rgba(64, 158, 255, 0.5);
}

/* 折叠状态下的活跃状态 */
.el-menu--collapse .el-menu-item.is-active,
.el-menu--collapse .el-sub-menu.is-active .el-sub-menu__title {
  background: linear-gradient(135deg, #409EFF, #66b1ff) !important;
  color: #fff !important;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  border-color: #409EFF;
}

.el-menu--collapse .el-menu-item.is-active .el-icon,
.el-menu--collapse .el-sub-menu.is-active .el-sub-menu__title .el-icon {
  color: #fff !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 展开状态下的菜单美化 */
.el-menu-vertical:not(.el-menu--collapse) .el-menu-item,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu__title {
  color: #ecf0f1;
  border-radius: 8px;
  margin: 4px 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item:hover,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu__title:hover {
  background: rgba(64, 158, 255, 0.15) !important;
  border-color: rgba(64, 158, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item.is-active,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu.is-active .el-sub-menu__title {
  background: linear-gradient(135deg, #409EFF, #66b1ff) !important;
  color: #fff !important;
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item .el-icon,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu__title .el-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #bdc3c7;
  transition: color 0.3s ease;
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item:hover .el-icon,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu__title:hover .el-icon {
  color: #409EFF;
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item.is-active .el-icon,
.el-menu-vertical:not(.el-menu--collapse) .el-sub-menu.is-active .el-sub-menu__title .el-icon {
  color: #fff;
}

/* Logo美化增强 */
.logo {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo:hover {
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

/* 子菜单美化 */
.el-menu-vertical .el-menu-item {
  background: rgba(255, 255, 255, 0.03) !important;
  margin: 2px 20px 2px 40px !important;
  border-radius: 6px;
  font-size: 13px;
}

.el-menu-vertical .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  transform: translateX(2px);
}

.el-menu-vertical .el-menu-item.is-active {
  background: rgba(64, 158, 255, 0.2) !important;
  color: #409EFF !important;
  border-left: 3px solid #409EFF;
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
  padding: 16px;
  overflow-y: auto;
}

.main-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

/* 通知相关样式 */
.notification-badge {
  cursor: pointer;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.notification-list {
  padding: 10px;
}

.notification-item {
  display: flex;
  padding: 15px;
  margin-bottom: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #f56c6c;
}

.notification-item:hover {
  background-color: #ecf5ff;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-icon {
  display: flex;
  align-items: center;
  margin-right: 12px;
  width: 40px;
  height: 40px;
  background-color: #fef0f0;
  border-radius: 50%;
  justify-content: center;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.notification-content p {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #606266;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}
</style>
