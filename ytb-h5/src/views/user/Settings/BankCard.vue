<template>
  <div class="settlement-container">
    <NavBar
      title="提现/结算管理"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div
      v-if="showAlipayVisitorGuide"
      class="alipay-visitor-guide"
    >
      <Icon name="success" size="56" color="#07c160" />
      <h2>支付宝授权已完成</h2>
      <p>请返回点点够公众号或App查看最新的绑定状态。</p>
      <p class="guide-hint">如果当前页面无法自动关闭，可手动切换回点点够。</p>
      <Button round block type="primary" @click="closeCurrentPage">我已完成</Button>
    </div>

    <div v-else class="settlement-content">
      <!-- 支付宝账号绑定 -->
      <div class="settlement-section">
        <div class="section-title">支付宝账号绑定</div>
        <div class="account-card" v-if="accounts.alipay">
          <div class="account-info">
            <img :src="accounts.alipay.avatar" alt="支付宝头像" class="account-avatar" />
            <div class="account-text">
              <div class="account-name">{{ accounts.alipay.nickname || '支付宝用户' }}</div>
              <div class="account-id">已绑定支付宝账号</div>
            </div>
          </div>
          <div class="account-actions">
            <Button 
              size="small" 
              type="primary" 
              plain 
              @click="openAlipayAuthPage"
              class="action-btn"
            >换绑</Button>
            <Button 
              size="small" 
              type="danger" 
              plain 
              @click="handleUnbindAlipay"
              class="action-btn"
            >解绑</Button>
          </div>
        </div>
        <div class="empty-account" v-else>
          <div class="empty-info">
            <Icon name="alipay" size="24" class="empty-icon" />
            <div class="empty-text">未绑定支付宝账号</div>
          </div>
          <Button 
            size="small" 
            type="primary"
            @click="openAlipayAuthPage"
          >绑定支付宝</Button>
        </div>
      </div>
      
      <!-- 微信账号绑定 -->
      <div class="settlement-section">
        <div class="section-title">微信账号绑定</div>
        <div class="account-card">
          <div class="account-info">
            <img :src="userInfo.wechat_avatar || defaultAvatar" alt="微信头像" class="account-avatar" />
            <div class="account-text">
              <div class="account-name">{{ resolvedWechatNickname }}</div>
              <div class="account-id">当前微信账号</div>
            </div>
          </div>
          <Button 
            size="small" 
            type="primary" 
            plain 
            @click="handleChangeWechat"
          >更换微信</Button>
        </div>
      </div>
      
      <!-- 银行卡列表 -->
      <div class="settlement-section">
        <div class="section-title">银行卡列表</div>
        <div class="bank-card-list" v-if="bankCards.length > 0">
          <div 
            v-for="(card, index) in bankCards" 
            :key="index" 
            class="bank-card-item"
            :class="[getBankClass(card.bankCode), {'is-default': card.isDefault}]"
          >
            <div class="bank-card-top">
              <div class="bank-logo">
                <img :src="getBankLogo(card.bankCode)" alt="银行logo" />
              </div>
              <div class="bank-info">
                <div class="bank-name">{{ card.bankName }}</div>
                <div class="card-type">{{ card.cardType }}</div>
              </div>
              <div class="card-actions">
                <Icon 
                  name="delete-o" 
                  size="18" 
                  class="delete-icon" 
                  @click.stop="handleDeleteCard(card)"
                />
              </div>
            </div>
            
            <div class="card-number">{{ formatCardNumber(card.cardNumber) }}</div>
            
            <div class="card-bottom">
              <div class="card-holder">{{ card.holderName }}</div>
              <div class="default-tag" v-if="card.isDefault">默认</div>
              <div class="set-default" v-else @click="setDefaultCard(card.id)">设为默认</div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div class="empty-state" v-else>
          <Icon name="credit-pay" size="48" class="empty-icon" />
          <p class="empty-text">暂无绑定银行卡</p>
          <p class="empty-desc">添加银行卡可用于提现或退款</p>
        </div>
        
        <!-- 添加银行卡按钮 -->
        <div class="add-card-wrapper">
          <Button 
            round 
            block 
            type="primary" 
            icon="plus" 
            @click="showAddCardForm = true"
          >
            添加银行卡
          </Button>
        </div>
        
        <!-- 银行卡限制说明 -->
        <div class="card-limit-info" v-if="bankCards.length > 0">
          <Icon name="info-o" size="14" class="info-icon" />
          <span>最多可绑定5张银行卡</span>
        </div>
      </div>
    </div>
    
    <!-- 添加银行卡表单弹窗 -->
    <Popup v-model:show="showAddCardForm" position="bottom" round closeable>
      <div class="add-card-form">
        <div class="form-title">添加银行卡</div>
        
        <Field 
          v-model="form.holderName" 
          label="持卡人" 
          placeholder="请输入持卡人姓名"
          :rules="[{ required: true, message: '请输入持卡人姓名' }]"
        />
        
        <Field 
          v-model="form.cardNumber" 
          label="卡号" 
          type="number"
          maxlength="19"
          placeholder="请输入银行卡号"
          :rules="[{ required: true, message: '请输入银行卡号' }]"
        />
        
        <Field 
          v-model="form.bankName" 
          label="开户银行" 
          readonly
          is-link
          placeholder="请选择开户银行"
          @click="showBankPicker = true"
        />
        
        <Field 
          v-model="form.phone" 
          label="预留手机号" 
          type="tel"
          maxlength="11"
          placeholder="请输入银行预留手机号"
          :rules="[
            { required: true, message: '请输入预留手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
          ]"
        />
        
        <div class="add-card-btn">
          <Button round block type="primary" @click="handleAddCard">确认添加</Button>
        </div>
      </div>
    </Popup>
    
    <!-- 银行选择器 -->
    <Popup v-model:show="showBankPicker" position="bottom" round>
      <Picker
        title="选择银行"
        :columns="bankOptions"
        @confirm="onBankConfirm"
        @cancel="showBankPicker = false"
      />
    </Popup>
    
    <!-- 删除确认弹窗 -->
    <Dialog v-model:show="showDeleteDialog" 
      title="删除银行卡" 
      :message="deleteMessage"
      show-cancel-button
      @confirm="confirmDeleteCard"
    />
    
    <!-- 二维码弹窗 -->
    <Popup v-model:show="showQrCodePopup" position="bottom" round closeable>
      <div class="qr-code-popup">
        <div class="qr-code-content">
          <div class="qr-code-title">支付宝账号绑定</div>
          
          <div class="user-info-box">
            <div class="user-avatar">
              <img :src="userInfo.wechat_avatar || '/images/default-avatar.png'" alt="微信头像" />
            </div>
            <div class="user-name">{{ userInfo.name || '微信用户' }}</div>
            <div class="user-tag">专属绑定码</div>
          </div>
          
          <div class="qr-code-wrapper">
            <div id="alipayQrCode"></div>
            <div class="qr-code-tag">只限本人使用</div>
          </div>
          
          <div class="qr-code-warning">
            <Icon name="warning-o" size="14" color="#ff4d4f" />
            <span>请勿让他人使用此二维码，否则提现将到他人账户</span>
          </div>
          
          <div class="qr-code-actions">
            <Button 
              size="normal" 
              type="primary" 
              block
              icon="photo-o"
              :loading="isPastingToAlbum"
              @click="saveQrCodeToAlbum"
            >保存到相册</Button>
          </div>
          
          <div class="qr-code-tips">
            <h4>使用说明：</h4>
            <ol>
              <li>点击"保存到相册"保存二维码图片</li>
              <li>退出微信，打开支付宝App</li>
              <li>在支付宝首页点击"扫一扫"</li>
              <li>点击相册图标，选择刚保存的二维码</li>
              <li>完成授权后返回本页面刷新</li>
            </ol>
            <div class="qr-code-tips-note">提示：此支付宝账号仅在点点够公众号里提现使用</div>
          </div>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Button, Icon, Dialog, showConfirmDialog, showToast, showSuccessToast, showLoadingToast, closeToast, Popup, Field, Picker } from 'vant'
