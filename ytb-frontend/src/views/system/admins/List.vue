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
          <el-select v-model="queryParams.branch_id" placeholder="分支机构" clearable>
            <el-option label="总后台" value="null" />
            <el-option v-for="branch in branchOptions" :key="branch.id" :label="branch.name" :value="branch.id" />
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
      <el-table-column label="头像" width="80" align="center">
        <template #default="scope">
          <el-avatar 
            :size="40" 
            :src="scope.row.wechat_avatar || scope.row.avatar" 
            :alt="scope.row.name"
            fit="cover">
            <template #default>
              <el-icon><User /></el-icon>
            </template>
          </el-avatar>
        </template>
      </el-table-column>
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
      <el-table-column label="分支机构" width="150">
        <template #default="scope">
          <el-tag v-if="scope.row.id === 1 || scope.row.id === 7" type="success">总后台</el-tag>
          <el-tag v-else-if="scope.row.branch" type="primary">{{ scope.row.branch.name }}</el-tag>
          <el-tag v-else type="info">总后台</el-tag>
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
    <el-dialog 
      :title="dialogType === 'create' ? '新增管理员' : '编辑管理员'" 
      v-model="dialogVisible" 
      width="700px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="admin-dialog">
      
      <div class="dialog-content">
        <!-- 管理员信息卡片 -->
        <el-card class="admin-info-card" shadow="never" v-if="dialogType === 'edit'">
          <div class="admin-info-header">
            <div class="avatar-section">
              <el-avatar :size="60" :src="form.avatar" class="admin-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="avatar-upload">
                <el-button size="small" type="text">更换头像</el-button>
              </div>
            </div>
            <div class="basic-info">
              <h3>{{ form.name || '未设置姓名' }}</h3>
              <p class="username">@{{ form.username }}</p>
              <el-tag :type="form.role === 'super_admin' ? 'success' : 'primary'" size="small">
                {{ form.role === 'super_admin' ? '超级管理员' : '普通管理员' }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 表单区域 -->
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="admin-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="form.username" 
                  placeholder="请输入用户名"
                  :disabled="dialogType === 'edit'"
                  prefix-icon="User" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input 
                  v-model="form.name" 
                  placeholder="请输入姓名"
                  prefix-icon="UserFilled" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20" v-if="dialogType === 'create'">
            <el-col :span="12">
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="form.password" 
                  type="password" 
                  placeholder="请输入密码"
                  prefix-icon="Lock"
                  show-password />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="form.confirmPassword" 
                  type="password" 
                  placeholder="请再次输入密码"
                  prefix-icon="Lock"
                  show-password />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input 
                  v-model="form.email" 
                  placeholder="请输入邮箱地址"
                  prefix-icon="Message" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input 
                  v-model="form.phone" 
                  placeholder="请输入手机号码"
                  prefix-icon="Phone" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="角色" prop="role">
                <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
                  <el-option label="超级管理员" value="super_admin">
                    <span style="float: left">超级管理员</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">全部权限</span>
                  </el-option>
                  <el-option label="普通管理员" value="admin">
                    <span style="float: left">普通管理员</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">限制权限</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分支机构" prop="branch_id">
                <el-select v-model="form.branch_id" placeholder="请选择分支机构" style="width: 100%">
                  <el-option label="总后台" :value="3">
                    <span style="float: left">总后台</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">管理全部</span>
                  </el-option>
                  <el-option 
                    v-for="branch in branchOptions" 
                    :key="branch.id" 
                    :label="branch.name" 
                    :value="branch.id">
                    <span style="float: left">{{ branch.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ branch.code }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio label="active">
                    <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                    正常
                  </el-radio>
                  <el-radio label="disabled">
                    <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                    禁用
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="dialogType === 'edit'">
              <el-form-item label="最后登录">
                <el-text type="info" size="small">
                  {{ form.last_login_at ? formatDate(form.last_login_at) : '从未登录' }}
                </el-text>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 备注信息 -->
          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="form.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入备注信息（可选）"
              maxlength="200"
              show-word-limit />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button type="primary" @click="submitForm" size="large" :loading="submitLoading">
            <el-icon><Check /></el-icon>
            {{ dialogType === 'create' ? '创建' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User, UserFilled, Lock, Message, Phone, CircleCheckFilled, CircleCloseFilled, Close, Check } from '@element-plus/icons-vue';
import { useStore } from 'vuex';
import { getAdminList, getAdminDetail, createAdmin, updateAdmin, deleteAdmin, updateAdminStatus, resetAdminPassword } from '@/api/v1/admin';
import { getBranchList } from '@/api/v1/branch';
import { getAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'AdminUsersList',
  components: {
    User
  },
  setup() {
    const store = useStore();
    const currentUser = computed(() => store.state.user);
    
    // 表格数据
    const loading = ref(false);
    const adminList = ref([]);
    const total = ref(0);
    
    // 分支机构数据
    const branchOptions = ref([]);
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      per_page: 10,
      keyword: '',
      role: '',
      status: '',
      branch_id: ''
    });
    
    // 表单相关
    const dialogVisible = ref(false);
    const dialogType = ref('create'); // create 或 edit
    const formRef = ref(null);
    const submitLoading = ref(false);
    const form = reactive({
      id: undefined,
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      phone: '',
      role: 'admin',
      status: 'active',
      branch_id: 3,
      remark: '',
      avatar: '',
      last_login_at: ''
    });
    
    // 表单验证规则
    const validateConfirmPassword = (rule, value, callback) => {
      if (dialogType.value === 'create' && value !== form.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3-20 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6-20 个字符', trigger: 'blur' },
        { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码必须包含字母和数字', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在 2-10 个字符', trigger: 'blur' }
      ],
      email: [
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      branch_id: [
        { required: true, message: '请选择分支机构', trigger: 'change' }
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
        
        if (response && response.code === 0) {
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
    
    // 获取分支机构列表
    const getBranchOptions = async() => {
      try {
        const response = await getBranchList();
        if (response && response.code === 0) {
          branchOptions.value = response.data || [];
        }
      } catch (error) {
        console.error('获取分支机构列表失败:', error);
      }
    };
    
    // 重置搜索
    const resetQuery = () => {
      queryParams.keyword = '';
      queryParams.role = '';
      queryParams.status = '';
      queryParams.branch_id = '';
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
          if (response.code === 0) {
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
          submitLoading.value = true;
          const isCreate = dialogType.value === 'create';
          const data = { ...form };
          
          // 如果是编辑并且没有填写密码，则不发送密码字段
          if (!isCreate && !data.password) {
            delete data.password;
          }
          
          // 移除不需要的字段
          delete data.id;
          delete data.confirmPassword;
          delete data.avatar;
          delete data.last_login_at;
          
          // 如果是编辑模式且没有修改密码，删除密码字段
          if (!isCreate && !data.password) {
            delete data.password;
          }
          
          try {
            let response;
            if (isCreate) {
              response = await createAdmin(data);
            } else {
              response = await updateAdmin(form.id, data);
            }
            
            if (response.code === 0) {
              ElMessage.success({
                message: isCreate ? '管理员创建成功！' : '管理员信息更新成功！',
                type: 'success',
                duration: 3000
              });
              dialogVisible.value = false;
              
              // 重置表单
              Object.assign(form, {
                id: undefined,
                username: '',
                password: '',
                confirmPassword: '',
                name: '',
                email: '',
                phone: '',
                role: 'admin',
                status: 'active',
                branch_id: 3,
                remark: '',
                avatar: '',
                last_login_at: ''
              });
              
              getList();
            } else {
              throw new Error(response.message || (isCreate ? '创建管理员失败' : '更新管理员失败'));
            }
          } catch (error) {
            console.error(isCreate ? '创建失败:' : '更新失败:', error);
            ElMessage.error({
              message: error.message || (isCreate ? '创建失败，请检查输入信息' : '更新失败，请稍后重试'),
              type: 'error',
              duration: 5000
            });
          } finally {
            submitLoading.value = false;
          }
        } else {
          ElMessage.warning('请检查表单信息是否填写正确');
          return false;
        }
      });
    };
    
    // 日期格式化方法
    const formatDate = (dateString) => {
      if (!dateString) return '从未登录';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    onMounted(() => {
      getBranchOptions();
      getList();
    });
    
    return {
      loading,
      adminList,
      total,
      queryParams,
      branchOptions,
      dialogVisible,
      dialogType,
      formRef,
      form,
      rules,
      currentUser,
      submitLoading,
      handleSearch,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleEdit,
      handleDelete,
      submitForm,
      formatDate
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
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 弹窗样式升级 */
:deep(.admin-dialog) {
  .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 8px 8px 0 0;
  }
  
  .el-dialog__title {
    font-size: 18px;
    font-weight: 600;
    color: white;
  }
  
  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    
    .el-dialog__close {
      color: white;
      font-size: 20px;
    }
  }
  
  .el-dialog__body {
    padding: 0;
  }
}

.dialog-content {
  padding: 24px;
}

/* 管理员信息卡片样式 */
.admin-info-card {
  margin-bottom: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.admin-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.admin-avatar {
  border: 3px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-upload {
  .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}

.basic-info {
  flex: 1;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
  
  .username {
    margin: 0 0 12px 0;
    color: #909399;
    font-size: 14px;
  }
}

/* 表单样式升级 */
.admin-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 6px;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
      }
    }
  }
  
  :deep(.el-select) {
    .el-input__wrapper {
      border-radius: 6px;
    }
  }
  
  :deep(.el-textarea) {
    .el-textarea__inner {
      border-radius: 6px;
      transition: all 0.3s;
      
      &:hover {
        border-color: #c0c4cc;
      }
    }
  }
  
  :deep(.el-radio) {
    margin-right: 24px;
    
    .el-radio__label {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

/* 底部按钮样式 */
.dialog-footer {
  padding: 20px 24px;
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 0 -24px -24px -24px;
  border-radius: 0 0 8px 8px;
  
  .el-button {
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 500;
    
    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.admin-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }
  
  .admin-info-header {
    flex-direction: column;
    text-align: center;
  }
  
  .admin-form {
    :deep(.el-col) {
      width: 100% !important;
    }
  }
}

/* 动画效果 */
:deep(.el-dialog) {
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
