<template>
  <div class="navigation-management">
    <div class="management-header">
      <h3>APP导航管理</h3>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="addNavItem" :disabled="navItems.length >= 5">添加导航项</el-button>
        <el-button type="success" icon="Check" @click="saveNavConfig" :loading="saveLoading">保存配置</el-button>
        <el-button icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 导航配置说明 -->
    <el-alert
      title="导航菜单配置"
      type="info"
      description="配置App底部导航菜单，设置后将在App底部显示。最多支持5个导航项。"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <!-- 导航项配置表格 -->
    <el-card class="nav-config-card mb-6">
      <template #header>
        <span>导航项配置</span>
      </template>
      
      <el-table :data="navItems" border style="width: 100%" row-key="id" v-loading="loading">
        <el-table-column label="ID" width="80">
          <template #default="{ row, $index }">
            <span>{{ row.id || $index + 1 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="导航ID" width="120">
          <template #default="{ row }">
            <el-input v-model="row.nav_id" placeholder="例如: home" size="small"></el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="名称" width="120">
          <template #default="{ row }">
            <el-input v-model="row.nav_name" placeholder="导航名称" size="small"></el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="图标" width="200">
          <template #default="{ row }">
            <div class="icon-selector">
              <el-select v-model="row.icon" placeholder="选择图标" clearable size="small">
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
        
        <el-table-column label="链接路径" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.path" placeholder="/pages/example.html" size="small"></el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="高亮显示" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.highlight" :active-value="1" :inactive-value="0" size="small"></el-switch>
          </template>
        </el-table-column>
        
        <el-table-column label="排序" width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.sort_order" :min="0" :max="10" size="small"></el-input-number>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small"></el-switch>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="danger" size="small" icon="Delete" @click="removeNavItem($index)">删除</el-button>
            <el-button type="primary" size="small" icon="ArrowUp" @click="moveUp($index)" :disabled="$index === 0">上移</el-button>
            <el-button type="primary" size="small" icon="ArrowDown" @click="moveDown($index)" :disabled="$index === navItems.length - 1">下移</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 导航预览 -->
    <el-card class="nav-preview-card">
      <template #header>
        <span>导航预览</span>
      </template>
      
      <div class="preview-container">
        <div class="phone-mockup">
          <div class="phone-screen">
            <div class="app-content">
              <div class="content-placeholder">
                <el-icon><Document /></el-icon>
                <span>APP内容区域</span>
              </div>
            </div>
            <div class="nav-bar">
              <div 
                v-for="(item, index) in previewItems" 
                :key="index" 
                class="nav-item"
                :class="{ 'active': item.highlight === 1 }"
              >
                <i :class="`van-icon van-icon-${item.icon}`" v-if="item.icon"></i>
                <el-icon v-else><Menu /></el-icon>
                <span>{{ item.nav_name || '导航' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 预览说明 -->
        <div class="preview-info">
          <h4>预览说明</h4>
          <ul>
            <li>蓝色高亮表示当前激活的导航项</li>
            <li>最多支持5个导航项</li>
            <li>建议使用简短的导航名称</li>
            <li>图标选择要与功能相匹配</li>
            <li>链接路径要确保正确性</li>
          </ul>
        </div>
      </div>
    </el-card>

    <!-- 导航模板 -->
    <el-card class="nav-templates-card mt-4">
      <template #header>
        <span>导航模板</span>
      </template>
      
      <div class="templates-grid">
        <div class="template-item" v-for="template in navTemplates" :key="template.name">
          <div class="template-preview">
            <div class="template-nav">
              <div class="template-nav-item" v-for="item in template.items" :key="item.nav_id">
                <i :class="`van-icon van-icon-${item.icon}`"></i>
                <span>{{ item.nav_name }}</span>
              </div>
            </div>
          </div>
          <div class="template-info">
            <h5>{{ template.name }}</h5>
            <p>{{ template.description }}</p>
            <el-button size="small" type="primary" @click="applyTemplate(template)">应用模板</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Menu } from '@element-plus/icons-vue'
import adminApi from '@/api/admin'

export default {
  name: 'NavigationManagement',
  components: {
    Document,
    Menu
  },
  setup() {
    const loading = ref(false)
    const refreshing = ref(false)
    const saveLoading = ref(false)

    // 导航项数据
    const navItems = ref([
      {
        id: 1,
        nav_id: 'home',
        nav_name: '首页',
        icon: 'home-o',
        path: '/pages/index.html',
        highlight: 1,
        status: 1,
        sort_order: 1
      },
      {
        id: 2,
        nav_id: 'mall',
        nav_name: '商城',
        icon: 'shopping-cart-o',
        path: '/pages/mall/index.html',
        highlight: 0,
        status: 1,
        sort_order: 2
      },
      {
        id: 3,
        nav_id: 'user',
        nav_name: '我的',
        icon: 'user-o',
        path: '/pages/user/index.html',
        highlight: 0,
        status: 1,
        sort_order: 3
      }
    ])

    // Vant图标列表
    const vantIcons = [
      'home-o', 'shopping-cart-o', 'user-o', 'search', 'star-o', 'heart-o',
      'location-o', 'phone-o', 'chat-o', 'setting-o', 'bell-o', 'gift-o',
      'coupon-o', 'orders-o', 'shop-o', 'service-o', 'friends-o', 'contact',
      'apps-o', 'wap-nav', 'balance-o', 'refund-o', 'tosend', 'pending-payment',
      'paid', 'aim', 'add-o', 'arrow-left', 'arrow-up', 'success', 'cross',
      'plus', 'minus', 'fail', 'multiply', 'check', 'close', 'stop'
    ]

    // 导航模板
    const navTemplates = [
      {
        name: '电商标准',
        description: '适用于电商类APP的标准导航配置',
        items: [
          { nav_id: 'home', nav_name: '首页', icon: 'home-o', path: '/pages/index.html', highlight: 1, status: 1, sort_order: 1 },
          { nav_id: 'category', nav_name: '分类', icon: 'apps-o', path: '/pages/category.html', highlight: 0, status: 1, sort_order: 2 },
          { nav_id: 'cart', nav_name: '购物车', icon: 'shopping-cart-o', path: '/pages/cart.html', highlight: 0, status: 1, sort_order: 3 },
          { nav_id: 'user', nav_name: '我的', icon: 'user-o', path: '/pages/user.html', highlight: 0, status: 1, sort_order: 4 }
        ]
      },
      {
        name: '服务平台',
        description: '适用于服务类APP的导航配置',
        items: [
          { nav_id: 'home', nav_name: '首页', icon: 'home-o', path: '/pages/index.html', highlight: 1, status: 1, sort_order: 1 },
          { nav_id: 'service', nav_name: '服务', icon: 'service-o', path: '/pages/service.html', highlight: 0, status: 1, sort_order: 2 },
          { nav_id: 'orders', nav_name: '订单', icon: 'orders-o', path: '/pages/orders.html', highlight: 0, status: 1, sort_order: 3 },
          { nav_id: 'message', nav_name: '消息', icon: 'chat-o', path: '/pages/message.html', highlight: 0, status: 1, sort_order: 4 },
          { nav_id: 'user', nav_name: '我的', icon: 'user-o', path: '/pages/user.html', highlight: 0, status: 1, sort_order: 5 }
        ]
      },
      {
        name: '社交应用',
        description: '适用于社交类APP的导航配置',
        items: [
          { nav_id: 'timeline', nav_name: '动态', icon: 'friends-o', path: '/pages/timeline.html', highlight: 1, status: 1, sort_order: 1 },
          { nav_id: 'discover', nav_name: '发现', icon: 'search', path: '/pages/discover.html', highlight: 0, status: 1, sort_order: 2 },
          { nav_id: 'message', nav_name: '消息', icon: 'chat-o', path: '/pages/message.html', highlight: 0, status: 1, sort_order: 3 },
          { nav_id: 'user', nav_name: '我的', icon: 'user-o', path: '/pages/user.html', highlight: 0, status: 1, sort_order: 4 }
        ]
      }
    ]

    // 计算属性
    const previewItems = computed(() => {
      return navItems.value
        .filter(item => item.status === 1)
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 5)
    })

    // 方法
    const refreshData = async () => {
      refreshing.value = true
      try {
        await fetchNavConfig()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        refreshing.value = false
      }
    }

    const fetchNavConfig = async () => {
      loading.value = true
      try {
        // 使用现有的API获取导航配置
        const result = await adminApi.getNavConfig()
        if (result && result.code === 200 && result.data) {
          navItems.value = result.data.map((item, index) => ({
            id: item.id || `nav_${index + 1}`,
            nav_id: item.nav_id || `nav_${index + 1}`,
            nav_name: item.nav_name || '',
            icon: item.icon || '',
            path: item.path || '',
            highlight: parseInt(item.highlight || 0),
            status: parseInt(item.status || 1),
            sort_order: item.sort_order || index + 1
          }))
        }
      } catch (error) {
        console.error('获取导航配置失败:', error)
        ElMessage.error('获取导航配置失败')
      } finally {
        loading.value = false
      }
    }

    const addNavItem = () => {
      if (navItems.value.length >= 5) {
        ElMessage.warning('最多只能添加5个导航项')
        return
      }
      
      const newItem = {
        id: `nav_${Date.now()}`,
        nav_id: `nav_${navItems.value.length + 1}`,
        nav_name: '',
        icon: '',
        path: '',
        highlight: 0,
        status: 1,
        sort_order: navItems.value.length + 1
      }
      navItems.value.push(newItem)
      ElMessage.success('添加导航项成功')
    }

    const removeNavItem = (index) => {
      ElMessageBox.confirm('确认删除此导航项？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        navItems.value.splice(index, 1)
        // 重新计算排序
        navItems.value.forEach((item, idx) => {
          item.sort_order = idx + 1
        })
        ElMessage.success('删除成功')
      }).catch(() => {})
    }

    const moveUp = (index) => {
      if (index > 0) {
        const temp = navItems.value[index]
        navItems.value[index] = navItems.value[index - 1]
        navItems.value[index - 1] = temp
        // 更新排序值
        navItems.value[index].sort_order = index + 1
        navItems.value[index - 1].sort_order = index
      }
    }

    const moveDown = (index) => {
      if (index < navItems.value.length - 1) {
        const temp = navItems.value[index]
        navItems.value[index] = navItems.value[index + 1]
        navItems.value[index + 1] = temp
        // 更新排序值
        navItems.value[index].sort_order = index + 1
        navItems.value[index + 1].sort_order = index + 2
      }
    }

    const saveNavConfig = async () => {
      saveLoading.value = true
      
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
          }
        })
        
        // 使用现有的API保存导航配置
        const result = await adminApi.saveNavConfig(dataToSave)
        
        if (result && result.code === 200) {
          ElMessage.success('导航配置保存成功')
          // 重新获取配置以确保数据同步
          await fetchNavConfig()
        } else {
          ElMessage.error(result?.message || '保存导航配置失败')
        }
      } catch (error) {
        console.error('保存导航配置异常:', error)
        ElMessage.error('保存导航配置失败: ' + (error.message || '未知错误'))
      } finally {
        saveLoading.value = false
      }
    }

    const applyTemplate = (template) => {
      ElMessageBox.confirm(
        `确认要应用"${template.name}"模板吗？这将覆盖当前的导航配置。`,
        '应用模板',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        navItems.value = template.items.map((item, index) => ({
          ...item,
          id: `nav_${Date.now()}_${index}`,
          sort_order: index + 1
        }))
        ElMessage.success('模板应用成功')
      }).catch(() => {
        ElMessage.info('已取消应用模板')
      })
    }

    onMounted(() => {
      fetchNavConfig()
    })

    return {
      loading,
      refreshing,
      saveLoading,
      navItems,
      vantIcons,
      navTemplates,
      previewItems,
      refreshData,
      addNavItem,
      removeNavItem,
      moveUp,
      moveDown,
      saveNavConfig,
      applyTemplate
    }
  }
}
</script>

