<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><Medal /></el-icon>
            业务员绩效管理
          </h1>
          <p class="page-description">业务员绩效考核、目标管理与奖惩记录</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showCreatePerformanceDialog">
            <el-icon><Plus /></el-icon>
            新增绩效记录
          </el-button>
          <el-button type="success" size="large" @click="showBatchEvaluationDialog">
            <el-icon><Document /></el-icon>
            批量考核
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

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="filter-header">
          <el-icon class="filter-icon"><Search /></el-icon>
          <span class="filter-title">筛选条件</span>
        </div>
      </template>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="考核周期">
          <el-select v-model="queryParams.period" @change="handleSearch" style="width: 150px;">
            <el-option label="全部周期" value="" />
            <el-option label="本月" value="month" />
            <el-option label="本季度" value="quarter" />
            <el-option label="本年度" value="year" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="queryParams.period === 'custom'" label="自定义时间">
          <el-date-picker
            v-model="customDateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="YYYY-MM"
            @change="handleSearch"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item label="业务员">
          <el-select 
            v-model="queryParams.salesman_id" 
            placeholder="选择业务员" 
            clearable 
            filterable
            style="width: 200px;"
            @change="handleSearch"
          >
            <el-option label="全部业务员" value="" />
            <el-option 
              v-for="salesman in salesmanList" 
              :key="salesman.id" 
              :label="salesman.name" 
              :value="salesman.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="绩效等级">
          <el-select v-model="queryParams.grade" @change="handleSearch" style="width: 120px;">
            <el-option label="全部等级" value="" />
            <el-option label="优秀" value="excellent" />
            <el-option label="良好" value="good" />
            <el-option label="合格" value="qualified" />
            <el-option label="待改进" value="improvement" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 绩效概览统计 -->
    <div class="stats-dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card excellent-count" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ performanceStats.excellentCount }}</div>
                <div class="stats-label">优秀人数</div>
                <div class="stats-percentage">{{ getPercentage(performanceStats.excellentCount) }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card good-count" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Medal /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ performanceStats.goodCount }}</div>
                <div class="stats-label">良好人数</div>
                <div class="stats-percentage">{{ getPercentage(performanceStats.goodCount) }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card qualified-count" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ performanceStats.qualifiedCount }}</div>
                <div class="stats-label">合格人数</div>
                <div class="stats-percentage">{{ getPercentage(performanceStats.qualifiedCount) }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card improvement-count" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ performanceStats.improvementCount }}</div>
                <div class="stats-label">待改进人数</div>
                <div class="stats-percentage">{{ getPercentage(performanceStats.improvementCount) }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 绩效数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon><List /></el-icon>
            <span>绩效记录</span>
            <el-tag v-if="total > 0" type="info" size="small">{{ total }}条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" @click="exportPerformanceData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="performanceList"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#495057' }"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-content">
              <el-descriptions title="绩效详情" :column="2" border>
                <el-descriptions-item label="考核周期">{{ props.row.period }}</el-descriptions-item>
                <el-descriptions-item label="总分">{{ props.row.total_score }}分</el-descriptions-item>
                <el-descriptions-item label="销售业绩分">{{ props.row.sales_score }}分</el-descriptions-item>
                <el-descriptions-item label="客户满意度分">{{ props.row.customer_score }}分</el-descriptions-item>
                <el-descriptions-item label="团队协作分">{{ props.row.teamwork_score }}分</el-descriptions-item>
                <el-descriptions-item label="学习成长分">{{ props.row.learning_score }}分</el-descriptions-item>
                <el-descriptions-item label="考核人">{{ props.row.evaluator_name }}</el-descriptions-item>
                <el-descriptions-item label="考核时间">{{ props.row.evaluated_at }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ props.row.remarks || '无' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="salesman_name" label="业务员" width="120" />
        <el-table-column prop="employee_id" label="员工编号" width="120" />
        <el-table-column prop="period" label="考核周期" width="120" />
        <el-table-column prop="total_score" label="总分" width="100" sortable>
          <template #default="scope">
            <span class="score-text" :class="getScoreClass(scope.row.total_score)">
              {{ scope.row.total_score }}分
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="绩效等级" width="120">
          <template #default="scope">
            <el-tag :type="getGradeType(scope.row.grade)" effect="dark">
              {{ getGradeText(scope.row.grade) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="各项得分" width="200">
          <template #default="scope">
            <div class="score-breakdown">
              <el-tag size="small" type="primary">销售: {{ scope.row.sales_score }}分</el-tag>
              <el-tag size="small" type="success">客户: {{ scope.row.customer_score }}分</el-tag>
              <el-tag size="small" type="warning">团队: {{ scope.row.teamwork_score }}分</el-tag>
              <el-tag size="small" type="info">学习: {{ scope.row.learning_score }}分</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="evaluator_name" label="考核人" width="100" />
        <el-table-column prop="evaluated_at" label="考核时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="viewPerformanceDetail(scope.row)">
                查看详情
              </el-button>
              <el-button type="warning" size="small" @click="editPerformance(scope.row)">
                编辑
              </el-button>
              <el-popconfirm
                title="确定要删除此绩效记录吗？"
                @confirm="deletePerformance(scope.row.id)"
              >
                <template #reference>
                  <el-button type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="queryParams.per_page"
          :current-page="queryParams.page"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设备销售提成管理 -->
    <el-card class="commission-management-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Money /></el-icon>
            <span class="header-title">设备销售提成管理</span>
            <span class="header-subtitle">基于设备销售的30%提成计算与管理</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showCommissionPreviewDialog" :disabled="!commissionFilters.salesman_id">
              <el-icon><View /></el-icon>
              预览提成计算
            </el-button>
            <el-button type="success" @click="showCommissionGenerateDialog" :disabled="!commissionFilters.salesman_id">
              <el-icon><Plus /></el-icon>
              生成提成记录
            </el-button>
            <el-button type="warning" @click="showCommissionSyncDialog" :disabled="!commissionFilters.salesman_id">
              <el-icon><RefreshLeft /></el-icon>
              同步设备销售
            </el-button>
          </div>
        </div>
      </template>

      <!-- 提成筛选条件 -->
      <div class="commission-filters">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="业务员">
            <el-select 
              v-model="commissionFilters.salesman_id" 
              placeholder="选择业务员" 
              clearable 
              filterable
              style="width: 200px;"
              @change="handleCommissionFilterChange"
            >
              <el-option label="全部业务员" value="" />
              <el-option 
                v-for="salesman in salesmanList" 
                :key="salesman.id" 
                :label="salesman.name" 
                :value="salesman.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-select v-model="commissionFilters.time_range" @change="handleCommissionTimeRangeChange" style="width: 120px;">
              <el-option label="本月" value="month"></el-option>
              <el-option label="本季度" value="quarter"></el-option>
              <el-option label="本年" value="year"></el-option>
              <el-option label="自定义" value="custom"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="commissionFilters.time_range === 'custom'" label="自定义日期">
            <el-date-picker
              v-model="commissionCustomDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleCommissionCustomDateChange"
              style="width: 240px;">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshCommissionData" :loading="commissionLoading">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 提成明细表格 -->
      <el-table :data="commissionDetails" v-loading="commissionLoading" stripe max-height="400">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column type="index" label="序号" width="60"></el-table-column>
        <el-table-column prop="device_number" label="设备编号" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="customer_name" label="客户姓名" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="customer_phone" label="客户电话" width="130" show-overflow-tooltip></el-table-column>
        <el-table-column prop="order_amount" label="订单金额" width="120" sortable>
          <template #default="scope">
            ¥{{ parseFloat(scope.row.order_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="commission_rate" label="提成比例" width="100" align="center">
          <template #default="scope">
            <el-tag type="warning" size="small">{{ scope.row.commission_rate || 30 }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="commission_amount" label="提成金额" width="120" sortable>
          <template #default="scope">
            <span class="commission-amount">¥{{ parseFloat(scope.row.commission_amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="订单日期" width="120" sortable>
          <template #default="scope">
            {{ scope.row.order_date ? scope.row.order_date.split(' ')[0] : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="billing_mode" label="计费模式" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.billing_mode === '1' ? 'primary' : 'success'" size="small">
              {{ scope.row.billing_mode === '1' ? '流量计费' : '包年计费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="surrogate_type" label="充值类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.surrogate_type === '1' ? 'warning' : 'info'" size="small">
              {{ scope.row.surrogate_type === '1' ? '代充' : '自充' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="commission_status" label="提成状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getCommissionStatusType(scope.row.commission_status)"
              effect="dark"
              size="small"
            >
              {{ getCommissionStatusText(scope.row.commission_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="记录时间" width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.created_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewCommissionDetail(scope.row)"
              :disabled="!scope.row.id"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 提成明细分页 -->
      <div class="pagination-container" v-if="commissionDetails.length > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="commissionTotal"
          :page-size="commissionPageSize"
          :current-page="commissionCurrentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleCommissionSizeChange"
          @current-change="handleCommissionCurrentChange"
        />
      </div>
      
      <!-- 批量操作按钮 -->
      <div class="batch-actions" v-if="commissionDetails.length > 0">
        <el-button type="success" @click="batchCalculateCommission" :disabled="!hasSelectedCommissions">
          <el-icon><Operation /></el-icon>
          批量计算提成
        </el-button>
        <el-button type="warning" @click="batchSettleCommission" :disabled="!hasSelectedCommissions">
          <el-icon><Money /></el-icon>
          批量结算提成
        </el-button>
        <el-button type="info" @click="exportCommissionData">
          <el-icon><Download /></el-icon>
          导出提成数据
        </el-button>
      </div>
    </el-card>

    <!-- 新增/编辑绩效对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px" 
      append-to-body
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务员" prop="salesman_id">
              <el-select 
                v-model="form.salesman_id" 
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
            <el-form-item label="考核周期" prop="period">
              <el-date-picker
                v-model="form.period"
                type="month"
                placeholder="选择考核月份"
                value-format="YYYY-MM"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">绩效评分</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售业绩分" prop="sales_score">
              <el-input-number 
                v-model="form.sales_score" 
                :min="0" 
                :max="100" 
                style="width: 100%;"
                @change="calculateTotalScore"
              />
              <div class="score-tip">满分100分，根据销售目标完成情况评分</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户满意度分" prop="customer_score">
              <el-input-number 
                v-model="form.customer_score" 
                :min="0" 
                :max="100" 
                style="width: 100%;"
                @change="calculateTotalScore"
              />
              <div class="score-tip">满分100分，根据客户反馈评分</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队协作分" prop="teamwork_score">
              <el-input-number 
                v-model="form.teamwork_score" 
                :min="0" 
                :max="100" 
                style="width: 100%;"
                @change="calculateTotalScore"
              />
              <div class="score-tip">满分100分，根据团队合作表现评分</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学习成长分" prop="learning_score">
              <el-input-number 
                v-model="form.learning_score" 
                :min="0" 
                :max="100" 
                style="width: 100%;"
                @change="calculateTotalScore"
              />
              <div class="score-tip">满分100分，根据学习培训参与度评分</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="总分">
              <el-input 
                v-model="totalScoreDisplay" 
                readonly 
                style="width: 200px;"
              >
                <template #append>分</template>
              </el-input>
              <el-tag 
                :type="getGradeType(calculatedGrade)" 
                style="margin-left: 10px;"
                effect="dark"
              >
                {{ getGradeText(calculatedGrade) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input 
                v-model="form.remarks" 
                type="textarea" 
                :rows="3"
                placeholder="请输入绩效评价备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量考核对话框 -->
    <el-dialog 
      title="批量绩效考核" 
      v-model="batchDialogVisible" 
      width="600px" 
      append-to-body
    >
      <el-form :model="batchForm" label-width="120px">
        <el-form-item label="考核周期">
          <el-date-picker
            v-model="batchForm.period"
            type="month"
            placeholder="选择考核月份"
            value-format="YYYY-MM"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="选择业务员">
          <el-select 
            v-model="batchForm.salesman_ids" 
            multiple 
            placeholder="选择要考核的业务员" 
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
        <el-form-item label="默认评分">
          <el-row :gutter="10">
            <el-col :span="6">
              <el-input-number v-model="batchForm.default_sales_score" :min="0" :max="100" placeholder="销售" />
            </el-col>
            <el-col :span="6">
              <el-input-number v-model="batchForm.default_customer_score" :min="0" :max="100" placeholder="客户" />
            </el-col>
            <el-col :span="6">
              <el-input-number v-model="batchForm.default_teamwork_score" :min="0" :max="100" placeholder="团队" />
            </el-col>
            <el-col :span="6">
              <el-input-number v-model="batchForm.default_learning_score" :min="0" :max="100" placeholder="学习" />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchEvaluation" :loading="batchSubmitting">
            {{ batchSubmitting ? '处理中...' : '开始批量考核' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 提成预览对话框 -->
    <el-dialog v-model="commissionPreviewDialogVisible" title="设备销售提成预览" width="80%" :before-close="handleCommissionPreviewClose">
      <div v-loading="commissionPreviewLoading">
        <div class="preview-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <div class="label">统计期间</div>
                <div class="value">{{ commissionPreviewData.period?.start_date }} 至 {{ commissionPreviewData.period?.end_date }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="label">设备数量</div>
                <div class="value">{{ commissionPreviewData.devices_count || 0 }}台</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="label">提成总额</div>
                <div class="value commission-total">¥{{ commissionPreviewData.total_commission || '0.00' }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="label">提成比例</div>
                <div class="value">{{ commissionPreviewData.commission_rate || 30 }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <el-table :data="commissionPreviewData.commissions" stripe max-height="400">
          <el-table-column prop="device_number" label="设备编号" width="150"></el-table-column>
          <el-table-column prop="customer_name" label="客户姓名" width="120"></el-table-column>
          <el-table-column prop="order_amount" label="订单金额" width="120">
            <template #default="scope">
              ¥{{ scope.row.order_amount }}
            </template>
          </el-table-column>
          <el-table-column prop="commission_amount" label="提成金额" width="120">
            <template #default="scope">
              <span class="commission-amount">¥{{ scope.row.commission_amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="order_date" label="订单日期" width="120"></el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commissionPreviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateCommissionFromPreview" :loading="commissionGenerateLoading">
            生成提成记录
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 生成提成记录对话框 -->
    <el-dialog v-model="commissionGenerateDialogVisible" title="生成设备销售提成记录" width="50%">
      <el-form :model="commissionGenerateForm" :rules="commissionGenerateRules" ref="commissionGenerateFormRef" label-width="100px">
        <el-form-item label="业务员" prop="salesman_id">
          <el-select v-model="commissionGenerateForm.salesman_id" placeholder="选择业务员" style="width: 100%">
            <el-option
              v-for="salesman in salesmanList"
              :key="salesman.id"
              :label="salesman.name"
              :value="salesman.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="提成周期" prop="period">
          <el-input v-model="commissionGenerateForm.period" placeholder="例如：2024-01"></el-input>
        </el-form-item>
        
        <el-form-item label="统计日期" prop="dateRange">
          <el-date-picker
            v-model="commissionGenerateForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%">
          </el-date-picker>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commissionGenerateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateCommissionRecord" :loading="commissionGenerateLoading">
            生成记录
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 同步设备销售对话框 -->
    <el-dialog v-model="commissionSyncDialogVisible" title="同步设备销售数据" width="50%">
      <el-form :model="commissionSyncForm" :rules="commissionSyncRules" ref="commissionSyncFormRef" label-width="100px">
        <el-form-item label="业务员" prop="salesman_id">
          <el-select v-model="commissionSyncForm.salesman_id" placeholder="选择业务员" style="width: 100%">
            <el-option
              v-for="salesman in salesmanList"
              :key="salesman.id"
              :label="salesman.name"
              :value="salesman.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="同步日期" prop="dateRange">
          <el-date-picker
            v-model="commissionSyncForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%">
          </el-date-picker>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commissionSyncDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="syncDeviceSales" :loading="commissionSyncLoading">
            开始同步
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Medal, Plus, Document, Search, RefreshLeft, Trophy, CircleCheck, Warning,
  List, Download, User, DataAnalysis, TrendCharts, Reading, Money, View, Operation
} from '@element-plus/icons-vue';
import { getSalesmenList } from '@/api/salesman';
import request from '@/utils/request';

export default {
  name: 'SalesmenPerformance',
  setup() {
    const router = useRouter();
    
    // 响应式数据
    const loading = ref(false);
    const submitting = ref(false);
    const batchSubmitting = ref(false);
    
    // 查询参数
    const queryParams = reactive({
      page: 1,
      per_page: 20,
      period: '',
      salesman_id: '',
      grade: ''
    });
    
    const customDateRange = ref([]);
    
    // 业务员列表
    const salesmanList = ref([]);
    
    // 绩效数据
    const performanceList = ref([]);
    const total = ref(0);
    
    // 绩效统计
    const performanceStats = reactive({
      excellentCount: 0,
      goodCount: 0,
      qualifiedCount: 0,
      improvementCount: 0,
      totalCount: 0
    });
    
    // 对话框
    const dialogVisible = ref(false);
    const batchDialogVisible = ref(false);
    const formRef = ref(null);
    
    // 表单数据
    const form = reactive({
      id: null,
      salesman_id: '',
      period: '',
      sales_score: 0,
      customer_score: 0,
      teamwork_score: 0,
      learning_score: 0,
      total_score: 0,
      grade: '',
      remarks: ''
    });
    
    // 批量考核表单
    const batchForm = reactive({
      period: '',
      salesman_ids: [],
      default_sales_score: 80,
      default_customer_score: 80,
      default_teamwork_score: 80,
      default_learning_score: 80
    });
    
    // 表单验证规则
    const rules = {
      salesman_id: [
        { required: true, message: '请选择业务员', trigger: 'change' }
      ],
      period: [
        { required: true, message: '请选择考核周期', trigger: 'change' }
      ],
      sales_score: [
        { required: true, message: '请输入销售业绩分', trigger: 'blur' }
      ],
      customer_score: [
        { required: true, message: '请输入客户满意度分', trigger: 'blur' }
      ],
      teamwork_score: [
        { required: true, message: '请输入团队协作分', trigger: 'blur' }
      ],
      learning_score: [
        { required: true, message: '请输入学习成长分', trigger: 'blur' }
      ]
    };
    
    // 计算属性
    const dialogTitle = computed(() => {
      return form.id ? '编辑绩效记录' : '新增绩效记录';
    });
    
    const totalScoreDisplay = computed(() => {
      const total = (form.sales_score || 0) + (form.customer_score || 0) + 
                   (form.teamwork_score || 0) + (form.learning_score || 0);
      return (total / 4).toFixed(1);
    });
    
    const calculatedGrade = computed(() => {
      const score = parseFloat(totalScoreDisplay.value);
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'qualified';
      return 'improvement';
    });
    
    // 业务员模块导航标签页
    const activeTab = ref('performance');
    
    // 提成管理相关数据
    const commissionLoading = ref(false);
    const commissionPreviewLoading = ref(false);
    const commissionGenerateLoading = ref(false);
    const commissionSyncLoading = ref(false);
    
    // 提成筛选条件
    const commissionFilters = reactive({
      salesman_id: '',
      time_range: 'month',
      start_date: '',
      end_date: ''
    });
    
    const commissionCustomDateRange = ref([]);
    
    // 提成数据
    const commissionDetails = ref([]);
    
    // 提成分页数据
    const commissionTotal = ref(0);
    const commissionPageSize = ref(20);
    const commissionCurrentPage = ref(1);
    const selectedCommissions = ref([]);
    
    // 提成对话框状态
    const commissionPreviewDialogVisible = ref(false);
    const commissionGenerateDialogVisible = ref(false);
    const commissionSyncDialogVisible = ref(false);
    
    // 提成预览数据
    const commissionPreviewData = ref({});
    
    // 提成表单数据
    const commissionGenerateForm = reactive({
      salesman_id: '',
      period: '',
      dateRange: []
    });
    
    const commissionSyncForm = reactive({
      salesman_id: '',
      dateRange: []
    });
    
    // 提成表单验证规则
    const commissionGenerateRules = {
      salesman_id: [{ required: true, message: '请选择业务员', trigger: 'change' }],
      period: [{ required: true, message: '请输入提成周期', trigger: 'blur' }],
      dateRange: [{ required: true, message: '请选择统计日期', trigger: 'change' }]
    };
    
    const commissionSyncRules = {
      salesman_id: [{ required: true, message: '请选择业务员', trigger: 'change' }],
      dateRange: [{ required: true, message: '请选择同步日期', trigger: 'change' }]
    };
    
    // 计算属性
    const hasSelectedCommissions = computed(() => {
      return selectedCommissions.value.length > 0;
    });
    
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
          // 当前页面，不需要跳转
          break;
        case 'training':
          router.push('/users/salesmen/training');
          break;
        case 'team':
          router.push('/users/salesmen/team');
          break;
        case 'salary':
          router.push('/users/salesmen/salary');
          break;
        default:
          console.warn('未知的标签页:', tabName);
      }
    };
    
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
    
    // 加载绩效数据
    const loadPerformanceData = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        const mockData = {
          code: 200,
          data: {
            data: [
              {
                id: 1,
                salesman_name: '张三',
                employee_id: 'EMP001',
                period: '2024-01',
                sales_score: 85,
                customer_score: 90,
                teamwork_score: 80,
                learning_score: 88,
                total_score: 85.8,
                grade: 'good',
                evaluator_name: '李经理',
                evaluated_at: '2024-02-01 10:00:00',
                remarks: '表现良好，继续保持'
              },
              {
                id: 2,
                salesman_name: '李四',
                employee_id: 'EMP002',
                period: '2024-01',
                sales_score: 95,
                customer_score: 92,
                teamwork_score: 90,
                learning_score: 93,
                total_score: 92.5,
                grade: 'excellent',
                evaluator_name: '王总监',
                evaluated_at: '2024-02-01 11:00:00',
                remarks: '表现优秀，值得表扬'
              }
            ],
            total: 2
          }
        };
        
        performanceList.value = mockData.data.data;
        total.value = mockData.data.total;
        
        // 计算统计数据
        calculateStats();
        
      } catch (error) {
        console.error('加载绩效数据失败:', error);
        ElMessage.error('加载绩效数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 计算统计数据
    const calculateStats = () => {
      const stats = {
        excellentCount: 0,
        goodCount: 0,
        qualifiedCount: 0,
        improvementCount: 0,
        totalCount: performanceList.value.length
      };
      
      performanceList.value.forEach(item => {
        switch (item.grade) {
          case 'excellent':
            stats.excellentCount++;
            break;
          case 'good':
            stats.goodCount++;
            break;
          case 'qualified':
            stats.qualifiedCount++;
            break;
          case 'improvement':
            stats.improvementCount++;
            break;
        }
      });
      
      Object.assign(performanceStats, stats);
    };
    
    // 计算总分
    const calculateTotalScore = () => {
      const total = (form.sales_score || 0) + (form.customer_score || 0) + 
                   (form.teamwork_score || 0) + (form.learning_score || 0);
      form.total_score = parseFloat((total / 4).toFixed(1));
      form.grade = calculatedGrade.value;
    };
    
    // 工具函数
    const getPercentage = (count) => {
      if (performanceStats.totalCount === 0) return 0;
      return ((count / performanceStats.totalCount) * 100).toFixed(1);
    };
    
    const getGradeType = (grade) => {
      const types = {
        excellent: 'success',
        good: 'primary',
        qualified: 'warning',
        improvement: 'danger'
      };
      return types[grade] || 'info';
    };
    
    const getGradeText = (grade) => {
      const texts = {
        excellent: '优秀',
        good: '良好',
        qualified: '合格',
        improvement: '待改进'
      };
      return texts[grade] || '未知';
    };
    
    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'qualified';
      return 'improvement';
    };
    
    // 事件处理
    const handleSearch = () => {
      queryParams.page = 1;
      loadPerformanceData();
    };
    
    const resetQuery = () => {
      Object.assign(queryParams, {
        page: 1,
        per_page: 20,
        period: '',
        salesman_id: '',
        grade: ''
      });
      customDateRange.value = [];
      loadPerformanceData();
    };
    
    const handleSizeChange = (size) => {
      queryParams.per_page = size;
      queryParams.page = 1;
      loadPerformanceData();
    };
    
    const handleCurrentChange = (page) => {
      queryParams.page = page;
      loadPerformanceData();
    };
    
    // 对话框操作
    const showCreatePerformanceDialog = () => {
      resetForm();
      dialogVisible.value = true;
    };
    
    const showBatchEvaluationDialog = () => {
      Object.assign(batchForm, {
        period: '',
        salesman_ids: [],
        default_sales_score: 80,
        default_customer_score: 80,
        default_teamwork_score: 80,
        default_learning_score: 80
      });
      batchDialogVisible.value = true;
    };
    
    const resetForm = () => {
      Object.assign(form, {
        id: null,
        salesman_id: '',
        period: '',
        sales_score: 0,
        customer_score: 0,
        teamwork_score: 0,
        learning_score: 0,
        total_score: 0,
        grade: '',
        remarks: ''
      });
    };
    
    const editPerformance = (row) => {
      Object.assign(form, { ...row });
      dialogVisible.value = true;
    };
    
    const viewPerformanceDetail = (row) => {
      router.push(`/users/salesmen/performance/${row.id}`);
    };
    
    const submitForm = () => {
      formRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submitting.value = true;
        try {
          calculateTotalScore();
          
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          ElMessage.success(form.id ? '绩效记录更新成功' : '绩效记录创建成功');
          dialogVisible.value = false;
          loadPerformanceData();
        } catch (error) {
          console.error('保存绩效记录失败:', error);
          ElMessage.error('保存绩效记录失败');
        } finally {
          submitting.value = false;
        }
      });
    };
    
    const submitBatchEvaluation = async () => {
      if (!batchForm.period || batchForm.salesman_ids.length === 0) {
        ElMessage.warning('请选择考核周期和业务员');
        return;
      }
      
      batchSubmitting.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        ElMessage.success(`成功为${batchForm.salesman_ids.length}名业务员创建绩效记录`);
        batchDialogVisible.value = false;
        loadPerformanceData();
      } catch (error) {
        console.error('批量考核失败:', error);
        ElMessage.error('批量考核失败');
      } finally {
        batchSubmitting.value = false;
      }
    };
    
    const deletePerformance = async (id) => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        ElMessage.success('绩效记录删除成功');
        loadPerformanceData();
      } catch (error) {
        console.error('删除绩效记录失败:', error);
        ElMessage.error('删除绩效记录失败');
      }
    };
    
    const exportPerformanceData = () => {
      ElMessage.info('导出功能开发中...');
    };
    
    // 提成管理相关方法
    const fetchCommissionDetails = async () => {
      if (!commissionFilters.salesman_id) {
        commissionDetails.value = [];
        commissionTotal.value = 0;
        return;
      }
      
      commissionLoading.value = true;
      try {
        const params = {
          salesman_id: commissionFilters.salesman_id,
          time_range: commissionFilters.time_range,
          page: commissionCurrentPage.value,
          per_page: commissionPageSize.value
        };
        
        if (commissionFilters.start_date && commissionFilters.end_date) {
          params.start_date = commissionFilters.start_date;
          params.end_date = commissionFilters.end_date;
        }
        
        // 调用真实的API获取设备销售统计数据
        const response = await request.get('/api/admin/v1/salesman-sales/device-sales-stats', { params });
        
        if (response.data && response.data.code === 200) {
          const data = response.data.data;
          // 设置提成明细数据
          commissionDetails.value = data.commissions || [];
          commissionTotal.value = data.total || 0;
        } else {
          console.error('API返回错误:', response.data);
          commissionDetails.value = [];
          commissionTotal.value = 0;
          ElMessage.error(response.data?.message || '获取提成数据失败');
        }
      } catch (error) {
        console.error('获取提成明细失败:', error);
        commissionDetails.value = [];
        commissionTotal.value = 0;
        ElMessage.error('获取提成明细失败: ' + (error.response?.data?.message || error.message));
      } finally {
        commissionLoading.value = false;
      }
    };
    
    const handleCommissionFilterChange = () => {
      fetchCommissionDetails();
    };
    
    const handleCommissionTimeRangeChange = () => {
      if (commissionFilters.time_range !== 'custom') {
        commissionFilters.start_date = '';
        commissionFilters.end_date = '';
        commissionCustomDateRange.value = [];
      }
      fetchCommissionDetails();
    };
    
    const handleCommissionCustomDateChange = (dates) => {
      if (dates && dates.length === 2) {
        commissionFilters.start_date = dates[0];
        commissionFilters.end_date = dates[1];
        fetchCommissionDetails();
      }
    };
    
    const refreshCommissionData = () => {
      fetchCommissionDetails();
    };
    
    const showCommissionPreviewDialog = async () => {
      if (!commissionFilters.salesman_id) {
        ElMessage.warning('请先选择业务员');
        return;
      }
      
      commissionPreviewDialogVisible.value = true;
      commissionPreviewLoading.value = true;
      
      try {
        const params = {
          salesman_id: commissionFilters.salesman_id,
          time_range: commissionFilters.time_range
        };
        
        if (commissionFilters.start_date && commissionFilters.end_date) {
          params.start_date = commissionFilters.start_date;
          params.end_date = commissionFilters.end_date;
        }
        
        // 调用预览提成计算API
        const response = await request.post('/api/admin/v1/salesman-commissions/preview-device-commissions', params);
        
        if (response.data && response.data.code === 200) {
          commissionPreviewData.value = response.data.data;
        } else {
          console.error('预览API返回错误:', response.data);
          ElMessage.error(response.data?.message || '预览提成计算失败');
          commissionPreviewDialogVisible.value = false;
        }
      } catch (error) {
        console.error('预览提成计算失败:', error);
        ElMessage.error('预览提成计算失败: ' + (error.response?.data?.message || error.message));
        commissionPreviewDialogVisible.value = false;
      } finally {
        commissionPreviewLoading.value = false;
      }
    };
    
    const showCommissionGenerateDialog = () => {
      if (!commissionFilters.salesman_id) {
        ElMessage.warning('请先选择业务员');
        return;
      }
      
      commissionGenerateForm.salesman_id = commissionFilters.salesman_id;
      commissionGenerateForm.period = new Date().toISOString().slice(0, 7);
      commissionGenerateForm.dateRange = [getDefaultStartDate(), getDefaultEndDate()];
      commissionGenerateDialogVisible.value = true;
    };
    
    const showCommissionSyncDialog = () => {
      if (!commissionFilters.salesman_id) {
        ElMessage.warning('请先选择业务员');
        return;
      }
      
      commissionSyncForm.salesman_id = commissionFilters.salesman_id;
      commissionSyncForm.dateRange = [getDefaultStartDate(), getDefaultEndDate()];
      commissionSyncDialogVisible.value = true;
    };
    
    const generateCommissionFromPreview = async () => {
      if (!commissionPreviewData.value.period) {
        ElMessage.error('预览数据不完整');
        return;
      }
      
      commissionGenerateLoading.value = true;
      
      try {
        const params = {
          salesman_id: commissionFilters.salesman_id,
          period: commissionPreviewData.value.period.start_date + ' 至 ' + commissionPreviewData.value.period.end_date,
          start_date: commissionPreviewData.value.period.start_date,
          end_date: commissionPreviewData.value.period.end_date
        };
        
        // 调用自动计算设备提成API
        const response = await request.post('/api/admin/v1/salesman-commissions/auto-calculate-from-devices', params);
        
        if (response.data && response.data.code === 200) {
          ElMessage.success('提成记录生成成功');
          commissionPreviewDialogVisible.value = false;
          fetchCommissionDetails();
        } else {
          console.error('生成API返回错误:', response.data);
          ElMessage.error(response.data?.message || '生成提成记录失败');
        }
      } catch (error) {
        console.error('生成提成记录失败:', error);
        ElMessage.error('生成提成记录失败: ' + (error.response?.data?.message || error.message));
      } finally {
        commissionGenerateLoading.value = false;
      }
    };
    
    const generateCommissionRecord = async () => {
      if (!commissionGenerateForm.salesman_id || !commissionGenerateForm.period || !commissionGenerateForm.dateRange.length) {
        ElMessage.warning('请填写完整的表单信息');
        return;
      }
      
      commissionGenerateLoading.value = true;
      
      try {
        const params = {
          salesman_id: commissionGenerateForm.salesman_id,
          period: commissionGenerateForm.period,
          start_date: commissionGenerateForm.dateRange[0],
          end_date: commissionGenerateForm.dateRange[1]
        };
        
        // 调用自动计算设备提成API
        const response = await request.post('/api/admin/v1/salesman-commissions/auto-calculate-from-devices', params);
        
        if (response.data && response.data.code === 200) {
          ElMessage.success('提成记录生成成功');
          commissionGenerateDialogVisible.value = false;
          fetchCommissionDetails();
        } else {
          console.error('生成API返回错误:', response.data);
          ElMessage.error(response.data?.message || '生成提成记录失败');
        }
      } catch (error) {
        console.error('生成提成记录失败:', error);
        ElMessage.error('生成提成记录失败: ' + (error.response?.data?.message || error.message));
      } finally {
        commissionGenerateLoading.value = false;
      }
    };
    
    const syncDeviceSales = async () => {
      if (!commissionSyncForm.salesman_id || !commissionSyncForm.dateRange.length) {
        ElMessage.warning('请填写完整的表单信息');
        return;
      }
      
      commissionSyncLoading.value = true;
      
      try {
        const params = {
          salesman_id: commissionSyncForm.salesman_id,
          start_date: commissionSyncForm.dateRange[0],
          end_date: commissionSyncForm.dateRange[1]
        };
        
        // 调用同步设备销售API
        const response = await request.post('/api/admin/v1/salesman-sales/sync-device-sales', params);
        
        if (response.data && response.data.code === 200) {
          const data = response.data.data;
          ElMessage.success(`同步成功：${data.synced_count || 0}条记录，提成总额：¥${data.total_commission || '0.00'}`);
          commissionSyncDialogVisible.value = false;
          fetchCommissionDetails();
        } else {
          console.error('同步API返回错误:', response.data);
          ElMessage.error(response.data?.message || '同步设备销售数据失败');
        }
      } catch (error) {
        console.error('同步设备销售数据失败:', error);
        ElMessage.error('同步设备销售数据失败: ' + (error.response?.data?.message || error.message));
      } finally {
        commissionSyncLoading.value = false;
      }
    };
    
    const handleCommissionPreviewClose = () => {
      commissionPreviewDialogVisible.value = false;
      commissionPreviewData.value = {};
    };
    
    const getCommissionStatusType = (status) => {
      const types = {
        pending: 'warning',
        calculated: 'success',
        paid: 'primary'
      };
      return types[status] || 'info';
    };
    
    const getCommissionStatusText = (status) => {
      const texts = {
        pending: '未计算',
        calculated: '已计算',
        paid: '已发放'
      };
      return texts[status] || '未知';
    };
    
    const getDefaultStartDate = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    };
    
    const getDefaultEndDate = () => {
      return new Date().toISOString().slice(0, 10);
    };
    
    // 提成明细分页方法
    const handleCommissionSizeChange = (size) => {
      commissionPageSize.value = size;
      commissionCurrentPage.value = 1;
      fetchCommissionDetails();
    };
    
    const handleCommissionCurrentChange = (page) => {
      commissionCurrentPage.value = page;
      fetchCommissionDetails();
    };
    
    // 批量操作方法
    const batchCalculateCommission = async () => {
      if (selectedCommissions.value.length === 0) {
        ElMessage.warning('请选择要计算提成的记录');
        return;
      }
      
      try {
        const ids = selectedCommissions.value.map(item => item.id);
        const response = await request.post('/api/admin/v1/salesman-commissions/batch-calculate', { ids });
        
        if (response.data && response.data.code === 200) {
          ElMessage.success('批量计算提成成功');
          fetchCommissionDetails();
          selectedCommissions.value = [];
        } else {
          ElMessage.error(response.data?.message || '批量计算提成失败');
        }
      } catch (error) {
        console.error('批量计算提成失败:', error);
        ElMessage.error('批量计算提成失败: ' + (error.response?.data?.message || error.message));
      }
    };
    
    const batchSettleCommission = async () => {
      if (selectedCommissions.value.length === 0) {
        ElMessage.warning('请选择要结算的提成记录');
        return;
      }
      
      try {
        await ElMessageBox.confirm('确定要批量结算选中的提成记录吗？', '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const ids = selectedCommissions.value.map(item => item.id);
        const response = await request.post('/api/admin/v1/salesman-commissions/batch-settle', { ids });
        
        if (response.data && response.data.code === 200) {
          ElMessage.success('批量结算提成成功');
          fetchCommissionDetails();
          selectedCommissions.value = [];
        } else {
          ElMessage.error(response.data?.message || '批量结算提成失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量结算提成失败:', error);
          ElMessage.error('批量结算提成失败: ' + (error.response?.data?.message || error.message));
        }
      }
    };
    
    const exportCommissionData = () => {
      // 构建导出参数
      const params = {
        salesman_id: commissionFilters.salesman_id,
        time_range: commissionFilters.time_range,
        start_date: commissionFilters.start_date,
        end_date: commissionFilters.end_date
      };
      
      // 构建下载URL
      const queryString = new URLSearchParams(params).toString();
      const downloadUrl = `/api/admin/v1/salesman-commissions/export?${queryString}`;
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `设备销售提成数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('导出任务已开始，请稍候下载');
    };
    
    const viewCommissionDetail = (row) => {
      if (!row.id) {
        ElMessage.warning('该记录暂无详细信息');
        return;
      }
      
      // 跳转到提成详情页面或显示详情对话框
      router.push(`/users/salesmen/commissions/${row.id}`);
    };
    
    // 生命周期
    onMounted(async () => {
      await loadSalesmanList();
      await loadPerformanceData();
    });
    
    return {
      // 响应式数据
      loading,
      submitting,
      batchSubmitting,
      queryParams,
      customDateRange,
      salesmanList,
      performanceList,
      total,
      performanceStats,
      dialogVisible,
      batchDialogVisible,
      formRef,
      form,
      batchForm,
      rules,
      
      // 计算属性
      dialogTitle,
      totalScoreDisplay,
      calculatedGrade,
      
      // 方法
      loadPerformanceData,
      calculateTotalScore,
      handleSearch,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      showCreatePerformanceDialog,
      showBatchEvaluationDialog,
      editPerformance,
      viewPerformanceDetail,
      submitForm,
      submitBatchEvaluation,
      deletePerformance,
      exportPerformanceData,
      
      // 工具函数
      getPercentage,
      getGradeType,
      getGradeText,
      getScoreClass,
      
      // 图标
      Medal,
      Plus,
      Document,
      Search,
      RefreshLeft,
      Trophy,
      CircleCheck,
      Warning,
      List,
      Download,
      User,
      DataAnalysis,
      TrendCharts,
      Reading,
      Money,
      View,
      Operation,
      
      // 业务员模块导航标签页
      activeTab,
      handleTabClick,
      
      // 提成管理相关数据
      commissionLoading,
      commissionPreviewLoading,
      commissionGenerateLoading,
      commissionSyncLoading,
      
      // 提成筛选条件
      commissionFilters,
      commissionCustomDateRange,
      
      // 提成数据
      commissionDetails,
      
      // 提成分页数据
      commissionTotal,
      commissionPageSize,
      commissionCurrentPage,
      selectedCommissions,
      
      // 提成对话框状态
      commissionPreviewDialogVisible,
      commissionGenerateDialogVisible,
      commissionSyncDialogVisible,
      
      // 提成预览数据
      commissionPreviewData,
      
      // 提成表单数据
      commissionGenerateForm,
      commissionSyncForm,
      
      // 提成表单验证规则
      commissionGenerateRules,
      commissionSyncRules,
      
      // 计算属性
      hasSelectedCommissions,
      
      // 提成管理相关方法
      fetchCommissionDetails,
      handleCommissionFilterChange,
      handleCommissionTimeRangeChange,
      handleCommissionCustomDateChange,
      refreshCommissionData,
      showCommissionPreviewDialog,
      showCommissionGenerateDialog,
      showCommissionSyncDialog,
      generateCommissionFromPreview,
      generateCommissionRecord,
      syncDeviceSales,
      handleCommissionPreviewClose,
      getCommissionStatusType,
      getCommissionStatusText,
      getDefaultStartDate,
      getDefaultEndDate,
      
      // 提成明细分页方法
      handleCommissionSizeChange,
      handleCommissionCurrentChange,
      
      // 批量操作方法
      batchCalculateCommission,
      batchSettleCommission,
      exportCommissionData,
      viewCommissionDetail
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

/* 筛选卡片样式 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.filter-icon {
  font-size: 16px;
  color: #409eff;
}

.filter-title {
  font-size: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
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

.excellent-count .stats-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.good-count .stats-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.qualified-count .stats-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.improvement-count .stats-icon {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
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

.stats-percentage {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
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

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 展开内容样式 */
.expand-content {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 10px;
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
}

/* 设备销售提成管理卡片样式 */
.commission-management-card {
  margin-top: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.header-left {
  flex-grow: 1;
}

.header-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.header-subtitle {
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 提成筛选条件样式 */
.commission-filters {
  padding: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

/* 提成明细表格样式 */
.commission-amount {
  font-weight: 600;
  color: #e6a23c;
}

/* 提成预览对话框样式 */
.preview-summary {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.commission-total {
  color: #e6a23c !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 批量操作按钮样式 */
.batch-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 