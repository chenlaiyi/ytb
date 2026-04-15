<template>
  <transition name="popup-fade">
    <div class="success-popup-container" v-if="show" @click="tryPlayAudio">
      <!-- 渐变高斯模糊背景 -->
      <div class="success-popup-bg"></div>
      <div class="success-popup-body">
        <!-- 顶部烟花动画（SVG/CSS） -->
        <div class="fireworks-ani">
          <svg width="120" height="60" viewBox="0 0 120 60">
            <circle cx="30" cy="30" r="8" fill="#ffd700" opacity="0.7">
              <animate attributeName="r" values="8;20;8" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="90" cy="20" r="6" fill="#ff9500" opacity="0.6">
              <animate attributeName="r" values="6;16;6" dur="1.1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <!-- 右上角关闭按钮 -->
        <div class="close-btn" @click="closePopup">
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="#999" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <!-- VIP勋章大图标 -->
        <div class="crown-container">
          <div class="crown-box">
            <Icon name="diamond" size="60" color="#ffd700" />
            <div class="halo"></div>
          </div>
        </div>
        <div class="success-title">
          <div class="congrats">恭喜您！</div>
          <div class="main-title">成功升级为点点够VIP</div>
        </div>
        <!-- 权益卡片 -->
        <div class="benefits-cards">
          <div class="benefit-card">
            <Icon name="coupon-o" size="28" color="#ff3b30" />
            <div class="card-content">
              <div class="card-title">980元购机</div>
              <div class="card-desc">原价3980元净水器，VIP专享7折特惠</div>
            </div>
          </div>
          <div class="benefit-card">
            <Icon name="cash-back-record" size="28" color="#ff9500" />
            <div class="card-content">
              <div class="card-title">30%推荐提成</div>
              <div class="card-desc">推荐客户充值/续费均享高额提成</div>
            </div>
          </div>
          <div class="benefit-card">
            <Icon name="balance-pay" size="28" color="#ff2d55" />
            <div class="card-content">
              <div class="card-title">月度分红</div>
              <div class="card-desc">每月招商分红、充值分红双重收益</div>
            </div>
          </div>
        </div>
        <!-- 倒计时大号数字+进度条 -->
        <div class="countdown-visual">
          <div class="countdown-big">{{ countdown }}</div>
          <div class="progress-bar">
            <div class="progress-inner" :style="{width: (100 * (totalCountdown-countdown+1)/totalCountdown) + '%'}"></div>
          </div>
          <div class="countdown-tip">请耐心等待支付结果确认</div>
        </div>
        <!-- 底部按钮 -->
        <div class="popup-footer">
          <div class="go-vip-btn" :class="{disabled: !canClick}" @click="handleGoVip">
            立即体验VIP特权
          </div>
          <div class="footer-tip" v-if="!canClick">正在确认支付结果，请稍候...</div>
          <div class="footer-tip" v-else>支付成功，点击进入VIP中心</div>
        </div>
        <!-- 金币装饰 -->
        <div class="coin coin1"></div>
        <div class="coin coin2"></div>
        <div class="coin coin3"></div>
        <div class="coin coin4"></div>
        <!-- 音效 -->
        <audio ref="audioRef" src="/sounds/vip-success.mp3" preload="auto"></audio>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Icon } from 'vant'
import { queryOrderStatus } from '@/api/order'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  show: Boolean,
  orderNo: String // 传入订单号
})
const emit = defineEmits(['update:show', 'go-to-vip'])

const totalCountdown = 30 // 倒计时总秒数
const countdown = ref(totalCountdown)
let timer = null
let polling = null
const audioRef = ref(null)
const canClick = ref(false)
const audioBlocked = ref(false)
const userStore = useUserStore()

const tryPlayAudio = () => {
  if (audioRef.value) {
    audioRef.value.play().then(() => {
      audioBlocked.value = false
    }).catch(() => {
      audioBlocked.value = true
    })
  }
}

const handleGoVip = () => {
  if (!canClick.value) return
  emit('go-to-vip')
  emit('update:show', false)
}
const closePopup = () => {
  emit('update:show', false)
}

// 轮询订单和用户VIP状态
const pollStatus = async () => {
  if (!props.orderNo) return
  polling && clearInterval(polling)
  polling = setInterval(async () => {
    try {
      const orderRes = await queryOrderStatus(props.orderNo)
      await userStore.fetchUserInfo({forceRefresh:true})
      if (orderRes && orderRes.code === 0 && orderRes.data &&
        (orderRes.data.status === 'paid' || orderRes.data.status === 'completed' || orderRes.data.status === 1 || orderRes.data.status === '1') &&
        userStore.userInfo?.is_vip === 1
      ) {
        canClick.value = true
        clearInterval(polling)
      } else {
        canClick.value = false
      }
    } catch(e) {
      canClick.value = false
    }
  }, 2000)
}

