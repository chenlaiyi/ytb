<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>CP会员管理</h2>
        <p class="page-description">管理和查看所有CP会员信息</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="showAddLevelDialog">
          <el-icon><Plus /></el-icon>
          新增等级
        </el-button>
        <el-button type="primary" size="large" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- CP会员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="vip-tabs">
        <el-tab-pane label="CP会员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              CP会员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP分红管理" name="dividends">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              CP分红管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP排行榜" name="rankings">
          <template #label>
            <span class="tab-label">
              <el-icon><Trophy /></el-icon>
              CP排行榜
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP余额管理" name="balance">
          <template #label>
            <span class="tab-label">
              <el-icon><Wallet /></el-icon>
              CP余额管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP等级管理" name="levels">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              CP等级管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP统计分析" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              CP统计分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 等级概览 -->
    <div class="levels-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="level in levels" :key="level.id">
          <el-card class="level-card" :class="getLevelCardClass(level)" shadow="hover">
                         <div class="level-header">
               <div class="level-icon">
                 <el-icon><Star /></el-icon>
               </div>
              <div class="level-info">
                <h3 class="level-name">{{ level.name }}</h3>
                <p class="level-desc">{{ level.description }}</p>
              </div>
            </div>
            
            <div class="level-stats">
              <div class="stat-item">
                <span class="stat-label">当前人数</span>
                <span class="stat-value">{{ level.user_count }}人</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">升级条件</span>
                <span class="stat-value">{{ formatUpgradeCondition(level) }}</span>
              </div>
            </div>
            
            <div class="level-benefits">
              <h4>专属权益</h4>
              <div class="benefits-list">
                <el-tag 
                  v-for="benefit in level.benefits" 
                  :key="benefit.id"
                  :type="getBenefitTagType(benefit.type)"
                  size="small"
                  class="benefit-tag"
                >
                  {{ benefit.name }}
                </el-tag>
              </div>
            </div>
            
            <div class="level-actions">
              <el-button size="small" @click="editLevel(level)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="info" @click="viewLevelUsers(level)">
                <el-icon><User /></el-icon>
                查看用户
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteLevel(level)"
                :disabled="level.user_count > 0"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 等级升级记录 -->
    <el-card class="upgrade-records-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>等级升级记录</h3>
          <div class="header-actions">
            <el-date-picker
              v-model="recordDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadUpgradeRecords"
              size="small"
            />
          </div>
        </div>
      </template>
      
      <el-table :data="upgradeRecords" v-loading="recordsLoading" stripe>
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="35" :src="row.user.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.user.name || '未设置姓名' }}</div>
                <div class="user-phone">{{ row.user.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="等级变化" width="200" align="center">
          <template #default="{ row }">
            <div class="level-change">
              <el-tag :type="getLevelTagType(row.from_level)" size="small">
                {{ row.from_level_name }}
              </el-tag>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <el-tag :type="getLevelTagType(row.to_level)" size="small">
                {{ row.to_level_name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="升级原因" min-width="150">
          <template #default="{ row }">
            {{ row.reason || '满足升级条件' }}
          </template>
        </el-table-column>
        
        <el-table-column label="升级时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operator_name || '系统' }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="recordsPage"
          v-model:page-size="recordsLimit"
          :page-sizes="[10, 20, 50]"
          :total="recordsTotal"
          layout="total, sizes, prev, pager, next"
          @size-change="loadUpgradeRecords"
          @current-change="loadUpgradeRecords"
        />
      </div>
    </el-card>

    <!-- 等级编辑弹窗 -->
    <el-dialog
      v-model="levelDialogVisible"
      :title="levelForm.id ? '编辑等级' : '新增等级'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="levelForm" :rules="levelRules" ref="levelFormRef" label-width="120px">
        <el-form-item label="等级名称" prop="name">
          <el-input v-model="levelForm.name" placeholder="请输入等级名称" />
        </el-form-item>
        
        <el-form-item label="等级描述" prop="description">
          <el-input 
            v-model="levelForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="请输入等级描述"
          />
        </el-form-item>
        
        <el-form-item label="等级排序" prop="sort_order">
          <el-input-number 
            v-model="levelForm.sort_order" 
            :min="1" 
            :max="100"
            placeholder="数字越小等级越高"
          />
        </el-form-item>
        
        <el-form-item label="升级条件">
          <div class="upgrade-conditions">
            <div class="condition-item">
              <label>团队CP数量：</label>
              <el-input-number 
                v-model="levelForm.team_vip_required" 
                :min="0" 
                placeholder="所需团队CP数量"
              />
            </div>
            <div class="condition-item">
              <label>直推CP数量：</label>
              <el-input-number 
                v-model="levelForm.direct_vip_required" 
                :min="0" 
                placeholder="所需直推CP数量"
              />
            </div>
            <div class="condition-item">
              <label>账户余额：</label>
              <el-input-number 
                v-model="levelForm.balance_required" 
                :min="0" 
                :precision="2"
                placeholder="所需账户余额"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="专属权益">
          <div class="benefits-editor">
            <div 
              v-for="(benefit, index) in levelForm.benefits" 
              :key="index"
              class="benefit-item"
            >
              <el-input 
                v-model="benefit.name" 
                placeholder="权益名称"
                style="width: 200px"
              />
              <el-select v-model="benefit.type" placeholder="权益类型" style="width: 120px">
                <el-option label="分红" value="dividend" />
                <el-option label="折扣" value="discount" />
                <el-option label="特权" value="privilege" />
                <el-option label="服务" value="service" />
              </el-select>
              <el-input 
                v-model="benefit.value" 
                placeholder="权益值"
                style="width: 100px"
              />
              <el-button 
                type="danger" 
                size="small" 
                @click="removeBenefit(index)"
                :disabled="levelForm.benefits.length <= 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addBenefit">
              <el-icon><Plus /></el-icon>
              添加权益
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="levelForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLevel" :loading="submitting">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 等级用户列表弹窗 -->
    <el-dialog
      v-model="usersDialogVisible"
      :title="`${selectedLevel?.name}用户列表`"
      width="80%"
      top="5vh"
    >
      <el-table :data="levelUsers" v-loading="usersLoading" stripe>
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="40" :src="row.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.name || '未设置姓名' }}</div>
                <div class="user-nickname">{{ row.wechat_nickname }}</div>
                <div class="user-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="团队CP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.team_vip_count }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="直推CP" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.direct_vip_count }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="账户余额" width="120" align="center">
          <template #default="{ row }">
            <span class="balance-amount">¥{{ formatCurrency(row.balance) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="升级时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.level_updated_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="adjustUserLevel(row)">
              调整等级
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Star, Plus, Refresh, Edit, User, Delete, Right, Money, Trophy, Wallet, DataAnalysis
} from '@element-plus/icons-vue'
import axios from '@/utils/axios'

// 路由
const router = useRouter()

// 响应式数据
const levels = ref([])
const upgradeRecords = ref([])
const levelUsers = ref([])
const recordsLoading = ref(false)
const usersLoading = ref(false)
const submitting = ref(false)

// CP会员模块导航标签页
const activeTab = ref('levels')

// 弹窗控制
const levelDialogVisible = ref(false)
const usersDialogVisible = ref(false)
const selectedLevel = ref(null)

// 表单数据
const levelFormRef = ref()
const levelForm = reactive({
  id: null,
  name: '',
  description: '',
  sort_order: 1,
  team_vip_required: 0,
  direct_vip_required: 0,
  balance_required: 0,
  benefits: [{ name: '', type: 'dividend', value: '' }],
  status: 'active'
})

const levelRules = {
  name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入等级描述', trigger: 'blur' }],
  sort_order: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
}

// 分页数据
const recordDateRange = ref([])
const recordsPage = ref(1)
const recordsLimit = ref(20)
const recordsTotal = ref(0)

// 方法
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatUpgradeCondition = (level) => {
  const conditions = []
  if (level.team_vip_required > 0) {
    conditions.push(`团队${level.team_vip_required}人`)
  }
  if (level.direct_vip_required > 0) {
    conditions.push(`直推${level.direct_vip_required}人`)
  }
  if (level.balance_required > 0) {
    conditions.push(`余额¥${formatCurrency(level.balance_required)}`)
  }
  return conditions.length > 0 ? conditions.join('，') : '无条件'
}

const getLevelCardClass = (level) => {
  const classes = ['level-card']
  if (level.sort_order <= 2) classes.push('level-premium')
  else if (level.sort_order <= 5) classes.push('level-gold')
  else classes.push('level-silver')
  return classes.join(' ')
}

const getBenefitTagType = (type) => {
  const types = {
    'dividend': 'success',
    'discount': 'warning',
    'privilege': 'primary',
    'service': 'info'
  }
  return types[type] || 'info'
}

const getLevelTagType = (level) => {
  if (level <= 2) return 'danger'
  if (level <= 5) return 'warning'
  return 'info'
}

const loadLevels = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    levels.value = [
      {
        id: 1,
        name: '钻石VIP',
        description: '最高等级VIP，享受所有特权',
        sort_order: 1,
        team_vip_required: 100,
        direct_vip_required: 20,
        balance_required: 10000,
        user_count: 5,
        benefits: [
          { id: 1, name: '20%分红', type: 'dividend', value: '20' },
          { id: 2, name: '专属客服', type: 'service', value: '1' }
        ],
        status: 'active'
      },
      {
        id: 2,
        name: '黄金VIP',
        description: '高级VIP，享受优质服务',
        sort_order: 2,
        team_vip_required: 50,
        direct_vip_required: 10,
        balance_required: 5000,
        user_count: 15,
        benefits: [
          { id: 3, name: '15%分红', type: 'dividend', value: '15' },
          { id: 4, name: '9折优惠', type: 'discount', value: '0.9' }
        ],
        status: 'active'
      },
      {
        id: 3,
        name: '白银VIP',
        description: '基础VIP，享受基本权益',
        sort_order: 3,
        team_vip_required: 20,
        direct_vip_required: 5,
        balance_required: 1000,
        user_count: 50,
        benefits: [
          { id: 5, name: '10%分红', type: 'dividend', value: '10' }
        ],
        status: 'active'
      }
    ]
  } catch (error) {
    console.error('获取等级列表失败:', error)
    ElMessage.error('获取等级列表失败')
  }
}

const loadUpgradeRecords = async () => {
  try {
    recordsLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    upgradeRecords.value = [
      {
        id: 1,
        user: {
          id: 1,
          name: '张三',
          phone: '13800138001',
          avatar: ''
        },
        from_level: 3,
        from_level_name: '白银VIP',
        to_level: 2,
        to_level_name: '黄金VIP',
        reason: '满足升级条件',
        operator_name: '系统',
        created_at: new Date().toISOString()
      }
    ]
    recordsTotal.value = 1
    
  } catch (error) {
    console.error('获取升级记录失败:', error)
    ElMessage.error('获取升级记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const refreshData = () => {
  loadLevels()
  loadUpgradeRecords()
}

// 处理CP会员模块导航标签页点击
const handleTabClick = (tab) => {
  const tabName = tab.props.name;
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      router.push({ name: 'VipList' });
      break;
    case 'dividends':
      router.push({ name: 'VipDividends' });
      break;
    case 'rankings':
      router.push({ name: 'VipRankings' });
      break;
    case 'balance':
      router.push({ name: 'VipBalance' });
      break;
    case 'levels':
      // 当前页面，不需要跳转
      break;
    case 'statistics':
      router.push({ name: 'VipStatistics' });
      break;
    default:
      console.warn('未知的标签页:', tabName);
  }
};

const showAddLevelDialog = () => {
  Object.assign(levelForm, {
    id: null,
    name: '',
    description: '',
    sort_order: levels.value.length + 1,
    team_vip_required: 0,
    direct_vip_required: 0,
    balance_required: 0,
    benefits: [{ name: '', type: 'dividend', value: '' }],
    status: 'active'
  })
  levelDialogVisible.value = true
}

const editLevel = (level) => {
  Object.assign(levelForm, {
    ...level,
    benefits: [...level.benefits]
  })
  levelDialogVisible.value = true
}

const addBenefit = () => {
  levelForm.benefits.push({ name: '', type: 'dividend', value: '' })
}

const removeBenefit = (index) => {
  levelForm.benefits.splice(index, 1)
}

const submitLevel = async () => {
  try {
    await levelFormRef.value.validate()
    
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(levelForm.id ? '等级更新成功' : '等级创建成功')
    levelDialogVisible.value = false
    loadLevels()
    
  } catch (error) {
    if (error !== false) {
      console.error('保存等级失败:', error)
      ElMessage.error('保存等级失败')
    }
  } finally {
    submitting.value = false
  }
}

const deleteLevel = async (level) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除等级"${level.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('等级删除成功')
    loadLevels()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除等级失败:', error)
      ElMessage.error('删除等级失败')
    }
  }
}

