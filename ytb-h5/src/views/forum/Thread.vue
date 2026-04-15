<template>
  <div class="forum-thread">
    <van-nav-bar
      :title="thread.title || '帖子详情'"
      left-arrow
      @click-left="router.back"
    />

    <section v-if="thread.title" class="forum-thread__hero">
      <span class="forum-thread__section-chip">{{ threadSectionName }}</span>
      <h1 class="forum-thread__title">{{ thread.title }}</h1>
      <div class="forum-thread__hero-meta">
        <div class="forum-thread__hero-author">
          <img :src="threadAuthorAvatar" alt="作者头像" class="forum-thread__author-avatar" />
          <div class="forum-thread__author-info">
            <span class="name">{{ displayThreadAuthor }}</span>
            <span class="time">发表于 {{ thread.created_at }}</span>
          </div>
        </div>
        <span class="forum-thread__hero-stat">
          <van-icon name="chat-o" />
          {{ thread.replies_count || thread.replies?.length || 0 }} 条回复
        </span>
      </div>
      <p v-if="thread.content" class="forum-thread__body">{{ thread.content }}</p>
      <div v-if="thread.images?.length" class="forum-thread__gallery">
        <van-image
          v-for="(img, index) in thread.images"
          :key="index"
          :src="img"
          width="112"
          height="112"
          radius="12"
          fit="cover"
          lazy-load
        />
      </div>
    </section>

    <section class="forum-thread__replies">
      <div class="forum-thread__replies-header">
        <h3>全部回复</h3>
        <span class="forum-thread__replies-count">{{ thread.replies_count || thread.replies?.length || 0 }}</span>
      </div>

      <div v-if="loading" class="forum-thread__loading">
        <van-loading size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="!thread.replies?.length" class="forum-thread__empty">
        <van-empty description="暂无回复，快来抢沙发" />
      </div>

      <van-list v-else :finished="true" class="forum-thread__reply-list">
        <van-cell
          v-for="reply in thread.replies"
          :key="reply.id"
          class="forum-thread__reply"
          :border="false"
        >
          <template #title>
            <div class="forum-thread__reply-header">
              <img :src="replyAvatar(reply)" alt="回复者头像" class="forum-thread__reply-avatar" />
              <div class="forum-thread__reply-meta">
                <span class="name">{{ displayReplyAuthor(reply) }}</span>
                <span class="time">{{ reply.created_at }}</span>
              </div>
            </div>
          </template>
          <template #label>
            <p class="forum-thread__reply-content">{{ reply.content }}</p>
            <div v-if="reply.images?.length" class="forum-thread__reply-gallery">
              <van-image
                v-for="(img, index) in reply.images"
                :key="index"
                :src="img"
                width="96"
                height="96"
                radius="10"
                fit="cover"
                lazy-load
              />
            </div>
          </template>
        </van-cell>
      </van-list>
    </section>

    <footer class="forum-thread__reply-box">
      <van-form @submit="handleReply" class="forum-thread__reply-form">
        <div class="forum-thread__reply-field">
          <van-field
            v-model="replyForm.content"
            rows="3"
            autosize
            type="textarea"
            maxlength="400"
            show-word-limit
            placeholder="分享你的观点或经验..."
          />
        </div>
        <div class="forum-thread__reply-uploader">
          <van-uploader
            :after-read="handleReplyImageRead"
            :file-list="replyImages"
            :max-count="maxReplyImages"
            :max-size="maxUploadSize"
            :disabled="replyUploadLoading"
            accept="image/*"
            multiple
            preview-size="96"
            image-fit="cover"
            @delete="handleReplyImageDelete"
            @oversize="handleReplyOversize"
          />
          <p class="forum-thread__reply-tip">最多{{ maxReplyImages }}张，单张≤1MB</p>
        </div>
        <van-button
          block
          round
          type="primary"
          native-type="submit"
          :loading="submitting"
        >
          {{ replyButtonText }}
        </van-button>
      </van-form>
    </footer>

    <van-dialog
      v-model:show="showAuthDialog"
      :title="authDialogTitle"
      show-cancel-button
      :cancel-button-text="authCancelText"
      :confirm-button-text="authConfirmText"
      :confirm-button-loading="authMode === 'consent' && authorizing"
      @confirm="handleAuthConfirm"
      @cancel="handleAuthCancel"
    >
      <div class="forum-thread__auth-description">
        {{ authDialogDescription }}
        <div class="forum-thread__auth-hint" v-if="authDialogHint">
          {{ authDialogHint }}
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { fetchThreadDetail, replyThread, uploadForumImage } from '@/api/forum'
import { getForumUserProfile, activateForumUser } from '@/api/forumUser'
import { getWechatInfo, isWechatBrowser } from '@/utils/wechat'
import { startForumLogin } from '@/utils/forumAuth'
import { compressImageFile } from '@/utils/image'

