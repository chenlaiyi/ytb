<template>
  <div class="recruit-page">
    <!-- 头部导航 -->
    <van-nav-bar
      title="VIP招募"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <div class="page-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-info">
          <van-image
            round
            width="60"
            height="60"
            :src="userInfo.avatar"
            :error-content="'头像'"
          />
          <div class="user-details">
            <div class="user-name">{{ userInfo.name }}</div>
            <div class="user-title">VIP招募官</div>
          </div>
        </div>
        <div class="recruit-stats">
          <div class="stat-item">
            <div class="stat-value">{{ parseInt(recruitStats.team_vip_count) || 0 }}</div>
            <div class="stat-label">团队VIP</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ parseInt(recruitStats.direct_vip_count) || 0 }}</div>
            <div class="stat-label">直推VIP</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ parseInt(recruitStats.month_direct_vip_count) || 0 }}</div>
            <div class="stat-label">本月新增</div>
          </div>
        </div>
      </div>

      <!-- 二维码卡片 -->
      <div class="qr-card">
        <div class="card-title">
          <van-icon name="qr" />
          <span>专属招募二维码</span>
        </div>
        <div class="qr-container">
          <div class="qr-code">
            <img 
              :src="qrCodeUrl" 
              alt="招募二维码" 
              @error="onQrError" 
              @load="onQrLoad"
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
            />
            <div class="qr-overlay" v-if="qrLoading">
              <van-loading size="20" />
            </div>
            <div class="qr-error" v-if="qrError">
              <van-icon name="photo-fail" size="40" color="#ccc" />
              <div class="error-text">二维码加载失败</div>
              <van-button size="mini" type="primary" @click="retryQrCode">重试</van-button>
            </div>
          </div>
          <div class="qr-tip">长按保存二维码，分享给好友</div>
        </div>
      </div>

      <!-- 分享链接卡片 -->
      <div class="link-card">
        <div class="card-title">
          <van-icon name="share-o" />
          <span>招募链接</span>
        </div>
        <div class="link-container">
          <div class="link-input">
            <input
              type="text"
              :value="recruitLink"
              readonly
              ref="linkInput"
            />
            <van-button 
              type="primary" 
              size="small"
              @click="copyLink"
              :loading="copyLoading"
            >
              {{ copyLoading ? '复制中' : '复制' }}
            </van-button>
          </div>
          <div class="link-actions">
            <van-button 
              type="success" 
              size="small" 
              icon="wechat-pay"
              @click="shareToWechat"
            >
              微信分享
            </van-button>
          </div>
        </div>
      </div>

      <!-- VIP特权介绍 -->
      <div class="privilege-card">
        <div class="card-title">
          <van-icon name="crown-o" />
          <span>VIP专属特权</span>
        </div>
        <div class="privilege-list">
          <div class="privilege-item">
            <van-icon name="gold-coin-o" color="#ff9500" />
            <div class="privilege-content">
              <div class="privilege-title">分红收益</div>
              <div class="privilege-desc">每月享受平台VIP分红池分红</div>
            </div>
          </div>
          <div class="privilege-item">
            <van-icon name="friends-o" color="#1989fa" />
            <div class="privilege-content">
              <div class="privilege-title">团队奖励</div>
              <div class="privilege-desc">推荐他人成为VIP，获得额外分红</div>
            </div>
          </div>
          <div class="privilege-item">
            <van-icon name="diamond-o" color="#ee0a24" />
            <div class="privilege-content">
              <div class="privilege-title">专属服务</div>
              <div class="privilege-desc">享受VIP专属客服和优先服务</div>
            </div>
          </div>
          <div class="privilege-item">
            <van-icon name="medal-o" color="#ff9500" />
            <div class="privilege-content">
              <div class="privilege-title">身份尊贵</div>
              <div class="privilege-desc">VIP身份标识，彰显尊贵地位</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 招募说明 -->
      <div class="guide-card">
        <div class="card-title">
          <van-icon name="question-o" />
          <span>招募说明</span>
        </div>
        <div class="guide-content">
          <div class="guide-step">
            <div class="step-number">1</div>
            <div class="step-text">分享二维码或链接给好友</div>
          </div>
          <div class="guide-step">
            <div class="step-number">2</div>
            <div class="step-text">好友扫码或点击链接访问</div>
          </div>
          <div class="guide-step">
            <div class="step-number">3</div>
            <div class="step-text">好友注册并升级为VIP会员</div>
          </div>
          <div class="guide-step">
            <div class="step-number">4</div>
            <div class="step-text">您获得推荐奖励和团队分红</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import vipRecruitApi from '@/api/vipRecruit'
import { useUserStore } from '@/stores/user'

// 路由和状态管理
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const userInfo = ref({
  id: userStore.userId || 0,
  name: userStore.userName || '',
  avatar: userStore.userAvatar || '/app/images/profile/default-avatar.png'
})

const recruitStats = ref({
  direct_vip_count: 0,
  month_direct_vip_count: 0,
  team_vip_count: 0
})

