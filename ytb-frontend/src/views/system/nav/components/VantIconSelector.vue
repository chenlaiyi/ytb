<template>
  <div class="vant-icon-selector">
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索图标"
        clearable
        prefix-icon="Search"
      >
        <template #append>
          <el-button :icon="Search" @click="searchIcons"></el-button>
        </template>
      </el-input>
    </div>
    
    <div class="icon-grid">
      <div 
        v-for="(icon, index) in filteredIcons" 
        :key="index" 
        class="icon-item" 
        :class="{'icon-selected': modelValue === icon}"
        @click="selectIcon(icon)"
      >
        <div class="icon-preview">
          <i :class="['van-icon', `van-icon-${icon}`]" 
             :style="{color: modelValue === icon ? '#1989fa' : '#666', fontSize: '24px'}"></i>
        </div>
        <div class="icon-name">{{ icon }}</div>
      </div>
    </div>
    
    <div v-if="filteredIcons.length === 0" class="no-results">
      <el-empty description="没有找到匹配的图标" :image-size="100"></el-empty>
    </div>
    
    <div class="pagination" v-if="totalPages > 1">
      <el-pagination
        layout="prev, pager, next"
        :total="totalItems"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        small
      ></el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  icons: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(30)

// 根据搜索条件过滤图标
const filteredIconsList = computed(() => {
  if (!searchText.value) return props.icons
  
  return props.icons.filter(icon => 
    icon.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 计算总页数
const totalItems = computed(() => filteredIconsList.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// 当前页的图标
const filteredIcons = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredIconsList.value.slice(start, end)
})

// 选择图标
const selectIcon = (icon) => {
  emit('update:modelValue', icon)
}

// 搜索图标
const searchIcons = () => {
  currentPage.value = 1
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
}

// 当搜索文本变化时，重置页码
watch(searchText, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.vant-icon-selector {
  width: 100%;
  padding: 10px;
}

.search-bar {
  margin-bottom: 15px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
}

.icon-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.icon-selected {
  background-color: #ecf5ff;
  border-color: #d9ecff;
}

.icon-preview {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.icon-name {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
  text-align: center;
}

.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.no-results {
  padding: 20px;
  text-align: center;
}
</style>
