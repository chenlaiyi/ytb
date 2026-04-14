<template>
  <div class="version-management">
    <div class="management-header">
      <h3>版本管理</h3>
      <el-button type="primary" icon="Plus" @click="showAddDialog">发布新版本</el-button>
    </div>

    <!-- 平台版本卡片 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="8" v-for="platform in platforms" :key="platform.key">
        <el-card class="platform-card">
          <template #header>
            <div class="platform-header">
              <div class="platform-info">
                <el-icon class="platform-icon" :class="platform.key">
                  <component :is="platform.icon" />
                </el-icon>
                <span class="platform-name">{{ platform.name }}</span>
              </div>
              <el-tag :type="platform.status === 'active' ? 'success' : 'warning'">
                {{ platform.status === 'active' ? '正常' : '维护中' }}
              </el-tag>
            </div>
          </template>
          
          <div class="version-info">
            <div class="current-version">
              <span class="label">当前版本：</span>
              <span class="version">{{ platform.currentVersion }}</span>
            </div>
            <div class="update-time">
              <span class="label">更新时间：</span>
              <span class="time">{{ platform.updateTime }}</span>
            </div>
            <div class="download-count">
              <span class="label">下载量：</span>
              <span class="count">{{ formatNumber(platform.downloads) }}</span>
            </div>
          </div>

          <div class="platform-actions">
            <el-button size="small" @click="editPlatform(platform)">编辑</el-button>
            <el-button size="small" type="success" @click="publishVersion(platform)">发布版本</el-button>
            <el-button size="small" type="warning" @click="rollbackVersion(platform)">回滚</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 版本历史 -->
    <el-card class="version-history">
      <template #header>
        <div class="card-header">
          <span>版本历史</span>
          <el-select v-model="selectedPlatform" placeholder="选择平台" style="width: 150px" @change="fetchVersionHistory">
            <el-option label="全部" value="" />
            <el-option v-for="platform in platforms" :key="platform.key" 
                      :label="platform.name" :value="platform.key" />
          </el-select>
        </div>
      </template>

      <el-table :data="versionHistory" v-loading="loading">
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlatformTagType(row.platform)">{{ getPlatformName(row.platform) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version_name" label="版本号" width="120" />
        <el-table-column prop="title" label="版本标题" width="200" />
        <el-table-column prop="description" label="更新说明" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : row.status === 'draft' ? 'info' : 'warning'">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ row.published_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewVersion(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editVersion(row)" 
                      v-if="row.status === 'draft'">编辑</el-button>
            <el-button size="small" type="success" @click="publishVersionById(row.id)" 
                      v-if="row.status === 'draft'">发布</el-button>
            <el-button size="small" type="danger" @click="deleteVersion(row)" 
                      v-if="row.status === 'draft'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalVersions"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 发布版本对话框 -->
    <el-dialog v-model="addDialogVisible" title="发布新版本" width="600px">
      <el-form :model="versionForm" :rules="versionRules" ref="versionFormRef" label-width="100px">
        <el-form-item label="平台" prop="platform">
          <el-select v-model="versionForm.platform" placeholder="选择平台">
            <el-option v-for="(name, key) in platformOptions" :key="key" 
                      :label="name" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本名称" prop="version_name">
          <el-input v-model="versionForm.version_name" placeholder="例如：2.1.6" />
        </el-form-item>
        <el-form-item label="版本号" prop="version_code">
          <el-input-number v-model="versionForm.version_code" :min="1" placeholder="用于版本比较的数字" />
        </el-form-item>
        <el-form-item label="构建号" prop="build_number">
          <el-input-number v-model="versionForm.build_number" :min="1" placeholder="构建编号" />
        </el-form-item>
        <el-form-item label="版本标题" prop="title">
          <el-input v-model="versionForm.title" placeholder="版本标题" />
        </el-form-item>
        <el-form-item label="更新说明" prop="description">
          <el-input v-model="versionForm.description" type="textarea" :rows="4" 
                   placeholder="请输入版本更新说明" />
        </el-form-item>
        <el-form-item label="安装包" prop="package_file" v-if="versionForm.platform !== 'h5'">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".apk,.ipa,.app"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 APK、IPA、APP 格式，文件大小不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="强制更新" prop="force_update">
          <el-switch v-model="versionForm.force_update" />
        </el-form-item>
        <el-form-item label="最低支持版本" prop="min_supported_version">
          <el-input v-model="versionForm.min_supported_version" placeholder="例如：2.0.0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitVersion" :loading="submitting">
            {{ versionForm.id ? '更新' : '发布' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Platform, Monitor, UploadFilled } from '@element-plus/icons-vue'
import { versionApi } from '@/api/version'

export default {
  name: 'VersionManagement',
  components: {
    Platform,
    Monitor,
    UploadFilled
  },
  setup() {
    const loading = ref(false)
    const submitting = ref(false)
    const addDialogVisible = ref(false)
    const selectedPlatform = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalVersions = ref(0)

    // 平台选项
    const platformOptions = ref({})
    const statusOptions = ref({})

    // 平台数据
    const platforms = reactive([
      {
        key: 'ios',
        name: 'iOS',
        icon: 'Platform',
        currentVersion: '暂无',
        updateTime: '',
        downloads: 0,
        status: 'inactive'
      },
      {
        key: 'android',
        name: 'Android',
        icon: 'Platform',
        currentVersion: '暂无',
        updateTime: '',
        downloads: 0,
        status: 'inactive'
      },
      {
        key: 'harmony',
        name: '鸿蒙',
        icon: 'Platform',
        currentVersion: '暂无',
        updateTime: '',
        downloads: 0,
        status: 'inactive'
      },
      {
        key: 'h5',
        name: 'H5',
        icon: 'Monitor',
        currentVersion: '暂无',
        updateTime: '',
        downloads: 0,
        status: 'inactive'
      }
    ])

    // 版本历史数据
    const versionHistory = ref([])

    // 版本表单
    const versionForm = reactive({
      id: null,
      platform: '',
      version_name: '',
      version_code: '',
      build_number: '',
      title: '',
      description: '',
      package_file: null,
      force_update: false,
      min_supported_version: ''
    })

    // 表单验证规则
    const versionRules = {
      platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
      version_name: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
      version_code: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
      build_number: [{ required: true, message: '请输入构建号', trigger: 'blur' }],
      title: [{ required: true, message: '请输入版本标题', trigger: 'blur' }],
      description: [{ required: true, message: '请输入更新说明', trigger: 'blur' }]
    }

    const versionFormRef = ref()

    // 获取选项数据
    const fetchOptions = async () => {
      try {
        const response = await versionApi.getOptions()
        if (response.code === 200) {
          platformOptions.value = response.data.platforms
          statusOptions.value = response.data.statuses
        }
      } catch (error) {
        console.error('获取选项数据失败:', error)
      }
    }

    // 获取统计数据
    const fetchStats = async () => {
      try {
        const response = await versionApi.getPlatformStats()
        if (response.code === 200) {
          const data = response.data
          
          // 更新平台数据
          platforms.forEach(platform => {
            if (data[platform.key]) {
              platform.currentVersion = data[platform.key].current_version
              platform.updateTime = data[platform.key].update_time
              platform.downloads = data[platform.key].downloads
              platform.status = data[platform.key].status
              platform.name = data[platform.key].name
            }
          })
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败')
      }
    }

    // 获取版本历史
    const fetchVersionHistory = async () => {
      try {
        loading.value = true
        const params = {
          page: currentPage.value,
          per_page: pageSize.value
        }
        
        if (selectedPlatform.value) {
          params.platform = selectedPlatform.value
        }

        const response = await versionApi.getVersions(params)
        if (response.code === 200) {
          versionHistory.value = response.data.data
          totalVersions.value = response.data.total
        }
      } catch (error) {
        console.error('获取版本历史失败:', error)
        ElMessage.error('获取版本历史失败')
      } finally {
        loading.value = false
      }
    }

    // 方法
    const formatNumber = (num) => {
      return num.toLocaleString()
    }

    const getPlatformTagType = (platform) => {
      const types = {
        ios: 'primary',
        android: 'success',
        harmony: 'warning',
        h5: 'info'
      }
      return types[platform] || 'info'
    }

    const getPlatformName = (platform) => {
      return platformOptions.value[platform] || platform
    }

    const getStatusText = (status) => {
      return statusOptions.value[status] || status
    }

    const showAddDialog = () => {
      resetForm()
      addDialogVisible.value = true
    }

    const resetForm = () => {
      versionForm.id = null
      versionForm.platform = ''
      versionForm.version_name = ''
      versionForm.version_code = ''
      versionForm.build_number = ''
      versionForm.title = ''
      versionForm.description = ''
      versionForm.package_file = null
      versionForm.force_update = false
      versionForm.min_supported_version = ''
    }

    const editPlatform = (platform) => {
      ElMessage.info(`编辑 ${platform.name} 平台配置`)
    }

    const publishVersion = (platform) => {
      versionForm.platform = platform.key
      addDialogVisible.value = true
    }

    const rollbackVersion = (platform) => {
      ElMessageBox.confirm(
        `确认要回滚 ${platform.name} 到上一个版本吗？`,
        '确认回滚',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        ElMessage.success('版本回滚成功')
      }).catch(() => {
        ElMessage.info('已取消回滚')
      })
    }

    const handleFileChange = (file) => {
      versionForm.package_file = file.raw
    }

    const submitVersion = async () => {
      if (!versionFormRef.value) return
      
      try {
        await versionFormRef.value.validate()
        submitting.value = true
        
        const formData = new FormData()
        Object.keys(versionForm).forEach(key => {
          if (versionForm[key] !== null && versionForm[key] !== '') {
            formData.append(key, versionForm[key])
          }
        })

        let response
        if (versionForm.id) {
          response = await versionApi.updateVersion(versionForm.id, formData)
        } else {
          response = await versionApi.createVersion(formData)
        }

        if (response.code === 200) {
          ElMessage.success(versionForm.id ? '更新成功' : '创建成功')
          addDialogVisible.value = false
          resetForm()
          await fetchVersionHistory()
          await fetchStats()
        }
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
      } finally {
        submitting.value = false
      }
    }

    const viewVersion = (version) => {
      ElMessage.info(`查看版本 ${version.version_name}`)
    }

    const editVersion = (version) => {
      Object.assign(versionForm, version)
      addDialogVisible.value = true
    }

    const deleteVersion = async (version) => {
      try {
        await ElMessageBox.confirm(
          `确认要删除版本 ${version.version_name} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await versionApi.deleteVersion(version.id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          await fetchVersionHistory()
          await fetchStats()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }
    }

    const publishVersionById = async (id) => {
      try {
        await ElMessageBox.confirm(
          '确认要发布该版本吗？',
          '确认发布',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await versionApi.publishVersion(id)
        if (response.code === 200) {
          ElMessage.success('发布成功')
          await fetchVersionHistory()
          await fetchStats()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('发布失败:', error)
          ElMessage.error('发布失败')
        }
      }
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
      fetchVersionHistory()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchVersionHistory()
    }

    onMounted(async () => {
      await fetchOptions()
      await fetchStats()
      await fetchVersionHistory()
    })

    return {
      loading,
      submitting,
      addDialogVisible,
      selectedPlatform,
      currentPage,
      pageSize,
      totalVersions,
      platforms,
      platformOptions,
      statusOptions,
      versionHistory,
      versionForm,
      versionRules,
      versionFormRef,
      formatNumber,
      getPlatformTagType,
      getPlatformName,
      getStatusText,
      showAddDialog,
      editPlatform,
      publishVersion,
      rollbackVersion,
      handleFileChange,
      submitVersion,
      viewVersion,
      editVersion,
      deleteVersion,
      publishVersionById,
      handleSizeChange,
      handleCurrentChange,
      fetchVersionHistory
    }
  }
}
</script>

<style scoped>
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.management-header h3 {
  margin: 0;
  color: #303133;
}

.platform-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.platform-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platform-info {
  display: flex;
  align-items: center;
}

.platform-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  color: #409eff;
}

.platform-icon.ios {
  color: #667eea;
}

.platform-icon.android {
  color: #4facfe;
}

.platform-icon.harmony {
  color: #43e97b;
}

.platform-icon.h5 {
  color: #f093fb;
}

.platform-name {
  font-weight: 600;
  color: #303133;
}

.version-info {
  margin-bottom: 16px;
}

.version-info > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  color: #909399;
  font-size: 14px;
}

.version {
  font-weight: 600;
  color: #409eff;
}

.time, .count {
  color: #606266;
  font-size: 14px;
}

.platform-actions {
  display: flex;
  gap: 8px;
}

.version-history {
  margin-top: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.mb-6 {
  margin-bottom: 24px;
}

.upload-demo {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .platform-actions {
    flex-direction: column;
  }
  
  .platform-actions .el-button {
    width: 100%;
  }
}
</style>