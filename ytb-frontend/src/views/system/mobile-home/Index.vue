<template>
  <div class="mobile-home-builder">
    <div class="page-header">
      <div>
        <h1>移动端首页</h1>
        <p>统一管理 H5/小程序首页的展示模块、快捷入口与预览</p>
      </div>
      <div class="header-actions">
        <el-button @click="refresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving">
          <el-icon><Finished /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="config-card" v-loading="loading">
          <el-form label-width="100px" class="hero-form">
            <h3 class="section-title">头部展示</h3>
            <el-form-item label="标题">
              <el-input v-model="configForm.hero.title" maxlength="30" show-word-limit />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="configForm.hero.subtitle" maxlength="60" show-word-limit />
            </el-form-item>
            <el-form-item label="高亮文案">
              <el-input v-model="configForm.hero.highlight" maxlength="30" />
            </el-form-item>
            <el-form-item label="背景图 URL">
              <el-input v-model="configForm.hero.background" placeholder="https://" />
            </el-form-item>
            <el-form-item label="按钮文案">
              <el-input v-model="configForm.hero.cta_text" maxlength="12" />
            </el-form-item>
            <el-form-item label="按钮链接">
              <el-input v-model="configForm.hero.cta_link" placeholder="/device/detail" />
            </el-form-item>
          </el-form>

          <div class="section-bar">
            <h3 class="section-title">服务中心</h3>
            <el-button type="primary" size="small" @click="openServiceDialog()">
              <el-icon><Plus /></el-icon>
              添加入口
            </el-button>
          </div>
          <el-table :data="configForm.service_entries" stripe size="small" empty-text="暂无数据">
            <el-table-column prop="title" label="名称" width="140" />
            <el-table-column prop="desc" label="描述" />
            <el-table-column prop="route" label="跳转" width="180" />
            <el-table-column label="需登录" width="80">
              <template #default="{ row }">
                <el-tag type="info" v-if="row.requiresLogin">是</el-tag>
                <el-tag v-else type="success">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row, $index }">
                <el-button text type="primary" size="small" @click="openServiceDialog(row, $index)">编辑</el-button>
                <el-button text type="danger" size="small" @click="removeServiceEntry($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="section-bar">
            <h3 class="section-title">工作台入口</h3>
            <el-button type="primary" size="small" @click="openWorkspaceDialog()">
              <el-icon><Plus /></el-icon>
              添加入口
            </el-button>
          </div>
          <el-table :data="configForm.workspace_entries" stripe size="small" empty-text="暂无数据">
            <el-table-column prop="title" label="名称" width="160" />
            <el-table-column prop="desc" label="描述" />
            <el-table-column prop="role_flag" label="触达角色" width="140">
              <template #default="{ row }">
                {{ roleLabel(row.role_flag) }}
              </template>
            </el-table-column>
            <el-table-column prop="route" label="跳转" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="{ row, $index }">
                <el-button text type="primary" size="small" @click="openWorkspaceDialog(row, $index)">编辑</el-button>
                <el-button text type="danger" size="small" @click="removeWorkspaceEntry($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="section-bar">
            <h3 class="section-title">精选推荐</h3>
            <el-button type="primary" size="small" @click="openProductDialog()">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
          <el-table :data="configForm.featured_products" stripe size="small" empty-text="暂无数据">
            <el-table-column prop="name" label="商品" />
            <el-table-column prop="price" label="价格" width="120">
              <template #default="{ row }">
                ¥{{ formatPrice(row.price) }}
              </template>
            </el-table-column>
            <el-table-column prop="route" label="跳转" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="{ row, $index }">
                <el-button text size="small" type="primary" @click="openProductDialog(row, $index)">编辑</el-button>
                <el-button text size="small" type="danger" @click="removeProduct($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="preview-card" v-loading="loading">
          <template #header>
            <div class="preview-header">
              <span>实时预览</span>
              <span class="preview-timestamp" v-if="stats.updated_at">最近保存：{{ stats.updated_at }}</span>
            </div>
          </template>
          <mobile-home-preview :config="configForm" />
        </el-card>

        <el-card shadow="never" class="info-card">
          <div class="stats-grid">
            <div class="stat">
              <p class="stat__label">Banner</p>
              <p class="stat__value">{{ stats.banner_count }}</p>
            </div>
            <div class="stat">
              <p class="stat__label">首页导航</p>
              <p class="stat__value">{{ stats.nav_count }}</p>
            </div>
            <div class="stat">
              <p class="stat__label">服务入口</p>
              <p class="stat__value">{{ configForm.service_entries.length }}</p>
            </div>
            <div class="stat">
              <p class="stat__label">工作台</p>
              <p class="stat__value">{{ configForm.workspace_entries.length }}</p>
            </div>
          </div>

          <div class="quick-links">
            <h4>快捷跳转</h4>
            <el-space wrap>
              <el-button v-for="link in quickLinks" :key="link.route" plain size="small" @click="goLink(link.route)">
                <el-icon><component :is="link.icon" /></el-icon>
                {{ link.label }}
              </el-button>
            </el-space>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="serviceDialog.visible" :title="serviceDialog.index === -1 ? '新增服务入口' : '编辑服务入口'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="serviceDialog.form.title" maxlength="20" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="serviceDialog.form.desc" maxlength="40" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="serviceDialog.form.icon" placeholder="emoji或icon文本" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="serviceDialog.form.route" />
        </el-form-item>
        <el-form-item label="需登录">
          <el-switch v-model="serviceDialog.form.requiresLogin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveServiceEntry">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workspaceDialog.visible" :title="workspaceDialog.index === -1 ? '新增工作台' : '编辑工作台'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="workspaceDialog.form.title" maxlength="20" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="workspaceDialog.form.desc" maxlength="40" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="workspaceDialog.form.role_flag" placeholder="请选择">
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="workspaceDialog.form.icon" placeholder="emoji或icon" />
        </el-form-item>
        <el-form-item label="跳转">
          <el-input v-model="workspaceDialog.form.route" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workspaceDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveWorkspaceEntry">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productDialog.visible" :title="productDialog.index === -1 ? '新增推荐商品' : '编辑推荐商品'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="商品名">
          <el-input v-model="productDialog.form.name" maxlength="30" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="productDialog.form.cover" placeholder="https://" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="productDialog.form.price" :min="0" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="跳转">
          <el-input v-model="productDialog.form.route" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Finished, Plus, Menu, Picture, Iphone, Operation } from '@element-plus/icons-vue'
