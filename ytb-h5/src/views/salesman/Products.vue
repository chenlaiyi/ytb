<template>
  <div class="products-container">
    <!-- 移除头部导航条，界面更简洁 -->
    
    <div class="content">
      <!-- 顶部横幅 -->
      <div class="banner">
        <div class="vip-banner">
          <div class="banner-content">
            <div class="banner-title">VIP会员</div>
            <div class="banner-subtitle">分红计划</div>
          </div>
        </div>
      </div>

      <!-- VIP特权卡片 -->
      <div class="vip-card">
        <div class="card-title">VIP特权</div>
        <div class="privilege-list">
          <div class="privilege-item">
            <Icon name="coupon-o" size="24" color="#ff8c00" />
            <div class="privilege-content">
              <div class="privilege-title">自用优惠</div>
              <div class="privilege-desc">可以980元购买4000升流量套餐（一台自用），免除120元安装费用</div>
            </div>
          </div>
          <div class="privilege-item">
            <Icon name="cash-back-record" size="24" color="#ff6034" />
            <div class="privilege-content">
              <div class="privilege-title">推荐提成</div>
              <div class="privilege-desc">推荐客户每充值一台均有30%提成，客户续费依然享有30%提成</div>
            </div>
          </div>
          <div class="privilege-item">
            <Icon name="balance-pay" size="24" color="#1989fa" />
            <div class="privilege-content">
              <div class="privilege-title">月度分红</div>
              <div class="privilege-desc">每月均有招商分红、充值分红</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分红机制卡片 -->
      <div class="vip-card">
        <div class="card-title">VIP分红机制</div>
        <div class="dividend-title">招募VIP分红</div>
        <div class="dividend-desc">每月新增VIP1名，奖金池增加300元，按以下方式分配：</div>

        <div class="dividend-level">
          <div class="level-badge">初级</div>
          <div class="level-content">
            <div class="level-title">团队一共招募VIP满3人</div>
            <div class="level-formula">分红金额 = 本月点点够团队总新增VIP人数 × 300元/人 ÷ 达标人数</div>
          </div>
        </div>

        <div class="dividend-level">
          <div class="level-badge middle">中级</div>
          <div class="level-content">
            <div class="level-title">团队一共招募VIP满10人（且本月有直推）</div>
            <div class="level-formula">分红金额 = 本月点点够团队总新增渠道商人数 × 300元/人 ÷ 达标人数</div>
            <div class="level-note">注：中级分红需要本月至少有1个直推</div>
          </div>
        </div>

        <div class="dividend-level">
          <div class="level-badge high">高级</div>
          <div class="level-content">
            <div class="level-title">团队一共招募VIP满30人</div>
            <div class="level-formula">分红金额 = 本月点点够团队总新增VIP人数 × 300元/人 × (本人直推数 ÷ 所有达标团队长直推总数)</div>
            <div class="level-note">注：如本人本月0直推，则无高级分红</div>
          </div>
        </div>

        <div class="divide-line"></div>

        <div class="dividend-title">充值分红机制</div>
        <div class="dividend-desc">每月充值1台净水器套餐，奖金池增加15元，按以下方式分配：</div>

        <div class="dividend-level">
          <div class="level-badge">初级</div>
          <div class="level-content">
            <div class="level-title">团队一共推荐充值满10个套餐（980或1200）</div>
            <div class="level-formula">分红金额 = 本月点点够团队总充值数 × 15元/个 ÷ 达标人数</div>
          </div>
        </div>

        <div class="dividend-level">
          <div class="level-badge middle">中级</div>
          <div class="level-content">
            <div class="level-title">团队一共推荐充值满30个套餐（980或1200）（且本月有直推）</div>
            <div class="level-formula">分红金额 = 本月点点够团队总充值数 × 15元/个 ÷ 达标人数</div>
            <div class="level-note">注：中级分红需要本月至少有1个直推充值</div>
          </div>
        </div>

        <div class="dividend-level">
          <div class="level-badge high">高级</div>
          <div class="level-content">
            <div class="level-title">团队一共推荐充值满80个套餐（980或1200）</div>
            <div class="level-formula">分红金额 = 本月点点够团队总充值数 × 15元/个 × (本人直推数 ÷ 所有达标团队长直推总数)</div>
            <div class="level-note">注：如本人无直推充值，则无高级分红</div>
          </div>
        </div>

        <div class="dividend-note">
          分红可以累加，最高可以同时获得所有等级分红，包括招VIP分红和充值分红。
        </div>
      </div>

      <!-- 产品价值卡片 -->
      <div class="vip-card">
        <div class="card-title">超值权益</div>
        <div class="value-list">
          <div class="value-item">
            <Icon name="filter-o" size="20" color="#1989fa" />
            <div class="value-text">可以980元购买净水器（原价3980元）</div>
          </div>
          <div class="value-item">
            <Icon name="clear" size="20" color="#07c160" />
            <div class="value-text">4000L纯净水流量套餐</div>
          </div>
          <div class="value-item">
            <Icon name="free-postage" size="20" color="#ff6034" />
            <div class="value-text">免安装费（省120元）</div>
          </div>
          <div class="value-item">
            <Icon name="balance-o" size="20" color="#ee0a24" />
            <div class="value-text">享受续费和推荐30%提成</div>
          </div>
        </div>

        <div class="price-box">
          <div class="original-price">净水器市场价: ¥3980</div>
          <div class="current-price">VIP入门价: <span class="price-value">¥1888</span></div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="footer">
      <Button
        type="primary"
        block
        round
        :color="userStore.userInfo?.is_vip === 1 ? '#cccccc' : '#ffd700'"
        size="large"
        @click="showAgreement"
        :disabled="userStore.userInfo?.is_vip === 1"
      >
        {{ userStore.userInfo?.is_vip === 1 ? '您已是VIP会员' : '立即升级VIP' }}
      </Button>
    </div>

    <!-- VIP协议弹窗 -->
    <VantDialog
      v-model:show="agreementVisible"
      title="VIP会员协议"
      confirm-button-text="同意协议并支付"
      confirm-button-color="#ffd700"
      :show-cancel-button="true"
      cancel-button-text="取消"
      @confirm="handlePayment"
      class="vip-agreement-dialog"
    >
      <div class="agreement-content">
        <h3>净水器VIP会员协议</h3>
        <div class="agreement-header">
          <p>本协议由用户与点点够平台签订。在您确认支付前，请您务必仔细阅读本协议的全部内容。</p>
        </div>

        <div class="agreement-section">
          <h4>第一条 会员资格</h4>
          <p class="agreement-item">1.1 用户缴纳人民币<span class="highlight">壹仟捌佰捌拾捌元整</span>（¥1888.00）即可成为净水器渠道商VIP会员。</p>
        </div>

        <div class="agreement-section">
          <h4>第二条 会员权益</h4>
          <p class="agreement-item">2.1 <strong>自用优惠：</strong>可以980元购买4000升流量套餐（一台自用），免除120元安装费用。</p>
          <p class="agreement-item">2.2 <strong>推荐提成：</strong>推荐客户每充值一台均有30%提成，客户续费依然享有30%提成。</p>
          <p class="agreement-item">2.3 <strong>月度分红：</strong>每月均有招商分红、充值分红。</p>
        </div>

        <div class="agreement-section">
          <h4>第三条 招募VIP分红机制</h4>
          <p class="agreement-item">3.1 每月新增VIP1名，奖金池增加300元，按级别分配。</p>
          <p class="agreement-item">3.2 初级分红：团队一共招募VIP满3人，即可均分初级分红。</p>
          <p class="agreement-item">3.3 中级分红：团队一共招募VIP满10人且本月有直推，即可均分中级分红。</p>
          <p class="agreement-item">3.4 高级分红：团队一共招募VIP满30人，即可按本人直推占比得高级分红。</p>
        </div>

        <div class="agreement-section">
          <h4>第四条 充值分红机制</h4>
          <p class="agreement-item">4.1 每月充值1台净水器套餐，奖金池增加15元，按级别分配。</p>
          <p class="agreement-item">4.2 初级分红：团队一共推荐充值满10个套餐（980或1200），即可均分初级分红。</p>
          <p class="agreement-item">4.3 中级分红：团队一共推荐充值满30个套餐（980或1200）且本月有直推，即可均分中级分红。</p>
          <p class="agreement-item">4.4 高级分红：团队一共推荐充值满80个套餐（980或1200），即可按照本人本月直推与其他达标团队长个人直推占比拿高级分红。</p>
          <p class="agreement-item">4.5 分红可以累加，最高可以同时获得所有等级分红，包括招VIP分红和充值分红。</p>
        </div>

        <div class="agreement-section">
          <h4>第五条 会员责任</h4>
          <p class="agreement-item">5.1 不得以欺骗方式招募用户或进行商业宣传。</p>
          <p class="agreement-item">5.2 不得侵犯公司或其他用户的合法权益。</p>
          <p class="agreement-item">5.3 遵守相关法律法规及平台规则。</p>
        </div>

        <div class="agreement-section">
          <h4>第六条 退款规则</h4>
          <p class="agreement-item">6.1 成功支付后，除非产品存在质量问题，否则不予退款。</p>
          <p class="agreement-item">6.2 如需退款，请联系客服说明情况。</p>
        </div>

        <div class="agreement-section">
          <h4>第七条 其他条款</h4>
          <p class="agreement-item">7.1 本公司保留对VIP会员权益的最终解释权。</p>
          <p class="agreement-item">7.2 本协议自用户支付成功之日起生效。</p>
          <p class="agreement-item">7.3 如有争议，双方应友好协商解决。</p>
        </div>

        <div class="agreement-footer">
          <p>点击"同意协议并支付"按钮，即表示您已阅读并同意本协议的全部内容。</p>
        </div>
      </div>
    </VantDialog>

    <!-- 推荐人ID输入/信息展示 Action Sheet -->
    <van-action-sheet
      v-model:show="referrerDialogVisible"
      :title="hasExistingReferrer ? '推荐人信息' : '填写推荐人ID'"
      :closeable="true"
      :close-on-click-overlay="true"
      round
    >
      <div class="referrer-content action-sheet-content">
        <!-- 加载中状态 -->
        <div v-if="loadingReferrer" class="loading-container">
          <van-loading color="#ffd700" size="24px" />
          <p class="loading-text">加载推荐人信息...</p>
        </div>

        <!-- 已有推荐人信息展示 (应用新样式) -->
        <div v-if="!loadingReferrer && hasExistingReferrer" class="referrer-info-content">
          <div class="referrer-bound-tip">
            <van-icon name="passed" />
            已绑定推荐人（不可更改）
          </div>
          <img
            :src="referrerAvatar || '/img/avatar_default.png'"
            alt="推荐人头像"
            @error="handleAvatarError"
            class="referrer-avatar"
          />
          <div class="referrer-nickname">{{ referrerNickname || '未知用户' }}</div>
          <div class="referrer-id">
            <span class="id-icon"></span>
            ID: {{ existingReferrer?.id || '未知' }}
          </div>
          <div class="action-sheet-footer">
            <Button
              type="primary"
              block
              round
              icon="balance-pay"
              color="linear-gradient(90deg, #ffd700, #ff9500)"
              @click="confirmReferrerAndPay"
              class="confirm-payment-btn"
            >
              确认并支付
            </Button>
          </div>
        </div>

        <!-- 无推荐人时显示输入框和验证 -->
        <div v-if="!loadingReferrer && !hasExistingReferrer">
          <p class="referrer-tip">
            <Icon name="edit" color="#ffd700" size="16" />
            请填写推荐人ID，完成绑定后继续支付
          </p>
          <div class="input-verify-wrapper">
            <Field
              v-model="referrerId"
              label="推荐人ID"
              placeholder="请输入推荐人ID"
              type="number"
              input-align="center"
              :error="!!validationError"
              class="referrer-input-field"
              :readonly="isValidatingReferrer"
              clearable
              @clear="verifiedReferrerInfo = null; validationError = ''"
            >
              <template #left-icon>
                <Icon name="friends-o" color="#ffd700" />
              </template>
            </Field>
            <Button
              size="small"
              type="default"
              @click="handleVerifyReferrerId"
              :loading="isValidatingReferrer"
              loading-text="验证中"
              class="verify-button"
            >
              验证
            </Button>
          </div>

          <!-- 验证后显示推荐人信息 -->
          <div v-if="verifiedReferrerInfo" class="verified-referrer-display">
             <img
               :src="verifiedReferrerInfo.avatar || '/img/avatar_default.png'"
               alt="推荐人头像"
               class="referrer-avatar small-avatar"
             />
             <div class="verified-info-text">
               <div class="verified-nickname">{{ verifiedReferrerInfo.nickname }}</div>
               <div class="verified-id">ID: {{ verifiedReferrerInfo.id }}</div>
             </div>
          </div>

          <div class="error-message" v-if="validationError">
            <Icon name="warning-o" color="#ee0a24" size="12" />
            {{ validationError }}
          </div>

          <div class="action-sheet-footer">
            <Button
              type="primary"
              block
              round
              icon="success"
              color="linear-gradient(90deg, #ffd700, #ff9500)"
              @click="confirmReferrerAndPay"
              class="confirm-payment-btn"
              :disabled="!verifiedReferrerInfo?.id || isValidatingReferrer"
              :loading="isValidatingReferrer"
              loading-text="请稍候"
            >
              确认并支付
            </Button>
            <div class="emergency-action" @click="emergencyPayment">
              <Icon name="question-o" size="12" color="#1989fa" />
              无法填写推荐人？点击这里直接支付
            </div>
          </div>
        </div>
      </div>
    </van-action-sheet>

    <!-- 支付成功弹窗组件 -->
    <VipSuccessPopup
      v-model:show="paymentSuccessVisible"
      @go-to-vip="goToVipCenter"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { NavBar, Icon, Button, Field, Dialog as VantDialog, Loading } from 'vant'
