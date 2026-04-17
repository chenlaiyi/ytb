import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { oneClickAdminLogin } from '@/api/admin'
import { setAdminAuthData } from '@/utils/auth'
import { Dialog } from 'vant'

const isYtbStandalone =
  import.meta.env.MODE === 'ytb-standalone' ||
  String(import.meta.env.VITE_YTB_STANDALONE || '').toLowerCase() === 'true'

// 路由懒加载
const Home = () => import('../views/home/Index.vue')
const FilterLife = () => import('../views/device/Index.vue')
const Dashboard = () => import('../views/home/Dashboard.vue')
const Device = () => import('../views/device/Index.vue')
const AiCustomerService = () => import('../views/home/AiCustomerService.vue') // AI客服页面
const WaterPoint = () => import('../views/water-point/Index.vue')
const Merchant = () => import('../views/merchant/Index.vue')
const MerchantOnboardingList = () => import('../views/merchant/OnboardingList.vue')
const MerchantOnboarding = () => import('../views/merchant/Onboarding.vue')
const MerchantOnboardingForm = () => import('../views/merchant/OnboardingForm.vue')
const MerchantOnboardingDetail = () => import('../views/merchant/OnboardingDetail.vue')
const User = () => import('../views/user/Index.vue')
const TeaFarmer = () => import('../views/tea-farmer/IntegratedIndex.vue') // 茶农助手集成视图
const TeaFarmerMarket = () => import('../views/tea-farmer/PublicMarket.vue')
const ForumIndex = () => import('../views/forum/Index.vue')
const ForumSection = () => import('../views/forum/Section.vue')
const ForumThread = () => import('../views/forum/Thread.vue')
const ForumLogin = () => import('../views/forum/Login.vue')

// 设备相关页面
const DeviceDetail = () => import('../views/device/Detail.vue')
const DeviceDetailNew = () => import('../views/DeviceDetail.vue') // 新的设备详情页面
const DeviceInstall = () => import('../views/device/Install.vue')
const DeviceMonitor = () => import('../views/device/Monitor.vue')
const MyDevices = () => import('../views/device/MyDevices.vue')

// 取水点相关页面
const WaterPointDetail = () => import('../views/water-point/Detail.vue')
const WaterPointMap = () => import('../views/water-point/Map.vue')

// 商家相关页面
const MerchantDetail = () => import('../views/merchant/Detail.vue')
const MerchantProducts = () => import('../views/merchant/Products.vue')
const MerchantOrders = () => import('../views/merchant/Orders.vue')
const MerchantDashboard = () => import('../views/merchant/Dashboard.vue')
const MerchantTrades = () => import('../views/merchant/Trades.vue')
const MerchantTradeDetail = () => import('../views/merchant/TradeDetail.vue')
const MerchantQRCode = () => import('../views/merchant/QRCode.vue')

// 用户相关页面
const UserOrders = () => import('../views/user/Orders.vue')
const UserWallet = () => import('../views/user/Wallet.vue')
const UserSettings = () => import('../views/user/Settings.vue')
const Login = () => import('../views/user/Login.vue')
const Register = () => import('../views/user/Register.vue')
const ForgotPassword = () => import('../views/user/ForgotPassword.vue')
const UserAddress = () => import('../views/user/Address.vue')
const UserPoints = () => import('../views/user/Points.vue')
const UserCoupons = () => import('../views/user/Coupons.vue')
const UserFeedback = () => import('../views/user/Feedback.vue')
const UserHelp = () => import('../views/user/Help.vue')
const BindPhone = () => import('../views/user/BindPhone.vue')
const WechatCallback = () => import('../views/user/WechatCallback.vue')
const WechatSuccess = () => import('../views/user/WechatSuccess.vue')
const WechatError = () => import('../views/user/WechatError.vue')
// 分支机构相关页面
const BranchLogin = () => import('../views/branch/Login.vue')
const BranchHome = () => import('../views/branch/Home.vue')
const BranchProfile = () => import('../views/branch/Profile.vue')
const BranchWechatSuccess = () => import('../views/branch/WechatSuccess.vue')
const BranchWechatMenu = () => import('../views/branch/WechatMenu.vue')

// 分支机构功能页面
const BranchWallet = () => import('../views/branch/Wallet.vue')
const BranchOrders = () => import('../views/branch/Orders.vue')
const BranchAddress = () => import('../views/branch/Address.vue')
const BranchProducts = () => import('../views/branch/Products.vue')
const BranchEvents = () => import('../views/branch/Events.vue')
const BranchSupport = () => import('../views/branch/Support.vue')
const BranchCommunity = () => import('../views/branch/Community.vue')
const BranchNews = () => import('../views/branch/News.vue')
const BranchContact = () => import('../views/branch/Contact.vue')
const BranchSettings = () => import('../views/branch/Settings.vue')
const BranchFeedback = () => import('../views/branch/Feedback.vue')
const BranchHelp = () => import('../views/branch/Help.vue')
const BranchDevices = () => import('../views/branch/Devices.vue')
const BranchPoints = () => import('../views/branch/Points.vue')
const BranchBenefits = () => import('../views/branch/Benefits.vue')
const BranchBooking = () => import('../views/branch/Booking.vue')
const BranchMembers = () => import('../views/branch/Members.vue')
const BranchRevenue = () => import('../views/branch/Revenue.vue')
const BranchMore = () => import('../views/branch/More.vue')

// 分支机构工作台页面
const BranchSalesmanIndex = () => import('../views/branch/salesman/Index.vue')
const BranchSalesmanInviteWater = () => import('../views/branch/salesman/InviteWater.vue')
const InviteWaterRegister = () => import('../views/invite/InviteWaterRegister.vue')
const BranchVipIndex = () => import('../views/branch/vip/Index.vue')
const BranchVipTeam = () => import('../views/branch/vip/Team.vue')
const BranchVipDividend = () => import('../views/branch/vip/Dividend.vue')
const BranchVipDividendHistory = () => import('../views/branch/vip/DividendHistory.vue')
const BranchVipDividendDetail = () => import('../views/branch/vip/DividendDetail.vue')
const BranchVipRecruitRanking = () => import('../views/branch/vip/RecruitRanking.vue')
const BranchVipTeamDevices = () => import('../views/branch/vip/TeamDevices.vue')
const BranchVipList = () => import('../views/branch/vip/VipList.vue')
const BranchVipDividendRanking = () => import('../views/branch/vip/DividendRanking.vue')
const BranchVipRewardList = () => import('../views/branch/vip/RewardList.vue')
const BranchWaterIndex = () => import('../views/branch/water/Index.vue')
const BranchEngineerIndex = () => import('../views/branch/engineer/Index.vue')

// 用户设置相关页面
const UserProfile = () => import('../views/user/Settings/Profile.vue')
const UserVerification = () => import('../views/user/Settings/Verification.vue')
const UserSecurity = () => import('../views/user/Settings/Security.vue')
const UserChangePassword = () => import('../views/user/Settings/ChangePassword.vue')
const UserChangePhone = () => import('../views/user/Settings/ChangePhone.vue')
const UserBankCard = () => import('../views/user/Settings/BankCard.vue')
const UserAbout = () => import('../views/user/Settings/About.vue')
const UserPayment = () => import('../views/user/Settings/Payment.vue')
const UserSettingsNotification = () => import('../views/user/Settings/Notification.vue')
const UserSettingsPrivacy = () => import('../views/user/Settings/Privacy.vue')
const UserSettingsAgreement = () => import('../views/user/Settings/Agreement.vue')
const UserSettingsPrivacyPolicy = () => import('../views/user/Settings/PrivacyPolicy.vue')
const UserSettingsIntroduction = () => import('../views/user/Settings/Introduction.vue')
const UserSettingsContact = () => import('../views/user/Settings/Contact.vue')

// 工程师工作台页面
const EngineerIndex = () => import('../views/engineer/Index.vue')
const EngineerOrders = () => import('../views/engineer/Orders.vue')

// 净水器用户工作台页面
const PurifierIndex = () => import('../views/purifier/Index.vue')
const PurifierDevices = () => import('../views/purifier/devices/Index.vue')
const PurifierDeviceDetail = () => import('../views/purifier/device-detail/Index.vue')
const PurifierDeviceMonitor = () => import('../views/purifier/device-monitor/Index.vue')
const FilterShop = () => import('../views/purifier/FilterShop.vue')

// 支付机构工作台页面
const InstitutionIndex = () => import('../views/institution/Index.vue')
const InstitutionOnboarding = () => import('../views/institution/Onboarding.vue')
const InstitutionMeituan = () => import('../views/institution/Meituan.vue')
const InstitutionPartners = () => import('../views/institution/Partners.vue')
const InstitutionSettings = () => import('../views/institution/Settings.vue')
const InstitutionPromotion = () => import('../views/institution/Promotion.vue')
const InstitutionBusiness = () => import('../views/institution/Business.vue')
const InstitutionPolicy = () => import('../views/institution/Policy.vue')
const InstitutionRecruitManual = () => import('../views/institution/RecruitManual.vue')
const InstitutionInviteRegister = () => import('../views/institution/InviteRegister.vue')
const InstitutionInviteAuth = () => import('../views/institution/InviteAuth.vue')
const InstitutionInviteFollow = () => import('../views/institution/InviteFollow.vue')
const InstitutionSalesmen = () => import('../views/institution/Salesmen.vue')

// 净水器渠道商工作台页面
const AgentIndex = () => import('../views/agent/Index.vue')

// VIP会员工作台页面
const VipIndex = () => import('../views/vip/Index.vue')

// 业务员工作台页面
const SalesmanIndex = () => import('../views/salesman/Index.vue')

// 管理员后台页面
const AdminIndex = () => import('../views/admin/Index.vue')
const AdminLogin = () => import('../views/admin/Login.vue')

// 管理员商户管理页面
const AdminMerchants = () => import('../views/admin/merchants/Index.vue')
const AdminMerchantDetail = () => import('../views/admin/merchants/Detail.vue')
const AdminMerchantTrades = () => import('../views/admin/merchants/Trades.vue')
const AdminMerchantSettlements = () => import('../views/admin/merchants/Settlements.vue')
const AdminTappDevices = () => import('../views/admin/TappDevices.vue')
const AdminMallOrders = () => import('../views/admin/MallOrders.vue')
const AdminStarpayBindings = () => import('../views/admin/StarpayBindings.vue')

