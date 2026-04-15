<template>
  <div class="merchants-page">
    <NavBar
      title="个人中心"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #right>
        <Icon name="plus" size="18" @click="showAddMerchant" />
      </template>
    </NavBar>
    
    <div class="personal-header">
      <div class="personal-info">
        <VanImage
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
        </div>
        <Button
          v-if="showOnboardButton"
          type="primary"
          size="small"
          round
          class="onboard-button"
          @click="showAddMerchant"
        >
          立即进件
        </Button>
      </div>

      <div class="personal-stats">
        <div class="stat-item">
          <div class="stat-value">{{ merchantTotal }}</div>
          <div class="stat-label">商户总数</div>
        </div>
        <div class="divider" />
        <div class="stat-item">
          <div class="stat-value">{{ pointsTotal }}</div>
          <div class="stat-label">积分总数</div>
        </div>
      </div>

      <div v-if="lastOpenedMerchant" class="last-merchant-card">
        <div class="card-header">
          <div class="card-title">上次查看的商户</div>
          <Tag :type="getStatusType(lastOpenedMerchant.status)" size="mini">
            {{ getStatusText(lastOpenedMerchant.status) }}
          </Tag>
        </div>
        <div class="card-merchant-name">{{ lastOpenedMerchant.name }}</div>
        <div class="card-meta">
          <span>联系人：{{ lastOpenedMerchant.contact_name || '未设置' }}</span>
          <span>今日交易：{{ formatAmount(lastOpenedMerchant.trade_stats?.today_amount || 0) }}</span>
        </div>
        <Button
          block
          type="primary"
          size="small"
          round
          @click="focusOnLastMerchant"
        >
          查看详情
        </Button>
      </div>
    </div>

    <div class="content">
      <!-- 搜索栏 -->
      <div class="search-filter">
        <Search
          v-model="searchValue"
          placeholder="搜索商户名称/联系人/手机号"
          show-action
          @search="onSearch"
          @cancel="onCancelSearch"
        />
        <div class="filter-row">
          <div class="filter-item">
            <DropdownMenu>
              <DropdownItem v-model="filter.status" :options="statusOptions" @change="onFilterChange" />
            </DropdownMenu>
          </div>
          <div class="filter-item">
            <DropdownMenu>
              <DropdownItem v-model="filter.sortBy" :options="sortOptions" @change="onFilterChange" />
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <!-- 商户列表 -->
      <div class="merchant-list" v-if="!loading && merchantList.length > 0">
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loadingMore"
            :finished="finished"
            finished-text="没有更多商户了"
            @load="onLoadMore"
          >
            <div
              class="merchant-card"
              v-for="(merchant, index) in merchantList"
              :key="makeMerchantKey(merchant, index)"
              :data-merchant-key="makeMerchantKey(merchant, index)"
            >
              <div class="merchant-header" @click="toggleMerchantDetail(merchant)">
                <div class="merchant-avatar">
                  <VanImage
                    width="50"
                    height="50"
                    fit="cover"
                    :src="merchant.logo || undefined"
                    :error-icon="'shop-o'"
                    :show-error="true"
                    radius="4px"
                  />
                </div>
                <div class="merchant-info">
                  <div class="merchant-name-row">
                    <span class="merchant-name">{{ merchant.name }}</span>
                    <Tag :type="getStatusType(merchant.status)" size="small">{{ getStatusText(merchant.status) }}</Tag>
                  </div>
                  <div class="merchant-contact">
                    <span>联系人: {{ merchant.contact_name || '未设置' }}</span>
                    <span class="merchant-phone">{{ merchant.contact_phone || '' }}</span>
                  </div>
                  <div class="merchant-meta">
                    <span>注册时间: {{ formatDate(merchant.created_at) }}</span>
                  </div>
                </div>
                <div class="merchant-actions">
                  <Icon name="arrow-down" :class="{ 'rotate': isMerchantExpanded(merchant) }" />
                </div>
              </div>
              
              <!-- 展开的商户详情 -->
              <div class="merchant-details" v-show="isMerchantExpanded(merchant)">
                <!-- 基本信息 -->
                <Cell title="商户编号" :value="merchant.id || merchant.merchant_id || '未设置'" />
                <Cell title="商户地址" :value="merchant.address || '未设置'" />
                <Cell title="联系电话" :value="merchant.contact_phone || '未设置'" />
                <Cell title="电子邮箱" :value="merchant.email || '未设置'" />
                
                <!-- 交易数据 -->
                <div class="merchant-stats">
                  <div class="stats-title">交易数据</div>
                  <div class="stats-grid">
                    <div class="stats-item">
                      <div class="stats-value">{{ formatAmount(merchant.trade_stats?.today_amount || 0) }}</div>
                      <div class="stats-label">今日交易</div>
                    </div>
                    <div class="stats-item">
                      <div class="stats-value">{{ formatAmount(merchant.trade_stats?.month_amount || 0) }}</div>
                      <div class="stats-label">本月交易</div>
                    </div>
                    <div class="stats-item">
                      <div class="stats-value">{{ formatAmount(merchant.trade_stats?.total_amount || 0) }}</div>
                      <div class="stats-label">总交易额</div>
                    </div>
                  </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="action-buttons">
                  <Button size="small" type="primary" @click="editMerchant(merchant)">编辑</Button>
                  <Button 
                    size="small" 
                    :type="merchant.status === 'active' ? 'warning' : 'success'" 
                    @click="changeMerchantStatus(merchant)"
                  >
                    {{ merchant.status === 'active' ? '暂停' : '启用' }}
                  </Button>
                  <Button size="small" @click="viewTrades(merchant)">交易记录</Button>
                  <Button size="small" @click="viewSettlements(merchant)">结算记录</Button>
                </div>
              </div>
            </div>
          </List>
        </PullRefresh>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <Loading size="24px">加载中...</Loading>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && merchantList.length === 0">
        <Empty description="暂无商户数据">
          <template #image>
            <Icon name="shop-o" size="80" color="#dcdee0" />
          </template>
          <Button round type="primary" size="small" @click="onRefresh">刷新</Button>
        </Empty>
      </div>
      
      <!-- 新增商户浮动按钮 -->
      <div class="fab-button">
        <FloatingBubble 
          axis="xy"
          magnetic="y"
          @click="showAddMerchant"
        >
          <Icon name="plus" size="20" color="#fff" />
        </FloatingBubble>
      </div>
      
      <!-- 添加/编辑商户弹窗 -->
      <Popup
        v-model:show="showMerchantForm"
        position="bottom"
        :style="{ height: '85%' }"
        round
        closeable
      >
        <div class="form-popup">
          <div class="form-title">{{ isEditing ? '编辑商户' : '添加商户' }}</div>
          <Form @submit="onFormSubmit">
            <Field
              v-model="merchantForm.name"
              name="name"
              label="商户名称"
              placeholder="请输入商户名称"
              :rules="[{ required: true, message: '请输入商户名称' }]"
            />
            <Field
              v-model="merchantForm.contact_name"
              name="contact_name"
              label="联系人"
              placeholder="请输入联系人姓名"
              :rules="[{ required: true, message: '请输入联系人姓名' }]"
            />
            <Field
              v-model="merchantForm.contact_phone"
              name="contact_phone"
              label="联系电话"
              placeholder="请输入联系电话"
              :rules="[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
              ]"
            />
            <Field
              v-model="merchantForm.email"
              name="email"
              label="电子邮箱"
              placeholder="请输入电子邮箱"
              :rules="[
                { pattern: /^[\w.-]+@[\w.-]+\.\w+$/, message: '邮箱格式不正确' }
              ]"
            />
            <Field
              v-model="merchantForm.address"
              name="address"
              label="商户地址"
              placeholder="请输入商户地址"
            />
            <Field
              v-model="merchantForm.bank_account_name"
              name="bank_account_name"
              label="开户名"
              placeholder="请输入开户名"
            />
            <Field
              v-model="merchantForm.bank_account_no"
              name="bank_account_no"
              label="银行账号"
              placeholder="请输入银行账号"
            />
            <Field
              v-model="merchantForm.bank_name"
              name="bank_name"
              label="银行名称"
              placeholder="请输入银行名称"
            />
            <div class="form-submit">
              <Button round block type="primary" native-type="submit" :loading="submitting">
                {{ submitting ? '提交中...' : '提交' }}
              </Button>
            </div>
          </Form>
        </div>
      </Popup>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { 
  NavBar, 
  Search, 
  List, 
  Loading, 
  Empty, 
  Tag, 
  Cell, 
  Button,
  Icon,
  Form,
  Field,
  DropdownMenu, 
  DropdownItem,
  PullRefresh,
  Image as VanImage,
  FloatingBubble,
  Popup,
  showToast,
  showLoadingToast,
  showSuccessToast,
  closeToast,
  showConfirmDialog
} from 'vant'
import { useUserStore } from '@/stores/user'
import { useMerchantStore } from '@/stores/merchant'

