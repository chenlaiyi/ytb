<template>
  <div class="branch-app-users">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-left">
        <h2>APP会员</h2>
        <p>管理分支机构的APP用户</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="exportUsers">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon total">
            <el-icon size="20"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon today">
            <el-icon size="20"><Plus /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayUsers }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon vip">
            <el-icon size="20"><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.vipUsers }}</div>
            <div class="stat-label">VIP用户</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon paid">
            <el-icon size="20"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.paidVipUsers }}</div>
            <div class="stat-label">已完款VIP</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索过滤器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select v-model="filters.user_type" placeholder="请选择角色" clearable style="width: 140px">
            <el-option label="普通用户" value="normal" />
            <el-option label="VIP会员" value="vip" />
            <el-option label="业务员" value="salesman" />
            <el-option label="管理员" value="admin" />
            <el-option label="工程师" value="engineer" />
            <el-option label="净水器用户" value="water_purifier_user" />
            <el-option label="支付机构" value="pay_institution" />
            <el-option label="支付商户" value="pay_merchant" />
            <el-option label="净水器渠道商" value="water_purifier_agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="VIP状态">
          <el-select v-model="filters.vip_paid_status" placeholder="请选择VIP状态" clearable style="width: 120px">
            <el-option label="已完款" :value="1" />
            <el-option label="未完款" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card shadow="never">
      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.wechat_avatar || row.avatar" />
          </template>
        </el-table-column>
        
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.name || row.wechat_nickname || row.nickname || '未设置' }}</div>
              <div class="user-phone">{{ row.phone || '未绑定' }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户角色" width="180">
          <template #default="{ row }">
            <div class="user-roles">
              <el-tag 
                v-for="role in getUserRoles(row)" 
                :key="role.name"
                :type="role.type" 
                size="small"
                class="role-tag"
              >
                {{ role.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="VIP状态" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.is_vip">
              <el-tag :type="row.vip_at ? 'success' : 'warning'" size="small">
                {{ row.vip_at ? '已完款VIP' : '未完款VIP' }}
              </el-tag>
            </div>
            <el-tag v-else type="info" size="small">普通用户</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="推荐人" width="160">
          <template #default="{ row }">
            <div class="referrer-info" v-if="row.referrer_id">
              <div class="referrer-name">{{ getReferrerDisplayName(row) }}</div>
              <div class="referrer-id">ID: {{ row.referrer_id }}</div>
            </div>
            <div v-else class="default-referrer">
              <div class="referrer-name">{{ branchInfo.name || '分支机构' }}</div>
              <div class="referrer-desc">默认推荐人</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="余额" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 500;">
              ¥{{ (parseFloat(row.balance) || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余天数" width="140" align="center">
          <template #default="{ row }">
            <div class="water-days-info">
              <div class="days-value">
                <span style="color: #67c23a; font-weight: 500;">
                  {{ row.water_access_remaining_days || 0 }}
                </span>
                <span style="color: #909399; font-size: 12px; margin-left: 4px;">天</span>
              </div>
              <div class="days-actions" style="margin-top: 2px;">
                <el-button 
                  size="mini" 
                  type="success" 
                  @click="showWaterDaysDialog(row, 'add')"
                  style="padding: 2px 6px; font-size: 11px;"
                >
                  增加天数
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" width="160" align="center">
          <template #default="{ row }">
            <span style="color: #909399;">
              {{ formatDate(row.created_at) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="showUserDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      title="用户详情"
      v-model="detailVisible"
      width="900px"
    >
      <div v-if="currentUser" class="user-detail">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ currentUser.name || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="昵称">{{ currentUser.nickname || currentUser.wechat_nickname || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ currentUser.phone || '未绑定' }}</el-descriptions-item>
              <el-descriptions-item label="用户角色">
                <div class="user-roles">
                  <el-tag 
                    v-for="role in getUserRoles(currentUser)" 
                    :key="role.name"
                    :type="role.type" 
                    size="small"
                    class="role-tag"
                  >
                    {{ role.name }}
                  </el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="账户余额">¥{{ (currentUser.balance || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="剩余取水天数">
                <span style="color: #67c23a; font-weight: 500;">{{ currentUser.water_access_remaining_days || 0 }}</span> 天
              </el-descriptions-item>
              <el-descriptions-item label="设备数量">{{ currentUser.device_count || 0 }}台</el-descriptions-item>
              <el-descriptions-item label="团队人数">{{ currentUser.team_count || 0 }}人</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ formatDate(currentUser.last_login_at) || '从未登录' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="VIP信息" name="vip">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="是否VIP">
                <el-tag :type="currentUser.is_vip ? 'success' : 'info'">
                  {{ currentUser.is_vip ? 'VIP会员' : '普通用户' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="VIP开通时间">
                {{ formatDate(currentUser.vip_at) || '未开通' }}
              </el-descriptions-item>
              <el-descriptions-item label="完款状态">
                <el-tag v-if="currentUser.is_vip" :type="currentUser.vip_at ? 'success' : 'warning'">
                  {{ currentUser.vip_at ? '已完款' : '未完款' }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="完款说明">
                <span v-if="currentUser.is_vip">
                  {{ currentUser.vip_at ? '根据VIP开通时间判断为已完款' : '未设置VIP开通时间，视为未完款' }}
                </span>
                <span v-else>非VIP用户</span>
              </el-descriptions-item>
              <el-descriptions-item label="VIP等级">{{ currentUser.vip_level || '普通VIP' }}</el-descriptions-item>
              <el-descriptions-item label="VIP到期时间">{{ formatDate(currentUser.vip_expire_at) || '永久' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="推荐关系" name="referral">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="推荐人ID">{{ currentUser.referrer_id || '无' }}</el-descriptions-item>
              <el-descriptions-item label="推荐人姓名">{{ getReferrerDisplayName(currentUser) || '点点够' }}</el-descriptions-item>
              <el-descriptions-item label="直推VIP数">{{ currentUser.direct_vip_count || 0 }}人</el-descriptions-item>
              <el-descriptions-item label="团队VIP数">{{ currentUser.team_vip_count || 0 }}人</el-descriptions-item>
              <el-descriptions-item label="本月直推VIP">{{ currentUser.month_direct_vip || 0 }}人</el-descriptions-item>
              <el-descriptions-item label="本月团队VIP">{{ currentUser.month_team_vip || 0 }}人</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog
      title="编辑用户"
      v-model="editVisible"
      width="700px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-tabs v-model="editActiveTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="editForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="editForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="editForm.status">
                <el-radio label="active">正常</el-radio>
                <el-radio label="disabled">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="VIP信息" name="vip">
            <el-form-item label="VIP用户" prop="is_vip">
              <el-switch 
                v-model="editForm.is_vip" 
                active-text="是" 
                inactive-text="否"
                @change="handleVipStatusChange"
              />
            </el-form-item>
            <template v-if="editForm.is_vip">
              <el-form-item label="VIP开通时间" prop="vip_at">
                <el-date-picker
                  v-model="editForm.vip_at"
                  type="datetime"
                  placeholder="选择VIP开通时间（设置此时间表示已完款）"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="完款状态">
                <el-tag :type="editForm.vip_at ? 'success' : 'info'" size="large">
                  {{ editForm.vip_at ? '已完款' : '未完款' }}
                </el-tag>
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  完款状态根据VIP开通时间自动判断，有开通时间即为已完款
                </div>
              </el-form-item>
            </template>
          </el-tab-pane>
          
          <el-tab-pane label="推荐关系" name="referral">
            <el-form-item label="推荐人" prop="referrer_id">
              <el-select
                v-model="editForm.referrer_id"
                placeholder="请搜索并选择推荐人"
                filterable
                remote
                clearable
                :remote-method="searchReferrers"
                :loading="referrerLoading"
                style="width: 100%"
                @focus="loadDefaultReferrers"
                @clear="clearReferrer"
              >
                <el-option
                  v-for="user in referrerOptions"
                  :key="user.id"
                  :label="`${user.name || user.wechat_nickname || user.nickname || '未知用户'} (ID: ${user.id})`"
                  :value="user.id"
                >
                  <div class="referrer-option">
                    <div class="referrer-avatar">
                      <el-avatar 
                        :size="32" 
                        :src="user.wechat_avatar || user.avatar" 
                        :alt="user.name || user.nickname"
                      >
                        {{ (user.name || user.nickname || user.wechat_nickname || '用户').charAt(0) }}
                      </el-avatar>
                    </div>
                    <div class="referrer-info">
                      <div class="referrer-name">
                        {{ user.name || user.wechat_nickname || user.nickname || '未知用户' }}
                        <el-tag v-if="user.is_vip" type="success" size="small">VIP</el-tag>
                      </div>
                      <div class="referrer-details">
                        ID: {{ user.id }} | {{ user.phone || '未绑定手机' }}
                      </div>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="推荐人信息" v-if="selectedReferrer">
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="ID">{{ selectedReferrer.id }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ selectedReferrer.name || selectedReferrer.wechat_nickname || selectedReferrer.nickname || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ selectedReferrer.phone || '未绑定' }}</el-descriptions-item>
                <el-descriptions-item label="用户角色">
                  <div class="user-roles">
                    <el-tag 
                      v-for="role in getUserRoles(selectedReferrer)" 
                      :key="role.name"
                      :type="role.type" 
                      size="small"
                      class="role-tag"
                    >
                      {{ role.name }}
                    </el-tag>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="角色权限" name="roles">
            <div class="role-section">
              <h4 class="role-section-title">基础角色</h4>
              <el-form-item label="管理员" prop="is_admin">
                <el-switch v-model="editForm.is_admin" active-text="是" inactive-text="否" />
                <div class="role-desc">拥有分支机构管理权限</div>
              </el-form-item>
              <el-form-item label="业务员" prop="is_salesman">
                <el-switch v-model="editForm.is_salesman" active-text="是" inactive-text="否" />
                <div class="role-desc">负责业务推广和客户服务</div>
              </el-form-item>
              <el-form-item label="工程师" prop="is_engineer">
                <el-switch v-model="editForm.is_engineer" active-text="是" inactive-text="否" />
                <div class="role-desc">负责设备安装和技术支持</div>
              </el-form-item>
            </div>
            
            <div class="role-section">
              <h4 class="role-section-title">服务角色</h4>
              <el-form-item label="净水器用户" prop="is_water_purifier_user">
                <el-switch v-model="editForm.is_water_purifier_user" active-text="是" inactive-text="否" />
                <div class="role-desc">使用净水器设备和服务</div>
              </el-form-item>
            </div>
            
            <div class="role-note">
              <el-alert
                title="角色说明"
                type="info"
                :closable="false"
                show-icon>
                <template #default>
                  <p>• 管理员：可管理分支机构用户和基础设置</p>
                  <p>• 业务员：负责推广业务，管理客户关系</p>
                  <p>• 工程师：负责设备安装、维护和技术支持</p>
                  <p>• 净水器用户：可使用净水器相关功能和服务</p>
                </template>
              </el-alert>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="submitting">
            更新
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 取水天数操作对话框 -->
    <el-dialog
      :title="`${waterDaysOperation === 'add' ? '增加' : '减少'}取水天数`"
      v-model="waterDaysDialogVisible"
      width="500px"
      @close="resetWaterDaysForm"
    >
      <el-form
        ref="waterDaysFormRef"
        :model="waterDaysForm"
        :rules="waterDaysRules"
        label-width="100px"
      >
        <el-form-item label="用户信息">
          <div class="user-info-display">
            <el-avatar :size="40" :src="waterDaysUser?.wechat_avatar || waterDaysUser?.avatar" />
            <div style="margin-left: 10px;">
              <div style="font-weight: 500;">{{ waterDaysUser?.name || waterDaysUser?.nickname || '未知用户' }}</div>
              <div style="color: #909399; font-size: 12px;">{{ waterDaysUser?.phone || '未绑定手机' }}</div>
              <div style="color: #67c23a; font-size: 12px;">当前剩余天数：{{ waterDaysUser?.water_access_remaining_days || 0 }}天</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="操作类型">
          <el-tag :type="waterDaysOperation === 'add' ? 'success' : 'danger'" size="large">
            {{ waterDaysOperation === 'add' ? '增加天数' : '减少天数' }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="天数" prop="days">
          <el-input-number
            v-model="waterDaysForm.days"
            :min="1"
            :max="waterDaysOperation === 'subtract' ? (waterDaysUser?.water_access_remaining_days || 0) : 365"
            placeholder="请输入天数"
            style="width: 100%"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            {{ waterDaysOperation === 'add' ? '最多可增加365天' : `最多可减少${waterDaysUser?.water_access_remaining_days || 0}天` }}
          </div>
        </el-form-item>
        
        <el-form-item label="操作原因" prop="reason">
          <el-input
            v-model="waterDaysForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入操作原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="waterDaysDialogVisible = false">取消</el-button>
          <el-button 
            :type="waterDaysOperation === 'add' ? 'success' : 'danger'" 
            @click="submitWaterDaysOperation" 
            :loading="waterDaysSubmitting"
          >
            确认{{ waterDaysOperation === 'add' ? '增加' : '减少' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, User, Plus, CircleCheck, Star } from '@element-plus/icons-vue'
import { getBranchAppUsers, updateBranchAppUser } from '@/api/v1/branchManagement.js'
import { configureWaterAccess } from '@/api/v1/waterAccess'

const route = useRoute()
const branchId = computed(() => route.params.branchId)

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const editFormRef = ref()
const activeTab = ref('basic')
const editActiveTab = ref('basic')

// 用户列表
const users = ref([])
const currentUser = ref(null)

// 推荐人相关
const referrerOptions = ref([])
const referrerLoading = ref(false)
const selectedReferrer = ref(null)

// 积分操作相关
const waterDaysDialogVisible = ref(false)
const waterDaysSubmitting = ref(false)
const waterDaysFormRef = ref()
const waterDaysUser = ref(null)
const waterDaysOperation = ref('add') // 'add' 或 'subtract'

// 分支机构信息
const branchInfo = ref({
  name: '分支机构',
  code: ''
})

// 统计数据
const statistics = reactive({
  totalUsers: 0,
  todayUsers: 0,
  activeUsers: 0,
  vipUsers: 0,
  paidVipUsers: 0
})

// 搜索过滤器
const filters = reactive({
  phone: '',
  user_type: '',
  vip_paid_status: '',
  status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 编辑表单
const editForm = reactive({
  id: '',
  name: '',
  nickname: '',
  phone: '',
  is_vip: false,
  vip_at: '',
  referrer_id: '',
  referrer_name: '',
  is_admin: false,
  is_salesman: false,
  is_engineer: false,
  is_water_purifier_user: false,
  status: 'active'
})

// 保存原始手机号，用于验证时对比
const originalPhone = ref('')

// 编辑表单验证规则
const editRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
    { 
      validator: async (rule, value, callback) => {
        // 如果手机号为空或格式不正确，跳过验证（让其他规则处理）
        if (!value || !/^1[3-9]\d{9}$/.test(value)) {
          callback()
          return
        }
        
        // 如果手机号没有变化，跳过验证
        if (value === originalPhone.value) {
          callback()
          return
        }
        
        // 检查手机号是否已被其他用户使用
        try {
          const response = await getBranchAppUsers(branchId.value, {
            phone: value,
            page: 1,
            size: 1
          })
          
          if (response.code === 0 && response.data && response.data.data && response.data.data.length > 0) {
            // 找到了使用该手机号的用户
            const existingUser = response.data.data[0]
            if (existingUser.id !== editForm.id) {
              callback(new Error('该手机号已被其他用户使用'))
              return
            }
          }
          callback()
        } catch (error) {
          console.warn('验证手机号时出错:', error)
          // 验证出错时不阻止提交，由后端最终验证
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 积分操作表单
const waterDaysForm = reactive({
  days: 1,
  reason: ''
})

// 积分操作表单验证规则
const waterDaysRules = {
  days: [
    { required: true, message: '请输入天数', trigger: 'blur' },
    { type: 'number', min: 1, message: '天数必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入操作原因', trigger: 'blur' }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filters
    }
    
    const response = await getBranchAppUsers(branchId.value, params)
    
    if (response.code === 0) {
      users.value = response.data.data || []
      pagination.total = response.data.total || 0
      
      // 更新统计数据
      statistics.totalUsers = response.data.total || 0
      statistics.todayUsers = response.data.today_users || 0
      statistics.activeUsers = response.data.active_users || 0
      statistics.vipUsers = response.data.vip_users || 0
      statistics.paidVipUsers = response.data.paid_vip_users || 0
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 显示用户详情
const showUserDetail = (row) => {
  currentUser.value = row
  detailVisible.value = true
  activeTab.value = 'basic'
}

// 显示编辑对话框
const showEditDialog = async (row) => {
  Object.assign(editForm, {
    id: row.id,
    name: row.name || '',
    nickname: row.nickname || row.wechat_nickname || '',
    phone: row.phone || '',
    is_vip: Boolean(row.is_vip),
    vip_at: row.vip_at || '',
    referrer_id: row.referrer_id || '',
    referrer_name: row.referrer_name || '',
    is_admin: Boolean(row.is_admin),
    is_salesman: Boolean(row.is_salesman),
    is_engineer: Boolean(row.is_engineer),
    is_water_purifier_user: Boolean(row.is_water_purifier_user),
    status: row.status || 'active'
  })
  
  // 保存原始手机号，用于验证时对比
  originalPhone.value = row.phone || ''
  
  // 如果有推荐人ID，加载推荐人信息
  if (row.referrer_id) {
    await loadReferrerById(row.referrer_id)
  }
  
  // 加载默认推荐人列表
  loadDefaultReferrers()
  
  editVisible.value = true
  editActiveTab.value = 'basic'
}

// VIP状态变化处理
const handleVipStatusChange = (value) => {
  if (value && !editForm.vip_at) {
    // 当设置为VIP时，自动设置开通时间（表示已完款）
    editForm.vip_at = formatDateTime(new Date())
  } else if (!value) {
    // 当取消VIP时，清除开通时间
    editForm.vip_at = ''
  }
}

// 监听推荐人ID变化，更新选中的推荐人信息
watch(() => editForm.referrer_id, (newVal) => {
  if (newVal && newVal !== '') {
    // 从推荐人选项中找到对应的用户信息
    const referrer = referrerOptions.value.find(user => user.id === newVal)
    if (referrer) {
      selectedReferrer.value = referrer
      editForm.referrer_name = referrer.name || referrer.wechat_nickname || referrer.nickname || '未知用户'
    } else {
      // 如果在选项中找不到，尝试加载该用户信息
      loadReferrerById(newVal)
    }
  } else {
    selectedReferrer.value = null
    editForm.referrer_name = ''
  }
})

// 搜索推荐人
const searchReferrers = async (query) => {
  if (!query || query.length < 1) {
    loadDefaultReferrers()
    return
  }
  
  referrerLoading.value = true
  try {
    const response = await getBranchAppUsers(branchId.value, {
      keyword: query,
      page: 1,
      size: 20,
      exclude_id: editForm.id, // 排除当前编辑的用户
      simple: 1 // 使用简单模式，获取完整的用户信息用于选择
    })
    
    if (response.code === 0 && response.data) {
      const users = response.data.data || []
      // 过滤掉当前编辑的用户，避免自己推荐自己
      referrerOptions.value = users.filter(user => user.id !== editForm.id)
    }
  } catch (error) {
    console.error('搜索推荐人失败:', error)
    ElMessage.error('搜索推荐人失败')
  } finally {
    referrerLoading.value = false
  }
}

// 加载默认推荐人列表（优先显示VIP用户）
const loadDefaultReferrers = async () => {
  referrerLoading.value = true
  try {
    const response = await getBranchAppUsers(branchId.value, {
      page: 1,
      size: 50,
      user_type: 'vip', // 优先加载VIP用户作为推荐人
      exclude_id: editForm.id,
      simple: 1 // 使用简单模式，获取完整的用户信息用于选择
    })
    
    if (response.code === 0 && response.data) {
      const users = response.data.data || []
      referrerOptions.value = users.filter(user => user.id !== editForm.id)
      
      // 如果VIP用户不够，再加载一些普通用户
      if (referrerOptions.value.length < 20) {
        const normalResponse = await getBranchAppUsers(branchId.value, {
          page: 1,
          size: 30,
          exclude_id: editForm.id,
          simple: 1 // 使用简单模式
        })
        
        if (normalResponse.code === 0 && normalResponse.data) {
          const normalUsers = normalResponse.data.data || []
          // 合并并去重
          const allUsers = [...referrerOptions.value]
          normalUsers.forEach(user => {
            if (user.id !== editForm.id && !allUsers.find(u => u.id === user.id)) {
              allUsers.push(user)
            }
          })
          referrerOptions.value = allUsers.slice(0, 50) // 限制最多50个选项
        }
      }
    }
  } catch (error) {
    console.error('加载推荐人列表失败:', error)
  } finally {
    referrerLoading.value = false
  }
}

// 根据ID加载推荐人信息
const loadReferrerById = async (userId) => {
  try {
    const response = await getBranchAppUsers(branchId.value, {
      user_id: userId,
      page: 1,
      size: 1,
      simple: 1 // 使用简单模式
    })
    
    if (response.code === 0 && response.data && response.data.data) {
      const user = response.data.data[0]
      if (user) {
        selectedReferrer.value = user
        editForm.referrer_name = user.name || user.wechat_nickname || user.nickname || '未知用户'
        
        // 添加到选项列表中
        if (!referrerOptions.value.find(u => u.id === user.id)) {
          referrerOptions.value.unshift(user)
        }
      }
    }
  } catch (error) {
    console.error('加载推荐人信息失败:', error)
  }
}

// 清除推荐人
const clearReferrer = () => {
  editForm.referrer_id = ''
  editForm.referrer_name = ''
  selectedReferrer.value = null
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const submitData = { ...editForm }
      
      // 处理VIP相关逻辑
      if (!submitData.is_vip) {
        submitData.vip_at = null
      }
      
      // 处理推荐人ID
      if (!submitData.referrer_id || submitData.referrer_id === '') {
        submitData.referrer_id = null
      }
      
      // 移除不需要的字段
      delete submitData.referrer_name
      
      console.log('提交数据:', submitData)
      
      const response = await updateBranchAppUser(branchId.value, editForm.id, submitData)
      
      if (response.code === 0) {
        ElMessage.success('更新成功')
        editVisible.value = false
        fetchUsers()
      } else {
        console.error('更新失败，服务器响应:', response)
        ElMessage.error(response.message || '更新失败')
      }
    } catch (error) {
      console.error('更新失败，错误详情:', error)
      
      // 改进错误处理逻辑
      let errorMessage = '更新失败'
      
      if (error.response) {
        // 服务器返回了错误响应
        const { status, data } = error.response
        console.error('错误响应:', data)
        
        if (data && data.message) {
          // 使用服务器返回的具体错误信息
          errorMessage = data.message
          
          // 对常见错误进行友好化处理
          if (errorMessage.includes('Duplicate entry') && errorMessage.includes('phone_unique')) {
            errorMessage = '手机号码已被其他用户使用，请使用其他号码'
          } else if (errorMessage.includes('Duplicate entry')) {
            errorMessage = '数据重复，请检查输入信息'
          }
        } else if (status === 422) {
          errorMessage = '提交的数据格式不正确，请检查输入'
        } else if (status === 403) {
          errorMessage = '权限不足，无法执行此操作'
        } else if (status === 404) {
          errorMessage = '用户不存在或已被删除'
        } else if (status >= 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else {
          errorMessage = `请求失败 (${status})`
        }
      } else if (error.request) {
        // 网络连接问题
        errorMessage = '网络连接失败，请检查网络连接'
      } else if (error.message) {
        // 其他错误
        errorMessage = error.message
      }
      
      ElMessage.error(errorMessage)
    } finally {
      submitting.value = false
    }
  })
}

// 重置编辑表单
const resetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields()
  }
  Object.assign(editForm, {
    id: '',
    name: '',
    nickname: '',
    phone: '',
    is_vip: false,
    vip_at: '',
    referrer_id: '',
    referrer_name: '',
    is_admin: false,
    is_salesman: false,
    is_engineer: false,
    is_water_purifier_user: false,
    status: 'active'
  })
  
  // 清除推荐人相关数据
  referrerOptions.value = []
  selectedReferrer.value = null
}

// 重置搜索
const resetFilters = () => {
  Object.assign(filters, {
    phone: '',
    user_type: '',
    vip_paid_status: '',
    status: '',
    dateRange: []
  })
  pagination.page = 1
  fetchUsers()
}

// 切换状态
const toggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${row.name || row.nickname || row.phone} 吗？`, '确认操作')
    
    const response = await updateBranchAppUser(branchId.value, row.id, { status: newStatus })
    
    if (response.code === 0) {
      ElMessage.success(`${action}成功`)
      fetchUsers()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error)
      ElMessage.error(`${action}失败`)
    }
  }
}

// 导出用户数据
const exportUsers = () => {
  ElMessage.info('导出功能开发中...')
}

// 显示取水天数操作对话框
const showWaterDaysDialog = (row, operation) => {
  waterDaysUser.value = row
  waterDaysOperation.value = operation
  
  // 重置表单
  Object.assign(waterDaysForm, {
    days: 1,
    reason: operation === 'add' ? '管理员手动增加取水天数' : '管理员手动减少取水天数'
  })
  
  waterDaysDialogVisible.value = true
}

// 提交取水天数操作
const submitWaterDaysOperation = async () => {
  try {
    const valid = await waterDaysFormRef.value.validate()
    if (!valid) return

    waterDaysSubmitting.value = true
    
    const requestData = {
      user_id: waterDaysUser.value.id,
      days: waterDaysForm.days,
      reason: waterDaysForm.reason,
      operation: waterDaysOperation.value
    }
    
    // 调用积分操作API
    const response = await configureWaterAccess(requestData)
    
    if (response.code === 0) {
      ElMessage.success(`取水天数${waterDaysOperation.value === 'add' ? '增加' : '减少'}成功`)
      waterDaysDialogVisible.value = false
      
      // 刷新用户列表以更新积分显示
      fetchUsers()
      
      // 如果详情对话框打开，也更新当前用户信息
      if (detailVisible.value && currentUser.value?.id === waterDaysUser.value.id) {
        currentUser.value.water_access_remaining_days = response.data?.remaining_days || 0
      }
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('取水天数操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    waterDaysSubmitting.value = false
  }
}

// 重置取水天数操作表单
const resetWaterDaysForm = () => {
  if (waterDaysFormRef.value) {
    waterDaysFormRef.value.resetFields()
  }
  waterDaysUser.value = null
  waterDaysOperation.value = 'add'
}

// 获取用户角色列表
const getUserRoles = (row) => {
  const roles = []
  
  // 按优先级顺序添加角色
  if (row.is_admin) {
    roles.push({ name: '管理员', type: 'danger' })
  }
  if (row.is_vip) {
    roles.push({ name: 'VIP会员', type: 'success' })
  }
  if (row.is_salesman) {
    roles.push({ name: '业务员', type: 'warning' })
  }
  if (row.is_engineer) {
    roles.push({ name: '工程师', type: 'primary' })
  }
  if (row.is_water_purifier_user) {
    roles.push({ name: '净水器用户', type: 'info' })
  }
  if (row.is_pay_institution) {
    roles.push({ name: '支付机构', type: 'success' })
  }
  if (row.is_pay_merchant) {
    roles.push({ name: '支付商户', type: 'warning' })
  }
  if (row.is_water_purifier_agent) {
    roles.push({ name: '净水器渠道商', type: 'primary' })
  }
  
  // 如果没有任何角色，返回普通用户
  if (roles.length === 0) {
    roles.push({ name: '普通用户', type: 'info' })
  }
  
  return roles
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期时间
const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取推荐人显示名称（优先显示姓名，其次微信昵称）
const getReferrerDisplayName = (user) => {
  if (!user || !user.referrer_id) {
    return ''
  }
  
  // 如果有 referrer_name 字段，直接使用（后端已经处理了优先级逻辑）
  if (user.referrer_name) {
    return user.referrer_name
  }
  
  // 兼容性处理：如果没有 referrer_name，尝试从其他字段构建
  // 优先级：name > wechat_nickname > nickname > '用户' + ID
  if (user.referrer_info) {
    const referrer = user.referrer_info
    return referrer.name || referrer.wechat_nickname || referrer.nickname || `用户${user.referrer_id}`
  }
  
  // 如果都没有，返回默认值
  return user.referrer_id ? `用户${user.referrer_id}` : '未知用户'
}

// 加载分支机构信息
const loadBranchInfo = async () => {
  try {
    // TODO: 调用API获取分支机构信息
    // const response = await getBranchInfo(branchId.value)
    // if (response.code === 0) {
    //   branchInfo.value = response.data
    // }
    
    // 临时使用模拟数据
    branchInfo.value = {
      name: `分支机构${branchId.value}`,
      code: `BRANCH_${branchId.value}`
    }
  } catch (error) {
    console.error('加载分支机构信息失败:', error)
    branchInfo.value = {
      name: '分支机构',
      code: ''
    }
  }
}

onMounted(() => {
  loadBranchInfo()
  fetchUsers()
})
</script>

<style scoped>
.branch-app-users {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.header-left p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.total { background: linear-gradient(45deg, #667eea, #764ba2); }
.stat-icon.today { background: linear-gradient(45deg, #f093fb, #f5576c); }
.stat-icon.vip { background: linear-gradient(45deg, #ffd700, #ffed4e); }
.stat-icon.paid { background: linear-gradient(45deg, #4facfe, #00f2fe); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.user-info {
  line-height: 1.4;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.referrer-info {
  line-height: 1.4;
}

.referrer-name {
  font-weight: 500;
  color: #303133;
}

.referrer-id {
  font-size: 12px;
  color: #909399;
}

.default-referrer {
  line-height: 1.4;
}

.user-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.default-referrer .referrer-name {
  font-weight: 500;
  color: #409eff;
}

.referrer-desc {
  font-size: 12px;
  color: #909399;
}

.vip-time-info {
  line-height: 1.4;
}

.time-item {
  margin-bottom: 2px;
}

.time-label {
  font-size: 12px;
  color: #909399;
  margin-right: 4px;
}

.time-value {
  font-size: 12px;
  color: #303133;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.user-detail {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 推荐人选择器样式 */
.referrer-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.referrer-avatar {
  flex-shrink: 0;
}

.referrer-info {
  flex: 1;
  min-width: 0;
}

.referrer-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.referrer-details {
  font-size: 12px;
  color: #666;
}

/* 角色权限样式 */
.role-section {
  margin-bottom: 24px;
}

.role-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.role-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.role-note {
  margin-top: 24px;
}

.role-note .el-alert {
  border-radius: 8px;
}

.role-note p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.5;
}

/* 积分信息样式 */
.points-info {
  text-align: center;
}

.points-value {
  margin-bottom: 2px;
}

.points-actions {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.user-info-display {
  display: flex;
  align-items: center;
}
</style> 