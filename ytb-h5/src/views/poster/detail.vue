<template>
  <div class="poster-detail">
    <!-- 海报头部 -->
    <div class="poster-header">
      <van-nav-bar
        :title="poster.title || '邀请海报'"
        left-arrow
        @click-left="onBack"
      >
        <template #right>
          <van-icon name="share-o" @click="onShare" />
        </template>
      </van-nav-bar>
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="loading" class="loading-container" vertical>
      正在加载海报...
    </van-loading>

    <!-- 海报内容 -->
    <div v-else-if="poster.id" class="poster-content">
      <!-- 海报图片 -->
      <div class="poster-image-section">
        <div v-if="poster.generated_poster" class="poster-image-wrapper">
          <img
            :src="poster.generated_poster"
            :alt="poster.title"
            class="poster-image"
            @click="previewPoster"
          />
          <div class="poster-overlay">
            <van-button
              type="primary"
              size="small"
              icon="eye-o"
              @click="previewPoster"
            >
              查看大图
            </van-button>
          </div>
        </div>
        <div v-else class="no-poster">
          <van-icon name="photo-o" size="48" />
          <p>海报生成中...</p>
        </div>
      </div>

      <!-- 活动信息 -->
      <div class="activity-info">
        <van-cell-group>
          <van-cell>
            <template #title>
              <div class="activity-title">{{ poster.title }}</div>
            </template>
            <template #value>
              <van-tag v-if="poster.status === 'published'" type="success">
                进行中
              </van-tag>
              <van-tag v-else-if="poster.status === 'ended'" type="default">
                已结束
              </van-tag>
              <van-tag v-else type="warning">
                未开始
              </van-tag>
            </template>
          </van-cell>

          <van-cell v-if="poster.description" :value="poster.description">
            <template #title>
              <van-icon name="notes-o" class="info-icon" />
              活动描述
            </template>
          </van-cell>

          <van-cell v-if="poster.start_time">
            <template #title>
              <van-icon name="clock-o" class="info-icon" />
              活动时间
            </template>
            <template #value>
              <div class="time-info">
                <div>{{ formatDateTime(poster.start_time) }}</div>
                <div v-if="poster.end_time" class="end-time">
                  至 {{ formatDateTime(poster.end_time) }}
                </div>
              </div>
            </template>
          </van-cell>

          <van-cell v-if="poster.location">
            <template #title>
              <van-icon name="location-o" class="info-icon" />
              活动地点
            </template>
            <template #value>
              {{ poster.location }}
            </template>
          </van-cell>

          <van-cell v-if="poster.contact_person || poster.contact_phone">
            <template #title>
              <van-icon name="contact" class="info-icon" />
              联系方式
            </template>
            <template #value>
              <div class="contact-info">
                <div v-if="poster.contact_person">{{ poster.contact_person }}</div>
                <div v-if="poster.contact_phone">
                  <van-button
                    type="primary"
                    size="mini"
                    @click="callContact"
                  >
                    {{ poster.contact_phone }}
                  </van-button>
                </div>
              </div>
            </template>
          </van-cell>

          <!-- 报名统计 -->
          <van-cell>
            <template #title>
              <van-icon name="friends-o" class="info-icon" />
              报名情况
            </template>
            <template #value>
              <div class="registration-stats">
                <span class="count">{{ poster.registration_count || 0 }}</span>
                <span class="unit">人已报名</span>
                <span v-if="poster.max_registrations" class="max">
                  / {{ poster.max_registrations }}人
                </span>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 报名表单 -->
      <div v-if="canRegister" class="registration-form">
        <van-cell-group>
          <van-cell title="报名参加" />
        </van-cell-group>

        <van-form @submit="onSubmit" ref="formRef">
          <van-cell-group>
            <!-- 动态表单字段 -->
            <template v-for="field in poster.form_fields" :key="field.id">
              <!-- 文本输入 -->
              <van-field
                v-if="field.type === 'text'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请输入${field.label}`"
                :required="field.required"
                :maxlength="field.max_length"
                :rules="getFieldRules(field)"
              />

              <!-- 多行文本 -->
              <van-field
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请输入${field.label}`"
                type="textarea"
                :required="field.required"
                :maxlength="field.max_length"
                :rules="getFieldRules(field)"
                :rows="field.rows || 3"
              />

              <!-- 选择器 -->
              <van-field
                v-else-if="field.type === 'select'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请选择${field.label}`"
                readonly
                clickable
                :required="field.required"
                :rules="getFieldRules(field)"
                @click="showPicker(field)"
              />

              <!-- 单选 -->
              <van-cell v-else-if="field.type === 'radio'" :title="field.label">
                <van-radio-group v-model="formData[field.name]" direction="horizontal">
                  <van-radio
                    v-for="option in field.options"
                    :key="option.value"
                    :name="option.value"
                  >
                    {{ option.label }}
                  </van-radio>
                </van-radio-group>
              </van-cell>

              <!-- 多选 -->
              <van-cell v-else-if="field.type === 'checkbox'" :title="field.label">
                <van-checkbox-group v-model="formData[field.name]" direction="horizontal">
                  <van-checkbox
                    v-for="option in field.options"
                    :key="option.value"
                    :name="option.value"
                  >
                    {{ option.label }}
                  </van-checkbox>
                </van-checkbox-group>
              </van-cell>

              <!-- 日期选择 -->
              <van-field
                v-else-if="field.type === 'date'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请选择${field.label}`"
                readonly
                clickable
                :required="field.required"
                :rules="getFieldRules(field)"
                @click="showDatePicker(field)"
              />

              <!-- 手机号 -->
              <van-field
                v-else-if="field.type === 'phone'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请输入${field.label}`"
                type="tel"
                :required="field.required"
                :rules="getFieldRules(field)"
              />

              <!-- 邮箱 -->
              <van-field
                v-else-if="field.type === 'email'"
                v-model="formData[field.name]"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder || `请输入${field.label}`"
                type="email"
                :required="field.required"
                :rules="getFieldRules(field)"
              />
            </template>
          </van-cell-group>

          <!-- 提交按钮 -->
          <div class="submit-section">
            <van-button
              type="primary"
              native-type="submit"
              block
              :loading="submitting"
              :disabled="!canSubmit"
            >
              确认报名
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 已报名状态 -->
      <div v-else-if="hasRegistered" class="registered-status">
        <van-cell-group>
          <van-cell>
            <template #title>
              <van-icon name="checked" color="#07c160" />
              <span class="registered-text">您已成功报名</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 报名已结束 -->
      <div v-else-if="poster.status === 'ended'" class="ended-status">
        <van-cell-group>
          <van-cell>
            <template #title>
              <van-icon name="warning-o" color="#ff976a" />
              <span class="ended-text">报名已结束</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 报名已满 -->
      <div v-else-if="isFull" class="full-status">
        <van-cell-group>
          <van-cell>
            <template #title>
              <van-icon name="warning-o" color="#ff976a" />
              <span class="full-text">报名名额已满</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <van-empty description="海报不存在或已删除" />
      <van-button type="primary" @click="onBack">返回</van-button>
    </div>

    <!-- 选择器弹窗 -->
    <van-picker
      v-model:show="showPickerPopup"
      :columns="pickerColumns"
      @confirm="onPickerConfirm"
      @cancel="showPickerPopup = false"
    />

    <!-- 日期选择弹窗 -->
    <van-date-picker
      v-model:show="showDatePickerPopup"
      v-model="selectedDate"
      @confirm="onDateConfirm"
      @cancel="showDatePickerPopup = false"
    />

    <!-- 海报预览弹窗 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="[poster.generated_poster]"
      closeable
    />

    <!-- 分享弹窗 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      title="分享海报"
      :options="shareOptions"
      @select="onShareSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { formatDateTime } from '@/utils/date'
