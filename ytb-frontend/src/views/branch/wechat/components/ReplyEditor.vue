<template>
  <div class="reply-editor">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <!-- 基础信息 -->
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入规则名称" />
      </el-form-item>
      
      <el-form-item label="规则描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入规则描述（可选）" />
      </el-form-item>

      <!-- 关键字设置 -->
      <el-form-item label="触发关键字" prop="keywords">
        <div class="keywords-section">
          <div class="keywords-list">
            <div v-for="(keyword, index) in form.keywords" :key="index" class="keyword-item">
              <el-input v-model="keyword.content" placeholder="关键字内容" style="width: 200px;" />
              <el-select v-model="keyword.type" style="width: 120px; margin-left: 10px;">
                <el-option label="精确匹配" :value="1" />
                <el-option label="包含匹配" :value="2" />
                <el-option label="正则匹配" :value="3" />
              </el-select>
              <el-button type="danger" size="small" @click="removeKeyword(index)" style="margin-left: 10px;">
                删除
              </el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addKeyword">添加关键字</el-button>
        </div>
      </el-form-item>

      <!-- 回复内容 -->
      <el-form-item label="回复内容" prop="replies">
        <el-tabs v-model="activeReplyTab" type="card" class="reply-tabs">
          <!-- 文字回复 -->
          <el-tab-pane label="文字回复" name="text">
            <div class="reply-content-section">
              <div v-for="(text, index) in form.replies.text" :key="index" class="reply-item">
                <el-input 
                  v-model="text.content" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入文字回复内容"
                />
                <el-button type="danger" size="small" @click="removeReply('text', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('text')">添加文字回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 图片回复 -->
          <el-tab-pane label="图片回复" name="images">
            <div class="reply-content-section">
              <div v-for="(image, index) in form.replies.images" :key="index" class="reply-item">
                <div class="image-upload">
                  <el-upload
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :show-file-list="false"
                    :on-success="(response) => handleImageUpload(response, index)"
                    accept="image/*"
                  >
                    <img v-if="image.pic_url" :src="image.pic_url" class="uploaded-image" />
                    <el-button v-else type="primary">选择图片</el-button>
                  </el-upload>
                  <div class="image-inputs">
                    <el-input v-model="image.title" placeholder="图片标题（可选）" style="margin-bottom: 10px;" />
                    <el-input v-model="image.description" placeholder="图片描述（可选）" />
                  </div>
                </div>
                <el-button type="danger" size="small" @click="removeReply('images', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('images')">添加图片回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 图文回复 -->
          <el-tab-pane label="图文回复" name="news">
            <div class="reply-content-section">
              <div v-for="(news, index) in form.replies.news" :key="index" class="reply-item news-item">
                <div class="news-form">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="标题">
                        <el-input v-model="news.title" placeholder="图文标题" />
                      </el-form-item>
                      <el-form-item label="作者">
                        <el-input v-model="news.author" placeholder="作者（可选）" />
                      </el-form-item>
                      <el-form-item label="链接">
                        <el-input v-model="news.url" placeholder="跳转链接" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="封面图片">
                        <el-upload
                          :action="uploadUrl"
                          :headers="uploadHeaders"
                          :show-file-list="false"
                          :on-success="(response) => handleNewsImageUpload(response, index)"
                          accept="image/*"
                        >
                          <img v-if="news.pic_url" :src="news.pic_url" class="uploaded-image" />
                          <el-button v-else type="primary">选择封面</el-button>
                        </el-upload>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item label="描述">
                    <el-input v-model="news.description" type="textarea" :rows="3" placeholder="图文描述" />
                  </el-form-item>
                </div>
                <el-button type="danger" size="small" @click="removeReply('news', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('news')">添加图文回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 语音回复 -->
          <el-tab-pane label="语音回复" name="voice">
            <div class="reply-content-section">
              <div v-for="(voice, index) in form.replies.voice" :key="index" class="reply-item">
                <el-input v-model="voice.title" placeholder="语音标题（可选）" style="margin-bottom: 10px;" />
                <div class="voice-upload">
                  <el-upload
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :show-file-list="false"
                    :on-success="(response) => handleVoiceUpload(response, index)"
                    accept="audio/*"
                  >
                    <el-button type="primary">选择语音文件</el-button>
                  </el-upload>
                  <span v-if="voice.voice_url" class="file-name">已选择语音文件</span>
                </div>
                <el-button type="danger" size="small" @click="removeReply('voice', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('voice')">添加语音回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 视频回复 -->
          <el-tab-pane label="视频回复" name="video">
            <div class="reply-content-section">
              <div v-for="(video, index) in form.replies.video" :key="index" class="reply-item">
                <el-input v-model="video.title" placeholder="视频标题" style="margin-bottom: 10px;" />
                <el-input v-model="video.description" placeholder="视频描述（可选）" style="margin-bottom: 10px;" />
                <div class="video-upload">
                  <el-upload
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :show-file-list="false"
                    :on-success="(response) => handleVideoUpload(response, index)"
                    accept="video/*"
                  >
                    <el-button type="primary">选择视频文件</el-button>
                  </el-upload>
                  <span v-if="video.video_url" class="file-name">已选择视频文件</span>
                </div>
                <el-button type="danger" size="small" @click="removeReply('video', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('video')">添加视频回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 音乐回复 -->
          <el-tab-pane label="音乐回复" name="music">
            <div class="reply-content-section">
              <div v-for="(music, index) in form.replies.music" :key="index" class="reply-item">
                <el-input v-model="music.title" placeholder="音乐标题" style="margin-bottom: 10px;" />
                <el-input v-model="music.description" placeholder="音乐描述（可选）" style="margin-bottom: 10px;" />
                <el-input v-model="music.music_url" placeholder="音乐链接" style="margin-bottom: 10px;" />
                <el-input v-model="music.hq_music_url" placeholder="高质量音乐链接（可选）" />
                <el-button type="danger" size="small" @click="removeReply('music', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('music')">添加音乐回复</el-button>
            </div>
          </el-tab-pane>

          <!-- 小程序回复 -->
          <el-tab-pane label="小程序回复" name="miniprogram">
            <div class="reply-content-section">
              <div v-for="(mini, index) in form.replies.miniprogram" :key="index" class="reply-item">
                <el-input v-model="mini.title" placeholder="小程序标题" style="margin-bottom: 10px;" />
                <el-input v-model="mini.appid" placeholder="小程序AppID" style="margin-bottom: 10px;" />
                <el-input v-model="mini.page_path" placeholder="小程序页面路径（可选）" />
                <el-button type="danger" size="small" @click="removeReply('miniprogram', index)" class="remove-btn">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addReply('miniprogram')">添加小程序回复</el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form-item>

      <!-- 其他设置 -->
      <el-form-item label="显示顺序">
        <el-input-number v-model="form.display_order" :min="0" :max="999" />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch v-model="form.status" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="footer-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createAutoReply, updateAutoReply, checkKeyword } from '@/api/branch.js'
