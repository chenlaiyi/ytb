<template>
  <section class="partner-section">
    <van-pull-refresh
      v-model="state.refreshing"
      :disabled="state.loading && !state.items.length"
      @refresh="handleRefresh"
    >
      <div v-if="state.error" class="partner-error">
        <van-icon name="warning-o" />
        <p>{{ state.error }}</p>
        <van-button size="small" type="primary" plain @click="handleRetry">
          重新加载
        </van-button>
      </div>

      <van-empty v-else-if="!state.items.length && !state.loading" description="暂无伙伴数据" />

      <div v-else class="partner-list">
        <article
          v-for="item in state.items"
          :key="item.id"
          class="partner-card"
        >
          <header class="partner-card__header">
            <div class="partner-card__profile">
              <van-image
                round
                width="48"
                height="48"
                fit="cover"
                :src="item.avatar"
                :error-icon="'user-o'"
              />
              <div class="partner-card__info">
                <div class="partner-card__name">
                  <span>{{ item.name }}</span>
                  <van-tag type="primary" round plain size="mini">
                    {{ item.role?.text || '渠道伙伴' }}
                  </van-tag>
                </div>
                <div class="partner-card__meta">
                  <span>手机号 {{ item.phone || '—' }}</span>
                  <span>机构号 {{ item.number || '—' }}</span>
                </div>
                <div class="partner-card__meta">
                  <span>美团账号 {{ item.account || '—' }}</span>
                </div>
              </div>
            </div>
            <van-tag type="success" round size="mini">
              {{ item.level_text || '伙伴' }}
            </van-tag>
          </header>

          <dl class="partner-card__metrics">
            <div>
              <dt>团队成交</dt>
              <dd class="partner-card__highlight">{{ formatAmount(item.team_sales_amount) }}</dd>
            </div>
            <div>
              <dt>本月成交</dt>
              <dd>{{ formatAmount(item.team_month_sales_amount) }}</dd>
            </div>
            <div>
              <dt>直属成交</dt>
              <dd>{{ formatAmount(item.direct_sales_amount) }}</dd>
            </div>
            <div>
              <dt>团队分润</dt>
              <dd>{{ formatAmount(item.team_commission_amount) }}</dd>
            </div>
          </dl>

          <footer class="partner-card__footer">
            <div>
              <span>直属伙伴</span>
              <small>{{ item.children_count ?? 0 }}</small>
            </div>
            <div>
              <span>团队商户</span>
              <small>{{ item.merchant_total ?? 0 }}</small>
            </div>
            <div>
              <span>归属</span>
              <small>{{ item.parent?.name || '—' }}</small>
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
</script>

<style scoped>
.partner-section {
  padding: 12px 16px 24px;
  min-height: 260px;
}

.partner-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: #d95040;
}

.partner-error p {
  margin: 0;
  font-size: 14px;
}

.partner-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.partner-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(31, 45, 61, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.partner-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.partner-card__profile {
  display: flex;
  gap: 12px;
  align-items: center;
}

.partner-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.partner-card__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
  color: #182032;
}

.partner-card__meta {
  font-size: 12px;
  color: #6c7487;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.partner-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.partner-card__metrics dt {
  font-size: 12px;
  color: #8b94a7;
  margin-bottom: 4px;
}

.partner-card__metrics dd {
  margin: 0;
  font-size: 14px;
  color: #1f2535;
}

.partner-card__highlight {
  color: #1a68ff;
  font-weight: 600;
}

.partner-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #6c7487;
}

.partner-card__footer small {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #1f2333;
  font-weight: 600;
}
</style>