const recruitLink = ref('')
const qrCodeUrl = ref('')
const qrLoading = ref(true)
const qrError = ref(false)
const copyLoading = ref(false)

// 引用
const linkInput = ref(null)

// 获取招募信息
const fetchRecruitInfo = async () => {
  try {
    console.log('开始获取VIP招募信息...')
    
    const res = await vipRecruitApi.getRecruitInfo()
    console.log('VIP招募信息响应:', res)
    
    // 统一V1 API返回格式：{ code: 200, message: 'success', data: {...} }
    if (res.code === 200) {
      const data = res.data
      
      // 处理用户信息 - 优先使用API返回的信息，如果没有则使用store中的信息
      if (data.user_info) {
        userInfo.value = {
          id: data.user_info.id || userStore.userId || 0,
          name: data.user_info.nickname || data.user_info.phone || userStore.userName || '用户',
          avatar: data.user_info.avatar || userStore.userAvatar || '/app/images/profile/default-avatar.png'
        }
        
        // 更新用户登录状态
        if (!userStore.isLoggedIn && data.user_info.id) {
          userStore.setUserInfo(data.user_info)
          userStore.isLoggedIn = true
        }
      } else {
        // 如果API没有返回用户信息，使用store中的信息
        userInfo.value = {
          id: userStore.userId || 0,
          name: userStore.userName || '用户',
          avatar: userStore.userAvatar || '/app/images/profile/default-avatar.png'
        }
      }
      
      // 处理招募统计 - 强制刷新响应式数据
      if (data.stats) {
        const newStats = {
          direct_vip_count: parseInt(data.stats.direct_count) || 0,
          month_direct_vip_count: parseInt(data.stats.month_recruits) || 0,
          team_vip_count: parseInt(data.stats.total_recruits) || 0
        }
        
        // 强制更新响应式数据
        Object.assign(recruitStats.value, newStats)
        
        console.log('招募统计数据设置:', recruitStats.value)
        console.log('API原始数据:', data.stats)
        console.log('处理后数据:', newStats)
      } else {
        console.warn('API未返回统计数据')
        Object.assign(recruitStats.value, {
          direct_vip_count: 0,
          month_direct_vip_count: 0,
          team_vip_count: 0
        })
      }
      
      // 处理招募链接和二维码
      recruitLink.value = data.recruit_link || ''
      console.log('招募链接设置:', recruitLink.value)
      
      // 设置二维码URL，不添加额外参数避免显示异常
      console.log('API返回的二维码URL:', data.qr_code_url)
      if (data.qr_code_url) {
        qrCodeUrl.value = data.qr_code_url
        console.log('二维码URL设置成功:', qrCodeUrl.value)
      } else {
        console.error('二维码URL为空或不存在')
      }
      
      // 重置二维码状态
      qrError.value = false
      console.log('VIP招募信息加载成功')
    } else {
      const message = (res && res.message) ? res.message : '获取招募信息失败'
      console.error('VIP招募信息获取失败:', message)
      
      // 如果是认证错误，引导用户登录
      if (res && (res.code === 401 || res.code === 1001)) {
        Toast({ type: 'fail', message: '请先登录' })
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        Toast({ type: 'fail', message })
      }
      qrLoading.value = false
    }
  } catch (error) {
    console.error('获取招募信息异常:', error)
    
    // 检查是否是HTTP 401错误
    if (error.response && error.response.status === 401) {
      Toast({ type: 'fail', message: '请先登录' })
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      const errorMessage = error.response?.data?.message || error.message || '网络错误，请重试'
      Toast({ type: 'fail', message: errorMessage })
    }
    qrLoading.value = false
  }
}

// 二维码加载成功
const onQrLoad = () => {
  qrLoading.value = false
  qrError.value = false
}

// 二维码加载失败
const onQrError = (error) => {
  qrLoading.value = false
  qrError.value = true
  console.error('二维码加载失败:', error)
  console.error('二维码URL:', qrCodeUrl.value)
  // 不显示Toast，避免频繁提示
}

// 重试加载二维码
const retryQrCode = async () => {
  qrError.value = false
  qrLoading.value = true
  
  try {
    // 重新获取招募信息，确保二维码URL是最新的
    await fetchRecruitInfo()
    Toast({ type: 'success', message: '重新加载二维码' })
  } catch (error) {
    console.error('重试加载二维码失败:', error)
    qrError.value = true
    qrLoading.value = false
    Toast({ type: 'fail', message: '重试失败，请稍后再试' })
  }
}

// 复制链接
const copyLink = async () => {
  if (copyLoading.value) return
  
  copyLoading.value = true
  
  try {
    // 尝试使用新API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(recruitLink.value)
      Toast.success('链接已复制到剪贴板')
    } else {
      // 降级方案
      if (linkInput.value) {
        linkInput.value.select()
        document.execCommand('copy')
        Toast.success('链接已复制到剪贴板')
      } else {
        throw new Error('复制失败')
      }
    }
  } catch (error) {
    console.error('复制失败:', error)
    Toast({ type: 'fail', message: '复制失败，请手动复制' })
  } finally {
    copyLoading.value = false
  }
}

