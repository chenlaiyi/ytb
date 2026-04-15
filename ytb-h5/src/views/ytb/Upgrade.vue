<template>
  <div class="ytb-upgrade">
    <van-nav-bar title="升级中心" left-arrow @click-left="goBack" />

    <!-- 当前角色 -->
    <div class="current-role">
      <van-image
        round
        width="60"
        height="60"
        :src="userInfo.avatar || defaultAvatar"
        class="user-avatar"
      />
      <div class="role-info">
        <div class="role-name">{{ userInfo.nickname || '亿拓宝用户' }}</div>
        <div class="role-tag" :class="userInfo.role">{{ userInfo.role_name || '普通用户' }}</div>
        <div class="role-desc">{{ roleDesc }}</div>
      </div>
    </div>

    <!-- 升级选项 -->
    <div class="upgrade-options">
      <!-- 普通用户升级CP伙伴 -->
      <div class="upgrade-card" v-if="userInfo.role === 'normal'">
        <div class="card-header">
          <h3>升级为CP伙伴</h3>
          <div class="price">¥{{ config.scp_upgrade_fee }}</div>
        </div>
        <div class="card-body">
          <div class="benefits">
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>获得专属邀请码</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>邀请好友升级可获得分佣</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>享受更多平台权益</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <van-button type="primary" block @click="showScpUpgradeOptions">
            立即升级
          </van-button>
        </div>
      </div>

      <!-- CP伙伴升级VIPCP（仅业绩达标可申请） -->
      <div class="upgrade-card" v-if="userInfo.role === 'scp'">
        <div class="card-header">
          <h3>升级为VIPCP伙伴</h3>
          <div class="badge" v-if="meetsRequirement">
            <van-tag type="success">已达标</van-tag>
          </div>
        </div>
        <div class="card-body">
          <div class="requirement">
            <div class="requirement-title">升级条件：直推{{ config.team_cp_requirement }}个CP伙伴</div>
            <div class="requirement-progress">
              <span>当前进度：</span>
              <span class="count">{{ userInfo.direct_scp_count || 0 }}</span>
              <span>/</span>
              <span class="target">{{ config.team_cp_requirement }}</span>
            </div>
            <van-progress 
              :percentage="progressPercent" 
              :pivot-text="progressText"
              :color="meetsRequirement ? '#07c160' : '#667eea'"
            />
          </div>
          <div class="benefits">
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>团队管理权限</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>更高的分佣比例</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>专属团队长权益</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <van-button 
            type="primary" 
            block 
            :disabled="!meetsRequirement"
            @click="applyTeamCpUpgrade"
          >
            {{ meetsRequirement ? '申请升级' : `还需直推${config.team_cp_requirement - (userInfo.direct_scp_count || 0)}个CP伙伴` }}
          </van-button>
          <p class="tip" v-if="!meetsRequirement">
            达到业绩要求后可申请升级，不支持付费升级
          </p>
        </div>
      </div>

      <!-- 已是BossCP -->
      <div class="max-level" v-if="userInfo.role === 'boss_cp'">
        <van-icon name="gem-o" size="64" color="#ff976a" />
        <h3>尊贵的 BossCP</h3>
        <p>您已享有平台顶级权益，正在坐享收益！</p>
      </div>

      <!-- BossCP 升级 (所有人可见，除非已经是BossCP) -->
      <div class="upgrade-card boss-card" v-if="canUpgradeToBoss">
        <div class="card-header">
          <h3>升级为BossCP</h3>
          <div class="price">¥{{ config.boss_cp_upgrade_fee }}</div>
        </div>
        <div class="card-body">
          <div class="benefits">
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>获赠300台净水器额度</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>全系统安装回款30000元</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>单台推广奖励提升至360元</span>
            </div>
            <div class="benefit-item">
              <van-icon name="checked" color="#07c160" />
              <span>享受团队管理分红</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <van-button color="linear-gradient(to right, #ff6034, #ee0a24)" block @click="showBossUpgradeOptions">
            立即升级 BossCP (限时)
          </van-button>
          <p class="tip">额度有限，先到先得</p>
        </div>
      </div>
    </div>

    <!-- 待处理申请 -->
    <div class="pending-section" v-if="pendingApplication">
      <van-cell-group inset title="待处理申请">
        <van-cell 
          :title="`升级${pendingApplication.to_role === 'scp' ? 'CP伙伴' : 'VIPCP伙伴'}申请`"
          :label="`申请时间：${pendingApplication.created_at}`"
        >
          <template #value>
            <van-tag :type="getStatusType(pendingApplication.admin_status)">
              {{ pendingApplication.admin_status_name }}
            </van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- CP伙伴升级方式选择弹窗 -->
    <van-action-sheet
      v-model:show="showScpOptions"
      title="选择升级方式"
      :actions="scpUpgradeActions"
      @select="onScpOptionSelect"
      cancel-text="取消"
    />

    <!-- 邀请码升级表单弹窗 -->
    <van-popup v-model:show="showInviteForm" round position="bottom" :style="{ height: '60%' }">
      <div class="invite-form">
        <h3>通过邀请码升级</h3>
        <van-form @submit="submitInviteCodeUpgrade">
          <van-cell-group inset>
            <van-field
              v-model="inviteForm.invite_code"
              label="邀请码"
              placeholder="请输入6位邀请码"
              maxlength="6"
              type="digit"
              :rules="[{ required: true, message: '请输入邀请码' }]"
            />
            <van-field
              v-model="inviteForm.real_name"
              label="真实姓名"
              placeholder="请输入真实姓名"
              :rules="[{ required: true, message: '请输入真实姓名' }]"
            />
            <van-field
              v-model="inviteForm.phone"
              label="手机号"
              placeholder="请输入手机号"
              type="tel"
              maxlength="11"
              :rules="[{ required: true, message: '请输入手机号' }]"
            />
          </van-cell-group>
          <div class="form-footer">
            <van-button type="primary" block native-type="submit" :loading="submitting">
              提交申请
            </van-button>
            <p class="form-tip">提交后需等待管理员审批</p>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 付费方式选择弹窗 -->
    <van-action-sheet
      v-model:show="showPaymentOptions"
      title="选择支付方式"
      :actions="paymentActions"
      @select="onPaymentSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { 
  getUserInfo, 
  getConfig, 
  getUpgradeInfo,
  applyScpByInviteCode,
  applyScpByPayment,
  applyTeamCp,
  applyBossCp,
  isLoggedIn
} from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 升级中心')

