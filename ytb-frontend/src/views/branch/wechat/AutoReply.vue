<template>
  <div class="auto-reply-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/branch' }">分支机构管理</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/branch/${branchId}` }">{{ branchInfo.name }}</el-breadcrumb-item>
        <el-breadcrumb-item>微信自动回复</el-breadcrumb-item>
      </el-breadcrumb>
      
      <div class="page-title">
        <h2>微信自动回复管理</h2>
        <p class="subtitle">{{ branchInfo.name }} - 智能回复设置</p>
      </div>
    </div>

    <!-- 功能选项卡 -->
    <el-tabs v-model="activeTab" class="reply-tabs">
      <el-tab-pane label="关键字回复" name="keyword">
        <!-- 搜索工具栏 -->
        <div class="toolbar">
          <div class="search-section">
            <el-select v-model="searchType" style="width: 120px; margin-right: 10px;">
              <el-option label="关键字" value="keyword"></el-option>
              <el-option label="规则名" value="rule"></el-option>
            </el-select>
            
            <el-input
              v-model="searchKeyword"
              placeholder="输入搜索内容"
              style="width: 300px; margin-right: 10px;"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>

            <el-select v-model="typeFilter" placeholder="选择类型" style="width: 150px; margin-right: 10px;" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="回复文字" value="text"></el-option>
              <el-option label="回复图片" value="images"></el-option>
              <el-option label="回复图文" value="news"></el-option>
              <el-option label="回复语音" value="voice"></el-option>
              <el-option label="回复视频" value="video"></el-option>
              <el-option label="回复音乐" value="music"></el-option>
              <el-option label="回复小程序" value="miniprogram"></el-option>
            </el-select>
          </div>

          <div class="action-section">
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              添加关键字回复
            </el-button>
            
            <el-button 
              type="danger" 
              :disabled="selectedRules.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>

        <!-- 规则列表 -->
        <div class="rules-list">
          <el-table 
            :data="rules" 
            v-loading="loading"
            @selection-change="handleSelectionChange"
            empty-text="暂无自动回复规则"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            
            <el-table-column label="规则名称" width="200">
              <template #default="{ row }">
                <div class="rule-name">{{ row.name }}</div>
                <div class="rule-desc" v-if="row.description">{{ row.description }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="关键字">
              <template #default="{ row }">
                <div class="keywords">
                  <el-tag 
                    v-for="keyword in row.keywords" 
                    :key="keyword.id"
                    :type="getKeywordTagType(keyword.type)"
                    size="small"
                    class="keyword-tag"
                  >
                    {{ keyword.content }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="回复内容">
              <template #default="{ row }">
                <div class="reply-summary">
                  <span v-if="row.reply_stats">
                    共{{ row.total_replies }}条
                    <template v-if="row.reply_stats.text > 0">({{ row.reply_stats.text }}条文字)</template>
                    <template v-if="row.reply_stats.images > 0">({{ row.reply_stats.images }}条图片)</template>
                    <template v-if="row.reply_stats.news > 0">({{ row.reply_stats.news }}条图文)</template>
                    <template v-if="row.reply_stats.voice > 0">({{ row.reply_stats.voice }}条语音)</template>
                    <template v-if="row.reply_stats.video > 0">({{ row.reply_stats.video }}条视频)</template>
                    <template v-if="row.reply_stats.music > 0">({{ row.reply_stats.music }}条音乐)</template>
                    <template v-if="row.reply_stats.miniprogram > 0">({{ row.reply_stats.miniprogram }}条小程序)</template>
                  </span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.status" 
                  @change="handleStatusChange(row)"
                  :loading="row.statusLoading"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showEditDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[8, 15, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="特殊消息回复" name="special">
        <div class="special-replies">
          <div class="special-item" v-for="(setting, type) in specialSettings" :key="type">
            <div class="special-header">
              <h4>{{ setting.name }}</h4>
              <el-switch v-model="setting.status" @change="updateSpecialSetting(type, setting)" />
            </div>
            
            <div class="special-content" v-if="setting.status">
              <el-radio-group v-model="setting.type" @change="updateSpecialSetting(type, setting)">
                <el-radio value="keyword">关键字回复</el-radio>
                <el-radio value="module">模块回复</el-radio>
              </el-radio-group>
              
              <div class="setting-input" v-if="setting.type === 'keyword'">
                <el-input 
                  v-model="setting.keyword" 
                  placeholder="输入关键字"
                  @blur="updateSpecialSetting(type, setting)"
                />
              </div>
              
              <div class="setting-input" v-else>
                <el-select 
                  v-model="setting.module" 
                  placeholder="选择模块"
                  @change="updateSpecialSetting(type, setting)"
                >
                  <el-option label="天气查询" value="weather"></el-option>
                  <el-option label="百度百科" value="baike"></el-option>
                  <el-option label="即时翻译" value="translate"></el-option>
                  <el-option label="万年历" value="calendar"></el-option>
                  <el-option label="新闻资讯" value="news"></el-option>
                  <el-option label="快递查询" value="express"></el-option>
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑自动回复规则' : '创建自动回复规则'"
      width="800px"
      :close-on-click-modal="false"
    >
      <ReplyEditor 
        v-if="dialogVisible"
        :rule="currentRule"
        :branch-id="branchId"
        @save="handleSave"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import ReplyEditor from './components/ReplyEditor.vue'
import { getAutoReplies, deleteAutoReply, batchDeleteAutoReplies, updateAutoReplyStatus, getSpecialReplies, updateSpecialReply } from '@/api/branch.js'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const activeTab = ref('keyword')
const loading = ref(false)
const rules = ref([])
const selectedRules = ref([])
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

// 搜索相关
const searchType = ref('rule')
const searchKeyword = ref('')
const typeFilter = ref('')

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRule = ref(null)

// 分支机构信息
const branchInfo = ref({
  name: '分支机构'
})

// 特殊消息回复设置
const specialSettings = ref({
  welcome: {
    name: '关注欢迎语',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  default: {
    name: '默认回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  image: {
    name: '图片消息回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  voice: {
    name: '语音消息回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  video: {
    name: '视频消息回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  location: {
    name: '位置消息回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  },
  link: {
    name: '链接消息回复',
    status: false,
    type: 'keyword',
    keyword: '',
    module: ''
  }
})

// 计算属性
const searchParams = computed(() => ({
  page: currentPage.value,
  per_page: pageSize.value,
  search_type: searchType.value,
  keyword: searchKeyword.value,
  type: typeFilter.value
}))

// 监听搜索参数变化
watch(searchParams, () => {
  loadRules()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadRules()
  loadSpecialSettings()
})

// 方法
async function loadRules() {
  try {
    loading.value = true
    const response = await getAutoReplies(branchId.value, searchParams.value)
    
    if (response.code === 0) {
      rules.value = response.data.rules
      total.value = response.data.pagination.total
      currentPage.value = response.data.pagination.current_page
      
      if (response.data.branch) {
        branchInfo.value = response.data.branch
      }
    } else {
      ElMessage.error(response.message || '获取自动回复规则失败')
    }
  } catch (error) {
    console.error('加载规则失败:', error)
    ElMessage.error('加载规则失败')
  } finally {
    loading.value = false
  }
}

async function loadSpecialSettings() {
  try {
    const response = await getSpecialReplies(branchId.value)
    if (response.code === 0) {
      // 合并返回的设置到默认设置中
      Object.keys(response.data).forEach(type => {
        if (specialSettings.value[type]) {
          specialSettings.value[type] = {
            ...specialSettings.value[type],
            ...response.data[type]
          }
        }
      })
    }
  } catch (error) {
    console.error('加载特殊设置失败:', error)
  }
}

function handleSearch() {
  currentPage.value = 1
  loadRules()
}

function handleSelectionChange(selection) {
  selectedRules.value = selection
}

function showCreateDialog() {
  isEdit.value = false
  currentRule.value = null
  dialogVisible.value = true
}

function showEditDialog(rule) {
  isEdit.value = true
  currentRule.value = rule
  dialogVisible.value = true
}

async function handleSave() {
  dialogVisible.value = false
  await loadRules()
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
}

async function handleDelete(rule) {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则"${rule.name}"吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    const response = await deleteAutoReply(branchId.value, rule.id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      await loadRules()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRules.value.length} 个规则吗？`,
      '确认批量删除',
      { type: 'warning' }
    )
    
    const ruleIds = selectedRules.value.map(rule => rule.id)
    const response = await batchDeleteAutoReplies(branchId.value, { rule_ids: ruleIds })
    
    if (response.code === 0) {
      ElMessage.success('批量删除成功')
      selectedRules.value = []
      await loadRules()
    } else {
      ElMessage.error(response.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

async function handleStatusChange(rule) {
  try {
    rule.statusLoading = true
    const response = await updateAutoReplyStatus(branchId.value, rule.id, { status: rule.status })
    
    if (response.code === 0) {
      ElMessage.success('状态更新成功')
    } else {
      rule.status = !rule.status // 回滚状态
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    rule.status = !rule.status // 回滚状态
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  } finally {
    rule.statusLoading = false
  }
}

async function updateSpecialSetting(messageType, setting) {
  try {
    const response = await updateSpecialReply(branchId.value, {
      message_type: messageType,
      reply_type: setting.type,
      keyword: setting.keyword,
      module: setting.module,
      status: setting.status
    })
    
    if (response.code === 0) {
      ElMessage.success('设置保存成功')
    } else {
      ElMessage.error(response.message || '设置保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

function getKeywordTagType(type) {
  const types = {
    1: 'success',  // 精确匹配
    2: 'warning',  // 包含匹配
    3: 'danger'    // 正则匹配
  }
  return types[type] || 'info'
}

function handleSizeChange(newSize) {
  pageSize.value = newSize
  currentPage.value = 1
}

function handleCurrentChange(newPage) {
  currentPage.value = newPage
}
</script>

<style scoped>
.auto-reply-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title h2 {
  margin: 10px 0 5px 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.reply-tabs {
  margin-top: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.search-section {
  display: flex;
  align-items: center;
}

.action-section {
  display: flex;
  gap: 10px;
}

.rules-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.rule-name {
  font-weight: 500;
  color: #303133;
}

.rule-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyword-tag {
  margin: 2px;
}

.reply-summary {
  font-size: 14px;
  color: #606266;
}

.pagination-wrapper {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #ebeef5;
}

.special-replies {
  padding: 20px;
}

.special-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.special-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.special-header h4 {
  margin: 0;
  color: #303133;
}

.special-content {
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.setting-input {
  margin-top: 10px;
}
</style> 