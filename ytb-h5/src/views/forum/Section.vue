<template>
  <div class="forum-section">
    <van-nav-bar :title="section.name || '讨论区'" left-arrow @click-left="router.back" />

    <section class="forum-section__header">
      <div class="forum-section__header-top">
        <img :src="sectionLogo" alt="logo" class="forum-section__logo" />
        <div class="forum-section__title-block">
          <div class="forum-section__title-row">
            <h2>{{ section.name }}</h2>
            <div v-if="moderatorInfo" class="forum-section__moderator">
              <img :src="moderatorInfo.avatar" alt="moderator" class="forum-section__moderator-avatar" />
              <span>{{ moderatorInfo.name }}</span>
            </div>
            <div v-else class="forum-section__moderator forum-section__moderator--empty">
              未设置版主
            </div>
          </div>
          <p v-if="section.hottest_thread" class="forum-section__hot">
            最热帖子：{{ section.hottest_thread.title }}
          </p>
          <p v-else class="forum-section__description">{{ section.description || '欢迎分享与探讨相关话题。' }}</p>
        </div>
      </div>
      <van-button
        type="primary"
        round
        block
        class="forum-section__primary-action"
        :icon="primaryActionIcon"
        :loading="creating"
        @click="handlePrimaryAction"
      >
        {{ primaryActionLabel }}
      </van-button>
    </section>

    <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多帖子了"
        @load="loadMore"
      >
        <div v-if="threads.length === 0 && !loading" class="forum-section__empty">
          <van-empty description="暂时还没有帖子" />
        </div>

        <van-cell
          v-for="thread in threads"
          :key="thread.id"
          is-link
          @click="openThread(thread)"
        >
          <template #title>
            <div class="forum-section__thread-title">
              <span class="forum-section__thread-name">{{ thread.title }}</span>
              <van-tag v-if="thread.is_pinned" type="danger" plain>置顶</van-tag>
            </div>
          </template>
          <template #label>
            <div class="forum-section__thread-meta">
              <div class="forum-section__thread-author">
                <img :src="authorAvatar(thread)" alt="作者头像" class="forum-section__thread-author-avatar" />
                <span>{{ displayAuthorShortName(thread) }}</span>
              </div>
              <span class="meta">回复 {{ thread.replies_count }}</span>
              <span class="meta">{{ formatThreadTime(thread) }}</span>
            </div>
            <p class="forum-section__thread-content">{{ thread.content }}</p>
            <div v-if="thread.images?.length" class="forum-section__thread-gallery">
              <van-image
                v-for="(img, index) in thread.images"
                :key="index"
                :src="img"
                width="72"
                height="72"
                radius="8"
                fit="cover"
                lazy-load
              />
            </div>
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>

    <van-popup
      v-model:show="showCreateDialog"
      position="bottom"
      class="forum-compose"
      :style="{ height: '100vh' }"
    >
      <div class="forum-compose__top-bar">
        <button
          type="button"
          class="forum-compose__top-action"
          @click="closeCreateDialog"
          :disabled="creating"
        >
          取消
        </button>
        <div class="forum-compose__top-title">发起讨论</div>
        <button
          type="button"
          class="forum-compose__top-submit"
          :class="{ 'forum-compose__top-submit--disabled': !canPublish || creating }"
          @click="handleCreateThread"
          :disabled="!canPublish || creating"
        >
          发布
        </button>
      </div>
      <div class="forum-compose__body">
        <div class="forum-compose__field">
          <label class="forum-compose__label" for="forum-compose-title">标题</label>
          <textarea
            id="forum-compose-title"
            v-model="form.title"
            maxlength="60"
            class="forum-compose__textarea forum-compose__textarea--title"
            placeholder="这一刻的想法..."
          />
        </div>
        <div class="forum-compose__field">
          <label class="forum-compose__label" for="forum-compose-content">内容</label>
          <textarea
            id="forum-compose-content"
            v-model="form.content"
            maxlength="500"
            class="forum-compose__textarea forum-compose__textarea--content"
            placeholder="补充更多背景信息，让伙伴们更好地理解你"
          />
          <div class="forum-compose__counter">
            {{ form.content.length }}/500
          </div>
        </div>
        <div class="forum-compose__field">
          <div class="forum-compose__label forum-compose__label--inline">图片</div>
          <div class="forum-compose__uploader">
            <van-uploader
              :after-read="handleThreadImageRead"
              :file-list="threadImages"
              :show-upload="threadImages.length < maxThreadImages"
              :max-count="maxThreadImages"
              :max-size="maxUploadSize"
              :disabled="threadUploadLoading"
              accept="image/*"
              multiple
              preview-size="104"
              image-fit="cover"
              @delete="handleThreadImageDelete"
              @oversize="handleThreadOversize"
            >
              <template #preview-cover="{ file }">
                <div v-if="file.status === 'uploading'" class="forum-compose__uploading-mask">
                  <van-loading size="18px" color="#fff" />
                  <span>上传中</span>
                </div>
              </template>
            </van-uploader>
          </div>
          <div v-if="threadImages.length" class="forum-compose__preview">
            <div
              v-for="(file, index) in threadImages"
              :key="file.id || index"
              class="forum-compose__preview-item"
            >
              <van-image
                :src="displayThreadImage(file)"
                width="96"
                height="96"
                radius="12"
                fit="cover"
              />
              <button
                type="button"
                class="forum-compose__preview-remove"
                @click="handleThreadPreviewRemove(index)"
              >
                <van-icon name="close" />
              </button>
            </div>
          </div>
          <p class="forum-compose__uploader-tip">支持拖拽排序，单张不超过 5MB</p>
        </div>
      </div>
    </van-popup>

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
      <div class="forum-section__auth-description">
        {{ authDialogDescription }}
        <div class="forum-section__auth-hint" v-if="authDialogHint">
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
import { fetchForumSections, fetchThreads, createThread, uploadForumImage } from '@/api/forum'
import { getForumUserProfile, activateForumUser } from '@/api/forumUser'
import { getWechatInfo, isWechatBrowser } from '@/utils/wechat'
import { startForumLogin } from '@/utils/forumAuth'
import { compressImageFile } from '@/utils/image'