import { getUserInfo, getBankCards, addBankCard, deleteBankCard, setDefaultBankCard, bindAlipayAccount, unbindAlipayAccount, bindWechatAccount, unbindWechatAccount, getAlipayAuthUrl } from '@/api/user'
import { formatBankCard } from '@/utils/format'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const defaultAvatar = '/images/default-avatar.png'

const resolveAvatarUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http')) return value
  return `https://pay.itapgo.com${value}`
}

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAlipayBindSuccess = computed(() => {
  const flag = route.query.alipay_bind
  return flag === 'success' || flag === '1'
})
const isAlipayLandingRoute = computed(() => route.query.tab === 'alipay' || isAlipayBindSuccess.value)
const showAlipayVisitorGuide = computed(() => isAlipayLandingRoute.value && !isLoggedIn.value)
const resolvedWechatNickname = computed(() => {
  const raw = userInfo.value.wechat_nickname || userInfo.value.nickname || userInfo.value.name || userStore.userInfo?.nickname
  if (raw && String(raw).trim()) {
    return raw.trim()
  }
  return '微信用户'
})

let alipayToastDisplayed = false
watch(
  () => route.query.alipay_bind,
  (value) => {
    if (!alipayToastDisplayed && (value === 'success' || value === '1')) {
      showSuccessToast('支付宝账号绑定成功！')
      alipayToastDisplayed = true
    }
  },
  { immediate: true }
)

const ensureAuthenticatedAction = () => {
  if (showAlipayVisitorGuide.value) {
    showToast('请返回点点够应用内的提现设置完成操作')
    return false
  }
  return true
}

const closeCurrentPage = () => {
  try {
    if (window.WeixinJSBridge) {
      window.WeixinJSBridge.call('closeWindow')
      return
    }
    if (window.qq && window.qq.qap && window.qq.qap.close) {
      window.qq.qap.close()
      return
    }
  } catch (error) {
    console.warn('关闭内嵌窗口失败，尝试fallback', error)
  }

  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/user')
  }

  setTimeout(() => {
    window.close()
  }, 300)
}

