<template>
  <div class="branch-organizations">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>分支机构管理</h1>
      <p>管理系统中的分支机构信息</p>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增机构
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="机构名称/代码/联系人"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联公众号">
          <el-select v-model="searchForm.wechat_account_id" placeholder="选择第三方授权公众号" clearable>
            <el-option
              v-for="account in wechatAccounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="机构名称" min-width="150" />
        <el-table-column prop="code" label="机构代码" width="120" />
        <el-table-column label="关联公众号" width="180">
          <template #default="{ row }">
            <div v-if="row.wechat_account" class="wechat-account-cell">
              <img 
                v-if="row.wechat_account.head_img" 
                :src="row.wechat_account.head_img" 
                class="account-avatar"
                @error="$event.target.style.display='none'"
              />
              <div class="account-info">
                <div class="account-name">{{ row.wechat_account.nick_name || row.wechat_account.name }}</div>
                <div class="account-username">{{ row.wechat_account.user_name }}</div>
              </div>
              <el-tag v-if="row.wechat_account.status === 'active'" type="success" size="small">已授权</el-tag>
            </div>
            <span v-else class="text-gray">未绑定第三方公众号</span>
          </template>
        </el-table-column>
        <el-table-column label="管理员" width="120">
          <template #default="{ row }">
            <span v-if="row.admin_user">{{ row.admin_user.name }}</span>
            <span v-else class="text-gray">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="contact_name" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column label="用户统计" width="120">
          <template #default="{ row }">
            <div class="stats-cell">
              <div>总用户: {{ row.users_count || 0 }}</div>
              <div>VIP: {{ row.vip_users_count || 0 }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="success" @click="manageBranch(row)">管理</el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="机构名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入机构名称" />
        </el-form-item>
        <el-form-item label="机构代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入机构代码" />
        </el-form-item>
        <el-form-item label="关联公众号" prop="wechat_account_id">
          <el-select 
            v-model="form.wechat_account_id" 
            placeholder="选择第三方授权公众号" 
            clearable
            filterable
          >
            <el-option
              v-for="account in wechatAccounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            >
              <div class="wechat-account-option">
                <div class="account-main">
                  <span class="account-name">{{ account.name }}</span>
                  <el-tag v-if="account.status === 'active'" type="success" size="small">已授权</el-tag>
                  <el-tag v-else type="warning" size="small">{{ account.status }}</el-tag>
                </div>
                <div class="account-detail">
                  <span class="account-username">{{ account.user_name }}</span>
                  <span v-if="account.principal_name" class="account-principal">{{ account.principal_name }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
          <div class="form-help-text">
            选择微信第三方平台已授权的公众号进行关联
          </div>
        </el-form-item>
        <el-form-item label="机构管理员" prop="admin_user_id">
          <el-select v-model="form.admin_user_id" placeholder="选择管理员" clearable>
            <el-option
              v-for="admin in adminUsers"
              :key="admin.id"
              :label="admin.name"
              :value="admin.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人姓名" prop="contact_name">
          <el-input v-model="form.contact_name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="contact_email">
          <el-input v-model="form.contact_email" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="机构地址" prop="address">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="3"
            placeholder="请输入机构地址"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="机构描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入机构描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="分支机构详情"
      width="1200px"
      class="branch-detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentBranch" class="detail-content">
        <!-- 顶部概览卡片 -->
        <div class="overview-card">
          <div class="overview-left">
            <div class="branch-avatar">
              <img 
                v-if="currentBranch.wechat_account?.head_img" 
                :src="currentBranch.wechat_account.head_img" 
                class="branch-logo"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="branch-logo-placeholder">
                <el-icon size="40"><House /></el-icon>
              </div>
            </div>
            <div class="branch-info">
              <h2 class="branch-name">{{ currentBranch.name }}</h2>
              <div class="branch-meta">
                <el-tag type="primary" size="large">{{ currentBranch.code }}</el-tag>
                <el-tag :type="currentBranch.status === 'active' ? 'success' : 'danger'" size="large">
                  {{ currentBranch.status === 'active' ? '运营中' : '已停用' }}
                </el-tag>
              </div>
              <div class="branch-wechat" v-if="currentBranch.wechat_account">
                <span class="wechat-label">关联公众号：</span>
                <span class="wechat-name">{{ currentBranch.wechat_account.nick_name || currentBranch.wechat_account.name }}</span>
              </div>
            </div>
          </div>
          <div class="overview-right">
            <el-button type="primary" size="large" @click="loginToBranch(currentBranch)">
              <el-icon><View /></el-icon>
              进入管理后台
            </el-button>
          </div>
        </div>

        <!-- 主要内容区域 -->
        <el-row :gutter="24" class="main-content">
          <!-- 左列 -->
          <el-col :span="12">
            <!-- 基本信息 -->
            <el-card class="info-card" header="基本信息">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">机构名称</span>
                  <span class="info-value">{{ currentBranch.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">机构代码</span>
                  <span class="info-value">{{ currentBranch.code }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDateTime(currentBranch.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">运营状态</span>
                  <span class="info-value">
                    <el-tag :type="currentBranch.status === 'active' ? 'success' : 'danger'" size="small">
                      {{ currentBranch.status === 'active' ? '运营中' : '已停用' }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item full-width" v-if="currentBranch.address">
                  <span class="info-label">机构地址</span>
                  <span class="info-value">{{ currentBranch.address }}</span>
                </div>
                <div class="info-item full-width" v-if="currentBranch.description">
                  <span class="info-label">机构描述</span>
                  <span class="info-value">{{ currentBranch.description }}</span>
                </div>
              </div>
            </el-card>

            <!-- 联系信息 -->
            <el-card class="info-card" header="联系信息">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">管理员</span>
                  <span class="info-value">{{ currentBranch.admin_user?.name || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">用户名</span>
                  <span class="info-value">{{ currentBranch.admin_user?.username || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">联系人</span>
                  <span class="info-value">{{ currentBranch.contact_name || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">联系电话</span>
                  <span class="info-value">{{ currentBranch.contact_phone || '-' }}</span>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">联系邮箱</span>
                  <span class="info-value">{{ currentBranch.contact_email || '-' }}</span>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右列 -->
          <el-col :span="12">
            <!-- 关联公众号 -->
            <el-card class="info-card" header="关联公众号" v-if="currentBranch.wechat_account">
              <div class="wechat-card">
                <div class="wechat-header">
                  <img 
                    v-if="currentBranch.wechat_account.head_img" 
                    :src="currentBranch.wechat_account.head_img" 
                    class="wechat-avatar"
                    @error="$event.target.style.display='none'"
                  />
                  <div class="wechat-info">
                    <div class="wechat-name">{{ currentBranch.wechat_account.nick_name || currentBranch.wechat_account.name }}</div>
                    <div class="wechat-username">{{ currentBranch.wechat_account.user_name }}</div>
                  </div>
                  <el-tag :type="currentBranch.wechat_account.status === 'active' ? 'success' : 'warning'" size="small">
                    {{ currentBranch.wechat_account.status === 'active' ? '已授权' : currentBranch.wechat_account.status }}
                  </el-tag>
                </div>
                <div class="wechat-details">
                  <div class="wechat-detail-item" v-if="currentBranch.wechat_account.principal_name">
                    <span class="detail-label">主体名称</span>
                    <span class="detail-value">{{ currentBranch.wechat_account.principal_name }}</span>
                  </div>
                  <div class="wechat-detail-item">
                    <span class="detail-label">授权时间</span>
                    <span class="detail-value">{{ formatDateTime(currentBranch.wechat_account.created_at) }}</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 统计数据 -->
            <el-card class="info-card" header="运营数据">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon user-stat">
                    <el-icon><UserFilled /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ currentBranch.users_count || 0 }}</div>
                    <div class="stat-label">总用户</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon vip-stat">
                    <el-icon><Trophy /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-number">{{ currentBranch.vip_users_count || 0 }}</div>
                    <div class="stat-label">VIP用户</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 访问入口URL -->
        <el-card class="info-card url-section" header="访问入口">
          <div class="url-list">
            <!-- 管理后台登录 -->
            <div class="url-item">
              <div class="url-header">
                <div class="url-icon admin-icon">
                  <el-icon><Monitor /></el-icon>
                </div>
                <div class="url-info">
                  <div class="url-title">分支机构管理后台</div>
                  <div class="url-desc">独立的管理后台登录入口</div>
                </div>
              </div>
              <div class="url-content">
                <el-input
                  :value="`https://pay.itapgo.com/admin/#/branch-login/${currentBranch.code}`"
                  readonly
                  size="small"
                >
                  <template #append>
                    <el-button 
                      size="small"
                      @click="copyUrl(`https://pay.itapgo.com/admin/#/branch-login/${currentBranch.code}`)"
                      icon="DocumentCopy"
                    />
                  </template>
                </el-input>
                <div class="url-actions">
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="openUrl(`https://pay.itapgo.com/admin/#/branch-login/${currentBranch.code}`)"
                  >
                    <el-icon><View /></el-icon>
                    访问
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 手机端入口 -->
            <div class="url-item">
              <div class="url-header">
                <div class="url-icon mobile-icon">
                  <el-icon><Iphone /></el-icon>
                </div>
                <div class="url-info">
                  <div class="url-title">手机端H5页面</div>
                  <div class="url-desc">用户移动端访问入口</div>
                </div>
              </div>
              <div class="url-content">
                <el-input
                  :value="`https://pay.itapgo.com/app/#/?branch_code=${currentBranch.code}`"
                  readonly
                  size="small"
                >
                  <template #append>
                    <el-button 
                      size="small"
                      @click="copyUrl(`https://pay.itapgo.com/app/#/?branch_code=${currentBranch.code}`)"
                      icon="DocumentCopy"
                    />
                  </template>
                </el-input>
                <div class="url-actions">
                  <el-button 
                    type="success" 
                    size="small"
                    @click="openUrl(`https://pay.itapgo.com/app/#/?branch_code=${currentBranch.code}`)"
                  >
                    <el-icon><View /></el-icon>
                    访问
                  </el-button>
                  <el-button 
                    size="small"
                    @click="generateQRCode(`https://pay.itapgo.com/app/#/?branch_code=${currentBranch.code}`)"
                  >
                    <el-icon><View /></el-icon>
                    二维码
                  </el-button>
                </div>
              </div>
            </div>

            <!-- API接口 -->
            <div class="url-item">
              <div class="url-header">
                <div class="url-icon api-icon">
                  <el-icon><Setting /></el-icon>
                </div>
                <div class="url-info">
                  <div class="url-title">API接口地址</div>
                  <div class="url-desc">获取分支机构信息的API接口</div>
                </div>
              </div>
              <div class="url-content">
                <el-input
                  :value="`https://pay.itapgo.com/admin/api/branch/info?code=${currentBranch.code}`"
                  readonly
                  size="small"
                >
                  <template #append>
                    <el-button 
                      size="small"
                      @click="copyUrl(`https://pay.itapgo.com/admin/api/branch/info?code=${currentBranch.code}`)"
                      icon="DocumentCopy"
                    />
                  </template>
                </el-input>
                <div class="url-actions">
                  <el-button 
                    type="info" 
                    size="small"
                    @click="testApi(currentBranch.code)"
                  >
                    <el-icon><Connection /></el-icon>
                    测试
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="warning" @click="showEditDialog(currentBranch)">
            <el-icon><Edit /></el-icon>
            编辑机构
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 二维码弹窗 -->
    <el-dialog
      v-model="qrcodeVisible"
      title="H5页面二维码"
      width="400px"
      :close-on-click-modal="true"
    >
      <div class="qrcode-container">
        <div class="qrcode-wrapper">
          <canvas ref="qrcodeCanvas"></canvas>
        </div>
        <div class="qrcode-url">{{ qrcodeUrl }}</div>
        <div class="qrcode-tip">使用微信或浏览器扫描二维码访问H5页面</div>
      </div>
      <template #footer>
        <el-button @click="qrcodeVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadQRCode">
          <el-icon><Download /></el-icon>
          下载二维码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, InfoFilled, ChatDotRound, User, Link, Iphone, Setting, DataAnalysis, Operation, Edit, Lock, Unlock, View, Monitor, Money, Trophy, UserFilled, DocumentCopy, Connection, House, Download } from '@element-plus/icons-vue'
import request from '@/utils/request'
import QRCode from 'qrcode'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const wechatAccounts = ref([])
const adminUsers = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentBranch = ref(null)
const isEdit = ref(false)
const formRef = ref()

// 二维码相关
const qrcodeVisible = ref(false)
const qrcodeUrl = ref('')
const qrcodeCanvas = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  wechat_account_id: ''
})

// 分页信息
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0
})

// 表单数据
const form = reactive({
  name: '',
  code: '',
  wechat_account_id: '',
  admin_user_id: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  status: 'active',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入机构名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入机构代码', trigger: 'blur' }
  ],
  contact_phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contact_email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑机构' : '新增机构'
})

// 方法
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm
    }
    
    const response = await request.get('/api/admin/v1/branch-organizations', { params })
    
    if (response.code === 0) {
      tableData.value = response.data.data
      pagination.total = response.data.total
      pagination.current_page = response.data.current_page
      pagination.per_page = response.data.per_page
    } else {
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取分支机构列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchWechatAccounts = async () => {
  try {
    // 获取第三方平台授权的公众号列表
    const response = await request.get('/api/admin/v1/wechat-third-party-platform/authorized-accounts')
    if (response.code === 0) {
      // 转换数据格式以适配现有的选择器
      wechatAccounts.value = response.data.map(account => ({
        id: account.id, // 使用数据库真实 ID
        name: account.nick_name || account.user_name || account.authorizer_appid,
        nick_name: account.nick_name,
        user_name: account.user_name,
        head_img: account.head_img,
        principal_name: account.principal_name,
        status: account.status,
        authorized_at: account.authorized_at,
        authorizer_appid: account.authorizer_appid // 保留 authorizer_appid 用于显示
      }))
    } else {
      ElMessage.warning('获取第三方授权公众号失败：' + (response.message || '未知错误'))
      wechatAccounts.value = []
    }
  } catch (error) {
    console.error('获取第三方授权公众号列表失败:', error)
    ElMessage.error('获取第三方授权公众号失败，请检查网络连接')
    wechatAccounts.value = []
  }
}

const fetchAdminUsers = async () => {
  try {
    const response = await request.get('/api/admin/v1/system/admins')
    if (response.code === 0) {
      adminUsers.value = response.data.data || response.data
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.current_page = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    wechat_account_id: ''
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  fetchData()
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const showEditDialog = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    wechat_account_id: row.wechat_account_id,
    admin_user_id: row.admin_user_id,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    address: row.address,
    status: row.status,
    description: row.description
  })
}

const showDetail = async (row) => {
  try {
    console.log('开始获取分支机构详情, ID:', row.id)
    console.log('请求URL:', `/api/admin/v1/branch-organizations/${row.id}`)
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${row.id}`)
    
    console.log('API响应:', response)
    
    if (response.code === 0) {
      currentBranch.value = response.data
      detailVisible.value = true
      console.log('详情获取成功，显示对话框')
    } else {
      console.error('API返回错误:', response.code, response.message)
      ElMessage.error(response.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取机构详情失败:', error)
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('完整错误对象:', error)
    ElMessage.error('获取详情失败: ' + (error.message || error))
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value 
      ? `/api/admin/v1/branch-organizations/${form.id}`
      : '/api/admin/v1/branch-organizations'
    
    const method = isEdit.value ? 'put' : 'post'
    const response = await request[method](url, form)
    
    if (response.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    const response = await request.put(`/api/admin/v1/branch-organizations/${row.id}/status`, {
      status: newStatus
    })
    
    if (response.code === 0) {
      ElMessage.success('状态更新成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('状态更新失败')
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    name: '',
    code: '',
    wechat_account_id: '',
    admin_user_id: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    status: 'active',
    description: ''
  })
}

const manageBranch = (row) => {
  // 跳转到分支机构独立管理后台
  const branchAdminUrl = `/admin/#/branch/${row.id}/dashboard`
  window.open(branchAdminUrl, '_blank')
  ElMessage.success(`正在打开${row.name}的管理后台`)
}

// 复制URL到剪贴板
const copyUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('URL已复制到剪贴板')
  } catch (error) {
    // 降级处理
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('URL已复制到剪贴板')
  }
}

// 打开URL
const openUrl = (url) => {
  window.open(url, '_blank')
}

// 生成二维码
const generateQRCode = async (url) => {
  qrcodeUrl.value = url
  qrcodeVisible.value = true
  
  // 等待 DOM 更新
  await nextTick()
  
  try {
    // 生成二维码到 canvas
    await QRCode.toCanvas(qrcodeCanvas.value, url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

// 下载二维码
const downloadQRCode = () => {
  if (!qrcodeCanvas.value) {
    ElMessage.error('二维码未生成')
    return
  }
  
  try {
    const link = document.createElement('a')
    link.download = `qrcode_${currentBranch.value?.code || 'branch'}.png`
    link.href = qrcodeCanvas.value.toDataURL('image/png')
    link.click()
    ElMessage.success('二维码已下载')
  } catch (error) {
    console.error('下载二维码失败:', error)
    ElMessage.error('下载二维码失败')
  }
}

// 测试API
const testApi = async (branchCode) => {
  try {
    const response = await request.get('/api/branch/info', {
      params: { code: branchCode }
    })
    
    if (response.code === 0) {
      ElMessage.success('API测试成功')
      console.log('API响应:', response.data)
    } else {
      ElMessage.error(`API测试失败: ${response.message}`)
    }
  } catch (error) {
    console.error('API测试失败:', error)
    ElMessage.error('API测试失败')
  }
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 登录到分支机构后台
const loginToBranch = (branch) => {
  const loginUrl = `https://pay.itapgo.com/admin/#/branch-login/${branch.code}`
  window.open(loginUrl, '_blank')
  ElMessage.success(`正在打开${branch.name}的登录页面`)
}

// 编辑分支机构
const editBranch = (branch) => {
  showEditDialog(branch)
  detailVisible.value = false
}

// 查看用户列表
const viewUsers = (branch) => {
  // 跳转到用户管理页面，并筛选该分支机构的用户
  ElMessage.info('跳转到用户管理页面功能开发中...')
}

// 查看设备列表
const viewDevices = (branch) => {
  // 跳转到设备管理页面，并筛选该分支机构的设备
  ElMessage.info('跳转到设备管理页面功能开发中...')
}

// 切换分支机构状态
const toggleBranchStatus = async (branch) => {
  const newStatus = branch.status === 'active' ? 'inactive' : 'active'
  const statusText = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${statusText}分支机构"${branch.name}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await request.put(`/api/admin/v1/branch-organizations/${branch.id}/status`, {
      status: newStatus
    })
    
    if (response.code === 0) {
      ElMessage.success(`${statusText}成功`)
      branch.status = newStatus
      fetchData() // 刷新列表
    } else {
      ElMessage.error(response.message || `${statusText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${statusText}分支机构失败:`, error)
      ElMessage.error(`${statusText}失败`)
    }
  }
}

// 生命周期
onMounted(() => {
  fetchData()
  fetchWechatAccounts()
  fetchAdminUsers()
})
</script>

<style scoped>
.branch-organizations {
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  position: relative;
}

.page-header h1 {
  color: white;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  color: white;
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions {
  position: absolute;
  top: 30px;
  right: 30px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.search-filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.stats-cell {
  font-size: 12px;
  line-height: 1.4;
}

.text-gray {
  color: #909399;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.statistics-section {
  margin-top: 30px;
}

.statistics-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.dialog-footer {
  text-align: right;
}

/* 第三方授权公众号选择器样式 */
.wechat-account-option {
  padding: 4px 0;
}

.account-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.account-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-detail {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.account-principal {
  color: #67c23a;
}

.form-help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/* 表格中公众号显示优化 */
.el-table .wechat-account-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-table .wechat-account-cell .account-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.el-table .wechat-account-cell .account-info {
  flex: 1;
  min-width: 0;
}

.el-table .wechat-account-cell .account-username {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分支机构详情弹窗样式 */
.branch-detail-dialog {
  .el-dialog__body {
    padding: 20px;
  }
}

/* 顶部概览卡片 */
.overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
}

.overview-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.branch-avatar {
  position: relative;
}

.branch-logo {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.branch-logo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.branch-info {
  flex: 1;
}

.branch-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 12px 0;
  color: white;
}

.branch-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.branch-wechat {
  font-size: 14px;
  opacity: 0.9;
}

.wechat-label {
  opacity: 0.8;
}

.wechat-name {
  font-weight: 500;
}

.overview-right .el-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
}

/* 主要内容区域 */
.main-content {
  margin-bottom: 20px;
}

/* 信息卡片 */
.info-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card .el-card__header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #212529;
  font-weight: 500;
}

/* 微信卡片 */
.wechat-card {
  padding: 4px 0;
}

.wechat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.wechat-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.wechat-info {
  flex: 1;
}

.wechat-name {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 4px;
}

.wechat-username {
  font-size: 12px;
  color: #6c757d;
}

.wechat-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wechat-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 12px;
  color: #6c757d;
}

.detail-value {
  font-size: 12px;
  color: #212529;
  font-weight: 500;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-icon.user-stat {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-icon.vip-stat {
  background: #fff3e0;
  color: #f57c00;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #212529;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}

/* URL部分 */
.url-section {
  margin-top: 20px;
}

.url-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.url-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.url-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.url-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.url-icon.admin-icon {
  background: #e3f2fd;
  color: #1976d2;
}

.url-icon.mobile-icon {
  background: #e8f5e8;
  color: #2e7d32;
}

.url-icon.api-icon {
  background: #fff3e0;
  color: #f57c00;
}

.url-info {
  flex: 1;
}

.url-title {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 2px;
}

.url-desc {
  font-size: 12px;
  color: #6c757d;
}

.url-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.url-content .el-input {
  flex: 1;
}

.url-actions {
  display: flex;
  gap: 8px;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表格中公众号显示优化 */
.el-table .wechat-account-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-table .wechat-account-cell .account-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.el-table .wechat-account-cell .account-info {
  flex: 1;
  min-width: 0;
}

.el-table .wechat-account-cell .account-username {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 二维码弹窗样式 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode-wrapper {
  padding: 16px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 16px;
}

.qrcode-wrapper canvas {
  display: block;
}

.qrcode-url {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  text-align: center;
  max-width: 300px;
  margin-bottom: 8px;
}

.qrcode-tip {
  font-size: 13px;
  color: #909399;
  text-align: center;
}
</style>
