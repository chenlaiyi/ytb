<template>
  <div class="ssl-manager">
    <!-- 操作栏 -->
    <div class="ssl-header">
      <div class="header-left">
        <h2>SSL证书管理</h2>
        <span class="subtitle">管理服务器上的所有SSL证书</span>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :loading="loading"
          @click="refreshCertificates"
        >
          <el-icon><Refresh /></el-icon>
          刷新证书
        </el-button>
        <el-button 
          type="success"
          @click="showUploadDialog = true"
        >
          <el-icon><Upload /></el-icon>
          上传证书
        </el-button>
        <el-button 
          type="warning"
          @click="showAddDialog = true"
        >
          <el-icon><Plus /></el-icon>
          新增证书
        </el-button>
      </div>
    </div>

    <!-- 证书统计卡片 -->
    <div class="ssl-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalCertificates }}</div>
              <div class="stat-label">总证书数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card valid">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ validCertificates }}</div>
              <div class="stat-label">有效证书</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card expiring">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ expiringCertificates }}</div>
              <div class="stat-label">即将过期</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card expired">
            <div class="stat-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ expiredCertificates }}</div>
              <div class="stat-label">已过期</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 证书列表 -->
    <div class="ssl-table">
      <el-table 
        :data="certificates" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="domain" label="域名" min-width="200">
          <template #default="{ row }">
            <div class="domain-cell">
              <el-icon class="domain-icon"><Link /></el-icon>
              <span class="domain-name">{{ row.domain }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="issuer" label="颁发机构" min-width="150">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.issuer }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="valid_from" label="生效时间" min-width="120">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.valid_from) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="valid_to" label="过期时间" min-width="120">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.valid_to) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余天数" min-width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getDaysLeftType(row.days_left)"
              size="small"
            >
              {{ row.days_left }}天
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              @click="viewCertificate(row)"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="warning"
              @click="renewCertificate(row)"
              :disabled="row.status === 'valid' && row.days_left > 30"
            >
              续期
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click="deleteCertificate(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 证书详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="SSL证书详情" 
      width="1000px"
      :before-close="handleDetailClose"
    >
      <div class="cert-detail" v-if="selectedCertificate">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="域名">
            {{ selectedCertificate.domain }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedCertificate.status)">
              {{ getStatusText(selectedCertificate.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="颁发机构">
            {{ selectedCertificate.issuer }}
          </el-descriptions-item>
          <el-descriptions-item label="算法">
            {{ selectedCertificate.algorithm }}
          </el-descriptions-item>
          <el-descriptions-item label="生效时间">
            {{ formatDateTime(selectedCertificate.valid_from) }}
          </el-descriptions-item>
          <el-descriptions-item label="过期时间">
            {{ formatDateTime(selectedCertificate.valid_to) }}
          </el-descriptions-item>
          <el-descriptions-item label="剩余天数">
            <el-tag :type="getDaysLeftType(selectedCertificate.days_left)">
              {{ selectedCertificate.days_left }}天
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="序列号">
            {{ selectedCertificate.serial_number }}
          </el-descriptions-item>
          <el-descriptions-item label="指纹" span="2">
            <code class="fingerprint">{{ selectedCertificate.fingerprint }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="证书路径" span="2">
            <code>{{ selectedCertificate.cert_path }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="私钥路径" span="2">
            <code>{{ selectedCertificate.key_path }}</code>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 证书链信息 -->
        <div class="cert-chain" v-if="selectedCertificate.chain_info">
          <h4>证书链信息</h4>
          <el-table :data="selectedCertificate.chain_info" size="small">
            <el-table-column prop="level" label="级别" width="80" />
            <el-table-column prop="subject" label="主题" />
            <el-table-column prop="issuer" label="颁发者" />
            <el-table-column prop="valid_to" label="过期时间" width="120">
              <template #default="{ row }">
                {{ formatDate(row.valid_to) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 证书内容 -->
        <div class="cert-content" v-if="selectedCertificate.cert_content">
          <h4>证书内容</h4>
          <div class="content-section">
            <div class="content-header">
              <span>SSL证书 (fullchain.pem)</span>
              <el-button 
                size="small" 
                type="primary" 
                @click="copyCertContent('cert')"
                :icon="DocumentCopy"
              >
                复制证书
              </el-button>
            </div>
            <el-input
              v-model="selectedCertificate.cert_content"
              type="textarea"
              :rows="8"
              readonly
              class="cert-textarea"
              placeholder="证书内容"
            />
          </div>
        </div>

        <!-- 证书链内容 -->
        <div class="cert-content" v-if="selectedCertificate.chain_content">
          <div class="content-section">
            <div class="content-header">
              <span>证书链 (chain.pem)</span>
              <el-button 
                size="small" 
                type="primary" 
                @click="copyCertContent('chain')"
                :icon="DocumentCopy"
              >
                复制证书链
              </el-button>
            </div>
            <el-input
              v-model="selectedCertificate.chain_content"
              type="textarea"
              :rows="6"
              readonly
              class="cert-textarea"
              placeholder="证书链内容"
            />
          </div>
        </div>

        <!-- 私钥内容（可选显示） -->
        <div class="cert-content" v-if="selectedCertificate.has_private_key">
          <div class="content-section">
            <div class="content-header">
              <span>私钥 (privkey.pem)</span>
              <div>
                <el-button 
                  size="small" 
                  type="warning"
                  @click="loadPrivateKey"
                  :loading="loadingPrivateKey"
                  v-if="!selectedCertificate.private_key_content"
                >
                  显示私钥
                </el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="copyCertContent('private_key')"
                  :icon="DocumentCopy"
                  v-if="selectedCertificate.private_key_content"
                >
                  复制私钥
                </el-button>
              </div>
            </div>
            <el-input
              v-model="selectedCertificate.private_key_content"
              type="textarea"
              :rows="8"
              readonly
              class="cert-textarea"
              placeholder="点击上方按钮显示私钥内容"
              v-if="selectedCertificate.private_key_content"
            />
            <div v-else class="private-key-warning">
              <el-alert
                title="私钥内容"
                type="warning"
                description="出于安全考虑，私钥内容默认不显示。如需查看，请点击上方按钮。"
                show-icon
                :closable="false"
              />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="downloadCertificate">下载证书</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传证书对话框 -->
    <el-dialog 
      v-model="showUploadDialog" 
      title="上传SSL证书" 
      width="600px"
    >
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
        <el-form-item label="域名" prop="domain">
          <el-input v-model="uploadForm.domain" placeholder="请输入域名，如：example.com" />
        </el-form-item>
        
        <el-form-item label="证书文件" prop="certificate">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleCertFileChange"
            :file-list="certFileList"
            accept=".pem,.crt,.cer"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将证书文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .pem, .crt, .cer 格式的证书文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="私钥文件" prop="private_key">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleKeyFileChange"
            :file-list="keyFileList"
            accept=".pem,.key"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将私钥文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .pem, .key 格式的私钥文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">
            上传证书
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增证书对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      title="新增SSL证书" 
      width="600px"
    >
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="120px">
        <el-form-item label="域名" prop="domain">
          <el-input v-model="addForm.domain" placeholder="请输入域名，如：example.com" />
          <div class="form-tip">请确保域名已正确解析到当前服务器</div>
        </el-form-item>
        
        <el-form-item label="证书类型" prop="cert_type">
          <el-radio-group v-model="addForm.cert_type">
            <el-radio label="letsencrypt">Let's Encrypt (免费)</el-radio>
            <el-radio label="custom">自定义证书</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <div v-if="addForm.cert_type === 'letsencrypt'">
          <el-form-item label="邮箱地址" prop="email">
            <el-input v-model="addForm.email" placeholder="用于接收证书到期通知" />
          </el-form-item>
          
          <el-form-item label="验证方式" prop="challenge_type">
            <el-radio-group v-model="addForm.challenge_type">
              <el-radio label="http">HTTP验证</el-radio>
              <el-radio label="dns">DNS验证</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
        
        <div v-if="addForm.cert_type === 'custom'">
          <el-form-item label="证书内容" prop="cert_content">
            <el-input 
              v-model="addForm.cert_content" 
              type="textarea" 
              :rows="6"
              placeholder="请粘贴证书内容（PEM格式）"
            />
          </el-form-item>
          
          <el-form-item label="私钥内容" prop="key_content">
            <el-input 
              v-model="addForm.key_content" 
              type="textarea" 
              :rows="6"
              placeholder="请粘贴私钥内容（PEM格式）"
            />
          </el-form-item>
          
          <el-form-item label="证书链" prop="chain_content">
            <el-input 
              v-model="addForm.chain_content" 
              type="textarea" 
              :rows="4"
              placeholder="请粘贴证书链内容（可选）"
            />
          </el-form-item>
        </div>
        
        <el-form-item label="自动续期" prop="auto_renew">
          <el-switch v-model="addForm.auto_renew" />
          <div class="form-tip">开启后将在证书到期前30天自动续期</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="submitAdd" :loading="adding">
            {{ addForm.cert_type === 'letsencrypt' ? '申请证书' : '添加证书' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, Upload, Document, Check, Warning, Close, Link, UploadFilled, Plus, DocumentCopy 
} from '@element-plus/icons-vue'
import { 
  getSslCertificates, 
  renewSslCertificate, 
  deleteSslCertificate,
  uploadSslCertificate,
  downloadSslCertificate,
  applyLetsEncryptCertificate,
  addCustomCertificate
} from '@/api/v1/system'

// 响应式数据
const loading = ref(false)
const uploading = ref(false)
const certificates = ref([])
const summary = ref({
  total: 0,
  valid: 0,
  expiring: 0,
  expired: 0
})
const showDetailDialog = ref(false)
const showUploadDialog = ref(false)
const showAddDialog = ref(false)
const selectedCertificate = ref(null)
const adding = ref(false)
const loadingPrivateKey = ref(false)

// 上传表单
const uploadForm = ref({
  domain: '',
  certificate: '',
  private_key: ''
})

const uploadRules = {
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' }
  ],
  certificate: [
    { required: true, message: '请上传证书文件', trigger: 'change' }
  ],
  private_key: [
    { required: true, message: '请上传私钥文件', trigger: 'change' }
  ]
}

const uploadFormRef = ref()
const certFileList = ref([])
const keyFileList = ref([])

// 新增证书表单
const addForm = ref({
  domain: '',
  cert_type: 'letsencrypt',
  email: '',
  challenge_type: 'http',
  cert_content: '',
  key_content: '',
  chain_content: '',
  auto_renew: true
})

const addRules = {
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/, message: '请输入有效的域名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  cert_content: [
    { required: true, message: '请输入证书内容', trigger: 'blur' }
  ],
  key_content: [
    { required: true, message: '请输入私钥内容', trigger: 'blur' }
  ]
}

const addFormRef = ref()

// 计算属性
const validCertificates = computed(() => {
  return summary.value.valid || 0
})

const expiringCertificates = computed(() => {
  return summary.value.expiring || 0
})

const expiredCertificates = computed(() => {
  return summary.value.expired || 0
})

const totalCertificates = computed(() => {
  return summary.value.total || 0
})

// 方法
const refreshCertificates = async () => {
  loading.value = true
  try {
    const response = await getSslCertificates()
    if (response.success) {
      // 处理新的数据结构
      if (response.data && response.data.certificates) {
        certificates.value = response.data.certificates || []
        summary.value = response.data.summary || {
          total: 0,
          valid: 0,
          expiring: 0,
          expired: 0
        }
      } else {
        certificates.value = response.data || []
        // 计算统计信息
        const certs = certificates.value
        summary.value = {
          total: certs.length,
          valid: certs.filter(cert => cert.status === 'valid').length,
          expiring: certs.filter(cert => cert.status === 'expiring').length,
          expired: certs.filter(cert => cert.status === 'expired').length
        }
      }
      ElMessage.success('证书列表刷新成功')
    } else {
      ElMessage.error(response.message || '获取证书列表失败')
    }
  } catch (error) {
    console.error('获取证书列表失败:', error)
    ElMessage.error('获取证书列表失败')
  } finally {
    loading.value = false
  }
}

const viewCertificate = (certificate) => {
  selectedCertificate.value = certificate
  showDetailDialog.value = true
}

const renewCertificate = async (certificate) => {
  try {
    await ElMessageBox.confirm(
      `确定要续期域名 ${certificate.domain} 的SSL证书吗？`,
      '续期确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await renewSslCertificate(certificate.domain)
    if (response.success) {
      ElMessage.success('证书续期成功')
      refreshCertificates()
    } else {
      ElMessage.error(response.message || '证书续期失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('证书续期失败:', error)
      ElMessage.error('证书续期失败')
    }
  }
}

const deleteCertificate = async (certificate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除域名 ${certificate.domain} 的SSL证书吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await deleteSslCertificate(certificate.domain)
    if (response.success) {
      ElMessage.success('证书删除成功')
      refreshCertificates()
    } else {
      ElMessage.error(response.message || '证书删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('证书删除失败:', error)
      ElMessage.error('证书删除失败')
    }
  }
}

const downloadCertificate = async () => {
  try {
    const response = await downloadSslCertificate(selectedCertificate.value.domain)
    if (response.success) {
      // 创建下载链接
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCertificate.value.domain}_ssl_certificate.zip`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('证书下载成功')
    } else {
      ElMessage.error(response.message || '证书下载失败')
    }
  } catch (error) {
    console.error('证书下载失败:', error)
    ElMessage.error('证书下载失败')
  }
}

const handleCertFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadForm.value.certificate = e.target.result
  }
  reader.readAsText(file.raw)
  certFileList.value = [file]
}

const handleKeyFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadForm.value.private_key = e.target.result
  }
  reader.readAsText(file.raw)
  keyFileList.value = [file]
}

const submitUpload = async () => {
  try {
    await uploadFormRef.value.validate()
    
    uploading.value = true
    const response = await uploadSslCertificate(uploadForm.value)
    
    if (response.success) {
      ElMessage.success('证书上传成功')
      showUploadDialog.value = false
      resetUploadForm()
      refreshCertificates()
    } else {
      ElMessage.error(response.message || '证书上传失败')
    }
  } catch (error) {
    if (error !== false) { // 表单验证失败时不显示错误
      console.error('证书上传失败:', error)
      ElMessage.error('证书上传失败')
    }
  } finally {
    uploading.value = false
  }
}

const resetUploadForm = () => {
  uploadForm.value = {
    domain: '',
    certificate: '',
    private_key: ''
  }
  certFileList.value = []
  keyFileList.value = []
  uploadFormRef.value?.resetFields()
}

const handleDetailClose = () => {
  showDetailDialog.value = false
  selectedCertificate.value = null
}

// 复制证书内容
const copyCertContent = async (type) => {
  try {
    let content = ''
    let typeName = ''
    
    switch (type) {
      case 'cert':
        content = selectedCertificate.value.cert_content
        typeName = 'SSL证书'
        break
      case 'chain':
        content = selectedCertificate.value.chain_content
        typeName = '证书链'
        break
      case 'private_key':
        content = selectedCertificate.value.private_key_content
        typeName = '私钥'
        break
      default:
        ElMessage.error('未知的证书类型')
        return
    }
    
    if (!content) {
      ElMessage.error(`${typeName}内容为空`)
      return
    }
    
    // 使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content)
      ElMessage.success(`${typeName}已复制到剪贴板`)
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        ElMessage.success(`${typeName}已复制到剪贴板`)
      } catch (err) {
        ElMessage.error('复制失败，请手动选择并复制')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 加载私钥内容
const loadPrivateKey = async () => {
  try {
    loadingPrivateKey.value = true
    
    // 重新获取证书详情，包含私钥
    const response = await getSslCertificateDetail(selectedCertificate.value.domain, { include_private_key: true })
    
    if (response.success && response.data) {
      selectedCertificate.value.private_key_content = response.data.private_key_content || ''
      if (selectedCertificate.value.private_key_content) {
        ElMessage.success('私钥内容已加载')
      } else {
        ElMessage.warning('私钥文件不存在或为空')
      }
    } else {
      ElMessage.error(response.message || '获取私钥失败')
    }
  } catch (error) {
    console.error('获取私钥失败:', error)
    ElMessage.error('获取私钥失败')
  } finally {
    loadingPrivateKey.value = false
  }
}

// 新增证书相关方法
const submitAdd = async () => {
  try {
    await addFormRef.value.validate()
    
    adding.value = true
    
    // 根据证书类型调用不同的API
    let response
    if (addForm.value.cert_type === 'letsencrypt') {
      // 申请Let's Encrypt证书
      response = await applyLetsEncryptCertificate({
        domain: addForm.value.domain,
        email: addForm.value.email,
        challenge_type: addForm.value.challenge_type,
        auto_renew: addForm.value.auto_renew
      })
    } else {
      // 添加自定义证书
      response = await addCustomCertificate({
        domain: addForm.value.domain,
        cert_content: addForm.value.cert_content,
        key_content: addForm.value.key_content,
        chain_content: addForm.value.chain_content,
        auto_renew: addForm.value.auto_renew
      })
    }
    
    if (response.success) {
      ElMessage.success(addForm.value.cert_type === 'letsencrypt' ? '证书申请成功' : '证书添加成功')
      showAddDialog.value = false
      resetAddForm()
      refreshCertificates()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('证书操作失败:', error)
      ElMessage.error('证书操作失败')
    }
  } finally {
    adding.value = false
  }
}

const resetAddForm = () => {
  addForm.value = {
    domain: '',
    cert_type: 'letsencrypt',
    email: '',
    challenge_type: 'http',
    cert_content: '',
    key_content: '',
    chain_content: '',
    auto_renew: true
  }
  addFormRef.value?.resetFields()
}

// 工具方法
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const statusMap = {
    'valid': 'success',
    'expiring': 'warning',
    'expired': 'danger',
    'invalid': 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'valid': '有效',
    'expiring': '即将过期',
    'expired': '已过期',
    'invalid': '无效'
  }
  return statusMap[status] || '未知'
}

const getDaysLeftType = (daysLeft) => {
  if (daysLeft < 0) return 'danger'
  if (daysLeft <= 7) return 'danger'
  if (daysLeft <= 30) return 'warning'
  return 'success'
}

// 生命周期
onMounted(() => {
  refreshCertificates()
})
</script>

<style scoped>
.ssl-manager {
  padding: 20px;
}

.ssl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  color: #606266;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.ssl-stats {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.total .stat-icon {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-card.valid .stat-icon {
  background: #e8f5e8;
  color: #4caf50;
}

.stat-card.expiring .stat-icon {
  background: #fff3e0;
  color: #ff9800;
}

.stat-card.expired .stat-icon {
  background: #ffebee;
  color: #f44336;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.ssl-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.domain-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.domain-icon {
  color: #409eff;
}

.domain-name {
  font-weight: 500;
}

.date-text {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.cert-detail {
  margin-bottom: 20px;
}

.cert-chain {
  margin-top: 20px;
}

.cert-chain h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.fingerprint {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-radio) {
  margin-right: 0;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

/* 证书内容样式 */
.cert-content {
  margin-top: 20px;
}

.cert-content h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.content-section {
  margin-bottom: 16px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.content-header span {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.cert-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.4;
  background: #fafafa;
  border: 1px solid #e4e7ed;
  resize: vertical;
}

.cert-textarea :deep(.el-textarea__inner):focus {
  border-color: #409eff;
  background: #fff;
}

.private-key-warning {
  padding: 16px;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
}

.private-key-warning :deep(.el-alert) {
  background: transparent;
  border: none;
  padding: 0;
}

.private-key-warning :deep(.el-alert__content) {
  color: #e6a23c;
}

/* 复制按钮样式 */
.content-header .el-button {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
}

/* 证书内容区域滚动条样式 */
.cert-textarea :deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 6px;
}

.cert-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.cert-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.cert-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 