const router = useRouter()

// 默认头像
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="50"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle">Y</text></svg>'

// 状态
const userInfo = ref({})
const config = ref({
  scp_upgrade_fee: 980,
  team_cp_requirement: 9,
  boss_cp_upgrade_fee: 29800,
  wechat_pay_enabled: false
})
const pendingApplication = ref(null)
const showScpOptions = ref(false)
const showInviteForm = ref(false)
const showPaymentOptions = ref(false)
const submitting = ref(false)
const currentUpgradeType = ref('') // 'scp' or 'boss_cp'

const inviteForm = ref({
  invite_code: '',
  real_name: '',
  phone: ''
})

// 计算属性
const roleDesc = computed(() => {
  switch (userInfo.value.role) {
    case 'scp': return '您是CP伙伴，可以邀请好友加入'
    case 'team_cp': return '您是VIPCP伙伴，享有最高权益'
    case 'boss_cp': return '您是BossCP，享有顶级投资权益'
    default: return '升级后可获得更多权益'
  }
})

const meetsRequirement = computed(() => {
  return (userInfo.value.direct_scp_count || 0) >= config.value.team_cp_requirement
})

const progressPercent = computed(() => {
  const current = userInfo.value.direct_scp_count || 0
  const target = config.value.team_cp_requirement || 9
  return Math.min(100, Math.round((current / target) * 100))
})

const progressText = computed(() => {
  return `${userInfo.value.direct_scp_count || 0}/${config.value.team_cp_requirement}`
})

const canUpgradeToBoss = computed(() => {
    // 任何非BossCP都可以升级
    return userInfo.value.role !== 'boss_cp'
})

const scpUpgradeActions = [
  { name: '通过邀请码升级', subname: '需要邀请人的邀请码，审批通过后生效', value: 'invite_code' },
  { name: '直接付费升级', subname: `支付¥${config.value.scp_upgrade_fee}，无需审批`, value: 'direct_pay' }
]

const paymentActions = computed(() => {
  const actions = [
    { name: '线下支付', subname: '联系工作人员完成支付', value: 'offline' }
  ]
  if (config.value.wechat_pay_enabled) {
    actions.unshift({ name: '微信支付', subname: '在线支付，即时到账', value: 'wechat' })
  }
  return actions
})

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/ytb/login')
    return
  }

  await Promise.all([loadConfig(), loadUpgradeInfo()])
})

