<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Monitor /></el-icon>
          点点够设备管理
        </h2>
        <p class="page-subtitle">管理和监控所有已激活的净水设备</p>
      </div>
      <div class="header-right">
        <el-button type="primary" size="large" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增设备
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
              <div class="stat-number">{{ statistics.total_devices }}</div>
              <div class="stat-label">设备总数</div>
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
              <div class="stat-percentage">{{ statistics.total_devices > 0 ? ((statistics.online_devices / statistics.total_devices) * 100).toFixed(1) : 0 }}%</div>
              <div class="stat-detail">离线设备: {{ (statistics.total_devices || 0) - (statistics.online_devices || 0) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ (statistics.low_water_devices || 0) + (statistics.expire_soon_devices || 0) + (statistics.filter_alert_devices || 0) }}</div>
              <div class="stat-label">预警设备</div>
              <div class="stat-detail">水量不足: {{ statistics.low_water_devices || 0 }} | 即将到期: {{ statistics.expire_soon_devices || 0 }} | 滤芯预警: {{ statistics.filter_alert_devices || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card billing">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.flow_billing_devices }}</div>
              <div class="stat-label">流量计费</div>
              <div class="stat-detail">包年计费: {{ statistics.annual_billing_devices }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-container">
      <div class="filter-main">
        <el-input
          v-model="listQuery.keyword"
          placeholder="搜索设备编号、IMEI、客户姓名、渠道商..."
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
          v-model="listQuery.billing_mode"
          placeholder="计费模式"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option label="流量计费" value="1" />
          <el-option label="包年计费" value="0" />
        </el-select>
        
        <el-select
          v-model="listQuery.device_type"
          placeholder="设备类型"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <el-button type="primary" @click="handleFilter">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        
        <el-button @click="showAdvancedFilter = !showAdvancedFilter">
          <el-icon><Filter /></el-icon>
          {{ showAdvancedFilter ? '收起筛选' : '高级筛选' }}
        </el-button>
        
        <el-button @click="resetFilter">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
      
      <!-- 快速筛选标签 -->
      <div class="quick-filters">
        <el-tag 
          :type="listQuery.low_water_alert ? 'danger' : 'info'" 
          :effect="listQuery.low_water_alert ? 'dark' : 'plain'"
          @click="toggleQuickFilter('low_water_alert')"
          class="quick-filter-tag"
        >
          <el-icon><Warning /></el-icon>
          低水量预警 ({{ statistics?.low_water_devices || 0 }})
        </el-tag>
        <el-tag 
          :type="listQuery.expire_alert ? 'warning' : 'info'" 
          :effect="listQuery.expire_alert ? 'dark' : 'plain'"
          @click="toggleQuickFilter('expire_alert')"
          class="quick-filter-tag"
        >
          <el-icon><Clock /></el-icon>
          即将到期 ({{ statistics?.expire_soon_devices || 0 }})
        </el-tag>
        <el-tag 
          :type="listQuery.network_status === '1' ? 'success' : 'info'" 
          :effect="listQuery.network_status === '1' ? 'dark' : 'plain'"
          @click="toggleNetworkFilter('1')"
          class="quick-filter-tag"
        >
          <el-icon><Connection /></el-icon>
          在线设备 ({{ statistics?.online_devices || 0 }})
        </el-tag>
        <el-tag 
          :type="listQuery.network_status === '0' ? 'danger' : 'info'" 
          :effect="listQuery.network_status === '0' ? 'dark' : 'plain'"
          @click="toggleNetworkFilter('0')"
          class="quick-filter-tag"
        >
          <el-icon><Close /></el-icon>
          离线设备 ({{ (statistics?.total_devices || 0) - (statistics?.online_devices || 0) }})
        </el-tag>
        <el-tag 
          :type="listQuery.filter_alert ? 'warning' : 'info'" 
          :effect="listQuery.filter_alert ? 'dark' : 'plain'"
          @click="toggleQuickFilter('filter_alert')"
          class="quick-filter-tag"
        >
          <el-icon><Setting /></el-icon>
          滤芯预警 ({{ statistics?.filter_alert_devices || 0 }})
        </el-tag>
      </div>
    </div>
    
    <!-- 高级筛选条件 -->
    <el-collapse-transition>
      <div v-show="showAdvancedFilter" class="advanced-filter-container">
        <el-card shadow="never">
          <div class="advanced-filter-content">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="filter-group">
                  <label class="filter-label">激活时间范围</label>
                  <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    @change="handleDateRangeChange"
                  />
                </div>
              </el-col>
              <el-col :span="8">
                <div class="filter-group">
                  <label class="filter-label">剩余水量范围 (L)</label>
                  <div class="range-input">
                    <el-input-number 
                      v-model="listQuery.water_min" 
                      placeholder="最小值" 
                      :min="0"
                      :precision="0"
                      style="width: 45%"
                    />
                    <span class="range-separator">-</span>
                    <el-input-number 
                      v-model="listQuery.water_max" 
                      placeholder="最大值" 
                      :min="0"
                      :precision="0"
                      style="width: 45%"
                    />
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="filter-group">
                  <label class="filter-label">地理位置筛选</label>
                  <el-button type="text" @click="showLocationFilter = !showLocationFilter">
                    <el-icon><Location /></el-icon>
                    {{ showLocationFilter ? '隐藏' : '显示' }}地图筛选
                  </el-button>
                </div>
              </el-col>
            </el-row>
            
            <div class="filter-actions">
              <el-button type="primary" @click="handleFilter">应用筛选</el-button>
              <el-button @click="resetFilter">重置筛选</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- 设备列表表格 -->
    <div class="table-container">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="正在加载设备数据..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        :row-class-name="getRowClassName"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" align="center" />
        
        <el-table-column label="设备信息" min-width="200" fixed="left">
          <template #default="scope">
            <div class="device-info">
              <div class="device-number">{{ scope.row.device_number }}</div>
              <div class="device-meta">
                <el-tag size="small" type="info">{{ scope.row.product_name || scope.row.device_type || '未知类型' }}</el-tag>
                <span class="imei">IMEI: {{ scope.row.imei || '未设置' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <div class="status-column">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status_text }}
              </el-tag>
              <el-tag 
                :type="scope.row.network_status === '1' ? 'success' : 'danger'" 
                size="small"
                style="margin-top: 4px;"
              >
                <el-icon>
                  <Connection v-if="scope.row.network_status === '1'" />
                  <Close v-else />
                </el-icon>
                {{ scope.row.network_status_text }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="客户信息" min-width="220">
          <template #default="scope">
            <div class="client-info">
              <div class="client-name">{{ scope.row.client_name || '未关联客户' }}</div>
              <div class="client-meta">
                <div v-if="scope.row.client_phone" class="meta-item">
                  📱 {{ scope.row.client_phone }}
                </div>
                <div v-if="scope.row.client_wx_nickname" class="meta-item">
                  💬 {{ scope.row.client_wx_nickname }}
                </div>
                <div v-if="scope.row.address" class="meta-item address-item">
                  <el-icon><Location /></el-icon>
                  {{ scope.row.address }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="渠道商信息" min-width="160">
          <template #default="scope">
            <div class="dealer-info">
              <div class="dealer-name">{{ scope.row.dealer_name || '未关联渠道商' }}</div>
              <div class="dealer-meta" v-if="scope.row.dealer_number">
                编号: {{ scope.row.dealer_number }}
              </div>
              <div class="sale-dealer" v-if="scope.row.sale_dealer_name">
                销售: {{ scope.row.sale_dealer_name }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="计费信息" width="140" align="center">
          <template #default="scope">
            <div class="billing-info">
              <el-tag :type="scope.row.billing_mode === '1' ? 'primary' : 'warning'" size="small">
                {{ scope.row.billing_mode_text }}
              </el-tag>
              <div class="billing-value">
                <span v-if="scope.row.billing_mode === '1'" class="water-amount">
                  {{ scope.row.surplus_flow || 0 }}L
                  <el-progress 
                    :percentage="scope.row.water_level_percentage" 
                    :status="scope.row.is_low_water ? 'exception' : 'success'"
                    :show-text="false"
                    :stroke-width="4"
                    style="margin-top: 4px;"
                  />
                </span>
                <span v-else class="days-amount">
                  {{ scope.row.remaining_days || 0 }}天
                  <el-progress 
                    :percentage="scope.row.days_percentage" 
                    :status="scope.row.is_expire_soon ? 'exception' : 'success'"
                    :show-text="false"
                    :stroke-width="4"
                    style="margin-top: 4px;"
                  />
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="水质数据" width="140" align="center">
          <template #default="scope">
            <div class="water-data">
              <div class="water-item">
                <span class="label">累计:</span>
                <span class="value">{{ scope.row.cumulative_filtration_flow || 0 }}L</span>
              </div>
              <div class="water-item" v-if="scope.row.tds_in || scope.row.raw_water_value">
                <span class="label">原水:</span>
                <span class="value">{{ scope.row.tds_in || scope.row.raw_water_value || '-' }}</span>
              </div>
              <div class="water-item" v-if="scope.row.tds_out || scope.row.purification_water_value">
                <span class="label">净水:</span>
                <span class="value">{{ scope.row.tds_out || scope.row.purification_water_value || '-' }}</span>
              </div>
              <div class="water-item" v-if="scope.row.water_quality_grade">
                <span class="label">水质:</span>
                <el-tag size="small" :type="getWaterQualityType(scope.row.water_quality_grade)">
                  {{ scope.row.water_quality_grade }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="时间信息" width="160">
          <template #default="scope">
            <div class="time-info">
              <div class="time-item">
                <span class="label">激活:</span>
                <span class="value">{{ formatDate(scope.row.activate_date) }}</span>
              </div>
              <div class="time-item" v-if="scope.row.service_end_time">
                <span class="label">到期:</span>
                <span class="value" :class="{ 'expire-soon': scope.row.is_expire_soon }">
                  {{ formatDate(scope.row.service_end_time) }}
                </span>
              </div>
              <div class="time-item" v-if="scope.row.filter_date">
                <span class="label">更新:</span>
                <span class="value">{{ formatDate(scope.row.filter_date) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="预警" width="80" align="center">
          <template #default="scope">
            <div class="alert-column">
              <el-tooltip content="水量不足预警" v-if="scope.row.is_low_water">
                <el-icon class="alert-icon low-water"><Warning /></el-icon>
              </el-tooltip>
              <el-tooltip content="即将到期预警" v-if="scope.row.is_expire_soon">
                <el-icon class="alert-icon expire-soon"><Clock /></el-icon>
              </el-tooltip>
              <el-tooltip content="滤芯预警" v-if="scope.row.has_filter_alert">
                <el-icon class="alert-icon filter-alert"><Setting /></el-icon>
              </el-tooltip>
              <span v-if="!scope.row.is_low_water && !scope.row.is_expire_soon && !scope.row.has_filter_alert" class="no-alert">正常</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="滤芯状态" width="140" align="center">
          <template #default="scope">
            <div class="filter-status-compact">
              <div class="filter-item-compact" v-if="scope.row.f1_flux_max > 0">
                <span class="filter-label-compact">PP:</span>
                <el-progress 
                  :percentage="scope.row.f1_life_percent" 
                  :color="getFilterColor(scope.row.f1_life_percent)"
                  :show-text="false"
                  :stroke-width="3"
                  style="width: 50px;"
                />
                <span class="filter-percent-compact">{{ scope.row.f1_life_percent.toFixed(0) }}%</span>
              </div>
              <div class="filter-item-compact" v-if="scope.row.f2_flux_max > 0">
                <span class="filter-label-compact">炭:</span>
                <el-progress 
                  :percentage="scope.row.f2_life_percent" 
                  :color="getFilterColor(scope.row.f2_life_percent)"
                  :show-text="false"
                  :stroke-width="3"
                  style="width: 50px;"
                />
                <span class="filter-percent-compact">{{ scope.row.f2_life_percent.toFixed(0) }}%</span>
              </div>
              <div class="filter-item-compact" v-if="scope.row.f3_flux_max > 0">
                <span class="filter-label-compact">RO:</span>
                <el-progress 
                  :percentage="scope.row.f3_life_percent" 
                  :color="getFilterColor(scope.row.f3_life_percent)"
                  :show-text="false"
                  :stroke-width="3"
                  style="width: 50px;"
                />
                <span class="filter-percent-compact">{{ scope.row.f3_life_percent.toFixed(0) }}%</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click.stop="handleView(scope.row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button type="warning" size="small" @click.stop="handleUpdate(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleAction(command, scope.row)" trigger="click">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="control" v-if="scope.row.is_online">
                      <el-icon><Setting /></el-icon>远程控制
                    </el-dropdown-item>
                    <el-dropdown-item command="logs">
                      <el-icon><Document /></el-icon>操作日志
                    </el-dropdown-item>
                    <el-dropdown-item command="bind" v-if="!scope.row.client_id">
                      <el-icon><Link /></el-icon>绑定客户
                    </el-dropdown-item>
                    <el-dropdown-item command="unbind" v-if="scope.row.client_id">
                      <el-icon><Unlock /></el-icon>解绑客户
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>删除设备
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
    
    <!-- 新增/编辑设备弹窗 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增设备' : '编辑设备'"
      v-model="dialogFormVisible"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="rules"
        label-position="top"
        class="device-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="form-section">
              <template #header>
                <span class="section-title">基本信息</span>
              </template>
              
              <el-form-item label="设备编号" prop="device_number">
                <el-input 
                  v-model="deviceForm.device_number" 
                  placeholder="请输入设备编号"
                  :disabled="dialogStatus === 'update'"
                >
                  <template #prefix>
                    <el-icon><Monitor /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="设备类型" prop="device_type">
                <el-select v-model="deviceForm.device_type" placeholder="请选择设备类型" style="width: 100%">
                  <el-option
                    v-for="item in typeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="IMEI号码" prop="imei">
                <el-input v-model="deviceForm.imei" placeholder="请输入IMEI号码" />
              </el-form-item>
              
              <el-form-item label="ICCID号码" prop="iccid">
                <el-input v-model="deviceForm.iccid" placeholder="请输入ICCID号码" />
              </el-form-item>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="never" class="form-section">
              <template #header>
                <span class="section-title">关联信息</span>
              </template>
              
              <el-form-item label="所属客户" prop="client_id">
                <el-select
                  v-model="deviceForm.client_id"
                  placeholder="请选择所属客户"
                  style="width: 100%"
                  filterable
                  remote
                  :remote-method="searchClients"
                  :loading="clientLoading"
                >
                  <el-option
                    v-for="item in clientOptions"
                    :key="item.id"
                    :label="`${item.name} (${item.phone || '无手机号'})`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="渠道商" prop="dealer_id">
                <el-select
                  v-model="deviceForm.dealer_id"
                  placeholder="请选择渠道商"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="item in dealerOptions"
                    :key="item.id"
                    :label="`${item.dealer_name} (${item.dealer_number || '无编号'})`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="销售渠道商" prop="dealer_id_sale">
                <el-select
                  v-model="deviceForm.dealer_id_sale"
                  placeholder="请选择销售渠道商"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="item in dealerOptions"
                    :key="item.id"
                    :label="`${item.dealer_name} (${item.dealer_number || '无编号'})`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="设备状态">
                <el-radio-group v-model="deviceForm.status">
                  <el-radio label="E">启用</el-radio>
                  <el-radio label="D">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="form-section">
              <template #header>
                <span class="section-title">计费设置</span>
              </template>
              
              <el-form-item label="计费模式">
                <el-radio-group v-model="deviceForm.billing_mode">
                  <el-radio label="1">流量计费</el-radio>
                  <el-radio label="0">包年计费</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item v-if="deviceForm.billing_mode === '1'" label="剩余水量(L)">
                <el-input-number 
                  v-model="deviceForm.surplus_flow" 
                  :min="0" 
                  :step="0.1" 
                  :precision="1"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item v-else label="剩余天数">
                <el-input-number 
                  v-model="deviceForm.remaining_days" 
                  :min="0" 
                  :step="1" 
                  :precision="0"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item v-if="deviceForm.billing_mode === '0'" label="服务到期时间">
                <el-date-picker 
                  v-model="deviceForm.service_end_time" 
                  type="datetime" 
                  placeholder="选择服务到期时间"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item label="押金金额">
                <el-input-number 
                  v-model="deviceForm.cash_pledge" 
                  :min="0" 
                  :step="100" 
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="never" class="form-section">
              <template #header>
                <span class="section-title">位置信息</span>
              </template>
              
              <el-form-item label="安装地址">
                <el-input 
                  v-model="deviceForm.address" 
                  placeholder="请输入设备安装地址"
                  type="textarea"
                  :rows="2"
                />
              </el-form-item>
              
              <el-form-item label="经纬度">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-input-number 
                      v-model="deviceForm.longitude" 
                      placeholder="经度"
                      :precision="6"
                      style="width: 100%"
                    />
                  </el-col>
                  <el-col :span="12">
                    <el-input-number 
                      v-model="deviceForm.latitude" 
                      placeholder="纬度"
                      :precision="6"
                      style="width: 100%"
                    />
                  </el-col>
                </el-row>
              </el-form-item>
              
              <el-form-item label="备注信息">
                <el-input
                  v-model="deviceForm.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-card>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            {{ dialogStatus === 'create' ? '创建设备' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 设备详情抽屉 -->
    <el-drawer
      v-model="detailDialogVisible"
      title="设备详情"
      size="85%"
      direction="rtl"
      :close-on-click-modal="false"
      destroy-on-close
      :append-to-body="true"
      class="device-detail-drawer"
    >
      <div v-if="currentDevice" class="device-detail">
        <!-- 设备概览 -->
        <div class="device-overview">
          <el-row :gutter="20">
            <el-col :span="16">
              <div class="device-header">
                <div class="device-title">
                  <h2>{{ currentDevice.device_number }}</h2>
                  <div class="device-badges">
                    <el-tag :type="getStatusType(currentDevice.status)" size="large">
                      {{ getStatusLabel(currentDevice) }}
                    </el-tag>
                    <el-tag 
                      :type="getNetworkStatusType(currentDevice.network_status)" 
                      size="large"
                    >
                      <el-icon>
                        <Connection v-if="currentDevice.network_status === '1'" />
                        <Close v-else />
                      </el-icon>
                      {{ getNetworkStatusLabel(currentDevice) }}
                    </el-tag>
                    <el-tag type="info" size="large">{{ getBillingModeLabel(currentDevice) }}</el-tag>
                    <el-tag :type="getBindStatusType(currentDevice)" size="large">
                      {{ getBindStatusText(currentDevice) }}
                    </el-tag>
                  </div>
                </div>
                <div class="device-meta">
                  <div class="meta-row">
                    <div class="meta-item">
                      <span class="meta-label">设备类型:</span>
                      <span class="meta-value">{{ currentDevice.device_type || '未知' }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">IMEI:</span>
                      <span class="meta-value">{{ currentDevice.imei || '未设置' }}</span>
                    </div>
                  </div>
                <div class="meta-row">
                  <div class="meta-item">
                    <span class="meta-label">ICCID:</span>
                    <span class="meta-value">{{ currentDevice.iccid || '未设置' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">激活时间:</span>
                    <span class="meta-value">{{ formatDateTime(currentDevice.activate_date) }}</span>
                  </div>
                </div>
              </div>

              <div class="overview-metrics">
                <div class="metric-card primary">
                  <div class="metric-label">{{ getQuotaLabel(currentDevice) }}</div>
                  <div class="metric-value">{{ getQuotaValue(currentDevice) }}</div>
                  <div class="metric-sub">{{ getQuotaSubText(currentDevice) }}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">累计制水</div>
                  <div class="metric-value">{{ getCumulativeWaterValue(currentDevice) }}</div>
                  <div class="metric-sub">水质等级：{{ currentDevice.water_quality_grade || '未知' }}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">押金与账期</div>
                  <div class="metric-value">{{ getCashValue(currentDevice) }}</div>
                  <div class="metric-sub">计费方式：{{ getBillingModeLabel(currentDevice) }}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">服务到期</div>
                  <div class="metric-value">{{ getServiceLifecycleText(currentDevice) }}</div>
                  <div class="metric-sub">{{ getServiceLifecycleSub(currentDevice) }}</div>
                </div>
              </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="device-actions">
                <el-button type="primary" @click="handleUpdate(currentDevice)">
                  <el-icon><Edit /></el-icon>
                  编辑设备
                </el-button>
                <el-button type="success" v-if="currentDevice.is_online" @click="handleControl(currentDevice)">
                  <el-icon><Setting /></el-icon>
                  远程控制
                </el-button>
                <el-button type="info" @click="handleLogs(currentDevice)">
                  <el-icon><Document /></el-icon>
                  操作日志
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 运行状态概览 -->
        <el-row :gutter="20" class="detail-cards">
          <el-col :span="8">
            <el-card class="status-card billing-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Money /></el-icon>
                  <span>计费信息</span>
                </div>
              </template>
              <div class="status-content">
                <div class="status-main">
                  <div class="status-value">
                    <span v-if="currentDevice.billing_mode === '1'" class="value-large">
                      {{ currentDevice.surplus_flow || 0 }}L
                    </span>
                    <span v-else class="value-large">
                      {{ currentDevice.remaining_days || 0 }}天
                    </span>
                  </div>
                  <div class="status-label">
                    {{ currentDevice.billing_mode === '1' ? '剩余流量' : '剩余天数' }}
                  </div>
                </div>
                <div class="status-progress">
                  <el-progress 
                    :percentage="currentDevice.billing_mode === '1' ? currentDevice.water_level_percentage : currentDevice.days_percentage" 
                    :status="(currentDevice.billing_mode === '1' ? currentDevice.is_low_water : currentDevice.is_expire_soon) ? 'exception' : 'success'"
                    :show-text="false"
                    :stroke-width="8"
                  />
                </div>
                <div class="status-extra" v-if="currentDevice.service_end_time">
                  <span class="extra-label">服务到期:</span>
                  <span class="extra-value">{{ formatDate(currentDevice.service_end_time) }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="status-card water-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Opportunity /></el-icon>
                  <span>水质数据</span>
                </div>
              </template>
              <div class="status-content">
                <div class="status-main">
                  <div class="status-value">
                    <span class="value-large">{{ currentDevice.cumulative_filtration_flow || 0 }}L</span>
                  </div>
                  <div class="status-label">累计制水量</div>
                </div>
                <div class="water-quality-grid">
                  <div class="quality-item" v-if="currentDevice.water_quality_grade">
                    <span class="quality-label">水质等级:</span>
                    <el-tag size="small" :type="getWaterQualityType(currentDevice.water_quality_grade)">
                      {{ currentDevice.water_quality_grade }}
                    </el-tag>
                  </div>
                  <div class="quality-item" v-if="currentDevice.tds_in || currentDevice.raw_water_value">
                    <span class="quality-label">原水TDS:</span>
                    <span class="quality-value">{{ currentDevice.tds_in || currentDevice.raw_water_value || '-' }}</span>
                  </div>
                  <div class="quality-item" v-if="currentDevice.tds_out || currentDevice.purification_water_value">
                    <span class="quality-label">净水TDS:</span>
                    <span class="quality-value">{{ currentDevice.tds_out || currentDevice.purification_water_value || '-' }}</span>
                  </div>
                  <div class="quality-item" v-if="(currentDevice.tds_in || currentDevice.raw_water_value) && (currentDevice.tds_out || currentDevice.purification_water_value)">
                    <span class="quality-label">净化率:</span>
                    <span class="quality-value">{{ calculatePurificationRate(currentDevice) }}%</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="status-card alert-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Warning /></el-icon>
                  <span>预警状态</span>
                </div>
              </template>
              <div class="status-content">
                <div class="alert-list">
                  <div class="alert-item" v-if="currentDevice.is_low_water">
                    <el-icon class="alert-icon low-water"><Warning /></el-icon>
                    <span class="alert-text">水量不足预警</span>
                  </div>
                  <div class="alert-item" v-if="currentDevice.is_expire_soon">
                    <el-icon class="alert-icon expire-soon"><Clock /></el-icon>
                    <span class="alert-text">即将到期预警</span>
                  </div>
                  <div class="alert-item" v-if="currentDevice.has_filter_alert">
                    <el-icon class="alert-icon filter-alert"><Setting /></el-icon>
                    <span class="alert-text">滤芯预警</span>
                  </div>
                  <div class="no-alert" v-if="!currentDevice.is_low_water && !currentDevice.is_expire_soon && !currentDevice.has_filter_alert">
                    <el-icon class="success-icon"><Check /></el-icon>
                    <span class="success-text">设备运行正常</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 详细信息卡片 -->
        <el-row :gutter="20" class="detail-cards">
          <!-- 客户信息 -->
          <el-col :span="8">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>客户信息</span>
                </div>
              </template>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">客户姓名:</span>
                  <span class="value">{{ currentDevice.client_name || '未关联' }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.client_phone">
                  <span class="label">联系电话:</span>
                  <span class="value">{{ currentDevice.client_phone }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.client_wx_nickname">
                  <span class="label">微信昵称:</span>
                  <span class="value">{{ currentDevice.client_wx_nickname }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.client_device_name">
                  <span class="label">设备名称:</span>
                  <span class="value">{{ currentDevice.client_device_name }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 渠道商信息 -->
          <el-col :span="8">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Shop /></el-icon>
                  <span>渠道商信息</span>
                </div>
              </template>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">渠道商:</span>
                  <span class="value">{{ currentDevice.dealer_name || '未关联' }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.dealer_number">
                  <span class="label">渠道商编号:</span>
                  <span class="value">{{ currentDevice.dealer_number }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.sale_dealer_name">
                  <span class="label">销售渠道商:</span>
                  <span class="value">{{ currentDevice.sale_dealer_name }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.cash_pledge">
                  <span class="label">押金:</span>
                  <span class="value">¥{{ currentDevice.cash_pledge }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 位置信息 -->
          <el-col :span="8">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>位置信息</span>
                </div>
              </template>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">安装地址:</span>
                  <span class="value">{{ currentDevice.address || '未设置' }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.longitude && currentDevice.latitude">
                  <span class="label">经纬度:</span>
                  <span class="value">{{ currentDevice.longitude }}, {{ currentDevice.latitude }}</span>
                </div>
                <div class="info-item" v-if="currentDevice.longitude && currentDevice.latitude">
                  <el-button type="text" @click="showMap(currentDevice)">
                    <el-icon><Location /></el-icon>
                    在地图中查看
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 运行参数与健康监控 -->
        <el-row :gutter="20" class="detail-cards">
          <el-col :span="16">
            <el-card class="detail-card info-table-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Connection /></el-icon>
                  <span>通信与运行参数</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-grid-item">
                  <span class="label">内部ID</span>
                  <span class="value">{{ currentDevice.id || '--' }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">产品型号</span>
                  <span class="value">{{ currentDevice.product_name || currentDevice.device_type || '--' }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">SIM / ICCID</span>
                  <span class="value">{{ currentDevice.iccid || '未设置' }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">绑定状态</span>
                  <el-tag :type="getBindStatusType(currentDevice)" size="small">
                    {{ getBindStatusText(currentDevice) }}
                  </el-tag>
                </div>
                <div class="info-grid-item">
                  <span class="label">激活日期</span>
                  <span class="value">{{ formatDateTime(currentDevice.activate_date) }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">服务到期</span>
                  <span class="value">{{ getServiceLifecycleText(currentDevice) }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">剩余天数</span>
                  <span class="value">{{ formatRemainingDays(currentDevice) }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">最近同步</span>
                  <span class="value">{{ getLastSyncText(currentDevice) }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">原水 TDS</span>
                  <span class="value">{{ currentDevice.tds_in || currentDevice.raw_water_value || '--' }}</span>
                </div>
                <div class="info-grid-item">
                  <span class="label">净水 TDS</span>
                  <span class="value">{{ currentDevice.tds_out || currentDevice.purification_water_value || '--' }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="detail-card health-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Warning /></el-icon>
                  <span>健康监控</span>
                </div>
              </template>
              <div class="health-chips">
                <div
                  v-for="item in buildHealthStatus(currentDevice)"
                  :key="item.label"
                  class="health-chip"
                  :class="item.type"
                >
                  <span class="chip-label">{{ item.label }}</span>
                  <span class="chip-value">{{ item.text }}</span>
                </div>
              </div>
              <div class="health-note">
                最近同步：{{ getLastSyncText(currentDevice) }}
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 滤芯信息 -->
        <el-row :gutter="20" class="detail-cards">
          <el-col :span="24">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Setting /></el-icon>
                  <span>滤芯状态</span>
                  <span class="update-time" v-if="currentDevice.filter_date">
                    更新: {{ formatDateTime(currentDevice.filter_date) }}
                  </span>
                </div>
              </template>
              <div class="filter-detail">
                <el-row :gutter="20">
                  <el-col :span="6" v-if="currentDevice.f1_flux_max > 0">
                    <div class="filter-card">
                      <div class="filter-name">PP棉滤芯</div>
                      <div class="filter-progress">
                        <el-progress 
                          type="circle" 
                          :percentage="currentDevice.f1_life_percent" 
                          :status="currentDevice.f1_life_percent <= 5 ? 'exception' : (currentDevice.f1_life_percent <= 20 ? 'warning' : 'success')"
                          :width="80"
                        />
                      </div>
                      <div class="filter-info">
                        <div class="filter-usage">{{ currentDevice.f1_flux || 0 }} / {{ currentDevice.f1_flux_max || 0 }}</div>
                        <div class="filter-status-text" :class="{ 'warning': currentDevice.f1_life_percent <= 5 }">
                          {{ currentDevice.f1_life_percent <= 5 ? '需要更换' : '正常' }}
                        </div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6" v-if="currentDevice.f2_flux_max > 0">
                    <div class="filter-card">
                      <div class="filter-name">活性炭滤芯</div>
                      <div class="filter-progress">
                        <el-progress 
                          type="circle" 
                          :percentage="currentDevice.f2_life_percent" 
                          :status="currentDevice.f2_life_percent <= 5 ? 'exception' : (currentDevice.f2_life_percent <= 20 ? 'warning' : 'success')"
                          :width="80"
                        />
                      </div>
                      <div class="filter-info">
                        <div class="filter-usage">{{ currentDevice.f2_flux || 0 }} / {{ currentDevice.f2_flux_max || 0 }}</div>
                        <div class="filter-status-text" :class="{ 'warning': currentDevice.f2_life_percent <= 5 }">
                          {{ currentDevice.f2_life_percent <= 5 ? '需要更换' : '正常' }}
                        </div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6" v-if="currentDevice.f3_flux_max > 0">
                    <div class="filter-card">
                      <div class="filter-name">RO反渗透滤芯</div>
                      <div class="filter-progress">
                        <el-progress 
                          type="circle" 
                          :percentage="currentDevice.f3_life_percent" 
                          :status="currentDevice.f3_life_percent <= 5 ? 'exception' : (currentDevice.f3_life_percent <= 20 ? 'warning' : 'success')"
                          :width="80"
                        />
                      </div>
                      <div class="filter-info">
                        <div class="filter-usage">{{ currentDevice.f3_flux || 0 }} / {{ currentDevice.f3_flux_max || 0 }}</div>
                        <div class="filter-status-text" :class="{ 'warning': currentDevice.f3_life_percent <= 5 }">
                          {{ currentDevice.f3_life_percent <= 5 ? '需要更换' : '正常' }}
                        </div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6" v-if="currentDevice.f4_flux_max > 0">
                    <div class="filter-card">
                      <div class="filter-name">第四级滤芯</div>
                      <div class="filter-progress">
                        <el-progress 
                          type="circle" 
                          :percentage="currentDevice.f4_life_percent" 
                          :status="currentDevice.f4_life_percent <= 5 ? 'exception' : (currentDevice.f4_life_percent <= 20 ? 'warning' : 'success')"
                          :width="80"
                        />
                      </div>
                      <div class="filter-info">
                        <div class="filter-usage">{{ currentDevice.f4_flux || 0 }} / {{ currentDevice.f4_flux_max || 0 }}</div>
                        <div class="filter-status-text" :class="{ 'warning': currentDevice.f4_life_percent <= 5 }">
                          {{ currentDevice.f4_life_percent <= 5 ? '需要更换' : '正常' }}
                        </div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 制水趋势 -->
        <el-row :gutter="20" class="detail-cards">
          <el-col :span="24">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Opportunity /></el-icon>
                  <span>近{{ trendDays }}天制水趋势</span>
                  <div class="trend-actions">
                    <el-radio-group v-model="trendDays" size="small" @change="handleTrendDaysChange">
                      <el-radio-button :label="7">7天</el-radio-button>
                      <el-radio-button :label="15">15天</el-radio-button>
                      <el-radio-button :label="30">30天</el-radio-button>
                    </el-radio-group>
                    <el-button size="small" type="primary" text @click="loadWaterTrend(currentDevice.id)">
                      <el-icon><Refresh /></el-icon>刷新
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="trend-chart-wrapper" v-loading="trendLoading">
                <div ref="waterTrendChart" class="trend-chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 最新操作日志 -->
        <el-row :gutter="20" class="detail-cards">
          <el-col :span="24">
            <el-card class="detail-card timeline-card" v-loading="recentLogsLoading">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>最新操作日志</span>
                  <div class="header-actions">
                    <el-button text type="primary" size="small" @click="handleLogs(currentDevice)">
                      查看全部
                    </el-button>
                  </div>
                </div>
              </template>
              <el-timeline v-if="recentLogs.length">
                <el-timeline-item
                  v-for="item in recentLogs"
                  :key="item.id || `${item.operation_type}-${item.created_at}`"
                  :timestamp="formatDateTime(item.created_at)"
                  :type="getTimelineType(item.operation_type)"
                  placement="top"
                >
                  <p class="timeline-title">{{ formatOperationType(item.operation_type) }}</p>
                  <p class="timeline-remark">{{ item.remark || '无备注' }}</p>
                  <p class="timeline-meta">操作人：{{ item.admin?.name || item.admin?.username || '-' }}</p>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无日志" />
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 备注信息 -->
        <el-row :gutter="20" class="detail-cards" v-if="currentDevice.remark">
          <el-col :span="24">
            <el-card class="detail-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>备注信息</span>
                </div>
              </template>
              <div class="remark-content">
                {{ currentDevice.remark }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-drawer>

    <!-- 远程控制 -->
    <el-dialog
      title="远程控制"
      v-model="controlDialogVisible"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="controlForm" label-width="100px">
        <el-form-item label="设备">
          <span>{{ controlTargetDevice ? controlTargetDevice.device_number : '--' }}</span>
        </el-form-item>
        <el-form-item label="控制命令" required>
          <el-select v-model="controlForm.command" placeholder="请选择控制命令">
            <el-option v-for="item in controlCommandOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数(JSON)">
          <el-input v-model="controlForm.params" type="textarea" :rows="4" placeholder='例如 {"duration":30}' />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="controlForm.remark" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="controlDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="controlLoading" @click="submitControl">发送命令</el-button>
      </template>
    </el-dialog>

    <!-- 绑定客户 -->
    <el-dialog
      title="绑定客户"
      v-model="bindDialogVisible"
      width="520px"
    >
      <el-form :model="bindForm" label-width="100px">
        <el-form-item label="设备">
          <span>{{ bindTargetDevice ? bindTargetDevice.device_number : '--' }}</span>
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select
            v-model="bindForm.client_id"
            filterable
            remote
            clearable
            placeholder="输入姓名/电话搜索"
            :remote-method="searchClients"
            :loading="clientLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in clientOptions"
              :key="item.id"
              :label="`${item.name || '未知'} (${item.phone || '无电话'})`"
              :value="item.id"
            >
              <div class="option-title">{{ item.name || '未知姓名' }}</div>
              <div class="option-desc">
                {{ item.phone || '无电话' }}
                <span v-if="item.address"> - {{ item.address }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="bindForm.remark" type="textarea" :rows="2" placeholder="可选备注" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="bindForm.force">强制覆盖已有绑定</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bindLoading" @click="submitBind">确认绑定</el-button>
      </template>
    </el-dialog>

    <!-- 操作日志 -->
    <el-drawer
      v-model="logsDrawerVisible"
      :with-header="true"
      :title="logTargetDevice ? `设备日志 - ${logTargetDevice.device_number}` : '设备日志'"
      size="40%"
    >
      <div class="log-filters">
        <el-select v-model="logFilters.operation_type" placeholder="操作类型" clearable style="width: 150px" @change="handleLogFilter">
          <el-option v-for="item in operationOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker
          v-model="logFilters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleLogFilter"
        />
        <el-button type="primary" @click="handleLogFilter">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <el-table :data="logsList" v-loading="logsLoading" style="width: 100%">
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="scope">{{ formatDateTime(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="operation_type" label="操作">
          <template #default="scope">{{ formatOperationType(scope.row.operation_type) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160">
          <template #default="scope">{{ scope.row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column prop="admin_id" label="操作人" width="140">
          <template #default="scope">
            {{ scope.row.admin?.name || scope.row.admin?.username || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <div class="drawer-pagination">
        <el-pagination
          v-model:current-page="logPagination.page"
          v-model:page-size="logPagination.limit"
          layout="total, sizes, prev, pager, next"
          :total="logPagination.total"
          @size-change="handleLogSizeChange"
          @current-change="handleLogPageChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import { 
  Monitor, Plus, Search, Filter, Refresh, Warning, Clock, Connection, Close, 
  View, Edit, Setting, Document, Link, Unlock, Delete, ArrowDown, User, 
  Shop, Location, Money, Opportunity, Check 
} from '@element-plus/icons-vue';
import {
  getDeviceList,
  getDeviceDetail,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceClients,
  getDealers,
  bindDeviceUser,
  unbindDeviceUser,
  controlDevice,
  getDeviceLogs,
  getDeviceWaterTrend
} from '@/api/device';
import DeviceDetail from './Detail.vue';

export default {
  name: 'DeviceList',
  components: {
    Monitor, Plus, Search, Filter, Refresh, Warning, Clock, Connection, Close,
    View, Edit, Setting, Document, Link, Unlock, Delete, ArrowDown, User,
    Shop, Location, Money, Opportunity, Check,
    DeviceDetail
  },
  setup() {
    const listLoading = ref(true);
    const list = ref([]);
    const total = ref(0);
    const statistics = ref(null);
    const deviceFormRef = ref(null);
    const showAdvancedFilter = ref(false);
    const showLocationFilter = ref(false);
    const dateRange = ref([]);
    const submitLoading = ref(false);
    const clientLoading = ref(false);
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      keyword: '',
      status: undefined,
      device_type: undefined,
      client_id: undefined,
      dealer_id: undefined,
      dealer_id_sale: undefined,
      network_status: undefined,
      billing_mode: undefined,
      activate_start: '',
      activate_end: '',
      water_min: undefined,
      water_max: undefined,
      low_water_alert: undefined,
      expire_alert: undefined,
      filter_alert: undefined,
      longitude_min: undefined,
      longitude_max: undefined,
      latitude_min: undefined,
      latitude_max: undefined
    });
    
    const statusOptions = [
      { label: '启用', value: 'E' },
      { label: '禁用', value: 'D' }
    ];
    
    const typeOptions = [
      { label: '标准型', value: '标准型' },
      { label: '高级型', value: '高级型' },
      { label: '豪华型', value: '豪华型' },
      { label: '商用型', value: '商用型' },
      { label: '家用型', value: '家用型' }
    ];
    
    const clientOptions = ref([]);
    const dealerOptions = ref([]);
    const dialogFormVisible = ref(false);
    const detailDialogVisible = ref(false);
    const dialogStatus = ref('');
    const currentDevice = ref(null);
    
    const deviceForm = reactive({
      id: undefined,
      device_number: '',
      device_type: '',
      imei: '',
      iccid: '',
      client_id: undefined,
      dealer_id: undefined,
      dealer_id_sale: undefined,
      status: 'E',
      billing_mode: '1',
      surplus_flow: 0,
      remaining_days: 0,
      service_end_time: '',
      address: '',
      longitude: undefined,
      latitude: undefined,
      cash_pledge: 0,
      remark: ''
    });
    
    const rules = {
      device_number: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
      device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
      imei: [{ required: true, message: '请输入IMEI号码', trigger: 'blur' }],
      iccid: [{ required: true, message: '请输入ICCID号码', trigger: 'blur' }]
    };
    
    const waterTrendChart = ref(null);
    const trendLoading = ref(false);
    const trendDays = ref(7);
    let chartInstance = null;
    let resizeHandler = null;
    
    const controlDialogVisible = ref(false);
    const controlTargetDevice = ref(null);
    const controlForm = reactive({
      command: '',
      params: '',
      remark: ''
    });
    const controlLoading = ref(false);
    const controlCommandOptions = [
      { label: '远程冲洗', value: 'flush' },
      { label: '恢复出水', value: 'resume' },
      { label: '暂停出水', value: 'pause' },
      { label: '重启设备', value: 'reboot' },
      { label: '重置滤芯', value: 'reset_filter' }
    ];
    
    const bindDialogVisible = ref(false);
    const bindTargetDevice = ref(null);
    const bindForm = reactive({
      client_id: undefined,
      remark: '',
      force: false
    });
    const bindLoading = ref(false);
    
    const logsDrawerVisible = ref(false);
    const logTargetDevice = ref(null);
    const logsList = ref([]);
    const logsLoading = ref(false);
    const recentLogs = ref([]);
    const recentLogsLoading = ref(false);
    const logPagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    const logFilters = reactive({
      operation_type: '',
      dateRange: []
    });
    const operationOptions = [
      { label: '远程控制', value: '远程控制' },
      { label: '绑定客户', value: 'bind' },
      { label: '解绑客户', value: 'unbind' },
      { label: '状态调整', value: 'status' }
    ];
    const operationTypeMap = {
      '远程控制': '远程控制',
      bind: '绑定客户',
      unbind: '解绑客户',
      status: '状态调整'
    };
    
    // 初始化图表
    const initChart = () => {
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
      
      nextTick(() => {
        if (!waterTrendChart.value) return;
        
        chartInstance = echarts.init(waterTrendChart.value);
        chartInstance.setOption({
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              const data = params[0];
              return `${data.name}<br/>${data.value} 升`;
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: []
          },
          yAxis: {
            type: 'value',
            name: '制水量(升)',
            axisLabel: {
              formatter: '{value} L'
            }
          },
          series: [{
            name: '制水量',
            type: 'line',
            smooth: true,
            data: [],
            areaStyle: {
              opacity: 0.3
            },
            itemStyle: {
              color: '#409EFF'
            }
          }]
        });
        
        if (typeof window !== 'undefined') {
          if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
          }
          resizeHandler = () => {
            chartInstance && chartInstance.resize();
          };
          window.addEventListener('resize', resizeHandler);
        }
      });
    };
    
    // 更新图表数据
    const updateChartData = (data = []) => {
      if (!chartInstance) return;
      
      const safeData = Array.isArray(data) ? data : [];
      const dates = safeData.map(item => item.date);
      const values = safeData.map(item => item.value);
      
      chartInstance.setOption({
        xAxis: {
          data: dates
        },
        series: [{
          data: values
        }]
      });
    };

    const loadWaterTrend = async (deviceId) => {
      if (!deviceId) return;
      trendLoading.value = true;
      try {
        const res = await getDeviceWaterTrend(deviceId, { days: trendDays.value });
        if (res.code === 200 || res.code === 0) {
          const dates = res.data?.dates || [];
          const usages = res.data?.usages || [];
          const dataset = dates.map((date, index) => ({
            date,
            value: Number(usages[index] ?? 0)
          }));
          updateChartData(dataset);
        } else {
          throw new Error(res.message || '获取制水趋势失败');
        }
      } catch (error) {
        console.error('获取制水趋势失败:', error);
        ElMessage.error(error.message || '获取制水趋势失败');
        updateChartData([]);
      } finally {
        trendLoading.value = false;
      }
    };
    
    const handleTrendDaysChange = () => {
      if (!currentDevice.value) return;
      loadWaterTrend(currentDevice.value.id);
    };
    
    // 获取设备列表
    const fetchList = async () => {
      listLoading.value = true;
      try {
        // 转换参数格式，将limit改为per_page
        const apiParams = {
          ...listQuery,
          per_page: listQuery.limit
        };
        delete apiParams.limit;
        

        const res = await getDeviceList(apiParams);
        
        if (res.code === 200 || res.code === 0) {
          if (res.data && res.data.data) {
            list.value = res.data.data;
            total.value = parseInt(res.data.total) || 0;
            statistics.value = res.data.statistics || null;
    
          } else if (res.data && Array.isArray(res.data.data)) {
            list.value = res.data.data;
            total.value = parseInt(res.data.total) || res.data.data.length;
            statistics.value = res.data.statistics || null;
          } else if (res.data && Array.isArray(res.data)) {
            list.value = res.data;
            total.value = parseInt(res.total) || res.data.length;
          } else {
            list.value = [];
            total.value = 0;
          }
        } else {
          ElMessage.error(res.message || '获取设备列表失败');
          list.value = [];
          total.value = 0;
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        ElMessage.error('获取设备列表失败: ' + error.message);
        list.value = [];
        total.value = 0;
      } finally {
        listLoading.value = false;
      }
    };
    
    // 搜索筛选
    const handleFilter = () => {
      listQuery.page = 1;
      fetchList();
    };
    
    // 重置筛选
    const resetFilter = () => {
      Object.assign(listQuery, {
        page: 1,
        limit: 10,
        keyword: '',
        status: undefined,
        device_type: undefined,
        client_id: undefined,
        dealer_id: undefined,
        dealer_id_sale: undefined,
        network_status: undefined,
        billing_mode: undefined,
        activate_start: '',
        activate_end: '',
        water_min: undefined,
        water_max: undefined,
        low_water_alert: undefined,
        expire_alert: undefined,
        filter_alert: undefined,
        longitude_min: undefined,
        longitude_max: undefined,
        latitude_min: undefined,
        latitude_max: undefined
      });
      dateRange.value = [];
      showAdvancedFilter.value = false;
      fetchList();
    };
    
    // 快速筛选切换
    const toggleQuickFilter = (filterType) => {
      if (filterType === 'low_water_alert') {
        listQuery.low_water_alert = listQuery.low_water_alert === '1' ? undefined : '1';
      } else if (filterType === 'expire_alert') {
        listQuery.expire_alert = listQuery.expire_alert === '1' ? undefined : '1';
      } else if (filterType === 'filter_alert') {
        listQuery.filter_alert = listQuery.filter_alert === '1' ? undefined : '1';
      }
      handleFilter();
    };
    
    // 网络状态筛选切换
    const toggleNetworkFilter = (status) => {
      listQuery.network_status = listQuery.network_status === status ? undefined : status;
      handleFilter();
    };
    
    // 日期范围变化
    const handleDateRangeChange = (dates) => {
      if (dates && dates.length === 2) {
        listQuery.activate_start = dates[0];
        listQuery.activate_end = dates[1];
      } else {
        listQuery.activate_start = '';
        listQuery.activate_end = '';
      }
    };
    
    // 分页变化
    const handleSizeChange = (val) => {
      listQuery.limit = val;
      fetchList();
    };
    
    const handleCurrentChange = (val) => {
      listQuery.page = val;
      fetchList();
    };
    
    // 行点击
    const handleRowClick = (row) => {
      handleView(row);
    };
    
    // 行样式
    const getRowClassName = ({ row }) => {
      let className = '';
      if (row.is_low_water) className += 'low-water-row ';
      if (row.is_expire_soon) className += 'expire-soon-row ';
      if (row.network_status === '0') className += 'offline-row ';
      return className.trim();
    };
    
    // 状态类型
    const getStatusType = (status) => {
      const statusMap = {
        'E': 'success',
        'D': 'danger',
        'maintenance': 'warning'
      };
      return statusMap[status] || 'info';
    };
    
    // 网络状态类型
    const getNetworkStatusType = (status) => {
      return status === '1' ? 'success' : 'danger';
    };
    
    // 水质等级类型
    const getWaterQualityType = (grade) => {
      if (grade === '优') return 'success';
      if (grade === '良') return 'warning';
      if (grade === '差') return 'danger';
      return 'info';
    };
    
    // 格式化日期（只显示日期）
    const formatDate = (dateString) => {
      if (!dateString || dateString === '0000-00-00 00:00:00') return '未设置';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
      } catch (e) {
        return dateString;
      }
    };
    
    // 格式化日期时间
    const formatDateTime = (dateStr) => {
      if (!dateStr || dateStr === '0000-00-00 00:00:00') return '-';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN');
    };

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || amount === '') return '--';
      const num = Number(amount);
      if (Number.isNaN(num)) return '--';
      return '¥' + num.toFixed(2);
    };

    const getStatusLabel = (device) => {
      if (!device) return '--';
      if (device.status_text) return device.status_text;
      const map = { E: '启用', D: '禁用', maintenance: '维护中', online: '在线', offline: '离线' };
      return map[device.status] || '未知';
    };

    const getNetworkStatusLabel = (device) => {
      if (!device) return '--';
      if (device.network_status_text) return device.network_status_text;
      return device.network_status === '1' ? '在线' : '离线';
    };

    const getBillingModeLabel = (device) => {
      if (!device) return '--';
      if (device.billing_mode_text) return device.billing_mode_text;
      return device.billing_mode === '1' ? '流量计费' : '包年计费';
    };

    const getQuotaLabel = (device) => {
      return device?.billing_mode === '1' ? '剩余流量' : '剩余天数';
    };

    const getQuotaValue = (device) => {
      if (!device) return '--';
      if (device.billing_mode === '1') {
        const flow = Number(device.surplus_flow ?? 0);
        return Number.isNaN(flow) ? '--' : `${flow.toFixed(0)} L`;
      }
      const days = Number(device.remaining_days ?? 0);
      return Number.isNaN(days) ? '--' : `${days} 天`;
    };

    const getQuotaSubText = (device) => {
      if (!device) return '计费信息缺失';
      return device.billing_mode === '1' ? '按流量计费（升）' : '按服务天数计费';
    };

    const getCumulativeWaterValue = (device) => {
      if (!device) return '--';
      const total = Number(device.cumulative_filtration_flow ?? device.total_purify ?? device.total_flow ?? 0);
      if (!Number.isFinite(total) || total <= 0) return '--';
      if (total >= 1000) {
        return `${(total / 1000).toFixed(1)} m³`;
      }
      return `${total.toFixed(0)} L`;
    };

    const getCashValue = (device) => formatCurrency(device?.cash_pledge);

    const getServiceLifecycleText = (device) => {
      if (!device) return '--';
      if (!device.service_end_time || device.service_end_time === '0000-00-00 00:00:00') {
        return '未配置';
      }
      return formatDate(device.service_end_time);
    };

    const getServiceLifecycleSub = (device) => {
      if (!device) return '无法获取服务信息';
      if (!device.service_end_time || device.service_end_time === '0000-00-00 00:00:00') {
        return '请设置服务到期时间';
      }
      const days = Number(device.remaining_days ?? 0);
      if (Number.isNaN(days)) return '剩余天数未知';
      if (days <= 0) return '已过期，需尽快续费';
      if (days <= 7) return '7天内即将到期';
      return `剩余 ${days} 天`;
    };

    const getBindStatusText = (device) => {
      if (!device) return '--';
      if (device.bind_status_text) return device.bind_status_text;
      return device.bind_status === '1' ? '已绑定' : '未绑定';
    };

    const getBindStatusType = (device) => {
      if (!device) return 'info';
      return device.bind_status === '1' ? 'success' : 'warning';
    };

    const getLastSyncText = (device) => {
      if (!device) return '--';
      const reference = device.update_date || device.create_date;
      return formatDateTime(reference);
    };

    const formatRemainingDays = (device) => {
      if (!device) return '--';
      const days = Number(device.remaining_days ?? 0);
      if (Number.isNaN(days)) return '--';
      if (days <= 0) return '已到期';
      return `${days} 天`;
    };

    const buildHealthStatus = (device) => {
      if (!device) return [];
      const statuses = [
        { label: '绑定', text: getBindStatusText(device), type: getBindStatusType(device) },
        { label: '网络', text: getNetworkStatusLabel(device), type: getNetworkStatusType(device.network_status) },
        { label: '水量', text: device.is_low_water ? '水量不足' : '正常', type: device.is_low_water ? 'danger' : 'success' },
        { label: '服务', text: formatRemainingDays(device), type: Number(device.remaining_days ?? 0) <= 0 ? 'warning' : 'info' },
        { label: '滤芯', text: device.has_filter_alert ? '需要更换' : '正常', type: device.has_filter_alert ? 'warning' : 'success' }
      ];
      return statuses;
    };

    const getTimelineType = (operation) => {
      if (!operation) return 'info';
      if (operation === '远程控制' || operation === 'control') return 'primary';
      if (operation === 'bind') return 'success';
      if (operation === 'unbind') return 'warning';
      if (operation.toLowerCase && operation.toLowerCase().includes('删')) return 'danger';
      return 'info';
    };
    
    const formatOperationType = (type) => {
      if (!type) return '-';
      return operationTypeMap[type] || type;
    };
    
    // 新增设备
    const handleCreate = () => {
      resetDeviceForm();
      dialogStatus.value = 'create';
      dialogFormVisible.value = true;
      loadDealers();
    };
    
    // 编辑设备
    const handleUpdate = async (row) => {
      try {
        const res = await getDeviceDetail(row.id);
        if (res.code === 200 || res.code === 0) {
          const device = res.data;
          deviceForm.id = device.id;
          deviceForm.device_number = device.device_number;
          deviceForm.device_type = device.device_type;
          deviceForm.imei = device.imei || '';
          deviceForm.iccid = device.iccid || '';
          deviceForm.client_id = device.client_id;
          deviceForm.dealer_id = device.dealer_id;
          deviceForm.dealer_id_sale = device.dealer_id_sale;
          deviceForm.status = device.status;
          deviceForm.billing_mode = device.billing_mode;
          deviceForm.surplus_flow = device.surplus_flow || 0;
          deviceForm.remaining_days = device.remaining_days || 0;
          deviceForm.service_end_time = device.service_end_time || '';
          deviceForm.address = device.address || '';
          deviceForm.longitude = device.longitude;
          deviceForm.latitude = device.latitude;
          deviceForm.cash_pledge = device.cash_pledge || 0;
          deviceForm.remark = device.remark || '';
          
          dialogStatus.value = 'update';
          dialogFormVisible.value = true;
          loadDealers();
        } else {
          ElMessage.error(res.message || '获取设备详情失败');
        }
      } catch (error) {
        console.error('获取设备详情失败:', error);
        ElMessage.error('获取设备详情失败');
      }
    };
    
    // 查看详情
    const handleView = async (row) => {
      let deviceData = row;
      try {
        const res = await getDeviceDetail(row.id);
        if (res.code === 200 || res.code === 0) {
          deviceData = res.data || row;
        }
      } catch (error) {
        console.error('获取设备详情失败:', error);
      }
      
      currentDevice.value = deviceData;
      detailDialogVisible.value = true;
      trendDays.value = 7;
      
      nextTick(() => {
        initChart();
        if (currentDevice.value?.id) {
          loadWaterTrend(currentDevice.value.id);
          loadRecentLogs(currentDevice.value.id);
        }
      });
    };
    
    // 提交表单
    const submitForm = async () => {
      if (!deviceFormRef.value) return;
      
      try {
        await deviceFormRef.value.validate();
        submitLoading.value = true;
        
        let res;
        if (dialogStatus.value === 'create') {
          res = await createDevice(deviceForm);
        } else {
          res = await updateDevice(deviceForm.id, deviceForm);
        }
        
        if (res.code === 200 || res.code === 0) {
          ElMessage.success(dialogStatus.value === 'create' ? '设备创建成功' : '设备更新成功');
          dialogFormVisible.value = false;
          fetchList();
        } else {
          ElMessage.error(res.message || '操作失败');
        }
      } catch (error) {
        console.error('提交表单失败:', error);
        if (error.message) {
          ElMessage.error(error.message);
        }
      } finally {
        submitLoading.value = false;
      }
    };
    
    // 重置表单
    const resetDeviceForm = () => {
      Object.assign(deviceForm, {
        id: undefined,
        device_number: '',
        device_type: '',
        imei: '',
        iccid: '',
        client_id: undefined,
        dealer_id: undefined,
        dealer_id_sale: undefined,
        status: 'E',
        billing_mode: '1',
        surplus_flow: 0,
        remaining_days: 0,
        service_end_time: '',
        address: '',
        longitude: undefined,
        latitude: undefined,
        cash_pledge: 0,
        remark: ''
      });
    };
    
    // 操作处理
    const handleAction = async (command, row) => {
      switch (command) {
        case 'control':
          handleControl(row);
          break;
        case 'logs':
          handleLogs(row);
          break;
        case 'bind':
          handleBindClient(row);
          break;
        case 'unbind':
          handleUnbindClient(row);
          break;
        case 'delete':
          handleDelete(row);
          break;
      }
    };
    
    const resetControlForm = () => {
      controlForm.command = controlCommandOptions[0]?.value || '';
      controlForm.params = '';
      controlForm.remark = '';
    };
    
    // 远程控制
    const handleControl = (row) => {
      if (!row?.id) {
        ElMessage.error('请选择要控制的设备');
        return;
      }
      controlTargetDevice.value = row;
      controlDialogVisible.value = true;
      resetControlForm();
    };
    
    const submitControl = async () => {
      if (!controlTargetDevice.value?.id) {
        ElMessage.error('未找到设备信息');
        return;
      }
      if (!controlForm.command) {
        ElMessage.warning('请选择控制命令');
        return;
      }
      
      let paramsPayload = null;
      if (controlForm.params) {
        try {
          paramsPayload = JSON.parse(controlForm.params);
          if (paramsPayload === null || typeof paramsPayload !== 'object' || Array.isArray(paramsPayload)) {
            throw new Error('参数必须是JSON对象');
          }
        } catch (error) {
          ElMessage.error('参数必须是合法的JSON对象');
          return;
        }
      }
      
      controlLoading.value = true;
      try {
        const res = await controlDevice(controlTargetDevice.value.id, {
          command: controlForm.command,
          params: paramsPayload,
          remark: controlForm.remark
        });
        if (res.code === 200 || res.code === 0) {
          ElMessage.success(res.message || '控制命令发送成功');
          controlDialogVisible.value = false;
          if (logsDrawerVisible.value && logTargetDevice.value?.id === controlTargetDevice.value.id) {
            fetchLogs();
          }
        } else {
          throw new Error(res.message || '控制命令发送失败');
        }
      } catch (error) {
        console.error('控制设备失败:', error);
        ElMessage.error(error.message || '控制命令发送失败');
      } finally {
        controlLoading.value = false;
      }
    };
    
    // 操作日志
    const handleLogs = (row) => {
      if (!row?.id) return;
      logTargetDevice.value = row;
      logsDrawerVisible.value = true;
      logPagination.page = 1;
      logFilters.operation_type = '';
      logFilters.dateRange = [];
      fetchLogs();
    };
    
    const fetchLogs = async () => {
      if (!logTargetDevice.value?.id) return;
      logsLoading.value = true;
      try {
        const params = {
          page: logPagination.page,
          per_page: logPagination.limit
        };
        if (logFilters.operation_type) {
          params.operation_type = logFilters.operation_type;
        }
        if (Array.isArray(logFilters.dateRange) && logFilters.dateRange.length === 2) {
          params.start_time = logFilters.dateRange[0];
          params.end_time = logFilters.dateRange[1];
        }
        
        const res = await getDeviceLogs(logTargetDevice.value.id, params);
        if (res.code === 200 || res.code === 0) {
          const items = res.data?.items || res.data?.data || [];
          logsList.value = items;
          logPagination.total = Number(res.total ?? res.data?.total ?? items.length) || 0;
          logPagination.page = Number(res.current_page ?? logPagination.page) || logPagination.page;
        } else {
          throw new Error(res.message || '获取日志失败');
        }
      } catch (error) {
        console.error('获取设备日志失败:', error);
        ElMessage.error(error.message || '获取日志失败');
        logsList.value = [];
        logPagination.total = 0;
      } finally {
        logsLoading.value = false;
      }
    };

    const loadRecentLogs = async (deviceId) => {
      if (!deviceId) return;
      recentLogs.value = [];
      recentLogsLoading.value = true;
      try {
        const res = await getDeviceLogs(deviceId, { per_page: 5 });
        if (res.code === 200 || res.code === 0) {
          recentLogs.value = res.data?.items || res.data?.data || [];
        } else {
          recentLogs.value = [];
        }
      } catch (error) {
        console.error('获取最新日志失败:', error);
        recentLogs.value = [];
      } finally {
        recentLogsLoading.value = false;
      }
    };
    
    const handleLogFilter = () => {
      logPagination.page = 1;
      fetchLogs();
    };
    
    const handleLogSizeChange = (value) => {
      logPagination.limit = value;
      logPagination.page = 1;
      fetchLogs();
    };
    
    const handleLogPageChange = (value) => {
      logPagination.page = value;
      fetchLogs();
    };
    
    // 绑定客户
    const handleBindClient = (row) => {
      if (!row?.id) return;
      bindTargetDevice.value = row;
      bindDialogVisible.value = true;
      bindForm.client_id = row.client_id || undefined;
      bindForm.remark = '';
      bindForm.force = false;
    };
    
    const submitBind = async () => {
      if (!bindTargetDevice.value?.id) {
        ElMessage.error('未选择设备');
        return;
      }
      if (!bindForm.client_id) {
        ElMessage.warning('请选择要绑定的客户');
        return;
      }
      bindLoading.value = true;
      try {
        const res = await bindDeviceUser(bindTargetDevice.value.id, {
          client_id: bindForm.client_id,
          remark: bindForm.remark,
          force: bindForm.force
        });
        if (res.code === 200 || res.code === 0) {
          ElMessage.success(res.message || '绑定成功');
          bindDialogVisible.value = false;
          fetchList();
        } else {
          throw new Error(res.message || '绑定失败');
        }
      } catch (error) {
        console.error('绑定客户失败:', error);
        ElMessage.error(error.message || '绑定失败');
      } finally {
        bindLoading.value = false;
      }
    };
    
    // 解绑客户
    const handleUnbindClient = async (row) => {
      if (!row?.id) return;
      try {
        await ElMessageBox.confirm('确定要解绑该设备的客户吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        const res = await unbindDeviceUser(row.id, { remark: 'admin unbind' });
        if (res.code === 200 || res.code === 0) {
          ElMessage.success(res.message || '解绑成功');
          fetchList();
        } else {
          throw new Error(res.message || '解绑失败');
        }
      } catch (error) {
        if (error === 'cancel' || error === 'close') {
          return;
        }
        console.error('解绑客户失败:', error);
        ElMessage.error(error.message || '解绑失败');
      }
    };
    
    // 删除设备
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除该设备吗？删除后无法恢复！', '危险操作', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'error'
        });
        
        const res = await deleteDevice(row.id);
        if (res.code === 200 || res.code === 0) {
          ElMessage.success('设备删除成功');
          fetchList();
        } else {
          ElMessage.error(res.message || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除设备失败:', error);
          ElMessage.error('删除设备失败');
        }
      }
    };
    
    // 显示地图
    const showMap = (device) => {
      ElMessage.info('地图功能开发中...');
    };
    
    // 搜索客户
    const searchClients = async (query) => {
      if (!query) {
        clientOptions.value = [];
        return;
      }
      
      clientLoading.value = true;
      try {
        const res = await getDeviceClients({ keyword: query });
        if (res.code === 200 || res.code === 0) {
          clientOptions.value = res.data || [];
        }
      } catch (error) {
        console.error('搜索客户失败:', error);
      } finally {
        clientLoading.value = false;
      }
    };
    
    // 加载渠道商
    const loadDealers = async () => {
      try {
        const res = await getDealers();
        if (res.code === 200 || res.code === 0) {
          dealerOptions.value = res.data || [];
        }
      } catch (error) {
        console.error('加载渠道商失败:', error);
      }
    };
    
    // 获取滤芯颜色
    const getFilterColor = (percentage) => {
      if (percentage <= 5) {
        return '#f56c6c'; // 红色：剩余5%以下
      } else if (percentage <= 20) {
        return '#e6a23c'; // 橙色：剩余5%-20%
      } else {
        return '#67c23a'; // 绿色：剩余20%-100%
      }
    };
    
    // 计算净化率
    const calculatePurificationRate = (device) => {
      const rawTds = device.tds_in || device.raw_water_value;
      const pureTds = device.tds_out || device.purification_water_value;
      
      if (!rawTds || !pureTds || rawTds <= 0) {
        return 0;
      }
      
      const rate = ((rawTds - pureTds) / rawTds * 100);
      return Math.max(0, Math.min(100, rate)).toFixed(1);
    };
    
    // 初始化
    onMounted(() => {
      fetchList();
      loadDealers();
    });
    
    onBeforeUnmount(() => {
      if (typeof window !== 'undefined' && resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
    });
    
    return {
      // 数据
      listLoading,
      list,
      total,
      statistics,
      listQuery,
      showAdvancedFilter,
      showLocationFilter,
      dateRange,
      submitLoading,
      clientLoading,
      trendDays,
      trendLoading,
      waterTrendChart,
      logsList,
      logsLoading,
      logFilters,
      logPagination,
      controlLoading,
      bindLoading,
      recentLogs,
      recentLogsLoading,
      
      // 选项
      statusOptions,
      typeOptions,
      clientOptions,
      dealerOptions,
      controlCommandOptions,
      operationOptions,
      
      // 弹窗
      dialogFormVisible,
      detailDialogVisible,
      dialogStatus,
      currentDevice,
      controlDialogVisible,
      bindDialogVisible,
      logsDrawerVisible,
      controlTargetDevice,
      bindTargetDevice,
      logTargetDevice,
      
      // 表单
      deviceFormRef,
      deviceForm,
      rules,
      controlForm,
      bindForm,
      
      // 方法
      fetchList,
      handleFilter,
      resetFilter,
      toggleQuickFilter,
      toggleNetworkFilter,
      handleDateRangeChange,
      handleSizeChange,
      handleCurrentChange,
      handleRowClick,
      getRowClassName,
      getStatusType,
      getNetworkStatusType,
      getWaterQualityType,
      formatDate,
      formatDateTime,
      getStatusLabel,
      getNetworkStatusLabel,
      getBillingModeLabel,
      getQuotaLabel,
      getQuotaValue,
      getQuotaSubText,
      getCumulativeWaterValue,
      getCashValue,
      getServiceLifecycleText,
      getServiceLifecycleSub,
      getBindStatusText,
      getBindStatusType,
      getLastSyncText,
      formatRemainingDays,
      buildHealthStatus,
      formatOperationType,
      handleCreate,
      handleUpdate,
      handleView,
      loadWaterTrend,
      handleTrendDaysChange,
      submitForm,
      resetDeviceForm,
      handleAction,
      handleControl,
      submitControl,
      handleLogs,
      loadRecentLogs,
      handleLogFilter,
      handleLogSizeChange,
      handleLogPageChange,
      handleBindClient,
      submitBind,
      handleUnbindClient,
      handleDelete,
      showMap,
      searchClients,
      loadDealers,
      getFilterColor,
      calculatePurificationRate,
      getTimelineType
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-left .page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.header-left .page-title .el-icon {
  margin-right: 12px;
  font-size: 28px;
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
  backdrop-filter: blur(10px);
}

.header-right .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 统计卡片样式 */
.stats-container {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.online .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-card.warning .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-card.billing .stat-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-percentage {
  font-size: 12px;
  color: #27ae60;
  font-weight: 600;
}

.stat-detail {
  font-size: 12px;
  color: #95a5a6;
}

/* 筛选区域样式 */
.filter-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-main {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-item {
  margin-right: 0;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-filter-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.quick-filter-tag:hover {
  transform: scale(1.05);
}

.quick-filter-tag .el-icon {
  margin-right: 4px;
}

/* 高级筛选样式 */
.advanced-filter-container {
  margin-top: 16px;
}

.advanced-filter-content {
  padding: 20px;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: #909399;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 表格容器样式 */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

/* 表格行样式 */
.low-water-row {
  background-color: #fef0f0 !important;
}

.expire-soon-row {
  background-color: #fdf6ec !important;
}

.offline-row {
  background-color: #f4f4f5 !important;
}

/* 表格内容样式 */
.device-info {
  padding: 8px 0;
}

.device-number {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 4px;
}

.device-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.imei {
  font-size: 12px;
  color: #909399;
}

.status-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.client-info, .dealer-info {
  padding: 4px 0;
}

.client-name, .dealer-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.client-meta, .dealer-meta, .sale-dealer {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.meta-item {
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.address-item {
  color: #606266;
  font-weight: 500;
}

.address-item .el-icon {
  margin-right: 4px;
  font-size: 12px;
}

.billing-info {
  text-align: center;
}

.billing-value {
  margin-top: 8px;
}

.water-amount, .days-amount {
  font-weight: 500;
  color: #2c3e50;
  display: block;
  margin-bottom: 4px;
}

.water-data {
  text-align: center;
}

.water-item {
  margin-bottom: 4px;
  font-size: 12px;
}

.water-item .label {
  color: #909399;
  margin-right: 4px;
}

.water-item .value {
  font-weight: 500;
  color: #2c3e50;
}

.time-info {
  font-size: 12px;
}

.time-item {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.time-item .label {
  color: #909399;
  margin-right: 4px;
  min-width: 32px;
}

.time-item .value {
  color: #2c3e50;
}

.time-item .value.expire-soon {
  color: #e6a23c;
  font-weight: 500;
}

.address-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.address-info .el-icon {
  margin-right: 6px;
  color: #909399;
}

.alert-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.alert-icon {
  font-size: 16px;
}

.alert-icon.low-water {
  color: #f56c6c;
}

.alert-icon.expire-soon {
  color: #e6a23c;
}

.no-alert {
  font-size: 12px;
  color: #67c23a;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 弹窗样式 */
.device-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
}

.form-section .el-card__header {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.form-section .el-card__body {
  padding: 20px;
}

/* 设备详情抽屉样式 */
.device-detail-drawer .el-drawer__body {
  padding: 0;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

.device-detail-drawer {
  --el-drawer-padding-primary: 0;
}

.device-detail {
  padding: 20px;
}

.device-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.device-overview::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.device-header {
  position: relative;
  z-index: 1;
}

.device-title h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
}

.device-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.device-badges .el-tag {
  font-weight: 500;
}

.device-meta {
  margin-top: 16px;
  opacity: 0.9;
}

.device-meta p {
  margin: 4px 0;
  font-size: 14px;
}

.device-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
}

.device-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.device-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.detail-cards {
  margin-bottom: 20px;
}

.detail-card {
  height: 100%;
  transition: all 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.detail-card .el-card__header {
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #2c3e50;
}

.card-header .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.card-content {
  padding: 16px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.info-item .value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
}

.billing-detail {
  padding: 16px 0;
}

.metric-item {
  text-align: center;
  margin-bottom: 20px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
}

.metric-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  font-size: 14px;
  color: #e6a23c;
}

.warning-icon {
  margin-right: 4px;
}

.service-time {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.service-time .label {
  color: #606266;
  margin-right: 8px;
}

.service-time .value {
  color: #2c3e50;
  font-weight: 500;
}

.water-quality {
  padding: 16px 0;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.quality-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quality-item .label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.quality-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.update-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.remark-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #2c3e50;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .filter-main {
    flex-direction: column;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .quick-filters {
    justify-content: center;
  }
  
  .stat-card {
    margin-bottom: 12px;
  }
  
  .device-overview {
    text-align: center;
  }
  
  .device-actions {
    justify-content: center;
  }
  
  .quality-grid {
    grid-template-columns: 1fr;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
.el-table tbody tr {
  transition: all 0.3s ease;
}

.el-table tbody tr:hover {
  transform: scale(1.01);
}

.el-tag {
  transition: all 0.3s ease;
}

.el-button {
  transition: all 0.3s ease;
}

.el-card {
  transition: all 0.3s ease;
}

/* 加载状态样式 */
.el-loading-mask {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.el-loading-spinner {
  margin-top: -25px;
}

.el-loading-text {
  color: #409eff;
  font-weight: 500;
}

.filter-status {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-item {
  text-align: center;
}

.filter-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.filter-percent {
  font-size: 12px;
  color: #909399;
}

/* 滤芯详情样式 */
.filter-detail {
  padding: 20px 0;
}

.filter-card {
  text-align: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.filter-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.filter-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.filter-progress {
  margin-bottom: 16px;
}

.filter-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-usage {
  font-size: 12px;
  color: #606266;
}

.filter-status-text {
  font-size: 12px;
  font-weight: 500;
  color: #67c23a;
}

.filter-status-text.warning {
  color: #f56c6c;
}

.alert-icon.filter-alert {
  color: #e6a23c;
}

.update-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.filter-status-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.filter-item-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.filter-label-compact {
  font-size: 10px;
  color: #606266;
  min-width: 20px;
  font-weight: 500;
}

.filter-percent-compact {
  font-size: 10px;
  color: #909399;
  min-width: 25px;
}

/* 设备详情抽屉样式 */
.device-detail-drawer {
  .device-overview {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 20px;
    
    .device-header {
      .device-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        
        .device-badges {
          display: flex;
          gap: 10px;
          
          .el-tag {
            font-size: 14px;
            padding: 8px 16px;
            border-radius: 20px;
            border: none;
            
            .el-icon {
              margin-right: 4px;
            }
          }
        }
      }
      
      .device-meta {
        .meta-row {
          display: flex;
          gap: 40px;
          margin-bottom: 12px;
          
          .meta-item {
            display: flex;
            align-items: center;
            
            .meta-label {
              font-weight: 500;
              margin-right: 8px;
              opacity: 0.9;
            }
            
            .meta-value {
              font-weight: 600;
            }
          }
        }
      }
    }
    
    .device-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
      
      .el-button {
        min-width: 140px;
        border-radius: 25px;
        font-weight: 500;
        
        .el-icon {
          margin-right: 6px;
        }
      }
    }
  }
  
  .detail-cards {
    margin-bottom: 20px;
    
    .status-card {
      min-height: 200px;
      
      .card-header {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #303133;
        
        .el-icon {
          margin-right: 8px;
          font-size: 18px;
        }
      }
      
      .status-content {
        min-height: 140px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        
        .status-main {
          text-align: center;
          
          .status-value {
            .value-large {
              font-size: 32px;
              font-weight: 700;
              color: #409eff;
            }
          }
          
          .status-label {
            font-size: 14px;
            color: #909399;
            margin-top: 8px;
          }
        }
        
        .status-progress {
          margin: 15px 0;
        }
        
        .status-extra {
          text-align: center;
          font-size: 13px;
          
          .extra-label {
            color: #909399;
            margin-right: 6px;
          }
          
          .extra-value {
            color: #303133;
            font-weight: 500;
          }
        }
      }
      
      &.billing-card {
        .card-header .el-icon {
          color: #67c23a;
        }
      }
      
      &.water-card {
        .card-header .el-icon {
          color: #409eff;
        }
        
        .water-quality-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          .quality-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            
            .quality-label {
              color: #909399;
            }
            
            .quality-value {
              font-weight: 500;
              color: #303133;
            }
          }
        }
      }
      
      &.alert-card {
        .card-header .el-icon {
          color: #f56c6c;
        }
        
        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          
          .alert-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            background-color: #fef0f0;
            border: 1px solid #fde2e2;
            
            .alert-icon {
              margin-right: 8px;
              font-size: 16px;
              
              &.low-water {
                color: #f56c6c;
              }
              
              &.expire-soon {
                color: #e6a23c;
              }
              
              &.filter-alert {
                color: #f56c6c;
              }
            }
            
            .alert-text {
              font-size: 14px;
              color: #f56c6c;
              font-weight: 500;
            }
          }
          
          .no-alert {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            
            .success-icon {
              margin-right: 8px;
              font-size: 20px;
              color: #67c23a;
            }
            
            .success-text {
              font-size: 14px;
              color: #67c23a;
              font-weight: 500;
            }
          }
        }
      }
    }
    
    .detail-card {
      .card-header {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #303133;
        
        .el-icon {
          margin-right: 8px;
          font-size: 18px;
          color: #409eff;
        }
        
        .update-time {
          margin-left: auto;
          font-size: 12px;
          color: #909399;
          font-weight: normal;
        }
      }
      
      .card-content {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .label {
            color: #909399;
            font-size: 14px;
            min-width: 80px;
          }
          
          .value {
            color: #303133;
            font-weight: 500;
            text-align: right;
            flex: 1;
          }
        }
      }
      
      .remark-content {
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 6px;
        color: #606266;
        line-height: 1.6;
        font-size: 14px;
      }
    }
  }
  
  .filter-detail {
    .filter-card {
      text-align: center;
      padding: 20px;
      border-radius: 12px;
      background: linear-gradient(145deg, #f8f9fa, #e9ecef);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
      
      .filter-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .filter-progress {
        margin-bottom: 15px;
      }
      
.filter-info {
  .filter-usage {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .filter-status-text {
    font-size: 13px;
    padding: 4px 12px;
    border-radius: 12px;
    background-color: #67c23a;
    color: white;
    display: inline-block;
    
    &.warning {
      background-color: #f56c6c;
    }
  }
}
    }
  }
}

/* 设备详情增强 */
.overview-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.metric-card {
  padding: 16px;
  border-radius: 12px;
  background: #f7f8fc;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card.primary {
  background: linear-gradient(135deg, #6a85f1 0%, #a777e3 100%);
  color: #fff;
  box-shadow: 0 10px 25px rgba(106, 133, 241, 0.35);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.metric-label {
  font-size: 13px;
  opacity: 0.8;
}

.metric-value {
  font-size: 26px;
  font-weight: 600;
  margin: 4px 0;
}

.metric-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.metric-card.primary .metric-sub {
  color: rgba(255, 255, 255, 0.85);
}

.info-table-card .info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.info-grid-item {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.info-grid-item .label {
  color: #909399;
  margin-bottom: 4px;
}

.info-grid-item .value {
  color: #303133;
  font-weight: 500;
  word-break: break-all;
}

.health-card .health-chips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-chip {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f7fa;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  border: 1px solid transparent;
}

.health-chip.success {
  border-color: #d1f2eb;
  background: #f0fff9;
  color: #2f9688;
}

.health-chip.warning {
  border-color: #ffe7ba;
  background: #fffaf0;
  color: #d48806;
}

.health-chip.danger {
  border-color: #ffccd1;
  background: #fff5f5;
  color: #c45656;
}

.health-chip.info {
  border-color: #d9ecff;
  background: #f4f9ff;
  color: #337ecc;
}

.health-note {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.header-actions {
  margin-left: auto;
}

.timeline-card .timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-card .timeline-remark {
  margin: 0;
  color: #606266;
  font-size: 13px;
}

.timeline-card .timeline-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}
</style> 
