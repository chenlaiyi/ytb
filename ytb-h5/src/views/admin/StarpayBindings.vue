<template>
  <div class="starpay-bindings-page">
    <van-nav-bar
      title="星驿付服务商绑定"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />
    
    <div class="content">
      <!-- 搜索和筛选 -->
      <div class="search-filter">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索机构名称/编号/手机号"
          show-action
          @search="handleSearch"
          @clear="handleSearch"
        >
          <template #action>
            <van-button type="primary" size="small" round @click="handleSearch">
              搜索
            </van-button>
          </template>
        </van-search>
        
        <div class="filter-bar">
          <van-dropdown-menu>
            <van-dropdown-item v-model="bindStatus" :options="bindStatusOptions" @change="handleSearch" />
          </van-dropdown-menu>
          <van-button type="success" size="small" round icon="replay" @click="handleRefresh">
            刷新
          </van-button>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">总机构</span>
          <span class="stat-value">{{ pagination.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已绑定</span>
          <span class="stat-value text-success">{{ boundCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未绑定</span>
          <span class="stat-value text-warning">{{ unboundCount }}</span>
        </div>
      </div>
      
      <!-- 列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadMore"
        >
          <div class="institution-list">
            <div 
              v-for="item in list" 
              :key="item.id" 
              class="institution-card"
            >
              <div class="card-header">
                <van-image
                  round
                  width="48"
                  height="48"
                  :src="item.avatar || '/app/images/profile/default-avatar.png'"
                  fit="cover"
                />
                <div class="card-info">
                  <div class="card-title">
                    <span class="name">{{ item.institution_name || item.name || '未设置名称' }}</span>
                    <van-tag v-if="item.is_bound" type="success" size="small">已绑定</van-tag>
                    <van-tag v-else type="warning" size="small">未绑定</van-tag>
                  </div>
                  <div class="card-meta">
                    <span>{{ item.phone || '—' }}</span>
                    <span v-if="item.institution_number">编号: {{ item.institution_number }}</span>
                  </div>
                  <div class="card-meta" v-if="item.institution_lv">
                    <span>等级: {{ item.institution_lv }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-body" v-if="item.is_bound">
                <van-cell-group inset>
                  <van-cell title="服务商编号" :value="item.starpay_partner_no" />
                  <van-cell title="服务商名称" :value="item.starpay_partner_name || '—'" />
                  <van-cell title="绑定时间" :value="item.starpay_bound_at || '—'" />
                </van-cell-group>
              </div>
              
              <div class="card-actions">
                <van-button 
                  v-if="!item.is_bound"
                  type="primary" 
                  size="small" 
                  round
                  @click="openBindDialog(item)"
                >
                  绑定服务商
                </van-button>
                <template v-else>
                  <van-button 
                    type="default" 
                    size="small" 
                    round
                    @click="openBindDialog(item)"
                  >
                    修改绑定
                  </van-button>
                  <van-button 
                    type="danger" 
                    size="small" 
                    round
                    plain
                    @click="handleUnbind(item)"
                  >
                    解除绑定
                  </van-button>
                </template>
              </div>
            </div>
          </div>
          
          <van-empty v-if="!loading && list.length === 0" description="暂无数据" />
        </van-list>
      </van-pull-refresh>
    </div>
    
    <!-- 绑定弹窗 -->
    <van-dialog
      v-model:show="showBindDialog"
      :title="bindDialogTitle"
      show-cancel-button
      :before-close="handleBindConfirm"
    >
      <div class="bind-dialog-content">
        <van-cell-group inset>
          <van-cell title="机构名称" :value="currentItem?.institution_name || currentItem?.name || '—'" />
          <van-cell title="机构编号" :value="currentItem?.institution_number || '—'" />
        </van-cell-group>
        
        <div class="partner-select">
          <van-field
            v-model="partnerKeyword"
            label="搜索服务商"
            placeholder="输入编号或名称搜索"
            clearable
            @update:model-value="searchPartners"
          />
          
          <div class="partner-list" v-if="partnerList.length > 0">
            <div 
              v-for="partner in partnerList" 
              :key="partner.agent_no"
              class="partner-item"
              :class="{ active: selectedPartner?.agent_no === partner.agent_no }"
              @click="selectPartner(partner)"
            >
              <div class="partner-name">{{ partner.agent_name }}</div>
              <div class="partner-no">{{ partner.agent_no }}</div>
              <van-icon v-if="selectedPartner?.agent_no === partner.agent_no" name="success" color="#07c160" />
            </div>
          </div>
          <van-empty v-else-if="partnerKeyword && !partnerLoading" description="未找到匹配的服务商" image="search" />
          <van-loading v-if="partnerLoading" size="24px" vertical>搜索中...</van-loading>
        </div>
        
        <div class="selected-partner" v-if="selectedPartner">
          <van-cell-group inset>
            <van-cell title="已选择服务商" :value="selectedPartner.agent_name" />
            <van-cell title="服务商编号" :value="selectedPartner.agent_no" />
          </van-cell-group>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { 
  getStarpayBindingList, 
  getStarpayPartners, 
  bindStarpayPartner, 
  unbindStarpayPartner 
} from '@/api/starpay'

const router = useRouter()

// 搜索和筛选
const searchKeyword = ref('')
const bindStatus = ref('')
const bindStatusOptions = [
  { text: '全部状态', value: '' },
  { text: '已绑定', value: 'bound' },
  { text: '未绑定', value: 'unbound' }
]

// 列表状态
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const pagination = ref({
  page: 1,
  perPage: 15,
  total: 0
})

// 统计
const boundCount = ref(0)
const unboundCount = ref(0)

// 绑定弹窗
const showBindDialog = ref(false)
const currentItem = ref(null)
const partnerKeyword = ref('')
const partnerList = ref([])
const partnerLoading = ref(false)
const selectedPartner = ref(null)
let searchTimer = null

const bindDialogTitle = computed(() => {
  return currentItem.value?.is_bound ? '修改服务商绑定' : '绑定星驿付服务商'
})

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 加载列表
const loadList = async (reset = false) => {
  if (reset) {
    pagination.value.page = 1
    list.value = []
    finished.value = false
  }
  
  loading.value = true
  
  try {
    const res = await getStarpayBindingList({
      keyword: searchKeyword.value,
      bind_status: bindStatus.value,
      page: pagination.value.page,
      per_page: pagination.value.perPage
    })
    
    if (res.code === 0) {
      const data = res.data
      if (reset) {
        list.value = data.data || []
      } else {
        list.value = [...list.value, ...(data.data || [])]
      }
      pagination.value.total = data.total || 0
      pagination.value.page++
      
      // 计算统计
      if (reset) {
        boundCount.value = list.value.filter(item => item.is_bound).length
        unboundCount.value = list.value.filter(item => !item.is_bound).length
      }
      
      if (list.value.length >= (data.total || 0)) {
        finished.value = true
      }
    } else {
      showToast(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!finished.value && !loading.value) {
    loadList()
  }
}

// 刷新
const handleRefresh = () => {
  refreshing.value = true
  loadList(true)
}

// 搜索
const handleSearch = () => {
  loadList(true)
}

// 打开绑定弹窗
const openBindDialog = (item) => {
  currentItem.value = item
  partnerKeyword.value = ''
  partnerList.value = []
  selectedPartner.value = item.is_bound ? {
    agent_no: item.starpay_partner_no,
    agent_name: item.starpay_partner_name
  } : null
  showBindDialog.value = true
}

// 搜索服务商
const searchPartners = (keyword) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  if (!keyword || keyword.length < 1) {
    partnerList.value = []
    return
  }
  
  searchTimer = setTimeout(async () => {
    partnerLoading.value = true
    try {
      const res = await getStarpayPartners({ keyword })
      if (res.code === 0) {
        partnerList.value = res.data || []
      }
    } catch (error) {
      console.error('搜索服务商失败:', error)
    } finally {
      partnerLoading.value = false
    }
  }, 300)
}

// 选择服务商
const selectPartner = (partner) => {
  selectedPartner.value = partner
}

// 确认绑定
const handleBindConfirm = async (action) => {
  if (action === 'confirm') {
    if (!selectedPartner.value) {
      showToast('请选择服务商')
      return false
    }
    
    const toast = showLoadingToast({
      message: '绑定中...',
      forbidClick: true,
      duration: 0
    })
    
    try {
      const res = await bindStarpayPartner(currentItem.value.id, {
        partner_no: selectedPartner.value.agent_no,
        partner_name: selectedPartner.value.agent_name
      })
      
      closeToast()
      
      if (res.code === 0) {
        showToast('绑定成功')
        // 更新列表中的数据
        const index = list.value.findIndex(item => item.id === currentItem.value.id)
        if (index !== -1) {
          list.value[index] = {
            ...list.value[index],
            is_bound: true,
            starpay_partner_no: selectedPartner.value.agent_no,
            starpay_partner_name: selectedPartner.value.agent_name,
            starpay_bound_at: new Date().toLocaleString()
          }
        }
        return true
      } else {
        showToast(res.message || '绑定失败')
        return false
      }
    } catch (error) {
      closeToast()
      console.error('绑定失败:', error)
      showToast('绑定失败')
      return false
    }
  }
  return true
}

// 解除绑定
const handleUnbind = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认解除绑定',
      message: `确定解除「${item.institution_name || item.name}」的星驿付服务商绑定吗？`
    })
    
    const toast = showLoadingToast({
      message: '解绑中...',
      forbidClick: true,
      duration: 0
    })
    
    const res = await unbindStarpayPartner(item.id)
    
    closeToast()
    
    if (res.code === 0) {
      showToast('解绑成功')
      // 更新列表中的数据
      const index = list.value.findIndex(i => i.id === item.id)
      if (index !== -1) {
        list.value[index] = {
          ...list.value[index],
          is_bound: false,
          starpay_partner_no: null,
          starpay_partner_name: null,
          starpay_bound_at: null
        }
      }
    } else {
      showToast(res.message || '解绑失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑失败:', error)
      showToast('解绑失败')
    }
  }
}

onMounted(() => {
  loadList(true)
})
</script>

<style scoped>
.starpay-bindings-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content {
  padding: 12px;
}

.search-filter {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}

.filter-bar .van-dropdown-menu {
  flex: 1;
}

.stats-bar {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  gap: 12px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.stat-value.text-success {
  color: #07c160;
}

.stat-value.text-warning {
  color: #ff976a;
}

.institution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.institution-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-title .name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #969799;
}

.card-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.card-body :deep(.van-cell-group--inset) {
  margin: 0;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

/* 绑定弹窗 */
.bind-dialog-content {
  padding: 16px;
}

.bind-dialog-content :deep(.van-cell-group--inset) {
  margin: 0 0 16px 0;
}

.partner-select {
  margin-top: 12px;
}

.partner-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
}

.partner-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.partner-item:last-child {
  border-bottom: none;
}

.partner-item:hover,
.partner-item.active {
  background-color: #f0f9ff;
}

.partner-item.active {
  background-color: #e8f7ee;
}

.partner-name {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.partner-no {
  font-size: 12px;
  color: #969799;
  margin-right: 8px;
}

.selected-partner {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
}

.selected-partner :deep(.van-cell-group--inset) {
  margin: 0;
}
</style>
