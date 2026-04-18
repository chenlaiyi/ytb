<template>
  <div class="ytb-applications">
    <van-nav-bar title="升级申请记录" left-arrow @click-left="goBack" />

    <!-- 申请列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="application-list">
          <div class="application-item" v-for="item in applications" :key="item.id">
            <div class="application-header">
              <div class="application-type">
                升级{{ item.to_role === 'scp' ? 'CP伙伴' : 'VIPCP伙伴' }}
              </div>
              <van-tag :type="getStatusType(item.admin_status)" size="medium">
                {{ item.admin_status_name }}
              </van-tag>
            </div>
            
            <div class="application-body">
              <div class="info-row">
                <span class="label">升级方式：</span>
                <span class="value">{{ item.upgrade_type_name }}</span>
              </div>
              <div class="info-row" v-if="item.amount > 0">
                <span class="label">支付金额：</span>
                <span class="value price">¥{{ item.amount }}</span>
              </div>
              <div class="info-row" v-if="item.payment_method">
                <span class="label">支付方式：</span>
                <span class="value">{{ item.payment_method_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">申请时间：</span>
                <span class="value">{{ item.created_at }}</span>
              </div>
              <div class="info-row" v-if="item.approved_at">
                <span class="label">审批时间：</span>
                <span class="value">{{ item.approved_at }}</span>
              </div>
              <div class="info-row" v-if="item.admin_remark">
                <span class="label">审批备注：</span>
                <span class="value">{{ item.admin_remark }}</span>
              </div>
            </div>

            <div class="application-footer" v-if="item.admin_status === 'pending' && item.payment_status !== 'paid'">
              <van-button size="small" plain @click="cancelApplication(item)">
                取消申请
              </van-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty v-if="!loading && applications.length === 0" description="暂无升级申请记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { getApplications, cancelApplication as cancelApi, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 升级申请')

const router = useRouter()

// 状态
const applications = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const perPage = 20

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/login')
    return
  }

  await loadApplications()
})

// 加载申请记录
const loadApplications = async () => {
  page.value = 1
  finished.value = false
  applications.value = []
  await loadMore()
}

// 加载更多
const loadMore = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const res = await getApplications({
      page: page.value,
      per_page: perPage
    })
    
    if (res.code === 0) {
      const list = res.data.list || []
      if (page.value === 1) {
        applications.value = list
      } else {
        applications.value.push(...list)
      }
      
      if (list.length < perPage) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('获取申请记录失败:', error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadApplications()
  refreshing.value = false
}

// 取消申请
const cancelApplication = async (item) => {
  try {
    await showDialog({
      title: '提示',
      message: '确定要取消这个升级申请吗？',
      showCancelButton: true
    })
    
    const res = await cancelApi(item.id)
    if (res.code === 0) {
      showSuccessToast('已取消')
      await loadApplications()
    } else {
      showToast(res.message || '取消失败')
    }
  } catch (error) {
    // 用户取消或网络错误
  }
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'warning'
  }
}

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-applications {
  min-height: 100vh;
  background: #f5f5f5;
}

.application-list {
  padding: 12px;
}

.application-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.application-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
}

.application-type {
  font-size: 16px;
  font-weight: 500;
}

.application-body {
  padding: 16px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #999;
  width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #333;
}

.info-row .value.price {
  color: #ff6b6b;
  font-weight: 500;
}

.application-footer {
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
  text-align: right;
}
</style>
