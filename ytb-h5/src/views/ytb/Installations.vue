<template>
  <div class="ytb-page installations-page">
    <van-nav-bar
      title="安装分佣记录"
      left-text="返回"
      right-text="推广海报"
      left-arrow
      @click-left="$router.back()"
      @click-right="showPoster = true"
    />

    <div class="page-content" v-if="loading">
      <van-loading type="spinner" vertical>加载中...</van-loading>
    </div>

    <div class="page-content" v-else>
      <!-- 汇总卡片 -->
      <div class="summary-card">
        <div class="card-title">我的推广收益</div>
        <div class="total-amount">¥{{ stats.total_reward }}</div>
        <div class="grid-columns">
          <div class="grid-item">
            <div class="num">{{ stats.total_installations }}</div>
            <div class="txt">推广安装(台)</div>
          </div>
          <div class="grid-item">
            <div class="num">{{ stats.this_month_count }}</div>
            <div class="txt">本月新增(台)</div>
          </div>
        </div>
      </div>

      <!-- 说明栏 -->
      <van-notice-bar
        left-icon="info-o"
        :scrollable="false"
        text="分享给好友安装净水器，每台最高可得360元奖励！"
      />

      <!-- 列表 -->
      <div class="list-container">
        <van-tabs v-model:active="activeTab" sticky>
          <van-tab title="安装记录">
            <van-list
              v-model:loading="listLoading"
              :finished="finished"
              finished-text="没有更多了"
              @load="onLoad"
            >
              <div class="install-item" v-for="item in list" :key="item.id">
                <div class="item-head">
                  <span class="device-no">设备: {{ item.device_number }}</span>
                  <span class="status" :class="item.status">{{ item.status_name }}</span>
                </div>
                <div class="item-info">
                  <div class="info-row">
                    <span>客户: {{ item.client_name }}</span>
                    <span>{{ item.installed_at }}</span>
                  </div>
                  <div class="reward-row">
                    <span class="label">分佣奖励</span>
                    <span class="amount">+{{ item.promoter_reward }}</span>
                  </div>
                </div>
              </div>
            </van-list>
          </van-tab>
          <!-- 预留其他Tab -->
        </van-tabs>
      </div>
    </div>

    <!-- 推广海报弹窗 -->
    <van-popup v-model:show="showPoster" closeable position="bottom" :style="{ height: '80%' }">
      <div class="poster-container">
        <div class="poster-title">长按保存海报分享</div>
        <div class="poster-preview" ref="posterRef">
          <div class="poster-bg">
            <div class="poster-header">
              <div class="app-name">亿拓宝</div>
              <div class="slogan">让每个家庭都能喝上健康好水</div>
            </div>
            <div class="poster-content">
              <div class="promo-box">
                <h3>免费安装净水器</h3>
                <p>仅需支付滤芯费用</p>
                <div class="price-tag">
                  <span>活动价</span>
                  <strong>¥0</strong>
                </div>
              </div>
              <div class="user-info">
                <span class="avatar-ph">
                   <van-icon name="manager" />
                </span>
                <span class="name">推荐人：{{ userStore.info?.name || '亿拓宝用户' }}</span>
              </div>
            </div>
            <div class="poster-footer">
              <div class="qrcode-area" ref="qrcodeRef"></div>
              <div class="tips">扫码立即预约安装</div>
            </div>
          </div>
        </div>
        <div class="poster-actions">
          <van-button type="primary" block icon="down" @click="savePoster">保存海报</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { getInstallations, getInstallationStats, getInviteCode, getLocalUser } from '@/api/ytb'
import QRCode from 'qrcode'  // 使用 qrcode 代替 qrcodejs2
import html2canvas from 'html2canvas'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 安装分佣')

const loading = ref(true)
const listLoading = ref(false)
const finished = ref(false)
const list = ref([])
const page = ref(1)
const stats = ref({
  total_reward: 0,
  total_installations: 0,
  this_month_count: 0
})
const activeTab = ref(0)
const showPoster = ref(false)
const qrcodeRef = ref(null)
const posterRef = ref(null)
const userStore = ref({ info: getLocalUser() })
const inviteCode = ref('')

