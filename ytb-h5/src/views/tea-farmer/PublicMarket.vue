<template>
  <div class="tea-market-page">
    <van-nav-bar
      title="茶农市场"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    />

    <div class="page-body">
      <van-search
        v-model="keyword"
        placeholder="搜索茶厂或茶品"
        shape="round"
        background="#f5f7fb"
        @search="handleSearch"
      />

      <div v-if="loading" class="state-block">
        <van-loading size="24px" color="#10b981" />
        <p>正在获取茶农信息...</p>
      </div>

      <van-empty v-else-if="!filteredFarmers.length" description="暂无茶农信息" />

      <section v-else class="farmer-list">
        <article v-for="farmer in filteredFarmers" :key="farmer.id" class="farmer-card">
          <header class="farmer-card__header">
            <div>
              <p class="farmer-card__brand">{{ farmer.brand_name }}</p>
              <p class="farmer-card__farm">{{ farmer.farm_name }}</p>
            </div>
            <van-tag v-if="farmer.tea_type" type="success" plain>{{ farmer.tea_type }}</van-tag>
          </header>

          <p class="farmer-card__location">
            <van-icon name="location-o" />
            <span>{{ farmer.location || '未填写山场位置' }}</span>
          </p>

          <div class="farmer-card__stats">
            <div>
              <p class="stat__value">{{ farmer.product_count }}</p>
              <p class="stat__label">茶品种类</p>
            </div>
            <div>
              <p class="stat__value">{{ farmer.total_stock }} 斤</p>
              <p class="stat__label">库存合计</p>
            </div>
            <div>
              <p class="stat__value">{{ farmer.farm_area }} 亩</p>
              <p class="stat__label">茶园面积</p>
            </div>
          </div>

          <div class="product-list" v-if="farmer.products.length">
            <div class="product-row" v-for="product in farmer.products" :key="product.id">
              <div class="product-row__name">
                <p>{{ product.name }}</p>
                <small v-if="product.alias">{{ product.alias }}</small>
              </div>
              <div class="product-row__meta">
                <span class="product-row__stock">{{ product.stock }} 斤</span>
                <van-tag
                  v-if="product.parameters?.type"
                  size="small"
                  type="primary"
                  plain
                >
                  {{ product.parameters.type }}
                </van-tag>
                <van-tag
                  v-if="product.parameters?.fireLevel"
                  size="small"
                  type="warning"
                  plain
                >
                  {{ product.parameters.fireLevel }}火
                </van-tag>
              </div>
            </div>
          </div>
          <p v-else class="product-empty">暂无茶品信息</p>

          <div class="farmer-card__actions">
            <van-button
              type="primary"
              size="small"
              plain
              @click="callFarmer(farmer.contact || farmer.contact_phone)"
            >
              联系茶农
            </van-button>
            <van-button
              size="small"
              plain
              @click="copyContact(farmer.contact || farmer.contact_phone)
                "
            >
              复制电话
            </van-button>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchTeaMarketOverview } from '@/api/teaFarmer'

const router = useRouter()

const loading = ref(true)
const keyword = ref('')
const farmers = ref([])

const filteredFarmers = computed(() => {
  if (!keyword.value) return farmers.value
  const text = keyword.value.trim().toLowerCase()
  return farmers.value.filter((farmer) => {
    const haystack = [
      farmer.farm_name,
      farmer.brand_name,
      farmer.location,
      farmer.tea_type,
      farmer.products.map((item) => `${item.name} ${item.alias}`).join(' ')
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(text)
  })
})

function handleSearch(value) {
  keyword.value = value
}

function callFarmer(phone) {
  if (!phone) {
    showToast('暂无联系电话')
    return
  }
  window.location.href = `tel:${phone}`
}

async function copyContact(phone) {
  if (!phone) {
    showToast('暂无联系电话')
    return
  }
  try {
    await navigator.clipboard.writeText(phone)
    showToast('联系电话已复制')
  } catch (error) {
    console.error('[TeaMarket] 复制失败', error)
    showToast('复制失败')
  }
}

async function loadMarket() {
  loading.value = true
  try {
    const response = await fetchTeaMarketOverview()
    if (response.code === 0) {
      farmers.value = response.data?.farmers || []
    } else {
      showToast(response.message || '获取茶农信息失败')
    }
  } catch (error) {
    console.error('[TeaMarket] 获取数据失败', error)
    showToast('获取茶农信息失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMarket()
})
</script>

<style scoped>
.tea-market-page {
  min-height: 100vh;
  background: #f5f7fb;
}

.page-body {
  padding: 12px 16px 24px;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 80px 0;
  color: #6b7280;
  font-size: 14px;
}

.farmer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.farmer-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.farmer-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.farmer-card__brand {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.farmer-card__farm {
  margin: 2px 0 0;
  color: #6b7280;
}

.farmer-card__location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 13px;
  margin: 0 0 12px;
}

.farmer-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
  margin-bottom: 12px;
}

.stat__value {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.stat__label {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #eef2ff;
  border-radius: 12px;
  padding: 10px;
  background: #f9fafb;
}

.product-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.product-row__name p {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.product-row__name small {
  color: #6b7280;
}

.product-row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
}

.product-row__stock {
  font-weight: 600;
}

.product-empty {
  margin: 0 0 12px;
  padding: 12px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 13px;
}

.farmer-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