// 管理员净水器管理页面
const AdminWaterPurifierList = () => import('../views/admin/water/PurifierList.vue')

// 支付机构组件
const Income = () => import('../views/institution/Income.vue')

// 代理商组件
const Team = () => import('../views/agent/Team.vue')

// VIP会员组件
const Dividend = () => import('../views/vip/Dividend.vue')
const VipTeam = () => import('../views/vip/Team.vue')
const RewardList = () => import('../views/vip/RewardList.vue')

// 业务员组件
const Clients = () => import('../views/salesman/Clients.vue')
const ClientDetail = () => import('../views/salesman/ClientDetail.vue')
const Commission = () => import('../views/salesman/Commission.vue')
const InviteInstall = () => import('../views/salesman/InviteInstall.vue')

// 管理员组件
const Users = () => import('../views/admin/Users.vue')

// 预约安装相关页面
const InstallBooking = () => import('../views/installation/Booking.vue')
const BookingPayment = () => import('../views/installation/BookingPayment.vue')
const BookingList = () => import('../views/installation/BookingList.vue')
const WechatCallbackInstall = () => import('../views/installation/WechatCallbackInstall.vue')

// 茶农助手页面

// 测试页面
const WeChatTest = () => import('../views/test/WeChatTest.vue')
const BranchWechatTest = () => import('../views/test/BranchWechatTest.vue')
const WechatMenuTest = () => import('../views/test/WechatMenuTest.vue')

// 亿拓宝(YTB)独立H5页面
const YtbLogin = () => import('../views/ytb/Login.vue')
const YtbHome = () => import('../views/ytb/Home.vue')
const YtbUpgrade = () => import('../views/ytb/Upgrade.vue')
const YtbTeam = () => import('../views/ytb/Team.vue')
const YtbCommission = () => import('../views/ytb/Commission.vue')
const YtbProfile = () => import('../views/ytb/Profile.vue')
const YtbApplications = () => import('../views/ytb/Applications.vue')
const YtbRegister = () => import('../views/ytb/Register.vue')
const YtbDevices = () => import('../views/ytb/Devices.vue')
const YtbDeviceDetail = () => import('../views/ytb/DeviceDetail.vue')
const YtbWithdraw = () => import('../views/ytb/Withdraw.vue')
const YtbWithdrawRecords = () => import('../views/ytb/WithdrawRecords.vue')
const YtbInvestment = () => import('../views/ytb/Investment.vue')
const YtbInstallations = () => import('../views/ytb/Installations.vue')
const YtbExpansion = () => import('../views/ytb/Expansion.vue')

// 邀请函相关路由
const invitationRoutes = [
  {
    path: '/invitation/:id',
    name: 'Invitation',
    component: () => import('../views/invitation/index.vue'),
    meta: {
      title: '点点够开业庆典邀请函',
      hideTabBar: true,
      requiresAuth: false,
    },
  },
];

// 亿拓宝(YTB)独立H5路由
const ytbRoutePrefix = '/ytb'
const ytbPath = (path) => `${ytbRoutePrefix}${path}`

