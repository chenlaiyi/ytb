<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><UserFilled /></el-icon>
            业务员团队管理
          </h1>
          <p class="page-description">团队结构管理、团队绩效分析与团队协作优化</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showCreateTeamDialog">
            <el-icon><Plus /></el-icon>
            创建团队
          </el-button>
          <el-button type="success" size="large" @click="showTeamRestructureDialog">
            <el-icon><Operation /></el-icon>
            团队重组
          </el-button>
        </div>
      </div>
    </div>

    <!-- 业务员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="salesman-tabs">
        <el-tab-pane label="业务员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              业务员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="数据统计" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              数据统计
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="绩效管理" name="performance">
          <template #label>
            <span class="tab-label">
              <el-icon><TrendCharts /></el-icon>
              绩效管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="培训管理" name="training">
          <template #label>
            <span class="tab-label">
              <el-icon><Reading /></el-icon>
              培训管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="团队管理" name="team">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              团队管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="薪酬管理" name="salary">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              薪酬管理
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 团队统计卡片 -->
    <div class="stats-dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card total-teams" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ teamStats.totalTeams }}</div>
                <div class="stats-label">团队总数</div>
                <div class="stats-change">本月新增 {{ teamStats.monthlyNewTeams }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card total-members" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ teamStats.totalMembers }}</div>
                <div class="stats-label">团队成员总数</div>
                <div class="stats-change">平均 {{ teamStats.averageTeamSize }}人/团队</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card team-performance" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ teamStats.averagePerformance }}%</div>
                <div class="stats-label">平均团队绩效</div>
                <div class="stats-change">较上月 +{{ teamStats.performanceGrowth }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card collaboration-score" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ teamStats.collaborationScore }}</div>
                <div class="stats-label">团队协作指数</div>
                <div class="stats-change">满分100分</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 团队管理标签页 -->
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 团队结构 -->
        <el-tab-pane label="团队结构" name="structure">
          <div class="tab-content">
            <!-- 筛选条件 -->
            <div class="filter-section">
              <el-form :inline="true" class="filter-form">
                <el-form-item label="团队状态">
                  <el-select v-model="structureQuery.status" @change="loadTeamStructure" style="width: 150px;">
                    <el-option label="全部状态" value="" />
                    <el-option label="活跃" value="active" />
                    <el-option label="暂停" value="paused" />
                    <el-option label="解散" value="disbanded" />
                  </el-select>
                </el-form-item>
                <el-form-item label="团队规模">
                  <el-select v-model="structureQuery.size_range" @change="loadTeamStructure" style="width: 150px;">
                    <el-option label="全部规模" value="" />
                    <el-option label="小团队(1-5人)" value="small" />
                    <el-option label="中团队(6-15人)" value="medium" />
                    <el-option label="大团队(16+人)" value="large" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-input 
                    v-model="structureQuery.keyword" 
                    placeholder="搜索团队名称或负责人" 
                    clearable 
                    style="width: 200px;"
                    @keyup.enter="loadTeamStructure"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadTeamStructure">搜索</el-button>
                  <el-button @click="resetStructureQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 团队结构表格 -->
            <el-table
              :data="teamStructure"
              v-loading="structureLoading"
              border
              stripe
              style="width: 100%"
              row-key="id"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            >
              <el-table-column type="expand">
                <template #default="props">
                  <div class="expand-content">
                    <el-descriptions title="团队详情" :column="2" border>
                      <el-descriptions-item label="团队描述">{{ props.row.description }}</el-descriptions-item>
                      <el-descriptions-item label="成立时间">{{ props.row.created_at }}</el-descriptions-item>
                      <el-descriptions-item label="团队目标">{{ props.row.target }}</el-descriptions-item>
                      <el-descriptions-item label="团队文化">{{ props.row.culture }}</el-descriptions-item>
                      <el-descriptions-item label="联系方式">{{ props.row.contact }}</el-descriptions-item>
                      <el-descriptions-item label="办公地点">{{ props.row.location }}</el-descriptions-item>
                    </el-descriptions>
                    
                    <!-- 团队成员列表 -->
                    <div class="team-members" v-if="props.row.members && props.row.members.length > 0">
                      <h4>团队成员 ({{ props.row.members.length }}人)</h4>
                      <div class="members-grid">
                        <div 
                          v-for="member in props.row.members" 
                          :key="member.id" 
                          class="member-card"
                        >
                          <el-avatar :src="member.avatar" :size="40">
                            {{ member.name.charAt(0) }}
                          </el-avatar>
                          <div class="member-info">
                            <div class="member-name">{{ member.name }}</div>
                            <div class="member-role">{{ member.position }}</div>
                            <div class="member-performance">绩效: {{ member.performance_score }}分</div>
                          </div>
                          <el-tag 
                            :type="member.is_leader ? 'danger' : 'info'" 
                            size="small"
                          >
                            {{ member.is_leader ? '团队长' : '成员' }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="name" label="团队名称" min-width="200">
                <template #default="scope">
                  <div class="team-name-cell">
                    <el-icon class="team-icon"><UserFilled /></el-icon>
                    <span class="team-name">{{ scope.row.name }}</span>
                    <el-tag v-if="scope.row.is_top_team" type="warning" size="small">顶级团队</el-tag>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="leader_name" label="团队负责人" width="120" />
              
              <el-table-column prop="member_count" label="成员数量" width="100">
                <template #default="scope">
                  <el-tag :type="getTeamSizeType(scope.row.member_count)">
                    {{ scope.row.member_count }}人
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="performance_score" label="团队绩效" width="120">
                <template #default="scope">
                  <div class="performance-cell">
                    <el-progress 
                      :percentage="scope.row.performance_score" 
                      :color="getPerformanceColor(scope.row.performance_score)"
                      :stroke-width="8"
                    />
                    <span class="performance-text">{{ scope.row.performance_score }}%</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="collaboration_score" label="协作指数" width="100">
                <template #default="scope">
                  <el-rate 
                    v-model="scope.row.collaboration_score" 
                    disabled 
                    show-score 
                    text-color="#ff9900"
                    :max="5"
                  />
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusTagType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <div class="action-buttons">
                    <el-button type="primary" size="small" @click="viewTeamDetail(scope.row)">
                      详情
                    </el-button>
                    <el-button type="warning" size="small" @click="editTeam(scope.row)">
                      编辑
                    </el-button>
                    <el-dropdown @command="handleTeamAction">
                      <el-button type="info" size="small">
                        更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="{action: 'members', team: scope.row}">
                            成员管理
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'performance', team: scope.row}">
                            绩效分析
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'restructure', team: scope.row}">
                            团队重组
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'dissolve', team: scope.row}" divided>
                            解散团队
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :total="structureTotal"
                :page-size="structureQuery.per_page"
                :current-page="structureQuery.page"
                :page-sizes="[10, 20, 50, 100]"
                @size-change="handleStructureSizeChange"
                @current-change="handleStructureCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 团队绩效 -->
        <el-tab-pane label="团队绩效" name="performance">
          <div class="tab-content">
            <el-row :gutter="20">
              <!-- 绩效趋势图 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>团队绩效趋势</span>
                    </div>
                  </template>
                  <div ref="performanceTrendChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>

              <!-- 团队排名 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><Trophy /></el-icon>
                      <span>团队绩效排名</span>
                    </div>
                  </template>
                  <div ref="teamRankingChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 绩效对比表 -->
            <el-card class="table-card" shadow="hover" style="margin-top: 20px;">
              <template #header>
                <div class="table-header">
                  <div class="table-title">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>团队绩效对比</span>
                  </div>
                  <div class="table-actions">
                    <el-select v-model="performanceQuery.period" @change="loadPerformanceData" style="width: 150px;">
                      <el-option label="本月" value="current_month" />
                      <el-option label="上月" value="last_month" />
                      <el-option label="本季度" value="current_quarter" />
                      <el-option label="上季度" value="last_quarter" />
                    </el-select>
                  </div>
                </div>
              </template>

              <el-table
                :data="performanceData"
                v-loading="performanceLoading"
                border
                stripe
                style="width: 100%"
              >
                <el-table-column type="index" label="排名" width="60" />
                <el-table-column prop="team_name" label="团队名称" min-width="150" />
                <el-table-column prop="leader_name" label="团队负责人" width="120" />
                <el-table-column prop="member_count" label="成员数" width="80" />
                <el-table-column prop="sales_amount" label="销售额" width="120">
                  <template #default="scope">
                    <span class="amount-text">¥{{ formatAmount(scope.row.sales_amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="performance_score" label="绩效得分" width="100">
                  <template #default="scope">
                    <span class="score-text" :class="getScoreClass(scope.row.performance_score)">
                      {{ scope.row.performance_score }}分
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="growth_rate" label="增长率" width="100">
                  <template #default="scope">
                    <span :class="scope.row.growth_rate >= 0 ? 'growth-positive' : 'growth-negative'">
                      {{ scope.row.growth_rate >= 0 ? '+' : '' }}{{ scope.row.growth_rate }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="collaboration_score" label="协作指数" width="120">
                  <template #default="scope">
                    <el-rate 
                      v-model="scope.row.collaboration_score" 
                      disabled 
                      show-score 
                      text-color="#ff9900"
                      :max="5"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="scope">
                    <div class="action-buttons">
                      <el-button type="primary" size="small" @click="viewTeamPerformanceDetail(scope.row)">
                        详细分析
                      </el-button>
                      <el-button type="success" size="small" @click="exportTeamReport(scope.row)">
                        导出报告
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 团队协作 -->
        <el-tab-pane label="团队协作" name="collaboration">
          <div class="tab-content">
            <el-row :gutter="20">
              <!-- 协作网络图 -->
              <el-col :span="16">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><Connection /></el-icon>
                      <span>团队协作网络</span>
                    </div>
                  </template>
                  <div ref="collaborationNetworkChart" class="chart-container large" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>

              <!-- 协作指标 -->
              <el-col :span="8">
                <el-card class="metrics-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><DataBoard /></el-icon>
                      <span>协作指标</span>
                    </div>
                  </template>
                  <div class="metrics-content">
                    <div class="metric-item">
                      <div class="metric-label">沟通频率</div>
                      <div class="metric-value">{{ collaborationMetrics.communication_frequency }}</div>
                      <div class="metric-unit">次/天</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">协作效率</div>
                      <div class="metric-value">{{ collaborationMetrics.collaboration_efficiency }}%</div>
                      <div class="metric-unit">完成率</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">知识共享</div>
                      <div class="metric-value">{{ collaborationMetrics.knowledge_sharing }}</div>
                      <div class="metric-unit">次/周</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">团队凝聚力</div>
                      <div class="metric-value">{{ collaborationMetrics.team_cohesion }}</div>
                      <div class="metric-unit">分</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 协作活动记录 -->
            <el-card class="table-card" shadow="hover" style="margin-top: 20px;">
              <template #header>
                <div class="table-header">
                  <div class="table-title">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>协作活动记录</span>
                  </div>
                  <div class="table-actions">
                    <el-button type="primary" @click="showCreateActivityDialog">
                      <el-icon><Plus /></el-icon>
                      新增活动
                    </el-button>
                  </div>
                </div>
              </template>

              <el-table
                :data="collaborationActivities"
                v-loading="activitiesLoading"
                border
                stripe
                style="width: 100%"
              >
                <el-table-column prop="activity_type" label="活动类型" width="120">
                  <template #default="scope">
                    <el-tag :type="getActivityTypeTag(scope.row.activity_type)">
                      {{ getActivityTypeText(scope.row.activity_type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="活动标题" min-width="200" />
                <el-table-column prop="participants" label="参与人员" width="150">
                  <template #default="scope">
                    <el-avatar-group :max="3" :size="30">
                      <el-avatar 
                        v-for="participant in scope.row.participants" 
                        :key="participant.id"
                        :src="participant.avatar"
                      >
                        {{ participant.name.charAt(0) }}
                      </el-avatar>
                    </el-avatar-group>
                    <span class="participant-count">+{{ scope.row.participants.length }}人</span>
                  </template>
                </el-table-column>
                <el-table-column prop="start_time" label="开始时间" width="160" />
                <el-table-column prop="duration" label="持续时间" width="100">
                  <template #default="scope">
                    {{ scope.row.duration }}分钟
                  </template>
                </el-table-column>
                <el-table-column prop="effectiveness_score" label="效果评分" width="120">
                  <template #default="scope">
                    <el-rate 
                      v-model="scope.row.effectiveness_score" 
                      disabled 
                      show-score 
                      text-color="#ff9900"
                      :max="5"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getActivityStatusTag(scope.row.status)">
                      {{ getActivityStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="scope">
                    <div class="action-buttons">
                      <el-button type="primary" size="small" @click="viewActivityDetail(scope.row)">
                        详情
                      </el-button>
                      <el-button 
                        v-if="scope.row.status === 'planned'"
                        type="success" 
                        size="small" 
                        @click="startActivity(scope.row)"
                      >
                        开始
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 创建团队对话框 -->
    <el-dialog 
      title="创建团队" 
      v-model="createTeamDialogVisible" 
      width="800px" 
      append-to-body
    >
      <el-form :model="teamForm" :rules="teamRules" ref="teamFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队名称" prop="name">
              <el-input v-model="teamForm.name" placeholder="请输入团队名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="团队负责人" prop="leader_id">
              <el-select 
                v-model="teamForm.leader_id" 
                placeholder="选择团队负责人" 
                filterable
                style="width: 100%;"
              >
                <el-option 
                  v-for="salesman in salesmanList" 
                  :key="salesman.id" 
                  :label="salesman.name" 
                  :value="salesman.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上级团队" prop="parent_team_id">
              <el-select 
                v-model="teamForm.parent_team_id" 
                placeholder="选择上级团队（可选）" 
                clearable
                style="width: 100%;"
              >
                <el-option 
                  v-for="team in teamList" 
                  :key="team.id" 
                  :label="team.name" 
                  :value="team.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="办公地点" prop="location">
              <el-input v-model="teamForm.location" placeholder="请输入办公地点" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="团队描述" prop="description">
              <el-input 
                v-model="teamForm.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入团队描述"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="团队目标" prop="target">
              <el-input 
                v-model="teamForm.target" 
                type="textarea" 
                :rows="2"
                placeholder="请输入团队目标"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="选择成员">
              <el-transfer
                v-model="teamForm.member_ids"
                :data="availableMembers"
                :titles="['可选成员', '团队成员']"
                :button-texts="['移除', '添加']"
                :format="{
                  noChecked: '${total}',
                  hasChecked: '${checked}/${total}'
                }"
                filterable
                filter-placeholder="搜索成员"
                style="text-align: left; display: inline-block"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createTeamDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTeamForm" :loading="teamSubmitting">
            {{ teamSubmitting ? '创建中...' : '创建团队' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 团队重组对话框 -->
    <el-dialog 
      title="团队重组" 
      v-model="restructureDialogVisible" 
      width="900px" 
      append-to-body
    >
      <div class="restructure-content">
        <el-alert
          title="团队重组说明"
          description="团队重组将调整团队结构和成员分配，请谨慎操作。重组后将影响团队绩效统计和协作关系。"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;"
        />

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card title="当前团队结构" shadow="hover">
              <div class="current-structure">
                <el-tree
                  :data="currentTeamStructure"
                  :props="{ children: 'children', label: 'name' }"
                  node-key="id"
                  default-expand-all
                  :expand-on-click-node="false"
                >
                  <template #default="{ node, data }">
                    <span class="tree-node">
                      <el-icon><UserFilled /></el-icon>
                      <span>{{ data.name }} ({{ data.member_count }}人)</span>
                      <el-tag v-if="data.is_top_team" type="warning" size="small">顶级</el-tag>
                    </span>
                  </template>
                </el-tree>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card title="重组操作" shadow="hover">
              <div class="restructure-operations">
                <el-form :model="restructureForm" label-width="100px">
                  <el-form-item label="操作类型">
                    <el-radio-group v-model="restructureForm.operation_type">
                      <el-radio label="merge">合并团队</el-radio>
                      <el-radio label="split">拆分团队</el-radio>
                      <el-radio label="transfer">成员转移</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item label="源团队" v-if="restructureForm.operation_type">
                    <el-select 
                      v-model="restructureForm.source_team_id" 
                      placeholder="选择源团队"
                      style="width: 100%;"
                    >
                      <el-option 
                        v-for="team in teamList" 
                        :key="team.id" 
                        :label="team.name" 
                        :value="team.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item 
                    label="目标团队" 
                    v-if="restructureForm.operation_type === 'merge' || restructureForm.operation_type === 'transfer'"
                  >
                    <el-select 
                      v-model="restructureForm.target_team_id" 
                      placeholder="选择目标团队"
                      style="width: 100%;"
                    >
                      <el-option 
                        v-for="team in teamList" 
                        :key="team.id" 
                        :label="team.name" 
                        :value="team.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="重组说明">
                    <el-input 
                      v-model="restructureForm.reason" 
                      type="textarea" 
                      :rows="3"
                      placeholder="请输入重组原因和说明"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="restructureDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitRestructure" :loading="restructureSubmitting">
            {{ restructureSubmitting ? '重组中...' : '确认重组' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  UserFilled, Plus, Operation, Avatar, TrendCharts, Connection, Trophy, 
  DataAnalysis, DataBoard, ChatDotRound, ArrowDown, User, Reading, Money
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getSalesmenList } from '@/api/salesman';

export default {
  name: 'SalesmenTeam',
  setup() {
    const router = useRouter();
    
    // 响应式数据
    const structureLoading = ref(false);
    const performanceLoading = ref(false);
    const activitiesLoading = ref(false);
    const chartsLoading = ref(false);
    const teamSubmitting = ref(false);
    const restructureSubmitting = ref(false);
    
    // 当前标签页
    const activeTab = ref('team');
    
    // 业务员列表
    const salesmanList = ref([]);
    const teamList = ref([]);
    
    // 团队统计
    const teamStats = reactive({
      totalTeams: 0,
      totalMembers: 0,
      averageTeamSize: 0,
      averagePerformance: 0,
      performanceGrowth: 0,
      collaborationScore: 0,
      monthlyNewTeams: 0
    });
    
    // 团队结构数据
    const teamStructure = ref([]);
    const structureTotal = ref(0);
    const structureQuery = reactive({
      page: 1,
      per_page: 20,
      status: '',
      size_range: '',
      keyword: ''
    });
    
    // 团队绩效数据
    const performanceData = ref([]);
    const performanceQuery = reactive({
      period: 'current_month'
    });
    
    // 协作数据
    const collaborationActivities = ref([]);
    const collaborationMetrics = reactive({
      communication_frequency: 0,
      collaboration_efficiency: 0,
      knowledge_sharing: 0,
      team_cohesion: 0
    });
    
    // 对话框
    const createTeamDialogVisible = ref(false);
    const restructureDialogVisible = ref(false);
    const teamFormRef = ref(null);
    
    // 表单数据
    const teamForm = reactive({
      name: '',
      leader_id: '',
      parent_team_id: '',
      location: '',
      description: '',
      target: '',
      member_ids: []
    });
    
    const restructureForm = reactive({
      operation_type: '',
      source_team_id: '',
      target_team_id: '',
      reason: ''
    });
    
    // 可选成员数据
    const availableMembers = ref([]);
    const currentTeamStructure = ref([]);
    
    // 表单验证规则
    const teamRules = {
      name: [
        { required: true, message: '请输入团队名称', trigger: 'blur' }
      ],
      leader_id: [
        { required: true, message: '请选择团队负责人', trigger: 'change' }
      ]
    };
    
    // 图表实例
    const performanceTrendChart = ref(null);
    const teamRankingChart = ref(null);
    const collaborationNetworkChart = ref(null);
    let performanceTrendInstance = null;
    let teamRankingInstance = null;
    let collaborationNetworkInstance = null;
    
    // 获取业务员列表
    const loadSalesmanList = async () => {
      try {
        const response = await getSalesmenList({ per_page: 1000 });
        if (response.code === 0 || response.code === 200) {
          salesmanList.value = response.data?.data || response.data || [];
          
          // 构建可选成员数据
          availableMembers.value = salesmanList.value.map(salesman => ({
            key: salesman.id,
            label: `${salesman.name} (${salesman.phone})`,
            disabled: false
          }));
        }
      } catch (error) {
        console.error('获取业务员列表失败:', error);
      }
    };
    
    // 加载团队统计
    const loadTeamStats = async () => {
      try {
        // 模拟API调用
        const mockStats = {
          totalTeams: 12,
          totalMembers: 85,
          averageTeamSize: 7.1,
          averagePerformance: 87.5,
          performanceGrowth: 12.3,
          collaborationScore: 92,
          monthlyNewTeams: 2
        };
        
        Object.assign(teamStats, mockStats);
      } catch (error) {
        console.error('加载团队统计失败:', error);
      }
    };
    
    // 加载团队结构
    const loadTeamStructure = async () => {
      structureLoading.value = true;
      try {
        // 模拟API调用
        const mockData = {
          code: 200,
          data: {
            data: [
              {
                id: 1,
                name: '华东销售团队',
                leader_name: '张经理',
                member_count: 15,
                performance_score: 92,
                collaboration_score: 4.5,
                status: 'active',
                is_top_team: true,
                description: '负责华东地区的销售业务',
                created_at: '2024-01-15 10:00:00',
                target: '年销售额目标1000万',
                culture: '团结协作，追求卓越',
                contact: '021-12345678',
                location: '上海市浦东新区',
                members: [
                  {
                    id: 1,
                    name: '张三',
                    position: '高级销售',
                    performance_score: 95,
                    is_leader: true,
                    avatar: ''
                  },
                  {
                    id: 2,
                    name: '李四',
                    position: '销售专员',
                    performance_score: 88,
                    is_leader: false,
                    avatar: ''
                  }
                ],
                children: [
                  {
                    id: 11,
                    name: '上海分队',
                    leader_name: '王组长',
                    member_count: 8,
                    performance_score: 89,
                    collaboration_score: 4.2,
                    status: 'active',
                    is_top_team: false
                  }
                ]
              },
              {
                id: 2,
                name: '华南销售团队',
                leader_name: '李经理',
                member_count: 12,
                performance_score: 85,
                collaboration_score: 4.0,
                status: 'active',
                is_top_team: true,
                description: '负责华南地区的销售业务',
                created_at: '2024-02-01 09:00:00',
                target: '年销售额目标800万',
                culture: '创新进取，客户至上',
                contact: '020-87654321',
                location: '广州市天河区',
                members: []
              }
            ],
            total: 2
          }
        };
        
        teamStructure.value = mockData.data.data;
        structureTotal.value = mockData.data.total;
        
      } catch (error) {
        console.error('加载团队结构失败:', error);
        ElMessage.error('加载团队结构失败');
      } finally {
        structureLoading.value = false;
      }
    };
    
    // 加载绩效数据
    const loadPerformanceData = async () => {
      performanceLoading.value = true;
      try {
        // 模拟API调用
        const mockData = [
          {
            team_name: '华东销售团队',
            leader_name: '张经理',
            member_count: 15,
            sales_amount: 2500000,
            performance_score: 92,
            growth_rate: 15.5,
            collaboration_score: 4.5
          },
          {
            team_name: '华南销售团队',
            leader_name: '李经理',
            member_count: 12,
            sales_amount: 2100000,
            performance_score: 85,
            growth_rate: 8.2,
            collaboration_score: 4.0
          }
        ];
        
        performanceData.value = mockData;
        
      } catch (error) {
        console.error('加载绩效数据失败:', error);
      } finally {
        performanceLoading.value = false;
      }
    };
    
    // 加载协作数据
    const loadCollaborationData = async () => {
      activitiesLoading.value = true;
      try {
        // 模拟协作指标
        Object.assign(collaborationMetrics, {
          communication_frequency: 25,
          collaboration_efficiency: 87,
          knowledge_sharing: 12,
          team_cohesion: 89
        });
        
        // 模拟协作活动
        const mockActivities = [
          {
            id: 1,
            activity_type: 'meeting',
            title: '华东团队周例会',
            participants: [
              { id: 1, name: '张三', avatar: '' },
              { id: 2, name: '李四', avatar: '' }
            ],
            start_time: '2024-02-20 14:00:00',
            duration: 60,
            effectiveness_score: 4.5,
            status: 'completed'
          },
          {
            id: 2,
            activity_type: 'training',
            title: '销售技巧培训',
            participants: [
              { id: 3, name: '王五', avatar: '' },
              { id: 4, name: '赵六', avatar: '' }
            ],
            start_time: '2024-02-21 09:00:00',
            duration: 120,
            effectiveness_score: 4.8,
            status: 'planned'
          }
        ];
        
        collaborationActivities.value = mockActivities;
        
      } catch (error) {
        console.error('加载协作数据失败:', error);
      } finally {
        activitiesLoading.value = false;
      }
    };
    
    // 加载图表数据
    const loadChartData = async () => {
      chartsLoading.value = true;
      try {
        await nextTick();
        
        // 渲染绩效趋势图
        renderPerformanceTrendChart();
        
        // 渲染团队排名图
        renderTeamRankingChart();
        
        // 渲染协作网络图
        renderCollaborationNetworkChart();
        
      } catch (error) {
        console.error('加载图表数据失败:', error);
      } finally {
        chartsLoading.value = false;
      }
    };
    
    // 渲染绩效趋势图
    const renderPerformanceTrendChart = () => {
      if (!performanceTrendChart.value) return;
      
      if (performanceTrendInstance) {
        performanceTrendInstance.dispose();
      }
      
      performanceTrendInstance = echarts.init(performanceTrendChart.value);
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['华东团队', '华南团队', '华北团队']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: '华东团队',
            type: 'line',
            smooth: true,
            data: [85, 88, 90, 92, 89, 92]
          },
          {
            name: '华南团队',
            type: 'line',
            smooth: true,
            data: [80, 82, 85, 87, 85, 85]
          },
          {
            name: '华北团队',
            type: 'line',
            smooth: true,
            data: [78, 80, 83, 85, 88, 90]
          }
        ]
      };
      
      performanceTrendInstance.setOption(option);
    };
    
    // 渲染团队排名图
    const renderTeamRankingChart = () => {
      if (!teamRankingChart.value) return;
      
      if (teamRankingInstance) {
        teamRankingInstance.dispose();
      }
      
      teamRankingInstance = echarts.init(teamRankingChart.value);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: ['华北团队', '华南团队', '华东团队']
        },
        series: [
          {
            name: '绩效得分',
            type: 'bar',
            data: [90, 85, 92],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      };
      
      teamRankingInstance.setOption(option);
    };
    
    // 渲染协作网络图
    const renderCollaborationNetworkChart = () => {
      if (!collaborationNetworkChart.value) return;
      
      if (collaborationNetworkInstance) {
        collaborationNetworkInstance.dispose();
      }
      
      collaborationNetworkInstance = echarts.init(collaborationNetworkChart.value);
      
      const option = {
        tooltip: {},
        series: [
          {
            name: '团队协作网络',
            type: 'graph',
            layout: 'force',
            data: [
              { name: '华东团队', symbolSize: 80, category: 0 },
              { name: '华南团队', symbolSize: 70, category: 1 },
              { name: '华北团队', symbolSize: 60, category: 2 },
              { name: '上海分队', symbolSize: 50, category: 0 },
              { name: '广州分队', symbolSize: 45, category: 1 }
            ],
            links: [
              { source: '华东团队', target: '上海分队', value: 10 },
              { source: '华南团队', target: '广州分队', value: 8 },
              { source: '华东团队', target: '华南团队', value: 6 },
              { source: '华东团队', target: '华北团队', value: 4 },
              { source: '华南团队', target: '华北团队', value: 3 }
            ],
            categories: [
              { name: '华东区域' },
              { name: '华南区域' },
              { name: '华北区域' }
            ],
            roam: true,
            force: {
              repulsion: 100
            }
          }
        ]
      };
      
      collaborationNetworkInstance.setOption(option);
    };
    
    // 工具函数
    const getTeamSizeType = (count) => {
      if (count <= 5) return 'info';
      if (count <= 15) return 'success';
      return 'warning';
    };
    
    const getPerformanceColor = (score) => {
      if (score >= 90) return '#67c23a';
      if (score >= 80) return '#409eff';
      if (score >= 70) return '#e6a23c';
      return '#f56c6c';
    };
    
    const getStatusTagType = (status) => {
      const types = {
        active: 'success',
        paused: 'warning',
        disbanded: 'danger'
      };
      return types[status] || 'default';
    };
    
    const getStatusText = (status) => {
      const texts = {
        active: '活跃',
        paused: '暂停',
        disbanded: '解散'
      };
      return texts[status] || '未知';
    };
    
    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'qualified';
      return 'improvement';
    };
    
    const getActivityTypeTag = (type) => {
      const types = {
        meeting: 'primary',
        training: 'success',
        workshop: 'warning',
        social: 'info'
      };
      return types[type] || 'default';
    };
    
    const getActivityTypeText = (type) => {
      const texts = {
        meeting: '会议',
        training: '培训',
        workshop: '研讨会',
        social: '团建'
      };
      return texts[type] || '其他';
    };
    
    const getActivityStatusTag = (status) => {
      const types = {
        planned: 'info',
        ongoing: 'warning',
        completed: 'success',
        cancelled: 'danger'
      };
      return types[status] || 'default';
    };
    
    const getActivityStatusText = (status) => {
      const texts = {
        planned: '计划中',
        ongoing: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return texts[status] || '未知';
    };
    
    const formatAmount = (amount) => {
      return (amount / 10000).toFixed(1) + '万';
    };
    
    // 事件处理
    const handleTabChange = (tab) => {
      activeTab.value = tab;
      if (tab === 'structure') {
        loadTeamStructure();
      } else if (tab === 'performance') {
        loadPerformanceData();
        loadChartData();
      } else if (tab === 'collaboration') {
        loadCollaborationData();
        loadChartData();
      }
    };
    
    const resetStructureQuery = () => {
      Object.assign(structureQuery, {
        page: 1,
        per_page: 20,
        status: '',
        size_range: '',
        keyword: ''
      });
      loadTeamStructure();
    };
    
    const handleStructureSizeChange = (size) => {
      structureQuery.per_page = size;
      structureQuery.page = 1;
      loadTeamStructure();
    };
    
    const handleStructureCurrentChange = (page) => {
      structureQuery.page = page;
      loadTeamStructure();
    };
    
    // 对话框操作
    const showCreateTeamDialog = () => {
      resetTeamForm();
      createTeamDialogVisible.value = true;
    };
    
    const showTeamRestructureDialog = () => {
      loadCurrentTeamStructure();
      restructureDialogVisible.value = true;
    };
    
    const resetTeamForm = () => {
      Object.assign(teamForm, {
        name: '',
        leader_id: '',
        parent_team_id: '',
        location: '',
        description: '',
        target: '',
        member_ids: []
      });
    };
    
    const loadCurrentTeamStructure = () => {
      // 模拟当前团队结构数据
      currentTeamStructure.value = [
        {
          id: 1,
          name: '华东销售团队',
          member_count: 15,
          is_top_team: true,
          children: [
            {
              id: 11,
              name: '上海分队',
              member_count: 8,
              is_top_team: false
            }
          ]
        }
      ];
    };
    
    const submitTeamForm = () => {
      teamFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        teamSubmitting.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          ElMessage.success('团队创建成功');
          createTeamDialogVisible.value = false;
          loadTeamStructure();
        } catch (error) {
          console.error('创建团队失败:', error);
          ElMessage.error('创建团队失败');
        } finally {
          teamSubmitting.value = false;
        }
      });
    };
    
    const submitRestructure = async () => {
      if (!restructureForm.operation_type) {
        ElMessage.warning('请选择重组操作类型');
        return;
      }
      
      restructureSubmitting.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        ElMessage.success('团队重组完成');
        restructureDialogVisible.value = false;
        loadTeamStructure();
      } catch (error) {
        console.error('团队重组失败:', error);
        ElMessage.error('团队重组失败');
      } finally {
        restructureSubmitting.value = false;
      }
    };
    
    const handleTeamAction = ({ action, team }) => {
      switch (action) {
        case 'members':
          router.push(`/users/salesmen/team/${team.id}/members`);
          break;
        case 'performance':
          router.push(`/users/salesmen/team/${team.id}/performance`);
          break;
        case 'restructure':
          showTeamRestructureDialog();
          break;
        case 'dissolve':
          ElMessageBox.confirm('确定要解散此团队吗？', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            ElMessage.success('团队已解散');
            loadTeamStructure();
          });
          break;
      }
    };
    
    const viewTeamDetail = (team) => {
      router.push(`/users/salesmen/team/${team.id}`);
    };
    
    const editTeam = (team) => {
      Object.assign(teamForm, { ...team });
      createTeamDialogVisible.value = true;
    };
    
    const viewTeamPerformanceDetail = (team) => {
      router.push(`/users/salesmen/team/${team.id}/performance-detail`);
    };
    
    const exportTeamReport = (team) => {
      ElMessage.success(`正在导出${team.team_name}的绩效报告...`);
    };
    
    const viewActivityDetail = (activity) => {
      router.push(`/users/salesmen/collaboration/activity/${activity.id}`);
    };
    
    const startActivity = (activity) => {
      ElMessage.success(`活动"${activity.title}"已开始`);
      loadCollaborationData();
    };
    
    const showCreateActivityDialog = () => {
      ElMessage.info('创建协作活动功能开发中...');
    };
    
    const handleTabClick = (tab) => {
      const tabName = tab.props.name;
      
      // 根据标签页名称跳转到对应的路由
      switch (tabName) {
        case 'list':
          router.push('/users/salesmen');
          break;
        case 'statistics':
          router.push('/users/salesmen/statistics');
          break;
        case 'performance':
          router.push('/users/salesmen/performance');
          break;
        case 'training':
          router.push('/users/salesmen/training');
          break;
        case 'team':
          // 当前页面，不需要跳转
          break;
        case 'salary':
          router.push('/users/salesmen/salary');
          break;
        default:
          console.warn('未知的标签页:', tabName);
      }
    };
    
    // 生命周期
    onMounted(async () => {
      await loadSalesmanList();
      await loadTeamStats();
      await loadTeamStructure();
    });
    
    return {
      // 响应式数据
      structureLoading,
      performanceLoading,
      activitiesLoading,
      chartsLoading,
      teamSubmitting,
      restructureSubmitting,
      activeTab,
      salesmanList,
      teamList,
      teamStats,
      teamStructure,
      structureTotal,
      structureQuery,
      performanceData,
      performanceQuery,
      collaborationActivities,
      collaborationMetrics,
      createTeamDialogVisible,
      restructureDialogVisible,
      teamFormRef,
      teamForm,
      restructureForm,
      availableMembers,
      currentTeamStructure,
      teamRules,
      performanceTrendChart,
      teamRankingChart,
      collaborationNetworkChart,
      
      // 方法
      loadTeamStructure,
      loadPerformanceData,
      loadCollaborationData,
      handleTabChange,
      handleTabClick,
      resetStructureQuery,
      handleStructureSizeChange,
      handleStructureCurrentChange,
      showCreateTeamDialog,
      showTeamRestructureDialog,
      submitTeamForm,
      submitRestructure,
      handleTeamAction,
      viewTeamDetail,
      editTeam,
      viewTeamPerformanceDetail,
      exportTeamReport,
      viewActivityDetail,
      startActivity,
      showCreateActivityDialog,
      
      // 工具函数
      getTeamSizeType,
      getPerformanceColor,
      getStatusTagType,
      getStatusText,
      getScoreClass,
      getActivityTypeTag,
      getActivityTypeText,
      getActivityStatusTag,
      getActivityStatusText,
      formatAmount,
      
      // 图标
      UserFilled,
      Plus,
      Operation,
      Avatar,
      TrendCharts,
      Connection,
      Trophy,
      DataAnalysis,
      DataBoard,
      ChatDotRound,
      ArrowDown,
      User,
      Reading,
      Money
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex-grow: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.page-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计仪表板样式 */
.stats-dashboard {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.total-teams .stats-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.total-members .stats-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.team-performance .stats-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.collaboration-score .stats-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
  margin-bottom: 4px;
}

.stats-change {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
}

/* 主卡片样式 */
.main-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.tab-content {
  padding: 20px 0;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

/* 团队名称单元格 */
.team-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-icon {
  color: #409eff;
}

.team-name {
  font-weight: 600;
}

/* 绩效单元格 */
.performance-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.performance-text {
  font-size: 12px;
  color: #606266;
  text-align: center;
}

/* 分数样式 */
.score-text {
  font-weight: 600;
}

.score-text.excellent {
  color: #67c23a;
}

.score-text.good {
  color: #409eff;
}

.score-text.qualified {
  color: #e6a23c;
}

.score-text.improvement {
  color: #f56c6c;
}

/* 增长率样式 */
.growth-positive {
  color: #67c23a;
  font-weight: 600;
}

.growth-negative {
  color: #f56c6c;
  font-weight: 600;
}

/* 金额样式 */
.amount-text {
  font-weight: 600;
  color: #303133;
}

/* 图表卡片样式 */
.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container.large {
  height: 400px;
}

/* 指标卡片样式 */
.metrics-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.metrics-content {
  padding: 20px 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-unit {
  font-size: 12px;
  color: #c0c4cc;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

/* 展开内容样式 */
.expand-content {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 10px;
}

.team-members {
  margin-top: 20px;
}

.team-members h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.member-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.member-performance {
  font-size: 12px;
  color: #67c23a;
}

/* 参与人员样式 */
.participant-count {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

/* 重组内容样式 */
.restructure-content {
  padding: 10px 0;
}

.current-structure {
  max-height: 300px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.restructure-operations {
  padding: 10px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .stats-dashboard .el-row {
    flex-direction: column;
  }

  .stats-card {
    margin-bottom: 10px;
  }

  .chart-container {
    height: 250px;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }
}
</style> 