const router = useRouter()
const userStore = useUserStore()
const merchantStore = useMerchantStore()
const { currentMerchant } = storeToRefs(merchantStore)

const defaultAvatar = '/app/images/profile/default-avatar.png'

const displayName = computed(() => {
  return userStore.userName || userStore.userInfo?.wechat_nickname || userStore.userInfo?.nickname || '未登录'
})

const displayAvatar = computed(() => {
  const avatar = userStore.userAvatar || userStore.userInfo?.wechat_avatar || userStore.userInfo?.avatar
  return avatar || defaultAvatar
})

const pointsData = computed(() => merchantStore.getPointsData || { total: 0, earned: 0, spent: 0 })
const pointsTotal = computed(() => pointsData.value?.total ?? 0)

const searchValue = ref('')
const loading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const merchantList = ref([])
const lastOpenedMerchant = ref(null)
const expandedMerchants = reactive({})
const currentPage = ref(1)
const pageSize = 10
const showMerchantForm = ref(false)
const isEditing = ref(false)
const submitting = ref(false)

const merchantTotal = computed(() => merchantList.value.length)
const hasStoredMerchantId = computed(() => Boolean(normalizeMerchantId(currentMerchant.value)))
const showOnboardButton = computed(() => merchantTotal.value === 0 || (hasStoredMerchantId.value && !lastOpenedMerchant.value))

