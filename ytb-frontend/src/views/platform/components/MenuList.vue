<template>
  <div class="menu-list">
    <div class="list-header">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加新菜单
      </el-button>
    </div>

    <div class="menu-items" v-if="menuList.length > 0">
      <div 
        v-for="menu in menuList" 
        :key="menu.id"
        class="menu-item"
      >
        <div class="menu-info">
          <div class="menu-title">{{ menu.title }}</div>
          <div class="menu-meta">
            <span class="menu-type">{{ getMenuTypeText(menu.type) }}</span>
            <span class="menu-status" :class="menu.status === 1 ? 'published' : 'draft'">
              {{ menu.status === 1 ? '已发布' : '草稿' }}
            </span>
            <span class="menu-time">{{ formatTime(menu.create_time) }}</span>
          </div>
        </div>
        
        <div class="menu-actions">
          <el-button type="text" @click="$emit('edit-menu', menu)">
            编辑
          </el-button>
          <el-button type="text" @click="$emit('copy-menu', menu)">
            复制
          </el-button>
          <el-button 
            v-if="menu.status === 0" 
            type="text" 
            @click="$emit('publish-menu', menu)"
          >
            发布
          </el-button>
          <el-button type="text" danger @click="$emit('delete-menu', menu)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无菜单">
        <el-button type="primary" @click="showAddDialog = true">
          创建第一个菜单
        </el-button>
      </el-empty>
    </div>

    <!-- 添加菜单对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加新菜单"
      width="600px"
    >
      <el-form :model="addForm" label-width="120px">
        <el-form-item label="菜单名称" required>
          <el-input 
            v-model="addForm.title" 
            placeholder="请输入菜单名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item v-if="menuType === 3" label="菜单类型">
          <el-radio-group v-model="addForm.type">
            <el-radio :label="1">默认菜单</el-radio>
            <el-radio :label="3">个性化菜单</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddMenu">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMenuList, createMenu } from '@/api/branchWechatMenu'

const props = defineProps({
  branchId: {
    type: [String, Number],
    required: true
  },
  menuType: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits([
  'edit-menu',
  'delete-menu', 
  'copy-menu',
  'publish-menu'
])

// 响应式数据
const menuList = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const addForm = reactive({
  title: '',
  type: props.menuType
})

// 方法
const loadMenuList = async () => {
  try {
    loading.value = true
    const response = await getMenuList(props.branchId, { type: props.menuType })
    
    if (response.code === 0) {
      menuList.value = response.data.data || []
    } else {
      ElMessage.error(response.message || '获取菜单列表失败')
    }
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddMenu = async () => {
  if (!addForm.title.trim()) {
    ElMessage.warning('请输入菜单名称')
    return
  }

  try {
    const response = await createMenu(props.branchId, {
      title: addForm.title,
      type: addForm.type,
      menu_buttons: []
    })
    
    if (response.code === 0) {
      ElMessage.success('创建成功')
      showAddDialog.value = false
      addForm.title = ''
      loadMenuList()
    } else {
      ElMessage.error(response.message || '创建失败')
    }
  } catch (error) {
    console.error('创建菜单失败:', error)
    ElMessage.error('创建失败')
  }
}

const getMenuTypeText = (type) => {
  const typeMap = {
    1: '默认菜单',
    3: '个性化菜单'
  }
  return typeMap[type] || '未知类型'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 监听属性变化
watch(() => props.menuType, () => {
  loadMenuList()
})

// 初始化
onMounted(() => {
  loadMenuList()
})
</script>

<style scoped>
.menu-list {
  padding: 20px;
}

.list-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.menu-items {
  space-y: 12px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  margin-bottom: 12px;
}

.menu-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.menu-info {
  flex: 1;
}

.menu-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.menu-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #909399;
}

.menu-type {
  padding: 2px 8px;
  background: #f0f9ff;
  color: #0ea5e9;
  border-radius: 4px;
}

.menu-status {
  padding: 2px 8px;
  border-radius: 4px;
}

.menu-status.published {
  background: #f0f9f0;
  color: #67c23a;
}

.menu-status.draft {
  background: #fdf6ec;
  color: #e6a23c;
}

.menu-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 