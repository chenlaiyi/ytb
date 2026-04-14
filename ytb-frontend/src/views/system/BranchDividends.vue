<template>
  <div class="branch-dividends">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>分公司分红配置管理</h1>
      <p>管理分支机构的CP招募和设备充值分红配置规则</p>
      <div class="header-actions">
        <el-button type="success" @click="exportData" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出配置
        </el-button>
        <el-button type="warning" @click="showBatchDialog">
          <el-icon><Operation /></el-icon>
          批量操作
        </el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增配置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon vip-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalBranches || 0 }}</div>
              <div class="stat-label">分支机构总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.activeConfigs || 0 }}</div>
              <div class="stat-label">启用配置数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pool-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">¥{{ (statistics.totalPoolAmount || 0).toLocaleString() }}</div>
              <div class="stat-label">总奖金池金额</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon update-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.recentUpdates || 0 }}</div>
              <div class="stat-label">近7天更新</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="分支机构">
          <el-select v-model="searchForm.branch_id" placeholder="选择分支机构" clearable filterable>
            <el-option
              v-for="branch in branches"
              :key="branch.id"
              :label="`${branch.name} (${branch.code})`"
              :value="branch.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="选择状态" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖金池范围">
          <el-input-number
            v-model="searchForm.min_pool_amount"
            placeholder="最小金额"
            :min="0"
            style="width: 120px; margin-right: 10px;"
          />
          <span style="margin: 0 10px;">-</span>
          <el-input-number
            v-model="searchForm.max_pool_amount"
            placeholder="最大金额"
            :min="0"
            style="width: 120px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="分支机构" min-width="180">
          <template #default="{ row }">
            <div class="branch-info">
              <div class="branch-name">{{ getBranchName(row.branch_id) }}</div>
              <div class="branch-code">{{ getBranchCode(row.branch_id) }}</div>
            </div>
          </template>
        </el-table-column>
        
        <!-- CP分红配置 -->
        <el-table-column label="CP分红配置" min-width="280">
          <template #default="{ row }">
            <div class="dividend-config">
              <div class="config-item">
                <span class="level-tag junior">初级</span>
                <span class="requirement">{{ row.vip_junior_requirement }}人</span>
                <span class="amount">¥{{ row.vip_junior_amount || row.vip_pool_amount || 300 }}/人</span>
              </div>
              <div class="config-item">
                <span class="level-tag middle">中级</span>
                <span class="requirement">{{ row.vip_middle_requirement }}人</span>
                <span class="amount">¥{{ row.vip_middle_amount || row.vip_pool_amount || 300 }}/人</span>
              </div>
              <div class="config-item">
                <span class="level-tag senior">高级</span>
                <span class="requirement">{{ row.vip_senior_requirement }}人</span>
                <span class="amount">¥{{ row.vip_senior_amount || row.vip_pool_amount || 300 }}/人</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <!-- 充值分红配置 -->
        <el-table-column label="充值分红配置" min-width="280">
          <template #default="{ row }">
            <div class="dividend-config">
              <div class="config-item">
                <span class="level-tag junior">初级</span>
                <span class="requirement">{{ row.recharge_junior_requirement }}台</span>
                <span class="amount">¥{{ row.recharge_junior_amount || row.recharge_pool_amount || 15 }}/台</span>
              </div>
              <div class="config-item">
                <span class="level-tag middle">中级</span>
                <span class="requirement">{{ row.recharge_middle_requirement }}台</span>
                <span class="amount">¥{{ row.recharge_middle_amount || row.recharge_pool_amount || 15 }}/台</span>
              </div>
              <div class="config-item">
                <span class="level-tag senior">高级</span>
                <span class="requirement">{{ row.recharge_senior_requirement }}台</span>
                <span class="amount">¥{{ row.recharge_senior_amount || row.recharge_pool_amount || 15 }}/台</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button size="small" type="primary" @click="showEditDialog(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="warning" @click="showPreviewDialog(row)">
              <el-icon><DataAnalysis /></el-icon>
              预览
            </el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              <el-icon><Switch /></el-icon>
              {{ row.is_active ? '禁用' : '启用' }}
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
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="分支机构" prop="branch_id">
          <el-select v-model="form.branch_id" placeholder="选择分支机构" filterable>
            <el-option
              v-for="branch in branches"
              :key="branch.id"
              :label="`${branch.name} (${branch.code})`"
              :value="branch.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- CP分红配置 -->
        <el-divider content-position="left">CP招募分红配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="初级达标要求" prop="vip_junior_requirement">
              <el-input-number
                v-model="form.vip_junior_requirement"
                :min="0"
                :max="1000"
                placeholder="人数"
                style="width: 100%"
              />
              <div class="form-tip">初级分红最低达标人数</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="中级达标要求" prop="vip_middle_requirement">
              <el-input-number
                v-model="form.vip_middle_requirement"
                :min="0"
                :max="1000"
                placeholder="人数"
                style="width: 100%"
              />
              <div class="form-tip">中级分红最低达标人数</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高级达标要求" prop="vip_senior_requirement">
              <el-input-number
                v-model="form.vip_senior_requirement"
                :min="0"
                :max="1000"
                placeholder="人数"
                style="width: 100%"
              />
              <div class="form-tip">高级分红最低达标人数</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="初级基数" prop="vip_junior_amount">
          <el-input-number
                v-model="form.vip_junior_amount"
            :min="0"
            :max="10000"
            :precision="2"
                placeholder="300"
                style="width: 100%"
          />
              <div class="form-tip">初级分红基数(元/人)</div>
        </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="中级基数" prop="vip_middle_amount">
              <el-input-number
                v-model="form.vip_middle_amount"
                :min="0"
                :max="10000"
                :precision="2"
                placeholder="300"
                style="width: 100%"
              />
              <div class="form-tip">中级分红基数(元/人)</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高级基数" prop="vip_senior_amount">
              <el-input-number
                v-model="form.vip_senior_amount"
                :min="0"
                :max="10000"
                :precision="2"
                placeholder="300"
                style="width: 100%"
              />
              <div class="form-tip">高级分红基数(元/人)</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 充值分红配置 -->
        <el-divider content-position="left">设备充值分红配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="初级达标要求" prop="recharge_junior_requirement">
              <el-input-number
                v-model="form.recharge_junior_requirement"
                :min="0"
                :max="1000"
                placeholder="台数"
                style="width: 100%"
              />
              <div class="form-tip">初级分红最低达标台数</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="中级达标要求" prop="recharge_middle_requirement">
              <el-input-number
                v-model="form.recharge_middle_requirement"
                :min="0"
                :max="1000"
                placeholder="台数"
                style="width: 100%"
              />
              <div class="form-tip">中级分红最低达标台数</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高级达标要求" prop="recharge_senior_requirement">
              <el-input-number
                v-model="form.recharge_senior_requirement"
                :min="0"
                :max="1000"
                placeholder="台数"
                style="width: 100%"
              />
              <div class="form-tip">高级分红最低达标台数</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="初级基数" prop="recharge_junior_amount">
          <el-input-number
                v-model="form.recharge_junior_amount"
            :min="0"
            :max="1000"
            :precision="2"
                placeholder="15"
                style="width: 100%"
          />
              <div class="form-tip">初级分红基数(元/台)</div>
        </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="中级基数" prop="recharge_middle_amount">
              <el-input-number
                v-model="form.recharge_middle_amount"
                :min="0"
                :max="1000"
                :precision="2"
                placeholder="15"
                style="width: 100%"
              />
              <div class="form-tip">中级分红基数(元/台)</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高级基数" prop="recharge_senior_amount">
              <el-input-number
                v-model="form.recharge_senior_amount"
                :min="0"
                :max="1000"
                :precision="2"
                placeholder="15"
                style="width: 100%"
              />
              <div class="form-tip">高级分红基数(元/台)</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="状态" prop="is_active">
          <el-radio-group v-model="form.is_active">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配置描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入配置描述"
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
      title="分红配置详情"
      width="700px"
    >
      <div v-if="currentConfig" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="配置ID">{{ currentConfig.id }}</el-descriptions-item>
          <el-descriptions-item label="分支机构">
            {{ getBranchName(currentConfig.branch_id) }} ({{ getBranchCode(currentConfig.branch_id) }})
          </el-descriptions-item>
          <el-descriptions-item label="VIP初级要求">{{ currentConfig.vip_junior_requirement }}人</el-descriptions-item>
          <el-descriptions-item label="VIP初级基数">¥{{ currentConfig.vip_junior_amount || currentConfig.vip_pool_amount || 300 }}/人</el-descriptions-item>
          <el-descriptions-item label="VIP中级要求">{{ currentConfig.vip_middle_requirement }}人</el-descriptions-item>
          <el-descriptions-item label="VIP中级基数">¥{{ currentConfig.vip_middle_amount || currentConfig.vip_pool_amount || 300 }}/人</el-descriptions-item>
          <el-descriptions-item label="VIP高级要求">{{ currentConfig.vip_senior_requirement }}人</el-descriptions-item>
          <el-descriptions-item label="VIP高级基数">¥{{ currentConfig.vip_senior_amount || currentConfig.vip_pool_amount || 300 }}/人</el-descriptions-item>
          <el-descriptions-item label="充值初级要求">{{ currentConfig.recharge_junior_requirement }}台</el-descriptions-item>
          <el-descriptions-item label="充值初级基数">¥{{ currentConfig.recharge_junior_amount || currentConfig.recharge_pool_amount || 15 }}/台</el-descriptions-item>
          <el-descriptions-item label="充值中级要求">{{ currentConfig.recharge_middle_requirement }}台</el-descriptions-item>
          <el-descriptions-item label="充值中级基数">¥{{ currentConfig.recharge_middle_amount || currentConfig.recharge_pool_amount || 15 }}/台</el-descriptions-item>
          <el-descriptions-item label="充值高级要求">{{ currentConfig.recharge_senior_requirement }}台</el-descriptions-item>
          <el-descriptions-item label="充值高级基数">¥{{ currentConfig.recharge_senior_amount || currentConfig.recharge_pool_amount || 15 }}/台</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentConfig.is_active ? 'success' : 'danger'">
              {{ currentConfig.is_active ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentConfig.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ formatDate(currentConfig.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="配置描述" :span="2">
            {{ currentConfig.description || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 分红预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="分红配置预览"
      width="900px"
    >
      <div v-if="previewData" class="preview-content">
        <el-tabs v-model="activePreviewTab">
          <el-tab-pane label="CP分红预览" name="vip">
            <div class="preview-section">
              <h4>CP招募分红配置预览</h4>
              <el-table :data="previewData.vip" border>
                <el-table-column prop="level" label="分红等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.level === 'junior' ? 'info' : row.level === 'middle' ? 'warning' : 'danger'">
                      {{ row.level === 'junior' ? '初级' : row.level === 'middle' ? '中级' : '高级' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="requirement" label="达标要求" />
                <el-table-column prop="poolAmount" label="奖金池金额" />
                <el-table-column prop="estimatedUsers" label="预计达标人数" />
                <el-table-column prop="estimatedDividend" label="预计人均分红" />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="充值分红预览" name="recharge">
            <div class="preview-section">
              <h4>设备充值分红配置预览</h4>
              <el-table :data="previewData.recharge" border>
                <el-table-column prop="level" label="分红等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.level === 'junior' ? 'info' : row.level === 'middle' ? 'warning' : 'danger'">
                      {{ row.level === 'junior' ? '初级' : row.level === 'middle' ? '中级' : '高级' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="requirement" label="达标要求" />
                <el-table-column prop="poolAmount" label="奖金池金额" />
                <el-table-column prop="estimatedUsers" label="预计达标人数" />
                <el-table-column prop="estimatedDividend" label="预计人均分红" />
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="batchVisible"
      title="批量操作"
      width="600px"
    >
      <div class="batch-content">
        <el-alert
          :title="`已选择 ${selectedRows.length} 条记录`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form :model="batchForm" label-width="120px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="batchForm.action">
              <el-radio label="enable">批量启用</el-radio>
              <el-radio label="disable">批量禁用</el-radio>
              <el-radio label="update_pool">批量更新奖金池</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <template v-if="batchForm.action === 'update_pool'">
            <el-divider content-position="left">CP分红基数</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="初级基数">
              <el-input-number
                    v-model="batchForm.vip_junior_amount"
                :min="0"
                :precision="2"
                placeholder="元/人"
                    style="width: 100%"
              />
            </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="中级基数">
              <el-input-number
                    v-model="batchForm.vip_middle_amount"
                    :min="0"
                    :precision="2"
                    placeholder="元/人"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="高级基数">
                  <el-input-number
                    v-model="batchForm.vip_senior_amount"
                    :min="0"
                    :precision="2"
                    placeholder="元/人"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">充值分红基数</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="初级基数">
                  <el-input-number
                    v-model="batchForm.recharge_junior_amount"
                :min="0"
                :precision="2"
                placeholder="元/台"
                    style="width: 100%"
              />
            </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="中级基数">
                  <el-input-number
                    v-model="batchForm.recharge_middle_amount"
                    :min="0"
                    :precision="2"
                    placeholder="元/台"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="高级基数">
                  <el-input-number
                    v-model="batchForm.recharge_senior_amount"
                    :min="0"
                    :precision="2"
                    placeholder="元/台"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchOperation" :loading="batchSubmitting">
            执行操作
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Download, Operation, Search, Refresh, User, Check, Money, Clock,
  View, Edit, DataAnalysis, Switch
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const exporting = ref(false)
const batchSubmitting = ref(false)
const tableData = ref([])
const branches = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const previewVisible = ref(false)
const batchVisible = ref(false)
const currentConfig = ref(null)
const previewData = ref(null)
const isEdit = ref(false)
const formRef = ref()
const activePreviewTab = ref('vip')
const selectedRows = ref([])

// 统计数据
const statistics = ref({
  totalBranches: 0,
  activeConfigs: 0,
  totalPoolAmount: 0,
  recentUpdates: 0
})

// 搜索表单
const searchForm = reactive({
  branch_id: '',
  is_active: '',
  min_pool_amount: '',
  max_pool_amount: ''
})

// 分页信息
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0
})

// 表单数据
const form = reactive({
  branch_id: '',
  is_active: true,
  vip_junior_requirement: 3,
  vip_middle_requirement: 10,
  vip_senior_requirement: 30,
      vip_junior_amount: 300.00,
    vip_middle_amount: 300.00,
    vip_senior_amount: 300.00,
  recharge_junior_requirement: 10,
  recharge_middle_requirement: 30,
  recharge_senior_requirement: 80,
      recharge_junior_amount: 15.00,
    recharge_middle_amount: 15.00,
    recharge_senior_amount: 15.00,
  description: ''
})

// 批量操作表单
const batchForm = reactive({
  action: 'enable',
        vip_junior_amount: 0,
      vip_middle_amount: 0,
      vip_senior_amount: 0,
        recharge_junior_amount: 0,
      recharge_middle_amount: 0,
      recharge_senior_amount: 0
})

// 表单验证规则
const formRules = {
  branch_id: [
    { required: true, message: '请选择分支机构', trigger: 'change' }
  ],
  vip_junior_requirement: [
    { required: true, message: '请输入VIP初级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  vip_middle_requirement: [
    { required: true, message: '请输入VIP中级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  vip_senior_requirement: [
    { required: true, message: '请输入VIP高级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  vip_junior_amount: [
    { required: true, message: '请输入VIP初级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  vip_middle_amount: [
    { required: true, message: '请输入VIP中级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  vip_senior_amount: [
    { required: true, message: '请输入VIP高级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  recharge_junior_requirement: [
    { required: true, message: '请输入充值初级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  recharge_middle_requirement: [
    { required: true, message: '请输入充值中级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  recharge_senior_requirement: [
    { required: true, message: '请输入充值高级达标要求', trigger: 'blur' },
    { type: 'number', min: 0, message: '数值不能小于0', trigger: 'blur' }
  ],
  recharge_junior_amount: [
    { required: true, message: '请输入充值初级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  recharge_middle_amount: [
    { required: true, message: '请输入充值中级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  recharge_senior_amount: [
    { required: true, message: '请输入充值高级分红基数', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑分红配置' : '新增分红配置'
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
    
    const response = await request.get('/api/admin/v1/branch-dividend-configs', { params })
    
    if (response.code === 0) {
      tableData.value = response.data.data
      pagination.total = response.data.total
      pagination.current_page = response.data.current_page
      pagination.per_page = response.data.per_page
    } else {
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取分红配置列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchBranches = async () => {
  try {
    const response = await request.get('/api/admin/v1/branch-organizations/options')
    if (response.code === 0) {
      branches.value = response.data
    }
  } catch (error) {
    console.error('获取分支机构列表失败:', error)
  }
}

const fetchStatistics = async () => {
  try {
    const response = await request.get('/api/admin/v1/branch-dividend-configs/statistics')
    if (response.code === 0) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getBranchName = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  return branch ? branch.name : '未知机构'
}

const getBranchCode = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  return branch ? branch.code : '未知编号'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSearch = () => {
  pagination.current_page = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    branch_id: '',
    is_active: '',
    min_pool_amount: '',
    max_pool_amount: ''
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
  currentConfig.value = row
  Object.assign(form, {
    id: row.id,
    branch_id: row.branch_id,
    vip_junior_requirement: row.vip_junior_requirement,
    vip_middle_requirement: row.vip_middle_requirement,
    vip_senior_requirement: row.vip_senior_requirement,
    vip_junior_amount: row.vip_junior_amount || row.vip_pool_amount || 300,
    vip_middle_amount: row.vip_middle_amount || row.vip_pool_amount || 300,
    vip_senior_amount: row.vip_senior_amount || row.vip_pool_amount || 300,
    recharge_junior_requirement: row.recharge_junior_requirement,
    recharge_middle_requirement: row.recharge_middle_requirement,
    recharge_senior_requirement: row.recharge_senior_requirement,
    recharge_junior_amount: row.recharge_junior_amount || row.recharge_pool_amount || 15,
    recharge_middle_amount: row.recharge_middle_amount || row.recharge_pool_amount || 15,
    recharge_senior_amount: row.recharge_senior_amount || row.recharge_pool_amount || 15,
    is_active: row.is_active,
    description: row.description
  })
  dialogVisible.value = true
}

const showDetail = (row) => {
  currentConfig.value = row
  detailVisible.value = true
}

const showPreviewDialog = async (row) => {
  try {
    const response = await request.get(`/api/admin/v1/branch-dividend-configs/${row.id}/preview`)
    if (response.code === 0) {
      previewData.value = response.data
      currentConfig.value = row
      previewVisible.value = true
    } else {
      ElMessage.error(response.message || '获取预览数据失败')
    }
  } catch (error) {
    console.error('获取预览数据失败:', error)
    ElMessage.error('获取预览数据失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value 
      ? `/api/admin/v1/branch-dividend-configs/${form.id}`
      : '/api/admin/v1/branch-dividend-configs'
    
    const method = isEdit.value ? 'put' : 'post'
    const response = await request[method](url, form)
    
    if (response.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
      fetchStatistics()
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
    await ElMessageBox.confirm(
      `确定要${row.is_active ? '禁用' : '启用'}这个分红配置吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await request.put(`/api/admin/v1/branch-dividend-configs/${row.id}/status`, {
      is_active: !row.is_active
    })
    
    if (response.code === 0) {
      ElMessage.success('状态更新成功')
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error('状态更新失败')
    }
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    branch_id: '',
    is_active: true,
    vip_junior_requirement: 3,
    vip_middle_requirement: 10,
    vip_senior_requirement: 30,
    vip_junior_amount: 300.00,
    vip_middle_amount: 300.00,
    vip_senior_amount: 300.00,
    recharge_junior_requirement: 10,
    recharge_middle_requirement: 30,
    recharge_senior_requirement: 80,
    recharge_junior_amount: 15.00,
    recharge_middle_amount: 15.00,
    recharge_senior_amount: 15.00,
    description: ''
  })
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows.map(row => row.id)
}

const exportData = async () => {
  try {
    exporting.value = true
    const response = await request.post('/api/admin/v1/branch-dividend-configs/export', {
      ...searchForm
    }, {
      responseType: 'blob'
    })
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `分公司分红配置_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const showBatchDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的记录')
    return
  }
  batchVisible.value = true
}

const handleBatchOperation = async () => {
  try {
    batchSubmitting.value = true
    const response = await request.post('/api/admin/v1/branch-dividend-configs/batch', {
      action: batchForm.action,
      ids: selectedRows.value,
              vip_junior_amount: batchForm.vip_junior_amount,
        vip_middle_amount: batchForm.vip_middle_amount,
        vip_senior_amount: batchForm.vip_senior_amount,
              recharge_junior_amount: batchForm.recharge_junior_amount,
        recharge_middle_amount: batchForm.recharge_middle_amount,
        recharge_senior_amount: batchForm.recharge_senior_amount
    })
    
    if (response.code === 0) {
      ElMessage.success('批量操作成功')
      batchVisible.value = false
      selectedRows.value = []
      fetchData()
      fetchStatistics()
    } else {
      ElMessage.error(response.message || '批量操作失败')
    }
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchBranches()
  fetchData()
  fetchStatistics()
})
</script>

<style scoped>
.branch-dividends {
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
  margin-left: 10px;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.stat-icon.vip-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon.pool-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-icon.update-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
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
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.branch-info {
  display: flex;
  flex-direction: column;
}

.branch-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.branch-code {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.dividend-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  min-width: 40px;
  text-align: center;
}

.level-tag.junior {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

.level-tag.middle {
  background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
}

.level-tag.senior {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
}

.requirement {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.pool-amount {
  font-size: 13px;
  font-weight: 600;
  color: #00b894;
  margin-top: 5px;
  padding: 4px 8px;
  background: rgba(0, 184, 148, 0.1);
  border-radius: 4px;
  display: inline-block;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.detail-content {
  padding: 20px 0;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
}

.preview-section {
  padding: 20px 0;
}

.preview-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.batch-content {
  padding: 20px 0;
}

.batch-content .el-alert {
  margin-bottom: 20px;
}

.batch-content .el-form {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
}

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background: #f8f9fa;
  color: #333;
  font-weight: 600;
}

.el-table td {
  border-bottom: 1px solid #f0f0f0;
}

.el-table tr:hover td {
  background: #f8f9fa;
}

/* 按钮样式优化 */
.el-button {
  border-radius: 6px;
  font-weight: 500;
}

.el-button--small {
  padding: 5px 10px;
  font-size: 12px;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 20px;
}

.el-input-number {
  width: 100%;
}

.el-select {
  width: 100%;
}

.el-textarea {
  width: 100%;
}

/* 分割线样式 */
.el-divider {
  margin: 30px 0 20px 0;
}

.el-divider__text {
  font-weight: 600;
  color: #333;
}

/* 描述列表样式 */
.el-descriptions {
  margin-top: 20px;
}

.el-descriptions-item__label {
  font-weight: 600;
  color: #333;
}

/* 标签页样式 */
.el-tabs {
  margin-top: 20px;
}

.el-tab-pane {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-actions {
    position: static;
    margin-top: 20px;
    text-align: left;
  }
  
  .header-actions .el-button {
    margin: 5px 5px 5px 0;
  }
  
  .stat-card {
    margin-bottom: 15px;
  }
  
  .search-filters .el-form-item {
    margin-bottom: 15px;
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 加载状态 */
.el-loading-mask {
  border-radius: 8px;
}

/* 消息提示样式 */
.el-message {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 确认对话框样式 */
.el-message-box {
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style> 