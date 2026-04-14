<template>
  <div class="permission-create">
    <div class="page-header">
      <h2>新增权限</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限标识" prop="name">
              <el-input v-model="form.name" placeholder="请输入权限标识，如users.view" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限名称" prop="display_name">
              <el-input v-model="form.display_name" placeholder="请输入权限名称，如查看用户" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属模块" prop="module">
              <el-select v-model="form.module" placeholder="请选择所属模块" filterable allow-create>
                <el-option
                  v-for="module in moduleList"
                  :key="module"
                  :label="module"
                  :value="module"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入权限描述"
            :rows="3"
          />
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createPermission, getPermissionGroups } from '@/api/v1/permission';

export default {
  name: 'PermissionCreate',
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    const loading = ref(false);
    const moduleList = ref([]);

    const form = reactive({
      name: '',
      display_name: '',
      description: '',
      module: '',
      sort: 0
    });

    const rules = {
      name: [
        { required: true, message: '请输入权限标识', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      display_name: [
        { required: true, message: '请输入权限名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      module: [
        { required: true, message: '请选择所属模块', trigger: 'change' }
      ]
    };

    // 获取模块列表
    const fetchModules = async () => {
      try {
        const response = await getPermissionGroups();
        if (response.code === 200) {
          moduleList.value = response.data;
        }
      } catch (error) {
        console.error('获取模块列表失败:', error);
        // 使用默认模块列表
        moduleList.value = [
          '仪表盘',
          '用户管理',
          '角色管理',
          '权限管理',
          '设备管理',
          '商城管理',
          '订单管理',
          '安装管理',
          '系统管理'
        ];
      }
    };

    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return;
      
      try {
        await formRef.value.validate();
        loading.value = true;
        
        const response = await createPermission(form);
        if (response.code === 200) {
          ElMessage.success('权限创建成功');
          router.push({ path: '/system/access-center', query: { tab: 'permissions' } });
        } else {
          ElMessage.error(response.message || '创建失败');
        }
      } catch (error) {
        console.error('创建权限失败:', error);
        ElMessage.error('创建失败');
      } finally {
        loading.value = false;
      }
    };

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
    };

    onMounted(() => {
      fetchModules();
    });

    return {
      form,
      rules,
      formRef,
      loading,
      moduleList,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.permission-create {
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
</style> 