// 用户信息
const userInfo = ref({})
// 结算账号
const accounts = reactive({
  alipay: null,
  wechat: null
})

// 银行卡相关
const bankCards = ref([])
const showAddCardForm = ref(false)
const showBankPicker = ref(false)
const showDeleteDialog = ref(false)
const currentDeleteCard = ref(null)
const deleteMessage = computed(() => {
  if (!currentDeleteCard.value) return ''
  return `确定要删除尾号为${currentDeleteCard.value.cardNumber.slice(-4)}的银行卡吗？`
})

// 支付宝授权相关
const showQrCodePopup = ref(false)
const alipayAuthUrl = ref('')
const alipayQrCodeUrl = ref('')
const isWechatBrowser = ref(false)
const isPastingToAlbum = ref(false)  // 是否正在保存到相册中

// 银行卡表单数据
const form = ref({
  holderName: '',
  cardNumber: '',
  bankName: '',
  bankCode: '',
  phone: ''
})

// 银行选项
const bankOptions = [
  { text: '中国工商银行', value: 'ICBC' },
  { text: '中国农业银行', value: 'ABC' },
  { text: '中国银行', value: 'BOC' },
  { text: '中国建设银行', value: 'CCB' },
  { text: '交通银行', value: 'BOCOM' },
  { text: '中国邮政储蓄银行', value: 'PSBC' },
  { text: '招商银行', value: 'CMB' },
  { text: '浦发银行', value: 'SPDB' },
  { text: '中信银行', value: 'CITIC' },
  { text: '光大银行', value: 'CEB' },
  { text: '华夏银行', value: 'HXB' },
  { text: '民生银行', value: 'CMBC' },
  { text: '广发银行', value: 'GDB' },
  { text: '平安银行', value: 'PAB' },
  { text: '兴业银行', value: 'CIB' }
]

// 获取用户信息，包括绑定的支付宝和微信账号
const fetchUserInfo = async () => {
  if (showAlipayVisitorGuide.value) {
    console.log('访客模式下跳过用户信息拉取');
    return;
  }
  try {
    console.log('开始获取用户信息...');
    const res = await getUserInfo();
    console.log('获取到用户信息响应:', res);
    
    if (res.code === 0 && res.data) {
      const normalized = { ...res.data };
      normalized.wechat_avatar = resolveAvatarUrl(normalized.wechat_avatar || normalized.avatar || '') || defaultAvatar;
      normalized.avatar = resolveAvatarUrl(normalized.avatar || normalized.wechat_avatar || '') || defaultAvatar;
      userInfo.value = normalized;
      console.log('用户完整数据:', JSON.stringify(userInfo.value));
      
      // 检查并处理支付宝账号信息 - 使用alipay_openid字段判断是否绑定
      console.log('支付宝openid:', res.data.alipay_openid);
      console.log('支付宝avatar:', res.data.alipay_avatar);
      console.log('微信avatar:', res.data.wechat_avatar);
      
      if (res.data.alipay_openid && res.data.alipay_openid.length > 5) {
        console.log('检测到有效的支付宝openid，设置已绑定状态');
        
        // 如果没有支付宝头像，优先使用微信头像，其次使用默认头像
        const avatarToUse = res.data.alipay_avatar || res.data.wechat_avatar || defaultAvatar;
        console.log('使用的头像来源:', res.data.alipay_avatar ? '支付宝头像' : (res.data.wechat_avatar ? '微信头像' : '默认头像'));
        
        accounts.alipay = {
          userId: res.data.alipay_user_id || '',
          nickname: res.data.alipay_nickname || '支付宝用户',
          avatar: avatarToUse,
          openid: res.data.alipay_openid
        };
        console.log('支付宝绑定状态设置为:', JSON.stringify(accounts.alipay));
      } else {
        console.log('未检测到有效的支付宝openid，设置未绑定状态');
        accounts.alipay = null;
      }
      
      // 若用户在app_users表中有institution_card_number字段数据，显示为银行卡
      console.log('用户银行卡信息:', res.data.institution_card_number);
      
      if (res.data.institution_card_number && res.data.institution_card_number.length > 10) {
        console.log('检测到有效的银行卡号信息');
        // 分析银行卡号，匹配银行类型
        const cardNumber = res.data.institution_card_number;
        let bankCode = 'BOC'; // 默认为中国银行
        
        // 根据银行卡号前几位判断银行代码
        if (cardNumber.startsWith('622')) {
          if (cardNumber.startsWith('6225')) {
            bankCode = 'CMB'; // 招商银行
          } else if (cardNumber.startsWith('6222')) {
            bankCode = 'ICBC'; // 工商银行
          }
        } else if (cardNumber.startsWith('621') || cardNumber.startsWith('620')) {
          bankCode = 'ABC'; // 农业银行
        } else if (cardNumber.startsWith('623')) {
          bankCode = 'CCB'; // 建设银行
        }
        
        // 创建一个系统银行卡对象
        const systemCard = {
          id: 'system_card',
          holderName: res.data.name || '持卡人',
          cardNumber: cardNumber,
          bankName: res.data.institution_account || '开户银行',
          bankCode: bankCode,
          isDefault: true,
          isSystemCard: true, // 标记为系统卡
          cardType: '储蓄卡'
        };
        
        console.log('创建系统银行卡信息:', JSON.stringify(systemCard));
        
        // 如果列表为空，添加到列表中
        if (bankCards.value.length === 0) {
          bankCards.value = [systemCard];
        } else {
          // 检查是否已存在该卡
          const exists = bankCards.value.some(card => 
            card.isSystemCard || card.cardNumber === cardNumber
          );
          
          if (!exists) {
            // 添加到银行卡列表的最前面
            bankCards.value = [systemCard, ...bankCards.value];
          }
        }
        console.log('更新后的银行卡列表:', bankCards.value.length, '张卡');
      } else {
        console.log('未检测到有效的银行卡号信息');
      }
    } else {
      console.error('获取用户信息失败，服务器返回错误:', res.message);
      showToast('获取用户信息失败，请稍后刷新重试');
    }
  } catch (error) {
    console.error('获取用户信息API异常:', error);
    showToast('网络异常，请稍后刷新重试');
  }
}

