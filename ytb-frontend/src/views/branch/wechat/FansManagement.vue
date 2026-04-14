<template>
  <div class="branch-wechat-fans-management">
    <div class="page-header">
      <div class="header-left">
        <h2>粉丝管理</h2>
        <p>管理分支机构公众号的粉丝信息</p>
      </div>
      <div class="header-right">
        <el-button @click="syncFans" :loading="syncing">
          <el-icon><Refresh /></el-icon>
          同步粉丝
        </el-button>
        <el-button type="primary" @click="showGroupDialog = true">
          <el-icon><Plus /></el-icon>
          创建分组
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_fans || 0 }}</div>
              <div class="stat-label">总粉丝数</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.new_fans_today || 0 }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <el-icon class="stat-icon"><UserFilled /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.active_fans || 0 }}</div>
              <div class="stat-label">活跃粉丝</div>
            </div>
            <el-icon class="stat-icon"><ChatDotRound /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ fanGroups.length || 0 }}</div>
              <div class="stat-label">粉丝分组</div>
            </div>
            <el-icon class="stat-icon"><Collection /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="昵称/备注名"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="searchForm.group_id" placeholder="选择分组" clearable style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option 
              v-for="group in fanGroups" 
              :key="group.id" 
              :label="group.name" 
              :value="group.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.sex" placeholder="选择性别" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="男" value="1" />
            <el-option label="女" value="2" />
            <el-option label="未知" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关注状态">
          <el-select v-model="searchForm.subscribe_status" placeholder="关注状态" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="已关注" value="1" />
            <el-option label="已取消" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadFans">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 粉丝分组管理 - 紧凑布局 -->
    <el-card shadow="never" class="groups-card compact">
      <template #header>
        <div class="card-header">
          <span>粉丝分组 ({{ fanGroups.length }})</span>
          <div>
            <el-button size="small" @click="showGroupDialog = true">
              <el-icon><Plus /></el-icon>
              新建
            </el-button>
            <el-button size="small" @click="loadGroups">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      <div class="groups-compact">
        <div v-if="fanGroups.length === 0" class="no-groups">
          <span class="text-gray">暂无分组</span>
          <el-link type="primary" @click="showGroupDialog = true">立即创建</el-link>
        </div>
        <div v-else class="groups-tags">
          <el-tag 
            v-for="group in fanGroups" 
            :key="group.id" 
            class="group-tag"
            closable
            @close="deleteGroup(group)"
            @click="editGroup(group)"
          >
            {{ group.name }} ({{ group.count || 0 }})
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 粉丝列表 -->
    <el-card shadow="never" class="fans-card">
      <template #header>
        <div class="card-header">
          <span>粉丝列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="syncFans" :loading="syncing">
              <el-icon><Refresh /></el-icon>
              同步粉丝
            </el-button>
            <el-button size="small" @click="batchMoveToGroup" :disabled="selectedFans.length === 0">
              批量移动分组
            </el-button>
            <el-button size="small" @click="exportFans">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
      </template>

      <!-- 隐私政策说明 -->
      <el-alert
        title="关于粉丝信息获取说明"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #default>
          <div style="font-size: 13px; line-height: 1.6;">
            <p style="margin: 0 0 8px 0;">
              <strong>微信隐私政策调整：</strong>自2021年起，微信不再直接返回用户的昵称、头像、性别、地区等个人信息。
            </p>
            <p style="margin: 0;">
              <strong>当前可获取：</strong>OpenID、关注状态、关注时间等基础信息。个人信息需用户在小程序中主动授权设置。
            </p>
          </div>
        </template>
      </el-alert>
      
      <el-table 
        v-loading="loading"
        :data="fansList" 
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-tooltip :content="row.headimgurl ? '用户头像' : '由于微信隐私政策，用户头像需要用户主动设置才能获取'" placement="top">
              <el-avatar :src="row.headimgurl" :size="40">
                <el-icon><User /></el-icon>
              </el-avatar>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="昵称" prop="nickname" min-width="120">
          <template #default="{ row }">
            <div class="fan-info">
              <div class="nickname">
                <span v-if="row.nickname">{{ row.nickname }}</span>
                <el-tag v-else type="info" size="small">微信用户</el-tag>
                <el-tooltip content="由于微信隐私政策，用户昵称需要用户主动设置才能获取" placement="top">
                  <el-icon v-if="!row.nickname" style="margin-left: 5px; color: #909399;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div v-if="row.remark" class="remark">备注：{{ row.remark }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="getSexTagType(row.sex)" size="small">
              {{ getSexText(row.sex) }}
            </el-tag>
            <el-tooltip v-if="row.sex === 0" content="由于微信隐私政策，用户性别信息需要用户主动设置才能获取" placement="top">
              <el-icon style="margin-left: 5px; color: #909399;"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="分组" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.group_name" type="info" size="small">
              {{ row.group_name }}
            </el-tag>
            <span v-else class="text-gray">未分组</span>
          </template>
        </el-table-column>
        <el-table-column label="地区" width="150">
          <template #default="{ row }">
            <span>{{ formatLocation(row.country, row.province, row.city) }}</span>
            <el-tooltip v-if="!row.country && !row.province && !row.city" content="由于微信隐私政策，用户地区信息需要用户主动设置才能获取" placement="top">
              <el-icon style="margin-left: 5px; color: #909399;"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="关注状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.subscribe ? 'success' : 'danger'" size="small">
              {{ row.subscribe ? '已关注' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关注时间" width="160">
          <template #default="{ row }">
            <span>{{ formatTime(row.subscribe_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewFanDetail(row)">详情</el-button>
            <el-button size="small" @click="editFanRemark(row)">备注</el-button>
            <el-dropdown @command="(command) => handleFanAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="move">移动分组</el-dropdown-item>
                  <el-dropdown-item command="tag">设置标签</el-dropdown-item>
                  <el-dropdown-item command="block" divided>拉黑</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadFans"
          @current-change="loadFans"
        />
      </div>
    </el-card>

    <!-- 分组创建/编辑对话框 -->
    <el-dialog 
      v-model="showGroupDialog" 
      :title="editingGroup ? '编辑分组' : '创建分组'"
      width="500px"
      @close="resetGroupForm"
    >
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="100px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组描述" prop="description">
          <el-input 
            v-model="groupForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入分组描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="saveGroup" :loading="groupSaving">
            {{ editingGroup ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 粉丝详情对话框 -->
    <el-dialog v-model="showFanDetail" title="粉丝详情" width="600px">
      <div v-if="currentFan" class="fan-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="头像" :span="2">
            <el-avatar :src="currentFan.headimgurl" :size="80">
              <el-icon><User /></el-icon>
            </el-avatar>
          </el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentFan.nickname || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ getSexText(currentFan.sex) }}</el-descriptions-item>
          <el-descriptions-item label="备注名">{{ currentFan.remark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="分组">{{ currentFan.group_name || '未分组' }}</el-descriptions-item>
          <el-descriptions-item label="国家">{{ currentFan.country || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="省份">{{ currentFan.province || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="城市">{{ currentFan.city || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="语言">{{ currentFan.language || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="关注状态">
            <el-tag :type="currentFan.subscribe ? 'success' : 'danger'">
              {{ currentFan.subscribe ? '已关注' : '已取消' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关注时间">{{ formatTime(currentFan.subscribe_time) }}</el-descriptions-item>
          <el-descriptions-item label="取消关注时间">{{ formatTime(currentFan.unsubscribe_time) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 备注编辑对话框 -->
    <el-dialog v-model="showRemarkDialog" title="编辑备注" width="400px">
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="备注名">
          <el-input 
            v-model="remarkForm.remark" 
            placeholder="请输入备注名"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRemarkDialog = false">取消</el-button>
          <el-button type="primary" @click="saveRemark" :loading="remarkSaving">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 移动分组对话框 -->
    <el-dialog v-model="showMoveGroupDialog" title="移动到分组" width="400px">
      <el-form :model="moveGroupForm" label-width="80px">
        <el-form-item label="目标分组">
          <el-select v-model="moveGroupForm.group_id" placeholder="选择分组" style="width: 100%;">
            <el-option label="未分组" value="" />
            <el-option 
              v-for="group in fanGroups" 
              :key="group.id" 
              :label="group.name" 
              :value="group.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMoveGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmMoveGroup" :loading="moveSaving">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 同步粉丝对话框 -->
    <el-dialog v-model="showSyncDialog" title="同步粉丝数据" width="500px">
      <el-form :model="syncForm" label-width="100px">
        <el-form-item label="同步说明">
          <div style="color: #606266; font-size: 14px; line-height: 1.5;">
            将同步当前分支机构绑定的微信公众号粉丝数据
          </div>
        </el-form-item>
        <el-form-item label="同步类型">
          <el-radio-group v-model="syncForm.sync_type">
            <el-radio value="incremental">增量同步</el-radio>
            <el-radio value="full">全量同步</el-radio>
          </el-radio-group>
          <div style="font-size: 12px; color: #8492a6; margin-top: 5px;">
            增量同步：只同步新增和变更的粉丝数据<br>
            全量同步：重新同步所有粉丝数据
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSyncDialog = false">取消</el-button>
          <el-button type="primary" @click="executSync" :loading="syncing">开始同步</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  User, 
  UserFilled, 
  ChatDotRound, 
  Collection,
  Download,
  ArrowDown,
  QuestionFilled
} from '@element-plus/icons-vue'
import * as branchWechatFansApi from '@/api/branchWechatFans'
import request from '@/utils/request'

const route = useRoute()
const branchId = route.params.branchId

// 响应式数据
const loading = ref(false)
const syncing = ref(false)
const stats = ref(null)
const fansList = ref([])
const fanGroups = ref([])
const selectedFans = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  group_id: '',
  sex: '',
  subscribe_status: ''
})

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0
})

// 对话框状态
const showGroupDialog = ref(false)
const showFanDetail = ref(false)
const showRemarkDialog = ref(false)
const showMoveGroupDialog = ref(false)
const showSyncDialog = ref(false)

const editingGroup = ref(null)
const currentFan = ref(null)
const groupSaving = ref(false)
const remarkSaving = ref(false)
const moveSaving = ref(false)

// 表单数据
const groupForm = reactive({
  name: '',
  description: ''
})

const remarkForm = reactive({
  openid: '',
  remark: ''
})

const moveGroupForm = reactive({
  group_id: '',
  openids: []
})

const syncForm = reactive({
  sync_type: 'incremental'
})

// 表单验证规则
const groupRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 1, max: 30, message: '分组名称长度在 1 到 30 个字符', trigger: 'blur' }
  ]
}

const groupFormRef = ref()

// 生命周期
onMounted(() => {
  loadStats()
  loadGroups()
  loadFans()
})

// 方法
const loadStats = async () => {
  try {
    const response = await branchWechatFansApi.getFansStats(branchId)
    if (response.code === 0) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadGroups = async () => {
  try {
    const response = await branchWechatFansApi.getFansGroups(branchId)
    if (response.code === 0) {
      fanGroups.value = response.data || []
    }
  } catch (error) {
    console.error('加载粉丝分组失败:', error)
    ElMessage.error('加载分组失败')
  }
}



const loadFans = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
      ...searchForm
    }
    
    const response = await branchWechatFansApi.getFansList(branchId, params)
    if (response.code === 0) {
      fansList.value = response.data.data || []
      pagination.total = response.data.total || 0
      pagination.current_page = response.data.current_page || 1
      pagination.per_page = response.data.per_page || 20
    } else {
      ElMessage.error(response.message || '加载粉丝列表失败')
    }
  } catch (error) {
    console.error('加载粉丝列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const syncFans = async () => {
  // 显示同步对话框，让用户选择同步类型
  showSyncDialog.value = true
}

const executSync = async () => {
  // 这个方法保留，但现在用于处理对话框中的同步类型选择
  try {
    syncing.value = true
    const response = await branchWechatFansApi.syncFansData(branchId, {
      sync_type: syncForm.sync_type
    })
    if (response.code === 0) {
      ElMessage.success('同步任务已启动：' + response.data.message)
      showSyncDialog.value = false
      loadStats()
      loadFans()
    } else {
      ElMessage.error(response.message || '同步失败')
    }
  } catch (error) {
    console.error('同步粉丝失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    group_id: '',
    sex: '',
    subscribe_status: ''
  })
  pagination.current_page = 1
  loadFans()
}

const handleSelectionChange = (selection) => {
  selectedFans.value = selection
}

const getSexText = (sex) => {
  const sexMap = { '0': '未知', '1': '男', '2': '女' }
  return sexMap[sex] || '未知'
}

const getSexTagType = (sex) => {
  const typeMap = { '0': 'info', '1': 'primary', '2': 'danger' }
  return typeMap[sex] || 'info'
}

const formatLocation = (country, province, city) => {
  const parts = [country, province, city].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '未知'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

// 分组管理
const editGroup = (group) => {
  editingGroup.value = group
  groupForm.name = group.name
  groupForm.description = group.description || ''
  showGroupDialog.value = true
}

const resetGroupForm = () => {
  editingGroup.value = null
  groupForm.name = ''
  groupForm.description = ''
  groupFormRef.value?.clearValidate()
}

const saveGroup = async () => {
  try {
    await groupFormRef.value?.validate()
    groupSaving.value = true
    
    let response
    if (editingGroup.value) {
      response = await branchWechatFansApi.updateFansGroup(branchId, editingGroup.value.id, groupForm)
    } else {
      response = await branchWechatFansApi.createFansGroup(branchId, groupForm)
    }
    
    if (response.code === 0) {
      ElMessage.success(editingGroup.value ? '更新成功' : '创建成功')
      showGroupDialog.value = false
      loadGroups()
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存分组失败:', error)
    ElMessage.error('保存失败')
  } finally {
    groupSaving.value = false
  }
}

const deleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分组吗？分组内的粉丝将移动到未分组。', '确认删除', {
      type: 'warning'
    })
    
    const response = await branchWechatFansApi.deleteFansGroup(branchId, group.id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadGroups()
      loadFans()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 粉丝操作
const viewFanDetail = (fan) => {
  currentFan.value = fan
  showFanDetail.value = true
}

const editFanRemark = (fan) => {
  remarkForm.openid = fan.openid
  remarkForm.remark = fan.remark || ''
  showRemarkDialog.value = true
}

const saveRemark = async () => {
  try {
    remarkSaving.value = true
    const response = await branchWechatFansApi.updateFansRemark(branchId, remarkForm.openid, remarkForm.remark)
    
    if (response.code === 0) {
      ElMessage.success('备注更新成功')
      showRemarkDialog.value = false
      loadFans()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新备注失败:', error)
    ElMessage.error('更新失败')
  } finally {
    remarkSaving.value = false
  }
}

const handleFanAction = (command, fan) => {
  switch (command) {
    case 'move':
      moveGroupForm.openids = [fan.openid]
      moveGroupForm.group_id = fan.group_id || ''
      showMoveGroupDialog.value = true
      break
    case 'tag':
      ElMessage.info('标签功能开发中')
      break
    case 'block':
      blockFan(fan)
      break
  }
}

const batchMoveToGroup = () => {
  if (selectedFans.value.length === 0) {
    ElMessage.warning('请选择要移动的粉丝')
    return
  }
  
  moveGroupForm.openids = selectedFans.value.map(fan => fan.openid)
  moveGroupForm.group_id = ''
  showMoveGroupDialog.value = true
}

const confirmMoveGroup = async () => {
  try {
    moveSaving.value = true
    const response = await branchWechatFansApi.batchMoveFansToGroup(branchId, {
      openids: moveGroupForm.openids,
      group_id: moveGroupForm.group_id
    })
    
    if (response.code === 0) {
      ElMessage.success('移动成功')
      showMoveGroupDialog.value = false
      loadFans()
      loadGroups()
    } else {
      ElMessage.error(response.message || '移动失败')
    }
  } catch (error) {
    console.error('移动分组失败:', error)
    ElMessage.error('移动失败')
  } finally {
    moveSaving.value = false
  }
}

const blockFan = async (fan) => {
  try {
    await ElMessageBox.confirm('确定要拉黑这个粉丝吗？', '确认拉黑', {
      type: 'warning'
    })
    
    const response = await branchWechatFansApi.updateFan(branchId, fan.openid, { is_blocked: true })
    if (response.code === 0) {
      ElMessage.success('拉黑成功')
      loadFans()
    } else {
      ElMessage.error(response.message || '拉黑失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拉黑粉丝失败:', error)
      ElMessage.error('拉黑失败')
    }
  }
}

const exportFans = async () => {
  try {
    const response = await branchWechatFansApi.exportFans(branchId, searchForm)
    if (response.code === 0) {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = response.data.download_url
      link.download = response.data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      ElMessage.success('导出成功')
    } else {
      ElMessage.error(response.message || '导出失败')
    }
  } catch (error) {
    console.error('导出粉丝失败:', error)
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.branch-wechat-fans-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32px;
  color: #e4e7ed;
  z-index: 1;
}

.search-card {
  margin-bottom: 20px;
}

.groups-card {
  margin-bottom: 20px;
}

.groups-card.compact {
  /* 紧凑布局样式 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.groups-compact {
  padding: 8px 0;
}

.no-groups {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}

.groups-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.group-tag:hover {
  background-color: #409eff;
  color: white;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.group-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  transition: all 0.3s;
}

.group-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.group-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.group-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.fans-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.fan-info .nickname {
  font-weight: 500;
  color: #303133;
}

.fan-info .remark {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.text-gray {
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-groups {
  text-align: center;
  padding: 40px;
}

.fan-detail {
  padding: 20px 0;
}
</style> 