<template>
  <div class="vip-container">
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="vip-card">
        <div class="vip-header">
          <div class="avatar-wrapper">
            <VanImage
              round
              width="60"
              height="60"
              :src="vipInfo.avatar || vipTimeInfo.avatar || '/app/images/profile/default-avatar.png'"
              :error-content="'头像'"
            />
            <div class="vip-badge">VIP</div>
          </div>
          <div class="vip-info">
            <div class="vip-name">{{ vipInfo.name || vipTimeInfo.name || '尊贵会员' }}</div>
            <div class="vip-date">我的推荐人: {{ vipTimeInfo.referrer_id ? `${vipTimeInfo.referrer_id} ${vipTimeInfo.referrer_name || ''}` : '分支机构' }}</div>
            <div class="vip-date">有效期: 永久</div>
          </div>
          <div class="vip-actions">
            <VanButton 
              type="primary" 
              size="small" 
              round
              @click="goToRecruit"
              class="recruit-btn"
            >
              招募VIP
            </VanButton>
          </div>
        </div>
      </div>

      <!-- 平台分红卡片 -->
      <div class="dividend-overview-card">
        <div class="card-title">
          <span>平台分红</span>
          <div class="card-more" @click="$router.push('/branch/vip/dividend')">
            <span>查看明细</span>
            <Icon name="arrow" />
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'current',
              loading: isMonthSwitching && selectedMonth === 'current'
            }"
            @click="switchMonth('current')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'current'" class="loading-icon">
              <Icon name="loading" />
            </span>
            本月
          </div>
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'last',
              loading: isMonthSwitching && selectedMonth === 'last'
            }"
            @click="switchMonth('last')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'last'" class="loading-icon">
              <Icon name="loading" />
            </span>
            上月
          </div>
        </div>

        <div class="dividend-amounts" :class="{ 'loading-state': loadingStates.pool || loadingStates.dividend }">
          <template v-if="!loadingStates.pool && !loadingStates.dividend">
            <div class="amount-section">
              <div class="amount-label">{{ selectedMonth === 'current' ? '本' : '上' }}月总奖励池</div>
              <div class="amount-value total-amount">
                {{ ((poolInfo.vipCount * dividendConfig.vip_pool_amount * 3) + (poolInfo.rechargeCount * dividendConfig.recharge_pool_amount * 3)).toFixed(2) }}元
              </div>
              <div class="amount-detail">
                <div class="detail-item">
                  <span>VIP分红池</span>
                  <span class="highlight">{{ (poolInfo.vipCount * dividendConfig.vip_pool_amount * 3).toFixed(2) }}元</span>
                </div>
                <div class="detail-item">
                  <span>充值分红池</span>
                  <span class="highlight">{{ (poolInfo.rechargeCount * dividendConfig.recharge_pool_amount * 3).toFixed(2) }}元</span>
                </div>
                <div class="detail-item">
                  <span>{{ selectedMonth === 'current' ? '本' : '上' }}月完款VIP</span>
                  <span>{{ poolInfo.vipCount || 0 }}人</span>
                </div>
                <div class="detail-item">
                  <span>{{ selectedMonth === 'current' ? '本' : '上' }}月充值设备</span>
                  <span>{{ poolInfo.rechargeCount || 0 }}台</span>
                </div>
              </div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="amount-section skeleton">
              <div class="skeleton-amount-label"></div>
              <div class="skeleton-amount-value"></div>
              <div class="amount-detail">
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 团队信息卡片 -->
      <div class="team-card">
        <div class="card-title">
          <span>我的团队</span>
          <div class="card-actions">
            <div class="card-action" @click="$router.push('/branch/vip/recruit-ranking')">
              <span>招募排行</span>
            </div>
            <div class="card-action" @click="$router.push('/branch/vip/team-devices')">
              <span>销售设备</span>
            </div>
            <div class="card-more" @click="$router.push('/branch/vip/team')">
              <span>查看详情</span>
              <Icon name="arrow" />
            </div>
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'current',
              loading: isMonthSwitching && selectedMonth === 'current'
            }"
            @click="switchMonth('current')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'current'" class="loading-icon">
              <Icon name="loading" />
            </span>
            本月
          </div>
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'last',
              loading: isMonthSwitching && selectedMonth === 'last'
            }"
            @click="switchMonth('last')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'last'" class="loading-icon">
              <Icon name="loading" />
            </span>
            上月
          </div>
        </div>

        <!-- 团队统计数据 -->
        <div class="team-stats" :class="{ 'loading-state': loadingStates.team }">
          <template v-if="!loadingStates.team">
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.totalVipCount || 0 }}</div>
              <div class="stats-label">团队总VIP</div>
              <div class="stats-tip">(含自己)</div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.monthDirectVipCount || 0 }}</div>
              <div class="stats-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推VIP</div>
              <div class="stats-tip">(一级)</div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.monthVipCount || 0 }}</div>
              <div class="stats-label">{{ selectedMonth === 'current' ? '本' : '上' }}月新增</div>
              <div class="stats-tip">(团队)</div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
          </template>
        </div>

        <div class="team-detail" :class="{ 'loading-state': loadingStates.team }">
          <template v-if="!loadingStates.team">
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月团队充值台数</div>
              <div class="detail-value highlight">{{ teamInfo.monthRechargeCount || 0 }}台</div>
            </div>
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推充值台数</div>
              <div class="detail-value">{{ teamInfo.monthDirectRechargeCount || 0 }}台</div>
            </div>
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推VIP</div>
              <div class="detail-value">{{ teamInfo.monthDirectVipCount || 0 }}人</div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 统一的分红资格卡片 -->
      <div class="qualification-card">
        <div class="card-title">
          <span>达标与预估</span>
          <div class="status-badge" :class="{'qualified': hasAnyQualifications}">
            {{ hasAnyQualifications ? '已达标' : '未达标' }}
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ active: selectedMonth === 'current' }"
            @click="switchMonth('current')"
          >
            本月
          </div>
          <div
            class="month-option"
            :class="{ active: selectedMonth === 'last' }"
            @click="switchMonth('last')"
          >
            上月
          </div>
        </div>

        <div class="qualification-content">
          <!-- VIP招募分红资格 -->
          <div class="qualification-section">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon vip-icon"></div>
                <span>VIP招募分红</span>
              </div>
              <div class="expected-amount">
                预估: <span class="amount-text">{{ getVipTotalDividend() }}元</span>
              </div>
            </div>

            <div class="level-progress">
              <div class="level-row" :class="{'active': vipQualifications?.value?.junior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.junior}"></div>
                  <div class="level-name">初级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.junior}">
                    {{ vipQualifications?.value?.junior ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.junior">
                    +{{ getVipExpectedAmount('junior') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / dividendConfig.vip_junior_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/{{ dividendConfig.vip_junior_requirement }}人</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="level-row" :class="{'active': vipQualifications?.value?.middle}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.middle}"></div>
                  <div class="level-name">中级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.middle}">
                    {{ vipQualifications?.value?.middle ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.middle">
                    +{{ getVipExpectedAmount('middle') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / dividendConfig.vip_middle_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/{{ dividendConfig.vip_middle_requirement }}人</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="level-row" :class="{'active': vipQualifications?.value?.senior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.senior}"></div>
                  <div class="level-name">高级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.senior}">
                    {{ vipQualifications?.value?.senior ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.senior">
                    +{{ getVipExpectedAmount('senior') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / dividendConfig.vip_senior_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/{{ dividendConfig.vip_senior_requirement }}人，直推{{ teamInfo.monthDirectVipCount || 0 }}人</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="qualification-divider"></div>

          <!-- 充值分红资格 -->
          <div class="qualification-section">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon recharge-icon"></div>
                <span>充值激励分红</span>
              </div>
              <div class="expected-amount">
                预估: <span class="amount-text">{{ getRechargeTotalDividend() }}元</span>
              </div>
            </div>

            <div class="level-progress">
              <div class="level-row" :class="{'active': rechargeQualifications?.value?.junior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.junior}"></div>
                  <div class="level-name">初级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.junior}">
                    {{ rechargeQualifications?.value?.junior ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.junior">
                    +{{ getRechargeExpectedAmount('junior') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / dividendConfig.recharge_junior_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/{{ dividendConfig.recharge_junior_requirement }}台</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="level-row" :class="{'active': rechargeQualifications?.value?.middle}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.middle}"></div>
                  <div class="level-name">中级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.middle}">
                    {{ rechargeQualifications?.value?.middle ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.middle">
                    +{{ getRechargeExpectedAmount('middle') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / dividendConfig.recharge_middle_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/{{ dividendConfig.recharge_middle_requirement }}台</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="level-row" :class="{'active': rechargeQualifications?.value?.senior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.senior}"></div>
                  <div class="level-name">高级分红</div>
                </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.senior}">
                    {{ rechargeQualifications?.value?.senior ? '已达标' : '未达标' }}
                  </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.senior">
                    +{{ getRechargeExpectedAmount('senior') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / dividendConfig.recharge_senior_requirement * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/{{ dividendConfig.recharge_senior_requirement }}台，直推{{ teamInfo.monthDirectRechargeCount || 0 }}台</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷功能 -->
      <div class="quick-actions">
        <div class="action-row">
          <div class="action-item" @click="$router.push('/branch/vip/vip-list')">
            <div class="action-icon">
              <Icon name="contact" />
            </div>
            <div class="action-text">VIP列表</div>
          </div>
          <div class="action-item" @click="$router.push('/branch/vip/dividend-history')">
            <div class="action-icon">
              <Icon name="gold-coin" />
            </div>
            <div class="action-text">分红历史</div>
          </div>
          <div class="action-item" @click="$router.push('/branch/vip/dividend-ranking')">
            <div class="action-icon">
              <Icon name="medal" />
            </div>
            <div class="action-text">分红排行</div>
          </div>
          <div class="action-item" @click="$router.push('/branch/vip/reward-list')">
            <div class="action-icon">
              <Icon name="gift" />
            </div>
            <div class="action-text">奖励记录</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { Image as VanImage, Icon, Button } from 'vant'
import { useRouter } from 'vue-router'
import { 
  getBranchVipWorkspace,
  getBranchVipTimeInfo
} from '@/api/branchVip'
import { showToast } from 'vant'

const router = useRouter()

// 响应式数据
const selectedMonth = ref('current')
const isMonthSwitching = ref(false)

// 数据状态
const vipInfo = ref({})
const vipTimeInfo = ref({})
const poolInfo = ref({})
const teamInfo = ref({})

// 分红资格状态
const vipQualifications = ref({ value: { junior: false, middle: false, senior: false } })
const rechargeQualifications = ref({ value: { junior: false, middle: false, senior: false } })

// 分红配置数据（从API获取，如果没有则使用默认值）
const dividendConfig = ref({
  vip_junior_requirement: 3,
  vip_middle_requirement: 10,
  vip_senior_requirement: 30,
  vip_pool_amount: 300,
  recharge_junior_requirement: 10,
  recharge_middle_requirement: 30,
  recharge_senior_requirement: 80,
  recharge_pool_amount: 15
})

// 加载状态
const loadingStates = reactive({
  pool: false,
  dividend: false,
  team: false
})

// 计算属性
const hasAnyQualifications = computed(() => {
  const vip = vipQualifications.value?.value || {}
  const recharge = rechargeQualifications.value?.value || {}
  return vip.junior || vip.middle || vip.senior || recharge.junior || recharge.middle || recharge.senior
})

// 获取VIP分红预估总额
const getVipTotalDividend = () => {
  const vip = vipQualifications.value?.value || {}
  let total = 0
  if (vip.junior) total += parseFloat(getVipExpectedAmount('junior'))
  if (vip.middle) total += parseFloat(getVipExpectedAmount('middle'))
  if (vip.senior) total += parseFloat(getVipExpectedAmount('senior'))
  return total.toFixed(2)
}

// 获取充值分红预估总额
const getRechargeTotalDividend = () => {
  const recharge = rechargeQualifications.value?.value || {}
  let total = 0
  if (recharge.junior) total += parseFloat(getRechargeExpectedAmount('junior'))
  if (recharge.middle) total += parseFloat(getRechargeExpectedAmount('middle'))
  if (recharge.senior) total += parseFloat(getRechargeExpectedAmount('senior'))
  return total.toFixed(2)
}

// 获取VIP分红预估金额
const getVipExpectedAmount = (level) => {
  const vipCount = poolInfo.value.vipCount || 0
  // 修正：每个等级独立分配，每个VIP贡献分红配置中的金额给每个等级
  const levelAmount = vipCount * dividendConfig.value.vip_pool_amount
  
  // 根据等级和达标人数计算预期金额
  switch (level) {
    case 'junior':
      // 初级分红：按达标人数平均分配
      const juniorCount = poolInfo.value.juniorVipTeams || 0
      return juniorCount > 0 ? (levelAmount / juniorCount).toFixed(2) : '0.00'
      
    case 'middle':
      // 中级分红：按达标人数平均分配
      const middleCount = poolInfo.value.middleVipTeams || 0
      return middleCount > 0 ? (levelAmount / middleCount).toFixed(2) : '0.00'
      
    case 'senior':
      // 高级分红：按直推占比分配
      if (vipQualifications.value?.value?.senior && teamInfo.value.directVipCount > 0) {
        const seniorCount = poolInfo.value.seniorVipTeams || 0
        const totalDirectCount = poolInfo.value.totalSeniorDirectVips || 1 // 防止除以0

        // 只有在达标且有直推的情况下才能获得高级分红
        if (seniorCount > 0 && totalDirectCount > 0) {
          // 使用直推人数计算占比
          const directRatio = teamInfo.value.directVipCount / totalDirectCount
          // 确保计算金额不超过奖金池总额
          const calculatedAmount = Math.min(levelAmount * directRatio, levelAmount);
          return calculatedAmount.toFixed(2);
        }
      }

      // 如果只有一个人达标高级分红，则获得全部高级分红池金额
      const seniorCount = poolInfo.value.seniorVipTeams || 0
      if (seniorCount === 1 && vipQualifications.value?.value?.senior) {
        return levelAmount.toFixed(2);
      }

      return '0.00'
    default:
      return '0.00'
  }
}

// 获取充值分红预估金额
const getRechargeExpectedAmount = (level) => {
  const rechargeCount = poolInfo.value.rechargeCount || 0
  // 修正：每个等级独立分配，每次充值贡献分红配置中的金额给每个等级
  const levelAmount = rechargeCount * dividendConfig.value.recharge_pool_amount
  
  // 根据等级和达标人数计算预期金额
  switch (level) {
    case 'junior':
      // 初级分红：按达标人数平均分配
      const juniorCount = poolInfo.value.juniorRechargeTeams || 0
      return juniorCount > 0 ? (levelAmount / juniorCount).toFixed(2) : '0.00'
      
    case 'middle':
      // 中级分红：按达标人数平均分配
      const middleCount = poolInfo.value.middleRechargeTeams || 0
      return middleCount > 0 ? (levelAmount / middleCount).toFixed(2) : '0.00'
      
    case 'senior':
      // 高级分红：按直推占比分配
      if (rechargeQualifications.value?.value?.senior && teamInfo.value.directRechargeCount > 0) {
        const seniorCount = poolInfo.value.seniorRechargeTeams || 0
        const totalDirectCount = poolInfo.value.totalSeniorDirectRecharges || 1 // 防止除以0

        // 只有在达标且有直推的情况下才能获得高级分红
        if (seniorCount > 0 && totalDirectCount > 0) {
          // 使用直推数量计算占比
          const directRatio = teamInfo.value.directRechargeCount / totalDirectCount
          // 确保计算金额不超过奖金池总额
          const calculatedAmount = Math.min(levelAmount * directRatio, levelAmount);
          return calculatedAmount.toFixed(2);
        }
      }

      // 如果只有一个人达标高级分红，则获得全部高级分红池金额
      const seniorCount = poolInfo.value.seniorRechargeTeams || 0
      if (seniorCount === 1 && rechargeQualifications.value?.value?.senior) {
        return levelAmount.toFixed(2);
      }

      return '0.00'
    default:
      return '0.00'
  }
}

// 月份切换
const switchMonth = async (month) => {
  if (isMonthSwitching.value || selectedMonth.value === month) return
  
  isMonthSwitching.value = true
  selectedMonth.value = month
  
  try {
    await loadWorkspaceData()
    await nextTick()
  } catch (error) {
    console.error('切换月份失败:', error)
    showToast('切换月份失败')
  } finally {
    isMonthSwitching.value = false
  }
}

// 加载工作台数据
const loadWorkspaceData = async () => {
  try {
    loadingStates.pool = true
    loadingStates.dividend = true
    loadingStates.team = true

    // 调试信息
    const userId = localStorage.getItem('user_id')
    const branchCode = localStorage.getItem('branch_code')
    console.log('🏢 [VIP中心] 加载工作台数据:', { userId, branchCode })

    const res = await getBranchVipWorkspace({ month: selectedMonth.value })
    
    console.log('🏢 [VIP中心] API响应:', res)
    
    if (res.code === 0) {
      const data = res.data || {}
      vipInfo.value = data.vipInfo || {}
      poolInfo.value = data.poolInfo || {}
      teamInfo.value = data.teamInfo || {}
      
      // 更新分红配置（如果API返回了配置数据）
      if (data.dividendConfig) {
        dividendConfig.value = {
          vip_junior_requirement: data.dividendConfig.vip_junior_requirement || 3,
          vip_middle_requirement: data.dividendConfig.vip_middle_requirement || 10,
          vip_senior_requirement: data.dividendConfig.vip_senior_requirement || 30,
          vip_pool_amount: data.dividendConfig.vip_pool_amount || 300,
          recharge_junior_requirement: data.dividendConfig.recharge_junior_requirement || 10,
          recharge_middle_requirement: data.dividendConfig.recharge_middle_requirement || 30,
          recharge_senior_requirement: data.dividendConfig.recharge_senior_requirement || 80,
          recharge_pool_amount: data.dividendConfig.recharge_pool_amount || 15
        }
        console.log('🏢 [VIP中心] 分红配置已更新:', dividendConfig.value)
      }
      
      console.log('🏢 [VIP中心] 用户VIP信息:', vipInfo.value)
      
      // 计算分红资格
      calculateQualifications()
    } else {
      console.error('获取工作台数据失败:', res.message)
      showToast(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('加载工作台数据失败:', error)
    showToast('网络连接错误')
  } finally {
    loadingStates.pool = false
    loadingStates.dividend = false
    loadingStates.team = false
  }
}

// 加载VIP时间信息
const loadVipTimeInfo = async () => {
  try {
    const res = await getBranchVipTimeInfo()
    if (res.code === 0) {
      vipTimeInfo.value = res.data || {}
    }
  } catch (error) {
    console.error('加载VIP时间信息失败:', error)
  }
}

// 跳转到招募页面（分支机构版本）
const goToRecruit = () => {
  // 分支机构用户跳转到VIP团队页面，在那里可以查看团队信息和推广链接
  router.push('/branch/vip/team')
}

// 计算分红资格（基于分支机构配置的达标条件）
const calculateQualifications = () => {
  const monthVipCount = teamInfo.value.monthVipCount || 0
  const monthDirectVipCount = teamInfo.value.monthDirectVipCount || 0
  const monthRechargeCount = teamInfo.value.monthRechargeCount || 0
  const monthDirectRechargeCount = teamInfo.value.monthDirectRechargeCount || 0

  // VIP招募分红资格（使用分支机构配置的达标条件）
  vipQualifications.value = {
    value: {
      junior: monthVipCount >= dividendConfig.value.vip_junior_requirement,
      middle: monthVipCount >= dividendConfig.value.vip_middle_requirement && monthDirectVipCount > 0,
      senior: monthVipCount >= dividendConfig.value.vip_senior_requirement && monthDirectVipCount > 0
    }
  }

  // 充值分红资格（使用分支机构配置的达标条件）
  rechargeQualifications.value = {
    value: {
      junior: monthRechargeCount >= dividendConfig.value.recharge_junior_requirement,
      middle: monthRechargeCount >= dividendConfig.value.recharge_middle_requirement && monthDirectRechargeCount > 0,
      senior: monthRechargeCount >= dividendConfig.value.recharge_senior_requirement && monthDirectRechargeCount > 0
    }
  }
  
  console.log('🏢 [VIP中心] 分红资格计算完成:', {
    vipQualifications: vipQualifications.value,
    rechargeQualifications: rechargeQualifications.value,
    config: dividendConfig.value,
    teamData: { monthVipCount, monthDirectVipCount, monthRechargeCount, monthDirectRechargeCount }
  })
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadWorkspaceData(),
    loadVipTimeInfo()
  ])
})
</script>

<style scoped>
.vip-container {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 20px;
}

.content {
  padding: 16px;
}

/* 用户信息卡片 */
.vip-card {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
}

.vip-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper {
  position: relative;
}

.vip-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #ffd700;
  color: #333;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid white;
}

.vip-info {
  flex: 1;
}

.vip-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.vip-date {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.vip-actions {
  margin-top: 8px;
}

.recruit-btn {
  background: #ff4a47;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

/* 平台分红卡片 */
.dividend-overview-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.card-more {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

/* 月份选择器 */
.month-selector {
  display: flex;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.month-option.active {
  background: #ff4a47;
  color: white;
}

.month-option:not(.active):hover {
  background: #e0e0e0;
}

.loading-icon {
  display: inline-block;
  margin-right: 4px;
}

/* 分红金额 */
.dividend-amounts {
  transition: opacity 0.3s;
}

.dividend-amounts.loading-state {
  opacity: 0.6;
}

.amount-section {
  text-align: center;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff4a47;
  margin-bottom: 16px;
}

.amount-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.detail-item .highlight {
  color: #ff4a47;
  font-weight: bold;
}

/* 团队信息卡片 */
.team-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.card-action {
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
}

/* 团队统计 */
.team-stats {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  transition: opacity 0.3s;
}

.team-stats.loading-state {
  opacity: 0.6;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.stats-tip {
  font-size: 10px;
  color: #999;
}

.stats-divider {
  width: 1px;
  height: 40px;
  background: #e0e0e0;
  margin: 0 16px;
}

/* 团队详情 */
.team-detail {
  transition: opacity 0.3s;
}

.team-detail.loading-state {
  opacity: 0.6;
}

.team-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.team-detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #666;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.detail-value.highlight {
  color: #ff4a47;
}

/* 分红资格卡片 */
.qualification-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background: #f0f0f0;
  color: #666;
}

.status-badge.qualified {
  background: #e8f5e8;
  color: #4caf50;
}

.qualification-content {
  margin-top: 16px;
}

.qualification-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.section-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.vip-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.recharge-icon {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.expected-amount {
  font-size: 13px;
  color: #666;
}

.amount-text {
  color: #ff4a47;
  font-weight: bold;
}

/* 等级进度 */
.level-progress {
  space-y: 12px;
}

.level-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8f8f8;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.level-row.active {
  background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
  border: 1px solid #4caf50;
}

.level-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s;
}

.level-dot.active {
  background: #4caf50;
}

.level-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.level-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
}

.level-status.qualified {
  background: #e8f5e8;
  color: #4caf50;
}

.level-amount {
  font-size: 13px;
  color: #ff4a47;
  font-weight: bold;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #4caf50, #45a049);
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.qualification-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 20px 0;
}

/* 快捷功能 */
.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  background: #f8f8f8;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.action-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  color: white;
}

.action-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

/* 骨架屏样式 */
.skeleton .skeleton-amount-label,
.skeleton .skeleton-amount-value,
.skeleton .skeleton-detail-label,
.skeleton .skeleton-detail-value,
.skeleton .skeleton-value,
.skeleton .skeleton-label,
.skeleton .skeleton-tip {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-amount-label {
  height: 14px;
  width: 80px;
  margin: 0 auto 8px;
}

.skeleton-amount-value {
  height: 24px;
  width: 120px;
  margin: 0 auto 16px;
}

.skeleton-detail-label {
  height: 13px;
  width: 60px;
}

.skeleton-detail-value {
  height: 13px;
  width: 40px;
}

.skeleton-value {
  height: 20px;
  width: 30px;
  margin: 0 auto 4px;
}

.skeleton-label {
  height: 12px;
  width: 50px;
  margin: 0 auto 2px;
}

.skeleton-tip {
  height: 10px;
  width: 40px;
  margin: 0 auto;
}

.skeleton .skeleton-label,
.skeleton .skeleton-value {
  height: 14px;
  width: 80px;
  margin-bottom: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style> 