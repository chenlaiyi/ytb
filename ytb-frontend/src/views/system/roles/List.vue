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
          <el-input v-model="roleForm.name" placeholder="请输入角色标识，如admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="display_name">
          <el-input v-model="roleForm.display_name" placeholder="请输入角色名称，如管理员" />
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
import { getRoles, getRole, createRole, updateRole, deleteRole } from '@/api/v1/role';
import { getPermissionGroups } from '@/api/v1/permission';

export default {
  name: 'RoleList',
  setup() {
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

    // 获取角色列表
    const fetchRoles = async () => {
      loading.value = true;
      try {
        const response = await getRoles({
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
          total.value = 0;
        }
      } catch (error) {
        console.error('获取角色列表失败:', error);
        ElMessage.error(`获取角色列表失败: ${error.message}`);
        roleList.value = [];
        total.value = 0;
      } finally {
        loading.value = false;
      }
    };

    // 获取所有权限
    const getAllPermissions = async () => {
      permissionLoading.value = true;
      try {
        ElMessage.info('正在加载权限列表...');

        const response = await getPermissionGroups();

        if (response.code === 0) {
          const permissionsData = response.data;

          if (!permissionsData || Object.keys(permissionsData).length === 0) {
            console.warn('权限数据为空');
            ElMessage.warning('权限数据为空，请先创建权限');
            permissionTree.value = [];
            return;
          }

          const tree = [];

          for (const moduleName in permissionsData) {
            if (Object.prototype.hasOwnProperty.call(permissionsData, moduleName)) {
              const modulePermissions = permissionsData[moduleName];

              if (!Array.isArray(modulePermissions) || modulePermissions.length === 0) {
                continue;
              }

              const moduleNode = {
                id: `module_${moduleName}`,
                display_name: moduleName,
                children: []
              };

              modulePermissions.forEach(permission => {
                if (permission && permission.id) {
                  moduleNode.children.push({
                    id: permission.id,
                    display_name: permission.display_name || permission.name,
                    name: permission.name
                  });
                }
              });

              if (moduleNode.children.length > 0) {
                tree.push(moduleNode);
              }
            }
          }

          if (tree.length === 0) {
            ElMessage.warning('没有找到任何权限');
          } else {
            ElMessage.success(`成功加载 ${tree.length} 个模块的权限`);
          }
          
          permissionTree.value = tree;
        } else {
          console.error('获取权限列表失败:', response.message);
          ElMessage.error(response.message || '获取权限列表失败');
          permissionTree.value = [];
        }
      } catch (error) {
        console.error('获取权限列表失败:', error);
        ElMessage.error(`获取权限列表失败: ${error.message}`);
        permissionTree.value = [];
      } finally {
        permissionLoading.value = false;
      }
    };

    // 获取权限总数
    const getTotalPermissionCount = () => {
      return permissionTree.value.reduce((total, module) => total + module.children.length, 0);
    };

    // 检查模块是否全选
    const isModuleChecked = (module) => {
      if (!module.children || module.children.length === 0) return false;
      return module.children.every(perm => checkedPermissions.value.includes(perm.id));
    };

    // 检查模块是否半选
    const isModuleIndeterminate = (module) => {
      if (!module.children || module.children.length === 0) return false;
      const checkedCount = module.children.filter(perm => checkedPermissions.value.includes(perm.id)).length;
      return checkedCount > 0 && checkedCount < module.children.length;
    };

    // 处理模块选择
    const handleModuleCheck = (module, checked) => {
      if (checked) {
        // 选中模块下所有权限
        module.children.forEach(perm => {
          if (!checkedPermissions.value.includes(perm.id)) {
            checkedPermissions.value.push(perm.id);
          }
        });
      } else {
        // 取消选中模块下所有权限
        module.children.forEach(perm => {
          const index = checkedPermissions.value.indexOf(perm.id);
          if (index > -1) {
            checkedPermissions.value.splice(index, 1);
          }
        });
      }
    };

    // 全选权限
    const selectAllPermissions = () => {
      const allPermissionIds = [];
      permissionTree.value.forEach(module => {
        module.children.forEach(perm => {
          allPermissionIds.push(perm.id);
        });
      });
      checkedPermissions.value = [...allPermissionIds];
    };

    // 清空权限
    const clearAllPermissions = () => {
      checkedPermissions.value = [];
    };

    // 处理页码变化
    const handlePageChange = (page) => {
      currentPage.value = page;
      fetchRoles();
    };

    // 新增角色
    const handleCreate = () => {
      dialogTitle.value = '新增角色';
      dialogVisible.value = true;
      roleForm.id = null;
      roleForm.name = '';
      roleForm.display_name = '';
      roleForm.description = '';
      checkedPermissions.value = [];
      
      // 确保权限树已加载
      if (permissionTree.value.length === 0) {
        getAllPermissions();
      }
    };

    // 编辑角色
    const handleEdit = async (row) => {
      dialogTitle.value = '编辑角色';
      dialogVisible.value = true;

      try {
        // 确保权限树已加载
        if (permissionTree.value.length === 0) {
          await getAllPermissions();
        }

        const response = await getRole(row.id);

        if (response.code === 0) {
          const role = response.data;
          roleForm.id = role.id;
          roleForm.name = role.name;
          roleForm.display_name = role.display_name;
          roleForm.description = role.description;

          // 设置已选权限
          if (role.permissions && Array.isArray(role.permissions)) {
            const permIds = role.permissions
              .filter(p => p && p.id)
              .map(p => p.id);
            checkedPermissions.value = [...permIds];
          } else {
            checkedPermissions.value = [];
          }
        } else {
          console.error('获取角色详情失败:', response.message);
          ElMessage.error(response.message || '获取角色详情失败');
        }
      } catch (error) {
        console.error('获取角色详情失败:', error);
        ElMessage.error(`获取角色详情失败: ${error.message}`);
      }
    };

    // 删除角色
    const handleDelete = (row) => {
      if (row.is_system) {
        ElMessage.warning('系统角色不能删除');
        return;
      }

      ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteRole(row.id);

          if (response.code === 0) {
            ElMessage.success('删除成功');
            fetchRoles();
          } else {
            ElMessage.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除角色失败:', error);
          ElMessage.error('删除角色失败');
        }
      }).catch(() => {});
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

    // 提交表单
    const submitForm = async () => {
      if (!roleFormRef.value) return;

      await roleFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const permissionIds = checkedPermissions.value.filter(id => id !== undefined && id !== null);

            const formData = {
              name: roleForm.name,
              display_name: roleForm.display_name,
              description: roleForm.description,
              permissions: permissionIds
            };

            let response;
            if (roleForm.id) {
              response = await updateRole(roleForm.id, formData);
            } else {
              response = await createRole(formData);
            }

            if (response.code === 0) {
              ElMessage.success(roleForm.id ? '更新成功' : '创建成功');
              dialogVisible.value = false;
              fetchRoles();
            } else {
              ElMessage.error(response.message || (roleForm.id ? '更新失败' : '创建失败'));
            }
          } catch (error) {
            console.error(roleForm.id ? '更新角色失败:' : '创建角色失败:', error);
            ElMessage.error(`${roleForm.id ? '更新' : '创建'}失败: ${error.message}`);
          }
        }
      });
    };

    onMounted(async () => {
      try {
        await fetchRoles();
        await getAllPermissions();
      } catch (error) {
        console.error('组件挂载时出错:', error);
        ElMessage.error(`加载数据失败: ${error.message}`);
      }
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
      resetForm,
      submitForm,
      getAllPermissions
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
  text-align: right;
}

.permission-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.permission-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.permission-actions {
  display: flex;
  gap: 8px;
}

.permission-tree {
  margin-top: 12px;
}

.permission-module {
  margin-bottom: 16px;
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
  margin-left: 4px;
}

.module-permissions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  padding-left: 20px;
}

.permission-item {
  padding: 4px 0;
}

.permission-name {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.text-center {
  text-align: center;
}
</style>
