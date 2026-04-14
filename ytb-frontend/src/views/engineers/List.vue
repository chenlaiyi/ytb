<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="姓名/手机号"
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
        新增工程师
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
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column prop="id_card" label="身份证号" width="180" />
      <el-table-column prop="area" label="负责区域" min-width="180" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="250" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button
            :type="scope.row.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="handleUpdateStatus(scope.row)"
          >
            {{ scope.row.status === 'active' ? '设为离职' : '设为在职' }}
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleDelete(scope.row)"
          >
            删除
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
    
    <!-- 新增/编辑工程师弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增工程师' : '编辑工程师'"
      v-model="dialogFormVisible"
      width="40%"
    >
      <el-form
        ref="engineerFormRef"
        :model="engineerForm"
        :rules="rules"
        label-position="left"
        label-width="100px"
        style="padding: 0 20px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="engineerForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="engineerForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="engineerForm.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="负责区域" prop="area">
          <el-input v-model="engineerForm.area" placeholder="请输入负责区域" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="engineerForm.remark" 
            type="textarea" 
            placeholder="请输入备注信息" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="engineerForm.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
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
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'EngineerList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const engineerFormRef = ref(null);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      status: undefined
    });
    
    const statusOptions = [
      { label: '在职', value: 'active' },
      { label: '离职', value: 'inactive' }
    ];
    
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    
    // 工程师表单默认值
    const defaultEngineerForm = {
      id: undefined,
      name: '',
      phone: '',
      id_card: '',
      area: '',
      remark: '',
      status: 'active'
    };
    
    const engineerForm = reactive(Object.assign({}, defaultEngineerForm));
    
    // 表单验证规则
    const rules = {
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
      ],
      id_card: [
        { required: true, message: '请输入身份证号', trigger: 'blur' },
        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号格式', trigger: 'blur' }
      ],
      area: [{ required: true, message: '请输入负责区域', trigger: 'blur' }]
    };
    
    // 获取工程师列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            name: '张工',
            phone: '13800138001',
            id_card: '110101199001011234',
            area: '北京市朝阳区',
            status: 'active',
            remark: '负责朝阳区设备维护',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 2,
            name: '李工',
            phone: '13800138002',
            id_card: '110101199001021234',
            area: '北京市海淀区',
            status: 'active',
            remark: '负责海淀区设备维护',
            created_at: '2023-01-02 00:00:00'
          }
        ];
        total.value = 2;
        listLoading.value = false;
      }, 500);
    };
    
    // 搜索
    const handleFilter = () => {
      listQuery.page = 1;
      fetchData();
    };
    
    // 切换每页显示数量
    const handleSizeChange = (val) => {
      listQuery.limit = val;
      fetchData();
    };
    
    // 切换页码
    const handleCurrentChange = (val) => {
      listQuery.page = val;
      fetchData();
    };
    
    // 新增工程师
    const handleCreate = () => {
      Object.assign(engineerForm, defaultEngineerForm);
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      setTimeout(() => {
        if (engineerFormRef.value) {
          engineerFormRef.value.clearValidate();
        }
      });
    };
    
    // 编辑工程师
    const handleUpdate = (row) => {
      Object.assign(engineerForm, row);
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      setTimeout(() => {
        if (engineerFormRef.value) {
          engineerFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新工程师状态
    const handleUpdateStatus = (row) => {
      const statusText = row.status === 'active' ? '离职' : '在职';
      ElMessageBox.confirm(
        `确认要将该工程师设为${statusText}状态吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const newStatus = row.status === 'active' ? 'inactive' : 'active';
        // 模拟API调用
        setTimeout(() => {
          row.status = newStatus;
          ElMessage({
            type: 'success',
            message: `状态更新成功！`
          });
        }, 300);
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 删除工程师
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确认要删除该工程师吗？此操作不可恢复！',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟API调用
        setTimeout(() => {
          const index = list.value.findIndex(item => item.id === row.id);
          if (index > -1) {
            list.value.splice(index, 1);
            total.value -= 1;
          }
          ElMessage({
            type: 'success',
            message: '删除成功！'
          });
        }, 300);
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 提交表单
    const submitForm = () => {
      if (!engineerFormRef.value) return;
      
      engineerFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟新增API调用
            setTimeout(() => {
              engineerForm.id = list.value.length + 1;
              engineerForm.created_at = new Date().toLocaleString();
              list.value.unshift(JSON.parse(JSON.stringify(engineerForm)));
              total.value += 1;
              dialogFormVisible.value = false;
              ElMessage({
                type: 'success',
                message: '创建成功！'
              });
            }, 300);
          } else {
            // 模拟更新API调用
            setTimeout(() => {
              const index = list.value.findIndex(item => item.id === engineerForm.id);
              if (index > -1) {
                list.value.splice(index, 1, JSON.parse(JSON.stringify(engineerForm)));
              }
              dialogFormVisible.value = false;
              ElMessage({
                type: 'success',
                message: '更新成功！'
              });
            }, 300);
          }
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
      dialogFormVisible,
      dialogStatus,
      engineerForm,
      engineerFormRef,
      rules,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      handleUpdateStatus,
      handleDelete,
      submitForm
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

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 