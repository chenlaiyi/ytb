<template>
  <div class="app-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>新增业务员</span>
        </div>
      </template>
      
      <el-form
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
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.name} (${user.phone})`"
              :value="user.id"
            />
          </el-select>
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

export default {
  name: 'SalesmenCreate',
  
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    
    // 表单数据
    const form = reactive({
      user_id: null,
      employee_id: '',
      title: '',
      department: '',
      region: '',
      manager_id: null,
      status: 'active',
      join_date: new Date(),
      remark: ''
    });
    
    // 表单验证规则
    const rules = reactive({
      user_id: [
        { required: true, message: '请选择用户', trigger: 'change' }
      ],
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
    
    // 获取可选用户列表
    const getAvailableUsers = async () => {
      try {
        const response = await axios.get('/api/salesmen/available-users');
        availableUsers.value = response.data;
      } catch (error) {
        console.error('获取可选用户列表失败', error);
        ElMessage.error('获取可选用户列表失败');
      }
    };
    
    // 获取可选经理列表
    const getManagers = async () => {
      try {
        const response = await axios.get('/api/salesmen/managers');
        managers.value = response.data;
      } catch (error) {
        console.error('获取可选经理列表失败', error);
        ElMessage.error('获取可选经理列表失败');
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
            
            await axios.post('/api/salesmen', formData);
            
            ElMessage.success('业务员创建成功');
            router.push({ name: 'Salesmen' });
          } catch (error) {
            console.error('业务员创建失败', error);
            ElMessage.error(error.response?.data?.message || '业务员创建失败');
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
        router.push({ name: 'Salesmen' });
      }).catch(() => {});
    };
    
    onMounted(() => {
      getAvailableUsers();
      getManagers();
    });
    
    return {
      formRef,
      form,
      rules,
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
</style> 