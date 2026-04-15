<template>
  <div class="ytb-team">
    <van-nav-bar title="我的团队" left-arrow @click-left="goBack" />

    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ stats.direct_total || 0 }}</div>
        <div class="stat-label">直推总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.direct_scp || 0 }}</div>
        <div class="stat-label">直推CP伙伴</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.direct_team_cp || 0 }}</div>
        <div class="stat-label">直推VIPCP伙伴</div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filters.role" :options="roleOptions" @change="loadMembers" />
      </van-dropdown-menu>
      <van-search 
        v-model="filters.keyword" 
        placeholder="搜索昵称/姓名/手机号"
        @search="loadMembers"
        @clear="loadMembers"
      />
    </div>

    <!-- 成员列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="member-list">
          <div class="member-item" v-for="member in members" :key="member.id">
            <van-image
              round
              width="48"
              height="48"
              :src="member.avatar || defaultAvatar"
            />
            <div class="member-info">
              <div class="member-name">
                {{ member.nickname || member.real_name || '未知用户' }}
                <van-tag :type="getRoleTagType(member.role)" size="small">
                  {{ member.role_name }}
                </van-tag>
              </div>
              <div class="member-detail">
                <span v-if="member.phone">{{ maskPhone(member.phone) }}</span>
                <span>加入时间：{{ formatDate(member.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty v-if="!loading && members.length === 0" description="暂无团队成员" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, getTeamMembers, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 我的团队')

const router = useRouter()

// 默认头像
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="50"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle">Y</text></svg>'

// 状态
const stats = ref({})
const members = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const perPage = 20

const filters = reactive({
  role: '',
  keyword: ''
})

const roleOptions = [
  { text: '全部角色', value: '' },
  { text: '普通用户', value: 'normal' },
  { text: 'CP伙伴', value: 'scp' },
  { text: 'VIPCP伙伴', value: 'team_cp' }
]

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/ytb/login')
    return
  }

  await loadStats()
  // 不在这里调用 loadMembers，让 van-list 的 @load 自动触发
})

// 加载统计
const loadStats = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0) {
      stats.value = res.data.team_stats || {}
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 加载成员
const loadMembers = async () => {
  page.value = 1
  finished.value = false
  members.value = []
  await loadMore()
}

// 加载更多
const loadMore = async () => {
  if (finished.value) return
  
  loading.value = true
  try {
    const res = await getTeamMembers({
      page: page.value,
      per_page: perPage,
      role: filters.role,
      keyword: filters.keyword
    })
    
    if (res.code === 0) {
      const list = res.data.list || []
      if (page.value === 1) {
        members.value = list
      } else {
        members.value.push(...list)
      }
      
      if (list.length < perPage) {
        finished.value = true
      } else {
        page.value++
      }
    } else {
      finished.value = true
    }
  } catch (error) {
    console.error('获取成员失败:', error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadStats()
  await loadMembers()
  refreshing.value = false
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  switch (role) {
    case 'scp': return 'warning'
    case 'team_cp': return 'danger'
    default: return 'default'
  }
}

// 手机号脱敏
const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-team {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

.filter-bar {
  background: white;
  display: flex;
  align-items: center;
  padding-right: 12px;
}

.filter-bar .van-dropdown-menu {
  flex-shrink: 0;
}

.filter-bar .van-search {
  flex: 1;
}

.member-list {
  padding: 12px;
}

.member-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-detail {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  display: flex;
  gap: 12px;
}
</style>
