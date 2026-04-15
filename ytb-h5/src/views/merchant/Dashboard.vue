<template>
  <div class="merchant-dashboard">
    <div class="personal-header">
      <div class="personal-info">
        <van-image
          class="personal-avatar"
          width="64"
          height="64"
          round
          fit="cover"
          :src="displayAvatar"
          :lazy-load="false"
        />
        <div class="personal-text">
          <div class="personal-greeting">您好，</div>
          <div class="personal-name">{{ displayName }}</div>
          <div class="personal-sub">共 {{ merchantTotal }} 家商户 · 积分总数 {{ displayPointsTotal }}</div>
        </div>
        <van-button
          type="primary"
          size="small"
          round
          class="personal-action"
          @click="startOnboarding"
        >
          立即进件
        </van-button>
      </div>
    </div>

    <div class="content-wrap">
      <van-search
        v-model="merchantKeyword"
        placeholder="搜索商户名称 / 联系人"
        shape="round"
        clearable
        class="merchant-search"
      />

      <div v-if="loading" class="state-block">
        <van-loading type="spinner" size="24" />
        <span>加载商户中...</span>
      </div>

      <div v-else-if="filteredMerchants.length === 0" class="state-block">
        <van-empty description="暂无商户数据">
          <template #default>
            <van-button
              type="primary"
              size="small"
              round
              @click="startOnboarding"
            >
              立即进件
            </van-button>
          </template>
        </van-empty>
      </div>

      <div v-else class="merchant-list">
        <div
          class="merchant-card"
          v-for="merchant in filteredMerchants"
          :key="merchant.merchant_id || merchant.id || merchant.out_merchant_id"
        >
          <div class="merchant-card__main" @click="openMerchantDetail(merchant)">
            <van-image
              class="merchant-logo"
              width="48"
              height="48"
              round
              fit="cover"
              :src="merchant.logo || undefined"
              :error-icon="'shop-o'"
              :show-error="true"
            />
            <div class="merchant-card__info">
              <div class="merchant-name-line">
                <span class="merchant-name">{{ merchant.display_name || merchant.name || '未命名商户' }}</span>
              </div>
              <div class="merchant-meta">
                <span>ID：{{ merchant.merchant_id || merchant.id || '—' }}</span>
              </div>
              <div class="merchant-points">积分：{{ formatPoints(merchant.points_total) }}</div>
            </div>
            <van-icon name="arrow" size="16" color="#c8cad2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useMerchantStore } from '@/stores/merchant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const merchantStore = useMerchantStore()
const userStore = useUserStore()

const DEFAULT_USER_AVATAR = '/app/images/profile/default-avatar.png'

const loading = ref(true)
const merchantKeyword = ref('')
const pointsData = ref({ total: 0, earned: 0, spent: 0, history: [] })

const displayName = computed(() => {
  const info = userStore.userInfo || {}
  return userStore.userName || info.wechat_nickname || info.nickname || '未登录'
})

const displayAvatar = computed(() => {
  const info = userStore.userInfo || {}
  return userStore.userAvatar || info.wechat_avatar || info.avatar || DEFAULT_USER_AVATAR
})

const merchantList = computed(() => merchantStore.getAvailableMerchants || [])
const pointsSummary = computed(() => {
  const workspace = merchantStore.workspaceData || {}
  return workspace.points_summary || null
})

const aggregatedPointsTotal = computed(() => {
  if (pointsSummary.value && typeof pointsSummary.value.total_points === 'number') {
    return Number(pointsSummary.value.total_points) || 0
  }

  const visited = new Set()
  let total = 0

  merchantList.value.forEach((merchant) => {
    const key = String(merchant.merchant_id || merchant.id || '')
    if (!key || visited.has(key)) {
      return
    }
    visited.add(key)
    const val = Number(merchant.points_total ?? merchant.pointsTotal ?? 0)
    if (!Number.isNaN(val)) {
      total += val
    }
  })

  if (!visited.size) {
    const fallback = Number(pointsData.value.total ?? 0)
    if (!Number.isNaN(fallback)) {
      total += fallback
    }
  }

  return total
})

