<template>
  <div class="success-page">
    <!-- 成功状态显示 -->
    <div class="success-content">
      <!-- 成功图标 -->
      <div class="success-icon">
        <van-icon name="checked" size="80" color="#52c41a" />
      </div>
      
      <!-- 成功信息 -->
      <div class="success-info">
        <h2 class="success-title">VIP升级成功！</h2>
        <p class="success-desc">恭喜您成为VIP会员，享受专属特权</p>
      </div>

      <!-- VIP特权展示 -->
      <div class="privileges-card">
        <h3 class="privileges-title">您的VIP特权</h3>
        <div class="privileges-list">
          <div class="privilege-item">
            <van-icon name="gold-coin-o" size="24" color="#ffa940" />
            <span>自用优惠权益</span>
          </div>
          <div class="privilege-item">
            <van-icon name="friends-o" size="24" color="#ffa940" />
            <span>VIP招募推广权</span>
          </div>
          <div class="privilege-item">
            <van-icon name="gift-o" size="24" color="#ffa940" />
            <span>专属分红收益</span>
          </div>
          <div class="privilege-item">
            <van-icon name="star-o" size="24" color="#ffa940" />
            <span>优先客服支持</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <van-button 
          type="primary" 
          size="large" 
          round 
          @click="goToVipRecruit"
          class="action-btn"
        >
          开始招募VIP
        </van-button>
        
        <van-button 
          type="default" 
          size="large" 
          round 
          @click="goToHome"
          class="action-btn"
        >
          返回首页
        </van-button>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-card">
        <h4 class="tips-title">温馨提示</h4>
        <ul class="tips-list">
          <li>您的VIP会员权益已立即生效</li>
          <li>可在个人中心查看VIP专属功能</li>
          <li>分享招募链接开始获得推荐收益</li>
        </ul>
      </div>
    </div>

    <!-- 底部装饰 -->
    <div class="success-decoration">
      <div class="confetti"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 页面初始化
onMounted(() => {
  // 刷新用户信息，确保VIP状态是最新的
  if (userStore.isLoggedIn) {
    userStore.refreshUserInfo()
  }
})

// 跳转到VIP招募页面
const goToVipRecruit = () => {
  router.push('/vip/recruit')
}

// 返回首页
const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 16px 20px;
  position: relative;
  overflow: hidden;
}

.success-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 60%);
  pointer-events: none;
}

.success-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

/* 成功图标 - 豪华动画 */
.success-icon {
  margin-bottom: 32px;
  animation: successBounce 1.2s ease-in-out, glow 2s ease-in-out infinite alternate;
  position: relative;
}

.success-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(82, 196, 26, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes successBounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  40%, 43% {
    transform: translate3d(0, -20px, 0) scale(1.1);
  }
  70% {
    transform: translate3d(0, -10px, 0) scale(1.05);
  }
  90% {
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
}

@keyframes glow {
  0% { filter: drop-shadow(0 0 10px rgba(82, 196, 26, 0.5)); }
  100% { filter: drop-shadow(0 0 20px rgba(82, 196, 26, 0.8)); }
}

@keyframes pulseGlow {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* 成功信息 - 豪华文字效果 */
.success-info {
  margin-bottom: 40px;
  color: white;
}

.success-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 12px;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 255, 255, 0.3);
  background: linear-gradient(45deg, #fff, #f0f8ff, #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: shimmerText 3s ease-in-out infinite;
}

@keyframes shimmerText {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.success-desc {
  font-size: 18px;
  opacity: 0.95;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* VIP特权卡片 - 现代化设计 */
.privileges-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px 24px;
  margin-bottom: 32px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 1px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease 0.5s both;
}

.privileges-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  animation: gradientMove 3s ease infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.privileges-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  position: relative;
}

.privileges-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

.privileges-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(145deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.privilege-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.privilege-item:hover {
  transform: translateY(-2px);
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.privilege-item:hover::before {
  left: 100%;
}

.privilege-item span {
  font-size: 15px;
  font-weight: 600;
  color: #495057;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 快捷操作 - 豪华按钮 */
.quick-actions {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideInUp 1s ease 0.8s both;
}

.action-btn {
  height: 52px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  border-radius: 26px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:active {
  transform: translateY(1px);
}

/* 主要按钮 */
:deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border: none !important;
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.van-button--primary:active) {
  box-shadow: 
    0 4px 15px rgba(102, 126, 234, 0.4),
    0 1px 4px rgba(0, 0, 0, 0.1) !important;
}

/* 默认按钮 */
:deep(.van-button--default) {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(102, 126, 234, 0.3) !important;
  color: #667eea !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

:deep(.van-button--default:active) {
  background: rgba(255, 255, 255, 0.8) !important;
  transform: translateY(1px);
}

/* 温馨提示卡片 */
.tips-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: left;
  animation: slideInUp 1.2s ease 1s both;
}

.tips-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-title::before {
  content: '💡';
  font-size: 20px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  margin-bottom: 12px;
  padding-left: 24px;
  position: relative;
  font-size: 15px;
  color: #495057;
  line-height: 1.6;
  font-weight: 500;
}

.tips-list li::before {
  content: '✨';
  position: absolute;
  left: 0;
  top: 0;
  font-size: 16px;
  animation: sparkle 2s ease-in-out infinite;
}

.tips-list li:nth-child(2)::before {
  animation-delay: 0.5s;
}

.tips-list li:nth-child(3)::before {
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* 底部装饰 - 庆祝效果 */
.success-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 100%;
  height: 100%;
}

.confetti::before,
.confetti::after {
  content: '';
  position: absolute;
  top: -10%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: #ffd700;
  border-radius: 50%;
  animation: confettiFall 3s linear infinite;
}

.confetti::before {
  animation-delay: 0s;
  left: 20%;
  background: #ff6b6b;
}

.confetti::after {
  animation-delay: 1s;
  left: 80%;
  background: #4ecdc4;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

/* 响应式优化 */
@media (max-width: 375px) {
  .success-title {
    font-size: 28px;
  }
  
  .success-desc {
    font-size: 16px;
  }
  
  .privileges-card,
  .tips-card {
    margin-left: 8px;
    margin-right: 8px;
    padding: 20px;
  }
  
  .privileges-list {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .privilege-item {
    padding: 14px;
  }
  
  .privilege-item span {
    font-size: 14px;
  }
  
  .action-btn {
    height: 48px !important;
    font-size: 15px !important;
  }
}

/* 动画序列 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加更多装饰元素 */
.confetti::after {
  content: '🎉';
  font-size: 24px;
  position: absolute;
  top: 10%;
  left: 10%;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 星星装饰 */
.success-decoration::before {
  content: '⭐';
  position: absolute;
  font-size: 20px;
  top: 20%;
  right: 15%;
  animation: twinkle 2s ease-in-out infinite;
}

.success-decoration::after {
  content: '🌟';
  position: absolute;
  font-size: 18px;
  top: 60%;
  left: 10%;
  animation: twinkle 2.5s ease-in-out infinite reverse;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
</style> 