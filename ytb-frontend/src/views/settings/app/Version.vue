<template>
  <div class="app-container">
    <div class="filter-container">
      <el-select
        v-model="listQuery.platform"
        placeholder="平台类型"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option
          v-for="item in platformOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" icon="Plus" @click="handleCreate">
        新增版本
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      fit
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" align="center" width="80" />
      <el-table-column prop="version_name" label="版本名称" width="120" />
      <el-table-column prop="version_code" label="版本号" width="100" align="center" />
      <el-table-column label="平台" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.platform === 'android' ? 'success' : 'primary'">
            {{ scope.row.platform === 'android' ? 'Android' : 'iOS' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新方式" width="120" align="center">
        <template #default="scope">
          <el-tag :type="getUpdateTypeTagType(scope.row.update_type)">
            {{ getUpdateTypeText(scope.row.update_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="download_url" label="下载地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'published' ? 'success' : 'info'">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="publish_time" label="发布时间" width="160" />
      <el-table-column label="操作" width="220" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="handlePreview(scope.row)">
            预览
          </el-button>
          <el-button
            v-if="scope.row.status !== 'published'"
            type="success"
            size="small"
            @click="handlePublish(scope.row)"
          >
            发布
          </el-button>
          <el-button
            v-if="scope.row.status === 'published'"
            type="danger"
            size="small"
            @click="handleUnpublish(scope.row)"
          >
            下架
          </el-button>
          <el-button 
            v-if="scope.row.status !== 'published'"
            type="danger" 
            size="small" 
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      :current-page="listQuery.page"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="listQuery.limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination-container"
    />

    <!-- 新增/编辑版本弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增版本' : '编辑版本'"
      v-model="dialogFormVisible"
      width="60%"
    >
      <el-form
        ref="versionFormRef"
        :model="versionForm"
        :rules="rules"
        label-position="right"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="平台" prop="platform">
          <el-select v-model="versionForm.platform" placeholder="请选择平台" style="width: 100%">
            <el-option
              v-for="item in platformOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本名称" prop="version_name">
          <el-input v-model="versionForm.version_name" placeholder="请输入版本名称，如：1.0.0" />
        </el-form-item>
        <el-form-item label="版本号" prop="version_code">
          <el-input-number v-model="versionForm.version_code" :min="1" :max="999" style="width: 120px" />
          <span class="form-tip">整数，每次更新递增，用于版本比较</span>
        </el-form-item>
        <el-form-item label="更新方式" prop="update_type">
          <el-select v-model="versionForm.update_type" placeholder="请选择更新方式" style="width: 100%">
            <el-option
              v-for="item in updateTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下载地址" prop="download_url">
          <el-input v-model="versionForm.download_url" placeholder="请输入安装包下载地址" />
        </el-form-item>
        <el-form-item label="更新说明" prop="description">
          <el-input
            v-model="versionForm.description"
            type="textarea"
            :rows="5"
            placeholder="请输入本次更新内容说明"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="versionForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="item in versionStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览版本弹窗 -->
    <el-dialog
      title="版本更新预览"
      v-model="previewVisible"
      width="50%"
    >
      <div class="version-preview">
        <div class="preview-header">
          <div class="version-name">
            版本 {{ previewData.version_name }} ({{ previewData.version_code }})
          </div>
          <div class="platform-tag">
            <el-tag :type="previewData.platform === 'android' ? 'success' : 'primary'">
              {{ previewData.platform === 'android' ? 'Android' : 'iOS' }}
            </el-tag>
          </div>
        </div>
        <div class="update-type">
          <el-tag :type="getUpdateTypeTagType(previewData.update_type)">
            {{ getUpdateTypeText(previewData.update_type) }}
          </el-tag>
        </div>
        <div class="preview-content">
          <h3>更新内容</h3>
          <div class="description">
            <pre>{{ previewData.description }}</pre>
          </div>
          <div v-if="previewData.download_url" class="download-info">
            <h3>下载地址</h3>
            <el-link type="primary" :href="previewData.download_url" target="_blank">{{ previewData.download_url }}</el-link>
          </div>
        </div>
        <div class="preview-footer">
          <div v-if="previewData.publish_time">发布时间：{{ previewData.publish_time }}</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AppVersionList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const versionFormRef = ref(null);
    
    // 预览相关
    const previewVisible = ref(false);
    const previewData = ref({});
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      platform: undefined,
      status: undefined
    });
    
    const platformOptions = [
      { label: 'Android', value: 'android' },
      { label: 'iOS', value: 'ios' }
    ];
    
    const statusOptions = [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
      { label: '已下架', value: 'unpublished' }
    ];
    
    const updateTypeOptions = [
      { label: '可选更新', value: 'optional' },
      { label: '强制更新', value: 'force' },
      { label: '静默更新', value: 'silent' }
    ];
    
    const versionStatusOptions = [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' }
    ];
    
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    
    // 版本表单默认值
    const defaultVersionForm = {
      id: undefined,
      platform: 'android',
      version_name: '',
      version_code: 1,
      update_type: 'optional',
      download_url: '',
      description: '',
      status: 'draft',
      publish_time: ''
    };
    
    const versionForm = reactive(Object.assign({}, defaultVersionForm));
    
    // 表单验证规则
    const rules = {
      platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
      version_name: [
        { required: true, message: '请输入版本名称', trigger: 'blur' },
        { pattern: /^\d+\.\d+\.\d+$/, message: '版本名称格式应为：x.y.z', trigger: 'blur' }
      ],
      version_code: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
      update_type: [{ required: true, message: '请选择更新方式', trigger: 'change' }],
      download_url: [{ required: true, message: '请输入下载地址', trigger: 'blur' }],
      description: [{ required: true, message: '请输入更新说明', trigger: 'blur' }]
    };
    
    // 获取版本列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            platform: 'android',
            version_name: '1.0.0',
            version_code: 1,
            update_type: 'optional',
            download_url: 'https://download.example.com/app/android/diandigo_1.0.0.apk',
            description: '1. 初始版本发布\n2. 实现基本功能\n3. 支持用户登录注册\n4. 商品浏览和购买\n5. 水站定位和订水',
            status: 'published',
            publish_time: '2023-03-01 00:00:00'
          },
          {
            id: 2,
            platform: 'ios',
            version_name: '1.0.0',
            version_code: 1,
            update_type: 'optional',
            download_url: 'https://apps.apple.com/cn/app/diandigo/id1234567890',
            description: '1. 初始版本发布\n2. 实现基本功能\n3. 支持用户登录注册\n4. 商品浏览和购买\n5. 水站定位和订水',
            status: 'published',
            publish_time: '2023-03-01 00:00:00'
          },
          {
            id: 3,
            platform: 'android',
            version_name: '1.1.0',
            version_code: 2,
            update_type: 'force',
            download_url: 'https://download.example.com/app/android/diandigo_1.1.0.apk',
            description: '1. 修复已知安全漏洞\n2. 优化用户体验\n3. 新增积分系统\n4. 增加优惠券功能\n5. 改进订单管理',
            status: 'published',
            publish_time: '2023-04-15 10:30:00'
          },
          {
            id: 4,
            platform: 'ios',
            version_name: '1.1.0',
            version_code: 2,
            update_type: 'optional',
            download_url: 'https://apps.apple.com/cn/app/diandigo/id1234567890',
            description: '1. 优化用户体验\n2. 新增积分系统\n3. 增加优惠券功能\n4. 改进订单管理',
            status: 'published',
            publish_time: '2023-04-18 14:20:00'
          },
          {
            id: 5,
            platform: 'android',
            version_name: '1.2.0',
            version_code: 3,
            update_type: 'optional',
            download_url: 'https://download.example.com/app/android/diandigo_1.2.0.apk',
            description: '1. 全新UI界面\n2. 增加消息通知功能\n3. 优化支付流程\n4. 新增评价系统\n5. 增加地址管理功能',
            status: 'draft',
            publish_time: null
          }
        ];
        
        total.value = list.value.length;
        listLoading.value = false;
      }, 1000);
    };
    
    // 获取更新类型标签样式
    const getUpdateTypeTagType = (type) => {
      const typeMap = {
        force: 'danger',
        optional: 'success',
        silent: 'info'
      };
      return typeMap[type] || 'default';
    };
    
    // 获取更新类型文本
    const getUpdateTypeText = (type) => {
      const found = updateTypeOptions.find(item => item.value === type);
      return found ? found.label : '未知类型';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const found = statusOptions.find(item => item.value === status);
      return found ? found.label : '未知状态';
    };
    
    // 搜索版本
    const handleFilter = () => {
      listQuery.page = 1;
      fetchData();
    };
    
    // 改变每页显示数量
    const handleSizeChange = (val) => {
      listQuery.limit = val;
      fetchData();
    };
    
    // 改变页码
    const handleCurrentChange = (val) => {
      listQuery.page = val;
      fetchData();
    };
    
    // 重置版本表单
    const resetVersionForm = () => {
      Object.assign(versionForm, defaultVersionForm);
    };
    
    // 创建版本
    const handleCreate = () => {
      resetVersionForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (versionFormRef.value) {
          versionFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新版本
    const handleUpdate = (row) => {
      resetVersionForm();
      Object.assign(versionForm, row);
      
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      
      setTimeout(() => {
        if (versionFormRef.value) {
          versionFormRef.value.clearValidate();
        }
      });
    };
    
    // 预览版本
    const handlePreview = (row) => {
      previewData.value = row;
      previewVisible.value = true;
    };
    
    // 提交表单
    const submitForm = () => {
      versionFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogStatus.value === 'create') {
            // 模拟创建版本
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const newVersion = {
              id: Math.round(Math.random() * 1000),
              platform: versionForm.platform,
              version_name: versionForm.version_name,
              version_code: versionForm.version_code,
              update_type: versionForm.update_type,
              download_url: versionForm.download_url,
              description: versionForm.description,
              status: versionForm.status,
              publish_time: versionForm.status === 'published' ? now : null
            };
            
            list.value.unshift(newVersion);
            total.value += 1;
            
            ElMessage({
              message: '版本创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新版本
            const index = list.value.findIndex(item => item.id === versionForm.id);
            if (index !== -1) {
              // 如果状态从非发布变为发布，更新发布时间
              const needUpdatePublishTime = versionForm.status === 'published' && list.value[index].status !== 'published';
              
              const updatedVersion = { 
                ...list.value[index], 
                ...versionForm,
                publish_time: needUpdatePublishTime ? new Date().toISOString().slice(0, 19).replace('T', ' ') : list.value[index].publish_time
              };
              
              list.value.splice(index, 1, updatedVersion);
              
              ElMessage({
                message: '版本更新成功',
                type: 'success'
              });
            }
          }
          
          dialogFormVisible.value = false;
        }
      });
    };
    
    // 发布版本
    const handlePublish = (row) => {
      ElMessageBox.confirm(
        '确认发布该版本吗？发布后用户将可以看到更新提示。',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          list.value[index].status = 'published';
          list.value[index].publish_time = now;
          
          ElMessage({
            type: 'success',
            message: '版本发布成功'
          });
        }
      });
    };
    
    // 下架版本
    const handleUnpublish = (row) => {
      ElMessageBox.confirm(
        '确认下架该版本吗？下架后用户将不会收到更新提示。',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          list.value[index].status = 'unpublished';
          
          ElMessage({
            type: 'success',
            message: '版本下架成功'
          });
        }
      });
    };
    
    // 删除版本
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确认删除该版本吗？删除后数据无法恢复。',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          list.value.splice(index, 1);
          total.value -= 1;
          
          ElMessage({
            type: 'success',
            message: '版本删除成功'
          });
        }
      });
    };
    
    onMounted(() => {
      fetchData();
    });
    
    return {
      listLoading,
      list,
      total,
      listQuery,
      platformOptions,
      statusOptions,
      updateTypeOptions,
      versionStatusOptions,
      dialogFormVisible,
      dialogStatus,
      versionForm,
      versionFormRef,
      rules,
      previewVisible,
      previewData,
      getUpdateTypeTagType,
      getUpdateTypeText,
      getStatusText,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      handlePreview,
      handlePublish,
      handleUnpublish,
      submitForm,
      handleDelete
    };
  }
};
</script>

<style scoped>
.filter-container {
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.version-preview {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.version-name {
  font-size: 18px;
  font-weight: bold;
}

.update-type {
  margin-bottom: 20px;
}

.preview-content {
  margin-bottom: 20px;
}

.preview-content h3 {
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.description {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.description pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
  line-height: 1.6;
}

.download-info {
  margin-top: 20px;
}

.preview-footer {
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
  text-align: right;
}
</style> 