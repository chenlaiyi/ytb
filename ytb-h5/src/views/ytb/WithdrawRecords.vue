<template>
  <div class="ytb-withdraw-records">
    <van-nav-bar title="提现记录" left-arrow @click-left="goBack" />

    <!-- 筛选 -->
    <van-dropdown-menu>
      <van-dropdown-item v-model="filterStatus" :options="statusOptions" @change="onFilterChange" />
    </van-dropdown-menu>

    <!-- 记录列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="record-list">
          <div class="record-item" v-for="item in records" :key="item.id">
            <div class="record-header">
              <div class="record-type">
                <van-icon :name="getTypeIcon(item.withdraw_type)" />
                <span>{{ item.withdraw_type_name }}</span>
              </div>
              <van-tag :type="getStatusType(item.status)" size="medium">
                {{ item.status_name }}
              </van-tag>
            </div>
            <div class="record-body">
              <div class="record-amount">
                <span class="label">提现金额</span>
                <span class="value">¥{{ formatMoney(item.amount) }}</span>
              </div>
              <div class="record-actual">
                <span class="label">实际到账</span>
                <span class="value highlight">¥{{ formatMoney(item.actual_amount) }}</span>
              </div>
            </div>
            <div class="record-info">
              <div class="info-item">
                <span class="label">收款账户：</span>
                <span>{{ item.account_name }} {{ item.account_no }}</span>
              </div>
              <div class="info-item">
                <span class="label">申请时间：</span>
                <span>{{ item.created_at }}</span>
              </div>
              <div class="info-item" v-if="item.completed_at">
                <span class="label">完成时间：</span>
                <span>{{ item.completed_at }}</span>
              </div>
              <div class="info-item" v-if="item.admin_remark">
                <span class="label">备注：</span>
                <span>{{ item.admin_remark }}</span>
              </div>
            </div>
            <div class="record-footer" v-if="item.status === 'pending'">
              <van-button size="small" plain type="danger" @click="cancelWithdrawal(item)">
                取消申请
              </van-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty v-if="!loading && records.length === 0" description="暂无提现记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { getWithdrawals, cancelWithdraw, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 提现记录')

const router = useRouter()

// 状态
const records = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const filterStatus = ref('')

const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '待处理', value: 'pending' },
  { text: '处理中', value: 'processing' },
  { text: '已完成', value: 'completed' },
  { text: '已拒绝', value: 'rejected' }
]

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/login')
    return
  }
})

// 加载更多
const loadMore = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: 20
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }

    const res = await getWithdrawals(params)
    if (res.code === 0) {
      if (page.value === 1) {
        records.value = res.data.list
      } else {
        records.value.push(...res.data.list)
      }
      
      if (res.data.list.length < 20) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('获取提现记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadMore()
  refreshing.value = false
}

// 筛选变化
const onFilterChange = () => {
  page.value = 1
  finished.value = false
  records.value = []
  loadMore()
}

// 取消提现
const cancelWithdrawal = async (item) => {
  try {
    await showDialog({
      title: '确认取消',
      message: '确定要取消这笔提现申请吗？',
      showCancelButton: true
    })
  } catch {
    return
  }

  try {
    const res = await cancelWithdraw(item.id)
    if (res.code === 0) {
      showSuccessToast('取消成功')
      onRefresh()
    } else {
      showToast(res.message || '取消失败')
    }
  } catch (error) {
    showToast('网络错误')
  }
}

// 获取类型图标
const getTypeIcon = (type) => {
  switch (type) {
    case 'bank_card': return 'card'
    case 'wechat': return 'wechat'
    case 'alipay': return 'alipay'
    default: return 'gold-coin-o'
  }
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'rejected': return 'danger'
    case 'processing': return 'primary'
    default: return 'warning'
  }
}

// 格式化金额
const formatMoney = (value) => {
  return parseFloat(value || 0).toFixed(2)
}

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-withdraw-records {
  min-height: 100vh;
  background: #f5f5f5;
}

.record-list {
  padding: 12px;
}

.record-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.record-type .van-icon {
  font-size: 20px;
  color: #667eea;
}

.record-body {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}

.record-amount,
.record-actual {
  text-align: center;
}

.record-amount .label,
.record-actual .label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.record-amount .value,
.record-actual .value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.record-actual .value.highlight {
  color: #07c160;
}

.record-info {
  padding-top: 12px;
}

.info-item {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.info-item .label {
  color: #999;
}

.record-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  text-align: right;
}
</style>
