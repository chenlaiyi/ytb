<template>
  <div class="menu-tree-item">
    <div class="menu-item">
      <div class="menu-content">
        <div class="menu-info">
          <van-icon :name="menu.icon || 'apps-o'" />
          <span class="menu-title">{{ menu.title }}</span>
          <van-tag v-if="menu.is_system" type="primary" size="mini">系统</van-tag>
          <van-tag v-if="!menu.is_enabled" type="danger" size="mini">禁用</van-tag>
        </div>
        <div class="menu-actions">
          <van-button size="mini" type="primary" @click="$emit('edit', menu)">
            编辑
          </van-button>
          <van-button size="mini" @click="$emit('create-child', menu)">
            添加子菜单
          </van-button>
          <van-button 
            size="mini" 
            :type="menu.is_enabled ? 'warning' : 'success'"
            @click="$emit('toggle-status', menu)"
          >
            {{ menu.is_enabled ? '禁用' : '启用' }}
          </van-button>
          <van-button 
            v-if="!menu.is_system"
            size="mini" 
            type="danger" 
            @click="$emit('delete', menu)"
          >
            删除
          </van-button>
        </div>
      </div>
    </div>
    
    <!-- 子菜单 -->
    <div v-if="menu.children && menu.children.length > 0" class="menu-children">
      <menu-tree-item
        v-for="child in menu.children"
        :key="child.id"
        :menu="child"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-status="$emit('toggle-status', $event)"
        @create-child="$emit('create-child', $event)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  menu: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete', 'toggle-status', 'create-child'])
</script>

<style scoped>
.menu-tree-item {
  margin-bottom: 8px;
}

.menu-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
}

.menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}

.menu-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-title {
  font-weight: 500;
  color: #303133;
}

.menu-actions {
  display: flex;
  gap: 8px;
}

.menu-children {
  margin-left: 24px;
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid #e4e7ed;
}

.menu-children .menu-tree-item {
  margin-bottom: 6px;
}
</style> 