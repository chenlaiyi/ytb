<template>
  <div class="ytb-home">
    <!-- 顶部用户信息 -->
    <div class="header">
      <div class="user-info">
        <van-image
          round
          width="60"
          height="60"
          :src="userInfo.avatar || defaultAvatar"
          @error="handleAvatarError"
        />
        <div class="user-detail">
          <div class="nickname">{{ userInfo.nickname || '亿拓宝用户' }}</div>
          <div class="role-tag" :class="userInfo.role">
            {{ userInfo.role_name || '普通用户' }}
          </div>
        </div>
      </div>
      <van-icon name="setting-o" size="24" color="#fff" @click="goToProfile" />
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-card">
      <div class="stats-row">
        <div class="stat-item" @click="goToTeam">
          <div class="stat-value">{{ userInfo.direct_user_count || 0 }}</div>
          <div class="stat-label">直推用户</div>
        </div>
        <div class="stat-item" @click="goToTeam">
          <div class="stat-value">{{ userInfo.direct_scp_count || 0 }}</div>
          <div class="stat-label">直推CP伙伴</div>
        </div>
        <div class="stat-item" @click="goToCommission">
          <div class="stat-value">{{ formatMoney(commissionStats.total_settled || 0) }}</div>
          <div class="stat-label">已结算分佣</div>
        </div>
        <div class="stat-item" @click="goToCommission">
          <div class="stat-value">{{ formatMoney(commissionStats.total_pending || 0) }}</div>
          <div class="stat-label">待结算分佣</div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset>
        <!-- BossCP 投资管理 (仅BossCP显示) -->
        <van-cell 
          v-if="userInfo.role === 'boss_cp'"
          title="BossCP 投资管理" 
          is-link 
          @click="goToInvestment"
        >
          <template #icon>
            <van-icon name="gem" color="#ff976a" style="margin-right: 8px;" />
          </template>
        </van-cell>

        <!-- 推广安装记录 (所有人可见) -->
        <van-cell title="推广安装记录" is-link @click="goToInstallations">
          <template #icon>
            <van-icon name="chart-trending-o" color="#07c160" style="margin-right: 8px;" />
          </template>
        </van-cell>

        <!-- 推广二维码（仅CP伙伴/VIPCP伙伴/BossCP显示） -->
        <van-cell 
          v-if="userInfo.can_invite"
          title="我的推广码" 
          is-link 
          @click="showInviteCode"
        >
          <template #icon>
            <van-icon name="qr" color="#667eea" style="margin-right: 8px;" />
          </template>
          <template #value>
            <span class="invite-code">{{ userInfo.invite_code || '点击查看' }}</span>
          </template>
        </van-cell>

        <!-- 升级入口 -->
        <van-cell 
          v-if="userInfo.role !== 'boss_cp'"
          :title="upgradeTitle" 
          is-link 
          @click="goToUpgrade"
        >
          <template #icon>
            <van-icon name="upgrade" color="#667eea" style="margin-right: 8px;" />
          </template>
        </van-cell>

        <!-- 我的团队 -->
        <van-cell title="我的团队" is-link @click="goToTeam">
          <template #icon>
            <van-icon name="friends-o" color="#667eea" style="margin-right: 8px;" />
          </template>
        </van-cell>

        <!-- 分佣记录 -->
        <van-cell title="分佣记录" is-link @click="goToCommission">
          <template #icon>
            <van-icon name="gold-coin-o" color="#667eea" style="margin-right: 8px;" />
          </template>
        </van-cell>

        <!-- 升级申请记录 -->
        <van-cell title="升级申请记录" is-link @click="goToApplications">
          <template #icon>
            <van-icon name="orders-o" color="#667eea" style="margin-right: 8px;" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 待处理申请提示 -->
    <div class="pending-notice" v-if="pendingApplication">
      <van-notice-bar 
        left-icon="info-o" 
        :text="`您有一个${pendingApplication.to_role === 'scp' ? 'CP伙伴' : 'VIPCP伙伴'}升级申请正在审核中`"
        @click="goToApplications"
      />
    </div>

    <!-- 邀请码弹窗 -->
    <van-popup v-model:show="showInvitePopup" round position="center" :style="{ width: '85%', padding: '24px' }">
      <div class="invite-popup">
        <h3>我的推广码</h3>
        <!-- 推广二维码 -->
        <div class="qrcode-container">
          <van-image
            width="180"
            height="180"
            :src="inviteCodeData.qrcode_url"
            fit="contain"
          >
            <template v-slot:loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template v-slot:error>
              <div class="qrcode-error">
                <van-icon name="photo-fail" size="40" />
                <span>加载失败</span>
              </div>
            </template>
          </van-image>
        </div>
        <div class="code-display">{{ inviteCodeData.invite_code }}</div>
        <p class="invite-tip">分享二维码或邀请码给好友，好友升级CP伙伴后您可获得分佣</p>
        <div class="invite-actions">
          <van-button type="primary" block @click="copyInviteCode">复制邀请码</van-button>
          <van-button plain block @click="copyInviteUrl" style="margin-top: 12px;">复制邀请链接</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 底部导航 -->
    <YtbTabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getUserInfo, getInviteCode, isLoggedIn, getLocalUser } from '@/api/ytb'
