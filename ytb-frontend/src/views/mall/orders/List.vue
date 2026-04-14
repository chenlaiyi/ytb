<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>订单管理</h2>
      <p>管理商城订单信息，包括订单处理、发货、退款等</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container" v-if="overallStats">
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ overallStats.total_orders }}</div>
            <div class="stat-label">总订单数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ overallStats.pending_orders }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ overallStats.shipped_orders }}</div>
            <div class="stat-label">已发货</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ overallStats.completed_orders }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ formatCurrency(overallStats.total_amount) }}</div>
            <div class="stat-label">总金额</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ formatCurrency(overallStats.today_amount) }}</div>
            <div class="stat-label">今日金额</div>
          </div>
        </el-col>
      </el-row>

      <div class="stats-split" v-if="splitStats.length">
        <div class="split-title">官方/商户拆分</div>
        <el-row :gutter="20">
          <el-col
            v-for="group in splitStats"
            :key="group.key"
            :span="12"
          >
            <div class="stat-card group-card">
              <div class="group-header">{{ group.title }}</div>
              <div class="group-grid">
                <div
                  v-for="metric in splitMetricConfig"
                  :key="metric.key"
                  class="group-item"
                >
                  <div class="group-label">{{ metric.label }}</div>
                  <div class="group-value">
                    <template v-if="metric.currency">
                      {{ formatCurrency(group.data?.[metric.key]) }}
                    </template>
                    <template v-else>
                      {{ group.data?.[metric.key] ?? 0 }}
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="订单号/用户手机号"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
        clearable
      />
      <el-select
        v-model="listQuery.status"
        placeholder="订单状态"
        style="width: 150px;"
        class="filter-item"
        clearable
      >
        <el-option label="待付款" :value="0" />
        <el-option label="待发货" :value="1" />
        <el-option label="已发货" :value="2" />
        <el-option label="已完成" :value="3" />
        <el-option label="已取消" :value="4" />
        <el-option label="已退款" :value="5" />
      </el-select>
      <el-select
        v-model="listQuery.payment_status"
        placeholder="支付状态"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="未支付" :value="0" />
        <el-option label="已支付" :value="1" />
        <el-option label="已退款" :value="2" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px;"
        class="filter-item"
        @change="handleDateChange"
      />
      <el-input-number
        v-model="listQuery.min_amount"
        placeholder="最低金额"
        :min="0"
        :precision="2"
        style="width: 120px;"
        class="filter-item"
      />
      <el-input-number
        v-model="listQuery.max_amount"
        placeholder="最高金额"
        :min="0"
        :precision="2"
        style="width: 120px;"
        class="filter-item"
      />
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button 
        class="filter-item" 
        type="success" 
        icon="Refresh" 
        @click="fetchData"
        :loading="listLoading"
      >
        刷新
      </el-button>
      <el-button 
        class="filter-item" 
        type="warning" 
        icon="Download" 
        @click="handleExport"
        :loading="exportLoading"
      >
        导出
      </el-button>
    </div>

    <!-- 批量操作 -->
    <div class="batch-container" v-if="multipleSelection.length > 0">
      <el-alert
        :title="`已选择 ${multipleSelection.length} 个订单`"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="batch-actions">
        <el-button type="success" size="small" @click="handleBatchShip">
          批量发货
        </el-button>
        <el-button type="info" size="small" @click="handleBatchConfirm">
          批量确认收货
        </el-button>
        <el-button type="warning" size="small" @click="handleBatchCancel">
          批量取消
        </el-button>
      </div>
    </div>

    <!-- 订单表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      highlight-current-row
      style="width: 100%;"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column prop="order_no" label="订单号" width="180" />
      
      <el-table-column label="用户信息" width="150">
        <template #default="scope">
          <div class="user-info">
            <div class="user-name">{{ scope.row.user?.nickname || '未知用户' }}</div>
            <div class="user-phone">{{ scope.row.user?.phone || '无手机号' }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="商品信息" min-width="300">
        <template #default="scope">
          <div class="order-items">
            <div 
              v-for="item in scope.row.items" 
              :key="item.id" 
              class="order-item"
            >
              <el-image
                v-if="item.product?.thumbnail"
                style="width: 40px; height: 40px; border-radius: 4px; margin-right: 8px;"
                :src="getFullImageUrl(item.product.thumbnail)"
                fit="cover"
              />
              <div class="item-details">
                <div class="item-name">{{ item.product?.name || '商品已删除' }}</div>
                <div class="item-spec">
                  数量: {{ item.quantity }} | 单价: ¥{{ item.price }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="订单金额" width="120">
        <template #default="scope">
          <div class="amount-info">
            <div class="total-amount">¥{{ scope.row.total_amount }}</div>
            <div v-if="scope.row.discount_amount > 0" class="discount-amount">
              优惠: -¥{{ scope.row.discount_amount }}
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="支付状态" width="100">
        <template #default="scope">
          <el-tag :type="getPaymentStatusType(scope.row.payment_status)">
            {{ getPaymentStatusText(scope.row.payment_status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="订单状态" width="100">
        <template #default="scope">
          <el-tag :type="getOrderStatusType(scope.row.status)">
            {{ getOrderStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="收货地址" width="200" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="scope.row.shipping_address">
            {{ scope.row.shipping_address.province }}{{ scope.row.shipping_address.city }}{{ scope.row.shipping_address.district }}{{ scope.row.shipping_address.detail }}
          </div>
          <span v-else>无收货地址</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="created_at" label="下单时间" width="180" />
      
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleView(scope.row)">
            查看
          </el-button>
          <el-dropdown @command="(command) => handleOperation(command, scope.row)">
            <el-button type="info" size="small">
              操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-if="scope.row.status === 1" 
                  command="ship"
                >
                  发货
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="scope.row.status === 2" 
                  command="confirm"
                >
                  确认收货
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="scope.row.status <= 1" 
                  command="cancel"
                >
                  取消订单
                </el-dropdown-item>
                <el-dropdown-item command="edit_address">
                  修改地址
                </el-dropdown-item>
                <el-dropdown-item command="edit_status">
                  修改状态
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-show="total > 0"
      :total="total"
      v-model:current-page="listQuery.page"
      v-model:page-size="listQuery.limit"
      @current-change="fetchData"
      @size-change="fetchData"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
    />

    <!-- 订单详情弹窗 -->
    <el-dialog 
      title="订单详情" 
      v-model="detailDialogVisible"
      width="900px"
    >
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-card class="detail-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getOrderStatusType(currentOrder.status)">
                {{ getOrderStatusText(currentOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="getPaymentStatusType(currentOrder.payment_status)">
                {{ getPaymentStatusText(currentOrder.payment_status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ currentOrder.total_amount }}</el-descriptions-item>
            <el-descriptions-item label="优惠金额">¥{{ currentOrder.discount_amount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="实付金额">¥{{ currentOrder.paid_amount || currentOrder.total_amount }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ currentOrder.paid_at || '未支付' }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ currentOrder.shipped_at || '未发货' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 用户信息 -->
        <el-card class="detail-card">
          <template #header>
            <span>用户信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户昵称">{{ currentOrder.user?.nickname || '未知用户' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentOrder.user?.phone || '无手机号' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 收货地址 -->
        <el-card class="detail-card" v-if="currentOrder.shipping_address">
          <template #header>
            <span>收货地址</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="收货人">{{ currentOrder.shipping_address.name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.shipping_address.phone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              {{ currentOrder.shipping_address.province }}{{ currentOrder.shipping_address.city }}{{ currentOrder.shipping_address.district }}{{ currentOrder.shipping_address.detail }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 商品信息 -->
        <el-card class="detail-card">
          <template #header>
            <span>商品信息</span>
          </template>
          <el-table :data="currentOrder.items" border>
            <el-table-column label="商品图片" width="80">
              <template #default="scope">
                <el-image
                  v-if="scope.row.product?.thumbnail"
                  style="width: 60px; height: 60px; border-radius: 4px;"
                  :src="getFullImageUrl(scope.row.product.thumbnail)"
                  fit="cover"
                />
              </template>
            </el-table-column>
            <el-table-column prop="product.name" label="商品名称" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="scope">
                ¥{{ scope.row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="小计" width="100">
              <template #default="scope">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 物流信息 -->
        <el-card class="detail-card" v-if="currentOrder.shipping_info">
          <template #header>
            <span>物流信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物流公司">{{ currentOrder.shipping_info.company || '无' }}</el-descriptions-item>
            <el-descriptions-item label="快递单号">{{ currentOrder.shipping_info.tracking_no || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 备注信息 -->
        <el-card class="detail-card" v-if="currentOrder.remark || currentOrder.admin_remark">
          <template #header>
            <span>备注信息</span>
          </template>
          <div v-if="currentOrder.remark" class="remark-item">
            <strong>用户备注：</strong>{{ currentOrder.remark }}
          </div>
          <div v-if="currentOrder.admin_remark" class="remark-item">
            <strong>管理员备注：</strong>{{ currentOrder.admin_remark }}
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 发货弹窗 -->
    <el-dialog 
      title="订单发货" 
      v-model="shipDialogVisible"
      width="500px"
    >
      <el-form 
        ref="shipFormRef" 
        :model="shipForm" 
        :rules="shipRules"
        label-width="100px"
      >
        <el-form-item label="物流公司" prop="company">
          <el-input v-model="shipForm.company" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="快递单号" prop="tracking_no">
          <el-input v-model="shipForm.tracking_no" placeholder="请输入快递单号" />
        </el-form-item>
        <el-form-item label="发货备注">
          <el-input 
            v-model="shipForm.admin_remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入发货备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmShip"
            :loading="submitLoading"
          >
            确认发货
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改状态弹窗 -->
    <el-dialog 
      title="修改订单状态" 
      v-model="statusDialogVisible"
      width="400px"
    >
      <el-form 
        ref="statusFormRef" 
        :model="statusForm" 
        :rules="statusRules"
        label-width="100px"
      >
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="已退款" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="statusForm.admin_remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入修改原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmStatusChange"
            :loading="submitLoading"
          >
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import * as mallApi from '@/api/v1/mall'
export default {
  name: 'MallOrderList',
  components: {
    ArrowDown
  },
  setup() {
    const listLoading = ref(true)
    const submitLoading = ref(false)
    const exportLoading = ref(false)
    const list = ref([])
    const total = ref(0)
    const statistics = ref(null)
    const multipleSelection = ref([])
    const dateRange = ref([])

    const overallStats = computed(() => statistics.value?.overall || null)
    const splitStats = computed(() => {
      if (!statistics.value) {
        return []
      }

      const groups = []

      if (statistics.value.official) {
        groups.push({
          key: 'official',
          title: '官方商城',
          data: statistics.value.official
        })
      }

      if (statistics.value.merchant) {
        groups.push({
          key: 'merchant',
          title: '商户商城',
          data: statistics.value.merchant
        })
      }

      return groups
    })

    const splitMetricConfig = [
      { key: 'total_orders', label: '订单总数' },
      { key: 'pending_orders', label: '待处理' },
      { key: 'shipped_orders', label: '已发货' },
      { key: 'completed_orders', label: '已完成' },
      { key: 'total_amount', label: '成交金额', currency: true },
      { key: 'today_amount', label: '今日金额', currency: true }
    ]

    const normalizeStatistics = (payload) => {
      if (!payload || typeof payload !== 'object') {
        return { overall: null, official: null, merchant: null }
      }

      if (payload.overall || payload.official || payload.merchant) {
        return {
          overall: payload.overall || payload,
          official: payload.official || null,
          merchant: payload.merchant || null
        }
      }

      return {
        overall: payload,
        official: null,
        merchant: null
      }
    }

    const formatCurrency = (value) => {
      const number = Number(value ?? 0)
      return `¥${number.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }
    
    const listQuery = reactive({
      keyword: '',
      status: '',
      payment_status: '',
      start_date: '',
      end_date: '',
      min_amount: null,
      max_amount: null,
      page: 1,
      limit: 20
    })
    
    const detailDialogVisible = ref(false)
    const shipDialogVisible = ref(false)
    const statusDialogVisible = ref(false)
    const currentOrder = ref(null)
    const shipFormRef = ref(null)
    const statusFormRef = ref(null)
    
    const shipForm = reactive({
      order_id: null,
      company: '',
      tracking_no: '',
      admin_remark: ''
    })
    
    const statusForm = reactive({
      order_id: null,
      status: '',
      admin_remark: ''
    })
    
    const shipRules = {
      company: [{ required: true, message: '请输入物流公司', trigger: 'blur' }],
      tracking_no: [{ required: true, message: '请输入快递单号', trigger: 'blur' }]
    }
    
    const statusRules = {
      status: [{ required: true, message: '请选择订单状态', trigger: 'change' }]
    }
    
    // 获取订单列表
    const fetchData = async () => {
      listLoading.value = true
      
      try {
        const response = await mallApi.getOrderList(listQuery)
        
        if (response.code === 0) {
          list.value = response.data.data || response.data.list || []
          total.value = response.data.total || 0
        } else {
          ElMessage.error(response.message || '获取订单列表失败')
        }
      } catch (error) {
        console.error('获取订单列表失败:', error)
        ElMessage.error('获取订单列表失败：' + (error.response?.data?.message || error.message))
      } finally {
        listLoading.value = false
      }
    }
    
    // 获取统计信息
    const fetchStatistics = async () => {
      try {
        const response = await mallApi.getOrderStatistics()
        
        if (response.code === 0) {
          statistics.value = normalizeStatistics(response.data)
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
      }
    }
    
    // 搜索
    const handleFilter = () => {
      listQuery.page = 1
      fetchData()
    }
    
    // 日期范围变更
    const handleDateChange = (dates) => {
      if (dates && dates.length === 2) {
        listQuery.start_date = dates[0]
        listQuery.end_date = dates[1]
      } else {
        listQuery.start_date = ''
        listQuery.end_date = ''
      }
    }
    
    // 多选变更
    const handleSelectionChange = (selection) => {
      multipleSelection.value = selection
    }
    
    // 查看订单详情
    const handleView = async (row) => {
      try {
        const response = await mallApi.getOrderDetail(row.id)
        
        if (response.code === 0) {
          currentOrder.value = response.data
          detailDialogVisible.value = true
        } else {
          ElMessage.error(response.message || '获取订单详情失败')
        }
      } catch (error) {
        console.error('获取订单详情失败:', error)
        ElMessage.error('获取订单详情失败：' + (error.response?.data?.message || error.message))
      }
    }
    
    // 订单操作
    const handleOperation = (command, row) => {
      switch (command) {
        case 'ship':
          handleShip(row)
          break
        case 'confirm':
          handleConfirm(row)
          break
        case 'cancel':
          handleCancel(row)
          break
        case 'edit_address':
          handleEditAddress(row)
          break
        case 'edit_status':
          handleEditStatus(row)
          break
      }
    }
    
    // 发货
    const handleShip = (row) => {
      Object.assign(shipForm, {
        order_id: row.id,
        company: '',
        tracking_no: '',
        admin_remark: ''
      })
      shipDialogVisible.value = true
      nextTick(() => {
        shipFormRef.value?.clearValidate()
      })
    }
    
    // 确认发货
    const confirmShip = async () => {
      try {
        const valid = await shipFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        const response = await mallApi.shipOrder(shipForm.order_id, shipForm)
        
        if (response.code === 0) {
          ElMessage.success('发货成功')
          shipDialogVisible.value = false
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '发货失败')
        }
      } catch (error) {
        console.error('发货失败:', error)
        ElMessage.error('发货失败：' + (error.response?.data?.message || error.message))
      } finally {
        submitLoading.value = false
      }
    }
    
    // 确认收货
    const handleConfirm = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要确认订单"${row.order_no}"收货吗？`,
          '确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        const response = await mallApi.confirmOrder(row.id)
        
        if (response.code === 0) {
          ElMessage.success('确认收货成功')
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '确认收货失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('确认收货失败:', error)
          ElMessage.error('确认收货失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    // 取消订单
    const handleCancel = async (row) => {
      try {
        const { value: reason } = await ElMessageBox.prompt(
          '请输入取消原因',
          '取消订单',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /.+/,
            inputErrorMessage: '取消原因不能为空'
          }
        )
        
        const response = await mallApi.cancelOrder(row.id, reason)
        
        if (response.code === 0) {
          ElMessage.success('取消订单成功')
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '取消订单失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消订单失败:', error)
          ElMessage.error('取消订单失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    // 修改地址
    const handleEditAddress = (row) => {
      ElMessage.info('修改地址功能开发中...')
    }
    
    // 修改状态
    const handleEditStatus = (row) => {
      Object.assign(statusForm, {
        order_id: row.id,
        status: row.status,
        admin_remark: ''
      })
      statusDialogVisible.value = true
      nextTick(() => {
        statusFormRef.value?.clearValidate()
      })
    }
    
    // 确认状态修改
    const confirmStatusChange = async () => {
      try {
        const valid = await statusFormRef.value.validate()
        if (!valid) return
        
        submitLoading.value = true
        const response = await mallApi.updateOrderStatus(
          statusForm.order_id, 
          statusForm.status, 
          statusForm.admin_remark
        )
        
        if (response.code === 0) {
          ElMessage.success('状态修改成功')
          statusDialogVisible.value = false
          fetchData()
          fetchStatistics()
        } else {
          ElMessage.error(response.message || '状态修改失败')
        }
      } catch (error) {
        console.error('状态修改失败:', error)
        ElMessage.error('状态修改失败：' + (error.response?.data?.message || error.message))
      } finally {
        submitLoading.value = false
      }
    }
    
    // 批量发货
    const handleBatchShip = () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要发货的订单')
        return
      }
      
      ElMessage.info('批量发货功能开发中...')
    }
    
    // 批量确认收货
    const handleBatchConfirm = async () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要确认收货的订单')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要批量确认 ${multipleSelection.value.length} 个订单收货吗？`,
          '确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        // 这里可以实现批量确认收货的逻辑
        ElMessage.info('批量确认收货功能开发中...')
      } catch (error) {
        // 用户取消
      }
    }
    
    // 批量取消
    const handleBatchCancel = async () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要取消的订单')
        return
      }
      
      try {
        const { value: reason } = await ElMessageBox.prompt(
          '请输入取消原因',
          '批量取消订单',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /.+/,
            inputErrorMessage: '取消原因不能为空'
          }
        )
        
        // 这里可以实现批量取消的逻辑
        ElMessage.info('批量取消功能开发中...')
      } catch (error) {
        // 用户取消
      }
    }
    
    // 导出
    const handleExport = async () => {
      exportLoading.value = true
      try {
        // 这里可以实现导出功能
        ElMessage.info('导出功能开发中...')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败：' + (error.response?.data?.message || error.message))
      } finally {
        exportLoading.value = false
      }
    }
    
    // 获取支付状态类型
    const getPaymentStatusType = (status) => {
      const types = {
        0: 'warning',  // 未支付
        1: 'success',  // 已支付
        2: 'info'      // 已退款
      }
      return types[status] || 'info'
    }
    
    // 获取支付状态文本
    const getPaymentStatusText = (status) => {
      const texts = {
        0: '未支付',
        1: '已支付',
        2: '已退款'
      }
      return texts[status] || '未知'
    }
    
    // 获取订单状态类型
    const getOrderStatusType = (status) => {
      const types = {
        0: 'warning',  // 待付款
        1: 'info',     // 待发货
        2: 'primary',  // 已发货
        3: 'success',  // 已完成
        4: 'danger',   // 已取消
        5: 'info'      // 已退款
      }
      return types[status] || 'info'
    }
    
    // 获取订单状态文本
    const getOrderStatusText = (status) => {
      const texts = {
        0: '待付款',
        1: '待发货',
        2: '已发货',
        3: '已完成',
        4: '已取消',
        5: '已退款'
      }
      return texts[status] || '未知'
    }
    
    // 获取完整图片URL
    const getFullImageUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `${import.meta.env.VITE_BASE_API}${url}`
    }
    
    onMounted(() => {
      fetchData()
      fetchStatistics()
    })
    
    return {
      listLoading,
      submitLoading,
      exportLoading,
      list,
      total,
      statistics,
      overallStats,
      splitStats,
      splitMetricConfig,
      multipleSelection,
      dateRange,
      listQuery,
      detailDialogVisible,
      shipDialogVisible,
      statusDialogVisible,
      currentOrder,
      shipFormRef,
      statusFormRef,
      shipForm,
      statusForm,
      shipRules,
      statusRules,
      fetchData,
      handleFilter,
      handleDateChange,
      handleSelectionChange,
      handleView,
      handleOperation,
      handleShip,
      confirmShip,
      handleConfirm,
      handleCancel,
      handleEditAddress,
      handleEditStatus,
      confirmStatusChange,
      handleBatchShip,
      handleBatchConfirm,
      handleBatchCancel,
      handleExport,
      formatCurrency,
      getPaymentStatusType,
      getPaymentStatusText,
      getOrderStatusType,
      getOrderStatusText,
      getFullImageUrl
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 8px 0;
    color: #ffffff;
  }
  
  p {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
  }
}

.stats-container {
  margin-bottom: 20px;
  
  .stat-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }

  .stats-split {
    margin-top: 20px;

    .split-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }
  }

  .group-card {
    padding: 16px;

    .group-header {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #303133;
    }

    .group-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .group-item {
      background: #f5f7fa;
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .group-label {
      font-size: 13px;
      color: #606266;
    }

    .group-value {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.filter-container {
  margin-bottom: 20px;
  
  .filter-item {
    margin-right: 10px;
    margin-bottom: 10px;
  }
}

.batch-container {
  margin-bottom: 20px;
  
  .batch-actions {
    margin-top: 10px;
    
    .el-button {
      margin-right: 10px;
    }
  }
}

.user-info {
  .user-name {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .user-phone {
    font-size: 12px;
    color: #909399;
  }
}

.order-items {
  .order-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .item-details {
      flex: 1;
      
      .item-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .item-spec {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.amount-info {
  .total-amount {
    font-weight: bold;
    color: #f56c6c;
    margin-bottom: 4px;
  }
  
  .discount-amount {
    font-size: 12px;
    color: #67c23a;
  }
}

.order-detail {
  .detail-card {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .remark-item {
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    strong {
      color: #303133;
    }
  }
}
</style> 
