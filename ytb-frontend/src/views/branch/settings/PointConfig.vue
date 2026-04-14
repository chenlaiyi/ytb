<template>
  <div class="point-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>积分设置</h2>
        <p>配置分支机构的积分系统规则和兑换项目</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving" :icon="Check">
          保存配置
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-form
        ref="formRef"
        :model="config"
        :rules="formRules"
        label-width="150px"
        v-loading="loading"
      >
        <!-- 基础设置 -->
        <el-divider content-position="left">
          <h3>基础设置</h3>
        </el-divider>
        
        <el-form-item label="启用积分系统" prop="is_enabled">
          <el-switch
            v-model="config.is_enabled"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">
            关闭后，用户将无法获得和使用积分
          </div>
        </el-form-item>

        <template v-if="config.is_enabled">
          <el-form-item label="签到基础积分" prop="check_in_points">
            <el-input-number
              v-model="config.check_in_points"
              :min="0"
              :max="1000"
              controls-position="right"
            />
            <span class="input-suffix">分/次</span>
            <div class="form-tip">
              用户每次签到可获得的基础积分
            </div>
          </el-form-item>

          <el-form-item label="每日签到限制" prop="daily_check_in_limit">
            <el-input-number
              v-model="config.daily_check_in_limit"
              :min="1"
              :max="10"
              controls-position="right"
            />
            <span class="input-suffix">次/天</span>
            <div class="form-tip">
              限制用户每天最多可以签到获得积分的次数
            </div>
          </el-form-item>

          <el-form-item label="新用户注册奖励" prop="register_bonus">
            <el-input-number
              v-model="config.register_bonus"
              :min="0"
              :max="1000"
              controls-position="right"
            />
            <span class="input-suffix">分</span>
            <div class="form-tip">
              新用户注册时自动获得的积分奖励
            </div>
          </el-form-item>

          <el-form-item label="推荐新用户奖励" prop="referral_points">
            <el-input-number
              v-model="config.referral_points"
              :min="0"
              :max="1000"
              controls-position="right"
            />
            <span class="input-suffix">分</span>
            <div class="form-tip">
              成功推荐新用户注册时获得的积分奖励
            </div>
          </el-form-item>

          <!-- 连续签到奖励 -->
          <el-divider content-position="left">
            <h3>连续签到奖励</h3>
          </el-divider>

          <el-form-item label="启用连续奖励">
            <el-switch
              v-model="config.consecutive_bonus"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="form-tip">
              启用后，用户连续签到将获得额外积分奖励
            </div>
          </el-form-item>

          <el-form-item 
            label="连续奖励规则" 
            v-if="config.consecutive_bonus"
          >
            <div class="consecutive-rules">
              <div 
                v-for="(rule, index) in config.consecutive_bonus_rules" 
                :key="index"
                class="rule-item"
              >
                <span>连续签到</span>
                <el-input-number
                  v-model="rule.days"
                  :min="1"
                  :max="365"
                  size="small"
                  controls-position="right"
                />
                <span>天，奖励</span>
                <el-input-number
                  v-model="rule.bonus"
                  :min="0"
                  :max="1000"
                  size="small"
                  controls-position="right"
                />
                <span>积分</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeConsecutiveRule(index)"
                  :icon="Delete"
                  circle
                />
              </div>
              <el-button 
                type="primary" 
                size="small" 
                @click="addConsecutiveRule"
                :icon="Plus"
              >
                添加规则
              </el-button>
            </div>
          </el-form-item>

          <!-- 积分兑换规则 -->
          <el-divider content-position="left">
            <h3>积分兑换规则</h3>
          </el-divider>

          <el-form-item label="兑换项目">
            <div class="exchange-rules">
              <div 
                v-for="(rule, index) in config.exchange_rules" 
                :key="index"
                class="exchange-item"
              >
                <el-input
                  v-model="rule.name"
                  placeholder="兑换项目名称"
                  size="small"
                  style="width: 150px"
                />
                <span>需要</span>
                <el-input-number
                  v-model="rule.points"
                  :min="1"
                  size="small"
                  controls-position="right"
                  style="width: 120px"
                />
                <span>积分，价值</span>
                <el-input
                  v-model="rule.value"
                  placeholder="如：10元优惠券"
                  size="small"
                  style="width: 150px"
                />
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeExchangeRule(index)"
                  :icon="Delete"
                  circle
                />
              </div>
              <el-button 
                type="primary" 
                size="small" 
                @click="addExchangeRule"
                :icon="Plus"
              >
                添加兑换项目
              </el-button>
            </div>
          </el-form-item>

          <!-- 积分过期设置 -->
          <el-divider content-position="left">
            <h3>积分过期设置</h3>
          </el-divider>

          <el-form-item label="启用积分过期">
            <el-switch
              v-model="config.point_expiry.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="form-tip">
              启用后，用户积分将在指定时间后过期
            </div>
          </el-form-item>

          <el-form-item 
            label="过期时间" 
            v-if="config.point_expiry.enabled"
          >
            <el-input-number
              v-model="config.point_expiry.months"
              :min="1"
              :max="60"
              controls-position="right"
            />
            <span class="input-suffix">个月</span>
            <div class="form-tip">
              积分在获得后多长时间过期
            </div>
          </el-form-item>

          <!-- 规则描述 -->
          <el-form-item label="规则描述" prop="description">
            <el-input
              v-model="config.description"
              type="textarea"
              :rows="4"
              placeholder="请输入积分规则的详细说明，将显示给用户"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Check, Delete, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const branchId = route.params.branchId

