<template>
  <div class="image-upload-component">
    <el-upload
      ref="uploadRef"
      :class="uploadClass"
      action="#"
      :http-request="handleUpload"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :accept="accept"
      :disabled="disabled"
      :multiple="multiple && limit > 1"
    >
      <!-- 单张图片上传 -->
      <div v-if="!multiple" class="single-upload">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          class="uploaded-image"
          :style="{ width: width + 'px', height: height + 'px' }"
        />
        <div v-else class="upload-placeholder" :style="{ width: width + 'px', height: height + 'px' }">
          <el-icon class="upload-icon" :size="iconSize">
            <Plus />
          </el-icon>
          <div v-if="showText" class="upload-text">{{ placeholder }}</div>
        </div>
      </div>

      <!-- 多张图片上传 -->
      <div v-else class="multiple-upload">
        <div v-for="(image, index) in imageList" :key="index" class="image-item">
          <img
            :src="image.url"
            class="uploaded-image"
            :style="{ width: width + 'px', height: height + 'px' }"
          />
          <div class="image-actions">
            <el-icon class="action-icon" @click.stop="previewImage(image.url)">
              <ZoomIn />
            </el-icon>
            <el-icon class="action-icon" @click.stop="removeImage(index)">
              <Delete />
            </el-icon>
          </div>
        </div>
        
        <!-- 添加按钮 -->
        <div
          v-if="imageList.length < limit"
          class="upload-placeholder"
          :style="{ width: width + 'px', height: height + 'px' }"
        >
          <el-icon class="upload-icon" :size="iconSize">
            <Plus />
          </el-icon>
          <div v-if="showText" class="upload-text">上传图片</div>
        </div>
      </div>
    </el-upload>

    <!-- 提示文本 -->
    <div v-if="tips" class="upload-tips">{{ tips }}</div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="60%" center>
      <img :src="previewUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ZoomIn, Delete } from '@element-plus/icons-vue'
import { posterApi } from '@/api/poster'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 1
  },
  size: {
    type: Number,
    default: 5 // MB
  },
  width: {
    type: Number,
    default: 150
  },
  height: {
    type: Number,
    default: 150
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  placeholder: {
    type: String,
    default: '上传图片'
  },
  tips: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showText: {
    type: Boolean,
    default: true
  },
  uploadType: {
    type: String,
    default: 'poster'
  },
  uploadFolder: {
    type: String,
    default: 'posters'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'upload-success', 'upload-error'])

const uploadRef = ref()
const previewVisible = ref(false)
const previewUrl = ref('')
const uploading = ref(false)

// 计算属性
const uploadClass = computed(() => {
  return [
    'image-uploader',
    {
      'is-multiple': props.multiple,
      'is-disabled': props.disabled
    }
  ]
})

const iconSize = computed(() => {
  return Math.min(props.width, props.height) / 4
})

const imageUrl = computed(() => {
  if (props.multiple) return ''
  return props.modelValue || ''
})

const imageList = computed(() => {
  if (!props.multiple) return []
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.map((url, index) => ({
      url,
      id: index
    }))
  }
  return []
})

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.indexOf('image/') === 0
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  // 检查文件大小
  const isLtSize = file.size / 1024 / 1024 < props.size
  if (!isLtSize) {
    ElMessage.error(`图片大小不能超过 ${props.size}MB！`)
    return false
  }

  // 检查数量限制
  if (props.multiple && imageList.value.length >= props.limit) {
    ElMessage.error(`最多只能上传 ${props.limit} 张图片！`)
    return false
  }

  uploading.value = true
  return true
}

// 自定义上传
const handleUpload = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('type', props.uploadType)
    formData.append('folder', props.uploadFolder)

    const response = await posterApi.uploadImage(formData)

    if (response && (response.code === 0 || response.code === 200)) {
      const imageUrl = response.data.url || response.data.path

      if (props.multiple) {
        const newList = [...imageList.value.map(item => item.url), imageUrl]
        emit('update:modelValue', newList)
      } else {
        emit('update:modelValue', imageUrl)
      }

      emit('upload-success', response, options.file)
      ElMessage.success('图片上传成功')

      if (options.onSuccess) {
        options.onSuccess(response, options.file)
      }
    } else {
      const errorMsg = response?.message || '图片上传失败'
      ElMessage.error(errorMsg)
      emit('upload-error', new Error(errorMsg), options.file)

      if (options.onError) {
        options.onError(new Error(errorMsg), options.file)
      }
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    const errorMsg = error.message || '图片上传失败'
    ElMessage.error(errorMsg)
    emit('upload-error', error, options.file)

    if (options.onError) {
      options.onError(error, options.file)
    }
  } finally {
    uploading.value = false
  }
}

// 移除图片
const removeImage = (index) => {
  ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const newList = imageList.value.filter((_, i) => i !== index).map(item => item.url)
    emit('update:modelValue', newList)
    emit('change', newList)
  }).catch(() => {})
}

// 预览图片
const previewImage = (url) => {
  previewUrl.value = url
  previewVisible.value = true
}

// 清空上传
const clearFiles = () => {
  if (props.multiple) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', '')
  }
  emit('change', props.multiple ? [] : '')
}

// 手动触发上传
const triggerUpload = () => {
  const el = uploadRef.value?.$el || uploadRef.value
  if (el) {
    const input = el.querySelector('input[type=file]')
    if (input) {
      input.click()
    }
  }
}

// 监听值变化
watch(() => props.modelValue, (newVal) => {
  emit('change', newVal)
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  clearFiles,
  triggerUpload
})
</script>

<style scoped>
.image-upload-component {
  display: inline-block;
}

.image-uploader {
  display: inline-block;
}

.single-upload,
.multiple-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  position: relative;
  display: inline-block;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.uploaded-image {
  object-fit: cover;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
  cursor: pointer;
}

.upload-placeholder {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.upload-placeholder:hover {
  border-color: #409eff;
}

.upload-icon {
  color: #8c939d;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}

.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 6px;
}

.action-icon {
  color: white;
  font-size: 20px;
  margin: 0 10px;
  cursor: pointer;
  transition: transform 0.3s;
}

.action-icon:hover {
  transform: scale(1.2);
}

.upload-tips {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.is-disabled {
  cursor: not-allowed;
}

.is-disabled .upload-placeholder {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;
}

.is-disabled .upload-icon,
.is-disabled .upload-text {
  color: #c0c4cc;
}
</style>
