<template>
  <div class="invite-water-container">
    <van-nav-bar
      title="邀请取水"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="page-content">
      <!-- 功能介绍卡片 -->
      <div class="intro-card">
        <div class="intro-header">
          <van-icon name="drop" size="32" color="#1989fa" />
          <h3>邀请取水功能</h3>
        </div>
        <div class="intro-content">
          <p>• 生成专属邀请码，推广取水服务</p>
          <p>• 新用户扫码注册后，由后台管理员配置取水天数</p>
          <p>• 取水天数默认为一个月（30天），用完后需重新配置</p>
          <p>• 建立推荐关系，获得推广收益</p>
        </div>
      </div>

      <!-- 邀请码卡片 -->
      <div class="invite-card">
        <div class="card-header">
          <h3>我的邀请码</h3>
          <van-button 
            type="primary" 
            size="small" 
            @click="generateInviteCodeAction"
            :loading="generating"
          >
            {{ inviteCode ? '重新生成' : '生成邀请码' }}
          </van-button>
        </div>
        
        <div class="invite-content" v-if="inviteCode">
          <!-- 邀请码显示 -->
          <div class="code-display">
            <div class="code-label">邀请码</div>
            <div class="code-value" @click="copyInviteCode">
              {{ inviteCode }}
              <van-icon name="copy" />
            </div>
          </div>
          
          <!-- 二维码显示 -->
          <div class="qr-section">
            <div class="qr-header">
              <span>邀请二维码</span>
              <van-button 
                type="default" 
                size="mini" 
                @click="saveQRCode"
                :loading="saving"
              >
                保存图片
              </van-button>
            </div>
            <div class="qr-container" ref="qrContainer">
              <canvas ref="qrCanvas" :width="qrSize" :height="qrSize"></canvas>
              <div class="qr-tips">
                <p>新用户扫码注册后由管理员配置取水天数</p>
                <p>取水天数默认有效期：30天</p>
              </div>
            </div>
          </div>
          
          <!-- 邀请链接 -->
          <div class="link-section">
            <div class="link-label">邀请链接</div>
            <div class="link-value" @click="copyInviteLink">
              {{ inviteLink }}
              <van-icon name="copy" />
            </div>
          </div>
        </div>
        
        <div class="empty-state" v-else>
          <van-icon name="qr-invalid" size="64" color="#ddd" />
          <p>点击上方按钮生成邀请码</p>
        </div>
      </div>

      <!-- 邀请统计 -->
      <div class="stats-card" v-if="inviteCode">
        <div class="card-header">
          <h3>邀请统计</h3>
          <span class="update-time">更新时间：{{ lastUpdateTime }}</span>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.totalInvites || 0 }}</div>
            <div class="stat-label">总邀请数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.todayInvites || 0 }}</div>
            <div class="stat-label">今日邀请</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.successInvites || 0 }}</div>
            <div class="stat-label">成功注册</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ inviteStats.activeUsers || 0 }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
      </div>

      <!-- 最近邀请记录 -->
      <div class="records-card" v-if="inviteRecords.length > 0">
        <div class="card-header">
          <h3>最近邀请记录</h3>
          <router-link to="/branch/salesman/invite-records" class="view-all">
            查看全部
          </router-link>
        </div>
        <div class="records-list">
          <div 
            v-for="record in inviteRecords.slice(0, 5)" 
            :key="record.id"
            class="record-item"
          >
            <div class="record-avatar">
              <img :src="record.avatar || '/default-avatar.png'" alt="用户头像" />
            </div>
            <div class="record-info">
              <div class="record-name">{{ record.name || record.phone }}</div>
              <div class="record-time">{{ formatTime(record.created_at) }}</div>
            </div>
            <div class="record-status">
              <van-tag 
                :type="getStatusType(record.status)" 
                size="small"
              >
                {{ getStatusText(record.status) }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作说明 -->
      <div class="help-card">
        <div class="card-header">
          <h3>使用说明</h3>
        </div>
        <div class="help-content">
          <div class="help-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>生成邀请码</h4>
              <p>点击"生成邀请码"按钮，系统会为您创建专属的邀请码和二维码</p>
            </div>
          </div>
          <div class="help-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>分享给用户</h4>
              <p>将邀请码或二维码分享给潜在用户，他们可以通过扫码注册</p>
            </div>
          </div>
          <div class="help-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>用户注册</h4>
              <p>新用户扫码后需要填写真实姓名和手机号完成注册</p>
            </div>
          </div>
          <div class="help-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>配置取水天数</h4>
              <p>注册成功后，管理员为新用户配置取水天数，默认30天有效期</p>
            </div>
          </div>
          <div class="help-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <h4>扫码取水</h4>
              <p>用户在有剩余天数时可扫码取水，天数不足时无法取水</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import QRCode from 'qrcode'
import { generateInviteCode, getMyInvites, getInviteStats } from '@/api/inviteWater'

const router = useRouter()

// 响应式数据
const generating = ref(false)
const saving = ref(false)
const inviteCode = ref('')
const inviteLink = ref('')
const qrSize = ref(200)
const lastUpdateTime = ref('')

// 邀请统计
const inviteStats = reactive({
  totalInvites: 0,
  todayInvites: 0,
  successInvites: 0,
  activeUsers: 0
})

// 邀请记录
const inviteRecords = ref([])

// DOM引用
const qrContainer = ref(null)
const qrCanvas = ref(null)

// 生成邀请码
const generateInviteCodeAction = async () => {
  try {
    generating.value = true
    
    // 获取用户信息和分支机构代码
    const userInfo = JSON.parse(localStorage.getItem('branch_userInfo') || '{}')
    const branchCode = localStorage.getItem('branch_code') || 'YXY01'
    // 从多个来源获取用户ID，确保能找到
    const userId = userInfo.user_id || userInfo.id || userInfo.userId || localStorage.getItem('user_id')
    
    // 详细调试信息
    console.log('=== 邀请取水调试信息 ===')
    console.log('branch_userInfo:', userInfo)
    console.log('branch_code:', branchCode)
    console.log('user_id来源:', {
      'userInfo.user_id': userInfo.user_id,
      'userInfo.id': userInfo.id,
      'userInfo.userId': userInfo.userId,
      'localStorage.user_id': localStorage.getItem('user_id'),
      '最终userId': userId
    })
    console.log('localStorage所有相关数据:', {
      'branch_userInfo': localStorage.getItem('branch_userInfo'),
      'branch_code': localStorage.getItem('branch_code'),
      'user_id': localStorage.getItem('user_id'),
      'auth_token': localStorage.getItem('auth_token'),
      'token': localStorage.getItem('token')
    })
    console.log('生成邀请码API参数:', { user_id: userId, branch_code: branchCode, invite_type: 'water_checkin' })
    
    if (!userId) {
      console.error('无法获取用户ID，无法生成邀请码')
      showFailToast('请先登录')
      return
    }

    // 调用API生成邀请码
    const response = await generateInviteCode({
      user_id: userId,
      branch_code: branchCode,
      invite_type: 'water_checkin' // 标识为取水签到邀请
    })

    if (response.code === 0) {
      inviteCode.value = response.data.invite_code
      inviteLink.value = response.data.invite_link
      
      // 保存邀请码到localStorage，避免每次都需要重新生成
      localStorage.setItem('current_invite_code', response.data.invite_code)
      localStorage.setItem('current_invite_link', response.data.invite_link)
      localStorage.setItem('invite_expires_at', response.data.expires_at || '')
      
      // 生成二维码
      await generateQRCode()
      
      // 更新统计数据
      await fetchInviteStats()
      
      showSuccessToast('邀请码生成成功')
    } else {
      showFailToast(response.message || '生成失败')
    }
  } catch (error) {
    console.error('生成邀请码失败:', error)
    showFailToast('生成失败，请重试')
  } finally {
    generating.value = false
  }
}

// 生成二维码
const generateQRCode = async () => {
  if (!inviteLink.value || !qrCanvas.value) return
  
  try {
    await QRCode.toCanvas(qrCanvas.value, inviteLink.value, {
      width: qrSize.value,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

// 复制邀请码
const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    showSuccessToast('邀请码已复制')
  } catch (error) {
    // 降级处理
    const textArea = document.createElement('textarea')
    textArea.value = inviteCode.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showSuccessToast('邀请码已复制')
  }
}

// 复制邀请链接
const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    showSuccessToast('邀请链接已复制')
  } catch (error) {
    // 降级处理
    const textArea = document.createElement('textarea')
    textArea.value = inviteLink.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showSuccessToast('邀请链接已复制')
  }
}

// 保存二维码
const saveQRCode = async () => {
  if (!qrCanvas.value) return
  
  try {
    saving.value = true
    
    // 将canvas转为图片
    const dataURL = qrCanvas.value.toDataURL('image/png')
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `邀请取水二维码_${inviteCode.value}.png`
    link.href = dataURL
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showSuccessToast('二维码已保存')
  } catch (error) {
    console.error('保存二维码失败:', error)
    showFailToast('保存失败')
  } finally {
    saving.value = false
  }
}

// 获取邀请统计
const fetchInviteStats = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('branch_userInfo') || '{}')
    const branchCode = localStorage.getItem('branch_code') || 'YXY01'
    // 从多个来源获取用户ID，确保能找到
    const userId = userInfo.user_id || userInfo.id || userInfo.userId || localStorage.getItem('user_id')
    
    console.log('邀请统计API参数:', { user_id: userId, branch_code: branchCode })
    
    if (!userId) {
      console.error('无法获取用户ID，无法获取邀请统计')
      return
    }

    const response = await getInviteStats({
      user_id: userId,
      branch_code: branchCode
    })

    if (response.code === 0) {
      Object.assign(inviteStats, response.data.stats)
      inviteRecords.value = response.data.recent_records || []
      lastUpdateTime.value = new Date().toLocaleString()
    }
  } catch (error) {
    console.error('获取邀请统计失败:', error)
  }
}

// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'registered': 'success',
    'expired': 'danger'
  }
  return typeMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待注册',
    'registered': '已注册',
    'expired': '已过期'
  }
  return textMap[status] || '未知'
}

// 模拟API函数（实际应该在api文件中）
const generateInviteCodeAPI = async (data) => {
  // 模拟API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      const code = 'IW' + Date.now().toString().slice(-6)
      resolve({
        code: 0,
        message: '成功',
        data: {
          invite_code: code,
          invite_link: `https://pay.itapgo.com/app/#/invite-water-register/${code}`
        }
      })
    }, 1000)
  })
}

const getInviteStatsAPI = async (data) => {
  // 模拟API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '成功',
        data: {
          stats: {
            totalInvites: 12,
            todayInvites: 3,
            successInvites: 8,
            activeUsers: 5
          },
          recent_records: [
            {
              id: 1,
              name: '张三',
              phone: '138****5678',
              avatar: '',
              status: 'registered',
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 2,
              name: '李四',
              phone: '139****9876',
              avatar: '',
              status: 'pending',
              created_at: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        }
      })
    }, 500)
  })
}

onMounted(() => {
  // 页面加载时检查是否已有邀请码
  const storedCode = localStorage.getItem('current_invite_code')
  const storedLink = localStorage.getItem('current_invite_link')
  const expiresAt = localStorage.getItem('invite_expires_at')
  
  if (storedCode) {
    // 检查邀请码是否过期
    const isExpired = expiresAt && new Date(expiresAt) < new Date()
    
    if (isExpired) {
      // 清除过期的邀请码
      localStorage.removeItem('current_invite_code')
      localStorage.removeItem('current_invite_link')
      localStorage.removeItem('invite_expires_at')
    } else {
      // 使用存储的邀请码和链接
      inviteCode.value = storedCode
      inviteLink.value = storedLink || `https://pay.itapgo.com/app/#/invite-water-register/${storedCode}`
      
      nextTick(() => {
        generateQRCode()
        fetchInviteStats()
      })
    }
  }
})
</script>