import { posterApi, posterRegistrationApi } from '@/api/poster'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const submitting = ref(false)
const poster = ref({})
const formData = reactive({})
const formRef = ref()

// 弹窗控制
const showPickerPopup = ref(false)
const showDatePickerPopup = ref(false)
const showPreview = ref(false)
const showShareSheet = ref(false)

// 选择器数据
const pickerColumns = ref([])
const selectedDate = ref(new Date())
const currentField = ref(null)

// 分享选项
const shareOptions = ref([
  { name: '微信', icon: 'wechat' },
  { name: '朋友圈', icon: 'wechat-moments' },
  { name: '复制链接', icon: 'link' }
])

// 计算属性
const canRegister = computed(() => {
  return (
    poster.value.status === 'published' &&
    !hasRegistered.value &&
    !isFull.value &&
    poster.value.form_fields?.length > 0
  )
})

const hasRegistered = computed(() => {
  // 检查用户是否已报名
  return poster.value.user_registered || false
})

const isFull = computed(() => {
  if (!poster.value.max_registrations) return false
  return (poster.value.registration_count || 0) >= poster.value.max_registrations
})

const canSubmit = computed(() => {
  if (!poster.value.form_fields) return false
  
  return poster.value.form_fields.every(field => {
    if (!field.required) return true
    
    const value = formData[field.name]
    if (field.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0
    }
    return value !== undefined && value !== null && value !== ''
  })
})

