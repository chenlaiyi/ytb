<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>VIP分红管理</h2>
        <p class="page-description">管理VIP会员分红奖金池、达标名单和分红计算</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="success" size="large" @click="showCalculateDialog">
          <el-icon><Operation /></el-icon>
          计算分红
        </el-button>
      </div>
    </div>

    <!-- VIP会员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="vip-tabs">
        <el-tab-pane label="VIP会员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              VIP会员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP分红管理" name="dividends">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              VIP分红管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP排行榜" name="rankings">
          <template #label>
            <span class="tab-label">
              <el-icon><Trophy /></el-icon>
              VIP排行榜
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP余额管理" name="balance">
          <template #label>
            <span class="tab-label">
              <el-icon><Wallet /></el-icon>
              VIP余额管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP等级管理" name="levels">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              VIP等级管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="VIP统计分析" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              VIP统计分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 总体统计概览 -->
    <el-card class="overview-stats-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">分红总体概览</span>
          <el-tag type="success" size="large">
            累计分红：{{ formatCurrency(overviewStats.totalDividends) }}元
          </el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon vip-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overviewStats.totalVipUsers }}</div>
              <div class="stat-label">VIP用户总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon pool-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(overviewStats.totalPoolAmount) }}</div>
              <div class="stat-label">累计奖金池</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon pending-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(overviewStats.pendingAmount) }}</div>
              <div class="stat-label">待结算金额</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon settled-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(overviewStats.settledAmount) }}</div>
              <div class="stat-label">已结算金额</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 月度分红奖金池列表 -->
    <el-card class="monthly-pools-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">月度分红奖金池</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCalculateDialog" size="small">
              <el-icon><Plus /></el-icon>
              计算新月份
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="monthly-pools-list">
        <div v-for="monthData in monthlyPools" :key="monthData.month" class="monthly-pool-item">
          <div class="month-header">
            <div class="month-info">
              <h3>{{ monthData.monthLabel }}</h3>
              <el-tag :type="monthData.status === 'settled' ? 'success' : 'warning'" size="small">
                {{ monthData.status === 'settled' ? '已结算' : '待结算' }}
              </el-tag>
            </div>
            <div class="month-actions">
              <el-button type="primary" size="small" @click="viewMonthDetail(monthData.month)">
                查看详情
              </el-button>
              <el-button 
                v-if="monthData.status === 'pending'" 
                type="success" 
                size="small" 
                @click="settleMonth(monthData.month)"
              >
                结算分红
              </el-button>
              <el-button type="info" size="small" @click="exportMonth(monthData.month)">
                导出数据
              </el-button>
            </div>
          </div>

          <el-row :gutter="20" class="pool-data-row">
            <!-- VIP招募分红池 -->
            <el-col :span="12">
              <div class="pool-section vip-pool">
                <div class="pool-header">
                  <div class="pool-title">
                    <el-icon><Star /></el-icon>
                    VIP招募分红池
                  </div>
                  <div class="pool-amount">{{ formatCurrency(monthData.vipPool.totalAmount) }}元</div>
                </div>
                <div class="pool-details">
                  <div class="pool-source">
                    <span>新增VIP：{{ monthData.vipPool.newVipCount }}人</span>
                    <span>单人贡献：300元</span>
                  </div>
                  <div class="pool-distribution">
                    <div class="distribution-item">
                      <span>初级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.vipPool.newVipCount * 300) }}元</span>
                        <el-tag size="small">{{ monthData.vipPool.juniorUsers }}人达标</el-tag>
                      </div>
                    </div>
                    <div class="distribution-item">
                      <span>中级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.vipPool.newVipCount * 300) }}元</span>
                        <el-tag size="small" type="warning">{{ monthData.vipPool.middleUsers }}人达标</el-tag>
                      </div>
                    </div>
                    <div class="distribution-item">
                      <span>高级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.vipPool.newVipCount * 300) }}元</span>
                        <el-tag size="small" type="success">{{ monthData.vipPool.seniorUsers }}人达标</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>

            <!-- 充值分红池 -->
            <el-col :span="12">
              <div class="pool-section recharge-pool">
                <div class="pool-header">
                  <div class="pool-title">
                    <el-icon><ShoppingCart /></el-icon>
                    充值分红池
                  </div>
                  <div class="pool-amount">{{ formatCurrency(monthData.rechargePool.totalAmount) }}元</div>
                </div>
                <div class="pool-details">
                  <div class="pool-source">
                    <span>新增设备：{{ monthData.rechargePool.newDeviceCount }}台</span>
                    <span>单台贡献：15元</span>
                  </div>
                  <div class="pool-distribution">
                    <div class="distribution-item">
                      <span>初级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.rechargePool.newDeviceCount * 15) }}元</span>
                        <el-tag size="small">{{ monthData.rechargePool.juniorUsers }}人达标</el-tag>
                      </div>
                    </div>
                    <div class="distribution-item">
                      <span>中级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.rechargePool.newDeviceCount * 15) }}元</span>
                        <el-tag size="small" type="warning">{{ monthData.rechargePool.middleUsers }}人达标</el-tag>
                      </div>
                    </div>
                    <div class="distribution-item">
                      <span>高级分红池</span>
                      <div class="distribution-right">
                        <span class="amount">{{ formatCurrency(monthData.rechargePool.newDeviceCount * 15) }}元</span>
                        <el-tag size="small" type="success">{{ monthData.rechargePool.seniorUsers }}人达标</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- 月度汇总 -->
          <div class="month-summary">
            <div class="summary-item">
              <span class="summary-label">总奖金池：</span>
              <span class="summary-value total">{{ formatCurrency(monthData.vipPool.totalAmount + monthData.rechargePool.totalAmount) }}元</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">达标用户：</span>
              <span class="summary-value">{{ monthData.totalQualifiedUsers }}人</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">已分配：</span>
              <span class="summary-value">{{ formatCurrency(monthData.totalDistributed) }}元</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">分配率：</span>
              <span class="summary-value">{{ monthData.distributionRate }}%</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="monthlyPools.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无分红数据">
            <el-button type="primary" @click="showCalculateDialog">开始计算分红</el-button>
          </el-empty>
        </div>
      </div>
    </el-card>

    <!-- 计算分红对话框 -->
    <el-dialog
      v-model="calculateDialog.visible"
      title="计算月度分红"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="calculateForm" label-width="100px">
        <el-form-item label="选择月份">
          <el-date-picker
            v-model="calculateForm.month"
            type="month"
            placeholder="选择要计算的月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分红类型">
          <el-select v-model="calculateForm.type" placeholder="选择分红类型" style="width: 100%">
            <el-option label="全部（VIP招募 + 充值）" value="both" />
            <el-option label="仅VIP招募分红" value="vip" />
            <el-option label="仅充值分红" value="recharge" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="calculateDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmCalculate" :loading="calculateDialog.loading">
            开始计算
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 月度详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="`${detailDialog.monthLabel} 分红详情`"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.data" class="detail-content">
        <!-- 月度概览 -->
        <div class="month-overview mb-4">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="overview-item">
                  <div class="overview-value">{{ detailDialog.data.monthData.vipPool.newVipCount }}</div>
                  <div class="overview-label">新增VIP</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="overview-item">
                  <div class="overview-value">{{ detailDialog.data.monthData.rechargePool.newDeviceCount }}</div>
                  <div class="overview-label">新增设备</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="overview-item">
                  <div class="overview-value">¥{{ (detailDialog.data.monthData.vipPool.totalAmount + detailDialog.data.monthData.rechargePool.totalAmount).toLocaleString() }}</div>
                  <div class="overview-label">总奖金池</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="overview-item">
                  <div class="overview-value">{{ detailDialog.data.monthData.totalQualifiedUsers }}</div>
                  <div class="overview-label">达标用户</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <el-tabs v-model="detailDialog.activeTab" type="card">
          <el-tab-pane label="VIP招募分红" name="vip">
            <div class="dividend-detail">
              <!-- VIP分红汇总 -->
              <div class="summary-section mb-4">
                <h4>分红汇总</h4>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">初级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.vipDividends.summary.primary.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.vipDividends.summary.primary.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.vipDividends.summary.primary.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">中级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.vipDividends.summary.middle.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.vipDividends.summary.middle.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.vipDividends.summary.middle.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">高级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.vipDividends.summary.high.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.vipDividends.summary.high.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.vipDividends.summary.high.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- VIP分红用户列表 -->
              <div class="users-section">
                <el-tabs type="border-card">
                  <el-tab-pane label="初级分红用户" name="primary">
                    <el-table :data="detailDialog.data.vipDividends.users.primary" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="中级分红用户" name="middle">
                    <el-table :data="detailDialog.data.vipDividends.users.middle" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="高级分红用户" name="high">
                    <el-table :data="detailDialog.data.vipDividends.users.high" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="充值分红" name="recharge">
            <div class="dividend-detail">
              <!-- 充值分红汇总 -->
              <div class="summary-section mb-4">
                <h4>分红汇总</h4>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">初级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.rechargeDividends.summary.primary.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.rechargeDividends.summary.primary.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.rechargeDividends.summary.primary.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">中级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.rechargeDividends.summary.middle.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.rechargeDividends.summary.middle.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.rechargeDividends.summary.middle.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card>
                      <div class="summary-item">
                        <div class="summary-title">高级分红</div>
                        <div class="summary-stats">
                          <div>达标人数：{{ detailDialog.data.rechargeDividends.summary.high.count }}人</div>
                          <div>总金额：¥{{ detailDialog.data.rechargeDividends.summary.high.totalAmount.toLocaleString() }}</div>
                          <div>人均：¥{{ Math.round(detailDialog.data.rechargeDividends.summary.high.avgAmount) }}</div>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- 充值分红用户列表 -->
              <div class="users-section">
                <el-tabs type="border-card">
                  <el-tab-pane label="初级分红用户" name="primary">
                    <el-table :data="detailDialog.data.rechargeDividends.users.primary" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="中级分红用户" name="middle">
                    <el-table :data="detailDialog.data.rechargeDividends.users.middle" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="高级分红用户" name="high">
                    <el-table :data="detailDialog.data.rechargeDividends.users.high" stripe>
                      <el-table-column prop="user_name" label="用户姓名" width="120" />
                      <el-table-column prop="user_phone" label="手机号" width="130" />
                      <el-table-column prop="amount" label="分红金额" width="120">
                        <template #default="scope">
                          ¥{{ parseFloat(scope.row.amount).toLocaleString() }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
                            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="created_at" label="创建时间" />
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="新增VIP用户" name="newVip">
            <el-table :data="detailDialog.data.newVipUsers" stripe>
              <el-table-column prop="name" label="用户姓名" width="120" />
              <el-table-column prop="phone" label="手机号" width="130" />
              <el-table-column prop="referrer_name" label="推荐人" width="120" />
              <el-table-column prop="vip_paid_at" label="完款时间" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="新增设备" name="newDevice">
            <el-table :data="detailDialog.data.newDevices" stripe>
              <el-table-column prop="device_number" label="设备编号" width="150" />
              <el-table-column prop="app_user_name" label="用户姓名" width="120" />
              <el-table-column prop="dealer_name" label="经销商" width="120" />
              <el-table-column prop="created_at" label="创建时间" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.overview-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.overview-item {
  padding: 10px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  color: #666;
}

.summary-section h4 {
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

.summary-item {
  text-align: center;
  padding: 15px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.summary-stats {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.users-section {
  margin-top: 20px;
}

.mb-4 {
  margin-bottom: 20px;
}
</style>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Refresh, Operation, User, Money, Trophy, Wallet, Star, DataAnalysis,
  Plus, Check, Clock, ShoppingCart, Calendar, Download
} from '@element-plus/icons-vue';
import axios from 'axios';

// 路由实例
const router = useRouter();

// 响应式数据
const loading = ref(false);
const activeTab = ref('dividends');

// 总体统计数据
const overviewStats = reactive({
  totalVipUsers: 0,
  totalPoolAmount: 0,
  totalDividends: 0,
  pendingAmount: 0,
  settledAmount: 0
});

// 月度奖金池数据
const monthlyPools = ref([]);

// 计算分红对话框
const calculateDialog = reactive({
  visible: false,
  loading: false
});

const calculateForm = reactive({
  month: '',
  type: 'both'
});

// 详情对话框
const detailDialog = reactive({
  visible: false,
  monthLabel: '',
  data: null,
  activeTab: 'vip'
});

// 标签页切换处理
const handleTabClick = (tab) => {
  const tabName = tab.props.name;
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      router.push({ name: 'VipList' });
      break;
    case 'dividends':
      // 当前页面，不需要跳转
      break;
    case 'rankings':
      router.push({ name: 'VipRankings' });
      break;
    case 'balance':
      router.push({ name: 'VipBalance' });
      break;
    case 'levels':
      router.push({ name: 'VipLevels' });
      break;
    case 'statistics':
      router.push({ name: 'VipStatistics' });
      break;
    default:
      console.warn('未知的标签页:', tabName);
  }
};

// 加载总体统计数据
const loadOverviewStats = async () => {
  try {
    const response = await axios.get('/api/admin/v1/vip-dividends/overview-stats');
    if (response.data && response.data.code === 0) {
      Object.assign(overviewStats, response.data.data);
    }
  } catch (error) {
    console.error('加载总体统计失败:', error);
  }
};

// 加载月度奖金池数据
const loadMonthlyPools = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/v1/vip-dividends/monthly-pools');
    if (response.data && response.data.code === 0) {
      monthlyPools.value = response.data.data;
    } else {
      ElMessage.error(response.data?.message || '加载月度数据失败');
    }
  } catch (error) {
    console.error('加载月度数据失败:', error);
    ElMessage.error('加载月度数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = async () => {
  await Promise.all([
    loadOverviewStats(),
    loadMonthlyPools()
  ]);
  ElMessage.success('数据刷新完成');
};

// 显示计算分红对话框
const showCalculateDialog = () => {
  calculateForm.month = '';
  calculateForm.type = 'both';
  calculateDialog.visible = true;
};

// 确认计算分红
const confirmCalculate = async () => {
  if (!calculateForm.month) {
    ElMessage.warning('请选择要计算的月份');
    return;
  }

  calculateDialog.loading = true;
  try {
    const response = await axios.post('/api/admin/v1/vip-dividends/calculate-monthly', calculateForm);
    if (response.data && response.data.code === 0) {
      ElMessage.success('分红计算完成');
      calculateDialog.visible = false;
      await loadMonthlyPools(); // 重新加载数据
    } else {
      ElMessage.error(response.data?.message || '计算分红失败');
    }
  } catch (error) {
    console.error('计算分红失败:', error);
    ElMessage.error('计算分红失败，请稍后重试');
  } finally {
    calculateDialog.loading = false;
  }
};

// 查看月度详情
const viewMonthDetail = async (month) => {
  try {
    const response = await axios.get(`/api/admin/v1/vip-dividends/month-detail/${month}`);
    if (response.data && response.data.code === 0) {
      detailDialog.data = response.data.data;
      detailDialog.monthLabel = formatMonthLabel(month);
      detailDialog.visible = true;
    } else {
      ElMessage.error('获取详情失败');
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    ElMessage.error('获取详情失败，请稍后重试');
  }
};

// 结算月度分红
const settleMonth = (month) => {
  ElMessageBox.confirm(
    `确定要结算${formatMonthLabel(month)}的所有分红吗？`,
    '确认结算',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.post('/api/admin/v1/vip-dividends/settle-monthly', { month });
      if (response.data && response.data.code === 0) {
        ElMessage.success('分红结算完成');
        await loadMonthlyPools(); // 重新加载数据
      } else {
        ElMessage.error(response.data?.message || '结算失败');
      }
    } catch (error) {
      console.error('结算失败:', error);
      ElMessage.error('结算失败，请稍后重试');
    }
  }).catch(() => {});
};

// 导出月度数据
const exportMonth = (month) => {
  const url = `/api/admin/v1/vip-dividends/export-monthly?month=${month}`;
  window.open(url, '_blank');
};

// 格式化金额
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
};

// 格式化月份标签
const formatMonthLabel = (month) => {
  const [year, monthNum] = month.split('-');
  return `${year}年${monthNum}月`;
};

// 初始化
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  margin: -20px -20px 24px -20px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.page-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.page-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* VIP会员模块导航标签页 */
.navigation-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.vip-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vip-tabs .el-tab-pane {
  flex: 1;
}

.vip-tabs .el-tab-pane .tab-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 总体统计概览 */
.overview-stats-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.vip-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pool-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.settled-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 月度奖金池列表 */
.monthly-pools-card {
  border-radius: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.monthly-pools-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.monthly-pool-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.monthly-pool-item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
}

.month-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.month-actions {
  display: flex;
  gap: 8px;
}

.pool-data-row {
  margin-bottom: 16px;
}

.pool-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
  border: 1px solid #e4e7ed;
}

.vip-pool {
  border-left: 4px solid #667eea;
}

.recharge-pool {
  border-left: 4px solid #f093fb;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.pool-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pool-amount {
  font-size: 20px;
  font-weight: 700;
  color: #28a745;
}

.pool-source {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  color: #6c757d;
}

.pool-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.distribution-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.month-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 14px;
  color: #909399;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-value.total {
  color: #28a745;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>