import YtbTabBar from '@/components/ytb/TabBar.vue'
import { useYtbShare } from '@/composables/useYtbShare'
import { getYtbRegisterUrl } from '@/utils/ytb'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟')

const router = useRouter()

// 默认头像
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="50"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle">Y</text></svg>'

// 状态
const userInfo = ref({})
const commissionStats = ref({})
const pendingApplication = ref(null)
const showInvitePopup = ref(false)
const inviteCodeData = ref({})

// 计算属性
const upgradeTitle = computed(() => {
  if (userInfo.value.role === 'normal') {
    return '升级为CP伙伴'
  } else if (userInfo.value.role === 'scp') {
    const requirement = 9 // 默认值
    const current = userInfo.value.direct_scp_count || 0
    if (current >= requirement) {
      return '升级为VIPCP伙伴（已达标）'
    }
    return `升级为VIPCP伙伴（${current}/${requirement}）`
  }
  return ''
})

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/login')
    return
  }

  await loadUserInfo()
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0) {
      userInfo.value = res.data
      commissionStats.value = res.data.commission_stats || {}
      
      // 保存到本地
      localStorage.setItem('ytb_user', JSON.stringify({
        id: res.data.id,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
        role: res.data.role,
        role_name: res.data.role_name,
        invite_code: res.data.invite_code,
        can_invite: res.data.can_invite
      }))
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 尝试使用本地缓存
    const localUser = getLocalUser()
    if (localUser) {
      userInfo.value = localUser
    }
  }
}

// 显示邀请码
const showInviteCode = async () => {
  if (userInfo.value.invite_code) {
    const inviteUrl = getYtbRegisterUrl(userInfo.value.invite_code)
    inviteCodeData.value = {
      invite_code: userInfo.value.invite_code,
      invite_url: inviteUrl,
      qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
    }
    showInvitePopup.value = true
    return
  }

  try {
    const res = await getInviteCode()
    if (res.code === 0) {
      inviteCodeData.value = res.data
      userInfo.value.invite_code = res.data.invite_code
      showInvitePopup.value = true
    } else {
      showToast(res.message || '获取邀请码失败')
    }
  } catch (error) {
    showToast('获取邀请码失败')
  }
}

// 复制邀请码
const copyInviteCode = () => {
  navigator.clipboard.writeText(inviteCodeData.value.invite_code)
    .then(() => showSuccessToast('已复制邀请码'))
    .catch(() => showToast('复制失败'))
}

// 复制邀请链接
const copyInviteUrl = () => {
  navigator.clipboard.writeText(inviteCodeData.value.invite_url)
    .then(() => showSuccessToast('已复制邀请链接'))
    .catch(() => showToast('复制失败'))
}

// 格式化金额
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

// 头像加载失败
const handleAvatarError = (e) => {
  e.target.src = defaultAvatar
}

// 页面跳转
const goToProfile = () => router.push('/profile')
const goToUpgrade = () => router.push('/upgrade')
const goToTeam = () => router.push('/team')
const goToCommission = () => router.push('/commission')
const goToApplications = () => router.push('/applications')
const goToInvestment = () => router.push('/investment')
const goToInstallations = () => router.push('/installations')
</script>

<style scoped>
.ytb-home {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 60px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-detail {
  color: white;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.role-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.role-tag.scp {
  background: rgba(255, 193, 7, 0.3);
}

.role-tag.team_cp {
  background: rgba(255, 87, 34, 0.3);
}

.stats-card {
  background: white;
  margin: -40px 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.menu-section {
  margin-top: 16px;
}

.invite-code {
  color: #667eea;
  font-weight: bold;
}

.pending-notice {
  margin: 16px;
}

.invite-popup {
  text-align: center;
}

.invite-popup h3 {
  margin: 0 0 20px;
  color: #333;
}

.code-display {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  letter-spacing: 4px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.invite-tip {
  font-size: 12px;
  color: #999;
  margin-bottom: 20px;
}

.invite-actions {
  margin-top: 20px;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.qrcode-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.qrcode-error span {
  margin-top: 8px;
}
</style>