// 加载配置
const loadConfig = async () => {
  try {
    const res = await getConfig()
    if (res.code === 0) {
      config.value = res.data
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

// 加载升级信息
const loadUpgradeInfo = async () => {
  try {
    // 同时获取用户信息和升级信息
    const [userRes, upgradeRes] = await Promise.all([
      getUserInfo(),
      getUpgradeInfo()
    ])
    
    if (userRes.code === 0) {
      userInfo.value = {
        ...userInfo.value,
        avatar: userRes.data.avatar,
        nickname: userRes.data.nickname,
      }
    }
    
    if (upgradeRes.code === 0) {
      userInfo.value = {
        ...userInfo.value,
        role: upgradeRes.data.current_role,
        role_name: upgradeRes.data.current_role_name,
        direct_scp_count: upgradeRes.data.direct_scp_count
      }
      pendingApplication.value = upgradeRes.data.pending_application
    }
  } catch (error) {
    console.error('获取升级信息失败:', error)
  }
}

// 显示CP伙伴升级选项
const showScpUpgradeOptions = () => {
  if (pendingApplication.value) {
    showToast('您有待处理的升级申请')
    return
  }
  showScpOptions.value = true
}

// 显示BossCP升级选项
const showBossUpgradeOptions = () => {
    if (pendingApplication.value) {
        showToast('您有待处理的升级申请')
        return
    }
    currentUpgradeType.value = 'boss_cp'
    showPaymentOptions.value = true
}


// CP伙伴升级选项选择
const onScpOptionSelect = (action) => {
  if (action.value === 'invite_code') {
    showInviteForm.value = true
  } else {
    currentUpgradeType.value = 'scp'
    showPaymentOptions.value = true
  }
}

// 提交邀请码升级
const submitInviteCodeUpgrade = async () => {
  submitting.value = true
  try {
    const res = await applyScpByInviteCode(inviteForm.value)
    if (res.code === 0) {
      showSuccessToast('申请已提交')
      showInviteForm.value = false
      await loadUpgradeInfo()
    } else {
      showToast(res.message || '申请失败')
    }
  } catch (error) {
    showToast('网络错误')
  } finally {
    submitting.value = false
  }
}

// VIPCP升级（仅业绩达标可申请）
const applyTeamCpUpgrade = async () => {
  if (pendingApplication.value) {
    showToast('您有待处理的升级申请')
    return
  }
  
  if (!meetsRequirement.value) {
    showToast(`还需直推${config.value.team_cp_requirement - (userInfo.value.direct_scp_count || 0)}个CP伙伴`)
    return
  }

  try {
    const res = await applyTeamCp()
    if (res.code === 0) {
      showDialog({
        title: '申请已提交',
        message: '您的VIPCP伙伴升级申请已提交，请等待管理员审批。',
        confirmButtonText: '我知道了'
      })
      await loadUpgradeInfo()
    } else {
      showToast(res.message || '申请失败')
    }
  } catch (error) {
    showToast('网络错误')
  }
}

// 支付方式选择（仅用于CP伙伴升级）
const onPaymentSelect = async (action) => {
  if (action.value === 'wechat' && !config.value.wechat_pay_enabled) {
    showDialog({
      title: '提示',
      message: '微信支付开通中，请通过亿拓宝联盟工作人员付费升级',
      confirmButtonText: '我知道了'
    })
    return
  }

  try {
    let res
    if (currentUpgradeType.value === 'scp') {
        res = await applyScpByPayment(action.value)
    } else if (currentUpgradeType.value === 'boss_cp') {
        res = await applyBossCp(action.value)
    } else {
        return
    }

    if (res.code === 0) {
      if (action.value === 'offline') {
        showDialog({
          title: '申请已提交',
          message: '请联系亿拓宝联盟工作人员完成线下支付，支付确认后将为您升级。',
          confirmButtonText: '我知道了'
        })
      } else if (res.data.pay_params) {
        // TODO: 调起微信支付
      }
      await loadUpgradeInfo()
    } else {
      showToast(res.message || '申请失败')
    }
  } catch (error) {
    showToast('网络错误')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'warning'
  }
}

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-upgrade {
  min-height: 100vh;
  background: #f5f5f5;
}

.current-role {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.role-info {
  color: white;
}

.role-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 6px;
}

.role-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 6px;
}

.role-tag.scp {
  background: rgba(255, 193, 7, 0.3);
}

.role-tag.team_cp {
  background: rgba(255, 87, 34, 0.3);
}

.role-desc {
  font-size: 12px;
  opacity: 0.9;
}

.upgrade-options {
  padding: 16px;
}

.upgrade-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.card-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.card-body {
  padding: 20px;
}

.requirement {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.requirement-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.requirement-progress {
  margin-bottom: 12px;
  font-size: 14px;
}

.requirement-progress .count {
  color: #667eea;
  font-weight: bold;
}

.requirement-progress .target {
  color: #999;
}

.benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.card-footer {
  padding: 20px;
  border-top: 1px solid #f5f5f5;
}

.card-footer .tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.max-level {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.max-level h3 {
  margin: 20px 0 8px;
  color: #333;
}

.max-level p {
  color: #999;
  font-size: 14px;
}

.pending-section {
  margin-top: 16px;
}

.invite-form {
  padding: 20px;
}

.invite-form h3 {
  text-align: center;
  margin: 0 0 20px;
}

.form-footer {
  padding: 20px;
}

.form-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 12px;
}
</style>