// 生命周期
onMounted(() => {
  loadPosterDetail()
})

// 方法
const loadPosterDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id
    
    const response = await posterApi.getDetail(id)
    poster.value = response.data
    
    // 初始化表单数据
    if (poster.value.form_fields) {
      poster.value.form_fields.forEach(field => {
        if (field.type === 'checkbox') {
          formData[field.name] = []
        } else {
          formData[field.name] = ''
        }
      })
    }
    
  } catch (error) {
    console.error('加载海报详情失败:', error)
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  try {
    submitting.value = true
    
    const submitData = {
      poster_id: poster.value.id,
      form_data: { ...formData }
    }
    
    await posterRegistrationApi.create(submitData)
    
    showToast('报名成功！')
    
    // 更新海报状态
    poster.value.user_registered = true
    poster.value.registration_count = (poster.value.registration_count || 0) + 1
    
  } catch (error) {
    console.error('报名失败:', error)
    showToast('报名失败，请重试')
  } finally {
    submitting.value = false
  }
}

const getFieldRules = (field) => {
  const rules = []
  
  if (field.required) {
    rules.push({
      required: true,
      message: `请${field.type === 'select' ? '选择' : '输入'}${field.label}`
    })
  }
  
  if (field.type === 'phone') {
    rules.push({
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码'
    })
  }
  
  if (field.type === 'email') {
    rules.push({
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '请输入正确的邮箱地址'
    })
  }
  
  return rules
}

const showPicker = (field) => {
  currentField.value = field
  pickerColumns.value = field.options.map(option => ({
    text: option.label,
    value: option.value
  }))
  showPickerPopup.value = true
}

const onPickerConfirm = ({ selectedValues }) => {
  if (currentField.value) {
    formData[currentField.value.name] = selectedValues[0]
  }
  showPickerPopup.value = false
}

const showDatePicker = (field) => {
  currentField.value = field
  showDatePickerPopup.value = true
}

const onDateConfirm = () => {
  if (currentField.value) {
    const dateStr = selectedDate.value.toISOString().split('T')[0]
    formData[currentField.value.name] = dateStr
  }
  showDatePickerPopup.value = false
}

const previewPoster = () => {
  if (poster.value.generated_poster) {
    showPreview.value = true
  }
}

const onShare = () => {
  showShareSheet.value = true
}

const onShareSelect = (option) => {
  switch (option.name) {
    case '复制链接':
      copyToClipboard(window.location.href)
      showToast('链接已复制')
      break
    case '微信':
    case '朋友圈':
      // 调用微信分享API
      shareToWechat(option.name === '朋友圈')
      break
  }
  showShareSheet.value = false
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

const shareToWechat = (isTimeline = false) => {
  // 实现微信分享逻辑
  showToast('分享功能开发中')
}

const callContact = () => {
  if (poster.value.contact_phone) {
    window.location.href = `tel:${poster.value.contact_phone}`
  }
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.poster-detail {
  min-height: 100vh;
  background: #f7f8fa;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.poster-content {
  padding-bottom: 20px;
}

.poster-image-section {
  margin-bottom: 12px;
}

.poster-image-wrapper {
  position: relative;
  text-align: center;
  background: white;
  padding: 16px;
}

.poster-image {
  width: 100%;
  max-width: 350px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.poster-overlay {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.9;
}

.no-poster {
  text-align: center;
  padding: 40px 16px;
  background: white;
  color: #969799;
}

.no-poster p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

.activity-info {
  margin-bottom: 12px;
}

.activity-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  line-height: 1.4;
}

.info-icon {
  margin-right: 6px;
  color: #1989fa;
}

.time-info .end-time {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.contact-info {
  text-align: right;
}

.registration-stats {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.registration-stats .count {
  font-size: 18px;
  font-weight: 600;
  color: #1989fa;
}

.registration-stats .unit {
  font-size: 12px;
  color: #323233;
  margin-left: 2px;
}

.registration-stats .max {
  font-size: 12px;
  color: #969799;
}

.registration-form {
  margin-bottom: 20px;
}

.submit-section {
  padding: 16px;
  background: white;
  position: sticky;
  bottom: 0;
  border-top: 1px solid #ebedf0;
}

.registered-status,
.ended-status,
.full-status {
  margin: 12px 0;
}

.registered-text {
  color: #07c160;
  font-weight: 600;
  margin-left: 8px;
}

.ended-text,
.full-text {
  color: #ff976a;
  font-weight: 600;
  margin-left: 8px;
}

.error-state {
  text-align: center;
  padding: 40px 16px;
}

.error-state .van-button {
  margin-top: 20px;
}
</style> 