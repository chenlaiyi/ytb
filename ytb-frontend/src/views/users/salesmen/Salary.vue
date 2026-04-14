<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>业务员薪酬管理</h2>
        <p class="page-description">薪酬结构、发放记录和统计分析</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="showCreateSalaryDialog">
          <el-icon><Plus /></el-icon>
          新增薪酬记录
        </el-button>
        <el-button type="success" size="large" @click="showBatchPayDialog">
          <el-icon><Money /></el-icon>
          批量发放
        </el-button>
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

    <!-- 薪酬统计卡片 -->
    <div class="stats-dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card total-salary" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">¥{{ formatAmount(salaryStats.totalSalary) }}</div>
                <div class="stats-label">本月薪酬总额</div>
                <div class="stats-change">较上月 +{{ salaryStats.salaryGrowth }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card avg-salary" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">¥{{ formatAmount(salaryStats.avgSalary) }}</div>
                <div class="stats-label">平均薪酬</div>
                <div class="stats-change">行业领先水平</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card pending-payment" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ salaryStats.pendingCount }}</div>
                <div class="stats-label">待发放人数</div>
                <div class="stats-change">¥{{ formatAmount(salaryStats.pendingAmount) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card commission-ratio" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ salaryStats.commissionRatio }}%</div>
                <div class="stats-label">提成占比</div>
                <div class="stats-change">绩效激励</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 薪酬管理标签页 -->
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 薪酬记录 -->
        <el-tab-pane label="薪酬记录" name="records">
          <div class="tab-content">
            <!-- 筛选条件 -->
            <div class="filter-section">
              <el-form :inline="true" class="filter-form">
                <el-form-item label="发放月份">
                  <el-date-picker
                    v-model="recordsQuery.month"
                    type="month"
                    placeholder="选择月份"
                    format="YYYY-MM"
                    value-format="YYYY-MM"
                    @change="loadSalaryRecords"
                    style="width: 150px;"
                  />
                </el-form-item>
                <el-form-item label="发放状态">
                  <el-select v-model="recordsQuery.status" @change="loadSalaryRecords" style="width: 150px;">
                    <el-option label="全部状态" value="" />
                    <el-option label="待计算" value="pending" />
                    <el-option label="待审核" value="reviewing" />
                    <el-option label="待发放" value="approved" />
                    <el-option label="已发放" value="paid" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-form-item>
                <el-form-item label="业务员">
                  <el-select 
                    v-model="recordsQuery.salesman_id" 
                    placeholder="选择业务员" 
                    clearable
                    filterable
                    style="width: 200px;"
                    @change="loadSalaryRecords"
                  >
                    <el-option 
                      v-for="salesman in salesmanList" 
                      :key="salesman.id" 
                      :label="salesman.name" 
                      :value="salesman.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-input 
                    v-model="recordsQuery.keyword" 
                    placeholder="搜索业务员姓名" 
                    clearable 
                    style="width: 200px;"
                    @keyup.enter="loadSalaryRecords"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadSalaryRecords">搜索</el-button>
                  <el-button @click="resetRecordsQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 薪酬记录表格 -->
            <el-table
              :data="salaryRecords"
              v-loading="recordsLoading"
              border
              stripe
              style="width: 100%"
            >
              <el-table-column type="expand">
                <template #default="props">
                  <div class="expand-content">
                    <el-descriptions title="薪酬详情" :column="3" border>
                      <el-descriptions-item label="基本工资">¥{{ props.row.base_salary }}</el-descriptions-item>
                      <el-descriptions-item label="绩效工资">¥{{ props.row.performance_salary }}</el-descriptions-item>
                      <el-descriptions-item label="销售提成">¥{{ props.row.commission }}</el-descriptions-item>
                      <el-descriptions-item label="奖金">¥{{ props.row.bonus }}</el-descriptions-item>
                      <el-descriptions-item label="津贴">¥{{ props.row.allowance }}</el-descriptions-item>
                      <el-descriptions-item label="扣款">¥{{ props.row.deduction }}</el-descriptions-item>
                      <el-descriptions-item label="社保扣除">¥{{ props.row.social_insurance }}</el-descriptions-item>
                      <el-descriptions-item label="个税扣除">¥{{ props.row.personal_tax }}</el-descriptions-item>
                      <el-descriptions-item label="实发金额">¥{{ props.row.net_salary }}</el-descriptions-item>
                    </el-descriptions>
                    
                    <div class="salary-breakdown" v-if="props.row.breakdown">
                      <h4>薪酬构成明细</h4>
                      <el-table :data="props.row.breakdown" size="small" border>
                        <el-table-column prop="item_name" label="项目名称" width="150" />
                        <el-table-column prop="amount" label="金额" width="100">
                          <template #default="scope">
                            ¥{{ scope.row.amount }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="description" label="说明" />
                      </el-table>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="salesman_name" label="业务员" width="120">
                <template #default="scope">
                  <div class="salesman-cell">
                    <el-avatar :src="scope.row.avatar" :size="30">
                      {{ scope.row.salesman_name.charAt(0) }}
                    </el-avatar>
                    <span class="salesman-name">{{ scope.row.salesman_name }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="salary_month" label="发放月份" width="100" />
              
              <el-table-column prop="gross_salary" label="应发金额" width="120">
                <template #default="scope">
                  <span class="amount-text">¥{{ scope.row.gross_salary }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="net_salary" label="实发金额" width="120">
                <template #default="scope">
                  <span class="amount-text net-amount">¥{{ scope.row.net_salary }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="commission" label="提成金额" width="120">
                <template #default="scope">
                  <span class="commission-text">¥{{ scope.row.commission }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getSalaryStatusType(scope.row.status)">
                    {{ getSalaryStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="created_at" label="创建时间" width="160" />
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <div class="action-buttons">
                    <el-button 
                      v-if="scope.row.status === 'pending'"
                      type="primary" 
                      size="small" 
                      @click="calculateSalary(scope.row)"
                    >
                      计算
                    </el-button>
                    <el-button 
                      v-if="scope.row.status === 'reviewing'"
                      type="success" 
                      size="small" 
                      @click="approveSalary(scope.row)"
                    >
                      审核
                    </el-button>
                    <el-button 
                      v-if="scope.row.status === 'approved'"
                      type="warning" 
                      size="small" 
                      @click="paySalary(scope.row)"
                    >
                      发放
                    </el-button>
                    <el-dropdown @command="handleSalaryAction">
                      <el-button type="info" size="small">
                        更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="{action: 'edit', record: scope.row}">
                            编辑
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'detail', record: scope.row}">
                            详情
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'export', record: scope.row}">
                            导出工资条
                          </el-dropdown-item>
                          <el-dropdown-item :command="{action: 'cancel', record: scope.row}" divided>
                            取消发放
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
                :total="recordsTotal"
                :page-size="recordsQuery.per_page"
                :current-page="recordsQuery.page"
                :page-sizes="[10, 20, 50, 100]"
                @size-change="handleRecordsSizeChange"
                @current-change="handleRecordsCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 薪酬结构 -->
        <el-tab-pane label="薪酬结构" name="structure">
          <div class="tab-content">
            <el-row :gutter="20">
              <!-- 薪酬结构配置 -->
              <el-col :span="12">
                <el-card class="structure-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Setting /></el-icon>
                      <span>薪酬结构配置</span>
                      <el-button type="primary" size="small" @click="showStructureDialog">
                        编辑结构
                      </el-button>
                    </div>
                  </template>
                  
                  <div class="structure-content">
                    <div class="structure-item" v-for="item in salaryStructure" :key="item.id">
                      <div class="item-header">
                        <span class="item-name">{{ item.name }}</span>
                        <el-tag :type="item.is_fixed ? 'success' : 'warning'" size="small">
                          {{ item.is_fixed ? '固定' : '浮动' }}
                        </el-tag>
                      </div>
                      <div class="item-content">
                        <div class="item-description">{{ item.description }}</div>
                        <div class="item-formula" v-if="item.formula">
                          <span class="formula-label">计算公式：</span>
                          <code>{{ item.formula }}</code>
                        </div>
                        <div class="item-range" v-if="item.min_amount || item.max_amount">
                          <span class="range-label">金额范围：</span>
                          <span>¥{{ item.min_amount || 0 }} - ¥{{ item.max_amount || '无上限' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <!-- 薪酬等级 -->
              <el-col :span="12">
                <el-card class="levels-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Trophy /></el-icon>
                      <span>薪酬等级</span>
                      <el-button type="primary" size="small" @click="showLevelDialog">
                        管理等级
                      </el-button>
                    </div>
                  </template>
                  
                  <div class="levels-content">
                    <div class="level-item" v-for="level in salaryLevels" :key="level.id">
                      <div class="level-header">
                        <span class="level-name">{{ level.name }}</span>
                        <el-tag :type="getLevelTagType(level.level)" size="small">
                          L{{ level.level }}
                        </el-tag>
                      </div>
                      <div class="level-content">
                        <div class="level-salary">
                          <span class="salary-label">基本工资：</span>
                          <span class="salary-amount">¥{{ level.base_salary }}</span>
                        </div>
                        <div class="level-commission">
                          <span class="commission-label">提成比例：</span>
                          <span class="commission-rate">{{ level.commission_rate }}%</span>
                        </div>
                        <div class="level-requirements">
                          <span class="requirements-label">晋升要求：</span>
                          <span class="requirements-text">{{ level.requirements }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 薪酬统计 -->
        <el-tab-pane label="薪酬统计" name="statistics">
          <div class="tab-content">
            <el-row :gutter="20">
              <!-- 薪酬趋势图 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>薪酬趋势分析</span>
                    </div>
                  </template>
                  <div ref="salaryTrendChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>

              <!-- 薪酬分布图 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><PieChart /></el-icon>
                      <span>薪酬结构分布</span>
                    </div>
                  </template>
                  <div ref="salaryDistributionChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 薪酬统计表 -->
            <el-card class="table-card" shadow="hover" style="margin-top: 20px;">
              <template #header>
                <div class="table-header">
                  <div class="table-title">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>薪酬统计分析</span>
                  </div>
                  <div class="table-actions">
                    <el-select v-model="statisticsQuery.period" @change="loadStatisticsData" style="width: 150px;">
                      <el-option label="本月" value="current_month" />
                      <el-option label="上月" value="last_month" />
                      <el-option label="本季度" value="current_quarter" />
                      <el-option label="本年度" value="current_year" />
                    </el-select>
                  </div>
                </div>
              </template>

              <el-table
                :data="statisticsData"
                v-loading="statisticsLoading"
                border
                stripe
                style="width: 100%"
              >
                <el-table-column prop="department" label="部门" width="120" />
                <el-table-column prop="employee_count" label="人数" width="80" />
                <el-table-column prop="total_salary" label="薪酬总额" width="120">
                  <template #default="scope">
                    <span class="amount-text">¥{{ formatAmount(scope.row.total_salary) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="avg_salary" label="平均薪酬" width="120">
                  <template #default="scope">
                    <span class="amount-text">¥{{ scope.row.avg_salary }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="max_salary" label="最高薪酬" width="120">
                  <template #default="scope">
                    <span class="amount-text max-salary">¥{{ scope.row.max_salary }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="min_salary" label="最低薪酬" width="120">
                  <template #default="scope">
                    <span class="amount-text min-salary">¥{{ scope.row.min_salary }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="commission_total" label="提成总额" width="120">
                  <template #default="scope">
                    <span class="commission-text">¥{{ formatAmount(scope.row.commission_total) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="growth_rate" label="增长率" width="100">
                  <template #default="scope">
                    <span :class="scope.row.growth_rate >= 0 ? 'growth-positive' : 'growth-negative'">
                      {{ scope.row.growth_rate >= 0 ? '+' : '' }}{{ scope.row.growth_rate }}%
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增薪酬记录对话框 -->
    <el-dialog 
      title="新增薪酬记录" 
      v-model="createSalaryDialogVisible" 
      width="800px" 
      append-to-body
    >
      <el-form :model="salaryForm" :rules="salaryRules" ref="salaryFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务员" prop="salesman_id">
              <el-select 
                v-model="salaryForm.salesman_id" 
                placeholder="选择业务员" 
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
          <el-col :span="12">
            <el-form-item label="发放月份" prop="salary_month">
              <el-date-picker
                v-model="salaryForm.salary_month"
                type="month"
                placeholder="选择月份"
                format="YYYY-MM"
                value-format="YYYY-MM"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基本工资" prop="base_salary">
              <el-input-number 
                v-model="salaryForm.base_salary" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="绩效工资" prop="performance_salary">
              <el-input-number 
                v-model="salaryForm.performance_salary" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售提成" prop="commission">
              <el-input-number 
                v-model="salaryForm.commission" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖金" prop="bonus">
              <el-input-number 
                v-model="salaryForm.bonus" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="津贴" prop="allowance">
              <el-input-number 
                v-model="salaryForm.allowance" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="扣款" prop="deduction">
              <el-input-number 
                v-model="salaryForm.deduction" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input 
                v-model="salaryForm.remark" 
                type="textarea" 
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createSalaryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSalaryForm" :loading="salarySubmitting">
            {{ salarySubmitting ? '创建中...' : '创建记录' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量计算薪酬对话框 -->
    <el-dialog 
      title="批量计算薪酬" 
      v-model="batchCalculateDialogVisible" 
      width="600px" 
      append-to-body
    >
      <div class="batch-calculate-content">
        <el-alert
          title="批量计算说明"
          description="系统将根据设定的薪酬结构和业务员绩效数据自动计算薪酬。请确认计算参数后执行。"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />

        <el-form :model="batchCalculateForm" label-width="120px">
          <el-form-item label="计算月份">
            <el-date-picker
              v-model="batchCalculateForm.month"
              type="month"
              placeholder="选择月份"
              format="YYYY-MM"
              value-format="YYYY-MM"
              style="width: 100%;"
            />
          </el-form-item>

          <el-form-item label="计算范围">
            <el-radio-group v-model="batchCalculateForm.scope">
              <el-radio label="all">全部业务员</el-radio>
              <el-radio label="department">按部门</el-radio>
              <el-radio label="selected">指定业务员</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择业务员" v-if="batchCalculateForm.scope === 'selected'">
            <el-select 
              v-model="batchCalculateForm.salesman_ids" 
              multiple 
              placeholder="选择业务员"
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

          <el-form-item label="覆盖已有记录">
            <el-switch v-model="batchCalculateForm.override_existing" />
            <span class="form-tip">开启后将覆盖已存在的薪酬记录</span>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchCalculateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchCalculate" :loading="batchCalculating">
            {{ batchCalculating ? '计算中...' : '开始计算' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Money, Plus, TrendCharts, Clock, Coin, Setting, Trophy, 
  PieChart, DataAnalysis, ArrowDown, User, Reading, UserFilled
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getSalesmenList } from '@/api/salesman';

export default {
  name: 'SalesmenSalary',
  setup() {
    const router = useRouter();
    
    // 响应式数据
    const recordsLoading = ref(false);
    const statisticsLoading = ref(false);
    const chartsLoading = ref(false);
    const salarySubmitting = ref(false);
    const batchCalculating = ref(false);
    
    // 当前标签页
    const activeTab = ref('salary');
    
    // 业务员列表
    const salesmanList = ref([]);
    
    // 薪酬统计
    const salaryStats = reactive({
      totalSalary: 0,
      avgSalary: 0,
      pendingCount: 0,
      pendingAmount: 0,
      commissionRatio: 0,
      salaryGrowth: 0
    });
    
    // 薪酬记录数据
    const salaryRecords = ref([]);
    const recordsTotal = ref(0);
    const recordsQuery = reactive({
      page: 1,
      per_page: 20,
      month: '',
      status: '',
      salesman_id: '',
      keyword: ''
    });
    
    // 薪酬结构数据
    const salaryStructure = ref([]);
    const salaryLevels = ref([]);
    
    // 统计数据
    const statisticsData = ref([]);
    const statisticsQuery = reactive({
      period: 'current_month'
    });
    
    // 对话框
    const createSalaryDialogVisible = ref(false);
    const batchCalculateDialogVisible = ref(false);
    const salaryFormRef = ref(null);
    
    // 表单数据
    const salaryForm = reactive({
      salesman_id: '',
      salary_month: '',
      base_salary: 0,
      performance_salary: 0,
      commission: 0,
      bonus: 0,
      allowance: 0,
      deduction: 0,
      remark: ''
    });
    
    const batchCalculateForm = reactive({
      month: '',
      scope: 'all',
      salesman_ids: [],
      override_existing: false
    });
    
    // 表单验证规则
    const salaryRules = {
      salesman_id: [
        { required: true, message: '请选择业务员', trigger: 'change' }
      ],
      salary_month: [
        { required: true, message: '请选择发放月份', trigger: 'change' }
      ]
    };
    
    // 图表实例
    const salaryTrendChart = ref(null);
    const salaryDistributionChart = ref(null);
    let salaryTrendInstance = null;
    let salaryDistributionInstance = null;
    
    // 获取业务员列表
    const loadSalesmanList = async () => {
      try {
        const response = await getSalesmenList({ per_page: 1000 });
        if (response.code === 0 || response.code === 200) {
          salesmanList.value = response.data?.data || response.data || [];
        }
      } catch (error) {
        console.error('获取业务员列表失败:', error);
      }
    };
    
    // 加载薪酬统计
    const loadSalaryStats = async () => {
      try {
        // 模拟API调用
        const mockStats = {
          totalSalary: 1250000,
          avgSalary: 8500,
          pendingCount: 15,
          pendingAmount: 127500,
          commissionRatio: 35.2,
          salaryGrowth: 8.5
        };
        
        Object.assign(salaryStats, mockStats);
      } catch (error) {
        console.error('加载薪酬统计失败:', error);
      }
    };
    
    // 加载薪酬记录
    const loadSalaryRecords = async () => {
      recordsLoading.value = true;
      try {
        // 模拟API调用
        const mockData = {
          code: 200,
          data: {
            data: [
              {
                id: 1,
                salesman_name: '张三',
                avatar: '',
                salary_month: '2024-02',
                base_salary: 5000,
                performance_salary: 2000,
                commission: 3500,
                bonus: 1000,
                allowance: 500,
                deduction: 200,
                social_insurance: 800,
                personal_tax: 450,
                gross_salary: 12000,
                net_salary: 10550,
                status: 'paid',
                created_at: '2024-02-25 10:00:00',
                breakdown: [
                  { item_name: '基本工资', amount: 5000, description: '固定基本工资' },
                  { item_name: '绩效工资', amount: 2000, description: '月度绩效考核' },
                  { item_name: '销售提成', amount: 3500, description: '销售业绩提成' },
                  { item_name: '全勤奖', amount: 500, description: '全勤津贴' },
                  { item_name: '交通补贴', amount: 500, description: '交通津贴' }
                ]
              },
              {
                id: 2,
                salesman_name: '李四',
                avatar: '',
                salary_month: '2024-02',
                base_salary: 4500,
                performance_salary: 1800,
                commission: 2800,
                bonus: 0,
                allowance: 300,
                deduction: 0,
                social_insurance: 720,
                personal_tax: 320,
                gross_salary: 9400,
                net_salary: 8360,
                status: 'approved',
                created_at: '2024-02-25 10:30:00',
                breakdown: []
              }
            ],
            total: 2
          }
        };
        
        salaryRecords.value = mockData.data.data;
        recordsTotal.value = mockData.data.total;
        
      } catch (error) {
        console.error('加载薪酬记录失败:', error);
        ElMessage.error('加载薪酬记录失败');
      } finally {
        recordsLoading.value = false;
      }
    };
    
    // 加载薪酬结构
    const loadSalaryStructure = async () => {
      try {
        // 模拟薪酬结构数据
        const mockStructure = [
          {
            id: 1,
            name: '基本工资',
            description: '固定的基础薪酬，根据岗位等级确定',
            is_fixed: true,
            min_amount: 3000,
            max_amount: 8000,
            formula: null
          },
          {
            id: 2,
            name: '绩效工资',
            description: '根据月度绩效考核结果发放',
            is_fixed: false,
            min_amount: 0,
            max_amount: 5000,
            formula: '基本工资 × 绩效系数'
          },
          {
            id: 3,
            name: '销售提成',
            description: '根据销售业绩按比例提成',
            is_fixed: false,
            min_amount: 0,
            max_amount: null,
            formula: '销售额 × 提成比例'
          },
          {
            id: 4,
            name: '津贴补助',
            description: '包含交通、通讯、餐饮等各类补助',
            is_fixed: true,
            min_amount: 200,
            max_amount: 1000,
            formula: null
          }
        ];
        
        salaryStructure.value = mockStructure;
        
        // 模拟薪酬等级数据
        const mockLevels = [
          {
            id: 1,
            name: '初级业务员',
            level: 1,
            base_salary: 3500,
            commission_rate: 2.5,
            requirements: '入职满3个月，完成基础培训'
          },
          {
            id: 2,
            name: '中级业务员',
            level: 2,
            base_salary: 5000,
            commission_rate: 3.5,
            requirements: '工作满1年，月均销售额达10万'
          },
          {
            id: 3,
            name: '高级业务员',
            level: 3,
            base_salary: 6500,
            commission_rate: 4.5,
            requirements: '工作满2年，月均销售额达20万'
          },
          {
            id: 4,
            name: '资深业务员',
            level: 4,
            base_salary: 8000,
            commission_rate: 5.5,
            requirements: '工作满3年，月均销售额达30万'
          }
        ];
        
        salaryLevels.value = mockLevels;
        
      } catch (error) {
        console.error('加载薪酬结构失败:', error);
      }
    };
    
    // 加载统计数据
    const loadStatisticsData = async () => {
      statisticsLoading.value = true;
      try {
        // 模拟统计数据
        const mockData = [
          {
            department: '华东区',
            employee_count: 25,
            total_salary: 312500,
            avg_salary: 12500,
            max_salary: 18000,
            min_salary: 8000,
            commission_total: 87500,
            growth_rate: 12.5
          },
          {
            department: '华南区',
            employee_count: 20,
            total_salary: 240000,
            avg_salary: 12000,
            max_salary: 16000,
            min_salary: 7500,
            commission_total: 68000,
            growth_rate: 8.3
          },
          {
            department: '华北区',
            employee_count: 18,
            total_salary: 216000,
            avg_salary: 12000,
            max_salary: 15000,
            min_salary: 8500,
            commission_total: 59400,
            growth_rate: -2.1
          }
        ];
        
        statisticsData.value = mockData;
        
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        statisticsLoading.value = false;
      }
    };
    
    // 加载图表数据
    const loadChartData = async () => {
      chartsLoading.value = true;
      try {
        await nextTick();
        
        // 渲染薪酬趋势图
        renderSalaryTrendChart();
        
        // 渲染薪酬分布图
        renderSalaryDistributionChart();
        
      } catch (error) {
        console.error('加载图表数据失败:', error);
      } finally {
        chartsLoading.value = false;
      }
    };
    
    // 渲染薪酬趋势图
    const renderSalaryTrendChart = () => {
      if (!salaryTrendChart.value) return;
      
      if (salaryTrendInstance) {
        salaryTrendInstance.dispose();
      }
      
      salaryTrendInstance = echarts.init(salaryTrendChart.value);
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['总薪酬', '基本工资', '绩效工资', '销售提成']
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
            formatter: '{value}万'
          }
        },
        series: [
          {
            name: '总薪酬',
            type: 'line',
            smooth: true,
            data: [105, 125, 118, 132, 128, 135]
          },
          {
            name: '基本工资',
            type: 'line',
            smooth: true,
            data: [45, 48, 46, 50, 49, 52]
          },
          {
            name: '绩效工资',
            type: 'line',
            smooth: true,
            data: [25, 32, 28, 35, 31, 38]
          },
          {
            name: '销售提成',
            type: 'line',
            smooth: true,
            data: [35, 45, 44, 47, 48, 45]
          }
        ]
      };
      
      salaryTrendInstance.setOption(option);
    };
    
    // 渲染薪酬分布图
    const renderSalaryDistributionChart = () => {
      if (!salaryDistributionChart.value) return;
      
      if (salaryDistributionInstance) {
        salaryDistributionInstance.dispose();
      }
      
      salaryDistributionInstance = echarts.init(salaryDistributionChart.value);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c}万 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: ['基本工资', '绩效工资', '销售提成', '奖金津贴']
        },
        series: [
          {
            name: '薪酬构成',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 52, name: '基本工资' },
              { value: 38, name: '绩效工资' },
              { value: 45, name: '销售提成' },
              { value: 15, name: '奖金津贴' }
            ]
          }
        ]
      };
      
      salaryDistributionInstance.setOption(option);
    };
    
    // 工具函数
    const formatAmount = (amount) => {
      if (amount >= 10000) {
        return (amount / 10000).toFixed(1) + '万';
      }
      return amount.toLocaleString();
    };
    
    const getSalaryStatusType = (status) => {
      const types = {
        pending: 'info',
        reviewing: 'warning',
        approved: 'primary',
        paid: 'success',
        cancelled: 'danger'
      };
      return types[status] || 'default';
    };
    
    const getSalaryStatusText = (status) => {
      const texts = {
        pending: '待计算',
        reviewing: '待审核',
        approved: '待发放',
        paid: '已发放',
        cancelled: '已取消'
      };
      return texts[status] || '未知';
    };
    
    const getLevelTagType = (level) => {
      if (level <= 2) return 'info';
      if (level <= 3) return 'success';
      return 'warning';
    };
    
    // 事件处理
    const handleTabChange = (tab) => {
      activeTab.value = tab;
      if (tab === 'records') {
        loadSalaryRecords();
      } else if (tab === 'structure') {
        loadSalaryStructure();
      } else if (tab === 'statistics') {
        loadStatisticsData();
        loadChartData();
      }
    };
    
    const resetRecordsQuery = () => {
      Object.assign(recordsQuery, {
        page: 1,
        per_page: 20,
        month: '',
        status: '',
        salesman_id: '',
        keyword: ''
      });
      loadSalaryRecords();
    };
    
    const handleRecordsSizeChange = (size) => {
      recordsQuery.per_page = size;
      recordsQuery.page = 1;
      loadSalaryRecords();
    };
    
    const handleRecordsCurrentChange = (page) => {
      recordsQuery.page = page;
      loadSalaryRecords();
    };
    
    // 对话框操作
    const showCreateSalaryDialog = () => {
      resetSalaryForm();
      createSalaryDialogVisible.value = true;
    };
    
    const showBatchCalculateDialog = () => {
      resetBatchCalculateForm();
      batchCalculateDialogVisible.value = true;
    };
    
    const resetSalaryForm = () => {
      Object.assign(salaryForm, {
        salesman_id: '',
        salary_month: '',
        base_salary: 0,
        performance_salary: 0,
        commission: 0,
        bonus: 0,
        allowance: 0,
        deduction: 0,
        remark: ''
      });
    };
    
    const resetBatchCalculateForm = () => {
      Object.assign(batchCalculateForm, {
        month: '',
        scope: 'all',
        salesman_ids: [],
        override_existing: false
      });
    };
    
    const submitSalaryForm = () => {
      salaryFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        salarySubmitting.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          ElMessage.success('薪酬记录创建成功');
          createSalaryDialogVisible.value = false;
          loadSalaryRecords();
        } catch (error) {
          console.error('创建薪酬记录失败:', error);
          ElMessage.error('创建薪酬记录失败');
        } finally {
          salarySubmitting.value = false;
        }
      });
    };
    
    const submitBatchCalculate = async () => {
      if (!batchCalculateForm.month) {
        ElMessage.warning('请选择计算月份');
        return;
      }
      
      batchCalculating.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        ElMessage.success('批量计算薪酬完成');
        batchCalculateDialogVisible.value = false;
        loadSalaryRecords();
      } catch (error) {
        console.error('批量计算薪酬失败:', error);
        ElMessage.error('批量计算薪酬失败');
      } finally {
        batchCalculating.value = false;
      }
    };
    
    const calculateSalary = (record) => {
      ElMessage.success(`正在计算${record.salesman_name}的薪酬...`);
      loadSalaryRecords();
    };
    
    const approveSalary = (record) => {
      ElMessageBox.confirm(`确定审核通过${record.salesman_name}的薪酬吗？`, '确认审核', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('薪酬审核通过');
        loadSalaryRecords();
      });
    };
    
    const paySalary = (record) => {
      ElMessageBox.confirm(`确定发放${record.salesman_name}的薪酬吗？`, '确认发放', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('薪酬发放成功');
        loadSalaryRecords();
      });
    };
    
    const handleSalaryAction = ({ action, record }) => {
      switch (action) {
        case 'edit':
          Object.assign(salaryForm, { ...record });
          createSalaryDialogVisible.value = true;
          break;
        case 'detail':
          router.push(`/users/salesmen/salary/${record.id}`);
          break;
        case 'export':
          ElMessage.success(`正在导出${record.salesman_name}的工资条...`);
          break;
        case 'cancel':
          ElMessageBox.confirm('确定要取消此薪酬发放吗？', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            ElMessage.success('薪酬发放已取消');
            loadSalaryRecords();
          });
          break;
      }
    };
    
    const showStructureDialog = () => {
      ElMessage.info('薪酬结构配置功能开发中...');
    };
    
    const showLevelDialog = () => {
      ElMessage.info('薪酬等级管理功能开发中...');
    };
    
    // 业务员模块导航标签页
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
          router.push('/users/salesmen/team');
          break;
        case 'salary':
          // 当前页面，不需要跳转
          break;
        default:
          console.warn('未知的标签页:', tabName);
      }
    };

    // 显示批量发放对话框
    const showBatchPayDialog = () => {
      showBatchCalculateDialog();
    };
    
    // 生命周期
    onMounted(async () => {
      await loadSalesmanList();
      await loadSalaryStats();
      await loadSalaryRecords();
    });
    
    return {
      // 响应式数据
      recordsLoading,
      statisticsLoading,
      chartsLoading,
      salarySubmitting,
      batchCalculating,
      activeTab,
      salesmanList,
      salaryStats,
      salaryRecords,
      recordsTotal,
      recordsQuery,
      salaryStructure,
      salaryLevels,
      statisticsData,
      statisticsQuery,
      createSalaryDialogVisible,
      batchCalculateDialogVisible,
      salaryFormRef,
      salaryForm,
      batchCalculateForm,
      salaryRules,
      salaryTrendChart,
      salaryDistributionChart,
      
      // 方法
      loadSalaryRecords,
      loadStatisticsData,
      handleTabChange,
      handleTabClick,
      resetRecordsQuery,
      handleRecordsSizeChange,
      handleRecordsCurrentChange,
      showCreateSalaryDialog,
      showBatchCalculateDialog,
      showBatchPayDialog,
      submitSalaryForm,
      submitBatchCalculate,
      calculateSalary,
      approveSalary,
      paySalary,
      handleSalaryAction,
      showStructureDialog,
      showLevelDialog,
      
      // 工具函数
      formatAmount,
      getSalaryStatusType,
      getSalaryStatusText,
      getLevelTagType,
      
      // 图标
      Money,
      Plus,
      TrendCharts,
      Clock,
      Coin,
      Setting,
      Trophy,
      PieChart,
      DataAnalysis,
      ArrowDown,
      User,
      Reading,
      UserFilled
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

.total-salary .stats-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avg-salary .stats-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.pending-payment .stats-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.commission-ratio .stats-icon {
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

/* 业务员单元格 */
.salesman-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.salesman-name {
  font-weight: 600;
}

/* 金额样式 */
.amount-text {
  font-weight: 600;
  color: #303133;
}

.net-amount {
  color: #67c23a;
  font-size: 16px;
}

.commission-text {
  color: #e6a23c;
  font-weight: 600;
}

.max-salary {
  color: #f56c6c;
}

.min-salary {
  color: #909399;
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

/* 结构卡片样式 */
.structure-card,
.levels-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.structure-content,
.levels-content {
  max-height: 400px;
  overflow-y: auto;
}

.structure-item,
.level-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
}

.structure-item:last-child,
.level-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.item-header,
.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-name,
.level-name {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.item-content,
.level-content {
  color: #606266;
  line-height: 1.6;
}

.item-description {
  margin-bottom: 8px;
}

.item-formula {
  margin-bottom: 8px;
}

.formula-label,
.range-label,
.salary-label,
.commission-label,
.requirements-label {
  font-weight: 600;
  color: #909399;
  margin-right: 8px;
}

.item-formula code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.salary-amount {
  color: #67c23a;
  font-weight: 600;
}

.commission-rate {
  color: #e6a23c;
  font-weight: 600;
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

.salary-breakdown {
  margin-top: 20px;
}

.salary-breakdown h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}

/* 批量计算内容样式 */
.batch-calculate-content {
  padding: 10px 0;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
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

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style> 