<template>
  <div class="admin-edit">
    <div class="page-header">
      <h2>编辑管理员</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <el-card v-loading="pageLoading">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="留空则不修改密码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="正常" value="active" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="角色" prop="roles">
          <el-select v-model="form.roles" multiple placeholder="请选择角色">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.display_name"
              :value="role.id"
            />
          </el-select>
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
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getAdminDetail, updateAdmin } from '@/api/v1/admin';
import { getRoles } from '@/api/v1/role';

export default {
  name: 'AdminEdit',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const formRef = ref(null);
    const loading = ref(false);
    const pageLoading = ref(false);
    const roleList = ref([]);
    const adminId = route.params.id;

    const form = reactive({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      status: 'active',
      roles: []
    });

    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      roles: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ]
    };

    // 获取角色列表
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        if (response.code === 200) {
          roleList.value = response.data.data;
        }
      } catch (error) {
        console.error('获取角色列表失败:', error);
      }
    };

    // 获取管理员详情
    const fetchAdmin = async () => {
      pageLoading.value = true;
      try {
        const response = await getAdminDetail(adminId);
        if (response.code === 200) {
          const admin = response.data;
          form.username = admin.username;
          form.name = admin.name;
          form.email = admin.email;
          form.phone = admin.phone;
          form.status = admin.status;
          form.roles = admin.roles ? admin.roles.map(role => role.id) : [];
        } else {
          ElMessage.error('获取管理员信息失败');
          router.go(-1);
        }
      } catch (error) {
        console.error('获取管理员详情失败:', error);
        ElMessage.error('获取管理员信息失败');
        router.go(-1);
      } finally {
        pageLoading.value = false;
      }
    };

    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return;
      
      try {
        await formRef.value.validate();
        loading.value = true;
        
        const updateData = { ...form };
        // 如果密码为空，则不更新密码
        if (!updateData.password) {
          delete updateData.password;
        }
        
        const response = await updateAdmin(adminId, updateData);
        if (response.code === 200) {
          ElMessage.success('管理员更新成功');
          router.push({ path: '/system/access-center', query: { tab: 'admins' } });
        } else {
          ElMessage.error(response.message || '更新失败');
        }
      } catch (error) {
        console.error('更新管理员失败:', error);
        ElMessage.error('更新失败');
      } finally {
        loading.value = false;
      }
    };

    // 重置表单
    const resetForm = () => {
      fetchAdmin();
    };

    onMounted(async () => {
      await fetchRoles();
      await fetchAdmin();
    });

    return {
      form,
      rules,
      formRef,
      loading,
      pageLoading,
      roleList,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.admin-edit {
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
