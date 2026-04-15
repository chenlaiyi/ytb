<template>
  <div class="branch-user-container">
    <!-- 头部背景和用户信息 -->
    <div class="user-header">
      <div class="header-bg"></div>
      
      <div class="user-profile">
        <div class="avatar-container">
          <template v-if="userInfo.userId">
            <VanImage
              round
              width="76"
              height="76"
              :src="getUserAvatar()"
              :error-content="'头像'"
              class="user-avatar"
              @load="() => console.log('头像加载成功:', getUserAvatar())"
              @error="handleAvatarError"
            />
          </template>
          <div v-else class="avatar-fallback">
            <van-icon name="user-o" size="32" color="rgba(255,255,255,0.8)" />
          </div>
          <div class="vip-badge" v-if="hasRole('is_vip')">VIP</div>
        </div>
        
        <div class="user-info-content">
          <div v-if="userInfo.userId" class="user-name-row">
            <span class="user-name">{{ getUserDisplayName() }}</span>
            <div class="user-id">ID: {{ userInfo.userId }}</div>
          </div>
          <div v-else class="login-btn" @click="handleLogin">点击登录/注册</div>
          
          <!-- 用户角色标签 -->
          <div class="role-tags" v-if="userInfo.userId && userInfo.roles && userInfo.roles.length > 0">
            <div class="role-chips">
              <span 
                v-for="(role, index) in userInfo.roles" 
                :key="index" 
                class="role-dot" 
                :class="getRoleClass(role)"
                :title="role"
              >
                <van-icon :name="getRoleIcon(role)" size="12" />
              </span>
            </div>
          </div>
        </div>
        
        <div class="settings-btn" @click="$router.push('/branch/settings')">
          <van-icon name="setting-o" size="22" />
        </div>
      </div>
      
      <!-- 资产卡片 -->
      <div class="assets-card">
        <div class="asset-item" @click="$router.push('/branch/wallet')">
          <div class="asset-value">¥0.00</div>
          <div class="asset-label">钱包余额</div>
        </div>
        <div class="asset-item" @click="$router.push('/branch/points')">
          <div class="asset-value">0</div>
          <div class="asset-label">我的积分</div>
        </div>
        <div class="asset-item" @click="$router.push('/branch/benefits')">
          <div class="asset-value">0</div>
          <div class="asset-label">专属福利</div>
        </div>
      </div>
    </div>
    
    <!-- 我的工作台卡片 -->
    <div class="section workspace-card" v-if="userInfo.userId">
      <div class="section-header">
        <span class="section-title">我的工作台</span>
        <div class="view-all">
          <span>快捷入口</span>
        </div>
      </div>
      
      <div class="workspace-quick-grid">
        <!-- 业务中心 - 分支机构业务员 -->
        <div class="quick-item" @click="$router.push('/branch/salesman')">
          <div class="quick-icon salesman">
            <van-icon name="manager-o" size="24" />
          </div>
          <div class="quick-text">业务中心</div>
        </div>
        
        <!-- 净水管理 - 分支机构净水器用户 -->
        <div class="quick-item" v-if="hasRole('is_water_purifier_user')" @click="$router.push('/branch/water')">
          <div class="quick-icon purifier">
            <van-icon name="filter-o" size="24" />
          </div>
          <div class="quick-text">净水管理</div>
        </div>
        
        <!-- 工程师台 - 分支机构工程师 -->
        <div class="quick-item" v-if="hasRole('is_engineer')" @click="$router.push('/branch/engineer')">
          <div class="quick-icon engineer">
            <van-icon name="bulb-o" size="24" />
          </div>
          <div class="quick-text">工程师台</div>
        </div>
        
        <!-- VIP中心 - 分支机构VIP -->
        <div class="quick-item" v-if="hasRole('is_vip')" @click="$router.push('/branch/vip')">
          <div class="quick-icon vip">
            <van-icon name="gem-o" size="24" />
          </div>
          <div class="quick-text">VIP中心</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, Image as VanImage } from 'vant'

