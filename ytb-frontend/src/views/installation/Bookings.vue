<template>
  <div class="installation-bookings-page">
    <div class="card">
      <div class="card-header">
        <h5>安装预约管理</h5>
        <div class="filters">
          <el-form :inline="true" :model="filters" class="filter-form">
            <el-form-item>
              <el-input
                v-model="filters.search"
                placeholder="订单号/联系人/电话"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filters.status" placeholder="状态" clearable>
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="card-body">
        <el-table
          v-loading="loading"
          :data="bookingList"
          border
          style="width: 100%"
          row-key="id"
        >
          <el-table-column prop="booking_no" label="预约单号" min-width="120" show-overflow-tooltip />
          <el-table-column label="用户信息" min-width="120">
            <template #default="scope">
              <div class="user-info">
                <el-avatar
                  :size="30"
                  :src="scope.row.user_avatar"
                  v-if="scope.row.user_avatar"
                >
                </el-avatar>
                <el-avatar :size="30" icon="el-icon-user" v-else></el-avatar>
                <span class="ml-2">{{ scope.row.user_display_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="contact_name" label="联系人" min-width="90" />
          <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
          <el-table-column prop="package_type_text" label="套餐类型" min-width="120" show-overflow-tooltip />
          <el-table-column label="安装时间" min-width="150">
            <template #default="scope">
              {{ formatDateTime(scope.row.install_time) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="推荐人" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.referrer_id">{{ scope.row.referrer_display_name }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="150">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" min-width="220">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="handleViewDetails(scope.row)"
                plain
              >
                详情
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleUpdateStatus(scope.row)"
                v-if="scope.row.status !== 'completed' && scope.row.status !== 'cancelled'"
              >
                更新状态
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="handleAssignEngineer(scope.row)"
                v-if="canAssignEngineer(scope.row)"
              >
                派工程师
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[15, 30, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusDialog.visible"
      :title="statusDialog.title"
      width="500px"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(currentBooking.status)" v-if="currentBooking.id">
            {{ currentBooking.status_text }}
          </el-tag>
        </el-form-item>
        <el-form-item label="更新为">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="option in getAvailableStatusOptions(currentBooking.status)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 分配工程师 -->
        <el-form-item label="工程师" v-if="statusForm.status === 'assigned'">
          <el-select v-model="statusForm.engineer_id" placeholder="请选择工程师" style="width: 100%">
            <el-option
              v-for="engineer in engineers"
              :key="engineer.id"
              :label="engineer.display_name"
              :value="engineer.id"
            >
              <div class="engineer-option">
                <el-avatar
                  :size="24"
                  :src="engineer.wechat_avatar"
                  v-if="engineer.wechat_avatar"
                >
                </el-avatar>
                <el-avatar :size="24" icon="el-icon-user" v-else></el-avatar>
                <span>{{ engineer.display_name }}</span>
                <span class="engineer-phone" v-if="engineer.phone">{{ engineer.phone }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 设备信息 -->
        <template v-if="statusForm.status === 'completed'">
          <el-form-item label="设备ID" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_id" placeholder="请输入设备ID"></el-input>
          </el-form-item>
          <el-form-item label="设备型号" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_model" placeholder="请输入设备型号"></el-input>
          </el-form-item>
          <el-form-item label="设备序列号" v-if="statusForm.status === 'completed'">
            <el-input v-model="statusForm.device_sn" placeholder="请输入设备序列号"></el-input>
          </el-form-item>
        </template>

        <!-- 取消原因 -->
        <el-form-item label="取消原因" v-if="statusForm.status === 'cancelled'">
          <el-input
            v-model="statusForm.cancel_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusUpdate" :loading="statusDialog.loading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getInstallationBookings, updateBookingStatus } from '@/api/installationBooking' // 导入 API 函数
import engineerApi from '@/api/engineerApi' // 导入工程师API
import { formatDateTime, getStatusType } from '@/utils/formatters' // 假设有这些格式化工具

export default {
  name: 'InstallationBookings',
  components: {
    Search
  },
  setup() {
    const router = useRouter()

    // 状态选项
    const statusOptions = [
      { value: 'pending', label: '待处理' },
      { value: 'confirmed', label: '已确认' },
      { value: 'assigned', label: '已分配工程师' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]

    // 数据加载状态
    const loading = ref(false)

    // 预约列表数据
    const bookingList = ref([])

    // 分页信息
    const pagination = reactive({
      page: 1,
      limit: 15,
      total: 0
    })

    // 筛选条件
    const filters = reactive({
      search: '',
      status: '',
      dateRange: null,
      start_date: '',
      end_date: ''
    })

    // 当前操作的预约
    const currentBooking = ref({})

    // 工程师列表
    const engineers = ref([])

    // 状态更新对话框
    const statusDialog = reactive({
      visible: false,
      title: '更新预约状态',
      loading: false
    })

    // 状态更新表单
    const statusForm = reactive({
      status: '',
      engineer_id: null,
      device_id: '',
      device_model: '',
      device_sn: '',
      cancel_reason: ''
    })

    // 获取预约列表
    const fetchBookings = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          start_date: filters.start_date,
          end_date: filters.end_date,
          // 可能需要添加排序参数
          // sort_by: 'created_at',
          // sort_order: 'desc'
        }
        // 使用导入的 API 函数
        const response = await getInstallationBookings(params)
        // 假设后端返回的数据结构是 { data: [], meta: { total: ..., current_page: ..., per_page: ... } }
        // 或者根据实际返回调整
        if (response.data && response.meta) {
          bookingList.value = response.data.map(booking => ({
            ...booking,
            // 可以在这里预处理一些显示文本，如果后端没提供
            status_text: getStatusText(booking.status),
            package_type_text: getPackageTypeText(booking.package_type),
            user_display_name: booking.user?.name || booking.user?.nickname || booking.contact_name, // 尝试获取用户名称
            user_avatar: booking.user?.avatar || null, // 尝试获取用户头像
            referrer_display_name: booking.referrer?.name || booking.referrer?.nickname || '-', // 尝试获取推荐人名称
          }))
          pagination.total = response.meta.total
        } else if (Array.isArray(response.data)) { // 兼容直接返回数组的情况
          bookingList.value = response.data.map(/* ... 同上 ... */)
          pagination.total = response.data.length // 可能需要后端返回 total
        } else {
           bookingList.value = []
           pagination.total = 0
        }

      } catch (error) {
        console.error('获取预约列表失败:', error)
        ElMessage.error('获取预约列表失败')
        bookingList.value = []
        pagination.total = 0
      } finally {
        loading.value = false
      }
    }

    // 获取工程师列表
    const fetchEngineers = async () => {
      try {
        // 使用工程师API获取可用工程师列表
        const response = await engineerApi.getAvailableEngineers()

        if (response.data && response.code === 0) {
          // 处理工程师数据，添加display_name属性
          engineers.value = (response.data || []).map(engineer => ({
            ...engineer,
            display_name: engineer.name,
            wechat_avatar: engineer.avatar || null
          }))
        } else {
          console.error('获取工程师列表失败:', response.data?.message)
          ElMessage.warning('获取工程师列表失败，请重试')
          // 使用空列表
          engineers.value = []
        }
      } catch (error) {
        console.error('获取工程师列表失败:', error)
        ElMessage.warning('获取工程师列表失败，请重试')
        engineers.value = []
      }
    }

    // 查询按钮点击事件
    const handleSearch = () => {
      pagination.page = 1 // 重置到第一页
      fetchBookings()
    }

    // 重置筛选条件
    const resetFilters = () => {
      filters.search = ''
      filters.status = ''
      filters.dateRange = null
      filters.start_date = ''
      filters.end_date = ''
      pagination.page = 1
      fetchBookings()
    }

    // 监听日期范围变化
    watch(() => filters.dateRange, (newVal) => {
      filters.start_date = newVal ? newVal[0] : ''
      filters.end_date = newVal ? newVal[1] : ''
    })

    // 分页大小变化
    const handleSizeChange = (val) => {
      pagination.limit = val
      fetchBookings()
    }

    // 页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val
      fetchBookings()
    }

    // 查看详情
    const handleViewDetails = (row) => {
      router.push({ name: 'InstallationBookingDetail', params: { id: row.id } }) // 确认路由名称
    }

    // 打开状态更新对话框
    const handleUpdateStatus = (row) => {
      currentBooking.value = { ...row } // 复制一份，避免直接修改列表数据
      // 重置表单
      statusForm.status = '' // 清空目标状态
      statusForm.engineer_id = row.engineer_id || null
      statusForm.device_id = row.device_id || ''
      statusForm.device_model = row.device_model || ''
      statusForm.device_sn = row.device_sn || ''
      statusForm.cancel_reason = row.cancel_reason || ''

      statusDialog.visible = true
      statusDialog.loading = false

      // 如果需要选择工程师，在这里获取工程师列表
      if (engineers.value.length === 0) {
        fetchEngineers()
      }
    }

    // 处理分配工程师
    const handleAssignEngineer = (row) => {
      if (!canAssignEngineer(row)) {
        ElMessage.warning('预约未支付，无法派工程师')
        return
      }
      currentBooking.value = { ...row } // 复制一份，避免直接修改列表数据
      // 重置表单
      statusForm.status = 'assigned' // 直接设置状态为已分配工程师
      statusForm.engineer_id = row.engineer_id || null

      statusDialog.visible = true
      statusDialog.title = '分配工程师'
      statusDialog.loading = false

      // 获取工程师列表
      if (engineers.value.length === 0) {
        fetchEngineers()
      }
    }

    // 提交状态更新
    const submitStatusUpdate = async () => {
        if (!statusForm.status) {
            ElMessage.warning('请选择要更新的状态');
            return;
        }
        if (statusForm.status === 'assigned' && !statusForm.engineer_id) {
            ElMessage.warning('请选择工程师');
            return;
        }
        if (statusForm.status === 'assigned' && !isBookingPaid(currentBooking.value)) {
            ElMessage.warning('预约未支付，无法派工程师');
            return;
        }
        if (statusForm.status === 'cancelled' && !statusForm.cancel_reason) {
            ElMessage.warning('请输入取消原因');
            return;
        }

        statusDialog.loading = true;
        try {
            const updateData = {
                status: statusForm.status,
                // 根据选择的状态，包含必要的额外字段
                ...(statusForm.status === 'assigned' && { engineer_id: statusForm.engineer_id }),
                ...(statusForm.status === 'completed' && {
                    device_id: statusForm.device_id,
                    device_model: statusForm.device_model,
                    device_sn: statusForm.device_sn,
                }),
                ...(statusForm.status === 'cancelled' && { cancellation_reason: statusForm.cancel_reason }),
            };

            // 使用导入的 API 函数
            await updateBookingStatus(currentBooking.value.id, updateData);

            ElMessage.success('状态更新成功');
            statusDialog.visible = false;
            // 刷新列表
            fetchBookings();
        } catch (error) {
            console.error('更新状态失败:', error);
            ElMessage.error(error.message || '更新状态失败');
        } finally {
            statusDialog.loading = false;
        }
    }

    // 获取状态对应的文本
    const getStatusText = (status) => {
      const option = statusOptions.find(opt => opt.value === status)
      return option ? option.label : status
    }

    // 获取套餐类型文本 (示例)
    const getPackageTypeText = (type) => {
      // 这里应该根据实际的套餐类型值返回对应的文本
      // 例如： if (type === 'A') return '基础套餐';
      return type || '未知'
    }

    // 获取可用的状态选项 (例如，不能从已完成跳回待处理)
    const isBookingPaid = (booking) => (booking?.payment_status || '').toLowerCase() === 'paid'

    const getAvailableStatusOptions = (currentStatus) => {
      const booking = currentBooking.value || {}
      return statusOptions.filter(opt => {
        if (opt.value === currentStatus) return false
        if (opt.value === 'assigned' && !isBookingPaid(booking)) return false
        return true
      })
    }

    const canAssignEngineer = (booking) => {
      if (!booking) return false
      const status = booking.status
      const allowedStatus = ['pending', 'confirmed', 'assigned']
      return allowedStatus.includes(status) && isBookingPaid(booking)
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return '-'
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-')
    }

    // 页面加载时获取数据
    onMounted(() => {
      fetchBookings()
      // 可能需要在这里获取初始的工程师列表或其他数据
      // fetchEngineers()
    })

    return {
      loading,
      bookingList,
      pagination,
      filters,
      statusOptions,
      statusDialog,
      currentBooking,
      statusForm,
      engineers,
      fetchBookings,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange,
      handleViewDetails,
      handleUpdateStatus,
      handleAssignEngineer,
      submitStatusUpdate,
      formatDateTime,
      getStatusType,
      getStatusText,
      getAvailableStatusOptions,
      canAssignEngineer,
    }
  }
}
</script>

<style scoped>
.installation-bookings-page {
  padding: 20px;
}

.card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-body {
  padding: 20px;
}

.filter-form {
  margin-top: 15px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-info {
  display: flex;
  align-items: center;
}

.engineer-option {
  display: flex;
  align-items: center;
}

.engineer-phone {
  color: #909399;
  margin-left: 10px;
  font-size: 12px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
