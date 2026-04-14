<template>
  <div class="branch-app-versions">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <Box class="title-icon" />
            APP版本管理
          </h1>
          <p class="page-description">管理各分支机构APP的版本发布</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">
            <Plus />
            新增版本
          </el-button>
          <el-button @click="loadVersions">
            <Refresh />
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="APP配置">
          <el-select v-model="queryParams.app_config_id" placeholder="选择APP配置" clearable style="width: 200px">
            <el-option
              v-for="config in appConfigs"
              :key="config.id"
              :label="`${config.app_name} (${config.branch_organization?.name})`"
              :value="config.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="queryParams.platform" placeholder="选择平台" clearable style="width: 120px">
            <el-option label="Android" value="android" />
            <el-option label="iOS" value="ios" />
            <el-option label="H5" value="h5" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已废弃" value="deprecated" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索版本名称"
            style="width: 200px"
            @keyup.enter="loadVersions"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadVersions">
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
        <div class="stat-icon published">
          <Box />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ getPublishedCount }}</div>
          <div class="stat-label">已发布版本</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon draft">
          <Edit />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ getDraftCount }}</div>
          <div class="stat-label">草稿版本</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <Setting />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ versions.length }}</div>
          <div class="stat-label">总版本数</div>
        </div>
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="versions"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="APP信息" min-width="200">
          <template #default="{ row }">
            <div class="app-info">
              <div class="app-name">{{ row.branch_app_config?.app_name }}</div>
              <div class="branch-name">{{ row.branch_app_config?.branch_organization?.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="版本信息" min-width="150">
          <template #default="{ row }">
            <div class="version-info">
              <div class="version-name">{{ row.version_name }}</div>
              <div class="version-code">Build {{ row.version_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlatformType(row.platform)">
              {{ getPlatformName(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="120">
          <template #default="{ row }">
            <span v-if="row.file_size">{{ formatFileSize(row.file_size) }}</span>
            <span v-else class="text-muted">未上传</span>
          </template>
        </el-table-column>
        <el-table-column label="强制更新" width="100">
          <template #default="{ row }">
            <el-tag :type="row.force_update ? 'danger' : 'info'" size="small">
              {{ row.force_update ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            <span v-if="row.published_at">{{ formatDate(row.published_at) }}</span>
            <span v-else class="text-muted">未发布</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
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
                  <el-dropdown-item v-if="row.status === 'draft'" command="publish">发布</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'published'" command="deprecate">废弃</el-dropdown-item>
                  <el-dropdown-item command="upload" divided>上传安装包</el-dropdown-item>
                  <el-dropdown-item v-if="row.download_url" command="download">下载安装包</el-dropdown-item>
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
          @size-change="loadVersions"
          @current-change="loadVersions"
        />
      </div>
    </div>

    <!-- 版本表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增版本' : '编辑版本'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="APP配置" prop="app_config_id">
          <el-select v-model="form.app_config_id" placeholder="选择APP配置" style="width: 100%">
            <el-option
              v-for="config in appConfigs"
              :key="config.id"
              :label="`${config.app_name} (${config.branch_organization?.name})`"
              :value="config.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-radio-group v-model="form.platform">
            <el-radio value="android">Android</el-radio>
            <el-radio value="ios">iOS</el-radio>
            <el-radio value="h5">H5</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="版本名称" prop="version_name">
          <el-input v-model="form.version_name" placeholder="如：1.0.0" />
        </el-form-item>
        <el-form-item label="版本号" prop="version_code">
          <el-input-number v-model="form.version_code" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="下载地址">
          <el-input v-model="form.download_url" placeholder="安装包下载地址" />
        </el-form-item>
        <el-form-item label="最低支持版本">
          <el-input v-model="form.min_supported_version" placeholder="如：1.0.0" />
        </el-form-item>
        <el-form-item label="强制更新">
          <el-switch v-model="form.force_update" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">已发布</el-radio>
            <el-radio value="deprecated">已废弃</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入版本更新说明"
          />
        </el-form-item>
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
      title="版本详情"
      width="800px"
    >
      <div v-if="selectedVersion" class="version-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="APP名称">{{ selectedVersion.branch_app_config?.app_name }}</el-descriptions-item>
          <el-descriptions-item label="分支机构">{{ selectedVersion.branch_app_config?.branch_organization?.name }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ getPlatformName(selectedVersion.platform) }}</el-descriptions-item>
          <el-descriptions-item label="版本名称">{{ selectedVersion.version_name }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ selectedVersion.version_code }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">
            <span v-if="selectedVersion.file_size">{{ formatFileSize(selectedVersion.file_size) }}</span>
            <span v-else>未上传</span>
          </el-descriptions-item>
          <el-descriptions-item label="强制更新">
            <el-tag :type="selectedVersion.force_update ? 'danger' : 'info'" size="small">
              {{ selectedVersion.force_update ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedVersion.status)">
              {{ getStatusName(selectedVersion.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最低支持版本" :span="2">
            {{ selectedVersion.min_supported_version || '无限制' }}
          </el-descriptions-item>
          <el-descriptions-item label="下载地址" :span="2">
            <a v-if="selectedVersion.download_url" :href="selectedVersion.download_url" target="_blank">
              {{ selectedVersion.download_url }}
            </a>
            <span v-else>未设置</span>
          </el-descriptions-item>
          <el-descriptions-item label="更新说明" :span="2">
            <div class="description-content">
              {{ selectedVersion.description || '无' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 上传安装包对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传安装包"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        :before-upload="beforeUpload"
        :on-success="onUploadSuccess"
        :on-error="onUploadError"
        :show-file-list="false"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            <p v-if="selectedVersion?.platform === 'android'">只能上传APK文件，且不超过500MB</p>
            <p v-else-if="selectedVersion?.platform === 'ios'">只能上传IPA文件，且不超过500MB</p>
            <p v-else-if="selectedVersion?.platform === 'h5'">只能上传ZIP或TAR.GZ文件，且不超过500MB</p>
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box,
  Plus,
  Refresh,
  Search,
  Setting,
  View,
  Edit,
  ArrowDown,
  UploadFilled
} from '@element-plus/icons-vue'
import adminApi from '@/api/admin'

const {
  getBranchAppVersions,
  createBranchAppVersion,
  updateBranchAppVersion,
  deleteBranchAppVersion,
  publishBranchAppVersion,
  deprecateBranchAppVersion,
  getBranchAppConfigs
} = adminApi

export default {
  name: 'BranchAppVersions',
  components: {
    Box,
    Plus,
    Refresh,
    Search,
    Setting,
    View,
    Edit,
    ArrowDown,
    UploadFilled
  },
  setup() {
    const loading = ref(false)
    const submitLoading = ref(false)
    const versions = ref([])
    const appConfigs = ref([])
    const dialogVisible = ref(false)
    const detailDialogVisible = ref(false)
    const uploadDialogVisible = ref(false)
    const dialogMode = ref('create')
    const selectedVersion = ref(null)
    const formRef = ref(null)
    const uploadRef = ref(null)

    const queryParams = reactive({
      keyword: '',
      status: '',
      platform: '',
      app_config_id: '',
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
      app_config_id: '',
      platform: 'android',
      version_name: '',
      version_code: 1,
      download_url: '',
      file_size: null,
      description: '',
      force_update: false,
      min_supported_version: '',
      status: 'draft'
    })

    const formRules = {
      app_config_id: [
        { required: true, message: '请选择APP配置', trigger: 'change' }
      ],
      platform: [
        { required: true, message: '请选择平台', trigger: 'change' }
      ],
      version_name: [
        { required: true, message: '请输入版本名称', trigger: 'blur' }
      ],
      version_code: [
        { required: true, message: '请输入版本号', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }

    // 计算属性
    const getPublishedCount = computed(() => {
      return versions.value.filter(version => version.status === 'published').length
    })

    const getDraftCount = computed(() => {
      return versions.value.filter(version => version.status === 'draft').length
    })

    const uploadAction = computed(() => {
      return selectedVersion.value ? `/api/admin/v1/branch-app-versions/${selectedVersion.value.id}/upload-package` : ''
    })

    const uploadHeaders = computed(() => {
      const token = localStorage.getItem('admin_token')
      return {
        'Authorization': `Bearer ${token}`
      }
    })

    const uploadData = computed(() => {
      return {}
    })

    // 加载版本列表
    const loadVersions = async () => {
      loading.value = true
      try {
        const params = {
          ...queryParams,
          page: pagination.current_page,
          per_page: pagination.per_page
        }
        const response = await getBranchAppVersions(params)
        if (response.code === 0) {
          versions.value = response.data.data
          Object.assign(pagination, {
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total,
            last_page: response.data.last_page
          })
        }
      } catch (error) {
        ElMessage.error('加载版本列表失败')
      } finally {
        loading.value = false
      }
    }

    // 加载APP配置选项
    const loadAppConfigs = async () => {
      try {
        const response = await getBranchAppConfigs({ per_page: 1000 })
        if (response.code === 0) {
          appConfigs.value = response.data.data
        }
      } catch (error) {
        ElMessage.error('加载APP配置选项失败')
      }
    }

    // 重置搜索
    const resetSearch = () => {
      Object.assign(queryParams, {
        keyword: '',
        status: '',
        platform: '',
        app_config_id: '',
        page: 1,
        per_page: 20
      })
      loadVersions()
    }

    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        app_config_id: '',
        platform: 'android',
        version_name: '',
        version_code: 1,
        download_url: '',
        file_size: null,
        description: '',
        force_update: false,
        min_supported_version: '',
        status: 'draft'
      })
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
      selectedVersion.value = row
      dialogVisible.value = true
    }

    // 处理查看
    const handleView = (row) => {
      selectedVersion.value = row
      detailDialogVisible.value = true
    }

    // 处理命令
    const handleCommand = async (command, row) => {
      switch (command) {
        case 'publish':
          await handlePublish(row)
          break
        case 'deprecate':
          await handleDeprecate(row)
          break
        case 'upload':
          handleUpload(row)
          break
        case 'download':
          window.open(row.download_url, '_blank')
          break
        case 'delete':
          await handleDelete(row)
          break
      }
    }

    // 处理发布
    const handlePublish = async (row) => {
      try {
        await ElMessageBox.confirm('确定要发布此版本吗？', '确认发布', {
          type: 'warning'
        })
        
        const response = await publishBranchAppVersion(row.id)
        if (response.code === 0) {
          ElMessage.success('发布成功')
          loadVersions()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('发布失败')
        }
      }
    }

    // 处理废弃
    const handleDeprecate = async (row) => {
      try {
        await ElMessageBox.confirm('确定要废弃此版本吗？', '确认废弃', {
          type: 'warning'
        })
        
        const response = await deprecateBranchAppVersion(row.id)
        if (response.code === 0) {
          ElMessage.success('废弃成功')
          loadVersions()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('废弃失败')
        }
      }
    }

    // 处理上传
    const handleUpload = (row) => {
      selectedVersion.value = row
      uploadDialogVisible.value = true
    }

    // 处理删除
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除此版本吗？删除后不可恢复！', '确认删除', {
          type: 'error'
        })
        
        const response = await deleteBranchAppVersion(row.id)
        if (response.code === 0) {
          ElMessage.success('删除成功')
          loadVersions()
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
          response = await createBranchAppVersion(form)
        } else {
          response = await updateBranchAppVersion(selectedVersion.value.id, form)
        }
        
        if (response.code === 0) {
          ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          loadVersions()
        }
      } catch (error) {
        ElMessage.error(dialogMode.value === 'create' ? '创建失败' : '更新失败')
      } finally {
        submitLoading.value = false
      }
    }

    // 上传前检查
    const beforeUpload = (file) => {
      const platform = selectedVersion.value?.platform
      const allowedTypes = {
        android: ['apk'],
        ios: ['ipa'],
        h5: ['zip', 'gz']
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const isValidType = allowedTypes[platform]?.includes(fileExtension)
      
      if (!isValidType) {
        ElMessage.error(`${platform}平台只支持${allowedTypes[platform]?.join(', ')}格式的文件`)
        return false
      }
      
      const isValidSize = file.size / 1024 / 1024 < 500
      if (!isValidSize) {
        ElMessage.error('文件大小不能超过500MB')
        return false
      }
      
      return true
    }

    // 上传成功
    const onUploadSuccess = (response) => {
      if (response.code === 0) {
        ElMessage.success('上传成功')
        uploadDialogVisible.value = false
        loadVersions()
      } else {
        ElMessage.error(response.message || '上传失败')
      }
    }

    // 上传失败
    const onUploadError = () => {
      ElMessage.error('上传失败')
    }

    // 获取平台类型
    const getPlatformType = (platform) => {
      const types = {
        android: 'success',
        ios: 'primary',
        h5: 'warning'
      }
      return types[platform] || ''
    }

    // 获取平台名称
    const getPlatformName = (platform) => {
      const names = {
        android: 'Android',
        ios: 'iOS',
        h5: 'H5'
      }
      return names[platform] || platform
    }

    // 获取状态类型
    const getStatusType = (status) => {
      const types = {
        draft: 'info',
        published: 'success',
        deprecated: 'danger'
      }
      return types[status] || ''
    }

    // 获取状态名称
    const getStatusName = (status) => {
      const names = {
        draft: '草稿',
        published: '已发布',
        deprecated: '已废弃'
      }
      return names[status] || status
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 格式化日期
    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    onMounted(() => {
      loadVersions()
      loadAppConfigs()
    })

    return {
      loading,
      submitLoading,
      versions,
      appConfigs,
      dialogVisible,
      detailDialogVisible,
      uploadDialogVisible,
      dialogMode,
      selectedVersion,
      formRef,
      uploadRef,
      queryParams,
      pagination,
      form,
      formRules,
      getPublishedCount,
      getDraftCount,
      uploadAction,
      uploadHeaders,
      uploadData,
      loadVersions,
      resetSearch,
      handleCreate,
      handleEdit,
      handleView,
      handleCommand,
      handleSubmit,
      beforeUpload,
      onUploadSuccess,
      onUploadError,
      getPlatformType,
      getPlatformName,
      getStatusType,
      getStatusName,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
.branch-app-versions {
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

.stat-icon.published {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.draft {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.total {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.app-info .app-name {
  font-weight: 600;
  color: #333;
}

.app-info .branch-name {
  font-size: 12px;
  color: #666;
}

.version-info .version-name {
  font-weight: 500;
  color: #333;
}

.version-info .version-code {
  font-size: 12px;
  color: #666;
}

.text-muted {
  color: #999;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.version-detail {
  padding: 20px 0;
}

.description-content {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style> 