watch(() => props.show, (val) => {
  if (val) {
    countdown.value = totalCountdown
    canClick.value = false
    nextTick(() => {
      tryPlayAudio()
    })
    timer = setInterval(() => {
      if (countdown.value > 1) {
        countdown.value--
      } else {
        clearInterval(timer)
        // 倒计时到零时：播放音效并允许点击按钮
        tryPlayAudio()
        canClick.value = true
      }
    }, 1000)
    pollStatus()
  } else {
    clearInterval(timer)
    clearInterval(polling)
  }
})
onBeforeUnmount(() => { clearInterval(timer); clearInterval(polling) })
</script>

<style scoped>
.success-popup-container {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.success-popup-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at 60% 20%, #fffbe6 60%, #ffe066 100%, #fff9e6 120%);
  filter: blur(2px);
  z-index: 1;
}
.success-popup-body {
  position: relative; z-index: 2;
  width: 95vw; max-width: 420px; min-height: 520px;
  background: rgba(255,255,255,0.98);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(255,215,0,0.18);
  padding: 0 0 24px 0;
  overflow: hidden;
  display: flex; flex-direction: column; align-items: center;
  animation: popupIn 0.5s;
}
@keyframes popupIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.fireworks-ani {
  width: 100%; height: 70px; display: flex; align-items: flex-start; justify-content: center; margin-top: 10px;
}
.close-btn {
  position: absolute; top: 18px; right: 18px; z-index: 10;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.7); border-radius: 50%; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.2s;
}
.close-btn:hover { background: #fff; }
.crown-container { display: flex; justify-content: center; margin-top: 0; margin-bottom: 10px; }
.crown-box { position: relative; width: 100px; height: 100px; background: radial-gradient(circle, #fffbe6 60%, #ffd70022 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 32px #ffd70044; }
.crown-box .halo { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, #ffd70055 40%, transparent 80%); z-index: 0; animation: haloPulse 2s infinite; }
@keyframes haloPulse { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
.success-title { text-align: center; margin-bottom: 10px; }
.congrats { color: #e63946; font-size: 32px; font-weight: bold; margin-bottom: 5px; text-shadow: 1px 1px 8px #ffd70044; }
.main-title { color: #333; font-size: 22px; font-weight: bold; }
.benefits-cards { width: 90%; margin: 0 auto 18px auto; display: flex; flex-direction: column; gap: 16px; }
.benefit-card { display: flex; align-items: center; background: linear-gradient(90deg, #fffbe6 60%, #ffe066 100%); border-radius: 16px; box-shadow: 0 2px 12px #ffd70022; padding: 16px 18px; }
.benefit-card .card-content { margin-left: 14px; }
.card-title { font-size: 18px; font-weight: bold; color: #e63946; margin-bottom: 2px; }
.card-desc { color: #666; font-size: 14px; }
.countdown-visual { text-align: center; margin: 18px 0 10px 0; }
.countdown-big { font-size: 48px; color: #e63946; font-weight: bold; margin-bottom: 8px; letter-spacing: 2px; text-shadow: 0 2px 8px #ffd70044; }
.progress-bar { width: 80%; height: 10px; background: #f0e6c0; border-radius: 6px; margin: 0 auto 8px auto; overflow: hidden; }
.progress-inner { height: 100%; background: linear-gradient(90deg, #ffd700, #ff9500); border-radius: 6px; transition: width 0.5s; }
.countdown-tip { color: #ff9500; font-size: 15px; margin-top: 6px; }
.popup-footer { margin-top: auto; padding: 8px 10px 0 10px; background: none; border-top: none; width: 100%; display: flex; flex-direction: column; align-items: center; }
.go-vip-btn { width: 90%; background: linear-gradient(90deg, #ffd700, #ff9500); color: white; font-size: 20px; font-weight: bold; padding: 16px 0; border-radius: 32px; text-align: center; box-shadow: 0 5px 15px #ffd70044; animation: pulse 2s infinite; cursor: pointer; margin-bottom: 32px; transition: opacity 0.2s; }
.go-vip-btn.disabled { opacity: 0.5; pointer-events: none; }
@keyframes pulse { 0%{transform:scale(1);box-shadow:0 5px 15px #ffd70044;} 50%{transform:scale(1.05);box-shadow:0 5px 20px #ffd70066;} 100%{transform:scale(1);box-shadow:0 5px 15px #ffd70044;} }
.footer-tip { color: #999; font-size: 15px; margin-top: 2px; text-align: center; }
.coin { position: absolute; width: 20px; height: 20px; background: radial-gradient(circle, #ffd700, #ff9500); border-radius: 50%; box-shadow: 0 0 10px #ffd700; opacity: 0.7; animation: float 3s infinite; }
.coin1 { top: 20%; left: 25%; animation-duration: 2.5s; }
.coin2 { top: 40%; right: 20%; animation-duration: 3.5s; animation-delay: 0.5s; }
.coin3 { bottom: 30%; left: 15%; animation-duration: 3s; animation-delay: 1s; }
.coin4 { bottom: 40%; right: 25%; animation-duration: 4s; animation-delay: 1.5s; }
@keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-15px);} }
</style>
