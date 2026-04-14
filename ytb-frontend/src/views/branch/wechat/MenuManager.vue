<template>
  <div class="branch-wechat-menu-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">微信菜单管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建菜单组
          </el-button>
          <el-button @click="syncFromWechat" :loading="syncing">
            <el-icon><Refresh /></el-icon>
            同步微信菜单
          </el-button>
        </div>
      </div>
      
      <!-- 分支机构信息 -->
      <div class="branch-info" v-if="branchInfo">
        <div class="info-item">
          <span class="label">分支机构：</span>
          <span class="value">{{ branchInfo.name }}</span>
        </div>
        <div class="info-item" v-if="wechatAccount">
          <span class="label">微信公众号：</span>
          <span class="value">{{ wechatAccount.nick_name }}</span>
          <el-tag :type="wechatAccount.status === 'active' ? 'success' : 'danger'" size="small">
            {{ wechatAccount.status === 'active' ? '已授权' : '未授权' }}
          </el-tag>
        </div>
        <div class="info-item" v-else>
          <span class="label">微信公众号：</span>
          <el-tag type="warning" size="small">未关联</el-tag>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards" v-if="stats">
      <div class="stat-card">
        <div class="stat-number">{{ stats.total_groups || 0 }}</div>
        <div class="stat-label">菜单组总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.published_groups || 0 }}</div>
        <div class="stat-label">已发布菜单</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.success_rate || 0 }}%</div>
        <div class="stat-label">发布成功率</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.recent_publishes || 0 }}</div>
        <div class="stat-label">近期发布</div>
      </div>
    </div>

    <!-- 菜单组列表 -->
    <div class="menu-groups-section">
      <div class="section-header">
        <h2>菜单组列表</h2>
        <div class="section-actions">
          <el-button @click="loadTemplates" type="text">
            <el-icon><Document /></el-icon>
            使用模板
          </el-button>
        </div>
      </div>

      <div class="menu-groups-list" v-loading="loading">
        <div v-if="menuGroups.length === 0" class="empty-state">
          <el-empty description="暂无菜单组">
            <el-button type="primary" @click="showCreateDialog">创建第一个菜单组</el-button>
          </el-empty>
        </div>

        <div v-else class="groups-grid">
          <div
            v-for="group in menuGroups"
            :key="group.id"
            class="menu-group-card"
            :class="{ 'published': group.status === 1 }"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title">
                <h3>{{ group.title }}</h3>
                <div class="card-badges">
                  <el-tag :type="group.type === 1 ? 'primary' : 'warning'" size="small">
                    {{ group.type === 1 ? '默认菜单' : '个性化菜单' }}
                  </el-tag>
                  <el-tag :type="group.status === 1 ? 'success' : 'info'" size="small">
                    {{ group.status === 1 ? '已发布' : '未发布' }}
                  </el-tag>
                </div>
              </div>
              <div class="card-actions">
                <el-dropdown @command="handleGroupAction">
                  <el-button type="text">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{action: 'edit', group}">编辑</el-dropdown-item>
                      <el-dropdown-item :command="{action: 'duplicate', group}">复制</el-dropdown-item>
                      <el-dropdown-item :command="{action: 'preview', group}">预览</el-dropdown-item>
                      <el-dropdown-item 
                        v-if="group.status === 0" 
                        :command="{action: 'publish', group}"
                        divided
                      >
                        发布到微信
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="group.status === 1" 
                        :command="{action: 'unpublish', group}"
                        divided
                      >
                        取消发布
                      </el-dropdown-item>
                      <el-dropdown-item 
                        :command="{action: 'delete', group}" 
                        class="danger-item"
                        divided
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <!-- 菜单项预览 -->
            <div class="menu-items-preview">
              <div class="menu-preview-title">菜单结构：</div>
              <div class="menu-items">
                <div
                  v-for="item in group.menu_items.filter(item => item.level === 1)"
                  :key="item.id"
                  class="menu-item-preview"
                >
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-type">{{ getMenuTypeText(item.type) }}</div>
                  <div v-if="getSubItems(group.menu_items, item.id).length > 0" class="sub-items">
                    <div
                      v-for="subItem in getSubItems(group.menu_items, item.id)"
                      :key="subItem.id"
                      class="sub-item"
                    >
                      {{ subItem.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 个性化菜单匹配规则 -->
            <div v-if="group.type === 3" class="match-rules">
              <div class="rules-title">匹配规则：</div>
              <div class="rules-content">
                <el-tag v-if="group.sex" size="small" type="info">
                  {{ group.sex === '1' ? '男性' : '女性' }}用户
                </el-tag>
                <el-tag v-if="group.group_id" size="small" type="info">
                  分组ID: {{ group.group_id }}
                </el-tag>
                <el-tag v-if="group.client_platform_type" size="small" type="info">
                  {{ getClientPlatformText(group.client_platform_type) }}
                </el-tag>
                <el-tag v-if="group.language" size="small" type="info">
                  {{ getLanguageText(group.language) }}
                </el-tag>
                <el-tag v-if="group.area && group.area.length > 0" size="small" type="info">
                  地区限制
                </el-tag>
              </div>
            </div>

            <!-- 发布信息 -->
            <div class="publish-info">
              <div class="publish-time" v-if="group.published_at">
                发布时间：{{ formatTime(group.published_at) }}
              </div>
              <div class="create-time">
                创建时间：{{ formatTime(group.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布日志 -->
    <div class="publish-logs-section">
      <div class="section-header">
        <h2>发布日志</h2>
        <el-button @click="loadPublishLogs" type="text">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <div class="logs-list" v-loading="logsLoading">
        <div v-if="publishLogs.length === 0" class="empty-logs">
          <el-empty description="暂无发布日志" />
        </div>
        <div v-else>
          <div
            v-for="log in publishLogs"
            :key="log.id"
            class="log-item"
            :class="log.status"
          >
            <div class="log-header">
              <div class="log-title">
                <el-icon v-if="log.status === 'success'" class="success-icon"><SuccessFilled /></el-icon>
                <el-icon v-else class="error-icon"><CircleCloseFilled /></el-icon>
                <span>{{ getOperationText(log.operation) }}</span>
              </div>
              <div class="log-time">{{ formatTime(log.created_at) }}</div>
            </div>
            <div class="log-details">
              <div v-if="log.menu_group">菜单组：{{ log.menu_group.title }}</div>
              <div v-if="log.error_message" class="error-message">
                错误信息：{{ log.error_message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑菜单组对话框 -->
    <MenuGroupDialog
      v-model:visible="showDialog"
      :group="currentGroup"
      :branch-id="branchId"
      @success="handleDialogSuccess"
    />

    <!-- 模板选择对话框 -->
    <TemplateDialog
      v-model:visible="showTemplateDialog"
      :templates="templates"
      :branch-id="branchId"
      @success="handleTemplateSuccess"
    />

    <!-- 菜单预览对话框 -->
    <MenuPreviewDialog
      v-model:visible="showPreviewDialog"
      :group="previewGroup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Document, MoreFilled, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import MenuGroupDialog from './components/MenuGroupDialog.vue'
import TemplateDialog from './components/TemplateDialog.vue'
import MenuPreviewDialog from './components/MenuPreviewDialog.vue'
import branchWechatMenuApi from '@/api/branchWechatMenu'

// Props
const props = defineProps({
  branchId: {
    type: [String, Number],
    required: true
  }
})

// 响应式数据
const loading = ref(false)
const syncing = ref(false)
const logsLoading = ref(false)
const branchInfo = ref(null)
const wechatAccount = ref(null)
const stats = ref(null)
const menuGroups = ref([])
const publishLogs = ref([])
const templates = ref([])

// 对话框状态
const showDialog = ref(false)
const showTemplateDialog = ref(false)
const showPreviewDialog = ref(false)
const currentGroup = ref(null)
const previewGroup = ref(null)

// 计算属性
const branchId = computed(() => props.branchId)

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const response = await branchWechatMenuApi.getMenuGroups(branchId.value)
    if (response.code === 0) {
      branchInfo.value = response.data.branch
      wechatAccount.value = response.data.wechat_account
      stats.value = response.data.stats
      menuGroups.value = response.data.menu_groups
    } else {
      ElMessage.error(response.message || '加载数据失败')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadPublishLogs = async () => {
  logsLoading.value = true
  try {
    const response = await branchWechatMenuApi.getPublishLogs(branchId.value)
    if (response.code === 0) {
      publishLogs.value = response.data
    }
  } catch (error) {
    console.error('加载发布日志失败:', error)
  } finally {
    logsLoading.value = false
  }
}

const loadTemplates = async () => {
  try {
    const response = await branchWechatMenuApi.getTemplates()
    if (response.code === 0) {
      templates.value = response.data
      showTemplateDialog.value = true
    } else {
      ElMessage.error(response.message || '加载模板失败')
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  }
}

const syncFromWechat = async () => {
  syncing.value = true
  try {
    const response = await branchWechatMenuApi.syncFromWechat(branchId.value)
    if (response.code === 0) {
      ElMessage.success('同步成功')
      loadData()
      loadPublishLogs()
    } else {
      ElMessage.error(response.message || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const showCreateDialog = () => {
  currentGroup.value = null
  showDialog.value = true
}

const handleGroupAction = ({ action, group }) => {
  switch (action) {
    case 'edit':
      currentGroup.value = group
      showDialog.value = true
      break
    case 'duplicate':
      duplicateGroup(group)
      break
    case 'preview':
      previewGroup.value = group
      showPreviewDialog.value = true
      break
    case 'publish':
      publishGroup(group)
      break
    case 'unpublish':
      unpublishGroup(group)
      break
    case 'delete':
      deleteGroup(group)
      break
  }
}

const duplicateGroup = async (group) => {
  try {
    const { value: title } = await ElMessageBox.prompt('请输入新菜单组名称', '复制菜单组', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,100}$/,
      inputErrorMessage: '菜单组名称长度应在1-100个字符之间'
    })

    const response = await branchWechatMenuApi.duplicateGroup(branchId.value, group.id, { title })
    if (response.code === 0) {
      ElMessage.success('复制成功')
      loadData()
    } else {
      ElMessage.error(response.message || '复制失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制菜单组失败:', error)
      ElMessage.error('复制失败')
    }
  }
}

const publishGroup = async (group) => {
  try {
    await ElMessageBox.confirm('确定要发布此菜单组到微信吗？', '确认发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await branchWechatMenuApi.publishGroup(branchId.value, group.id)
    if (response.code === 0) {
      ElMessage.success('发布成功')
      loadData()
      loadPublishLogs()
    } else {
      ElMessage.error(response.message || '发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布菜单组失败:', error)
      ElMessage.error('发布失败')
    }
  }
}

const unpublishGroup = async (group) => {
  try {
    await ElMessageBox.confirm('确定要取消发布此菜单组吗？', '确认取消发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await branchWechatMenuApi.deleteWechatMenu(branchId.value, group.id)
    if (response.code === 0) {
      ElMessage.success('取消发布成功')
      loadData()
      loadPublishLogs()
    } else {
      ElMessage.error(response.message || '取消发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消发布失败:', error)
      ElMessage.error('取消发布失败')
    }
  }
}

const deleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(`确定要删除菜单组"${group.title}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    const response = await branchWechatMenuApi.deleteGroup(branchId.value, group.id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单组失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleDialogSuccess = () => {
  loadData()
}

const handleTemplateSuccess = () => {
  loadData()
}

// 工具方法
const getSubItems = (menuItems, parentId) => {
  return menuItems.filter(item => item.parent_id === parentId)
}

const getMenuTypeText = (type) => {
  const typeMap = {
    'click': '点击',
    'view': '跳转',
    'miniprogram': '小程序',
    'scancode_push': '扫码推送',
    'scancode_waitmsg': '扫码等待',
    'pic_sysphoto': '系统拍照',
    'pic_photo_or_album': '拍照或相册',
    'pic_weixin': '微信相册',
    'location_select': '发送位置',
    'media_id': '多媒体',
    'view_limited': '跳转限制'
  }
  return typeMap[type] || type
}

const getClientPlatformText = (type) => {
  const typeMap = {
    '1': 'iOS',
    '2': 'Android',
    '3': '其他'
  }
  return typeMap[type] || type
}

const getLanguageText = (lang) => {
  const langMap = {
    'zh_CN': '简体中文',
    'zh_TW': '繁体中文',
    'en': '英文'
  }
  return langMap[lang] || lang
}

const getOperationText = (operation) => {
  const opMap = {
    'publish': '发布菜单',
    'delete': '删除菜单',
    'sync': '同步菜单'
  }
  return opMap[operation] || operation
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.branch-wechat-menu-manager {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .branch-info {
    display: flex;
    gap: 24px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        color: #909399;
        font-size: 14px;
      }

      .value {
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;

  .stat-card {
    background: white;
    padding: 24px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    .stat-number {
      font-size: 32px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      color: #909399;
      font-size: 14px;
    }
  }
}

.menu-groups-section, .publish-logs-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 0;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.menu-groups-list {
  padding: 20px;

  .empty-state {
    text-align: center;
    padding: 40px;
  }

  .groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }
}

.menu-group-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  &.published {
    border-color: #67c23a;
    background: #f0f9ff;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .card-title {
      flex: 1;

      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .card-badges {
        display: flex;
        gap: 8px;
      }
    }
  }

  .menu-items-preview {
    margin-bottom: 16px;

    .menu-preview-title {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .menu-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .menu-item-preview {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #ebeef5;

      .item-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .item-type {
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
      }

      .sub-items {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .sub-item {
          background: #f5f7fa;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #606266;
        }
      }
    }
  }

  .match-rules {
    margin-bottom: 16px;

    .rules-title {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .rules-content {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  .publish-info {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}

.logs-list {
  padding: 20px;

  .empty-logs {
    text-align: center;
    padding: 40px;
  }

  .log-item {
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
    background: white;

    &.success {
      border-color: #67c23a;
      background: #f0f9ff;
    }

    &.failed {
      border-color: #f56c6c;
      background: #fef0f0;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .log-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;

        .success-icon {
          color: #67c23a;
        }

        .error-icon {
          color: #f56c6c;
        }
      }

      .log-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .log-details {
      font-size: 14px;
      color: #606266;
      line-height: 1.5;

      .error-message {
        color: #f56c6c;
        margin-top: 4px;
      }
    }
  }
}

.danger-item {
  color: #f56c6c !important;
}
</style> 