const loadStats = async () => {
  try {
    const res = await getInstallationStats()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const onLoad = async () => {
  try {
    const res = await getInstallations({ page: page.value })
    if (res.code === 0) {
      if (page.value === 1) {
        list.value = res.data.list
      } else {
        list.value = [...list.value, ...res.data.list]
      }
      
      if (list.value.length >= res.data.total) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    finished.value = true
  } finally {
    listLoading.value = false
    loading.value = false
  }
}

// Generate QR Code
const generateQRCode = async () => {
    // 获取邀请码
    if (!inviteCode.value) {
        try {
            const res = await getInviteCode()
            if (res.code === 0) {
                inviteCode.value = res.data.code
            }
        } catch (e) {
            console.error('获取邀请码失败')
            return
        }
    }
    
    // 推广链接：指向注册页或着陆页，带上邀请码
    const shareUrl = `${window.location.origin}/#/register?invite_code=${inviteCode.value}`
    
    if (qrcodeRef.value) {
        qrcodeRef.value.innerHTML = ''
        try {
            // 使用 qrcode 包渲染到 canvas
            const canvas = await QRCode.toCanvas(shareUrl, {
                width: 100,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            })
            qrcodeRef.value.appendChild(canvas)
        } catch (err) {
            console.error('生成二维码失败:', err)
        }
    }
}

watch(showPoster, (val) => {
    if (val) {
        nextTick(() => {
            generateQRCode()
        })
    }
})

const savePoster = async () => {
    if (!posterRef.value) return
    
    const toast = showLoadingToast({
        message: '生成中...',
        forbidClick: true
    })
    
    try {
        const canvas = await html2canvas(posterRef.value.querySelector('.poster-bg'), {
            useCORS: true,
            scale: 2
        })
        
        const imgUrl = canvas.toDataURL('image/png')
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = imgUrl
        link.download = `亿拓宝推广海报_${new Date().getTime()}.png`
        link.click()
        
        closeToast()
        showToast('海报已生成，请长按保存')
    } catch (e) {
        console.error(e)
        closeToast()
        showToast('生成失败')
    }
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="less" scoped>
.ytb-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-content {
  padding: 16px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  
  .card-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .total-amount {
    font-size: 32px;
    font-weight: bold;
    color: #f44336;
    margin-bottom: 20px;
  }
  
  .grid-columns {
    display: flex;
    justify-content: space-around;
    
    .grid-item {
      .num {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
      .txt {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }
  }
}

.list-container {
  margin-top: 16px;
}

.install-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  
  .item-head {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 8px;
    
    .device-no {
      font-weight: 500;
    }
    
    .status {
        &.pending { color: #ff976a; }
        &.settled { color: #07c160; }
    }
  }
  
  .item-info {
    font-size: 12px;
    color: #666;
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    
    .reward-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f5f5f5;
      padding-top: 8px;
      margin-top: 8px;
      
      .amount {
        color: #f44336;
        font-size: 14px;
        font-weight: bold;
      }
    }
  }
}

// 海报样式
.poster-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
}

.poster-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
}

.poster-preview {
    width: 300px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

.poster-bg {
    width: 100%;
    background: linear-gradient(180deg, #1989fa 0%, #39b9f5 40%, #ffffff 100%);
    padding: 30px 20px;
    border-radius: 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    min-height: 480px;
    position: relative;
    
    .poster-header {
        text-align: center;
        margin-bottom: 30px;
        
        .app-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 2px;
        }
        
        .slogan {
            font-size: 14px;
            opacity: 0.9;
        }
    }
    
    .poster-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #333;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 20px;
        
        .promo-box {
            text-align: center;
            border-bottom: 1px dashed #eee;
            padding-bottom: 16px;
            width: 100%;
            margin-bottom: 16px;
            
            h3 {
                font-size: 20px;
                color: #1989fa;
                margin: 0 0 8px;
            }
            
            p {
                font-size: 12px;
                color: #666;
                margin: 0 0 12px;
            }
            
            .price-tag {
                background: #fef0f0;
                color: #f44336;
                padding: 4px 12px;
                border-radius: 20px;
                display: inline-block;
                
                span { font-size: 12px; margin-right: 4px; }
                strong { font-size: 18px; }
            }
        }
        
        .user-info {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #666;
            
            .avatar-ph {
                margin-right: 8px;
                display: flex;
                align-items: center;
            }
        }
    }
    
    .poster-footer {
        text-align: center;
        margin-top: auto;
        
        .qrcode-area {
            background: white;
            padding: 8px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: inline-block;
        }
        
        .tips {
            font-size: 12px;
            color: #333; // changed to dark because bottom bg is white-ish
        }
    }
}

.poster-actions {
    width: 100%;
}
</style>
