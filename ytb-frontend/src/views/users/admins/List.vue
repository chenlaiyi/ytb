<template>
  <div class="admin-users-container">
    <div class="header">
      <h1>后台管理员</h1>
      <el-button type="primary" @click="handleCreate">新增管理员</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item>
          <el-input v-model="queryParams.keyword" placeholder="用户名/姓名/邮箱/电话" clearable />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.role" placeholder="角色" clearable>
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="普通管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.status" placeholder="状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="adminList"
      border
      style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.role === 'super_admin'">超级管理员</el-tag>
          <el-tag v-else>普通管理员</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login_at" label="最后登录时间" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.status === 'active'">正常</el-tag>
          <el-tag type="danger" v-else>禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="200">
        <template #default="scope">
          <el-button 
            size="small" 
            @click="handleEdit(scope.row)"
            :disabled="scope.row.id === 1 && currentUser.id !== 1">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)"
            :disabled="scope.row.id === currentUser.id || (scope.row.id === 1 && currentUser.id !== 1)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryParams.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="queryParams.per_page"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogType === 'create' ? '新增管理员' : '编辑管理员'" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="普通管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useStore } from 'vuex';
import { getAdminList, getAdminDetail, createAdmin, updateAdmin, deleteAdmin, updateAdminStatus, resetAdminPassword } from '@/api/v1/admin';
import { getAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'AdminUsersList',
  setup() {
    const store = useStore();
    const currentUser = computed(() => store.state.user);
    
    // 表格数据
    const loading = ref(false);
    const adminList = ref([]);
    const total = ref(0);
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      per_page: 10,
      keyword: '',
      role: '',
      status: ''
    });
    
    // 表单相关
    const dialogVisible = ref(false);
    const dialogType = ref('create'); // create 或 edit
    const formRef = ref(null);
    const form = reactive({
      id: undefined,
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: 'admin',
      status: 'active'
    });
    
    // 表单验证规则
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    };
    
    // 获取管理员列表
    const getList = async() => {
      loading.value = true;
      try {
        const token = getAdminToken();
        
        // 构建清理过的查询参数
        const cleanParams = {};
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] !== '' && queryParams[key] !== null && queryParams[key] !== undefined) {
            cleanParams[key] = queryParams[key];
          }
        });
        
        const response = await getAdminList(cleanParams);
        
        if (response && response.code === 200) {
          // 处理数据
          adminList.value = response.data.data || [];
          total.value = response.data.total || 0;
        } else {
          console.warn('响应格式不正确:', response);
          adminList.value = [];
          total.value = 0;
          ElMessage.error(response.message || '获取管理员列表失败');
        }
      } catch (error) {
        console.error('获取管理员列表失败:', error);
        console.error('错误详情:', error.response || error.message || error);
        ElMessage.error('获取管理员列表失败');
        adminList.value = [];
        total.value = 0;
      } finally {
        loading.value = false;
      }
    };
    
    // 搜索
    const handleSearch = () => {
      queryParams.page = 1;
      getList();
    };
    
    // 重置搜索
    const resetQuery = () => {
      queryParams.keyword = '';
      queryParams.role = '';
      queryParams.status = '';
      queryParams.page = 1;
      getList();
    };
    
    // 分页相关
    const handleSizeChange = (size) => {
      queryParams.per_page = size;
      getList();
    };
    
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      getList();
    };
    
    // 新增
    const handleCreate = () => {
      dialogType.value = 'create';
      form.id = undefined;
      form.username = '';
      form.password = '';
      form.name = '';
      form.email = '';
      form.phone = '';
      form.role = 'admin';
      form.status = 'active';
      dialogVisible.value = true;
    };
    
    // 编辑
    const handleEdit = (row) => {
      dialogType.value = 'edit';
      form.id = row.id;
      form.username = row.username;
      form.password = '';
      form.name = row.name;
      form.email = row.email || '';
      form.phone = row.phone || '';
      form.role = row.role;
      form.status = row.status;
      dialogVisible.value = true;
    };
    
    // 删除
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除该管理员吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async() => {
        try {
          const response = await deleteAdmin(row.id);
          if (response.code === 200) {
            ElMessage.success('删除成功');
            getList();
          } else {
            throw new Error(response.message || '删除管理员失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          ElMessage.error(error.message || '删除失败');
        }
      }).catch(() => {});
    };
    
    // 提交表单
    const submitForm = () => {
      formRef.value.validate(async(valid) => {
        if (valid) {
          const isCreate = dialogType.value === 'create';
          const data = { ...form };
          
          // 如果是编辑并且没有填写密码，则不发送密码字段
          if (!isCreate && !data.password) {
            delete data.password;
          }
          
          // 移除id字段
          if (data.id !== undefined) {
            delete data.id;
          }
          
          try {
            let response;
            if (isCreate) {
              response = await createAdmin(data);
            } else {
              response = await updateAdmin(form.id, data);
            }
            
            if (response.code === 200) {
              ElMessage.success(isCreate ? '创建成功' : '更新成功');
              dialogVisible.value = false;
              getList();
            } else {
              throw new Error(response.message || (isCreate ? '创建管理员失败' : '更新管理员失败'));
            }
          } catch (error) {
            console.error(isCreate ? '创建失败:' : '更新失败:', error);
            ElMessage.error(isCreate ? '创建失败' : '更新失败');
          }
        } else {
          return false;
        }
      });
    };
    
    onMounted(() => {
      getList();
    });
    
    return {
      loading,
      adminList,
      total,
      queryParams,
      dialogVisible,
      dialogType,
      formRef,
      form,
      rules,
      currentUser,
      handleSearch,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleEdit,
      handleDelete,
      submitForm
    };
  }
};
</script>

<style scoped>
.admin-users-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 
