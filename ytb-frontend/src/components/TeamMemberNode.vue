<template>
  <div class="team-member-node" :class="`level-${level}`">
    <!-- 连接线 -->
    <div v-if="level > 1" class="connection-line"></div>
    
    <!-- 成员信息卡片 -->
    <div class="member-card" :class="{ 'has-children': member.children && member.children.length > 0 }">
      <div class="member-content">
        <el-avatar :size="40" :src="member.avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        
        <div class="member-info">
          <div class="member-name">{{ member.nickname || member.name }}</div>
          <div class="member-phone">{{ member.phone }}</div>
          <div class="member-meta">
            <el-tag 
              v-if="member.is_vip && member.is_vip_paid" 
              type="success" 
              size="small"
            >
              已完款VIP
            </el-tag>
            <el-tag 
              v-else-if="member.is_vip" 
              type="warning" 
              size="small"
            >
              未完款VIP
            </el-tag>
            <el-tag 
              v-else 
              type="info" 
              size="small"
            >
              普通用户
            </el-tag>
            
            <span v-if="member.children_count > 0" class="children-count">
              下级: {{ member.children_count }}人
            </span>
            <span v-if="member.vip_children_count > 0" class="vip-children-count">
              VIP: {{ member.vip_children_count }}人
            </span>
          </div>
          
          <div class="member-stats">
            <span class="balance">余额: ¥{{ formatCurrency(member.balance) }}</span>
            <span v-if="member.vip_paid_at" class="vip-time">
              完款: {{ formatDate(member.vip_paid_at) }}
            </span>
          </div>
        </div>
        
        <!-- 展开/收起按钮 -->
        <div v-if="member.children && member.children.length > 0" class="expand-btn">
          <el-button 
            :type="expanded ? 'primary' : 'default'" 
            size="small" 
            circle
            @click="toggleExpand"
          >
            <el-icon>
              <ArrowDown v-if="!expanded" />
              <ArrowUp v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 子成员 -->
    <div v-if="expanded && member.children && member.children.length > 0" class="children-container">
      <div class="children-list">
        <TeamMemberNode
          v-for="child in member.children"
          :key="child.id"
          :member="child"
          :level="level + 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
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
  }
});

// 状态
const expanded = ref(true); // 默认展开

// 方法
const toggleExpand = () => {
  expanded.value = !expanded.value;
};

// 格式化金额
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};
</script>

<style scoped>
.team-member-node {
  position: relative;
  margin: 10px 0;
}

.connection-line {
  position: absolute;
  top: -10px;
  left: 20px;
  width: 2px;
  height: 30px;
  background: #e4e7ed;
}

.connection-line::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 0;
  width: 20px;
  height: 2px;
  background: #e4e7ed;
}

.member-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-left: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.member-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.member-card.has-children {
  border-left: 4px solid #409eff;
}

.member-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.member-phone {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.children-count,
.vip-children-count {
  font-size: 11px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.member-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #909399;
}

.balance {
  color: #67c23a;
  font-weight: 500;
}

.vip-time {
  color: #e6a23c;
}

.expand-btn {
  margin-left: auto;
}

.children-container {
  margin-top: 15px;
  position: relative;
}

.children-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20px;
  width: 2px;
  height: 100%;
  background: #e4e7ed;
}

.children-list {
  padding-left: 0;
}

/* 不同层级的样式 */
.level-1 .member-card {
  border-left-color: #409eff;
}

.level-2 .member-card {
  border-left-color: #67c23a;
}

.level-3 .member-card {
  border-left-color: #e6a23c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-card {
    margin-left: 20px;
    padding: 8px;
  }
  
  .member-content {
    gap: 8px;
  }
  
  .member-name {
    font-size: 13px;
  }
  
  .member-phone {
    font-size: 11px;
  }
  
  .member-meta {
    gap: 4px;
  }
  
  .children-container::before {
    left: 10px;
  }
  
  .connection-line {
    left: 10px;
  }
}
</style> 