const router = useRouter()
const route = useRoute()

const threadId = Number(route.params.threadId)
const loading = ref(false)
const submitting = ref(false)
const defaultUserAvatar = 'https://pay.itapgo.com/images/forum-avatar-default.png'
const thread = reactive({
  id: threadId,
  title: '',
  content: '',
  author: null,
  section: null,
  images: [],
  replies: [],
  replies_count: 0,
  views_count: 0
})

const replyForm = reactive({
  content: '',
  images: []
})

const replyImages = ref([])
const replyUploadLoading = ref(false)
const maxReplyImages = 6
const maxUploadSize = 5 * 1024 * 1024

const token = ref('')
const forumUser = reactive({
  loading: false,
  consented: false,
  exists: false,
  profile: null
})
const isWechatEnv = ref(false)
const showAuthDialog = ref(false)
const authorizing = ref(false)
const authMode = ref('consent')

const isLoggedIn = computed(() => Boolean(token.value))
const canReply = computed(() => isLoggedIn.value && forumUser.consented)
const replyButtonText = computed(() => {
  if (!isLoggedIn.value) return '登录后回复'
  if (!forumUser.consented) return '授权后回复'
  return '发送'
})
const threadSectionName = computed(
  () => thread.section?.name || route.query.sectionName || '讨论区'
)
const threadAuthorAvatar = computed(() => {
  const authorAvatar =
    thread.author?.forum_profile?.avatar ||
    thread.author?.avatar ||
    thread.author?.wechat_avatar
  const parsed = authorAvatar ? normalizeImageUrl(authorAvatar) : ''
  return parsed || defaultUserAvatar
})

const normalizeImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http')) return value
  if (value.startsWith('//')) return `https:${value}`
  return value.startsWith('/') ? `${window.location.origin}${value}` : `${window.location.origin}/${value}`
}

const applyThreadPayload = (payload) => ({
  ...payload,
  images: Array.isArray(payload?.images) ? payload.images.map(normalizeImageUrl) : [],
  replies: Array.isArray(payload?.replies) ? payload.replies.map(formatReplyPayload) : payload?.replies
})

const formatReplyPayload = (reply) => ({
  ...reply,
  images: Array.isArray(reply?.images) ? reply.images.map(normalizeImageUrl) : []
})

const authDialogTitle = computed(() => (authMode.value === 'login' ? '登录后继续' : '授权论坛访问'))
const authDialogDescription = computed(() =>
  authMode.value === 'login'
    ? '请先登录账号，登录后即可回复帖子并与他人互动。'
    : '授权后将同步您的微信头像、昵称与UnionID，以便在论坛回复中展示身份。'
)
const authDialogHint = computed(() => {
  if (authMode.value === 'login') {
    return '点击“立即登录”后将发起微信授权登录。'
  }
  return !isWechatEnv.value ? '当前非微信环境，无法直接授权，请在微信中打开页面后重试。' : ''
})
const authConfirmText = computed(() => (authMode.value === 'login' ? '立即登录' : '立即授权'))
const authCancelText = computed(() => (authMode.value === 'login' ? '稍后再说' : '稍后'))

const displayThreadAuthor = computed(() =>
  thread.author?.forum_profile?.nickname ||
  thread.author?.name ||
  '匿名用户'
)

const displayReplyAuthor = (reply) =>
  reply.author?.forum_profile?.nickname ||
  reply.author?.name ||
  '匿名用户'

const replyAvatar = (reply) => {
  const avatar =
    reply.author?.forum_profile?.avatar ||
    reply.author?.avatar ||
    reply.author?.wechat_avatar
  const parsed = avatar ? normalizeImageUrl(avatar) : ''
  return parsed || defaultUserAvatar
}

const triggerForumLogin = () => {
  const current = router.currentRoute.value?.fullPath || `/forum/threads/${threadId}`
  startForumLogin(current)
}

