<template>
  <div class="banner-management">
    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增Banner</el-button>
        <el-button type="success" icon="Sort" @click="handleSort" :disabled="!selectedBanners.length">批量排序</el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索Banner标题"
          style="width: 200px; margin-right: 10px;"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="searchForm.position" placeholder="选择位置" style="width: 120px; margin-right: 10px;" clearable @change="handleSearch">
          <el-option label="首页" value="home_top" />
          <el-option label="商城" value="mall_top" />
          <el-option label="取水" value="water_top" />
          <el-option label="产品" value="product_top" />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="选择状态" style="width: 100px; margin-right: 10px;" clearable @change="handleSearch">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleRefresh">刷新</el-button>
      </div>
    </div>

    <!-- Banner列表 -->
    <el-table
      v-loading="loading"
      :data="bannerList"
      @selection-change="handleSelectionChange"
      row-key="id"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="Banner图片" width="120">
        <template #default="scope">
          <el-image
            :src="scope.row.image_url"
            :preview-src-list="[scope.row.image_url]"
            style="width: 80px; height: 45px; border-radius: 4px;"
            fit="cover"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
      <el-table-column prop="position" label="位置" width="100">
        <template #default="scope">
          <el-tag :type="getPositionTagType(scope.row.position)">
            {{ getPositionText(scope.row.position) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="link_url" label="链接地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="有效期" width="180">
        <template #default="scope">
          <div v-if="scope.row.start_time || scope.row.end_time">
            <div v-if="scope.row.start_time">开始：{{ formatDate(scope.row.start_time) }}</div>
            <div v-if="scope.row.end_time">结束：{{ formatDate(scope.row.end_time) }}</div>
          </div>
          <span v-else class="text-gray-400">永久有效</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="info" size="small" @click="handleView(scope.row)">预览</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.per_page"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="Banner标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入Banner标题" />
        </el-form-item>
        <el-form-item label="Banner图片" prop="image_url">
          <div class="image-upload">
            <el-input v-model="formData.image_url" placeholder="请输入图片URL或上传图片" />
            <el-upload
              class="upload-demo"
              action="/api/admin/v1/upload/image"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
            >
              <el-button type="primary" style="margin-left: 10px;">上传图片</el-button>
            </el-upload>
          </div>
          <div v-if="formData.image_url" class="image-preview">
            <el-image
              :src="formData.image_url"
              style="width: 200px; height: 100px; border-radius: 4px; margin-top: 10px;"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="展示位置" prop="position">
          <el-select v-model="formData.position" placeholder="请选择展示位置">
            <el-option label="首页顶部" value="home_top" />
            <el-option label="商城顶部" value="mall_top" />
            <el-option label="取水顶部" value="water_top" />
            <el-option label="产品顶部" value="product_top" />
          </el-select>
        </el-form-item>
        <el-form-item label="链接地址" prop="link_url">
          <el-input v-model="formData.link_url" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="有效期">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-date-picker
                v-model="formData.start_time"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-col>
            <el-col :span="12">
              <el-date-picker
                v-model="formData.end_time"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="Banner预览" width="800px">
      <div class="preview-content">
        <el-image
          :src="previewData.image_url"
          style="width: 100%; max-height: 400px;"
          fit="contain"
        />
        <div class="preview-info">
          <p><strong>标题：</strong>{{ previewData.title }}</p>
          <p><strong>位置：</strong>{{ getPositionText(previewData.position) }}</p>
          <p><strong>链接：</strong>{{ previewData.link_url || '无' }}</p>
          <p><strong>排序：</strong>{{ previewData.sort }}</p>
          <p><strong>状态：</strong>{{ previewData.status ? '启用' : '禁用' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Sort } from '@element-plus/icons-vue'
import { getBannerList, createBanner, updateBanner, deleteBanner } from '@/api/banner'
import { getAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'BannerManagement',
  components: {
    Search,
    Plus,
    Sort
  },
  setup() {
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const previewVisible = ref(false)
    const formRef = ref(null)
    
    // 搜索表单
    const searchForm = reactive({
      keyword: '',
      position: '',
      status: ''
    })
    
    // 分页数据
    const pagination = reactive({
      page: 1,
      per_page: 20,
      total: 0
    })
    
    // Banner列表
    const bannerList = ref([])
    const selectedBanners = ref([])
    
    // 表单数据
    const formData = reactive({
      id: null,
      title: '',
      image_url: '',
      position: '',
      link_url: '',
      sort: 0,
      status: 1,
      start_time: '',
      end_time: ''
    })
    
    // 预览数据
    const previewData = reactive({})
    
    // 表单验证规则
    const formRules = {
      title: [
        { required: true, message: '请输入Banner标题', trigger: 'blur' },
        { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
      ],
      image_url: [
        { required: true, message: '请输入或上传Banner图片', trigger: 'blur' }
      ],
      position: [
        { required: true, message: '请选择展示位置', trigger: 'change' }
      ]
    }
    
    // 计算属性
    const dialogTitle = computed(() => {
      return formData.id ? '编辑Banner' : '新增Banner'
    })
    
    const uploadHeaders = computed(() => {
      const token = getAdminToken()
      return {
        'Authorization': `Bearer ${token}`
      }
    })
    
    // 获取Banner列表
    const fetchBannerList = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          per_page: pagination.per_page,
          ...searchForm
        }
        const response = await getBannerList(params)
        console.log('Banner API响应:', response)
        
        // 处理API响应数据
        if (response.data && response.data.code === 200) {
          const banners = response.data.data || []
          // 转换status字段为数字类型
          bannerList.value = banners.map(banner => ({
            ...banner,
            status: parseInt(banner.status) || 0,
            sort: parseInt(banner.sort_order) || 0
          }))
          pagination.total = banners.length || 0
        } else {
          bannerList.value = []
          pagination.total = 0
          ElMessage.error(response.data?.message || '获取Banner列表失败')
        }
      } catch (error) {
        console.error('获取Banner列表失败:', error)
        ElMessage.error('获取Banner列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.page = 1
      fetchBannerList()
    }
    
    // 刷新
    const handleRefresh = () => {
      searchForm.keyword = ''
      searchForm.position = ''
      searchForm.status = ''
      pagination.page = 1
      fetchBannerList()
    }
    
    // 新增
    const handleAdd = () => {
      resetFormData()
      dialogVisible.value = true
    }
    
    // 编辑
    const handleEdit = (row) => {
      Object.assign(formData, row)
      dialogVisible.value = true
    }
    
    // 预览
    const handleView = (row) => {
      Object.assign(previewData, row)
      previewVisible.value = true
    }
    
    // 删除
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除Banner "${row.title}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await deleteBanner(row.id)
        ElMessage.success('删除成功')
        fetchBannerList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }
    }
    
    // 状态切换
    const handleStatusChange = async (row) => {
      try {
        await updateBanner(row.id, { ...row, status: row.status })
        ElMessage.success('状态更新成功')
      } catch (error) {
        console.error('状态更新失败:', error)
        ElMessage.error('状态更新失败')
        // 恢复原状态
        row.status = row.status === 1 ? 0 : 1
      }
    }
    
    // 选择变化
    const handleSelectionChange = (selection) => {
      selectedBanners.value = selection
    }
    
    // 批量排序
    const handleSort = () => {
      ElMessage.info('批量排序功能开发中...')
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.per_page = size
      pagination.page = 1
      fetchBannerList()
    }
    
    // 当前页变化
    const handleCurrentChange = (page) => {
      pagination.page = page
      fetchBannerList()
    }
    
    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        submitting.value = true
        
        if (formData.id) {
          await updateBanner(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          await createBanner(formData)
          ElMessage.success('创建成功')
        }
        
        dialogVisible.value = false
        fetchBannerList()
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
      } finally {
        submitting.value = false
      }
    }
    
    // 关闭弹窗
    const handleDialogClose = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      resetFormData()
    }
    
    // 重置表单数据
    const resetFormData = () => {
      Object.assign(formData, {
        id: null,
        title: '',
        image_url: '',
        position: '',
        link_url: '',
        sort: 0,
        status: 1,
        start_time: '',
        end_time: ''
      })
    }
    
    // 上传成功
    const handleUploadSuccess = (response) => {
      if (response.code === 200) {
        formData.image_url = response.data.url
        ElMessage.success('图片上传成功')
      } else {
        ElMessage.error(response.message || '图片上传失败')
      }
    }
    
    // 上传前验证
    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    }
    
    // 获取位置文本
    const getPositionText = (position) => {
      const positionMap = {
        'home_top': '首页顶部',
        'mall_top': '商城顶部', 
        'water_top': '取水顶部',
        'product_top': '产品顶部'
      }
      return positionMap[position] || position
    }
    
    // 获取位置标签类型
    const getPositionTagType = (position) => {
      const typeMap = {
        'home_top': 'primary',
        'mall_top': 'success',
        'water_top': 'warning',
        'product_top': 'info'
      }
      return typeMap[position] || 'default'
    }
    
    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }
    
    onMounted(() => {
      fetchBannerList()
    })
    
    return {
      loading,
      submitting,
      dialogVisible,
      previewVisible,
      formRef,
      searchForm,
      pagination,
      bannerList,
      selectedBanners,
      formData,
      previewData,
      formRules,
      dialogTitle,
      uploadHeaders,
      fetchBannerList,
      handleSearch,
      handleRefresh,
      handleAdd,
      handleEdit,
      handleView,
      handleDelete,
      handleStatusChange,
      handleSelectionChange,
      handleSort,
      handleSizeChange,
      handleCurrentChange,
      handleSubmit,
      handleDialogClose,
      handleUploadSuccess,
      beforeUpload,
      getPositionText,
      getPositionTagType,
      formatDate
    }
  }
}
</script>

<style scoped>
.banner-management {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.image-upload {
  display: flex;
  align-items: center;
}

.image-preview {
  margin-top: 10px;
}

.preview-content {
  text-align: center;
}

.preview-info {
  margin-top: 20px;
  text-align: left;
}

.preview-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