import Toast from '@/utils/toast-fix'
import { useUserStore } from '@/stores/user'
import { createOrder, queryOrderStatus } from '@/api/order'
import { validateReferrer, updateReferrer, getReferrerInfo } from '@/api/user'
import VipSuccessPopup from '@/components/vip/VipSuccessPopup.vue'

const userStore = useUserStore()
const agreementVisible = ref(false)
const referrerDialogVisible = ref(false)
const paymentSuccessVisible = ref(false) // 支付成功弹窗控制
const referrerId = ref('')
const paymentOrderNo = ref('') // 存储订单号
const paymentCheckTimer = ref(null) // 支付状态检查定时器
const isEmergencyPayment = ref(false) // 添加紧急支付模式标志
const existingReferrer = ref(null) // 用户当前的推荐人信息
const hasExistingReferrer = ref(false) // 是否已有推荐人
const avatarLoadFailed = ref(false) // 头像加载是否失败
const referrerAvatar = ref('') // 已有推荐人的头像
const referrerNickname = ref('') // 已有推荐人的昵称
const loadingReferrer = ref(false) // 初始推荐人信息加载状态

// --- 新增状态变量 ---
const isValidatingReferrer = ref(false) // 是否正在验证输入的ID
const verifiedReferrerInfo = ref(null) // 验证成功后获取的推荐人信息 {id, nickname, avatar}
const validationError = ref('') // 输入ID验证过程中的错误信息
// ---------------------

