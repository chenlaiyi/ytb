<template>
  <div class="tree-node" :class="`level-${level}`">
    <!-- 连接线 -->
    <div v-if="level > 1" class="connection-lines">
      <div class="vertical-line"></div>
      <div class="horizontal-line"></div>
    </div>
    
    <!-- 成员卡片 -->
    <div class="member-card" :class="getCardClass()">
      <!-- 层级标识 -->
      <div class="level-indicator">
        <span class="level-text">{{ getLevelText() }}</span>
        <div class="level-dot" :style="{ backgroundColor: getLevelColor() }"></div>
      </div>
      
      <!-- 成员信息 -->
      <div class="member-content">
        <div class="member-header">
          <el-avatar :size="35" :src="member.avatar" @error="handleAvatarError">
            <el-icon><User /></el-icon>
          </el-avatar>
          
          <div class="member-basic">
            <div class="member-name">{{ member.name || '未设置姓名' }}</div>
            <div class="member-stats">
              <span class="stat-item">团队: {{ member.total_children_count + 1 }}人</span>
              <span v-if="member.vip_paid_at" class="stat-item time">
                完款: {{ formatDate(member.vip_paid_at) }}
              </span>
            </div>
          </div>
          
          <!-- 展开/收起按钮 -->
          <div v-if="hasChildren" class="expand-controls">
            <el-button
              :type="expanded ? 'primary' : 'default'"
              size="small"
              circle
              @click="toggleExpand"
              :icon="expanded ? ArrowUp : ArrowDown"
            />
            <span class="children-count">{{ member.children_count }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 子成员 -->
    <div v-if="expanded && hasChildren" class="children-container">
      <div class="children-wrapper">
        <TreeNode
          v-for="(child, index) in member.children"
          :key="child.id"
          :member="child"
          :level="level + 1"
          :index="index"
          :total="member.children.length"
          @toggle-expand="handleChildToggle"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { User, ArrowDown, ArrowUp } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  index: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 1
  }
});

// Emits
const emit = defineEmits(['toggle-expand']);

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.warn('成员头像加载失败，使用默认头像:', e.target.src);
  e.target.src = '/admin/public/images/default-avatar.png';
};

// 状态
const expanded = ref(true); // 默认展开前两层

// 计算属性
const hasChildren = computed(() => {
  return props.member.children && props.member.children.length > 0;
});

// 方法
const toggleExpand = () => {
  expanded.value = !expanded.value;
  emit('toggle-expand', {
    member: props.member,
    expanded: expanded.value,
    level: props.level
  });
};

const handleChildToggle = (data) => {
  emit('toggle-expand', data);
};

const getCardClass = () => {
  const classes = [];
  
  if (props.member.is_vip && props.member.is_vip_paid) {
    classes.push('vip-paid');
  } else if (props.member.is_vip) {
    classes.push('vip-unpaid');
  } else {
    classes.push('normal');
  }
  
  if (hasChildren.value) {
    classes.push('has-children');
  }
  
  return classes.join(' ');
};

const getLevelText = () => {
  // 使用member对象中的level属性，这是API返回的绝对层级
  const actualLevel = props.member.level || props.level;
  const levelNames = {
    1: '一级',
    2: '二级', 
    3: '三级',
    4: '四级',
    5: '五级',
    6: '六级',
    7: '七级',
    8: '八级',
    9: '九级'
  };
  return levelNames[actualLevel] || `${actualLevel}级`;
};

const getLevelColor = () => {
  // 使用member对象中的level属性来确定颜色
  const actualLevel = props.member.level || props.level;
  const colors = [
    '#409eff', // 蓝色 - 一级
    '#67c23a', // 绿色 - 二级
    '#e6a23c', // 橙色 - 三级
    '#f56c6c', // 红色 - 四级
    '#9c27b0', // 紫色 - 五级
    '#00bcd4', // 青色 - 六级
    '#ff5722', // 深橙色 - 七级
    '#795548', // 棕色 - 八级
    '#607d8b', // 蓝灰色 - 九级及以上
  ];
  return colors[actualLevel - 1] || colors[colors.length - 1];
};

const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};
</script>

<style scoped>
.tree-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.connection-lines {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
}

.vertical-line {
  width: 2px;
  height: 15px;
  background: linear-gradient(to bottom, #e4e7ed, #409eff);
  margin: 0 auto;
}

.horizontal-line {
  width: 30px;
  height: 2px;
  background: #409eff;
  margin-top: -1px;
}

.member-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  min-width: 200px;
  max-width: 240px;
}

.member-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.member-card.vip-paid {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.member-card.vip-unpaid {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fffbf0 0%, #fff7e6 100%);
}

.member-card.normal {
  border-color: #909399;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.member-card.has-children {
  border-bottom-width: 4px;
}

.level-indicator {
  position: absolute;
  top: -8px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.level-text {
  font-size: 11px;
  font-weight: bold;
  color: #606266;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.member-content {
  margin-top: 8px;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-basic {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
  word-break: break-all;
}

.member-nickname {
  font-size: 10px;
  color: #67c23a;
  margin-bottom: 4px;
  word-break: break-all;
  opacity: 0.8;
}

.member-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item {
  font-size: 11px;
  color: #606266;
  background: rgba(0, 0, 0, 0.03);
  padding: 1px 4px;
  border-radius: 3px;
  display: inline-block;
}

.stat-item.time {
  color: #67c23a;
  font-weight: 500;
}

.expand-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.children-count {
  font-size: 10px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 8px;
}

.children-container {
  margin-top: 20px;
  position: relative;
  width: 100%;
}

.children-container::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, #409eff, #67c23a);
  transform: translateX(-50%);
}

.children-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding-top: 10px;
}

/* 不同层级的样式 */
.level-1 .member-card {
  border-left: 4px solid #409eff;
}

.level-2 .member-card {
  border-left: 4px solid #67c23a;
}

.level-3 .member-card {
  border-left: 4px solid #e6a23c;
}

.level-4 .member-card {
  border-left: 4px solid #f56c6c;
}

.level-5 .member-card {
  border-left: 4px solid #9c27b0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-card {
    min-width: 180px;
    max-width: 220px;
    padding: 10px;
  }
  
  .member-header {
    gap: 8px;
  }
  
  .member-name {
    font-size: 12px;
  }
  
  .member-nickname {
    font-size: 9px;
  }
  
  .stat-item {
    font-size: 10px;
  }
  
  .children-wrapper {
    flex-direction: column;
    align-items: center;
  }
}

/* 动画效果 */
.tree-node {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.member-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>