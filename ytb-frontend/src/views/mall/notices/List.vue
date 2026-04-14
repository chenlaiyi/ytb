<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.title"
        placeholder="公告标题"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
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
      <el-select
        v-model="listQuery.type"
        placeholder="公告类型"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option
          v-for="item in typeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" icon="Plus" @click="handleCreate">
        新增公告
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
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column label="公告类型" width="120" align="center">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.type)">
            {{ getTypeText(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="start_time" label="开始时间" width="160" />
      <el-table-column prop="end_time" label="结束时间" width="160" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="220" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="handlePreview(scope.row)">
            预览
          </el-button>
          <el-button
            :type="scope.row.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="handleUpdateStatus(scope.row)"
          >
            {{ scope.row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">
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

    <!-- 新增/编辑公告弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增公告' : '编辑公告'"
      v-model="dialogFormVisible"
      width="60%"
    >
      <el-form
        ref="noticeFormRef"
        :model="noticeForm"
        :rules="rules"
        label-position="right"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型" prop="type">
          <el-select v-model="noticeForm.type" placeholder="请选择公告类型" style="width: 100%">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px;">
            <div id="editor" style="height: 300px;"></div>
          </div>
        </el-form-item>
        <el-form-item label="跳转链接" prop="link_url">
          <el-input v-model="noticeForm.link_url" placeholder="请输入跳转链接（选填）" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="noticeForm.priority" :min="0" :max="99" style="width: 120px" />
          <span class="form-tip">数字越大优先级越高</span>
        </el-form-item>
        <el-form-item label="有效时间" prop="time_range">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="noticeForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览公告弹窗 -->
    <el-dialog
      title="公告预览"
      v-model="previewVisible"
      width="50%"
    >
      <div class="notice-preview">
        <h2 class="notice-title">{{ previewData.title }}</h2>
        <div class="notice-meta">
          <span>类型：{{ getTypeText(previewData.type) }}</span>
          <span>发布时间：{{ previewData.created_at }}</span>
        </div>
        <div class="notice-content" v-html="previewData.content"></div>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as wangEditor from '@wangeditor/editor';

export default {
  name: 'NoticeList',
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const noticeFormRef = ref(null);
    const editor = ref(null);
    
    // 时间范围选择器
    const timeRange = ref([]);
    
    // 预览相关
    const previewVisible = ref(false);
    const previewData = ref({});
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      title: '',
      status: undefined,
      type: undefined
    });
    
    const statusOptions = [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' }
    ];
    
    const typeOptions = [
      { label: '系统公告', value: 'system' },
      { label: '活动公告', value: 'activity' },
      { label: '维护公告', value: 'maintenance' },
      { label: '更新公告', value: 'update' }
    ];
    
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    
    // 公告表单默认值
    const defaultNoticeForm = {
      id: undefined,
      title: '',
      content: '',
      type: 'system',
      link_url: '',
      priority: 0,
      start_time: '',
      end_time: '',
      status: 'active'
    };
    
    const noticeForm = reactive(Object.assign({}, defaultNoticeForm));
    
    // 表单验证规则
    const rules = {
      title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
      type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
      content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
      time_range: [{ required: true, message: '请选择有效时间', trigger: 'change' }]
    };
    
    // 获取公告列表
    const fetchData = () => {
      listLoading.value = true;
      
      // 模拟API调用
      setTimeout(() => {
        list.value = [
          {
            id: 1,
            title: '点点够App全新上线，注册即送积分',
            content: '<p>点点够App全新上线，注册即送积分100分，可用于购买商品。</p><p>更多优惠，敬请期待！</p>',
            type: 'system',
            link_url: '',
            priority: 10,
            status: 'active',
            start_time: '2023-03-01 00:00:00',
            end_time: '2023-12-31 23:59:59',
            created_at: '2023-03-01 10:00:00'
          },
          {
            id: 2,
            title: '618大促销，全场满减',
            content: '<p>618大促销活动开始啦！</p><p>全场商品满100减20，满200减50，还有更多惊喜等你发现！</p>',
            type: 'activity',
            link_url: '/activity/618',
            priority: 8,
            status: 'active',
            start_time: '2023-06-01 00:00:00',
            end_time: '2023-06-20 23:59:59',
            created_at: '2023-05-25 14:30:00'
          },
          {
            id: 3,
            title: '系统维护通知',
            content: '<p>尊敬的用户：</p><p>我们将于2023年4月15日凌晨2:00-4:00进行系统维护，期间可能影响您的使用体验，请提前做好准备。</p><p>感谢您的理解与支持！</p>',
            type: 'maintenance',
            link_url: '',
            priority: 15,
            status: 'active',
            start_time: '2023-04-14 12:00:00',
            end_time: '2023-04-15 04:00:00',
            created_at: '2023-04-13 16:45:00'
          },
          {
            id: 4,
            title: 'App版本更新V2.0.0',
            content: '<p>点点够App更新到V2.0.0版本</p><p>主要更新内容：</p><ol><li>全新UI界面</li><li>优化购物流程</li><li>新增积分商城</li><li>修复已知bug</li></ol>',
            type: 'update',
            link_url: '',
            priority: 5,
            status: 'inactive',
            start_time: '2023-05-01 00:00:00',
            end_time: '2023-05-10 23:59:59',
            created_at: '2023-04-28 09:15:00'
          }
        ];
        
        total.value = list.value.length;
        listLoading.value = false;
      }, 1000);
    };
    
    // 初始化富文本编辑器
    const initEditor = () => {
      // 如果编辑器已存在，销毁它
      if (editor.value) {
        editor.value.destroy();
        editor.value = null;
      }
      
      const editorConfig = {
        placeholder: '请输入公告内容...',
        onChange: (html) => {
          noticeForm.content = html;
        }
      };
      
      // 创建编辑器
      nextTick(() => {
        const editorElement = document.getElementById('editor');
        if (editorElement) {
          editor.value = wangEditor.createEditor({
            selector: '#editor',
            config: editorConfig,
            mode: 'simple' // 简洁模式
          });
          
          // 设置编辑器内容
          if (noticeForm.content) {
            editor.value.setHtml(noticeForm.content);
          }
        }
      });
    };
    
    // 获取公告类型标签样式
    const getTypeTagType = (type) => {
      const typeMap = {
        system: 'primary',
        activity: 'success',
        maintenance: 'warning',
        update: 'info'
      };
      return typeMap[type] || 'default';
    };
    
    // 获取公告类型文本
    const getTypeText = (type) => {
      const found = typeOptions.find(item => item.value === type);
      return found ? found.label : '未知类型';
    };
    
    // 搜索公告
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
    
    // 重置公告表单
    const resetNoticeForm = () => {
      Object.assign(noticeForm, defaultNoticeForm);
      timeRange.value = [];
    };
    
    // 创建公告
    const handleCreate = () => {
      resetNoticeForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      nextTick(() => {
        if (noticeFormRef.value) {
          noticeFormRef.value.clearValidate();
        }
        initEditor();
      });
    };
    
    // 更新公告
    const handleUpdate = (row) => {
      resetNoticeForm();
      Object.assign(noticeForm, row);
      
      // 设置时间范围
      timeRange.value = [row.start_time, row.end_time];
      
      dialogStatus.value = 'update';
      dialogFormVisible.value = true;
      
      nextTick(() => {
        if (noticeFormRef.value) {
          noticeFormRef.value.clearValidate();
        }
        initEditor();
      });
    };
    
    // 预览公告
    const handlePreview = (row) => {
      previewData.value = row;
      previewVisible.value = true;
    };
    
    // 提交表单
    const submitForm = () => {
      noticeFormRef.value.validate((valid) => {
        if (valid) {
          // 设置时间
          if (timeRange.value && timeRange.value.length === 2) {
            noticeForm.start_time = timeRange.value[0];
            noticeForm.end_time = timeRange.value[1];
          }
          
          if (dialogStatus.value === 'create') {
            // 模拟创建公告
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const newNotice = {
              id: Math.round(Math.random() * 1000),
              title: noticeForm.title,
              content: noticeForm.content,
              type: noticeForm.type,
              link_url: noticeForm.link_url,
              priority: noticeForm.priority,
              status: noticeForm.status,
              start_time: noticeForm.start_time,
              end_time: noticeForm.end_time,
              created_at: now
            };
            
            list.value.unshift(newNotice);
            total.value += 1;
            
            ElMessage({
              message: '公告创建成功',
              type: 'success'
            });
          } else {
            // 模拟更新公告
            const index = list.value.findIndex(item => item.id === noticeForm.id);
            if (index !== -1) {
              const updatedNotice = { ...list.value[index], ...noticeForm };
              list.value.splice(index, 1, updatedNotice);
              
              ElMessage({
                message: '公告更新成功',
                type: 'success'
              });
            }
          }
          
          dialogFormVisible.value = false;
          
          // 销毁编辑器
          if (editor.value) {
            editor.value.destroy();
            editor.value = null;
          }
        }
      });
    };
    
    // 更新公告状态
    const handleUpdateStatus = (row) => {
      const isActive = row.status === 'active';
      const statusText = isActive ? '禁用' : '启用';
      
      ElMessageBox.confirm(
        `确认${statusText}该公告吗？`,
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: isActive ? 'warning' : 'info'
        }
      ).then(() => {
        const index = list.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          list.value[index].status = isActive ? 'inactive' : 'active';
          
          ElMessage({
            type: 'success',
            message: `公告${statusText}成功`
          });
        }
      });
    };
    
    // 删除公告
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确认删除该公告吗？删除后数据无法恢复。',
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
            message: '公告删除成功'
          });
        }
      });
    };
    
    // 组件卸载时销毁编辑器
    onMounted(() => {
      fetchData();
    });
    
    return {
      listLoading,
      list,
      total,
      listQuery,
      statusOptions,
      typeOptions,
      dialogFormVisible,
      dialogStatus,
      noticeForm,
      noticeFormRef,
      rules,
      timeRange,
      previewVisible,
      previewData,
      getTypeTagType,
      getTypeText,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      handlePreview,
      submitForm,
      handleUpdateStatus,
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

.notice-preview {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.notice-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
}

.notice-meta {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.notice-meta span {
  margin: 0 10px;
}

.notice-content {
  line-height: 1.8;
}
</style> 