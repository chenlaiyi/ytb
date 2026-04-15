<template>
  <section class="commission-section">
    <van-pull-refresh
      v-model="state.refreshing"
      :disabled="state.loading && !state.items.length"
      @refresh="handleRefresh"
    >
      <div v-if="state.error" class="commission-error">
        <van-icon name="warning-o" />
        <p>{{ state.error }}</p>
        <van-button size="small" type="primary" plain @click="handleRetry">
          重新加载
        </van-button>
      </div>

      <van-empty v-else-if="!state.items.length && !state.loading" description="暂无分润记录" />

      <div v-else class="commission-list">
        <article
          v-for="item in state.items"
          :key="`${item.id}-${item.merchant_code}-${item.sales_date}`"
          class="commission-card"
        >
          <header class="commission-card__header">
            <div class="commission-card__merchant">
              <span>{{ item.merchant_name || '未命名商户' }}</span>
              <small>商户号 {{ item.merchant_code || '—' }}</small>
            </div>
            <time>{{ item.sales_date || '—' }}</time>
          </header>

          <dl class="commission-card__metrics">
            <div>
              <dt>交易额</dt>
              <dd>{{ formatAmount(item.sales_amount) }}</dd>
            </div>
            <div>
              <dt>净入账</dt>
              <dd>{{ formatAmount(item.net_amount) }}</dd>
            </div>
            <div>
              <dt>分润</dt>
              <dd class="commission-card__highlight">
                {{ formatAmount(item.commission_amount) }}
              </dd>
            </div>
            <div>
              <dt>分润方式</dt>
              <dd>{{ item.commission_source === 'team' ? '团队差益' : '个人直推' }}</dd>
            </div>
            <div>
              <dt>佣金率</dt>
              <dd>{{ formatPercent(item.commission_rate_percent) }}</dd>
            </div>
            <div>
              <dt>交易笔数</dt>
              <dd>{{ item.transaction_count ?? 0 }}</dd>
            </div>
          </dl>

          <footer class="commission-card__footer">
            <div>
              <span>{{ item.salesperson_name || '未命名业务' }}</span>
              <small>{{ item.salesperson_account || '—' }}</small>
            </div>
            <div>
              <span>{{ item.owner_institution_name || '未关联机构' }}</span>
              <small>{{ item.owner_institution_number || '' }}</small>
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

function formatPercent(value) {
  const numeric = Number(value ?? 0)
  return `${numeric.toFixed(2)}%`
}
</script>

<style scoped>
.commission-section {
  padding: 12px 16px 24px;
  min-height: 260px;
}

.commission-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.commission-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(20, 55, 90, 0.06);
}

.commission-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #1f2333;
}

.commission-card__merchant {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.commission-card__merchant span {
  font-weight: 600;
}

.commission-card__merchant small {
  font-size: 12px;
  color: #8b94a7;
}

.commission-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 8px;
  margin-bottom: 12px;
}

.commission-card__metrics dt {
  font-size: 12px;
  color: #8b94a7;
  margin-bottom: 4px;
}

.commission-card__metrics dd {
  margin: 0;
  font-size: 14px;
  color: #1a2330;
}

.commission-card__highlight {
  color: #1a68ff;
  font-weight: 600;
}

.commission-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #6c7487;
}

.commission-card__footer div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.commission-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: #ff6b6b;
}

.commission-error p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 360px) {
  .commission-card__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