const ytbRoutes = [
  {
    path: ytbPath('/login'),
    name: 'YtbLogin',
    component: YtbLogin,
    meta: {
      title: '亿拓宝登录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/home'),
    name: 'YtbHome',
    component: YtbHome,
    meta: {
      title: '亿拓宝首页',
      hideTabBar: true,
      requiresAuth: false  // YTB模块使用独立认证
    }
  },
  {
    path: ytbPath('/upgrade'),
    name: 'YtbUpgrade',
    component: YtbUpgrade,
    meta: {
      title: '升级中心',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/team'),
    name: 'YtbTeam',
    component: YtbTeam,
    meta: {
      title: '我的团队',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/commission'),
    name: 'YtbCommission',
    component: YtbCommission,
    meta: {
      title: '分佣记录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/profile'),
    name: 'YtbProfile',
    component: YtbProfile,
    meta: {
      title: '个人中心',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/applications'),
    name: 'YtbApplications',
    component: YtbApplications,
    meta: {
      title: '升级申请记录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/register'),
    name: 'YtbRegister',
    component: YtbRegister,
    meta: {
      title: '加入亿拓宝联盟',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/devices'),
    name: 'YtbDevices',
    component: YtbDevices,
    meta: {
      title: '我的设备',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/expand'),
    name: 'YtbExpansion',
    component: YtbExpansion,
    meta: {
      title: '拓展',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/device/:id'),
    name: 'YtbDeviceDetail',
    component: YtbDeviceDetail,
    meta: {
      title: '设备详情',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/withdraw'),
    name: 'YtbWithdraw',
    component: YtbWithdraw,
    meta: {
      title: '佣金提现',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/withdraw-records'),
    name: 'YtbWithdrawRecords',
    component: YtbWithdrawRecords,
    meta: {
      title: '提现记录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/investment'),
    name: 'YtbInvestment',
    component: YtbInvestment,
    meta: {
      title: 'BossCP投资管理',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: ytbPath('/installations'),
    name: 'YtbInstallations',
    component: YtbInstallations,
    meta: {
      title: '推广安装记录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  // YTB默认路由重定向
  {
    path: '/ytb',
    redirect: ytbPath('/devices')
  },
  ...(isYtbStandalone
    ? [
        {
          path: '/',
          redirect: '/devices'
        },
        // 根路径别名路由（TabBar 和页面导航使用）
        {
          path: '/devices',
          name: 'YtbStandaloneDevices',
          component: YtbDevices,
          meta: { title: '我的设备', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/expand',
          name: 'YtbStandaloneExpand',
          component: YtbExpansion,
          meta: { title: '拓展', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/home',
          name: 'YtbStandaloneHome',
          component: YtbHome,
          meta: { title: '亿拓宝首页', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/profile',
          name: 'YtbStandaloneProfile',
          component: YtbProfile,
          meta: { title: '个人中心', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/upgrade',
          name: 'YtbStandaloneUpgrade',
          component: YtbUpgrade,
          meta: { title: '升级中心', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/team',
          name: 'YtbStandaloneTeam',
          component: YtbTeam,
          meta: { title: '我的团队', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/commission',
          name: 'YtbStandaloneCommission',
          component: YtbCommission,
          meta: { title: '分佣记录', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/register',
          name: 'YtbStandaloneRegister',
          component: YtbRegister,
          meta: { title: '注册', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/device/:id',
          name: 'YtbStandaloneDeviceDetail',
          component: YtbDeviceDetail,
          meta: { title: '设备详情', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/withdraw',
          name: 'YtbStandaloneWithdraw',
          component: YtbWithdraw,
          meta: { title: '提现', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/withdraw-records',
          name: 'YtbStandaloneWithdrawRecords',
          component: YtbWithdrawRecords,
          meta: { title: '提现记录', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/applications',
          name: 'YtbStandaloneApplications',
          component: YtbApplications,
          meta: { title: '升级申请', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/investment',
          name: 'YtbStandaloneInvestment',
          component: YtbInvestment,
          meta: { title: 'Boss投资', hideTabBar: true, requiresAuth: false }
        },
        {
          path: '/installations',
          name: 'YtbStandaloneInstallations',
          component: YtbInstallations,
          meta: { title: '安装推广', hideTabBar: true, requiresAuth: false }
        },
        // 兼容 /ytb/* 路径
        {
          path: '/ytb/:pathMatch(.*)*',
          redirect: (to) => {
            const raw = to.params.pathMatch
            const joined = Array.isArray(raw) ? raw.join('/') : (raw || '')
            return joined ? `/${joined}` : '/devices'
          }
        }
      ]
    : [])
];

// VIP会员相关路由
const vipRoutes = [
  {
    path: '/vip/dividend',
    name: 'VipDividend',
    component: Dividend,
    meta: {
      title: '平台分红收益明细',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/vip/team',
    name: 'VipTeam',
    component: VipTeam,
    meta: {
      title: 'VIP团队',
      requiresAuth: true,
      // roles: ['vip'], // 注释掉角色要求，改为页面内部处理
      hideTabBar: true
    }
  },
  {
    path: '/vip/team-detail/:id',
    name: 'VipTeamDetail',
    component: () => import('../views/vip/TeamDetail.vue'),
    meta: {
      title: '团队成员详情',
      requiresAuth: true,
      // roles: ['vip'], // 注释掉角色要求，改为页面内部处理
      hideTabBar: true
    }
  },
  {
    path: '/vip/dividend-history',
    name: 'VipDividendHistory',
    component: () => import('../views/vip/DividendHistory.vue'),
    meta: {
      title: '分红历史',
      requiresAuth: true,
      roles: ['vip'],
      hideTabBar: true
    }
  },
  {
    path: '/vip/dividend-detail/:id',
    name: 'VipDividendDetail',
    component: () => import('../views/vip/DividendDetail.vue'),
    meta: {
      title: '分红详情',
      requiresAuth: true,
      roles: ['vip'],
      hideTabBar: true
    }
  },
  {
    path: '/vip/reward-list',
    name: 'RewardList',
    component: RewardList,
    meta: {
      title: '分红奖励名单',
      requiresAuth: true,
      // roles: ['vip'], // 注释掉角色要求，奖励名单应该对所有用户开放查看
      hideTabBar: true
    }
  },
  {
    path: '/vip/recruit-ranking',
    name: 'RecruitRanking',
    component: () => import('../views/vip/RecruitRanking.vue'),
    meta: {
      title: 'VIP招募排行榜',
      requiresAuth: true,
      // roles: ['vip'], // 注释掉角色要求，排行榜应该对所有用户开放
      hideTabBar: true
    }
  },
  {
    path: '/vip/team-devices',
    name: 'VipTeamDevices',
    component: () => import('../views/vip/TeamDevices.vue'),
    meta: {
      title: '团队销售净水器',
      requiresAuth: true,
      // roles: ['vip'], // 注释掉角色要求，改为页面内部处理
      hideTabBar: true
    }
  },
  {
    path: '/vip/recruit',
    name: 'VipRecruit',
    component: () => import('../views/vip/Recruit.vue'),
    meta: {
      title: 'VIP招募',
      requiresAuth: false,
      // roles: ['vip'], // 移除VIP权限要求，招募页面应该对所有用户开放
      hideTabBar: true
    }
  },
  {
    path: '/vip/recruit-landing/:referrerId',
    name: 'VipRecruitLanding',
    component: () => import('../views/vip/RecruitLanding.vue'),
    meta: {
      title: 'VIP招募',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/vip/success',
    name: 'VipSuccess',
    component: () => import('../views/vip/Success.vue'),
    meta: {
      title: 'VIP升级成功',
      requiresAuth: false,
      hideTabBar: true
    }
  },
]

// 引入VIP会员相关组件
const VipList = () => import('../views/vip/VipList.vue')
const VipDetail = () => import('../views/vip/VipDetail.vue')
const OpenDataCockpit = () => import('../views/open/DataCockpit.vue')
const SystemOverviewInfographic = () => import('../views/open/SystemOverviewInfographic.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      keepAlive: true,
      shareSubtitle: '点点够公开体验站，实时查看净水与商户数据',
      shareLogo: 'https://pay.itapgo.com/images/logo.png'
    }
  },
  {
    path: '/ai-service',
    name: 'AiCustomerService',
    component: AiCustomerService,
    meta: {
      title: 'AI智能客服',
      hideTabBar: true,
      shareSubtitle: '智能客服助手，随时为您解答问题'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '控制面板',
      keepAlive: true,
      requiresAuth: true,
      shareSubtitle: '统一工作台入口，管理您的业务'
    }
  },
  {
    path: '/data-cockpit',
    name: 'OpenDataCockpit',
    component: OpenDataCockpit,
    meta: {
      title: '数据驾驶舱',
      requiresAuth: false,
      hideTabBar: true,
    }
  },
  {
    path: '/system-overview',
    name: 'SystemOverviewInfographic',
    component: SystemOverviewInfographic,
    meta: {
      title: '系统概览',
      requiresAuth: false,
      hideTabBar: true,
    }
  },
  {
    path: '/device',
    name: 'Device',
    component: Device,
    meta: {
      title: '设备管理',
      keepAlive: true,
      shareSubtitle: '净水设备管理平台，轻松管理您的设备'
    }
  },
  {
    path: '/filter-life',
    name: 'FilterLife',
    component: FilterLife,
    meta: {
      title: '滤芯详情',
      keepAlive: true,
      shareSubtitle: '实时查看净水设备滤芯寿命和使用情况',
      shareLogo: 'https://pay.itapgo.com/images/logo.png'
    }
  },
  {
    path: '/device/detail/:id',
    name: 'DeviceDetail',
    component: DeviceDetail,
    meta: {
      title: '设备详情',
      hideTabBar: true
    }
  },
  {
    path: '/device/detail-new/:id',
    name: 'DeviceDetailNew',
    component: DeviceDetailNew,
    meta: {
      title: '设备详情',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/device/install',
    name: 'DeviceInstall',
    component: DeviceInstall,
    meta: {
      title: '安装设备',
      hideTabBar: true
    }
  },
  {
    path: '/device/monitor/:id',
    name: 'DeviceMonitor',
    component: DeviceMonitor,
    meta: {
      title: '设备监控',
      hideTabBar: true
    }
  },
  {
    path: '/device/my-devices',
    name: 'MyDevices',
    component: MyDevices,
    meta: {
      title: '我的设备',
      requiresAuth: true,
      roles: ['water_purifier_user'],
      hideTabBar: true
    }
  },
  {
    path: '/water-point',
    name: 'WaterPoint',
    component: WaterPoint,
    meta: {
      title: '取水点',
      keepAlive: true,
      shareSubtitle: '寻找附近取水点，享受健康净水'
    }
  },
  {
    path: '/water-point/detail/:id',
    name: 'WaterPointDetail',
    component: WaterPointDetail,
    meta: {
      title: '取水点详情',
      shareSubtitle: '查看取水点详细信息和用户评价'
    }
  },
  {
    path: '/water-point/map',
    name: 'WaterPointMap',
    component: WaterPointMap,
    meta: {
      title: '取水点地图',
      shareSubtitle: '地图上查找附近的取水点位置'
    }
  },
  {
    path: '/merchant',
    name: 'Merchant',
    component: Merchant,
    meta: {
      title: '商户中心',
      requiresAuth: true,
      keepAlive: true,
      shareSubtitle: '商户管理平台，轻松管理您的业务',
      hideTabBar: true
    }
  },
  {
    path: '/merchant/onboarding/list',
    name: 'MerchantOnboardingList',
    component: MerchantOnboardingList,
    meta: {
      title: '我的进件',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/onboarding',
    name: 'MerchantOnboarding',
    component: MerchantOnboarding,
    meta: {
      title: '商户进件',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/onboarding/form',
    name: 'MerchantOnboardingForm',
    component: MerchantOnboardingForm,
    meta: {
      title: '进件填写',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/onboarding/:id',
    name: 'MerchantOnboardingDetail',
    component: MerchantOnboardingDetail,
    meta: {
      title: '进件详情',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/forum',
    name: 'ForumHome',
    component: ForumIndex,
    meta: {
      title: '社区论坛',
      keepAlive: true,
      shareSubtitle: '与开发伙伴一起讨论AI工具与实践'
    }
  },
  {
    path: '/forum/login',
    name: 'ForumLogin',
    component: ForumLogin,
    meta: {
      title: '论坛登录',
      hideTabBar: true
    }
  },
  {
    path: '/forum/sections/:sectionId',
    name: 'ForumSection',
    component: ForumSection,
    meta: {
      title: '讨论区',
      hideTabBar: true
    }
  },
  {
    path: '/forum/threads/:threadId',
    name: 'ForumThread',
    component: ForumThread,
    meta: {
      title: '帖子详情',
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id',
    name: 'MerchantDetail',
    component: MerchantDetail,
    meta: {
      title: '商户详情',
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/products',
    name: 'MerchantProducts',
    component: MerchantProducts,
    meta: {
      title: '商户商品',
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/orders',
    name: 'MerchantOrders',
    component: MerchantOrders,
    meta: {
      title: '商户订单',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/dashboard',
    name: 'MerchantDashboard',
    component: MerchantDashboard,
    meta: {
      title: '商户统计',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/trades',
    name: 'MerchantTrades',
    component: MerchantTrades,
    meta: {
      title: '交易记录',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/trade/:tradeId',
    name: 'MerchantTradeDetail',
    component: MerchantTradeDetail,
    meta: {
      title: '交易详情',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/merchant/:id/qrcode',
    name: 'MerchantQRCode',
    component: MerchantQRCode,
    meta: {
      title: '收款码',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: {
      title: '个人中心',
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/user/orders',
    name: 'UserOrders',
    component: UserOrders,
    meta: {
      title: '我的订单',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/wallet',
    name: 'UserWallet',
    component: UserWallet,
    meta: {
      title: '我的钱包',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings',
    name: 'UserSettings',
    component: UserSettings,
    meta: {
      title: '设置',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/profile',
    name: 'UserSettingsProfile',
    component: UserProfile,
    meta: {
      title: '个人资料',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/verification',
    name: 'UserSettingsVerification',
    component: UserVerification,
    meta: {
      title: '实名认证',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/security',
    name: 'UserSettingsSecurity',
    component: UserSecurity,
    meta: {
      title: '账号安全',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/change-password',
    name: 'UserSettingsChangePassword',
    component: UserChangePassword,
    meta: {
      title: '修改密码',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/change-phone',
    name: 'UserSettingsChangePhone',
    component: UserChangePhone,
    meta: {
      title: '更换手机号',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/payment',
    name: 'UserSettingsPayment',
    component: UserPayment,
    meta: {
      title: '支付管理',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/bank-card',
    name: 'UserSettingsBankCard',
    component: UserBankCard,
    meta: {
      title: '提现/结算管理',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/notification',
    name: 'UserSettingsNotification',
    component: UserSettingsNotification,
    meta: {
      title: '通知设置',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/privacy',
    name: 'UserSettingsPrivacy',
    component: UserSettingsPrivacy,
    meta: {
      title: '隐私设置',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/agreement',
    name: 'UserSettingsAgreement',
    component: UserSettingsAgreement,
    meta: {
      title: '用户协议',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/privacy-policy',
    name: 'UserSettingsPrivacyPolicy',
    component: UserSettingsPrivacyPolicy,
    meta: {
      title: '隐私政策',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/about',
    name: 'UserSettingsAbout',
    component: UserAbout,
    meta: {
      title: '关于我们',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/introduction',
    name: 'UserSettingsIntroduction',
    component: UserSettingsIntroduction,
    meta: {
      title: '公司介绍',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/settings/contact',
    name: 'UserSettingsContact',
    component: UserSettingsContact,
    meta: {
      title: '联系我们',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  ...(isYtbStandalone
    ? [
        {
          path: '/legacy-login',
          redirect: '/ytb/login'
        },
        {
          path: '/login',
          redirect: '/ytb/login'
        }
      ]
    : []),
  ...(!isYtbStandalone
    ? [
        {
          path: '/login',
          name: 'Login',
          component: Login,
          meta: {
            title: '登录',
            hideTabBar: true,
            requiresAuth: false
          }
        }
      ]
    : []),
  {
    path: '/user/login',
    redirect: '/login'
  },
  {
    path: '/user/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/user/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: '忘记密码',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/user/address',
    name: 'UserAddress',
    component: UserAddress,
    meta: {
      title: '收货地址',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/points',
    name: 'UserPoints',
    component: UserPoints,
    meta: {
      title: '我的积分',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/coupons',
    name: 'UserCoupons',
    component: UserCoupons,
    meta: {
      title: '优惠券',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/feedback',
    name: 'UserFeedback',
    component: UserFeedback,
    meta: {
      title: '用户反馈',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/help',
    name: 'UserHelp',
    component: UserHelp,
    meta: {
      title: '帮助中心',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/user/bind-phone',
    name: 'BindPhone',
    component: BindPhone,
    meta: {
      title: '绑定手机号',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/user/wechat-callback',
    name: 'WechatCallback',
    component: WechatCallback,
    meta: {
      title: '微信登录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/installation/wechat-callback',
    name: 'WechatCallbackInstall',
    component: WechatCallbackInstall,
    meta: {
      title: '微信登录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  // 兼容旧路由
  {
    path: '/wechat-callback',
    redirect: '/user/wechat-callback'
  },
  {
    path: '/user/wechat-success',
    name: 'WechatSuccess',
    component: WechatSuccess,
    meta: {
      title: '微信登录成功',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/user/wechat-error',
    name: 'WechatError',
    component: WechatError,
    meta: {
      title: '微信登录失败',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/tea-farmer',
    name: 'TeaFarmer',
    component: TeaFarmer,
    meta: {
      title: '茶农助手',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/tea-market',
    name: 'TeaMarket',
    component: TeaFarmerMarket,
    meta: {
      title: '茶农市场',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/branch/booking',
    name: 'BranchBooking',
    component: BranchBooking,
    meta: {
      title: '预约服务',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/branch/members',
    name: 'BranchMembers',
    component: BranchMembers,
    meta: {
      title: '会员管理',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/revenue',
    name: 'BranchRevenue',
    component: BranchRevenue,
    meta: {
      title: '营收统计',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/more',
    name: 'BranchMore',
    component: BranchMore,
    meta: {
      title: '更多服务',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  // 分支机构工作台路由
  {
    path: '/branch/salesman',
    name: 'BranchSalesman',
    component: BranchSalesmanIndex,
    meta: {
      title: '业务中心',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip',
    name: 'BranchVip',
    component: BranchVipIndex,
    meta: {
      title: 'VIP中心',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/team',
    name: 'BranchVipTeam',
    component: BranchVipTeam,
    meta: {
      title: '我的VIP团队',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/salesman/invite-water',
    name: 'BranchSalesmanInviteWater',
    component: BranchSalesmanInviteWater,
    meta: {
      title: '邀请取水',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/invite-water-register/:inviteCode',
    name: 'InviteWaterRegister',
    component: InviteWaterRegister,
    meta: {
      title: '邀请注册',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/branch/vip/dividend',
    name: 'BranchVipDividend',
    component: BranchVipDividend,
    meta: {
      title: 'VIP分红',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/dividend-history',
    name: 'BranchVipDividendHistory',
    component: BranchVipDividendHistory,
    meta: {
      title: '分红历史',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/dividend-detail/:id',
    name: 'BranchVipDividendDetail',
    component: BranchVipDividendDetail,
    meta: {
      title: '分红详情',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/recruit-ranking',
    name: 'BranchVipRecruitRanking',
    component: BranchVipRecruitRanking,
    meta: {
      title: 'VIP招募排行榜',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/team-devices',
    name: 'BranchVipTeamDevices',
    component: BranchVipTeamDevices,
    meta: {
      title: '团队销售净水器',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/vip-list',
    name: 'BranchVipList',
    component: BranchVipList,
    meta: {
      title: 'VIP列表',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/dividend-ranking',
    name: 'BranchVipDividendRanking',
    component: BranchVipDividendRanking,
    meta: {
      title: '分红排行',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/reward-list',
    name: 'BranchVipRewardList',
    component: BranchVipRewardList,
    meta: {
      title: '奖励记录',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/vip/test',
    name: 'BranchVipTest',
    component: () => import('../views/branch/vip/VipTest.vue'),
    meta: {
      title: 'VIP测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/branch/vip/dividend-debug',
    name: 'BranchVipDividendDebug',
    component: () => import('../views/branch/vip/DividendDebug.vue'),
    meta: {
      title: '分红调试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/branch/water',
    name: 'BranchWater',
    component: BranchWaterIndex,
    meta: {
      title: '净水管理',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/branch/engineer',
    name: 'BranchEngineer',
    component: BranchEngineerIndex,
    meta: {
      title: '工程师台',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/user/address',
    name: 'UserAddress',
    component: UserAddress,
    meta: {
      title: '我的地址'
    }
  },
  {
    path: '/user/points',
    name: 'UserPoints',
    component: UserPoints,
    meta: {
      title: '我的积分'
    }
  },
  {
    path: '/user/coupons',
    name: 'UserCoupons',
    component: UserCoupons,
    meta: {
      title: '我的优惠券'
    }
  },
  {
    path: '/user/feedback',
    name: 'UserFeedback',
    component: UserFeedback,
    meta: {
      title: '用户反馈'
    }
  },
  {
    path: '/user/help',
    name: 'UserHelp',
    component: UserHelp,
    meta: {
      title: '帮助中心'
    }
  },
  // 工程师工作台路由
  {
    path: '/engineer',
    name: 'Engineer',
    component: EngineerIndex,
    meta: {
      title: '工程师工作台',
      requiresAuth: true,
      roles: ['engineer']
    }
  },
  // 工程师子路由
  {
    path: '/engineer/orders',
    name: 'EngineerOrders',
    component: EngineerOrders,
    meta: {
      title: '工单管理',
      requiresAuth: true,
      roles: ['engineer']
    }
  },
  {
    path: '/engineer/water-orders',
    name: 'EngineerWaterOrders',
    component: () => import('../views/engineer/WaterOrders.vue'),
    meta: {
      title: '净水器工单',
      requiresAuth: true,
      roles: ['engineer'],
      hideTabBar: true
    }
  },
  {
    path: '/engineer/water-order-detail/:id',
    name: 'EngineerWaterOrderDetail',
    component: () => import('../views/engineer/WaterOrderDetail.vue'),
    meta: {
      title: '工单详情',
      requiresAuth: true,
      roles: ['engineer'],
      hideTabBar: true
    }
  },
  {
    path: '/engineer/filter-alert/:id',
    name: 'EngineerFilterAlert',
    component: () => import('../views/engineer/FilterAlertDetail.vue'),
    meta: {
      requiresAuth: true,
      title: '滤芯预警详情'
    }
  },
  {
    path: '/engineer/filter-alert-device/:deviceNumber',
    name: 'EngineerFilterAlertDevice',
    component: () => import('../views/engineer/FilterAlertDetail.vue'),
    meta: {
      requiresAuth: true,
      title: '滤芯预警详情'
    }
  },
  {
    path: '/engineer/work-orders/:id',
    name: 'EngineerWorkOrderDetail',
    component: () => import('../views/engineer/WorkOrderDetail.vue'),
    meta: {
      title: '工单详情',
      requiresAuth: true,
      roles: ['engineer'],
      hideTabBar: true
    }
  },
  {
    path: '/engineer/test-api',
    name: 'EngineerTestAPI',
    component: () => import('../views/engineer/TestAPI.vue'),
    meta: {
      title: 'API测试',
      requiresAuth: true,
      roles: ['engineer'],
      hideTabBar: true
    }
  },
  {
    path: '/engineer/filter-alerts',
    name: 'EngineerFilterAlerts',
    component: () => import('../views/engineer/FilterAlerts.vue'),
    meta: {
      title: '全部滤芯预警',
      requiresAuth: true,
      roles: ['engineer'],
      hideTabBar: true
    }
  },

  // 净水器用户工作台路由
  {
    path: '/purifier',
    name: 'Purifier',
    component: PurifierIndex,
    meta: {
      title: '净水器管理',
      requiresAuth: true,
      hideTabBar: true,
      // roles: ['water_purifier_user'] // 注释掉角色要求，改为页面内部处理
    }
  },
  {
    path: '/purifier/devices',
    name: 'PurifierDevices',
    component: PurifierDevices,
    meta: {
      title: '我的设备',
      requiresAuth: true,
      roles: ['water_purifier_user'],
      hideTabBar: true
    }
  },
  {
    path: '/purifier/device-detail/:id',
    name: 'PurifierDeviceDetail',
    component: PurifierDeviceDetail,
    meta: {
      title: '设备详情',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/purifier/device-monitor/:id',
    name: 'PurifierDeviceMonitor',
    component: PurifierDeviceMonitor,
    meta: {
      title: '设备监控',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/purifier/filter-shop',
    name: 'FilterShop',
    component: FilterShop,
    meta: {
      title: '滤芯商城',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  // 支付机构工作台路由
  {
    path: '/institution/invite-register',
    name: 'InstitutionInviteRegister',
    component: InstitutionInviteRegister,
    meta: {
      title: '点点够机构认证申请',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/institution/invite-auth',
    name: 'InstitutionInviteAuth',
    component: InstitutionInviteAuth,
    meta: {
      title: '微信授权中',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/institution/invite-follow',
    name: 'InstitutionInviteFollow',
    component: InstitutionInviteFollow,
    meta: {
      title: '关注点点够公众号',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/institution',
    name: 'Institution',
    component: InstitutionIndex,
    meta: {
      title: '支付机构',
      requiresAuth: true,
      roles: ['pay_institution']
    }
  },
  {
    path: '/institution/onboarding',
    name: 'InstitutionOnboarding',
    component: InstitutionOnboarding,
    meta: {
      title: '进件管理',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/meituan',
    name: 'InstitutionMeituan',
    component: InstitutionMeituan,
    meta: {
      title: '美团渠道',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/partners',
    name: 'InstitutionPartners',
    component: InstitutionPartners,
    meta: {
      title: '伙伴管理',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/salesmen',
    name: 'InstitutionSalesmen',
    component: InstitutionSalesmen,
    meta: {
      title: '业务员管理',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/promotion',
    name: 'InstitutionPromotion',
    component: InstitutionPromotion,
    meta: {
      title: '推广素材中心',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/business',
    name: 'InstitutionBusiness',
    component: InstitutionBusiness,
    meta: {
      title: '展业中心',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  {
    path: '/institution/policy',
    name: 'InstitutionPolicy',
    component: InstitutionPolicy,
    meta: {
      title: '美团收钱助手政策',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/recruit/zhaoshang-handbook',
    name: 'RecruitManual',
    component: InstitutionRecruitManual,
    meta: {
      title: '美团招商手册',
      hideTabBar: true
    }
  },
  {
    path: '/institution/open',
    name: 'InstitutionApply',
    component: () => import('../views/institution/Apply.vue'),
    meta: {
      title: '开通支付机构',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/institution/settings',
    name: 'InstitutionSettings',
    component: InstitutionSettings,
    meta: {
      title: '机构设置',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构工作台
  {
    path: '/institution/workspace',
    name: 'InstitutionWorkspace',
    component: () => import('../views/institution/Workspace.vue'),
    meta: {
      title: '支付机构工作台',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构商户管理
  {
    path: '/institution/merchants',
    name: 'InstitutionMerchants',
    component: () => import('../views/institution/Merchants.vue'),
    meta: {
      title: '商户管理',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构交易查询
  {
    path: '/institution/orders',
    name: 'InstitutionOrders',
    component: () => import('../views/institution/Transactions.vue'),
    meta: {
      title: '交易查询',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构分润明细
  {
    path: '/institution/commissions',
    name: 'InstitutionCommissions',
    component: () => import('../views/institution/Commissions.vue'),
    meta: {
      title: '分润明细',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构数据统计
  {
    path: '/institution/statistics',
    name: 'InstitutionStatistics',
    component: () => import('../views/institution/Workspace.vue'),
    meta: {
      title: '数据统计',
      requiresAuth: true,
      roles: ['pay_institution'],
      hideTabBar: true
    }
  },
  // 支付机构路由
  {
    path: '/institution/income',
    name: 'InstitutionIncome',
    component: Income,
    meta: {
      title: '收入明细'
    }
  },
  // 净水器渠道商工作台路由
  {
    path: '/agent',
    name: 'Agent',
    component: AgentIndex,
    meta: {
      title: '渠道商管理',
      requiresAuth: true,
      roles: ['water_purifier_agent']
    }
  },
  // 代理商路由
  {
    path: '/agent/team',
    name: 'AgentTeam',
    component: Team,
    meta: {
      title: '我的团队'
    }
  },
  // VIP会员工作台路由
  {
    path: '/vip',
    name: 'Vip',
    component: VipIndex,
    meta: {
      title: 'VIP会员中心',
      requiresAuth: true,
      hideTabBar: true,
      // roles: ['vip'] // 注释掉角色要求，改为页面内部处理
    }
  },
  // VIP会员路由
  ...vipRoutes,
  // 业务员工作台路由
  {
    path: '/salesman',
    name: 'Salesman',
    component: SalesmanIndex,
    meta: {
      title: '业务员中心',
      requiresAuth: false,  // 改为不需要认证，由页面内部处理
      hideTabBar: true,
      // roles: ['salesman']  // 注释掉角色要求
    }
  },
  // 业务员路由
  {
    path: '/salesman/clients',
    name: 'SalesmanClients',
    component: Clients,
    meta: {
      title: '我的客户'
    }
  },
  {
    path: '/salesman/client-detail/:id',
    name: 'SalesmanClientDetail',
    component: ClientDetail,
    meta: {
      title: '客户详情'
    }
  },
  {
    path: '/salesman/invite-install',
    name: 'SalesmanInviteInstall',
    component: InviteInstall,
    meta: {
      title: '邀请安装',
      hideTabBar: true
    }
  },
  {
    path: '/salesman/add-client',
    name: 'SalesmanAddClient',
    component: () => import('../views/salesman/add-client.vue'),
    meta: {
      title: '添加客户',
      hideTabBar: true
    }
  },
  {
    path: '/salesman/targets',
    name: 'SalesmanTargets',
    component: () => import('../views/salesman/Targets.vue'),
    meta: {
      title: '目标管理',
      hideTabBar: true
    }
  },
  {
    path: '/salesman/commission',
    name: 'SalesmanCommission',
    component: Commission,
    meta: {
      title: '佣金记录'
    }
  },
  {
    path: '/salesman/products',
    name: 'SalesmanProducts',
    component: () => import('../views/salesman/Products.vue'),
    meta: {
      title: '升级VIP',
      hideTabBar: true
    }
  },
  // 管理员登录路由
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: {
      title: '管理员登录',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  // 管理员后台路由
  {
    path: '/admin',
    name: 'Admin',
    component: AdminIndex,
    meta: {
      title: '管理后台',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  // 管理员路由
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: Users,
    meta: {
      title: '用户管理'
    }
  },
  {
    path: '/admin/nav-manager',
    name: 'NavManager',
    component: () => import('../views/admin/NavigationManager.vue'),
    meta: {
      requiresAuth: true,
      isAdmin: true
    }
  },
  {
    path: '/admin/miniprogram-share-config',
    name: 'MiniprogramShareConfig',
    component: () => import('../views/admin/MiniprogramShareConfig.vue'),
    meta: {
      title: '小程序分享配置',
      requiresAuth: true,
      isAdmin: true
    }
  },
  // 管理员商户管理路由
  {
    path: '/admin/merchants',
    name: 'AdminMerchants',
    component: AdminMerchants,
    meta: {
      title: '商户管理',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/tapp-devices',
    name: 'AdminTappDevices',
    component: AdminTappDevices,
    meta: {
      title: '设备管理',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  // ============ 净水器管理二级菜单 ============
  {
    path: '/admin/water/purifiers',
    name: 'AdminWaterPurifierList',
    component: AdminWaterPurifierList,
    meta: {
      title: '净水器管理',
      requiresAuth: true,
      roles: ['admin'],
      hideTabBar: true
    }
  },
  {
    path: '/admin/mall/orders',
    name: 'AdminMallOrders',
    component: AdminMallOrders,
    meta: {
      title: '订单管理',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/starpay-bindings',
    name: 'AdminStarpayBindings',
    component: AdminStarpayBindings,
    meta: {
      title: '星驿付服务商绑定',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/:id/detail',
    name: 'AdminMerchantDetail',
    component: AdminMerchantDetail,
    meta: {
      title: '商户详情',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/mobile',
    name: 'AdminMerchantsMobile',
    component: () => import('../views/admin/merchants/MobileIndex.vue'),
    meta: {
      title: '商户管理(移动版)',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/trades',
    name: 'AdminMerchantTrades',
    component: AdminMerchantTrades,
    meta: {
      title: '商户交易记录',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/settlements',
    name: 'AdminMerchantSettlements',
    component: AdminMerchantSettlements,
    meta: {
      title: '商户结算记录',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/trades/mobile',
    name: 'AdminMerchantTradesMobile',
    component: () => import('../views/admin/merchants/MobileTrades.vue'),
    meta: {
      title: '商户交易记录(移动版)',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/admin/merchants/settlements/mobile',
    name: 'AdminMerchantSettlementsMobile',
    component: () => import('../views/admin/merchants/MobileSettlements.vue'),
    meta: {
      title: '商户结算记录(移动版)',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  // 预约安装路由(公开访问)
  {
    path: '/installation/booking',
    name: 'InstallBooking',
    component: InstallBooking,
    meta: {
      title: '净水器预约安装',
      hideTabBar: true,
      requiresAuth: false,
      shareSubtitle: '预约专业工程师上门安装净水器，开启健康饮水生活'
    }
  },
  // 预约安装支付路由
  {
    path: '/installation/payment/:id',
    name: 'BookingPayment',
    component: BookingPayment,
    meta: {
      title: '安装预约支付',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  // 预约安装列表路由
  {
    path: '/installation/bookings',
    name: 'BookingList',
    component: BookingList,
    meta: {
      title: '我的安装预约',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  // 兼容旧路由
  {
    path: '/install-booking',
    redirect: '/installation/booking'
  },
  // 测试页面路由
  {
    path: '/test/wechat',
    name: 'WeChatTest',
    component: WeChatTest,
    meta: {
      title: '微信JSSDK测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/test/branch-wechat',
    name: 'BranchWechatTest',
    component: BranchWechatTest,
    meta: {
      title: '分支机构微信配置测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/test/wechat-menu',
    name: 'WechatMenuTest',
    component: WechatMenuTest,
    meta: {
      title: '微信菜单测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/test/nav',
    name: 'NavTest',
    component: () => import('../views/test/NavTest.vue'),
    meta: {
      title: '导航配置测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/test/navigation',
    name: 'NavigationTest',
    component: () => import('../views/test/NavigationTest.vue'),
    meta: {
      title: '导航组件测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/test/token',
    name: 'TokenTest',
    component: () => import('../views/debug/TokenTest.vue'),
    meta: {
      title: 'Token测试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/debug/vip-upgrade',
    name: 'VipUpgradeDebug',
    component: () => import('../views/debug/VipUpgradeDebug.vue'),
    meta: {
      title: 'VIP升级调试',
      hideTabBar: true,
      requiresAuth: false
    }
  },
  {
    path: '/user/profile-complete',
    name: 'ProfileComplete',
    component: () => import('../views/user/ProfileComplete.vue'),
    meta: {
      title: '完善个人信息',
      hideTabBar: true,
      requiresAuth: true
    }
  },
  // 邀请函相关路由
  ...invitationRoutes,
  // 亿拓宝(YTB)独立H5路由
  ...ytbRoutes,
  {
    path: '/vip/list',
    name: 'VipList',
    component: VipList,
    meta: {
      title: 'VIP会员列表',
      requiresAuth: true,
      roles: ['admin'],
      hideTabBar: true
    }
  },
  {
    path: '/vip/detail/:id',
    name: 'VipDetail',
    component: VipDetail,
    meta: {
      title: 'VIP会员详情',
      requiresAuth: true,
      roles: ['admin'],
      hideTabBar: true
    }
  },
  // VIP分红相关路由
  {
    path: '/vip/dividends',
    name: 'VipDividends',
    component: () => import('@/views/vip/VipDividends.vue'),
    meta: {
      title: 'VIP分红',
      requiresAuth: true
    }
  },
  {
    path: '/vip/dividend-history',
    name: 'DividendHistory',
    component: () => import('@/views/vip/DividendHistory.vue'),
    meta: {
      title: '分红记录',
      requiresAuth: true
    }
  },
  {
    path: '/vip/dividend-ranking',
    name: 'DividendRanking',
    component: () => import('@/views/vip/DividendRanking.vue'),
    meta: {
      title: '分红排行',
      requiresAuth: true
    }
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

let pendingAdminLoginPromise = null;

const getStoredBranchCode = () => {
  try {
    const code =
      (typeof window !== 'undefined' && (localStorage.getItem('branch_code') || sessionStorage.getItem('branch_code'))) ||
      '';
    return (code || '').trim();
  } catch (error) {
    return '';
  }
};

const persistBranchAdminSession = (token, user, branchLogin) => {
  if (typeof window === 'undefined') return;
  try {
    if (branchLogin) {
      localStorage.setItem('branch_admin_token', token);
      sessionStorage.setItem('branch_admin_token', token);
      if (user?.branch_info) {
        localStorage.setItem('branch_user_info', JSON.stringify(user.branch_info));
      }
    } else {
      localStorage.removeItem('branch_admin_token');
      sessionStorage.removeItem('branch_admin_token');
      localStorage.removeItem('branch_user_info');
    }
  } catch (error) {
    console.warn('存储分支管理员会话失败:', error);
  }
};

const attemptAdminAutoLogin = async () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const appToken =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('simulate_token') ||
    sessionStorage.getItem('simulate_token');
  if (!appToken) {
    return false;
  }

  const branchCode = getStoredBranchCode();
  const payload = branchCode ? { branch_code: branchCode } : {};

  const response = await oneClickAdminLogin(payload);
  if (!response || response.code !== 0) {
    throw new Error(response?.message || '管理员自动登录失败');
  }

  const data = response.data || {};
  const token = data.token || '';
  const user = data.user || {};

  if (!token) {
    throw new Error('管理员自动登录失败：缺少 token');
  }

  const branchLogin = Boolean(payload.branch_code || user?.branch_info);
  setAdminAuthData(token, user || {});
  persistBranchAdminSession(token, user, branchLogin);
  return true;
};

const ensureAdminAuthSession = async () => {
  if (pendingAdminLoginPromise) {
    return pendingAdminLoginPromise;
  }
  pendingAdminLoginPromise = attemptAdminAutoLogin()
    .then(() => true)
    .catch((error) => {
      console.warn('自动管理员登录失败:', error);
      return false;
    })
    .finally(() => {
      pendingAdminLoginPromise = null;
    });
  return pendingAdminLoginPromise;
};

const resolveLoginRedirectTarget = (rawRedirect) => {
  if (typeof rawRedirect !== 'string') {
    return { external: false, path: '/user' };
  }

  let decoded = rawRedirect.trim();
  if (!decoded) {
    return { external: false, path: '/user' };
  }

  try {
    decoded = decodeURIComponent(decoded);
  } catch (error) {
    // ignore decode errors and fall back to trimmed value
  }

  if (decoded.startsWith('#/')) {
    decoded = decoded.slice(1);
  }

  if (/^https?:\/\//i.test(decoded)) {
    return { external: true, url: decoded };
  }

  if (!decoded.startsWith('/')) {
    decoded = `/${decoded}`;
  }

  if (decoded === '/login' || decoded === '/user/login') {
    decoded = '/user';
  }

  return { external: false, path: decoded || '/user' };
};

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  if (isYtbStandalone) {
    const standaloneBypassPaths = new Set([
      '/login',
      '/ytb/login',
      '/legacy-login',
      '/register',
      '/ytb/register',
      '/wechat-callback',
      '/user/wechat-callback',
      '/wechat-success',
      '/user/wechat-success',
      '/wechat-error',
      '/user/wechat-error',
      '/bind-phone'
    ])

    if (standaloneBypassPaths.has(to.path)) {
      next()
      return
    }

    if (to.path === '/') {
      next('/devices')
      return
    }

    if (to.path.startsWith('/ytb')) {
      next()
      return
    }

    if (!String(to.name || '').startsWith('Ytb')) {
      next('/devices')
      return
    }
  }

  // 对于登录页面和微信回调页面，直接跳过所有验证
  // YTB 独立模式下实际登录入口改成了 /legacy-login，避免被守卫误判后重定向到 /devices。
  if (to.path === '/login' || to.path === '/legacy-login' || to.path === '/user/login' || to.path === '/wechat-callback') {
    next()
    return
  }

  // 检查是否需要认证
  const requiresAuth = to.meta.requiresAuth

  // 需要认证的页面处理
  if (requiresAuth) {
    const userStore = useUserStore()
    const isBankCardSettingsRoute = to.path === '/user/settings/bank-card'
    const alipayBindFlag = (to.query?.alipay_bind || '').toString().toLowerCase()
    const allowAnonymousAlipayLanding = isBankCardSettingsRoute && (
      alipayBindFlag === 'success' ||
      alipayBindFlag === '1' ||
      to.query?.tab === 'alipay'
    )

    const pendingWechatLanding = localStorage.getItem('fromWechatLogin') === 'true'
    if (pendingWechatLanding && to.path.startsWith('/user')) {
      try {
        const storedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (storedInfo && Object.keys(storedInfo).length > 0) {
          userStore.setUserInfo(storedInfo)
        }
      } catch (error) {
        console.warn('解析微信登录临时用户失败:', error)
      }
      const token = localStorage.getItem('token')
      if (token) {
        userStore.setToken(token)
      } else {
        userStore.isLoggedIn = true
      }
      next()
      return
    }

    let isLoggedIn = userStore.isLoggedIn
    let userInfo = userStore.userInfo

    const hashParts = window.location.hash.split('?')
    const queryString = hashParts.length > 1 ? hashParts[1] : ''
    const urlParams = new URLSearchParams(queryString)
    let simulateToken = urlParams.get('simulate_token')
    const sessionSimulateToken = sessionStorage.getItem('simulate_token')
    let simulateModeActive = userStore.isSimulateMode || (sessionStorage.getItem('simulate_mode') === 'true' && !!sessionSimulateToken)
    let simulateTokenHandled = false

    const adminTokenKeys = ['admin_token', 'admin_auth_token']
    const adminInfoKeys = ['admin_user_info']
    const getAdminTokenLocal = () => adminTokenKeys.map(key => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean)
    const getAdminInfoLocal = () => adminInfoKeys.map(key => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean)

    const isAdminRoute = to.path.startsWith('/admin')
    const isAdminProtectedRoute = isAdminRoute && to.path !== '/admin/login'

    if (isAdminProtectedRoute) {
      let adminToken = getAdminTokenLocal()
      let adminInfoRaw = getAdminInfoLocal()

      if (!adminToken || !adminInfoRaw) {
        const autoLoginResult = await ensureAdminAuthSession()
        if (autoLoginResult) {
          adminToken = getAdminTokenLocal()
          adminInfoRaw = getAdminInfoLocal()
        }
      }

      if (!adminToken || !adminInfoRaw) {
        const host = window.location.host
        const isProduction = host.includes('pay.itapgo.com')
        const redirectPath = encodeURIComponent(to.fullPath)
        if (isProduction) {
          window.location.href = `/app/#/admin/login?redirect=${redirectPath}`
        } else {
          return next({
            path: '/admin/login',
            query: { redirect: to.fullPath }
          })
        }
        return
      }

      try {
        userInfo = JSON.parse(adminInfoRaw)
      } catch (error) {
        console.warn('解析管理员缓存信息失败:', error)
        userInfo = { name: '管理员' }
      }

      isLoggedIn = true
      document.title = to.meta.title || '管理后台'
      next()
      return
    }

    // 增强登录状态检查，支持微信登录
    if (!isLoggedIn) {
      // 检查localStorage和sessionStorage中是否还有token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const isLoggedInFlag = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn')
      const fromWechatLogin = localStorage.getItem('fromWechatLogin')

      if (token || isLoggedInFlag === 'true' || fromWechatLogin === 'true') {
        // 尝试恢复用户信息
        try {
          const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}')
          if (storedUserInfo && Object.keys(storedUserInfo).length > 0) {
            // 恢复用户状态 - 放宽用户信息验证条件
            userStore.setToken(token)
            userStore.setUserInfo(storedUserInfo)
            isLoggedIn = true
            userInfo = storedUserInfo
            console.log('✅ 路由守卫恢复登录状态成功:', { hasToken: !!token, hasUserInfo: !!storedUserInfo, fromWechat: fromWechatLogin === 'true' })
          } else if (isLoggedInFlag === 'true' || fromWechatLogin === 'true') {
            // 即使没有完整用户信息，但有明确的登录标记，也认为已登录
            isLoggedIn = true
            console.log('✅ 基于登录标记恢复登录状态')
          } else {
            // 用户信息不完整，清除所有认证数据
            clearAllAuthData()
          }
        } catch (e) {
          console.error('恢复用户状态失败:', e)
          // 如果有明确的登录标记，仍然认为已登录
          if (isLoggedInFlag === 'true' || fromWechatLogin === 'true') {
            isLoggedIn = true
            console.log('✅ 基于登录标记恢复登录状态（用户信息解析失败）')
          } else {
            // 解析失败，清除所有认证数据
            clearAllAuthData()
          }
        }
      }
    }

    // 在没有常规登录态时，允许模拟登录token直接拉起用户会话
    if (!isLoggedIn) {
      if (simulateToken) {
        try {
          const { verifySimulateLogin } = await import('@/api/simulateLogin')
          const response = await verifySimulateLogin(simulateToken)
          if (response.code === 0 || response.code === 200) {
            userStore.setSimulateMode(simulateToken, response.data.user_info)
            isLoggedIn = true
            simulateModeActive = true
            simulateTokenHandled = true
            const newUrl = window.location.pathname + window.location.hash.split('?')[0]
            window.history.replaceState({}, '', newUrl)
            simulateToken = null
            console.log('模拟登录成功（无常规token）:', response.data.user_info.name || response.data.user_info.phone)
          }
        } catch (error) {
          console.error('模拟登录失败（无常规token）:', error)
        }
      } else if (simulateModeActive && sessionSimulateToken) {
        const restored = userStore.checkSimulateMode()
        if (restored) {
          isLoggedIn = true
          console.log('从Session恢复模拟登录状态')
        } else {
          simulateModeActive = false
        }
      }
    }

    // 放宽登录状态验证条件
    if (isLoggedIn) {
      // 检查用户信息是否存在（不再要求特定字段）
      if (!userInfo || Object.keys(userInfo).length === 0) {
        // 检查是否有明确的登录标记
        const isLoggedInFlag = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn')
        const fromWechatLogin = localStorage.getItem('fromWechatLogin')

        if (isLoggedInFlag !== 'true' && fromWechatLogin !== 'true') {
          console.log('用户信息不完整且无登录标记，视为未登录')
          isLoggedIn = false
          clearAllAuthData()
        } else {
          console.log('✅ 基于登录标记维持登录状态')
        }
      }
    }

    if (!isLoggedIn && allowAnonymousAlipayLanding) {
      console.log('⚠️ 检测到支付宝绑定回跳页面，访客模式允许访问')
      next()
      return
    }

    // 如果仍然未登录，重定向到登录页
    if (!isLoggedIn) {
      // 特殊处理：如果是从工程师页面跳转到个人中心，允许通过
      if (from.path === '/engineer' && to.path === '/user') {
        console.log('🔧 从工程师工作台跳转到个人中心，允许通过')
        next()
        return
      }

      console.log('用户未登录，重定向到登录页')

      // 检查是否是分支机构页面
      const isBranchPage = to.path.startsWith('/branch/')
      const branchCode = localStorage.getItem('branch_code')
      const isBranchUser = localStorage.getItem('isBranch') === '1' // 明确的分支机构用户标记

      // 只有明确的分支机构用户或访问分支机构页面时才跳转到分支机构登录
      if (isBranchPage || (branchCode && isBranchUser)) {
        // 分支机构用户跳转到分支机构登录页面
        const targetBranchCode = branchCode || 'XM0001'
        console.log('🏢 分支机构用户未登录，跳转到分支机构登录页面:', targetBranchCode)
        next({
          path: '/branch-login',
          query: { branch_code: targetBranchCode, redirect: to.fullPath }
        })
        return
      }

      // 记录当前环境和主机名，以便确定正确的登录页面URL
      const host = window.location.host
      const isProduction = host.includes('pay.itapgo.com')

      if (isProduction) {
        // 生环境下使用全路径重定向
        window.location.href = `/app/#/login?redirect=${encodeURIComponent(to.fullPath)}`
        return
      } else {
        // 开发环境下使用router正常导航
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }

    // 如果已登录，继续检查其他权限（或允许正常登录用户手动进入模拟模式）
    if (!simulateTokenHandled && simulateToken) {
      try {
        // 验证模拟登录token
        const { verifySimulateLogin } = await import('@/api/simulateLogin')
        const response = await verifySimulateLogin(simulateToken)

        if (response.code === 0 || response.code === 200) {
          // 设置模拟登录模式
          userStore.setSimulateMode(simulateToken, response.data.user_info)
          simulateModeActive = true
          simulateTokenHandled = true

          // 清除URL中的模拟登录参数
          const newUrl = window.location.pathname + window.location.hash.split('?')[0]
          window.history.replaceState({}, '', newUrl)

          console.log('模拟登录成功:', response.data.user_info.name || response.data.user_info.phone)
        }
      } catch (error) {
        console.error('模拟登录失败:', error)
      }
    } else if (!simulateModeActive) {
      // 检查是否已经处于模拟登录模式
      const restored = userStore.checkSimulateMode()
      if (restored) {
        simulateModeActive = true
      }
    }

    // 获取页面标题
    const title = to.meta.title || '点点够商城'
    document.title = title

    // 检查是否有分支机构代码参数（仅在根路径检查，避免无限循环）
    if (to.path === '/' && to.query.branch_code) {
      const branchCode = to.query.branch_code

      // 检查是否已经是该分支机构的用户
      const storedBranchCode = localStorage.getItem('branch_code')
      const isBranch = localStorage.getItem('isBranch')
      const branchUserInfo = localStorage.getItem('branch_userInfo')
      const isSameBranchLoggedIn = storedBranchCode === branchCode && isBranch === '1' && branchUserInfo

      if (isSameBranchLoggedIn) {
        // 已经是该分支机构的用户，跳转到分支机构首页
        console.log('🏢 已登录该分支机构，跳转到分支机构首页:', branchCode)
        next({
          path: '/branch/home',
          replace: true
        })
        return
      }

      // 不是该分支机构的用户，跳转到分支机构登录页面
      console.log('🏢 检测到分支机构代码:', branchCode)
      console.log('🔄 跳转到分支机构登录页面')

      // 跳转到分支机构登录页面，保持查询参数
      next({
        path: '/branch-login',
        query: { branch_code: branchCode }
      })
      return
    }

    // 特殊处理微信回调页面、登录结果页面、绑定手机号页面、签到页面和分支机构相关页面
    if (to.path === '/wechat-callback' || to.path === '/wechat-success' || to.path === '/wechat-error' || to.path === '/bind-phone' ||
      to.path === '/branch/wechat-success' || to.path === '/branch-login' || to.path === '/check-in/wechat' || to.path.startsWith('/check-in')) {
      console.log('🎯 特殊页面跳过路由守卫检查:', to.path)
      next()
      return
    }

    // 分支机构页面特殊处理
    if (to.path.startsWith('/branch/')) {
      // 检查分支机构登录状态
      const branchUserId = localStorage.getItem('user_id')
      const branchCode = localStorage.getItem('branch_code')
      const isBranch = localStorage.getItem('isBranch')
      const branchUserInfo = localStorage.getItem('branch_userInfo')

      const isBranchLoggedIn = branchUserId && branchCode && isBranch === '1' && branchUserInfo

      console.log('🏢 分支机构页面路由守卫检查:', {
        path: to.path,
        branchUserId,
        branchCode,
        isBranch,
        hasBranchUserInfo: !!branchUserInfo,
        isBranchLoggedIn
      })

      if (!isBranchLoggedIn) {
        // 分支机构用户未登录，跳转到分支机构登录页面
        const targetBranchCode = branchCode || 'XM0001'
        console.log('🏢 分支机构用户未登录，跳转到分支机构登录页面:', targetBranchCode)
        next({
          path: '/branch-login',
          query: { branch_code: targetBranchCode, redirect: to.fullPath }
        })
        return
      }

      // 分支机构用户已登录，允许访问
      next()
      return
    }

    // 检查并恢复登录状态
    const isSimulateMode = sessionStorage.getItem('simulate_mode') === 'true'

    if (!isSimulateMode) {
      try {
        const authModule = await import('@/utils/auth')

        // 检查认证状态
        const hasAuthData = authModule.isLoggedIn()
        console.log('🛡️ 路由守卫检查:', {
          route: to.path,
          userStoreLoggedIn: userStore.isLoggedIn,
          authDataExists: hasAuthData
        })

        // 如果用户存储状态不一致，尝试恢复
        if (!userStore.isLoggedIn && hasAuthData) {
          console.log('🔄 检测到状态不一致，开始恢复...')
          const restored = authModule.restoreAuthState()
          if (restored) {
            console.log('✅ 路由守卫已恢复登录状态')
          } else {
            console.log('❌ 路由守卫恢复登录状态失败')
          }
        }
      } catch (error) {
        console.error('❌ 路由守卫恢复登录状态失败:', error)
      }
    }
    if (isLoggedIn && (!userInfo || Object.keys(userInfo).length === 0) && !isSimulateMode) {
      let restoredViaApi = false
      try {
        await userStore.fetchUserInfo({ forceRefresh: true })
        if (userStore.userInfo && Object.keys(userStore.userInfo).length > 0) {
          console.log('🔄 通过 API 成功恢复用户信息')
          restoredViaApi = true
          next()
          return
        }
      } catch (error) {
        console.warn('⚠️ 通过 API 恢复用户信息失败:', error)
      }

      const hasPersistentToken = !!localStorage.getItem('token')
      if (!restoredViaApi && hasPersistentToken) {
        console.warn('⚠️ 检测到 token 存在但用户信息缺失，暂不清理登录状态，放行以便页面自行加载。')
        try {
          const storedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          if (storedInfo && Object.keys(storedInfo).length > 0) {
            userStore.setUserInfo(storedInfo)
          }
        } catch (error) {
          console.warn('解析本地用户信息失败:', error)
        }
        const token = localStorage.getItem('token')
        if (token) {
          userStore.setToken(token)
        } else {
          userStore.isLoggedIn = true
        }
        next()
        return
      }

      // 检查是否是从工程师页面返回，如果是则不清除登录状态
      if (from.path === '/engineer' && to.path === '/user') {
        console.log('🔧 从工程师工作台返回到个人中心，跳过清除登录状态')
        next()
        return
      }

      // 检查是否是从微信相关页面跳转过来的
      const isFromWechatPage = from.path === '/wechat-callback' ||
        from.path === '/user/wechat-callback' ||
        localStorage.getItem('fromWechatLogin') === 'true';

      if (isFromWechatPage) {
        try {
          // 尝试从localStorage获取用户信息
          const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

          if (storedUserInfo && Object.keys(storedUserInfo).length > 0) {
            userStore.setUserInfo(storedUserInfo);

            // 设置标记，避免重复处理
            localStorage.removeItem('fromWechatLogin');

            // 继续导航
            next();
            return;
          }
        } catch (e) {
          // 静默处理解析错误
        }
      }

      // 检查是否处于模拟登录模式
      const isSimulateMode = sessionStorage.getItem('simulate_mode') === 'true'

      if (isSimulateMode) {
        console.log('🔐 路由守卫检测到模拟登录模式，不清理管理员登录状态')
        // 只清理模拟登录相关数据
        sessionStorage.removeItem('simulate_mode')
        sessionStorage.removeItem('simulate_token')
        sessionStorage.removeItem('simulate_user_info')
      } else {
        // 非模拟登录模式下才清除登录状态
        console.log('🔐 路由守卫正常模式清除登录状态')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('wechat_info')
        localStorage.removeItem('tempUserInfo')
        localStorage.removeItem('needBindPhone')
        userStore.clearUserInfo()
      }

      // 检查是否是分支机构用户
      const branchCode = localStorage.getItem('branch_code')
      const isBranchPage = to.path.startsWith('/branch/')
      const isBranchUser = localStorage.getItem('isBranch') === '1' // 明确的分支机构用户标记
      const hasBranchToken = localStorage.getItem('branch_token') // 分支机构token

      console.log('🔍 分支机构用户检查:', {
        branchCode,
        isBranchPage,
        isBranchUser,
        hasBranchToken,
        targetPath: to.path
      })

      // 只有在以下情况才跳转到分支机构登录：
      // 1. 访问分支机构页面 (/branch/ 开头)
      // 2. 或者同时满足：有branch_code + 明确标记为分支机构用户 + 有分支机构token
      if (isBranchPage || (branchCode && isBranchUser && hasBranchToken)) {
        // 分支机构用户跳转到分支机构登录页面
        const targetBranchCode = branchCode || 'XM0001'
        console.log('🏢 分支机构用户登录状态异常，跳转到分支机构登录页面:', targetBranchCode)
        next({
          path: '/branch-login',
          query: { branch_code: targetBranchCode }
        })
        return
      }

      const host = window.location.host
      const isProduction = host.includes('pay.itapgo.com')

      if (isProduction) {
        window.location.href = `/app/#/login`
        return
      } else {
        next('/login')
        return
      }
    }

    // 如果页面需要登录而用户未登录，则跳转到登录页
    // 但在模拟登录模式下允许访问
    if (to.meta.requiresAuth && !isLoggedIn && !isSimulateMode) {
      // 检查是否是分支机构页面
      const isBranchPage = to.path.startsWith('/branch/')
      const branchCode = localStorage.getItem('branch_code')
      const isBranchUser = localStorage.getItem('isBranch') === '1' // 明确的分支机构用户标记

      // 只有明确的分支机构用户或访问分支机构页面时才跳转到分支机构登录
      if (isBranchPage || (branchCode && isBranchUser)) {
        // 分支机构用户跳转到分支机构登录页面
        const targetBranchCode = branchCode || 'XM0001'
        console.log('🏢 分支机构用户未登录，跳转到分支机构登录页面:', targetBranchCode)
        next({
          path: '/branch-login',
          query: { branch_code: targetBranchCode, redirect: to.fullPath }
        })
        return
      }

      // 记录当前环境和主机名，以便确定正确的登录页面URL
      const host = window.location.host
      const isProduction = host.includes('pay.itapgo.com')

      if (isProduction) {
        window.location.href = `/app/#/login?redirect=${encodeURIComponent(to.fullPath)}`
        return
      } else {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }

    // 如果用户已登录并试图访问登录页，直接跳转到个人中心
    // 但在模拟登录模式下允许访问
    if (isLoggedIn && (to.path === '/login' || to.path === '/legacy-login' || to.path === '/user/login') && !isSimulateMode) {
      next('/user')
      return
    }

    // 检查用户是否已登录但未绑定手机号
    // 但在模拟登录模式下跳过此检查
    if (isLoggedIn && userInfo && to.path !== '/bind-phone' && !isSimulateMode) {
      // 检查是否是分支机构用户（分支机构用户无需绑定手机号）
      const wechatInfo = JSON.parse(localStorage.getItem('wechat_info') || '{}')
      const isBranchUser = wechatInfo.branch_id || userInfo.branch_id

      // 判断用户是否有手机号
      const hasPhone = userInfo.phone && userInfo.phone.length > 0

      // 如果登录成功但没有手机号，且不是分支机构用户，强制跳转到绑定手机号页面
      if (!hasPhone && !isBranchUser) {
        let tempUserInfo = {}
        try {
          tempUserInfo = JSON.parse(localStorage.getItem('tempUserInfo') || '{}')
        } catch (error) {
          console.warn('解析绑定手机号临时用户信息失败:', error)
          tempUserInfo = {}
        }

        const hasIdentity =
          tempUserInfo.openid ||
          tempUserInfo.userId ||
          tempUserInfo.id ||
          tempUserInfo.wechat_nickname ||
          tempUserInfo.nickname

        if (!hasIdentity) {
          const fallbackTempUser = {
            id: userInfo.id || userInfo.userId || '',
            userId: userInfo.userId || userInfo.id || '',
            openid: userInfo.openid || userInfo.wechat_openid || '',
            unionid: userInfo.unionid || userInfo.wechat_unionid || '',
            name: userInfo.name || userInfo.wechat_nickname || userInfo.nickname || '',
            wechat_nickname: userInfo.wechat_nickname || userInfo.nickname || '',
            wechat_avatar: userInfo.wechat_avatar || userInfo.avatar || '',
            fromWechatLogin: localStorage.getItem('fromWechatLogin') === 'true',
            needBindPhone: true,
            createdAt: Date.now()
          }
          try {
            localStorage.setItem('tempUserInfo', JSON.stringify(fallbackTempUser))
          } catch (error) {
            console.warn('缓存绑定手机号所需用户信息失败:', error)
          }
        }

        localStorage.setItem('needBindPhone', 'true')
      }
    }

    // 角色路由权限控制
    if (to.meta.roles && to.meta.roles.length > 0) {
      // 首先检查用户是否登录
      if (!isLoggedIn && !isSimulateMode) {
        // 未登录用户访问需要角色的页面，重定向到登录页
        console.log('未登录用户访问需要角色的页面，重定向到登录页')

        // 检查是否是分支机构页面
        const isBranchPage = to.path.startsWith('/branch/')
        const branchCode = localStorage.getItem('branch_code')
        const isBranchUser = localStorage.getItem('isBranch') === '1' // 明确的分支机构用户标记

        // 只有明确的分支机构用户或访问分支机构页面时才跳转到分支机构登录
        if (isBranchPage || (branchCode && isBranchUser)) {
          // 分支机构用户跳转到分支机构登录页面
          const targetBranchCode = branchCode || 'XM0001'
          console.log('🏢 分支机构用户访问需要角色的页面但未登录，跳转到分支机构登录页面:', targetBranchCode)
          next({
            path: '/branch-login',
            query: { branch_code: targetBranchCode, redirect: to.fullPath }
          })
          return
        }

        const host = window.location.host
        const isProduction = host.includes('pay.itapgo.com')

        if (isProduction) {
          // 生产环境下使用全路径重定向
          window.location.href = `/app/#/login?redirect=${encodeURIComponent(to.fullPath)}`
          return
        } else {
          // 开发环境下使用router正常导航
          next({
            path: '/login',
            query: { redirect: to.fullPath }
          })
          return
        }
      }

      // 用户已登录，检查角色权限
      if ((isLoggedIn && userInfo) || isSimulateMode) {
        // 检查用户是否拥有所需角色
        const requiredRoles = to.meta.roles

        // 增强的角色检查函数，优先从localStorage获取最新数据
        const checkRole = (role) => {
          let roleValue = userInfo[`is_${role}`]

          // 如果当前userInfo中的角色值不存在或为0，尝试从localStorage获取最新值
          if (!roleValue || roleValue === 0 || roleValue === '0') {
            try {
              const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
              if (storedUserInfo && storedUserInfo[`is_${role}`]) {
                roleValue = storedUserInfo[`is_${role}`]
                console.log(`🔍 路由守卫从localStorage获取${role}角色:`, roleValue)
              }
            } catch (e) {
              console.warn('解析localStorage中的userInfo失败:', e)
            }
          }

          // 确保返回布尔值，支持字符串和数字类型
          const result = roleValue === 1 || roleValue === '1' || parseInt(roleValue) === 1

          // 为工程师角色添加额外的调试信息
          if (role === 'engineer') {
            console.log(`🔧 工程师角色验证详情:`, {
              role,
              originalValue: userInfo[`is_${role}`],
              finalValue: roleValue,
              result,
              userInfo: userInfo
            })
          }

          return result
        }

        const hasRequiredRole = requiredRoles.some(role => {
          switch (role) {
            case 'vip':
              return checkRole('vip')
            case 'admin':
              return checkRole('admin')
            case 'salesman':
              return checkRole('salesman')
            case 'engineer':
              return checkRole('engineer')
            case 'water_purifier_user':
              return checkRole('water_purifier_user')
            case 'water_purifier_agent':
              return checkRole('water_purifier_agent')
            case 'pay_institution':
              return checkRole('pay_institution')
            case 'pay_merchant':
              return checkRole('pay_merchant')
            default:
              return false
          }
        })

        if (hasRequiredRole || isSimulateMode) {
          if (!isSimulateMode && requiredRoles.includes('pay_institution') && !checkRole('salesman')) {
            Dialog.alert({
              title: '请先开通销售经理',
              message: '访问支付机构需要销售经理身份。\n请联系您的上级，以 ¥598 购买销售经理权限（含 1 台播报器与美团展业账号），开通后即可继续访问。',
              confirmButtonText: '我知道了'
            }).finally(() => {
              next('/user')
            })
            return
          }
          next()
        } else {
          // 如果需要admin角色但用户不是admin，跳转到管理员登录页面
          if (requiredRoles.includes('admin')) {
            console.log('🔐 需要管理员权限，跳转到管理员登录页面')
            next({
              path: '/admin/login',
              query: { redirect: to.fullPath }
            })
            return
          }

          // 对于工程师角色，给出更友好的提示并跳转到个人中心，避免清除登录状态
          if (requiredRoles.includes('engineer')) {
            console.log('🔧 工程师角色验证失败，跳转到个人中心')
            next('/user')
            return
          }

          if (requiredRoles.includes('pay_institution')) {
            console.warn('用户缺少支付机构权限，跳转至开通指引页')
            const fromPath = encodeURIComponent(to.fullPath || '/institution')
            next({
              name: 'InstitutionApply',
              query: {
                from: fromPath,
                reason: 'missing-role'
              }
            })
            return
          }

          // 用户没有所需角色，跳转到首页并提示
          console.warn(`用户缺少访问权限，需要角色: ${requiredRoles.join(', ')}`)
          next('/')
          return
        }
      } else {
        // 登录状态异常，重定向到登录页
        console.log('登录状态异常，重定向到登录页')
        const host = window.location.host
        const isProduction = host.includes('pay.itapgo.com')

        if (isProduction) {
          // 生产环境下使用全路径重定向
          window.location.href = `/app/#/login?redirect=${encodeURIComponent(to.fullPath)}`
          return
        } else {
          // 开发环境下使用router正常导航
          next('/login')
          return
        }
      }
    } else {
      // 不需要角色控制的页面
      next()
    }
  } else {
    // 不需要认证的页面直接通过
    // 特殊处理：如果访问登录页且已经登录，重定向到首页
    if (
      (to.path === '/user/login' || to.path === '/login' || to.path === '/legacy-login') &&
      !to.query.simulate_token &&
      to.query.force !== '1'
    ) {
      const userStore = useUserStore()
      const simulateMode = sessionStorage.getItem('simulate_mode') === 'true'
      const hasToken =
        userStore.isLoggedIn ||
        !!userStore.token ||
        !!localStorage.getItem('token') ||
        !!sessionStorage.getItem('token')

      if (!simulateMode && hasToken) {
        const target = resolveLoginRedirectTarget(to.query.redirect)
        if (target.external) {
          window.location.href = target.url
          return
        }
        next(target.path)
        return
      }
    }

    next()
    return
  }
})

// 彻底清除所有认证数据的辅助函数
function clearAllAuthData() {
  try {
    // 清除localStorage
    localStorage.clear()

    // 清除sessionStorage
    sessionStorage.clear()

    // 清除所有可能的认证cookie
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    })

    // 清除全局认证变量
    if (window.TAPGO_AUTH) {
      delete window.TAPGO_AUTH
    }
    window.TAPGO_TOKEN = null
    window.TAPGO_USER_INFO = null
    window.TAPGO_LOGIN_TIME = null

    console.log('✅ 所有认证数据已彻底清除')
  } catch (error) {
    console.error('清除认证数据失败:', error)
  }
}

// 处理导航错误
router.onError((error) => {
  // 生产环境关闭日志
})

// 阻止NavigationDuplicated错误
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      // 生产环境关闭日志
      return Promise.reject(err)
    }
    return Promise.resolve()
  })
}

export default router