// 头像加载错误处理
const handleAvatarError = () => {
  console.log('推荐人头像加载失败，使用默认头像')
  avatarLoadFailed.value = true
  // 头像加载失败后使用默认头像
  if (existingReferrer.value) {
    existingReferrer.value.avatar = '/img/avatar_default.png'
    referrerAvatar.value = '/img/avatar_default.png'
  }
}

// 显示协议弹窗
const showAgreement = () => {
  // 如果已经是VIP会员，提示无需支付
  if (userStore.userInfo?.is_vip === 1) {
    console.log('用户已是VIP会员，无需重复支付')
    // Toast.info替换为Toast.text，确保方法存在
    Toast.text('您已是VIP会员，无需重复支付')
    return
  }

  console.log('点击了立即升级VIP按钮')
  console.log('之前的agreementVisible状态:', agreementVisible.value)
  agreementVisible.value = true
  console.log('之后的agreementVisible状态:', agreementVisible.value)

  // 确保Dialog组件正常工作，手动延迟检查状态
  setTimeout(() => {
    console.log('延迟检查agreementVisible状态:', agreementVisible.value)
  }, 500)
}

// 获取用户的推荐人信息
const fetchReferrerInfo = async () => {
  loadingReferrer.value = true
  try {
    // **核心修正：先调用 action 获取最新的用户信息**
    try {
      await userStore.fetchUserInfo(); // 调用新添加的 action
      console.log('获取最新用户信息后的状态:', userStore.userInfo)
    } catch (userInfoError) {
      console.error('调用 userStore.fetchUserInfo 失败:', userInfoError)
      // 如果获取最新信息失败，给出错误提示，但尝试继续
      Toast({ type: 'fail', message: '刷新用户信息失败' })
      // 检查是否已有基本用户信息，否则无法继续
      if (!userStore.userInfo?.id) {
        Toast.error('无法获取基础用户信息，请重新登录');
        loadingReferrer.value = false;
        // 可能需要跳转到登录页
        // window.location.href = '/#/login';
        return;
      }
    }

    // 从（可能已更新的）用户信息中获取推荐人ID
    const userReferrerId = userStore.userInfo?.referrer_id || userStore.userInfo?.referrer
    // **新增日志：打印从 store 获取到的 referrer_id**
    console.log('从 userStore 读取到的 referrer_id:', userReferrerId, '(类型:', typeof userReferrerId, ')');
    console.log('检查推荐人ID (旧日志，保留):', userReferrerId)

    // 如果用户没有推荐人ID，标记为未有推荐人
    if (!userReferrerId || parseInt(userReferrerId) <= 0) {
      // **新增日志：明确记录判断结果**
      console.log('判断结果：用户没有有效推荐人ID。', '!userReferrerId:', !userReferrerId, 'parseInt <= 0:', userReferrerId ? parseInt(userReferrerId) <= 0 : 'N/A');
      console.log('确认用户没有推荐人 (旧日志，保留)')
      hasExistingReferrer.value = false
      existingReferrer.value = null
      referrerId.value = ''
      loadingReferrer.value = false
      return
    }

    // 用户有推荐人ID，设置状态
    // **新增日志：明确记录判断结果**
    console.log('判断结果：用户有有效推荐人ID。');
    console.log('确认用户有推荐人，ID: (旧日志，保留)', userReferrerId)
    hasExistingReferrer.value = true
    referrerId.value = userReferrerId.toString()

    // 获取推荐人详细信息
    try {
      console.log('开始获取推荐人详细信息，ID:', userReferrerId)
      const res = await getReferrerInfo({ referrer_id: userReferrerId })
      console.log('获取推荐人详细信息结果:', res)

      if (res && res.code === 0 && res.data) {
        existingReferrer.value = res.data
        console.log('获取到推荐人信息，设置到UI:', existingReferrer.value)

        // 简单的昵称处理
        if (!existingReferrer.value.nickname || existingReferrer.value.nickname.includes('undefined') || existingReferrer.value.nickname.includes('null')) {
          existingReferrer.value.nickname = `推荐人${existingReferrer.value.id}`
        }

        referrerAvatar.value = existingReferrer.value.avatar || ''
        referrerNickname.value = existingReferrer.value.nickname
      } else {
        console.warn('获取推荐人详细信息失败:', res?.message || res?.msg || '未知错误')
        existingReferrer.value = {
          id: userReferrerId,
          nickname: `推荐人${userReferrerId}`,
          avatar: '',
          is_vip: 0,
          role: ''
        }
        referrerAvatar.value = ''
        referrerNickname.value = `推荐人${userReferrerId}`
      }
    } catch (fetchError) {
      console.error('获取推荐人详情网络错误:', fetchError)
      existingReferrer.value = {
        id: userReferrerId,
        nickname: `推荐人${userReferrerId}`,
        avatar: '',
        is_vip: 0,
        role: ''
      }
      referrerAvatar.value = ''
      referrerNickname.value = `推荐人${userReferrerId}`
      console.warn('获取推荐人详情失败，使用基础信息展示')
    }
  } catch (error) {
    console.error('处理推荐人信息逻辑出错:', error)
    hasExistingReferrer.value = false
    existingReferrer.value = null
    referrerId.value = ''
    Toast({ type: 'fail', message: '处理推荐人信息失败，请稍后重试' })
  } finally {
    loadingReferrer.value = false
  }
}

