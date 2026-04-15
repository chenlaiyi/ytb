<template>
  <section class="partner-filter">
    <van-search
      v-model="keyword"
      shape="round"
      placeholder="搜索伙伴姓名 / 手机 / 机构号"
      show-action
      :clearable="true"
      @search="handleSearch"
      @cancel="handleCancel"
      @clear="handleClear"
    >
      <template #action>
        <span class="search-action" @click="handleSearch">搜索</span>
      </template>
    </van-search>

    <div v-if="levelOptions.length > 1" class="level-filter">
      <button
        v-for="option in levelOptions"
        :key="option.value"
        type="button"
        class="level-chip"
        :class="{ 'level-chip--active': state.level === option.value }"
        @click="handleLevel(option.value)"
      >
        <span>{{ option.label }}</span>
        <small v-if="option.count !== undefined">{{ option.count }}</small>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  scope: {
    type: String,
    required: true
  },
  state: {
    type: Object,
    required: true
  },
  searchKeyword: {
    type: String,
    default: ''
  },
  levelOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:searchKeyword', 'search', 'change-level'])

const keyword = ref('')

watch(
  () => props.searchKeyword,
  value => {
    keyword.value = value ?? ''
  },
  { immediate: true }
)

const normalizedKeyword = computed(() => keyword.value.trim())
const levelOptions = computed(() => props.levelOptions ?? [])

function handleSearch() {
  emit('update:searchKeyword', normalizedKeyword.value)
  emit('search', props.scope)
}

function handleClear() {
  keyword.value = ''
  handleSearch()
}

function handleCancel() {
  keyword.value = ''
  handleSearch()
}

function handleLevel(value) {
  emit('change-level', props.scope, value)
}
</script>

<style scoped>
.partner-filter {
  padding: 12px 16px 0;
}

.search-action {
  color: #1a68ff;
  font-size: 14px;
}

.level-filter {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.level-chip {
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  background: #f0f2f8;
  color: #4b5563;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.level-chip small {
  font-size: 11px;
  color: #6b7280;
}

.level-chip--active {
  background: linear-gradient(135deg, #1a68ff, #5c8dff);
  color: #fff;
}

.level-chip--active small {
  color: rgba(255, 255, 255, 0.82);
}
</style>