// 数据状态
const loading = ref(false)
const saving = ref(false)

// 表单数据
const config = reactive({
  is_enabled: true,
  check_in_points: 10,
  daily_check_in_limit: 1,
  consecutive_bonus: false,
  consecutive_bonus_rules: [
    { days: 7, bonus: 20 },
    { days: 30, bonus: 100 }
  ],
  referral_points: 50,
  register_bonus: 20,
  exchange_rules: [
    { name: '小商品', points: 100, value: '10元优惠券' },
    { name: '中商品', points: 500, value: '50元优惠券' },
    { name: '大商品', points: 1000, value: '100元优惠券' }
  ],
  point_expiry: {
    enabled: false,
    months: 12
  },
  description: '每次签到可获得积分，积分可用于兑换优惠券等奖品。连续签到有额外奖励！'
})

// 表单引用
const formRef = ref()

// 表单验证规则
const formRules = {
  check_in_points: [
    { required: true, message: '请设置签到基础积分', trigger: 'blur' }
  ],
  daily_check_in_limit: [
    { required: true, message: '请设置每日签到限制', trigger: 'blur' }
  ]
}

// 页面加载
onMounted(() => {
  fetchConfig()
})

// 获取积分配置
const fetchConfig = async () => {
  loading.value = true
  try {
    const response = await axios.get(`/api/admin/v1/branch-organizations/${branchId}/point-config`)
    
    if (response.data.code === 0) {
      Object.assign(config, response.data.data)
    } else {
      ElMessage.error(response.data.message || '获取积分配置失败')
    }
  } catch (error) {
    console.error('获取积分配置失败:', error)
    ElMessage.error('获取积分配置失败')
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const response = await axios.post(`/api/admin/v1/branch-organizations/${branchId}/point-config`, config)
    
    if (response.data.code === 0) {
      ElMessage.success('积分配置保存成功')
    } else {
      ElMessage.error(response.data.message || '保存积分配置失败')
    }
  } catch (error) {
    console.error('保存积分配置失败:', error)
    ElMessage.error('保存积分配置失败')
  } finally {
    saving.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchConfig()
}

// 添加连续签到规则
const addConsecutiveRule = () => {
  config.consecutive_bonus_rules.push({ days: 1, bonus: 10 })
}

// 移除连续签到规则
const removeConsecutiveRule = (index) => {
  config.consecutive_bonus_rules.splice(index, 1)
}

// 添加兑换规则
const addExchangeRule = () => {
  config.exchange_rules.push({ name: '', points: 100, value: '' })
}

// 移除兑换规则
const removeExchangeRule = (index) => {
  config.exchange_rules.splice(index, 1)
}
</script>

<style scoped>
.point-config {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.input-suffix {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.consecutive-rules,
.exchange-rules {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.rule-item,
.exchange-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.rule-item:last-of-type,
.exchange-item:last-of-type {
  margin-bottom: 15px;
}

.rule-item span,
.exchange-item span {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}
</style> 