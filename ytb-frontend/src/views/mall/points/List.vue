<template>
  <div class="app-container">
    <div class="tab-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="积分规则" name="rules">
          <div class="filter-container">
            <el-button class="filter-item" type="success" icon="Plus" @click="handleCreateRule">
              新增规则
            </el-button>
          </div>

          <el-table
            v-loading="rulesLoading"
            :data="rulesList"
            element-loading-text="加载中..."
            border
            fit
            highlight-current-row
            style="width: 100%"
          >
            <el-table-column prop="id" label="ID" align="center" width="80" />
            <el-table-column prop="name" label="规则名称" min-width="150" />
            <el-table-column prop="type" label="积分类型" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getPointTypeTag(scope.row.type)">
                  {{ getPointTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分值" width="100" align="center">
              <template #default="scope">
                <span :style="{ color: scope.row.type === 'reward' ? '#67c23a' : '#f56c6c' }">
                  {{ scope.row.type === 'reward' ? '+' : '-' }}{{ scope.row.points }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="limit_cycle" label="限制周期" width="120" align="center">
              <template #default="scope">
                {{ getLimitCycleText(scope.row.limit_cycle) }}
              </template>
            </el-table-column>
            <el-table-column prop="limit_times" label="限制次数" width="100" align="center">
              <template #default="scope">
                {{ scope.row.limit_times > 0 ? scope.row.limit_times : '不限' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                  {{ scope.row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160" />
            <el-table-column label="操作" width="180" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleUpdateRule(scope.row)">
                  编辑
                </el-button>
                <el-button
                  :type="scope.row.status === 'active' ? 'danger' : 'success'"
                  size="small"
                  @click="handleUpdateRuleStatus(scope.row)"
                >
                  {{ scope.row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteRule(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="积分记录" name="records">
          <div class="filter-container">
            <el-input
              v-model="recordsQuery.keyword"
              placeholder="用户名/手机号"
              style="width: 200px;"
              class="filter-item"
              @keyup.enter="handleFilterRecords"
            />
            <el-select
              v-model="recordsQuery.type"
              placeholder="积分类型"
              clearable
              style="width: 120px"
              class="filter-item"
            >
              <el-option
                v-for="item in pointTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="filter-item"
              style="width: 300px"
            />
            <el-button class="filter-item" type="primary" icon="Search" @click="handleFilterRecords">
              搜索
            </el-button>
          </div>

          <el-table
            v-loading="recordsLoading"
            :data="recordsList"
            element-loading-text="加载中..."
            border
            fit
            highlight-current-row
            style="width: 100%"
          >
            <el-table-column prop="id" label="ID" align="center" width="80" />
            <el-table-column prop="user_name" label="用户" width="120" />
            <el-table-column prop="user_phone" label="手机号" width="120" />
            <el-table-column prop="type" label="积分类型" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getPointTypeTag(scope.row.type)">
                  {{ getPointTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分值" width="100" align="center">
              <template #default="scope">
                <span :style="{ color: scope.row.type === 'reward' ? '#67c23a' : '#f56c6c' }">
                  {{ scope.row.type === 'reward' ? '+' : '-' }}{{ scope.row.points }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="rule_name" label="规则名称" min-width="150" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="before_points" label="变动前积分" width="120" align="center" />
            <el-table-column prop="after_points" label="变动后积分" width="120" align="center" />
            <el-table-column prop="created_at" label="记录时间" width="160" />
          </el-table>

          <el-pagination
            v-if="recordsTotal > 0"
            :current-page="recordsQuery.page"
            :page-sizes="[10, 20, 30, 50]"
            :page-size="recordsQuery.limit"
            layout="total, sizes, prev, pager, next, jumper"
            :total="recordsTotal"
            @size-change="handleRecordsSizeChange"
            @current-change="handleRecordsCurrentChange"
            class="pagination-container"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 积分规则编辑对话框 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增积分规则' : '编辑积分规则'"
      v-model="ruleDialogVisible"
      width="50%"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-position="right"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则说明" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入规则说明"
          />
        </el-form-item>
        <el-form-item label="积分类型" prop="type">
          <el-radio-group v-model="ruleForm.type">
            <el-radio label="reward">奖励积分</el-radio>
            <el-radio label="consume">消费积分</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分值" prop="points">
          <el-input-number v-model="ruleForm.points" :min="1" :max="10000" style="width: 120px" />
          <span class="form-tip">正整数，单次奖励或消费的积分数量</span>
        </el-form-item>
        <el-form-item label="触发事件" prop="event">
          <el-select v-model="ruleForm.event" placeholder="请选择触发事件" style="width: 100%">
            <el-option
              v-for="item in eventOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="限制周期" prop="limit_cycle">
          <el-select v-model="ruleForm.limit_cycle" placeholder="请选择限制周期" style="width: 100%">
            <el-option
              v-for="item in limitCycleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span class="form-tip">在周期内限制触发次数</span>
        </el-form-item>
        <el-form-item label="限制次数" prop="limit_times">
          <el-input-number v-model="ruleForm.limit_times" :min="0" :max="1000" style="width: 120px" />
          <span class="form-tip">0表示不限次数</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ruleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRuleForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRules, createRule, updateRule, updateRuleStatus, deleteRule, getRecords } from '@/api/points';

export default {
  name: 'PointsManagement',
  setup() {
    // 当前激活的标签页
    const activeTab = ref('rules');
    
    // 积分规则相关
    const rulesLoading = ref(true);
    const rulesList = ref([]);
    const ruleDialogVisible = ref(false);
    const dialogStatus = ref('create');
    const ruleFormRef = ref(null);
    
    // 积分类型选项
    const pointTypeOptions = [
      { value: 'reward', label: '奖励积分' },
      { value: 'consume', label: '消费积分' }
    ];
    
    // 事件类型选项
    const eventOptions = [
      { value: 'register', label: '用户注册' },
      { value: 'login', label: '每日登录' },
      { value: 'order', label: '下单购物' },
      { value: 'review', label: '评价商品' },
      { value: 'share', label: '分享商品' },
      { value: 'invite', label: '邀请注册' },
      { value: 'purchase', label: '积分购物' },
      { value: 'exchange', label: '积分兑换' },
      { value: 'admin', label: '管理员操作' }
    ];
    
    // 限制周期选项
    const limitCycleOptions = [
      { value: 'once', label: '终身一次' },
      { value: 'day', label: '每天' },
      { value: 'week', label: '每周' },
      { value: 'month', label: '每月' },
      { value: 'year', label: '每年' },
      { value: 'none', label: '不限制' }
    ];
    
    // 积分规则表单
    const defaultRuleForm = {
      id: undefined,
      name: '',
      description: '',
      type: 'reward',
      points: 10,
      event: 'register',
      limit_cycle: 'once',
      limit_times: 1,
      status: 'active'
    };
    
    const ruleForm = reactive(Object.assign({}, defaultRuleForm));
    
    // 表单验证规则
    const ruleFormRules = {
      name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
      description: [{ required: true, message: '请输入规则说明', trigger: 'blur' }],
      type: [{ required: true, message: '请选择积分类型', trigger: 'change' }],
      points: [{ required: true, message: '请输入积分值', trigger: 'blur' }],
      event: [{ required: true, message: '请选择触发事件', trigger: 'change' }],
      limit_cycle: [{ required: true, message: '请选择限制周期', trigger: 'change' }]
    };
    
    // 积分记录相关
    const recordsLoading = ref(true);
    const recordsList = ref([]);
    const recordsTotal = ref(0);
    const dateRange = ref([]);
    
    const recordsQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      type: undefined,
      startDate: '',
      endDate: ''
    });
    
    // 获取积分规则列表
    const fetchRulesList = () => {
      rulesLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        rulesList.value = [
          {
            id: 1,
            name: '注册奖励',
            description: '新用户注册成功后奖励积分',
            type: 'reward',
            points: 100,
            event: 'register',
            limit_cycle: 'once',
            limit_times: 1,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 2,
            name: '每日登录',
            description: '用户每日首次登录奖励积分',
            type: 'reward',
            points: 5,
            event: 'login',
            limit_cycle: 'day',
            limit_times: 1,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 3,
            name: '评价商品',
            description: '用户评价商品奖励积分',
            type: 'reward',
            points: 10,
            event: 'review',
            limit_cycle: 'none',
            limit_times: 0,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 4,
            name: '分享商品',
            description: '用户分享商品奖励积分',
            type: 'reward',
            points: 5,
            event: 'share',
            limit_cycle: 'day',
            limit_times: 3,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 5,
            name: '邀请注册',
            description: '邀请新用户注册成功后奖励积分',
            type: 'reward',
            points: 50,
            event: 'invite',
            limit_cycle: 'none',
            limit_times: 0,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 6,
            name: '购物消费',
            description: '100元消费1积分',
            type: 'reward',
            points: 1,
            event: 'order',
            limit_cycle: 'none',
            limit_times: 0,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 7,
            name: '积分购物',
            description: '使用积分购买商品',
            type: 'consume',
            points: 100,
            event: 'purchase',
            limit_cycle: 'none',
            limit_times: 0,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 8,
            name: '积分兑换',
            description: '积分兑换优惠券',
            type: 'consume',
            points: 500,
            event: 'exchange',
            limit_cycle: 'none',
            limit_times: 0,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          }
        ];
        
        rulesLoading.value = false;
      }, 1000);
    };
    
    // 获取积分记录列表
    const fetchRecordsList = () => {
      recordsLoading.value = true;
      
      // 处理日期范围
      if (dateRange.value && dateRange.value.length === 2) {
        recordsQuery.startDate = dateRange.value[0];
        recordsQuery.endDate = dateRange.value[1];
      } else {
        recordsQuery.startDate = '';
        recordsQuery.endDate = '';
      }
      
      // 模拟API调用
      setTimeout(() => {
        recordsList.value = [
          {
            id: 1,
            user_id: 1,
            user_name: '张三',
            user_phone: '13800138001',
            type: 'reward',
            points: 100,
            rule_name: '注册奖励',
            description: '新用户注册奖励',
            before_points: 0,
            after_points: 100,
            created_at: '2023-03-01 10:00:00'
          },
          {
            id: 2,
            user_id: 1,
            user_name: '张三',
            user_phone: '13800138001',
            type: 'reward',
            points: 5,
            rule_name: '每日登录',
            description: '每日首次登录奖励',
            before_points: 100,
            after_points: 105,
            created_at: '2023-03-02 09:30:00'
          },
          {
            id: 3,
            user_id: 1,
            user_name: '张三',
            user_phone: '13800138001',
            type: 'reward',
            points: 10,
            rule_name: '评价商品',
            description: '评价商品ID:123',
            before_points: 105,
            after_points: 115,
            created_at: '2023-03-03 14:20:00'
          },
          {
            id: 4,
            user_id: 1,
            user_name: '张三',
            user_phone: '13800138001',
            type: 'consume',
            points: 100,
            rule_name: '积分兑换',
            description: '兑换优惠券ID:001',
            before_points: 115,
            after_points: 15,
            created_at: '2023-03-04 16:45:00'
          },
          {
            id: 5,
            user_id: 2,
            user_name: '李四',
            user_phone: '13900139002',
            type: 'reward',
            points: 100,
            rule_name: '注册奖励',
            description: '新用户注册奖励',
            before_points: 0,
            after_points: 100,
            created_at: '2023-03-05 11:10:00'
          },
          {
            id: 6,
            user_id: 1,
            user_name: '张三',
            user_phone: '13800138001',
            type: 'reward',
            points: 20,
            rule_name: '购物消费',
            description: '订单ID:10001, 消费金额:2000元',
            before_points: 15,
            after_points: 35,
            created_at: '2023-03-10 09:15:00'
          }
        ];
        
        recordsTotal.value = recordsList.value.length;
        recordsLoading.value = false;
      }, 1000);
    };
    
    // 获取积分类型标签样式
    const getPointTypeTag = (type) => {
      return type === 'reward' ? 'success' : 'danger';
    };
    
    // 获取积分类型文本
    const getPointTypeText = (type) => {
      const found = pointTypeOptions.find(item => item.value === type);
      return found ? found.label : '未知类型';
    };
    
    // 获取限制周期文本
    const getLimitCycleText = (cycle) => {
      const found = limitCycleOptions.find(item => item.value === cycle);
      return found ? found.label : '未知周期';
    };
    
    // 创建新规则
    const handleCreateRule = () => {
      Object.assign(ruleForm, defaultRuleForm);
      dialogStatus.value = 'create';
      ruleDialogVisible.value = true;
      
      setTimeout(() => {
        if (ruleFormRef.value) {
          ruleFormRef.value.clearValidate();
        }
      });
    };
    
    // 编辑规则
    const handleUpdateRule = (row) => {
      Object.assign(ruleForm, row);
      dialogStatus.value = 'update';
      ruleDialogVisible.value = true;
      
      setTimeout(() => {
        if (ruleFormRef.value) {
          ruleFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新规则状态
    const handleUpdateRuleStatus = (row) => {
      const isActive = row.status === 'active';
      const statusText = isActive ? '禁用' : '启用';
      
      ElMessageBox.confirm(
        `确认${statusText}该积分规则吗？`,
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: isActive ? 'warning' : 'info'
        }
      ).then(() => {
        const index = rulesList.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          rulesList.value[index].status = isActive ? 'inactive' : 'active';
          
          ElMessage({
            type: 'success',
            message: `规则${statusText}成功`
          });
        }
      });
    };
    
    // 删除规则
    const handleDeleteRule = (row) => {
      ElMessageBox.confirm(
        '确认删除该积分规则吗？删除后数据无法恢复。',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = rulesList.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          rulesList.value.splice(index, 1);
          
          ElMessage({
            type: 'success',
            message: '规则删除成功'
          });
        }
      });
    };
    
    // 提交规则表单
    const submitRuleForm = () => {
      ruleFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟创建规则
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const newRule = {
              id: Math.round(Math.random() * 1000),
              name: ruleForm.name,
              description: ruleForm.description,
              type: ruleForm.type,
              points: ruleForm.points,
              event: ruleForm.event,
              limit_cycle: ruleForm.limit_cycle,
              limit_times: ruleForm.limit_times,
              status: ruleForm.status,
              created_at: now
            };
            
            rulesList.value.unshift(newRule);
            
            ElMessage({
              message: '积分规则创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新规则
            const index = rulesList.value.findIndex(item => item.id === ruleForm.id);
            if (index !== -1) {
              const updatedRule = { ...rulesList.value[index], ...ruleForm };
              rulesList.value.splice(index, 1, updatedRule);
              
              ElMessage({
                message: '积分规则更新成功',
                type: 'success'
              });
            }
          }
          
          ruleDialogVisible.value = false;
        }
      });
    };
    
    // 筛选积分记录
    const handleFilterRecords = () => {
      recordsQuery.page = 1;
      fetchRecordsList();
    };
    
    // 改变记录页大小
    const handleRecordsSizeChange = (val) => {
      recordsQuery.limit = val;
      fetchRecordsList();
    };
    
    // 改变记录页码
    const handleRecordsCurrentChange = (val) => {
      recordsQuery.page = val;
      fetchRecordsList();
    };
    
    // 监听标签页变化
    const handleTabChange = (tab) => {
      if (tab === 'records') {
        fetchRecordsList();
      }
    };
    
    onMounted(() => {
      fetchRulesList();
      fetchRecordsList();
    });
    
    return {
      activeTab,
      rulesLoading,
      rulesList,
      recordsLoading,
      recordsList,
      recordsTotal,
      ruleDialogVisible,
      dialogStatus,
      ruleForm,
      ruleFormRef,
      ruleFormRules,
      recordsQuery,
      dateRange,
      pointTypeOptions,
      eventOptions,
      limitCycleOptions,
      getPointTypeTag,
      getPointTypeText,
      getLimitCycleText,
      handleCreateRule,
      handleUpdateRule,
      handleUpdateRuleStatus,
      handleDeleteRule,
      submitRuleForm,
      handleFilterRecords,
      handleRecordsSizeChange,
      handleRecordsCurrentChange,
      handleTabChange
    };
  }
};
</script>

<style scoped>
.tab-container {
  margin-bottom: 20px;
}

.filter-container {
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 