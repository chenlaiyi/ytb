<template>
  <div class="merchant-list-container">
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>商户管理</span>
          <el-button type="primary" @click="openCreateDialog">添加商户</el-button>
        </div>
      </template>
      
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="商户名称">
            <el-input v-model="searchForm.name" placeholder="商户名称" clearable />
          </el-form-item>
          <el-form-item label="商户状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable>
              <el-option label="正常" value="active" />
              <el-option label="已禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadMerchants">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        v-loading="loading"
        :data="merchants"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商户名称" />
        <el-table-column prop="contact_name" label="联系人" />
        <el-table-column prop="contact_phone" label="联系电话" />
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="scope">
            <span>{{ formatCurrency(scope.row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="viewMerchant(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editMerchant(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'danger' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="searchForm.per_page"
          :current-page="searchForm.page"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 商户创建/编辑对话框 -->
    <el-dialog
      :title="dialogType === 'create' ? '添加商户' : '编辑商户'"
      v-model="dialogVisible"
      width="50%"
    >
      <el-form :model="merchantForm" :rules="rules" ref="merchantFormRef" label-width="100px">
        <el-form-item label="商户名称" prop="name">
          <el-input v-model="merchantForm.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_name">
          <el-input v-model="merchantForm.contact_name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="merchantForm.contact_phone" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="merchantForm.email" />
        </el-form-item>
        <el-form-item label="商户地址" prop="address">
          <el-input v-model="merchantForm.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="商户简介" prop="description">
          <el-input v-model="merchantForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMerchantForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import merchantApi from '../../api/merchantApi';

export default {
  name: 'MerchantList',
  setup() {
    const loading = ref(false);
    const merchants = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const dialogType = ref('create'); // 'create' 或 'edit'
    const merchantFormRef = ref(null);

    const searchForm = reactive({
      page: 1,
      per_page: 10,
      name: '',
      status: ''
    });

    const merchantForm = reactive({
      id: null,
      name: '',
      contact_name: '',
      contact_phone: '',
      email: '',
      address: '',
      description: '',
      status: 'active'
    });

    const rules = {
      name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
      contact_name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
      contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
    };

    const loadMerchants = async () => {
      loading.value = true;
      try {
        const response = await merchantApi.getMerchantList(searchForm);
        merchants.value = response.data.data;
        total.value = response.data.total;
      } catch (error) {
        ElMessage.error('获取商户列表失败');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    const resetSearch = () => {
      searchForm.name = '';
      searchForm.status = '';
      searchForm.page = 1;
      loadMerchants();
    };

    const handleSizeChange = (val) => {
      searchForm.per_page = val;
      loadMerchants();
    };

    const handleCurrentChange = (val) => {
      searchForm.page = val;
      loadMerchants();
    };

    const resetMerchantForm = () => {
      if (merchantFormRef.value) {
        merchantFormRef.value.resetFields();
      }
      merchantForm.id = null;
      merchantForm.name = '';
      merchantForm.contact_name = '';
      merchantForm.contact_phone = '';
      merchantForm.email = '';
      merchantForm.address = '';
      merchantForm.description = '';
      merchantForm.status = 'active';
    };

    const openCreateDialog = () => {
      dialogType.value = 'create';
      resetMerchantForm();
      dialogVisible.value = true;
    };

    const editMerchant = (row) => {
      dialogType.value = 'edit';
      Object.assign(merchantForm, row);
      dialogVisible.value = true;
    };

    const viewMerchant = (row) => {
      // 可以跳转到详情页或者使用对话框显示详情
      ElMessage.info(`查看商户: ${row.name}`);
    };

    const toggleStatus = (row) => {
      const action = row.status === 'active' ? '禁用' : '启用';
      ElMessageBox.confirm(`确定要${action}该商户吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const newStatus = row.status === 'active' ? 'disabled' : 'active';
          await merchantApi.updateMerchant(row.id, { status: newStatus });
          
          // 更新本地数据
          row.status = newStatus;
          
          ElMessage.success(`${action}成功`);
        } catch (error) {
          ElMessage.error(`${action}失败`);
          console.error(error);
        }
      }).catch(() => {});
    };

    const submitMerchantForm = async () => {
      if (!merchantFormRef.value) return;
      
      await merchantFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            if (dialogType.value === 'create') {
              await merchantApi.createMerchant(merchantForm);
              ElMessage.success('创建商户成功');
            } else {
              await merchantApi.updateMerchant(merchantForm.id, merchantForm);
              ElMessage.success('更新商户成功');
            }
            dialogVisible.value = false;
            loadMerchants();
          } catch (error) {
            ElMessage.error(dialogType.value === 'create' ? '创建商户失败' : '更新商户失败');
            console.error(error);
          }
        }
      });
    };

    const formatCurrency = (value) => {
      return `¥ ${parseFloat(value).toFixed(2)}`;
    };

    onMounted(() => {
      loadMerchants();
    });

    return {
      loading,
      merchants,
      total,
      searchForm,
      merchantForm,
      dialogVisible,
      dialogType,
      merchantFormRef,
      rules,
      loadMerchants,
      resetSearch,
      handleSizeChange,
      handleCurrentChange,
      openCreateDialog,
      editMerchant,
      viewMerchant,
      toggleStatus,
      submitMerchantForm,
      formatCurrency
    };
  }
};
</script>

<style scoped>
.merchant-list-container {
  padding: 20px;
}
.list-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 