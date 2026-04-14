<template>
  <div class="branch-app-configs">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <Iphone class="title-icon" />
            APP配置管理
          </h1>
          <p class="page-description">管理各分支机构的APP配置信息</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <Plus />
            新增配置
          </el-button>
          <el-button @click="loadConfigs">
            <Refresh />
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="分支机构">
          <el-select v-model="queryParams.branch_id" placeholder="选择分支机构" clearable style="width: 200px">
            <el-option
              v-for="branch in branches"
              :key="branch.id"
              :label="branch.name"
              :value="branch.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索APP名称"
            style="width: 200px"
            @keyup.enter="loadConfigs"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadConfigs">
            <Search />
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon active">
          <Iphone />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ getActiveCount }}</div>
          <div class="stat-label">启用配置</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <Setting />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ configs.length }}</div>
          <div class="stat-label">总配置数</div>
        </div>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="configs"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="APP信息" min-width="200">
          <template #default="{ row }">
            <div class="app-info">
              <div class="app-logo">
                <img v-if="row.app_logo" :src="getLogoUrl(row.app_logo)" alt="APP图标" />
                <Iphone v-else />
              </div>
              <div class="app-details">
                <div class="app-name">{{ row.app_name }}</div>
                <div class="app-version">v{{ row.app_version }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分支机构" min-width="150">
          <template #default="{ row }">
            <div class="branch-info">
              <div class="branch-name">{{ row.branch_organization?.name }}</div>
              <div class="branch-code">{{ row.branch_organization?.code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="功能模块" min-width="200">
          <template #default="{ row }">
            <div class="modules">
              <el-tag v-if="row.enable_vip" type="success" size="small">VIP</el-tag>
              <el-tag v-if="row.enable_mall" type="primary" size="small">商城</el-tag>
              <el-tag v-if="row.enable_device" type="warning" size="small">设备</el-tag>
              <el-tag v-if="row.enable_dividend" type="info" size="small">分红</el-tag>
              <el-tag v-if="row.enable_salesman" type="danger" size="small">业务员</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="VIP价格" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.vip_price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            <span v-if="row.published_at">{{ formatDate(row.published_at) }}</span>
            <span v-else class="text-muted">未发布</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">
              <View />
              查看
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              <Edit />
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 'inactive'" command="publish">发布</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'active'" command="unpublish">取消发布</el-dropdown-item>
                  <el-dropdown-item command="versions">版本管理</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
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
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadConfigs"
          @current-change="loadConfigs"
        />
      </div>
    </div>

    <!-- 配置表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增APP配置' : '编辑APP配置'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基础信息" name="basic">
            <el-form-item label="分支机构" prop="branch_id">
              <el-select v-model="form.branch_id" placeholder="选择分支机构" style="width: 100%">
                <el-option
                  v-for="branch in branches"
                  :key="branch.id"
                  :label="branch.name"
                  :value="branch.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="APP名称" prop="app_name">
              <el-input v-model="form.app_name" placeholder="请输入APP名称" />
            </el-form-item>
            <el-form-item label="APP版本" prop="app_version">
              <el-input v-model="form.app_version" placeholder="请输入版本号，如：1.0.0" />
            </el-form-item>
            <el-form-item label="包名">
              <el-input v-model="form.package_name" placeholder="Android包名，如：com.example.app" />
            </el-form-item>
            <el-form-item label="Bundle ID">
              <el-input v-model="form.bundle_id" placeholder="iOS Bundle ID，如：com.example.app" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="active">启用</el-radio>
                <el-radio value="inactive">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="主题配置" name="theme">
            <el-form-item label="主色调">
              <el-color-picker v-model="form.primary_color" />
            </el-form-item>
            <el-form-item label="辅助色">
              <el-color-picker v-model="form.secondary_color" />
            </el-form-item>
            <el-form-item label="背景色">
              <el-color-picker v-model="form.background_color" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="功能模块" name="modules">
            <el-form-item label="VIP功能">
              <el-switch v-model="form.enable_vip" />
            </el-form-item>
            <el-form-item label="商城功能">
              <el-switch v-model="form.enable_mall" />
            </el-form-item>
            <el-form-item label="设备功能">
              <el-switch v-model="form.enable_device" />
            </el-form-item>
            <el-form-item label="分红功能">
              <el-switch v-model="form.enable_dividend" />
            </el-form-item>
            <el-form-item label="业务员功能">
              <el-switch v-model="form.enable_salesman" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="业务配置" name="business">
            <el-form-item label="VIP价格">
              <el-input-number v-model="form.vip_price" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="设备价格980">
              <el-input-number v-model="form.device_price_980" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="设备价格1200">
              <el-input-number v-model="form.device_price_1200" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="提成比例">
              <el-input-number v-model="form.commission_rate" :min="0" :max="1" :step="0.01" :precision="4" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="联系方式" name="contact">
            <el-form-item label="客服电话">
              <el-input v-model="form.service_phone" placeholder="请输入客服电话" />
            </el-form-item>
            <el-form-item label="客服微信">
              <el-input v-model="form.service_wechat" placeholder="请输入客服微信" />
            </el-form-item>
            <el-form-item label="客服QQ">
              <el-input v-model="form.service_qq" placeholder="请输入客服QQ" />
            </el-form-item>
            <el-form-item label="服务地址">
              <el-input v-model="form.service_address" type="textarea" placeholder="请输入服务地址" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ dialogMode === 'create' ? '创建' : '更新' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="APP配置详情"
      width="900px"
    >
      <div v-if="selectedConfig" class="config-detail">
        <!-- 详情内容 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="APP名称">{{ selectedConfig.app_name }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ selectedConfig.app_version }}</el-descriptions-item>
          <el-descriptions-item label="分支机构">{{ selectedConfig.branch_organization?.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedConfig.status === 'active' ? 'success' : 'danger'">
              {{ selectedConfig.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="VIP价格">¥{{ selectedConfig.vip_price }}</el-descriptions-item>
          <el-descriptions-item label="提成比例">{{ (selectedConfig.commission_rate * 100).toFixed(2) }}%</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Iphone,
  Plus,
  Refresh,
  Search,
  Setting,
  View,
  Edit,
  ArrowDown
} from '@element-plus/icons-vue'
import adminApi from '@/api/admin'

const {
  getBranchAppConfigs,
  createBranchAppConfig,
  updateBranchAppConfig,
  deleteBranchAppConfig,
  publishBranchAppConfig,
  unpublishBranchAppConfig,
  getBranchOptions
} = adminApi

export default {
  name: 'BranchAppConfigs',
  components: {
    Iphone,
    Plus,
    Refresh,
    Search,
    Setting,
    View,
    Edit,
    ArrowDown
  },
  setup() {
    const loading = ref(false)
    const submitLoading = ref(false)
    const configs = ref([])
    const branches = ref([])
    const dialogVisible = ref(false)
    const detailDialogVisible = ref(false)
    const dialogMode = ref('create')
    const selectedConfig = ref(null)
    const formRef = ref(null)
    const activeTab = ref('basic')

    const queryParams = reactive({
      keyword: '',
      status: '',
      branch_id: '',
      page: 1,
      per_page: 20
    })

    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    })

    const form = reactive({
      branch_id: '',
      app_name: '',
      app_version: '1.0.0',
      package_name: '',
      bundle_id: '',
      primary_color: '#1890ff',
      secondary_color: '#52c41a',
      background_color: '#f5f5f5',
      enable_vip: true,
      enable_mall: true,
      enable_device: true,
      enable_dividend: true,
      enable_salesman: true,
      vip_price: 1888.00,
      device_price_980: 980.00,
      device_price_1200: 1200.00,
      commission_rate: 0.3000,
      service_phone: '',
      service_wechat: '',
      service_qq: '',
      service_address: '',
      status: 'active'
    })

    const formRules = {
      branch_id: [
        { required: true, message: '请选择分支机构', trigger: 'change' }
      ],
      app_name: [
        { required: true, message: '请输入APP名称', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }

    // 计算属性
    const getActiveCount = computed(() => {
      return configs.value.filter(config => config.status === 'active').length
    })

    // 加载配置列表
    const loadConfigs = async () => {
      loading.value = true
      try {
        const params = {
          ...queryParams,
          page: pagination.current_page,
          per_page: pagination.per_page
        }
        const response = await getBranchAppConfigs(params)
        if (response.code === 0) {
          configs.value = response.data.data
          Object.assign(pagination, {
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total,
            last_page: response.data.last_page
          })
        }
      } catch (error) {
        ElMessage.error('加载配置列表失败')
      } finally {
        loading.value = false
      }
    }

    // 加载分支机构选项
    const loadBranches = async () => {
      try {
        const response = await getBranchOptions()
        if (response.code === 0) {
          branches.value = response.data
        }
      } catch (error) {
        ElMessage.error('加载分支机构选项失败')
      }
    }

    // 重置搜索
    const resetSearch = () => {
      Object.assign(queryParams, {
        keyword: '',
        status: '',
        branch_id: '',
        page: 1,
        per_page: 20
      })
      loadConfigs()
    }

    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        branch_id: '',
        app_name: '',
        app_version: '1.0.0',
        package_name: '',
        bundle_id: '',
        primary_color: '#1890ff',
        secondary_color: '#52c41a',
        background_color: '#f5f5f5',
        enable_vip: true,
        enable_mall: true,
        enable_device: true,
        enable_dividend: true,
        enable_salesman: true,
        vip_price: 1888.00,
        device_price_980: 980.00,
        device_price_1200: 1200.00,
        commission_rate: 0.3000,
        service_phone: '',
        service_wechat: '',
        service_qq: '',
        service_address: '',
        status: 'active'
      })
      activeTab.value = 'basic'
    }

    // 处理创建
    const handleCreate = () => {
      dialogMode.value = 'create'
      resetForm()
      dialogVisible.value = true
    }

    // 处理编辑
    const handleEdit = (row) => {
      dialogMode.value = 'edit'
      Object.assign(form, row)
      selectedConfig.value = row
      dialogVisible.value = true
    }

    // 处理查看
    const handleView = (row) => {
      selectedConfig.value = row
      detailDialogVisible.value = true
    }

    // 处理命令
    const handleCommand = async (command, row) => {
      switch (command) {
        case 'publish':
          await handlePublish(row)
          break
        case 'unpublish':
          await handleUnpublish(row)
          break
        case 'versions':
          // TODO: 跳转到版本管理页面
          ElMessage.info('版本管理功能开发中')
          break
        case 'delete':
          await handleDelete(row)
          break
      }
    }

    // 处理发布
    const handlePublish = async (row) => {
      try {
        await ElMessageBox.confirm('确定要发布此APP配置吗？', '确认发布', {
          type: 'warning'
        })
        
        const response = await publishBranchAppConfig(row.id)
        if (response.code === 0) {
          ElMessage.success('发布成功')
          loadConfigs()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('发布失败')
        }
      }
    }

    // 处理取消发布
    const handleUnpublish = async (row) => {
      try {
        await ElMessageBox.confirm('确定要取消发布此APP配置吗？', '确认取消发布', {
          type: 'warning'
        })
        
        const response = await unpublishBranchAppConfig(row.id)
        if (response.code === 0) {
          ElMessage.success('取消发布成功')
          loadConfigs()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('取消发布失败')
        }
      }
    }

    // 处理删除
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除此APP配置吗？删除后不可恢复！', '确认删除', {
          type: 'error'
        })
        
        const response = await deleteBranchAppConfig(row.id)
        if (response.code === 0) {
          ElMessage.success('删除成功')
          loadConfigs()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }

    // 处理提交
    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        
        submitLoading.value = true
        
        let response
        if (dialogMode.value === 'create') {
          response = await createBranchAppConfig(form)
        } else {
          response = await updateBranchAppConfig(selectedConfig.value.id, form)
        }
        
        if (response.code === 0) {
          ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          loadConfigs()
        }
      } catch (error) {
        ElMessage.error(dialogMode.value === 'create' ? '创建失败' : '更新失败')
      } finally {
        submitLoading.value = false
      }
    }

    // 获取图标URL
    const getLogoUrl = (path) => {
      return `/storage/${path}`
    }

    // 格式化日期
    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    onMounted(() => {
      loadConfigs()
      loadBranches()
    })

    return {
      loading,
      submitLoading,
      configs,
      branches,
      dialogVisible,
      detailDialogVisible,
      dialogMode,
      selectedConfig,
      formRef,
      activeTab,
      queryParams,
      pagination,
      form,
      formRules,
      getActiveCount,
      loadConfigs,
      resetSearch,
      handleCreate,
      handleEdit,
      handleView,
      handleCommand,
      handleSubmit,
      getLogoUrl,
      formatDate
    }
  }
}
</script>

<style scoped>
.branch-app-configs {
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.total {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.app-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-name {
  font-weight: 600;
  color: #333;
}

.app-version {
  font-size: 12px;
  color: #666;
}

.branch-info .branch-name {
  font-weight: 500;
  color: #333;
}

.branch-info .branch-code {
  font-size: 12px;
  color: #666;
}

.modules {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.price {
  font-weight: 600;
  color: #f56c6c;
}

.text-muted {
  color: #999;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.config-detail {
  padding: 20px 0;
}
</style> 