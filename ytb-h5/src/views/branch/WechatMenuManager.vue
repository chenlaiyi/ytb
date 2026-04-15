<template>
  <div class="wechat-menu-manager">
    <!-- 页面头部 -->
    <van-nav-bar
      title="微信菜单管理"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- 分支机构信息 -->
    <div class="branch-info" v-if="branchInfo">
      <van-cell-group>
        <van-cell :title="branchInfo.name" label="分支机构" />
        <van-cell 
          v-if="wechatAccount"
          :title="wechatAccount.nick_name" 
          :label="`微信公众号 · ${wechatAccount.status === 'active' ? '已授权' : '未授权'}`"
        >
          <template #right-icon>
            <van-tag :type="wechatAccount.status === 'active' ? 'success' : 'danger'" size="medium">
              {{ wechatAccount.status === 'active' ? '已授权' : '未授权' }}
            </van-tag>
          </template>
        </van-cell>
        <van-cell v-else title="未关联微信公众号" label="请先关联微信公众号">
          <template #right-icon>
            <van-tag type="warning" size="medium">未关联</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ stats.total_groups || 0 }}</div>
          <div class="stat-label">菜单组总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.published_groups || 0 }}</div>
          <div class="stat-label">已发布菜单</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.success_rate || 0 }}%</div>
          <div class="stat-label">发布成功率</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.recent_publishes || 0 }}</div>
          <div class="stat-label">近期发布</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button 
        type="primary" 
        size="large" 
        block 
        @click="showCreateDialog = true"
        :disabled="!wechatAccount"
      >
        <van-icon name="plus" />
        创建菜单组
      </van-button>
      
      <van-button 
        size="large" 
        block 
        @click="syncFromWechat"
        :loading="syncing"
        :disabled="!wechatAccount"
      >
        <van-icon name="refresh" />
        同步微信菜单
      </van-button>
    </div>

    <!-- 菜单组列表 -->
    <div class="menu-groups-section">
      <van-divider content-position="left">菜单组列表</van-divider>
      
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-if="menuGroups.length === 0" class="empty-state">
            <van-empty description="暂无菜单组">
              <van-button 
                type="primary" 
                size="small" 
                @click="showCreateDialog = true"
                :disabled="!wechatAccount"
              >
                创建第一个菜单组
              </van-button>
            </van-empty>
          </div>

          <van-card
            v-for="group in menuGroups"
            :key="group.id"
            :title="group.title"
            class="menu-group-card"
            :class="{ 'published': group.status === 1 }"
          >
            <template #tags>
              <van-tag 
                :type="group.type === 1 ? 'primary' : 'warning'" 
                size="medium"
              >
                {{ group.type === 1 ? '默认菜单' : '个性化菜单' }}
              </van-tag>
              <van-tag 
                :type="group.status === 1 ? 'success' : 'default'" 
                size="medium"
              >
                {{ group.status === 1 ? '已发布' : '未发布' }}
              </van-tag>
            </template>

            <template #desc>
              <!-- 菜单项预览 -->
              <div class="menu-preview">
                <div class="menu-items">
                  <div
                    v-for="item in getFirstLevelItems(group.menu_items)"
                    :key="item.id"
                    class="menu-item"
                  >
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-type">{{ getMenuTypeText(item.type) }}</span>
                    <div v-if="getSubItems(group.menu_items, item.id).length > 0" class="sub-items">
                      <van-tag
                        v-for="subItem in getSubItems(group.menu_items, item.id)"
                        :key="subItem.id"
                        size="small"
                        type="default"
                      >
                        {{ subItem.name }}
                      </van-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 个性化菜单匹配规则 -->
              <div v-if="group.type === 3" class="match-rules">
                <div class="rules-title">匹配规则：</div>
                <div class="rules-tags">
                  <van-tag v-if="group.sex" size="small" type="primary">
                    {{ group.sex === '1' ? '男性' : '女性' }}用户
                  </van-tag>
                  <van-tag v-if="group.group_id" size="small" type="primary">
                    分组: {{ group.group_id }}
                  </van-tag>
                  <van-tag v-if="group.client_platform_type" size="small" type="primary">
                    {{ getClientPlatformText(group.client_platform_type) }}
                  </van-tag>
                  <van-tag v-if="group.language" size="small" type="primary">
                    {{ getLanguageText(group.language) }}
                  </van-tag>
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="time-info">
                <div v-if="group.published_at" class="publish-time">
                  发布时间：{{ formatTime(group.published_at) }}
                </div>
                <div class="create-time">
                  创建时间：{{ formatTime(group.created_at) }}
                </div>
              </div>
            </template>

            <template #footer>
              <div class="card-actions">
                <van-button size="small" @click="editGroup(group)">编辑</van-button>
                <van-button size="small" @click="duplicateGroup(group)">复制</van-button>
                <van-button 
                  v-if="group.status === 0" 
                  size="small" 
                  type="success" 
                  @click="publishGroup(group)"
                >
                  发布
                </van-button>
                <van-button 
                  v-if="group.status === 1" 
                  size="small" 
                  type="warning" 
                  @click="unpublishGroup(group)"
                >
                  取消发布
                </van-button>
                <van-button 
                  size="small" 
                  type="danger" 
                  @click="deleteGroup(group)"
                  :disabled="group.status === 1"
                >
                  删除
                </van-button>
              </div>
            </template>
          </van-card>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 发布日志 -->
    <div class="logs-section">
      <van-divider content-position="left">
        发布日志
        <van-button size="mini" type="primary" plain @click="loadPublishLogs">
          刷新
        </van-button>
      </van-divider>
      
      <van-cell-group v-if="publishLogs.length > 0">
        <van-cell
          v-for="log in publishLogs"
          :key="log.id"
          :title="getOperationText(log.operation)"
          :label="formatTime(log.created_at)"
          :class="log.status"
        >
          <template #right-icon>
            <van-icon 
              :name="log.status === 'success' ? 'success' : 'cross'" 
              :color="log.status === 'success' ? '#07c160' : '#ee0a24'"
            />
          </template>
          <template #value>
            <div v-if="log.menu_group" class="log-menu">{{ log.menu_group.title }}</div>
            <div v-if="log.error_message" class="log-error">{{ log.error_message }}</div>
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-empty v-else description="暂无发布日志" />
    </div>

    <!-- 创建/编辑菜单组弹窗 -->
    <van-popup 
      v-model:show="showCreateDialog" 
      position="bottom" 
      :style="{ height: '80%' }"
      round
    >
      <MenuGroupForm
        :group="currentGroup"
        :branch-id="branchId"
        @success="handleFormSuccess"
        @cancel="showCreateDialog = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import MenuGroupForm from './components/MenuGroupForm.vue'
