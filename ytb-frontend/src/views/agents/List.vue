<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="渠道商名称/编号"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" icon="Plus" @click="handleCreate">
        新增渠道商
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="渠道商名称" min-width="150" />
      <el-table-column prop="agent_no" label="渠道商编号" width="120" align="center" />
      <el-table-column prop="contact_person" label="联系人" width="120" />
      <el-table-column prop="contact_phone" label="联系电话" width="150" />
      <el-table-column prop="province" label="省份" width="100" align="center" />
      <el-table-column prop="city" label="城市" width="100" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="水点数量" width="100" align="center">
        <template #default="scope">
          <el-button type="text" @click="handleViewWaterPoints(scope.row)">
            {{ scope.row.water_point_count }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="250" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button type="info" size="small" @click="handleDetail(scope.row)">
            详情
          </el-button>
          <el-button
            :type="scope.row.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="handleUpdateStatus(scope.row)"
          >
            {{ scope.row.status === 'active' ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      :current-page="listQuery.page"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="listQuery.limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination-container"
    />
    
    <!-- 新增/编辑渠道商弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增渠道商' : '编辑渠道商'"
      v-model="dialogFormVisible"
      width="50%"
    >
      <el-form
        ref="agentFormRef"
        :model="agentForm"
        :rules="rules"
        label-position="left"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="渠道商名称" prop="name">
          <el-input v-model="agentForm.name" placeholder="请输入渠道商名称" />
        </el-form-item>
        <el-form-item label="渠道商编号" prop="agent_no">
          <el-input v-model="agentForm.agent_no" placeholder="请输入渠道商编号" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="agentForm.contact_person" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="agentForm.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="agentForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <div class="area-select">
            <el-select
              v-model="agentForm.province"
              placeholder="请选择省份"
              style="width: 48%"
              @change="handleProvinceChange"
              prop="province"
            >
              <el-option
                v-for="item in provinceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="agentForm.city"
              placeholder="请选择城市"
              style="width: 48%"
              prop="city"
            >
              <el-option
                v-for="item in cityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="agentForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="渠道商类型" prop="agent_type">
          <el-select v-model="agentForm.agent_type" placeholder="请选择渠道商类型" style="width: 100%">
            <el-option label="一级渠道商" value="level_1" />
            <el-option label="二级渠道商" value="level_2" />
            <el-option label="服务商" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="佣金比例(%)" prop="commission_rate">
          <el-input-number
            v-model="agentForm.commission_rate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="agentForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注信息">
          <el-input
            v-model="agentForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 渠道商详情弹窗 -->
    <el-dialog
      title="渠道商详情"
      v-model="detailDialogVisible"
      width="60%"
    >
      <div v-if="currentAgent" class="agent-detail">
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="渠道商ID">{{ currentAgent.id }}</el-descriptions-item>
          <el-descriptions-item label="渠道商编号">{{ currentAgent.agent_no }}</el-descriptions-item>
          <el-descriptions-item label="渠道商名称">{{ currentAgent.name }}</el-descriptions-item>
          <el-descriptions-item label="渠道商类型">
            {{ getAgentTypeText(currentAgent.agent_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentAgent.contact_person }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentAgent.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="电子邮箱">{{ currentAgent.email }}</el-descriptions-item>
          <el-descriptions-item label="所在地区">{{ currentAgent.province }} {{ currentAgent.city }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">{{ currentAgent.address }}</el-descriptions-item>
          <el-descriptions-item label="佣金比例">{{ currentAgent.commission_rate }}%</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentAgent.status === 'active' ? 'success' : 'danger'">
              {{ currentAgent.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAgent.created_at }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-section">
          <h3 class="section-title">备注信息</h3>
          <p>{{ currentAgent.remark || '暂无备注信息' }}</p>
        </div>
        
        <div class="detail-section">
          <h3 class="section-title">财务信息</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">累计销售额</div>
                <div class="stat-value">¥{{ currentAgent.total_sales || '0.00' }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">累计佣金</div>
                <div class="stat-value">¥{{ currentAgent.total_commission || '0.00' }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">本月佣金</div>
                <div class="stat-value">¥{{ currentAgent.month_commission || '0.00' }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div class="detail-section">
          <h3 class="section-title">绩效统计</h3>
          <div class="chart-placeholder">
            <p>这里将集成图表显示功能</p>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 取水点列表弹窗 -->
    <el-dialog
      title="渠道商取水点列表"
      v-model="waterPointDialogVisible"
      width="70%"
    >
      <div v-if="currentAgent">
        <div class="agent-info">
          <h4>{{ currentAgent.name }}</h4>
          <p>渠道商编号: {{ currentAgent.agent_no }} | 联系人: {{ currentAgent.contact_person }} | 联系电话: {{ currentAgent.contact_phone }}</p>
        </div>
        
        <el-table :data="waterPointList" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="name" label="取水点名称" min-width="150" />
          <el-table-column prop="point_no" label="编号" width="120" align="center" />
          <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
          <el-table-column label="设备数量" width="100" align="center">
            <template #default="scope">
              {{ scope.row.device_count }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                {{ scope.row.status === 'active' ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleViewWaterPointDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AgentList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const agentFormRef = ref(null);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      status: undefined
    });
    
    const statusOptions = [
      { label: '正常', value: 'active' },
      { label: '停用', value: 'inactive' }
    ];
    
    const dialogFormVisible = ref(false);
    const detailDialogVisible = ref(false);
    const waterPointDialogVisible = ref(false);
    const dialogStatus = ref('');
    const currentAgent = ref(null);
    const waterPointList = ref([]);
    
    // 省份选项
    const provinceOptions = [
      { label: '北京市', value: '北京市' },
      { label: '上海市', value: '上海市' },
      { label: '广东省', value: '广东省' },
      { label: '江苏省', value: '江苏省' },
      { label: '浙江省', value: '浙江省' },
      { label: '四川省', value: '四川省' }
    ];
    
    // 城市选项（根据省份动态变化）
    const cityOptions = ref([]);
    
    const cityMap = {
      '北京市': [{ label: '北京市', value: '北京市' }],
      '上海市': [{ label: '上海市', value: '上海市' }],
      '广东省': [
        { label: '广州市', value: '广州市' },
        { label: '深圳市', value: '深圳市' },
        { label: '佛山市', value: '佛山市' },
        { label: '东莞市', value: '东莞市' }
      ],
      '江苏省': [
        { label: '南京市', value: '南京市' },
        { label: '苏州市', value: '苏州市' },
        { label: '无锡市', value: '无锡市' }
      ],
      '浙江省': [
        { label: '杭州市', value: '杭州市' },
        { label: '宁波市', value: '宁波市' },
        { label: '温州市', value: '温州市' }
      ],
      '四川省': [
        { label: '成都市', value: '成都市' },
        { label: '绵阳市', value: '绵阳市' },
        { label: '乐山市', value: '乐山市' }
      ]
    };
    
    const agentForm = reactive({
      id: undefined,
      name: '',
      agent_no: '',
      contact_person: '',
      contact_phone: '',
      email: '',
      province: '',
      city: '',
      address: '',
      agent_type: 'level_1',
      commission_rate: 10,
      status: 'active',
      remark: '',
      water_point_count: 0
    });
    
    const rules = {
      name: [{ required: true, message: '请输入渠道商名称', trigger: 'blur' }],
      agent_no: [{ required: true, message: '请输入渠道商编号', trigger: 'blur' }],
      contact_person: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
      contact_phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入电子邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      province: [{ required: true, message: '请选择省份', trigger: 'change' }],
      city: [{ required: true, message: '请选择城市', trigger: 'change' }],
      address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
      agent_type: [{ required: true, message: '请选择渠道商类型', trigger: 'change' }]
    };
    
    // 获取渠道商列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            name: '北京渠道商',
            agent_no: 'A001',
            contact_person: '张经理',
            contact_phone: '13800138000',
            email: 'beijing@example.com',
            province: '北京市',
            city: '北京市',
            address: '北京市海淀区中关村南大街5号',
            agent_type: 'level_1',
            commission_rate: 15,
            status: 'active',
            remark: '负责北京区域渠道拓展和维护',
            water_point_count: 5,
            created_at: '2023-01-01 10:00:00',
            total_sales: '128500.00',
            total_commission: '19275.00',
            month_commission: '3500.00'
          },
          {
            id: 2,
            name: '上海渠道商',
            agent_no: 'A002',
            contact_person: '李经理',
            contact_phone: '13900139000',
            email: 'shanghai@example.com',
            province: '上海市',
            city: '上海市',
            address: '上海市浦东新区张江高科技园区',
            agent_type: 'level_1',
            commission_rate: 15,
            status: 'active',
            remark: '负责上海区域渠道拓展和维护',
            water_point_count: 3,
            created_at: '2023-01-02 11:30:00',
            total_sales: '98200.00',
            total_commission: '14730.00',
            month_commission: '2800.00'
          },
          {
            id: 3,
            name: '广州渠道商',
            agent_no: 'A003',
            contact_person: '王经理',
            contact_phone: '13700137000',
            email: 'guangzhou@example.com',
            province: '广东省',
            city: '广州市',
            address: '广州市天河区天河路385号',
            agent_type: 'level_1',
            commission_rate: 15,
            status: 'active',
            remark: '负责广州区域渠道拓展和维护',
            water_point_count: 4,
            created_at: '2023-01-03 14:15:00',
            total_sales: '105600.00',
            total_commission: '15840.00',
            month_commission: '3200.00'
          },
          {
            id: 4,
            name: '深圳渠道商',
            agent_no: 'A004',
            contact_person: '赵经理',
            contact_phone: '13600136000',
            email: 'shenzhen@example.com',
            province: '广东省',
            city: '深圳市',
            address: '深圳市南山区科技园',
            agent_type: 'level_2',
            commission_rate: 10,
            status: 'inactive',
            remark: '负责深圳区域渠道拓展和维护',
            water_point_count: 0,
            created_at: '2023-01-04 16:45:00',
            total_sales: '0.00',
            total_commission: '0.00',
            month_commission: '0.00'
          },
          {
            id: 5,
            name: '成都渠道商',
            agent_no: 'A005',
            contact_person: '钱经理',
            contact_phone: '13500135000',
            email: 'chengdu@example.com',
            province: '四川省',
            city: '成都市',
            address: '成都市高新区天府大道',
            agent_type: 'service',
            commission_rate: 8,
            status: 'active',
            remark: '负责成都区域技术服务',
            water_point_count: 2,
            created_at: '2023-01-05 09:20:00',
            total_sales: '58600.00',
            total_commission: '4688.00',
            month_commission: '1200.00'
          }
        ];
        
        total.value = list.value.length;
        listLoading.value = false;
      }, 1000);
    };
    
    // 获取渠道商类型文本
    const getAgentTypeText = (type) => {
      const typeMap = {
        'level_1': '一级渠道商',
        'level_2': '二级渠道商',
        'service': '服务商'
      };
      return typeMap[type] || '未知类型';
    };
    
    // 处理省份变更
    const handleProvinceChange = (province) => {
      agentForm.city = '';
      cityOptions.value = cityMap[province] || [];
    };
    
    // 搜索渠道商
    const handleFilter = () => {
      listQuery.page = 1;
      fetchData();
    };
    
    // 改变每页显示数量
    const handleSizeChange = (val) => {
      listQuery.limit = val;
      fetchData();
    };
    
    // 改变页码
    const handleCurrentChange = (val) => {
      listQuery.page = val;
      fetchData();
    };
    
    // 重置表单
    const resetAgentForm = () => {
      agentForm.id = undefined;
      agentForm.name = '';
      agentForm.agent_no = '';
      agentForm.contact_person = '';
      agentForm.contact_phone = '';
      agentForm.email = '';
      agentForm.province = '';
      agentForm.city = '';
      agentForm.address = '';
      agentForm.agent_type = 'level_1';
      agentForm.commission_rate = 10;
      agentForm.status = 'active';
      agentForm.remark = '';
      agentForm.water_point_count = 0;
      
      // 清空城市选项
      cityOptions.value = [];
    };
    
    // 创建渠道商
    const handleCreate = () => {
      resetAgentForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (agentFormRef.value) {
          agentFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新渠道商
    const handleUpdate = (row) => {
      resetAgentForm();
      Object.assign(agentForm, row);
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      
      // 设置城市选项
      cityOptions.value = cityMap[row.province] || [];
      
      setTimeout(() => {
        if (agentFormRef.value) {
          agentFormRef.value.clearValidate();
        }
      });
    };
    
    // 提交表单
    const submitForm = () => {
      agentFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟创建
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const newAgent = {
              id: Math.round(Math.random() * 1000),
              name: agentForm.name,
              agent_no: agentForm.agent_no,
              contact_person: agentForm.contact_person,
              contact_phone: agentForm.contact_phone,
              email: agentForm.email,
              province: agentForm.province,
              city: agentForm.city,
              address: agentForm.address,
              agent_type: agentForm.agent_type,
              commission_rate: agentForm.commission_rate,
              status: agentForm.status,
              remark: agentForm.remark,
              water_point_count: 0,
              created_at: now,
              total_sales: '0.00',
              total_commission: '0.00',
              month_commission: '0.00'
            };
            
            list.value.unshift(newAgent);
            total.value += 1;
            
            ElMessage({
              message: '渠道商创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新
            const index = list.value.findIndex(item => item.id === agentForm.id);
            if (index !== -1) {
              const updatedAgent = { ...list.value[index], ...agentForm };
              list.value.splice(index, 1, updatedAgent);
              
              ElMessage({
                message: '渠道商信息更新成功',
                type: 'success'
              });
            }
          }
          
          dialogFormVisible.value = false;
        }
      });
    };
    
    // 查看渠道商详情
    const handleDetail = (row) => {
      currentAgent.value = row;
      detailDialogVisible.value = true;
    };
    
    // 查看渠道商取水点
    const handleViewWaterPoints = (row) => {
      currentAgent.value = row;
      waterPointDialogVisible.value = true;
      
      // 模拟获取取水点列表
      fetchWaterPoints(row.id);
    };
    
    // 获取取水点列表
    const fetchWaterPoints = (agentId) => {
      // 模拟API调用获取取水点列表
      const agent = list.value.find(item => item.id === agentId);
      if (!agent) {
        waterPointList.value = [];
        return;
      }
      
      const count = agent.water_point_count;
      if (count <= 0) {
        waterPointList.value = [];
        return;
      }
      
      const city = agent.city;
      waterPointList.value = Array.from({ length: count }, (_, i) => {
        const id = agentId * 100 + i + 1;
        return {
          id,
          name: `${city}取水点${i + 1}`,
          point_no: `WP${String(id).padStart(3, '0')}`,
          address: `${agent.province}${city}某地址${i + 1}`,
          device_count: Math.floor(Math.random() * 5) + 1,
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          created_at: agent.created_at,
          agent_id: agentId,
          agent_name: agent.name
        };
      });
    };
    
    // 查看取水点详情
    const handleViewWaterPointDetail = (waterPoint) => {
      // 实际情况应该是跳转到取水点详情页或打开详情弹窗
      ElMessage({
        message: `查看取水点详情: ${waterPoint.name}`,
        type: 'info'
      });
    };
    
    // 更新渠道商状态
    const handleUpdateStatus = (row) => {
      const isActive = row.status === 'active';
      const statusText = isActive ? '停用' : '启用';
      
      ElMessageBox.confirm(
        `确认${statusText}该渠道商吗？${isActive ? '停用后该渠道商将无法继续业务操作。' : ''}`,
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: isActive ? 'warning' : 'info'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          list.value[index].status = isActive ? 'inactive' : 'active';
          
          ElMessage({
            type: 'success',
            message: `渠道商${statusText}成功`
          });
        }
      });
    };
    
    onMounted(() => {
      fetchData();
    });
    
    return {
      listLoading,
      list,
      total,
      listQuery,
      statusOptions,
      provinceOptions,
      cityOptions,
      dialogFormVisible,
      detailDialogVisible,
      waterPointDialogVisible,
      dialogStatus,
      agentForm,
      agentFormRef,
      currentAgent,
      waterPointList,
      handleProvinceChange,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      submitForm,
      handleDetail,
      handleViewWaterPoints,
      handleViewWaterPointDetail,
      handleUpdateStatus,
      getAgentTypeText
    };
  }
};
</script>

<style scoped>
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

.area-select {
  display: flex;
  justify-content: space-between;
}

.agent-detail {
  padding: 0 10px;
}

.detail-section {
  margin-top: 20px;
}

.section-title {
  margin: 10px 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-placeholder {
  height: 300px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  margin-top: 10px;
}

.agent-info {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.agent-info h4 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #303133;
}

.agent-info p {
  margin: 5px 0;
  color: #606266;
}
</style> 