const viewLevelUsers = async (level) => {
  try {
    selectedLevel.value = level
    usersDialogVisible.value = true
    usersLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    levelUsers.value = [
      {
        id: 1,
        name: '张三',
        wechat_nickname: '张三的微信',
        phone: '13800138001',
        avatar: '',
        team_vip_count: 25,
        direct_vip_count: 8,
        balance: 2500.00,
        level_updated_at: new Date().toISOString()
      }
    ]
    
  } catch (error) {
    console.error('获取等级用户失败:', error)
    ElMessage.error('获取等级用户失败')
  } finally {
    usersLoading.value = false
  }
}

const adjustUserLevel = (user) => {
  ElMessage.info('用户等级调整功能开发中...')
}

// 生命周期
onMounted(() => {
  loadLevels()
  loadUpgradeRecords()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  margin: -20px -20px 24px -20px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.page-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.page-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* CP会员模块导航标签页 */
.navigation-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.vip-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vip-tabs .el-tab-pane {
  flex: 1;
}

.vip-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 等级概览 */
.levels-overview {
  margin-bottom: 30px;
}

.level-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.level-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.level-premium {
  border-left: 4px solid #f56c6c;
}

.level-gold {
  border-left: 4px solid #e6a23c;
}

.level-silver {
  border-left: 4px solid #909399;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.level-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.level-info {
  flex: 1;
}

.level-name {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.level-desc {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.level-stats {
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.level-benefits {
  margin-bottom: 15px;
}

.level-benefits h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.benefits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.benefit-tag {
  margin: 0;
}

.level-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 升级记录卡片 */
.upgrade-records-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
}

.user-details .user-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-details .user-nickname {
  font-size: 12px;
  color: #67c23a;
  margin-bottom: 2px;
}

.user-details .user-phone {
  font-size: 12px;
  color: #909399;
}

.level-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow-icon {
  color: #409eff;
}

.balance-amount {
  font-weight: 500;
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

/* 表单样式 */
.upgrade-conditions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.condition-item label {
  width: 120px;
  font-size: 14px;
  color: #606266;
}

.benefits-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background: #fafafa;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.benefit-item:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-right {
    width: 100%;
    justify-content: center;
  }
  
  .level-actions {
    justify-content: center;
  }
  
  .benefit-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .condition-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .condition-item label {
    width: auto;
  }
}
</style> 