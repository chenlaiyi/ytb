<template>
  <div class="installation-booking-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>安装预约管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="exportData">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="联系人/电话/地址" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable>
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付状态">
            <el-select v-model="filters.payment_status" placeholder="全部支付状态" clearable>
              <el-option v-for="item in paymentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预约日期">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
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

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="bookingList"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="120">
          <template #default="scope">
            <div class="user-info">
              <el-avatar
                :size="32"
                :src="scope.row.wechat_avatar || scope.row.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scope.row.user_display_name || scope.row.wechat_nickname || scope.row.name || 'User' + scope.row.user_id)}`"
                @error="() => handleAvatarError(scope.row)">
              </el-avatar>
              <span class="user-nickname">{{ scope.row.user_display_name || scope.row.wechat_nickname || scope.row.name || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="contact_name" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="install_address" label="安装地址" min-width="180" show-overflow-tooltip />
        <el-table-column label="预约日期" width="130">
          <template #default="scope">
            {{ formatDate(scope.row.install_time) }}
          </template>
        </el-table-column>
        <el-table-column label="套餐类型" width="120">
          <template #default="scope">
            {{ scope.row.package_type_text || scope.row.package_type }}
          </template>
        </el-table-column>
        <el-table-column label="费用明细" width="220" align="center">
          <template #default="scope">
            <div class="installation-fee-info">
              <div class="fee-breakdown">
                <div class="fee-line">
                  <span>安装费</span>
                  <span>¥{{ formatCurrency(scope.row.installation_fee) }}</span>
                </div>
                <div class="fee-line">
                  <span>套餐</span>
                  <span>¥{{ formatCurrency(scope.row.package_price) }}</span>
                </div>
                <div class="fee-line">
                  <span>押金</span>
                  <span>{{ getDepositLabel(scope.row) }}</span>
                </div>
                <div class="fee-line total">
                  <span>总计</span>
                  <span>¥{{ calculateTotalAmount(scope.row) }}</span>
                </div>
              </div>
              <div class="payment-status">
                <el-tag 
                  :type="getPaymentStatusType(scope.row.payment_status)" 
                  size="small"
                  effect="plain">
                  {{ getPaymentStatusLabel(scope.row.payment_status) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工程师" width="120">
          <template #default="scope">
            {{ scope.row.engineer_display_name || scope.row.engineer_nickname || scope.row.engineer_username || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewDetails(scope.row)">详情</el-button>
            <el-button size="small" type="warning" @click="updateStatus(scope.row)" v-if="scope.row.status !== 'completed' && scope.row.status !== 'cancelled'">更新状态</el-button>
            <el-button size="small" type="success" @click="assignEngineer(scope.row)" v-if="['pending', 'confirmed'].includes(scope.row.status)">派工程师</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusDialog.visible"
      title="更新预约状态"
      width="500px"
    >
      <el-form :model="statusDialog.form" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusDialog.form.current_status)">{{ getStatusLabel(statusDialog.form.current_status) }}</el-tag>
        </el-form-item>
        <el-form-item label="新状态">
          <el-select v-model="statusDialog.form.new_status" placeholder="请选择新状态">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.value === statusDialog.form.current_status"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工程师" v-if="statusDialog.form.new_status === 'assigned'">
          <el-select v-model="statusDialog.form.engineer_id" placeholder="请选择工程师">
            <el-option
              v-for="engineer in engineers"
              :key="engineer.id"
              :label="engineer.name"
              :value="engineer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="取消原因" v-if="statusDialog.form.new_status === 'cancelled'">
          <el-input
            v-model="statusDialog.form.cancel_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="statusDialog.form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusUpdate" :loading="statusDialog.loading">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预约详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="预约详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约编号">{{ currentBooking.booking_no }}</el-descriptions-item>
        <el-descriptions-item label="用户信息">
          <div class="user-info-detail">
            <el-avatar
              :size="40"
              :src="currentBooking.wechat_avatar || currentBooking.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentBooking.user_display_name || currentBooking.wechat_nickname || currentBooking.name || 'User' + currentBooking.user_id)}`"
              @error="() => handleDetailAvatarError()">
            </el-avatar>
            <div class="user-detail">
              <div>{{ currentBooking.user_display_name || currentBooking.wechat_nickname || currentBooking.name || '未知用户' }}</div>
              <div v-if="currentBooking.user_id" class="user-id">ID: {{ currentBooking.user_id }}</div>
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentBooking.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentBooking.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="安装地址">{{ currentBooking.install_address }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ formatDate(currentBooking.install_time) }}</el-descriptions-item>
        <el-descriptions-item label="套餐类型">{{ currentBooking.package_type_text || currentBooking.package_type }}</el-descriptions-item>
        <el-descriptions-item label="套餐价格">{{ currentBooking.package_price }} 元</el-descriptions-item>
        <el-descriptions-item label="安装费用">{{ currentBooking.installation_fee }} 元</el-descriptions-item>
        <el-descriptions-item label="押金">
          <span v-if="currentBooking.deposit_waived">免押</span>
          <span v-else>{{ formatCurrency(currentBooking.deposit_amount) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ calculateTotalAmount(currentBooking) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getPaymentStatusType(currentBooking.payment_status)">
            {{ getPaymentStatusLabel(currentBooking.payment_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间" v-if="currentBooking.payment_time">
          {{ formatDateTime(currentBooking.payment_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付方式" v-if="currentBooking.payment_method">
          {{ getPaymentMethodLabel(currentBooking.payment_method) }}
        </el-descriptions-item>
        <el-descriptions-item label="交易单号" v-if="currentBooking.transaction_id">
          {{ currentBooking.transaction_id }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentBooking.status)">{{ getStatusLabel(currentBooking.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工程师" v-if="currentBooking.engineer_id">{{ currentBooking.engineer_display_name || currentBooking.engineer_nickname || currentBooking.engineer_username || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentBooking.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(currentBooking.updated_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" v-if="currentBooking.remark">{{ currentBooking.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 派工程师对话框 -->
    <el-dialog
      v-model="engineerDialog.visible"
      title="派工程师"
      width="500px"
    >
      <el-form :model="engineerDialog.form" label-width="100px">
        <el-form-item label="预约编号">
          <span>{{ engineerDialog.form.booking_no }}</span>
        </el-form-item>
        <el-form-item label="联系人">
          <span>{{ engineerDialog.form.contact_name }}</span>
        </el-form-item>
        <el-form-item label="安装地址">
          <span>{{ engineerDialog.form.install_address }}</span>
        </el-form-item>
        <el-form-item label="预约时间">
          <span>{{ formatDateTime(engineerDialog.form.install_time) }}</span>
        </el-form-item>
        <el-form-item label="工程师" prop="engineer_id">
          <el-select v-model="engineerDialog.form.engineer_id" placeholder="请选择工程师" filterable>
            <el-option
              v-for="engineer in availableEngineers"
              :key="engineer.id"
              :label="`${engineer.name} (${getLevelLabel(engineer.level)})`"
              :value="engineer.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ engineer.name }}</span>
                <span>
                  <el-tag size="small" :type="getLevelType(engineer.level)">{{ getLevelLabel(engineer.level) }}</el-tag>
                  <el-tag size="small" type="info" style="margin-left: 5px">完成安装: {{ engineer.completed_installations || 0 }}</el-tag>
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="engineerDialog.form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="engineerDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignEngineer" :loading="engineerDialog.loading">确认派工</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import installationApi from '../../api/installationApi';
import engineerApi from '../../api/engineerApi';
import { formatDateTime, formatDate, getStatusType } from '../../utils/formatters';

export default {
  name: 'InstallationBooking',
  setup() {
    // 数据加载状态
    const loading = ref(false);

    // 预约列表数据
    const bookingList = ref([]);

    // 工程师列表
    const engineers = ref([]);

    // 可用工程师列表（用于派工）
    const availableEngineers = ref([]);

    // 分页信息
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    });

    // 搜索筛选
    const filters = reactive({
      keyword: '',
      status: '',
      payment_status: '',
      dateRange: null
    });

    // 状态选项
    const statusOptions = [
      { value: 'pending', label: '待处理' },
      { value: 'confirmed', label: '已确认' },
      { value: 'assigned', label: '已分配' },
      { value: 'in_progress', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ];

    // 支付状态选项
    const paymentStatusOptions = [
      { value: 'unpaid', label: '未支付' },
      { value: 'paid', label: '已支付' },
      { value: 'partial', label: '部分支付' },
      { value: 'refunded', label: '已退款' },
      { value: 'cancelled', label: '已取消' }
    ];

    // 状态更新对话框
    const statusDialog = reactive({
      visible: false,
      loading: false,
      form: {
        id: null,
        current_status: '',
        new_status: '',
        engineer_id: null,
        cancel_reason: '',
        remark: ''
      }
    });

    // 派工程师对话框
    const engineerDialog = reactive({
      visible: false,
      loading: false,
      form: {
        id: null,
        booking_no: '',
        contact_name: '',
        install_address: '',
        install_time: '',
        engineer_id: null,
        remark: ''
      }
    });

    // 详情对话框
    const detailDialog = reactive({
      visible: false
    });

    // 当前查看的预约
    const currentBooking = reactive({
      id: null,
      booking_no: '',
      contact_name: '',
      contact_phone: '',
      install_address: '',
      install_time: '',
      package_type: '',
      package_type_text: '',
      package_price: 0,
      installation_fee: 0,
      total_amount: 0,
      status: '',
      engineer_id: null,
      engineer_name: '',
      created_at: '',
      updated_at: '',
      cancel_reason: '',
      remark: '',
      payment_status: '',
      payment_time: '',
      payment_method: '',
      transaction_id: ''
    });

    // 获取预约列表
    const getBookingList = async () => {
      loading.value = true;
      try {
        // 构建请求参数
        const params = {
          page: pagination.page,
          per_page: pagination.limit,
          keyword: filters.keyword || undefined,
          status: filters.status || undefined,
          payment_status: filters.payment_status || undefined
        };

        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }

        const response = await installationApi.getBookingList(params);

        // 检查响应是否成功
        if (response && response.code === 0 && response.data) {
          const responseData = response.data;
          
          // Laravel分页响应格式处理
          if (responseData.data && Array.isArray(responseData.data)) {
            bookingList.value = responseData.data;
            pagination.total = responseData.total || 0;

          } else {
            console.error('响应数据格式错误:', responseData);
            ElMessage.error('响应数据格式错误');
            bookingList.value = [];
            pagination.total = 0;
          }
        } else {
          const errorMsg = (response && response.message) || '获取预约列表失败';
          console.error('API响应错误:', errorMsg, response);
          ElMessage.error(errorMsg);
          bookingList.value = [];
          pagination.total = 0;
        }
      } catch (error) {
        console.error('获取预约列表失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误响应:', error.response.data);
          
          if (error.response.status === 401) {
            ElMessage.error('认证失败，请重新登录');
          } else if (error.response.status === 403) {
            ElMessage.error('权限不足');
          } else {
            ElMessage.error('获取预约列表失败，请检查网络连接');
          }
        } else {
          ElMessage.error('网络错误，请检查网络连接');
        }
        bookingList.value = [];
        pagination.total = 0;
      } finally {
        loading.value = false;
      }
    };

    // 获取工程师列表
    const getEngineers = async () => {
      try {
        const response = await installationApi.getAvailableEngineers();

        // 检查响应是否成功
        if (response && response.code === 0 && response.data) {
          engineers.value = response.data || [];
        } else {
          const errorMsg = (response && response.message) || '获取工程师列表失败';
          console.error('工程师列表响应错误:', errorMsg, response);
          ElMessage.warning(errorMsg);
        }
      } catch (error) {
        console.error('获取工程师列表失败:', error);
        ElMessage.error('获取工程师列表失败，请检查网络连接');
      }
    };

    // 获取可用工程师列表（用于派工）
    const getAvailableEngineers = async () => {
      try {
        const response = await installationApi.getAvailableEngineers();

        // 检查响应是否成功
        if (response && response.code === 0 && response.data) {
          availableEngineers.value = response.data || [];
        } else {
          const errorMsg = (response && response.message) || '获取可用工程师列表失败';
          console.error('可用工程师列表响应错误:', errorMsg, response);
          ElMessage.warning(errorMsg);
        }
      } catch (error) {
        console.error('获取可用工程师列表失败:', error);
        ElMessage.error('获取可用工程师列表失败，请重试');
      }
    };

    // 查看详情
    const viewDetails = (row) => {
      // 处理头像地址
      const processedRow = { ...row };

      // 微信头像已经是完整URL，直接使用
      // 如果没有头像，生成默认头像
      if (!processedRow.wechat_avatar && processedRow.user_id) {
        const displayName = processedRow.user_display_name || processedRow.wechat_nickname || processedRow.name || 'User' + processedRow.user_id;
        processedRow.wechat_avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
      }

      Object.assign(currentBooking, processedRow);
      detailDialog.visible = true;
    };

    // 更新状态
    const updateStatus = (row) => {
      statusDialog.form.id = row.id;
      statusDialog.form.current_status = row.status;
      statusDialog.form.new_status = '';
      statusDialog.form.engineer_id = row.engineer_id;
      statusDialog.form.cancel_reason = '';
      statusDialog.form.remark = '';
      statusDialog.visible = true;
    };

    // 派工程师
    const assignEngineer = async (row) => {
      // 获取可用工程师列表
      await getAvailableEngineers();

      engineerDialog.form.id = row.id;
      engineerDialog.form.booking_no = row.booking_no;
      engineerDialog.form.contact_name = row.contact_name;
      engineerDialog.form.install_address = row.install_address;
      engineerDialog.form.install_time = row.install_time;
      engineerDialog.form.engineer_id = row.engineer_id || null;
      engineerDialog.form.remark = '';
      engineerDialog.visible = true;
    };

    // 提交派工程师
    const submitAssignEngineer = async () => {
      if (!engineerDialog.form.engineer_id) {
        ElMessage.warning('请选择工程师');
        return;
      }

      engineerDialog.loading = true;

      try {
        const response = await installationApi.assignEngineer(engineerDialog.form.id, {
          engineer_id: engineerDialog.form.engineer_id,
          remark: engineerDialog.form.remark
        });


        // 处理响应
        let responseData;

        // 先检查是否有效响应
        if (response.data && response.code === 0) {
          // 有效响应
          responseData = response.data;
        } else if (response && response.code === 0) {
          // 嵌套响应
          responseData = response.data;
        } else {
          // 无效响应
          const errorMsg = (response.data && response.data.message) ||
                          (response.data && response.data && response.data.message) ||
                          '派工失败';
          console.error('派工响应错误:', errorMsg, response);
          ElMessage.error(errorMsg);
          return;
        }

        // 成功处理
        ElMessage.success(responseData.message || '派工成功');
        engineerDialog.visible = false;
        getBookingList(); // 刷新列表
      } catch (error) {
        console.error('派工失败:', error);
        ElMessage.error('派工失败，请重试');
      } finally {
        engineerDialog.loading = false;
      }
    };

    // 提交状态更新
    const submitStatusUpdate = async () => {
      if (!statusDialog.form.new_status) {
        ElMessage.warning('请选择新状态');
        return;
      }

      if (statusDialog.form.new_status === 'assigned' && !statusDialog.form.engineer_id) {
        ElMessage.warning('请选择工程师');
        return;
      }

      if (statusDialog.form.new_status === 'cancelled' && !statusDialog.form.cancel_reason) {
        ElMessage.warning('请输入取消原因');
        return;
      }

      statusDialog.loading = true;

      try {
        const response = await installationApi.updateBookingStatus(statusDialog.form.id, {
          status: statusDialog.form.new_status,
          engineer_id: statusDialog.form.engineer_id,
          cancel_reason: statusDialog.form.cancel_reason,
          remark: statusDialog.form.remark
        });


        // 处理响应
        let responseData;

        // 先检查是否有效响应
        if (response.data && response.code === 0) {
          // 有效响应
          responseData = response.data;
        } else if (response && response.code === 0) {
          // 嵌套响应
          responseData = response.data;
        } else {
          // 无效响应
          const errorMsg = (response.data && response.data.message) ||
                          (response.data && response.data && response.data.message) ||
                          '状态更新失败';
          console.error('状态更新响应错误:', errorMsg, response);
          ElMessage.error(errorMsg);
          return;
        }

        // 成功处理
        ElMessage.success(responseData.message || '状态更新成功');
        statusDialog.visible = false;
        getBookingList(); // 刷新列表
      } catch (error) {
        console.error('更新状态失败:', error);
        ElMessage.error('更新状态失败，请重试');
      } finally {
        statusDialog.loading = false;
      }
    };

    // 导出数据
    const exportData = async () => {
      try {
        ElMessage.info('正在导出数据...');
        
        // 构建导出参数
        const params = {
          keyword: filters.keyword || undefined,
          status: filters.status || undefined,
          payment_status: filters.payment_status || undefined
        };

        // 添加日期范围
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0];
          params.end_date = filters.dateRange[1];
        }

        const response = await installationApi.exportBookingData(params);
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `安装预约数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success('导出成功');
      } catch (error) {
        console.error('导出失败:', error);
        ElMessage.error('导出失败，请重试');
      }
    };

    // 处理搜索
    const handleSearch = () => {
      pagination.page = 1;
      getBookingList();
    };

    // 重置筛选条件
    const resetFilters = () => {
      filters.keyword = '';
      filters.status = '';
      filters.payment_status = '';
      filters.dateRange = null;
      pagination.page = 1;
      getBookingList();
    };

    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getBookingList();
    };

    // 处理页码变化
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getBookingList();
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = {
        'pending': '待处理',
        'confirmed': '已确认',
        'assigned': '已分配',
        'in_progress': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    };

    // 获取支付状态标签
    const getPaymentStatusLabel = (paymentStatus) => {
      const statusMap = {
        'unpaid': '未支付',
        'paid': '已支付',
        'partial': '部分支付',
        'refunded': '已退款',
        'cancelled': '已取消'
      };
      return statusMap[paymentStatus] || '未支付';
    };

    // 获取支付状态类型（用于标签颜色）
    const getPaymentStatusType = (paymentStatus) => {
      const typeMap = {
        'unpaid': 'danger',
        'paid': 'success',
        'partial': 'warning',
        'refunded': 'info',
        'cancelled': 'info'
      };
      return typeMap[paymentStatus] || 'danger';
    };

    // 获取支付方式标签
    const getPaymentMethodLabel = (paymentMethod) => {
      const methodMap = {
        'wechat': '微信支付',
        'alipay': '支付宝',
        'bank_card': '银行卡',
        'cash': '现金',
        'transfer': '转账',
        'other': '其他'
      };
      return methodMap[paymentMethod] || paymentMethod || '未知';
    };

    const formatCurrency = (value) => {
      const num = Number(value || 0);
      return num.toFixed(2);
    };

    const getDepositLabel = (row) => {
      if (!row) return '¥0.00';
      if (row.deposit_waived) {
        return '免押';
      }
      return `¥${formatCurrency(row.deposit_amount)}`;
    };

    const calculateTotalAmount = (row) => {
      if (!row) return '0.00';
      if (row.total_amount) {
        return formatCurrency(row.total_amount);
      }
      const installationFee = Number(row.installation_fee || 0);
      const packagePrice = Number(row.package_price || 0);
      const depositAmount = row.deposit_waived ? 0 : Number(row.deposit_amount || 0);
      const total = installationFee + packagePrice + depositAmount;
      return formatCurrency(total);
    };

    // 获取工程师级别标签
    const getLevelLabel = (level) => {
      const levelMap = {
        'junior': '初级',
        'normal': '中级',
        'senior': '高级'
      };
      return levelMap[level] || level;
    };

    // 获取工程师级别类型（用于标签颜色）
    const getLevelType = (level) => {
      const typeMap = {
        'junior': 'info',
        'normal': 'success',
        'senior': 'warning'
      };
      return typeMap[level] || 'info';
    };

    // 页面加载时获取数据
    onMounted(() => {
      getBookingList();
      getEngineers();
      getAvailableEngineers();
    });

    // 头像加载错误处理
    const handleAvatarError = (row) => {
      console.error('头像加载失败:', row.wechat_avatar);
      // 生成基于用户名的默认头像
      if (row.user_id) {
        const name = row.user_display_name || row.wechat_nickname || row.name || 'User' + row.user_id;
        row.wechat_avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      } else {
        row.wechat_avatar = null;
        row.user_avatar = null;
      }
    };

    // 详情对话框头像错误处理
    const handleDetailAvatarError = () => {
      console.error('详情头像加载失败:', currentBooking.wechat_avatar);
      // 生成基于用户名的默认头像
      if (currentBooking.user_id) {
        const name = currentBooking.user_display_name || currentBooking.wechat_nickname || currentBooking.name || 'User' + currentBooking.user_id;
        currentBooking.wechat_avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      } else {
        currentBooking.wechat_avatar = null;
        currentBooking.user_avatar = null;
      }
    };

    return {
      loading,
      bookingList,
      engineers,
      availableEngineers,
      pagination,
      filters,
      statusOptions,
      paymentStatusOptions,
      statusDialog,
      engineerDialog,
      detailDialog,
      currentBooking,
      formatDateTime,
      formatDate,
      getStatusType,
      getStatusLabel,
      getPaymentStatusLabel,
      getPaymentStatusType,
      getPaymentMethodLabel,
      formatCurrency,
      getDepositLabel,
      calculateTotalAmount,
      getLevelLabel,
      getLevelType,
      getBookingList,
      viewDetails,
      updateStatus,
      submitStatusUpdate,
      assignEngineer,
      submitAssignEngineer,
      exportData,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange,
      handleAvatarError,
      handleDetailAvatarError
    };
  }
};
</script>

<style scoped>
.installation-booking-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-nickname {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.user-info-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-id {
  font-size: 12px;
  color: #909399;
}

.installation-fee-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
}

.fee-breakdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
  font-size: 12px;
  color: #606266;
}

.fee-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.fee-line.total {
  font-weight: 600;
  color: #303133;
}

.payment-status {
  font-size: 12px;
  display: flex;
  align-items: center;
}
</style>
