<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><Opportunity /></el-icon>
            准客户管理
          </h1>
          <p class="page-description">筛选有手机号、非支付机构、未提交进件的潜在客户</p>
        </div>
        <div class="header-actions">
          <el-button
            type="warning"
            size="large"
            :disabled="selectedRows.length === 0"
            @click="showAssignDialog"
          >
            <el-icon><Share /></el-icon>
            分配给机构 ({{ selectedRows.length }})
          </el-button>
          <el-button type="success" size="large" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button type="primary" size="large" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-row">
      <div class="stats-card total">
        <div class="stats-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stats-info">
          <div class="stats-value">{{ statisticsData.total_prospects }}</div>
          <div class="stats-label">准客户总数</div>
        </div>
      </div>

      <div class="stats-card today">
        <div class="stats-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stats-info">
          <div class="stats-value">{{ statisticsData.today_prospects }}</div>
          <div class="stats-label">今日新增</div>
          <div class="stats-sub">昨日: {{ statisticsData.yesterday_prospects }}</div>
        </div>
      </div>

      <div class="stats-card week">
        <div class="stats-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stats-info">
          <div class="stats-value">{{ statisticsData.week_prospects }}</div>
          <div class="stats-label">本周新增</div>
        </div>
      </div>

      <div class="stats-card month">
        <div class="stats-icon">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="stats-info">
          <div class="stats-value">{{ statisticsData.month_prospects }}</div>
          <div class="stats-label">本月新增</div>
        </div>
      </div>
    </div>

    <!-- 标签页切换 -->
    <el-card class="tab-card" shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="准客户列表" name="prospect-list" />
        <el-tab-pane label="已分配机构" name="assigned-institutions" />
      </el-tabs>
    </el-card>

    <!-- 已分配机构视图 -->
    <div v-if="activeTab === 'assigned-institutions'" class="assigned-institutions-view">
      <!-- 机构搜索 -->
      <el-card class="institution-filter-card" shadow="hover">
        <el-form :inline="true">
          <el-form-item>
            <el-input
              v-model="institutionKeyword"
              placeholder="搜索机构名称或编号"
              clearable
              style="width: 300px;"
              prefix-icon="Search"
              @keyup.enter="fetchAssignedInstitutions"
            >
              <template #append>
                <el-button @click="fetchAssignedInstitutions" icon="Search" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 三栏布局 -->
      <div class="three-column-layout">
        <!-- 左侧：机构列表 -->
        <el-card class="institution-list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>机构列表</span>
              <span class="institution-count">{{ assignedInstitutions.length }} 个机构</span>
            </div>
          </template>
          <div v-loading="assignedInstitutionLoading">
            <div
              v-for="inst in assignedInstitutions"
              :key="inst.institution_number"
              class="institution-item"
              :class="{ active: selectedInstitution?.institution_number === inst.institution_number }"
              @click="selectInstitution(inst)"
            >
              <div class="institution-name">
                <el-icon><OfficeBuilding /></el-icon>
                {{ inst.institution_name || inst.institution_number }}
              </div>
              <div class="institution-stats">
                <span class="total-count">共 {{ inst.total_count }} 人</span>
                <div class="status-tags">
                  <el-tag type="warning" size="small">{{ inst.pending_count }} 待跟进</el-tag>
                  <el-tag type="primary" size="small">{{ inst.following_count }} 跟进中</el-tag>
                </div>
              </div>
            </div>
            <div v-if="assignedInstitutions.length === 0 && !assignedInstitutionLoading" class="empty-state">
              暂无数据
            </div>
          </div>
        </el-card>

        <!-- 中间：机构下准客户列表 -->
        <el-card class="prospect-list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>准客户列表</span>
              <span v-if="selectedInstitution">
                {{ institutionProspects.length }} 人
              </span>
            </div>
          </template>
          <div v-loading="prospectLoading">
            <div
              v-for="prospect in institutionProspects"
              :key="prospect.id"
              class="prospect-item"
              :class="{ active: selectedProspect?.id === prospect.id }"
              @click="selectProspect(prospect)"
            >
              <div class="prospect-info">
                <el-avatar :size="32" :src="prospect.avatar">
                  {{ (prospect.prospect_name || '?').charAt(0) }}
                </el-avatar>
                <div class="prospect-details">
                  <div class="prospect-name">{{ prospect.prospect_name || prospect.wechat_nickname || '未设置' }}</div>
                  <div class="prospect-phone">{{ prospect.prospect_phone }}</div>
                </div>
              </div>
              <div class="prospect-meta">
                <el-tag :type="getAssignmentStatusType(prospect.status)" size="small">
                  {{ getStatusText(prospect.status) }}
                </el-tag>
                <div class="follow-info">
                  跟进 {{ prospect.follow_count || 0 }} 次
                </div>
              </div>
            </div>
            <div v-if="!selectedInstitution" class="empty-state">
              请先选择机构
            </div>
            <div v-else-if="institutionProspects.length === 0 && !prospectLoading" class="empty-state">
              该机构下暂无准客户
            </div>
          </div>
        </el-card>

        <!-- 右侧：跟进明细 -->
        <el-card class="follow-detail-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>跟进明细</span>
              <div class="header-actions" v-if="selectedProspect">
                <el-button type="warning" size="small" @click="showReassignDialog(selectedProspect)">
                  <el-icon><RefreshRight /></el-icon>
                  再次分配
                </el-button>
                <el-button type="primary" size="small" @click="showFollowUpDialog(selectedProspect)">
                  <el-icon><Document /></el-icon>
                  添加跟进
                </el-button>
              </div>
            </div>
          </template>
          <div v-loading="detailLoading">
            <div v-if="selectedProspect" class="prospect-detail">
              <!-- 基本信息 -->
              <div class="detail-section">
                <h4>基本信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>姓名：</label>
                    <span>{{ prospectDetail.prospect?.name || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>手机：</label>
                    <span>{{ prospectDetail.prospect?.phone || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>微信：</label>
                    <span>{{ prospectDetail.prospect?.wechat_nickname || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>分配时间：</label>
                    <span>{{ prospectDetail.assignment?.assigned_at || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- 分配信息 -->
              <div class="detail-section" v-if="prospectDetail.assignment">
                <h4>分配信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>分配机构：</label>
                    <span>{{ prospectDetail.assignment.institution_name || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>当前状态：</label>
                    <el-tag :type="getAssignmentStatusType(prospectDetail.assignment.status)" size="small">
                      {{ getStatusText(prospectDetail.assignment.status) }}
                    </el-tag>
                  </div>
                  <div class="info-item">
                    <label>跟进次数：</label>
                    <span>{{ prospectDetail.assignment.follow_count || 0 }} 次</span>
                  </div>
                  <div class="info-item">
                    <label>最后跟进：</label>
                    <span>{{ prospectDetail.assignment.last_follow_at || '暂无' }}</span>
                  </div>
                </div>
              </div>

              <!-- 跟进记录 -->
              <div class="detail-section">
                <h4>跟进记录 ({{ prospectDetail.follow_ups?.length || 0 }})</h4>
                <el-timeline v-if="prospectDetail.follow_ups?.length > 0">
                  <el-timeline-item
                    v-for="(follow, index) in prospectDetail.follow_ups"
                    :key="index"
                    :timestamp="follow.created_at"
                    placement="top"
                  >
                    <el-card shadow="hover" class="follow-card">
                      <div class="follow-header">
                        <el-tag size="small">{{ follow.follow_type_text }}</el-tag>
                        <el-tag :type="getResultType(follow.result)" size="small">
                          {{ follow.result_text }}
                        </el-tag>
                      </div>
                      <div class="follow-content">{{ follow.content }}</div>
                      <div class="follow-footer" v-if="follow.next_follow_date">
                        下次跟进：{{ follow.next_follow_date }}
                        <span v-if="follow.next_follow_plan"> - {{ follow.next_follow_plan }}</span>
                      </div>
                      <div class="follow-by">
                        跟进人：{{ follow.follow_by_name }}
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
                <div v-else class="empty-state">暂无跟进记录</div>
              </div>

              <!-- 操作日志 -->
              <div class="detail-section">
                <h4>操作日志</h4>
                <el-timeline v-if="prospectDetail.logs?.length > 0">
                  <el-timeline-item
                    v-for="(log, index) in prospectDetail.logs"
                    :key="index"
                    :timestamp="log.created_at"
                    placement="top"
                  >
                    <div class="log-item">
                      <el-tag size="small" :type="getLogActionType(log.action)">
                        {{ log.action_text }}
                      </el-tag>
                      <span class="log-text" v-if="log.institution_name">{{ log.institution_name }}</span>
                      <div class="log-remark" v-if="log.remark">{{ log.remark }}</div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <div v-else class="empty-state">暂无操作日志</div>
              </div>
            </div>
            <div v-else class="empty-state">
              请先选择准客户
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 智能筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="filter-header">
          <el-icon class="filter-icon"><Search /></el-icon>
          <span class="filter-title">智能筛选</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item>
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索姓名/手机/微信昵称"
            clearable
            style="width: 240px;"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="queryParams.assignment_status"
            placeholder="分配/跟进状态"
            clearable
            style="width: 160px;"
          >
            <el-option label="未分配" value="unassigned" />
            <el-option label="待跟进" value="pending" />
            <el-option label="跟进中" value="following" />
            <el-option label="已转化" value="converted" />
            <el-option label="无效" value="invalid" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格（仅在准客户列表标签页显示） -->
    <el-card v-if="activeTab === 'prospect-list'" class="table-card" shadow="hover">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar" v-if="row.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <el-avatar :size="40" v-else>
                {{ (row.name || row.wechat_nickname || '?').charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.name || row.wechat_nickname || '未设置' }}</div>
                <div class="user-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分配/跟进状态" width="130">
          <template #default="{ row }">
            <el-tag
              :type="getAssignmentStatusType(row.assignment_status)"
              size="small"
            >
              {{ row.assignment_status_label }}
            </el-tag>
            <div v-if="row.assigned_institution_name" class="assigned-institution">
              {{ row.assigned_institution_name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分配机构" width="160">
          <template #default="{ row }">
            <template v-if="row.assignment_id">
              <div class="assigned-info">
                <div class="assigned-name">{{ row.assigned_institution_name || '-' }}</div>
                <div class="assigned-id text-muted">ID: {{ row.id }}</div>
              </div>
            </template>
            <span v-else class="text-muted">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">
            <div>{{ row.created_at }}</div>
            <div class="register-days">{{ row.register_days }}天前</div>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">
            <span v-if="row.last_login_time">{{ row.last_login_time }}</span>
            <span v-else class="text-muted">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-dropdown trigger="click" v-if="row.assignment_id">
              <el-button type="primary" link size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showFollowUpDialog(row)">
                    <el-icon><Document /></el-icon>
                    添加跟进
                  </el-dropdown-item>
                  <el-dropdown-item @click="showAssignmentLogs(row)">
                    <el-icon><Clock /></el-icon>
                    分配记录
                  </el-dropdown-item>
                  <el-dropdown-item @click="showFollowUpHistory(row)">
                    <el-icon><List /></el-icon>
                    跟进历史
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="showReassignDialog(row)">
                    <el-icon><RefreshRight /></el-icon>
                    再次分配
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleCancelAssign(row)">
                    <el-icon><Close /></el-icon>
                    取消分配
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              v-else
              type="warning"
              link
              size="small"
              @click="showAssignDialogSingle(row)"
            >
              分配
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[15, 30, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 分配弹窗 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配客户给机构"
      width="500px"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="已选客户">
          <el-tag type="info">{{ assignForm.prospectIds.length }} 个客户</el-tag>
        </el-form-item>
        <el-form-item label="选择机构" required>
          <el-select
            v-model="assignForm.institution_number"
            filterable
            remote
            reserve-keyword
            placeholder="输入机构名称或编号搜索"
            :remote-method="searchInstitutions"
            :loading="institutionLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in institutionList"
              :key="item.number"
              :label="`${item.name} (${item.number})`"
              :value="item.number"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可选，添加分配备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="handleAssign">
          确认分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 再次分配弹窗 -->
    <el-dialog
      v-model="reassignDialogVisible"
      title="再次分配客户"
      width="500px"
    >
      <el-form :model="reassignForm" label-width="100px">
        <el-form-item label="当前客户">
          <div class="current-info">
            <span>{{ reassignForm.prospect_name || reassignForm.prospect_phone }}</span>
          </div>
        </el-form-item>
        <el-form-item label="原分配机构">
          <span class="text-warning">{{ reassignForm.current_institution_name }}</span>
        </el-form-item>
        <el-form-item label="新分配机构" required>
          <el-select
            v-model="reassignForm.institution_number"
            filterable
            remote
            reserve-keyword
            placeholder="输入机构名称或编号搜索"
            :remote-method="searchInstitutions"
            :loading="institutionLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in institutionList"
              :key="item.number"
              :label="`${item.name} (${item.number})`"
              :value="item.number"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="再分配原因">
          <el-input
            v-model="reassignForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入再分配原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reassignDialogVisible = false">取消</el-button>
        <el-button type="warning" :loading="reassignLoading" @click="handleReassign">
          确认再分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加跟进记录弹窗 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="添加跟进记录"
      width="600px"
    >
      <el-form :model="followUpForm" label-width="100px" :rules="followUpRules" ref="followUpFormRef">
        <el-form-item label="客户">
          <span>{{ followUpForm.prospect_name || followUpForm.prospect_phone }}</span>
        </el-form-item>
        <el-form-item label="跟进方式" prop="follow_type">
          <el-select v-model="followUpForm.follow_type" style="width: 100%">
            <el-option label="电话" value="phone" />
            <el-option label="微信" value="wechat" />
            <el-option label="上门" value="visit" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="followUpForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入跟进内容"
          />
        </el-form-item>
        <el-form-item label="跟进结果" prop="result">
          <el-select v-model="followUpForm.result" style="width: 100%">
            <el-option label="有意向" value="interested" />
            <el-option label="考虑中" value="considering" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="联系不上" value="unreachable" />
            <el-option label="已转化" value="converted" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker
            v-model="followUpForm.next_follow_date"
            type="date"
            placeholder="选择下次跟进日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="跟进计划">
          <el-input
            v-model="followUpForm.next_follow_plan"
            type="textarea"
            :rows="2"
            placeholder="下次跟进计划"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followUpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="followUpLoading" @click="handleAddFollowUp">
          保存记录
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配记录弹窗 -->
    <el-dialog
      v-model="assignmentLogsVisible"
      title="分配记录"
      width="800px"
    >
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in assignmentLogs"
          :key="index"
          :timestamp="log.created_at"
          placement="top"
        >
          <el-card shadow="hover">
            <div class="log-content">
              <el-tag :type="getLogActionType(log.action)" size="small">
                {{ log.action_text }}
              </el-tag>
              <span class="log-institution" v-if="log.institution_name">
                {{ log.institution_name }}
              </span>
              <div class="log-operator" v-if="log.operator_name">
                操作人: {{ log.operator_name }}
              </div>
              <div class="log-remark" v-if="log.remark">
                {{ log.remark }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <div v-if="assignmentLogs.length === 0" class="empty-state">
        暂无分配记录
      </div>
    </el-dialog>

    <!-- 跟进历史弹窗 -->
    <el-dialog
      v-model="followUpHistoryVisible"
      title="跟进历史"
      width="800px"
    >
      <el-table :data="followUpHistory" stripe v-loading="followUpHistoryLoading">
        <el-table-column prop="created_at" label="跟进时间" width="160" />
        <el-table-column prop="follow_type_text" label="方式" width="80" />
        <el-table-column prop="content" label="跟进内容" min-width="200" />
        <el-table-column prop="result_text" label="结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultType(row.result)" size="small">
              {{ row.result_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="next_follow_date" label="下次跟进" width="120" />
        <el-table-column prop="follow_by_name" label="跟进人" width="100" />
      </el-table>
      <div v-if="followUpHistory.length === 0" class="empty-state">
        暂无跟进记录
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Search,
  Refresh,
  RefreshRight,
  Download,
  Calendar,
  TrendCharts,
  DataAnalysis,
  Opportunity,
  Share,
  Document,
  Clock,
  List,
  Close,
  ArrowDown,
  OfficeBuilding
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

// 标签页切换
const activeTab = ref('prospect-list')

// 已分配机构相关变量
const institutionKeyword = ref('')
const assignedInstitutionLoading = ref(false)
const assignedInstitutions = ref([])
const selectedInstitution = ref(null)
const prospectLoading = ref(false)
const institutionProspects = ref([])
const selectedProspect = ref(null)
const detailLoading = ref(false)
const prospectDetail = ref({})

// 表格引用
const tableRef = ref(null)

// 加载状态
const loading = ref(false)

// 查询参数
const queryParams = reactive({
  keyword: '',
  assignment_status: '',
  start_date: '',
  end_date: '',
  per_page: 15,
  page: 1
})

// 日期范围
const dateRange = ref([])

// 统计数据
const statisticsData = ref({
  total_prospects: 0,
  today_prospects: 0,
  yesterday_prospects: 0,
  week_prospects: 0,
  month_prospects: 0,
  source_stats: {}
})

// 表格数据
const tableData = ref([])

// 选中的行
const selectedRows = ref([])

// 分页
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1
})

// 分配弹窗
const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const institutionLoading = ref(false)
const institutionList = ref([])
const assignForm = reactive({
  prospectIds: [],
  institution_number: '',
  remark: ''
})

// 再次分配弹窗
const reassignDialogVisible = ref(false)
const reassignLoading = ref(false)
const reassignForm = reactive({
  prospect_id: null,
  prospect_name: '',
  prospect_phone: '',
  current_institution_name: '',
  institution_number: '',
  reason: ''
})

// 添加跟进弹窗
const followUpDialogVisible = ref(false)
const followUpLoading = ref(false)
const followUpFormRef = ref(null)
const followUpForm = reactive({
  prospect_id: null,
  prospect_name: '',
  prospect_phone: '',
  follow_type: 'phone',
  content: '',
  result: 'considering',
  next_follow_date: '',
  next_follow_plan: ''
})

const followUpRules = {
  follow_type: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }],
  result: [{ required: true, message: '请选择跟进结果', trigger: 'change' }]
}

// 分配记录弹窗
const assignmentLogsVisible = ref(false)
const assignmentLogs = ref([])

// 跟进历史弹窗
const followUpHistoryVisible = ref(false)
const followUpHistoryLoading = ref(false)
const followUpHistory = ref([])

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      page: pagination.current_page,
      per_page: pagination.per_page
    }

    const res = await request.get('/api/admin/v1/prospects', { params })

    if (res.code === 0) {
      tableData.value = res.data.list || []
      Object.assign(pagination, res.data.pagination)
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取准客户列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await request.get('/api/admin/v1/prospects/statistics')

    if (res.code === 0) {
      statisticsData.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取已分配机构列表
const fetchAssignedInstitutions = async () => {
  assignedInstitutionLoading.value = true
  try {
    const res = await request.get('/api/admin/v1/prospect-assignments/assigned-institutions', {
      params: { keyword: institutionKeyword.value }
    })

    if (res.code === 0) {
      assignedInstitutions.value = res.data?.list || []
    } else {
      ElMessage.error(res.message || '获取机构列表失败')
    }
  } catch (error) {
    console.error('获取机构列表失败:', error)
    ElMessage.error('获取机构列表失败')
  } finally {
    assignedInstitutionLoading.value = false
  }
}

// 选择机构
const selectInstitution = async (inst) => {
  selectedInstitution.value = inst
  selectedProspect.value = null
  prospectDetail.value = {}
  prospectLoading.value = true

  try {
    const res = await request.get(`/api/admin/v1/prospect-assignments/institution/${inst.institution_number}/prospects`)

    if (res.code === 0) {
      institutionProspects.value = res.data?.list || []
    } else {
      ElMessage.error(res.message || '获取准客户列表失败')
    }
  } catch (error) {
    console.error('获取准客户列表失败:', error)
    ElMessage.error('获取准客户列表失败')
  } finally {
    prospectLoading.value = false
  }
}

// 选择准客户
const selectProspect = async (prospect) => {
  selectedProspect.value = prospect
  detailLoading.value = true

  // 已分配机构视图下 prospect.id 是分配记录ID，需要用 prospect_id 获取详情
  const prospectId = prospect.prospect_id || prospect.id

  try {
    const res = await request.get(`/api/admin/v1/prospect-follow/prospect/${prospectId}/detail`)

    if (res.code === 0) {
      prospectDetail.value = res.data || {}
    } else {
      ElMessage.error(res.message || '获取跟进明细失败')
    }
  } catch (error) {
    console.error('获取跟进明细失败:', error)
    ElMessage.error('获取跟进明细失败')
  } finally {
    detailLoading.value = false
  }
}

// 标签页切换
const handleTabChange = (tabName) => {
  if (tabName === 'assigned-institutions') {
    fetchAssignedInstitutions()
  }
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待跟进',
    'following': '跟进中',
    'converted': '已转化',
    'invalid': '无效'
  }
  return statusMap[status] || status
}

// 搜索机构
const searchInstitutions = async (keyword) => {
  if (!keyword) {
    institutionList.value = []
    return
  }

  institutionLoading.value = true
  try {
    const res = await request.get('/api/admin/v1/prospect-assignments/institutions', {
      params: { keyword }
    })

    if (res.code === 0) {
      institutionList.value = res.data || []
    }
  } catch (error) {
    console.error('搜索机构失败:', error)
  } finally {
    institutionLoading.value = false
  }
}

// 选中行变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 显示分配弹窗（批量）
const showAssignDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要分配的客户')
    return
  }
  assignForm.prospectIds = selectedRows.value.map(row => row.id)
  assignForm.institution_number = ''
  assignForm.remark = ''
  assignDialogVisible.value = true
}

// 显示分配弹窗（单个）
const showAssignDialogSingle = (row) => {
  assignForm.prospectIds = [row.id]
  assignForm.institution_number = ''
  assignForm.remark = ''
  assignDialogVisible.value = true
}

// 执行分配
const handleAssign = async () => {
  if (!assignForm.institution_number) {
    ElMessage.warning('请选择要分配的机构')
    return
  }

  assignLoading.value = true
  try {
    const res = await request.post('/api/admin/v1/prospect-assignments/assign', {
      prospect_ids: assignForm.prospectIds,
      institution_number: assignForm.institution_number,
      remark: assignForm.remark
    })

    if (res.code === 0) {
      ElMessage.success(res.message || '分配成功')
      assignDialogVisible.value = false
      // 清除选中
      tableRef.value?.clearSelection()
      selectedRows.value = []
      // 刷新列表
      fetchList()
      fetchStatistics()
    } else {
      ElMessage.error(res.message || '分配失败')
    }
  } catch (error) {
    console.error('分配失败:', error)
    ElMessage.error('分配失败')
  } finally {
    assignLoading.value = false
  }
}

// 显示再次分配弹窗
const showReassignDialog = (row) => {
  // 支持两种数据结构：准客户列表(row.id)和已分配机构视图(row.prospect_id)
  reassignForm.prospect_id = row.prospect_id || row.id
  reassignForm.prospect_name = row.name || row.prospect_name || row.wechat_nickname || '未知'
  reassignForm.prospect_phone = row.phone || row.prospect_phone
  reassignForm.current_institution_name = row.assigned_institution_name || row.institution_name
  reassignForm.institution_number = ''
  reassignForm.reason = ''
  reassignDialogVisible.value = true
}

// 执行再次分配
const handleReassign = async () => {
  if (!reassignForm.institution_number) {
    ElMessage.warning('请选择新分配机构')
    return
  }
  if (!reassignForm.reason) {
    ElMessage.warning('请输入再分配原因')
    return
  }

  reassignLoading.value = true
  try {
    const res = await request.post('/api/admin/v1/prospect-assignments/reassign', {
      prospect_id: reassignForm.prospect_id,
      institution_number: reassignForm.institution_number,
      reason: reassignForm.reason
    })

    if (res.code === 0) {
      ElMessage.success(res.message || '再分配成功')
      reassignDialogVisible.value = false
      fetchList()
      // 如果是已分配机构视图，刷新数据
      if (activeTab.value === 'assigned-institutions') {
        fetchAssignedInstitutions()
        if (selectedInstitution.value) {
          selectInstitution(selectedInstitution.value)
        }
      }
    } else {
      ElMessage.error(res.message || '再分配失败')
    }
  } catch (error) {
    console.error('再分配失败:', error)
    ElMessage.error('再分配失败')
  } finally {
    reassignLoading.value = false
  }
}

// 显示添加跟进弹窗
const showFollowUpDialog = (row) => {
  // 支持两种数据结构：准客户列表(row.id)和已分配机构视图(row.prospect_id)
  followUpForm.prospect_id = row.prospect_id || row.id
  followUpForm.prospect_name = row.name || row.prospect_name || row.wechat_nickname || '未知'
  followUpForm.prospect_phone = row.phone || row.prospect_phone
  followUpForm.follow_type = 'phone'
  followUpForm.content = ''
  followUpForm.result = 'considering'
  followUpForm.next_follow_date = ''
  followUpForm.next_follow_plan = ''
  followUpDialogVisible.value = true
}

// 添加跟进记录
const handleAddFollowUp = async () => {
  try {
    await followUpFormRef.value.validate()
  } catch (e) {
    return
  }

  followUpLoading.value = true
  try {
    const res = await request.post('/api/admin/v1/prospect-follow', {
      prospect_id: followUpForm.prospect_id,
      follow_type: followUpForm.follow_type,
      content: followUpForm.content,
      result: followUpForm.result,
      next_follow_date: followUpForm.next_follow_date,
      next_follow_plan: followUpForm.next_follow_plan
    })

    if (res.code === 0) {
      ElMessage.success(res.message || '跟进记录添加成功')
      followUpDialogVisible.value = false
      fetchList()
      // 如果是已分配机构视图，刷新数据
      if (activeTab.value === 'assigned-institutions' && selectedProspect.value) {
        selectProspect(selectedProspect.value)
      }
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error) {
    console.error('添加跟进记录失败:', error)
    ElMessage.error('添加失败')
  } finally {
    followUpLoading.value = false
  }
}

// 显示分配记录
const showAssignmentLogs = async (row) => {
  assignmentLogs.value = []
  assignmentLogsVisible.value = true

  try {
    const res = await request.get('/api/admin/v1/prospect-assignments/logs', {
      params: { prospect_id: row.id }
    })

    if (res.code === 0) {
      assignmentLogs.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取分配记录失败:', error)
    ElMessage.error('获取分配记录失败')
  }
}

// 显示跟进历史
const showFollowUpHistory = async (row) => {
  followUpHistory.value = []
  followUpHistoryLoading.value = true
  followUpHistoryVisible.value = true

  try {
    const res = await request.get(`/api/admin/v1/prospect-follow/prospect/${row.id}`)

    if (res.code === 0) {
      followUpHistory.value = res.data || []
    }
  } catch (error) {
    console.error('获取跟进历史失败:', error)
    ElMessage.error('获取跟进历史失败')
  } finally {
    followUpHistoryLoading.value = false
  }
}

// 取消分配
const handleCancelAssign = async (row) => {
  if (row.assignment_status !== 'pending') {
    ElMessage.warning('仅待跟进状态可取消分配')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要取消对"${row.name || row.wechat_nickname || '该客户'}"的分配吗？取消后将变为未分配状态。`,
      '确认取消分配',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '返回',
        type: 'warning'
      }
    )

    const res = await request.delete(`/api/admin/v1/prospect-assignments/${row.assignment_id}`)

    if (res.code === 0) {
      ElMessage.success(res.message || '已取消分配')
      fetchList()
      fetchStatistics()
    } else {
      ElMessage.error(res.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消分配失败:', error)
      ElMessage.error('取消分配失败')
    }
  }
}

// 搜索
const handleSearch = () => {
  pagination.current_page = 1
  fetchList()
}

// 重置
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.assignment_status = ''
  queryParams.start_date = ''
  queryParams.end_date = ''
  dateRange.value = []
  pagination.current_page = 1
  fetchList()
}

// 日期变化
const handleDateChange = (val) => {
  if (val) {
    queryParams.start_date = val[0]
    queryParams.end_date = val[1]
  } else {
    queryParams.start_date = ''
    queryParams.end_date = ''
  }
}

// 刷新
const handleRefresh = () => {
  fetchList()
  fetchStatistics()
  ElMessage.success('数据已刷新')
}

// 导出
const handleExport = async () => {
  try {
    const params = { ...queryParams }
    const res = await request.get('/api/admin/v1/prospects/export', { params })

    if (res.code === 0 && res.data.data) {
      const data = res.data.data
      if (data.length === 0) {
        ElMessage.warning('没有数据可导出')
        return
      }

      const headers = Object.keys(data[0])
      let csvContent = headers.join(',') + '\n'

      data.forEach(row => {
        const values = headers.map(header => {
          let value = row[header] || ''
          if (String(value).includes(',') || String(value).includes('\n')) {
            value = `"${value}"`
          }
          return value
        })
        csvContent += values.join(',') + '\n'
      })

      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `准客户列表_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      ElMessage.success(`成功导出 ${res.data.total} 条数据`)
    } else {
      ElMessage.error(res.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 查看详情
const handleView = (row) => {
  router.push(`/users/app-users/${row.id}`)
}

// 分页大小变化
const handleSizeChange = (val) => {
  pagination.per_page = val
  pagination.current_page = 1
  fetchList()
}

// 页码变化
const handleCurrentChange = (val) => {
  pagination.current_page = val
  fetchList()
}

// 获取分配/跟进状态标签类型
const getAssignmentStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'following': 'primary',
    'converted': 'success',
    'invalid': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取日志操作类型
const getLogActionType = (action) => {
  const typeMap = {
    'assigned': 'success',
    'reassigned': 'warning',
    'unassigned': 'info',
    'status_changed': 'primary',
    'follow_up': ''
  }
  return typeMap[action] || 'info'
}

// 获取跟进结果标签类型
const getResultType = (result) => {
  const typeMap = {
    'interested': 'success',
    'considering': 'warning',
    'rejected': 'danger',
    'unreachable': 'info',
    'converted': 'success'
  }
  return typeMap[result] || ''
}

// 初始化
onMounted(() => {
  fetchList()
  fetchStatistics()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
  color: #409eff;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.statistics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stats-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stats-card.total .stats-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-card.today .stats-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stats-card.week .stats-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-card.month .stats-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stats-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: #409eff;
  font-size: 18px;
}

.filter-title {
  font-weight: 600;
  color: #303133;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-card {
  border-radius: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.register-days {
  font-size: 12px;
  color: #909399;
}

.assigned-institution {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.assigned-info {
  line-height: 1.4;
}

.assigned-name {
  font-weight: 500;
  color: #303133;
}

.assigned-id {
  font-size: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.text-warning {
  color: #e6a23c;
  font-weight: 500;
}

.current-info {
  padding: 8px 0;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.log-content {
  line-height: 1.8;
}

.log-institution {
  margin-left: 8px;
  font-weight: 500;
  color: #303133;
}

.log-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.log-remark {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

/* 已分配机构视图样式 */
.tab-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.assigned-institutions-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.institution-filter-card {
  border-radius: 12px;
}

.three-column-layout {
  display: grid;
  grid-template-columns: 280px 350px 1fr;
  gap: 16px;
  min-height: 600px;
}

.institution-list-card,
.prospect-list-card,
.follow-detail-card {
  border-radius: 12px;
  max-height: 700px;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .institution-count {
  font-size: 12px;
  color: #909399;
}

.institution-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
}

.institution-item:hover {
  background-color: #f5f7fa;
}

.institution-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.institution-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.institution-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.institution-stats .total-count {
  font-size: 12px;
  color: #909399;
}

.status-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.prospect-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prospect-item:hover {
  background-color: #f5f7fa;
}

.prospect-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.prospect-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prospect-details {
  min-width: 0;
}

.prospect-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prospect-phone {
  font-size: 12px;
  color: #909399;
}

.prospect-meta {
  text-align: right;
}

.follow-info {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.prospect-detail {
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-item {
  font-size: 13px;
  line-height: 1.6;
}

.info-item label {
  color: #909399;
}

.info-item span {
  color: #303133;
}

.follow-card {
  padding: 8px;
}

.follow-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.follow-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 8px;
}

.follow-footer {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.follow-by {
  font-size: 11px;
  color: #c0c4cc;
}

.log-item {
  line-height: 1.6;
}

.log-text {
  margin-left: 8px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .statistics-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .statistics-row {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
