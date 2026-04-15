<template>
  <div class="nav-test">
    <NavHeader title="导航配置测试" />
    
    <div class="content">
      <van-cell-group title="当前导航配置">
        <van-cell 
          v-for="(item, index) in navItems" 
          :key="index"
          :title="item.title"
          :label="`路径: ${item.path} | 图标: ${item.icon}`"
        >
          <template #icon>
            <van-icon :name="item.icon" size="20" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-cell-group title="API响应数据">
        <van-cell>
          <template #title>
            <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
          </template>
        </van-cell>
      </van-cell-group>
      
      <div class="actions">
        <van-button type="primary" @click="testAPI" block>重新测试API</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNavItems } from '@/api/home'
import NavHeader from '@/components/NavHeader.vue'

const navItems = ref([])
const apiResponse = ref(null)

const testAPI = async () => {
  try {
    console.log('开始测试导航API...')
    const response = await getNavItems()
    console.log('API响应:', response)
    
    apiResponse.value = response
    
    if (response.code === 0 && response.data && Array.isArray(response.data)) {
      const processedItems = response.data
        .filter(item => item.status == 1)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(item => ({
          icon: item.icon || 'home-o',
          title: item.nav_name || item.title || '未命名',
          path: item.path || '/',
          nav_id: item.nav_id,
          highlight: item.highlight,
          badge_type: item.badge_type
        }))
      
      navItems.value = processedItems
      console.log('处理后的导航项:', processedItems)
    }
  } catch (error) {
    console.error('API测试失败:', error)
    apiResponse.value = { error: error.message }
  }
}

onMounted(() => {
  testAPI()
})
</script>

<style scoped>
.nav-test {
  padding-top: 46px;
}

.content {
  padding: 16px;
}

.actions {
  margin-top: 20px;
}

pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style> 