export default {
  name: 'BranchProfile',
  components: {
    VanImage
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const userInfo = ref({
      userId: '',
      nickname: '',
      wechat_nickname: '',
      avatar: '',
      wechat_avatar: '',
      phone: '',
      email: '',
      name: '',
      roles: [],
      is_pay_institution: 0,
      is_water_purifier_user: 0,
      is_engineer: 0,
      is_water_purifier_agent: 0,
      is_pay_merchant: 0,
      is_vip: 0,
      is_salesman: 0,
      is_admin: 0
    })

    const branchInfo = ref({
      name: '',
      code: ''
    })

    const userAssets = ref({
      balance: '0.00',
      points: '0',
      benefits: '0'
    })

    const orderStats = ref({
      unpaid: 0,
      unshipped: 0,
      shipped: 0,
      completed: 0,
      afterSale: 0
    })

    // 获取用户显示名称
    const getUserDisplayName = () => {
      if (!userInfo.value.userId) return '未登录'
      
      // 优先显示微信昵称，然后是姓名，最后是昵称，都没有则显示用户ID
      return userInfo.value.wechat_nickname || 
             userInfo.value.name || 
             userInfo.value.nickname || 
             `用户${userInfo.value.userId}`
    }

    // 获取用户头像
    const getUserAvatar = () => {
      // 优先使用微信头像，然后是普通头像，最后是默认头像
      let avatar = userInfo.value.wechat_avatar || userInfo.value.avatar
      
      if (!avatar) {
        return 'https://avatars.githubusercontent.com/u/1?v=4' // 默认头像
      }
      
      // 确保头像URL是完整的
      if (!avatar.startsWith('http')) {
        avatar = 'https://pay.itapgo.com' + avatar
      }
      
      return avatar
    }

    // 处理头像加载错误
    const handleAvatarError = (error) => {
      console.log('头像加载失败，使用默认头像:', error)
    }

    // 处理登录
    const handleLogin = () => {
      const branchCode = localStorage.getItem('branch_code') || 'XM0001'
      router.push(`/branch-login?branch_code=${branchCode}`)
    }

    // 检查分支机构登录状态
    const checkBranchLoginStatus = () => {
      const userId = localStorage.getItem('user_id')
      const branchCode = localStorage.getItem('branch_code')
      const isBranch = localStorage.getItem('isBranch')
      
      const isValidBranchLogin = userId && branchCode && isBranch === '1'
      
      console.log('分支机构登录状态检查:', {
        userId,
        branchCode,
        isBranch,
        isValidBranchLogin
      })
      
      return isValidBranchLogin
    }

    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        console.log('开始加载分支机构用户信息...')
        
        // 检查分支机构登录状态
        if (!checkBranchLoginStatus()) {
          console.log('分支机构用户未登录，显示登录按钮')
          return
        }
        
        const userId = localStorage.getItem('user_id')
        const branchCode = localStorage.getItem('branch_code') || 'XM0001'
        
        console.log('分支机构用户信息加载:', { userId, branchCode })

        // 强制从API获取最新的用户信息
        console.log('强制从API获取用户信息，确保数据最新...')
        
        let branchUserInfo = null
        
        try {
          // 使用分支机构用户API
          const response = await fetch(`/Tapp/admin/api/branch-user/profile.php?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.code === 0 && result.data) {
              console.log('从API获取到用户信息:', result.data)
              branchUserInfo = result.data
              localStorage.setItem('branch_userInfo', JSON.stringify(branchUserInfo))
            } else {
              console.log('API返回错误:', result)
            }
          } else {
            console.log('API请求失败:', response.status, response.statusText)
          }
        } catch (error) {
          console.log('API获取用户信息失败:', error)
        }
        
        // 如果API获取失败，尝试使用本地存储的信息
        if (!branchUserInfo) {
          console.log('API获取失败，尝试使用本地存储的信息')
          try {
            branchUserInfo = JSON.parse(localStorage.getItem('branch_userInfo') || localStorage.getItem('userInfo') || '{}')
          } catch (e) {
            console.log('解析本地用户信息失败:', e)
          }
        }
        
        // 如果还是没有用户信息，创建默认信息
        if (!branchUserInfo || (!branchUserInfo.id && !branchUserInfo.userId)) {
          console.log('创建默认分支机构用户信息')
          branchUserInfo = {
            id: userId,
            userId: userId,
            nickname: `分支机构用户${userId}`,
            wechat_nickname: `分支机构用户${userId}`,
            name: `用户${userId}`,
            avatar: '',
            wechat_avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
            phone: '',
            email: '',
            is_vip: 0,
            is_salesman: 1, // 所有分支机构用户默认都是业务员
            is_engineer: 0,
            is_water_purifier_user: 0,
            is_pay_institution: 0,
            is_water_purifier_agent: 0,
            is_pay_merchant: 0,
            is_admin: 0
          }
          localStorage.setItem('branch_userInfo', JSON.stringify(branchUserInfo))
        }
        
        // 确保所有分支机构用户都有业务员角色
        if (!branchUserInfo.is_salesman || branchUserInfo.is_salesman === 0) {
          console.log('为分支机构用户设置默认业务员角色')
          branchUserInfo.is_salesman = 1
          localStorage.setItem('branch_userInfo', JSON.stringify(branchUserInfo))
        }
        
        console.log('从localStorage加载分支机构用户信息:', branchUserInfo)
        
        // 确保微信头像URL是完整的
        let wechatAvatar = branchUserInfo.wechat_avatar || ''
        if (wechatAvatar && !wechatAvatar.startsWith('http')) {
          wechatAvatar = 'https://pay.itapgo.com' + wechatAvatar
        }
        
        // 填充用户信息
        userInfo.value = {
          userId: branchUserInfo.id || branchUserInfo.userId || userId,
          nickname: branchUserInfo.nickname || '',
          wechat_nickname: branchUserInfo.wechat_nickname || '',
          avatar: branchUserInfo.avatar || '',
          wechat_avatar: wechatAvatar,
          phone: branchUserInfo.phone || '',
          email: branchUserInfo.email || '',
          name: branchUserInfo.name || branchUserInfo.wechat_nickname || branchUserInfo.nickname || '',
          roles: branchUserInfo.roles || [],
          is_pay_institution: parseInt(branchUserInfo.is_pay_institution || 0),
          is_water_purifier_user: parseInt(branchUserInfo.is_water_purifier_user || 0),
          is_engineer: parseInt(branchUserInfo.is_engineer || 0),
          is_water_purifier_agent: parseInt(branchUserInfo.is_water_purifier_agent || 0),
          is_pay_merchant: parseInt(branchUserInfo.is_pay_merchant || 0),
          is_vip: parseInt(branchUserInfo.is_vip || 0),
          is_salesman: parseInt(branchUserInfo.is_salesman || 0),
          is_admin: parseInt(branchUserInfo.is_admin || 0)
        }
        
        // 处理角色信息
        processRoles()
        
        console.log('分支机构用户信息加载完成:', {
          userId: userInfo.value.userId,
          name: userInfo.value.name,
          wechat_nickname: userInfo.value.wechat_nickname,
          wechat_avatar: userInfo.value.wechat_avatar,
          roles: userInfo.value.roles,
          branchCode: branchCode
        })
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    }

    // 处理角色信息
    const processRoles = () => {
      const roles = []
      
      if (userInfo.value.is_pay_institution === 1 || userInfo.value.is_pay_institution === '1') {
        roles.push('支付机构')
      }
      if (userInfo.value.is_water_purifier_user === 1 || userInfo.value.is_water_purifier_user === '1') {
        roles.push('净水器用户')
      }
      if (userInfo.value.is_engineer === 1 || userInfo.value.is_engineer === '1') {
        roles.push('工程师')
      }
      if (userInfo.value.is_water_purifier_agent === 1 || userInfo.value.is_water_purifier_agent === '1') {
        roles.push('净水器渠道商')
      }
      if (userInfo.value.is_pay_merchant === 1 || userInfo.value.is_pay_merchant === '1') {
        roles.push('支付商户')
      }
      if (userInfo.value.is_vip === 1 || userInfo.value.is_vip === '1') {
        roles.push('VIP会员')
      }
      if (userInfo.value.is_salesman === 1 || userInfo.value.is_salesman === '1') {
        roles.push('业务员')
      }
      if (userInfo.value.is_admin === 1 || userInfo.value.is_admin === '1') {
        roles.push('管理员')
      }
      
      userInfo.value.roles = roles
      console.log('处理后的用户角色:', roles)
    }

    // 检查用户是否具有某个角色
    const hasRole = (role) => {
      if (!userInfo.value || !userInfo.value.userId) {
        return false
      }

      switch (role) {
        case 'is_pay_institution':
          return userInfo.value.is_pay_institution === 1 || userInfo.value.is_pay_institution === '1'
        case 'is_water_purifier_user':
          return userInfo.value.is_water_purifier_user === 1 || userInfo.value.is_water_purifier_user === '1'
        case 'is_engineer':
          return userInfo.value.is_engineer === 1 || userInfo.value.is_engineer === '1'
        case 'is_water_purifier_agent':
          return userInfo.value.is_water_purifier_agent === 1 || userInfo.value.is_water_purifier_agent === '1'
        case 'is_pay_merchant':
          return userInfo.value.is_pay_merchant === 1 || userInfo.value.is_pay_merchant === '1'
        case 'is_vip':
          return userInfo.value.is_vip === 1 || userInfo.value.is_vip === '1'
        case 'is_salesman':
          return userInfo.value.is_salesman === 1 || userInfo.value.is_salesman === '1'
        case 'is_admin':
          return userInfo.value.is_admin === 1 || userInfo.value.is_admin === '1'
        default:
          return false
      }
    }

    // 获取角色对应的图标
    const getRoleIcon = (role) => {
      switch (role) {
        case '支付机构':
          return 'balance-o'
        case '净水器用户':
          return 'filter-o'
        case '工程师':
          return 'bulb-o'
        case '净水器渠道商':
          return 'friends-o'
        case '支付商户':
          return 'shop-o'
        case 'VIP会员':
          return 'gem-o'
        case '业务员':
          return 'manager-o'
        case '管理员':
          return 'shield-o'
        default:
          return 'contact'
      }
    }

    // 获取角色标签的样式类
    const getRoleClass = (role) => {
      switch (role) {
        case '支付机构':
          return 'tag-institution'
        case '净水器用户':
          return 'tag-purifier'
        case '工程师':
          return 'tag-engineer'
        case '净水器渠道商':
          return 'tag-agent'
        case '支付商户':
          return 'tag-merchant'
        case 'VIP会员':
          return 'tag-vip'
        case '业务员':
          return 'tag-salesman'
        case '管理员':
          return 'tag-admin'
        default:
          return 'tag-normal'
      }
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      userInfo,
      branchInfo,
      userAssets,
      orderStats,
      handleAvatarError,
      handleLogin,
      hasRole,
      getRoleIcon,
      getRoleClass,
      processRoles,
      getUserDisplayName,
      getUserAvatar
    }
  }
}
</script>

<style scoped>
.branch-user-container {
  padding-bottom: 60px;
  background: #f7f8fa;
  min-height: 100vh;
}

/* 用户头部 */
.user-header {
  position: relative;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/images/user-bg.png') center/cover;
  opacity: 0.1;
}

.user-profile {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar-container {
  position: relative;
}

.user-avatar {
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-fallback {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.vip-badge {
  position: absolute;
  bottom: -2px;
  left: -2px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid white;
}

.user-info-content {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  margin-bottom: 8px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-right: 12px;
}

.user-id {
  font-size: 12px;
  opacity: 0.8;
}

.login-btn {
  font-size: 16px;
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: inline-block;
}

.role-tags {
  margin-top: 8px;
}

.role-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.role-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
}

.role-dot.tag-salesman {
  background: #1890ff;
}

.role-dot.tag-vip {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
}

.role-dot.tag-engineer {
  background: #52c41a;
}

.role-dot.tag-purifier {
  background: #13c2c2;
}

.settings-btn {
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
}

.settings-btn:hover {
  color: white;
}

/* 资产卡片 */
.assets-card {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  gap: 16px;
}

.asset-item {
  flex: 1;
  text-align: center;
  cursor: pointer;
}

.asset-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.asset-label {
  font-size: 12px;
  opacity: 0.8;
}

/* 工作台卡片 */
.section {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-all {
  color: #999;
  font-size: 12px;
}

.workspace-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.quick-item:hover {
  background: #f5f5f5;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: white;
}

.quick-icon.salesman {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.quick-icon.purifier {
  background: linear-gradient(135deg, #13c2c2, #08979c);
}

.quick-icon.engineer {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}

.quick-icon.vip {
  background: linear-gradient(135deg, #ffd700, #faad14);
}

.quick-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style> 