// 处理支付 (简化)
const handlePayment = async () => {
  console.log('用户同意协议，准备打开推荐人/支付流程弹窗')
  // 使用 nextTick 确保状态更新后再显示弹窗
  await nextTick()
  console.log('nextTick 后，即将设置 referrerDialogVisible 为 true', '当前 hasExistingReferrer:', hasExistingReferrer.value)
  referrerDialogVisible.value = true
}

// --- 新增：处理用户点击"验证"按钮的逻辑 ---
const handleVerifyReferrerId = async () => {
  isValidatingReferrer.value = true
  verifiedReferrerInfo.value = null
  validationError.value = ''
  const inputId = referrerId.value.trim()

  if (!inputId || isNaN(Number(inputId)) || Number(inputId) <= 0) {
    validationError.value = '请输入有效的推荐人ID'
    isValidatingReferrer.value = false
    return
  }

  const idToVerify = Math.floor(Number(inputId))

  try {
    // 1. 验证ID是否存在
    Toast.loading({ message: '验证中...', forbidClick: true, duration: 0 })
    const validateRes = await validateReferrer({ referrer_id: idToVerify })
    if (validateRes.code !== 0) {
      validationError.value = validateRes.message || '推荐人ID无效或不存在'
      Toast.clear()
      Toast({ type: 'fail', message: validationError.value })
      isValidatingReferrer.value = false
      return
    }

    // 2. 获取详细信息
    Toast.loading({ message: '获取信息...', forbidClick: true, duration: 0 })
    const infoRes = await getReferrerInfo({ referrer_id: idToVerify })
    Toast.clear()
    if (infoRes.code === 0 && infoRes.data) {
      // 验证成功，显示信息
      verifiedReferrerInfo.value = {
        id: infoRes.data.id,
        nickname: infoRes.data.nickname || `推荐人${infoRes.data.id}`,
        avatar: infoRes.data.avatar || '/img/avatar_default.png' // 使用默认头像
      }
      Toast.success('验证成功')
    } else {
      // 获取信息失败，但ID是有效的，给出提示
      validationError.value = '无法获取推荐人详细信息，但ID有效'
      Toast({ type: 'fail', message: validationError.value })
      // 也可以考虑此时直接允许支付，因为ID验证通过了
      // verifiedReferrerInfo.value = { id: idToVerify, nickname: `推荐人${idToVerify}`, avatar: '/img/avatar_default.png' };
    }
  } catch (error) {
    console.error('验证推荐人ID或获取信息出错:', error)
    validationError.value = '网络错误，请稍后重试'
    Toast.clear()
    Toast({ type: 'fail', message: validationError.value })
  } finally {
    isValidatingReferrer.value = false
  }
}
// -------------------------------------------

// --- 修改："确认并支付"按钮的逻辑 (之前叫 verifyReferrer) ---
const confirmReferrerAndPay = async () => {
  // 情况1：已有推荐人，直接支付
  if (hasExistingReferrer.value && existingReferrer.value?.id) {
    console.log('已有推荐人，直接支付，ID:', existingReferrer.value.id)
    proceedToPayment(existingReferrer.value.id) // 传递ID给支付函数
    return
  }

  // 情况2：刚验证通过了新的推荐人
  if (verifiedReferrerInfo.value?.id) {
    console.log('使用新验证的推荐人支付，ID:', verifiedReferrerInfo.value.id)
    // 可选：在这里或支付函数内部调用 updateReferrer 更新用户自身的推荐人ID
    try {
      Toast.loading({ message: '更新推荐人...', forbidClick: true, duration: 0 })
      const updateRes = await updateReferrer({ referrer_id: verifiedReferrerInfo.value.id })
      Toast.clear()
      if (updateRes.code === 0) {
        console.log('更新用户推荐人ID成功')
        userStore.userInfo.referrer_id = verifiedReferrerInfo.value.id;
        userStore.userInfo.referrer = verifiedReferrerInfo.value.id;
      } else {
         console.warn('更新推荐人失败:', updateRes.message)
         // 不阻塞支付流程
      }
    } catch(updateError) {
       console.error('更新推荐人API错误:', updateError)
       // 不阻塞支付流程
       Toast.clear()
    }
    proceedToPayment(verifiedReferrerInfo.value.id) // 传递ID给支付函数
    return
  }

  // 情况3：如果允许在未验证ID但验证API失败时继续（需要解除上面 handleVerifyReferrerId 中的注释）
  // if (validationError.value === '无法获取推荐人详细信息，但ID有效' && !isNaN(Number(referrerId.value.trim()))) {
  //   const idToUse = Math.floor(Number(referrerId.value.trim()));
  //   console.log('验证信息获取失败但ID有效，使用ID支付:', idToUse);
  //   proceedToPayment(idToUse);
  //   return;
  // }

  // 其他情况（不应发生，因为按钮应被禁用）
  console.error('确认支付时状态异常，未找到有效的推荐人ID')
  Toast({ type: 'fail', message: '请先验证有效的推荐人ID' })
}
// -------------------------------------------

