import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { h } from 'vue';
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

// 使用动态导入优化加载性能
const Login = () => import('../views/Login.vue');
const BranchLogin = () => import('../views/branch/BranchLogin.vue');
const BranchStandaloneLayout = () => import('../layouts/BranchStandaloneLayout.vue');
const BranchDashboard = () => import('../views/branch-standalone/Dashboard.vue');
const ThreeColumnLayout = () => import('../layout/ThreeColumnLayout.vue'); // 使用新的三栏式布局
const Dashboard = () => import('../views/Dashboard.vue');
const DataCockpit = () => import('../views/DataCockpit.vue');
const PublicDataCockpit = () => import('../views/open/PublicDataCockpit.vue');
const NotFound = () => import('../views/errors/404.vue');

// 修改基础URL路径
const BASE_URL = (import.meta.env.VITE_ADMIN_BASE_URL || '/admin/').replace(/\/?$/, '/');

// 添加全局变量，供其他模块使用
window.BASE_URL = BASE_URL;

// 路由配置
const routesConfig = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/open/data-cockpit',
        name: 'OpenDataCockpitPublic',
        component: PublicDataCockpit,
        meta: { requiresAuth: false }
    },
    // 分支机构登录页面
    {
        path: '/branch-login/:branchCode',
        name: 'BranchLogin',
        component: BranchLogin,
        meta: { requiresAuth: false }
    },
    // CRM兼容入口（已迁移至用户管理）
    {
        path: '/crm',
        name: 'CRMRedirect',
        component: () => import('../views/RouterView.vue'),
        meta: { requiresAuth: true, hidden: true },
        redirect: { name: 'BirthdayManagement' },
        children: [
            {
                path: 'birthday',
                redirect: { name: 'BirthdayManagement' },
                meta: { requiresAuth: true },
                hidden: true
            },
            {
                path: 'wechat-work-customers',
                redirect: { name: 'WechatWorkCustomers' },
                meta: { requiresAuth: true },
                hidden: true
            }
        ]
    },
    {
        path: '/payment',
        name: 'PaymentRedirect',
        component: () => import('../views/RouterView.vue'),
        meta: { requiresAuth: true, hidden: true },
        redirect: { name: 'SystemPaymentWorkspace' },
        children: [
            {
                path: 'methods',
                redirect: { name: 'SystemPaymentWorkspace', query: { tab: 'methods' } },
                hidden: true
            },
            {
                path: 'transactions',
                redirect: { name: 'SystemPaymentWorkspace', query: { tab: 'transactions' } },
                hidden: true
            },
            {
                path: 'refunds',
                redirect: { name: 'SystemPaymentWorkspace', query: { tab: 'refunds' } },
                hidden: true
            }
        ]
    },
    {
        path: '/app-management',
        name: 'AppManagementRedirect',
        component: () => import('../views/RouterView.vue'),
        meta: { requiresAuth: true, hidden: true },
        redirect: { name: 'SystemAppWorkspace' },
        children: [
            {
                path: 'diandian',
                redirect: { name: 'SystemAppWorkspace', query: { tab: 'diandian' } },
                hidden: true
            },
            {
                path: 'dianhuan',
                redirect: { name: 'SystemAppWorkspace', query: { tab: 'dianhuan' } },
                hidden: true
            }
        ]
    },
    // 兼容旧的分支机构管理路径
    {
        path: '/branch/system/branch-organizations',
        redirect: '/system/branch-organizations',
        meta: { requiresAuth: true }
    },
    // 分支机构独立管理后台
    {
        path: '/branch/:branchId',
        component: BranchStandaloneLayout,
        redirect: '/branch/:branchId/dashboard',
        meta: { requiresAuth: true, isBranchAdmin: true },
        children: [
            {
                path: 'dashboard',
                name: 'BranchDashboard',
                component: BranchDashboard,
                meta: { title: '仪表盘', icon: 'dashboard' }
            },
            // YTB专用仪表盘（分支机构4）
            {
                path: 'ytb/dashboard',
                name: 'BranchYtbDashboard',
                component: () => import('../views/ytb/Dashboard.vue'),
                meta: { title: '仪表盘', icon: 'Odometer' }
            },
            // 用户管理
            {
                path: 'users',
                name: 'BranchUsers',
                component: () => import('../views/branch-standalone/users/List.vue'),
                meta: { title: '用户管理', icon: 'user' }
            },
            // 会员管理
            {
                path: 'members',
                name: 'BranchMembers',
                redirect: '/branch/:branchId/members/app-users',
                meta: { title: '会员管理', icon: 'user' },
                children: [
                    {
                        path: 'app-users',
                        name: 'BranchMembersAppUsers',
                        component: () => import('../views/branch/members/AppUsers.vue'),
                        meta: { title: 'APP会员', icon: 'user' }
                    },
                    {
                        path: 'vip-users',
                        name: 'BranchMembersVipUsers',
                        component: () => import('../views/branch/members/VipUsers.vue'),
                        meta: { title: 'CP会员', icon: 'trophy' }
                    },
                    {
                        path: 'salesman',
                        name: 'BranchMembersSalesman',
                        component: () => import('../views/branch/members/Salesman.vue'),
                        meta: { title: '业务员管理', icon: 'briefcase' }
                    },

                ]
            },
            // 净水器
            {
                path: 'devices',
                name: 'BranchDevices',
                redirect: '/branch/:branchId/devices/inventory',
                meta: { title: '净水器', icon: 'Tools' },
                children: [
                    {
                        path: 'inventory',
                        name: 'BranchDeviceInventory',
                        component: () => import('../views/branch/devices/Inventory.vue'),
                        meta: { title: '设备库存', icon: 'box' }
                    },
                    {
                        path: 'activated',
                        name: 'BranchDeviceActivated',
                        component: () => import('../views/branch/devices/Activated.vue'),
                        meta: { title: '已激活设备', icon: 'circle-check' }
                    },
                    {
                        path: 'water-points',
                        name: 'BranchWaterPoints',
                        component: () => import('../views/branch/devices/WaterPoints.vue'),
                        meta: { title: '取水点管理', icon: 'location' }
                    },
                    {
                        path: 'check-in-records',
                        name: 'BranchCheckInRecords',
                        component: () => import('../views/branch/devices/CheckInRecords.vue'),
                        meta: { title: '取水记录', icon: 'document' }
                    },
                    {
                        path: 'installation',
                        name: 'BranchInstallationWorkspace',
                        component: () => import('../views/installation/InstallationWorkspace.vue'),
                        meta: { title: '安装管理', icon: 'Van' }
                    },
                    {
                        path: 'installation/booking/:id',
                        name: 'BranchInstallationBookingDetail',
                        component: () => import('../views/installation/BookingDetail.vue'),
                        hidden: true,
                        meta: { title: '预约详情', activeMenu: '/branch/:branchId/devices/installation' }
                    }
                ]
            },
            // VIP管理
            {
                path: 'vip',
                name: 'BranchVip',
                component: () => import('../views/branch-standalone/vip/List.vue'),
                meta: { title: 'CP管理', icon: 'trophy' }
            },
            // 业务统计
            {
                path: 'statistics',
                name: 'BranchStatistics',
                component: () => import('../views/branch-standalone/statistics/Index.vue'),
                meta: { title: '业务统计', icon: 'data-analysis' }
            },
            // 系统管理
            {
                path: 'system/admins',
                name: 'BranchSystemAdmins',
                component: () => import('../views/branch-standalone/system/Admins.vue'),
                meta: { title: '管理员管理', icon: 'user-filled' }
            },
            {
                path: 'system/roles',
                name: 'BranchSystemRoles',
                component: () => import('../views/branch-standalone/system/Roles.vue'),
                meta: { title: '角色管理', icon: 'user' }
            },
            {
                path: 'system/dividend-config',
                name: 'BranchSystemDividendConfig',
                component: () => import('../views/branch/system/DividendConfig.vue'),
                meta: { title: '分红配置', icon: 'money' }
            },
            {
                path: 'system/menus',
                name: 'BranchSystemMenus',
                component: () => import('../views/branch-standalone/system/Menus.vue'),
                meta: { title: '菜单管理', icon: 'menu' }
            },
            {
                path: 'system/config',
                name: 'BranchSystemConfig',
                component: () => import('../views/branch/system/Config.vue'),
                meta: { title: '系统配置', icon: 'setting' }
            },
            {
                path: 'settings/points',
                name: 'BranchPointConfig',
                component: () => import('../views/branch/settings/PointConfig.vue'),
                meta: { title: '积分设置', icon: 'star-filled' }
            },
            // 微信公众号管理
            {
                path: 'wechat/menu',
                name: 'BranchWechatMenu',
                component: () => import('../views/branch/wechat/Menu.vue'),
                meta: { title: '自定义菜单', icon: 'menu' }
            },
            {
                path: 'wechat/auto-reply',
                name: 'BranchWechatAutoReply',
                component: () => import('../views/branch/wechat/AutoReply.vue'),
                meta: { title: '自动回复', icon: 'chat-line-round' }
            },
            {
                path: 'wechat/fans',
                name: 'BranchWechatFans',
                component: () => import('../views/branch/wechat/FansManagement.vue'),
                meta: { title: '粉丝管理', icon: 'user' }
            },
            {
                path: 'wechat/materials',
                name: 'BranchWechatMaterials',
                component: () => import('../views/branch/wechat/MaterialManagement.vue'),
                meta: { title: '素材管理', icon: 'folder' }
            },
            {
                path: 'wechat/mass-message',
                name: 'BranchWechatMassMessage',
                component: () => import('../views/branch/wechat/MassMessage.vue'),
                meta: { title: '消息群发', icon: 'promotion' }
            },
            // 亿拓宝管理（仅分支机构4可见）
            {
                path: 'ytb',
                name: 'BranchYtbManagement',
                redirect: '/branch/:branchId/ytb/statistics',
                meta: { title: '亿拓宝管理', icon: 'Promotion' },
                children: [
                    {
                        path: 'statistics',
                        name: 'BranchYtbStatistics',
                        component: () => import('../views/ytb/Statistics.vue'),
                        meta: { title: '数据统计', icon: 'DataAnalysis' }
                    },
                    {
                        path: 'users',
                        name: 'BranchYtbUsers',
                        component: () => import('../views/ytb/Users.vue'),
                        meta: { title: '用户管理', icon: 'User' }
                    },
                    {
                        path: 'upgrades',
                        name: 'BranchYtbUpgrades',
                        component: () => import('../views/ytb/Upgrades.vue'),
                        meta: { title: '升级审批', icon: 'DocumentChecked' }
                    },
                    {
                        path: 'commissions',
                        name: 'BranchYtbCommissions',
                        component: () => import('../views/ytb/Commissions.vue'),
                        meta: { title: '分佣管理', icon: 'Money' }
                    },
                    {
                        path: 'investments',
                        name: 'BranchYtbInvestments',
                        component: () => import('../views/ytb/Investments.vue'),
                        meta: { title: 'BossCP投资', icon: 'Wallet' }
                    },
                    {
                        path: 'installations',
                        name: 'BranchYtbInstallations',
                        component: () => import('../views/ytb/Installations.vue'),
                        meta: { title: '安装记录', icon: 'Box' }
                    },
                    {
                        path: 'posters',
                        name: 'BranchYtbPosters',
                        component: () => import('../views/ytb/Posters.vue'),
                        meta: { title: '海报管理', icon: 'Picture' }
                    },
                    {
                        path: 'withdrawals',
                        name: 'BranchYtbWithdrawals',
                        component: () => import('../views/ytb/Withdrawals.vue'),
                        meta: { title: '提现管理', icon: 'CreditCard' }
                    }
                ]
            }
        ]
    },
    {
        path: '/',
        component: ThreeColumnLayout, // 使用三栏式布局
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: { name: 'Dashboard' }
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: '控制面板', icon: 'dashboard' }
            },
            {
                path: 'data-cockpit',
                name: 'DataCockpit',
                component: DataCockpit,
                meta: { title: '数据驾驶舱', icon: 'DataAnalysis' }
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
            // 用户管理
            {
                path: 'users',
                name: 'Users',
                component: () => import('../views/users/UserLayout.vue'),
                meta: { title: '用户管理', icon: 'user' },
                redirect: { name: 'AppUsers' },
                children: [
                    {
                        path: 'app-users',
                        name: 'AppUsers',
                        component: () => import('../views/users/app-users/List.vue'),
                        meta: { title: 'APP用户', icon: 'user' }
                    },
                    // 准客户管理
                    {
                        path: 'prospects',
                        name: 'Prospects',
                        component: () => import('../views/users/prospects/List.vue'),
                        meta: { title: '准客户', icon: 'Opportunity' }
                    },
                    // 业务员管理
                    {
                        path: 'salesmen',
                        name: 'SalesmenList',
                        component: () => import('../views/users/salesmen/List.vue'),
                        meta: { title: '业务员管理', icon: 'briefcase' }
                    },
                    {
                        path: 'salesmen/create',
                        name: 'SalesmenCreate',
                        component: () => import('../views/users/salesmen/Create.vue'),
                        meta: { title: '新增业务员', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/:id',
                        name: 'SalesmenDetail',
                        component: () => import('../views/users/salesmen/Show.vue'),
                        meta: { title: '业务员详情', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/:id/edit',
                        name: 'SalesmenEdit',
                        component: () => import('../views/users/salesmen/Edit.vue'),
                        meta: { title: '编辑业务员', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/:id/sales',
                        name: 'SalesmenSales',
                        component: () => import('../views/users/salesmen/sales/List.vue'),
                        meta: { title: '销售记录', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'birthday',
                        name: 'BirthdayManagement',
                        component: () => import('../views/crm/birthday/Index.vue'),
                        meta: { title: '生日祝福', icon: 'Present' }
                    },
                    {
                        path: 'wechat-work-customers',
                        name: 'WechatWorkCustomers',
                        component: () => import('../views/crm/wechat-work-customers/Index.vue'),
                        meta: { title: '企微客户', icon: 'ChatDotRound' }
                    },
                    {
                        path: 'salesmen/:id/commissions',
                        name: 'SalesmenCommissions',
                        component: () => import('../views/users/salesmen/commissions/List.vue'),
                        meta: { title: '佣金记录', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/:id/targets',
                        name: 'SalesmenTargets',
                        component: () => import('../views/users/salesmen/targets/List.vue'),
                        meta: { title: '目标设置', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/:id/customers',
                        name: 'SalesmenCustomers',
                        component: () => import('../views/users/salesmen/customers/List.vue'),
                        meta: { title: '客户列表', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    // 业务员模块导航页面
                    {
                        path: 'salesmen/statistics',
                        name: 'SalesmenStatistics',
                        component: () => import('../views/users/salesmen/Statistics.vue'),
                        meta: { title: '数据统计', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/performance',
                        name: 'SalesmenPerformance',
                        component: () => import('../views/users/salesmen/Performance.vue'),
                        meta: { title: '绩效管理', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/training',
                        name: 'SalesmenTraining',
                        component: () => import('../views/users/salesmen/Training.vue'),
                        meta: { title: '培训管理', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/team',
                        name: 'SalesmenTeam',
                        component: () => import('../views/users/salesmen/Team.vue'),
                        meta: { title: '团队管理', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    {
                        path: 'salesmen/salary',
                        name: 'SalesmenSalary',
                        component: () => import('../views/users/salesmen/Salary.vue'),
                        meta: { title: '薪酬管理', activeMenu: '/users/salesmen' },
                        hidden: true
                    },
                    // 业务员统计
                    {
                        path: 'salesman-stats',
                        name: 'SalesmanStats',
                        component: () => import('../views/users/salesman-stats/Index.vue'),
                        meta: { title: '业务员统计', icon: 'data-analysis' }
                    },
                    // VIP会员管理
                    {
                        path: 'vip-list',
                        name: 'VipList',
                        component: () => import('../views/users/vip-members/List.vue'),
                        meta: { title: 'CP会员', icon: 'gold-medal' }
                    },
                    {
                        path: 'vip-dividends',
                        name: 'VipDividends',
                        component: () => import('../views/users/vip-members/Dividends.vue'),
                        meta: { title: 'CP分红管理', icon: 'money' }
                    },
                    {
                        path: 'vip-rankings',
                        name: 'VipRankings',
                        component: () => import('../views/users/vip-members/Rankings.vue'),
                        meta: { title: 'CP排行榜', icon: 'trophy' }
                    },
                    {
                        path: 'vip-balance',
                        name: 'VipBalance',
                        component: () => import('../views/users/vip-members/Balance.vue'),
                        meta: { title: 'CP余额管理', icon: 'wallet' }
                    },
                    {
                        path: 'vip-levels',
                        name: 'VipLevels',
                        component: () => import('../views/users/vip-members/Levels.vue'),
                        meta: { title: 'CP等级管理', icon: 'star' }
                    },
                    {
                        path: 'vip-statistics',
                        name: 'VipStatistics',
                        component: () => import('../views/users/vip-members/Statistics.vue'),
                        meta: { title: 'CP统计分析', icon: 'data-analysis' }
                    },
                    // 模拟登录
                    {
                        path: 'simulate-login',
                        name: 'SimulateLogin',
                        component: () => import('../views/users/simulate-login/Index.vue'),
                        meta: { title: '模拟登录', icon: 'Monitor' }
                    },
                    // 茶农助手
                    {
                        path: 'tea-farmers',
                        name: 'TeaFarmers',
                        component: () => import('../views/users/tea-farmers/Index.vue'),
                        meta: { title: '茶农助手', icon: 'List' }
                    },
                    // 开发者管理
                    {
                        path: 'developers',
                        name: 'Developers',
                        component: () => import('../views/users/developers/Index.vue'),
                        meta: { title: '开发者', icon: 'Avatar' }
                    },
                    // 社区论坛管理
                    {
                        path: 'forum',
                        name: 'ForumManagement',
                        component: () => import('../views/forum/Index.vue'),
                        meta: { title: '社区论坛', icon: 'ChatLineRound' }
                    },
                    // 茶品管理
                    {
                        path: 'tea-products',
                        name: 'TeaProducts',
                        component: () => import('../views/users/tea-products/Index.vue'),
                        meta: { title: '茶品管理', icon: 'Goods', activeMenu: '/users/tea-farmers' }
                    },
                    // 库存记录
                    {
                        path: 'tea-stock-records',
                        name: 'TeaStockRecords',
                        component: () => import('../views/users/tea-stock-records/Index.vue'),
                        meta: { title: '库存记录', icon: 'Document', activeMenu: '/users/tea-farmers' }
                    },
                ]
            },
            // 商城管理
            {
                path: 'mall',
                name: 'Mall',
                component: () => import('../views/mall/MallLayout.vue'),
                meta: { title: '商城管理', icon: 'shopping-cart' },
                children: [
                    {
                        path: '',
                        redirect: { name: 'MallDashboard' }
                    },
                    // 商城总览
                    {
                        path: 'dashboard',
                        name: 'MallDashboard',
                        component: () => import('../views/mall/Dashboard.vue'),
                        meta: { title: '商城总览', icon: 'dashboard' }
                    },
                    // 官方商城
                    {
                        path: 'official',
                        component: () => import('../views/mall/official/Index.vue'),
                        meta: { title: '官方商城', icon: 'shop' },
                        redirect: { name: 'OfficialDashboard' },
                        children: [
                            {
                                path: 'dashboard',
                                name: 'OfficialDashboard',
                                component: () => import('../views/mall/official/Dashboard.vue'),
                                meta: { title: '首页概览', icon: 'dashboard' }
                            },
                            {
                                path: 'categories',
                                name: 'OfficialCategories',
                                component: () => import('../views/mall/official/Categories.vue'),
                                meta: { title: '商品分类', icon: 'folder' }
                            },
                            {
                                path: 'orders',
                                name: 'OfficialOrders',
                                component: () => import('../views/mall/official/orders/List.vue'),
                                meta: { title: '订单管理', icon: 'list' }
                            },
                            {
                                path: 'products',
                                name: 'OfficialProducts',
                                component: () => import('../views/mall/official/Products.vue'),
                                meta: { title: '商品列表', icon: 'goods' }
                            },
                            {
                                path: 'logistics',
                                name: 'OfficialLogistics',
                                component: () => import('../views/mall/official/Logistics.vue'),
                                meta: { title: '物流管理', icon: 'list' }
                            },
                            {
                                path: 'users',
                                name: 'OfficialUsers',
                                component: () => import('../views/mall/official/Users.vue'),
                                meta: { title: '用户管理', icon: 'user' }
                            }
                        ]
                    },
                    {
                        path: 'merchant',
                        component: () => import('../views/mall/merchant/Index.vue'),
                        meta: { title: '商户商城', icon: 'shop' },
                        children: [
                            {
                                path: '',
                                redirect: { name: 'MerchantDashboard' }
                            },
                            {
                                path: 'dashboard',
                                name: 'MerchantDashboard',
                                component: () => import('../views/mall/merchant/Dashboard.vue'),
                                meta: { title: '首页概览', icon: 'dashboard' }
                            },
                            {
                                path: 'merchants',
                                name: 'MerchantManagement',
                                component: () => import('../views/mall/merchant/Merchants.vue'),
                                meta: { title: '商户管理', icon: 'user', merchantContext: 'mall' }
                            },
                            {
                                path: 'categories',
                                name: 'MerchantCategories',
                                component: () => import('../views/mall/merchant/Categories.vue'),
                                meta: { title: '商品分类', icon: 'folder' }
                            },
                            {
                                path: 'orders',
                                name: 'MerchantOrders',
                                component: () => import('../views/mall/merchant/orders/List.vue'),
                                meta: { title: '订单管理', icon: 'list' }
                            },
                            {
                                path: 'products',
                                name: 'MerchantProducts',
                                component: () => import('../views/mall/merchant/Products.vue'),
                                meta: { title: '商品列表', icon: 'goods' }
                            },
                            {
                                path: 'logistics',
                                name: 'MerchantLogistics',
                                component: () => import('../views/mall/merchant/Logistics.vue'),
                                meta: { title: '物流管理', icon: 'list' }
                            },
                            {
                                path: 'users',
                                name: 'MerchantUsers',
                                component: () => import('../views/mall/merchant/Users.vue'),
                                meta: { title: '用户管理', icon: 'user' }
                            },
                            {
                                path: 'points',
                                name: 'MerchantPoints',
                                component: () => import('../views/mall/merchant/Points.vue'),
                                meta: { title: '商户积分', icon: 'list' }
                            }
                        ]
                    },
                    // 综合分类管理
                    {
                        path: 'categories',
                        name: 'Categories',
                        component: () => import('../views/mall/Categories.vue'),
                        meta: { title: '分类管理', icon: 'folder' }
                    },
                    {
                        path: 'products',
                        name: 'Products',
                        component: () => import('../views/mall/products/List.vue'),
                        meta: { title: '商品管理', icon: 'goods' }
                    },
                    {
                        path: 'orders',
                        name: 'Orders',
                        component: () => import('../views/mall/orders/List.vue'),
                        meta: { title: '订单管理', icon: 'list' }
                    },
                    {
                        path: 'orders/:id',
                        component: () => import('../views/mall/orders/Detail.vue'),
                        name: 'OrderDetail',
                        meta: { title: '订单详情', activeMenu: '/mall/orders' },
                        hidden: true
                    },
                    {
                        path: 'refunds',
                        component: () => import('../views/mall/orders/Refunds.vue'),
                        name: 'Refunds',
                        meta: { title: '退款管理', icon: 'money' }
                    },
                    {
                        path: 'config',
                        component: () => import('../views/mall/config/Index.vue'),
                        meta: { title: '商城设置', icon: 'setting' },
                        redirect: { name: 'MallConfigOverview' },
                        children: [
                            {
                                path: '',
                                name: 'MallConfigOverview',
                                component: () => import('../views/mall/config/ConfigDashboard.vue'),
                                meta: { title: '设置总览', icon: 'setting' }
                            },
                            {
                                path: 'settings',
                                name: 'MallConfigSettings',
                                component: () => import('../views/mall/config/Settings.vue'),
                                meta: { title: '基础设置', icon: 'setting', activeMenu: '/mall/config' }
                            },
                            {
                                path: 'payment',
                                name: 'MallConfigPayment',
                                component: () => import('../views/mall/config/Payment.vue'),
                                meta: { title: '支付配置', icon: 'CreditCard', activeMenu: '/mall/config' }
                            },
                            {
                                path: 'banners',
                                name: 'MallConfigBanners',
                                component: () => import('../views/mall/config/banners/List.vue'),
                                meta: { title: '运营位管理', icon: 'picture', activeMenu: '/mall/config' }
                            }
                        ]
                    },
                    // 系统管理
                    {
                        path: 'system/dashboard',
                        name: 'MallSystemDashboard',
                        component: () => import('../views/mall/system/Dashboard.vue'),
                        meta: { title: '系统概览', icon: 'setting' }
                    }
                ]
            },
            // 净水器
            {
                path: 'devices',
                name: 'DeviceManagement',
                component: () => import('../views/devices/DeviceLayout.vue'),
                meta: { title: '净水器', icon: 'Tools' },
                redirect: { name: 'HQDevices' },
                children: [
                    {
                        path: 'hq-devices',
                        name: 'HQDevices',
                        component: () => import('../views/devices/List.vue'),
                        meta: { title: '点点够设备', icon: 'monitor' }
                    },
                    {
                        path: 'installation',
                        name: 'PurifierInstallation',
                        component: () => import('../views/installation/InstallationWorkspace.vue'),
                        meta: { title: '安装管理', icon: 'Van' }
                    },
                    {
                        path: 'installation/booking/:id',
                        name: 'InstallationBookingDetail',
                        component: () => import('../views/installation/BookingDetail.vue'),
                        hidden: true,
                        meta: { title: '预约详情', activeMenu: '/devices/installation' }
                    },
                    {
                        path: 'tapp-devices',
                        component: () => import('@/views/devices/TappDeviceList.vue'),
                        name: 'TappDeviceList',
                        meta: { title: '点点够设备', icon: 'el-icon-water-cup' }
                    },
                    {
                        path: 'tapp-devices/:id',
                        component: () => import('@/views/devices/Detail.vue'),
                        name: 'TappDeviceDetail',
                        hidden: true,
                        meta: { title: '设备详情（已改抽屉展示，仍保留路由以兼容直接访问）', activeMenu: '/devices/tapp-devices' }
                    },
                    {
                        path: 'tapp-devices/:id/edit',
                        component: () => import('@/views/devices/Edit.vue'),
                        name: 'TappDeviceEdit',
                        hidden: true,
                        meta: { title: '编辑设备', activeMenu: '/devices/tapp-devices' }
                    },
                    {
                        path: 'water-points',
                        name: 'WaterPoints',
                        component: () => import('../views/devices/water-points/NewList.vue'),
                        meta: { title: '取水点管理', icon: 'location' }
                    },
                    {
                        path: 'water-points/create',
                        name: 'WaterPointCreate',
                        component: () => import('../views/devices/water-points/Create.vue'),
                        meta: { title: '新增取水点', icon: 'plus' }
                    },
                    {
                        path: 'water-points/:id',
                        name: 'WaterPointDetail',
                        component: () => import('../views/devices/water-points/Detail.vue'),
                        meta: { title: '取水点详情', icon: 'view' }
                    },
                    {
                        path: 'water-points/:id/edit',
                        name: 'WaterPointEdit',
                        component: () => import('../views/devices/water-points/Edit.vue'),
                        meta: { title: '编辑取水点', icon: 'edit' }
                    }
                ]
            },
            // 机构管理
            {
                path: 'institutions',
                name: 'InstitutionsRoot',
                component: () => import('../views/institution/Index.vue'),
                redirect: { name: 'Institutions' },
                meta: { title: '机构管理', icon: 'OfficeBuilding' },
                children: [
                    {
                        path: 'list',
                        name: 'Institutions',
                        component: () => import('../views/institution/List.vue'),
                        meta: { title: '机构列表', icon: 'List' }
                    },
                    {
                        path: 'quota',
                        name: 'InstitutionQuota',
                        component: () => import('../views/institution/Quota.vue'),
                        meta: { title: '额度管理', icon: 'Tickets' }
                    },
                    {
                        path: 'meituan',
                        name: 'InstitutionMeituan',
                        component: () => import('../views/institution/Meituan.vue'),
                        meta: { title: '美团机构', icon: 'TakeawayBox' }
                    },
                    {
                        path: 'meituan/:id(\\d+)',
                        name: 'InstitutionMeituanDetail',
                        component: () => import('../views/institution/MeituanDetail.vue'),
                        meta: { title: '美团机构详情', activeMenu: '/institutions/meituan' },
                        hidden: true
                    },
                    {
                        path: ':id(\\d+)',
                        name: 'InstitutionDetail',
                        component: () => import('../views/institution/Detail.vue'),
                        meta: { title: '机构详情', activeMenu: '/institutions/list' },
                        hidden: true
                    }
                    ,
                    {
                        path: 'salesmen',
                        name: 'InstitutionSalesmen',
                        component: () => import('../views/institution/Salesman.vue'),
                        meta: { title: '业务员', icon: 'User' }
                    }
                ]
            },
            // 渠道商管理
            {
                path: 'agents',
                name: 'Agents',
                component: () => import('../views/agents/List.vue'),
                meta: { title: '渠道商列表', icon: 'user-group' }
            },
            // 商户管理
            {
                path: 'merchant',
                name: 'Merchants',
                component: () => import('../views/merchants/Index.vue'),
                meta: { title: '商户', icon: 'shop' },
                redirect: { name: 'MerchantHome' },
                children: [
                    {
                        path: 'dashboard',
                        name: 'MerchantHome',
                        component: () => import('../views/merchants/Dashboard.vue'),
                        meta: { title: '商户概览', icon: 'DataAnalysis' }
                    },
                    {
                        path: 'list',
                        name: 'MerchantList',
                        component: () => import('../views/merchants/List.vue'),
                        meta: { title: '商户列表', icon: 'Collection' }
                    },
                    {
                        path: 'stats',
                        name: 'MerchantStats',
                        component: () => import('../views/merchants/Stats.vue'),
                        meta: { title: '商户统计', icon: 'TrendCharts' }
                    },
                    {
                        path: 'onboarding',
                        name: 'MerchantOnboarding',
                        component: () => import('../views/mall/merchant/Merchants.vue'),
                        meta: { title: '进件管理', icon: 'DocumentAdd', merchantContext: 'onboarding' }
                    }
                ]
            },
            // 工程师管理
            {
                path: 'engineers',
                name: 'Engineers',
                component: () => import('../views/engineers/List.vue'),
                meta: { title: '工程师列表', icon: 'tools' }
            },
            // 亿拓宝(YTB)管理
            {
                path: 'ytb',
                name: 'YtbManagement',
                component: () => import('../views/RouterView.vue'),
                meta: { title: '亿拓宝管理', icon: 'Promotion' },
                redirect: { name: 'YtbStatistics' },
                children: [
                    {
                        path: 'statistics',
                        name: 'YtbStatistics',
                        component: () => import('../views/ytb/Statistics.vue'),
                        meta: { title: '数据统计', icon: 'DataAnalysis' }
                    },
                    {
                        path: 'users',
                        redirect: '/users/app-users'
                    },
                    {
                        path: 'upgrades',
                        name: 'YtbUpgrades',
                        component: () => import('../views/ytb/Upgrades.vue'),
                        meta: { title: '升级审批', icon: 'DocumentChecked' }
                    },
                    {
                        path: 'commissions',
                        name: 'YtbCommissions',
                        component: () => import('../views/ytb/Commissions.vue'),
                        meta: { title: '分佣管理', icon: 'Money' }
                    },
                    {
                        path: 'investments',
                        name: 'YtbInvestments',
                        component: () => import('../views/ytb/Investments.vue'),
                        meta: { title: 'BossCP投资', icon: 'Wallet' }
                    },
                    {
                        path: 'installations',
                        name: 'YtbInstallations',
                        component: () => import('../views/ytb/Installations.vue'),
                        meta: { title: '安装记录', icon: 'Box' }
                    },
                    {
                        path: 'posters',
                        name: 'YtbPosters',
                        component: () => import('../views/ytb/Posters.vue'),
                        meta: { title: '海报管理', icon: 'Picture' }
                    },
                    {
                        path: 'withdrawals',
                        name: 'YtbWithdrawals',
                        component: () => import('../views/ytb/Withdrawals.vue'),
                        meta: { title: '提现管理', icon: 'CreditCard' }
                    }
                ]
            },
            // 公众号管理
            {
                path: 'wechat',
                name: 'WechatManagement',
                component: () => import('../views/RouterView.vue'),
                meta: { title: '公众号管理', icon: 'ChatDotRound' },
                redirect: { name: 'WechatFans' },
                children: [
                    {
                        path: 'fans',
                        name: 'WechatFans',
                        component: () => import('../views/wechat/Fans.vue'),
                        meta: { title: '粉丝管理', icon: 'User' }
                    },
                    {
                        path: 'menus',
                        name: 'WechatMenus',
                        component: () => import('../views/wechat/Menus.vue'),
                        meta: { title: '自定义菜单', icon: 'Menu' }
                    },
                    {
                        path: 'replies',
                        name: 'WechatReplies',
                        component: () => import('../views/wechat/Replies.vue'),
                        meta: { title: '自动回复', icon: 'ChatLineSquare' }
                    },
                    {
                        path: 'qrcodes',
                        name: 'WechatQrcodes',
                        component: () => import('../views/wechat/Qrcodes.vue'),
                        meta: { title: '二维码管理', icon: 'Grid' }
                    }
                ]
            },
            // 系统管理（整合权限管理、系统设置、通知管理、短信管理）
            {
                path: 'system',
                name: 'System',
                component: () => import('../views/system/SystemLayout.vue'),
                meta: { title: '系统管理', icon: 'tools' },
                redirect: { name: 'SystemAccessCenter' },
                children: [
                    {
                        path: 'access-center',
                        name: 'SystemAccessCenter',
                        component: () => import('../views/system/access/AccessCenter.vue'),
                        meta: { title: '系统访问中心', icon: 'operation' }
                    },
                    {
                        path: 'admins',
                        name: 'AdminUsers',
                        redirect: () => ({ path: '/system/access-center', query: { tab: 'admins' } }),
                        meta: { title: '后台管理员', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'roles',
                        name: 'RoleManagement',
                        redirect: () => ({ path: '/system/access-center', query: { tab: 'roles' } }),
                        meta: { title: '角色管理', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'permissions',
                        name: 'PermissionManagement',
                        redirect: () => ({ path: '/system/access-center', query: { tab: 'permissions' } }),
                        meta: { title: '权限管理', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'access-analytics',
                        name: 'AccessAnalytics',
                        redirect: () => ({ path: '/system/access-center', query: { tab: 'analytics' } }),
                        meta: { title: '权限分析', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    // 权限管理模块（整合到系统管理下）
                    {
                        path: 'admins/create',
                        name: 'AdminCreate',
                        component: () => import('../views/system/admins/Create.vue'),
                        meta: { title: '新增管理员', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'admins/:id/edit',
                        name: 'AdminEdit',
                        component: () => import('../views/system/admins/Edit.vue'),
                        meta: { title: '编辑管理员', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'roles/create',
                        name: 'RoleCreate',
                        component: () => import('../views/system/roles/Create.vue'),
                        meta: { title: '新增角色', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'roles/:id/edit',
                        name: 'RoleEdit',
                        component: () => import('../views/system/roles/Edit.vue'),
                        meta: { title: '编辑角色', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'permissions/create',
                        name: 'PermissionCreate',
                        component: () => import('../views/system/permissions/Create.vue'),
                        meta: { title: '新增权限', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    {
                        path: 'permissions/:id/edit',
                        name: 'PermissionEdit',
                        component: () => import('../views/system/permissions/Edit.vue'),
                        meta: { title: '编辑权限', activeMenu: '/system/access-center' },
                        hidden: true
                    },
                    // 系统设置模块
                    {
                        path: 'menu',
                        name: 'MenuManagement',
                        component: () => import('../views/system/menu/List.vue'),
                        meta: { title: '菜单管理', icon: 'menu' }
                    },
                    {
                        path: 'settings',
                        name: 'SystemSettings',
                        component: () => import('../views/settings/Index.vue'),
                        meta: { title: '系统设置', icon: 'setting' }
                    },
                    {
                        path: 'storage',
                        name: 'SystemStorage',
                        component: () => import('../views/settings/app/OssConfig.vue'),
                        meta: { title: '附件存储', icon: 'FolderOpened' }
                    },
                    {
                        path: 'login-logs',
                        name: 'LoginLogs',
                        component: () => import('../views/system/LoginLogs.vue'),
                        meta: { title: '登录日志', icon: 'list' }
                    },
                    // APP导航管理
                    {
                        path: 'nav',
                        name: 'NavManagement',
                        component: () => import('../views/system/nav/Index.vue'),
                        meta: { title: 'APP导航管理', icon: 'compass' }
                    },
                    {
                        path: 'mobile-home',
                        name: 'MobileHomeConfig',
                        component: () => import('../views/system/mobile-home/Index.vue'),
                        meta: { title: '移动端首页', icon: 'iphone' }
                    },
                    {
                        path: 'banners',
                        name: 'SystemBanners',
                        component: () => import('../views/mall/banners/List.vue'),
                        meta: { title: 'Banner管理', icon: 'picture' }
                    },
                    // 通知管理
                    {
                        path: 'notifications',
                        name: 'NotificationManagement',
                        component: () => import('../views/notifications/Index.vue'),
                        meta: { title: '通知管理', icon: 'bell' }
                    },
                    {
                        path: 'notifications/:id',
                        name: 'NotificationDetail',
                        component: () => import('../views/notifications/Detail.vue'),
                        meta: { title: '通知详情', activeMenu: '/system/notifications' },
                        hidden: true
                    },
                    // 短信管理
                    {
                        path: 'sms-logs',
                        name: 'SmsLogs',
                        component: () => import('../views/system/sms_new/Logs.vue'),
                        meta: { title: '短信日志', icon: 'message' }
                    },
                    {
                        path: 'sms-stats',
                        name: 'SmsStatistics',
                        component: () => import('../views/system/sms_new/Statistics.vue'),
                        meta: { title: '短信统计', icon: 'data-analysis' }
                    },
                    {
                        path: 'sms-statistics',
                        name: 'SmsStatisticsAlias',
                        component: () => import('../views/system/sms_new/Statistics.vue'),
                        meta: { title: '短信统计', icon: 'data-analysis' }
                    },
                    {
                        path: 'sms-codes',
                        name: 'SmsCodes',
                        component: () => import('../views/system/sms_new/Codes.vue'),
                        meta: { title: '验证码管理', icon: 'key' }
                    },
                    // 任务管理
                    {
                        path: 'scheduled-tasks',
                        name: 'ScheduledTasks',
                        component: () => import('../views/system/ScheduledTasks.vue'),
                        meta: { title: '任务管理', icon: 'clock' }
                    },
                    // 小程序分享配置
                    {
                        path: 'miniprogram-share-config',
                        name: 'MiniprogramShareConfig',
                        component: () => import('../views/system/MiniprogramShareConfig.vue'),
                        meta: { title: '小程序分享配置', icon: 'share' }
                    },
                    // 服务器管理
                    {
                        path: 'server',
                        name: 'ServerManagement',
                        component: () => import('../views/system/server/Index.vue'),
                        meta: { title: '服务器管理', icon: 'monitor' }
                    },
                    {
                        path: 'payment-center',
                        name: 'SystemPaymentWorkspace',
                        component: () => import('../views/system/PaymentWorkspace.vue'),
                        meta: { title: '支付', icon: 'credit-card' }
                    },
                    {
                        path: 'app-management',
                        name: 'SystemAppWorkspace',
                        component: () => import('../views/system/AppManagementWorkspace.vue'),
                        meta: { title: 'APP管理', icon: 'mobile-phone' }
                    },
                    // 分支机构工作台
                    {
                        path: 'branch-center',
                        name: 'SystemBranchWorkspace',
                        component: () => import('../views/system/BranchWorkspace.vue'),
                        meta: { title: '分支机构', icon: 'office-building' }
                    },
                    {
                        path: 'branch-organizations',
                        name: 'BranchOrganizations',
                        redirect: { name: 'SystemBranchWorkspace', query: { tab: 'organizations' } },
                        meta: { title: '分支机构管理', icon: 'office-building', activeMenu: '/system/branch-center' },
                        hidden: true
                    },
                    {
                        path: 'branch-menus',
                        name: 'BranchMenus',
                        redirect: { name: 'SystemBranchWorkspace', query: { tab: 'menus' } },
                        meta: { title: '分支机构菜单', icon: 'menu', activeMenu: '/system/branch-center' },
                        hidden: true
                    },
                    {
                        path: 'branch-dividends',
                        name: 'BranchDividends',
                        redirect: { name: 'SystemBranchWorkspace', query: { tab: 'dividends' } },
                        meta: { title: '分红配置管理', icon: 'money', activeMenu: '/system/branch-center' },
                        hidden: true
                    },
                    {
                        path: 'wechat-accounts',
                        name: 'WechatAccounts',
                        redirect: { name: 'SystemBranchWorkspace', query: { tab: 'wechat' } },
                        meta: { title: '微信公众号管理', icon: 'chat-dot-round', activeMenu: '/system/branch-center' },
                        hidden: true
                    },
                    // 微信公众号授权回调
                    {
                        path: 'wechat-accounts/auth-callback',
                        name: 'WechatAccountsAuthCallback',
                        component: () => import('../views/system/WechatAccountsAuthCallback.vue'),
                        meta: { title: '微信公众号授权回调', icon: 'chat-dot-round', hideInMenu: true, activeMenu: '/system/branch-center' }
                    },
                    // 微信第三方平台配置
                    {
                        path: 'wechat-third-party-platform',
                        name: 'WechatThirdPartyPlatform',
                        component: () => import('../views/system/WechatThirdPartyPlatform.vue'),
                        meta: { title: '微信第三方平台', icon: 'platform' }
                    },
                    // API接口管理
                    {
                        path: 'api-management',
                        name: 'ApiManagement',
                        component: () => import('../views/system/api-management/index.vue'),
                        meta: { title: 'API接口管理', icon: 'connection' }
                    }
                ]
            },
            // 财务管理
            {
                path: 'finance',
                name: 'Finance',
                component: () => import('../views/finance/FinanceLayout.vue'),
                meta: { title: '财务', icon: 'Money' },
                redirect: { name: 'FinanceBalanceManagement' },
                children: [
                    {
                        path: 'balance-management',
                        name: 'FinanceBalanceManagement',
                        component: () => import('../views/shengfutong/BalanceManagement.vue'),
                        meta: { title: '盛付通余额管理', icon: 'Wallet' }
                    },
                    {
                        path: 'shengfutong',
                        name: 'FinanceShengfutong',
                        component: () => import('../views/finance/Shengfutong.vue'),
                        meta: { title: '盛付通提现', icon: 'CreditCard' }
                    },
                    {
                        path: 'xinsheng',
                        name: 'FinanceXinsheng',
                        component: () => import('../views/finance/Xinsheng.vue'),
                        meta: { title: '新生提现', icon: 'Star' }
                    },
                    {
                        path: 'purifier',
                        name: 'FinancePurifier',
                        component: () => import('../views/finance/Purifier.vue'),
                        meta: { title: '净水器提现', icon: 'Tools' }
                    },
                    {
                        path: 'meituan-balance',
                        name: 'FinanceMeituanBalance',
                        component: () => import('../views/finance/MeituanBalance.vue'),
                        meta: { title: '美团余额管理', icon: 'Wallet' }
                    },
                    {
                        path: 'meituan-withdraw',
                        name: 'FinanceMeituanWithdraw',
                        component: () => import('../views/finance/MeituanWithdraw.vue'),
                        meta: { title: '美团提现', icon: 'Coin' }
                    }
                ]
            },
            // 盛付通管理
            {
                path: 'shengfutong',
                name: 'Shengfutong',
                component: () => import('../views/shengfutong/Layout.vue'),
                meta: { title: '盛付通', icon: 'CreditCard' },
                redirect: { name: 'ShengfutongDashboard' },
                children: [
                    {
                        path: 'dashboard',
                        name: 'ShengfutongDashboard',
                        component: () => import('../views/shengfutong/Dashboard.vue'),
                        meta: { title: '控制面板', icon: 'DataBoard' }
                    },
                    {
                        path: 'data-upload',
                        name: 'ShengfutongDataUpload',
                        component: () => import('../views/shengfutong/DataUpload.vue'),
                        meta: { title: '数据上传', icon: 'Upload' }
                    },
                    {
                        path: 'daily-data',
                        name: 'ShengfutongDailyData',
                        component: () => import('../views/shengfutong/DailyData.vue'),
                        meta: { title: '日数据', icon: 'Calendar' }
                    },
                    {
                        path: 'monthly-data',
                        name: 'ShengfutongMonthlyData',
                        component: () => import('../views/shengfutong/MonthlyData.vue'),
                        meta: { title: '月数据', icon: 'Date' }
                    },
                    {
                        path: 'institution-summary',
                        name: 'ShengfutongInstitutionSummary',
                        component: () => import('../views/shengfutong/InstitutionSummary.vue'),
                        meta: { title: '机构汇总', icon: 'OfficeBuilding' }
                    },
                    {
                        path: 'merchant-list',
                        name: 'ShengfutongMerchantList',
                        component: () => import('../views/shengfutong/MerchantList.vue'),
                        meta: { title: '商户列表', icon: 'Shop' }
                    },
                    {
                        path: 'merchant-summary',
                        name: 'ShengfutongMerchantSummary',
                        component: () => import('../views/shengfutong/MerchantSummary.vue'),
                        meta: { title: '商户汇总', icon: 'DataAnalysis' }
                    }
                ]
            },
            // 星驿付管理
            {
                path: 'starpay',
                name: 'Starpay',
                component: () => import('../views/starpay/Layout.vue'),
                meta: { title: '星驿付', icon: 'Star' },
                redirect: { name: 'StarpayDashboard' },
                children: [
                    {
                        path: 'dashboard',
                        name: 'StarpayDashboard',
                        component: () => import('../views/starpay/Dashboard.vue'),
                        meta: { title: '数据驾驶舱', icon: 'DataAnalysis' }
                    },
                    {
                        path: 'upload',
                        name: 'StarpayUpload',
                        component: () => import('../views/starpay/StarUpload.vue'),
                        meta: { title: '数据上传', icon: 'Upload' }
                    },
                    {
                        path: 'merchants',
                        name: 'StarpayMerchants',
                        component: () => import('../views/starpay/Merchants.vue'),
                        meta: { title: '商户管理', icon: 'Shop' }
                    },
                    {
                        path: 'partners',
                        name: 'StarpayPartners',
                        component: () => import('../views/starpay/Partners.vue'),
                        meta: { title: '服务商管理', icon: 'User' }
                    }
                ]
            },
            // 净水器管理（七云智联IOT）
            {
                path: 'water-purifier',
                name: 'WaterPurifier',
                component: () => import('../views/water-purifier/Layout.vue'),
                meta: { title: '净水器管理', icon: 'Watermelon' },
                redirect: { name: 'WaterPurifierDashboard' },
                children: [
                    {
                        path: 'dashboard',
                        name: 'WaterPurifierDashboard',
                        component: () => import('../views/water-purifier/Dashboard.vue'),
                        meta: { title: '数据驾驶舱', icon: 'DataBoard' }
                    },
                    {
                        path: 'faults',
                        name: 'WaterFaults',
                        component: () => import('../views/water-purifier/Faults.vue'),
                        meta: { title: '故障预警', icon: 'Warning' }
                    },
                    {
                        path: 'stock',
                        name: 'WaterPurifierStock',
                        component: () => import('../views/water-purifier/DeviceStock.vue'),
                        meta: { title: '设备入库', icon: 'Box' }
                    },
                    {
                        path: 'devices',
                        name: 'WaterPurifierDevices',
                        component: () => import('../views/water-purifier/Devices.vue'),
                        meta: { title: '设备列表', icon: 'List' }
                    },
                    {
                        path: 'filter-alerts',
                        name: 'WaterPurifierFilterAlerts',
                        component: () => import('../views/water-purifier/FilterAlerts.vue'),
                        meta: { title: '滤芯预警', icon: 'Warning' }
                    },
                    {
                        path: 'recharge-records',
                        name: 'WaterPurifierRechargeRecords',
                        component: () => import('../views/water-purifier/RechargeRecords.vue'),
                        meta: { title: '充值记录', icon: 'Wallet' }
                    },
                    {
                        path: 'install-orders',
                        name: 'WaterPurifierInstallOrders',
                        component: () => import('../views/water-purifier/InstallOrders.vue'),
                        meta: { title: '安装订单', icon: 'Tools' }
                    },
                    {
                        path: 'packages',
                        name: 'WaterPurifierPackages',
                        component: () => import('../views/water-purifier/Packages.vue'),
                        meta: { title: '套餐管理', icon: 'ShoppingBag' }
                    },
                    {
                        path: 'logs',
                        name: 'WaterPurifierLogs',
                        component: () => import('../views/water-purifier/Logs.vue'),
                        meta: { title: '操作日志', icon: 'Document' }
                    },
                    {
                        path: 'usage-stats',
                        name: 'WaterPurifierUsageStats',
                        component: () => import('../views/water-purifier/UsageStats.vue'),
                        meta: { title: '用水量统计', icon: 'DataAnalysis' }
                    },
                    {
                        path: 'dealers',
                        name: 'WaterPurifierDealers',
                        component: () => import('../views/water-purifier/Dealers.vue'),
                        meta: { title: '渠道商管理', icon: 'User' }
                    },
                    {
                        path: 'engineers',
                        name: 'WaterPurifierEngineers',
                        component: () => import('../views/water-purifier/Engineers.vue'),
                        meta: { title: '工程师管理', icon: 'Service' }
                    }
                ]
            },
            // 美团管理
            {
                path: 'meituan',
                name: 'Meituan',
                component: () => import('../views/meituan/Layout.vue'),
                meta: { title: '美团', icon: 'TakeawayBox' },
                redirect: { name: 'MeituanDataCockpit' },
                children: [
                    {
                        path: 'dashboard',
                        name: 'MeituanDataCockpit',
                        component: () => import('../views/meituan/DataCockpit.vue'),
                        meta: { title: '数据驾驶舱', icon: 'DataBoard' }
                    },
                    {
                        path: 'data-upload',
                        name: 'MeituanDataUpload',
                        component: () => import('../views/meituan/DataUpload.vue'),
                        meta: { title: '数据上传', icon: 'Upload' }
                    },
                    {
                        path: 'merchant-management',
                        name: 'MeituanMerchantManagement',
                        component: () => import('../views/meituan/MerchantManagement.vue'),
                        meta: { title: '商户管理', icon: 'Shop' }
                    },
                    {
                        path: 'sales-query',
                        name: 'MeituanSalesQuery',
                        component: () => import('../views/meituan/SalesQuery.vue'),
                        meta: { title: '销售查询', icon: 'TrendCharts' }
                    },
                    {
                        path: 'terminal-query',
                        name: 'MeituanTerminalQuery',
                        component: () => import('../views/meituan/TerminalQuery.vue'),
                        meta: { title: '终端查询', icon: 'Monitor' }
                    },
                    {
                        path: 'sales-staff',
                        name: 'MeituanSalesStaff',
                        component: () => import('../views/meituan/SalesStaff.vue'),
                        meta: { title: '销售人员管理', icon: 'User' }
                    }
                ]
            },
            // 活动营销
            {
                path: 'poster',
                name: 'Poster',
                component: () => import('../views/RouterView.vue'),
                meta: { title: '活动营销', icon: 'Promotion' },
                redirect: { name: 'PosterList' },
                children: [
                    {
                        path: 'list',
                        name: 'PosterList',
                        component: () => import('../views/poster/List.vue'),
                        meta: { title: '邀请海报', icon: 'Picture' }
                    },
                    {
                        path: 'create',
                        name: 'PosterCreate',
                        component: () => import('../views/poster/Edit.vue'),
                        meta: { title: '创建海报', activeMenu: '/poster/list' },
                        hidden: true
                    },
                    {
                        path: ':id/edit',
                        name: 'PosterEdit',
                        component: () => import('../views/poster/Edit.vue'),
                        meta: { title: '编辑海报', activeMenu: '/poster/list' },
                        hidden: true
                    },
                    {
                        path: 'registrations',
                        name: 'PosterRegistrations',
                        component: () => import('../views/poster/Registrations.vue'),
                        meta: { title: '报名记录', icon: 'UserFilled' }
                    },
                    {
                        path: 'statistics',
                        name: 'PosterStatistics',
                        component: () => import('../views/poster/Statistics.vue'),
                        meta: { title: '数据统计', icon: 'DataAnalysis' }
                    },
                    {
                        path: "game-management",
                        name: "GameManagement",
                        component: () => import("../views/RouterView.vue"),
                        meta: { title: "游戏管理", icon: "Monitor" },
                        redirect: { name: "GameConfig" },
                        children: [
                            {
                                path: "config",
                                name: "GameConfig",
                                component: () => import("../views/game/GameConfig.vue"),
                                meta: { title: "游戏配置", icon: "Setting" }
                            },
                            {
                                path: "analytics",
                                name: "GameAnalytics",
                                component: () => import("../views/game/GameAnalytics.vue"),
                                meta: { title: "数据分析", icon: "DataAnalysis" }
                            },
                            {
                                path: "activity",
                                name: "GameActivity",
                                component: () => import("../views/game/GameActivity.vue"),
                                meta: { title: "活动管理", icon: "Calendar" }
                            }
                        ]
                    }
                ]
            },
            // 个人中心
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/profile/Index.vue'),
                meta: { title: '个人信息', icon: 'user' }
            },
            {
                path: 'profile/wechat-binding',
                name: 'WechatBinding',
                component: () => import('../views/profile/WechatBinding.vue'),
                meta: { title: '微信绑定', icon: 'wechat' }
            },
            {
                path: 'change-password',
                name: 'ChangePassword',
                component: () => import('../views/profile/ChangePassword.vue'),
                meta: { title: '修改密码', icon: 'lock' }
            },
            // 兼容旧路由
            {
                path: 'settings/storage',
                redirect: '/system/storage'
            }
        ]
    },
    // 404页面
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
        meta: { requiresAuth: false }
    }
];

// 创建路由实例
const router = createRouter({
    // 使用Hash模式，确保URL中包含#符号
    history: createWebHashHistory(BASE_URL),
    routes: routesConfig,
    // 修改滚动行为，跳转时自动回到顶部
    scrollBehavior() {
        return { top: 0 }
    }
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
    // 记录当前路由到localStorage，以便页面刷新时恢复
    localStorage.setItem('lastRoute', to.fullPath);

    // 检查是否是分支机构相关路由
    const isBranchRoute = to.matched.some(record => record.meta.isBranchAdmin);
    const isBranchLogin = to.name === 'BranchLogin';

    // 分支机构路由认证处理
    if (isBranchRoute) {
        const branchToken = localStorage.getItem('branch_admin_token');
        const branchInfo = localStorage.getItem('branch_info');
        const superAdminToken = getAdminToken(); // 总管理员token

        console.log('分支机构路由认证检查:', {
            route: to.path,
            branchToken: !!branchToken,
            branchInfo: !!branchInfo,
            superAdminToken: !!superAdminToken,
            params: to.params
        });

        // 如果有总管理员token，允许访问分支机构页面
        if (superAdminToken) {
            console.log('总管理员认证通过，允许访问分支机构页面');
            next();
            return;
        }

        // 如果没有总管理员token，检查分支机构token
        if (!branchToken || !branchInfo) {
            // 分支机构未登录，重定向到分支机构登录页
            // 从分支机构信息或路由参数获取代码
            let branchCode = 'unknown';

            if (branchInfo) {
                try {
                    const branch = JSON.parse(branchInfo);
                    branchCode = branch.code || branch.id || 'unknown';
                } catch (e) {
                    console.error('解析分支机构信息失败:', e);
                }
            } else {
                branchCode = to.params.branchId || to.params.branchCode || 'unknown';
            }

            console.log('重定向到分支机构登录页:', branchCode);
            next({
                path: `/branch-login/${branchCode}`,
                query: { redirect: to.fullPath }
            });
            return;
        }

        // 分支机构已登录，继续访问
        console.log('分支机构认证通过，继续访问');
        next();
        return;
    }

    // 如果是分支机构登录页面，不需要认证
    if (isBranchLogin) {
        next();
        return;
    }

    // 特殊处理业务员相关路由
    if (to.path.includes('/users/salesmen') || to.path.includes('/users/salesman-stats')) {
        // 检查是否有有效token
        const token = getAdminToken();
        if (!token) {
            localStorage.removeItem('user');
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            });
            return;
        }
    }

    // 检查路由是否需要认证
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isLoggedIn = getAdminToken();

    if (requiresAuth && !isLoggedIn) {
        // 检查是否处于模拟登录模式
        const isSimulateMode = sessionStorage.getItem('simulate_token')

        if (isSimulateMode) {
            console.log('🔐 管理后台路由守卫检测到模拟登录模式，不清理管理员token')
            // 在模拟登录模式下，不清理管理员token，但仍然需要认证
            // 这里可能是模拟登录相关的请求，允许通过
            next()
            return
        }

        // 非模拟登录模式下才清除可能存在的无效凭证
        clearAdminToken();
        localStorage.removeItem('user');

        // 未登录，重定向到登录页，并保存目标路径
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        });
    } else {
        // 如果已登录且访问登录页，重定向到首页
        if (to.path === '/login' && getAdminToken()) {
            next({ path: '/' });
        } else {
            // 处理组件加载问题
            // 如果路由定义的组件不存在，使用RouterView作为占位符
            if (to.matched.length > 0) {
                const matchedComponents = to.matched.map(record => record.components.default);
                const hasInvalidComponent = matchedComponents.some(comp =>
                    !comp || typeof comp === 'undefined' || (typeof comp === 'string' && comp.includes('||'))
                );

                if (hasInvalidComponent) {
                    console.warn('检测到无效组件，使用RouterView作为占位符');
                    to.matched.forEach(record => {
                        if (!record.components.default || typeof record.components.default === 'undefined' ||
                            (typeof record.components.default === 'string' && record.components.default.includes('||'))) {
                            record.components.default = () => import('../views/errors/404.vue');
                        }
                    });
                }
            }

            next();
        }
    }
});

// 处理路由错误
router.onError((error) => {
    console.error('路由错误:', error);

    // 检查是否是401错误
    if (error.status === 401 || (error.response && error.response.status === 401)) {
        clearAdminToken();
        localStorage.removeItem('user');
        router.push('/login');
        return;
    }

    // 尝试恢复到上一个成功的路由
    const lastRoute = localStorage.getItem('lastRoute');
    if (lastRoute && router.currentRoute.value.path !== lastRoute) {
        router.push(lastRoute);
    }

    // 尝试处理常见的路由错误
    if (error.name === 'ChunkLoadError' || error.code === 'MODULE_NOT_FOUND') {
        console.warn('模块加载失败，尝试刷新页面');
        window.location.reload();
    }
});

export default router;