// 筛选器
const filter = reactive({
  status: 'all',
  sortBy: 'newest'
})

// 状态选项
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '正常', value: 'active' },
  { text: '待审核', value: 'pending' },
  { text: '已暂停', value: 'suspended' },
  { text: '已终止', value: 'terminated' }
]

// 排序选项
const sortOptions = [
  { text: '最新注册', value: 'newest' },
  { text: '最早注册', value: 'oldest' },
  { text: '交易额高到低', value: 'amount_high' },
  { text: '交易额低到高', value: 'amount_low' }
]

// 商户表单
const merchantForm = reactive({
  id: null,
  name: '',
  contact_name: '',
  contact_phone: '',
  email: '',
  address: '',
  bank_account_name: '',
  bank_account_no: '',
  bank_name: ''
})

const normalizeMerchantId = (merchant) => {
  if (!merchant || typeof merchant !== 'object') {
    return null
  }
  const idCandidate = merchant.id ?? merchant.merchant_id ?? merchant.merchantId ?? merchant.merchantID
  if (idCandidate !== undefined && idCandidate !== null && idCandidate !== '') {
    return String(idCandidate)
  }
  if (merchant.__localKey) {
    return String(merchant.__localKey)
  }
  return null
}

const makeMerchantKey = (merchant, index = 0) => {
  const key = normalizeMerchantId(merchant)
  if (key) {
    return key
  }
  const fallbackKey = `merchant-${index}`
  if (merchant && typeof merchant === 'object') {
    merchant.__localKey = fallbackKey
  }
  return fallbackKey
}

const isMerchantExpanded = (merchant) => {
  const key = normalizeMerchantId(merchant)
  if (!key) {
    return false
  }
  return !!expandedMerchants[key]
}

const collapseAllMerchants = () => {
  Object.keys(expandedMerchants).forEach(key => {
    expandedMerchants[key] = false
  })
}

const expandMerchantCard = (merchant) => {
  const key = normalizeMerchantId(merchant)
  if (!key) {
    return
  }
  collapseAllMerchants()
  nextTick(() => {
    expandedMerchants[key] = true
  })
}

