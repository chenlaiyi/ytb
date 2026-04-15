<template>
  <div class="settlements-page">
    <NavBar
      title="商户结算记录"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    >
      <template #right>
        <Icon name="plus" size="18" @click="showAddSettlement" />
      </template>
    </NavBar>
    
    <div class="content">
      <!-- 搜索筛选 -->
      <div class="search-filter">
        <div class="merchant-filter" v-if="showMerchantFilter">
          <Field
            v-model="selectedMerchantName"
            is-link
            readonly
            name="merchant"
            label="商户筛选"
            placeholder="选择商户"
            @click="showMerchantPicker = true"
          />
        </div>
        
        <div class="filter-options">
          <DropdownMenu>
            <DropdownItem v-model="filter.status" :options="statusOptions" @change="onFilterChange" />
          </DropdownMenu>
        </div>
      </div>
      
      <!-- 结算列表 -->
      <div class="settlement-list" v-if="!loading && settlementList.length > 0">
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loadingMore"
            :finished="finished"
            finished-text="没有更多结算记录了"
            @load="onLoadMore"
          >
            <div class="settlement-card" v-for="(settlement, index) in settlementList" :key="settlement.id || index">
              <div class="settlement-header">
                <div class="settlement-merchant">{{ settlement.merchant_name }}</div>
                <Tag :type="getStatusType(settlement.status)">{{ getStatusText(settlement.status) }}</Tag>
              </div>
              
              <div class="settlement-info">
                <div class="settlement-no">结算单号: {{ settlement.settlement_no }}</div>
                <div class="settlement-amount">{{ formatAmount(settlement.amount) }}</div>
              </div>
              
              <div class="settlement-bank" v-if="settlement.bank_name">
                <div class="bank-info">
                  <Icon name="card" size="14" style="margin-right: 4px;" />
                  {{ settlement.bank_name }} {{ settlement.bank_account_no }}
                </div>
              </div>
              
              <div class="settlement-footer">
                <div class="settlement-remark">{{ settlement.remarks || '无备注' }}</div>
                <div class="settlement-time">{{ formatDate(settlement.created_at) }}</div>
              </div>
              
              <div class="settlement-actions" v-if="settlement.status === 'pending' || settlement.status === 'processing'">
                <Button 
                  size="small" 
                  :type="settlement.status === 'pending' ? 'primary' : 'success'" 
                  @click.stop="updateStatus(settlement)"
                >
                  {{ settlement.status === 'pending' ? '处理' : '完成' }}
                </Button>
                <Button size="small" type="default" @click.stop="showDetail(settlement)">详情</Button>
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
      <div class="empty-state" v-if="!loading && settlementList.length === 0">
        <Empty description="暂无结算记录">
          <template #image>
            <Icon name="balance-o" size="80" color="#dcdee0" />
          </template>
          <Button round type="primary" size="small" @click="onRefresh">刷新</Button>
        </Empty>
      </div>
      
      <!-- 商户选择弹窗 -->
      <Popup v-model:show="showMerchantPicker" position="bottom" round>
        <Picker
          title="选择商户"
          :columns="merchantColumns"
          @confirm="onMerchantConfirm"
          @cancel="showMerchantPicker = false"
        />
      </Popup>
      
      <!-- 结算详情弹窗 -->
      <Popup
        v-model:show="showSettlementDetailPopup"
        position="bottom"
        :style="{ height: '70%' }"
        round
        closeable
      >
        <div class="detail-popup" v-if="currentSettlement">
          <div class="detail-title">结算详情</div>
          
          <div class="detail-status">
            <Tag :type="getStatusType(currentSettlement.status)" size="large">
              {{ getStatusText(currentSettlement.status) }}
            </Tag>
          </div>
          
          <div class="detail-amount">{{ formatAmount(currentSettlement.amount) }}</div>
          
          <div class="detail-info">
            <Cell title="结算单号" :value="currentSettlement.settlement_no" />
            <Cell title="商户名称" :value="currentSettlement.merchant_name" />
            <Cell title="结算状态" :value="getStatusText(currentSettlement.status)" />
            <Cell title="银行名称" :value="currentSettlement.bank_name || '-'" />
            <Cell title="支行名称" :value="currentSettlement.bank_branch || '-'" />
            <Cell title="开户名" :value="currentSettlement.bank_account_name || '-'" />
            <Cell title="银行账号" :value="currentSettlement.bank_account_no || '-'" />
            <Cell title="结算时间" :value="currentSettlement.settlement_time || '-'" />
            <Cell title="备注" :value="currentSettlement.remarks || '-'" />
            <Cell title="创建时间" :value="formatDate(currentSettlement.created_at)" />
            <Cell title="更新时间" :value="formatDate(currentSettlement.updated_at)" />
          </div>
          
          <div class="detail-actions" v-if="currentSettlement.status === 'pending' || currentSettlement.status === 'processing'">
            <Button 
              block 
              round 
              :type="currentSettlement.status === 'pending' ? 'primary' : 'success'" 
              @click="updateStatus(currentSettlement, true)"
            >
              {{ currentSettlement.status === 'pending' ? '处理结算' : '完成结算' }}
            </Button>
          </div>
        </div>
      </Popup>
      
      <!-- 添加结算弹窗 -->
      <Popup
        v-model:show="showAddSettlementPopup"
        position="bottom"
        :style="{ height: '85%' }"
        round
        closeable
      >
        <div class="form-popup">
          <div class="form-title">创建结算</div>
          <Form @submit="onFormSubmit">
            <Field
              v-model="settlementForm.merchant_id"
              is-link
              readonly
              name="merchant_id"
              label="商户"
              placeholder="请选择商户"
              @click="showMerchantSelectPicker = true"
              :rules="[{ required: true, message: '请选择商户' }]"
            />
            <Field
              v-model="settlementForm.amount"
              name="amount"
              label="结算金额"
              placeholder="请输入结算金额"
              type="digit"
              :rules="[{ required: true, message: '请输入结算金额' }]"
            />
            <Field
              v-model="settlementForm.bank_name"
              name="bank_name"
              label="银行名称"
              placeholder="请输入银行名称"
            />
            <Field
              v-model="settlementForm.bank_branch"
              name="bank_branch"
              label="支行名称"
              placeholder="请输入支行名称"
            />
            <Field
              v-model="settlementForm.bank_account_name"
              name="bank_account_name"
              label="开户名"
              placeholder="请输入开户名"
            />
            <Field
              v-model="settlementForm.bank_account_no"
              name="bank_account_no"
              label="银行账号"
              placeholder="请输入银行账号"
            />
            <Field
              v-model="settlementForm.remarks"
              name="remarks"
              label="备注"
              placeholder="请输入备注信息"
              type="textarea"
              rows="3"
              autosize
            />
            <div class="form-submit">
              <Button round block type="primary" native-type="submit" :loading="submitting">
                {{ submitting ? '提交中...' : '提交' }}
              </Button>
            </div>
          </Form>
        </div>
      </Popup>
      
      <!-- 商户选择弹窗（创建用） -->
      <Popup v-model:show="showMerchantSelectPicker" position="bottom" round>
        <Picker
          title="选择商户"
          :columns="merchantSelectColumns"
          @confirm="onMerchantSelectConfirm"
          @cancel="showMerchantSelectPicker = false"
        />
      </Popup>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NavBar, 
  Icon,
  Field,
  DropdownMenu, 
  DropdownItem,
  List, 
  Tag, 
  Loading, 
  Empty, 
  PullRefresh,
  Popup,
  Picker,
  Cell,
  Button,
  Form,
  showToast,
  showSuccessToast,
  showLoadingToast,
  showConfirmDialog,
  closeToast
} from 'vant'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const settlementList = ref([])
const currentPage = ref(1)
const pageSize = 10
const showMerchantPicker = ref(false)
const showSettlementDetailPopup = ref(false)
const showAddSettlementPopup = ref(false)
const showMerchantSelectPicker = ref(false)
const currentSettlement = ref(null)
const selectedMerchantId = ref('')
const selectedMerchantName = ref('')
const merchantList = ref([])
const showMerchantFilter = ref(true)
const submitting = ref(false)