const router = useRouter()
const route = useRoute()

const sectionId = Number(route.params.sectionId)
const section = reactive({
  id: sectionId,
  name: route.query.name || '',
  description: '',
  logo_url: route.query.logo || '',
  moderator: null,
  moderator_forum_user: route.query.moderatorNickname
    ? {
        nickname: route.query.moderatorNickname,
        avatar: route.query.moderatorAvatar || ''
      }
    : null,
  hottest_thread: null
})
const defaultSectionLogo = 'https://pay.itapgo.com/images/forum-avatar-default.png'
const defaultUserAvatar = 'https://pay.itapgo.com/images/forum-avatar-default.png'

const threads = ref([])
const page = ref(1)
const perPage = 10
const finished = ref(false)
const loading = ref(false)
const internalLoading = ref(false)
const refreshing = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const showAuthDialog = ref(false)
const authorizing = ref(false)
const authMode = ref('consent')

const form = reactive({
  title: '',
  content: '',
  images: []
})

const threadImages = ref([])
const activeThreadUploads = ref(0)
const threadUploadLoading = computed(() => activeThreadUploads.value > 0)
const maxThreadImages = 6
const maxUploadSize = 5 * 1024 * 1024
const createImageItemId = () => `thread-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const revokeLocalPreview = (value) => {
  if (typeof value === 'string' && value.startsWith('blob:')) {
    URL.revokeObjectURL(value)
  }
}

const resetThreadImages = () => {
  threadImages.value.forEach((item) => {
    if (item?.localPreview) {
      revokeLocalPreview(item.localPreview)
    }
  })
  threadImages.value.splice(0, threadImages.value.length)
  activeThreadUploads.value = 0
}

const removeThreadImageById = (id) => {
  const index = threadImages.value.findIndex((item) => item.id === id)
  if (index !== -1) {
    const [removed] = threadImages.value.splice(index, 1)
    if (removed?.localPreview) {
      revokeLocalPreview(removed.localPreview)
    }
  }
}

const patchThreadImage = (id, patch) => {
  const target = threadImages.value.find((item) => item.id === id)
  if (!target) return
  if (patch.localPreview === '') {
    revokeLocalPreview(target.localPreview)
  }
  Object.assign(target, patch)
}

const token = ref('')

const forumUser = reactive({
  loading: false,
  consented: false,
  exists: false,
  profile: null
})

const isWechatEnv = ref(false)

const isLoggedIn = computed(() => Boolean(token.value))

const normalizeImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http')) return value
  if (value.startsWith('//')) return `https:${value}`
  if (value.startsWith('/')) return `${window.location.origin}${value}`
  return `${window.location.origin}/${value}`
}

const sectionLogo = computed(() => {
  const logo = section.logo_url
  const parsed = logo ? normalizeImageUrl(logo) : defaultSectionLogo
  return parsed || defaultSectionLogo
})

const moderatorInfo = computed(() => {
  const forumModerator = section.moderator_forum_user
  if (!forumModerator) return null
  const nickname = (forumModerator.nickname || '').slice(0, 3) || '版主'
  return {
    name: nickname,
    avatar: normalizeImageUrl(forumModerator.avatar || '') || defaultUserAvatar
  }
})
const primaryActionLabel = computed(() => {
  if (!isLoggedIn.value) return '登录后发帖'
  if (!forumUser.consented) return '授权后发帖'
  return '发起讨论'
})
const primaryActionIcon = computed(() => {
  if (!isLoggedIn.value) return 'user-o'
  if (!forumUser.consented) return 'shield-o'
  return 'edit'
})
const authDialogTitle = computed(() => (authMode.value === 'login' ? '登录后继续' : '授权论坛访问'))
const authDialogDescription = computed(() =>
  authMode.value === 'login'
    ? '请先登录账号，登录后即可在讨论区发帖与交流。'
    : '授权后我们会同步您的微信头像、昵称和UnionID，用于展示论坛身份并保障发帖安全。'
)
const authDialogHint = computed(() => {
  if (authMode.value === 'login') {
    return '点击“立即登录”后将发起微信授权登录。'
  }
  return !isWechatEnv.value ? '当前非微信环境，无法直接获取授权。请在微信中打开后重试。' : ''
})
const authConfirmText = computed(() => (authMode.value === 'login' ? '立即登录' : '立即授权'))
const authCancelText = computed(() => (authMode.value === 'login' ? '稍后再说' : '稍后'))

const displayAuthor = (thread) =>
  thread.author?.forum_profile?.nickname ||
  thread.author?.name ||
  '匿名用户'

const displayAuthorShortName = (thread) => {
  const name = displayAuthor(thread)
  return name.slice(0, 2)
}

const authorAvatar = (thread) => {
  const profileAvatar = thread.author?.forum_profile?.avatar
  const avatar = profileAvatar || thread.author?.avatar || thread.author?.wechat_avatar
  const parsed = avatar ? normalizeImageUrl(avatar) : ''
  return parsed || defaultUserAvatar
}

const formatThreadTime = (thread) => {
  if (thread.last_replied_at) {
    return `更新 ${thread.last_replied_at}`
  }
  return `发布 ${thread.created_at}`
}

const formatThreadPayload = (thread) => ({
  ...thread,
  images: Array.isArray(thread.images) ? thread.images.map(normalizeImageUrl) : []
})

const triggerForumLogin = () => {
  const current = router.currentRoute.value?.fullPath || `/forum/sections/${sectionId}`
  startForumLogin(current)
}

const handlePrimaryAction = () => {
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

  showCreateDialog.value = true
}

const resetForm = () => {
  form.title = ''
  form.content = ''
  form.images = []
  resetThreadImages()
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  resetForm()
}

const canPublish = computed(() => form.title.trim().length > 0 || form.content.trim().length > 0)

const createThreadUploadItem = (fileItem, previewUrl, rawFile) => {
  const sourcePreview = previewUrl || ''
  return {
    ...fileItem,
    id: createImageItemId(),
    url: sourcePreview,
    content: sourcePreview,
    previewUrl: sourcePreview,
    file: rawFile || fileItem?.file || null,
    status: 'uploading',
    message: '上传中',
    isImage: true,
    localPreview: sourcePreview && sourcePreview.startsWith('blob:') ? sourcePreview : '',
    remoteUrl: ''
  }
}

const handleThreadImageRead = async (payload) => {
  const files = Array.isArray(payload) ? payload : [payload]

  for (const fileItem of files) {
    if (threadImages.value.length >= maxThreadImages) {
      showToast(`最多上传${maxThreadImages}张图片`)
      break
    }

    const rawFile = fileItem?.file || fileItem

    if (!rawFile) {
      showToast('无法读取文件，请重试')
      continue
    }

    const canCreateObjectUrl =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    const previewUrl = fileItem?.content || (canCreateObjectUrl ? URL.createObjectURL(rawFile) : '')
    const imageItem = createThreadUploadItem(fileItem, previewUrl, rawFile)
    threadImages.value = [...threadImages.value, imageItem]

    let loadingToast

    try {
      activeThreadUploads.value += 1
      loadingToast = showLoadingToast({ message: '图片上传中...', forbidClick: true, duration: 0 })

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
        patchThreadImage(imageItem.id, {
          url: imageUrl,
          content: imageUrl,
          previewUrl: imageUrl,
          remoteUrl: imageUrl,
          status: 'done',
          message: '',
          localPreview: ''
        })
        showSuccessToast('图片上传成功')
      } else {
        removeThreadImageById(imageItem.id)
        showToast(response?.message || '图片上传失败，请稍后重试')
      }
    } catch (error) {
      console.error('[Forum] upload image failed', error)
      removeThreadImageById(imageItem.id)
      showToast(error?.message || '图片上传失败，请稍后重试')
    } finally {
      activeThreadUploads.value = Math.max(0, activeThreadUploads.value - 1)
      if (loadingToast && typeof loadingToast.close === 'function') {
        loadingToast.close()
      } else {
        closeToast()
      }
    }
  }
}

const handleThreadImageDelete = (event) => {
  const index = event?.index
  if (typeof index === 'number') {
    const item = threadImages.value[index]
    if (item?.id) {
      removeThreadImageById(item.id)
    }
  }
}

const handleThreadPreviewRemove = (index) => {
  if (typeof index !== 'number') return
  const item = threadImages.value[index]
  if (item?.id) {
    removeThreadImageById(item.id)
  } else {
    threadImages.value.splice(index, 1)
  }
}

const displayThreadImage = (file) => file?.previewUrl || file?.content || file?.url || ''

const handleThreadOversize = () => {
  showToast('原图过大，请选择不超过5MB的图片')
}

const loadSectionMeta = async () => {
  try {
    const response = await fetchForumSections({ paginate: false })
    const matched = Array.isArray(response.data)
      ? response.data.find((item) => Number(item.id) === sectionId)
      : null

    if (matched) {
      section.name = matched.name
      section.description = matched.description
      section.logo_url = matched.logo_url || ''
      section.moderator_forum_user = matched.moderator_forum_user || null
      section.moderator = matched.moderator || null
      section.hottest_thread = matched.hottest_thread || null
    }
  } catch (error) {
    console.error('[Forum] load section meta failed', error)
  }
}

const loadThreads = async (reset = false) => {
  if (internalLoading.value) return
  internalLoading.value = true
  loading.value = true

  try {
    const response = await fetchThreads(sectionId, {
      page: reset ? 1 : page.value,
      per_page: perPage
    })

    const list = Array.isArray(response.data) ? response.data : []
    const normalized = list.map(formatThreadPayload)
    threads.value = reset ? normalized : [...threads.value, ...normalized]

    const currentPage = response.pagination?.current_page ?? (reset ? 1 : page.value)
    const lastPage = response.pagination?.last_page ?? currentPage
    finished.value = currentPage >= lastPage
    page.value = currentPage + 1
  } catch (error) {
    console.error('[Forum] load threads failed', error)
  } finally {
    loading.value = false
    internalLoading.value = false
    refreshing.value = false
  }
}

const loadMore = () => {
  if (finished.value) {
    loading.value = false
    return
  }
  loadThreads()
}

const handleRefresh = () => {
  page.value = 1
  finished.value = false
  loadThreads(true)
}

const handleCreateThread = async (event) => {
  if (event?.preventDefault) {
    event.preventDefault()
  }

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

  if (threadUploadLoading.value) {
    showToast('图片正在上传，请稍候提交')
    return
  }

  if (!canPublish.value) {
    showToast('写点内容再发布吧')
    return
  }

  try {
    creating.value = true
    const publishedImages = threadImages.value
      .filter((item) => item.status !== 'uploading' && (item.remoteUrl || item.url))
      .map((item) => item.remoteUrl || item.url)
    const payload = {
      title: form.title.trim() || form.content.trim().slice(0, 60) || '新的讨论',
      content: form.content.trim() || form.title.trim(),
      images: publishedImages
    }

    await createThread(sectionId, payload)

    showSuccessToast('帖子创建成功')
    closeCreateDialog()
    page.value = 1
    finished.value = false
    await loadThreads(true)
  } catch (error) {
    console.error('[Forum] create thread failed', error)
  } finally {
    creating.value = false
  }
}

const openThread = (thread) => {
  router.push({
    name: 'ForumThread',
    params: { threadId: thread.id },
    query: {
      sectionId,
      sectionName: section.name
    }
  })
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

onMounted(async () => {
  refreshTokenState()
  isWechatEnv.value = isWechatBrowser()
  if (isLoggedIn.value) {
    await loadForumProfile()
    if (!forumUser.consented) {
      authMode.value = 'consent'
    }
  } else {
    authMode.value = 'login'
  }
  await loadSectionMeta()
  await loadThreads(true)
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.forum-section {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.forum-section__header {
  background-color: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.forum-section__header-top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.forum-section__logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid #e0e7ff;
  background-color: #fff;
  object-fit: cover;
  flex-shrink: 0;
}

.forum-section__title-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.forum-section__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.forum-section__moderator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 13px;
}

.forum-section__moderator--empty {
  background-color: #e2e8f0;
  color: #475569;
}

.forum-section__moderator-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.forum-section__description {
  color: #64748b;
  font-size: 14px;
}

.forum-section__primary-action {
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background-image: linear-gradient(90deg, #2563eb, #38bdf8) !important;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.18);
}

.forum-section__primary-action:active {
  opacity: 0.9;
}

.forum-section__primary-action :deep(.van-button__content) {
  justify-content: center;
  gap: 6px;
}


.forum-section__header h2 {
  margin: 0;
  font-size: 20px;
}

.forum-section__hot {
  margin: 0;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 500;
}

.forum-section__description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.forum-section__thread-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forum-section__thread-name {
  font-weight: 600;
  font-size: 16px;
}

.forum-section__thread-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.forum-section__thread-meta .meta {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.forum-section__thread-author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0f172a;
  font-weight: 600;
}

.forum-section__thread-author-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #e2e8f0;
}

.forum-section__thread-content {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.forum-section__thread-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.forum-section__thread-gallery .van-image {
  background-color: #f3f4f6;
}

.forum-section__empty {
  padding: 48px 0;
}

.forum-compose {
  background: #ffffff;
  color: #0f172a;
  padding: 20px 16px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -12px 32px rgba(15, 23, 42, 0.08);
}

.forum-compose__top-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 12px;
  margin-bottom: 12px;
}

.forum-compose__top-action {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #1f2937;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.forum-compose__top-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forum-compose__top-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  justify-self: center;
}

.forum-compose__top-submit {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  border: none;
  color: #fff;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.forum-compose__top-submit:disabled,
.forum-compose__top-submit--disabled {
  background: #cbd5f5;
  color: #fff;
  opacity: 0.6;
  cursor: not-allowed;
}

.forum-compose__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 2px;
}

.forum-compose__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.forum-compose__label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.forum-compose__label--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forum-compose__textarea {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: 72px;
}

.forum-compose__textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  outline: none;
}

.forum-compose__textarea::placeholder {
  color: #94a3b8;
}

.forum-compose__textarea--content {
  min-height: 140px;
}

.forum-compose__counter {
  text-align: right;
  color: #64748b;
  font-size: 12px;
}

.forum-compose__uploader {
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 14px;
  padding: 12px;
}

.forum-compose__uploader-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.forum-compose__uploader :deep(.van-uploader__preview) {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.forum-compose__uploader :deep(.van-uploader__preview-image) {
  object-fit: cover;
}

.forum-compose__uploader :deep(.van-uploader__upload) {
  width: 104px;
  height: 104px;
  border-radius: 12px;
  background: #eef2ff;
  border: 1px dashed #c7d2fe;
}

.forum-compose__uploader :deep(.van-uploader__upload-icon) {
  color: #2563eb;
}

.forum-compose__preview {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.forum-compose__preview-item {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.12);
}

.forum-compose__preview-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.forum-compose__preview-remove :deep(.van-icon) {
  font-size: 14px;
}

.forum-compose__uploading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  font-size: 12px;
}

.forum-section__auth-description {
  padding: 16px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.forum-section__auth-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #888;
}
</style>
