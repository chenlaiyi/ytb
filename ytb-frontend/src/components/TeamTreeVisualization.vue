<template>
  <div class="team-tree-visualization">
    <!-- 根节点 -->
    <div class="tree-root">
      <div class="root-node" :class="getRootNodeClass()">
        <!-- 层级标识 -->
        <div class="level-indicator">
          <span class="level-text">团队长</span>
          <div class="level-dot" style="background-color: #722ed1;"></div>
        </div>
        
        <!-- 成员信息 -->
        <div class="member-content">
          <div class="member-header">
            <el-avatar :size="35" :src="rootUser.avatar" @error="handleAvatarError">
              <el-icon><User /></el-icon>
            </el-avatar>
            
            <div class="member-basic">
              <div class="member-name">{{ rootUser.name || '未设置姓名' }}</div>
              <div class="member-stats">
                <span class="stat-item">团队: {{ teamMembers.length }}人</span>
                <span v-if="rootUser.vip_paid_at" class="stat-item time">
                  完款: {{ formatDate(rootUser.vip_paid_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 团队成员树 -->
    <div v-if="treeData && treeData.length > 0" class="tree-container">
      <!-- 连接线 -->
      <div class="root-connection"></div>
      
      <!-- 第一层成员 - 水平排列 -->
      <div class="tree-level level-1">
        <TreeNode
          v-for="(member, index) in treeData"
          :key="member.id"
          :member="member"
          :level="1"
          :index="index"
          :total="treeData.length"
          @toggle-expand="handleToggleExpand"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无团队成员">
        <template #image>
          <el-icon size="60" color="#c0c4cc"><UserFilled /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { User, UserFilled } from '@element-plus/icons-vue';
import TreeNode from './TreeNode.vue';

// Props
const props = defineProps({
  rootUser: {
    type: Object,
    required: true
  },
  teamMembers: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['toggle-expand']);

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.warn('头像加载失败，使用默认头像:', e.target.src);
  e.target.src = '/admin/public/images/default-avatar.png';
};

// 将扁平数组转换为树形结构
const buildTreeStructure = (flatArray) => {
  if (!flatArray || flatArray.length === 0) {
    return [];
  }

  // 创建ID到节点的映射
  const nodeMap = new Map();
  
  // 初始化所有节点
  flatArray.forEach(item => {
    nodeMap.set(item.id, {
      ...item,
      children: [],
      children_count: 0,
      total_children_count: 0
    });
  });

  // 构建父子关系
  const rootNodes = [];
  
  flatArray.forEach(item => {
    const node = nodeMap.get(item.id);
    
    if (item.referrer_id && nodeMap.has(item.referrer_id)) {
      // 有推荐人且推荐人在数据中，添加为子节点
      const parent = nodeMap.get(item.referrer_id);
      parent.children.push(node);
      parent.children_count = parent.children.length;
    } else {
      // 没有推荐人或推荐人不在数据中，作为根节点
      rootNodes.push(node);
    }
  });

  // 递归计算总子节点数量
  const calculateTotalChildren = (node) => {
    let total = node.children.length;
    node.children.forEach(child => {
      total += calculateTotalChildren(child);
    });
    node.total_children_count = total;
    return total;
  };

  // 为所有根节点计算总子节点数
  rootNodes.forEach(calculateTotalChildren);

  return rootNodes;
};

// 计算属性：树形数据
const treeData = computed(() => {
  return buildTreeStructure(props.teamMembers);
});

// 方法
const getRootNodeClass = () => {
  if (props.rootUser.is_vip && props.rootUser.is_vip_paid) {
    return 'vip-paid';
  } else if (props.rootUser.is_vip) {
    return 'vip-unpaid';
  }
  return 'normal';
};

const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const handleToggleExpand = (data) => {
  emit('toggle-expand', data);
};
</script>

<style scoped>
.team-tree-visualization {
  width: 100%;
  min-height: 400px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 30px;
  position: relative;
  overflow-x: auto;
}

.tree-root {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
}

.root-node {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid;
  position: relative;
  min-width: 240px;
  max-width: 280px;
  transition: all 0.3s ease;
}

.root-node.vip-paid {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.root-node.vip-unpaid {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fffbf0 0%, #fff7e6 100%);
}

.root-node.normal {
  border-color: #909399;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
}

/* 层级标识样式 */
.root-node .level-indicator {
  position: absolute;
  top: -8px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.root-node .level-text {
  font-size: 12px;
  font-weight: 600;
  color: #722ed1;
}

.root-node .level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 成员内容样式 */
.root-node .member-content {
  width: 100%;
}

.root-node .member-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.root-node .member-basic {
  flex: 1;
  min-width: 0;
}

.root-node .member-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.root-node .member-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.root-node .stat-item {
  font-size: 13px;
  color: #606266;
  background: rgba(64, 158, 255, 0.1);
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.root-node .stat-item.time {
  background: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.tree-container {
  margin-top: 20px;
}

.tree-levels {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tree-level {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.level-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.level-title {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
}

.level-members {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.member-node {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #e4e7ed;
  transition: all 0.2s ease;
  cursor: pointer;
}

.member-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-node.vip-paid {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.member-node.vip-unpaid {
  border-left-color: #e6a23c;
  background: #fffbf0;
}

.member-node.normal {
  border-left-color: #909399;
}

.member-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.team-count {
  font-size: 12px;
  color: #909399;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .level-members {
    grid-template-columns: 1fr;
  }
  
  .member-node {
    padding: 10px;
  }
  
  .member-name {
    font-size: 13px;
  }
}

/* 滚动条样式 */
.team-tree-visualization::-webkit-scrollbar {
  height: 8px;
}

.team-tree-visualization::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.team-tree-visualization::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.team-tree-visualization::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>