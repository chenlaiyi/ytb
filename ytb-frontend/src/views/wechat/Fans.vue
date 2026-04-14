<template>
  <div class="wechat-fans-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.total_fans || 0 }}</div>
            <div class="stat-label">总粉丝数</div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.subscribed_fans || 0 }}</div>
            <div class="stat-label">已关注</div>
          </div>
          <el-icon class="stat-icon"><UserFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.today_new_fans || 0 }}</div>
            <div class="stat-label">今日新增</div>
          </div>
          <el-icon class="stat-icon"><Plus /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.active_fans || 0 }}</div>
            <div class="stat-label">活跃粉丝</div>
          </div>
          <el-icon class="stat-icon"><ChatDotRound /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input 
            v-model="filters.keyword" 
            placeholder="昵称/备注/OpenID"
            clearable
            style="width: 200px;"
            @keyup.enter="loadFans"
          />
        </el-form-item>
        <el-form-item label="关注状态">
          <el-select v-model="filters.subscribe" placeholder="全部" clearable style="width: 120px;">
            <el-option label="已关注" :value="1" />
            <el-option label="已取消" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="filters.sex" placeholder="全部" clearable style="width: 100px;">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
            <el-option label="未知" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadFans">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 粉丝列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>粉丝列表</span>
          <el-button type="primary" @click="syncFans" :loading="syncing">
            <el-icon><Refresh /></el-icon>
            同步粉丝
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="fansList" style="width: 100%">
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.headimgurl" :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="昵称" prop="nickname" min-width="120">
          <template #default="{ row }">
            <div class="fan-info">
              <span class="nickname">{{ row.nickname || '微信用户' }}</span>
              <span v-if="row.remark" class="remark">备注：{{ row.remark }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="getSexTagType(row.sex)" size="small">
              {{ getSexText(row.sex) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="地区" width="150">
          <template #default="{ row }">
            {{ formatLocation(row) }}
          </template>
        </el-table-column>
        <el-table-column label="关注状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.subscribe ? 'success' : 'danger'" size="small">
              {{ row.subscribe ? '已关注' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关注时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.subscribe_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="editRemark(row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadFans"
          @current-change="loadFans"
        />
      </div>
    </el-card>

    <!-- 粉丝详情对话框 -->
    <el-dialog v-model="detailVisible" title="粉丝详情" width="600px">
      <el-descriptions v-if="currentFan" :column="2" border>
        <el-descriptions-item label="头像" :span="2">
          <el-avatar :src="currentFan.headimgurl" :size="80">
            <el-icon><User /></el-icon>
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentFan.nickname || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ getSexText(currentFan.sex) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentFan.remark || '无' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ currentFan.openid }}</el-descriptions-item>
        <el-descriptions-item label="地区" :span="2">{{ formatLocation(currentFan) }}</el-descriptions-item>
        <el-descriptions-item label="关注状态">
          <el-tag :type="currentFan.subscribe ? 'success' : 'danger'">
            {{ currentFan.subscribe ? '已关注' : '已取消' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关注时间">{{ formatTime(currentFan.subscribe_time) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 备注编辑对话框 -->
    <el-dialog v-model="remarkVisible" title="编辑备注" width="400px">
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="备注">
          <el-input 
            v-model="remarkForm.remark" 
            placeholder="请输入备注"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRemark" :loading="remarkSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Plus, ChatDotRound, Search, Refresh } from '@element-plus/icons-vue'
import * as wechatApi from '@/api/v1/wechat'

// 状态
const loading = ref(false)
const syncing = ref(false)
const stats = ref({})
const fansList = ref([])

// 筛选条件
const filters = reactive({
  keyword: '',
  subscribe: '',
  sex: ''
})

// 分页
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

// 对话框
const detailVisible = ref(false)
const remarkVisible = ref(false)
const currentFan = ref(null)
const remarkForm = reactive({
  id: null,
  remark: ''
})
const remarkSaving = ref(false)

// 生命周期
onMounted(() => {
  loadStats()
  loadFans()
})

// 方法
const loadStats = async () => {
  try {
    const res = await wechatApi.getFansStatistics()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadFans = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filters
    }
    const res = await wechatApi.getFansList(params)
    if (res.code === 0) {
      fansList.value = res.data.data || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载粉丝列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const syncFans = async () => {
  syncing.value = true
  try {
    const res = await wechatApi.syncFans()
    if (res.code === 0) {
      ElMessage.success(res.data.message || '同步任务已启动')
      loadStats()
      loadFans()
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { keyword: '', subscribe: '', sex: '' })
  pagination.page = 1
  loadFans()
}

const viewDetail = (fan) => {
  currentFan.value = fan
  detailVisible.value = true
}

const editRemark = (fan) => {
  remarkForm.id = fan.id
  remarkForm.remark = fan.remark || ''
  remarkVisible.value = true
}

const saveRemark = async () => {
  remarkSaving.value = true
  try {
    const res = await wechatApi.updateFanRemark(remarkForm.id, remarkForm.remark)
    if (res.code === 0) {
      ElMessage.success('保存成功')
      remarkVisible.value = false
      loadFans()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    remarkSaving.value = false
  }
}

// 工具方法
const getSexText = (sex) => {
  const map = { 0: '未知', 1: '男', 2: '女' }
  return map[sex] || '未知'
}

const getSexTagType = (sex) => {
  const map = { 0: 'info', 1: 'primary', 2: 'danger' }
  return map[sex] || 'info'
}

const formatLocation = (fan) => {
  const parts = [fan.country, fan.province, fan.city].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '未知'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.wechat-fans-page {
  padding: 0;
}

.stats-row {
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
  font-size: 48px;
  color: #e4e7ed;
  z-index: 1;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fan-info {
  display: flex;
  flex-direction: column;
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