import { getAdminToken } from '@/utils/admin-token-bridge'

const props = defineProps({
  rule: {
    type: Object,
    default: null
  },
  branchId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])

// 响应式数据
const formRef = ref()
const saving = ref(false)
const activeReplyTab = ref('text')

// 表单数据
const form = reactive({
  id: null,
  name: '',
  description: '',
  keywords: [{ content: '', type: 1 }],
  replies: {
    text: [],
    images: [],
    news: [],
    voice: [],
    video: [],
    music: [],
    miniprogram: []
  },
  display_order: 0,
  status: true
})

// 上传配置
const uploadUrl = computed(() => '/api/upload')
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${getAdminToken()}`
}))

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' }
  ],
  keywords: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0 || !value.some(k => k.content.trim())) {
          callback(new Error('请至少添加一个关键字'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  replies: [
    {
      validator: (rule, value, callback) => {
        const hasReply = Object.values(value).some(arr => arr.length > 0)
        if (!hasReply) {
          callback(new Error('请至少添加一种回复内容'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 生命周期
onMounted(() => {
  if (props.rule) {
    initForm()
  }
})

// 方法
function initForm() {
  const rule = props.rule
  form.id = rule.id
  form.name = rule.name || ''
  form.description = rule.description || ''
  form.display_order = rule.display_order || 0
  form.status = rule.status !== false
  
  // 初始化关键字
  if (rule.keywords && rule.keywords.length > 0) {
    form.keywords = rule.keywords.map(k => ({
      content: k.content,
      type: k.type
    }))
  }
  
  // 初始化回复内容
  if (rule.text_replies) form.replies.text = [...rule.text_replies]
  if (rule.image_replies) form.replies.images = [...rule.image_replies]
  if (rule.news_replies) form.replies.news = [...rule.news_replies]
  if (rule.voice_replies) form.replies.voice = [...rule.voice_replies]
  if (rule.video_replies) form.replies.video = [...rule.video_replies]
  if (rule.music_replies) form.replies.music = [...rule.music_replies]
  if (rule.miniprogram_replies) form.replies.miniprogram = [...rule.miniprogram_replies]
}

function addKeyword() {
  form.keywords.push({ content: '', type: 1 })
}

function removeKeyword(index) {
  if (form.keywords.length > 1) {
    form.keywords.splice(index, 1)
  }
}

function addReply(type) {
  const templates = {
    text: { content: '' },
    images: { title: '', description: '', pic_url: '' },
    news: { title: '', author: '', description: '', pic_url: '', url: '' },
    voice: { title: '', voice_url: '' },
    video: { title: '', description: '', video_url: '' },
    music: { title: '', description: '', music_url: '', hq_music_url: '' },
    miniprogram: { title: '', appid: '', page_path: '' }
  }
  
  form.replies[type].push({ ...templates[type] })
}

function removeReply(type, index) {
  form.replies[type].splice(index, 1)
}

function handleImageUpload(response, index) {
  if (response.code === 0) {
    form.replies.images[index].pic_url = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败')
  }
}

function handleNewsImageUpload(response, index) {
  if (response.code === 0) {
    form.replies.news[index].pic_url = response.data.url
    ElMessage.success('封面图片上传成功')
  } else {
    ElMessage.error('封面图片上传失败')
  }
}

function handleVoiceUpload(response, index) {
  if (response.code === 0) {
    form.replies.voice[index].voice_url = response.data.url
    ElMessage.success('语音上传成功')
  } else {
    ElMessage.error('语音上传失败')
  }
}

function handleVideoUpload(response, index) {
  if (response.code === 0) {
    form.replies.video[index].video_url = response.data.url
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error('视频上传失败')
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    
    // 检查关键字冲突
    for (const keyword of form.keywords) {
      if (keyword.content.trim()) {
        const response = await checkKeyword(props.branchId, {
          keyword: keyword.content,
          exclude_rule_id: form.id
        })
        
        if (response.code === -1) {
          ElMessage.warning(`关键字"${keyword.content}"已存在于其他规则中`)
          return
        }
      }
    }
    
    saving.value = true
    
    // 过滤空的关键字和回复内容
    const data = {
      ...form,
      keywords: form.keywords.filter(k => k.content.trim()),
      replies: {}
    }
    
    // 过滤空的回复内容
    Object.keys(form.replies).forEach(type => {
      data.replies[type] = form.replies[type].filter(item => {
        if (type === 'text') return item.content.trim()
        if (type === 'images') return item.pic_url
        if (type === 'news') return item.title.trim()
        if (type === 'voice') return item.voice_url
        if (type === 'video') return item.video_url
        if (type === 'music') return item.title.trim() && item.music_url.trim()
        if (type === 'miniprogram') return item.title.trim() && item.appid.trim()
        return false
      })
    })
    
    let response
    if (form.id) {
      response = await updateAutoReply(props.branchId, form.id, data)
    } else {
      response = await createAutoReply(props.branchId, data)
    }
    
    if (response.code === 0) {
      emit('save')
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    if (error !== 'validation failed') {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.reply-editor {
  max-height: 600px;
  overflow-y: auto;
}

.keywords-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background: #fafafa;
}

.keywords-list {
  margin-bottom: 15px;
}

.keyword-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.reply-tabs {
  margin-top: 10px;
}

.reply-content-section {
  min-height: 200px;
}

.reply-item {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #fafafa;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

.image-upload {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.uploaded-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.image-inputs {
  flex: 1;
}

.news-item {
  padding: 20px;
}

.voice-upload,
.video-upload {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.file-name {
  color: #67c23a;
  font-size: 14px;
}

.footer-actions {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
}
</style> 
