<template>
  <div class="orders-container">
    <div class="page-header">
      <h1>支付订单管理</h1>
      <div class="actions">
        <el-button type="primary" @click="exportOrders">导出订单</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="filter-container">
      <el-form :inline="true" :model="listQuery" class="form-inline">
        <el-form-item label="关键词">
          <el-input v-model="listQuery.keyword" placeholder="订单号/收件人/手机号" clearable @keyup.enter.native="handleFilter" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="listQuery.status" placeholder="全部" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="listQuery.pay_status" placeholder="全部" clearable>
            <el-option v-for="item in payStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单数据表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column prop="order_no" label="订单号" min-width="180" />
      <el-table-column prop="product_name" label="商品" min-width="180" />
      <el-table-column prop="total_amount" label="订单金额" width="120">
        <template slot-scope="{row}">
          <span>¥{{ row.total_amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="receiver_name" label="收货人" width="120" />
      <el-table-column prop="receiver_phone" label="手机号" width="140" />
      <el-table-column prop="payment_method" label="支付方式" width="120">
        <template slot-scope="{row}">
          <el-tag v-if="row.payment_method === 'wechat'" type="success">微信支付</el-tag>
          <el-tag v-else-if="row.payment_method === 'alipay'" type="primary">支付宝</el-tag>
          <el-tag v-else>{{ row.payment_method }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status_text" label="订单状态" width="120">
        <template slot-scope="{row}">
          <el-tag v-if="row.status === 0" type="info">待付款</el-tag>
          <el-tag v-else-if="row.status === 1" type="warning">待发货</el-tag>
          <el-tag v-else-if="row.status === 2" type="primary">已发货</el-tag>
          <el-tag v-else-if="row.status === 3" type="success">已完成</el-tag>
          <el-tag v-else-if="row.status === 4 || row.status === 5" type="danger">{{ row.status_text }}</el-tag>
          <el-tag v-else>{{ row.status_text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="refund_status_text" label="退款状态" width="120">
        <template slot-scope="{row}">
          <span v-if="row.refund_status === 0">-</span>
          <el-tag v-else-if="row.refund_status === 1" type="warning">申请中</el-tag>
          <el-tag v-else-if="row.refund_status === 2" type="success">已退款</el-tag>
          <el-tag v-else-if="row.refund_status === 3" type="danger">已拒绝</el-tag>
          <el-tag v-else>{{ row.refund_status_text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" size="mini" @click="handleDetail(row)">详情</el-button>
          <el-button v-if="row.status === 1" type="text" size="mini" @click="handleShip(row)">发货</el-button>
          <el-button v-if="row.status === 0" type="text" size="mini" @click="handleCancel(row)">取消</el-button>
          <el-button v-if="row.status === 2" type="text" size="mini" @click="handleComplete(row)">确认收货</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page.sync="listQuery.page"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="listQuery.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      />
    </div>

    <!-- 发货对话框 -->
    <el-dialog title="订单发货" :visible.sync="shipDialogVisible" width="500px">
      <el-form :model="shipForm" label-width="100px" :rules="shipRules" ref="shipForm">
        <el-form-item label="订单号">
          <span>{{ currentOrder.order_no }}</span>
        </el-form-item>
        <el-form-item label="物流公司" prop="ship_area_name">
          <el-select v-model="shipForm.ship_area_name" placeholder="请选择物流公司">
            <el-option label="顺丰快递" value="顺丰快递" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通快递" value="圆通快递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="EMS" value="EMS" />
            <el-option label="邮政快递" value="邮政快递" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="ship_area_id">
          <el-input v-model="shipForm.ship_area_id" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShip">确认发货</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrderList',
  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        keyword: '',
        status: null,
        pay_status: null,
        start_date: '',
        end_date: '',
        sort: 'created_at',
        order: 'desc'
      },
      dateRange: [],
      statusOptions: [
        { label: '待付款', value: 0 },
        { label: '待发货', value: 1 },
        { label: '已发货', value: 2 },
        { label: '已完成', value: 3 },
        { label: '已取消', value: 4 },
        { label: '已关闭', value: 5 }
      ],
      payStatusOptions: [
        { label: '未支付', value: 0 },
        { label: '已支付', value: 1 }
      ],
      shipDialogVisible: false,
      currentOrder: {},
      shipForm: {
        ship_area_name: '',
        ship_area_id: ''
      },
      shipRules: {
        ship_area_name: [
          { required: true, message: '请选择物流公司', trigger: 'change' }
        ],
        ship_area_id: [
          { required: true, message: '请输入物流单号', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      // 调用获取订单列表API
      this.$http.get('/api/admin/payment/orders', { params: this.listQuery })
        .then(response => {
          this.list = response.data.data
          this.total = response.data.total
          this.listLoading = false
        })
        .catch(error => {
          console.error('获取订单列表失败', error)
          this.listLoading = false
          this.$message.error('获取订单列表失败')
        })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetFilter() {
      this.listQuery = {
        page: 1,
        limit: 20,
        keyword: '',
        status: null,
        pay_status: null,
        start_date: '',
        end_date: '',
        sort: 'created_at',
        order: 'desc'
      }
      this.dateRange = []
      this.getList()
    },
    handleSizeChange(val) {
      this.listQuery.limit = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    handleDateRangeChange(dates) {
      if (dates) {
        this.listQuery.start_date = dates[0]
        this.listQuery.end_date = dates[1]
      } else {
        this.listQuery.start_date = ''
        this.listQuery.end_date = ''
      }
    },
    handleDetail(row) {
      this.$router.push({ name: 'PaymentOrderDetail', params: { id: row.id } })
    },
    handleShip(row) {
      this.currentOrder = row
      this.shipForm = {
        ship_area_name: '',
        ship_area_id: ''
      }
      this.shipDialogVisible = true
    },
    submitShip() {
      this.$refs.shipForm.validate(valid => {
        if (valid) {
          this.$http.post(`/api/admin/payment/orders/${this.currentOrder.id}/ship`, this.shipForm)
            .then(response => {
              this.$message.success('订单发货成功')
              this.shipDialogVisible = false
              this.getList()
            })
            .catch(error => {
              console.error('订单发货失败', error)
              this.$message.error('订单发货失败: ' + (error.response?.data?.message || '未知错误'))
            })
        }
      })
    },
    handleCancel(row) {
      this.$confirm('确认取消此订单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http.post(`/api/admin/payment/orders/${row.id}/cancel`)
          .then(response => {
            this.$message.success('订单取消成功')
            this.getList()
          })
          .catch(error => {
            console.error('订单取消失败', error)
            this.$message.error('订单取消失败: ' + (error.response?.data?.message || '未知错误'))
          })
      }).catch(() => {})
    },
    handleComplete(row) {
      this.$confirm('确认将此订单标记为已完成?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http.post(`/api/admin/payment/orders/${row.id}/confirm`)
          .then(response => {
            this.$message.success('操作成功')
            this.getList()
          })
          .catch(error => {
            console.error('操作失败', error)
            this.$message.error('操作失败: ' + (error.response?.data?.message || '未知错误'))
          })
      }).catch(() => {})
    },
    exportOrders() {
      this.$http.get('/api/admin/payment/orders/export', { 
        params: this.listQuery,
        responseType: 'blob'
      })
        .then(response => {
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `订单数据_${new Date().toLocaleDateString()}.xlsx`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
        .catch(error => {
          console.error('导出订单失败', error)
          this.$message.error('导出订单失败')
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.orders-container {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .filter-container {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .pagination-container {
    margin-top: 20px;
    text-align: right;
  }
}
</style> 