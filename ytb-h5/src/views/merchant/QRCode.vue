<template>
  <div class="merchant-qrcode">
    <van-nav-bar 
      title="收款码" 
      left-arrow 
      @click-left="onBack" 
      fixed
      placeholder
    />
    
    <div class="content-wrap">
      <!-- 加载状态 -->
      <div class="loading-container" v-if="loading">
        <van-loading type="spinner" size="36" color="#1989fa" />
        <div class="loading-text">加载中...</div>
      </div>
      
      <template v-else>
        <!-- 商户信息 -->
        <div class="merchant-info-card">
          <div class="merchant-info">
            <van-image
              round
              width="60"
              height="60"
              :src="merchantInfo.logo || undefined"
              :error-icon="'shop-o'"
              :show-error="true"
            />
            <div class="merchant-name">{{ merchantInfo.display_name || merchantInfo.name || '我的商户' }}</div>
            <div class="merchant-id">商户ID: {{ merchantInfo.merchant_id || '-' }}</div>
            <div class="merchant-status" v-if="merchantInfo.status === 1">
              <van-tag type="success" size="small">已认证</van-tag>
            </div>
            <div class="merchant-status" v-else>
              <van-tag type="warning" size="small">待认证</van-tag>
            </div>
          </div>
        </div>
        
        <!-- 收款码 -->
        <div class="qrcode-container">
          <div class="qrcode-card">
            <div class="qrcode-header">
              <div class="qrcode-title">商户收款码</div>
              <van-tag type="primary">永久有效</van-tag>
            </div>
            
            <div class="qrcode-wrapper">
              <div class="qrcode-bg">
                <van-image
                  width="220"
                  height="220"
                  :src="qrcodeUrl || DEFAULT_QR_CODE"
                />
              </div>
              <div class="qrcode-border"></div>
            </div>
            
            <div class="qrcode-tips">扫描上方二维码向此商户付款</div>
            
            <!-- 支付方式图标 -->
            <div class="payment-methods">
              <div class="payment-method">
                <van-image width="24" height="24" src="https://img.itapgo.com/icons/wechat-pay.png" />
                <span>微信支付</span>
              </div>
              <div class="payment-method">
                <van-image width="24" height="24" src="https://img.itapgo.com/icons/alipay.png" />
                <span>支付宝</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <van-button type="primary" icon="down" block round @click="saveQRCode">
            保存收款码
          </van-button>
          <van-button type="default" icon="share-o" block round style="margin-top: 12px" @click="showShareSheet = true">
            分享收款码
          </van-button>
        </div>
        
        <!-- 收款说明 -->
        <div class="info-card">
          <div class="card-title">
            <van-icon name="info-o" color="#1989fa" />
            <span>收款说明</span>
          </div>
          <div class="card-content">
            <van-cell-group inset>
              <van-cell title="支持支付方式" value="微信支付、支付宝" />
              <van-cell title="收款方式" value="顾客扫码支付" />
              <van-cell :title="'费率'" :value="`${merchantInfo.fee_rate || 0}%`" />
              <van-cell title="结算周期" value="T+1工作日" />
              <van-cell title="单笔限额" value="50,000元" />
            </van-cell-group>
          </div>
        </div>
        
        <!-- 分享面板 -->
        <van-share-sheet
          v-model:show="showShareSheet"
          title="分享收款码"
          :options="shareOptions"
          @select="onShareSelect"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useMerchantStore } from '@/stores/merchant'

const router = useRouter()
const merchantStore = useMerchantStore()

const DEFAULT_QR_CODE = 'https://img.itapgo.com/profile/default-qrcode.png'

const loading = ref(true)
const merchantInfo = ref({})
const qrcodeUrl = ref('')
const showShareSheet = ref(false)

const shareOptions = ref([
  { name: '复制链接', icon: 'link' },
  { name: '保存图片', icon: 'photo-o' }
])

const onBack = () => {
  router.back()
}

const loadMerchantInfo = async () => {
  loading.value = true
  try {
    const data = merchantStore.workspaceData
    if (data && data.merchantInfo) {
      merchantInfo.value = data.merchantInfo
      qrcodeUrl.value = data.merchantInfo.qrcode || DEFAULT_QR_CODE
    } else {
      const res = await merchantStore.fetchWorkspaceData()
      if (res && res.merchantInfo) {
        merchantInfo.value = res.merchantInfo
        qrcodeUrl.value = res.merchantInfo.qrcode || DEFAULT_QR_CODE
      }
    }
  } catch (error) {
    showToast('获取商户信息失败')
  } finally {
    loading.value = false
  }
}

const saveQRCode = () => {
  if (!qrcodeUrl.value) {
    showToast('收款码不存在')
    return
  }

  const link = document.createElement('a')
  link.href = qrcodeUrl.value
  link.download = `${merchantInfo.value.display_name || merchantInfo.value.name || '商户'}_收款码.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showSuccessToast('收款码已保存')
}

const onShareSelect = (option) => {
  switch (option.name) {
    case '复制链接':
      navigator.clipboard.writeText(window.location.href)
        .then(() => showSuccessToast('链接已复制'))
        .catch(() => showToast('复制失败，请手动复制'))
      break
    case '保存图片':
      saveQRCode()
      break
    default:
      showToast('暂不支持该分享方式')
  }
  showShareSheet.value = false
}

onMounted(() => {
  loadMerchantInfo()
})
</script>

<style scoped>
.merchant-qrcode {
  min-height: 100vh;
  background: linear-gradient(180deg, #4c8dff 0%, #ffffff 45%);
}

.content-wrap {
  padding: 0 16px 32px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #646566;
  margin-top: 120px;
}

.merchant-info-card {
  margin-top: 16px;
  background: #ffffff;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 12px 22px rgba(43, 109, 229, 0.1);
}

.merchant-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.merchant-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.merchant-id {
  font-size: 12px;
  color: #80848f;
}

.merchant-status {
  margin-top: 2px;
}

.qrcode-container {
  margin-top: 18px;
}

.qrcode-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 16px 28px rgba(15, 61, 145, 0.12);
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qrcode-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.qrcode-wrapper {
  position: relative;
  margin-top: 20px;
}

.qrcode-bg {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
}

.qrcode-border {
  position: absolute;
  inset: -12px;
  border-radius: 24px;
  border: 10px solid rgba(76, 141, 255, 0.2);
}

.qrcode-tips {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: #7c88a1;
}

.payment-methods {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 18px;
  font-size: 12px;
  color: #5a6475;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-buttons {
  margin-top: 20px;
}

.info-card {
  margin-top: 18px;
  background: #ffffff;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(15, 34, 67, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
}
</style>