// 获取银行卡列表
const fetchBankCards = async () => {
  if (showAlipayVisitorGuide.value) {
    console.log('访客模式下跳过银行卡列表拉取');
    return;
  }
  try {
    const res = await getBankCards()
    if (res.code === 0) {
      // 保留之前可能添加的系统银行卡信息
      const systemCards = bankCards.value.filter(card => card.isSystemCard);
      
      // 获取API返回的银行卡
      const apiCards = res.data || [];
      
      // 合并两种卡
      if (systemCards.length > 0) {
        bankCards.value = [...systemCards, ...apiCards];
      } else {
        bankCards.value = apiCards;
      }
    }
  } catch (error) {
    console.error('获取银行卡列表失败', error)
    showToast('获取银行卡列表失败')
  }
}

const bootstrapAuthenticatedData = () => {
  fetchUserInfo()
  fetchBankCards()
}

// 获取银行logo
const defaultBankCode = 'default'
const normalizeBankCode = (code) => {
  if (!code || typeof code !== 'string') return defaultBankCode
  return code.trim().toLowerCase() || defaultBankCode
}

const getBankLogo = (bankCode) => {
  const normalized = normalizeBankCode(bankCode)
  return `/images/bank-logos/${normalized}.png`
}

// 获取银行卡样式类
const getBankClass = (bankCode) => {
  const normalized = normalizeBankCode(bankCode)
  return `bank-${normalized}`
}

// 格式化卡号
const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return ''
  return formatBankCard(cardNumber)
}

// 银行选择确认
const onBankConfirm = ({ selectedValues, selectedOptions }) => {
  form.value.bankCode = selectedValues[0]
  form.value.bankName = selectedOptions[0].text
  showBankPicker.value = false
}

// 添加银行卡
const handleAddCard = async () => {
  if (!ensureAuthenticatedAction()) {
    return
  }
  // 表单验证
  if (!form.value.holderName) {
    showToast('请输入持卡人姓名')
    return
  }
  
  if (!form.value.cardNumber) {
    showToast('请输入银行卡号')
    return
  }
  
  // 验证卡号
  if (!/^\d{16,19}$/.test(form.value.cardNumber)) {
    showToast('请输入正确的银行卡号')
    return
  }
  
  if (!form.value.bankName) {
    showToast('请选择开户银行')
    return
  }
  
  if (!form.value.phone) {
    showToast('请输入预留手机号')
    return
  }
  
  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    showToast('请输入正确的手机号')
    return
  }
  
  // 检查是否超过卡数限制
  if (bankCards.value.length >= 5) {
    showToast('最多只能绑定5张银行卡')
    return
  }
  
  try {
    showLoadingToast({
      message: '添加中...',
      forbidClick: true,
    })
    
    const res = await addBankCard({
      holderName: form.value.holderName,
      cardNumber: form.value.cardNumber,
      bankName: form.value.bankName,
      bankCode: form.value.bankCode,
      phone: form.value.phone,
      isDefault: bankCards.value.length === 0 // 如果是第一张卡，设为默认
    })
    
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('添加成功')
      
      // 重置表单
      form.value = {
        holderName: '',
        cardNumber: '',
        bankName: '',
        bankCode: '',
        phone: ''
      }
      
      // 关闭弹窗
      showAddCardForm.value = false
      
      // 刷新列表
      fetchBankCards()
    } else {
      showToast(res.message || '添加失败')
    }
  } catch (error) {
    closeToast()
    console.error('添加银行卡失败', error)
    showToast('添加失败，请稍后重试')
  }
}

// 处理删除银行卡
const handleDeleteCard = (card) => {
  if (!ensureAuthenticatedAction()) {
    return
  }
  // 如果是系统卡，不允许删除
  if (card.isSystemCard) {
    showToast('系统银行卡无法通过App删除，请联系客服');
    return;
  }
  
  currentDeleteCard.value = card;
  showDeleteDialog.value = true;
}

