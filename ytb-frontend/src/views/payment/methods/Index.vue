<template>
  <div class="page-container">
    <el-card class="page-card">
      <div class="page-header">
        <h2>支付方式管理</h2>
        <p class="page-description">管理系统支持的支付方式及支付配置</p>
      </div>
      
      <div class="content-container" v-loading="loading">
        <!-- 支付方式列表 -->
        <el-table :data="paymentMethods" border style="width: 100%">
          <el-table-column prop="title" label="支付方式" min-width="150">
            <template slot-scope="{row}">
              <div class="payment-method">
                <el-image
                  v-if="row.key === 'enable_wechat_pay'"
                  class="method-icon"
                  src="/images/wechat-pay.png"
                  fit="contain"
                ></el-image>
                <el-image
                  v-if="row.key === 'enable_alipay'"
                  class="method-icon"
                  src="/images/alipay.png"
                  fit="contain"
                ></el-image>
                <i 
                  v-if="row.key === 'enable_bank_transfer'"
                  class="el-icon-bank-card method-icon-font"
                ></i>
                {{ row.title }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="描述" min-width="180" />
          
          <el-table-column prop="is_enabled" label="状态" width="120" v-if="isEnableOption">
            <template slot-scope="{row}">
              <el-switch
                v-if="row.is_enabled !== null"
                v-model="row.is_enabled"
                @change="toggleStatus(row)"
                active-color="#13ce66"
                inactive-color="#ff4949"
                :active-text="row.is_enabled ? '已启用' : '已禁用'"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right" v-if="!isEnableOption">
            <template slot-scope="{row}">
              <el-button type="text" size="mini" @click="editConfig(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 支付方式配置表单 -->
      <el-dialog
        title="编辑支付配置"
        :visible.sync="configDialogVisible"
        width="600px"
      >
        <el-form :model="configForm" ref="configForm" label-width="120px" v-loading="saveLoading">
          <el-form-item 
            v-for="item in configItems" 
            :key="item.key" 
            :label="item.title" 
            :prop="item.key"
          >
            <el-input 
              v-if="item.key !== 'alipay_public_key' && item.key !== 'alipay_private_key' && item.key !== 'bank_info'"
              v-model="configForm[item.key]" 
              :placeholder="item.description" 
            />
            <el-input
              v-else
              type="textarea"
              :rows="4"
              v-model="configForm[item.key]"
              :placeholder="item.description"
            />
          </el-form-item>
        </el-form>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="configDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig" :loading="saveLoading">保存</el-button>
        </span>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'PaymentMethods',
  data() {
    return {
      title: '支付方式管理',
      description: '管理系统支持的支付方式及支付配置',
      loading: false,
      saveLoading: false,
      paymentMethods: [],
      isEnableOption: true, // 是否显示启用选项（支付方式切换视图）
      configDialogVisible: false,
      configForm: {},
      configItems: []
    }
  },
  created() {
    this.getPaymentMethods()
  },
  methods: {
    getPaymentMethods() {
      this.loading = true
      this.$http.get('/api/payment/methods')
        .then(response => {
          if (response.code === 0) {
            const methods = response.data || []
            
            // 分类处理：启用选项和配置选项
            if (this.isEnableOption) {
              this.paymentMethods = methods.filter(item => 
                ['enable_wechat_pay', 'enable_alipay', 'enable_bank_transfer'].includes(item.key)
              )
            } else {
              this.paymentMethods = methods.filter(item => 
                !['enable_wechat_pay', 'enable_alipay', 'enable_bank_transfer'].includes(item.key)
              )
            }
          } else {
            this.$message.error(response.data.message || '获取支付方式列表失败')
          }
          this.loading = false
        })
        .catch(error => {
          console.error('获取支付方式列表失败', error)
          this.$message.error('获取支付方式列表失败')
          this.loading = false
        })
    },
    toggleStatus(row) {
      this.loading = true
      this.$http.post(`/api/payment/methods/${row.key}/toggle`)
        .then(response => {
          if (response.code === 0) {
            this.$message.success('支付方式状态已更新')
            // 更新本地状态
            row.is_enabled = response.data.status
          } else {
            this.$message.error(response.data.message || '更新支付方式状态失败')
            // 恢复原状态
            row.is_enabled = !row.is_enabled
          }
          this.loading = false
        })
        .catch(error => {
          console.error('更新支付方式状态失败', error)
          this.$message.error('更新支付方式状态失败')
          // 恢复原状态
          row.is_enabled = !row.is_enabled
          this.loading = false
        })
    },
    editConfig(row) {
      // 准备配置项 - 这里修复了问题：不要直接使用 this.paymentMethods
      this.configItems = this.paymentMethods.map(item => ({...item}));
      
      // 准备表单数据
      this.configForm = {};
      this.paymentMethods.forEach(item => {
        this.configForm[item.key] = item.value;
      });
      
      this.configDialogVisible = true;
    },
    saveConfig() {
      this.saveLoading = true
      
      // 准备要提交的配置数据
      const settings = []
      for (const key in this.configForm) {
        settings.push({
          key: key,
          value: this.configForm[key]
        })
      }
      
      this.$http.post('/api/payment/methods/update', { settings })
        .then(response => {
          if (response.code === 0) {
            this.$message.success('支付配置已更新')
            this.configDialogVisible = false
            this.getPaymentMethods() // 刷新列表
          } else {
            this.$message.error(response.data.message || '更新支付配置失败')
          }
          this.saveLoading = false
        })
        .catch(error => {
          console.error('更新支付配置失败', error)
          this.$message.error('更新支付配置失败')
          this.saveLoading = false
        })
    },
    goBack() {
      this.$router.go(-1)
    },
    // 切换视图：支付方式启用/禁用 和 支付配置
    switchView() {
      this.isEnableOption = !this.isEnableOption
      this.getPaymentMethods()
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-card {
  margin-bottom: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.page-description {
  color: #666;
  margin: 10px 0;
}
.content-container {
  margin-top: 20px;
}
.payment-method {
  display: flex;
  align-items: center;
}
.method-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}
.method-icon-font {
  font-size: 24px;
  margin-right: 10px;
}
.view-toggle {
  margin-bottom: 20px;
}
</style> 