import { branchWechatMenuApi, menuUtils } from '@/api/branchWechatMenu'

// Props
const props = defineProps({
  branchId: {
    type: [String, Number],
    required: true
  }
})

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const syncing = ref(false)
const branchInfo = ref(null)
const wechatAccount = ref(null)
const stats = ref(null)
const menuGroups = ref([])
const publishLogs = ref([])

// 弹窗状态
const showCreateDialog = ref(false)
const currentGroup = ref(null)

// 计算属性
const branchId = computed(() => props.branchId)

// 生命周期
onMounted(() => {
  loadData()
  loadPublishLogs()
})

// 方法
const loadData = async () => {
  try {
    const response = await branchWechatMenuApi.getMenuGroups(branchId.value)
    if (response.code === 0) {
      branchInfo.value = response.data.branch
      wechatAccount.value = response.data.wechat_account
      stats.value = response.data.stats
      menuGroups.value = response.data.menu_groups
    } else {
      showToast(response.message || '加载数据失败')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    showToast('加载数据失败')
  }
}

const loadPublishLogs = async () => {
  try {
    const response = await branchWechatMenuApi.getPublishLogs(branchId.value, 10)
    if (response.code === 0) {
      publishLogs.value = response.data
    }
  } catch (error) {
    console.error('加载发布日志失败:', error)
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await loadData()
  await loadPublishLogs()
  refreshing.value = false
}

const onLoad = () => {
  // 这里可以实现分页加载
  finished.value = true
}

const syncFromWechat = async () => {
  syncing.value = true
  try {
    const response = await branchWechatMenuApi.syncFromWechat(branchId.value)
    if (response.code === 0) {
      showToast('同步成功')
      await loadData()
      await loadPublishLogs()
    } else {
      showToast(response.message || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    showToast('同步失败')
  } finally {
    syncing.value = false
  }
}

const editGroup = (group) => {
  currentGroup.value = group
  showCreateDialog.value = true
}

const duplicateGroup = async (group) => {
  try {
    const title = await showDialog({
      title: '复制菜单组',
      message: '请输入新菜单组名称',
      showInput: true,
      inputPlaceholder: '菜单组名称',
      inputValue: `${group.title}_副本`
    })

    const response = await branchWechatMenuApi.duplicateGroup(branchId.value, group.id, { title })
    if (response.code === 0) {
      showToast('复制成功')
      await loadData()
    } else {
      showToast(response.message || '复制失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制菜单组失败:', error)
      showToast('复制失败')
    }
  }
}

const publishGroup = async (group) => {
  try {
    await showConfirmDialog({
      title: '确认发布',
      message: '确定要发布此菜单组到微信吗？'
    })

    const response = await branchWechatMenuApi.publishGroup(branchId.value, group.id)
    if (response.code === 0) {
      showToast('发布成功')
      await loadData()
      await loadPublishLogs()
    } else {
      showToast(response.message || '发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布菜单组失败:', error)
      showToast('发布失败')
    }
  }
}

const unpublishGroup = async (group) => {
  try {
    await showConfirmDialog({
      title: '确认取消发布',
      message: '确定要取消发布此菜单组吗？'
    })

    const response = await branchWechatMenuApi.deleteWechatMenu(branchId.value, group.id)
    if (response.code === 0) {
      showToast('取消发布成功')
      await loadData()
      await loadPublishLogs()
    } else {
      showToast(response.message || '取消发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消发布失败:', error)
      showToast('取消发布失败')
    }
  }
}

const deleteGroup = async (group) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除菜单组"${group.title}"吗？`
    })

    const response = await branchWechatMenuApi.deleteGroup(branchId.value, group.id)
    if (response.code === 0) {
      showToast('删除成功')
      await loadData()
    } else {
      showToast(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单组失败:', error)
      showToast('删除失败')
    }
  }
}

const handleFormSuccess = async () => {
  showCreateDialog.value = false
  currentGroup.value = null
  await loadData()
}

// 工具方法
const getFirstLevelItems = (menuItems) => {
  return menuItems.filter(item => item.level === 1).sort((a, b) => a.sort_order - b.sort_order)
}

const getSubItems = (menuItems, parentId) => {
  return menuItems.filter(item => item.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
}

const getMenuTypeText = (type) => {
  return menuUtils.getMenuItemTypeText(type)
}

const getClientPlatformText = (type) => {
  const typeMap = {
    '1': 'iOS',
    '2': 'Android',
    '3': '其他'
  }
  return typeMap[type] || type
}

const getLanguageText = (lang) => {
  const langMap = {
    'zh_CN': '简体中文',
    'zh_TW': '繁体中文',
    'en': '英文'
  }
  return langMap[lang] || lang
}

const getOperationText = (operation) => {
  const opMap = {
    'publish': '发布菜单',
    'delete': '删除菜单',
    'sync': '同步菜单'
  }
  return opMap[operation] || operation
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.wechat-menu-manager {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.branch-info {
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-section {
  margin: 12px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .stat-item {
      text-align: center;
      padding: 12px;
      background: #f7f8fa;
      border-radius: 6px;

      .stat-number {
        font-size: 24px;
        font-weight: 600;
        color: #1989fa;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #969799;
      }
    }
  }
}

.action-buttons {
  margin: 12px;
  display: flex;
  gap: 12px;

  .van-button {
    flex: 1;
    height: 44px;
    border-radius: 8px;
  }
}

.menu-groups-section {
  margin: 12px;

  .menu-group-card {
    margin-bottom: 12px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &.published {
      border-left: 4px solid #07c160;
    }

    :deep(.van-card__header) {
      padding: 16px 16px 0;
    }

    :deep(.van-card__content) {
      padding: 0 16px;
    }

    :deep(.van-card__footer) {
      padding: 12px 16px 16px;
      border-top: 1px solid #ebedf0;
    }
  }

  .menu-preview {
    margin: 12px 0;

    .menu-items {
      .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding: 8px;
        background: #f7f8fa;
        border-radius: 4px;

        .item-name {
          font-weight: 500;
          color: #323233;
        }

        .item-type {
          font-size: 12px;
          color: #969799;
        }

        .sub-items {
          margin-left: auto;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
      }
    }
  }

  .match-rules {
    margin: 12px 0;

    .rules-title {
      font-size: 12px;
      color: #969799;
      margin-bottom: 6px;
    }

    .rules-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  }

  .time-info {
    font-size: 12px;
    color: #969799;
    line-height: 1.4;
    margin-top: 8px;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .van-button {
      flex: 1;
      min-width: 60px;
    }
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
  }
}

.logs-section {
  margin: 12px;

  .van-cell-group {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .van-cell {
    &.success {
      background: #f0f9ff;
      border-left: 4px solid #07c160;
    }

    &.failed {
      background: #fef2f2;
      border-left: 4px solid #ee0a24;
    }
  }

  .log-menu {
    font-size: 12px;
    color: #646566;
  }

  .log-error {
    font-size: 12px;
    color: #ee0a24;
    margin-top: 2px;
  }
}
</style> 