<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Monitor /></el-icon>
          点点够设备管理
        </h2>
        <p class="page-subtitle">管理和监控所有已激活的点点够净水设备</p>
      </div>
      <div class="header-right">
        <el-button type="success" size="large" @click="syncData">
          <el-icon><Refresh /></el-icon>
          同步数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container" v-if="statistics">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_devices || 0 }}</div>
              <div class="stat-label">设备总数</div>
              <div class="stat-detail">
                自用: {{ statistics.self_use_devices || 0 }} | 
                销售: {{ statistics.for_sale_devices || 0 }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card online">
            <div class="stat-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.online_devices || 0 }}</div>
              <div class="stat-label">在线设备</div>
              <div class="stat-percentage">在线率: {{ statistics.online_rate || 0 }}%</div>
              <div class="stat-detail">离线设备: {{ statistics.offline_devices || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card water-warning clickable" @click="filterWaterWarningDevices">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ (statistics.low_water_devices || 0) + (statistics.expire_soon_devices || 0) }}</div>
              <div class="stat-label">剩余水量预警</div>
              <div class="stat-detail">
                低水量: {{ statistics.low_water_devices || 0 }}<br>
                即将到期: {{ statistics.expire_soon_devices || 0 }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card filter-warning clickable" @click="filterFilterWarningDevices">
            <div class="stat-icon">
              <el-icon><Filter /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.filter_alert_devices || 0 }}</div>
              <div class="stat-label">滤芯预警</div>
              <div class="stat-detail">
                滤芯寿命低于20%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card billing">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.flow_billing_devices || 0 }}</div>
              <div class="stat-label">流量计费</div>
              <div class="stat-detail">包年计费: {{ statistics.annual_billing_devices || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 第二行统计卡片 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ getEnabledDevices() }}</div>
              <div class="stat-label">启用设备</div>
              <div class="stat-detail">
                禁用: {{ getDisabledDevices() }} | 
                维护: {{ getMaintenanceDevices() }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.month_sale_devices || 0 }}</div>
              <div class="stat-label">本月销售数量</div>
              <div class="stat-detail">
                自用: {{ statistics.month_self_use_devices || 0 }} | 
                取水点: {{ statistics.month_water_point_devices || 0 }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card purple">
            <div class="stat-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ getAssignedDevices() }}</div>
              <div class="stat-label">已分配VIP</div>
              <div class="stat-detail">未分配: {{ getUnassignedDevices() }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card orange">
            <div class="stat-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.month_water_point_devices || 0 }}</div>
              <div class="stat-label">本月取水点数量</div>
              <div class="stat-detail">总取水点: {{ statistics.water_point_devices || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <div class="filter-main">
        <el-input
          v-model="listQuery.keyword"
          placeholder="搜索设备编号、IMEI、用户名、地址..."
          style="width: 300px;"
          class="filter-item"
          clearable
          @keyup.enter="handleFilter"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="listQuery.status"
          placeholder="设备状态"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span :style="{ color: getStatusColor(item.value) }">● {{ item.label }}</span>
          </el-option>
        </el-select>
        
        <el-select
          v-model="listQuery.network_status"
          placeholder="网络状态"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option label="在线" value="1">
            <span style="color: #67c23a;">● 在线</span>
          </el-option>
          <el-option label="离线" value="0">
            <span style="color: #f56c6c;">● 离线</span>
          </el-option>
        </el-select>
        
        <el-select
          v-model="listQuery.device_type_name"
          placeholder="设备类型"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option label="小扁豆" value="小扁豆">
            <span style="color: #409eff;">● 小扁豆</span>
          </el-option>
          <el-option label="商务机" value="商务机">
            <span style="color: #e6a23c;">● 商务机</span>
          </el-option>
          <el-option label="大扁豆" value="大扁豆">
            <span style="color: #909399;">● 大扁豆</span>
          </el-option>
        </el-select>
        
        <el-select
          v-model="listQuery.billing_mode"
          placeholder="计费模式"
          clearable
          style="width: 130px"
          class="filter-item"
        >
          <el-option label="流量计费" value="1" />
          <el-option label="包年计费" value="0" />
        </el-select>
        
        <el-select
          v-model="listQuery.is_self_use"
          placeholder="是否自用"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option label="销售设备" value="0" />
          <el-option label="自用设备" value="1" />
        </el-select>
        
        <el-input
          v-model="listQuery.vip_user"
          placeholder="搜索所属VIP用户..."
          style="width: 200px;"
          class="filter-item"
          clearable
          @keyup.enter="handleFilter"
        >
          <template #prefix>
            <el-icon><UserFilled /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="handleFilter">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        
        <el-button @click="showAdvancedFilter = !showAdvancedFilter">
          <el-icon><Filter /></el-icon>
          {{ showAdvancedFilter ? '收起筛选' : '高级筛选' }}
        </el-button>
      </div>
      
      <!-- 高级筛选条件 -->
      <el-collapse-transition>
        <div v-if="showAdvancedFilter" class="advanced-filter">
          <el-divider content-position="left">高级筛选选项</el-divider>
          <div class="filter-row">
            <div class="filter-group">
              <span class="filter-label">激活时间：</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="filter-item date-range"
                @change="handleDateRangeChange"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">水量范围：</span>
              <el-input-number 
                v-model="listQuery.water_min" 
                placeholder="最小值" 
                :min="0"
                :precision="0"
                class="filter-item water-range"
                controls-position="right"
              />
              <span class="range-separator">-</span>
              <el-input-number 
                v-model="listQuery.water_max" 
                placeholder="最大值" 
                :min="0"
                :precision="0"
                class="filter-item water-range"
                controls-position="right"
              />
              <span class="unit">L</span>
            </div>
          </div>
          <div class="filter-actions">
            <el-button type="primary" @click="handleFilter">应用筛选</el-button>
            <el-button @click="resetFilter">重置筛选</el-button>
          </div>
        </div>
      </el-collapse-transition>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="正在加载设备数据..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        :row-class-name="tableRowClassName"
        empty-text="暂无设备数据"
      >
        <el-table-column label="序号" width="80" align="center" fixed="left">
          <template #default="scope">
            <span class="sequence-number">{{ (listQuery.page - 1) * listQuery.limit + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="设备信息" min-width="160" fixed="left">
          <template #default="scope">
            <div class="device-info">
              <div class="device-number">{{ scope.row.device_number }}</div>
              <div class="device-type" v-if="scope.row.device_type_name">
                <el-tag size="small" type="info">{{ scope.row.device_type_name }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="所属VIP" prop="app_user_name" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.app_user_name" class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ scope.row.app_user_name }}</span>
            </div>
            <span v-else class="no-user">未绑定</span>
          </template>
        </el-table-column>
        
        <el-table-column label="渠道商/客户" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <div class="dealer-client-info">
              <div v-if="scope.row.dealer_name" class="dealer">
                <el-icon><Shop /></el-icon>
                <span>{{ scope.row.dealer_name }}</span>
              </div>
              <div v-if="scope.row.client_name" class="client">
                <el-icon><User /></el-icon>
                <span>{{ scope.row.client_name }}</span>
              </div>
              <span v-if="!scope.row.dealer_name && !scope.row.client_name" class="no-info">未设置</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="网络状态" width="120" align="center">
          <template #default="scope">
            <div class="status-column">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status_text }}
              </el-tag>
              <el-tag 
                :type="getNetworkStatusType(scope.row.network_status)" 
                size="small"
                style="margin-top: 4px;"
              >
                <el-icon>
                  <Connection v-if="scope.row.network_status === '1'" />
                  <Close v-else />
                </el-icon>
                {{ scope.row.network_status_text || '未知' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用途" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.is_water_point == 1 ? 'danger' : (scope.row.is_self_use == 1 ? 'warning' : 'success')" 
              effect="plain" 
              size="small"
            >
              <el-icon>
                <Location v-if="scope.row.is_water_point == 1" />
                <Check v-else-if="scope.row.is_self_use == 1" />
                <Money v-else />
              </el-icon>
              {{ scope.row.is_water_point == 1 ? '取水点' : (scope.row.is_self_use == 1 ? '自用' : '销售') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="计费模式" width="100" align="center">
          <template #default="scope">
            <span class="billing-mode">
              <el-icon><Money /></el-icon>
              {{ scope.row.billing_mode === '1' ? '流量计费' : '包年计费' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="提成金额" width="100" align="center">
          <template #default="scope">
            <span class="commission-amount">
              <el-icon><Money /></el-icon>
              {{ getCommissionAmount(scope.row) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余用量" width="120" align="center">
          <template #default="scope">
            <div class="usage-info">
              <span v-if="scope.row.billing_mode === '1'" class="usage-value">
                <el-icon><Opportunity /></el-icon>
                {{ scope.row.surplus_flow || 0 }}L
              </span>
              <span v-else class="usage-value">
                <el-icon><Clock /></el-icon>
                {{ scope.row.remaining_days || 0 }}天
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="累计制水" width="100" align="center">
          <template #default="scope">
            <span class="water-value">
              <el-icon><Opportunity /></el-icon>
              {{ scope.row.cumulative_filtration_flow || 0 }}L
            </span>
          </template>
        </el-table-column>
        
        <!-- 三个滤芯寿命列 -->
        <el-table-column label="PP棉滤芯" width="160" align="center">
          <template #default="scope">
            <div class="filter-life">
              <el-progress 
                :percentage="scope.row.f3_life_percent || 0" 
                :status="getFilterLifeStatus(scope.row.f3_life_percent)"
                :stroke-width="10"
                :show-text="false"
              />
              <span class="filter-percent">{{ (scope.row.f3_life_percent || 0).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="活性炭滤芯" width="160" align="center">
          <template #default="scope">
            <div class="filter-life">
              <el-progress 
                :percentage="scope.row.f2_life_percent || 0" 
                :status="getFilterLifeStatus(scope.row.f2_life_percent)"
                :stroke-width="10"
                :show-text="false"
              />
              <span class="filter-percent">{{ (scope.row.f2_life_percent || 0).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="RO反渗透滤芯" width="160" align="center">
          <template #default="scope">
            <div class="filter-life">
              <el-progress 
                :percentage="scope.row.f1_life_percent || 0" 
                :status="getFilterLifeStatus(scope.row.f1_life_percent)"
                :stroke-width="10"
                :show-text="false"
              />
              <span class="filter-percent">{{ (scope.row.f1_life_percent || 0).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="activate_date" label="激活时间" width="160" show-overflow-tooltip>
          <template #default="scope">
            <div class="date-info">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(scope.row.activate_date) }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="service_end_time" label="服务到期" width="160" show-overflow-tooltip>
          <template #default="scope">
            <div class="date-info">
              <el-icon><Warning /></el-icon>
              <span>{{ formatDate(scope.row.service_end_time) }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="last_sync_time" label="最后同步" width="160" show-overflow-tooltip>
          <template #default="scope">
            <div class="date-info">
              <el-icon><Refresh /></el-icon>
              <span>{{ formatDate(scope.row.last_sync_time) }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click.stop="handleUpdate(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="info" size="small" @click="handleView(scope.row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button 
                :type="scope.row.is_self_use == 1 ? 'success' : 'warning'" 
                size="small" 
                @click.stop="handleToggleSelfUse(scope.row)"
              >
                <el-icon><Check v-if="scope.row.is_self_use == 1" /><Money v-else /></el-icon>
                {{ scope.row.is_self_use == 1 ? '设为销售' : '设为自用' }}
              </el-button>
              <el-button 
                :type="scope.row.is_water_point == 1 ? 'danger' : 'primary'" 
                size="small" 
                @click.stop="handleToggleWaterPoint(scope.row)"
              >
                <el-icon><Location v-if="scope.row.is_water_point == 1" /><Plus v-else /></el-icon>
                {{ scope.row.is_water_point == 1 ? '取消取水点' : '设为取水点' }}
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click.stop="handleDelete(scope.row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-if="total > 0"
        :current-page="listQuery.page"
        :page-sizes="[10, 20, 30, 50, 100]"
        :page-size="listQuery.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>

    <el-drawer
      v-model="detailDrawer.visible"
      :title="detailDrawer.title || '设备详情'"
      size="70%"
      direction="rtl"
      destroy-on-close
      :close-on-click-modal="false"
      :append-to-body="true"
      @close="closeDetailDrawer"
    >
      <DeviceDetail
        v-if="detailDrawer.visible && detailDrawer.id"
        :id="detailDrawer.id"
        :embedded="true"
      />
    </el-drawer>

    <!-- 同步确认对话框 -->
    <el-dialog
      title="同步设备数据"
      v-model="syncDialogVisible"
      width="500px"
      destroy-on-close
      :close-on-click-modal="!syncLoading"
      :close-on-press-escape="!syncLoading"
      :show-close="!syncLoading"
    >
      <div class="sync-dialog-content" v-loading="syncLoading" element-loading-text="同步中，请稍候...">
        <template v-if="!syncLoading">
          <el-icon class="warning-icon"><Warning /></el-icon>
          <div class="sync-message">
            <p>确定要从原始数据库同步点点够设备数据吗？</p>
            <p class="sync-tip">同步过程可能需要一些时间，请耐心等待。</p>
            <el-checkbox v-model="forceSyncOption" label="强制同步所有数据（不考虑上次同步时间）"></el-checkbox>
          </div>
        </template>
        
        <template v-else>
          <div class="sync-progress">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>{{ syncMessageText }}</p>
            <p class="sync-tip">同步过程可能需要几分钟，请不要关闭窗口</p>
          </div>
        </template>
      </div>
      <template #footer>
        <span class="dialog-footer" v-if="!syncLoading">
          <el-button @click="syncDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="performSync" :loading="syncLoading">确定同步</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 同步结果对话框 -->
    <el-dialog
      title="同步结果"
      v-model="syncResultDialogVisible"
      width="600px"
      destroy-on-close
    >
      <div class="sync-result-content" v-html="syncResultDetails"></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="syncResultDialogVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 内联编辑设备信息弹窗 -->
    <el-dialog
      title="编辑设备信息"
      v-model="editDialogVisible"
      width="650px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="editLoading" element-loading-text="加载中...">
        <el-form 
          ref="deviceForm" 
          :model="deviceForm" 
          :rules="formRules" 
          label-width="100px" 
          label-position="right"
          size="small"
        >
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="设备编号">
                <el-input v-model="deviceInfo.device_number" disabled></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="设备名称" prop="device_name">
                <el-input v-model="deviceForm.device_name" placeholder="请输入设备名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="设备状态" prop="status">
                <el-select v-model="deviceForm.status" style="width: 100%">
                  <el-option label="启用" value="E"></el-option>
                  <el-option label="禁用" value="D"></el-option>
                  <el-option label="维护中" value="maintenance"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="设备类型" prop="device_type">
                <el-select v-model="deviceForm.device_type" placeholder="请选择设备类型" style="width: 100%" clearable>
                  <el-option label="小扁豆" value="小扁豆"></el-option>
                  <el-option label="大扁豆" value="大扁豆"></el-option>
                  <el-option label="商务机" value="商务机"></el-option>
                  <el-option label="其他" value="其他"></el-option>
                </el-select>
                <div class="form-tip">* 留空将根据滤芯配置自动推断设备类型</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="所属VIP" prop="app_user_id" class="vip-selector">
                <el-select
                  v-model="deviceForm.app_user_id"
                  filterable
                  remote
                  reserve-keyword
                  placeholder="请输入VIP用户姓名或手机号搜索"
                  :remote-method="remoteSearchAppUsers"
                  :loading="userLoading"
                  @change="handleAppUserChange"
                  style="width: 100%;"
                  popper-class="user-select-dropdown"
                >
                  <el-option
                    v-for="item in appUserOptions"
                    :key="item.id"
                    :label="item.label"
                    :value="item.id"
                  >
                    <div class="user-option">
                      <div class="user-avatar">
                        <el-avatar :size="30" :src="item.wechat_avatar || item.avatar" fit="cover"></el-avatar>
                      </div>
                      <div class="user-info">
                        <span class="user-name">{{ item.name }} <span class="user-id">(ID: {{ item.id }})</span></span>
                        <span class="user-phone">{{ item.phone }}</span>
                      </div>
                    </div>
                  </el-option>
                </el-select>
                <div class="form-tip">* 请仔细选择正确的VIP用户，避免误操作</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="计费模式" prop="billing_mode">
                <el-select v-model="deviceForm.billing_mode" style="width: 100%">
                  <el-option label="流量计费" value="1"></el-option>
                  <el-option label="包年计费" value="0"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item 
                v-if="deviceForm.billing_mode === '1'" 
                label="剩余流量" 
                prop="surplus_flow"
              >
                <el-input-number 
                  v-model="deviceForm.surplus_flow" 
                  :min="0" 
                  :precision="0" 
                  style="width: 100%;"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">L</span>
              </el-form-item>
              
              <el-form-item 
                v-if="deviceForm.billing_mode === '0'" 
                label="剩余天数" 
                prop="remaining_days"
              >
                <el-input-number 
                  v-model="deviceForm.remaining_days" 
                  :min="0" 
                  :precision="0" 
                  style="width: 100%;"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">天</span>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="套餐类型" prop="package_type">
                <el-select 
                  v-model="deviceForm.package_type" 
                  style="width: 100%;"
                  placeholder="请选择套餐类型"
                  @change="calculateCommission"
                >
                  <el-option-group 
                    v-for="deviceType in packageOptions" 
                    :key="deviceType.type" 
                    :label="deviceType.type"
                  >
                    <el-option
                      v-for="pkg in deviceType.packages"
                      :key="pkg.value"
                      :label="pkg.label"
                      :value="pkg.value"
                    >
                      <span>{{ pkg.label }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px;">提成￥{{ pkg.commission }}</span>
                    </el-option>
                  </el-option-group>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="提成金额">
                <el-input 
                  v-model="commissionDisplay" 
                  disabled
                  style="width: 100%;"
                  placeholder="请先选择套餐类型"
                >
                  <template #prefix>￥</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="是否自用" prop="is_self_use">
                <el-radio-group v-model="deviceForm.is_self_use">
                  <el-radio :label="0">销售设备</el-radio>
                  <el-radio :label="1">自用设备</el-radio>
                </el-radio-group>
                <div class="form-tip">* 自用设备不计入业务员销量统计</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input 
                  v-model="deviceForm.remark" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入备注信息"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getTappDeviceList, getTappDeviceDetail, updateTappDevice, syncTappDevices, getAppUsersList, deleteTappDevice } from '@/api/tapp-device';
import DeviceDetail from './Detail.vue';
import { 
  Monitor, Refresh, Search, Filter, Warning, Clock, Connection, Close, 
  View, Edit, Setting, Document, Link, Unlock, Delete, User, 
  Shop, Location, Money, Opportunity, Check, Loading, UserFilled, Coin, Plus, TrendCharts
} from '@element-plus/icons-vue';

export default {
  name: 'TappDeviceList',
  components: {
    Monitor, Refresh, Search, Filter, Warning, Clock, Connection, Close,
    View, Edit, Setting, Document, Link, Unlock, Delete, User,
    Shop, Location, Money, Opportunity, Check, Loading, UserFilled, Coin, Plus, TrendCharts,
    DeviceDetail
  },
  data() {
    return {
      list: [],
      total: 0,
      statistics: null,
      listLoading: true,
      listQuery: {
        keyword: '',
        page: 1,
        limit: 20,
        status: '',
        device_type: '',
        device_type_name: '',
        network_status: '',
        billing_mode: '',
        is_self_use: '',
        vip_user: '',
        start_date: '',
        end_date: '',
        water_min: null,
        water_max: null,
      },
      dateRange: [],
      showAdvancedFilter: false,
      statusOptions: [
        { value: 'E', label: '启用' },
        { value: 'D', label: '禁用' },
        { value: 'maintenance', label: '维护中' }
      ],
      typeOptions: [
        { value: '标准型', label: '标准型' },
        { value: '豪华型', label: '豪华型' },
        { value: '简易型', label: '简易型' }
      ],
      syncDialogVisible: false,
      syncResultDialogVisible: false,
      syncLoading: false,
      syncResultDetails: '',
      forceSyncOption: false,
      syncMessageText: '准备同步设备数据...',
      editDialogVisible: false,
      currentDeviceId: null,
      editLoading: false,
      userLoading: false,
      submitLoading: false,
      deviceInfo: {
        device_number: '',
        dealer_name: '',
        client_name: '',
        imei: '',
        network_status: '',
      },
      deviceForm: {
        device_name: '',
        app_user_id: null,
        app_user_name: '',
        status: '',
        device_type: '',
        billing_mode: '',
        surplus_flow: 0,
        remaining_days: 0,
        remark: '',
        is_self_use: 0,
        commission_amount: null,
        package_type: ''
      },
      packageOptions: [
        {
          type: '小扁豆',
          packages: [
            { value: 'xiaobiandou_flow', label: '流量套餐 980元/4000升', price: 980, commission: 294 },
            { value: 'xiaobiandou_annual', label: '包年套餐 1200元/年', price: 1200, commission: 360 }
          ]
        },
        {
          type: '大扁豆',
          packages: [
            { value: 'dabiandou_annual', label: '包年套餐 1500元/年', price: 1500, commission: 450 }
          ]
        },
        {
          type: '商务机',
          packages: [
            { value: 'shangwuji_annual', label: '包年套餐 2400元/年', price: 2400, commission: 720 }
          ]
        }
      ],
      detailDrawer: {
        visible: false,
        id: null,
        title: ''
      },
      commissionDisplay: '',
      appUserOptions: [],
      formRules: {
        device_name: [
          { max: 50, message: '设备名称不能超过50个字符', trigger: 'blur' }
        ],
        app_user_id: [
          { required: true, message: '请选择所属VIP用户', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择设备状态', trigger: 'change' }
        ],
        billing_mode: [
          { required: true, message: '请选择计费模式', trigger: 'change' }
        ],
        surplus_flow: [
          { required: true, message: '请输入剩余流量', trigger: 'blur' }
        ],
        remaining_days: [
          { required: true, message: '请输入剩余天数', trigger: 'blur' }
        ]
      },
    };
  },
  created() {
    // 添加错误处理，防止页面跳转
    try {
      this.getList();
    } catch (error) {
      console.error('初始化设备列表失败:', error);
      this.listLoading = false;
      this.$notify({
        title: '错误',
        message: '加载设备列表失败，请稍后重试',
        type: 'error',
        duration: 3000
      });
    }
    
    // 阻止页面意外跳转
    window.addEventListener('beforeunload', this.preventUnload);
  },
  
  beforeUnmount() {
    // 清理事件监听
    window.removeEventListener('beforeunload', this.preventUnload);
  },
  
  methods: {
    preventUnload(event) {
      // 如果正在加载，则阻止页面跳转
      if (this.listLoading) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    },
    
    // 点击剩余水量预警卡片，筛选水量预警设备
    filterWaterWarningDevices() {
      // 清空其他筛选条件
      this.listQuery = {
        ...this.listQuery,
        keyword: '',
        status: '',
        network_status: '',
        device_type: '',
        device_type_name: '',
        billing_mode: '',
        is_self_use: '',
        vip_user: '',
        start_date: '',
        end_date: '',
        water_min: '',
        water_max: '',
        water_warning_filter: 'true', // 新增水量预警筛选参数
        page: 1
      };
      
      // 重新加载数据
      this.getList();
      
      // 显示提示信息
      this.$message({
        type: 'info',
        message: '已筛选显示所有水量预警设备（低水量、即将到期）'
      });
    },
    
    // 点击滤芯预警卡片，筛选滤芯预警设备
    filterFilterWarningDevices() {
      // 清空其他筛选条件
      this.listQuery = {
        ...this.listQuery,
        keyword: '',
        status: '',
        network_status: '',
        device_type: '',
        device_type_name: '', // 清空device_type_name字段
        billing_mode: '',
        is_self_use: '',
        vip_user: '',
        start_date: '',
        end_date: '',
        water_min: '',
        water_max: '',
        filter_warning_filter: 'true', // 新增滤芯预警筛选参数
        page: 1
      };
      
      // 重新加载数据
      this.getList();
      
      // 显示提示信息
      this.$message({
        type: 'info',
        message: '已筛选显示所有滤芯预警设备（滤芯寿命低于20%）'
      });
    },
    
    // 点击预警设备卡片，筛选预警设备（兼容旧版本）
    filterWarningDevices() {
      // 清空其他筛选条件
      this.listQuery = {
        ...this.listQuery,
        keyword: '',
        status: '',
        network_status: '',
        device_type: '',
        device_type_name: '', // 清空device_type_name字段
        billing_mode: '',
        is_self_use: '',
        vip_user: '',
        start_date: '',
        end_date: '',
        water_min: '',
        water_max: '',
        warning_filter: 'true', // 新增预警设备筛选参数
        page: 1
      };
      
      // 重新加载数据
      this.getList();
      
      // 显示提示信息
      this.$message({
        type: 'info',
        message: '已筛选显示所有预警设备（低水量、即将到期、滤芯预警）'
      });
    },
    getList() {
      this.listLoading = true;
      
      // 转换参数格式，将limit改为per_page，兼容V1 API
      const apiParams = {
        ...this.listQuery,
        per_page: this.listQuery.limit
      };
      delete apiParams.limit;
      
      
      getTappDeviceList(apiParams)
        .then(response => {
          
          // 兼容V1 API响应格式 (code: 200) 和旧格式 (code: 0)
          if ((response.code === 200 || response.code === 0) && response.data) {
            if (response.data.data) {
              // V1 API格式：data.data包含列表数据
              this.list = response.data.data || [];
              this.total = response.data.total || 0;
              this.statistics = response.data.statistics || null;
            } else if (response.data.list) {
              // 旧格式：data.list包含列表数据
              this.list = response.data.list || [];
              this.total = response.data.total || 0;
              this.statistics = response.data.statistics || null;
            } else {
              // 直接数组格式
              this.list = Array.isArray(response.data) ? response.data : [];
              this.total = this.list.length;
            }
            
          } else {
            console.error('获取设备列表失败:', response);
            this.$notify({
              title: '错误',
              message: response.message || '获取设备列表失败',
              type: 'error',
              duration: 2000
            });
            this.list = [];
            this.total = 0;
          }
        })
        .catch(error => {
          console.error('获取设备列表失败:', error);
          this.$notify({
            title: '错误',
            message: '获取设备列表失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 2000
          });
          this.list = [];
          this.total = 0;
        })
        .finally(() => {
          this.listLoading = false;
        });
    },
    tableRowClassName({row, rowIndex}) {
      if (row.status === 'maintenance') {
        return 'warning-row';
      } else if (row.network_status === '0') {
        return 'offline-row';
      } else if (row.is_self_use == 1) {
        return 'self-use-row';
      }
      return '';
    },
    handleFilter() {
      this.listQuery.page = 1;
      this.getList();
    },
    resetFilter() {
      this.listQuery = {
        keyword: '',
        page: 1,
        limit: 20,
        status: '',
        device_type: '',
        device_type_name: '',
        network_status: '',
        billing_mode: '',
        is_self_use: '',
        vip_user: '',
        start_date: '',
        end_date: '',
        water_min: null,
        water_max: null,
        warning_filter: '', // 清除预警设备筛选
      };
      this.dateRange = [];
      this.getList();
      
      // 显示重置提示
      this.$message({
        type: 'success',
        message: '已重置所有筛选条件'
      });
    },
    handleDateRangeChange(val) {
      if (val) {
        this.listQuery.start_date = val[0];
        this.listQuery.end_date = val[1];
      } else {
        this.listQuery.start_date = '';
        this.listQuery.end_date = '';
      }
    },
    getStatusType(status) {
      const statusMap = {
        'E': 'success',
        'D': 'danger',
        'maintenance': 'warning'
      };
      return statusMap[status] || 'info';
    },
    getNetworkStatusType(status) {
      return status === '1' ? 'success' : 'danger';
    },
    handleUpdate(row) {
      this.currentDeviceId = row.id;
      this.fetchDeviceDetail();
    },
    fetchDeviceDetail() {
      this.editLoading = true;
      this.editDialogVisible = true;
      
      // 先清空设备信息，避免显示上一次的数据
      this.deviceInfo = {
        device_number: '',
        dealer_name: '',
        client_name: '',
        imei: '',
        network_status: '',
      };
      
      this.deviceForm = {
        device_name: '',
        app_user_id: null,
        app_user_name: '',
        status: 'E',
        device_type: '',
        billing_mode: '1',
        surplus_flow: 0,
        remaining_days: 0,
        remark: '',
        is_self_use: 0,
        commission_amount: null,
        package_type: ''
      };
      
      // 重置提成显示
      this.commissionDisplay = '';
      
      // 使用API获取设备详情
      getTappDeviceDetail(this.currentDeviceId)
        .then(response => {
          if (response.code === 0) {
            const device = response.data;
            this.deviceInfo = {
              device_number: device.device_number || '',
              dealer_name: device.dealer_name || '',
              client_name: device.client_name || '',
              imei: device.imei || '',
              network_status: device.network_status || '',
            };
            
            this.deviceForm = {
              device_name: device.device_name || '',
              app_user_id: device.app_user_id || null,
              app_user_name: device.app_user_name || '',
              status: device.status || 'E',
              device_type: device.device_type || '',
              billing_mode: device.billing_mode || '1',
              surplus_flow: parseInt(device.surplus_flow) || 0,
              remaining_days: parseInt(device.remaining_days) || 0,
              remark: device.remark || '',
              is_self_use: device.is_self_use === undefined ? 0 : parseInt(device.is_self_use),
              commission_amount: device.commission_amount ? parseFloat(device.commission_amount) : null,
              package_type: device.package_type || ''
            };
            
            // 根据现有的commission_amount反推套餐类型（如果没有package_type）
            if (!this.deviceForm.package_type && this.deviceForm.commission_amount) {
              this.reverseCalculatePackageType(this.deviceForm.commission_amount);
            }
            
            // 如果没有套餐类型，尝试根据设备类型和计费模式自动选择
            if (!this.deviceForm.package_type) {
              this.autoSelectPackage();
            } else {
              // 如果已有套餐类型，更新显示
              this.calculateCommission();
            }
            
            // 初始化VIP用户选项
            const initialUser = {
              id: device.app_user_id,
              name: device.app_user_name,
              phone: device.app_user_phone || '',
              avatar: device.app_user_avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
              wechat_avatar: device.wechat_avatar || '',
              label: device.app_user_name + (device.app_user_phone ? ` (${device.app_user_phone})` : '')
            };
            this.appUserOptions = [initialUser];
            
            // 不管是否有初始VIP用户，都预加载一些VIP用户供选择
            this.loadAppUsers();
          } else {
            console.error('获取设备详情失败:', response.message);
            this.$notify({
              title: '错误',
              message: response.message || '获取设备详情失败',
              type: 'error',
              duration: 2000
            });
            // 关闭弹窗，避免卡在加载状态
            this.editDialogVisible = false;
          }
        })
        .catch(error => {
          console.error('获取设备详情异常:', error);
          this.$notify({
            title: '错误',
            message: '获取设备详情失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 2000
          });
          // 关闭弹窗，避免卡在加载状态
          this.editDialogVisible = false;
        })
        .finally(() => {
          this.editLoading = false;
        });
    },
    loadAppUsers() {
      this.userLoading = true;
      
      getAppUsersList({})
        .then(response => {
          if (response.code === 0) {
            // 确保每个用户项都有正确的格式
            const appUsers = response.data || [];
            
            this.appUserOptions = appUsers.map(user => {
              // 确保所有必要的字段都有值
              const formattedUser = {
                id: user.id,
                name: user.name || user.nickname || '未命名用户',
                phone: user.phone || '无手机号',
                avatar: user.wechat_avatar || user.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                wechat_avatar: user.wechat_avatar || '',
                label: (user.name || user.nickname || '用户') + (user.phone ? ` (${user.phone})` : '')
              };
              return formattedUser;
            });
            
          } else {
            console.error('获取VIP用户列表失败:', response.message);
            this.$notify({
              title: '提示',
              message: '获取VIP用户列表失败：' + (response.message || '未知错误'),
              type: 'warning',
              duration: 3000
            });
            this.appUserOptions = [];
          }
        })
        .catch(error => {
          console.error('获取VIP用户列表异常:', error);
          this.$notify({
            title: '错误',
            message: '获取VIP用户列表失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 2000
          });
          this.appUserOptions = [];
        })
        .finally(() => {
          this.userLoading = false;
        });
    },
    remoteSearchAppUsers(query) {
      if (query !== '') {
        this.userLoading = true;
        
        getAppUsersList({ keyword: query })
          .then(response => {
            if (response.code === 0) {
              // 确保每个用户项都有正确的格式
              const appUsers = response.data || [];
              
              this.appUserOptions = appUsers.map(user => {
                // 确保所有必要的字段都有值
                const formattedUser = {
                  id: user.id,
                  name: user.name || user.nickname || '未命名用户',
                  phone: user.phone || '无手机号',
                  avatar: user.wechat_avatar || user.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                  wechat_avatar: user.wechat_avatar || '',
                  label: (user.name || user.nickname || '用户') + (user.phone ? ` (${user.phone})` : '')
                };
                return formattedUser;
              });
              
            } else {
              console.error('搜索VIP用户失败:', response.message);
              this.$notify({
                title: '错误',
                message: response.message || '获取VIP用户列表失败',
                type: 'error',
                duration: 2000
              });
              this.appUserOptions = [];
            }
          })
          .catch(error => {
            console.error('搜索VIP用户异常:', error);
            this.$notify({
              title: '错误',
              message: '搜索VIP用户失败: ' + (error.message || '未知错误'),
              type: 'error',
              duration: 2000
            });
            this.appUserOptions = [];
          })
          .finally(() => {
            this.userLoading = false;
          });
      } else {
        this.loadAppUsers();
      }
    },
    handleAppUserChange(value) {
      const selectedUser = this.appUserOptions.find(user => user.id === value);
      if (selectedUser) {
        this.deviceForm.app_user_name = selectedUser.name;
      } else {
        this.deviceForm.app_user_name = '';
      }
    },
    submitForm() {
      this.$refs.deviceForm.validate(valid => {
        if (valid) {
          this.submitLoading = true;
          
          updateTappDevice(this.currentDeviceId, this.deviceForm)
            .then(response => {
              if (response.code === 0) {
                this.$notify({
                  title: '成功',
                  message: '更新设备信息成功',
                  type: 'success',
                  duration: 2000
                });
                this.editDialogVisible = false;
                this.getList(); // 刷新列表
              } else {
                this.$notify({
                  title: '错误',
                  message: response.message || '更新设备信息失败',
                  type: 'error',
                  duration: 2000
                });
              }
            })
            .catch(error => {
              console.error('更新设备信息失败:', error);
              this.$notify({
                title: '错误',
                message: '更新设备信息失败: ' + (error.message || '未知错误'),
                type: 'error',
                duration: 2000
              });
            })
            .finally(() => {
              this.submitLoading = false;
            });
        }
      });
    },
    handleView(row) {
      if (!row?.id) return;
      this.detailDrawer.visible = true;
      this.detailDrawer.id = row.id;
      this.detailDrawer.title = row.device_name || row.device_number || `设备 #${row.id}`;
    },
    closeDetailDrawer() {
      this.detailDrawer.visible = false;
      this.detailDrawer.id = null;
      this.detailDrawer.title = '';
    },
    handleToggleSelfUse(row) {
      const newStatus = row.is_self_use == 1 ? 0 : 1;
      const statusText = newStatus == 1 ? '自用' : '销售';
      
      this.$confirm(`确定将设备切换为${statusText}状态?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        updateTappDevice(row.id, { is_self_use: newStatus })
          .then(response => {
            if (response.code === 0) {
              this.$notify({
                title: '成功',
                message: `设备已设置为${statusText}状态`,
                type: 'success',
                duration: 2000
              });
              this.getList();
            } else {
              this.$notify({
                title: '失败',
                message: response.message || '更新设备状态失败',
                type: 'error',
                duration: 2000
              });
            }
          })
          .catch(error => {
            console.error('设为自用/销售请求出错:', error);
            this.$notify({
              title: '错误',
              message: '操作失败: ' + (error.message || '未知错误'),
              type: 'error',
              duration: 2000
            });
          });
      }).catch(() => {
        // 用户取消操作
      });
    },
    handleToggleWaterPoint(row) {
      const newStatus = row.is_water_point == 1 ? 0 : 1;
      const statusText = newStatus == 1 ? '取水点' : '普通设备';
      
      this.$confirm(`确定将设备设置为${statusText}?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        updateTappDevice(row.id, { is_water_point: newStatus })
          .then(response => {
            if (response.code === 0) {
              this.$notify({
                title: '成功',
                message: `设备已设置为${statusText}`,
                type: 'success',
                duration: 2000
              });
              this.getList();
            } else {
              this.$notify({
                title: '失败',
                message: response.message || '更新设备状态失败',
                type: 'error',
                duration: 2000
              });
            }
          })
          .catch(error => {
            console.error('设为取水点请求出错:', error);
            this.$notify({
              title: '错误',
              message: '操作失败: ' + (error.message || '未知错误'),
              type: 'error',
              duration: 2000
            });
          });
      }).catch(() => {
        // 用户取消操作
      });
    },
    syncData() {
      this.syncDialogVisible = true;
      this.forceSyncOption = false;
    },
    performSync() {
      this.syncLoading = true;
      this.syncMessageText = '正在同步数据，请耐心等待...';
      
      // 设置超时，避免无限等待
      const syncTimeout = setTimeout(() => {
        if (this.syncLoading) {
          this.syncLoading = false;
          this.syncDialogVisible = false;
          this.$notify({
            title: '警告',
            message: '同步操作超时，但可能仍在后台执行中。请稍后刷新页面查看结果。',
            type: 'warning',
            duration: 5000
          });
        }
      }, 60000); // 60秒超时
      
      // 使用API封装方法
      syncTappDevices({ force: this.forceSyncOption })
        .then(response => {
          clearTimeout(syncTimeout);
          this.syncLoading = false;
          this.syncDialogVisible = false;
          
          if (response.code === 0) {
            this.$notify({
              title: '成功',
              message: '数据同步成功',
              type: 'success',
              duration: 2000
            });
            
            // 显示同步详情
            this.syncResultDetails = response.data.details || '同步完成';
            this.syncResultDialogVisible = true;
            
            // 刷新列表
            this.getList();
          } else {
            this.$notify({
              title: '错误',
              message: response.message || '同步失败',
              type: 'error',
              duration: 5000
            });
            
            // 尝试显示详情
            if (response.data && response.data.details) {
              this.syncResultDetails = response.data.details;
              this.syncResultDialogVisible = true;
            }
          }
        })
        .catch(error => {
          console.error('同步失败:', error);
          clearTimeout(syncTimeout);
          this.syncLoading = false;
          this.syncDialogVisible = false;
          
          this.$notify({
            title: '错误',
            message: '同步失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 5000
          });
          
          // 如果是认证错误，跳转到登录页
          if (error.message && error.message.includes('认证失败')) {
            setTimeout(() => {
              window.location.href = '/admin/#/login';
            }, 1500);
          }
        });
    },
    handleSizeChange(val) {
      this.listQuery.limit = val;
      this.getList();
    },
    handleCurrentChange(val) {
      this.listQuery.page = val;
      this.getList();
    },
    getFilterLifeStatus(percentage) {
      if (percentage === null || percentage === undefined) {
        return '';
      } else if (percentage < 20) {
        return 'danger';
      } else if (percentage < 50) {
        return 'warning';
      } else {
        return 'success';
      }
    },
    handleDelete(row) {
      this.$confirm('确认要删除该设备吗？此操作不可恢复', '确认删除', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.listLoading = true;
        
        deleteTappDevice(row.id)
          .then(response => {
            if (response.code === 0) {
              this.$notify({
                title: '成功',
                message: '设备已成功删除',
                type: 'success',
                duration: 2000
              });
              this.getList();
            } else {
              this.$notify({
                title: '错误',
                message: response.message || '删除设备失败',
                type: 'error',
                duration: 2000
              });
            }
          })
          .catch(error => {
            this.$notify({
              title: '错误',
              message: `删除设备失败: ${error.message}`,
              type: 'error',
              duration: 2000
            });
            console.error('删除设备时发生错误:', error);
          })
          .finally(() => {
            this.listLoading = false;
          });
      }).catch(() => {
        // 用户取消删除操作
      });
    },
    handleRowClick(row) {
      this.handleView(row);
    },
    getStatusColor(status) {
      const statusMap = {
        'E': '#67c23a',
        'D': '#f56c6c',
        'maintenance': '#e6a23c'
      };
      return statusMap[status] || '#909399';
    },
    formatDate(dateString) {
      if (!dateString || dateString === '0000-00-00 00:00:00') return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
      } catch (e) {
        return dateString;
      }
    },
    getEnabledDevices() {
      return this.statistics?.enabled_devices || 0;
    },
    getDisabledDevices() {
      return this.statistics?.disabled_devices || 0;
    },
    getMaintenanceDevices() {
      return this.statistics?.maintenance_devices || 0;
    },
    getTodayDevices() {
      return this.statistics?.today_activated_devices || 0;
    },
    getMonthDevices() {
      return this.statistics?.month_activated_devices || 0;
    },
    getAssignedDevices() {
      return this.statistics?.assigned_vip_devices || 0;
    },
    getUnassignedDevices() {
      return this.statistics?.unassigned_vip_devices || 0;
    },
    getAvgWaterFlow() {
      return this.statistics?.avg_water_flow || 0;
    },
    getTotalWaterFlow() {
      return this.statistics?.total_water_flow || 0;
    },
    // 计算提成金额
    calculateCommission() {
      if (!this.deviceForm.package_type) {
        this.commissionDisplay = '';
        this.deviceForm.commission_amount = null;
        return;
      }
      
      // 查找选中的套餐
      let selectedPackage = null;
      for (const deviceType of this.packageOptions) {
        for (const pkg of deviceType.packages) {
          if (pkg.value === this.deviceForm.package_type) {
            selectedPackage = pkg;
            break;
          }
        }
        if (selectedPackage) break;
      }
      
      if (selectedPackage) {
        this.commissionDisplay = selectedPackage.commission.toFixed(2);
        this.deviceForm.commission_amount = selectedPackage.commission;
      } else {
        this.commissionDisplay = '';
        this.deviceForm.commission_amount = null;
      }
    },
    // 根据设备类型和计费模式智能选择套餐
    autoSelectPackage() {
      if (!this.deviceForm.device_type || !this.deviceForm.billing_mode) {
        return;
      }
      
      const deviceType = this.deviceForm.device_type;
      const billingMode = this.deviceForm.billing_mode;
      
      // 根据设备类型和计费模式自动选择套餐
      if (deviceType.includes('小扁豆') || deviceType === '小扁豆') {
        if (billingMode === '1') { // 流量计费
          this.deviceForm.package_type = 'xiaobiandou_flow';
        } else { // 包年计费
          this.deviceForm.package_type = 'xiaobiandou_annual';
        }
      } else if (deviceType.includes('大扁豆') || deviceType === '大扁豆') {
        this.deviceForm.package_type = 'dabiandou_annual';
      } else if (deviceType.includes('商务机') || deviceType === '商务机') {
        this.deviceForm.package_type = 'shangwuji_annual';
      }
      
      // 自动计算提成
      this.calculateCommission();
    },
    // 根据提成金额反推套餐类型
    reverseCalculatePackageType(commissionAmount, deviceType) {
      if (!commissionAmount || !deviceType) return '';
      
      const amount = parseFloat(commissionAmount);
      
      switch (deviceType) {
        case '小扁豆':
          if (amount === 294) return 'xiaobiandou_flow';
          if (amount === 360) return 'xiaobiandou_annual';
          break;
        case '大扁豆':
          if (amount === 450) return 'dabiandou_annual';
          break;
        case '商务机':
          if (amount === 720) return 'shangwuji_annual';
          break;
      }
      
      return '';
    },
    // 获取列表显示的提成金额（自动计算）
    getCommissionAmount(device) {
      // 自用设备和取水点设备没有销售提成
      if (device.is_self_use || device.is_water_point) {
        return '-';
      }
      
      // 如果有存储的提成金额，直接使用
      if (device.commission_amount) {
        return '¥' + device.commission_amount;
      }
      
      // 根据设备类型和计费模式自动计算
      const deviceType = device.device_type;
      const billingMode = device.billing_mode;
      
      // 如果设备类型为空，尝试根据计费模式推断（默认为小扁豆）
      let inferredDeviceType = deviceType;
      if (!deviceType || deviceType === null) {
        // 如果没有设备类型，默认按小扁豆处理
        inferredDeviceType = '小扁豆';
      }
      
      let commission = 0;
      
      switch (inferredDeviceType) {
        case '小扁豆':
          if (billingMode === '1') {
            commission = 294; // 流量套餐 980元 * 30%
          } else if (billingMode === '0') {
            commission = 360; // 包年套餐 1200元 * 30%
          }
          break;
        case '大扁豆':
          if (billingMode === '0') {
            commission = 450; // 包年套餐 1500元 * 30%
          }
          break;
        case '商务机':
          if (billingMode === '0') {
            commission = 720; // 包年套餐 2400元 * 30%
          }
          break;
      }
      
      return commission > 0 ? '¥' + commission : '-';
    },
  }
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
  
  /* 页面头部样式 */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    
    .header-left .page-title {
      display: flex;
      align-items: center;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      
      .el-icon {
        margin-right: 12px;
        font-size: 28px;
      }
    }
    
    .page-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    
    .header-right .el-button {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }

  /* 统计卡片样式 */
  .stats-container {
    margin-bottom: 24px;
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      border: 1px solid #f0f0f0;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      // 可点击卡片样式
      &.clickable {
        cursor: pointer;
        
        &:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
          border-color: #409eff;
        }
        
        &:active {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
      }
      
      .stat-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;
        
        .el-icon {
          font-size: 28px;
          color: white;
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 6px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .stat-percentage {
          font-size: 12px;
          color: #999;
          margin-bottom: 2px;
        }
        
        .stat-detail {
          font-size: 12px;
          color: #999;
          line-height: 1.3;
        }
      }
      
      &.total {
        .stat-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .stat-number {
          color: #667eea;
        }
      }
      
      &.online {
        .stat-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .stat-number {
          color: #4facfe;
        }
      }
      
      &.warning {
        .stat-icon {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        .stat-number {
          color: #fa709a;
        }
      }
      
      &.billing {
        .stat-icon {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }
        .stat-number {
          color: #a8edea;
        }
      }
      
      &.success {
        .stat-icon {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }
        .stat-number {
          color: #67c23a;
        }
      }
      
      &.info {
        .stat-icon {
          background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
        }
        .stat-number {
          color: #409eff;
        }
      }
      
      &.purple {
        .stat-icon {
          background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
        }
        .stat-number {
          color: #9c27b0;
        }
      }
      
      &.orange {
        .stat-icon {
          background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
        }
        .stat-number {
          color: #ff9800;
        }
      }
      
      &.water-warning {
        .stat-icon {
          background: linear-gradient(135deg, #f56c6c 0%, #ff8a80 100%);
        }
        .stat-number {
          color: #f56c6c;
        }
      }
      
      &.filter-warning {
        .stat-icon {
          background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
        }
        .stat-number {
          color: #409eff;
        }
      }
    }
  }

  /* 筛选区域样式 */
  .filter-container {
    background-color: #fff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    border: 1px solid #f0f0f0;
    
    .filter-main {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      
      .filter-item {
        margin-right: 0;
        margin-bottom: 0;
      }
      
      .el-input {
        .el-input__wrapper {
          border-radius: 8px;
        }
      }
      
      .el-select {
        .el-input__wrapper {
          border-radius: 8px;
        }
      }
      
      .el-button {
        border-radius: 8px;
        font-weight: 500;
        
        .el-icon {
          margin-right: 6px;
        }
      }
    }
    
    .advanced-filter {
      border-top: 1px solid #ebeef5;
      padding-top: 20px;
      
      .filter-row {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      
      .filter-group {
        display: flex;
        align-items: center;
        margin-right: 30px;
        margin-bottom: 12px;
        
        .filter-label {
          width: 80px;
          text-align: right;
          margin-right: 12px;
          color: #606266;
          font-weight: 500;
        }
        
        .date-range {
          width: 360px;
        }
        
        .water-range {
          width: 120px;
        }
        
        .range-separator {
          margin: 0 12px;
          color: #909399;
        }
        
        .unit {
          margin-left: 12px;
          color: #909399;
        }
      }
      
      .filter-actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    }
  }

  /* 表格区域样式 */
  .table-container {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    
    .el-table {
      border-radius: 12px;
      
      .el-table__header {
        background-color: #fafbfc;
        
        th {
          background-color: #fafbfc !important;
          color: #606266;
          font-weight: 600;
          border-bottom: 1px solid #ebeef5;
        }
      }
      
      .el-table__body {
        tr {
          transition: all 0.2s ease;
          
          &:hover {
            background-color: #f8f9fa !important;
          }
        }
        
        td {
          border-bottom: 1px solid #f5f7fa;
          padding: 16px 12px;
        }
      }
    }
    
    /* 序号样式 */
    .sequence-number {
      font-weight: 600;
      color: #409eff;
      font-size: 14px;
    }
    
    /* 设备信息样式 */
    .device-info {
      .device-number {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .device-type {
        margin-top: 4px;
        
        .el-tag {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }
    
    /* 用户信息样式 */
    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      
      .el-icon {
        color: #409eff;
      }
    }
    
    .no-user {
      color: #c0c4cc;
      font-style: italic;
    }
    
    /* 渠道商/客户信息样式 */
    .dealer-client-info {
      .dealer, .client {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        font-size: 13px;
        
        .el-icon {
          color: #67c23a;
        }
      }
      
      .client .el-icon {
        color: #409eff;
      }
      
      .no-info {
        color: #c0c4cc;
        font-style: italic;
      }
    }
    
    /* 状态列样式 */
    .status-column {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }
    
    /* 用量信息样式 */
    .usage-info {
      .usage-value {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        
        .el-icon {
          color: #409eff;
        }
      }
    }
    
    /* 水量值样式 */
    .water-value {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      
      .el-icon {
        color: #67c23a;
      }
    }
    
    /* 计费模式样式 */
    .billing-mode {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #606266;
      
      .el-icon {
        color: #e6a23c;
      }
    }
    
    /* 滤芯寿命样式 */
    .filter-life {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      
      .el-progress {
        width: 100%;
      }
      
      .filter-percent {
        font-size: 12px;
        font-weight: 500;
        color: #606266;
      }
    }
    
    /* 日期信息样式 */
    .date-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #606266;
      
      .el-icon {
        color: #909399;
      }
    }
    
    /* 操作按钮样式 */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      
      .el-button {
        border-radius: 6px;
        font-size: 12px;
        
        .el-icon {
          margin-right: 4px;
        }
      }
      
      .el-dropdown {
        .el-button {
          .el-icon {
            margin-left: 4px;
            margin-right: 0;
          }
        }
      }
    }
  }

  /* 分页样式 */
  .pagination-container {
    padding: 20px 0;
    text-align: right;
    background-color: #fff;
    border-radius: 0 0 12px 12px;
    
    .el-pagination {
      .el-pager li {
        border-radius: 6px;
      }
      
      .btn-prev, .btn-next {
        border-radius: 6px;
      }
    }
  }
  
  /* 同步对话框样式 */
  .sync-dialog-content {
    display: flex;
    align-items: flex-start;
    
    .warning-icon {
      font-size: 22px;
      color: #E6A23C;
      margin-right: 12px;
      margin-top: 4px;
    }
    
    .loading-icon {
      font-size: 24px;
      margin-bottom: 15px;
      animation: rotate 2s linear infinite;
    }
    
    .sync-message {
      flex: 1;
      
      .sync-tip {
        color: #909399;
        font-size: 13px;
        margin: 10px 0;
      }
    }
    
    .sync-progress {
      text-align: center;
      
      .sync-tip {
        color: #909399;
        font-size: 13px;
        margin-top: 10px;
      }
    }
  }
  
  .sync-result-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  /* 表单样式 */
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
    padding-left: 2px;
  }
  
  .unit {
    margin-left: 8px;
    color: #909399;
  }
  
  .vip-selector {
    margin-bottom: 20px;
  }
  
  /* 用户选择下拉样式 */
  .user-option {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    width: 100%;
  }
  
  .user-avatar {
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    
    .user-name {
      font-size: 14px;
      color: #303133;
      margin-right: 6px;
      
      .user-id {
        font-size: 12px;
        color: #909399;
        font-weight: normal;
      }
    }
    
    .user-phone {
      font-size: 13px;
      color: #409eff;
      margin-left: 10px;
    }
  }
  
  .dialog-footer {
    text-align: right;
  }
}

/* 表格行样式 */
:deep(.warning-row) {
  background-color: #fdf6ec;
  
  &:hover > td {
    background-color: #faecd8 !important;
  }
}

:deep(.offline-row) {
  background-color: #f8f8f8;
  color: #909399;
  
  &:hover > td {
    background-color: #f0f0f0 !important;
  }
}

:deep(.self-use-row) {
  background-color: #f0f9eb;
  
  &:hover > td {
    background-color: #e1f3d8 !important;
  }
}

/* 动画效果 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .app-container {
    .filter-group {
      flex-basis: 100%;
    }
    
    .stat-card {
      .stat-content .stat-number {
        font-size: 28px;
      }
    }
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 15px;
    
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
      
      .header-left {
        margin-bottom: 12px;
        
        .page-title {
          font-size: 20px;
        }
      }
    }
    
    .stats-container {
      .el-col {
        margin-bottom: 16px;
      }
      
      .stat-card {
        padding: 16px;
        
        .stat-icon {
          width: 48px;
          height: 48px;
          margin-right: 16px;
          
          .el-icon {
            font-size: 20px;
          }
        }
        
        .stat-content .stat-number {
          font-size: 24px;
        }
      }
    }
    
    .filter-container, .table-container {
      padding: 16px;
    }
    
    .filter-main {
      flex-direction: column;
      
      .filter-item {
        width: 100% !important;
      }
    }
    
    .table-container {
      overflow-x: auto;
    }
  }
}
</style>

<!-- 添加全局样式，确保下拉框中的用户信息正确显示 -->
<style>
.user-select-dropdown .el-select-dropdown__item {
  padding: 0 !important;
  height: auto !important;
}

.user-option {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  width: 100%;
}

.user-avatar {
  margin-right: 8px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 14px;
  color: #303133;
  margin-right: 4px;
}

.user-id {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.user-phone {
  font-size: 13px;
  color: #409eff;
  margin-left: 10px;
}
</style>
