<template>
  <div class="dividend-config">
    <div class="page-header">
      <h2>分红配置</h2>
      <el-button type="primary" @click="saveConfig" :loading="saving">
        保存配置
      </el-button>
    </div>

    <!-- 调试信息 -->
    <el-alert v-if="debugInfo" type="info" :closable="false" style="margin-bottom: 20px;">
      <div>调试信息：</div>
      <div>分支机构ID: {{ branchId || '未获取到' }}</div>
      <div>路由参数: {{ JSON.stringify(route.params) }}</div>
      <div>当前路由: {{ route.path }}</div>
    </el-alert>

    <div class="config-content">
      <!-- VIP招募分红 -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>VIP招募分红</span>
            <el-switch v-model="config.vip_dividend_enabled" />
          </div>
        </template>
        
        <div class="config-section">
          <h4>达标条件</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>初级达标</label>
              <el-input-number
                v-model="config.vip_junior_requirement"
                :min="0"
                controls-position="right"
                placeholder="3"
              />
              <span class="unit">人</span>
            </div>
            
            <div class="config-item">
              <label>中级达标</label>
              <el-input-number
                v-model="config.vip_middle_requirement"
                :min="0"
                controls-position="right"
                placeholder="10"
              />
              <span class="unit">人</span>
            </div>
            
            <div class="config-item">
              <label>高级达标</label>
              <el-input-number
                v-model="config.vip_senior_requirement"
                :min="0"
                controls-position="right"
                placeholder="30"
              />
              <span class="unit">人</span>
            </div>
          </div>
        </div>

        <div class="config-section">
          <h4>分红基数</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>初级基数</label>
              <el-input-number
                v-model="config.vip_junior_amount"
                :min="0"
                :step="10"
                controls-position="right"
                placeholder="300"
              />
              <span class="unit">元/人</span>
            </div>
            
            <div class="config-item">
              <label>中级基数</label>
              <el-input-number
                v-model="config.vip_middle_amount"
                :min="0"
                :step="10"
                controls-position="right"
                placeholder="300"
              />
              <span class="unit">元/人</span>
            </div>
            
            <div class="config-item">
              <label>高级基数</label>
              <el-input-number
                v-model="config.vip_senior_amount"
                :min="0"
                :step="10"
                controls-position="right"
                placeholder="300"
              />
              <span class="unit">元/人</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 充值套餐分红 -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>充值套餐分红</span>
            <el-switch v-model="config.recharge_dividend_enabled" />
          </div>
        </template>
        
        <div class="config-section">
          <h4>达标条件</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>初级达标</label>
              <el-input-number
                v-model="config.recharge_junior_requirement"
                :min="0"
                controls-position="right"
                placeholder="10"
              />
              <span class="unit">台</span>
            </div>
            
            <div class="config-item">
              <label>中级达标</label>
              <el-input-number
                v-model="config.recharge_middle_requirement"
                :min="0"
                controls-position="right"
                placeholder="30"
              />
              <span class="unit">台</span>
            </div>
            
            <div class="config-item">
              <label>高级达标</label>
              <el-input-number
                v-model="config.recharge_senior_requirement"
                :min="0"
                controls-position="right"
                placeholder="80"
              />
              <span class="unit">台</span>
            </div>
          </div>
        </div>

        <div class="config-section">
          <h4>分红基数</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>初级基数</label>
              <el-input-number
                v-model="config.recharge_junior_amount"
                :min="0"
                :step="1"
                controls-position="right"
                placeholder="15"
              />
              <span class="unit">元/台</span>
            </div>
            
            <div class="config-item">
              <label>中级基数</label>
              <el-input-number
                v-model="config.recharge_middle_amount"
                :min="0"
                :step="1"
                controls-position="right"
                placeholder="15"
              />
              <span class="unit">元/台</span>
            </div>
            
            <div class="config-item">
              <label>高级基数</label>
              <el-input-number
                v-model="config.recharge_senior_amount"
                :min="0"
                :step="1"
                controls-position="right"
                placeholder="15"
              />
              <span class="unit">元/台</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 说明 -->
      <el-card class="help-card">
        <div class="help-content">
          <h4>分红规则</h4>
          <ul>
            <li>每月结算，按团队当月新增数量计算</li>
            <li>中级、高级分红需要当月有直推</li>
            <li>高级分红按直推数量占比分配，初级中级均分</li>
            <li>每个等级使用独立的分红基数进行计算</li>
            <li>分红池 = 新增数量 × 对应等级基数</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