<style scoped>
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.management-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.nav-config-card {
  margin-bottom: 24px;
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-option i {
  font-size: 18px;
  color: #409eff;
}

.icon-preview {
  font-size: 20px;
  color: #409eff;
}

.nav-preview-card {
  margin-bottom: 24px;
}

.preview-container {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.phone-mockup {
  flex-shrink: 0;
  width: 280px;
  height: 500px;
  background: #333;
  border-radius: 20px;
  padding: 20px 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #909399;
}

.content-placeholder .el-icon {
  font-size: 48px;
}

.nav-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-item i,
.nav-item .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
  color: #646566;
}

.nav-item span {
  font-size: 12px;
  color: #646566;
  line-height: 1;
}

.nav-item.active i,
.nav-item.active .el-icon,
.nav-item.active span {
  color: #1989fa;
}

.preview-info {
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-info h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.preview-info ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.nav-templates-card {
  margin-top: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.template-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.template-preview {
  padding: 20px;
  background: #f8f9fa;
}

.template-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.template-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.template-nav-item i {
  font-size: 16px;
  color: #409eff;
  margin-bottom: 4px;
}

.template-nav-item span {
  font-size: 11px;
  color: #606266;
}

.template-info {
  padding: 16px;
}

.template-info h5 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.template-info p {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 16px;
}

/* Vant图标样式 */
.van-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  font-size: inherit;
  background-color: currentColor;
  mask-size: cover;
  -webkit-mask-size: cover;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .preview-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .phone-mockup {
    width: 240px;
    height: 420px;
    align-self: center;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>
