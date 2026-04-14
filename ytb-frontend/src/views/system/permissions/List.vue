<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <div>
            <el-button type="success" @click="handleSync">同步权限</el-button>
            <el-button type="primary" @click="handleCreate">新增权限</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="filter-container">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="权限标识或名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="模块">
            <el-select
              v-model="searchForm.module"
              placeholder="选择模块"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="module in moduleList"
                :key="module"
                :label="module"
                :value="module"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="permissionList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="权限标识" width="180" />
        <el-table-column prop="display_name" label="权限名称" width="150" />
        <el-table-column prop="module" label="所属模块" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.module" type="info">{{ scope.row.module }}</el-tag>
            <span v-else class="text-gray-400">未分组</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 权限表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="权限标识" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限标识，如users.create" />
        </el-form-item>
        <el-form-item label="权限名称" prop="display_name">
          <el-input v-model="permissionForm.display_name" placeholder="请输入权限名称，如创建用户" />
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-select v-model="permissionForm.module" placeholder="请选择所属模块" style="width: 100%">
            <el-option
              v-for="module in moduleList"
              :key="module"
              :label="module"
              :value="module"
            />
            <el-option label="新建模块" value="__new__">
              <div style="display: flex; align-items: center">
                <el-icon><plus /></el-icon>
                <span>新建模块</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="permissionForm.module === '__new__'" label="新模块名称" prop="new_module">
          <el-input v-model="permissionForm.new_module" placeholder="请输入新模块名称" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            placeholder="请输入权限描述"
          />
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPermissions, getPermission, createPermission, updatePermission, deletePermission, getModules, syncPermissions } from '@/api/v1/permission';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'PermissionList',
  components: {
    Plus
  },
  setup() {
    const loading = ref(false);
    const permissionList = ref([]);
    const total = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const moduleList = ref([]);

    const dialogVisible = ref(false);
    const dialogTitle = ref('新增权限');
    const permissionFormRef = ref(null);

    const searchForm = reactive({
      keyword: '',
      module: ''
    });

    const permissionForm = reactive({
      id: null,
      name: '',
      display_name: '',
      description: '',
      module: '',
      new_module: ''
    });

    const rules = {
      name: [
        { required: true, message: '请输入权限标识', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      display_name: [
        { required: true, message: '请输入权限名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      module: [
        { required: true, message: '请选择所属模块', trigger: 'change' }
      ],
      new_module: [
        { required: true, message: '请输入新模块名称', trigger: 'blur',
          validator: (rule, value, callback) => {
            if (permissionForm.module === '__new__' && !value) {
              callback(new Error('请输入新模块名称'));
            } else {
              callback();
            }
          }
        }
      ]
    };

    // 获取权限列表
    const fetchPermissions = async () => {
      loading.value = true;
      try {
        const params = {
          page: currentPage.value,
          per_page: pageSize.value
        };

        // 添加搜索条件
        if (searchForm.keyword) {
          params.keyword = searchForm.keyword;
        }
        if (searchForm.module) {
          params.module = searchForm.module;
        }

        const response = await getPermissions(params);

        if (response.code === 0) {
          permissionList.value = response.data.data;
          total.value = response.data.total;
        } else {
          ElMessage.error(response.message || '获取权限列表失败');
        }
      } catch (error) {
        console.error('获取权限列表失败:', error);
        ElMessage.error('获取权限列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 获取所有模块
    const fetchModules = async () => {
      try {
        const response = await getModules();

        if (response.code === 0) {
          moduleList.value = response.data;
        } else {
          ElMessage.error(response.message || '获取模块列表失败');
        }
      } catch (error) {
        console.error('获取模块列表失败:', error);
        ElMessage.error('获取模块列表失败');
      }
    };

    // 处理页码变化
    const handlePageChange = (page) => {
      currentPage.value = page;
      fetchPermissions();
    };

    // 搜索
    const handleSearch = () => {
      currentPage.value = 1;
      fetchPermissions();
    };

    // 重置搜索
    const handleReset = () => {
      searchForm.keyword = '';
      searchForm.module = '';
      currentPage.value = 1;
      fetchPermissions();
    };

    // 同步权限
    const handleSync = async () => {
      try {
        const response = await syncPermissions();
        if (response.code === 0) {
          ElMessage.success('权限同步成功');
          fetchPermissions();
          fetchModules();
        } else {
          ElMessage.error(response.message || '权限同步失败');
        }
      } catch (error) {
        console.error('权限同步失败:', error);
        ElMessage.error('权限同步失败');
      }
    };

    // 新增权限
    const handleCreate = () => {
      dialogTitle.value = '新增权限';
      dialogVisible.value = true;
      permissionForm.id = null;
      permissionForm.name = '';
      permissionForm.display_name = '';
      permissionForm.description = '';
      permissionForm.module = '';
      permissionForm.new_module = '';
    };

    // 编辑权限
    const handleEdit = async (row) => {
      dialogTitle.value = '编辑权限';
      dialogVisible.value = true;

      try {
        const response = await getPermission(row.id);

        if (response.code === 0) {
          const permission = response.data;
          permissionForm.id = permission.id;
          permissionForm.name = permission.name;
          permissionForm.display_name = permission.display_name;
          permissionForm.description = permission.description;
          permissionForm.module = permission.module;
          permissionForm.new_module = '';
        } else {
          ElMessage.error(response.message || '获取权限详情失败');
        }
      } catch (error) {
        console.error('获取权限详情失败:', error);
        ElMessage.error('获取权限详情失败');
      }
    };

    // 删除权限
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deletePermission(row.id);

          if (response.code === 0) {
            ElMessage.success('删除成功');
            fetchPermissions();
          } else {
            ElMessage.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除权限失败:', error);
          ElMessage.error('删除权限失败');
        }
      }).catch(() => {});
    };

    // 重置表单
    const resetForm = () => {
      if (permissionFormRef.value) {
        permissionFormRef.value.resetFields();
      }
      permissionForm.id = null;
      permissionForm.name = '';
      permissionForm.display_name = '';
      permissionForm.description = '';
      permissionForm.module = '';
      permissionForm.new_module = '';
    };

    // 提交表单
    const submitForm = async () => {
      if (!permissionFormRef.value) return;

      await permissionFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const formData = {
              name: permissionForm.name,
              display_name: permissionForm.display_name,
              description: permissionForm.description,
              module: permissionForm.module === '__new__' ? permissionForm.new_module : permissionForm.module
            };

            let response;
            if (permissionForm.id) {
              // 更新
              response = await updatePermission(permissionForm.id, formData);
            } else {
              // 创建
              response = await createPermission(formData);
            }

            if (response.code === 0) {
              ElMessage.success(permissionForm.id ? '更新成功' : '创建成功');
              dialogVisible.value = false;
              fetchPermissions();
              fetchModules(); // 刷新模块列表
            } else {
              ElMessage.error(response.message || (permissionForm.id ? '更新失败' : '创建失败'));
            }
          } catch (error) {
            console.error(permissionForm.id ? '更新权限失败:' : '创建权限失败:', error);
            ElMessage.error(permissionForm.id ? '更新失败' : '创建失败');
          }
        }
      });
    };

    onMounted(() => {
      fetchPermissions();
      fetchModules();
    });

    return {
      loading,
      permissionList,
      total,
      currentPage,
      pageSize,
      moduleList,
      dialogVisible,
      dialogTitle,
      permissionFormRef,
      searchForm,
      permissionForm,
      rules,
      handlePageChange,
      handleSearch,
      handleReset,
      handleSync,
      handleCreate,
      handleEdit,
      handleDelete,
      resetForm,
      submitForm
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

.filter-container {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
