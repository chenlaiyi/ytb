<template>
  <section class="filter-section">
    <van-search
      v-model="keywordProxy"
      shape="round"
      placeholder="搜索商户名称 / 编号 / 业务员"
      :clearable="true"
      show-action
      @search="handleSearch"
      @clear="handleClear"
      @cancel="handleClear"
    >
      <template #action>
        <span class="search-action" @click="handleSearch">搜索</span>
      </template>
    </van-search>

    <div class="filter-chips">
      <div class="chip-group">
        <span class="chip-group-label">范围</span>
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          type="button"
          class="chip"
          :class="{ 'chip--active': state.range === option.value }"
          @click="emit('range-change', state.scope || scopeFallback.value, option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="chip-group">
        <span class="chip-group-label">状态</span>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="chip"
          :class="{ 'chip--active': state.status === option.value }"
          @click="emit('status-change', state.scope || scopeFallback.value, option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: {
    type: Object,
    required: true
  },
  statusOptions: {
    type: Array,
    required: true
  },
  rangeOptions: {
    type: Array,
    required: true
  },
  searchKeyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:keyword',
  'status-change',
  'range-change',
  'search',
  'clear'
])

const scopeFallback = computed(() => props.state.scope || 'team')

const keywordProxy = computed({
  get() {
    return props.searchKeyword
  },
  set(value) {
    emit('update:keyword', value)
  }
})

function handleSearch() {
  emit('search')
}

function handleClear() {
  emit('clear')
}
</script>

<style scoped>
.filter-section {
  padding: 12px 16px 0;
  background: #f7f8fc;
}

.search-action {
  color: #1a68ff;
  font-size: 14px;
}

.filter-chips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 4px;
}

.chip-group {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chip-group-label {
  font-size: 12px;
  color: #6c7487;
  flex: 0 0 auto;
}

.chip {
  flex: 0 0 auto;
  padding: 6px 14px;
  border-radius: 999px;
  background: #fff;
  color: #4d5460;
  border: 1px solid transparent;
  font-size: 13px;
}

.chip--active {
  background: rgba(26, 104, 255, 0.1);
  color: #1a68ff;
  border-color: rgba(26, 104, 255, 0.3);
}
</style>
