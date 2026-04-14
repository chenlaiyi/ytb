<template>
  <div class="engineers-page">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>工程师管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleCreate">添加工程师</el-button>
            <el-button type="success" @click="handleSyncFromWaterDb" :loading="syncLoading">同步指定渠道商工程师</el-button>
            <el-button type="warning" @click="handleUpdateInstallationCount" :loading="updateCountLoading">更新安装数量</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedEngineers.length === 0">批量删除</el-button>
            <el-button type="info" @click="handleBatchEnable" :disabled="selectedEngineers.length === 0">批量启用</el-button>
            <el-button type="info" @click="handleBatchDisable" :disabled="selectedEngineers.length === 0">批量禁用</el-button>
            <el-button type="success" @click="handleExport">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索过滤区域 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="demo-form-inline">
          <el-form-item label="关键词">
            <el-input v-model="filters.keyword" placeholder="姓名/电话/区域" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部" clearable>
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="负责区域">
            <el-select v-model="filters.region" placeholder="请选择区域" clearable filterable>
              <el-option v-for="region in regionOptions" :key="region" :label="region" :value="region" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 工程师列表 -->
      <el-table
        v-loading="loading"
        :data="engineerList"
        border
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="姓名" width="120">
          <template #default="scope">
            <div class="engineer-info">
              <el-avatar v-if="scope.row.avatar" :size="30" :src="scope.row.avatar" class="avatar" />
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="region" label="负责区域" min-width="180" />
        <el-table-column prop="address" label="详细地址" min-width="200" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completed_installations" label="完成安装数" width="120" align="center" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleViewStats(scope.row)">统计</el-button>
            <el-button size="small" type="warning" @click="handleViewWorkLogs(scope.row)">工单</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 工程师表单对话框 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '添加工程师' : '编辑工程师'"
      v-model="dialogFormVisible"
      width="600px"
    >
      <el-form
        ref="engineerFormRef"
        :model="engineerForm"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="engineerForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="engineerForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="dialogStatus === 'create'">
              <el-input v-model="engineerForm.password" type="password" placeholder="请输入登录密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="engineerForm.status" placeholder="请选择状态">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责区域" prop="region">
              <el-input v-model="engineerForm.region" placeholder="请输入负责区域" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="engineerForm.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="engineerForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-input v-model="engineerForm.avatar" placeholder="请输入头像URL" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="engineerForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工程师统计对话框 -->
    <el-dialog
      title="工程师统计"
      v-model="statsDialogVisible"
      width="600px"
    >
      <div v-if="currentEngineerStats">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="总安装任务">{{ currentEngineerStats.total_count }}</el-descriptions-item>
          <el-descriptions-item label="待处理">{{ currentEngineerStats.pending_count }}</el-descriptions-item>
          <el-descriptions-item label="安装中">{{ currentEngineerStats.installing_count }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ currentEngineerStats.completed_count }}</el-descriptions-item>
          <el-descriptions-item label="已取消">{{ currentEngineerStats.cancelled_count }}</el-descriptions-item>
          <el-descriptions-item label="完成率">{{ currentEngineerStats.completion_rate }}%</el-descriptions-item>
          <el-descriptions-item label="本月安装">{{ currentEngineerStats.current_month_count }}</el-descriptions-item>
          <el-descriptions-item label="本月完成">{{ currentEngineerStats.current_month_completed_count }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="statsDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工程师工单记录对话框 -->
    <el-dialog
      title="工程师工单记录"
      v-model="workLogsDialogVisible"
      width="800px"
    >
      <div v-if="currentEngineerWorkLogs">
        <el-table :data="currentEngineerWorkLogs" border style="width: 100%">
          <el-table-column prop="id" label="工单ID" width="80" />
          <el-table-column prop="booking_no" label="预约编号" width="150" />
          <el-table-column prop="contact_name" label="联系人" width="100" />
          <el-table-column prop="contact_phone" label="联系电话" width="120" />
          <el-table-column prop="address" label="安装地址" min-width="200" />
          <el-table-column prop="device_type" label="设备类型" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getBookingStatusType(scope.row.status)">
                {{ getBookingStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="workLogsDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import engineerApi from '@/api/engineerApi';

export default {
  name: 'EngineersList',
  setup() {
    // 数据加载状态
    const loading = ref(false);
    const submitLoading = ref(false);
    const syncLoading = ref(false);
    const updateCountLoading = ref(false);

    // 工程师列表数据
    const engineerList = ref([]);

    // 分页配置
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });

    // 搜索过滤条件
    const filters = reactive({
      keyword: '',
      status: '',
      region: ''
    });

    // 区域选项
    const regionOptions = ref([]);

    // 选中的工程师
    const selectedEngineers = ref([]);

    // 状态选项
    const statusOptions = [
      { value: 1, label: '在职', type: 'success' },
      { value: 0, label: '禁用', type: 'danger' }
    ];

    // 工单状态选项
    const bookingStatusOptions = [
      { value: 'pending', label: '待处理', type: 'info' },
      { value: 'confirmed', label: '已确认', type: 'primary' },
      { value: 'assigned', label: '已分配', type: 'warning' },
      { value: 'in_progress', label: '安装中', type: 'warning' },
      { value: 'completed', label: '已完成', type: 'success' },
      { value: 'cancelled', label: '已取消', type: 'danger' }
    ];

    // 对话框状态
    const dialogStatus = ref('create');
    const dialogFormVisible = ref(false);
    const statsDialogVisible = ref(false);
    const workLogsDialogVisible = ref(false);
    const engineerFormRef = ref(null);

    // 工程师表单数据
    const engineerForm = reactive({
      id: undefined,
      name: '',
      phone: '',
      password: '',
      region: '',
      address: '',
      id_card: '',
      avatar: '',
      status: 1,
      remark: ''
    });

    // 当前工程师统计和工单记录
    const currentEngineerStats = ref(null);
    const currentEngineerWorkLogs = ref(null);

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      region: [
        { required: true, message: '请输入负责区域', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    };

    // 获取工程师列表
    const getEngineerList = async () => {
      loading.value = true;
      try {
        const params = {
          keyword: filters.keyword || undefined,
          status: filters.status || undefined,
          region: filters.region || undefined,
          page: pagination.page,
          limit: pagination.limit
        };

        const response = await engineerApi.getEngineers(params);

        // 处理axios拦截器已经处理过的响应数据
        if (response && (response.code === 200 || response.code === 0)) {
          // V1 API 成功响应，response已经是response.data
          let data;
          
          if (response.code === 0) {
            // 响应格式: {code: 0, message: "...", data: {...}}
            data = response.data;
          } else {
            // 响应格式: {code: 200, data: {...}}
            data = response.data;
          }
          
          if (data && data.data) {
            // Laravel分页格式：data.data 包含列表数据
            engineerList.value = data.data || [];
            pagination.total = data.total || 0;
            pagination.page = data.current_page || 1;
            pagination.limit = data.per_page || 15;
          } else if (Array.isArray(data)) {
            // 直接数组格式
            engineerList.value = data;
            pagination.total = data.length;
          } else {
            console.error('响应数据格式错误:', data);
            ElMessage.error('响应数据格式错误');
            engineerList.value = [];
            pagination.total = 0;
          }
        } else {
          // 处理错误响应
          const errorMsg = response?.message || '获取工程师列表失败';
          console.error('工程师列表API错误:', response);
          ElMessage.error(errorMsg);
          engineerList.value = [];
          pagination.total = 0;
        }
      } catch (error) {
        console.error('获取工程师列表失败:', error);
        ElMessage.error('获取工程师列表失败，请重试');
      } finally {
        loading.value = false;
      }
    };

    // 获取区域选项
    const getRegionOptions = async () => {
      try {
        const response = await engineerApi.getEngineerRegions();
        console.log('区域响应数据:', response);
        
        // 根据API响应格式正确处理数据
        if (response && typeof response === 'object') {
          if (response.code === 0 && response.data) {
            // 正确的API响应格式: {code: 0, message: "...", data: [...]}
            regionOptions.value = Array.isArray(response.data) ? response.data : [];
          } else if (response.code === 200 && response.data && response.data.data) {
            // 另一种可能的格式: {code: 200, data: {data: [...]}}
            regionOptions.value = Array.isArray(response.data.data) ? response.data.data : [];
          } else if (Array.isArray(response)) {
            // 直接返回数组的格式
            regionOptions.value = response;
          } else {
            // 其他情况，尝试直接使用response.data
            regionOptions.value = Array.isArray(response.data) ? response.data : [];
          }
        } else {
          // 响应不是对象，尝试直接使用
          regionOptions.value = Array.isArray(response) ? response : [];
        }
        
        console.log('处理后的区域选项:', regionOptions.value);
      } catch (error) {
        console.error('获取区域选项失败:', error);
        ElMessage.error('获取区域列表失败，请刷新尝试');
      }
    };

    // 搜索按钮点击事件
    const handleSearch = () => {
      pagination.page = 1;
      getEngineerList();
    };

    // 重置过滤条件
    const resetFilters = () => {
      filters.keyword = '';
      filters.status = '';
      filters.region = '';
      handleSearch();
    };

    // 切换每页显示数量
    const handleSizeChange = (val) => {
      pagination.limit = val;
      getEngineerList();
    };

    // 切换页码
    const handleCurrentChange = (val) => {
      pagination.page = val;
      getEngineerList();
    };

    // 添加工程师
    const handleCreate = () => {
      resetForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
    };

    // 编辑工程师
    const handleEdit = (row) => {
      resetForm();
      dialogStatus.value = 'update';
      engineerForm.id = row.id;
      engineerForm.name = row.name;
      engineerForm.phone = row.phone;
      engineerForm.region = row.region;
      engineerForm.address = row.address;
      engineerForm.id_card = row.id_card;
      engineerForm.avatar = row.avatar;
      engineerForm.status = row.status;
      engineerForm.remark = row.remark;
      dialogFormVisible.value = true;
    };

    // 删除工程师
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除该工程师吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await engineerApi.deleteEngineer(row.id);

          // 处理响应
          let responseData;

          // 先检查是否有效响应
          if (response && (response.code === 0 || response.code === 200)) {
            // 有效响应
            if (response.code === 0) {
              // 格式：{code: 0, message: "...", data: ...}
              responseData = response;
            } else {
              // 格式：{code: 200, data: ...}
              responseData = response.data;
            }
            
            ElMessage.success(responseData.message || '删除成功');
            getEngineerList();
          } else {
            // 无效响应
            const errorMsg = (response.data && response.data.message) ||
                            (response.data && response.data && response.data.message) ||
                            response.message ||
                            '删除失败';
            console.error('删除工程师响应错误:', errorMsg, response);
            ElMessage.error(errorMsg);
          }
        } catch (error) {
          console.error('删除工程师失败:', error);
          ElMessage.error('删除工程师失败，请重试');
        }
      }).catch(() => {
        // 取消删除
      });
    };

    // 重置表单
    const resetForm = () => {
      if (engineerFormRef.value) {
        engineerFormRef.value.resetFields();
      }
      engineerForm.id = undefined;
      engineerForm.name = '';
      engineerForm.phone = '';
      engineerForm.password = '';
      engineerForm.region = '';
      engineerForm.address = '';
      engineerForm.id_card = '';
      engineerForm.avatar = '';
      engineerForm.status = 1;
      engineerForm.remark = '';
    };

    // 提交表单
    const submitForm = async () => {
      if (!engineerFormRef.value) return;

      await engineerFormRef.value.validate(async (valid) => {
        if (valid) {
          submitLoading.value = true;
          try {
            const formData = {
              name: engineerForm.name,
              phone: engineerForm.phone,
              region: engineerForm.region,
              address: engineerForm.address,
              id_card: engineerForm.id_card,
              avatar: engineerForm.avatar,
              status: engineerForm.status,
              remark: engineerForm.remark
            };

            // 如果是创建操作，添加密码字段
            if (dialogStatus.value === 'create') {
              formData.password = engineerForm.password;
            }

            let response;
            if (dialogStatus.value === 'create') {
              response = await engineerApi.createEngineer(formData);
            } else {
              response = await engineerApi.updateEngineer(engineerForm.id, formData);
            }

            // 处理响应
            if (response && (response.code === 0 || response.code === 200)) {
              // 成功响应
              const successMsg = dialogStatus.value === 'create' ? '添加成功' : '更新成功';
              ElMessage.success(response.message || successMsg);
              dialogFormVisible.value = false;
              getEngineerList();
            } else {
              // 错误响应
              const errorMsg = (response.data && response.data.message) ||
                              (response.data && response.data && response.data.message) ||
                              response.message ||
                              (dialogStatus.value === 'create' ? '添加失败' : '更新失败');
              console.error(dialogStatus.value === 'create' ? '添加工程师响应错误:' : '更新工程师响应错误:', errorMsg, response);
              ElMessage.error(errorMsg);
            }
          } catch (error) {
            console.error(dialogStatus.value === 'create' ? '添加工程师失败:' : '更新工程师失败:', error);
            ElMessage.error(dialogStatus.value === 'create' ? '添加工程师失败，请重试' : '更新工程师失败，请重试');
          } finally {
            submitLoading.value = false;
          }
        } else {
          return false;
        }
      });
    };

    // 获取状态类型
    const getStatusType = (status) => {
      const found = statusOptions.find(item => item.value === status);
      return found ? found.type : 'info';
    };

    // 获取状态标签
    const getStatusLabel = (status) => {
      const found = statusOptions.find(item => item.value === status);
      return found ? found.label : status;
    };

    // 获取工单状态类型
    const getBookingStatusType = (status) => {
      const found = bookingStatusOptions.find(item => item.value === status);
      return found ? found.type : 'info';
    };

    // 获取工单状态标签
    const getBookingStatusLabel = (status) => {
      const found = bookingStatusOptions.find(item => item.value === status);
      return found ? found.label : status;
    };

    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      return date.toLocaleString();
    };

    // 从净水器数据库同步工程师数据
    const handleSyncFromWaterDb = async () => {
      try {
        syncLoading.value = true;

        // 使用engineerApi调用同步方法
        const response = await engineerApi.syncFromWaterDb();

        // 处理响应
        if (response && (response.code === 0 || response.code === 200)) {
          // 成功响应
          let responseData;
          
          if (response.code === 0) {
            // 格式：{code: 0, message: "...", data: ...}
            responseData = response;
          } else {
            // 格式：{code: 200, data: ...}
            responseData = response.data;
          }
          
          // 提取数据
          if (responseData.data) {
            const { total, sync_count, skip_count, error_count } = responseData.data;
            ElMessage.success(`同步完成！共${total}条数据，成功${sync_count}条，跳过${skip_count}条，失败${error_count}条`);
          } else {
            ElMessage.success(responseData.message || '同步完成');
          }
          
          // 刷新列表
          getEngineerList();
        } else {
          // 错误响应
          const errorMsg = (response.data && response.data.message) ||
                          (response.data && response.data && response.data.message) ||
                          (response && response.message) ||
                          '同步失败';
          console.error('同步工程师数据响应错误:', errorMsg, response);
          ElMessage.error(errorMsg);
        }
      } catch (error) {
        console.error('同步工程师数据失败:', error);
        if (error.response) {
          console.error('错误响应:', error.response.data);
          ElMessage.error(`同步失败: ${error.response.data?.message || error.message}`);
        } else {
          ElMessage.error(`同步失败: ${error.message}`);
        }
      } finally {
        syncLoading.value = false;
      }
    };

    // 页面加载时获取数据
    onMounted(() => {
      getEngineerList();
      getRegionOptions();
    });

    // 更新所有工程师的安装数量
    const handleUpdateInstallationCount = async () => {
      try {
        updateCountLoading.value = true;

        const response = await engineerApi.updateInstallationCount();

        // 处理响应
        if (response && (response.code === 0 || response.code === 200)) {
          // 成功响应
          ElMessage.success(response.message || '更新安装数量成功');
          // 刷新列表
          getEngineerList();
        } else {
          // 错误响应
          const errorMsg = (response.data && response.data.message) ||
                          (response.data && response.data && response.data.message) ||
                          (response && response.message) ||
                          '更新安装数量失败';
          console.error('更新安装数量响应错误:', errorMsg, response);
          ElMessage.error(errorMsg);
        }
      } catch (error) {
        console.error('更新安装数量失败:', error);
        ElMessage.error('更新安装数量失败，请重试');
      } finally {
        updateCountLoading.value = false;
      }
    };

    // 处理选中变化
    const handleSelectionChange = (selection) => {
      selectedEngineers.value = selection;
    };

    // 批量删除
    const handleBatchDelete = () => {
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedEngineers.value.length} 个工程师吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const ids = selectedEngineers.value.map(item => item.id);
          const response = await engineerApi.batchOperateEngineers(ids, 'delete');

          if (response && (response.code === 0 || response.code === 200)) {
            ElMessage.success('批量删除成功');
            getEngineerList();
            selectedEngineers.value = [];
          } else {
            const errorMsg = response?.message || '批量删除失败';
            ElMessage.error(errorMsg);
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          ElMessage.error('批量删除失败，请重试');
        }
      }).catch(() => {
        // 取消删除
      });
    };

    // 批量启用
    const handleBatchEnable = () => {
      ElMessageBox.confirm(
        `确定要启用选中的 ${selectedEngineers.value.length} 个工程师吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const ids = selectedEngineers.value.map(item => item.id);
          const response = await engineerApi.batchOperateEngineers(ids, 'enable');

          if (response && (response.code === 0 || response.code === 200)) {
            ElMessage.success('批量启用成功');
            getEngineerList();
            selectedEngineers.value = [];
          } else {
            const errorMsg = response?.message || '批量启用失败';
            ElMessage.error(errorMsg);
          }
        } catch (error) {
          console.error('批量启用失败:', error);
          ElMessage.error('批量启用失败，请重试');
        }
      }).catch(() => {
        // 取消操作
      });
    };

    // 批量禁用
    const handleBatchDisable = () => {
      ElMessageBox.confirm(
        `确定要禁用选中的 ${selectedEngineers.value.length} 个工程师吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const ids = selectedEngineers.value.map(item => item.id);
          const response = await engineerApi.batchOperateEngineers(ids, 'disable');

          if (response && (response.code === 0 || response.code === 200)) {
            ElMessage.success('批量禁用成功');
            getEngineerList();
            selectedEngineers.value = [];
          } else {
            const errorMsg = response?.message || '批量禁用失败';
            ElMessage.error(errorMsg);
          }
        } catch (error) {
          console.error('批量禁用失败:', error);
          ElMessage.error('批量禁用失败，请重试');
        }
      }).catch(() => {
        // 取消操作
      });
    };

    // 导出数据
    const handleExport = async () => {
      try {
        const params = {
          keyword: filters.keyword || undefined,
          status: filters.status || undefined,
          region: filters.region || undefined
        };

        const response = await engineerApi.exportEngineers(params);
        
        // 创建下载链接
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `工程师数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        ElMessage.success('导出成功');
      } catch (error) {
        console.error('导出失败:', error);
        ElMessage.error('导出失败，请重试');
      }
    };

    // 查看统计信息
    const handleViewStats = async (row) => {
      try {
        const response = await engineerApi.getEngineerStats(row.id);
        if (response && (response.code === 0 || response.code === 200)) {
          // 处理不同格式的响应
          let statsData;
          if (response.code === 0) {
            statsData = response.data;
          } else {
            statsData = response.data;
          }
          
          currentEngineerStats.value = statsData;
          statsDialogVisible.value = true;
        } else {
          const errorMsg = response?.message || '获取统计信息失败';
          ElMessage.error(errorMsg);
        }
      } catch (error) {
        console.error('获取统计信息失败:', error);
        ElMessage.error('获取统计信息失败，请重试');
      }
    };

    // 查看工单记录
    const handleViewWorkLogs = async (row) => {
      try {
        const response = await engineerApi.getEngineerWorkLogs(row.id);
        if (response && (response.code === 0 || response.code === 200)) {
          // 处理不同格式的响应
          let logsData;
          if (response.code === 0) {
            logsData = response.data;
            // 适配分页数据格式
            if (logsData && typeof logsData === 'object' && logsData.data) {
              // 分页格式: {data: [...], total: ..., current_page: ...}
              currentEngineerWorkLogs.value = Array.isArray(logsData.data) ? logsData.data : [];
            } else if (Array.isArray(logsData)) {
              // 数组格式: [...]
              currentEngineerWorkLogs.value = logsData;
            } else {
              // 其他情况
              currentEngineerWorkLogs.value = [];
            }
          } else {
            logsData = response.data;
            // 适配分页数据格式
            if (logsData && typeof logsData === 'object' && logsData.data) {
              // 分页格式: {data: [...], total: ..., current_page: ...}
              currentEngineerWorkLogs.value = Array.isArray(logsData.data) ? logsData.data : [];
            } else if (Array.isArray(logsData)) {
              // 数组格式: [...]
              currentEngineerWorkLogs.value = logsData;
            } else {
              // 其他情况
              currentEngineerWorkLogs.value = [];
            }
          }
          
          workLogsDialogVisible.value = true;
        } else {
          const errorMsg = response?.message || '获取工单记录失败';
          ElMessage.error(errorMsg);
        }
      } catch (error) {
        console.error('获取工单记录失败:', error);
        ElMessage.error('获取工单记录失败，请重试');
      }
    };



    return {
      loading,
      submitLoading,
      syncLoading,
      updateCountLoading,
      engineerList,
      pagination,
      filters,
      regionOptions,
      selectedEngineers,
      statusOptions,
      dialogStatus,
      dialogFormVisible,
      statsDialogVisible,
      workLogsDialogVisible,
      engineerForm,
      engineerFormRef,
      currentEngineerStats,
      currentEngineerWorkLogs,
      rules,
      getEngineerList,
      handleSearch,
      resetFilters,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSyncFromWaterDb,
      handleUpdateInstallationCount,
      submitForm,
      getStatusType,
      getStatusLabel,
      getBookingStatusType,
      getBookingStatusLabel,
      formatDateTime,
      handleSelectionChange,
      handleBatchDelete,
      handleBatchEnable,
      handleBatchDisable,
      handleExport,
      handleViewStats,
      handleViewWorkLogs
    };
  }
};
</script>

<style scoped>
.engineers-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.card-header .header-buttons {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-header .header-buttons {
    margin-top: 15px;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .card-header .header-buttons .el-button {
    flex: 1;
    min-width: 100px;
  }
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

.engineer-info {
  display: flex;
  align-items: center;
}

.engineer-info .avatar {
  margin-right: 8px;
}
</style>