const focusOnLastMerchant = () => {
  if (!lastOpenedMerchant.value) {
    return
  }
  expandMerchantCard(lastOpenedMerchant.value)
  nextTick(() => {
    const key = normalizeMerchantId(lastOpenedMerchant.value)
    if (!key) return
    const card = document.querySelector(`[data-merchant-key="${key}"]`)
    if (card && typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const applyMerchantPreferences = (sourceMerchants = []) => {
  const list = Array.isArray(sourceMerchants) ? [...sourceMerchants] : []

  if (!list.length) {
    lastOpenedMerchant.value = null
    collapseAllMerchants()
    merchantStore.setCurrentMerchant(null)
    return list
  }

  const currentId = normalizeMerchantId(currentMerchant.value)
  let matchedMerchant = null

  if (currentId) {
    const index = list.findIndex(item => normalizeMerchantId(item) === currentId)
    if (index >= 0) {
      matchedMerchant = list[index]
      list.splice(index, 1)
      list.unshift(matchedMerchant)
    }
  }

  if (!matchedMerchant) {
    matchedMerchant = list[0]
    const matchedId = normalizeMerchantId(matchedMerchant)
    if (!currentId || matchedId !== currentId) {
      merchantStore.setCurrentMerchant(matchedMerchant)
    }
  }

  lastOpenedMerchant.value = matchedMerchant || null

  if (matchedMerchant) {
    expandMerchantCard(matchedMerchant)
  } else {
    collapseAllMerchants()
  }

  return list
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 加载商户数据
const loadMerchantData = async (reset = false) => {
  if (reset) {
    merchantList.value = []
    currentPage.value = 1
    finished.value = false
  }

  loading.value = !loadingMore.value

  let loadingToast = null
  if (!loadingMore.value) {
    loadingToast = showLoadingToast({
      message: '加载中...',
      duration: 0,
      forbidClick: true
    })
  }

  try {
    let fetchedMerchants = []

    if (reset) {
      try {
        const workspaceData = await merchantStore.fetchWorkspaceData()
        if (workspaceData && Array.isArray(workspaceData.merchants)) {
          fetchedMerchants = workspaceData.merchants
        } else {
          const availableFromStore = merchantStore.getAvailableMerchants
          if (Array.isArray(availableFromStore) && availableFromStore.length > 0) {
            fetchedMerchants = availableFromStore
          }
        }
      } catch (error) {
        // 生产环境关闭日志
      }
    }

    if (!fetchedMerchants.length) {
      fetchedMerchants = generateMockMerchants(pageSize)
    }

    if (reset) {
      const processed = applyMerchantPreferences(fetchedMerchants)
      merchantList.value = processed
      merchantStore.setAvailableMerchants(processed)
    } else {
      merchantList.value = [...merchantList.value, ...fetchedMerchants]
      merchantStore.setAvailableMerchants(merchantList.value)
    }

    if (currentPage.value >= 3 || fetchedMerchants.length < pageSize) {
      finished.value = true
    } else {
      currentPage.value++
    }
  } catch (error) {
    showToast('加载失败，请重试')
  } finally {
    if (loadingToast) {
      try {
        loadingToast.close()
      } catch (e) {
        closeToast()
      }
    }
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

// 搜索商户
const onSearch = () => {
  if (!searchValue.value.trim()) {
    showToast('请输入搜索内容')
    return
  }
  
  showToast(`搜索: ${searchValue.value}`)
  loadMerchantData(true)
}

// 取消搜索
const onCancelSearch = () => {
  searchValue.value = ''
  loadMerchantData(true)
}

// 刷新
const onRefresh = () => {
  refreshing.value = true
  loadMerchantData(true)
}

// 加载更多
const onLoadMore = () => {
  if (finished.value) return
  
  loadingMore.value = true
  loadMerchantData()
}

// 筛选改变
const onFilterChange = () => {
  loadMerchantData(true)
}

// 切换商户详情
const toggleMerchantDetail = (merchant) => {
  const key = normalizeMerchantId(merchant)
  if (!key) {
    return
  }
  const nextState = !expandedMerchants[key]
  collapseAllMerchants()
  expandedMerchants[key] = nextState
  if (nextState) {
    lastOpenedMerchant.value = merchant
    merchantStore.setCurrentMerchant(merchant)
  }
}

watch(currentMerchant, (newVal, oldVal) => {
  if (!merchantList.value.length) {
    return
  }

  const newId = normalizeMerchantId(newVal)
  if (!newId) {
    return
  }

  const firstId = normalizeMerchantId(merchantList.value[0])
  if (newId !== firstId) {
    merchantList.value = applyMerchantPreferences(merchantList.value)
    merchantStore.setAvailableMerchants(merchantList.value)
  } else {
    lastOpenedMerchant.value = merchantList.value[0]
    expandMerchantCard(merchantList.value[0])
  }
})

watch(merchantList, (list) => {
  if (!Array.isArray(list) || !list.length) {
    lastOpenedMerchant.value = null
    collapseAllMerchants()
    merchantStore.setAvailableMerchants([])
  }
})

// 编辑商户
const editMerchant = (merchant) => {
  isEditing.value = true
  
  // 填充表单数据
  Object.keys(merchantForm).forEach(key => {
    if (merchant[key] !== undefined) {
      merchantForm[key] = merchant[key]
    }
  })
  
  showMerchantForm.value = true
}

// 显示添加商户表单
const showAddMerchant = () => {
  isEditing.value = false
  
  // 重置表单
  Object.keys(merchantForm).forEach(key => {
    merchantForm[key] = ''
  })
  merchantForm.id = null
  
  showMerchantForm.value = true
}

// 表单提交
const onFormSubmit = () => {
  // 表单验证
  if (!merchantForm.name || !merchantForm.contact_name || !merchantForm.contact_phone) {
    showToast('请填写必填字段')
    return
  }
  
  submitting.value = true
  
  // 显示loading
  const toast = showLoadingToast({
    message: '提交中...',
    forbidClick: true,
    duration: 0
  });

  // 模拟API调用
  setTimeout(() => {
    try {
      if (isEditing.value) {
        const targetKey = normalizeMerchantId(merchantForm)
        const index = merchantList.value.findIndex(m => normalizeMerchantId(m) === targetKey)
        if (index !== -1) {
          merchantList.value[index] = {
            ...merchantList.value[index],
            ...merchantForm
          }
          merchantStore.setCurrentMerchant(merchantList.value[index])
          merchantList.value = applyMerchantPreferences(merchantList.value)
        }
      } else {
        const newMerchant = {
          id: Date.now(),
          ...merchantForm,
          status: 'pending',
          created_at: new Date().toISOString(),
          logo: '/app/images/default-merchant.svg',
          trade_stats: {
            today_amount: 0,
            month_amount: 0,
            total_amount: 0
          }
        }
        
        merchantStore.setCurrentMerchant(newMerchant)
        merchantList.value = applyMerchantPreferences([newMerchant, ...merchantList.value])
      }
      
      merchantStore.setAvailableMerchants(merchantList.value)
      
      // 安全关闭toast
      toast.close();
      
      submitting.value = false
      showMerchantForm.value = false
      showSuccessToast('操作成功');
    } catch (e) {
      // 兜底方案
      closeToast();
    }
  }, 1000);
}

// 修改商户状态
const changeMerchantStatus = (merchant) => {
  const currentStatus = merchant.status
  let newStatus, actionText
  
  if (currentStatus === 'active') {
    newStatus = 'suspended'
    actionText = '暂停'
  } else if (currentStatus === 'suspended' || currentStatus === 'pending') {
    newStatus = 'active'
    actionText = '启用'
  } else {
    showToast('当前状态无法操作')
    return
  }
  
  showConfirmDialog({
    title: `${actionText}商户`,
    message: `确定要${actionText}商户 "${merchant.name}" 吗？`,
  }).then(() => {
    // 用户点击确定按钮
    // 模拟API调用
    setTimeout(() => {
      // 更新本地状态
      const key = normalizeMerchantId(merchant)
      const index = merchantList.value.findIndex(m => normalizeMerchantId(m) === key)
      if (index !== -1) {
        merchantList.value[index].status = newStatus
      }
      
      showSuccessToast(`商户已${actionText}`)
    }, 500)
  }).catch(() => {
    // 用户点击取消按钮
  })
}

// 查看交易记录
const viewTrades = (merchant) => {
  const key = normalizeMerchantId(merchant)
  router.push(`/admin/merchants/trades/mobile?merchantId=${key || ''}`)
}

// 查看结算记录
const viewSettlements = (merchant) => {
  const key = normalizeMerchantId(merchant)
  router.push(`/admin/merchants/settlements/mobile?merchantId=${key || ''}`)
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'pending': return 'primary'
    case 'suspended': return 'warning'
    case 'terminated': return 'danger'
    default: return 'default'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'active': return '正常'
    case 'pending': return '待审核'
    case 'suspended': return '已暂停'
    case 'terminated': return '已终止'
    default: return '未知'
  }
}

// 格式化金额
const formatAmount = (amount) => {
  return '¥' + (amount ? amount.toFixed(2) : '0.00')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 生成模拟商户数据
const generateMockMerchants = (count) => {
  const merchants = []
  const statuses = ['active', 'pending', 'suspended', 'terminated']
  
  for (let i = 0; i < count; i++) {
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
    const randomStatus = statuses[Math.floor(Math.random() * 4)]
    const todayAmount = Math.floor(Math.random() * 10000)
    const monthAmount = todayAmount + Math.floor(Math.random() * 50000)
    const totalAmount = monthAmount + Math.floor(Math.random() * 500000)
    
    merchants.push({
      id: 10000 + i,
      name: `测试商户${i + 1}`,
      contact_name: `联系人${i + 1}`,
      contact_phone: `1${Math.floor(Math.random() * 9) + 3}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
      email: `merchant${i + 1}@example.com`,
      address: `广东省深圳市南山区科技园${i + 1}号`,
      bank_account_name: `测试商户${i + 1}`,
      bank_account_no: `62220000${Math.floor(Math.random() * 10000000000)}`,
      bank_name: '中国银行',
      status: randomStatus,
      created_at: randomDate.toISOString(),
      logo: '/app/images/default-merchant.svg',
      trade_stats: {
        today_amount: todayAmount,
        month_amount: monthAmount,
        total_amount: totalAmount
      }
    })
  }
  
  return merchants
}

// 初始化
onMounted(async () => {
  merchantStore.initMerchantData()

  if (userStore.isLoggedIn && (!userStore.userInfo || Object.keys(userStore.userInfo).length === 0)) {
    try {
      await userStore.fetchUserInfo({ forceRefresh: true })
    } catch (error) {
      // 生产环境关闭日志
    }
  }

  await loadMerchantData(true)
})
</script>

<style scoped>
.merchants-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.personal-header {
  padding: 56px 16px 24px;
  margin-bottom: 16px;
  background: linear-gradient(180deg, #2b6de5 0%, #4c8dff 100%);
  color: #ffffff;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 12px 24px rgba(43, 109, 229, 0.18);
}

.personal-info {
  display: flex;
  align-items: center;
}

.personal-avatar {
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
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
  margin-top: 4px;
}

.onboard-button {
  margin-left: auto;
}

.personal-stats {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(6px);
}

.personal-stats .stat-item {
  flex: 1;
  text-align: center;
}

.personal-stats .stat-value {
  font-size: 22px;
  font-weight: 600;
}

.personal-stats .stat-label {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.85;
}

.personal-stats .divider {
  width: 1px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.25);
  margin: 0 12px;
}

.last-merchant-card {
  margin-top: 20px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 16px;
  color: #323233;
  box-shadow: 0 8px 24px rgba(19, 60, 158, 0.15);
}

.last-merchant-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.last-merchant-card .card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.last-merchant-card .card-merchant-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.last-merchant-card .card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #646566;
  margin-bottom: 12px;
}

.content {
  padding: 16px;
  padding-bottom: 80px;
}

.search-filter {
  margin-bottom: 16px;
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #f7f8fa;
}

.filter-row {
  display: flex;
  margin-top: 8px;
}

.filter-item {
  flex: 1;
}

.merchant-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.merchant-header {
  padding: 16px;
  display: flex;
  align-items: center;
}

.merchant-avatar {
  margin-right: 12px;
}

.merchant-info {
  flex: 1;
}

.merchant-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.merchant-name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
}

.merchant-contact {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.merchant-phone {
  margin-left: 8px;
}

.merchant-meta {
  font-size: 12px;
  color: #969799;
}

.merchant-actions {
  padding: 8px;
}

.merchant-actions .van-icon {
  font-size: 20px;
  color: #969799;
  transition: transform 0.3s;
}

.rotate {
  transform: rotate(180deg);
}

.merchant-details {
  border-top: 1px solid #f2f3f5;
  padding: 12px 16px;
  background-color: #fafafa;
}

.merchant-stats {
  margin: 12px 0;
}

.stats-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #323233;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-value {
  font-size: 16px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #969799;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.fab-button {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 9999;
}

.van-floating-bubble {
  width: 56px;
  height: 56px;
  background-color: #1989fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

.form-popup {
  padding: 20px 16px;
}

.form-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #323233;
}

.form-submit {
  margin-top: 24px;
  padding: 0 16px;
}
</style> 
