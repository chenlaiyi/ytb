<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleCreate">新增角色</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="roleList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色标识" width="150" />
        <el-table-column prop="display_name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="is_system" label="系统角色" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_system ? 'success' : 'info'">
              {{ scope.row.is_system ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限数量" width="100">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.permissions ? scope.row.permissions.length : 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
              :disabled="scope.row.is_system"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 角色表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色标识" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色标识，如branch_admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="display_name">
          <el-input v-model="roleForm.display_name" placeholder="请输入角色名称，如分支管理员" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="权限分配" prop="permissions">
          <div v-loading="permissionLoading" class="permission-container">
            <div v-if="permissionTree.length === 0" class="text-center py-4">
              <el-empty description="暂无权限数据" />
              <div class="mt-2 text-center">
                <el-button size="small" type="primary" @click="getAllPermissions">重新加载权限</el-button>
              </div>
            </div>
            <div v-else>
              <!-- 权限统计 -->
              <div class="permission-stats mb-3">
                <el-tag type="info">共 {{ getTotalPermissionCount() }} 个权限</el-tag>
                <el-tag type="primary" class="ml-2">已选择 {{ checkedPermissions.length }} 个</el-tag>
                <div class="permission-actions">
                  <el-button size="small" @click="selectAllPermissions">全选</el-button>
                  <el-button size="small" @click="clearAllPermissions">清空</el-button>
                </div>
              </div>
              
              <!-- 权限树 -->
              <div class="permission-tree">
                <div v-for="module in permissionTree" :key="module.id" class="permission-module">
                  <div class="module-header">
                    <el-checkbox
                      :model-value="isModuleChecked(module)"
                      :indeterminate="isModuleIndeterminate(module)"
                      @change="handleModuleCheck(module, $event)"
                    >
                      <strong>{{ module.display_name }}</strong>
                      <span class="module-count">({{ module.children.length }})</span>
                    </el-checkbox>
                  </div>
                  <div class="module-permissions">
                    <div v-for="perm in module.children" :key="perm.id" class="permission-item">
                      <el-checkbox
                        v-model="checkedPermissions"
                        :label="perm.id"
                      >
                        {{ perm.display_name }}
                        <span class="permission-name">{{ perm.name }}</span>
                      </el-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import { getBranchRoles, getBranchRole, createBranchRole, updateBranchRole, deleteBranchRole, getBranchPermissions } from '@/api/v1/branchManagement';

export default {
  name: 'BranchRoles',
  setup() {
    const route = useRoute();
    const branchId = route.params.branchId;
    
    const loading = ref(false);
    const permissionLoading = ref(false);
    const roleList = ref([]);
    const total = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);

    const dialogVisible = ref(false);
    const dialogTitle = ref('新增角色');
    const roleFormRef = ref(null);
    const permissionTree = ref([]);
    const checkedPermissions = ref([]);

    const roleForm = reactive({
      id: null,
      name: '',
      display_name: '',
      description: '',
      permissions: []
    });

    const rules = {
      name: [
        { required: true, message: '请输入角色标识', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      display_name: [
        { required: true, message: '请输入角色名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ]
    };

    // 获取分支机构角色列表
    const fetchRoles = async () => {
      loading.value = true;
      try {
        const response = await getBranchRoles(branchId, {
          page: currentPage.value,
          per_page: pageSize.value
        });

        if (response && response.code === 0) {
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            roleList.value = [...response.data.data];
            total.value = response.data.total || 0;
          } else {
            console.error('API响应数据结构异常:', response);
            roleList.value = [];
            total.value = 0;
            ElMessage.error('角色数据格式异常');
          }
        } else {
          console.error('获取角色列表失败:', response?.message || '未知错误');
          ElMessage.error(response?.message || '获取角色列表失败');
          roleList.value = [];
        }
      } catch (error) {
        console.error('获取角色列表异常:', error);
        ElMessage.error('获取角色列表失败');
        roleList.value = [];
      } finally {
        loading.value = false;
      }
    };

    // 获取分支机构权限列表
    const getAllPermissions = async () => {
      permissionLoading.value = true;
      try {
        const response = await getBranchPermissions(branchId);
        
        if (response && response.code === 0) {
          permissionTree.value = response.data || [];
        } else {
          console.error('获取权限列表失败:', response?.message || '未知错误');
          ElMessage.error(response?.message || '获取权限列表失败');
          permissionTree.value = [];
        }
      } catch (error) {
        console.error('获取权限列表异常:', error);
        ElMessage.error('获取权限列表失败');
        permissionTree.value = [];
      } finally {
        permissionLoading.value = false;
      }
    };

    // 计算总权限数量
    const getTotalPermissionCount = () => {
      return permissionTree.value.reduce((total, module) => {
        return total + (module.children ? module.children.length : 0);
      }, 0);
    };

    // 检查模块是否被选中
    const isModuleChecked = (module) => {
      if (!module.children || module.children.length === 0) return false;
      return module.children.every(perm => checkedPermissions.value.includes(perm.id));
    };

    // 检查模块是否部分选中
    const isModuleIndeterminate = (module) => {
      if (!module.children || module.children.length === 0) return false;
      const checkedCount = module.children.filter(perm => checkedPermissions.value.includes(perm.id)).length;
      return checkedCount > 0 && checkedCount < module.children.length;
    };

    // 处理模块选择
    const handleModuleCheck = (module, checked) => {
      if (!module.children) return;
      
      module.children.forEach(perm => {
        const index = checkedPermissions.value.indexOf(perm.id);
        if (checked && index === -1) {
          checkedPermissions.value.push(perm.id);
        } else if (!checked && index !== -1) {
          checkedPermissions.value.splice(index, 1);
        }
      });
    };

    // 全选权限
    const selectAllPermissions = () => {
      checkedPermissions.value = [];
      permissionTree.value.forEach(module => {
        if (module.children) {
          module.children.forEach(perm => {
            checkedPermissions.value.push(perm.id);
          });
        }
      });
    };

    // 清空权限
    const clearAllPermissions = () => {
      checkedPermissions.value = [];
    };

    // 处理页面变化
    const handlePageChange = (page) => {
      currentPage.value = page;
      fetchRoles();
    };

    // 新增角色
    const handleCreate = () => {
      dialogTitle.value = '新增角色';
      resetForm();
      dialogVisible.value = true;
      getAllPermissions();
    };

    // 编辑角色
    const handleEdit = async (row) => {
      dialogTitle.value = '编辑角色';
      loading.value = true;
      
      try {
        const response = await getBranchRole(branchId, row.id);
        
        if (response && response.code === 0) {
          const roleData = response.data;
          roleForm.id = roleData.id;
          roleForm.name = roleData.name;
          roleForm.display_name = roleData.display_name;
          roleForm.description = roleData.description;
          
          // 设置选中的权限
          checkedPermissions.value = roleData.permissions ? roleData.permissions.map(p => p.id) : [];
          
          dialogVisible.value = true;
          await getAllPermissions();
        } else {
          ElMessage.error(response?.message || '获取角色详情失败');
        }
      } catch (error) {
        console.error('获取角色详情异常:', error);
        ElMessage.error('获取角色详情失败');
      } finally {
        loading.value = false;
      }
    };

    // 删除角色
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除角色 "${row.display_name}" 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await deleteBranchRole(branchId, row.id);
          
          if (response && response.code === 0) {
            ElMessage.success('删除成功');
            fetchRoles();
          } else {
            ElMessage.error(response?.message || '删除失败');
          }
        } catch (error) {
          console.error('删除角色异常:', error);
          ElMessage.error('删除失败');
        }
      });
    };

    // 提交表单
    const submitForm = () => {
      roleFormRef.value.validate(async (valid) => {
        if (valid) {
          const formData = {
            ...roleForm,
            permissions: checkedPermissions.value
          };
          
          try {
            let response;
            if (roleForm.id) {
              response = await updateBranchRole(branchId, roleForm.id, formData);
            } else {
              response = await createBranchRole(branchId, formData);
            }
            
            if (response && response.code === 0) {
              ElMessage.success(roleForm.id ? '更新成功' : '创建成功');
              dialogVisible.value = false;
              fetchRoles();
            } else {
              ElMessage.error(response?.message || '操作失败');
            }
          } catch (error) {
            console.error('提交表单异常:', error);
            ElMessage.error('操作失败');
          }
        }
      });
    };

    // 重置表单
    const resetForm = () => {
      if (roleFormRef.value) {
        roleFormRef.value.resetFields();
      }
      roleForm.id = null;
      roleForm.name = '';
      roleForm.display_name = '';
      roleForm.description = '';
      checkedPermissions.value = [];
    };

    onMounted(() => {
      fetchRoles();
    });

    return {
      loading,
      permissionLoading,
      roleList,
      total,
      currentPage,
      pageSize,
      dialogVisible,
      dialogTitle,
      roleFormRef,
      roleForm,
      rules,
      permissionTree,
      checkedPermissions,
      
      fetchRoles,
      getAllPermissions,
      getTotalPermissionCount,
      isModuleChecked,
      isModuleIndeterminate,
      handleModuleCheck,
      selectAllPermissions,
      clearAllPermissions,
      handlePageChange,
      handleCreate,
      handleEdit,
      handleDelete,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.permission-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.permission-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.permission-actions {
  display: flex;
  gap: 8px;
}

.permission-tree {
  margin-top: 10px;
}

.permission-module {
  margin-bottom: 15px;
}

.module-header {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.module-count {
  color: #909399;
  font-size: 12px;
}

.module-permissions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  padding-left: 20px;
}

.permission-item {
  padding: 4px 8px;
}

.permission-name {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.text-center {
  text-align: center;
}

.py-4 {
  padding: 16px 0;
}

.mt-2 {
  margin-top: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}
</style> 