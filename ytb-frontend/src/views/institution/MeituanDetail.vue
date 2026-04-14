<template>
  <div class="meituan-detail-page">
    <el-page-header
      class="detail-header"
      @back="handleBack"
      content="美团机构详情"
    />

    <el-card v-if="detail" shadow="never" class="detail-card">
      <template #header>
        <div class="detail-card-header">
          <div>
            <h3 class="institution-title">
              {{ detail.nickname || detail.name || '未命名机构' }}
              <el-tag
                v-if="detail.status_text"
                size="small"
                :type="getStatusTagType(detail.status)"
                class="status-tag"
              >
                {{ detail.status_text }}
              </el-tag>
            </h3>
            <div class="sub-title">
              机构ID：{{ detail.id }}
              <span v-if="detail.number">（编号：{{ detail.number }}）</span>
            </div>
          </div>
          <el-space wrap>
            <el-tag type="success" v-if="detail.meituan?.enabled">已开通美团业务</el-tag>
            <el-tag v-else type="info">未开通美团业务</el-tag>
          </el-space>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>基本信息</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="机构名称">{{ detail.nickname || '—' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ detail.name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="联系方式">{{ detail.phone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="美团等级">
                {{ detail.meituan?.role_text || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="美团账号">
                {{ detail.meituan?.account || detail.meituan_account || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="分润档位">
                {{ detail.meituan?.commission_rate || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="美团层级">
                L{{ detail.meituan?.level ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_OPERATION_CENTER" label="运营中心服务包">
                {{ detail.meituan?.service_package_count ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_OPERATION_CENTER" label="合伙人名额">
                {{ detail.meituan?.partner_quota?.used ?? 0 }} / {{ detail.meituan?.partner_quota?.total ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item v-if="detail.meituan?.role === MEITUAN_ROLE_PARTNER" label="合伙人服务包">
                {{ detail.meituan?.partner_package_count ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item v-if="[MEITUAN_ROLE_OPERATION_CENTER, MEITUAN_ROLE_PARTNER].includes(detail.meituan?.role)" label="销售经理名额">
                {{ detail.meituan?.sales_quota?.used ?? 0 }} / {{ detail.meituan?.sales_quota?.total ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-block">
            <template #header>上下级关系</template>
            <el-descriptions column="1" border>
              <el-descriptions-item label="美团上级">
                {{ formatMeituanParent(detail.meituan?.parent) }}
              </el-descriptions-item>
              <el-descriptions-item label="子机构数">
                {{ detail.meituan?.children_count ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="info-block">
        <template #header>美团子机构</template>
        <el-table
          :data="detail.meituan?.children || []"
          border
          empty-text="暂无子机构"
          size="small"
        >
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column label="机构名称" min-width="200">
            <template #default="{ row }">
              {{ row.name || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="number" label="机构编号" min-width="160" />
          <el-table-column label="层级" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">L{{ row.level ?? 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="美团等级" min-width="140">
            <template #default="{ row }">
              <el-tag size="small">{{ row.role_text || '—' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="联系方式" min-width="160" />
        </el-table>
      </el-card>

      <el-card shadow="never" class="info-block">
        <template #header>关联信息</template>
        <el-descriptions column="2" border>
          <el-descriptions-item label="运营层级">
            {{ detail.core_type_text || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            {{ detail.status_text || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ detail.created_at || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ detail.updated_at || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </el-card>

    <el-empty v-else-if="!loading" description="未找到美团机构信息" />

    <div v-else class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { fetchInstitutionDetail } from '@/api/v1/institution'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)

const MEITUAN_ROLE_OPERATION_CENTER = 2
const MEITUAN_ROLE_PARTNER = 3

const institutionId = computed(() => {
  const value = route.params.id
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
})

const getStatusTagType = (status) => {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

const MEITUAN_PARENT_ROLE_WHITELIST = ['运营总部', '运营中心', '合伙人', '销售经理']

const resolveMeituanParentRole = (parent) => {
  if (!parent) {
    return ''
  }
  const candidate =
    parent.meituan_role_text ??
    parent.role_text ??
    parent.roleText ??
    parent.role ??
    parent.level_text ??
    parent.level_name ??
    ''
  const normalized = typeof candidate === 'string' ? candidate.trim() : String(candidate || '').trim()
  if (!normalized) {
    return ''
  }
  const matched = MEITUAN_PARENT_ROLE_WHITELIST.find(role => normalized.includes(role))
  return matched || normalized
}

const formatMeituanParent = (parent) => {
  if (!parent || !parent.id) {
    return '顶级机构'
  }
  const name = parent.name || parent.nickname || '未命名'
  const role = resolveMeituanParentRole(parent)
  return role ? `${name}（${role}）` : name
}

const loadDetail = async () => {
  if (!institutionId.value) return
  loading.value = true
  try {
    const { code, data, message } = await fetchInstitutionDetail(institutionId.value)
    if (code === 0) {
      detail.value = data
    } else {
      ElMessage.error(message || '获取美团机构详情失败')
    }
  } catch (error) {
    console.error('获取美团机构详情失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取美团机构详情失败')
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="scss">
.meituan-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  padding: 0;
}

.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.institution-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  margin-left: 8px;
}

.sub-title {
  margin-top: 6px;
  color: #909399;
}

.info-block {
  margin-bottom: 16px;
}

.loading-container {
  padding: 32px;
}
</style>
