<template>
  <div class="birthday-management">
    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card today-birthday">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Present /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.todayBirthday }}</div>
                <div class="stats-label">今日生日</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card sent-today">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Message /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.sentToday }}</div>
                <div class="stats-label">今日已发送</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card success-rate">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.successRate }}%</div>
                <div class="stats-label">发送成功率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card total-sent">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.totalSent }}</div>
                <div class="stats-label">累计发送</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" class="main-tabs birthday-tabs" @tab-change="handleTabChange">
      <!-- 生日列表标签页 -->
      <el-tab-pane name="birthday-list">
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><Present /></el-icon>
            <span>生日列表</span>
          </div>
        </template>
        <el-card>
          <template #header>
            <div class="card-header">
              <span>生日祝福管理</span>
              <div class="header-actions">
                <el-button 
                  type="success" 
                  @click="refreshData"
                  :loading="loading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button 
                  type="primary" 
                  @click="batchSendSms" 
                  :loading="sending"
                  :disabled="selectedRows.length === 0"
                >
                  <el-icon><Message /></el-icon>
                  批量发送 ({{ selectedRows.length }})
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索区域 -->
          <div class="search-section">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="搜索">
                <el-input 
                  v-model="searchForm.search" 
                  placeholder="机构名称/手机号"
                  clearable
                  @keyup.enter="handleSearch"
                  style="width: 200px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="生日月份">
                <el-date-picker
                  v-model="searchForm.birthMonth"
                  type="month"
                  placeholder="选择生日月份"
                  format="YYYY-MM"
                  value-format="YYYY-MM"
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item label="等级">
                <el-select v-model="searchForm.level" placeholder="选择等级" clearable style="width: 120px">
                  <el-option label="全部" value="" />
                  <el-option label="1级" value="1" />
                  <el-option label="2级" value="2" />
                  <el-option label="3级" value="3" />
                  <el-option label="4级" value="4" />
                  <el-option label="5级" value="5" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据列表 -->
          <el-table 
            :data="tableData" 
            border 
            stripe
            v-loading="loading"
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="机构ID" min-width="100">
              <template #default="scope">
                <span class="institution-id">{{ scope.row.id }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="机构名称" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                <div class="institution-info">
                  <span class="institution-name">{{ scope.row.name }}</span>
                  <el-tag v-if="scope.row.is_today_birthday" type="danger" size="small" class="birthday-tag">
                    今日生日
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="number" label="机构号" min-width="120">
              <template #default="scope">
                <span class="institution-number">{{ scope.row.number }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" min-width="120" />
            <el-table-column prop="xs_number" label="XS编号" min-width="120" />
            <el-table-column prop="lv" label="等级" width="80" align="center">
              <template #default="scope">
                <el-tag :type="getLevelType(scope.row.lv)" size="small">
                  {{ scope.row.lv }}级
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="parent_name" label="上级机构" min-width="180" show-overflow-tooltip />
            <el-table-column prop="birth_date" label="生日" min-width="120">
              <template #default="scope">
                <span class="birth-date">{{ formatDate(scope.row.birth_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="gender" label="性别" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.gender === '男' ? 'primary' : 'danger'" size="small">
                  {{ scope.row.gender }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="age" label="年龄" width="80" align="center">
              <template #default="scope">
                <span class="age-text">{{ scope.row.age }}岁</span>
              </template>
            </el-table-column>
            <el-table-column label="发送状态" width="120" align="center">
              <template #default="scope">
                <el-tag 
                  v-if="scope.row.sms_status" 
                  :type="scope.row.sms_status === 'success' ? 'success' : 'danger'" 
                  size="small"
                >
                  {{ scope.row.sms_status === 'success' ? '已发送' : '发送失败' }}
                </el-tag>
                <span v-else class="text-muted">未发送</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  link
                  @click="handleSendSms(scope.row)"
                  :loading="scope.row.sending"
                  :disabled="scope.row.sms_status === 'success'"
                >
                  <el-icon><Message /></el-icon>
                  {{ scope.row.sms_status === 'success' ? '已发送' : '发送短信' }}
                </el-button>
                <el-button
                  type="info"
                  link
                  @click="viewSmsHistory(scope.row)"
                >
                  <el-icon><View /></el-icon>
                  历史记录
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[15, 30, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 发送记录标签页 -->
      <el-tab-pane name="sms-logs">
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><ChatLineRound /></el-icon>
            <span>发送记录</span>
          </div>
        </template>
        <el-card>
          <template #header>
            <div class="card-header">
              <span>短信发送记录</span>
              <div class="header-actions">
                <el-button 
                  type="success" 
                  @click="refreshLogs"
                  :loading="logsLoading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button 
                  type="primary" 
                  @click="exportLogs"
                >
                  <el-icon><Download /></el-icon>
                  导出记录
                </el-button>
              </div>
            </div>
          </template>

          <!-- 记录搜索区域 -->
          <div class="search-section">
            <el-form :inline="true" :model="logsSearchForm">
              <el-form-item label="搜索">
                <el-input 
                  v-model="logsSearchForm.search" 
                  placeholder="姓名/手机号"
                  clearable
                  @keyup.enter="handleLogsSearch"
                  style="width: 200px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="发送状态">
                <el-select v-model="logsSearchForm.status" placeholder="选择状态" clearable style="width: 120px">
                  <el-option label="全部" value="" />
                  <el-option label="成功" value="success" />
                  <el-option label="失败" value="failed" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送时间">
                <el-date-picker
                  v-model="logsSearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleLogsSearch">搜索</el-button>
                <el-button @click="resetLogsSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 记录列表 -->
          <el-table 
            :data="logsData" 
            border 
            stripe
            v-loading="logsLoading"
            style="width: 100%"
          >
            <el-table-column prop="id" label="记录ID" width="100" />
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="phone" label="手机号" min-width="120" />
            <el-table-column prop="age" label="年龄" width="80" align="center">
              <template #default="scope">
                {{ scope.row.age }}岁
              </template>
            </el-table-column>
            <el-table-column prop="birthday" label="生日" min-width="120">
              <template #default="scope">
                {{ formatDate(scope.row.birthday) }}
              </template>
            </el-table-column>
            <el-table-column prop="sms_content" label="短信内容" min-width="300" show-overflow-tooltip />
            <el-table-column prop="send_time" label="发送时间" min-width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.send_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="发送状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ scope.row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  link
                  @click="resendSms(scope.row)"
                  v-if="scope.row.status === 'failed'"
                >
                  <el-icon><Refresh /></el-icon>
                  重发
                </el-button>
                <el-button
                  type="info"
                  link
                  @click="viewSmsDetail(scope.row)"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 记录分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="logsCurrentPage"
              v-model:page-size="logsPageSize"
              :page-sizes="[15, 30, 50, 100]"
              :total="logsTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleLogsSizeChange"
              @current-change="handleLogsCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 数据分析标签页 -->
      <el-tab-pane name="analytics">
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>发送趋势分析</span>
              </template>
              <div id="sendTrendChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>成功率统计</span>
              </template>
              <div id="successRateChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>年龄分布</span>
              </template>
              <div id="ageDistributionChart" style="height: 250px;"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>性别分布</span>
              </template>
              <div id="genderDistributionChart" style="height: 250px;"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>等级分布</span>
              </template>
              <div id="levelDistributionChart" style="height: 250px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 即将生日标签页 -->
      <el-tab-pane name="upcoming">
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><Calendar /></el-icon>
            <span>即将生日</span>
          </div>
        </template>
        <el-card>
          <template #header>
            <div class="card-header">
              <span>即将生日用户</span>
              <div class="header-actions">
                <el-select v-model="upcomingDays" @change="fetchUpcomingBirthdays" style="width: 120px; margin-right: 10px;">
                  <el-option label="未来3天" :value="3" />
                  <el-option label="未来7天" :value="7" />
                  <el-option label="未来15天" :value="15" />
                  <el-option label="未来30天" :value="30" />
                </el-select>
                <el-button 
                  type="success" 
                  @click="fetchUpcomingBirthdays"
                  :loading="upcomingLoading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>

          <!-- 即将生日列表 -->
          <el-table 
            :data="upcomingData" 
            border 
            stripe
            v-loading="upcomingLoading"
            style="width: 100%"
          >
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="phone" label="手机号" min-width="120" />
            <el-table-column prop="lv" label="等级" width="80" align="center">
              <template #default="scope">
                <el-tag :type="getLevelType(scope.row.lv)" size="small">
                  {{ scope.row.lv }}级
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="birth_date" label="生日" min-width="120">
              <template #default="scope">
                {{ formatDate(scope.row.birth_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="age" label="年龄" width="80" align="center">
              <template #default="scope">
                {{ scope.row.age }}岁
              </template>
            </el-table-column>
            <el-table-column prop="gender" label="性别" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.gender === '男' ? 'primary' : 'danger'" size="small">
                  {{ scope.row.gender }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="days_until_birthday" label="距离生日" width="100" align="center">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.days_until_birthday === 0 ? 'danger' : 
                         scope.row.days_until_birthday <= 1 ? 'warning' : 'info'" 
                  size="small"
                >
                  {{ scope.row.days_until_birthday === 0 ? '今天' : `${scope.row.days_until_birthday}天后` }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  link
                  @click="handleSendSms(scope.row)"
                >
                  <el-icon><Message /></el-icon>
                  发送祝福
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 系统设置标签页 -->
      <el-tab-pane name="settings">
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><Setting /></el-icon>
            <span>系统设置</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>生日提醒设置</span>
              </template>
              <el-form :model="reminderSettings" label-width="120px">
                <el-form-item label="自动发送">
                  <el-switch 
                    v-model="reminderSettings.auto_send_enabled"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="发送时间">
                  <el-time-picker
                    v-model="reminderSettings.send_time"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="选择发送时间"
                  />
                </el-form-item>
                <el-form-item label="提前天数">
                  <el-input-number
                    v-model="reminderSettings.advance_days"
                    :min="0"
                    :max="30"
                    controls-position="right"
                  />
                  <span style="margin-left: 10px; color: #909399;">天</span>
                </el-form-item>
                <el-form-item label="每日最大发送">
                  <el-input-number
                    v-model="reminderSettings.max_daily_send"
                    :min="1"
                    :max="10000"
                    controls-position="right"
                  />
                  <span style="margin-left: 10px; color: #909399;">条</span>
                </el-form-item>
                <el-form-item label="失败重试">
                  <el-switch 
                    v-model="reminderSettings.retry_failed"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="重试次数" v-if="reminderSettings.retry_failed">
                  <el-input-number
                    v-model="reminderSettings.retry_times"
                    :min="1"
                    :max="10"
                    controls-position="right"
                  />
                  <span style="margin-left: 10px; color: #909399;">次</span>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveReminderSettings" :loading="settingsSaving">
                    保存设置
                  </el-button>
                  <el-button @click="fetchReminderSettings">
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>短信模板设置</span>
              </template>
              <el-form label-width="120px">
                <el-form-item label="模板内容">
                  <el-input
                    v-model="reminderSettings.template_content"
                    type="textarea"
                    :rows="6"
                    placeholder="请输入短信模板内容"
                  />
                  <div style="margin-top: 10px; color: #909399; font-size: 12px;">
                    可用变量：{name} - 姓名，{age} - 年龄
                  </div>
                </el-form-item>
                <el-form-item label="测试发送">
                  <el-input
                    v-model="testPhone"
                    placeholder="请输入测试手机号"
                    style="width: 200px; margin-right: 10px;"
                  />
                  <el-button type="warning" @click="sendTestSms" :loading="testSending">
                    发送测试
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 短信发送确认对话框 -->
    <el-dialog
      title="发送生日祝福"
      v-model="smsDialogVisible"
      width="500px"
      class="sms-dialog"
    >
      <div class="sms-preview">
        <div class="preview-header">
          <el-icon><Message /></el-icon>
          <span>短信预览</span>
        </div>
        <div class="preview-content">
          {{ smsContent }}
        </div>
        <div class="recipient-info">
          <div class="info-item">
            <span class="label">收件人：</span>
            <span class="value">{{ currentRecord?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">手机号：</span>
            <span class="value">{{ currentRecord?.phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">年龄：</span>
            <span class="value">{{ currentRecord?.age }}岁</span>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="smsDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSendSms"
            :loading="confirmSending"
          >
            确认发送
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量发送短信对话框 -->
    <el-dialog
      title="批量发送生日祝福"
      v-model="batchDialogVisible"
      width="700px"
      class="batch-sms-dialog"
    >
      <div class="batch-sms-preview">
        <div class="preview-header">
          <el-icon><Message /></el-icon>
          <span>短信内容预览</span>
        </div>
        <div class="preview-content">
          亲爱的{姓名}，今天是你的{年龄}岁生日，点点够祝您生日快乐！祝您每一天都是美好的一天！
        </div>
      </div>

      <div class="recipient-list">
        <div class="list-header">
          <span class="selected-count">将发送给 {{ selectedRows.length }} 人</span>
          <el-button type="text" @click="clearSelection">清空选择</el-button>
        </div>
        
        <el-table
          :data="selectedRows"
          style="width: 100%"
          max-height="400"
        >
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="age" label="年龄" width="80" align="center">
            <template #default="scope">
              {{ scope.row.age }}岁
            </template>
          </el-table-column>
          <el-table-column prop="birth_date" label="生日" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.birth_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="parent_name" label="上级机构" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmBatchSend"
            :loading="batchSending"
            :disabled="selectedRows.length === 0"
          >
            确认发送 ({{ selectedRows.length }}人)
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 短信详情对话框 -->
    <el-dialog
      title="短信详情"
      v-model="smsDetailVisible"
      width="600px"
    >
      <div v-if="currentSmsDetail" class="sms-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentSmsDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="机构ID">{{ currentSmsDetail.institution_id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ currentSmsDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentSmsDetail.phone }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ currentSmsDetail.age }}岁</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentSmsDetail.gender }}</el-descriptions-item>
          <el-descriptions-item label="生日">{{ formatDate(currentSmsDetail.birthday) }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatDateTime(currentSmsDetail.send_time) }}</el-descriptions-item>
          <el-descriptions-item label="发送状态" :span="2">
            <el-tag :type="currentSmsDetail.status === 'success' ? 'success' : 'danger'">
              {{ currentSmsDetail.status === 'success' ? '发送成功' : '发送失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="短信内容" :span="2">
            <div class="sms-content">{{ currentSmsDetail.sms_content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { 
  Message, Search, Present, SuccessFilled, DataAnalysis, 
  Refresh, Download, View, ChatLineRound, Calendar, Setting
} from '@element-plus/icons-vue'
import { 
  getBirthdayList, sendBirthdaySms, batchSendBirthdaySms, 
  getSmsLogs, getBirthdayStatistics, getAnalyticsData, exportSmsLogs,
  getReminderSettings, updateReminderSettings, getSendHistory,
  getUpcomingBirthdays, testSms
} from '@/api/birthday'

// 状态定义
const activeTab = ref('birthday-list')
const loading = ref(false)
const sending = ref(false)
const confirmSending = ref(false)
const batchSending = ref(false)
const logsLoading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(15)
const smsDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const smsDetailVisible = ref(false)
const currentRecord = ref(null)
const currentSmsDetail = ref(null)

// 发送记录相关状态
const logsData = ref([])
const logsTotal = ref(0)
const logsCurrentPage = ref(1)
const logsPageSize = ref(15)

// 统计数据
const statistics = ref({
  todayBirthday: 0,
  sentToday: 0,
  successRate: 0,
  totalSent: 0
})

// 即将生日相关状态
const upcomingData = ref([])
const upcomingLoading = ref(false)
const upcomingDays = ref(7)

// 设置相关状态
const reminderSettings = ref({
  auto_send_enabled: false,
  send_time: '09:00',
  advance_days: 0,
  template_content: '',
  max_daily_send: 1000,
  retry_failed: true,
  retry_times: 3
})
const settingsSaving = ref(false)
const testPhone = ref('')
const testSending = ref(false)

// 图表相关状态
const analyticsData = ref({})
const chartInstances = ref({})
const analyticsLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  search: '',
  birthMonth: '',
  level: ''
})

// 记录搜索表单
const logsSearchForm = reactive({
  search: '',
  status: '',
  dateRange: []
})

// 短信内容预览
const smsContent = computed(() => {
  if (!currentRecord.value) return ''
  return `亲爱的${currentRecord.value.name}，今天是你的${currentRecord.value.age}岁生日，点点够祝您生日快乐！祝您每一天都是美好的一天！`
})

// 获取等级类型
const getLevelType = (level) => {
  if (level >= 4) return 'success'
  if (level >= 3) return 'warning'
  return 'info'
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const data = await getBirthdayStatistics()
    statistics.value = data.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取列表数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      search: searchForm.search,
      birth_month: searchForm.birthMonth,
      level: searchForm.level
    }
    
    const data = await getBirthdayList(params)
    tableData.value = data.data.list
    total.value = data.data.total
  } catch (error) {
    console.error('获取生日列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取发送记录
const fetchLogs = async () => {
  try {
    logsLoading.value = true
    const params = {
      page: logsCurrentPage.value,
      size: logsPageSize.value,
      search: logsSearchForm.search,
      status: logsSearchForm.status,
      start_date: logsSearchForm.dateRange?.[0],
      end_date: logsSearchForm.dateRange?.[1]
    }
    
    const data = await getSmsLogs(params)
    logsData.value = data.data.list
    logsTotal.value = data.data.total
  } catch (error) {
    console.error('获取发送记录失败:', error)
    ElMessage.error('获取记录失败')
  } finally {
    logsLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.search = ''
  searchForm.birthMonth = ''
  searchForm.level = ''
  currentPage.value = 1
  fetchData()
}

// 记录搜索
const handleLogsSearch = () => {
  logsCurrentPage.value = 1
  fetchLogs()
}

// 重置记录搜索
const resetLogsSearch = () => {
  logsSearchForm.search = ''
  logsSearchForm.status = ''
  logsSearchForm.dateRange = []
  logsCurrentPage.value = 1
  fetchLogs()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

// 记录分页处理
const handleLogsSizeChange = (val) => {
  logsPageSize.value = val
  logsCurrentPage.value = 1
  fetchLogs()
}

const handleLogsCurrentChange = (val) => {
  logsCurrentPage.value = val
  fetchLogs()
}

// 选择处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 清空选择
const clearSelection = () => {
  selectedRows.value = []
}

// 发送单个短信
const handleSendSms = (row) => {
  currentRecord.value = row
  smsDialogVisible.value = true
}

// 确认发送单个短信
const confirmSendSms = async () => {
  try {
    confirmSending.value = true
    const data = await sendBirthdaySms(currentRecord.value)
    
    ElMessage.success('发送成功')
    smsDialogVisible.value = false
    
    // 刷新数据
    fetchData()
    fetchStatistics()
  } catch (error) {
    console.error('发送短信失败:', error)
    ElMessage.error('发送失败')
  } finally {
    confirmSending.value = false
  }
}

// 批量发送短信
const batchSendSms = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要发送的对象')
    return
  }
  batchDialogVisible.value = true
}

// 确认批量发送
const confirmBatchSend = async () => {
  try {
    batchSending.value = true
    const data = await batchSendBirthdaySms({
      recipients: selectedRows.value
    })
    
    ElMessage.success(data.message || '批量发送完成')
    batchDialogVisible.value = false
    selectedRows.value = []
    
    // 刷新数据
    fetchData()
    fetchStatistics()
  } catch (error) {
    console.error('批量发送失败:', error)
    ElMessage.error('批量发送失败')
  } finally {
    batchSending.value = false
  }
}

// 查看短信历史
const viewSmsHistory = (row) => {
  // 切换到发送记录标签页并搜索该用户
  activeTab.value = 'sms-logs'
  logsSearchForm.search = row.phone
  nextTick(() => {
    handleLogsSearch()
  })
}

// 查看短信详情
const viewSmsDetail = (row) => {
  currentSmsDetail.value = row
  smsDetailVisible.value = true
}

// 重发短信
const resendSms = async (row) => {
  try {
    await ElMessageBox.confirm('确认要重新发送短信吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const data = await sendBirthdaySms({
      id: row.institution_id,
      name: row.name,
      phone: row.phone,
      age: row.age,
      gender: row.gender,
      birth_date: row.birthday
    })
    
    ElMessage.success('重发成功')
    fetchLogs()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重发短信失败:', error)
      ElMessage.error('重发失败')
    }
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
  fetchStatistics()
}

// 刷新记录
const refreshLogs = () => {
  fetchLogs()
}

// 导出记录
const exportLogs = async () => {
  try {
    const params = {
      search: logsSearchForm.search,
      status: logsSearchForm.status,
      start_date: logsSearchForm.dateRange?.[0],
      end_date: logsSearchForm.dateRange?.[1]
    }
    
    const response = await exportSmsLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `生日祝福发送记录_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString('zh-CN')
}

// 监听标签页切换
const handleTabChange = (tabName) => {
  if (tabName === 'sms-logs' && logsData.value.length === 0) {
    fetchLogs()
  } else if (tabName === 'analytics' && Object.keys(chartInstances.value).length === 0) {
    fetchAnalyticsData()
  } else if (tabName === 'upcoming') {
    fetchUpcomingBirthdays()
  } else if (tabName === 'settings') {
    fetchReminderSettings()
  }
}

// 获取即将生日数据
const fetchUpcomingBirthdays = async () => {
  try {
    upcomingLoading.value = true
    const params = {
      days: upcomingDays.value
    }
    
    const data = await getUpcomingBirthdays(params)
    upcomingData.value = data.data.upcoming_birthdays
  } catch (error) {
    console.error('获取即将生日数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    upcomingLoading.value = false
  }
}

// 保存生日提醒设置
const saveReminderSettings = async () => {
  try {
    settingsSaving.value = true
    const data = await updateReminderSettings(reminderSettings.value)
    
    ElMessage.success('设置保存成功')
    fetchReminderSettings()
  } catch (error) {
    console.error('保存生日提醒设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    settingsSaving.value = false
  }
}

// 获取生日提醒设置
const fetchReminderSettings = async () => {
  try {
    const data = await getReminderSettings()
    reminderSettings.value = data.data
  } catch (error) {
    console.error('获取生日提醒设置失败:', error)
    ElMessage.error('获取失败')
  }
}

// 发送测试短信
const sendTestSms = async () => {
  try {
    testSending.value = true
    const data = await testSms(testPhone.value)
    
    ElMessage.success('测试发送成功')
  } catch (error) {
    console.error('发送测试短信失败:', error)
    ElMessage.error('发送失败')
  } finally {
    testSending.value = false
  }
}

// 获取分析数据
const fetchAnalyticsData = async () => {
  try {
    analyticsLoading.value = true
    const data = await getAnalyticsData()
    analyticsData.value = data.data
    
    // 等待DOM更新后初始化图表
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('获取分析数据失败:', error)
    ElMessage.error('获取分析数据失败')
  } finally {
    analyticsLoading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initSendTrendChart()
  initSuccessRateChart()
  initAgeDistributionChart()
  initGenderDistributionChart()
  initLevelDistributionChart()
}

// 初始化发送趋势图表
const initSendTrendChart = () => {
  const chartDom = document.getElementById('sendTrendChart')
  if (!chartDom) return
  
  const chart = echarts.init(chartDom)
  chartInstances.value.sendTrend = chart
  
  const option = {
    title: {
      text: '最近7天发送趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: analyticsData.value.daily_stats?.map(item => item.date) || []
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '发送数量',
      type: 'line',
      data: analyticsData.value.daily_stats?.map(item => item.total_sent) || [],
      smooth: true,
      itemStyle: { color: '#409eff' }
    }]
  }
  
  chart.setOption(option)
}

// 初始化成功率图表
const initSuccessRateChart = () => {
  const chartDom = document.getElementById('successRateChart')
  if (!chartDom) return
  
  const chart = echarts.init(chartDom)
  chartInstances.value.successRate = chart
  
  const option = {
    title: {
      text: '发送成功率',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '发送状态',
      type: 'pie',
      radius: '60%',
      data: [
        { value: statistics.value.sentToday || 0, name: '发送成功', itemStyle: { color: '#67c23a' } },
        { value: Math.max(0, (statistics.value.totalSent || 0) - (statistics.value.sentToday || 0)), name: '发送失败', itemStyle: { color: '#f56c6c' } }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  chart.setOption(option)
}

// 初始化年龄分布图表
const initAgeDistributionChart = () => {
  const chartDom = document.getElementById('ageDistributionChart')
  if (!chartDom) return
  
  const chart = echarts.init(chartDom)
  chartInstances.value.ageDistribution = chart
  
  const option = {
    title: {
      text: '年龄分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: analyticsData.value.age_distribution?.map(item => item.age_range) || ['20-30', '30-40', '40-50', '50-60', '60+']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '人数',
      type: 'bar',
      data: analyticsData.value.age_distribution?.map(item => item.count) || [15, 25, 30, 20, 10],
      itemStyle: { color: '#e6a23c' }
    }]
  }
  
  chart.setOption(option)
}

// 初始化性别分布图表
const initGenderDistributionChart = () => {
  const chartDom = document.getElementById('genderDistributionChart')
  if (!chartDom) return
  
  const chart = echarts.init(chartDom)
  chartInstances.value.genderDistribution = chart
  
  const option = {
    title: {
      text: '性别分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '性别',
      type: 'pie',
      radius: '60%',
      data: analyticsData.value.gender_distribution || [
        { value: 60, name: '男', itemStyle: { color: '#409eff' } },
        { value: 40, name: '女', itemStyle: { color: '#f56c6c' } }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  chart.setOption(option)
}

// 初始化等级分布图表
const initLevelDistributionChart = () => {
  const chartDom = document.getElementById('levelDistributionChart')
  if (!chartDom) return
  
  const chart = echarts.init(chartDom)
  chartInstances.value.levelDistribution = chart
  
  const option = {
    title: {
      text: '等级分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: analyticsData.value.level_distribution?.map(item => `${item.level}级`) || ['1级', '2级', '3级', '4级', '5级', '6级']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '人数',
      type: 'bar',
      data: analyticsData.value.level_distribution?.map(item => item.count) || [50, 30, 15, 8, 3, 1],
      itemStyle: { color: '#67c23a' }
    }]
  }
  
  chart.setOption(option)
}



// 初始化
onMounted(() => {
  fetchData()
  fetchStatistics()
  fetchUpcomingBirthdays()
  fetchReminderSettings()
})
</script>

<style scoped>
.birthday-management {
  padding: 20px;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
}

.today-birthday .stats-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
}

.sent-today .stats-icon {
  background: linear-gradient(135deg, #4ecdc4, #44bd87);
  color: white;
}

.success-rate .stats-icon {
  background: linear-gradient(135deg, #45b7d1, #96ceb4);
  color: white;
}

.total-sent .stats-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #7f8c8d;
}

/* 主要内容样式 */
.main-tabs {
  background: white;
  border-radius: 8px;
}

/* 生日祝福标签页美化样式 */
.birthday-tabs {
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.birthday-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  border-radius: 12px 12px 0 0;
}

.birthday-tabs :deep(.el-tabs__nav-wrap) {
  background: transparent;
}

.birthday-tabs :deep(.el-tabs__nav-scroll) {
  background: transparent;
}

.birthday-tabs :deep(.el-tabs__nav) {
  border: none;
  background: transparent;
}

.birthday-tabs :deep(.el-tabs__item) {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 0 24px;
  height: 60px;
  line-height: 60px;
  transition: all 0.3s ease;
  position: relative;
  margin-right: 8px;
}

.birthday-tabs :deep(.el-tabs__item:hover) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
}

.birthday-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.birthday-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.birthday-tabs :deep(.el-tabs__content) {
  padding: 24px;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
}

/* 标签页标签样式 */
.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.birthday-tabs :deep(.el-tabs__item:hover) .tab-icon {
  transform: scale(1.1);
}

.birthday-tabs :deep(.el-tabs__item.is-active) .tab-icon {
  color: #667eea;
  transform: scale(1.1);
}

/* 特定标签页图标颜色 */
.birthday-tabs :deep(.el-tabs__item[aria-controls="pane-birthday-list"].is-active) .tab-icon {
  color: #ff6b6b;
}

.birthday-tabs :deep(.el-tabs__item[aria-controls="pane-sms-logs"].is-active) .tab-icon {
  color: #4ecdc4;
}

.birthday-tabs :deep(.el-tabs__item[aria-controls="pane-analytics"].is-active) .tab-icon {
  color: #45b7d1;
}

.birthday-tabs :deep(.el-tabs__item[aria-controls="pane-upcoming"].is-active) .tab-icon {
  color: #f093fb;
}

.birthday-tabs :deep(.el-tabs__item[aria-controls="pane-settings"].is-active) .tab-icon {
  color: #96ceb4;
}

/* 标签页内容动画 */
.birthday-tabs :deep(.el-tab-pane) {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 表格样式 */
.institution-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.birthday-tag {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.institution-id {
  font-weight: bold;
  color: #409eff;
}

.institution-name {
  font-weight: 500;
}

.birth-date {
  color: #e6a23c;
  font-weight: 500;
}

.age-text {
  font-weight: 500;
  color: #67c23a;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

/* 对话框样式 */
.sms-preview {
  margin-bottom: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.preview-header .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.preview-content {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  line-height: 1.6;
  margin-bottom: 15px;
}

.recipient-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  width: 80px;
}

.info-item .value {
  color: #303133;
}

.batch-sms-preview {
  margin-bottom: 20px;
}

.recipient-list {
  margin-top: 20px;
}

.list-header {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  font-weight: bold;
  color: #409eff;
}

.sms-detail .sms-content {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-section .el-col {
    margin-bottom: 15px;
  }
  
  .search-section .el-form {
    flex-direction: column;
  }
  
  .search-section .el-form-item {
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style> 