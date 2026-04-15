<template>
  <div class="forum-login">
    <van-nav-bar title="社区论坛登录" left-arrow @click-left="handleBack" />

    <section class="forum-login__hero">
      <h2>欢迎加入社区论坛</h2>
      <p>
        登录后即可参与 Augment、Claude Code 等讨论区的交流，分享你的产品经验与工具心得。
      </p>
    </section>

    <section class="forum-login__card">
      <van-image
        class="forum-login__illustration"
        width="120"
        height="120"
        :src="avatarUrl"
        fit="cover"
        round
        lazy-load
        error-icon="photo-fail"
      />
      <p class="forum-login__hint">
        我们将使用微信授权同步头像和昵称，保障社区互动的真实性与安全性。
      </p>
      <van-button
        type="primary"
        block
        round
        class="forum-login__action"
        :loading="loading"
        @click="handleWechatLogin"
      >
        微信一键登录
      </van-button>
      <van-button
        block
        round
        plain
        class="forum-login__secondary"
        @click="handleBack"
      >
        先逛逛
      </van-button>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { startForumLogin } from '@/utils/forumAuth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const redirectPath = ref('/')
const avatarUrl = ref('https://pay.itapgo.com/images/forum-avatar-default.png')

const resolveRedirectPath = () => {
  const raw = route.query.redirect
  if (!raw) {
    return '/forum'
  }

  try {
    const decoded = decodeURIComponent(String(raw))
    if (decoded.startsWith('/')) {
      return decoded
    }
    if (decoded.startsWith('#/')) {
      return decoded.slice(1)
    }
    return `/forum`
  } catch (error) {
    console.warn('[ForumLogin] decode redirect failed', error)
    return '/forum'
  }
}

const ensureLoggedIn = () => {
  const token = localStorage.getItem('token')
  if (token) {
    hydrateAvatar()
    router.replace(redirectPath.value || '/forum')
    return true
  }
  return false
}

const handleBack = () => {
  router.back()
}

const handleWechatLogin = async () => {
  try {
    loading.value = true
    await startForumLogin(redirectPath.value || '/forum')
  } catch (error) {
    console.error('[ForumLogin] 发起登录流程失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  redirectPath.value = resolveRedirectPath()
  hydrateAvatar()
  if (ensureLoggedIn()) {
    return
  }
  watch(
    () => userStore.userAvatar,
    (newAvatar) => {
      if (newAvatar) {
        avatarUrl.value = newAvatar
      }
    },
    { immediate: false }
  )
})

const hydrateAvatar = () => {
  try {
    const fromStore = userStore.userAvatar
    if (fromStore) {
      avatarUrl.value = fromStore
      return
    }

    const stored = localStorage.getItem('userInfo') || localStorage.getItem('wechat_user_info')
    if (stored) {
      const user = JSON.parse(stored)
      const avatar = user?.avatar || user?.wechat_avatar || user?.headimgurl
      if (avatar) {
        avatarUrl.value = avatar
      }
    }
  } catch (error) {
    console.warn('[ForumLogin] 解析本地用户信息失败', error)
  }
}
</script>

<style scoped>
.forum-login {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 40%);
}

.forum-login__hero {
  padding: 24px 24px 12px;
  text-align: left;
}

.forum-login__hero h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
}

.forum-login__hero p {
  margin: 12px 0 0;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.forum-login__card {
  margin: 0 16px;
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.forum-login__illustration {
  border-radius: 16px;
  background: #f5f8ff;
}

.forum-login__hint {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
}

.forum-login__action {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  background-image: linear-gradient(90deg, #2563eb, #38bdf8) !important;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.16);
}

.forum-login__secondary {
  width: 100%;
  height: 44px;
  font-size: 15px;
  color: #2563eb;
  border-color: #93c5fd;
}
</style>
