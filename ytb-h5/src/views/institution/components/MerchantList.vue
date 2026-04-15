<template>
  <section class="merchant-section">
    <van-pull-refresh
      v-model="state.refreshing"
      :disabled="state.loading && !state.items.length"
      @refresh="handleRefresh"
    >
      <div v-if="state.error" class="merchant-error">
        <van-icon name="warning-o" />
        <p>{{ state.error }}</p>
        <van-button size="small" type="primary" plain @click="handleRetry">
          重新加载
        </van-button>
      </div>

      <van-empty v-else-if="!state.items.length && !state.loading" description="暂无商户数据" />

      <div v-else class="merchant-list">
        <article
          v-for="item in state.items"
          :key="item.merchant_code"
          class="merchant-card"
        >
          <header class="merchant-card__header">
            <div class="merchant-card__title">
              <span>{{ item.merchant_name || '未命名商户' }}</span>
              <van-tag v-if="item.owner_is_direct" type="primary" round size="mini">直属</van-tag>
              <van-tag v-else type="success" round size="mini">团队</van-tag>
            </div>
            <van-tag :type="statusTagType(item.status)" round size="mini">
              {{ item.status_text || '未知状态' }}
            </van-tag>
          </header>

          <div class="merchant-card__subtitle">
            <span>商户号 {{ item.merchant_code || '—' }}</span>
            <span v-if="item.owner_institution_name">归属 {{ item.owner_institution_name }}</span>
          </div>

          <dl class="merchant-card__metrics">
            <div>
              <dt>累计交易额</dt>
              <dd class="merchant-card__highlight">
                {{ item.total_sales_formatted || formatAmount(item.total_sales) }}
              </dd>
            </div>
            <div>
              <dt>净入账</dt>
              <dd>{{ formatAmount(item.net_sales) }}</dd>
            </div>
            <div>
              <dt>交易笔数</dt>
              <dd>{{ item.transaction_count ?? 0 }}</dd>
            </div>
          </dl>

          <footer class="merchant-card__footer">
            <div>
              <span>{{ item.salesperson_name || '业务员' }}</span>
              <small>{{ item.salesperson_account || '—' }}</small>
            </div>
            <div>
              <span>最后交易</span>
              <small>{{ item.last_sales_date || '—' }}</small>
            </div>
          </footer>
        </article>

        <van-list
          v-model:loading="state.loading"
          :finished="state.finished"
          :finished-text="state.items.length ? '已经到底啦' : ''"
          @load="handleLoad"
        />
      </div>
    </van-pull-refresh>
  </section>
</template>

<script setup>
import { formatAmount as formatCurrency } from '@/utils/format'

const props = defineProps({
  scope: {
    type: String,
    required: true
  },
  state: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['load', 'refresh', 'retry'])

function handleLoad() {
  emit('load', props.scope)
}

function handleRefresh() {
  emit('refresh', props.scope)
}

function handleRetry() {
  emit('retry', props.scope)
}

function formatAmount(value) {
  return formatCurrency(value ?? 0)
}

function statusTagType(status) {
  const value = String(status ?? '').toLowerCase()
  if (value === 'active') {
    return 'success'
  }
  if (value === 'pending') {
    return 'warning'
  }
  if (value === 'inactive') {
    return 'primary'
  }
  return 'primary'
}
</script>

<style scoped>
.merchant-section {
  padding: 12px 16px 24px;
  min-height: 260px;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merchant-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(20, 55, 90, 0.06);
}

.merchant-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.merchant-card__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2333;
  font-size: 15px;
}

.merchant-card__subtitle {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6c7487;
}

.merchant-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 8px;
  margin: 12px 0;
}

.merchant-card__metrics dt {
  font-size: 12px;
  color: #8b94a7;
  margin-bottom: 4px;
}

.merchant-card__metrics dd {
  margin: 0;
  font-size: 14px;
  color: #1a2330;
}

.merchant-card__highlight {
  color: #1a68ff;
  font-weight: 600;
}

.merchant-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #6c7487;
}

.merchant-card__footer div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.merchant-card__footer small {
  color: #8b94a7;
}

.merchant-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: #ff6b6b;
}

.merchant-error p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 360px) {
  .merchant-card__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