// 移除未使用的API导入，避免可能的错误
// import { getBranchDividendConfig, updateBranchDividendConfig } from '@/api/v1/branchManagement'
import { useRoute } from 'vue-router'

export default {
  name: 'DividendConfig',
  setup() {
    const route = useRoute()
    const branchId = ref(route.params.branchId)
    const saving = ref(false)
    const debugInfo = ref(false) // 关闭调试信息
    
    const config = reactive({
      vip_dividend_enabled: true,
      vip_junior_requirement: 3,
      vip_middle_requirement: 10,
      vip_senior_requirement: 30,
      vip_junior_amount: 300,
      vip_middle_amount: 300,
      vip_senior_amount: 300,
      recharge_dividend_enabled: true,
      recharge_junior_requirement: 10,
      recharge_middle_requirement: 30,
      recharge_senior_requirement: 80,
      recharge_junior_amount: 15,
      recharge_middle_amount: 15,
      recharge_senior_amount: 15,
      is_active: true
    })

    const loadConfig = async () => {
      try {
        console.log('正在加载分红配置，branchId:', branchId.value)
        
        if (!branchId.value) {
          ElMessage.error('未获取到分支机构ID')
          return
        }

        // 分红配置API已设置为公共路径，无需token验证
        const response = await fetch(`/api/admin/v1/branch-organizations/${branchId.value}/dividend-config`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API响应:', data)
        
        if (data.code === 0 && data.data) {
          Object.assign(config, data.data)
          ElMessage.success('配置加载成功')
        } else {
          ElMessage.warning(data.message || '暂无配置数据，将使用默认配置')
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        // 避免显示可能引起混淆的错误信息
        if (error.message.includes('401') || error.message.includes('token')) {
          ElMessage.error('权限验证失败，请刷新页面重试')
        } else {
          ElMessage.error('加载配置失败: ' + error.message)
        }
      }
    }

    const saveConfig = async () => {
      if (!branchId.value) {
        ElMessage.error('未获取到分支机构ID')
        return
      }

      saving.value = true
      try {
        console.log('正在保存分红配置，branchId:', branchId.value, 'config:', config)
        
        // 将reactive对象转换为普通对象，避免序列化问题
        const configData = {
          vip_dividend_enabled: config.vip_dividend_enabled,
          vip_junior_requirement: config.vip_junior_requirement,
          vip_middle_requirement: config.vip_middle_requirement,
          vip_senior_requirement: config.vip_senior_requirement,
          vip_junior_amount: config.vip_junior_amount,
          vip_middle_amount: config.vip_middle_amount,
          vip_senior_amount: config.vip_senior_amount,
          vip_pool_amount: config.vip_pool_amount,
          recharge_dividend_enabled: config.recharge_dividend_enabled,
          recharge_junior_requirement: config.recharge_junior_requirement,
          recharge_middle_requirement: config.recharge_middle_requirement,
          recharge_senior_requirement: config.recharge_senior_requirement,
          recharge_junior_amount: config.recharge_junior_amount,
          recharge_middle_amount: config.recharge_middle_amount,
          recharge_senior_amount: config.recharge_senior_amount,
          recharge_pool_amount: config.recharge_pool_amount,
          is_active: config.is_active,
          description: config.description,
          extra_config: config.extra_config
        }
        
        console.log('序列化前的配置数据:', configData)
        
        // 分红配置API已设置为公共路径，无需token验证
        const response = await fetch(`/api/admin/v1/branch-organizations/${branchId.value}/dividend-config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(configData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('保存响应:', data)
        
        if (data.code === 0) {
          ElMessage.success('配置保存成功')
        } else {
          ElMessage.error(data.message || '保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        // 避免显示可能引起混淆的错误信息
        if (error.message.includes('401') || error.message.includes('token')) {
          ElMessage.error('权限验证失败，请刷新页面重试')
        } else {
          ElMessage.error('保存失败: ' + error.message)
        }
      } finally {
        saving.value = false
      }
    }

    onMounted(() => {
      console.log('组件挂载，路由信息:', {
        path: route.path,
        params: route.params,
        branchId: branchId.value
      })
      
      loadConfig()
    })

    return {
      route,
      branchId,
      config,
      saving,
      debugInfo,
      saveConfig
    }
  }
}
</script>

<style scoped>
.dividend-config {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.config-content {
  max-width: 900px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.config-section {
  margin-bottom: 20px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-item label {
  min-width: 80px;
  font-weight: 500;
  color: #606266;
}

.config-item .unit {
  color: #909399;
  font-size: 14px;
}

.help-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.help-content h4 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.help-content li {
  margin-bottom: 5px;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
}
</style> 