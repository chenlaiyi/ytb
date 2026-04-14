<template>
  <div class="element-icon-selector">
    <el-input 
      v-model="iconValue" 
      :placeholder="placeholder"
      @input="updateIcon"
      clearable
    >
      <template #prepend>
        <div class="icon-preview-box">
          <el-icon v-if="iconValue">
            <component :is="resolveIcon(iconValue)" />
          </el-icon>
          <span v-else class="no-icon">无</span>
        </div>
      </template>
      <template #append>
        <el-button @click="showIconDialog = true" type="primary">选择图标</el-button>
      </template>
    </el-input>
    
    <!-- 图标选择对话框 -->
    <el-dialog
      v-model="showIconDialog"
      title="选择图标"
      width="800px"
      destroy-on-close
      center
      class="icon-selector-dialog"
    >
      <div class="dialog-header">
        <div class="selected-icon" v-if="iconValue">
          <div class="selected-preview">
            <el-icon>
              <component :is="resolveIcon(iconValue)" />
            </el-icon>
          </div>
          <div class="selected-name">已选: {{ iconValue }}</div>
        </div>
      </div>
      
      <!-- 搜索栏 -->
      <div class="icon-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索图标名称"
          clearable
          @input="filterIcons"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <!-- 常用图标 -->
      <div class="icon-category" v-if="!searchKeyword">
        <div class="category-title">
          <el-tag type="primary" effect="plain" size="small">常用图标</el-tag>
        </div>
        <div class="icon-grid">
          <div 
            v-for="(icon, index) in commonIcons" 
            :key="`common-${index}`" 
            class="icon-item" 
            :class="{'active': iconValue === icon.name}"
            @click="selectIcon(icon.name)"
          >
            <div class="icon-box">
              <el-icon>
                <component :is="resolveIcon(icon.name)" />
              </el-icon>
            </div>
            <span>{{ icon.label }}</span>
          </div>
        </div>
      </div>
      
      <!-- 全部图标或搜索结果 -->
      <div class="icon-category">
        <div class="category-title">
          <el-tag type="success" effect="plain" size="small">
            {{ searchKeyword ? `搜索结果 (${displayIcons.length})` : '全部图标' }}
          </el-tag>
        </div>
        
        <div class="empty-result" v-if="displayIcons.length === 0">
          <el-empty description="没有找到匹配的图标" :image-size="100"></el-empty>
        </div>
        
        <div class="icon-grid" v-else>
          <div 
            v-for="(icon, index) in displayIcons" 
            :key="`all-${index}`" 
            class="icon-item" 
            :class="{'active': iconValue === icon.name}"
            @click="selectIcon(icon.name)"
          >
            <div class="icon-box">
              <el-icon>
                <component :is="resolveIcon(icon.name)" />
              </el-icon>
            </div>
            <span>{{ icon.name }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showIconDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmIconSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'ElementIconSelector',
  components: {
    Search,
    ...ElementPlusIconsVue
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请选择图标'
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // 状态变量
    const iconValue = ref(props.modelValue)
    const showIconDialog = ref(false)
    const searchKeyword = ref('')
    const primaryColor = '#409EFF'

    // 监听modelValue变化
    watch(() => props.modelValue, (newVal) => {
      iconValue.value = newVal
    })

    // 常用图标
    const commonIcons = [
      { name: 'Monitor', label: '控制面板' },
      { name: 'User', label: '用户' },
      { name: 'UserFilled', label: '用户填充' },
      { name: 'Setting', label: '设置' },
      { name: 'Menu', label: '菜单' },
      { name: 'Document', label: '文档' },
      { name: 'List', label: '列表' },
      { name: 'ShoppingCart', label: '购物车' },
      { name: 'ShoppingBag', label: '购物袋' },
      { name: 'Goods', label: '商品' },
      { name: 'Grid', label: '网格' },
      { name: 'Operation', label: '操作' },
      { name: 'ChatDotRound', label: '消息' },
      { name: 'DataLine', label: '数据线' },
      { name: 'DataAnalysis', label: '数据分析' },
      { name: 'Cpu', label: 'CPU' },
      { name: 'HomeFilled', label: '首页' },
      { name: 'Phone', label: '电话' },
      { name: 'Avatar', label: '头像' },
      { name: 'Bell', label: '铃铛' }
    ]

    // 所有图标
    const allIcons = Object.keys(ElementPlusIconsVue).map(name => ({
      name,
      component: ElementPlusIconsVue[name]
    }))

    // 过滤图标
    const displayIcons = ref(allIcons)

    const filterIcons = () => {
      if (!searchKeyword.value) {
        displayIcons.value = allIcons
        return
      }
      
      const keyword = searchKeyword.value.toLowerCase()
      displayIcons.value = allIcons.filter(icon => 
        icon.name.toLowerCase().includes(keyword)
      )
    }

    // 解析图标名称
    const resolveIcon = (iconName) => {
      if (!iconName) return null
      
      // 检查ElementPlus图标库
      for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        // 不区分大小写比较
        if (key.toLowerCase() === iconName.toLowerCase()) {
          return component
        }
      }
      
      return null
    }

    // 方法
    const updateIcon = () => {
      emit('update:modelValue', iconValue.value)
      emit('change', iconValue.value)
    }

    const selectIcon = (iconName) => {
      iconValue.value = iconName
      updateIcon()
    }

    const confirmIconSelection = () => {
      updateIcon()
      showIconDialog.value = false
    }

    return {
      iconValue,
      showIconDialog,
      searchKeyword,
      commonIcons,
      displayIcons,
      filterIcons,
      updateIcon,
      selectIcon,
      confirmIconSelection,
      resolveIcon
    }
  }
}
</script>

<style scoped>
.element-icon-selector {
  width: 100%;
}

.icon-preview-box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-preview-box .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.no-icon {
  color: #c0c4cc;
  font-size: 12px;
}

.icon-selector-dialog {
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.selected-icon {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-preview {
  margin-right: 10px;
}

.selected-preview .el-icon {
  font-size: 24px;
  color: #409EFF;
}

.selected-name {
  font-weight: 500;
}

.icon-search {
  margin-bottom: 20px;
}

.icon-category {
  margin-bottom: 24px;
}

.category-title {
  margin-bottom: 12px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
}

.icon-item:hover {
  background-color: #f5f7fa;
}

.icon-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
}

.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.icon-item.active .icon-box {
  background-color: #409EFF;
  color: #fff;
}

.icon-item.active .icon-box .el-icon {
  color: #fff;
}

.icon-box .el-icon {
  font-size: 20px;
  color: #606266;
}

.icon-item span {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-result {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
