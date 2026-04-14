<template>
  <div class="poster-edit">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ isEdit ? '编辑海报' : '创建海报' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button 
          v-if="isEdit && form.status === 1" 
          type="success" 
          @click="previewPoster"
        >
          预览海报
        </el-button>
        <el-button 
          type="primary" 
          :loading="saving"
          @click="savePoster"
        >
          {{ isEdit ? '更新海报' : '创建海报' }}
        </el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      style="max-width: 800px"
    >
      <!-- 基础信息 -->
      <el-card header="基础信息" style="margin-bottom: 20px;">
        <el-form-item label="海报标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入海报标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="海报描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入海报描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="封面图片" prop="cover_image">
          <ImageUpload
            v-model="form.cover_image"
            :limit="1"
            accept="image/*"
            upload-type="cover"
            upload-folder="posters"
            @upload-success="handleImageUpload"
          />
          <div class="form-tip">建议尺寸：750x400像素，支持JPG、PNG格式</div>
        </el-form-item>

        <el-form-item label="背景图片">
          <ImageUpload
            v-model="form.background_image"
            :limit="1"
            accept="image/*"
            upload-type="background"
            upload-folder="posters"
            @upload-success="handleImageUpload"
          />
          <div class="form-tip">可选，用于海报生成时的背景</div>
        </el-form-item>
      </el-card>

      <!-- 活动信息 -->
      <el-card header="活动信息" style="margin-bottom: 20px;">
        <el-form-item label="活动内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="请输入活动详细内容"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker
                v-model="form.start_time"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker
                v-model="form.end_time"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="活动地址" prop="location">
          <el-input
            v-model="form.location"
            placeholder="请输入活动地址"
            maxlength="200"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input
                v-model="form.contact_person"
                placeholder="请输入联系人姓名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input
                v-model="form.contact_phone"
                placeholder="请输入联系电话"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 报名设置 -->
      <el-card header="报名设置" style="margin-bottom: 20px;">
        <el-form-item label="最大报名人数">
          <el-input-number
            v-model="form.max_registrations"
            :min="0"
            :max="10000"
            placeholder="0表示不限制"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #999;">0表示不限制人数</span>
        </el-form-item>

        <el-form-item label="报名表单">
          <FormEditor
            v-model="form.form_fields"
            @change="handleFormFieldsChange"
          />
          <div class="form-tip">配置用户报名时需要填写的表单字段</div>
        </el-form-item>
      </el-card>

      <!-- 海报设置 -->
      <el-card header="海报设置" style="margin-bottom: 20px;">
        <el-form-item label="海报模板">
          <el-select v-model="form.poster_template" placeholder="选择海报模板">
            <el-option label="默认模板" value="default" />
            <el-option label="简约模板" value="simple" />
            <el-option label="商务模板" value="business" />
            <el-option label="活动模板" value="event" />
          </el-select>
        </el-form-item>

        <el-form-item label="自动生成海报">
          <el-switch
            v-model="form.auto_generate_poster"
            active-text="发布时自动生成"
            inactive-text="手动生成"
          />
        </el-form-item>

        <el-form-item v-if="isEdit && form.generated_poster" label="生成的海报">
          <div class="poster-preview">
            <el-image
              :src="form.generated_poster"
              style="width: 200px; height: auto;"
              fit="contain"
              :preview-src-list="[form.generated_poster]"
            />
            <div class="poster-actions">
              <el-button size="small" @click="regeneratePoster">重新生成</el-button>
              <el-button size="small" @click="downloadPoster">下载海报</el-button>
            </div>
          </div>
        </el-form-item>
      </el-card>

      <!-- 发布设置 -->
      <el-card header="发布设置" style="margin-bottom: 20px;">
        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="1">立即发布</el-radio>
            <el-radio :label="2">已结束</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="是否公开">
          <el-switch
            v-model="form.is_public"
            active-text="公开"
            inactive-text="私密"
          />
          <div class="form-tip">私密海报只能通过链接访问</div>
        </el-form-item>
      </el-card>
    </el-form>

    <!-- 海报预览对话框 -->
    <el-dialog v-model="previewDialog.visible" title="海报预览" width="500px">
      <div style="text-align: center;">
        <el-image
          v-if="previewDialog.posterUrl"
          :src="previewDialog.posterUrl"
          style="max-width: 100%; height: auto;"
          fit="contain"
        />
        <div style="margin-top: 20px;">
          <el-button @click="downloadPoster">下载海报</el-button>
          <el-button type="primary" @click="copyShareUrl">复制分享链接</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { posterApi } from '@/api/poster'
import FormEditor from '@/components/FormEditor.vue'
import ImageUpload from '@/components/ImageUpload.vue'