// 确认删除银行卡
const confirmDeleteCard = async () => {
  if (!ensureAuthenticatedAction()) {
    return
  }
  if (!currentDeleteCard.value) return
  
  try {
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
    })
    
    const res = await deleteBankCard({
      id: currentDeleteCard.value.id
    })
    
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('删除成功')
      
      // 刷新列表
      fetchBankCards()
    } else {
      showToast(res.message || '删除失败')
    }
  } catch (error) {
    closeToast()
    console.error('删除银行卡失败', error)
    showToast('删除失败，请稍后重试')
  }
}

// 设置默认银行卡
const setDefaultCard = async (cardId) => {
  if (!ensureAuthenticatedAction()) {
    return
  }
  try {
    showLoadingToast({
      message: '设置中...',
      forbidClick: true,
    })
    
    const res = await setDefaultBankCard({
      id: cardId
    })
    
    closeToast()
    
    if (res.code === 0) {
      showSuccessToast('设置成功')
      
      // 刷新列表
      fetchBankCards()
    } else {
      showToast(res.message || '设置失败')
    }
  } catch (error) {
    closeToast()
    console.error('设置默认银行卡失败', error)
    showToast('设置失败，请稍后重试')
  }
}

// 监听页面消息事件，用于接收授权成功的消息
const handleMessageEvent = (event) => {
  console.log('接收到消息事件:', event);
  
  // 检查各种可能的消息格式
  let isAlipayBindSuccess = false;
  
  if (event.data === 'ALIPAY_BIND_SUCCESS') {
    isAlipayBindSuccess = true;
  } else if (typeof event.data === 'object' && event.data !== null) {
    // 检查对象格式的消息
    if (event.data.type === 'ALIPAY_BIND_SUCCESS' || 
        event.data.action === 'ALIPAY_BIND_SUCCESS' ||
        event.data.status === 'success') {
      isAlipayBindSuccess = true;
    }
  }
  
  if (isAlipayBindSuccess) {
    const isRebind = !!accounts.alipay;
    if (isRebind) {
      showSuccessToast('支付宝账号换绑成功！');
    } else {
      showSuccessToast('支付宝账号绑定成功！');
    }
    
    // 延迟获取用户信息，确保后端数据已更新
    setTimeout(() => {
      fetchUserInfo(); // 刷新用户信息
    }, 500);
  }
}

// 解绑支付宝账号
const handleUnbindAlipay = () => {
  if (!ensureAuthenticatedAction()) {
    return
  }

  showConfirmDialog({
    title: '解除绑定',
    message: '确定要解除支付宝账号绑定吗？解绑后将无法使用支付宝进行提现操作。',
    confirmButtonText: '确定解绑',
    confirmButtonColor: '#ee0a24',
  })
  .then(async () => {
    try {
      showLoadingToast({
        message: '解绑中...',
        forbidClick: true,
      })
      
      const res = await unbindAlipayAccount()
      
      closeToast()
      
      if (res.code === 0) {
        showSuccessToast('解绑成功')
        accounts.alipay = null
        // 更新用户信息，确保状态同步
        setTimeout(() => {
          fetchUserInfo()
        }, 500)
      } else {
        showToast(res.message || '解绑失败')
      }
    } catch (error) {
      closeToast()
      console.error('解绑支付宝账号失败', error)
      showToast('解绑失败，请稍后重试')
    }
  })
  .catch(() => {
    // 用户取消操作
  })
}

// 更换微信提现账号
const handleChangeWechat = () => {
  if (!ensureAuthenticatedAction()) {
    return
  }

  showConfirmDialog({
    title: '更换微信',
    message: '确定要更换提现微信账号吗？',
    confirmButtonText: '确定更换',
  })
  .then(async () => {
    // 实际项目中应该调用微信授权SDK
    // 这里使用当前登录的微信账号作为提现账号
    try {
      showLoadingToast({
        message: '设置中...',
        forbidClick: true,
      })
      
      const res = await bindWechatAccount({
        // 使用当前登录微信信息，服务端应该从当前登录用户获取
      })
      
      closeToast()
      
      if (res.code === 0) {
        showSuccessToast('设置成功')
      } else {
        showToast(res.message || '设置失败')
      }
    } catch (error) {
      closeToast()
      console.error('设置提现微信账号失败', error)
      showToast('设置失败，请稍后重试')
    }
  })
  .catch(() => {
    // 用户取消操作
  })
}

// 打开支付宝授权页面
const openAlipayAuthPage = () => {
  // 显示不同的确认消息，根据是否已绑定支付宝
  const isRebind = !!accounts.alipay;

  if (!ensureAuthenticatedAction()) {
    return
  }
  
  // 检测是否在微信环境中
  checkWechatEnvironment();
  
  if (isRebind) {
    // 如果是换绑，先确认用户操作
    showConfirmDialog({
      title: '更换支付宝账号',
      message: '确定要更换绑定的支付宝账号吗？',
      confirmButtonText: '确定更换',
    })
    .then(() => {
      openAlipayAuth();
    })
    .catch(() => {
      // 用户取消操作
    });
  } else {
    // 如果是首次绑定，直接打开授权页面
    openAlipayAuth();
  }
}

