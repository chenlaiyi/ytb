<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>业务员培训管理</h2>
        <p class="page-description">完整的培训生命周期管理</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="showCreatePlanDialog">
          <el-icon><Plus /></el-icon>
          新增培训计划
        </el-button>
        <el-button type="success" size="large" @click="showBatchAssignDialog">
          <el-icon><UserFilled /></el-icon>
          批量分配
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

    <!-- 培训统计卡片 -->
    <div class="stats-dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card total-trainings" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Reading /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ trainingStats.totalTrainings }}</div>
                <div class="stats-label">培训计划总数</div>
                <div class="stats-change">本月新增 {{ trainingStats.monthlyNew }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card ongoing-trainings" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ trainingStats.ongoingTrainings }}</div>
                <div class="stats-label">进行中培训</div>
                <div class="stats-change">完成率 {{ trainingStats.completionRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card total-participants" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ trainingStats.totalParticipants }}</div>
                <div class="stats-label">参训人次</div>
                <div class="stats-change">平均分 {{ trainingStats.averageScore }}分</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card training-hours" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ trainingStats.totalHours }}</div>
                <div class="stats-label">培训总时长(小时)</div>
                <div class="stats-change">人均 {{ trainingStats.averageHours }}小时</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 培训计划标签页 -->
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 培训计划 -->
        <el-tab-pane label="培训计划" name="plans">
          <div class="tab-content">
            <!-- 筛选条件 -->
            <div class="filter-section">
              <el-form :inline="true" class="filter-form">
                <el-form-item label="培训状态">
                  <el-select v-model="planQuery.status" @change="loadTrainingPlans" style="width: 150px;">
                    <el-option label="全部状态" value="" />
                    <el-option label="计划中" value="planned" />
                    <el-option label="进行中" value="ongoing" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-form-item>
                <el-form-item label="培训类型">
                  <el-select v-model="planQuery.type" @change="loadTrainingPlans" style="width: 150px;">
                    <el-option label="全部类型" value="" />
                    <el-option label="产品培训" value="product" />
                    <el-option label="销售技巧" value="sales" />
                    <el-option label="客户服务" value="service" />
                    <el-option label="团队建设" value="team" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-input 
                    v-model="planQuery.keyword" 
                    placeholder="搜索培训名称" 
                    clearable 
                    style="width: 200px;"
                    @keyup.enter="loadTrainingPlans"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadTrainingPlans">搜索</el-button>
                  <el-button @click="resetPlanQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 培训计划表格 -->
            <el-table
              :data="trainingPlans"
              v-loading="plansLoading"
              border
              stripe
              style="width: 100%"
            >
              <el-table-column type="expand">
                <template #default="props">
                  <div class="expand-content">
                    <el-descriptions title="培训详情" :column="2" border>
                      <el-descriptions-item label="培训目标">{{ props.row.objective }}</el-descriptions-item>
                      <el-descriptions-item label="培训内容">{{ props.row.content }}</el-descriptions-item>
                      <el-descriptions-item label="培训讲师">{{ props.row.instructor }}</el-descriptions-item>
                      <el-descriptions-item label="培训地点">{{ props.row.location }}</el-descriptions-item>
                      <el-descriptions-item label="参训人数">{{ props.row.participant_count }}人</el-descriptions-item>
                      <el-descriptions-item label="培训费用">¥{{ props.row.cost }}</el-descriptions-item>
                      <el-descriptions-item label="创建时间">{{ props.row.created_at }}</el-descriptions-item>
                      <el-descriptions-item label="更新时间">{{ props.row.updated_at }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="title" label="培训名称" min-width="200" />
              <el-table-column prop="type" label="培训类型" width="120">
                <template #default="scope">
                  <el-tag :type="getTypeTagType(scope.row.type)">
                    {{ getTypeText(scope.row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="instructor" label="培训讲师" width="120" />
              <el-table-column label="培训时间" width="200">
                <template #default="scope">
                  <div class="time-range">
                    <div>{{ scope.row.start_date }}</div>
                    <div>{{ scope.row.end_date }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="时长(小时)" width="100" />
              <el-table-column prop="participant_count" label="参训人数" width="100" />
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
                    <el-button type="primary" size="small" @click="viewTrainingDetail(scope.row)">
                      详情
                    </el-button>
                    <el-button type="warning" size="small" @click="editTraining(scope.row)">
                      编辑
                    </el-button>
                    <el-popconfirm
                      title="确定要删除此培训计划吗？"
                      @confirm="deleteTraining(scope.row.id)"
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
                :total="planTotal"
                :page-size="planQuery.per_page"
                :current-page="planQuery.page"
                :page-sizes="[10, 20, 50, 100]"
                @size-change="handlePlanSizeChange"
                @current-change="handlePlanCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 培训记录 -->
        <el-tab-pane label="培训记录" name="records">
          <div class="tab-content">
            <!-- 筛选条件 -->
            <div class="filter-section">
              <el-form :inline="true" class="filter-form">
                <el-form-item label="业务员">
                  <el-select 
                    v-model="recordQuery.salesman_id" 
                    placeholder="选择业务员" 
                    clearable 
                    filterable
                    style="width: 200px;"
                    @change="loadTrainingRecords"
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
                <el-form-item label="完成状态">
                  <el-select v-model="recordQuery.completion_status" @change="loadTrainingRecords" style="width: 150px;">
                    <el-option label="全部状态" value="" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="进行中" value="ongoing" />
                    <el-option label="未开始" value="not_started" />
                    <el-option label="已退出" value="dropped" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadTrainingRecords">搜索</el-button>
                  <el-button @click="resetRecordQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 培训记录表格 -->
            <el-table
              :data="trainingRecords"
              v-loading="recordsLoading"
              border
              stripe
              style="width: 100%"
            >
              <el-table-column prop="salesman_name" label="业务员" width="120" />
              <el-table-column prop="training_title" label="培训名称" min-width="200" />
              <el-table-column prop="training_type" label="培训类型" width="120">
                <template #default="scope">
                  <el-tag :type="getTypeTagType(scope.row.training_type)">
                    {{ getTypeText(scope.row.training_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="start_date" label="开始时间" width="160" />
              <el-table-column prop="completion_date" label="完成时间" width="160" />
              <el-table-column prop="score" label="考核分数" width="100">
                <template #default="scope">
                  <span v-if="scope.row.score" class="score-text" :class="getScoreClass(scope.row.score)">
                    {{ scope.row.score }}分
                  </span>
                  <span v-else class="no-score">未考核</span>
                </template>
              </el-table-column>
              <el-table-column prop="completion_status" label="完成状态" width="120">
                <template #default="scope">
                  <el-tag :type="getCompletionStatusType(scope.row.completion_status)">
                    {{ getCompletionStatusText(scope.row.completion_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <div class="action-buttons">
                    <el-button type="primary" size="small" @click="viewRecordDetail(scope.row)">
                      详情
                    </el-button>
                    <el-button 
                      v-if="scope.row.completion_status === 'completed' && !scope.row.score"
                      type="success" 
                      size="small" 
                      @click="scoreTraining(scope.row)"
                    >
                      评分
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :total="recordTotal"
                :page-size="recordQuery.per_page"
                :current-page="recordQuery.page"
                :page-sizes="[10, 20, 50, 100]"
                @size-change="handleRecordSizeChange"
                @current-change="handleRecordCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 培训效果 -->
        <el-tab-pane label="培训效果" name="effectiveness">
          <div class="tab-content">
            <el-row :gutter="20">
              <!-- 培训效果图表 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>培训完成率趋势</span>
                    </div>
                  </template>
                  <div ref="completionChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>

              <!-- 培训分数分布 -->
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="chart-header">
                      <el-icon><PieChart /></el-icon>
                      <span>培训分数分布</span>
                    </div>
                  </template>
                  <div ref="scoreChart" class="chart-container" v-loading="chartsLoading"></div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 培训效果统计表 -->
            <el-card class="table-card" shadow="hover" style="margin-top: 20px;">
              <template #header>
                <div class="table-header">
                  <div class="table-title">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>培训效果统计</span>
                  </div>
                </div>
              </template>

              <el-table
                :data="effectivenessData"
                v-loading="effectivenessLoading"
                border
                stripe
                style="width: 100%"
              >
                <el-table-column prop="training_title" label="培训名称" min-width="200" />
                <el-table-column prop="participant_count" label="参训人数" width="100" />
                <el-table-column prop="completion_count" label="完成人数" width="100" />
                <el-table-column prop="completion_rate" label="完成率" width="100">
                  <template #default="scope">
                    <el-progress 
                      :percentage="scope.row.completion_rate" 
                      :color="getProgressColor(scope.row.completion_rate)"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="average_score" label="平均分" width="100">
                  <template #default="scope">
                    <span class="score-text" :class="getScoreClass(scope.row.average_score)">
                      {{ scope.row.average_score }}分
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="satisfaction_rate" label="满意度" width="100">
                  <template #default="scope">
                    <el-rate 
                      v-model="scope.row.satisfaction_rate" 
                      disabled 
                      show-score 
                      text-color="#ff9900"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑培训计划对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px" 
      append-to-body
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="培训名称" prop="title">
              <el-input v-model="form.title" placeholder="请输入培训名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训类型" prop="type">
              <el-select v-model="form.type" placeholder="选择培训类型" style="width: 100%;">
                <el-option label="产品培训" value="product" />
                <el-option label="销售技巧" value="sales" />
                <el-option label="客户服务" value="service" />
                <el-option label="团队建设" value="team" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="培训讲师" prop="instructor">
              <el-input v-model="form.instructor" placeholder="请输入培训讲师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训地点" prop="location">
              <el-input v-model="form.location" placeholder="请输入培训地点" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="datetime"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_date">
              <el-date-picker
                v-model="form.end_date"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="培训时长" prop="duration">
              <el-input-number 
                v-model="form.duration" 
                :min="0.5" 
                :step="0.5"
                style="width: 100%;"
              />
              <span style="margin-left: 8px;">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训费用" prop="cost">
              <el-input-number 
                v-model="form.cost" 
                :min="0" 
                :precision="2"
                style="width: 100%;"
              />
              <span style="margin-left: 8px;">元</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="培训目标" prop="objective">
              <el-input 
                v-model="form.objective" 
                type="textarea" 
                :rows="3"
                placeholder="请输入培训目标"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="培训内容" prop="content">
              <el-input 
                v-model="form.content" 
                type="textarea" 
                :rows="4"
                placeholder="请输入培训内容"
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

    <!-- 批量分配对话框 -->
    <el-dialog 
      title="批量分配培训" 
      v-model="batchDialogVisible" 
      width="600px" 
      append-to-body
    >
      <el-form :model="batchForm" label-width="120px">
        <el-form-item label="选择培训">
          <el-select 
            v-model="batchForm.training_id" 
            placeholder="选择培训计划" 
            style="width: 100%;"
          >
            <el-option 
              v-for="training in trainingPlans" 
              :key="training.id" 
              :label="training.title" 
              :value="training.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择业务员">
          <el-select 
            v-model="batchForm.salesman_ids" 
            multiple 
            placeholder="选择要分配的业务员" 
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
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchAssign" :loading="batchSubmitting">
            {{ batchSubmitting ? '分配中...' : '确认分配' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 培训评分对话框 -->
    <el-dialog 
      title="培训评分" 
      v-model="scoreDialogVisible" 
      width="500px" 
      append-to-body
    >
      <el-form :model="scoreForm" label-width="120px">
        <el-form-item label="业务员">
          <el-input v-model="scoreForm.salesman_name" readonly />
        </el-form-item>
        <el-form-item label="培训名称">
          <el-input v-model="scoreForm.training_title" readonly />
        </el-form-item>
        <el-form-item label="考核分数" prop="score">
          <el-input-number 
            v-model="scoreForm.score" 
            :min="0" 
            :max="100" 
            style="width: 100%;"
          />
          <div class="score-tip">满分100分</div>
        </el-form-item>
        <el-form-item label="评价">
          <el-input 
            v-model="scoreForm.evaluation" 
            type="textarea" 
            :rows="3"
            placeholder="请输入培训评价"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="scoreDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitScore" :loading="scoreSubmitting">
            {{ scoreSubmitting ? '保存中...' : '保存评分' }}
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
  Reading, Plus, UserFilled, Clock, Timer, TrendCharts, PieChart, DataAnalysis, User, Money
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getSalesmenList } from '@/api/salesman';

export default {
  name: 'SalesmenTraining',
  setup() {
    const router = useRouter();
    
    // 响应式数据
    const plansLoading = ref(false);
    const recordsLoading = ref(false);
    const effectivenessLoading = ref(false);
    const chartsLoading = ref(false);
    const submitting = ref(false);
    const batchSubmitting = ref(false);
    const scoreSubmitting = ref(false);
    
    // 当前标签页
    const activeTab = ref('training');
    
    // 业务员列表
    const salesmanList = ref([]);
    
    // 培训统计
    const trainingStats = reactive({
      totalTrainings: 0,
      ongoingTrainings: 0,
      totalParticipants: 0,
      trainingHours: 0,
      monthlyNew: 0,
      completionRate: 0,
      averageScore: 0,
      averageHours: 0
    });
    
    // 培训计划数据
    const trainingPlans = ref([]);
    const planTotal = ref(0);
    const planQuery = reactive({
      page: 1,
      per_page: 20,
      status: '',
      type: '',
      keyword: ''
    });
    
    // 培训记录数据
    const trainingRecords = ref([]);
    const recordTotal = ref(0);
    const recordQuery = reactive({
      page: 1,
      per_page: 20,
      salesman_id: '',
      completion_status: ''
    });
    
    // 培训效果数据
    const effectivenessData = ref([]);
    
    // 对话框
    const dialogVisible = ref(false);
    const batchDialogVisible = ref(false);
    const scoreDialogVisible = ref(false);
    const formRef = ref(null);
    
    // 表单数据
    const form = reactive({
      id: null,
      title: '',
      type: '',
      instructor: '',
      location: '',
      start_date: '',
      end_date: '',
      duration: 1,
      cost: 0,
      objective: '',
      content: ''
    });
    
    // 批量分配表单
    const batchForm = reactive({
      training_id: '',
      salesman_ids: []
    });
    
    // 评分表单
    const scoreForm = reactive({
      record_id: null,
      salesman_name: '',
      training_title: '',
      score: 0,
      evaluation: ''
    });
    
    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入培训名称', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择培训类型', trigger: 'change' }
      ],
      instructor: [
        { required: true, message: '请输入培训讲师', trigger: 'blur' }
      ],
      start_date: [
        { required: true, message: '请选择开始时间', trigger: 'change' }
      ],
      end_date: [
        { required: true, message: '请选择结束时间', trigger: 'change' }
      ]
    };
    
    // 图表实例
    const completionChart = ref(null);
    const scoreChart = ref(null);
    let completionChartInstance = null;
    let scoreChartInstance = null;
    
    // 计算属性
    const dialogTitle = computed(() => {
      return form.id ? '编辑培训计划' : '新增培训计划';
    });
    
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
    
    // 加载培训统计
    const loadTrainingStats = async () => {
      try {
        // 模拟API调用
        const mockStats = {
          totalTrainings: 25,
          ongoingTrainings: 8,
          totalParticipants: 156,
          trainingHours: 320,
          monthlyNew: 5,
          completionRate: 85,
          averageScore: 87.5,
          averageHours: 12.8
        };
        
        Object.assign(trainingStats, mockStats);
      } catch (error) {
        console.error('加载培训统计失败:', error);
      }
    };
    
    // 加载培训计划
    const loadTrainingPlans = async () => {
      plansLoading.value = true;
      try {
        // 模拟API调用
        const mockData = {
          code: 200,
          data: {
            data: [
              {
                id: 1,
                title: '产品知识培训',
                type: 'product',
                instructor: '张老师',
                location: '会议室A',
                start_date: '2024-02-01 09:00:00',
                end_date: '2024-02-01 17:00:00',
                duration: 8,
                participant_count: 15,
                cost: 5000,
                status: 'completed',
                objective: '提升业务员对产品的理解和销售能力',
                content: '产品特性、优势、应用场景等',
                created_at: '2024-01-15 10:00:00',
                updated_at: '2024-02-01 18:00:00'
              },
              {
                id: 2,
                title: '销售技巧提升',
                type: 'sales',
                instructor: '李经理',
                location: '培训中心',
                start_date: '2024-02-15 09:00:00',
                end_date: '2024-02-16 17:00:00',
                duration: 16,
                participant_count: 20,
                cost: 8000,
                status: 'ongoing',
                objective: '提升销售技巧和客户沟通能力',
                content: '销售流程、客户心理、谈判技巧等',
                created_at: '2024-01-20 14:00:00',
                updated_at: '2024-02-15 09:00:00'
              }
            ],
            total: 2
          }
        };
        
        trainingPlans.value = mockData.data.data;
        planTotal.value = mockData.data.total;
        
      } catch (error) {
        console.error('加载培训计划失败:', error);
        ElMessage.error('加载培训计划失败');
      } finally {
        plansLoading.value = false;
      }
    };
    
    // 加载培训记录
    const loadTrainingRecords = async () => {
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
                training_title: '产品知识培训',
                training_type: 'product',
                start_date: '2024-02-01 09:00:00',
                completion_date: '2024-02-01 17:00:00',
                score: 88,
                completion_status: 'completed'
              },
              {
                id: 2,
                salesman_name: '李四',
                training_title: '销售技巧提升',
                training_type: 'sales',
                start_date: '2024-02-15 09:00:00',
                completion_date: null,
                score: null,
                completion_status: 'ongoing'
              }
            ],
            total: 2
          }
        };
        
        trainingRecords.value = mockData.data.data;
        recordTotal.value = mockData.data.total;
        
      } catch (error) {
        console.error('加载培训记录失败:', error);
        ElMessage.error('加载培训记录失败');
      } finally {
        recordsLoading.value = false;
      }
    };
    
    // 加载培训效果数据
    const loadEffectivenessData = async () => {
      effectivenessLoading.value = true;
      try {
        // 模拟API调用
        const mockData = [
          {
            training_title: '产品知识培训',
            participant_count: 15,
            completion_count: 14,
            completion_rate: 93,
            average_score: 87.5,
            satisfaction_rate: 4.5
          },
          {
            training_title: '销售技巧提升',
            participant_count: 20,
            completion_count: 16,
            completion_rate: 80,
            average_score: 85.2,
            satisfaction_rate: 4.2
          }
        ];
        
        effectivenessData.value = mockData;
        
      } catch (error) {
        console.error('加载培训效果数据失败:', error);
      } finally {
        effectivenessLoading.value = false;
      }
    };
    
    // 加载图表数据
    const loadChartData = async () => {
      chartsLoading.value = true;
      try {
        await nextTick();
        
        // 渲染完成率趋势图
        renderCompletionChart();
        
        // 渲染分数分布图
        renderScoreChart();
        
      } catch (error) {
        console.error('加载图表数据失败:', error);
      } finally {
        chartsLoading.value = false;
      }
    };
    
    // 渲染完成率趋势图
    const renderCompletionChart = () => {
      if (!completionChart.value) return;
      
      if (completionChartInstance) {
        completionChartInstance.dispose();
      }
      
      completionChartInstance = echarts.init(completionChart.value);
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['完成率']
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
            name: '完成率',
            type: 'line',
            smooth: true,
            data: [75, 82, 88, 85, 90, 87]
          }
        ]
      };
      
      completionChartInstance.setOption(option);
    };
    
    // 渲染分数分布图
    const renderScoreChart = () => {
      if (!scoreChart.value) return;
      
      if (scoreChartInstance) {
        scoreChartInstance.dispose();
      }
      
      scoreChartInstance = echarts.init(scoreChart.value);
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '分数分布',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 35, name: '优秀(90-100分)' },
              { value: 45, name: '良好(80-89分)' },
              { value: 15, name: '合格(70-79分)' },
              { value: 5, name: '待改进(60-69分)' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      scoreChartInstance.setOption(option);
    };
    
    // 工具函数
    const getTypeTagType = (type) => {
      const types = {
        product: 'primary',
        sales: 'success',
        service: 'warning',
        team: 'info',
        other: 'default'
      };
      return types[type] || 'default';
    };
    
    const getTypeText = (type) => {
      const texts = {
        product: '产品培训',
        sales: '销售技巧',
        service: '客户服务',
        team: '团队建设',
        other: '其他'
      };
      return texts[type] || '未知';
    };
    
    const getStatusTagType = (status) => {
      const types = {
        planned: 'info',
        ongoing: 'warning',
        completed: 'success',
        cancelled: 'danger'
      };
      return types[status] || 'default';
    };
    
    const getStatusText = (status) => {
      const texts = {
        planned: '计划中',
        ongoing: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return texts[status] || '未知';
    };
    
    const getCompletionStatusType = (status) => {
      const types = {
        completed: 'success',
        ongoing: 'warning',
        not_started: 'info',
        dropped: 'danger'
      };
      return types[status] || 'default';
    };
    
    const getCompletionStatusText = (status) => {
      const texts = {
        completed: '已完成',
        ongoing: '进行中',
        not_started: '未开始',
        dropped: '已退出'
      };
      return texts[status] || '未知';
    };
    
    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'qualified';
      return 'improvement';
    };
    
    const getProgressColor = (rate) => {
      if (rate >= 90) return '#67c23a';
      if (rate >= 80) return '#409eff';
      if (rate >= 70) return '#e6a23c';
      return '#f56c6c';
    };
    
    // 事件处理
    const handleTabChange = (tab) => {
      activeTab.value = tab;
      if (tab === 'plans') {
        loadTrainingPlans();
      } else if (tab === 'records') {
        loadTrainingRecords();
      } else if (tab === 'effectiveness') {
        loadEffectivenessData();
        loadChartData();
      }
    };
    
    const resetPlanQuery = () => {
      Object.assign(planQuery, {
        page: 1,
        per_page: 20,
        status: '',
        type: '',
        keyword: ''
      });
      loadTrainingPlans();
    };
    
    const resetRecordQuery = () => {
      Object.assign(recordQuery, {
        page: 1,
        per_page: 20,
        salesman_id: '',
        completion_status: ''
      });
      loadTrainingRecords();
    };
    
    const handlePlanSizeChange = (size) => {
      planQuery.per_page = size;
      planQuery.page = 1;
      loadTrainingPlans();
    };
    
    const handlePlanCurrentChange = (page) => {
      planQuery.page = page;
      loadTrainingPlans();
    };
    
    const handleRecordSizeChange = (size) => {
      recordQuery.per_page = size;
      recordQuery.page = 1;
      loadTrainingRecords();
    };
    
    const handleRecordCurrentChange = (page) => {
      recordQuery.page = page;
      loadTrainingRecords();
    };
    
    // 对话框操作
    const showCreateTrainingDialog = () => {
      resetForm();
      dialogVisible.value = true;
    };
    
    const showBatchAssignDialog = () => {
      Object.assign(batchForm, {
        training_id: '',
        salesman_ids: []
      });
      batchDialogVisible.value = true;
    };
    
    const resetForm = () => {
      Object.assign(form, {
        id: null,
        title: '',
        type: '',
        instructor: '',
        location: '',
        start_date: '',
        end_date: '',
        duration: 1,
        cost: 0,
        objective: '',
        content: ''
      });
    };
    
    const editTraining = (row) => {
      Object.assign(form, { ...row });
      dialogVisible.value = true;
    };
    
    const viewTrainingDetail = (row) => {
      router.push(`/users/salesmen/training/${row.id}`);
    };
    
    const viewRecordDetail = (row) => {
      router.push(`/users/salesmen/training/record/${row.id}`);
    };
    
    const scoreTraining = (row) => {
      Object.assign(scoreForm, {
        record_id: row.id,
        salesman_name: row.salesman_name,
        training_title: row.training_title,
        score: 0,
        evaluation: ''
      });
      scoreDialogVisible.value = true;
    };
    
    const submitForm = () => {
      formRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submitting.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          ElMessage.success(form.id ? '培训计划更新成功' : '培训计划创建成功');
          dialogVisible.value = false;
          loadTrainingPlans();
        } catch (error) {
          console.error('保存培训计划失败:', error);
          ElMessage.error('保存培训计划失败');
        } finally {
          submitting.value = false;
        }
      });
    };
    
    const submitBatchAssign = async () => {
      if (!batchForm.training_id || batchForm.salesman_ids.length === 0) {
        ElMessage.warning('请选择培训计划和业务员');
        return;
      }
      
      batchSubmitting.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        ElMessage.success(`成功为${batchForm.salesman_ids.length}名业务员分配培训`);
        batchDialogVisible.value = false;
        loadTrainingRecords();
      } catch (error) {
        console.error('批量分配失败:', error);
        ElMessage.error('批量分配失败');
      } finally {
        batchSubmitting.value = false;
      }
    };
    
    const submitScore = async () => {
      if (!scoreForm.score) {
        ElMessage.warning('请输入考核分数');
        return;
      }
      
      scoreSubmitting.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        ElMessage.success('培训评分保存成功');
        scoreDialogVisible.value = false;
        loadTrainingRecords();
      } catch (error) {
        console.error('保存评分失败:', error);
        ElMessage.error('保存评分失败');
      } finally {
        scoreSubmitting.value = false;
      }
    };
    
    const deleteTraining = async (id) => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        ElMessage.success('培训计划删除成功');
        loadTrainingPlans();
      } catch (error) {
        console.error('删除培训计划失败:', error);
        ElMessage.error('删除培训计划失败');
      }
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
          // 当前页面，不需要跳转
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

    // 显示创建培训计划对话框
    const showCreatePlanDialog = () => {
      showCreateTrainingDialog();
    };
    
    // 生命周期
    onMounted(async () => {
      await loadSalesmanList();
      await loadTrainingStats();
      await loadTrainingPlans();
    });
    
    return {
      // 响应式数据
      plansLoading,
      recordsLoading,
      effectivenessLoading,
      chartsLoading,
      submitting,
      batchSubmitting,
      scoreSubmitting,
      activeTab,
      salesmanList,
      trainingStats,
      trainingPlans,
      planTotal,
      planQuery,
      trainingRecords,
      recordTotal,
      recordQuery,
      effectivenessData,
      dialogVisible,
      batchDialogVisible,
      scoreDialogVisible,
      formRef,
      form,
      batchForm,
      scoreForm,
      rules,
      completionChart,
      scoreChart,
      
      // 计算属性
      dialogTitle,
      
      // 方法
      loadTrainingPlans,
      loadTrainingRecords,
      loadEffectivenessData,
      handleTabChange,
      handleTabClick,
      resetPlanQuery,
      resetRecordQuery,
      handlePlanSizeChange,
      handlePlanCurrentChange,
      handleRecordSizeChange,
      handleRecordCurrentChange,
      showCreateTrainingDialog,
      showCreatePlanDialog,
      showBatchAssignDialog,
      editTraining,
      viewTrainingDetail,
      viewRecordDetail,
      scoreTraining,
      submitForm,
      submitBatchAssign,
      submitScore,
      deleteTraining,
      
      // 工具函数
      getTypeTagType,
      getTypeText,
      getStatusTagType,
      getStatusText,
      getCompletionStatusType,
      getCompletionStatusText,
      getScoreClass,
      getProgressColor,
      
      // 图标
      Reading,
      Plus,
      UserFilled,
      Clock,
      Timer,
      TrendCharts,
      PieChart,
      DataAnalysis,
      User,
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

.total-trainings .stats-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ongoing-trainings .stats-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.total-participants .stats-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.training-hours .stats-icon {
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

/* 时间范围样式 */
.time-range {
  font-size: 12px;
  line-height: 1.4;
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

.no-score {
  color: #c0c4cc;
  font-style: italic;
}

.score-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

  .chart-container {
    height: 250px;
  }
}
</style> 