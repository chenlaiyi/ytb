<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.title"
        placeholder="轮播图标题"
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
        v-model="listQuery.position"
        placeholder="展示位置"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option
          v-for="item in positionOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" icon="Plus" @click="handleCreate">
        新增轮播图
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
      <el-table-column label="轮播图" width="160">
        <template #default="scope">
          <el-image
            :src="getFullImageUrl(scope.row.image_url)"
            fit="contain"
            style="height: 80px; max-width: 150px"
            :preview-src-list="[getFullImageUrl(scope.row.image_url)]"
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column label="展示位置" width="120">
        <template #default="scope">
          <span>{{ getPositionText(scope.row.position) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="链接类型" width="120">
        <template #default="scope">
          <span>{{ getLinkTypeText(scope.row.link_type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="link_url" label="链接地址" min-width="150" />
      <el-table-column prop="sort" label="排序" width="80" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="start_time" label="开始时间" width="160" />
      <el-table-column prop="end_time" label="结束时间" width="160" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">
            编辑
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

    <!-- 新增/编辑轮播图弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增轮播图' : '编辑轮播图'"
      v-model="dialogFormVisible"
      width="60%"
    >
      <el-form
        ref="bannerFormRef"
        :model="bannerForm"
        :rules="rules"
        label-position="right"
        label-width="120px"
        style="padding: 0 20px"
      >
        <el-form-item label="轮播图标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="展示位置" prop="position">
          <el-select v-model="bannerForm.position" placeholder="请选择展示位置" style="width: 100%">
            <el-option
              v-for="item in positionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="轮播图片" prop="image_url">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            list-type="picture-card"
            :file-list="fileList"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 JPG/PNG 文件，且不超过 2MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="链接类型" prop="link_type">
          <el-select v-model="bannerForm.link_type" placeholder="请选择链接类型" style="width: 100%" @change="handleLinkTypeChange">
            <el-option
              v-for="item in linkTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="链接目标" prop="link_url">
          <template v-if="bannerForm.link_type === 'product'">
            <el-select v-model="bannerForm.link_url" placeholder="请选择产品" filterable style="width: 100%">
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="item.name"
                :value="'product:' + item.id"
              />
            </el-select>
          </template>
          <template v-else-if="bannerForm.link_type === 'category'">
            <el-select v-model="bannerForm.link_url" placeholder="请选择分类" filterable style="width: 100%">
              <el-option
                v-for="item in categoryOptions"
                :key="item.id"
                :label="item.name"
                :value="'category:' + item.id"
              />
            </el-select>
          </template>
          <template v-else-if="bannerForm.link_type === 'waterpoint'">
            <el-select v-model="bannerForm.link_url" placeholder="请选择水站" filterable style="width: 100%">
              <el-option
                v-for="item in waterpointOptions"
                :key="item.id"
                :label="item.name"
                :value="'waterpoint:' + item.id"
              />
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="bannerForm.link_url" :placeholder="bannerForm.link_type === 'url' ? '请输入链接地址' : '无需链接'" />
          </template>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="bannerForm.sort" :min="0" :max="999" style="width: 120px" />
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
          <el-radio-group v-model="bannerForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="bannerForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
  name: 'BannerList',
  components: {
    Plus
  },
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const bannerFormRef = ref(null);
    const fileList = ref([]);
    const imageUrl = ref('');
    const uploadedImage = ref(null);
    
    // 时间范围选择器
    const timeRange = ref([]);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      title: '',
      status: undefined,
      position: undefined
    });
    
    const statusOptions = [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' }
    ];
    
    const positionOptions = [
      { label: '首页顶部', value: 'home_top' },
      { label: '首页中部', value: 'home_middle' },
      { label: '分类页', value: 'category' },
      { label: '个人中心', value: 'profile' }
    ];
    
    const linkTypeOptions = [
      { label: '无链接', value: 'none' },
      { label: '外部链接', value: 'url' },
      { label: '产品详情', value: 'product' },
      { label: '产品分类', value: 'category' },
      { label: '水站详情', value: 'waterpoint' },
    ];
    
    // 产品选项（从API获取）
    const productOptions = ref([]);
    const categoryOptions = ref([]);
    const waterpointOptions = ref([]);
    
    // 获取产品列表
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/admin/products', { params: { limit: 100 } });
        if (response.data.code === 200) {
          productOptions.value = response.data.data.data || [];
        }
      } catch (error) {
        console.error('获取产品列表失败:', error);
      }
    };
    
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/admin/api/v1/categories/all');
        if (response.data.code === 200) {
          categoryOptions.value = response.data.data || [];
        }
      } catch (error) {
        console.error('获取分类列表失败:', error);
      }
    };
    
    const dialogFormVisible = ref(false);
    const dialogStatus = ref('');
    
    // 轮播图表单默认值
    const defaultBannerForm = {
      id: undefined,
      title: '',
      image_url: '',
      position: 'home_top',
      link_type: 'none',
      link_url: '',
      sort: 0,
      start_time: '',
      end_time: '',
      status: 'active',
      remark: ''
    };
    
    const bannerForm = reactive(Object.assign({}, defaultBannerForm));
    
    // 表单验证规则
    const rules = {
      title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
      image_url: [{ required: true, message: '请上传轮播图片', trigger: 'change' }],
      position: [{ required: true, message: '请选择展示位置', trigger: 'change' }],
      link_type: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
      link_url: [
        { 
          required: true, 
          validator: (rule, value, callback) => {
            if (bannerForm.link_type !== 'none' && !value) {
              callback(new Error('请输入链接地址'));
            } else {
              callback();
            }
          }, 
          trigger: 'blur' 
        }
      ],
    };
    
    // 获取轮播图列表
    const fetchData = async () => {
      listLoading.value = true;
      
      try {
        const response = await axios.get('/api/admin/v1/banners', { params: listQuery });
        
        if (response.data.code === 200) {
          list.value = response.data.data.data || [];
          total.value = response.data.data.total || 0;
        } else {
          ElMessage.error(response.data.message || '获取轮播图列表失败');
        }
      } catch (error) {
        console.error('获取轮播图列表失败:', error);
        ElMessage.error('获取轮播图列表失败: ' + (error.response?.data?.message || error.message));
      } finally {
        listLoading.value = false;
      }
    };
    
    // 获取完整图片URL
    const getFullImageUrl = (url) => {
      if (!url) return '';
      
      // 处理不同格式的URL
      if (url.startsWith('http')) {
        // 已经是完整URL
        return url;
      } else if (url.startsWith('/storage/')) {
        // 相对于网站根目录的URL
        return 'https://pay.itapgo.com' + url;
      } else {
        // 相对于管理后台的URL
        return 'https://pay.itapgo.com/admin' + url;
      }
    };
    
    // 根据位置获取文本
    const getPositionText = (position) => {
      const found = positionOptions.find(item => item.value === position);
      return found ? found.label : '未知位置';
    };
    
    // 根据链接类型获取文本
    const getLinkTypeText = (linkType) => {
      const found = linkTypeOptions.find(item => item.value === linkType);
      return found ? found.label : '未知类型';
    };
    
    // 处理图片上传变化
    const handleImageChange = (file) => {
      const isImage = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png';
      const isLt2M = file.raw.size / 1024 / 1024 < 2;

      if (!isImage) {
        ElMessage.error('上传图片只能是 JPG 或 PNG 格式!');
        fileList.value = [];
        return false;
      }
      
      if (!isLt2M) {
        ElMessage.error('上传图片大小不能超过 2MB!');
        fileList.value = [];
        return false;
      }
      
      // 保存上传的文件以备后续表单提交使用
      uploadedImage.value = file.raw;
      
      // 本地预览
      const reader = new FileReader();
      reader.readAsDataURL(file.raw);
      reader.onload = () => {
        imageUrl.value = reader.result;
        bannerForm.image_url = reader.result;
      };
    };
    
    // 处理图片移除
    const handleImageRemove = () => {
      imageUrl.value = '';
      bannerForm.image_url = '';
      uploadedImage.value = null;
      fileList.value = [];
    };
    
    // 处理链接类型变化
    const handleLinkTypeChange = () => {
      // 当链接类型改变时，清空链接地址
      bannerForm.link_url = '';
    };
    
    // 搜索轮播图
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
    
    // 重置轮播图表单
    const resetBannerForm = () => {
      fileList.value = [];
      uploadedImage.value = null;
      Object.assign(bannerForm, defaultBannerForm);
      timeRange.value = [];
    };
    
    // 创建轮播图
    const handleCreate = () => {
      resetBannerForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      
      nextTick(() => {
        if (bannerFormRef.value) {
          bannerFormRef.value.clearValidate();
        }
      });
    };
    
    // 更新轮播图
    const handleUpdate = async (row) => {
      resetBannerForm();
      
      try {
        const response = await axios.get(`/api/admin/v1/banners/${row.id}`);
        
        if (response.data.code === 200) {
          const banner = response.data.data;
          Object.assign(bannerForm, banner);
          
          // 设置时间范围
          if (banner.start_time && banner.end_time) {
            timeRange.value = [banner.start_time, banner.end_time];
          }
          
          // 设置图片显示
          if (banner.image_url) {
            fileList.value = [{
              name: '轮播图',
              url: getFullImageUrl(banner.image_url)
            }];
          }
          
          dialogStatus.value = 'update';
          dialogFormVisible.value = true;
          
          nextTick(() => {
            if (bannerFormRef.value) {
              bannerFormRef.value.clearValidate();
            }
          });
        } else {
          ElMessage.error(response.data.message || '获取轮播图详情失败');
        }
      } catch (error) {
        console.error('获取轮播图详情失败:', error);
        ElMessage.error('获取轮播图详情失败: ' + (error.response?.data?.message || error.message));
      }
    };
    
    // 更新轮播图状态
    const handleUpdateStatus = async (row) => {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';
      const statusText = newStatus === 'active' ? '启用' : '禁用';
      
      try {
        const response = await axios.post(`/api/admin/v1/banners/${row.id}/status`, { status: newStatus });
        
        if (response.data.code === 200) {
          ElMessage.success(`${statusText}成功`);
          fetchData();
        } else {
          ElMessage.error(response.data.message || `${statusText}失败`);
        }
      } catch (error) {
        console.error(`${statusText}失败:`, error);
        ElMessage.error(`${statusText}失败: ` + (error.response?.data?.message || error.message));
      }
    };
    
    // 删除轮播图
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确认删除该轮播图吗？',
        '提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await axios.delete(`/api/admin/v1/banners/${row.id}`);
          
          if (response.data.code === 200) {
            ElMessage.success('删除成功');
            fetchData();
          } else {
            ElMessage.error(response.data.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message));
        }
      }).catch(() => {});
    };
    
    // 提交表单
    const submitForm = () => {
      bannerFormRef.value.validate(async (valid) => {
        if (valid) {
          // 设置时间
          if (timeRange.value && timeRange.value.length === 2) {
            bannerForm.start_time = timeRange.value[0];
            bannerForm.end_time = timeRange.value[1];
          }
          
          try {
            const formData = new FormData();
            
            // 设置图片
            if (uploadedImage.value) {
              formData.append('image', uploadedImage.value);
            } else if (bannerForm.image_url && dialogStatus.value === 'create') {
              // 创建时如果有image_url则添加
              formData.append('image_url', bannerForm.image_url);
            } else if (dialogStatus.value === 'update') {
              // 编辑时如果没有上传新图片，显式传递原图片URL
              formData.append('image_url', bannerForm.image_url);
            }
            
            // 添加其他字段
            for (const key in bannerForm) {
              if (key !== 'image_url' && bannerForm[key] !== undefined && bannerForm[key] !== null) {
                formData.append(key, bannerForm[key]);
              }
            }
            
            let response;
            
            if (dialogStatus.value === 'create') {
              // 创建轮播图
              response = await axios.post('/api/admin/v1/banners', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            } else {
              // 更新轮播图
              response = await axios.post(`/api/admin/v1/banners/${bannerForm.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            }
            
            if (response.data.code === 200) {
              ElMessage.success(dialogStatus.value === 'create' ? '创建成功' : '更新成功');
              dialogFormVisible.value = false;
              fetchData();
            } else {
              ElMessage.error(response.data.message || (dialogStatus.value === 'create' ? '创建失败' : '更新失败'));
            }
          } catch (error) {
            console.error(dialogStatus.value === 'create' ? '创建失败' : '更新失败', error);
            ElMessage.error((dialogStatus.value === 'create' ? '创建失败' : '更新失败') + ': ' + (error.response?.data?.message || error.message));
          }
        }
      });
    };
    
    onMounted(() => {
      fetchData();
      fetchProducts();
      fetchCategories();
    });
    
    return {
      listLoading,
      list,
      total,
      listQuery,
      bannerFormRef,
      fileList,
      timeRange,
      statusOptions,
      positionOptions,
      linkTypeOptions,
      productOptions,
      categoryOptions,
      waterpointOptions,
      dialogFormVisible,
      dialogStatus,
      bannerForm,
      rules,
      getFullImageUrl,
      getPositionText,
      getLinkTypeText,
      handleImageChange,
      handleImageRemove,
      handleLinkTypeChange,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleUpdate,
      handleUpdateStatus,
      handleDelete,
      submitForm
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
  margin-top: 20px;
}
</style>