// 检测是否在微信浏览器中
const checkWechatEnvironment = () => {
  const ua = navigator.userAgent.toLowerCase();
  isWechatBrowser.value = ua.indexOf('micromessenger') !== -1;
  console.log('当前是否在微信环境中:', isWechatBrowser.value);
}

// 实际打开支付宝授权页面的函数
const openAlipayAuth = async () => {
  try {
    showLoadingToast({
      message: '获取授权链接...',
      forbidClick: true,
    });
    
    // 使用API获取支付宝授权URL
    const res = await getAlipayAuthUrl();
    
    closeToast();
    
    if (res.code === 0 && res.data) {
      // 存储授权URL和二维码内容
      alipayAuthUrl.value = res.data.auth_url || '';
      alipayQrCodeUrl.value = res.data.qrcode_content || res.data.auth_url || '';
      
      // 保存授权时间戳到本地存储，用于后续检查绑定状态
      localStorage.setItem('alipay_auth_time', Date.now().toString());
      
      if (isWechatBrowser.value) {
        // 在微信中打开，显示二维码弹窗
        showQrCodePopup.value = true;

        // 在弹窗显示后初始化二维码
        setTimeout(() => {
          initQrCode();
        }, 100);
      } else {
        // 非微信环境，直接跳转
        // 创建一个临时链接并点击它
        const linkElem = document.createElement('a');
        linkElem.href = alipayQrCodeUrl.value || alipayAuthUrl.value;
        linkElem.target = '_blank'; // 在新窗口打开
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);
      }
    } else {
      showToast(res.message || '获取授权链接失败');
    }
  } catch (error) {
    closeToast();
    console.error('获取支付宝授权URL失败:', error);
    showToast('获取授权链接失败，请稍后重试');
  }
}