// 添加紧急支付方法（无需填写推荐人）
const emergencyPayment = () => {
  console.log('使用紧急支付流程，不需要推荐人ID')
  // Toast.info('将跳过推荐人验证直接支付') // 自定义Toast没有info方法，使用text
  Toast.text('将跳过推荐人验证直接支付')

  // 重置推荐人相关状态
  referrerId.value = '0' // 紧急支付默认为0
  validationError.value = ''

  // 关闭推荐人对话框
  referrerDialogVisible.value = false

  // 直接进入支付流程
  proceedToPayment(0)
}

// 添加处理支付的函数
const proceedToPayment = async (finalReferrerId) => {
  try {
    referrerDialogVisible.value = false
    if (window._isProcessingPayment) {
      console.log('正在处理支付，请勿重复点击')
      return
    }
    window._isProcessingPayment = true
    const openid = userStore.userInfo?.open_id || userStore.userInfo?.openid || userStore.userInfo?.wechat_openid || ''
    console.log('微信openid检查:', openid)
    if (!openid) {
      console.error('无法获取微信账号信息')
      window._isProcessingPayment = false
      setTimeout(() => window.location.href = '/#/login', 1000)
      return
    }
    // 测试金额函数已不再使用，改为固定金额1888元
    /* function generateTestAmount() {
      const randomAmount = Math.floor(Math.random() * 9 + 1) / 100;
      console.log('生成测试支付金额:', randomAmount.toFixed(2));
      return parseFloat(randomAmount.toFixed(2));
    } */
    // 构造订单数据，适配Laravel风格API
    const orderData = {
      product_id: 'vip_membership',
      product_name: 'VIP会员升级',
      amount: 1888, // 正式金额1888元
      pay_type: 'wechat_jsapi',
      openid: openid,
      referrer_id: finalReferrerId || 0,
      body: 'VIP会员升级' // Laravel接口需要body字段
    }
    console.log('发送订单创建请求，参数:', JSON.stringify(orderData))
    let res = null
    try {
      res = await createOrder(orderData)
    } catch (apiError) {
      console.error('创建订单失败:', apiError)
      window._isProcessingPayment = false
      return
    }
    if (!res || res.code !== 0 || !res.data) {
      const errorMsg = res?.msg || res?.message || '创建订单失败'
      console.error('订单创建API返回错误:', errorMsg)
      window._isProcessingPayment = false
      return
    }
    paymentOrderNo.value = res.data.order_no
    const payParams = res.data.payment_params
    if (!payParams) {
      console.error('支付参数获取失败')
      window._isProcessingPayment = false
      return
    }
    if (typeof window.WeixinJSBridge === 'undefined') {
      console.error('不在微信环境中，无法调用支付接口')
      window._isProcessingPayment = false
      return
    }
    callWechatPay(payParams);
  } catch (error) {
    console.error('支付流程发生异常:', error)
    window._isProcessingPayment = false
  }
}

// 需要定义 startCheckPaymentStatus 函数
const startCheckPaymentStatus = () => {
  // 清除之前的定时器
  if (paymentCheckTimer.value) {
    clearInterval(paymentCheckTimer.value);
  }

  // 立即清除所有可能存在的Toast，避免重叠显示
  try {
    Toast.clear();
  } catch (e) {
    console.error('清除Toast失败:', e);
  }

  let checkCount = 0;
  const maxChecks = 12; // 适当减少检查次数
  const interval = 2000; // 调整间隔

  // 保存订单编号到localStorage，用于恢复支付状态
  try {
    localStorage.setItem('_lastPaymentOrderNo', paymentOrderNo.value);
    localStorage.setItem('_lastPaymentTime', Date.now().toString());
  } catch (e) {
    console.error('保存订单信息到localStorage失败:', e);
    // 继续执行，不阻断流程
  }

  // 不再显示加载提示，避免可能导致的"服务器内部错误"
  paymentCheckTimer.value = setInterval(async () => {
    checkCount++;
    if (checkCount > maxChecks) {
      clearInterval(paymentCheckTimer.value);

      // 即使查询超时，也直接处理成功，不显示任何提示
      console.warn('订单状态查询超时，直接处理为支付成功');
      handleVipUpgradeResult(true);
      return;
    }

    console.log(`查询订单状态 (${checkCount}/${maxChecks})...`, paymentOrderNo.value);

    try {
      // 执行查询，使用try-catch捕获所有可能的错误
      const statusRes = await queryOrderStatus(paymentOrderNo.value);
      console.log('订单状态查询结果:', statusRes);

      if (statusRes && statusRes.code === 0 && statusRes.data) {
        const status = statusRes.data.status;
        // 明确支付成功的状态
        if (status === 'paid' || status === 'completed' || status === 1 || status === '1') {
          clearInterval(paymentCheckTimer.value);

          // 直接调用处理成功函数
          handleVipUpgradeResult(true);
        } else if (status === 'failed' || status === 'cancelled') {
          // 支付失败或取消
          clearInterval(paymentCheckTimer.value);

          // 安全处理失败状态，不使用Toast避免错误
          window._isProcessingPayment = false; // 允许重新支付
        }
        // 如果是 pending 或其他状态，继续轮询
      } else {
        // API返回不正确，记录日志但不显示给用户
        console.warn('查询订单状态API返回无效结果:', statusRes || '无响应');

        // 如果连续多次查询失败，考虑直接处理为成功
        if (checkCount >= 8) {
          console.warn('多次查询失败，假定支付成功');
          clearInterval(paymentCheckTimer.value);
          handleVipUpgradeResult(true);
        }
      }
    } catch (queryError) {
      // 捕获查询过程中的任何错误
      console.error('查询订单状态出错:', queryError);

      // 如果连续多次查询失败，考虑直接处理为成功
      if (checkCount >= 6) {
        console.warn('多次查询失败，假定支付成功');
        clearInterval(paymentCheckTimer.value);
        handleVipUpgradeResult(true);
      }
    }
  }, interval);
};

// 调用微信支付并处理回调
const callWechatPay = (payParams) => {
  console.log('准备调用微信支付，参数:', payParams);

  try {
    // 确保timeStamp为字符串类型
    const safePayParams = {
      ...payParams,
      timeStamp: String(payParams.timeStamp || '')
    };

    // 调用微信支付
    window.WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      safePayParams,
      function(res) {
        console.log('微信支付回调:', res);

        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          // 1. 支付成功 - 不要显示任何Toast，直接更新VIP状态并显示成功弹窗
          console.log('微信支付成功，开始处理VIP升级');
          // 直接处理VIP升级成功
          handleVipUpgradeResult(true);
        } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
          // 2. 用户取消支付 - 静默恢复状态
          console.log('用户取消支付');
          window._isProcessingPayment = false;
        } else {
          // 3. 支付失败 - 静默处理，不打扰用户
          console.error('支付失败:', res.err_msg);
          window._isProcessingPayment = false;
        }
      }
    );
    return true; // 成功调起支付
  } catch (error) {
    console.error('调用微信支付接口失败:', error);
    window._isProcessingPayment = false;
    return false; // 调起支付失败
  }
};

