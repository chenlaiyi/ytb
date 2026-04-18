<template>
  <view class="page">
    <!-- 当前等级 -->
    <view class="level-card">
      <view class="level-icon">{{ getRoleIcon(currentRole) }}</view>
      <view class="level-info">
        <text class="level-title">{{ getRoleName(currentRole) }}</text>
        <text class="level-desc">你当前的合伙人等级</text>
      </view>
    </view>

    <!-- 等级路线 -->
    <view class="route-section">
      <view class="section-title">🚀 升级路线</view>
      <view class="route-list">
        <view class="route-item" v-for="(level, idx) in levels" :key="level.key" :class="{ current: level.key === currentRole, passed: isLevelPassed(level.key) }">
          <view class="route-dot" :class="{ active: level.key === currentRole || isLevelPassed(level.key) }">
            <text v-if="isLevelPassed(level.key)">✓</text>
            <text v-else>{{ idx + 1 }}</text>
          </view>
          <view class="route-line" v-if="idx < levels.length - 1" :class="{ filled: isLevelPassed(levels[idx + 1].key) || levels[idx + 1].key === currentRole }"></view>
          <view class="route-content">
            <view class="route-header">
              <text class="route-name">{{ level.name }}</text>
              <view class="route-badge" v-if="level.key === currentRole">当前</view>
            </view>
            <text class="route-desc">{{ level.desc }}</text>
            <view class="route-benefits">
              <text class="benefit" v-for="b in level.benefits" :key="b">{{ b }}</text>
            </view>
            <button class="upgrade-btn" v-if="canUpgradeTo(level.key)" @tap="applyUpgrade(level.key)" :disabled="submitting">
              申请升级
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 升级申请记录 -->
    <view class="records-section" v-if="applications.length > 0">
      <view class="section-title">📋 申请记录</view>
      <view class="app-item" v-for="app in applications" :key="app.id">
        <view class="app-left">
          <text class="app-target">申请升级为 {{ getRoleName(app.target_role) }}</text>
          <text class="app-time">{{ app.created_at }}</text>
        </view>
        <view class="app-status" :class="'st-' + app.status">{{ getStatusText(app.status) }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, post } from '../../api/request'

const currentRole = ref('normal')
const upgradeInfo = ref({})
const applications = ref([])
const submitting = ref(false)

const levels = [
  { key: 'normal', name: '普通用户', desc: '注册即享基本权益', benefits: ['设备管理', '预约安装', '基础分佣'] },
  { key: 'scp', name: 'SCP合伙人', desc: '标准渠道合伙人', benefits: ['直推佣金提升', '团队管理', '装机奖励'] },
  { key: 'team_cp', name: 'VIPCP合伙人', desc: 'VIP渠道合伙人', benefits: ['更高佣金比例', '团队间推收益', '专属客服'] },
  { key: 'boss_cp', name: 'BossCP合伙人', desc: '最高等级合伙人', benefits: ['最高佣金比例', '全网分润', '投资分红', '区域代理'] },
]

const roleOrder = { normal: 0, scp: 1, team_cp: 2, boss_cp: 3 }
const isLevelPassed = (key) => (roleOrder[key] || 0) < (roleOrder[currentRole.value] || 0)
const getRoleName = (r) => levels.find(l => l.key === r)?.name || r
const getRoleIcon = (r) => ({ normal: '👤', scp: '⭐', team_cp: '💎', boss_cp: '👑' }[r] || '👤')
const getStatusText = (s) => ({ pending: '审核中', approved: '已通过', rejected: '已拒绝' }[s] || '处理中')

const canUpgradeTo = (key) => {
  const cur = roleOrder[currentRole.value] || 0
  const target = roleOrder[key] || 0
  return target === cur + 1
}

const fetchData = async () => {
  try {
    const [infoRes, appRes] = await Promise.all([
      get('/api/ytb/upgrade/info'),
      get('/api/ytb/upgrade/applications')
    ])
    if (infoRes.code === 0) {
      currentRole.value = infoRes.data.current_role || 'normal'
      upgradeInfo.value = infoRes.data
    }
    if (appRes.code === 0) applications.value = appRes.data?.list || []
  } catch (e) {}
}

const applyUpgrade = async (targetRole) => {
  uni.showModal({
    title: '升级确认',
    content: `确定要申请升级为「${getRoleName(targetRole)}」吗？提交后将由管理员审核。`,
    success: async (res) => {
      if (!res.confirm) return
      submitting.value = true
      try {
        const res = await post('/api/ytb/upgrade/apply', { target_role: targetRole })
        uni.showToast({ title: res.code === 0 ? '申请已提交' : (res.message || '提交失败'), icon: res.code === 0 ? 'success' : 'none' })
        if (res.code === 0) fetchData()
      } catch (e) { uni.showToast({ title: '网络异常', icon: 'none' }) }
      finally { submitting.value = false }
    }
  })
}

onShow(() => fetchData())
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f7; padding: 24rpx; padding-bottom: 60rpx; }

.level-card { display: flex; align-items: center; gap: 24rpx; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 24rpx; padding: 40rpx; color: #fff; margin-bottom: 24rpx; }
.level-icon { font-size: 64rpx; }
.level-title { font-size: 36rpx; font-weight: 800; display: block; }
.level-desc { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; margin-top: 4rpx; }

.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; margin-bottom: 20rpx; }
.route-section { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; }

.route-list { position: relative; }
.route-item { display: flex; gap: 20rpx; position: relative; padding-bottom: 32rpx; }
.route-item:last-child { padding-bottom: 0; }
.route-dot { width: 48rpx; height: 48rpx; border-radius: 50%; background: #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 22rpx; color: #9CA3AF; font-weight: 700; flex-shrink: 0; z-index: 1; }
.route-dot.active { background: #4F46E5; color: #fff; }
.route-line { position: absolute; left: 23rpx; top: 48rpx; width: 2rpx; height: calc(100% - 48rpx); background: #E5E7EB; }
.route-line.filled { background: #4F46E5; }
.route-content { flex: 1; }
.route-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.route-name { font-size: 30rpx; font-weight: 700; color: #1e293b; }
.route-badge { font-size: 20rpx; background: #4F46E5; color: #fff; padding: 4rpx 12rpx; border-radius: 8rpx; }
.route-desc { font-size: 24rpx; color: #94a3b8; margin-bottom: 12rpx; }
.route-benefits { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: 12rpx; }
.benefit { font-size: 22rpx; background: #f0f0ff; color: #4F46E5; padding: 4rpx 16rpx; border-radius: 8rpx; }

.route-item.passed .route-name { color: #94a3b8; }
.route-item.current { background: #f8f7ff; margin: -12rpx; padding: 12rpx; border-radius: 16rpx; padding-bottom: 32rpx; }

.upgrade-btn { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #fff; border: none; border-radius: 12rpx; padding: 16rpx 0; font-size: 26rpx; font-weight: 600; width: 100%; margin: 0; }
.upgrade-btn::after { border: none; }
.upgrade-btn[disabled] { opacity: 0.5; }

.records-section { background: #fff; border-radius: 20rpx; padding: 24rpx; }
.app-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.app-item:last-child { border-bottom: none; }
.app-target { display: block; font-size: 28rpx; color: #334155; }
.app-time { display: block; font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; }
.app-status { font-size: 24rpx; font-weight: 600; padding: 6rpx 16rpx; border-radius: 12rpx; }
.st-pending { background: #FEF3C7; color: #D97706; }
.st-approved { background: #D1FAE5; color: #059669; }
.st-rejected { background: #FEE2E2; color: #EF4444; }
</style>
