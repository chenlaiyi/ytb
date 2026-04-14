<template>
  <div class="role-edit">
    <div class="page-header">
      <h2>编辑角色</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <el-card v-loading="pageLoading">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色标识" prop="name">
              <el-input v-model="form.name" placeholder="请输入角色标识，如admin" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="display_name">
              <el-input v-model="form.display_name" placeholder="请输入角色名称，如管理员" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="权限分配" prop="permissions">
          <div v-if="permissionTree.length === 0" class="text-center py-4">
            <el-empty description="暂无权限数据" />
            <div class="mt-2 text-center">
              <el-button size="small" type="primary" @click="fetchPermissions">重新加载权限</el-button>
            </div>
          </div>
          <div v-else>
            <div class="permission-tree">
              <div v-for="module in permissionTree" :key="module.id" class="permission-module">
                <div class="module-header">
                  <el-checkbox
                    :indeterminate="isIndeterminate(module).value"
                    :model-value="isAllChecked(module).value"
                    @change="handleCheckAllChange(module, $event)"
                  >
                    {{ module.display_name }}
                  </el-checkbox>
                </div>
                <div class="module-permissions">
                  <el-checkbox-group v-model="form.permissions">
                    <el-checkbox
                      v-for="perm in module.children"
                      :key="perm.id"
                      :label="perm.id"
                      class="permission-item"
                    >
                      {{ perm.display_name }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.go(-1)">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getRole, updateRole } from '@/api/v1/role';
import { getPermissions } from '@/api/v1/permission';

export default {
  name: 'RoleEdit',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const formRef = ref(null);
    const loading = ref(false);
    const pageLoading = ref(false);
    const permissionTree = ref([]);
    const roleId = route.params.id;

    const form = reactive({
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

    // 获取权限列表
    const fetchPermissions = async () => {
      try {
        const response = await getPermissions();
        if (response.code === 200) {
          // 按模块分组权限
          const groupedPermissions = {};
          response.data.data.forEach(permission => {
            const module = permission.module || '其他';
            if (!groupedPermissions[module]) {
              groupedPermissions[module] = [];
            }
            groupedPermissions[module].push(permission);
          });

          // 转换为树形结构
          const tree = [];
          for (const moduleName in groupedPermissions) {
            tree.push({
              id: `module_${moduleName}`,
              display_name: moduleName,
              children: groupedPermissions[moduleName]
            });
          }
          permissionTree.value = tree;
        }
      } catch (error) {
        console.error('获取权限列表失败:', error);
      }
    };

    // 获取角色详情
    const fetchRole = async () => {
      pageLoading.value = true;
      try {
        const response = await getRole(roleId);
        if (response.code === 200) {
          const role = response.data;
          form.name = role.name;
          form.display_name = role.display_name;
          form.description = role.description;
          form.permissions = role.permissions ? role.permissions.map(p => p.id) : [];
        } else {
          ElMessage.error('获取角色信息失败');
          router.go(-1);
        }
      } catch (error) {
        console.error('获取角色详情失败:', error);
        ElMessage.error('获取角色信息失败');
        router.go(-1);
      } finally {
        pageLoading.value = false;
      }
    };

    // 检查模块是否全选
    const isAllChecked = (module) => {
      return computed(() => {
        const modulePermissionIds = module.children.map(p => p.id);
        return modulePermissionIds.every(id => form.permissions.includes(id));
      });
    };

    // 检查模块是否半选
    const isIndeterminate = (module) => {
      return computed(() => {
        const modulePermissionIds = module.children.map(p => p.id);
        const checkedCount = modulePermissionIds.filter(id => form.permissions.includes(id)).length;
        return checkedCount > 0 && checkedCount < modulePermissionIds.length;
      });
    };

    // 处理模块全选/取消全选
    const handleCheckAllChange = (module, checked) => {
      const modulePermissionIds = module.children.map(p => p.id);
      if (checked) {
        // 添加模块下所有权限
        modulePermissionIds.forEach(id => {
          if (!form.permissions.includes(id)) {
            form.permissions.push(id);
          }
        });
      } else {
        // 移除模块下所有权限
        form.permissions = form.permissions.filter(id => !modulePermissionIds.includes(id));
      }
    };

    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return;
      
      try {
        await formRef.value.validate();
        loading.value = true;
        
        const response = await updateRole(roleId, form);
        if (response.code === 200) {
          ElMessage.success('角色更新成功');
          router.push({ path: '/system/access-center', query: { tab: 'roles' } });
        } else {
          ElMessage.error(response.message || '更新失败');
        }
      } catch (error) {
        console.error('更新角色失败:', error);
        ElMessage.error('更新失败');
      } finally {
        loading.value = false;
      }
    };

    // 重置表单
    const resetForm = () => {
      fetchRole();
    };

    onMounted(async () => {
      await fetchPermissions();
      await fetchRole();
    });

    return {
      form,
      rules,
      formRef,
      loading,
      pageLoading,
      permissionTree,
      fetchPermissions,
      isAllChecked,
      isIndeterminate,
      handleCheckAllChange,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.role-edit {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.permission-tree {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.permission-module {
  margin-bottom: 16px;
}

.permission-module:last-child {
  margin-bottom: 0;
}

.module-header {
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.module-permissions {
  padding-left: 20px;
}

.permission-item {
  display: block;
  margin-bottom: 8px;
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
</style> 