// 初始化二维码生成
const initQrCode = () => {
  const qrCodeElement = document.getElementById('alipayQrCode');
  if (!qrCodeElement) return;
  
  // 清空元素内容
  qrCodeElement.innerHTML = '';
  
  // 确认QRCode.js已加载
  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(qrCodeElement, {
        text: alipayQrCodeUrl.value,
        width: 160,
        height: 160,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (error) {
      console.error('生成二维码失败:', error);
      qrCodeElement.innerHTML = '<div class="qr-error">二维码生成失败，请重试</div>';
    }
  } else {
    // 加载QRCode库
    const script = document.createElement('script');
    script.src = 'https://cdn.bootcdn.net/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      try {
        new QRCode(qrCodeElement, {
          text: alipayQrCodeUrl.value,
          width: 160,
          height: 160,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (error) {
        console.error('加载库后生成二维码失败:', error);
        qrCodeElement.innerHTML = '<div class="qr-error">二维码生成失败，请重试</div>';
      }
    };
    script.onerror = () => {
      console.error('加载QRCode库失败');
      qrCodeElement.innerHTML = '<div class="qr-error">加载二维码库失败，请检查网络</div>';
    };
    document.body.appendChild(script);
  }
}

// 保存二维码图片到相册
const saveQrCodeToAlbum = () => {
  const qrCanvas = document.querySelector('#alipayQrCode canvas');
  if (!qrCanvas) {
    showToast('二维码尚未生成完成，请稍候再试');
    return;
  }
  
  // 防止重复点击
  if (isPastingToAlbum.value) {
    return;
  }
  
  isPastingToAlbum.value = true;
  showLoadingToast({
    message: '正在保存到相册...',
    forbidClick: true,
  });
  
  try {
    // 创建临时canvas，将微信用户信息和二维码合并
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // 设置画布尺寸
    tempCanvas.width = 350;
    tempCanvas.height = 480;
    
    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 绘制标题
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('专属支付宝绑定二维码', tempCanvas.width / 2, 30);
    
    // 绘制微信用户头像的背景圆
    ctx.beginPath();
    ctx.arc(tempCanvas.width / 2, 80, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
    
    // 加载用户头像
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = userInfo.value.wechat_avatar || '/images/default-avatar.png';
    
    // 当头像加载完成后，绘制头像和其他内容
    avatarImg.onload = () => {
      // 绘制圆形头像
      ctx.save();
      ctx.beginPath();
      ctx.arc(tempCanvas.width / 2, 80, 30, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, tempCanvas.width / 2 - 30, 50, 60, 60);
      ctx.restore();
      
      // 绘制用户昵称
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText(userInfo.value.name || '微信用户', tempCanvas.width / 2, 130);
      
      // 绘制提示文字
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText('此二维码为专属绑定二维码', tempCanvas.width / 2, 155);
      
      // 绘制重要提示
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ff4d4f';
      ctx.fillText('请勿让他人使用此二维码，否则提现将到他人账户', tempCanvas.width / 2, 180);
      
      // 绘制二维码
      ctx.drawImage(qrCanvas, tempCanvas.width / 2 - 80, 200, 160, 160);
      
      // 绘制底部说明
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText('使用支付宝扫描上方二维码完成绑定', tempCanvas.width / 2, 420);
      ctx.fillText('仅用于点点够公众号提现使用', tempCanvas.width / 2, 445);
      
      // 将合并后的画布转为图片URL
      const imgUrl = tempCanvas.toDataURL('image/png');
      
      // 创建一个隐藏的下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = imgUrl;
      downloadLink.download = '支付宝专属绑定二维码.png';
      
      // 在移动端使用blob方式下载
      tempCanvas.toBlob((blob) => {
        if (navigator.userAgent.match(/iphone|ipod|ipad/i)) {
          // iOS设备需要特殊处理
          const reader = new FileReader();
          reader.onloadend = function() {
            const base64data = reader.result;
            
            // 创建img元素用于iOS保存
            const img = document.createElement('img');
            img.src = base64data;
            img.style.position = 'fixed';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100vw';
            img.style.height = '100vh';
            img.style.zIndex = '9999';
            img.style.backgroundColor = 'rgba(0,0,0,0.8)';
            img.style.padding = '40px 20px';
            img.style.boxSizing = 'border-box';
            img.style.objectFit = 'contain';
            
            // 添加关闭按钮
            const closeBtn = document.createElement('div');
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.style.zIndex = '10000';
            closeBtn.style.backgroundColor = '#fff';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.width = '30px';
            closeBtn.style.height = '30px';
            closeBtn.style.textAlign = 'center';
            closeBtn.style.lineHeight = '30px';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.color = '#333';
            closeBtn.innerText = '×';
            
            closeBtn.onclick = () => {
              document.body.removeChild(img);
              document.body.removeChild(closeBtn);
              document.body.removeChild(saveText);
            };
            
            // 添加提示文字
            const saveText = document.createElement('div');
            saveText.style.position = 'fixed';
            saveText.style.bottom = '20px';
            saveText.style.left = '0';
            saveText.style.width = '100%';
            saveText.style.textAlign = 'center';
            saveText.style.color = '#fff';
            saveText.style.fontSize = '16px';
            saveText.style.zIndex = '10000';
            saveText.innerHTML = '请长按图片保存到相册<br>然后使用支付宝扫一扫打开';
            
            document.body.appendChild(img);
            document.body.appendChild(closeBtn);
            document.body.appendChild(saveText);
            
            closeToast();
            isPastingToAlbum.value = false;
          };
          reader.readAsDataURL(blob);
        } else {
          // 安卓设备使用常规方法
          const url = URL.createObjectURL(blob);
          downloadLink.href = url;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
          
          showSuccessToast('二维码图片已下载，请在相册中查看');
          closeToast();
          isPastingToAlbum.value = false;
          
          // 显示使用说明
          Dialog.alert({
            title: '保存成功',
            message: '二维码已保存到相册，请按以下步骤操作：\n1. 退出微信，打开支付宝\n2. 在支付宝中点击"扫一扫"\n3. 在扫一扫界面点击右上角相册图标\n4. 选择刚保存的二维码进行扫描\n5. 完成授权后返回本页面',
            confirmButtonText: '知道了'
          });
        }
      }, 'image/png');
    };
    
    // 错误处理
    avatarImg.onerror = () => {
      closeToast();
      isPastingToAlbum.value = false;
      showToast('生成图片失败，请重试');
    };
  } catch (error) {
    closeToast();
    isPastingToAlbum.value = false;
    console.error('保存二维码失败:', error);
    showToast('保存二维码失败，请长按二维码图片保存');
  }
}

// 页面加载时获取数据
onMounted(() => {
  window.addEventListener('message', handleMessageEvent)
  
  // 检查是否在微信环境中
  checkWechatEnvironment();
  
  // 检查URL参数是否包含支付宝授权成功的标记
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('alipay_bind') === 'success') {
    const isRebind = !!accounts.alipay;
    if (isRebind) {
      showSuccessToast('支付宝账号换绑成功！');
    } else {
      showSuccessToast('支付宝账号绑定成功！');
    }
    
    // 清除URL参数，防止刷新页面重复提示
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.href.split('?')[0];
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
  
  if (!showAlipayVisitorGuide.value) {
    bootstrapAuthenticatedData()
  } else {
    console.log('访客模式（Alipay回调）无需立即拉取用户数据')
  }
  
  // 针对微信环境，检查本地存储中的授权时间标记
  if (isWechatBrowser.value) {
    const alipayAuthTime = localStorage.getItem('alipay_auth_time');
    const currentTime = Date.now();
    const authTimeoutValue = 3600000; // 1小时超时
    
    if (alipayAuthTime && (currentTime - parseInt(alipayAuthTime) < authTimeoutValue)) {
      // 近期有进行授权操作，自动刷新页面以检查绑定状态
      const lastCheckTime = localStorage.getItem('alipay_last_check_time');
      
      // 至少间隔30秒才检查一次，避免频繁请求
      if (!lastCheckTime || (currentTime - parseInt(lastCheckTime) > 30000)) {
        localStorage.setItem('alipay_last_check_time', currentTime.toString());
        
        // 显示检查提示
        showLoadingToast({
          message: '正在检查支付宝绑定状态...',
          duration: 1500
        });
        
        // 延迟后刷新用户信息
        setTimeout(() => {
          fetchUserInfo();
        }, 1500);
      }
    }
  }
})

watch(
  () => showAlipayVisitorGuide.value,
  (isVisitor, wasVisitor) => {
    if (typeof wasVisitor === 'undefined') {
      return
    }
    if (!isVisitor && wasVisitor) {
      bootstrapAuthenticatedData()
    }
  }
)

onUnmounted(() => {
  window.removeEventListener('message', handleMessageEvent)
})
</script>

<style scoped>
.settlement-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.settlement-content {
  padding: 16px;
}

.settlement-section {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #323233;
  border-left: 3px solid #1989fa;
  padding-left: 10px;
}

.account-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.account-info {
  display: flex;
  align-items: center;
}

.account-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 1px solid #ebedf0;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.account-id {
  font-size: 12px;
  color: #969799;
}

.empty-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 4px;
}

.empty-info {
  display: flex;
  align-items: center;
}

.empty-icon {
  margin-right: 8px;
  color: #969799;
}

.empty-text {
  font-size: 14px;
  color: #969799;
}

.bank-card-list {
  margin-bottom: 20px;
}

.bank-card-item {
  margin-bottom: 16px;
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: linear-gradient(135deg, #4a90e2, #1556b6);
  transition: transform 0.2s;
}

.bank-card-item:active {
  transform: scale(0.98);
}

/* 不同银行卡的背景样式 */
.bank-card-item.bank-icbc {
  background: linear-gradient(135deg, #d81e06, #a50000);
}

.bank-card-item.bank-abc {
  background: linear-gradient(135deg, #50a73e, #357a28);
}

.bank-card-item.bank-boc {
  background: linear-gradient(135deg, #e50012, #9e0000);
}

.bank-card-item.bank-ccb {
  background: linear-gradient(135deg, #0066b3, #003d82);
}

.bank-card-item.bank-cmb {
  background: linear-gradient(135deg, #e60012, #ab000d);
}

.bank-card-item.is-default::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.2);
  transform: rotate(45deg) translate(15px, -30px);
}

.bank-card-top {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.bank-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.bank-logo img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.bank-info {
  flex-grow: 1;
}

.bank-name {
  font-size: 16px;
  font-weight: 500;
}

.card-type {
  font-size: 12px;
  opacity: 0.8;
}

.card-actions {
  margin-left: auto;
}

.delete-icon {
  color: rgba(255, 255, 255, 0.8);
}

.card-number {
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-holder {
  font-size: 14px;
}

.default-tag {
  padding: 2px 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 12px;
}

.set-default {
  font-size: 12px;
  text-decoration: underline;
  opacity: 0.8;
  cursor: pointer;
}

.set-default:active {
  opacity: 0.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.empty-state .empty-icon {
  margin-bottom: 16px;
  color: #ddd;
}

.empty-state .empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #aaa;
}

.add-card-wrapper {
  margin: 24px 0;
}

.card-limit-info {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon {
  margin-right: 4px;
}

.add-card-form {
  padding: 20px 16px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.add-card-btn {
  margin-top: 24px;
}

.alipay-bind-link {
  text-decoration: none;
}

.account-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  min-width: 60px;
}

.qr-code-popup {
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

.qr-code-content {
  text-align: center;
  padding-bottom: 15px;
}

.qr-code-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.user-info-box {
  margin-bottom: 12px;
  background-color: #f8f8f8;
  padding: 12px;
  border-radius: 12px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 8px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.user-tag {
  display: inline-block;
  font-size: 12px;
  color: #1989fa;
  background-color: rgba(25, 137, 250, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 4px;
}

.qr-code-wrapper {
  position: relative;
  margin: 0 auto 15px;
  width: 180px;
}

#alipayQrCode {
  margin: 0 auto;
  width: 160px;
  height: 160px;
  background-color: #f8f8f8;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.qr-code-tag {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  background-color: #1989fa;
  color: #fff;
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
}

.qr-code-warning {
  margin: 15px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 77, 79, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 300px;
}

.qr-code-warning .van-icon {
  margin-right: 6px;
  flex-shrink: 0;
}

.qr-code-warning span {
  font-size: 12px;
  color: #ff4d4f;
  text-align: left;
}

.qr-code-actions {
  margin: 15px auto;
  max-width: 300px;
}

.qr-code-tips {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
  background-color: #f8f8f8;
  padding: 12px;
  border-radius: 8px;
  text-align: left;
}

.qr-code-tips h4 {
  color: #333;
  margin: 0 0 8px;
}

.qr-code-tips ol {
  margin: 0;
  padding-left: 20px;
}

.qr-code-tips li {
  margin-bottom: 6px;
}

.qr-code-tips-note {
  margin-top: 12px;
  color: #ff976a;
  font-size: 13px;
  font-weight: 500;
}

.qr-error {
  color: #ee0a24;
  margin-top: 10px;
}
</style> 