const loadThread = async () => {
  loading.value = true
  try {
    const response = await fetchThreadDetail(threadId)
    const data = response.data || {}
    const normalizedThread = applyThreadPayload(data)
    Object.assign(thread, normalizedThread)
    thread.replies = Array.isArray(normalizedThread.replies)
      ? normalizedThread.replies.map(formatReplyPayload)
      : []
  } catch (error) {
    console.error('[Forum] load thread detail failed', error)
    showToast('加载帖子失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const refreshTokenState = () => {
  token.value = localStorage.getItem('token') || ''
}

const loadForumProfile = async () => {
  if (!isLoggedIn.value) {
    forumUser.consented = false
    forumUser.exists = false
    forumUser.profile = null
    return
  }

  try {
    forumUser.loading = true
    const response = await getForumUserProfile()
    if (response?.code === 0) {
      forumUser.exists = Boolean(response.data?.exists)
      forumUser.consented = Boolean(response.data?.consented)
      forumUser.profile = response.data?.forum_user || null
    } else if (response?.code === 401) {
      forumUser.consented = false
    }
  } catch (error) {
    console.error('[Forum] load forum user profile failed', error)
  } finally {
    forumUser.loading = false
  }
}

const handleReply = async () => {
  refreshTokenState()

  if (!isLoggedIn.value) {
    triggerForumLogin()
    return
  }

  if (!forumUser.consented) {
    authMode.value = 'consent'
    showAuthDialog.value = true
    return
  }

  if (replyUploadLoading.value) {
    showToast('图片正在上传，请稍候再试')
    return
  }

  const content = replyForm.content.trim()
  if (!content) {
    showToast('回复内容不能为空')
    return
  }

  try {
    submitting.value = true
    const payload = {
      content,
      images: replyImages.value.map((item) => item.url)
    }

    const response = await replyThread(threadId, payload)
    if (response?.code === 0) {
      thread.replies.push(formatReplyPayload(response.data))
      thread.replies_count = (thread.replies_count || 0) + 1
      replyForm.content = ''
      replyForm.images = []
      replyImages.value = []
      showSuccessToast('回复成功')
    }
  } catch (error) {
    console.error('[Forum] reply failed', error)
  } finally {
    submitting.value = false
  }
}

const handleReplyImageRead = async (file) => {
  if (replyImages.value.length >= maxReplyImages) {
    showToast(`最多上传${maxReplyImages}张图片`)
    return
  }

  const fileItem = Array.isArray(file) ? file[0] : file
  const rawFile = fileItem?.file || fileItem
  if (!rawFile) {
    showToast('无法读取文件，请重试')
    return
  }

  let loading

  try {
    replyUploadLoading.value = true
    loading = showLoadingToast({ message: '图片上传中...', forbidClick: true, duration: 0 })

    const compressed = await compressImageFile(rawFile, {
      maxWidth: 1400,
      maxHeight: 1400,
      maxSize: 1024 * 1024
    })

    const formData = new FormData()
    formData.append('image', compressed)

    const response = await uploadForumImage(formData)
    if (response?.code === 0 && response.data) {
      const imageUrl = normalizeImageUrl(response.data.url || response.data.path)
      replyImages.value.push({ url: imageUrl })
      showSuccessToast('图片上传成功')
    } else {
      showToast(response?.message || '图片上传失败，请稍后重试')
    }
  } catch (error) {
    console.error('[Forum] reply image upload failed', error)
    showToast(error?.message || '图片上传失败，请稍后重试')
  } finally {
    replyUploadLoading.value = false
    if (loading && typeof loading.close === 'function') {
      loading.close()
    } else {
      closeToast()
    }
  }
}

const handleReplyImageDelete = (event) => {
  const index = event?.index
  if (typeof index === 'number') {
    replyImages.value.splice(index, 1)
  }
}

const handleReplyOversize = () => {
  showToast('原图过大，请选择不超过5MB的图片')
}

const handleAuthConfirm = async () => {
  if (authMode.value === 'login') {
    showAuthDialog.value = false
    triggerForumLogin()
    return
  }

  if (!isWechatEnv.value) {
    showToast('请在微信内打开页面完成授权')
    return
  }

  try {
    authorizing.value = true
    const info = await getWechatInfo()
    if (!info) {
      return
    }

    const res = await activateForumUser()
    if (res?.code === 0) {
      showSuccessToast('授权成功')
      await loadForumProfile()
      showAuthDialog.value = false
    } else {
      showToast(res?.message || '授权失败，请稍后重试')
    }
  } catch (error) {
    console.error('[Forum] activate forum user failed', error)
    showToast('授权失败，请稍后重试')
  } finally {
    authorizing.value = false
  }
}

const handleAuthCancel = () => {
  authorizing.value = false
  showAuthDialog.value = false
}

const handleStorageChange = (event) => {
  if (event.key === 'token') {
    refreshTokenState()
    if (isLoggedIn.value) {
      authMode.value = 'consent'
      showAuthDialog.value = false
      loadForumProfile()
    } else {
      authMode.value = 'login'
      showAuthDialog.value = false
    }
  }
}

onMounted(() => {
  refreshTokenState()
  isWechatEnv.value = isWechatBrowser()
  if (isLoggedIn.value) {
    loadForumProfile()
    if (!forumUser.consented) {
      authMode.value = 'consent'
    }
  } else {
    authMode.value = 'login'
  }
  loadThread()
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.forum-thread {
  min-height: 100vh;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 45%, #ffffff 100%);
  padding-bottom: 140px;
}

.forum-thread__hero {
  position: relative;
  margin: 16px;
  padding: 24px 20px 28px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 52px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.forum-thread__hero::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  height: 6px;
  width: 100%;
  border-radius: 24px 24px 0 0;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

.forum-thread__section-chip {
  align-self: flex-start;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.forum-thread__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.forum-thread__hero-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.forum-thread__hero-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forum-thread__author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #e2e8f0;
  border: 2px solid #f8fafc;
}

.forum-thread__author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.forum-thread__author-info .name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.forum-thread__author-info .time {
  font-size: 12px;
  color: #64748b;
}

.forum-thread__hero-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.forum-thread__hero-stat :deep(.van-icon) {
  font-size: 16px;
}

.forum-thread__body {
  margin: 0;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #1e293b;
  line-height: 1.7;
  font-size: 15px;
}

.forum-thread__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}

.forum-thread__gallery .van-image {
  background: #f1f5f9;
}

.forum-thread__replies {
  margin: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forum-thread__replies-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.forum-thread__replies-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
  font-weight: 700;
}

.forum-thread__replies-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.forum-thread__loading,
.forum-thread__empty {
  padding: 32px 0;
  display: flex;
  justify-content: center;
}

.forum-thread__reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forum-thread__reply {
  padding: 18px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.forum-thread__reply :deep(.van-cell__value),
.forum-thread__reply :deep(.van-cell__title),
.forum-thread__reply :deep(.van-cell__label) {
  margin: 0;
}

.forum-thread__reply :deep(.van-cell__title) {
  margin-bottom: 12px;
}

.forum-thread__reply-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forum-thread__reply-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #e2e8f0;
}

.forum-thread__reply-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.forum-thread__reply-meta .name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.forum-thread__reply-meta .time {
  font-size: 12px;
  color: #94a3b8;
}

.forum-thread__reply-content {
  margin: 0;
  color: #1f2937;
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;
}

.forum-thread__reply-gallery {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}

.forum-thread__reply-gallery .van-image {
  background: #f8fafc;
}

.forum-thread__reply-box {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  padding: 16px;
  box-shadow: 0 -18px 32px rgba(15, 23, 42, 0.12);
}

.forum-thread__reply-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forum-thread__reply-field :deep(.van-field) {
  border-radius: 18px;
  background: #f8fafc;
  padding: 6px 12px 2px;
  border: 1px solid #e2e8f0;
}

.forum-thread__reply-field :deep(textarea) {
  min-height: 92px !important;
  resize: none;
  color: #0f172a;
  font-size: 14px;
}

.forum-thread__reply-field :deep(textarea::placeholder) {
  color: #94a3b8;
}

.forum-thread__reply-field :deep(.van-field__word-limit) {
  color: #64748b;
}

.forum-thread__reply-uploader {
  padding: 12px;
  border-radius: 16px;
  border: 1px dashed #cbd5f5;
  background: #f8fafc;
}

.forum-thread__reply-uploader :deep(.van-uploader__preview) {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.forum-thread__reply-uploader :deep(.van-uploader__preview-image) {
  object-fit: cover;
}

.forum-thread__reply-uploader :deep(.van-uploader__upload) {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  border: 1px dashed #cbd5f5;
  background: #eef2ff;
}

.forum-thread__reply-uploader :deep(.van-uploader__upload-icon) {
  color: #2563eb;
}

.forum-thread__reply-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.forum-thread__auth-description {
  padding: 16px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.forum-thread__auth-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #888;
}
</style>
