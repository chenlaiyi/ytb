<template>
  <div class="three-column-layout">
    <!-- 左侧主菜单栏 -->
    <div class="main-sidebar" :class="{ expanded: isExpanded }" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <div class="logo-section">
        <div class="logo-img logo">
          <img v-if="logoExists" :src="logoUrl" alt="Logo" />
          <span v-else>点</span>
        </div>
      </div>
      
      <div class="main-menu-container">
        <div
          v-for="menu in mainMenus"
          :key="menu.id"
          class="main-menu-item"
          :class="{ active: activeMenu === menu.id }"
          @click="selectMainMenu(menu)"
        >
          <div class="menu-icon">
            <el-icon><component :is="resolveIcon(menu?.meta?.icon)" /></el-icon>
          </div>
          <span class="menu-title">{{ menu?.meta?.title || '未命名' }}</span>
        </div>
      </div>
      
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="toggleSidebar">
        <el-icon><component :is="resolveIcon(isExpanded ? 'Fold' : 'Expand')" /></el-icon>
      </div>
    </div>

    <!-- 中间二级菜单栏 -->
    <div
      class="sub-sidebar"
      :class="{
        'no-submenu': !currentSubMenus.length,
        'is-hidden': hideSubSidebar
      }"
    >
      <div class="sub-menu-header">
        <h3>{{ getActiveMenuTitle() }}</h3>
      </div>
      
      <div class="sub-menu-container">
        <template v-if="currentSubMenus.length > 0">
          <div
            v-for="item in currentSubMenus"
            :key="item.id"
            class="sub-menu-item"
            :class="{ active: isSubMenuActive(item) }"
            @click="handleSubMenuClick(item)"
          >
            <div class="sub-menu-icon">
              <el-icon><component :is="resolveIcon(item?.meta?.icon)" /></el-icon>
            </div>
            <span class="sub-menu-title">{{ item?.meta?.title || '未命名' }}</span>
          </div>
        </template>
        
        <template v-else>
          <div class="current-page-info">
            <div class="page-icon">
              <el-icon><component :is="resolveIcon(getCurrentPageIcon())" /></el-icon>
            </div>
            <div class="page-title">{{ currentPageTitle }}</div>
            <div class="page-description">当前页面</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area" :class="{ 'full-width': hideSubSidebar }">
      <!-- 顶部导航栏 -->
      <div class="top-header">
        <div class="header-left">
          <div class="breadcrumb">
            <span>{{ getActiveMenuTitle() }}</span>
            <span v-if="currentPageTitle !== getActiveMenuTitle()" class="breadcrumb-separator">></span>
            <span v-if="currentPageTitle !== getActiveMenuTitle()">{{ currentPageTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- 通知 -->
          <el-dropdown @command="handleNotificationCommand" trigger="click" placement="bottom-end">
            <div class="notification-icon">
              <el-icon><Bell /></el-icon>
              <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="notification-dropdown">
                <div class="notification-header">
                  <span>通知</span>
                  <el-button text size="small" @click="markAllAsRead">全部已读</el-button>
                </div>
                <div class="notification-list">
                  <div 
                    v-for="notification in notifications" 
                    :key="notification.id"
                    class="notification-item"
                    :class="{ unread: !notification.is_read }"
                    @click="handleNotificationCommand(notification.id)"
                  >
                    <div class="notification-icon-wrapper">
                      <el-icon><component :is="getNotificationIcon(notification.type)" /></el-icon>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-desc">{{ notification.content }}</div>
                      <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
                    </div>
                  </div>
                </div>
                <div class="notification-footer">
                  <el-button text @click="viewAllNotifications">查看全部</el-button>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 用户头像和菜单 -->
          <el-dropdown @command="handleCommand" trigger="click" placement="bottom-end">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="userAvatar" :src="userAvatar" alt="头像" />
                <span v-else class="avatar-text">{{ userAvatarText }}</span>
              </div>
              <span class="user-name">{{ userName }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
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
                <el-dropdown-item divided command="logout">
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import request from '../utils/request';
import { clearAdminToken } from '@/utils/admin-token-bridge'
import VoiceNotification from '@/components/VoiceNotification.vue';

export default {
  name: 'ThreeColumnLayout',
  components: {
    ...ElementPlusIconsVue,
    VoiceNotification
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // 响应式数据
    const isExpanded = ref(false);
    const isNavigating = ref(false);
    const pendingNavigation = ref(null);
    const activeMenu = ref('');
    const currentPageTitle = ref('');
    const logoExists = ref(false);
    const logoUrl = ref('');
    const mainMenus = ref([]);
    const allMenus = ref([]);
    const defaultLogoPath = '/admin/images/logo.png';
    const logoVersionToken = (
      (window?.Laravel && window.Laravel.version) ||
      window?.APP_BUILD_VERSION ||
      (typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_ASSET_VERSION : undefined) ||
      Date.now()
    );
    
    // 用户信息
    const userName = ref('管理员');
    const userAvatar = ref('');
    const userAvatarText = ref('管');
    
    // 通知相关
    const notifications = ref([]);
    const unreadNotifications = ref(0);
    
    // 图标映射表 - 使用实际的组件对象
    const iconMap = {
      'Monitor': ElementPlusIconsVue.Monitor,
      'User': ElementPlusIconsVue.User,
      'Avatar': ElementPlusIconsVue.Avatar,
      'ShoppingCart': ElementPlusIconsVue.ShoppingCart,
      'Grid': ElementPlusIconsVue.Grid,
      'Tools': ElementPlusIconsVue.Tools,
      'Shop': ElementPlusIconsVue.Shop,
      'shop': ElementPlusIconsVue.Shop,
      'Money': ElementPlusIconsVue.Money,
      'CreditCard': ElementPlusIconsVue.CreditCard,
      'UserFilled': ElementPlusIconsVue.UserFilled,
      'Promotion': ElementPlusIconsVue.Promotion,
      'OfficeBuilding': ElementPlusIconsVue.OfficeBuilding,
      'Picture': ElementPlusIconsVue.Picture,
      'DataAnalysis': ElementPlusIconsVue.DataAnalysis,
      'List': ElementPlusIconsVue.List,
      'Calendar': ElementPlusIconsVue.Calendar,
      'Upload': ElementPlusIconsVue.Upload,
      'Wallet': ElementPlusIconsVue.Wallet,
      'Star': ElementPlusIconsVue.Star,
      'Connection': ElementPlusIconsVue.Connection,
      'Goods': ElementPlusIconsVue.Goods,
      'Document': ElementPlusIconsVue.Document,
      'Setting': ElementPlusIconsVue.Setting,
      'Van': ElementPlusIconsVue.Van,
      'RefreshLeft': ElementPlusIconsVue.RefreshLeft,
      'RefreshRight': ElementPlusIconsVue.RefreshRight,
      'Select': ElementPlusIconsVue.Select,
      'DataBoard': ElementPlusIconsVue.DataBoard,
      'Briefcase': ElementPlusIconsVue.Briefcase,
      'GoldMedal': ElementPlusIconsVue.GoldMedal,
      'Cpu': ElementPlusIconsVue.Cpu,
      'Location': ElementPlusIconsVue.Location,
      'Coin': ElementPlusIconsVue.Coin,
      'DataLine': ElementPlusIconsVue.DataLine,
      'Notebook': ElementPlusIconsVue.Notebook,
      'Present': ElementPlusIconsVue.Present,
      'ChatDotRound': ElementPlusIconsVue.ChatDotRound,
      'Menu': ElementPlusIconsVue.Menu,
      'Fold': ElementPlusIconsVue.Fold,
      'Expand': ElementPlusIconsVue.Expand,
      'Compass': ElementPlusIconsVue.Compass,
      'Bell': ElementPlusIconsVue.Bell,
      'Key': ElementPlusIconsVue.Key,
      'Clock': ElementPlusIconsVue.Clock,
      'Platform': ElementPlusIconsVue.Platform,
      'user-filled': ElementPlusIconsVue.UserFilled,
      'user': ElementPlusIconsVue.User,
      'key': ElementPlusIconsVue.Key,
      'data-analysis': ElementPlusIconsVue.DataAnalysis,
      'list': ElementPlusIconsVue.List,
      'bell': ElementPlusIconsVue.Bell,
      'clock': ElementPlusIconsVue.Clock,
      'monitor': ElementPlusIconsVue.Monitor,
      'DocumentChecked': ElementPlusIconsVue.DocumentChecked,
      'Avatar': ElementPlusIconsVue.Avatar,
      'Guide': ElementPlusIconsVue.Guide,
      'DataBoard': ElementPlusIconsVue.DataBoard
    };

    const normalizeLegacyKey = (value) => {
      if (!value || typeof value !== 'string') {
        return '';
      }

      let key = value.trim();
      if (!key) {
        return '';
      }

      if (/%[0-9a-fA-F]{2}/.test(key)) {
        try {
          key = decodeURIComponent(key);
        } catch (error) {
          // ignore decode errors and continue with original value
        }
      }

      try {
        const inferred = new URL(key, window.location.origin);
        if (inferred.origin === window.location.origin) {
          if (inferred.hash && inferred.hash !== '#') {
            key = inferred.hash.slice(1);
          } else {
            key = `${inferred.pathname}${inferred.search}`;
          }
        }
      } catch (error) {
        // ignore parse errors and continue with raw value
      }

      key = key.replace(/^[#\/]+/, '');
      key = key.replace(/[#?].*$/, '');
      key = key.replace(/\.(html?|php)$/i, '');
      key = key.replace(/\/(index|default)$/i, '');
      key = key.replace(/\/+$/, '');
      key = key.replace(/^tapp\/admin\/public\//i, '');
      key = key.replace(/^tapp\/admin\//i, '');
      key = key.replace(/^admin\/public\//i, '');

      return key.toLowerCase();
    };

    const legacyRouteOverrideMap = new Map([
      ['mall/merchant', { location: { name: 'MerchantProducts' }, computedPath: '/mall/merchant/products' }],
      ['mall/merchant/list', { location: { name: 'MerchantManagement' }, computedPath: '/mall/merchant/merchants' }],
      ['mall/merchant/products', { location: { name: 'MerchantProducts' }, computedPath: '/mall/merchant/products' }],
      ['mall/merchant/orders', { location: { name: 'MerchantOrders' }, computedPath: '/mall/merchant/orders' }],
      ['mall/merchant/categories', { location: { name: 'MerchantCategories' }, computedPath: '/mall/merchant/categories' }],
      ['mall/merchant/audit', { location: { name: 'MerchantOrders', query: { tab: 'audit' } }, computedPath: '/mall/merchant/orders' }],
      ['mall/merchant/settlement', { location: { name: 'MerchantOrders', query: { tab: 'settlement' } }, computedPath: '/mall/merchant/orders' }],
      ['mall/merchant/statistics', { location: { name: 'MallDashboard' }, computedPath: '/mall/dashboard' }],
      ['admin/game/config', { computedPath: '/poster/game-management/config' }],
      ['game/config', { computedPath: '/poster/game-management/config' }],
      ['admin/game/analytics', { computedPath: '/poster/game-management/analytics' }],
      ['game/analytics', { computedPath: '/poster/game-management/analytics' }],
      ['admin/game/activity', { computedPath: '/poster/game-management/activity' }],
      ['game/activity', { computedPath: '/poster/game-management/activity' }]
    ]);

    const resolveLegacyOverride = (rawValue) => {
      if (!rawValue) {
        return null;
      }

      const candidates = new Set();
      const normalized = normalizeLegacyKey(rawValue);
      if (normalized) {
        candidates.add(normalized);
        candidates.add(normalized.replace(/^tapp\/admin\/public\//, ''));
        candidates.add(normalized.replace(/^tapp\/admin\//, ''));
        candidates.add(normalized.replace(/^admin\/public\//, ''));
        candidates.add(normalized.replace(/^admin\//, ''));
        candidates.add(normalized.replace(/^\/?admin\//, ''));
      }

      const ensureCandidate = (value) => {
        if (!value) {
          return;
        }

        const decodedValue = (() => {
          if (typeof value !== 'string') {
            return '';
          }
          if (/%[0-9a-fA-F]{2}/.test(value)) {
            try {
              return decodeURIComponent(value);
            } catch (error) {
              return value;
            }
          }
          return value;
        })();

        [value, decodedValue].forEach(candidateValue => {
          const normalizedCandidate = normalizeLegacyKey(candidateValue);
          if (normalizedCandidate) {
            candidates.add(normalizedCandidate);
            candidates.add(normalizedCandidate.replace(/^tapp\/admin\/public\//, ''));
            candidates.add(normalizedCandidate.replace(/^tapp\/admin\//, ''));
            candidates.add(normalizedCandidate.replace(/^admin\/public\//, ''));
            candidates.add(normalizedCandidate.replace(/^admin\//, ''));
            candidates.add(normalizedCandidate.replace(/^\/?admin\//, ''));
          }
        });
      };

      try {
        const parsedUrl = new URL(rawValue, window.location.origin);
        const paramKeys = ['route', 'r', 'path', 'module', 'redirect', 'redirect_url', 'target', 'menu', 'page', 'uri'];
        for (const key of paramKeys) {
          const paramValue = parsedUrl.searchParams.get(key);
          if (paramValue) {
            ensureCandidate(paramValue);
          }
        }
      } catch (error) {
        const queryIndex = typeof rawValue === 'string' ? rawValue.indexOf('?') : -1;
        if (queryIndex !== -1) {
          const rawQuery = rawValue.slice(queryIndex + 1);
          const querySegments = rawQuery.split('&');
          for (const segment of querySegments) {
            const [, value] = segment.split('=');
            if (value) {
              ensureCandidate(value);
            }
          }
        }
      }

      for (const candidate of candidates) {
        if (!candidate) {
          continue;
        }

        if (legacyRouteOverrideMap.has(candidate)) {
          return legacyRouteOverrideMap.get(candidate);
        }
      }

      if (normalized && normalized.startsWith('mall/merchant')) {
        return legacyRouteOverrideMap.get('mall/merchant');
      }

      if (typeof rawValue === 'string' && rawValue.toLowerCase().includes('mall/merchant')) {
        return legacyRouteOverrideMap.get('mall/merchant');
      }

      return null;
    };

    const normalizeMenuKey = (value) => {
      if (!value) return '';

      let key = value.toString().trim();
      if (/%[0-9a-fA-F]{2}/.test(key)) {
        try {
          key = decodeURIComponent(key);
        } catch (error) {
          // ignore decode errors
        }
      }

      return key
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        .replace(/^tapp\/admin\/public\//i, '')
        .replace(/^admin\/public\//i, '')
        .replace(/^tapp\/admin\//i, '')
        .toLowerCase();
    };

    const officialMallTitleKeywords = ['官方商城', '官方商場'];
    const officialMallDefaultPath = '/mall/official/dashboard';
    const officialMallDefaultRouteName = 'OfficialDashboard';
    const merchantMallTitleKeywords = ['商户商城', '商戶商城'];
    const merchantMallDefaultPath = '/mall/merchant/dashboard';
    const merchantMallDefaultRouteName = 'MerchantDashboard';

    const isOfficialMallMenu = (menu) => {
      if (!menu || typeof menu !== 'object') {
        return false;
      }

      const rawTitle = menu.meta?.title ?? menu.title;
      if (typeof rawTitle !== 'string') {
        return false;
      }

      return officialMallTitleKeywords.some(keyword => rawTitle.includes(keyword));
    };

    const isMerchantMallMenu = (menu) => {
      if (!menu || typeof menu !== 'object') {
        return false;
      }

      const rawTitle = menu.meta?.title ?? menu.title;
      if (typeof rawTitle !== 'string') {
        return false;
      }

      return merchantMallTitleKeywords.some(keyword => rawTitle.includes(keyword));
    };

    const officialMallSafeTargets = new Set(['dashboard', 'categories', 'orders', 'products', 'logistics', 'users']);
    const normalizeOfficialMallPath = (value) => {
      if (!value || typeof value !== 'string') {
        return value;
      }

      const normalized = normalizeMenuKey(value);
      if (!normalized.startsWith('mall/official')) {
        return value;
      }

      const segments = normalized.split('/').filter(Boolean);
      const thirdSegment = segments[2] || '';
      const normalizedThird = thirdSegment.toLowerCase();

      if (!normalizedThird || ['index', 'home'].includes(normalizedThird)) {
        return officialMallDefaultPath;
      }

      if (normalizedThird === 'dashboard') {
        return officialMallDefaultPath;
      }

      if (!officialMallSafeTargets.has(normalizedThird)) {
        return officialMallDefaultPath;
      }

      return value;
    };

    const merchantMallSafeTargets = new Set(['dashboard', 'products', 'orders', 'categories', 'list', 'merchants', 'logistics', 'users', 'points']);

    const normalizeMerchantMallPath = (value) => {
      if (!value || typeof value !== 'string') {
        return value;
      }

      const normalized = normalizeMenuKey(value);
      if (!normalized.startsWith('mall/merchant')) {
        return value;
      }

      const segments = normalized.split('/').filter(Boolean);
      const thirdSegment = segments[2] || '';
      const normalizedThird = thirdSegment.toLowerCase();

      if (!normalizedThird || ['index', 'home'].includes(normalizedThird)) {
        return merchantMallDefaultPath;
      }

      if (normalizedThird === 'dashboard') {
        return merchantMallDefaultPath;
      }

      if (!merchantMallSafeTargets.has(normalizedThird)) {
        return merchantMallDefaultPath;
      }

      return value;
    };

    const applyMallNormalizers = (value) => normalizeMerchantMallPath(normalizeOfficialMallPath(value));

    const ensureMerchantMallLocation = (location) => {
      if (!location || typeof location !== 'object') {
        return location;
      }

      const nextLocation = { ...location };

      if (typeof nextLocation.path === 'string') {
        const normalizedPath = normalizeMerchantMallPath(nextLocation.path);
        if (normalizedPath !== nextLocation.path) {
          nextLocation.path = normalizedPath;
          delete nextLocation.name;
        }
      }

      if (typeof nextLocation.name === 'string' && nextLocation.name.toLowerCase().includes('merchant') && nextLocation.name !== merchantMallDefaultRouteName) {
        if (nextLocation.name === 'MerchantProducts' && nextLocation.path && normalizeMerchantMallPath(nextLocation.path) !== nextLocation.path) {
          nextLocation.name = merchantMallDefaultRouteName;
        }
      }

      if (!nextLocation.name && nextLocation.path === merchantMallDefaultPath) {
        nextLocation.name = merchantMallDefaultRouteName;
      }

      return nextLocation;
    };

    const ensureOfficialMallLocation = (location) => {
      if (!location || typeof location !== 'object') {
        return location;
      }

      const nextLocation = { ...location };

      if (typeof nextLocation.path === 'string') {
        const normalizedPath = normalizeOfficialMallPath(nextLocation.path);
        if (normalizedPath !== nextLocation.path) {
          nextLocation.path = normalizedPath;
          delete nextLocation.name;
        }
      }

      if (typeof nextLocation.name === 'string' && nextLocation.name.toLowerCase().includes('official') && nextLocation.name !== officialMallDefaultRouteName) {
        if (nextLocation.path && normalizeOfficialMallPath(nextLocation.path) !== nextLocation.path) {
          nextLocation.name = officialMallDefaultRouteName;
        }
      }

      if (!nextLocation.name && nextLocation.path === officialMallDefaultPath) {
        nextLocation.name = officialMallDefaultRouteName;
      }

      return nextLocation;
    };

    const normalizePath = (path) => {
      if (!path) return '';

      let normalized = path.replace(/^\//, '').replace(/\/+$/, '');
      if (/%[0-9a-fA-F]{2}/.test(normalized)) {
        try {
          normalized = decodeURIComponent(normalized);
        } catch (error) {
          // ignore decode errors
        }
      }
      normalized = normalized.replace(/^tapp\/admin\/public\//i, '');
      normalized = normalized.replace(/^admin\/public\//i, '');
      normalized = normalized.replace(/^tapp\/admin\//i, '');
      const override = resolveLegacyOverride(path) || resolveLegacyOverride(normalized);
      if (override) {
        if (override.computedPath) {
          return override.computedPath.replace(/^\//, '');
        }
        if (override.location && override.location.path) {
          return override.location.path.replace(/^\//, '');
        }
      }

      const officialAdjusted = normalizeOfficialMallPath(normalized);
      if (officialAdjusted && officialAdjusted !== normalized) {
        return officialAdjusted.replace(/^\//, '').toLowerCase();
      }

      const adjusted = normalizeMerchantMallPath(officialAdjusted);
      if (adjusted && adjusted !== officialAdjusted) {
        return adjusted.replace(/^\//, '').toLowerCase();
      }

      return officialAdjusted.toLowerCase();
    };
    
    const pathMatches = (current, target) => {
      const currentPath = normalizePath(current);
      const targetPath = normalizePath(target);
      if (!currentPath || !targetPath) return false;
      return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
    };
    
    const findMenuMatch = (path) => {
      const normalizedPath = normalizePath(path);
      let matchedMenu = null;
      let matchedChild = null;
      let matchedChildLen = -1;
      let matchedMenuLen = -1;
      
      for (const menu of mainMenus.value) {
        const menuPath = normalizePath(getMenuPath(menu));
        
        if (menu.children && menu.children.length) {
          for (const child of menu.children) {
            const childPath = normalizePath(getMenuPath(child));
            if (pathMatches(normalizedPath, childPath) && childPath.length > matchedChildLen) {
              matchedMenu = menu;
              matchedChild = child;
              matchedChildLen = childPath.length;
            }
          }
        }
        
        if (pathMatches(normalizedPath, menuPath) && menuPath.length > matchedMenuLen) {
          matchedMenu = menu;
          matchedMenuLen = menuPath.length;
        }
      }
      
      return { menu: matchedMenu, child: matchedChild };
    };
    
    // 解析图标
    const resolveIcon = (iconName) => {
      return iconMap[iconName] || ElementPlusIconsVue.Menu;
    };
    
    // 计算当前子菜单
    const currentSubMenus = computed(() => {
      const activeMenuData = mainMenus.value.find(menu => menu.id === activeMenu.value);
      return activeMenuData ? activeMenuData.children || [] : [];
    });
    
    // 获取当前激活菜单标题
    const getActiveMenuTitle = () => {
      const activeMenuData = mainMenus.value.find(menu => menu.id === activeMenu.value);
      return activeMenuData?.meta?.title || '';
    };

    // 获取当前页面图标
    const getCurrentPageIcon = () => {
      const activeMenuData = mainMenus.value.find(menu => menu.id === activeMenu.value);
      return activeMenuData?.meta?.icon || 'Menu';
    };
    
    // 选择主菜单
    const isExternalLink = (path) => {
      if (!path || typeof path !== 'string') {
        return false;
      }
      
      try {
        const url = new URL(path, window.location.origin);
        return url.origin !== window.location.origin;
      } catch (error) {
        return /^https?:\/\//i.test(path);
      }
    };
    
    const normalizeRouteTarget = (path) => {
      if (!path || typeof path !== 'string') return '';
      if (isExternalLink(path)) return path.trim();
      
      let target = path.trim();
      
      try {
        const candidate = new URL(target, window.location.origin);
        if (candidate.origin === window.location.origin) {
          if (candidate.hash && candidate.hash !== '#') {
            target = candidate.hash.slice(1);
          } else {
            target = `${candidate.pathname}${candidate.search}`;
          }
        }
      } catch (error) {
        // ignore URL parse errors, fallback to raw target
      }
      
      const base = (typeof window !== 'undefined' && window.BASE_URL) ? window.BASE_URL : '';
      const normalizedBase = base.replace(/\/+$/, '');
      
      if (normalizedBase) {
        if (target.startsWith(normalizedBase)) {
          target = target.slice(normalizedBase.length);
        } else {
          const baseWithoutLeading = normalizedBase.replace(/^\//, '');
          if (target.startsWith(baseWithoutLeading)) {
            target = target.slice(baseWithoutLeading.length);
          }
        }
      }
      
      if (target.startsWith('/#')) {
        target = target.slice(2);
      } else if (target.startsWith('#/')) {
        target = target.slice(2);
      } else if (target.startsWith('#')) {
        target = target.slice(1);
      }

      let suffix = '';
      const suffixMatch = target.match(/([\?#].*)$/);
      if (suffixMatch) {
        suffix = suffixMatch[1];
        target = target.slice(0, suffixMatch.index);
      }

      if (target.includes('%')) {
        try {
          target = decodeURIComponent(target);
        } catch (error) {
          // ignore decode errors
        }
      }

      target = target.replace(/^\/+tapp\/admin\/public\/?/i, '/');
      target = target.replace(/^\/+admin\/public\/?/i, '/');
      target = target.replace(/^\/+tapp\/admin\/?/i, '/');
      target = target.replace(/^\/+/, '').replace(/\/{2,}/g, '/');

      if (!target) {
        return `/${suffix.replace(/^\/+/, '')}`;
      }
      
      return `/${target}${suffix}`;
    };
    
    const resolveNavigationTarget = (rawPath) => {
      if (!rawPath || typeof rawPath !== 'string') {
        return null;
      }

      const trimmed = rawPath.trim();
      if (!trimmed) {
        return null;
      }

      if (isExternalLink(trimmed)) {
        return { external: trimmed };
      }

      const override = resolveLegacyOverride(trimmed);
      if (override) {
        if (override.location) {
          return { location: ensureOfficialMallLocation(ensureMerchantMallLocation(override.location)) };
        }
        if (override.computedPath) {
          const path = normalizeRouteTarget(override.computedPath);
          return { location: ensureOfficialMallLocation(ensureMerchantMallLocation({ path })) };
        }
        if (override.path) {
          const path = normalizeRouteTarget(override.path);
          return { location: ensureOfficialMallLocation(ensureMerchantMallLocation({ path })) };
        }
      }

      const normalizedTarget = normalizeRouteTarget(trimmed);
      const officialAdjusted = normalizeOfficialMallPath(normalizedTarget);
      const adjustedTarget = normalizeMerchantMallPath(officialAdjusted);
      return { location: ensureOfficialMallLocation(ensureMerchantMallLocation({ path: adjustedTarget })) };
    };

    const navigateToPath = (path) => {
      if (!path) {
        return;
      }

      if (isNavigating.value) {
        pendingNavigation.value = path;
        return;
      }

      const target = resolveNavigationTarget(path);
      if (!target) {
        return;
      }

      if (target.external) {
        window.open(target.external, '_blank', 'noopener');
        return;
      }

      const resolvedLocation = ensureOfficialMallLocation(ensureMerchantMallLocation(target.location));
      if (!resolvedLocation) {
        return;
      }

      const resolved = router.resolve(resolvedLocation);
      if (!resolved || !resolved.fullPath) {
        console.error('路由解析失败:', resolvedLocation);
        return;
      }

      const desiredPath = normalizePath(resolved.fullPath || resolveNodePath(resolvedLocation.path || ''));

      isNavigating.value = true;

      router.push(resolvedLocation)
        .then(() => {
          const currentRoute = router.currentRoute?.value;
          const currentPath = normalizePath(currentRoute?.fullPath || currentRoute?.path || '');

          if (desiredPath && !pathMatches(currentPath, desiredPath)) {
            console.warn('检测到导航未落在期望路径，尝试强制纠正:', {
              desiredPath,
              currentPath
            });

            const correctionTarget = typeof resolvedLocation === 'object' && resolvedLocation.name
              ? resolvedLocation
              : { path: desiredPath.startsWith('/') ? desiredPath : `/${desiredPath}` };

            router.replace(correctionTarget).catch(replaceError => {
              if (replaceError && replaceError.name !== 'NavigationDuplicated') {
                console.error('强制纠正导航失败:', replaceError);
              }
            });
          }
        })
        .catch(error => {
          if (error && error.name !== 'NavigationDuplicated') {
            console.error('导航到目标路径失败:', {
              originalPath: path,
              resolvedLocation,
              error
            });
          }
        })
        .finally(() => {
          isNavigating.value = false;
          if (pendingNavigation.value) {
            const nextPath = pendingNavigation.value;
            pendingNavigation.value = null;
            navigateToPath(nextPath);
          }
        });
    };

    const getMenuPath = (menu) => {
      if (!menu || typeof menu !== 'object') {
        return '';
      }

      if (typeof menu.computedPath === 'string' && menu.computedPath) {
        return menu.computedPath;
      }

      if (typeof menu.path === 'string' && menu.path.trim()) {
        return menu.path.trim();
      }

      if (typeof menu.meta?.path === 'string' && menu.meta.path.trim()) {
        return menu.meta.path.trim();
      }

      return '';
    };

    const resolveNodePath = (value) => {
      if (!value) {
        return '';
      }

      if (typeof value === 'string') {
        return normalizeMerchantMallPath(value.trim());
      }

      if (typeof value === 'object') {
        if (typeof value.path === 'string') {
          return normalizeMerchantMallPath(value.path.trim());
        }

        if (typeof value.name === 'string' && value.name) {
          try {
            const resolved = router.resolve({
              name: value.name,
              params: value.params || {},
              query: value.query || {}
            });
            return normalizeMerchantMallPath(resolved?.path || '');
          } catch (error) {
            console.warn('无法解析命名路由:', value.name, error);
          }
        }
      }

      return '';
    };

    const resolveMenuPathValue = (rawPath, parentPath = '') => {
      if (!rawPath || typeof rawPath !== 'string') {
        return '';
      }

      const trimmed = rawPath.trim();
      if (!trimmed) {
        return '';
      }

      if (isExternalLink(trimmed)) {
        return trimmed;
      }

      const override = resolveLegacyOverride(trimmed);

      if (override) {
        if (override.computedPath) {
          return applyMallNormalizers(normalizeRouteTarget(override.computedPath));
        }
        if (override.path) {
          return applyMallNormalizers(normalizeRouteTarget(override.path));
        }
      }

      const merchantAdjusted = normalizeMerchantMallPath(trimmed);
      if (merchantAdjusted !== trimmed) {
        return normalizeRouteTarget(merchantAdjusted);
      }

      if (trimmed.startsWith('/')) {
        return applyMallNormalizers(normalizeRouteTarget(trimmed));
      }

      const parentNormalized = parentPath
        ? parentPath.replace(/^\/+/, '').replace(/\/+$/, '')
        : '';

      if (!parentNormalized) {
        return applyMallNormalizers(normalizeRouteTarget(trimmed));
      }

      if (
        trimmed === parentNormalized ||
        trimmed.startsWith(`${parentNormalized}/`)
      ) {
        return applyMallNormalizers(normalizeRouteTarget(trimmed));
      }

      return applyMallNormalizers(normalizeRouteTarget(`${parentNormalized}/${trimmed}`));
    };

    const enhanceMenuNode = (menu, parentPath = '') => {
      if (!menu || typeof menu !== 'object') {
        return menu;
      }

      const enhanced = { ...menu };
      const rawPath = typeof menu.path === 'string' ? menu.path : '';
      const computedPath = resolveMenuPathValue(rawPath, parentPath);

      enhanced.computedPath = computedPath;

      if (Array.isArray(menu.children) && menu.children.length > 0) {
        const nextBase = computedPath && !isExternalLink(computedPath)
          ? computedPath
          : parentPath;
        enhanced.children = menu.children.map(child => enhanceMenuNode(child, nextBase));
      }

      return enhanced;
    };

    const enhanceMenuTree = (menus) => {
      if (!Array.isArray(menus)) {
        return [];
      }
      return menus.map(menu => enhanceMenuNode(menu));
    };

    const relocateBranchMenuToSystem = (menus) => {
      if (!Array.isArray(menus)) {
        return menus;
      }

      const isSystemMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'system' || title.includes('系统');
      };

      const isBranchMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'branch' || title.includes('分支');
      };

      const systemMenu = menus.find(isSystemMenu);
      const branchIndex = menus.findIndex(isBranchMenu);

      if (!systemMenu) {
        return menus;
      }

      const tabPaths = [
        '/system/branch-organizations',
        '/system/branch-menus',
        '/system/branch-dividends',
        '/system/wechat-accounts'
      ];

      const cleanSystemChildren = (sourceMenu) => {
        if (!sourceMenu || !Array.isArray(sourceMenu.children)) return;
        sourceMenu.children = sourceMenu.children.filter(child => {
          const childPath = normalizePath(child?.computedPath || child?.path || '');
          return !tabPaths.includes(childPath);
        });
      };

      const ensureBranchChild = (sourceMenu, childMeta = {}) => {
        if (!sourceMenu) return;
        sourceMenu.children = Array.isArray(sourceMenu.children) ? sourceMenu.children : [];
        const exists = sourceMenu.children.some(child => normalizePath(child?.computedPath || child?.path || '') === '/system/branch-center');
        if (!exists) {
          sourceMenu.children.push({
            id: childMeta.id || 'system-branch',
            name: 'SystemBranchWorkspace',
            path: '/system/branch-center',
            computedPath: '/system/branch-center',
            meta: {
              title: '分支机构',
              icon: 'office-building',
              ...(childMeta.meta || {})
            }
          });
        }
      };

      if (Array.isArray(systemMenu.children)) {
        cleanSystemChildren(systemMenu);
      }

      if (branchIndex !== -1) {
        const branchMenu = menus[branchIndex];
        ensureBranchChild(systemMenu, branchMenu);
        menus.splice(branchIndex, 1);
      } else {
        ensureBranchChild(systemMenu);
      }

      return menus;
    };

    const relocateCrmMenuToUsers = (menus) => {
      if (!Array.isArray(menus)) {
        return menus;
      }

      const isUsersMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'users' || title.includes('用户');
      };

      const isCrmMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'crm' || title.toUpperCase().includes('CRM');
      };

      const userMenu = menus.find(isUsersMenu);
      const crmIndex = menus.findIndex(isCrmMenu);

      if (!userMenu) {
        return menus;
      }

      userMenu.children = Array.isArray(userMenu.children) ? userMenu.children : [];

      const existingPaths = new Set(
        userMenu.children.map(child => normalizePath(child?.computedPath || child?.path || ''))
      );

      const ensureCrmChild = (targetPath, childMeta = {}) => {
        if (!targetPath || existingPaths.has(targetPath)) {
          return;
        }
        existingPaths.add(targetPath);
        userMenu.children.push({
          id: childMeta.id || `users-crm-${targetPath}`,
          name: childMeta.name || `UsersCrm${targetPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          path: targetPath,
          computedPath: targetPath,
          meta: {
            title: childMeta.meta?.title || childMeta.title || (targetPath.includes('wechat') ? '企微客户' : '生日祝福'),
            icon: childMeta.meta?.icon || (targetPath.includes('wechat') ? 'ChatDotRound' : 'Present')
          }
        });
      };

      if (crmIndex !== -1) {
        const crmMenu = menus[crmIndex];
        const crmChildren = Array.isArray(crmMenu.children) ? crmMenu.children : [];
        crmChildren.forEach(child => {
          const rawPath = normalizePath(child?.computedPath || child?.path || '');
          const targetPath = rawPath.includes('wechat-work')
            ? '/users/wechat-work-customers'
            : rawPath.includes('birthday')
              ? '/users/birthday'
              : '';
          if (targetPath) {
            ensureCrmChild(targetPath, child);
          }
        });
        menus.splice(crmIndex, 1);
      }

      return menus;
    };

    const relocatePaymentAndAppToSystem = (menus) => {
      if (!Array.isArray(menus)) {
        return menus;
      }

      const isSystemMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'system' || title.includes('系统');
      };

      const isPaymentMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'payment' || title.includes('支付');
      };

      const isAppMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'app-management' || title.toUpperCase().includes('APP');
      };

      const systemMenu = menus.find(isSystemMenu);
      if (!systemMenu) {
        return menus;
      }

      systemMenu.children = Array.isArray(systemMenu.children) ? systemMenu.children : [];

      const existingPaths = new Set(
        systemMenu.children.map(child => normalizePath(child?.computedPath || child?.path || ''))
      );

      const attachChild = (targetPath, fallbackMeta = {}, sourceMenu = null) => {
        if (!targetPath || existingPaths.has(targetPath)) {
          return;
        }

        existingPaths.add(targetPath);
        systemMenu.children.push({
          ...(sourceMenu || {}),
          id: sourceMenu?.id || `system-${targetPath}`,
          name: sourceMenu?.name || `System${targetPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          path: targetPath,
          computedPath: targetPath,
          meta: {
            ...(sourceMenu?.meta || {}),
            title: fallbackMeta.title,
            icon: fallbackMeta.icon
          }
        });
      };

      const paymentIndex = menus.findIndex(isPaymentMenu);
      if (paymentIndex !== -1) {
        const paymentMenu = menus[paymentIndex];
        attachChild('/system/payment-center', { title: '支付', icon: 'credit-card' }, paymentMenu);
        menus.splice(paymentIndex, 1);
      } else {
        attachChild('/system/payment-center', { title: '支付', icon: 'credit-card' });
      }

      const appIndex = menus.findIndex(isAppMenu);
      if (appIndex !== -1) {
        const appMenu = menus[appIndex];
        attachChild('/system/app-management', { title: 'APP管理', icon: 'mobile-phone' }, appMenu);
        menus.splice(appIndex, 1);
      } else {
        attachChild('/system/app-management', { title: 'APP管理', icon: 'mobile-phone' });
      }

      return menus;
    };

    const mergeInstallationIntoPurifierMenu = (menus) => {
      if (!Array.isArray(menus)) {
        return menus;
      }

      const isPurifierMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'devices' || title.includes('净水器') || title.includes('设备管理');
      };

      const isInstallationMenu = (menu) => {
        const key = getCanonicalMenuKey(menu);
        const title = menu?.meta?.title || menu?.title || '';
        return key === 'installation' || title.includes('安装');
      };

      const purifierMenu = menus.find(isPurifierMenu);
      const installationIndex = menus.findIndex(isInstallationMenu);

      if (!purifierMenu && installationIndex === -1) {
        return menus;
      }

      const ensureInstallationChild = (sourceMenu) => {
        if (!sourceMenu) return;

        sourceMenu.children = Array.isArray(sourceMenu.children) ? sourceMenu.children : [];
        const exists = sourceMenu.children.some(child => normalizePath(child?.computedPath || child?.path) === '/devices/installation');
        if (exists) {
          return;
        }

        sourceMenu.children.push({
          ...(installationIndex !== -1 ? menus[installationIndex] : {}),
          id: `${sourceMenu.id || 'purifier'}-installation`,
          name: 'PurifierInstallation',
          path: '/devices/installation',
          computedPath: '/devices/installation',
          children: [],
          meta: {
            ...(installationIndex !== -1 ? menus[installationIndex]?.meta : {}),
            title: '安装管理',
            icon: (installationIndex !== -1 ? menus[installationIndex]?.meta?.icon : null) || 'Van'
          }
        });
      };

      if (purifierMenu) {
        ensureInstallationChild(purifierMenu);
      }

      if (installationIndex !== -1) {
        menus.splice(installationIndex, 1);
      }

      return menus;
    };

    const findFirstNavigablePath = (node) => {
      if (!node || typeof node !== 'object') {
        return '';
      }

      if (isMerchantMallMenu(node)) {
        return merchantMallDefaultPath;
      }

      if (isOfficialMallMenu(node)) {
        return officialMallDefaultPath;
      }

      const candidates = [
        resolveNodePath(node.computedPath),
        resolveNodePath(node.path),
        resolveNodePath(node.redirect),
        resolveNodePath(node.meta?.path),
        resolveNodePath(node.meta?.link)
      ];

      for (const candidate of candidates) {
        if (candidate) {
          const officialCandidate = normalizeOfficialMallPath(candidate);
          const normalizedCandidate = normalizeMerchantMallPath(officialCandidate);
          return normalizedCandidate || officialCandidate;
        }
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        for (const child of node.children) {
          const childPath = findFirstNavigablePath(child);
          if (childPath) {
            return childPath;
          }
        }
      }

      return '';
    };

    const defaultChildOverrides = {
      'mall': [
        'mall/system/dashboard',
        officialMallDefaultPath.replace(/^\//, ''),
        merchantMallDefaultPath.replace(/^\//, ''),
        'mall/dashboard',
        'mall/merchant'
      ],
      'mall/official': [
        officialMallDefaultPath.replace(/^\//, ''),
        'mall/official/orders',
        'mall/official/products',
        'mall/official/categories',
        'mall/official/logistics',
        'mall/official/users'
      ],
      'mall/merchant': [
        'mall/merchant',
        merchantMallDefaultPath.replace(/^\//, ''),
        'mall/merchant/products',
        'mall/merchant/list',
        'mall/merchant/audit',
        'mall/merchant/settlement',
        'mall/merchant/statistics'
      ],
      'mall/merchant/products': [
        'mall/merchant',
        merchantMallDefaultPath.replace(/^\//, ''),
        'mall/merchant/products',
        'mall/merchant/list',
        'mall/merchant/audit',
        'mall/merchant/settlement',
        'mall/merchant/statistics'
      ]
    };

    const getCanonicalMenuKey = (menu) => {
      if (!menu || typeof menu !== 'object') {
        return '';
      }

      if (isMerchantMallMenu(menu)) {
        return 'mall/merchant';
      }

      if (isOfficialMallMenu(menu)) {
        return 'mall/official';
      }

      const candidates = [
        resolveNodePath(menu.path),
        resolveNodePath(menu.meta?.path),
        resolveNodePath(menu.meta?.link),
        resolveNodePath(menu.redirect),
        resolveNodePath(menu.computedPath)
      ];

      for (const candidate of candidates) {
        const normalized = normalizeMenuKey(candidate);
        if (normalized) {
          return normalized;
        }
      }

      return '';
    };

    const resolveOverrideKey = (key) => {
      if (!key) {
        return '';
      }

      if (defaultChildOverrides[key]) {
        return key;
      }

      const segments = key.split('/');
      if (segments.length >= 2) {
        const candidate = `${segments[0]}/${segments[1]}`;
        if (defaultChildOverrides[candidate]) {
          return candidate;
        }
      }

      return key;
    };

    const findPreferredChild = (menu) => {
      if (!menu || !Array.isArray(menu.children) || menu.children.length === 0) {
        return null;
      }

      if (isMerchantMallMenu(menu)) {
        const merchantChild = menu.children.find(child => isMerchantMallMenu(child));
        if (merchantChild) {
          return merchantChild;
        }
      }

      if (isOfficialMallMenu(menu)) {
        const officialChild = menu.children.find(child => isOfficialMallMenu(child));
        if (officialChild) {
          return officialChild;
        }
      }

      const canonicalKey = getCanonicalMenuKey(menu);
      const overrideKey = resolveOverrideKey(canonicalKey);
      const preferredList = defaultChildOverrides[overrideKey];
      if (preferredList && preferredList.length > 0) {
        for (const preferred of preferredList) {
          const normalizedPreferred = normalizeMenuKey(preferred);
          const matchedChild = menu.children.find(child => getCanonicalMenuKey(child) === normalizedPreferred);
          if (matchedChild) {
            return matchedChild;
          }
        }
      }

      return menu.children[0];
    };

    const selectMainMenu = (menu) => {
      activeMenu.value = menu.id;
      currentPageTitle.value = menu?.meta?.title || '';

      if (isMerchantMallMenu(menu)) {
        navigateToPath(merchantMallDefaultPath);
        return;
      }

      if (isOfficialMallMenu(menu)) {
        navigateToPath(officialMallDefaultPath);
        return;
      }

      const menuKey = getCanonicalMenuKey(menu);
      const overrideKey = resolveOverrideKey(menuKey);
      if (overrideKey === 'mall/merchant') {
        navigateToPath(merchantMallDefaultPath);
        return;
      }
      if (overrideKey === 'mall/official') {
        navigateToPath(officialMallDefaultPath);
        return;
      }
      
      // 如果有子菜单，自动选择第一个子菜单
      if (menu.children && menu.children.length > 0) {
        const preferredChild = findPreferredChild(menu);
        const targetPath = findFirstNavigablePath(preferredChild || menu.children[0]);
        if (targetPath) {
          navigateToPath(targetPath);
        }
      } else {
        const targetPath = findFirstNavigablePath(menu);
        if (targetPath) {
          navigateToPath(targetPath);
        }
      }
    };
    
    // 处理子菜单点击
    const handleSubMenuClick = (item) => {
      currentPageTitle.value = item?.meta?.title || '';
      if (isMerchantMallMenu(item)) {
        navigateToPath(merchantMallDefaultPath);
        return;
      }
      if (isOfficialMallMenu(item)) {
        navigateToPath(officialMallDefaultPath);
        return;
      }
      const targetPath = findFirstNavigablePath(item);
      if (targetPath) {
        navigateToPath(targetPath);
      }
    };
    
    // 检查子菜单是否激活
    const isSubMenuActive = (item) => {
      const currentPath = normalizePath(route.path);
      const activeMenuPath = normalizePath(route.meta?.activeMenu);
      const itemPath = normalizePath(getMenuPath(item));
      return pathMatches(currentPath, itemPath) || (activeMenuPath ? pathMatches(activeMenuPath, itemPath) : false);
    };
    
    // 鼠标进入主菜单
    const handleMouseEnter = () => {
      isExpanded.value = true;
    };
    
    // 鼠标离开主菜单
    const handleMouseLeave = () => {
      isExpanded.value = false;
    };
    
    // 切换侧边栏
    const toggleSidebar = () => {
      isExpanded.value = !isExpanded.value;
    };
    
    // 加载菜单数据
    const loadMenus = async () => {
      try {
        console.log('开始加载菜单数据...');
        const data = await request.get('/api/admin/v1/menus?tree=1');
        console.log('菜单API返回数据:', data);
        
        // 检查响应数据 - request.js已经返回了response.data
        if (data && data.code === 0 && Array.isArray(data.data)) {
          const enhancedMenus = enhanceMenuTree(data.data);
          const normalizedMenus = relocatePaymentAndAppToSystem(
            relocateCrmMenuToUsers(
              relocateBranchMenuToSystem(
                mergeInstallationIntoPurifierMenu(enhancedMenus)
              )
            )
          );
          allMenus.value = normalizedMenus;
          mainMenus.value = normalizedMenus;
          console.log('菜单数据加载成功! 菜单数量:', mainMenus.value.length);
          console.log('菜单列表:', mainMenus.value);
          
          // 根据当前路由设置激活菜单
          setActiveMenuFromRoute();
        } else {
          console.error('菜单数据格式不正确:');
          console.error('- data.code:', data?.code);
          console.error('- Array.isArray(data.data):', Array.isArray(data?.data));
          console.error('- data.data:', data?.data);
          ElMessage.error('菜单数据格式错误');
        }
      } catch (error) {
        console.error('加载菜单失败:', error);
        ElMessage.error('加载菜单失败: ' + error.message);
      }
    };
    
    // 根据当前路由设置激活菜单
    const setActiveMenuFromRoute = () => {
      const currentPath = normalizePath(route.path);
      const activeMenuPath = normalizePath(route.meta?.activeMenu);
      
      let match = findMenuMatch(currentPath);
      
      if (!match.menu && activeMenuPath) {
        match = findMenuMatch(activeMenuPath);
      }
      
      if (match.menu) {
        activeMenu.value = match.menu.id;
        if (match.child) {
          currentPageTitle.value = match.child.meta?.title || route.meta?.title || match.menu.meta?.title || '';
        } else {
          currentPageTitle.value = route.meta?.title || match.menu.meta?.title || '';
        }
        return;
      }
      
      if (mainMenus.value.length > 0) {
        const fallbackMenu = mainMenus.value[0];
        activeMenu.value = fallbackMenu.id;
        currentPageTitle.value = route.meta?.title || fallbackMenu.meta?.title || '';
      }
    };
    
    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        console.log('开始加载用户信息...');
        const data = await request.get('/api/admin/v1/auth/me');
        console.log('用户信息API返回数据:', data);
        
        if (data && data.code === 0 && data.data) {
          const user = data.data;
          userName.value = user.name || user.username || '管理员';
          
          // 优先使用微信头像，然后是用户上传的头像
          if (user.wechat_avatar) {
            userAvatar.value = user.wechat_avatar;
          } else if (user.avatar) {
            // 如果是相对路径，添加正确的前缀
            if (user.avatar.startsWith('http')) {
              userAvatar.value = user.avatar;
            } else {
              userAvatar.value = window.location.origin + '/admin/' + user.avatar.replace(/^\//, '');
            }
          } else {
            userAvatar.value = '';
          }
          
          userAvatarText.value = (user.name || user.username || '管理员').charAt(0);
          console.log('用户信息加载成功:', {
            name: userName.value,
            avatar: userAvatar.value,
            avatarText: userAvatarText.value,
            wechat_avatar: user.wechat_avatar,
            user_avatar: user.avatar
          });
        } else if (data && data.code === 1002) {
          // 认证失败，但不触发全局退出登录，使用默认值
          console.warn('用户认证失败，使用默认用户信息');
          userName.value = '管理员';
          userAvatar.value = '';
          userAvatarText.value = '管';
        } else {
          console.error('用户信息数据格式错误:', data);
          // 使用默认值
          userName.value = '管理员';
          userAvatar.value = '';
          userAvatarText.value = '管';
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        // 使用默认值
        userName.value = '管理员';
        userAvatar.value = '';
        userAvatarText.value = '管';
      }
    };
    
    const normalizeLogoPath = (rawPath) => {
      if (!rawPath) return defaultLogoPath;
      const path = rawPath.trim();
      if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
        return path;
      }
      if (path.startsWith('/')) {
        return path;
      }
      const base = window?.BASE_URL || '/';
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      return `${normalizedBase}/${path}`.replace(/\/{2,}/g, '/');
    };

    const appendCacheBuster = (url) => {
      if (!logoVersionToken) return url;
      const [base, hash] = url.split('#');
      const separator = base.includes('?') ? '&' : '?';
      const versioned = `${base}${separator}v=${logoVersionToken}`;
      return hash ? `${versioned}#${hash}` : versioned;
    };

    const setLogoUrl = (path) => {
      const normalized = normalizeLogoPath(path);
      const finalized = appendCacheBuster(normalized);
      logoUrl.value = finalized;
      return finalized;
    };

    const loadLogo = (preferredPath, allowFallback = true) => {
      const target = preferredPath || window?.Laravel?.siteConfig?.siteLogo || defaultLogoPath;
      logoExists.value = false;
      const finalUrl = setLogoUrl(target);
      const tester = new Image();
      tester.onload = () => {
        logoExists.value = true;
      };
      tester.onerror = () => {
        if (allowFallback && target !== defaultLogoPath) {
          loadLogo(defaultLogoPath, false);
          return;
        }
        if (allowFallback) {
          loadLogo(`${defaultLogoPath}?t=${Date.now()}`, false);
          return;
        }
        logoExists.value = false;
      };
      tester.src = finalUrl;
    };
    
    const isDashboardRoute = (pathValue) => {
      const normalized = (pathValue || '').replace(/\/+$/, '') || '/';
      return normalized === '/dashboard' || normalized === '/';
    };

    const hideSubSidebar = computed(() => {
      if (route?.name === 'Dashboard') {
        return true;
      }
      return isDashboardRoute(route?.path);
    });

    // 处理用户菜单命令
    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile');
          break;
        case 'password':
          router.push('/change-password');
          break;
        case 'logout':
          handleLogout();
          break;
      }
    };
    
    // 处理退出登录
    const handleLogout = async () => {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        console.log('开始退出登录...');
        
        // 调用退出登录API
        try {
          await request.post('/api/admin/v1/auth/logout');
          console.log('退出登录API调用成功');
        } catch (apiError) {
          console.warn('退出登录API调用失败，但继续清除本地数据:', apiError);
        }
        
        // 清除所有相关的token
        clearAdminToken();
        localStorage.removeItem('branch_admin_token');
        localStorage.removeItem('admin_token'); // 兼容旧版本
        
        console.log('本地token已清除，准备跳转到登录页面');
        
        // 跳转到登录页面
        router.push('/login');
        
        ElMessage.success('退出登录成功');
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('退出登录失败:', error);
          ElMessage.error('退出登录失败');
        }
      }
    };
    
    // 通知相关方法
    const loadNotifications = async () => {
      try {
        const [countRes, listRes] = await Promise.all([
          request.get('/api/admin/v1/notifications/unread-count'),
          request.get('/api/admin/v1/notifications/latest', { params: { limit: 5 } })
        ]);

        if (countRes && countRes.code === 0) {
          unreadNotifications.value = countRes.data.count;
        }

        if (listRes && listRes.code === 0) {
          notifications.value = listRes.data || [];
        }
      } catch (error) {
        console.error('加载通知失败:', error);
      }
    };

    const handleNotificationCommand = (notificationId) => {
      console.log('处理通知:', notificationId);
    };
    
    const markAllAsRead = async () => {
      try {
        await request.post('/api/admin/v1/notifications/mark-all-read');
        notifications.value.forEach(n => n.is_read = 1);
        unreadNotifications.value = 0;
        ElMessage.success('全部已读');
      } catch (error) {
        console.error('标记全部已读失败:', error);
      }
    };
    
    const viewAllNotifications = () => {
      router.push('/system/notifications');
    };
    
    const getNotificationIcon = (type) => {
      const iconMap = {
        'info': 'InfoFilled',
        'warning': 'WarningFilled',
        'error': 'CircleCloseFilled',
        'success': 'CircleCheckFilled'
      };
      return iconMap[type] || 'InfoFilled';
    };
    
    const formatTime = (time) => {
      return new Date(time).toLocaleString();
    };
    
    // 监听路由变化
    watch(route, () => {
      setActiveMenuFromRoute();
    });
    
    // 监听全局用户信息更新事件
    const handleUserInfoUpdated = (event) => {
      loadUserInfo();
    };

    const handleSystemSettingsUpdated = (event) => {
      const updatedLogo = event?.detail?.siteLogo;
      if (updatedLogo) {
        loadLogo(updatedLogo, true);
      }
    };
    
    // 组件挂载时执行
    onMounted(() => {
      loadMenus();
      loadUserInfo();
      loadLogo();
      loadNotifications();
      
      // 添加全局事件监听器
      window.addEventListener('userInfoUpdated', handleUserInfoUpdated);
      window.addEventListener('system-settings-updated', handleSystemSettingsUpdated);
    });
    
    // 组件卸载时清理
    onUnmounted(() => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdated);
      window.removeEventListener('system-settings-updated', handleSystemSettingsUpdated);
    });
    
    return {
      isExpanded,
      activeMenu,
      currentPageTitle,
      logoExists,
      logoUrl,
      mainMenus,
      currentSubMenus,
      userName,
      userAvatar,
      userAvatarText,
      hideSubSidebar,
      notifications,
      unreadNotifications,
      resolveIcon,
      getActiveMenuTitle,
      getCurrentPageIcon,
      selectMainMenu,
      handleSubMenuClick,
      isSubMenuActive,
      handleMouseEnter,
      handleMouseLeave,
      toggleSidebar,
      handleCommand,
      handleNotificationCommand,
      markAllAsRead,
      viewAllNotifications,
      getNotificationIcon,
      formatTime
    };
  }
};
</script>

<style scoped>
.three-column-layout {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
}

/* 左侧主菜单栏 */
.main-sidebar {
  width: 64px;
  min-width: 64px;
  background: linear-gradient(180deg, #304156 0%, #2c3e50 100%);
  color: #bfcbd9;
  transition: width 0.3s ease;
  position: relative;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.main-sidebar:hover,
.main-sidebar.expanded {
  width: 180px;
  min-width: 180px;
}

.logo-section {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfcbd9;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.logo-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.main-menu-container {
  padding: 16px 0;
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* 自定义滚动条样式 */
.main-menu-container::-webkit-scrollbar {
  width: 4px;
}

.main-menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.main-menu-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.main-menu-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin: 2px 0;
  border-radius: 6px;
  min-height: 48px;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.main-sidebar:hover .main-menu-item,
.main-sidebar.expanded .main-menu-item {
  justify-content: flex-start;
  padding: 10px 8px;
  margin: 2px 4px;
}

.main-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(2px);
}

.main-menu-item.active {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.menu-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #ffffff;
  opacity: 0.9;
}

.main-sidebar:hover .menu-icon,
.main-sidebar.expanded .menu-icon {
  position: static;
  transform: none;
  margin-right: 3px;
}

.menu-title {
  margin-left: 3px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.main-sidebar:hover .menu-title,
.main-sidebar.expanded .menu-title {
  opacity: 1;
}

/* 折叠按钮样式 */
.collapse-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.collapse-btn:hover {
  background: #337ecc;
  transform: translateX(-50%) scale(1.1);
}

.main-sidebar.expanded .collapse-btn {
  left: 50%;
}

/* 中间二级菜单栏 */
.sub-sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease, opacity 0.2s ease;
}

.sub-sidebar.is-hidden {
  width: 0;
  min-width: 0;
  padding: 0;
  border-right: none;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.sub-sidebar.is-hidden .sub-menu-header,
.sub-sidebar.is-hidden .sub-menu-container {
  display: none;
}

.sub-menu-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.sub-menu-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.5;
  display: flex;
  align-items: center;
}

.sub-menu-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

/* 自定义滚动条样式 - 二级菜单 */
.sub-menu-container::-webkit-scrollbar {
  width: 6px;
}

.sub-menu-container::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.sub-menu-container::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.sub-menu-container::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.sub-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 16px 12px 17px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  min-height: 44px;
}

.sub-menu-item:hover {
  background-color: #f5f7fa;
  border-left-color: #409EFF;
  padding-left: 17px;
}

.sub-menu-item.active {
  background-color: #ecf5ff;
  border-left-color: #409EFF;
  color: #409EFF;
  padding-left: 17px;
}

.sub-menu-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  font-size: 16px;
}

.sub-menu-title {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.current-page-info {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  text-align: center;
}

.page-description {
  font-size: 12px;
  text-align: center;
}

/* 右侧内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area.full-width {
  flex: 1;
  width: 100%;
}

.top-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #c0c4cc;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-icon {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.notification-icon:hover {
  background-color: #f5f7fa;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.dropdown-arrow {
  font-size: 12px;
  color: #909399;
  transition: transform 0.2s ease;
}

.main-content {
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
}

/* 通知下拉菜单样式 */
.notification-dropdown {
  width: 320px;
  max-height: 400px;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;
  font-weight: 600;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
}

.notification-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notification-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: #909399;
}

.notification-footer {
  padding: 8px 16px;
  border-top: 1px solid #e6e6e6;
  text-align: center;
}
</style> 