// 从路由参数中获取商户ID
const merchantId = computed(() => route.query.merchantId)

// 筛选器状态
const filter = reactive({
  status: 'all'
})

// 结算表单
const settlementForm = reactive({
  merchant_id: '',
  merchant_name: '',
  amount: '',
  bank_name: '',
  bank_branch: '',
  bank_account_name: '',
  bank_account_no: '',
  remarks: ''
})

// 状态选项
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '待处理', value: 'pending' },
  { text: '处理中', value: 'processing' },
  { text: '成功', value: 'success' },
  { text: '失败', value: 'failed' }
]

// 商户选择列
const merchantColumns = computed(() => {
  const options = [{ text: '全部商户', value: '' }]
  merchantList.value.forEach(merchant => {
    options.push({
      text: merchant.name,
      value: merchant.id
    })
  })
  return options
})

// 商户选择列（创建用）
const merchantSelectColumns = computed(() => {
  return merchantList.value.map(merchant => ({
    text: merchant.name,
    value: merchant.id
  }))
})

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 初始化时检查路由参数
onMounted(async () => {
  await fetchMerchants()
  
  if (merchantId.value) {
    selectedMerchantId.value = merchantId.value
    const merchant = merchantList.value.find(m => m.id === Number(merchantId.value))
    if (merchant) {
      selectedMerchantName.value = merchant.name
      showMerchantFilter.value = false
    }
  }
  
  loadSettlementData(true)
})