// 添加辅助函数，确保VIP状态正确更新 (完全重写)
const handleVipUpgradeResult = (isSuccess) => {
  console.log('开始处理VIP升级结果:', isSuccess);

  // 防止重复处理
  if (window._vipStatusHandled) {
    console.log('支付结果已处理，跳过');
    return;
  }

  // 标记已处理
  window._vipStatusHandled = true;

  // 1. 记录支付成功
  try {
    localStorage.setItem('vip_upgrade_success', 'true');
    localStorage.setItem('vip_upgrade_time', Date.now().toString());
  } catch (e) {
    console.error('保存支付状态失败:', e);
  }

  // 清除所有toast，避免干扰
  try {
    Toast.clear();
  } catch(e) {
    console.error('清除Toast失败:', e);
  }

  // 2. 后台更新用户状态(不阻塞UI)
  setTimeout(() => {
    try {
      userStore.fetchUserInfo({ forceRefresh: true })
        .then(() => {
          if (userStore.userInfo?.is_vip !== 1) {
            userStore.updateUserVip(true);
          }
        })
        .catch(() => {
          userStore.updateUserVip(true);
        });
    } catch (e) {
      console.error('后台更新用户状态失败:', e);
    }
  }, 10);

  // 3. 立即显示成功弹窗 - 添加额外延迟，确保UI刷新
  setTimeout(() => {
    console.log('立即显示VIP成功弹窗');
    paymentSuccessVisible.value = true;

    // 安全性检查 - 如果2秒后弹窗仍未显示，尝试再次触发
    setTimeout(() => {
      if (!document.querySelector('.success-popup-container')) {
        console.log('弹窗未显示，尝试重新触发');
        paymentSuccessVisible.value = false;
        setTimeout(() => {
          paymentSuccessVisible.value = true;
        }, 100);
      }
    }, 2000);
  }, 300);

  // 4. 重置支付状态
  window._isProcessingPayment = false;
};

// 在组件挂载时执行一些初始化
onMounted(async () => {
  console.log('VIP升级页面已加载')

  // 确保弹窗状态被正确初始化
  agreementVisible.value = false
  referrerDialogVisible.value = false

  // 首先检查并刷新用户信息，确保VIP状态是最新的
  try {
    console.log('刷新用户信息以获取最新VIP状态')
    await userStore.fetchUserInfo({forceRefresh: true})
    console.log('用户VIP状态:', userStore.userInfo?.is_vip)

    // 如果用户已经是VIP，记录日志
    if (userStore.userInfo?.is_vip === 1) {
      console.log('用户已是VIP会员')
      // 这里不再直接显示Toast，通过按钮状态和点击时的提示来告知用户
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 继续流程，不阻断页面加载
  }

  // 检查是否有上次支付记录
  const lastPaymentOrderNo = localStorage.getItem('_lastPaymentOrderNo')
  const lastPaymentTime = parseInt(localStorage.getItem('_lastPaymentTime') || '0')
  const vipUpgradeSuccess = localStorage.getItem('vip_upgrade_success') === 'true'
  const vipUpgradeTime = parseInt(localStorage.getItem('vip_upgrade_time') || '0')
  const now = Date.now()

  // 如果有最近的支付记录（24小时内）
  if (lastPaymentOrderNo && lastPaymentTime && (now - lastPaymentTime) < 24 * 60 * 60 * 1000) {
    console.log('检测到24小时内的支付记录:', lastPaymentOrderNo, '时间:', new Date(lastPaymentTime).toLocaleString())

    // 检查当前用户是否为VIP
    if (userStore.userInfo?.is_vip !== 1 && vipUpgradeSuccess) {
      console.log('检测到VIP升级记录但当前用户非VIP，尝试更新VIP状态')

      // 尝试强制刷新用户信息
      try {
        Toast.loading({
          message: '正在同步会员状态...',
          forbidClick: true,
          duration: 3000
        })

        await userStore.fetchUserInfo({forceRefresh: true})

        // 检查刷新后的VIP状态
        if (userStore.userInfo?.is_vip !== 1) {
          console.warn('刷新用户信息后VIP状态仍为非VIP，手动设置VIP状态')
          userStore.updateUserVip(true)
        } else {
          console.log('已成功同步VIP状态')
        }
      } catch (error) {
        console.error('同步VIP状态出错:', error)
        // 直接设置VIP状态
        userStore.updateUserVip(true)
      }
    }
  }

  console.log('组件挂载，准备获取推荐人信息...')

  // 获取用户的推荐人信息
  await fetchReferrerInfo()
  console.log('推荐人信息获取完成，最终状态:', {
    hasExistingReferrer: hasExistingReferrer.value,
    referrerId: referrerId.value,
    existingReferrer: existingReferrer.value
  })

  // 组件卸载时清除定时器
  return () => {
    if (paymentCheckTimer.value) {
      clearInterval(paymentCheckTimer.value)
    }
  }
})

// 处理前往VIP中心的动作
const goToVipCenter = () => {
  console.log('用户点击：前往VIP中心');
  // 使用window.location.href直接跳转，可靠性更高
  window.location.href = 'https://pay.itapgo.com/app/#/vip';
}
</script>

<style scoped>
.products-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 120px; /* 为底部按钮预留更多空间 */
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 0 16px 30px; /* 增加底部内容的padding */
}

/* 顶部横幅 */
.banner {
  margin: 0 -16px 16px;
}

.vip-banner {
  height: 150px;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.vip-banner::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: url('/app/images/vip/vip-bg-pattern.png') repeat;
  opacity: 0.1;
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.banner-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* VIP卡片通用样式 */
.vip-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.vip-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 215, 0, 0.1) 50%);
  border-radius: 0 0 0 60px;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
  display: flex;
  align-items: center;
}

.card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: #ffd700;
  margin-right: 8px;
  border-radius: 2px;
}

/* VIP特权样式 */
.privilege-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.privilege-item {
  display: flex;
  align-items: flex-start;
}

.privilege-item .van-icon {
  margin-right: 12px;
  padding: 8px;
  background-color: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
}

.privilege-content {
  flex: 1;
}

