<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="用户名/手机/邮箱"
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
        新增用户
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
      <el-table-column prop="name" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户角色" width="120" align="center">
        <template #default="scope">
          <el-tag type="primary">{{ getRoleNameById(scope.row.role_id) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180" />
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
            {{ scope.row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button 
            v-if="scope.row.role_id !== 1" 
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
    
    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增用户' : '编辑用户'"
      v-model="dialogFormVisible"
      width="40%"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="rules"
        label-position="left"
        label-width="100px"
        style="padding: 0 20px"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item v-if="dialogStatus === 'create'" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item v-if="dialogStatus === 'create'" label="确认密码" prop="password_confirmation">
          <el-input v-model="userForm.password_confirmation" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="用户角色" prop="role_id">
          <el-select v-model="userForm.role_id" placeholder="请选择用户角色" style="width: 100%">
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">禁用</el-radio>
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
  name: 'UserList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const userFormRef = ref(null);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      status: undefined
    });
    
    const statusOptions = [
      { label: '正常', value: 'active' },
      { label: '禁用', value: 'inactive' }
    ];
    
    const roleOptions = [
      { id: 1, name: '超级管理员' },
      { id: 2, name: '管理员' },
      { id: 3, name: '运营' },
      { id: 4, name: '客服' }
    ];
    
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    
    // 用户表单默认值
    const defaultUserForm = {
      id: undefined,
      name: '',
      nickname: '',
      phone: '',
      email: '',
      password: '',
      password_confirmation: '',
      role_id: 2,
      status: 'active'
    };
    
    const userForm = reactive(Object.assign({}, defaultUserForm));
    
    // 表单验证规则
    const validatePass = (rule, value, callback) => {
      if (userForm.password !== value) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    const rules = {
      name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ],
      password_confirmation: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validatePass, trigger: 'blur' }
      ],
      role_id: [{ required: true, message: '请选择用户角色', trigger: 'change' }]
    };
    
    // 获取用户列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            name: 'admin',
            nickname: '超级管理员',
            phone: '13800138000',
            email: 'admin@example.com',
            role_id: 1,
            status: 'active',
            created_at: '2023-01-01 00:00:00'
          },
          {
            id: 2,
            name: 'manager',
            nickname: '管理员小李',
            phone: '13900139000',
            email: 'manager@example.com',
            role_id: 2,
            status: 'active',
            created_at: '2023-01-02 00:00:00'
          },
          {
            id: 3,
            name: 'operator',
            nickname: '运营张三',
            phone: '13700137000',
            email: 'operator@example.com',
            role_id: 3,
            status: 'active',
            created_at: '2023-01-03 00:00:00'
          },
          {
            id: 4,
            name: 'service',
            nickname: '客服李四',
            phone: '13600136000',
            email: 'service@example.com',
            role_id: 4,
            status: 'inactive',
            created_at: '2023-01-04 00:00:00'
          }
        ];
        
        total.value = list.value.length;
        listLoading.value = false;
      }, 1000);
    };
    
    // 根据角色ID获取角色名称
    const getRoleNameById = (roleId) => {
      const role = roleOptions.find(item => item.id === roleId);
      return role ? role.name : '未知角色';
    };
    
    // 搜索用户
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
    
    // 重置用户表单
    const resetUserForm = () => {
      Object.assign(userForm, defaultUserForm);
    };
    
    // 创建用户
    const handleCreate = () => {
      resetUserForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (userFormRef.value) {
          userFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新用户
    const handleUpdate = (row) => {
      resetUserForm();
      Object.assign(userForm, row);
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (userFormRef.value) {
          userFormRef.value.clearValidate();
        }
      });
    };
    
    // 提交表单
    const submitForm = () => {
      userFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟创建用户
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const newUser = {
              id: Math.round(Math.random() * 1000),
              name: userForm.name,
              nickname: userForm.nickname,
              phone: userForm.phone,
              email: userForm.email,
              role_id: userForm.role_id,
              status: userForm.status,
              created_at: now
            };
            
            list.value.unshift(newUser);
            total.value += 1;
            
            ElMessage({
              message: '用户创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新用户
            const index = list.value.findIndex(item => item.id === userForm.id);
            if (index !== -1) {
              const updatedUser = { ...list.value[index], ...userForm };
              list.value.splice(index, 1, updatedUser);
              
              ElMessage({
                message: '用户信息更新成功',
                type: 'success'
              });
            }
          }
          
          dialogFormVisible.value = false;
        }
      });
    };
    
    // 更新用户状态
    const handleUpdateStatus = (row) => {
      const isActive = row.status === 'active';
      const statusText = isActive ? '禁用' : '启用';
      
      ElMessageBox.confirm(
        `确认${statusText}该用户吗？`,
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
            message: `用户${statusText}成功`
          });
        }
      });
    };
    
    // 删除用户
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确认删除该用户吗？删除后数据无法恢复。',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          list.value.splice(index, 1);
          total.value -= 1;
          
          ElMessage({
            type: 'success',
            message: '用户删除成功'
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
      roleOptions,
      dialogFormVisible,
      dialogStatus,
      userForm,
      userFormRef,
      rules,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      submitForm,
      handleUpdateStatus,
      handleDelete,
      getRoleNameById
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
</style> 