// 获取商户列表
const fetchMerchants = async () => {
  try {
    // 模拟API请求
    setTimeout(() => {
      // 模拟数据
      merchantList.value = Array.from({ length: 10 }, (_, i) => ({
        id: 10000 + i,
        name: `测试商户${i + 1}`,
        bank_name: `中国银行`,
        bank_branch: `深圳分行`,
        bank_account_name: `测试商户${i + 1}`,
        bank_account_no: `622020100${i}${i}${i}${i}${i}${i}${i}`
      }))
    }, 500)
  } catch (error) {
    console.error('获取商户列表失败:', error)
    showToast('获取商户列表失败')
  }
}

// 加载结算数据
const loadSettlementData = async (reset = false) => {
  if (reset) {
    settlementList.value = []
    currentPage.value = 1
    finished.value = false
  }
  
  loading.value = true
  
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      limit: pageSize,
      merchant_id: selectedMerchantId.value,
      status: filter.status !== 'all' ? filter.status : undefined
    }
    
    // 显示加载提示
    const loadingToast = showLoadingToast({
      message: '加载中...',
      duration: 0,
      forbidClick: true
    });
    
    // 模拟API请求
    setTimeout(() => {
      try {
        // 模拟数据
        const mockSettlements = generateMockSettlements(10)
        
        if (reset) {
          settlementList.value = mockSettlements
        } else {
          settlementList.value = [...settlementList.value, ...mockSettlements]
        }
        
        // 模拟分页
        if (currentPage.value >= 3) {
          finished.value = true
        } else {
          currentPage.value++
        }
        
        loading.value = false
        refreshing.value = false
        loadingMore.value = false
        
        // 安全关闭loading提示
        try {
          loadingToast.close()
        } catch (e) {
          closeToast()
        }
      } catch (error) {
        closeToast()
        console.error('数据处理失败:', error)
        showToast('数据处理失败')
      }
    }, 1000)
  } catch (error) {
    closeToast()
    console.error('加载结算数据失败:', error)
    showToast('加载失败，请重试')
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

// 刷新
const onRefresh = () => {
  refreshing.value = true
  loadSettlementData(true)
}

// 加载更多
const onLoadMore = () => {
  if (finished.value) return
  
  loadingMore.value = true
  loadSettlementData()
}

// 筛选改变
const onFilterChange = () => {
  loadSettlementData(true)
}

// 确认商户选择
const onMerchantConfirm = (option) => {
  selectedMerchantId.value = option.value
  selectedMerchantName.value = option.text === '全部商户' ? '' : option.text
  showMerchantPicker.value = false
  loadSettlementData(true)
}

// 查看结算详情
const showDetail = (settlement) => {
  currentSettlement.value = settlement
  showSettlementDetailPopup.value = true
}

// 显示添加结算
const showAddSettlement = () => {
  // 重置表单
  Object.keys(settlementForm).forEach(key => {
    settlementForm[key] = ''
  })
  
  // 如果已选择了商户，填充商户信息
  if (selectedMerchantId.value && !showMerchantFilter.value) {
    const merchant = merchantList.value.find(m => m.id == selectedMerchantId.value)
    if (merchant) {
      settlementForm.merchant_id = merchant.id
      settlementForm.merchant_name = merchant.name
      settlementForm.bank_name = merchant.bank_name || ''
      settlementForm.bank_branch = merchant.bank_branch || ''
      settlementForm.bank_account_name = merchant.bank_account_name || ''
      settlementForm.bank_account_no = merchant.bank_account_no || ''
    }
  }
  
  showAddSettlementPopup.value = true
}

// 商户选择（创建用）
const onMerchantSelectConfirm = (option) => {
  const merchant = merchantList.value.find(m => m.id == option.value)
  if (merchant) {
    settlementForm.merchant_id = merchant.id
    settlementForm.merchant_name = merchant.name
    settlementForm.bank_name = merchant.bank_name || ''
    settlementForm.bank_branch = merchant.bank_branch || ''
    settlementForm.bank_account_name = merchant.bank_account_name || ''
    settlementForm.bank_account_no = merchant.bank_account_no || ''
  }
  showMerchantSelectPicker.value = false
}

// 表单提交
const onFormSubmit = () => {
  // 表单验证
  if (!settlementForm.merchant_id) {
    showToast('请选择商户')
    return
  }
  
  if (!settlementForm.amount || isNaN(parseFloat(settlementForm.amount)) || parseFloat(settlementForm.amount) <= 0) {
    showToast('请输入有效的结算金额')
    return
  }
  
  submitting.value = true
  
  // 模拟API调用
  setTimeout(() => {
    const newSettlement = {
      id: Date.now(),
      settlement_no: `S${Date.now().toString().substring(5)}`,
      merchant_id: settlementForm.merchant_id,
      merchant_name: settlementForm.merchant_name,
      amount: parseFloat(settlementForm.amount),
      bank_name: settlementForm.bank_name,
      bank_branch: settlementForm.bank_branch,
      bank_account_name: settlementForm.bank_account_name,
      bank_account_no: settlementForm.bank_account_no,
      remarks: settlementForm.remarks,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    settlementList.value = [newSettlement, ...settlementList.value]
    showSuccessToast('创建结算成功')
    submitting.value = false
    showAddSettlementPopup.value = false
  }, 1000)
}

// 更新结算状态
const updateStatus = (settlement, fromDetail = false) => {
  const currentStatus = settlement.status
  let newStatus, actionText
  
  if (currentStatus === 'pending') {
    newStatus = 'processing'
    actionText = '处理'
  } else if (currentStatus === 'processing') {
    newStatus = 'success'
    actionText = '完成'
  } else {
    showToast('当前状态无法操作')
    return
  }
  
  showConfirmDialog({
    title: `${actionText}结算`,
    message: `确定要将商户 "${settlement.merchant_name}" 的结算单号为 "${settlement.settlement_no}" 的结算状态修改为"${actionText}中"吗？`,
  }).then(() => {
    // 用户点击确定按钮
    // 模拟API调用
    const loadingToast = showLoadingToast({
      message: '处理中...',
      duration: 0,
      forbidClick: true
    })
    
    setTimeout(() => {
      try {
        // 更新本地状态
        const index = settlementList.value.findIndex(s => s.id === settlement.id)
        if (index !== -1) {
          settlementList.value[index].status = newStatus
          settlementList.value[index].updated_at = new Date().toISOString()
          
          if (newStatus === 'success') {
            settlementList.value[index].settlement_time = formatDate(new Date())
          }
          
          // 如果当前有显示详情，也更新详情中的状态
          if (currentSettlement.value && currentSettlement.value.id === settlement.id) {
            currentSettlement.value.status = newStatus
            currentSettlement.value.updated_at = new Date().toISOString()
            
            if (newStatus === 'success') {
              currentSettlement.value.settlement_time = formatDate(new Date())
            }
          }
        }
        
        // 安全关闭loadingToast
        try {
          loadingToast.close()
        } catch (e) {
          // 使用全局closeToast
          closeToast()
        }
        
        showSuccessToast(`结算已${actionText}`)
        
        // 如果是从详情页操作的，关闭详情页
        if (fromDetail && newStatus === 'success') {
          showSettlementDetailPopup.value = false
        }
      } catch (error) {
        closeToast()
        console.error('更新状态失败:', error)
        showToast('操作失败，请重试')
      }
    }, 1000)
  }).catch(() => {
    // 用户点击取消按钮
  })
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'success': return 'success'
    case 'processing': return 'primary'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    default: return 'default'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'success': return '成功'
    case 'processing': return '处理中'
    case 'pending': return '待处理'
    case 'failed': return '失败'
    default: return '未知'
  }
}

// 格式化金额
const formatAmount = (amount) => {
  return '¥' + (amount ? Number(amount).toFixed(2) : '0.00')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 生成模拟结算数据
const generateMockSettlements = (count) => {
  const settlements = []
  const statuses = ['pending', 'processing', 'success', 'failed']
  
  for (let i = 0; i < count; i++) {
    const createDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = (Math.random() * 10000 + 1000).toFixed(2)
    
    const merchant = selectedMerchantId.value 
      ? { id: selectedMerchantId.value, name: selectedMerchantName.value || `商户${selectedMerchantId.value}` }
      : { id: 10000 + Math.floor(Math.random() * 10), name: `测试商户${Math.floor(Math.random() * 10) + 1}` }
    
    settlements.push({
      id: Date.now() + i,
      settlement_no: `S${Date.now().toString().substring(5)}${i}`,
      merchant_id: merchant.id,
      merchant_name: merchant.name,
      amount: amount,
      bank_name: '中国银行',
      bank_branch: '深圳分行',
      bank_account_name: merchant.name,
      bank_account_no: `622020100${i}${i}${i}${i}${i}${i}${i}`,
      remarks: Math.random() > 0.5 ? `结算备注${i + 1}` : '',
      status: status,
      settlement_time: status === 'success' ? formatDate(new Date(createDate.getTime() + 24 * 60 * 60 * 1000)) : null,
      created_at: createDate.toISOString(),
      updated_at: new Date(createDate.getTime() + Math.floor(Math.random() * 3600000)).toISOString()
    })
  }
  
  return settlements
}
</script>

<style scoped>
.settlements-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
  padding-bottom: 60px;
}

.search-filter {
  margin-bottom: 16px;
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #f7f8fa;
}

.merchant-filter {
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.filter-options {
  display: flex;
}

.filter-options .van-dropdown-menu {
  flex: 1;
  --van-dropdown-menu-height: 36px;
  border-radius: 8px;
  overflow: hidden;
}

.settlement-list {
  margin-bottom: 16px;
}

.settlement-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.settlement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.settlement-merchant {
  font-size: 15px;
  font-weight: bold;
  color: #323233;
}

.settlement-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.settlement-no {
  font-size: 13px;
  color: #646566;
}

.settlement-amount {
  font-size: 16px;
  font-weight: bold;
  color: #ff9500;
}

.settlement-bank {
  margin-bottom: 8px;
}

.bank-info {
  font-size: 13px;
  color: #323233;
  display: flex;
  align-items: center;
}

.settlement-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f2f3f5;
  padding-top: 8px;
  margin-bottom: 8px;
}

.settlement-remark {
  font-size: 13px;
  color: #969799;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
}

.settlement-time {
  font-size: 13px;
  color: #969799;
  white-space: nowrap;
}

.settlement-actions {
  display: flex;
  gap: 8px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.detail-popup {
  padding: 20px 16px;
}

.detail-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #323233;
}

.detail-status {
  text-align: center;
  margin-bottom: 16px;
}

.detail-amount {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #ff9500;
  margin-bottom: 24px;
}

.detail-info {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.detail-actions {
  padding: 0 16px;
  margin-top: 24px;
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