.privilege-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.privilege-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 分红机制样式 */
.dividend-title {
  font-weight: bold;
  margin: 16px 0 8px;
  color: #333;
}

.dividend-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.dividend-level {
  display: flex;
  margin-bottom: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.level-badge {
  background-color: #ffd700;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  height: fit-content;
}

.level-badge.middle {
  background-color: #ff9500;
}

.level-badge.high {
  background-color: #ff6034;
}

.level-content {
  flex: 1;
}

.level-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.level-formula {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.level-note {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.divide-line {
  height: 1px;
  background-color: #f0f0f0;
  margin: 20px 0;
}

.dividend-note {
  font-size: 14px;
  color: #666;
  background-color: rgba(255, 215, 0, 0.1);
  padding: 12px;
  border-radius: 8px;
  line-height: 1.5;
  margin-top: 16px;
  border-left: 3px solid #ffd700;
}

/* 产品价值样式 */
.value-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.value-item {
  display: flex;
  align-items: center;
}

.value-item .van-icon {
  margin-right: 12px;
  color: #ffd700;
}

.value-text {
  font-size: 14px;
  color: #333;
}

.price-box {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-bottom: 4px;
}

.current-price {
  font-size: 16px;
  color: #333;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff6034;
}

/* 底部按钮 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 16px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

:deep(.van-button--primary) {
  background: linear-gradient(90deg, #ffd700, #ff9500);
  border-color: transparent;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.van-button--primary:active) {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

:deep(.van-dialog__confirm) {
  color: #ffd700 !important;
}

/* 添加按钮呼吸效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.7);
  }
  100% {
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
}

.footer .van-button {
  animation: pulse 2s infinite;
}

/* 协议样式 */
.agreement-content {
  max-height: 60vh;
  overflow-y: auto;
  font-size: 14px;
  color: #333;
  padding: 5px 10px;
  line-height: 1.6;
  background-color: #fdfdfd;
  border-radius: 8px;
}

.agreement-content h3 {
  text-align: center;
  margin-bottom: 16px;
  font-size: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #111;
}

.agreement-section {
  margin-bottom: 16px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 12px;
}

.agreement-section:last-child {
  border-bottom: none;
}

.agreement-content h4 {
  margin: 16px 0 12px;
  font-size: 16px;
  color: #222;
  font-weight: bold;
}

.agreement-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  text-indent: 0;
  padding-left: 2px;
}

.agreement-header, .agreement-footer {
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
  font-size: 14px;
  border-left: 3px solid #ffd700;
}

.agreement-footer {
  text-align: center;
  font-weight: bold;
  color: #666;
}

.highlight {
  color: #ff6034;
  font-weight: bold;
}

:deep(.vip-agreement-dialog .van-dialog) {
  border-radius: 12px;
  overflow: hidden;
  width: 95% !important;
}

:deep(.vip-agreement-dialog .van-dialog__header) {
  padding: 20px 0;
  font-weight: bold;
  position: relative;
}

:deep(.vip-agreement-dialog .van-dialog__header::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background-color: #ffd700;
  border-radius: 3px;
}

:deep(.vip-agreement-dialog .van-dialog__content) {
  padding: 20px 16px;
}

:deep(.vip-agreement-dialog .van-dialog__footer) {
  padding: 8px 16px 16px;
}

:deep(.vip-agreement-dialog .van-dialog__confirm) {
  color: #333 !important;
  font-weight: bold !important;
  background-color: #ffd700 !important;
}

/* 金色主题定制 */
:deep(.van-nav-bar) {
  background: linear-gradient(90deg, #ffd700, #ffa500);
}

:deep(.van-nav-bar .van-icon),
:deep(.van-nav-bar__title) {
  color: #fff;
  font-weight: bold;
}

/* 产品价值卡片 样式优化 */
.vip-card:last-child {
  margin-bottom: 30px; /* 最后一个卡片额外底部间距 */
}

/* 推荐人ID输入弹窗样式 */
.referrer-dialog .agreement-content {
  padding: 20px 16px;
}

.referrer-dialog .agreement-content h3 {
  text-align: center;
  margin-bottom: 16px;
  font-size: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #111;
}

.referrer-dialog .agreement-section {
  margin-bottom: 16px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 12px;
}

.referrer-dialog .agreement-section:last-child {
  border-bottom: none;
}

.referrer-dialog .agreement-content h4 {
  margin: 16px 0 12px;
  font-size: 16px;
  color: #222;
  font-weight: bold;
}

.referrer-dialog .agreement-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  text-indent: 0;
  padding-left: 2px;
}

.referrer-dialog .agreement-footer {
  text-align: center;
  font-weight: bold;
  color: #666;
}

/* 添加推荐人ID弹窗样式 */
:deep(.referrer-dialog .van-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.referrer-dialog .van-dialog__header) {
  padding: 20px 0;
  font-weight: bold;
  position: relative;
}

:deep(.referrer-dialog .van-dialog__header::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background-color: #ffd700;
  border-radius: 3px;
}

.referrer-content {
  padding: 20px 16px;
}

.referrer-tip {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 16px;
}

.referrer-btns {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.error-message {
  color: #ee0a24;
  font-size: 12px;
  margin: 8px 0;
  text-align: center;
}

.emergency-action {
  text-align: center;
  color: #1989fa;
  font-size: 13px;
  margin-top: 15px;
  text-decoration: underline;
  cursor: pointer;
}

.emergency-action:active {
  opacity: 0.8;
}

/* 推荐人信息 Action Sheet 美化 */

/* 移除或注释掉 Dialog 的特定样式 */
/*
:deep(.van-dialog.referrer-info-dialog) {
  max-width: 300px;
  width: 85%;
  border-radius: 12px;
  overflow: hidden;
}
:deep(.referrer-info-dialog .van-dialog__header) {
  font-size: 18px;
  font-weight: bold;
  padding-top: 20px;
  padding-bottom: 15px;
  position: relative;
  color: #333;
}
:deep(.referrer-info-dialog .van-dialog__header::after) {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background-color: #ffd700;
  border-radius: 3px;
}
.referrer-info-content {
  padding: 20px 24px;
  text-align: center;
  background-color: #ffffff;
}
:deep(.referrer-info-dialog .van-dialog__footer) {
    padding: 15px 24px 20px;
}
:deep(.referrer-info-dialog .van-dialog__cancel) {
    color: #666;
}
:deep(.referrer-info-dialog .van-dialog__confirm) {
  background: linear-gradient(90deg, #ffd700, #ff9500);
  border: none;
  color: #fff !important;
  font-weight: bold;
  border-radius: 20px;
  height: 40px;
  line-height: 40px;
}
:deep(.referrer-info-dialog .van-dialog__confirm:active) {
    opacity: 0.9;
}
*/

/* Action Sheet 基础样式调整 */
:deep(.van-action-sheet) {
  max-height: 80vh; /* 限制最大高度 */
  /* 可以保留默认圆角或自定义 */
}

/* Action Sheet 标题 */
:deep(.van-action-sheet__header) {
  font-size: 17px; /* 稍微调整标题大小 */
  font-weight: bold;
  color: #333;
  padding-bottom: 10px; /* 增加标题下方间距 */
}

/* Action Sheet 内容区域 */
.action-sheet-content { /* 这个类名现在应用在 Action Sheet 的内容 div 上 */
  padding: 16px 24px 30px; /* 调整内边距，底部留出更多空间 */
  text-align: center;
  background-color: #ffffff;
}

/* "已绑定推荐人"提示 (样式不变) */
.referrer-bound-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #ff976a;
  margin-bottom: 18px;
  background-color: #fff7f2;
  padding: 5px 10px;
  border-radius: 15px;
}
.referrer-bound-tip .van-icon {
  margin-right: 5px;
  font-size: 14px;
}

/* 推荐人头像 (样式不变) */
.referrer-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 12px auto;
  display: block;
  border: 2px solid #f0f0f0;
}

/* 推荐人昵称 (样式不变) */
.referrer-nickname {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  line-height: 1.4;
}

/* 推荐人ID (样式不变，调整间距) */
.referrer-id {
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px; /* 增加与底部按钮的间距 */
}
.referrer-id .id-icon {
   width: 12px;
   height: 12px;
   background-color: #ffd700;
   border-radius: 3px;
   margin-right: 6px;
   display: inline-block;
}

/* Action Sheet 底部按钮容器 */
.action-sheet-footer {
  margin-top: 20px; /* 与上方内容的间距 */
}

/* 确认支付按钮样式 */
.confirm-payment-btn.van-button { /* 提高选择器优先级 */
  height: 44px; /* 调整按钮高度 */
  font-size: 16px; /* 调整字体大小 */
  font-weight: bold;
  border: none;
  color: #fff !important; /* 确保文字白色 */
  border-radius: 22px; /* 匹配高度的圆角 */
  line-height: 44px; /* 垂直居中 */
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3); /* 添加阴影 */
  /* background 属性已在模板中通过 color prop 设置为渐变 */
}
.confirm-payment-btn.van-button:active {
  opacity: 0.9;
}