export default {
  name: 'PosterEdit',
  components: {
    FormEditor,
    ImageUpload
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const formRef = ref()
    
    // 响应式数据
    const saving = ref(false)
    const loading = ref(false)
    
    const form = reactive({
      title: '',
      description: '',
      cover_image: '',
      background_image: '',
      content: '',
      start_time: '',
      end_time: '',
      location: '',
      contact_person: '',
      contact_phone: '',
      form_fields: [],
      max_registrations: 0,
      status: 0,
      is_public: true,
      poster_template: 'default',
      poster_config: {},
      auto_generate_poster: true,
      generated_poster: ''
    })
    
    const previewDialog = reactive({
      visible: false,
      posterUrl: ''
    })
    
    // 计算属性
    const isEdit = computed(() => !!route.params.id)
    
    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入海报标题', trigger: 'blur' },
        { max: 100, message: '标题不能超过100个字符', trigger: 'blur' }
      ],
      cover_image: [
        { required: true, message: '请上传封面图片', trigger: 'change' }
      ],
      content: [
        { required: true, message: '请输入活动内容', trigger: 'blur' }
      ],
      start_time: [
        { required: true, message: '请选择开始时间', trigger: 'change' }
      ],
      end_time: [
        { required: true, message: '请选择结束时间', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入活动地址', trigger: 'blur' },
        { max: 200, message: '地址不能超过200个字符', trigger: 'blur' }
      ]
    }
    
    // 加载数据
    const loadData = async () => {
      if (!isEdit.value) return
      
      loading.value = true
      try {
        const response = await posterApi.getDetail(route.params.id)
        Object.assign(form, response.data)
      } catch (error) {
        ElMessage.error('加载数据失败：' + error.message)
        goBack()
      } finally {
        loading.value = false
      }
    }
    
    // 保存海报
    const savePoster = async () => {
      if (!formRef.value) return
      
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return
      
      // 验证时间
      if (new Date(form.end_time) <= new Date(form.start_time)) {
        ElMessage.error('结束时间必须晚于开始时间')
        return
      }
      
      saving.value = true
      try {
        if (isEdit.value) {
          await posterApi.update(route.params.id, form)
          ElMessage.success('海报更新成功')
        } else {
          const response = await posterApi.create(form)
          ElMessage.success('海报创建成功')
          // 创建成功后跳转到编辑页面
          router.replace({ name: 'PosterEdit', params: { id: response.data.id } })
        }
        
        // 重新加载数据
        await loadData()
      } catch (error) {
        ElMessage.error('保存失败：' + error.message)
      } finally {
        saving.value = false
      }
    }
    
    // 返回列表
    const goBack = () => {
      router.push({ name: 'PosterList' })
    }
    
    // 预览海报
    const previewPoster = () => {
      if (form.generated_poster) {
        previewDialog.posterUrl = form.generated_poster
        previewDialog.visible = true
      } else {
        ElMessage.warning('海报尚未生成，请先生成海报')
      }
    }
    
    // 重新生成海报
    const regeneratePoster = async () => {
      try {
        await posterApi.generatePoster(route.params.id)
        ElMessage.success('海报生成成功')
        await loadData()
      } catch (error) {
        ElMessage.error('海报生成失败：' + error.message)
      }
    }
    
    // 下载海报
    const downloadPoster = () => {
      if (form.generated_poster) {
        const link = document.createElement('a')
        link.href = form.generated_poster
        link.download = `${form.title}-海报.jpg`
        link.click()
      }
    }
    
    // 复制分享链接
    const copyShareUrl = () => {
      const url = `${window.location.origin}/app/#/poster/${route.params.id}`
      navigator.clipboard.writeText(url).then(() => {
        ElMessage.success('分享链接已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败，请手动复制：' + url)
      })
    }
    
    // 图片上传成功处理
    const handleImageUpload = (url) => {
      ElMessage.success('图片上传成功')
    }
    
    // 表单字段变化处理
    const handleFormFieldsChange = (fields) => {
      form.form_fields = fields
    }
    
    // 生命周期
    onMounted(() => {
      loadData()
    })
    
    return {
      formRef,
      saving,
      loading,
      form,
      rules,
      previewDialog,
      isEdit,
      loadData,
      savePoster,
      goBack,
      previewPoster,
      regeneratePoster,
      downloadPoster,
      copyShareUrl,
      handleImageUpload,
      handleFormFieldsChange
    }
  }
}
</script>

<style scoped>
.poster-edit {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.poster-preview {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.poster-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.el-card__header) {
  background: #f5f5f5;
  font-weight: 600;
}
</style> 