<style scoped>
/* 导航栏样式优化 */
:deep(.van-nav-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.van-nav-bar__title) {
  color: white !important;
  font-weight: 600;
  font-size: 18px;
}

:deep(.van-nav-bar__left) {
  color: white !important;
}

:deep(.van-nav-bar__text) {
  color: white !important;
  font-weight: 500;
}

:deep(.van-icon) {
  color: white !important;
}

/* 增强返回按钮可见性 */
:deep(.van-nav-bar__left) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  margin-left: 8px;
  padding: 4px 8px;
  transition: all 0.3s ease;
}

:deep(.van-nav-bar__left:active) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.invite-water-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  padding: 16px;
  padding-bottom: 32px;
}

/* 通用卡片样式 */
.intro-card,
.invite-card,
.stats-card,
.records-card,
.help-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

/* 功能介绍卡片 */
.intro-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.intro-header h3 {
  margin: 0;
  font-size: 18px;
  color: #323233;
}

.intro-content {
  padding: 16px;
}

.intro-content p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 邀请码卡片 */
.invite-content {
  padding: 16px;
}

.code-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.code-label {
  font-size: 14px;
  color: #666;
}

.code-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1989fa;
  cursor: pointer;
}

.qr-section {
  margin-bottom: 16px;
}

.qr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.qr-container {
  text-align: center;
}

.qr-tips {
  margin-top: 12px;
}

.qr-tips p {
  margin: 4px 0;
  font-size: 12px;
  color: #999;
}

.link-section {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.link-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.link-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #1989fa;
  word-break: break-all;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
}

.empty-state p {
  margin: 12px 0 0;
  color: #999;
  font-size: 14px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.update-time {
  font-size: 12px;
  color: #999;
}

/* 记录列表 */
.records-list {
  padding: 0 16px 16px;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.record-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.view-all {
  color: #1989fa;
  font-size: 14px;
  text-decoration: none;
}

/* 帮助说明 */
.help-content {
  padding: 16px;
}

.help-step {
  display: flex;
  margin-bottom: 16px;
}

.help-step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #1989fa;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 4px;
  font-size: 14px;
  color: #323233;
}

.step-content p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 快捷操作图标样式 */
.quick-icon.invite-water {
  background: linear-gradient(45deg, #409eff, #67c23a);
}
</style> 