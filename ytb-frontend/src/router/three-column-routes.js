import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

// 使用动态导入优化加载性能
const Login = () => import('../views/Login.vue');
const ThreeColumnLayout = () => import('../layout/ThreeColumnLayout.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const NotFound = () => import('../views/errors/404.vue');

// 修改基础URL路径
const BASE_URL = (import.meta.env.VITE_ADMIN_BASE_URL || '/admin/').replace(/\/?$/, '/');

// 添加全局变量，供其他模块使用
window.BASE_URL = BASE_URL;

// 三栏式布局路由配置
const routesConfig = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: ThreeColumnLayout,
        redirect: '/dashboard',
        meta: { requiresAuth: true },
        children: [
            // 首页 - 面板模块
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { 
                    title: '控制面板', 
                    icon: 'Monitor',
                    mainMenu: 'dashboard'
                }
            },
            {
                path: 'dashboard/purifier',
                name: 'DashboardPurifier',
                component: () => import('../views/dashboard/Purifier.vue'),
                meta: { 
                    title: '净水器', 
                    icon: 'Tools',
                    mainMenu: 'dashboard'
                }
            },
            {
                path: 'dashboard/shengfutong',
                name: 'DashboardShengfutong',
                component: () => import('../views/dashboard/Shengfutong.vue'),
                meta: { 
                    title: '盛付通', 
                    icon: 'CreditCard',
                    mainMenu: 'dashboard'
                }
            },
            {
                path: 'dashboard/xinsheng',
                name: 'DashboardXinsheng',
                component: () => import('../views/dashboard/Xinsheng.vue'),
                meta: { 
                    title: '新生', 
                    icon: 'Star',
                    mainMenu: 'dashboard'
                }
            },
            {
                path: 'dashboard/guotong',
                name: 'DashboardGuotong',
                component: () => import('../views/dashboard/Guotong.vue'),
                meta: { 
                    title: '国通星驿', 
                    icon: 'Connection',
                    mainMenu: 'dashboard'
                }
            },
            
            // 用户管理模块
            {
                path: 'users/app-users',
                name: 'AppUsers',
                component: () => import('../views/users/app-users/List.vue'),
                meta: { 
                    title: 'APP用户', 
                    icon: 'User',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/prospects',
                name: 'Prospects',
                component: () => import('../views/users/prospects/List.vue'),
                meta: { 
                    title: '准客户', 
                    icon: 'Opportunity',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/admins',
                name: 'Admins',
                component: () => import('../views/users/admins/List.vue'),
                meta: { 
                    title: '管理员', 
                    icon: 'UserFilled',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/salesmen',
                name: 'Salesmen',
                component: () => import('../views/users/salesmen/List.vue'),
                meta: { 
                    title: '业务员管理', 
                    icon: 'Management',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/roles',
                name: 'Roles',
                component: () => import('../views/users/roles/List.vue'),
                meta: { 
                    title: '角色管理', 
                    icon: 'Grid',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/permissions',
                name: 'Permissions',
                component: () => import('../views/users/permissions/List.vue'),
                meta: { 
                    title: '权限管理', 
                    icon: 'Lock',
                    mainMenu: 'users'
                }
            },
            {
                path: 'users/simulate-login',
                name: 'SimulateLogin',
                component: () => import('../views/users/simulate-login/Index.vue'),
                meta: { 
                    title: '模拟登录', 
                    icon: 'Monitor',
                    mainMenu: 'users'
                }
            },

            // 设备管理模块
            {
                path: 'devices/list',
                name: 'DevicesList',
                component: () => import('../views/devices/List.vue'),
                meta: { 
                    title: '设备列表', 
                    icon: 'Monitor',
                    mainMenu: 'devices'
                }
            },
            {
                path: 'devices/monitor',
                name: 'DevicesMonitor',
                component: () => import('../views/devices/Monitor.vue'),
                meta: { 
                    title: '设备监控', 
                    icon: 'DataAnalysis',
                    mainMenu: 'devices'
                }
            },
            {
                path: 'devices/water-points',
                name: 'WaterPoints',
                component: () => import('../views/water-points/List.vue'),
                meta: { 
                    title: '取水点管理', 
                    icon: 'Location',
                    mainMenu: 'devices'
                }
            },
            {
                path: 'devices/maintenance',
                name: 'DevicesMaintenance',
                component: () => import('../views/devices/Maintenance.vue'),
                meta: { 
                    title: '设备维护', 
                    icon: 'Tools',
                    mainMenu: 'devices'
                }
            },
            {
                path: 'devices/alerts',
                name: 'DevicesAlerts',
                component: () => import('../views/devices/Alerts.vue'),
                meta: { 
                    title: '设备告警', 
                    icon: 'Bell',
                    mainMenu: 'devices'
                }
            },
            {
                path: 'devices/installation',
                name: 'DevicesInstallationWorkspace',
                component: () => import('../views/installation/InstallationWorkspace.vue'),
                meta: { 
                    title: '安装管理', 
                    icon: 'Van',
                    mainMenu: 'devices'
                }
            },

            // 商城管理模块
            {
                path: 'mall/products',
                name: 'Products',
                component: () => import('../views/mall/products/List.vue'),
                meta: { 
                    title: '商品管理', 
                    icon: 'Box',
                    mainMenu: 'mall'
                }
            },
            {
                path: 'mall/categories',
                name: 'Categories',
                component: () => import('../views/mall/categories/List.vue'),
                meta: { 
                    title: '分类管理', 
                    icon: 'Grid',
                    mainMenu: 'mall'
                }
            },
            {
                path: 'mall/orders',
                name: 'Orders',
                component: () => import('../views/mall/orders/List.vue'),
                meta: { 
                    title: '订单管理', 
                    icon: 'List',
                    mainMenu: 'mall'
                }
            },
            {
                path: 'mall/refunds',
                name: 'Refunds',
                component: () => import('../views/mall/refunds/List.vue'),
                meta: { 
                    title: '退款管理', 
                    icon: 'CircleClose',
                    mainMenu: 'mall'
                }
            },

            // 支付管理模块
            {
                path: 'payment/methods',
                name: 'PaymentMethods',
                component: () => import('../views/payment/methods/List.vue'),
                meta: { 
                    title: '支付方式', 
                    icon: 'CreditCard',
                    mainMenu: 'payment'
                }
            },
            {
                path: 'payment/settings',
                name: 'PaymentSettings',
                component: () => import('../views/payment/settings/Index.vue'),
                meta: { 
                    title: '支付配置', 
                    icon: 'Setting',
                    mainMenu: 'payment'
                }
            },
            {
                path: 'payment/transactions',
                name: 'PaymentTransactions',
                component: () => import('../views/payment/transactions/List.vue'),
                meta: { 
                    title: '交易记录', 
                    icon: 'List',
                    mainMenu: 'payment'
                }
            },
            {
                path: 'payment/refunds',
                name: 'PaymentRefunds',
                component: () => import('../views/payment/refunds/List.vue'),
                meta: { 
                    title: '退款记录', 
                    icon: 'CircleClose',
                    mainMenu: 'payment'
                }
            },
            // 系统管理模块
            {
                path: 'system/menu',
                name: 'SystemMenu',
                component: () => import('../views/system/menu/List.vue'),
                meta: { 
                    title: '菜单管理', 
                    icon: 'Menu',
                mainMenu: 'system'
            }
            },
            {
                path: 'system/mobile-home',
                name: 'SystemMobileHome',
                component: () => import('../views/system/mobile-home/Index.vue'),
                meta: {
                    title: '移动端首页',
                    icon: 'Monitor',
                    mainMenu: 'system'
                }
            },
            {
                path: 'system/banners',
                name: 'SystemBanners',
                component: () => import('../views/mall/banners/List.vue'),
                meta: { 
                    title: 'Banner管理', 
                    icon: 'Picture',
                    mainMenu: 'system'
                }
            },
            {
                path: 'system/nav',
                name: 'SystemNav',
                component: () => import('../views/system/nav/Index.vue'),
                meta: { 
                    title: '导航管理', 
                    icon: 'Operation',
                    mainMenu: 'system'
                }
            },
            {
                path: 'system/sms',
                name: 'SystemSms',
                component: () => import('../views/system/sms/Index.vue'),
                meta: { 
                    title: '短信管理', 
                    icon: 'Cellphone',
                    mainMenu: 'system'
                }
            },
            {
                path: 'system/logs',
                name: 'SystemLogs',
                component: () => import('../views/system/logs/Index.vue'),
                meta: { 
                    title: '系统日志', 
                    icon: 'Document',
                    mainMenu: 'system'
                }
            },
            {
                path: 'system/analytics',
                name: 'SystemAnalytics',
                component: () => import('../views/system/analytics/Index.vue'),
                meta: { 
                    title: '系统分析', 
                    icon: 'DataAnalysis',
                    mainMenu: 'system'
                }
            },

            // 数据统计模块
            {
                path: 'statistics/overview',
                name: 'StatisticsOverview',
                component: () => import('../views/statistics/Overview.vue'),
                meta: { 
                    title: '数据概览', 
                    icon: 'TrendCharts',
                    mainMenu: 'statistics'
                }
            },
            {
                path: 'statistics/users',
                name: 'StatisticsUsers',
                component: () => import('../views/statistics/Users.vue'),
                meta: { 
                    title: '用户统计', 
                    icon: 'User',
                    mainMenu: 'statistics'
                }
            },
            {
                path: 'statistics/devices',
                name: 'StatisticsDevices',
                component: () => import('../views/statistics/Devices.vue'),
                meta: { 
                    title: '设备统计', 
                    icon: 'Monitor',
                    mainMenu: 'statistics'
                }
            },
            {
                path: 'statistics/sales',
                name: 'StatisticsSales',
                component: () => import('../views/statistics/Sales.vue'),
                meta: { 
                    title: '销售统计', 
                    icon: 'ShoppingCart',
                    mainMenu: 'statistics'
                }
            },

            // 系统设置模块
            {
                path: 'settings/basic',
                name: 'SettingsBasic',
                component: () => import('../views/settings/Basic.vue'),
                meta: { 
                    title: '基础配置', 
                    icon: 'Setting',
                    mainMenu: 'settings'
                }
            },
            {
                path: 'settings/app',
                name: 'SettingsApp',
                component: () => import('../views/settings/app/Index.vue'),
                meta: { 
                    title: 'APP设置', 
                    icon: 'Cellphone',
                    mainMenu: 'settings'
                }
            },
            
            // APP管理模块
            {
                path: "app-management/diandian",
                name: "AppManagementDiandian",
                component: () => import("../views/app-management/diandian/Index.vue"),
                meta: {
                    title: "点点够APP管理",
                    icon: "Cellphone",
                    mainMenu: "app-management"
                }
            },
            {
                path: 'settings/notifications',
                name: 'SettingsNotifications',
                component: () => import('../views/settings/Notifications.vue'),
                meta: { 
                    title: '通知设置', 
                    icon: 'Bell',
                    mainMenu: 'settings'
                }
            },
            {
                path: 'settings/storage',
                name: 'SettingsStorage',
                component: () => import('../views/settings/app/OssConfig.vue'),
                meta: {
                    title: '附件存储',
                    icon: 'FolderOpened',
                    mainMenu: 'system'
                }
            },

            // 其他页面
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/profile/Index.vue'),
                meta: { 
                    title: '个人信息', 
                    icon: 'User',
                    hidden: true
                }
            },
            {
                path: 'password',
                name: 'Password',
                component: () => import('../views/profile/Password.vue'),
                meta: { 
                    title: '修改密码', 
                    icon: 'Lock',
                    hidden: true
                }
            },
            {
                path: 'notifications',
                name: 'Notifications',
                component: () => import('../views/notifications/Index.vue'),
                meta: { 
                    title: '通知中心', 
                    icon: 'Bell',
                    hidden: true
                }
            }
        ]
    },
    {
        path: '/404',
        name: 'NotFound',
        component: NotFound,
        meta: { requiresAuth: false }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404'
    }
];

// 创建路由实例
const router = createRouter({
    history: createWebHashHistory(BASE_URL),
    routes: routesConfig,
    scrollBehavior() {
        return { top: 0 };
    }
});

// 路由守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('admin_token');
    
    if (to.meta.requiresAuth !== false && !token) {
        next('/login');
    } else if (to.path === '/login' && token) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router; 
