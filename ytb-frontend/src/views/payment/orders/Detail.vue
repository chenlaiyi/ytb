<template>
  <div class="order-detail-container">
    <div class="page-header">
      <div class="title-wrapper">
        <el-page-header @back="goBack" content="订单详情" />
        <h2>订单号: {{ order.order_no }}</h2>
      </div>
      <div class="actions">
        <el-button v-if="order.status === 1" type="primary" @click="handleShip">发货</el-button>
        <el-button v-if="order.status === 0" type="danger" @click="handleCancel">取消订单</el-button>
        <el-button v-if="order.status === 2" type="success" @click="handleComplete">确认收货</el-button>
        <el-button type="warning" @click="handleEditAddress" :disabled="order.status !== 0 && order.status !== 1">修改地址</el-button>
      </div>
    </div>

    <el-card class="box-card" v-loading="loading">
      <div slot="header" class="card-header">
        <span>订单状态</span>
      </div>
      <el-steps :active="getStatusStep(order.status)" finish-status="success" align-center>
        <el-step title="待付款" description=""></el-step>
        <el-step title="待发货" description=""></el-step>
        <el-step title="已发货" description=""></el-step>
        <el-step title="已完成" description=""></el-step>
      </el-steps>

      <div class="status-info">
        <el-tag :type="getStatusType(order.status)">{{ order.status_text }}</el-tag>
        <span class="status-time" v-if="order.paid_at">支付时间: {{ order.paid_at }}</span>
        <span class="status-time" v-if="order.shipped_at">发货时间: {{ order.shipped_at }}</span>
        <span class="status-time" v-if="order.completed_at">完成时间: {{ order.completed_at }}</span>
        <span class="status-time" v-if="order.cancelled_at">取消时间: {{ order.cancelled_at }}</span>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="box-card">
          <div slot="header" class="card-header">
            <span>收货信息</span>
          </div>
          <div class="info-item">
            <span class="label">收货人: </span>
            <span class="value">{{ order.receiver_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话: </span>
            <span class="value">{{ order.receiver_phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货地址: </span>
            <span class="value">{{ getFullAddress() }}</span>
          </div>
          <div class="info-item">
            <span class="label">备注: </span>
            <span class="value">{{ order.remark || '无' }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="box-card">
          <div slot="header" class="card-header">
            <span>支付信息</span>
          </div>
          <div class="info-item">
            <span class="label">支付方式: </span>
            <span class="value">{{ getPaymentMethodText() }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付状态: </span>
            <span class="value">
              <el-tag :type="order.paid_at ? 'success' : 'info'">
                {{ order.paid_at ? '已支付' : '未支付' }}
              </el-tag>
            </span>
          </div>
          <div class="info-item" v-if="order.payment_no">
            <span class="label">支付单号: </span>
            <span class="value">{{ order.payment_no }}</span>
          </div>
          <div class="info-item" v-if="order.transaction_id">
            <span class="label">交易号: </span>
            <span class="value">{{ order.transaction_id }}</span>
          </div>
          <div class="info-item" v-if="order.paid_at">
            <span class="label">支付时间: </span>
            <span class="value">{{ order.paid_at }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="box-card">
      <div slot="header" class="card-header">
        <span>订单商品</span>
      </div>
      <el-table :data="order.items || []" border style="width: 100%">
        <el-table-column prop="product_name" label="商品名称" min-width="180" />
        <el-table-column prop="product_img" label="商品图片" width="100">
          <template slot-scope="{row}">
            <el-image 
              v-if="row.product_img" 
              style="width: 60px; height: 60px"
              :src="row.product_img" 
              fit="cover"
              :preview-src-list="[row.product_img]">
            </el-image>
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="product_price" label="单价" width="100">
          <template slot-scope="{row}">
            <span>¥{{ row.product_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="product_num" label="数量" width="80" />
        <el-table-column prop="product_amount" label="小计" width="100">
          <template slot-scope="{row}">
            <span>¥{{ row.product_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="{row}">
            <el-tag :type="getItemStatusType(row.status)">{{ getItemStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="order-amount">
        <div class="amount-item">
          <span>商品总额: </span>
          <span class="price">¥{{ order.total_amount || 0 }}</span>
        </div>
        <div class="amount-item" v-if="order.discount_amount && order.discount_amount > 0">
          <span>优惠金额: </span>
          <span class="price">-¥{{ order.discount_amount }}</span>
        </div>
        <div class="amount-item" v-if="order.shipping_fee && order.shipping_fee > 0">
          <span>运费: </span>
          <span class="price">¥{{ order.shipping_fee }}</span>
        </div>
        <div class="amount-item total">
          <span>实付金额: </span>
          <span class="price highlight">¥{{ order.actual_amount || 0 }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="box-card" v-if="order.express_company && order.express_no">
      <div slot="header" class="card-header">
        <span>物流信息</span>
      </div>
      <div class="info-item">
        <span class="label">物流公司: </span>
        <span class="value">{{ order.express_company }}</span>
      </div>
      <div class="info-item">
        <span class="label">物流单号: </span>
        <span class="value">{{ order.express_no }}</span>
      </div>
      <div class="info-item" v-if="order.shipped_at">
        <span class="label">发货时间: </span>
        <span class="value">{{ order.shipped_at }}</span>
      </div>
    </el-card>

    <!-- 发货对话框 -->
    <el-dialog title="订单发货" :visible.sync="shipDialogVisible" width="500px">
      <el-form :model="shipForm" label-width="100px" :rules="shipRules" ref="shipForm">
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

    <!-- 修改地址对话框 -->
    <el-dialog title="修改收货地址" :visible.sync="addressDialogVisible" width="500px">
      <el-form :model="addressForm" label-width="100px" :rules="addressRules" ref="addressForm">
        <el-form-item label="收货人" prop="ship_name">
          <el-input v-model="addressForm.ship_name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="ship_mobile">
          <el-input v-model="addressForm.ship_mobile" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="所在城市" prop="city">
          <el-input v-model="addressForm.city" placeholder="请输入所在城市" />
        </el-form-item>
        <el-form-item label="详细地址" prop="ship_address">
          <el-input type="textarea" v-model="addressForm.ship_address" placeholder="请输入详细地址" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddress">确认修改</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrderDetail',
  data() {
    return {
      loading: true,
      order: {},
      shipDialogVisible: false,
      addressDialogVisible: false,
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
      },
      addressForm: {
        ship_name: '',
        ship_mobile: '',
        city: '',
        ship_address: ''
      },
      addressRules: {
        ship_name: [
          { required: true, message: '请输入收货人姓名', trigger: 'blur' }
        ],
        ship_mobile: [
          { required: true, message: '请输入联系电话', trigger: 'blur' }
        ],
        city: [
          { required: true, message: '请输入所在城市', trigger: 'blur' }
        ],
        ship_address: [
          { required: true, message: '请输入详细地址', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchOrderDetail()
  },
  methods: {
    fetchOrderDetail() {
      this.loading = true
      const orderId = this.$route.params.id
      
      this.$http.get(`/api/admin/payment/orders/${orderId}`)
        .then(response => {
          this.order = response.data.data
          this.loading = false
        })
        .catch(error => {
          console.error('获取订单详情失败', error)
          this.loading = false
          this.$message.error('获取订单详情失败: ' + (error.response?.data?.message || '未知错误'))
        })
    },
    goBack() {
      this.$router.push({ name: 'PaymentOrders' })
    },
    getFullAddress() {
      if (!this.order) return ''
      return [
        this.order.receiver_province,
        this.order.receiver_city,
        this.order.receiver_district,
        this.order.receiver_address
      ].filter(Boolean).join(' ')
    },
    getPaymentMethodText() {
      const methodMap = {
        'wechat': '微信支付',
        'alipay': '支付宝',
        'balance': '余额支付'
      }
      return methodMap[this.order.payment_method] || this.order.payment_method || '未知'
    },
    getStatusStep(status) {
      const stepMap = {
        0: 0, // 待付款
        1: 1, // 待发货
        2: 2, // 已发货
        3: 3, // 已完成
        4: 0, // 已取消
        5: 0  // 已关闭
      }
      return stepMap[status] || 0
    },
    getStatusType(status) {
      const typeMap = {
        0: 'info',     // 待付款
        1: 'warning',  // 待发货
        2: 'primary',  // 已发货
        3: 'success',  // 已完成
        4: 'danger',   // 已取消
        5: 'danger'    // 已关闭
      }
      return typeMap[status] || 'info'
    },
    getItemStatusText(status) {
      const statusMap = {
        0: '待付款',
        1: '待发货',
        2: '已发货',
        3: '已完成',
        4: '已取消'
      }
      return statusMap[status] || '未知状态'
    },
    getItemStatusType(status) {
      return this.getStatusType(status)
    },
    handleShip() {
      this.shipForm = {
        ship_area_name: '',
        ship_area_id: ''
      }
      this.shipDialogVisible = true
    },
    submitShip() {
      this.$refs.shipForm.validate(valid => {
        if (valid) {
          this.$http.post(`/api/admin/payment/orders/${this.order.id}/ship`, this.shipForm)
            .then(response => {
              this.$message.success('订单发货成功')
              this.shipDialogVisible = false
              this.fetchOrderDetail()
            })
            .catch(error => {
              console.error('订单发货失败', error)
              this.$message.error('订单发货失败: ' + (error.response?.data?.message || '未知错误'))
            })
        }
      })
    },
    handleCancel() {
      this.$confirm('确认取消此订单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http.post(`/api/admin/payment/orders/${this.order.id}/cancel`)
          .then(response => {
            this.$message.success('订单取消成功')
            this.fetchOrderDetail()
          })
          .catch(error => {
            console.error('订单取消失败', error)
            this.$message.error('订单取消失败: ' + (error.response?.data?.message || '未知错误'))
          })
      }).catch(() => {})
    },
    handleComplete() {
      this.$confirm('确认将此订单标记为已完成?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http.post(`/api/admin/payment/orders/${this.order.id}/confirm`)
          .then(response => {
            this.$message.success('操作成功')
            this.fetchOrderDetail()
          })
          .catch(error => {
            console.error('操作失败', error)
            this.$message.error('操作失败: ' + (error.response?.data?.message || '未知错误'))
          })
      }).catch(() => {})
    },
    handleEditAddress() {
      this.addressForm = {
        ship_name: this.order.receiver_name,
        ship_mobile: this.order.receiver_phone,
        city: this.order.receiver_city,
        ship_address: this.order.receiver_address
      }
      this.addressDialogVisible = true
    },
    submitAddress() {
      this.$refs.addressForm.validate(valid => {
        if (valid) {
          this.$http.post(`/api/admin/payment/orders/${this.order.id}/update-address`, this.addressForm)
            .then(response => {
              this.$message.success('收货地址修改成功')
              this.addressDialogVisible = false
              this.fetchOrderDetail()
            })
            .catch(error => {
              console.error('收货地址修改失败', error)
              this.$message.error('收货地址修改失败: ' + (error.response?.data?.message || '未知错误'))
            })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.order-detail-container {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .title-wrapper {
      h2 {
        margin-top: 10px;
        margin-bottom: 0;
      }
    }
  }
  
  .box-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .status-info {
      margin-top: 20px;
      text-align: center;
      
      .status-time {
        margin-left: 20px;
        color: #909399;
      }
    }
    
    .info-item {
      margin-bottom: 10px;
      
      .label {
        display: inline-block;
        width: 100px;
        color: #606266;
      }
      
      .value {
        color: #303133;
        font-weight: 500;
      }
    }
    
    .order-amount {
      margin-top: 20px;
      text-align: right;
      
      .amount-item {
        margin-bottom: 5px;
        
        .price {
          margin-left: 10px;
          color: #606266;
          font-weight: 500;
        }
        
        &.total {
          margin-top: 10px;
          font-size: 16px;
          
          .price.highlight {
            color: #f56c6c;
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style> 