import MobileHomePreview from './components/MobileHomePreview.vue'
import { fetchMobileHomeConfig, saveMobileHomeConfig } from '@/api/mobileHome'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const stats = reactive({
  banner_count: 0,
  nav_count: 0,
  updated_at: null
})

const defaultConfig = () => ({
  hero: {
    title: '我的智能净水管家',
    subtitle: '实时掌握设备运行、用水与服务状态',
    highlight: 'AUGTAPGO',
    background: 'https://jzq.iddg.cn/smartUpload/wxcustomer/sbbj.png',
    cta_text: '查看设备',
    cta_link: '/device'
  },
  service_entries: [
    { key: 'install', title: '安装预约', desc: '在线预约工程师上门', icon: '🛠️', route: '/installation/booking', requiresLogin: true },
    { key: 'mall', title: '积分商城', desc: '滤芯耗材快捷购买', icon: '🛒', route: '/mall', requiresLogin: false }
  ],
  workspace_entries: [
    { key: 'vip', title: 'VIP中心', desc: '招募、分红与权益', icon: '💎', role_flag: 'is_vip', route: '/vip' },
    { key: 'merchant', title: '商户工作台', desc: '交易、设备与培训', icon: '🏪', role_flag: 'is_pay_merchant', route: '/merchant' }
  ],
  featured_products: [
    { uid: 'filter', name: '原装滤芯套装', cover: '', price: 399, route: '/mall/goods/1001' }
  ]
})

const configForm = reactive(defaultConfig())

const quickLinks = [
  { label: '导航管理', route: '/system/nav', icon: Operation },
  { label: 'Banner管理', route: '/mall/banners', icon: Picture },
  { label: 'APP版本', route: '/system/app-management', icon: Iphone },
  { label: '菜单配置', route: '/system/menu', icon: Menu }
]

const roleOptions = [
  { label: '管理员', value: 'is_admin' },
  { label: 'VIP会员', value: 'is_vip' },
  { label: '支付商户', value: 'is_pay_merchant' },
  { label: '支付机构', value: 'is_pay_institution' },
  { label: '渠道商', value: 'is_water_purifier_agent' },
  { label: '业务员', value: 'is_salesman' },
  { label: '工程师', value: 'is_engineer' },
  { label: '净水用户', value: 'is_water_purifier_user' }
]

const serviceDialog = reactive({ visible: false, index: -1, form: createServiceTemplate() })
const workspaceDialog = reactive({ visible: false, index: -1, form: createWorkspaceTemplate() })
const productDialog = reactive({ visible: false, index: -1, form: createProductTemplate() })

function createServiceTemplate() {
  return { key: '', title: '', desc: '', icon: '', route: '', requiresLogin: false }
}

