import { Dialog } from 'vant'
import { watch, ref } from 'vue'

const PROMPT_COOLDOWN = 60 * 1000

export function setupPhoneBindingWatcher(userStore, router) {
  const promptShown = ref(false)
  const lastPromptAt = ref(0)

  watch(
    () => ({
      loggedIn: userStore.isLoggedIn,
      phone: userStore.userInfo?.phone,
      route: router.currentRoute.value.path
    }),
    async ({ loggedIn, phone, route }) => {
      if (!loggedIn) {
        promptShown.value = false
        return
      }

      if (!phone && route !== '/bind-phone') {
        localStorage.setItem('needBindPhone', 'true')
        const now = Date.now()
        if (promptShown.value || now - lastPromptAt.value < PROMPT_COOLDOWN) {
          return
        }
        promptShown.value = true
        lastPromptAt.value = now

        try {
          await Dialog.confirm({
            title: '绑定手机号',
            message: '为保障账户安全并完成角色匹配，请先绑定手机号码。',
            confirmButtonText: '去绑定',
            cancelButtonText: '稍后',
            confirmButtonColor: '#ff4d55',
            cancelButtonColor: '#8a8a8a',
            showCancelButton: true
          })
          promptShown.value = false
          router.push({
            path: '/bind-phone',
            query: { redirect: router.currentRoute.value.fullPath }
          })
        } catch {
          promptShown.value = false
          lastPromptAt.value = Date.now()
        }
      } else if (phone) {
        localStorage.removeItem('needBindPhone')
        promptShown.value = false
      }
    },
    { immediate: true }
  )
}
