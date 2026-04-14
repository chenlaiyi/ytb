<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="取水点名称/编号"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.status"
        placeholder="设备状态"
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
      <el-select
        v-model="listQuery.agent_id"
        placeholder="所属渠道商"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option
          v-for="item in agentOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" icon="Plus" @click="handleCreate">
        新增取水点
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
      <el-table-column prop="name" label="取水点名称" min-width="140" />
      <el-table-column prop="point_no" label="编号" width="120" align="center" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="坐标" width="180" align="center">
        <template #default="scope">
          {{ scope.row.latitude }}, {{ scope.row.longitude }}
        </template>
      </el-table-column>
      <el-table-column prop="agent_name" label="所属渠道商" width="120" align="center" />
      <el-table-column label="设备数量" width="100" align="center">
        <template #default="scope">
          <el-button type="text" @click="handleViewDevices(scope.row)">
            {{ scope.row.device_count }}
          </el-button>
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
      <el-table-column label="操作" width="260" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button
            type="success"
            size="small"
            icon="Position"
            @click="handleMapView(scope.row)"
          >
            地图
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
    
    <!-- 新增/编辑取水点弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增取水点' : '编辑取水点'"
      v-model="dialogFormVisible"
      width="50%"
    >
      <el-form
        ref="dataFormRef"
        :model="temp"
        :rules="rules"
        label-position="left"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="取水点名称" prop="name">
          <el-input v-model="temp.name" placeholder="请输入取水点名称" />
        </el-form-item>
        <el-form-item label="编号" prop="point_no">
          <el-input v-model="temp.point_no" placeholder="请输入取水点编号" />
        </el-form-item>
        <el-form-item label="所属渠道商" prop="agent_id">
          <el-select
            v-model="temp.agent_id"
            placeholder="请选择渠道商"
            style="width: 100%"
          >
            <el-option
              v-for="item in agentOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="temp.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="地理坐标">
          <div class="coordinate-inputs">
            <el-input
              v-model="temp.latitude"
              placeholder="纬度"
              style="width: 48%"
            />
            <el-input
              v-model="temp.longitude"
              placeholder="经度"
              style="width: 48%"
            />
          </div>
          <div class="map-selection">
            <el-button type="primary" size="small" style="margin-top: 10px" @click="handleOpenMap">
              在地图上选择位置
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="temp.contact_person" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="temp.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="取水点描述">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
            placeholder="请输入取水点描述信息"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="temp.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 设备列表弹窗 -->
    <el-dialog
      title="取水点设备列表"
      v-model="deviceDialogVisible"
      width="70%"
    >
      <div v-if="currentPoint">
        <div class="point-info">
          <h4>{{ currentPoint.name }}</h4>
          <p>地址: {{ currentPoint.address }}</p>
        </div>
        <el-table :data="deviceList" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="device_no" label="设备编号" width="120" />
          <el-table-column prop="device_name" label="设备名称" width="150" />
          <el-table-column prop="device_type" label="设备类型" width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getDeviceStatusType(scope.row.status)">
                {{ getDeviceStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="水量" width="100" align="center">
            <template #default="scope">
              {{ scope.row.current_water_level }}%
            </template>
          </el-table-column>
          <el-table-column prop="last_online_time" label="最后在线时间" width="180" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleViewDeviceDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
    
    <!-- 地图查看弹窗 -->
    <el-dialog
      title="取水点位置"
      v-model="mapDialogVisible"
      width="80%"
    >
      <div v-if="currentPoint" class="map-container">
        <div class="point-info">
          <h4>{{ currentPoint.name }}</h4>
          <p>地址: {{ currentPoint.address }}</p>
          <p>坐标: {{ currentPoint.latitude }}, {{ currentPoint.longitude }}</p>
        </div>
        <div class="map-placeholder">
          <div class="map-overlay">
            <div class="map-point"></div>
          </div>
          <p class="map-text">这里将集成地图显示功能</p>
          <p class="map-text">坐标: {{ currentPoint.latitude }}, {{ currentPoint.longitude }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'WaterPointsList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const dataFormRef = ref(null);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      status: undefined,
      agent_id: undefined
    });
    
    const statusOptions = [
      { label: '正常', value: 'active' },
      { label: '停用', value: 'inactive' }
    ];
    
    const agentOptions = ref([]);
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    const currentPoint = ref(null);
    const deviceDialogVisible = ref(false);
    const mapDialogVisible = ref(false);
    const deviceList = ref([]);
    
    const defaultTemp = {
      id: undefined,
      name: '',
      point_no: '',
      agent_id: undefined,
      agent_name: '',
      address: '',
      latitude: '',
      longitude: '',
      contact_person: '',
      contact_phone: '',
      description: '',
      status: 'active',
      device_count: 0
    };
    
    const temp = reactive(Object.assign({}, defaultTemp));
    
    const rules = {
      name: [{ required: true, message: '取水点名称不能为空', trigger: 'blur' }],
      point_no: [{ required: true, message: '取水点编号不能为空', trigger: 'blur' }],
      agent_id: [{ required: true, message: '请选择所属渠道商', trigger: 'change' }],
      address: [{ required: true, message: '详细地址不能为空', trigger: 'blur' }],
      contact_person: [{ required: true, message: '联系人不能为空', trigger: 'blur' }],
      contact_phone: [
        { required: true, message: '联系电话不能为空', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ]
    };
    
    // 获取取水点列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            name: '中关村科技园区取水点',
            point_no: 'WP001',
            agent_id: 1,
            agent_name: '北京渠道商',
            address: '北京市海淀区中关村南大街5号',
            latitude: '39.908823',
            longitude: '116.397470',
            contact_person: '张经理',
            contact_phone: '13800138000',
            description: '位于中关村科技园区，主要服务周边科技企业',
            status: 'active',
            device_count: 5,
            created_at: '2023-01-01 10:00:00'
          },
          {
            id: 2,
            name: '张江高科取水点',
            point_no: 'WP002',
            agent_id: 2,
            agent_name: '上海渠道商',
            address: '上海市浦东新区张江高科技园区',
            latitude: '31.203405',
            longitude: '121.607224',
            contact_person: '李经理',
            contact_phone: '13900139000',
            description: '位于张江高科技园区，方便科技企业员工取水',
            status: 'active',
            device_count: 3,
            created_at: '2023-01-02 11:30:00'
          },
          {
            id: 3,
            name: '天河城取水点',
            point_no: 'WP003',
            agent_id: 3,
            agent_name: '广州渠道商',
            address: '广州市天河区天河路385号天河城',
            latitude: '23.132631',
            longitude: '113.327080',
            contact_person: '王经理',
            contact_phone: '13700137000',
            description: '位于天河城购物中心，方便购物人群取水',
            status: 'active',
            device_count: 4,
            created_at: '2023-01-03 14:15:00'
          },
          {
            id: 4,
            name: '科技园取水点',
            point_no: 'WP004',
            agent_id: 4,
            agent_name: '深圳渠道商',
            address: '深圳市南山区科技园',
            latitude: '22.540470',
            longitude: '113.934753',
            contact_person: '赵经理',
            contact_phone: '13600136000',
            description: '位于深圳科技园，服务高新技术企业',
            status: 'inactive',
            device_count: 0,
            created_at: '2023-01-04 16:45:00'
          }
        ];
        
        total.value = list.value.length;
        listLoading.value = false;
      }, 1000);
    };
    
    // 获取渠道商数据
    const fetchAgents = () => {
      // 模拟API调用获取渠道商列表
      agentOptions.value = [
        { id: 1, name: '北京渠道商' },
        { id: 2, name: '上海渠道商' },
        { id: 3, name: '广州渠道商' },
        { id: 4, name: '深圳渠道商' },
        { id: 5, name: '成都渠道商' }
      ];
    };
    
    // 搜索取水点
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
    const resetTemp = () => {
      Object.assign(temp, defaultTemp);
    };
    
    // 创建取水点
    const handleCreate = () => {
      resetTemp();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (dataFormRef.value) {
          dataFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新取水点
    const handleUpdate = (row) => {
      Object.assign(temp, row);
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (dataFormRef.value) {
          dataFormRef.value.clearValidate();
        }
      });
    };
    
    // 提交表单
    const submitForm = () => {
      dataFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟创建
            temp.id = Math.round(Math.random() * 1000);
            temp.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const selectedAgent = agentOptions.value.find(agent => agent.id === temp.agent_id);
            temp.agent_name = selectedAgent ? selectedAgent.name : '';
            
            list.value.unshift(Object.assign({}, temp));
            total.value += 1;
            
            ElMessage({
              message: '取水点创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新
            const index = list.value.findIndex(item => item.id === temp.id);
            if (index !== -1) {
              const selectedAgent = agentOptions.value.find(agent => agent.id === temp.agent_id);
              temp.agent_name = selectedAgent ? selectedAgent.name : temp.agent_name;
              
              list.value.splice(index, 1, Object.assign({}, temp));
              
              ElMessage({
                message: '取水点信息更新成功',
                type: 'success'
              });
            }
          }
          
          dialogFormVisible.value = false;
        }
      });
    };
    
    // 更新取水点状态
    const handleUpdateStatus = (row) => {
      const isActive = row.status === 'active';
      const statusText = isActive ? '停用' : '启用';
      
      ElMessageBox.confirm(
        `确认${statusText}该取水点吗？`,
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
            message: `取水点${statusText}成功`
          });
        }
      });
    };
    
    // 查看取水点设备
    const handleViewDevices = (row) => {
      currentPoint.value = row;
      deviceDialogVisible.value = true;
      
      // 模拟获取设备列表
      deviceList.value = row.device_count > 0 ? Array.from({ length: row.device_count }, (_, i) => ({
        id: row.id * 100 + i + 1,
        device_no: `D${row.point_no}-${i + 1}`,
        device_name: `${row.name}-设备${i + 1}`,
        device_type: i % 2 === 0 ? '商用型' : '家用型',
        status: ['online', 'offline', 'maintenance'][Math.floor(Math.random() * 3)],
        current_water_level: Math.floor(Math.random() * 100),
        last_online_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })) : [];
    };
    
    // 查看设备详情
    const handleViewDeviceDetail = (device) => {
      // 模拟跳转到设备详情页
      ElMessage({
        message: `查看设备详情: ${device.device_name}`,
        type: 'info'
      });
    };
    
    // 获取设备状态类型
    const getDeviceStatusType = (status) => {
      const statusMap = {
        'online': 'success',
        'offline': 'danger',
        'maintenance': 'warning'
      };
      return statusMap[status] || 'info';
    };
    
    // 获取设备状态文本
    const getDeviceStatusText = (status) => {
      const statusMap = {
        'online': '在线',
        'offline': '离线',
        'maintenance': '维护中'
      };
      return statusMap[status] || '未知状态';
    };
    
    // 在地图上查看位置
    const handleMapView = (row) => {
      currentPoint.value = row;
      mapDialogVisible.value = true;
    };
    
    // 打开地图选择坐标
    const handleOpenMap = () => {
      ElMessage({
        message: '打开地图选择位置功能待集成',
        type: 'info'
      });
    };
    
    onMounted(() => {
      fetchAgents();
      fetchData();
    });
    
    return {
      listLoading,
      list,
      total,
      listQuery,
      statusOptions,
      agentOptions,
      dialogFormVisible,
      dialogStatus,
      temp,
      rules,
      dataFormRef,
      currentPoint,
      deviceDialogVisible,
      mapDialogVisible,
      deviceList,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      submitForm,
      handleUpdateStatus,
      handleViewDevices,
      handleViewDeviceDetail,
      getDeviceStatusType,
      getDeviceStatusText,
      handleMapView,
      handleOpenMap
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

.coordinate-inputs {
  display: flex;
  justify-content: space-between;
}

.point-info {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.point-info h4 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #303133;
}

.point-info p {
  margin: 5px 0;
  color: #606266;
}

.map-container {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.map-placeholder {
  flex-grow: 1;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

.map-text {
  margin: 10px 0;
  color: #909399;
  font-size: 14px;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-point {
  width: 20px;
  height: 20px;
  background-color: #409eff;
  border-radius: 50%;
  position: relative;
}

.map-point:after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background-color: rgba(64, 158, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
</style> 