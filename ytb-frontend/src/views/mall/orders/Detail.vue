<template>
  <div class="app-container">
    <div v-loading="loading" class="order-detail-container">
      <!-- 返回按钮 -->
      <div class="back-btn">
        <el-button icon="ArrowLeft" @click="goBack">返回列表</el-button>
      </div>
      
      <!-- 订单基本信息 -->
      <el-card class="box-card" v-if="order">
        <template #header>
          <div class="card-header">
            <span>订单基本信息</span>
            <div class="order-actions">
              <el-button 
                v-if="order.status === 2" 
                type="primary" 
                size="small" 
                @click="handleShip(order.id)"
              >
                发货
              </el-button>
              <el-button 
                v-if="order.status === 3" 
                type="success" 
                size="small" 
                @click="handleConfirm(order.id)"
              >
                确认收货
              </el-button>
              <el-button 
                v-if="order.status === 1 || order.status === 2" 
                type="danger" 
                size="small" 
                @click="handleCancel(order.id)"
              >
                取消订单
              </el-button>
            </div>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ order.order_id }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(order.status)">{{ order.status_text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPayStatusType(order.pay_status)">{{ order.pay_status_text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发货状态">
            <el-tag :type="getShipStatusType(order.ship_status)">{{ order.ship_status_text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单创建时间">{{ order.create_time }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ order.payment_time || '未支付' }}</el-descriptions-item>
          <el-descriptions-item label="订单总额">¥{{ order.order_amount }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥{{ order.order_pmt }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethod(order.payment_code) }}</el-descriptions-item>
          <el-descriptions-item label="订单备注">{{ order.memo || '无' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 净水器充值订单信息（如果存在） -->
      <el-card class="box-card" v-if="order && order.is_water_recharge">
        <template #header>
          <div class="card-header">
            <span>净水器充值信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ order.device_number }}</el-descriptions-item>
          <el-descriptions-item label="计费模式">
            <el-tag :type="order.billing_mode === '1' ? 'primary' : 'success'">
              {{ order.billing_mode === '1' ? '流量计费' : '包年计费' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="充值金额">¥{{ order.money }}</el-descriptions-item>
          <el-descriptions-item label="充值类型">
            <el-tag :type="order.surrogate_type === '1' ? 'warning' : 'info'">
              {{ order.surrogate_type === '1' ? '代充' : '自充' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="order.flow" label="充值流量">{{ order.flow }}L</el-descriptions-item>
          <el-descriptions-item v-if="order.time_gross" label="充值时长">{{ order.time_gross }}天</el-descriptions-item>
          <el-descriptions-item label="提成金额">
            <span class="commission-amount">¥{{ calculateCommission(order.money) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 设备信息 -->
        <div v-if="order.device_info" class="device-info-section">
          <h4>设备信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备状态">
              <el-tag :type="getDeviceStatusType(order.device_info.status)">
                {{ order.device_info.status_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="网络状态">
              <el-tag :type="order.device_info.network_status === '1' ? 'success' : 'info'">
                {{ order.device_info.network_status === '1' ? '在线' : '离线' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="剩余流量">{{ order.device_info.surplus_flow || 0 }}L</el-descriptions-item>
            <el-descriptions-item label="剩余天数">{{ order.device_info.remaining_days || 0 }}天</el-descriptions-item>
            <el-descriptions-item label="累计滤水量">{{ order.device_info.cumulative_filtration_flow || 0 }}L</el-descriptions-item>
            <el-descriptions-item label="最后上线时间">{{ order.device_info.last_online_time || '未知' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
      
      <!-- 收货信息 -->
      <el-card class="box-card" v-if="order && !order.is_water_recharge">
        <template #header>
          <div class="card-header">
            <span>收货信息</span>
            <el-button 
              v-if="order.ship_status === 1" 
              type="primary" 
              size="small" 
              icon="Edit" 
              @click="handleEditAddress"
            >
              修改
            </el-button>
          </div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="收货人">{{ order.ship_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.ship_mobile }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ order.city }} {{ order.ship_address }}</el-descriptions-item>
          <el-descriptions-item v-if="order.ship_status > 1" label="物流公司">{{ order.ship_area_name }}</el-descriptions-item>
          <el-descriptions-item v-if="order.ship_status > 1" label="物流单号">{{ order.ship_area_id }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 订单商品 -->
      <el-card class="box-card" v-if="order">
        <template #header>
          <div class="card-header">
            <span>订单商品</span>
          </div>
        </template>
        <el-table :data="order.items" border style="width: 100%">
          <el-table-column label="商品图片" width="100" align="center">
            <template #default="scope">
              <el-image
                v-if="scope.row.image_url"
                style="width: 60px; height: 60px"
                :src="scope.row.image_url"
                :preview-src-list="[scope.row.image_url]"
                fit="cover"
              />
              <span v-else>无图片</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="150" />
          <el-table-column prop="spec_text" label="规格" width="120" />
          <el-table-column label="单价" width="100" align="center">
            <template #default="scope">
              ¥{{ scope.row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="nums" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="100" align="center">
            <template #default="scope">
              ¥{{ scope.row.amount }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status_text }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- 修改收货地址弹窗 -->
    <el-dialog
      title="修改收货信息"
      v-model="addressDialogVisible"
      width="500px"
    >
      <el-form 
        ref="addressFormRef"
        :model="addressForm"
        :rules="addressRules"
        label-width="100px"
      >
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
          <el-input 
            v-model="addressForm.ship_address" 
            type="textarea" 
            rows="3"
            placeholder="请输入详细地址" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddressForm">确认</el-button>
        </span>
      </template>
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
        <el-form-item label="物流公司" prop="ship_area_name">
          <el-input v-model="shipForm.ship_area_name" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="物流单号" prop="ship_area_id">
          <el-input v-model="shipForm.ship_area_id" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShipForm">确认发货</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as orderApi from '../../../api/order';

export default {
  name: 'OrderDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const order = ref(null);
    
    // 收货地址表单
    const addressDialogVisible = ref(false);
    const addressFormRef = ref(null);
    const addressForm = reactive({
      ship_name: '',
      ship_mobile: '',
      city: '',
      ship_address: ''
    });
    const addressRules = {
      ship_name: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
      ship_mobile: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
      city: [{ required: true, message: '请输入所在城市', trigger: 'blur' }],
      ship_address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
    };
    
    // 发货表单
    const shipDialogVisible = ref(false);
    const shipFormRef = ref(null);
    const shipForm = reactive({
      ship_area_name: '',
      ship_area_id: ''
    });
    const shipRules = {
      ship_area_name: [{ required: true, message: '请输入物流公司', trigger: 'blur' }],
      ship_area_id: [{ required: true, message: '请输入物流单号', trigger: 'blur' }]
    };
    
    // 获取订单详情
    const fetchOrderDetail = (id) => {
      loading.value = true;
      
      orderApi.getOrderDetail(id)
        .then(response => {
          if (response.code === 0) {
            order.value = response.data;
          } else {
            ElMessage.error(response.data.message || '获取订单详情失败');
          }
        })
        .catch(error => {
          console.error('获取订单详情失败:', error);
          ElMessage.error('获取订单详情失败');
        })
        .finally(() => {
          loading.value = false;
        });
    };
    
    // 返回列表
    const goBack = () => {
      router.push('/mall/orders');
    };
    
    // 修改收货地址
    const handleEditAddress = () => {
      if (order.value) {
        addressForm.ship_name = order.value.ship_name;
        addressForm.ship_mobile = order.value.ship_mobile;
        addressForm.city = order.value.city;
        addressForm.ship_address = order.value.ship_address;
        addressDialogVisible.value = true;
      }
    };
    
    // 提交修改收货地址
    const submitAddressForm = () => {
      addressFormRef.value.validate((valid) => {
        if (valid) {
          orderApi.updateOrderAddress(order.value.id, addressForm)
            .then(response => {
              if (response.code === 0) {
                ElMessage.success('收货信息更新成功');
                addressDialogVisible.value = false;
                fetchOrderDetail(order.value.id);
              } else {
                ElMessage.error(response.data.message || '收货信息更新失败');
              }
            })
            .catch(error => {
              console.error('收货信息更新失败:', error);
              ElMessage.error('收货信息更新失败');
            });
        }
      });
    };
    
    // 发货处理
    const handleShip = (id) => {
      shipForm.ship_area_name = '';
      shipForm.ship_area_id = '';
      shipDialogVisible.value = true;
    };
    
    // 提交发货
    const submitShipForm = () => {
      shipFormRef.value.validate((valid) => {
        if (valid) {
          orderApi.shipOrder(order.value.id, shipForm)
            .then(response => {
              if (response.code === 0) {
                ElMessage.success('订单发货成功');
                shipDialogVisible.value = false;
                fetchOrderDetail(order.value.id);
              } else {
                ElMessage.error(response.data.message || '订单发货失败');
              }
            })
            .catch(error => {
              console.error('订单发货失败:', error);
              ElMessage.error('订单发货失败');
            });
        }
      });
    };
    
    // 确认收货
    const handleConfirm = (id) => {
      ElMessageBox.confirm(
        '确认将订单标记为已完成吗？',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        orderApi.confirmOrder(id)
          .then(response => {
            if (response.code === 0) {
              ElMessage.success('订单确认完成成功');
              fetchOrderDetail(id);
            } else {
              ElMessage.error(response.data.message || '订单确认完成失败');
            }
          })
          .catch(error => {
            console.error('订单确认完成失败:', error);
            ElMessage.error('订单确认完成失败');
          });
      });
    };
    
    // 取消订单
    const handleCancel = (id) => {
      ElMessageBox.confirm(
        '确认取消该订单吗？如果订单已支付，将会自动退款！',
        '警告',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        orderApi.cancelOrder(id)
          .then(response => {
            if (response.code === 0) {
              ElMessage.success('订单取消成功');
              fetchOrderDetail(id);
            } else {
              ElMessage.error(response.data.message || '订单取消失败');
            }
          })
          .catch(error => {
            console.error('订单取消失败:', error);
            ElMessage.error('订单取消失败');
          });
      });
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        1: 'warning',  // 待付款
        2: 'primary',  // 待发货
        3: 'info',     // 已发货
        4: 'success',  // 已完成
        5: 'danger',   // 申请退款
        6: 'info',     // 退款完成
        7: 'danger'    // 已取消
      };
      return statusMap[status] || 'info';
    };
    
    // 获取支付状态类型
    const getPayStatusType = (status) => {
      const statusMap = {
        1: 'warning',  // 未付款
        2: 'success',  // 已付款
        3: 'info'      // 已退款
      };
      return statusMap[status] || 'info';
    };
    
    // 获取发货状态类型
    const getShipStatusType = (status) => {
      const statusMap = {
        1: 'warning',  // 未发货
        2: 'success',  // 已发货
        3: 'info'      // 已退货
      };
      return statusMap[status] || 'info';
    };
    
    // 获取支付方式文本
    const getPaymentMethod = (code) => {
      const paymentMap = {
        'wechat': '微信支付',
        'alipay': '支付宝',
        'bank': '银行转账',
        'cod': '货到付款'
      };
      return paymentMap[code] || code || '未知';
    };
    
    // 计算提成金额
    const calculateCommission = (money) => {
      // 这里需要根据实际的业务逻辑来计算提成金额
      return money * 0.3; // 30%的提成比例
    };
    
    // 获取设备状态类型
    const getDeviceStatusType = (status) => {
      const statusMap = {
        1: 'success',  // 在线
        2: 'info',     // 离线
        3: 'warning',  // 故障
        4: 'danger'    // 维护
      };
      return statusMap[status] || 'info';
    };
    
    onMounted(() => {
      const orderId = route.params.id;
      if (orderId) {
        fetchOrderDetail(orderId);
      } else {
        ElMessage.error('订单ID不存在');
        router.push('/mall/orders');
      }
    });
    
    return {
      loading,
      order,
      addressDialogVisible,
      addressFormRef,
      addressForm,
      addressRules,
      shipDialogVisible,
      shipFormRef,
      shipForm,
      shipRules,
      goBack,
      handleEditAddress,
      submitAddressForm,
      handleShip,
      submitShipForm,
      handleConfirm,
      handleCancel,
      getStatusType,
      getPayStatusType,
      getShipStatusType,
      getPaymentMethod,
      calculateCommission,
      getDeviceStatusType
    };
  }
};
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.device-info-section {
  margin-top: 20px;
}

.device-info-section h4 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.commission-amount {
  font-weight: bold;
  color: #f56c6c;
  font-size: 16px;
}
</style> 