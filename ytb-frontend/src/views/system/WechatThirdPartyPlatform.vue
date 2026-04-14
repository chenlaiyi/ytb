<template>
  <div class="wechat-third-party-platform">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>微信第三方平台设置</h2>
    </div>

    <!-- 配置说明 -->
    <el-card class="info-card">
      <div class="info-content">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <div class="info-text">
          <h4>仅支持授权商家业务</h4>
          <p>启用第三方平台后支持微信公众号、小程序授权信息同步，支持工作台使用一键授权效率可明显提升微信营销配置后点击测试连接，成功打开微信授权页面即配置成功，请务必确保配置成功</p>
        </div>
      </div>
    </el-card>

    <!-- 配置表单 -->
    <el-card class="config-card">
      <el-form 
        ref="configForm" 
        :model="config" 
        :rules="rules" 
        label-width="150px"
        label-position="left"
        @input="markAsChanged"
      >
        <el-form-item label="AppId" prop="app_id" required>
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.app_id" 
              placeholder="微信开放平台AppId"
              readonly
              style="width: 300px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.app_id)">复制</el-button>
          </div>
          <div class="form-tip">
            微信开放平台提供的固定AppId，请勿修改
          </div>
        </el-form-item>

        <el-form-item label="AppSecret" prop="app_secret" required>
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.app_secret" 
              type="password" 
              show-password
              placeholder="微信开放平台AppSecret"
              readonly
              style="width: 400px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.app_secret)">复制</el-button>
          </div>
          <div class="form-tip">
            微信开放平台提供的固定AppSecret，请勿修改
          </div>
        </el-form-item>

        <!-- 微信开放平台接入重要参数 -->
        <el-divider content-position="left">微信开放平台接入重要参数</el-divider>

        <el-form-item label="授权发起页域名">
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.auth_domain" 
              placeholder="例如：pay.itapgo.com"
              @input="markAsChanged"
              style="width: 250px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.auth_domain)">复制</el-button>
          </div>
          <div class="form-tip">
            必须与当前网站域名一致，否则无法正常授权
          </div>
        </el-form-item>

        <el-form-item label="授权事件接收URL" required>
          <div class="form-item-wrapper">
            <el-input 
              :value="authEventUrl" 
              readonly
              placeholder="系统自动生成"
              style="width: 500px;"
            />
            <el-button type="primary" link @click="copyToClipboard(authEventUrl)">复制</el-button>
          </div>
          <div class="form-tip">
            接收授权、取消授权、授权更新等事件推送
          </div>
        </el-form-item>

        <el-form-item label="授权事件推送URL">
          <div class="form-item-wrapper">
            <el-input 
              :value="authEventUrl" 
              readonly
              placeholder="与授权事件接收URL相同"
              style="width: 500px;"
            />
            <el-button type="primary" link @click="copyToClipboard(authEventUrl)">复制</el-button>
          </div>
          <div class="form-tip">
            与授权事件接收URL设置为相同地址
          </div>
        </el-form-item>

        <el-form-item label="公众号消息校验Token" prop="token" required>
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.token" 
              placeholder="系统自动生成"
              readonly
              style="width: 250px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.token)">复制</el-button>
            <el-button type="default" @click="generateTokenAndKey">重新生成</el-button>
          </div>
          <div class="form-tip">
            首次使用时系统自动生成Token并保存，与公众号接入设置一致，必须为英文或数字，长度为3-32字符
          </div>
        </el-form-item>

        <el-form-item label="公众号消息加密解密Key" prop="encoding_aes_key" required>
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.encoding_aes_key" 
              placeholder="系统自动生成的43位字符串"
              readonly
              style="width: 350px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.encoding_aes_key)">复制</el-button>
          </div>
          <div class="form-tip">
            首次使用时系统自动生成加密解密Key并保存，与公众号接入设置一致，长度固定为43个字符，用于检验消息体签名
          </div>
        </el-form-item>

        <el-form-item label="公众号消息与事件接收URL">
          <div class="form-item-wrapper">
            <el-input 
              :value="messageEventUrl" 
              readonly
              placeholder="系统自动生成"
              style="width: 500px;"
            />
            <el-button type="primary" link @click="copyToClipboard(messageEventUrl)">复制</el-button>
          </div>
          <div class="form-tip">
            接收公众号的消息和事件推送，$APPID$ 会被替换为具体的公众号AppID
          </div>
        </el-form-item>

        <el-form-item label="网页开发域名">
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.web_domain" 
              placeholder="例如：pay.itapgo.com"
              @input="markAsChanged"
              style="width: 250px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.web_domain)">复制</el-button>
          </div>
          <div class="form-tip">
            用于网页授权获取用户信息，一般与授权发起页域名相同
          </div>
        </el-form-item>

        <!-- 前端开发小程序 -->
        <el-divider content-position="left">前端开发小程序</el-divider>
        
        <el-form-item label="开发小程序AppID">
          <div class="form-item-wrapper">
            <el-input 
              v-model="config.mini_program_appid" 
              placeholder="如果需要开发小程序，请填写小程序AppID"
              @input="markAsChanged"
              style="width: 300px;"
            />
            <el-button type="primary" link @click="copyToClipboard(config.mini_program_appid)">复制</el-button>
          </div>
          <div class="form-tip">
            授权给第三方的小程序，如果需要开发小程序请填写，否则留空
          </div>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="generateTokenAndKey">重新生成Token和密钥</el-button>
        <el-button 
          type="primary" 
          @click="saveConfig"
          :loading="saving"
        >
          保存配置
        </el-button>
        <el-button @click="testConnection" :loading="testing">测试连接</el-button>
        <el-button @click="checkTicketStatus" :loading="checkingTicket" type="warning">检查票据状态</el-button>
      </div>
    </el-card>

    <!-- 授权管理区域 -->
    <el-card class="auth-card" v-if="config.app_id && config.app_secret">
      <template #header>
        <div class="card-header">
          <span>公众号授权</span>
          <el-button type="primary" size="small" @click="generateAuthUrl" :loading="loading">
            生成授权链接
          </el-button>
        </div>
      </template>

      <div class="auth-section" v-if="authUrls.pc">
        <div class="auth-item">
          <el-input 
            v-model="authUrls.pc" 
            readonly 
            placeholder="授权链接"
          >
            <template #append>
              <el-button @click="copyToClipboard(authUrls.pc)">
                复制
              </el-button>
            </template>
          </el-input>
          <div class="auth-actions" style="margin-top: 8px;">
            <el-button size="small" @click="openUrl(authUrls.pc)">
              打开链接
            </el-button>
            <el-button size="small" @click="showQrCode('pc')">
              扫码授权
            </el-button>
          </div>
        </div>
      </div>

      <!-- 已授权公众号列表 -->
      <div class="authorized-accounts" v-if="authorizedAccounts.length > 0">
        <h4>已授权公众号</h4>
        <el-table :data="authorizedAccounts" stripe size="small">
          <el-table-column prop="authorizer_appid" label="AppID" width="200" />
          <el-table-column prop="nick_name" label="公众号名称" />
          <el-table-column prop="head_img" label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :src="row.head_img" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="service_type_info" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">
                {{ getServiceType(row.service_type_info) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="verify_type_info" label="认证状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.verify_type_info === 0 ? 'success' : 'info'" size="small">
                {{ row.verify_type_info === 0 ? '已认证' : '未认证' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="authorized_at" label="授权时间" width="160" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="refreshToken(row.authorizer_appid)">
                刷新Token
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 二维码对话框 -->
    <el-dialog v-model="qrCodeDialog.visible" title="扫码授权" width="320px" center>
      <div class="qr-code-container">
        <div id="qrcode" ref="qrCodeRef"></div>
        <p class="qr-tip">微信扫码授权</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { 
  getWechatThirdPartyPlatformConfig,
  saveWechatThirdPartyPlatformConfig,
  generateWechatAuthUrl,
  getWechatAuthorizedAccounts,
  refreshWechatAuthorizerToken
} from '@/api/wechatThirdPartyPlatforms'

// 响应式数据
const configForm = ref()
const qrCodeRef = ref()
const saving = ref(false)
const testing = ref(false)
const hasChanges = ref(false)
const loading = ref(false)
const checkingTicket = ref(false)

// 配置数据
const config = reactive({
  id: null,
  app_id: 'wx542eec58a75fe9e2',
  app_secret: 'deafe5962c8fecdcdb25e859e8d57c88',
  token: '',
  encoding_aes_key: '',
  auth_domain: 'pay.itapgo.com', // 默认当前域名
  web_domain: 'pay.itapgo.com',  // 默认当前域名
  mini_program_appid: ''
})

// 授权链接
const authUrls = reactive({
  pc: '',
  h5: ''
})

// 已授权公众号
const authorizedAccounts = ref([])

// 票据状态信息
const ticketStatusInfo = ref(null)

// 二维码对话框
const qrCodeDialog = reactive({
  visible: false,
  type: 'pc'
})

// 表单验证规则
const rules = {
  app_id: [
    { required: true, message: '请输入第三方平台AppId', trigger: 'blur' }
  ],
  app_secret: [
    { required: true, message: '请输入第三方平台AppSecret', trigger: 'blur' }
  ],
  token: [
    { required: true, message: 'Token不能为空', trigger: 'blur' }
  ],
  encoding_aes_key: [
    { required: true, message: '消息加解密Key不能为空', trigger: 'blur' },
    { len: 43, message: '消息加解密Key长度必须为43位', trigger: 'blur' }
  ]
}

// 计算属性
const authEventUrl = computed(() => {
  // 使用实际的平台ID，这里假设为1（第一个配置）
  return `https://pay.itapgo.com/wechat-third-party/1/event-push`
})

const messageEventUrl = computed(() => {
  // 使用实际的平台ID，这里假设为1（第一个配置）
  return `https://pay.itapgo.com/wechat-third-party/1/message/$APPID$`
})

// 方法
const markAsChanged = () => {
  hasChanges.value = true
}

// 生成随机字符串
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成Token和密钥（手动点击重新生成）
const generateTokenAndKey = async () => {
  try {
    // 询问用户是否确认重新生成
    await ElMessageBox.confirm(
      '重新生成Token和密钥后，需要同步更新微信开放平台的配置，确认继续吗？',
      '确认重新生成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    config.token = generateRandomString(32)
    config.encoding_aes_key = generateRandomString(43)
    
    // 直接保存到数据库
    const response = await saveWechatThirdPartyPlatformConfig(config)
    
    if (response.code === 0) {
      hasChanges.value = false
      ElMessage.success('Token和密钥已重新生成并保存')
    } else {
      ElMessage.error('保存Token和密钥失败：' + (response.message || '未知错误'))
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消重新生成')
    } else {
      console.error('重新生成Token和密钥失败:', error)
      ElMessage.error('重新生成Token和密钥失败')
    }
  }
}

// 生成Token和密钥并自动保存
const generateAndSaveTokenAndKey = async () => {
  try {
    config.token = generateRandomString(32)
    config.encoding_aes_key = generateRandomString(43)
    
    // 直接保存到数据库
    const response = await saveWechatThirdPartyPlatformConfig(config)
    
    if (response.code === 0) {
      hasChanges.value = false
      ElMessage.success('Token和密钥已自动生成并保存')
    } else {
      ElMessage.error('保存Token和密钥失败：' + (response.message || '未知错误'))
    }
  } catch (error) {
    console.error('生成并保存Token和密钥失败:', error)
    ElMessage.error('生成并保存Token和密钥失败')
  }
}

const loadConfig = async () => {
  try {
    loading.value = true
    const response = await getWechatThirdPartyPlatformConfig()
    if (response.code === 0 && response.data) {
      // 保存固定的AppID和AppSecret
      const fixedAppId = config.app_id
      const fixedAppSecret = config.app_secret
      
      Object.assign(config, response.data)
      
      // 确保AppID和AppSecret保持固定值不变
      config.app_id = fixedAppId
      config.app_secret = fixedAppSecret
      
      hasChanges.value = false
      // 如果有配置，加载授权公众号列表
      await loadAuthorizedAccounts()
      
      // 如果从数据库加载的配置中Token或密钥为空，则生成并保存
      if (!response.data.token || !response.data.encoding_aes_key) {
        await generateAndSaveTokenAndKey()
      }
    } else {
      // 如果没有配置数据，生成默认值并保存
      await generateAndSaveTokenAndKey()
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    // 如果是404错误，说明还没有配置，自动生成Token和密钥
    if (error.response?.status === 404) {
      await generateAndSaveTokenAndKey()
    }
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  try {
    await configForm.value.validate()
    saving.value = true
    
    const response = await saveWechatThirdPartyPlatformConfig(config)
    
    if (response.code === 0) {
      ElMessage.success('配置保存成功')
      hasChanges.value = false
      await loadAuthorizedAccounts()
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  if (!config.app_id || !config.app_secret) {
    ElMessage.warning('请先填写AppId和AppSecret')
    return
  }
  
  try {
    testing.value = true
    // 尝试生成授权链接来测试连接
    const response = await generateWechatAuthUrl('pc')
    if (response.code === 0) {
      ElMessage.success('连接测试成功')
      // 打开授权页面
      if (response.data?.auth_url) {
        window.open(response.data.auth_url, '_blank')
      }
    } else {
      // 显示详细的错误信息
      let errorMsg = response.message || '未知错误'
      if (response.data?.error_detail) {
        errorMsg += '：' + response.data.error_detail
      }
      ElMessage.error('连接测试失败：' + errorMsg)
    }
  } catch (error) {
    console.error('连接测试失败:', error)
    // 尝试从错误对象中提取详细错误信息
    let errorMsg = '连接测试失败'
    if (error.response?.data?.error_detail) {
      errorMsg += '：' + error.response.data.error_detail
    } else if (error.message) {
      errorMsg = error.message
    }
    ElMessage.error(errorMsg)
  } finally {
    testing.value = false
  }
}

const generateAuthUrl = async () => {
  if (!config.app_id || !config.app_secret) {
    ElMessage.warning('请先保存配置')
    return
  }
  
  loading.value = true
  try {
    const response = await generateWechatAuthUrl('pc')
    
    if (response.code === 0) {
      authUrls.pc = response.data?.auth_url || ''
      ElMessage.success('授权链接生成成功')
    } else {
      // 显示详细的错误信息
      let errorMsg = response.message || '未知错误'
      if (response.data?.error_detail) {
        errorMsg += '：' + response.data.error_detail
      }
      ElMessage.error('生成授权链接失败：' + errorMsg)
    }
  } catch (error) {
    console.error('生成授权链接失败:', error)
    // 尝试从错误对象中提取详细错误信息
    let errorMsg = '生成授权链接失败'
    if (error.response?.data?.error_detail) {
      errorMsg += '：' + error.response.data.error_detail
    } else if (error.message) {
      errorMsg = error.message
    }
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

const loadAuthorizedAccounts = async () => {
  if (!config.app_id) return
  
  try {
    const response = await getWechatAuthorizedAccounts()
    if (response.code === 0) {
      authorizedAccounts.value = response.data || []
    }
  } catch (error) {
    console.error('加载授权公众号失败:', error)
  }
}

const refreshToken = async (authorizerAppid) => {
  try {
    const response = await refreshWechatAuthorizerToken(authorizerAppid)
    if (response.code === 0) {
      ElMessage.success('Token刷新成功')
    } else {
      ElMessage.error('Token刷新失败：' + (response.message || '未知错误'))
    }
  } catch (error) {
    console.error('刷新Token失败:', error)
    ElMessage.error('刷新Token失败')
  }
}

const copyToClipboard = async (text) => {
  if (!text) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const openUrl = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

const showQrCode = async (type) => {
  const url = authUrls[type]
  if (!url) {
    ElMessage.warning('请先生成授权链接')
    return
  }
  
  qrCodeDialog.type = type
  qrCodeDialog.visible = true
  
  await nextTick()
  
  try {
    // 清空之前的二维码
    if (qrCodeRef.value) {
      qrCodeRef.value.innerHTML = ''
    }
    
    // 动态导入QRCode库
    const QRCode = await import('qrcodejs2').then(module => module.default || module)
    
    if (QRCode && qrCodeRef.value) {
      new QRCode(qrCodeRef.value, {
        text: url,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff'
      })
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

const getServiceType = (serviceType) => {
  const types = {
    0: '订阅号',
    1: '服务号',
    2: '小程序'
  }
  return types[serviceType] || '未知'
}

// 检查票据状态
const checkTicketStatus = async () => {
  checkingTicket.value = true
  try {
    // 动态导入axios
    const axios = await import('axios').then(module => module.default || module)
    
    const response = await axios.get('/api/admin/v1/wechat-third-party-platform/check-ticket-status')
    
    if (response.data.code === 0) {
      ticketStatusInfo.value = response.data.data
      
      if (ticketStatusInfo.value.status === 'good') {
        ElMessage.success('验证票据状态正常')
      } else {
        ElMessage.warning('验证票据可能存在问题，请查看详细信息')
        
        // 显示详细建议
        const suggestions = ticketStatusInfo.value.suggestions.join('\n')
        ElMessageBox.alert(
          `票据状态检查结果：\n\n${suggestions}`,
          '票据状态详情',
          {
            confirmButtonText: '我知道了',
            type: 'warning'
          }
        )
      }
    } else {
      ElMessage.error(response.data.message || '检查票据状态失败')
    }
  } catch (error) {
    console.error('检查票据状态失败:', error)
    ElMessage.error('检查票据状态失败')
  } finally {
    checkingTicket.value = false
  }
}

// 生命周期
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.wechat-third-party-platform {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.info-card {
  margin-bottom: 20px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
}

.info-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  color: #3b82f6;
  font-size: 20px;
  margin-top: 2px;
}

.info-text h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.info-text p {
  margin: 0;
  font-size: 14px;
  color: #1e40af;
  line-height: 1.6;
}

.config-card {
  margin-bottom: 20px;
}

.form-item-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-actions .el-button {
  margin: 0 8px;
}

.auth-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-section {
  margin-bottom: 30px;
}

.auth-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.auth-item h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.auth-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.authorized-accounts h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.qr-code-container {
  text-align: center;
}

.qr-tip {
  margin: 16px 0 0 0;
  color: #909399;
  font-size: 14px;
}

#qrcode {
  display: flex;
  justify-content: center;
}
</style> 