function createWorkspaceTemplate() {
  return { key: '', title: '', desc: '', icon: '', route: '', role_flag: 'is_vip' }
}

function createProductTemplate() {
  return { uid: '', name: '', cover: '', price: 0, route: '' }
}

const applyConfig = (payload = {}) => {
  Object.assign(configForm.hero, payload.hero || defaultConfig().hero)
  configForm.service_entries.splice(0, configForm.service_entries.length, ...(payload.service_entries || []))
  configForm.workspace_entries.splice(0, configForm.workspace_entries.length, ...(payload.workspace_entries || []))
  configForm.featured_products.splice(0, configForm.featured_products.length, ...(payload.featured_products || []))
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchMobileHomeConfig()
    if (res && res.code === 0) {
      applyConfig(res.data?.config)
      Object.assign(stats, res.data?.stats || {})
    } else {
      ElMessage.error(res?.message || '获取配置失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '获取配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const payload = JSON.parse(JSON.stringify(configForm))
    const res = await saveMobileHomeConfig(payload)
    if (res && res.code === 0) {
      ElMessage.success('移动端首页配置已保存')
      stats.updated_at = res.data?.updated_at || new Date().toISOString()
    } else {
      ElMessage.error(res?.message || '保存失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const refresh = () => loadData()

const openServiceDialog = (row = null, index = -1) => {
  serviceDialog.index = index
  serviceDialog.form = Object.assign(createServiceTemplate(), row || {})
  serviceDialog.visible = true
}

const saveServiceEntry = () => {
  if (!serviceDialog.form.title || !serviceDialog.form.route) {
    ElMessage.warning('请填写名称和跳转链接')
    return
  }
  const payload = { ...serviceDialog.form }
  if (!payload.key) {
    payload.key = payload.title + Date.now()
  }
  if (serviceDialog.index > -1) {
    configForm.service_entries.splice(serviceDialog.index, 1, payload)
  } else {
    configForm.service_entries.push(payload)
  }
  serviceDialog.visible = false
}

const removeServiceEntry = (index) => {
  ElMessageBox.confirm('确定删除该入口吗？', '提示', { type: 'warning' })
    .then(() => {
      configForm.service_entries.splice(index, 1)
    })
    .catch(() => {})
}

const openWorkspaceDialog = (row = null, index = -1) => {
  workspaceDialog.index = index
  workspaceDialog.form = Object.assign(createWorkspaceTemplate(), row || {})
  workspaceDialog.visible = true
}

const saveWorkspaceEntry = () => {
  if (!workspaceDialog.form.title || !workspaceDialog.form.route) {
    ElMessage.warning('请填写名称和跳转链接')
    return
  }
  const payload = { ...workspaceDialog.form }
  if (!payload.key) {
    payload.key = payload.title + Date.now()
  }
  if (workspaceDialog.index > -1) {
    configForm.workspace_entries.splice(workspaceDialog.index, 1, payload)
  } else {
    configForm.workspace_entries.push(payload)
  }
  workspaceDialog.visible = false
}

const removeWorkspaceEntry = (index) => {
  ElMessageBox.confirm('确定删除该工作台入口吗？', '提示', { type: 'warning' })
    .then(() => {
      configForm.workspace_entries.splice(index, 1)
    })
    .catch(() => {})
}

const openProductDialog = (row = null, index = -1) => {
  productDialog.index = index
  productDialog.form = Object.assign(createProductTemplate(), row || {})
  productDialog.visible = true
}

const saveProduct = () => {
  if (!productDialog.form.name) {
    ElMessage.warning('请填写商品名')
    return
  }
  const payload = { ...productDialog.form }
  if (!payload.uid) {
    payload.uid = payload.name + Date.now()
  }
  if (productDialog.index > -1) {
    configForm.featured_products.splice(productDialog.index, 1, payload)
  } else {
    configForm.featured_products.push(payload)
  }
  productDialog.visible = false
}

const removeProduct = (index) => {
  ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
    .then(() => {
      configForm.featured_products.splice(index, 1)
    })
    .catch(() => {})
}

const goLink = (routePath) => {
  router.push(routePath)
}

const formatPrice = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}

const roleLabel = (flag) => {
  return roleOptions.find((role) => role.value === flag)?.label || '通用'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.mobile-home-builder {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.page-header p {
  margin: 4px 0 0;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-card,
.preview-card,
.info-card {
  margin-bottom: 20px;
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 12px;
}

.stat__label {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.stat__value {
  margin: 6px 0 0;
  font-size: 20px;
  font-weight: 600;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-timestamp {
  color: #909399;
  font-size: 12px;
}

.quick-links h4 {
  margin: 0 0 12px;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}
</style>
