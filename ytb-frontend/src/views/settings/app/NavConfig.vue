<template>
  <div class="nav-config-wrapper">
    <div v-if="loadError" class="mb-4">
      <el-alert
        :title="loadError"
        type="error"
        :closable="false"
        show-icon
      />
    </div>

    <el-alert
      title="导航菜单配置"
      type="info"
      description="配置App底部导航菜单，设置后将在App底部显示。最多支持5个导航项。"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <el-form label-width="120px" class="mb-4">
      <el-form-item>
        <el-button type="primary" @click="addNavItem" :disabled="navItems.length >= 5">添加导航项</el-button>
        <el-button type="success" @click="saveNavConfig" :loading="saveLoading">保存配置</el-button>
      </el-form-item>
    </el-form>
    
    <el-table
      :data="navItems"
      border
      style="width: 100%"
      row-key="id"
      v-loading="loading"
    >
      <el-table-column label="ID" width="80">
        <template #default="{ row, $index }">
          <span>{{ row.id || $index + 1 }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="导航ID" width="120">
        <template #default="{ row }">
          <el-input v-model="row.nav_id" placeholder="例如: home"></el-input>
        </template>
      </el-table-column>
      
      <el-table-column label="名称" width="120">
        <template #default="{ row }">
          <el-input v-model="row.nav_name" placeholder="导航名称"></el-input>
        </template>
      </el-table-column>
      
      <el-table-column label="图标" width="180">
        <template #default="{ row }">
          <div class="icon-selector">
            <el-select v-model="row.icon" placeholder="选择图标" clearable>
              <el-option
                v-for="icon in vantIcons"
                :key="icon"
                :label="icon"
                :value="icon"
              >
                <div class="icon-option">
                  <i :class="`van-icon van-icon-${icon}`"></i>
                  <span>{{ icon }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="icon-preview" v-if="row.icon">
              <i :class="`van-icon van-icon-${row.icon}`"></i>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="链接路径">
        <template #default="{ row }">
          <el-input v-model="row.path" placeholder="/Tapp/app/pages/example.html"></el-input>
        </template>
      </el-table-column>
      
      <el-table-column label="高亮显示" width="100" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.highlight" :active-value="1" :inactive-value="0"></el-switch>
        </template>
      </el-table-column>
      
      <el-table-column label="排序" width="100">
        <template #default="{ row }">
          <el-input-number v-model="row.sort_order" :min="0" :max="10" size="small"></el-input-number>
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0"></el-switch>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row, $index }">
          <el-button type="danger" size="small" icon="Delete" circle @click="removeNavItem($index)"></el-button>
          <el-button type="primary" size="small" icon="ArrowUp" circle @click="moveUp($index)" :disabled="$index === 0"></el-button>
          <el-button type="primary" size="small" icon="ArrowDown" circle @click="moveDown($index)" :disabled="$index === navItems.length - 1"></el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="nav-preview mt-4">
      <h3>导航预览</h3>
      <div class="preview-container">
        <div class="nav-bar">
          <div 
            v-for="(item, index) in previewItems" 
            :key="index" 
            class="nav-item"
            :class="{ 'active': item.highlight === 1 }"
          >
            <i :class="`van-icon van-icon-${item.icon}`"></i>
            <span>{{ item.nav_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import adminApi from '@/api/admin';

export default {
  name: 'NavConfig',
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const navItems = ref([]);
    const loadError = ref('');
    const saveLoading = ref(false);
    
    // Vant 图标列表 (常用的一部分)
    const vantIcons = ref([
      'home-o', 'search', 'friends-o', 'setting-o', 'cart-o', 'shop-o',
      'chat-o', 'smile-o', 'user-o', 'location-o', 'like-o', 'star-o',
      'phone-o', 'cluster-o', 'clock-o', 'gold-coin-o', 'photo-o',
      'gift-o', 'coupon-o', 'todo-list-o', 'certificate', 'award-o',
      'diamond-o', 'gem-o', 'service-o', 'paid', 'balance-o',
      'medial-o', 'bag-o', 'fire-o', 'eye-o'
    ]);

    // 预览数据 - 只展示启用状态的项目
    const previewItems = computed(() => {
      // 确保navItems.value是数组，并且每个item都是有效对象
      if (!Array.isArray(navItems.value)) {
        return [];
      }
      
      try {
        return navItems.value
          .filter(item => item && typeof item === 'object' && item.status === 1)
          .sort((a, b) => {
            const sortA = parseInt(a.sort_order) || 0;
            const sortB = parseInt(b.sort_order) || 0;
            return sortA - sortB;
          });
      } catch (error) {
        console.error('处理预览数据时出错:', error);
        return [];
      }
    });

    // 获取导航配置
    const fetchNavConfig = async () => {
      loading.value = true;
      loadError.value = '';
      
      // 确保navItems始终是数组
      navItems.value = [];
      
      try {
        // 使用API获取导航配置
        const result = await adminApi.getNavConfig();
        
        if (result && (result.code === 0 || result.code === 200) && result.data) {
          // 从响应中提取items数组，如果不存在则使用空数组
          if (result.data.items && Array.isArray(result.data.items)) {
            navItems.value = result.data.items.map(item => ({
              ...item,
              // 确保关键属性存在并且类型正确
              status: typeof item.status === 'number' ? item.status : parseInt(item.status || 1),
              highlight: typeof item.highlight === 'number' ? item.highlight : parseInt(item.highlight || 0),
              sort_order: typeof item.sort_order === 'number' ? item.sort_order : parseInt(item.sort_order || 0)
            }));
          } else {
            // 如果没有items数组或格式不正确，使用空数组
            addDefaultItems();
            return;
          }
          
          // ElMessage.success('导航配置加载成功'); // 移除页面加载时的成功提示
          
          // 如果没有导航项，添加默认项
          if (navItems.value.length === 0) {
            addDefaultItems();
          }
        } else {
          const errorMsg = result?.message || '数据格式错误';
          console.error('导航配置API响应错误:', result);
          loadError.value = '获取导航配置失败: ' + errorMsg;
          addDefaultItems();
          ElMessage.warning('获取导航配置为空，已使用默认值');
        }
      } catch (error) {
        console.error('获取导航配置异常:', error);
        const errorMsg = error.response?.data?.message || error.message || '网络错误';
        loadError.value = '获取导航配置失败: ' + errorMsg;
        addDefaultItems();
        ElMessage.error('获取导航配置失败: ' + errorMsg);
      } finally {
        loading.value = false;
      }
    };

    // 添加默认导航项
    const addDefaultItems = () => {
      navItems.value = [
        { nav_id: 'home', nav_name: '首页', icon: 'home-o', path: '/Tapp/app/index.html', highlight: 0, status: 1, sort_order: 10 },
        { nav_id: 'device', nav_name: '设备', icon: 'cluster-o', path: '/Tapp/app/pages/devices.html', highlight: 0, status: 1, sort_order: 20 },
        { nav_id: 'water', nav_name: '取水点', icon: 'location-o', path: '/Tapp/app/pages/water.html', highlight: 1, status: 1, sort_order: 30 },
        { nav_id: 'merchant', nav_name: '商户', icon: 'shop-o', path: '/Tapp/app/pages/merchant.html', highlight: 0, status: 1, sort_order: 40 },
        { nav_id: 'user', nav_name: '我的', icon: 'user-o', path: '/Tapp/app/pages/user.html', highlight: 0, status: 1, sort_order: 50 }
      ];
    };

    // 添加导航项
    const addNavItem = () => {
      if (navItems.value.length >= 5) {
        ElMessage.warning('最多只能添加5个导航项');
        return;
      }
      
      navItems.value.push({
        id: null,
        nav_id: 'nav_' + (navItems.value.length + 1),
        nav_name: '',
        icon: '',
        path: '',
        highlight: 0,
        status: 1,
        sort_order: (navItems.value.length + 1) * 10
      });
    };

    // 移除导航项
    const removeNavItem = (index) => {
      ElMessageBox.confirm('确认删除此导航项？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        navItems.value.splice(index, 1);
        // 重新计算排序
        navItems.value.forEach((item, idx) => {
          item.sort_order = idx;
        });
        ElMessage.success('删除成功');
      }).catch(() => {});
    };

    // 上移
    const moveUp = (index) => {
      if (index > 0) {
        const temp = navItems.value[index];
        navItems.value[index] = navItems.value[index - 1];
        navItems.value[index - 1] = temp;
        // 更新排序值
        navItems.value[index].sort_order = index;
        navItems.value[index - 1].sort_order = index - 1;
      }
    };

    // 下移
    const moveDown = (index) => {
      if (index < navItems.value.length - 1) {
        const temp = navItems.value[index];
        navItems.value[index] = navItems.value[index + 1];
        navItems.value[index + 1] = temp;
        // 更新排序值
        navItems.value[index].sort_order = index;
        navItems.value[index + 1].sort_order = index + 1;
      }
    };

    // 保存导航配置
    const saveNavConfig = async () => {
      saveLoading.value = true;
      
      try {
        // 确保每个导航项都有id并且字段名称正确
        const dataToSave = navItems.value.map((item, index) => {
          return {
            id: item.id || `nav_${index + 1}`,
            nav_id: item.nav_id || `nav_${index + 1}`,
            nav_name: item.nav_name || '',
            icon: item.icon || '',
            path: item.path || '',
            highlight: parseInt(item.highlight || 0),
            status: parseInt(item.status || 1),
            sort_order: index + 1
          };
        });
        
        // 使用API保存导航配置
        const result = await adminApi.saveNavConfig(dataToSave);
        
        if (result && result.code === 0) {
          ElMessage.success('导航配置保存成功');
          // 重新获取配置以确保数据同步
          await fetchNavConfig();
        } else {
          ElMessage.error(result?.message || '保存导航配置失败');
        }
      } catch (error) {
        console.error('保存导航配置异常:', error);
        ElMessage.error('保存导航配置失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };

    // 组件挂载时获取数据
    onMounted(() => {
      fetchNavConfig();
    });

    return {
      loading,
      saveLoading,
      loadError,
      navItems,
      vantIcons,
      previewItems,
      addNavItem,
      removeNavItem,
      moveUp,
      moveDown,
      addDefaultItems,
      saveNavConfig,
      fetchNavConfig
    };
  }
};
</script>

<style>
/* 图标选项样式 */
.icon-option {
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-option i {
  font-size: 20px;
}

.icon-preview {
  margin-left: 10px;
  font-size: 24px;
}

/* Nav预览样式 */
.nav-preview {
  margin-top: 20px;
}

.preview-container {
  margin-top: 10px;
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background: #F8F8F8;
}

.nav-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  background: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px 15px;
  cursor: pointer;
}

.nav-item i {
  font-size: 24px;
  margin-bottom: 5px;
  color: #646566;
}

.nav-item span {
  font-size: 12px;
  color: #646566;
}

.nav-item.active i,
.nav-item.active span {
  color: #1989fa;
}

/* 引用SVG图标样式 */
.van-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  font-size: inherit;
  background-color: currentColor;
  mask-size: cover;
  -webkit-mask-size: cover;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style> 