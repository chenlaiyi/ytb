<template>
  <div class="forum-admin">
    <div class="page-header">
      <div>
        <h1>社区论坛管理</h1>
        <p>管理讨论区、帖子与用户互动，支持线下审核与快速处理。</p>
      </div>
      <el-space>
        <el-button type="primary" @click="openSectionDialog()">新增讨论区</el-button>
        <el-button :loading="refreshing" @click="refreshCurrentTab">刷新</el-button>
      </el-space>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="讨论区管理" name="sections">
          <el-form :inline="true" :model="sectionFilters" label-width="80px" class="filter-form" @submit.prevent>
            <el-form-item label="关键字">
              <el-input v-model.trim="sectionFilters.keyword" placeholder="讨论区名称/简介" clearable @keyup.enter.native="loadSections" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="sectionFilters.status" placeholder="全部" clearable style="width: 160px">
                <el-option label="启用" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSectionSearch">查询</el-button>
              <el-button @click="resetSectionFilters">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="sections" v-loading="sectionLoading" border empty-text="暂无讨论区" class="mt-16">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="讨论区" min-width="200">
              <template #default="{ row }">
                <div class="section-name">
                  <img
                    v-if="row.logo_url"
                    :src="row.logo_url"
                    alt="logo"
                    class="section-logo"
                  />
                  <span>{{ row.name }}</span>
                  <el-tag v-if="row.is_preset" size="small" type="success">预设</el-tag>
                </div>
                <div class="section-description">
                  <span v-if="row.hottest_thread" class="section-hot-thread">最热帖子：{{ row.hottest_thread.title }}</span>
                  <span class="section-desc-text">{{ row.description || '—' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="topics_count" label="帖子数" width="100" align="center" />
            <el-table-column label="热度" width="100" align="center">
              <template #default="{ row }">
                {{ row.popularity_score }}
              </template>
            </el-table-column>
            <el-table-column label="版主" min-width="160">
              <template #default="{ row }">
                <span>{{ row.moderator?.name || '后台管理员' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="论坛版主" min-width="200">
              <template #default="{ row }">
                <div v-if="row.moderator_forum_user" class="forum-user-cell">
                  <el-avatar :size="24" :src="row.moderator_forum_user.avatar" />
                  <span>{{ row.moderator_forum_user.nickname }}</span>
                </div>
                <span v-else class="secondary-text">未设置</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" type="primary" text @click="openSectionDialog(row)">编辑</el-button>
                  <el-button
                    size="small"
                    type="warning"
                    text
                    @click="toggleSectionStatus(row)"
                  >
                    {{ row.status === 'active' ? '停用' : '启用' }}
                  </el-button>
                  <el-popconfirm
                    title="归档后将自动关闭该讨论区及全部帖子，确认执行？"
                    width="280"
                    @confirm="archiveSection(row)"
                  >
                    <template #reference>
                      <el-button size="small" type="danger" text>归档</el-button>
                    </template>
                  </el-popconfirm>
                </el-space>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="sectionPagination.page"
              v-model:page-size="sectionPagination.per_page"
              :page-sizes="[10, 20, 50]"
              :total="sectionPagination.total"
              background
              layout="total, sizes, prev, pager, next"
              @current-change="loadSections"
              @size-change="handleSectionPageSizeChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="帖子管理" name="threads">
          <el-form :inline="true" :model="threadFilters" label-width="80px" class="filter-form" @submit.prevent>
            <el-form-item label="讨论区">
              <el-select v-model="threadFilters.section_id" placeholder="全部讨论区" clearable filterable style="width: 200px">
                <el-option v-for="section in sectionOptions" :key="section.id" :label="section.name" :value="section.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="threadFilters.status" placeholder="全部状态" clearable style="width: 160px">
                <el-option label="已发布" value="published" />
                <el-option label="待审核" value="pending" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input v-model.trim="threadFilters.keyword" placeholder="标题/内容" clearable @keyup.enter.native="loadThreads" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleThreadSearch">查询</el-button>
              <el-button @click="resetThreadFilters">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="threads" v-loading="threadLoading" border empty-text="暂无帖子" class="mt-16">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="标题" min-width="220">
              <template #default="{ row }">
                <div class="thread-title">
                  <span>{{ row.title }}</span>
                  <el-tag v-if="row.is_pinned" size="small" type="danger">置顶</el-tag>
                </div>
                <div class="thread-meta">发表于 {{ row.created_at || '—' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="讨论区" min-width="160">
              <template #default="{ row }">
                {{ row.section?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="作者" min-width="160">
              <template #default="{ row }">
                {{ row.author?.name || '匿名用户' }}
              </template>
            </el-table-column>
            <el-table-column prop="replies_count" label="回复数" width="100" align="center" />
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="threadStatusType(row.status)">{{ threadStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最后回复" prop="last_replied_at" width="180" />
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" type="primary" text @click="viewThread(row.id)">详情</el-button>
                  <el-dropdown @command="(cmd) => handleThreadAction(cmd, row)">
                    <el-button size="small" text type="warning">
                      审核操作
                      <el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="{ type: 'status', value: 'published' }">设为发布</el-dropdown-item>
                        <el-dropdown-item :command="{ type: 'status', value: 'pending' }">设为待审核</el-dropdown-item>
                        <el-dropdown-item :command="{ type: 'status', value: 'archived' }">归档</el-dropdown-item>
                        <el-dropdown-item :command="{ type: 'pin', value: !row.is_pinned }">
                          {{ row.is_pinned ? '取消置顶' : '置顶' }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-space>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-pagination">
            <el-pagination
              v-model:current-page="threadPagination.page"
              v-model:page-size="threadPagination.per_page"
              :page-sizes="[10, 20, 50]"
              :total="threadPagination.total"
              background
              layout="total, sizes, prev, pager, next"
              @current-change="loadThreads"
              @size-change="handleThreadPageSizeChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="sectionDialog.visible"
      :title="sectionDialog.isEdit ? '编辑讨论区' : '新增讨论区'"
      width="520px"
      @closed="resetSectionDialog"
    >
      <el-form :model="sectionDialog.form" :rules="sectionRules" label-width="90px" ref="sectionFormRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="sectionDialog.form.name" maxlength="80" show-word-limit placeholder="请输入讨论区名称" />
        </el-form-item>
        <el-form-item label="展示Logo">
          <ImageUpload
            v-model="sectionDialog.form.logo_url"
            :width="80"
            :height="80"
            :size="1"
            :show-text="false"
            upload-type="logo"
            upload-folder="forum/logos"
            tips="建议尺寸：200x200px，支持 JPG/PNG，≤1MB"
          />
        </el-form-item>
        <el-form-item label="论坛版主">
          <el-select
            v-model="sectionDialog.form.moderator_forum_user_id"
            filterable
            remote
            clearable
            placeholder="搜索论坛用户昵称"
            :remote-method="handleForumUserSearch"
            :loading="forumUserLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in forumUserOptions"
              :key="user.id"
              :label="user.nickname"
              :value="user.id"
            >
              <div class="forum-user-option">
                <el-avatar :size="24" :src="user.avatar" />
                <span>{{ user.nickname }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model.trim="sectionDialog.form.description" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="简要描述讨论区用途" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="sectionDialog.form.status" style="width: 200px">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="sectionDialog.form.sort_order" :min="-9999" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sectionDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="sectionDialog.saving" @click="submitSectionForm">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="threadDetail.visible" :title="threadDetail.data?.title || '帖子详情'" size="50%" destroy-on-close>
      <template #default>
        <div v-if="threadDetail.loading" class="drawer-loading">
          <el-skeleton rows="6" animated />
        </div>
        <div v-else-if="threadDetail.data">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="讨论区">{{ threadDetail.data.section?.name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="作者">{{ threadDetail.data.author?.name || '匿名用户' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ threadDetail.data.created_at }}</el-descriptions-item>
            <el-descriptions-item label="最后回复">{{ threadDetail.data.last_replied_at || '—' }}</el-descriptions-item>
            <el-descriptions-item label="内容">{{ threadDetail.data.content }}</el-descriptions-item>
            <el-descriptions-item label="配图">
              <template v-if="threadDetail.data.images?.length">
                <div class="thread-image-list">
                  <el-image
                    v-for="(img, index) in threadDetail.data.images"
                    :key="index"
                    :src="img"
                    :preview-src-list="threadDetail.data.images"
                    fit="cover"
                    class="preview-image"
                    hide-on-click-modal
                    preview-teleported
                  />
                </div>
              </template>
              <span v-else>—</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider><span>回复列表</span></el-divider>
          <el-empty v-if="!threadDetail.data.replies?.length" description="暂无回复" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="reply in threadDetail.data.replies"
              :key="reply.id"
              :timestamp="reply.created_at"
            >
              <div class="reply-item">
                <div class="reply-item__header">
                  <span class="name">{{ reply.author?.name || '匿名用户' }}</span>
                  <el-tag size="small" :type="reply.status === 'published' ? 'success' : 'info'">
                    {{ threadStatusText(reply.status) }}
                  </el-tag>
                </div>
                <p class="reply-item__content">{{ reply.content }}</p>
                <div v-if="reply.images?.length" class="reply-image-list">
                  <el-image
                    v-for="(img, index) in reply.images"
                    :key="index"
                    :src="img"
                    :preview-src-list="reply.images"
                    fit="cover"
                    class="preview-image"
                    hide-on-click-modal
                    preview-teleported
                  />
                </div>
                <div class="reply-item__actions">
                  <el-dropdown @command="(cmd) => handleReplyAction(cmd, reply)">
                    <span class="action-link">更改状态</span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="published">设为发布</el-dropdown-item>
                        <el-dropdown-item command="pending">设为待审核</el-dropdown-item>
                        <el-dropdown-item command="archived">归档隐藏</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import {
  getForumSections,
  createForumSection,
  updateForumSection,
  updateForumSectionStatus,
  archiveForumSection,
  getForumThreads,
  getForumThreadDetail,
  updateForumThread,
  updateForumReplyStatus,
  getForumUsers
} from '@/api/v1/forum'

const activeTab = ref('sections')
const refreshing = ref(false)

// ======== 讨论区管理 ========
const sectionLoading = ref(false)
const sections = ref([])
const sectionOptions = ref([])
const sectionFilters = reactive({ keyword: '', status: '' })
const sectionPagination = reactive({ page: 1, per_page: 10, total: 0 })

const sectionDialog = reactive({
  visible: false,
  isEdit: false,
  saving: false,
  form: {
    id: null,
    name: '',
    description: '',
    logo_url: '',
    moderator_forum_user_id: null,
    status: 'active',
    sort_order: 0
  }
})

const sectionRules = {
  name: [
    { required: true, message: '请填写讨论区名称', trigger: 'blur' },
    { min: 2, max: 80, message: '名称长度需在2~80个字符之间', trigger: 'blur' }
  ]
}

const sectionFormRef = ref()
const forumUserOptions = ref([])
const forumUserLoading = ref(false)

const loadSections = async () => {
  sectionLoading.value = true
  try {
    const params = {
      page: sectionPagination.page,
      per_page: sectionPagination.per_page,
      ...sectionFilters
    }
    const response = await getForumSections(params)

    if (response.code !== 0) {
      throw new Error(response.message || '加载讨论区失败')
    }

    const payload = response.data || {}
    sections.value = Array.isArray(payload.data) ? payload.data : []
    sectionPagination.total = Number(payload.total) || 0
    sectionPagination.page = Number(payload.current_page) || sectionPagination.page
    sectionPagination.per_page = Number(payload.per_page) || sectionPagination.per_page
  } catch (error) {
    console.error('[Admin Forum] load sections failed', error)
    ElMessage.error(error.message || '加载讨论区列表失败')
  } finally {
    sectionLoading.value = false
  }
}

const handleSectionSearch = () => {
  sectionPagination.page = 1
  loadSections()
}

const resetSectionFilters = () => {
  sectionFilters.keyword = ''
  sectionFilters.status = ''
  sectionPagination.page = 1
  loadSections()
}

const handleSectionPageSizeChange = (size) => {
  sectionPagination.per_page = size
  sectionPagination.page = 1
  loadSections()
}

const statusText = (status) => {
  if (status === 'active') return '启用'
  if (status === 'inactive') return '停用'
  return status
}

const openSectionDialog = (section = null) => {
  sectionDialog.visible = true
  sectionDialog.isEdit = Boolean(section)
  if (section) {
    sectionDialog.form = {
      id: section.id,
      name: section.name,
      description: section.description,
      logo_url: section.logo_url || '',
      moderator_forum_user_id: section.moderator_forum_user_id || null,
      status: section.status,
      sort_order: section.sort_order || 0
    }
    if (section.moderator_forum_user) {
      ensureForumUserOption(section.moderator_forum_user)
    }
  } else {
    sectionDialog.form = {
      id: null,
      name: '',
      description: '',
      logo_url: '',
      moderator_forum_user_id: null,
      status: 'active',
      sort_order: 0
    }
  }

  if (forumUserOptions.value.length === 0) {
    loadForumUsers()
  }
}

const resetSectionDialog = () => {
  if (sectionFormRef.value) {
    sectionFormRef.value.clearValidate()
  }
}

const normalizeForumUserOption = (item) => {
  if (!item) return null
  const appUser = item.app_user || {}
  return {
    id: Number(item.id),
    nickname: item.nickname || appUser.wechat_nickname || appUser.nickname || appUser.name || '未命名用户',
    avatar: item.avatar || appUser.wechat_avatar || appUser.avatar || '',
    app_user_id: appUser.id || null
  }
}

const ensureForumUserOption = (item) => {
  const normalized = normalizeForumUserOption(item)
  if (!normalized) return
  if (!forumUserOptions.value.some((option) => option.id === normalized.id)) {
    forumUserOptions.value.push(normalized)
  }
}

const loadForumUsers = async (keyword = '') => {
  forumUserLoading.value = true
  try {
    const response = await getForumUsers({
      keyword: keyword || undefined,
      per_page: 20
    })

    if (response.code !== 0) {
      throw new Error(response.message || '获取论坛用户失败')
    }

    const payload = response.data || {}
    const list = Array.isArray(payload.data) ? payload.data : []
    forumUserOptions.value = list.map(normalizeForumUserOption).filter(Boolean)

    if (sectionDialog.form.moderator_forum_user_id) {
      const matched = list.find(item => item.id === sectionDialog.form.moderator_forum_user_id)
      if (matched) {
        ensureForumUserOption(matched)
      }
    }
  } catch (error) {
    console.error('[Admin Forum] load forum users failed', error)
  } finally {
    forumUserLoading.value = false
  }
}

const handleForumUserSearch = (query) => {
  loadForumUsers(query)
}

const submitSectionForm = () => {
  if (!sectionFormRef.value) return
  sectionFormRef.value.validate(async (valid) => {
    if (!valid) return
    sectionDialog.saving = true
    try {
      const moderatorForumUserId = sectionDialog.form.moderator_forum_user_id

      const payload = {
        name: sectionDialog.form.name,
        description: sectionDialog.form.description,
        logo_url: sectionDialog.form.logo_url,
        status: sectionDialog.form.status,
        sort_order: sectionDialog.form.sort_order,
        moderator_admin_id: sectionDialog.form.moderator_admin_id,
        moderator_forum_user_id: moderatorForumUserId ? Number(moderatorForumUserId) : null
      }

      if (sectionDialog.isEdit && sectionDialog.form.id) {
        await updateForumSection(sectionDialog.form.id, payload)
        ElMessage.success('讨论区更新成功')
      } else {
        await createForumSection(payload)
        ElMessage.success('讨论区创建成功')
      }
      sectionDialog.visible = false
      loadSections()
      loadSectionOptions()
    } catch (error) {
      console.error('[Admin Forum] save section failed', error)
    } finally {
      sectionDialog.saving = false
    }
  })
}

const toggleSectionStatus = async (section) => {
  const targetStatus = section.status === 'active' ? 'inactive' : 'active'
  try {
    await updateForumSectionStatus(section.id, targetStatus)
    ElMessage.success(`${targetStatus === 'active' ? '已启用' : '已停用'}讨论区`)
    loadSections()
    loadSectionOptions()
  } catch (error) {
    console.error('[Admin Forum] toggle status failed', error)
  }
}

const archiveSection = async (section) => {
  try {
    await archiveForumSection(section.id)
    ElMessage.success('讨论区已归档')
    loadSections()
    loadSectionOptions()
  } catch (error) {
    console.error('[Admin Forum] archive section failed', error)
  }
}

// ======== 帖子管理 ========
const threadLoading = ref(false)
const threads = ref([])
const threadFilters = reactive({ keyword: '', status: '', section_id: '' })
const threadPagination = reactive({ page: 1, per_page: 10, total: 0 })

const loadThreads = async () => {
  threadLoading.value = true
  try {
    const params = {
      page: threadPagination.page,
      per_page: threadPagination.per_page,
      keyword: threadFilters.keyword || undefined,
      status: threadFilters.status || undefined,
      section_id: threadFilters.section_id || undefined
    }
    const response = await getForumThreads(params)

    if (response.code !== 0) {
      throw new Error(response.message || '加载帖子失败')
    }

    const payload = response.data || {}
    threads.value = Array.isArray(payload.data) ? payload.data : []
    threadPagination.total = Number(payload.total) || 0
    threadPagination.page = Number(payload.current_page) || threadPagination.page
    threadPagination.per_page = Number(payload.per_page) || threadPagination.per_page
  } catch (error) {
    console.error('[Admin Forum] load threads failed', error)
    ElMessage.error(error.message || '加载帖子列表失败')
  } finally {
    threadLoading.value = false
  }
}

const handleThreadSearch = () => {
  threadPagination.page = 1
  loadThreads()
}

const resetThreadFilters = () => {
  threadFilters.keyword = ''
  threadFilters.status = ''
  threadFilters.section_id = ''
  threadPagination.page = 1
  loadThreads()
}

const handleThreadPageSizeChange = (size) => {
  threadPagination.per_page = size
  threadPagination.page = 1
  loadThreads()
}

const threadStatusText = (status) => {
  switch (status) {
    case 'published':
      return '已发布'
    case 'pending':
      return '待审核'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}

const threadStatusType = (status) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'pending':
      return 'warning'
    case 'archived':
      return 'info'
    default:
      return 'default'
  }
}

const handleThreadAction = async (command, thread) => {
  const payload = {}
  if (command.type === 'status') {
    payload.status = command.value
  }
  if (command.type === 'pin') {
    payload.is_pinned = command.value
  }

  if (Object.keys(payload).length === 0) return

  try {
    await updateForumThread(thread.id, payload)
    ElMessage.success('帖子状态已更新')
    loadThreads()
    if (threadDetail.visible && threadDetail.data?.id === thread.id) {
      Object.assign(threadDetail.data, { ...threadDetail.data, ...payload })
    }
  } catch (error) {
    console.error('[Admin Forum] update thread failed', error)
  }
}

const threadDetail = reactive({
  visible: false,
  loading: false,
  data: null
})

const viewThread = async (threadId) => {
  threadDetail.visible = true
  threadDetail.loading = true
  threadDetail.data = null
  try {
    const response = await getForumThreadDetail(threadId)
    threadDetail.data = response.data
  } catch (error) {
    console.error('[Admin Forum] load thread detail failed', error)
    ElMessage.error('加载帖子详情失败')
  } finally {
    threadDetail.loading = false
  }
}

const handleReplyAction = async (status, reply) => {
  try {
    await updateForumReplyStatus(reply.id, status)
    ElMessage.success('回复状态已更新')
    if (threadDetail.data) {
      reply.status = status
    }
  } catch (error) {
    console.error('[Admin Forum] update reply status failed', error)
  }
}

// ======== 通用 ========
const refreshCurrentTab = async () => {
  refreshing.value = true
  try {
    if (activeTab.value === 'sections') {
      await loadSections()
      await loadSectionOptions()
    } else {
      await loadThreads()
    }
  } finally {
    refreshing.value = false
  }
}

const handleTabChange = (name) => {
  if (name === 'threads') {
    loadThreads()
  }
}

onMounted(async () => {
  await loadSections()
  await loadSectionOptions()
  await loadForumUsers()
})

const loadSectionOptions = async () => {
  try {
    const response = await getForumSections({ page: 1, per_page: 200 })
    if (response.code !== 0) {
      throw new Error(response.message)
    }
    const payload = response.data || {}
    sectionOptions.value = Array.isArray(payload.data)
      ? payload.data.map(item => ({ id: item.id, name: item.name }))
      : []
  } catch (error) {
    console.error('[Admin Forum] load section options failed', error)
  }
}
</script>

<style scoped>
.forum-admin {
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
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}

.filter-form {
  margin-bottom: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.section-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.section-description {
  color: #888;
  font-size: 13px;
  margin-top: 4px;
}

.forum-user-option,
.forum-user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.secondary-text {
  color: #999;
}

.section-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: contain;
  border: 1px solid #e8ecff;
  background-color: #fff;
}

.section-hot-thread {
  display: block;
  color: #1d4ed8;
  font-weight: 500;
}

.section-desc-text {
  display: block;
}

.thread-image-list,
.reply-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

.thread-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.thread-meta {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.reply-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reply-item__header {
  display: flex;
  justify-content: space-between;
}

.reply-item__content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.reply-item__actions {
  display: flex;
  justify-content: flex-end;
}

.action-link {
  color: var(--el-color-primary);
  cursor: pointer;
}

.drawer-loading {
  padding: 24px;
}
</style>
