<template>
  <div class="forum-index">

    <div
      class="forum-index__header forum-index__header--authorized"
      v-if="isLoggedIn && forumUser.profile"
    >
      <div class="forum-index__welcome">
        <van-image
          class="forum-index__avatar"
          round
          width="52"
          height="52"
          :src="forumUser.profile?.avatar || userStore.userAvatar || defaultAvatar"
          fit="cover"
        />
        <div class="forum-index__welcome-text">
          <p class="forum-index__nickname">{{ forumUser.profile?.nickname || userStore.userName }}</p>
          <p class="forum-index__intro">欢迎分享AI Coding路上的点点滴滴，让自己成为明灯，让更多人少走弯路！</p>
        </div>
      </div>
      <van-button
        v-if="!forumUser.consented"
        type="primary"
        round
        block
        class="forum-index__primary-action"
        :icon="primaryActionIcon"
        @click="handlePrimaryAction"
      >
        {{ primaryActionLabel }}
      </van-button>
    </div>
    <div class="forum-index__header" v-else>
      <h2>社区论坛</h2>
      <p class="forum-index__description">登录并授权后即可参与讨论</p>
      <van-button
        type="primary"
        round
        block
        class="forum-index__primary-action"
        :icon="primaryActionIcon"
        @click="handlePrimaryAction"
      >
        {{ primaryActionLabel }}
      </van-button>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
      <div v-if="loading" class="forum-index__loading">
        <van-loading size="24px">加载中...</van-loading>
      </div>
      <template v-else>
        <div v-if="sections.length === 0" class="forum-index__empty">
          <van-empty description="暂无讨论区" />
        </div>
        <van-cell
          v-for="section in sections"
          :key="section.id"
          is-link
          @click="openSection(section)"
        >
          <template #title>
            <div class="forum-index__cell-title">
              <van-image
                v-if="section.logo_url"
                class="forum-index__cell-logo"
                :src="section.logo_url"
                width="32"
                height="32"
                fit="contain"
                round
              />
              <van-image
                v-else
                class="forum-index__cell-logo"
                :src="defaultSectionLogo"
                width="32"
                height="32"
                fit="contain"
                round
              />
              <span class="forum-index__cell-name">{{ section.name }}</span>
            </div>
          </template>
          <template #label>
            <div class="forum-index__cell-hot" v-if="section.hottest_thread">
              最热帖子：
              <span class="forum-index__cell-hot-title">{{ section.hottest_thread.title }}</span>
            </div>
            <div v-else class="forum-index__cell-desc">{{ section.description || '暂无简介' }}</div>
            <div class="forum-index__cell-meta">
              <span class="meta">帖子 {{ section.topics_count }}</span>
              <span class="meta">热度 {{ section.popularity_score }}</span>
            </div>
          </template>
        </van-cell>
      </template>
    </van-pull-refresh>

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
      <div class="forum-index__auth-description">
        {{ authDialogDescription }}
        <div class="forum-index__auth-hint" v-if="authDialogHint">
          {{ authDialogHint }}
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { fetchForumSections } from '@/api/forum'
import { getForumUserProfile, activateForumUser } from '@/api/forumUser'
import { getWechatInfo, isWechatBrowser } from '@/utils/wechat'
import { startForumLogin } from '@/utils/forumAuth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const sections = ref([])
const loading = ref(false)
const refreshing = ref(false)
const showAuthDialog = ref(false)
const authorizing = ref(false)
const authMode = ref('consent') // 'login' | 'consent'

const token = ref('')
const forumUser = reactive({
  loading: false,
  consented: false,
  exists: false,
  profile: null
})
const defaultAvatar = 'https://pay.itapgo.com/images/forum-avatar-default.png'
const defaultSectionLogo = 'https://pay.itapgo.com/images/forum-avatar-default.png'
const isWechatEnv = ref(false)

const isLoggedIn = computed(() => Boolean(token.value))
const primaryActionLabel = computed(() => {
  if (!isLoggedIn.value) return '登录后参与讨论'
  if (!forumUser.consented) return '授权后参与讨论'
  return ''
})

const primaryActionIcon = computed(() => {
  if (!isLoggedIn.value) return 'user-o'
  if (!forumUser.consented) return 'shield-o'
  return 'smile-o'
})

