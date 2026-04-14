<template>
  <div class="app-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>编辑业务员</span>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>
      
      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="选择用户" prop="user_id">
          <el-select
            v-model="form.user_id"
            filterable
            placeholder="请选择用户"
            style="width: 100%"
            disabled
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.name} (${user.phone})`"
              :value="user.id"
            />
          </el-select>
          <small class="form-note">业务员关联的用户不可修改</small>
        </el-form-item>
        
        <el-form-item label="员工编号" prop="employee_id">
          <el-input v-model="form.employee_id" placeholder="请输入员工编号" />
        </el-form-item>
        
        <el-form-item label="职位/职级" prop="title">
          <el-input v-model="form.title" placeholder="请输入职位或职级" />
        </el-form-item>
        
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入所属部门" />
        </el-form-item>
        
        <el-form-item label="负责区域" prop="region">
          <el-input v-model="form.region" placeholder="请输入负责区域" />
        </el-form-item>
        
        <el-form-item label="上级经理" prop="manager_id">
          <el-select
            v-model="form.manager_id"
            filterable
            clearable
            placeholder="请选择上级经理"
            style="width: 100%"
          >
            <el-option
              v-for="manager in managers"
              :key="manager.id"
              :label="`${manager.user ? manager.user.name : '未知'} (${manager.title})`"
              :value="manager.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="leave" />
            <el-option label="暂停" value="suspend" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="入职日期" prop="join_date">
          <el-date-picker
            v-model="form.join_date"
            type="date"
            placeholder="请选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="cancelForm">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSalesmanDetail, updateSalesman, getManagersList, getAvailableUsers } from '@/api/salesman';

export default {
  name: 'SalesmenEdit',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const formRef = ref(null);
    const loading = ref(true);
    
    // 获取业务员ID
    const salesmanId = route.params.id;
    
    // 表单数据
    const form = reactive({
      user_id: null,
      employee_id: '',
      title: '',
      department: '',
      region: '',
      manager_id: null,
      status: 'active',
      join_date: '',
      remark: ''
    });
    
    // 表单验证规则
    const rules = reactive({
      title: [
        { required: true, message: '请输入职位或职级', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    });
    
    // 可选用户列表
    const availableUsers = ref([]);
    
    // 可选经理列表
    const managers = ref([]);
    
    // 获取业务员信息
    const getSalesman = async () => {
      try {
        loading.value = true;
        const response = await getSalesmanDetail(salesmanId);
        const responseData = response.data || {};
        
        // 获取正确的业务员数据，适应不同的响应格式
        const data = responseData.salesman || responseData;
        
        
        
        // 填充表单数据
        Object.assign(form, {
          user_id: data.user_id,
          employee_id: data.employee_id,
          title: data.title,
          department: data.department,
          region: data.region,
          manager_id: data.manager_id,
          status: data.status,
          join_date: data.join_date ? new Date(data.join_date) : '',
          remark: data.remark
        });
        
      } catch (error) {
        console.error('获取业务员信息失败', error);
        console.error('错误详情:', error.response?.data || error.message || '未知错误');
        ElMessage.error('获取业务员信息失败: ' + (error.response?.data?.message || error.message || '未知错误'));
        router.push({ name: 'SalesmenList' });
      } finally {
        loading.value = false;
      }
    };
    
    // 获取可选用户列表
    const fetchAvailableUsers = async () => {
      try {
        const response = await getAvailableUsers();
        availableUsers.value = response.data || [];
      } catch (error) {
        console.error('获取可选用户列表失败', error);
        ElMessage.error('获取可选用户列表失败: ' + (error.message || '未知错误'));
      }
    };
    
    // 获取可选经理列表
    const fetchManagers = async () => {
      try {
        const response = await getManagersList();
        managers.value = response.data || [];
      } catch (error) {
        console.error('获取可选经理列表失败', error);
        ElMessage.error('获取可选经理列表失败: ' + (error.message || '未知错误'));
      }
    };
    
    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return;
      
      await formRef.value.validate(async (valid, fields) => {
        if (valid) {
          try {
            const formData = { ...form };
            
            if (formData.join_date) {
              formData.join_date = new Date(formData.join_date).toISOString().split('T')[0];
            }
            
            await updateSalesman(salesmanId, formData);
            
            ElMessage.success('业务员更新成功');
            router.push({ name: 'SalesmenList' });
          } catch (error) {
            console.error('业务员更新失败', error);
            ElMessage.error(error.response?.data?.message || '业务员更新失败');
          }
        } else {
        }
      });
    };
    
    // 取消表单
    const cancelForm = () => {
      ElMessageBox.confirm('确定要取消操作吗？未保存的数据将丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        router.push({ name: 'SalesmenList' });
      }).catch(() => {});
    };
    
    onMounted(() => {
      getSalesman();
      fetchAvailableUsers();
      fetchManagers();
    });
    
    return {
      formRef,
      form,
      rules,
      loading,
      availableUsers,
      managers,
      submitForm,
      cancelForm
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.form-note {
  color: #909399;
  display: block;
  margin-top: 5px;
}
</style> 