// 微信分享
const shareToWechat = () => {
  // 检查是否在微信环境
  const isWechat = /micromessenger/i.test(navigator.userAgent)
  
  if (isWechat) {
    Toast({
      message: '请点击右上角菜单分享给好友',
      duration: 3000
    })
  } else {
    // 非微信环境，复制链接
    copyLink()
  }
}

// 初始化
onMounted(async () => {
  // 确保用户状态已加载
  if (userStore.isLoggedIn && !userStore.userInfo?.id) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
  
  // 获取招募信息
  await fetchRecruitInfo()
})
</script>

<style scoped>
.recruit-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.recruit-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.page-content {
  padding: 16px;
  padding-bottom: 32px;
  position: relative;
  z-index: 1;
}

/* 用户信息卡片 - 豪华渐变 */
.user-card {
  background: linear-gradient(145deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%);
  background-size: 300% 300%;
  animation: gradientShift 8s ease infinite;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 
    0 10px 30px rgba(255, 107, 107, 0.3),
    0 1px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24, #ff9ff3, #54a0ff, #5f27cd);
  border-radius: 22px;
  z-index: -1;
  opacity: 0.5;
  filter: blur(6px);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-details {
  margin-left: 16px;
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.user-title {
  font-size: 15px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

.recruit-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

/* 卡片通用样式 - 现代化设计 */
.qr-card, .link-card, .privilege-card, .guide-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.qr-card:hover, .link-card:hover, .privilege-card:hover, .guide-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  position: relative;
}

.card-title .van-icon {
  margin-right: 10px;
  color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 22px;
}

/* 二维码卡片 - 特殊效果 */
.qr-container {
  text-align: center;
}

.qr-code {
  position: relative;
  display: block;
  padding: 15px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  margin: 0 auto 16px;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.1);
  /* 增大容器尺寸，确保二维码完整显示 */
  width: 220px;
  height: 220px;
  text-align: center;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code img {
  /* 调整为180px尺寸，确保在220px容器中完整显示 */
  width: 180px !important;
  height: 180px !important;
  max-width: 180px !important;
  max-height: 180px !important;
  display: block;
  margin: 0;
  border-radius: 8px;
  background: white;
  border: 2px solid white;
  /* 确保图片完整适配容器 */
  object-fit: contain !important;
  object-position: center !important;
  flex-shrink: 0;
}

.qr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
}

.qr-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 16px;
}

.qr-error .error-text {
  font-size: 13px;
  color: #6c757d;
  margin: 10px 0;
  font-weight: 500;
}

.qr-tip {
  font-size: 15px;
  color: #495057;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 链接卡片 - 精美输入框 */
.link-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.link-input input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 14px;
  background: linear-gradient(145deg, #f8f9fa, #ffffff);
  color: #495057;
  font-weight: 500;
  transition: all 0.3s ease;
}

.link-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.link-actions {
  text-align: center;
}

/* 特权卡片 - 豪华列表 */
.privilege-list {
  space-y: 20px;
}

.privilege-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  position: relative;
}

.privilege-item:not(:last-child) {
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.privilege-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
}

.privilege-item .van-icon {
  font-size: 28px;
  margin-right: 16px;
  padding: 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.privilege-content {
  flex: 1;
}

.privilege-title {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
}

.privilege-desc {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  font-weight: 500;
}

/* 招募说明 - 现代化步骤 */
.guide-content {
  space-y: 16px;
}

.guide-step {
  display: flex;
  align-items: center;
  padding: 12px 0;
  position: relative;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  margin-right: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
}

.step-number::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 18px;
  z-index: -1;
  opacity: 0.3;
  filter: blur(4px);
}

.step-text {
  font-size: 15px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1.5;
}

/* 按钮美化 */
.recruit-page :deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.recruit-page :deep(.van-button--primary:active) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.recruit-page :deep(.van-button--success) {
  background: linear-gradient(135deg, #10ac84, #00d2d3);
  border: none;
  box-shadow: 0 4px 15px rgba(16, 172, 132, 0.4);
}

/* 导航栏美化 */
.recruit-page :deep(.van-nav-bar) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.recruit-page :deep(.van-nav-bar .van-nav-bar__title) {
  color: white;
  font-weight: 700;
  font-size: 18px;
}

.recruit-page :deep(.van-nav-bar .van-icon) {
  color: white;
}

/* 响应式优化 */
@media (max-width: 375px) {
  .user-name {
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .card-title {
    font-size: 16px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qr-card, .link-card, .privilege-card, .guide-card {
  animation: fadeInUp 0.6s ease forwards;
}

.qr-card { animation-delay: 0.1s; }
.link-card { animation-delay: 0.2s; }
.privilege-card { animation-delay: 0.3s; }
.guide-card { animation-delay: 0.4s; }
</style>