const displayPointsTotal = computed(() => formatPoints(aggregatedPointsTotal.value))
const merchantTotal = computed(() => merchantList.value.length)
const filteredMerchants = computed(() => {
  const keyword = merchantKeyword.value.trim().toLowerCase()
  const base = merchantList.value.slice()

  const filtered = keyword
    ? base.filter((merchant) => {
    const name = (merchant.display_name || merchant.name || merchant.merchantShortName || '').toLowerCase()
    const id = String(merchant.merchant_id || merchant.id || '').toLowerCase()
    const contact = (merchant.contact || merchant.contact_name || merchant.principal_mobile || '').toLowerCase()
    return name.includes(keyword) || id.includes(keyword) || contact.includes(keyword)
    })
    : base

  return filtered.sort((a, b) => {
    const pointsA = Number(a.points_total ?? a.pointsTotal ?? 0)
    const pointsB = Number(b.points_total ?? b.pointsTotal ?? 0)
    if (Number.isNaN(pointsA) && Number.isNaN(pointsB)) return 0
    if (Number.isNaN(pointsA)) return 1
    if (Number.isNaN(pointsB)) return -1
    return pointsB - pointsA
  })
})

const formatPoints = (value) => {
  const num = Number(value || 0)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const startOnboarding = () => {
  if (router.hasRoute('MerchantOnboardingList')) {
    router.push({ name: 'MerchantOnboardingList' }).catch(() => {})
    return
  }

  const fallbackRoutes = [
    { path: '/merchant/onboarding/list' },
    { name: 'MerchantOnboarding' },
    { path: '/merchant/onboarding' },
    { name: 'MerchantApply' },
    { path: '/merchant/apply' },
    { name: 'Institution' },
    { path: '/institution' }
  ]

  for (const route of fallbackRoutes) {
    if (route.name && router.hasRoute(route.name)) {
      router.push(route).catch(() => {})
      return
    }
    if (route.path) {
      router.push(route.path).catch(() => {})
      return
    }
  }

  showToast('请联系客服完成商户进件')
}

const openMerchantDetail = (merchant) => {
  const targetId = String(merchant.merchant_id || merchant.id || '')
  if (!targetId) {
    showToast('无法打开详情：缺少商户ID')
    return
  }
  router.push({ name: 'MerchantDetail', params: { id: targetId } })
}

const loadWorkspaceData = async () => {
  loading.value = true
  try {
    const data = await merchantStore.fetchWorkspaceData()
    if (data) {
      pointsData.value = data.points || merchantStore.getPointsData || { total: 0, earned: 0, spent: 0, history: [] }
    }
  } catch (error) {
    showToast('加载商户数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (typeof merchantStore.initMerchantData === 'function') {
    merchantStore.initMerchantData()
  }

  if (userStore.isLoggedIn && (!userStore.userInfo || Object.keys(userStore.userInfo).length === 0)) {
    try {
      await userStore.fetchUserInfo({ forceRefresh: true })
    } catch (error) {
      // ignore
    }
  }

  await loadWorkspaceData()
})
</script>

<style scoped>
.merchant-dashboard {
  min-height: 100vh;
  background: linear-gradient(180deg, #4c8dff 0%, #f7f8fa 35%);
}

.personal-header {
  padding: calc(env(safe-area-inset-top, 0px) + 24px) 16px 20px;
  color: #ffffff;
}

.personal-info {
  display: flex;
  align-items: center;
}

.personal-avatar {
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.personal-text {
  flex: 1;
  margin-left: 12px;
}

.personal-greeting {
  font-size: 14px;
  opacity: 0.85;
}

.personal-name {
  font-size: 20px;
  font-weight: 600;
}

.personal-sub {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 6px;
}

.personal-action {
  margin-left: 12px;
}

.content-wrap {
  margin-top: -18px;
  padding: 26px 16px 30px;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background-color: #f7f8fa;
  min-height: calc(100vh - 140px);
}

.merchant-search {
  margin-bottom: 12px;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #646566;
  min-height: 220px;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merchant-card {
  background-color: #ffffff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 8px 20px rgba(43, 109, 229, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.merchant-card:active {
  transform: scale(0.98);
  box-shadow: 0 6px 16px rgba(43, 109, 229, 0.08);
}

.merchant-card__main {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.merchant-logo {
  flex-shrink: 0;
  background-color: #f2f3f5;
}

.merchant-card__info {
  flex: 1;
}

.merchant-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.merchant-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.merchant-meta {
  font-size: 12px;
  color: #80848f;
  margin-top: 2px;
}

.merchant-points {
  font-size: 13px;
  color: #2b6de5;
  margin-top: 4px;
}

</style>