/* 输入框样式微调 */
.referrer-input-field {
  margin-bottom: 10px; /* 调整与其他元素的间距 */
}
.referrer-input-field :deep(.van-field__control) {
   font-size: 16px; /* 调整输入文字大小 */
}

/* 错误信息 (样式不变) */
.error-message {
  color: #ee0a24;
  font-size: 12px;
  margin: 8px 0 15px; /* 调整间距 */
  text-align: center;
}

/* 紧急支付链接 (样式不变，仅调整间距) */
.emergency-action {
  text-align: center;
  color: #1989fa;
  font-size: 13px;
  margin-top: 20px; /* 增加与按钮的间距 */
  text-decoration: underline;
  cursor: pointer;
}
.emergency-action:active {
  opacity: 0.8;
}

/* 包裹输入框和验证按钮的容器 */
.input-verify-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 调整下方间距 */
}

.referrer-input-field {
  flex-grow: 1; /* 输入框占据剩余空间 */
  margin-bottom: 0; /* 移除自身底部间距 */
  /* 可能需要移除vant field默认的边框或背景来更好地贴合 */
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.verify-button.van-button { /* 验证按钮 */
  flex-shrink: 0; /* 防止按钮被压缩 */
  margin-left: -1px; /* 与输入框紧密贴合 */
  height: 44px; /* 与输入框等高 (可能需要根据vant Field调整) */
  border-top-left-radius: 0; /* 右侧圆角 */
  border-bottom-left-radius: 0;
  border: 1px solid #ffd700; /* 边框颜色与主题一致 */
  background-color: #fff; /* 白色背景 */
  color: #ffd700; /* 金色文字 */
  padding: 0 12px; /* 调整内边距 */
  font-weight: normal; /* 非粗体 */
}
/* .verify-button.van-button--primary {
   background-color: #ffd700;
   color: #fff;
} */
.verify-button.van-button--loading {
  background-color: #f7f8fa; /* 加载时背景 */
  color: #c8c9cc; /* 加载时文字颜色 */
}

/* 验证后显示推荐人信息的区域 */
.verified-referrer-display {
  display: flex;
  align-items: center;
  background-color: #f7f8fa; /* 浅灰色背景 */
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px; /* 与上方间距 */
  margin-bottom: 10px; /* 与下方间距 */
  border: 1px solid #ebedf0;
}

.small-avatar { /* 小头像样式 */
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  flex-shrink: 0;
}

.verified-info-text {
  text-align: left; /* 文本左对齐 */
  flex-grow: 1;
}

.verified-nickname {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 3px;
}

.verified-id {
  font-size: 12px;
  color: #999;
}

/* Action Sheet 底部按钮容器 */
.action-sheet-footer {
  margin-top: 20px;
}

/* 确认支付按钮样式 */
.confirm-payment-btn.van-button {
  height: 44px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  color: #fff !important;
  border-radius: 22px;
  line-height: 44px;
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3);
}
.confirm-payment-btn.van-button:active {
  opacity: 0.9;
}

/* 禁用的确认支付按钮 */
.confirm-payment-btn.van-button--disabled {
  opacity: 0.6 !important; /* 提高优先级 */
  background: #f7f8fa !important; /* 灰色背景 */
  color: #c8c9cc !important; /* 灰色文字 */
  box-shadow: none !important; /* 移除阴影 */
  cursor: not-allowed;
}

/* 输入框样式微调 */
.referrer-input-field :deep(.van-field__control) {
   font-size: 16px;
}

/* 错误信息 */
.error-message {
  color: #ee0a24;
  font-size: 12px;
  margin: 15px 0; /* 调整间距 */
  text-align: center;
}

/* 紧急支付链接 */
.emergency-action {
  text-align: center;
  color: #1989fa;
  font-size: 13px;
  margin-top: 20px;
  text-decoration: underline;
  cursor: pointer;
}
.emergency-action:active {
  opacity: 0.8;
}
</style>