const authDialogTitle = computed(() => (authMode.value === 'login' ? '登录后继续' : '授权论坛访问'))
const authDialogDescription = computed(() =>
  authMode.value === 'login'
    ? '请先登录账号，登录后即可创建讨论区并参与社区互动。'
    : '授权后会同步您的微信头像、昵称和UnionID，便于在论坛中展示真实身份并进行审计。'
)
const authDialogHint = computed(() => {
  if (authMode.value === 'login') {
    return '点击“立即登录”后将发起微信授权登录。'
  }
  return !isWechatEnv.value ? '当前非微信环境，无法直接授权，请在微信中打开后重试。' : ''
})
const authConfirmText = computed(() => (authMode.value === 'login' ? '立即登录' : '立即授权'))
const authCancelText = computed(() => (authMode.value === 'login' ? '稍后再说' : '稍后'))

const triggerForumLogin = () => {
  const current = router.currentRoute.value?.fullPath || '/forum'
  startForumLogin(current)
}

const handlePrimaryAction = () => {
  if (!isLoggedIn.value) {
    triggerForumLogin()
    return
  }

  if (!forumUser.consented) {
    authMode.value = 'consent'
    showAuthDialog.value = true
    return
  }

  showToast('您已完成授权，可直接进入任意讨论区')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const loadSections = async () => {
  if (loading.value && !refreshing.value) return
  loading.value = true

  try {
    const response = await fetchForumSections({ paginate: false })
    const list = Array.isArray(response.data) ? response.data : []
    sections.value = list
  } catch (error) {
    console.error('[Forum] load sections failed', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const handleRefresh = () => {
  refreshing.value = true
  loadSections()
}

const openSection = (section) => {
  router.push({
    name: 'ForumSection',
    params: { sectionId: section.id },
    query: {
      name: section.name,
      logo: section.logo_url || '',
      moderatorNickname: section.moderator_forum_user?.nickname || '',
      moderatorAvatar: section.moderator_forum_user?.avatar || ''
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
      if (forumUser.profile?.avatar) {
        userStore.setUserInfo({
          ...userStore.userInfo,
          avatar: forumUser.profile.avatar,
          nickname: forumUser.profile.nickname || userStore.userName,
        })
      }
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
      forumUser.consented = false
      forumUser.exists = false
      forumUser.profile = null
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
      showAuthDialog.value = true
    }
  } else {
    authMode.value = 'login'
    showAuthDialog.value = false
  }
  await loadSections()
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.forum-index {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.forum-index__header {
  padding: 16px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 0 0 12px 12px;
}

.forum-index__header--authorized {
  background-image: linear-gradient(135deg, #1d4ed8, #2563eb, #38bdf8);
  color: #fff;
  border-radius: 0 0 18px 18px;
  padding: 16px 16px 18px;
  align-items: center;
  text-align: center;
  position: relative;
}

.forum-index__header--authorized::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  height: 16px;
  background: linear-gradient(180deg, rgba(37,99,235,0.28), rgba(37,99,235,0));
  border-radius: 0 0 18px 18px;
  pointer-events: none;
}

.forum-index__welcome {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
}

.forum-index__avatar {
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.2);
}

.forum-index__welcome-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  flex: 1;
}

.forum-index__nickname {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.forum-index__intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.95;
}

.forum-index__primary-action {
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background-image: linear-gradient(90deg, #2563eb, #38bdf8) !important;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.18);
}

.forum-index__primary-action:active {
  opacity: 0.9;
}

.forum-index__primary-action :deep(.van-button__content) {
  justify-content: center;
  gap: 6px;
}

.forum-index__header h2 {
  margin: 0;
  font-size: 20px;
}

.forum-index__description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.forum-index__primary-action {
  margin-top: 10px;
  height: 40px;
  font-size: 15px;
  font-weight: 600;
  background-image: linear-gradient(90deg, #2563eb, #38bdf8) !important;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
  border: none;
}

.forum-index__cell-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forum-index__cell-logo {
  border: 1px solid #e5e7eb;
  background: #fff;
}

.forum-index__cell-name {
  font-weight: 600;
  font-size: 16px;
}

.forum-index__cell-hot {
  font-size: 13px;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.forum-index__cell-hot-title {
  font-weight: 600;
}

.forum-index__cell-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.forum-index__cell-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #999;
  font-size: 13px;
}

.forum-index__cell-meta .meta {
  white-space: nowrap;
}

.forum-index__empty {
  padding: 48px 0;
}

.forum-index__auth-description {
  padding: 16px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.forum-index__auth-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #888;
}
</style>
