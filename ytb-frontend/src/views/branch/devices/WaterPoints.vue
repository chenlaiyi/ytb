<template>
  <div class="branch-water-points">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>取水点管理</h2>
        <p>管理分支机构的取水点信息和用户取水记录</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog" :icon="Plus">
          新增取水点
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total || 0 }}</div>
              <div class="stats-label">总取水点</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number active">{{ stats.active || 0 }}</div>
              <div class="stats-label">正常营业</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number inactive">{{ stats.inactive || 0 }}</div>
              <div class="stats-label">暂停营业</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number maintenance">{{ stats.maintenance || 0 }}</div>
              <div class="stats-label">维护中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number open">{{ stats.open || 0 }}</div>
              <div class="stats-label">营业中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="never" class="stats-card">
            <div class="stats-content">
              <div class="stats-number closed">{{ stats.closed || 0 }}</div>
              <div class="stats-label">已关闭</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词:">
          <el-input
            v-model="filterForm.keyword"
            placeholder="取水点名称/地址/联系人"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select 
            v-model="filterForm.status" 
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常营业" value="active" />
            <el-option label="暂停营业" value="inactive" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="营业状态:">
          <el-select 
            v-model="filterForm.is_open" 
            placeholder="选择营业状态"
            clearable
            style="width: 120px"
          >
            <el-option label="营业中" :value="true" />
            <el-option label="已关闭" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch" type="primary" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetFilter" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 取水点列表 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="waterPoints"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="取水点名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="营业状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.is_open ? 'success' : 'danger'"
              size="small"
            >
              {{ row.is_open ? '营业中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="80">
          <template #default="{ row }">
            <el-rate
              v-model="row.rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.qr_code_url ? 'primary' : 'success'"
              size="small"
              @click="viewQRCode(row)"
              :icon="View"
            >
              <span v-if="row.qr_code_url">📱 查看二维码</span>
              <span v-else>🔄 生成二维码</span>
            </el-button>
            <el-button 
              link 
              type="primary" 
              size="small"
              @click="viewCheckInRecords(row)"
            >
              取水记录
            </el-button>
            <el-button 
              link 
              type="primary" 
              size="small"
              @click="editWaterPoint(row)"
            >
              编辑
            </el-button>
            <el-button 
              link 
              type="danger" 
              size="small"
              @click="deleteWaterPoint(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 15, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑取水点对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="取水点名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入取水点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="取水点负责人" prop="manager_id">
              <el-select
                v-model="form.manager_id"
                placeholder="请选择取水点负责人"
                filterable
                remote
                clearable
                :remote-method="searchAppUsers"
                :loading="userSelectLoading"
                style="width: 100%"
                @focus="loadDefaultUsers"
                @change="handleManagerChange"
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.display_info"
                  :value="user.id"
                >
                  <div class="user-option">
                    <div class="user-avatar">
                      <el-avatar :size="24" :src="user.avatar">
                        {{ user.display_name.charAt(0) }}
                      </el-avatar>
                    </div>
                    <div class="user-info">
                      <div class="user-name">{{ user.display_name }}</div>
                      <div class="user-phone">{{ user.phone || '未绑定手机' }}</div>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="form.contact_person" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="水价" prop="price">
              <el-input v-model="form.price" placeholder="如：1元/升" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 预留空间 -->
          </el-col>
        </el-row>

        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" @blur="handleAddressChange" />
        </el-form-item>

        <el-form-item label="位置选择">
          <div class="location-selector">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-input 
                  v-model="form.latitude" 
                  placeholder="纬度"
                  readonly
                  style="background-color: #f5f7fa;"
                />
              </el-col>
              <el-col :span="8">
                <el-input 
                  v-model="form.longitude" 
                  placeholder="经度"
                  readonly
                  style="background-color: #f5f7fa;"
                />
              </el-col>
              <el-col :span="8">
                <el-button type="primary" @click="showMapSelector" icon="Location">
                  地图选点
                </el-button>
              </el-col>
            </el-row>
            <div v-if="form.latitude && form.longitude" class="coordinate-info" style="margin-top: 8px;">
              <el-text type="success" size="small">
                <el-icon><SuccessFilled /></el-icon>
                已选择位置：{{ form.latitude }}, {{ form.longitude }}
              </el-text>
              <el-button type="text" size="small" @click="clearCoordinates" style="margin-left: 10px;">
                清除
              </el-button>
            </div>
            <div v-else class="coordinate-info" style="margin-top: 8px;">
              <el-text type="warning" size="small">
                <el-icon><Warning /></el-icon>
                请点击"地图选点"按钮选择取水点的精确位置
              </el-text>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="选择状态">
                <el-option label="正常营业" value="active" />
                <el-option label="暂停营业" value="inactive" />
                <el-option label="维护中" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="营业状态" prop="is_open">
              <el-switch
                v-model="form.is_open"
                active-text="营业中"
                inactive-text="已关闭"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="营业时间">
              <el-time-picker
                v-model="businessHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
                @change="updateBusinessHours"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="取水点描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入取水点描述"
          />
        </el-form-item>

        <el-form-item label="营业时间说明">
          <el-input v-model="form.business_hours" placeholder="如：周一至周日 08:00-22:00" />
        </el-form-item>

        <el-form-item label="设施标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或输入设施标签"
            style="width: 100%"
          >
            <el-option label="停车方便" value="parking" />
            <el-option label="24小时营业" value="24h" />
            <el-option label="免费WiFi" value="wifi" />
            <el-option label="空调环境" value="air_conditioner" />
            <el-option label="监控设备" value="security" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 签到记录对话框 -->
    <el-dialog
      v-model="checkInDialogVisible"
      title="用户取水记录"
      width="1000px"
    >
      <div class="check-in-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ checkInStats.total || 0 }}</div>
              <div class="stat-label">总取水次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ checkInStats.today || 0 }}</div>
              <div class="stat-label">今日取水</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ checkInStats.week || 0 }}</div>
              <div class="stat-label">本周取水</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ checkInStats.month || 0 }}</div>
              <div class="stat-label">本月取水</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table
        v-loading="checkInLoading"
        :data="checkInRecords"
        stripe
        max-height="400"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="用户信息" width="200" align="center">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-avatar">
                <el-avatar 
                  :size="40" 
                  :src="row.user_avatar" 
                  :icon="UserFilled"
                  style="background-color: #f0f0f0;"
                />
              </div>
              <div class="user-details">
                <div class="user-name">{{ row.user_nickname || row.user_name || '未知用户' }}</div>
                <div class="user-phone">{{ row.user_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="推荐人信息" width="180" align="center">
          <template #default="{ row }">
            <div class="referrer-info" v-if="row.referrer_info">
              <div class="referrer-avatar">
                <el-avatar 
                  :size="32" 
                  :src="row.referrer_info.avatar" 
                  :icon="UserFilled"
                  style="background-color: #f0f0f0;"
                />
              </div>
              <div class="referrer-details">
                <div class="referrer-name">{{ row.referrer_info.display_name }}</div>
                <div class="referrer-phone">{{ row.referrer_info.phone || 'ID: ' + row.referrer_info.id }}</div>
              </div>
            </div>
            <div v-else class="no-referrer">
              <el-tag size="small" type="info">无推荐人</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="取水方式" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getCheckInMethodType(row.check_in_method)">
              {{ getCheckInMethodText(row.check_in_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="取水位置" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="water-point-info">
              <div class="point-name">{{ row.water_point_name || currentWaterPoint.name || '未知取水点' }}</div>
              <div class="point-address">{{ row.water_point_address || currentWaterPoint.address || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="取水时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="120" />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="checkInPagination.page"
          v-model:page-size="checkInPagination.per_page"
          :page-sizes="[10, 15, 20, 50]"
          :total="checkInPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleCheckInSizeChange"
          @current-change="handleCheckInCurrentChange"
        />
      </div>
    </el-dialog>

    <!-- 地图选择弹窗 -->
    <el-dialog
      v-model="mapDialogVisible"
      title="选择取水点位置"
      width="80%"
      :close-on-click-modal="false"
      @opened="initMap"
    >
      <div class="map-selector">
        <div class="map-search" style="margin-bottom: 15px;">
          <el-input
            v-model="mapSearchKeyword"
            placeholder="搜索地址，例如：福建省南平市武夷山市朱子路200号"
            style="width: 500px;"
            @keyup.enter="searchLocation"
          >
            <template #append>
              <el-button @click="searchLocation" :loading="searching">
                {{ searching ? '搜索中...' : '搜索' }}
              </el-button>
            </template>
          </el-input>
          
          <!-- 搜索提示和重试按钮 -->
          <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; width: 500px;">
            <div style="font-size: 12px; color: #666;">
              💡 支持搜索：地名、路名、门牌号、小区名等。可直接在地图上点击选择位置。
            </div>
            <el-button 
              v-if="searchResults.length === 0 && mapSearchKeyword.trim()"
              size="small" 
              @click="retrySearch"
              :loading="searching"
            >
              重试搜索
            </el-button>
          </div>
          
          <!-- 搜索状态提示 -->
          <div v-if="searching" style="margin-top: 8px; font-size: 12px; color: #409eff;">
            🔍 正在搜索中，请稍候...
          </div>
        </div>
        
        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="search-results" style="margin-bottom: 15px;">
          <div class="result-item" 
               v-for="(result, index) in searchResults" 
               :key="index"
               @click="selectSearchResult(result)"
               style="padding: 8px; border: 1px solid #eee; margin-bottom: 5px; cursor: pointer; border-radius: 4px;"
               :style="{ backgroundColor: selectedSearchIndex === index ? '#f0f9ff' : '#fff' }"
               @mouseenter="selectedSearchIndex = index"
               @mouseleave="selectedSearchIndex = -1"
          >
            <div style="font-weight: bold;">{{ result.name }}</div>
            <div style="font-size: 12px; color: #666;">{{ result.address }}</div>
          </div>
        </div>
        
        <!-- 地图容器 -->
        <div style="position: relative; width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 4px;">
          <div id="amap-container" style="width: 100%; height: 100%;"></div>
          
          <!-- 地图加载状态 -->
          <div v-if="mapStatus === 'loading'" 
               style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                      background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; 
                      flex-direction: column; border-radius: 4px;">
            <el-icon class="is-loading" style="font-size: 32px; margin-bottom: 10px;">
              <Loading />
            </el-icon>
            <div>地图加载中...</div>
          </div>
          
          <!-- 地图错误状态 -->
          <div v-if="mapStatus === 'error'" 
               style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                      background: #f5f5f5; display: flex; align-items: center; justify-content: center; 
                      flex-direction: column; border-radius: 4px;">
            <el-icon style="font-size: 32px; margin-bottom: 10px; color: #f56c6c;">
              <Warning />
            </el-icon>
            <div style="color: #666; margin-bottom: 15px;">地图加载失败</div>
            <el-button size="small" @click="retryMapInit">重试</el-button>
          </div>
        </div>
        
        <!-- 选中位置信息 -->
        <div v-if="selectedLocation.lat && selectedLocation.lng" 
             style="margin-top: 15px; padding: 10px; background: #f0f9ff; border-radius: 4px;">
          <div style="font-weight: bold; color: #409eff;">📍 已选择位置</div>
          <div style="margin-top: 5px;">
            <strong>地址：</strong>{{ selectedLocation.address || '获取地址中...' }}
          </div>
          <div style="margin-top: 5px;">
            <strong>坐标：</strong>{{ selectedLocation.lat }}, {{ selectedLocation.lng }}
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mapDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmLocation"
            :disabled="!selectedLocation.lat || !selectedLocation.lng"
          >
            确定使用此位置
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 二维码查看弹窗 -->
    <el-dialog
      v-model="qrCodeDialogVisible"
      title="取水点二维码"
      width="500px"
      center
    >
      <div class="qr-code-viewer">
        <div class="qr-code-info">
          <h3>{{ currentWaterPoint?.name }}</h3>
          <p class="address">{{ currentWaterPoint?.address }}</p>
  </div>
        
        <div class="qr-code-container">
          <div v-if="qrCodeLoading" class="loading-container">
            <el-icon class="is-loading" size="40">
              <Loading />
            </el-icon>
            <p>生成二维码中...</p>
          </div>
          
          <div v-else-if="currentQrCodeUrl" class="qr-code-display">
            <img :src="currentQrCodeUrl" alt="取水点二维码" class="qr-code-image" />
            <div class="qr-code-link">
              <p class="link-label">二维码链接：</p>
              <el-input
                v-model="currentQrCodeLink"
                readonly
                class="link-input"
              >
                <template #append>
                  <el-button @click="copyLink" type="primary">
                    复制链接
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
          
          <div v-else class="error-container">
            <p>二维码生成失败</p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="qrCodeDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="currentQrCodeUrl" 
            type="primary" 
            @click="downloadCurrentQRCode"
          >
            下载二维码
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, View, Location, SuccessFilled, Warning, Loading, UserFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getBranchAppUsers } from '@/api/v1/branchManagement.js'

const route = useRoute()
const branchId = route.params.branchId

// 数据状态
const loading = ref(false)
const waterPoints = ref([])
const stats = ref({})

// 分页状态
const pagination = reactive({
  page: 1,
  per_page: 15,
  total: 0
})

// 搜索筛选
const filterForm = reactive({
  keyword: '',
  status: '',
  is_open: ''
})

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = computed(() => form.id ? '编辑取水点' : '新增取水点')

// 二维码查看弹窗状态
const qrCodeDialogVisible = ref(false)
const qrCodeLoading = ref(false)
const currentQrCodeUrl = ref('')
const currentQrCodeLink = ref('')

// 表单数据
const form = reactive({
  id: null,
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  contact_person: '',
  contact_phone: '',
  manager_id: null, // 取水点负责人ID
  open_time: '',
  close_time: '',
  status: 'active',
  is_open: true,
  description: '',
  price: '',
  business_hours: '',
  tags: []
})

// 地图相关状态
const mapDialogVisible = ref(false)
const mapStatus = ref('') // loading, ready, error
const mapSearchKeyword = ref('')
const searching = ref(false)
const searchResults = ref([])
const selectedSearchIndex = ref(-1)
const selectedLocation = reactive({
  lat: '',
  lng: '',
  address: ''
})

// 地图实例和标记
let amapInstance = null
let amapMarker = null
let amapGeocoder = null
let amapPlaceSearch = null

// 营业时间
const businessHours = ref([])

// 表单引用
const formRef = ref()

// 用户选择相关
const userSelectLoading = ref(false)
const userOptions = ref([])

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入取水点名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  manager_id: [{ required: true, message: '请选择取水点负责人', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 签到记录对话框
const checkInDialogVisible = ref(false)
const checkInLoading = ref(false)
const checkInRecords = ref([])
const checkInStats = ref({})
const currentWaterPoint = ref({})
const checkInPagination = reactive({
  page: 1,
  per_page: 15,
  total: 0
})

// 搜索app用户
const searchAppUsers = async (query) => {
  if (!query) {
    userOptions.value = []
    return
  }
  
  userSelectLoading.value = true
  try {
    const response = await getBranchAppUsers(branchId, {
      keyword: query,
      page: 1,
      size: 20,
      simple: 1 // 使用简单模式，获取完整的用户信息用于选择
    })
    
    if (response.code === 0 && response.data) {
      userOptions.value = response.data.data || []
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
  } finally {
    userSelectLoading.value = false
  }
}

// 加载默认用户列表
const loadDefaultUsers = async () => {
  if (userOptions.value.length > 0) return
  
  userSelectLoading.value = true
  try {
    const response = await getBranchAppUsers(branchId, {
      page: 1,
      size: 20,
      simple: 1 // 使用简单模式，获取完整的用户信息用于选择
    })
    
    if (response.code === 0 && response.data) {
      userOptions.value = response.data.data || []
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    userSelectLoading.value = false
  }
}

// 处理负责人变更
const handleManagerChange = (managerId) => {
  if (!managerId) {
    // 如果清空了负责人，也清空联系人信息
    form.contact_person = ''
    form.contact_phone = ''
    return
  }
  
  // 找到选中的用户
  const selectedUser = userOptions.value.find(user => user.id === managerId)
  if (selectedUser) {
    // 如果联系人信息为空，则自动填充
    if (!form.contact_person) {
      form.contact_person = selectedUser.display_name || selectedUser.name || selectedUser.nickname || selectedUser.wechat_nickname || `用户${selectedUser.id}`
    }
    if (!form.contact_phone && selectedUser.phone) {
      form.contact_phone = selectedUser.phone
    }
  }
}

// 页面加载
onMounted(() => {
  fetchWaterPoints()
})

// 获取取水点列表
const fetchWaterPoints = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filterForm
    }
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/water-points`, { params })
    
    console.log('API响应数据:', response)
    console.log('response.data.data:', response.data.data)
    console.log('response.stats:', response.stats)
    
    if (response.code === 0) {
      console.log('开始设置数据...')
      console.log('response.data.data类型:', typeof response.data.data)
      console.log('response.data.data是否为数组:', Array.isArray(response.data.data))
      console.log('response.data.data长度:', response.data.data ? response.data.data.length : 'undefined')
      
      // 强制创建新数组以触发响应式更新
      waterPoints.value = [...(response.data.data || [])]
      pagination.total = response.data.total || 0
      stats.value = response.stats || {}
      
      console.log('设置后的waterPoints:', waterPoints.value)
      console.log('waterPoints.value类型:', typeof waterPoints.value)
      console.log('waterPoints.value是否为数组:', Array.isArray(waterPoints.value))
      console.log('waterPoints.value长度:', waterPoints.value.length)
      console.log('设置后的stats:', stats.value)
      
      // 强制触发响应式更新
      setTimeout(() => {
        console.log('延迟检查waterPoints:', waterPoints.value)
        console.log('延迟检查waterPoints长度:', waterPoints.value.length)
      }, 100)
    } else {
      ElMessage.error(response.message || '获取取水点列表失败')
    }
  } catch (error) {
    console.error('获取取水点列表失败:', error)
    ElMessage.error('获取取水点列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchWaterPoints()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    keyword: '',
    status: '',
    is_open: ''
  })
  pagination.page = 1
  fetchWaterPoints()
}

// 刷新数据
const refreshData = () => {
  fetchWaterPoints()
}

// 分页处理
const handleSizeChange = (val) => {
  pagination.per_page = val
  pagination.page = 1
  fetchWaterPoints()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchWaterPoints()
}

// 排序处理
const handleSortChange = ({ column, prop, order }) => {
  // 这里可以实现排序逻辑
  fetchWaterPoints()
}

// 打开新增对话框
const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

// 编辑取水点
const editWaterPoint = (row) => {
  Object.assign(form, { ...row })
  
  // 处理营业时间
  if (row.open_time && row.close_time) {
    businessHours.value = [row.open_time, row.close_time]
  }
  
  dialogVisible.value = true
}

// 更新营业时间
const updateBusinessHours = (times) => {
  if (times && times.length === 2) {
    form.open_time = times[0]
    form.close_time = times[1]
  } else {
    form.open_time = ''
    form.close_time = ''
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证经纬度
    if (!form.latitude || !form.longitude) {
      ElMessage.error('请使用地图选择取水点的精确位置')
      return
    }
    
    // 验证经纬度格式
    const lat = parseFloat(form.latitude)
    const lng = parseFloat(form.longitude)
    
    if (isNaN(lat) || isNaN(lng)) {
      ElMessage.error('经纬度格式不正确，请重新选择位置')
      return
    }
    
    if (lat < -90 || lat > 90) {
      ElMessage.error('纬度范围应在-90到90之间')
      return
    }
    
    if (lng < -180 || lng > 180) {
      ElMessage.error('经度范围应在-180到180之间')
      return
    }
    
    const url = form.id 
      ? `/api/admin/v1/branch-organizations/${branchId}/water-points/${form.id}`
      : `/api/admin/v1/branch-organizations/${branchId}/water-points`
    
    const method = form.id ? 'put' : 'post'
    
    const response = await request[method](url, {
      ...form,
      latitude: lat,
      longitude: lng
    })
    
    if (response.code === 0) {
      ElMessage.success(form.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchWaterPoints()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('表单提交失败:', error)
    if (error.response?.data?.errors) {
      const firstError = Object.values(error.response.data.errors)[0]
      ElMessage.error(Array.isArray(firstError) ? firstError[0] : firstError)
    } else {
      ElMessage.error('操作失败')
    }
  }
}

// 删除取水点
const deleteWaterPoint = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个取水点吗？删除后不可恢复。', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await request.delete(`/api/admin/v1/branch-organizations/${branchId}/water-points/${row.id}`)
    
    if (response.code === 0) {
      ElMessage.success('删除成功')
      fetchWaterPoints()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除取水点失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 查看取水记录
const viewCheckInRecords = async (row) => {
  currentWaterPoint.value = row
  checkInDialogVisible.value = true
  await fetchCheckInRecords(row.id)
}

// 获取取水记录
const fetchCheckInRecords = async (waterPointId) => {
  checkInLoading.value = true
  try {
    const params = {
      page: checkInPagination.page,
      per_page: checkInPagination.per_page
    }
    
    const response = await request.get(
      `/api/admin/v1/branch-organizations/${branchId}/water-points/${waterPointId}/check-in-records`,
      { params }
    )
    
    if (response.code === 0) {
      checkInRecords.value = response.data.data
      checkInPagination.total = response.data.total
      checkInStats.value = response.stats || {}
    } else {
      ElMessage.error(response.message || '获取取水记录失败')
    }
  } catch (error) {
    console.error('获取取水记录失败:', error)
    ElMessage.error('获取取水记录失败')
  } finally {
    checkInLoading.value = false
  }
}

// 取水记录分页处理
const handleCheckInSizeChange = (val) => {
  checkInPagination.per_page = val
  checkInPagination.page = 1
  const waterPointId = waterPoints.value.find(wp => wp.check_ins)?.id
  if (waterPointId) fetchCheckInRecords(waterPointId)
}

const handleCheckInCurrentChange = (val) => {
  checkInPagination.page = val
  const waterPointId = waterPoints.value.find(wp => wp.check_ins)?.id
  if (waterPointId) fetchCheckInRecords(waterPointId)
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    contact_person: '',
    contact_phone: '',
    manager_id: null,
    open_time: '',
    close_time: '',
    status: 'active',
    is_open: true,
    description: '',
    price: '',
    business_hours: '',
    tags: []
  })
  
  // 重置用户选择
  userOptions.value = []
  businessHours.value = []
  
  // 重置地图相关状态
  selectedLocation.lat = ''
  selectedLocation.lng = ''
  selectedLocation.address = ''
  mapSearchKeyword.value = ''
  searchResults.value = []
  selectedSearchIndex.value = -1
  
  formRef.value?.resetFields()
}

// 工具函数
const getStatusText = (status) => {
  const statusMap = {
    active: '正常营业',
    inactive: '暂停营业',
    maintenance: '维护中'
  }
  return statusMap[status] || '未知'
}

const getStatusTagType = (status) => {
  const typeMap = {
    active: 'success',
    inactive: 'warning',
    maintenance: 'danger'
  }
  return typeMap[status] || 'info'
}

const getCheckInMethodText = (method) => {
  const methodMap = {
    qr_code: '扫码取水',
    manual: '手动取水',
    auto: '自动取水'
  }
  return methodMap[method] || '未知'
}

const getCheckInMethodType = (method) => {
  const typeMap = {
    qr_code: 'primary',
    manual: 'success',
    auto: 'warning'
  }
  return typeMap[method] || 'info'
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 查看二维码
const viewQRCode = async (waterPoint) => {
  try {
    // 设置当前取水点
    currentWaterPoint.value = waterPoint
    
    // 如果取水点已有二维码，直接显示
    if (waterPoint.qr_code_url) {
      currentQrCodeUrl.value = waterPoint.qr_code_url
      // 从二维码数据中提取链接
      if (waterPoint.qr_code_data) {
        try {
          const qrData = JSON.parse(waterPoint.qr_code_data)
          currentQrCodeLink.value = qrData.check_in_url || ''
        } catch (e) {
          currentQrCodeLink.value = ''
        }
      }
      qrCodeDialogVisible.value = true
      return
    }
    
    // 如果没有二维码，调用API重新生成
    qrCodeLoading.value = true
    qrCodeDialogVisible.value = true
    
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/water-points/${waterPoint.id}/qr-code`)
    
    if (response.code === 0) {
      const { qr_code_url, qr_data } = response.data
      
      // 更新本地数据
      waterPoint.qr_code_url = qr_code_url
      waterPoint.qr_code_data = JSON.stringify(qr_data)
      
      // 设置弹窗数据
      currentQrCodeUrl.value = qr_code_url
      currentQrCodeLink.value = qr_data.check_in_url || ''
      
      ElMessage.success('二维码已生成')
    } else {
      ElMessage.error(response.message || '生成二维码失败')
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  } finally {
    qrCodeLoading.value = false
  }
}

// 下载二维码
const generateQRCode = async (waterPoint) => {
  try {
    // 如果取水点已有二维码，直接下载
    if (waterPoint.qr_code_url) {
      downloadQRCode(waterPoint.qr_code_url, `取水点二维码_${waterPoint.name}.png`)
      ElMessage.success('二维码下载成功')
      return
    }
    
    // 如果没有二维码，调用API重新生成
    const response = await request.get(`/api/admin/v1/branch-organizations/${branchId}/water-points/${waterPoint.id}/qr-code`)
    
    if (response.code === 0) {
      // 创建下载链接
      const { qr_code_url, filename } = response.data
      
      downloadQRCode(qr_code_url, filename || `取水点二维码_${waterPoint.name}.png`)
      
      // 更新本地数据
      waterPoint.qr_code_url = qr_code_url
      
      ElMessage.success('二维码已生成并下载')
    } else {
      ElMessage.error(response.message || '生成二维码失败')
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

// 下载二维码图片
const downloadQRCode = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 下载当前查看的二维码
const downloadCurrentQRCode = () => {
  if (currentQrCodeUrl.value && currentWaterPoint.value) {
    downloadQRCode(currentQrCodeUrl.value, `取水点二维码_${currentWaterPoint.value.name}.png`)
    ElMessage.success('二维码下载成功')
  }
}

// 复制二维码链接
const copyLink = async () => {
  if (!currentQrCodeLink.value) {
    ElMessage.error('没有可复制的链接')
    return
  }
  
  try {
    await navigator.clipboard.writeText(currentQrCodeLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    // 如果现代API不可用，使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = currentQrCodeLink.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// ================== 地图相关方法 ==================

// 显示地图选择器
const showMapSelector = () => {
  mapDialogVisible.value = true
  // 重置搜索状态
  searchResults.value = []
  selectedSearchIndex.value = -1
  
  // 如果已有地址，设置为搜索关键词
  if (form.address) {
    mapSearchKeyword.value = form.address
    console.log('设置地图搜索关键词为表单地址:', form.address)
  } else {
    mapSearchKeyword.value = ''
  }
}

// 地址变化处理
const handleAddressChange = () => {
  // 当地址改变时，可以自动搜索该地址
  if (form.address && form.address.length > 3) {
    // 这里可以添加自动地址解析逻辑
  }
}

// 清除坐标
const clearCoordinates = () => {
  form.latitude = ''
  form.longitude = ''
  selectedLocation.lat = ''
  selectedLocation.lng = ''
  selectedLocation.address = ''
}

// 初始化地图
const initMap = () => {
  console.log('开始初始化地图...')
  
  // 检查是否已加载高德地图API
  if (typeof AMap === 'undefined') {
    console.log('AMap未定义，开始加载地图API...')
    mapStatus.value = 'loading'
    
    loadAmapScript().then(() => {
      console.log('地图API加载成功，创建地图实例...')
      createAmapInstance()
    }).catch((error) => {
      console.error('地图API加载失败:', error)
      mapStatus.value = 'error'
      ElMessage.error('地图API加载失败，请检查网络连接或刷新页面重试')
    })
  } else {
    console.log('AMap已存在，直接创建地图实例...')
    createAmapInstance()
  }
}

// 加载高德地图脚本
const loadAmapScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof AMap !== 'undefined') {
      console.log('AMap已存在，无需重复加载')
      resolve()
      return
    }
    
    // 检查是否已有脚本正在加载
    const existingScript = document.querySelector('script[src*="webapi.amap.com"]')
    if (existingScript) {
      console.log('地图脚本已在加载中，等待加载完成...')
      existingScript.onload = () => {
        if (typeof AMap !== 'undefined') {
          resolve()
        } else {
          reject(new Error('地图API加载完成但AMap对象未定义'))
        }
      }
      existingScript.onerror = () => reject(new Error('地图脚本加载失败'))
      return
    }
    
    console.log('创建地图API脚本标签...')
    const script = document.createElement('script')
    script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=eb59997c3fcabbaceebc01ca65d360bf&plugin=AMap.Geocoder,AMap.PlaceSearch'
    script.async = true
    script.charset = 'utf-8'
    
    script.onload = () => {
      console.log('地图脚本加载完成')
      // 等待一小段时间确保AMap对象初始化完成
      setTimeout(() => {
        if (typeof AMap !== 'undefined') {
          console.log('AMap对象初始化成功')
          resolve()
        } else {
          console.error('地图脚本加载完成但AMap对象未定义')
          reject(new Error('地图API加载完成但AMap对象未定义'))
        }
      }, 100)
    }
    
    script.onerror = (error) => {
      console.error('地图脚本加载失败:', error)
      reject(new Error('地图脚本网络加载失败'))
    }
    
    document.head.appendChild(script)
    console.log('地图脚本已添加到页面头部')
  })
}

// 创建地图实例
const createAmapInstance = () => {
  try {
    console.log('开始创建地图实例...')
    
    // 检查AMap是否可用
    if (typeof AMap === 'undefined') {
      console.error('AMap对象未定义，无法创建地图实例')
      mapStatus.value = 'error'
      ElMessage.error('地图组件初始化失败，请刷新页面重试')
      return
    }
    
    // 检查地图容器是否存在
    const container = document.getElementById('amap-container')
    if (!container) {
      console.error('地图容器元素未找到')
      mapStatus.value = 'error'
      ElMessage.error('地图容器初始化失败')
      return
    }
    
    console.log('地图容器检查通过，创建地图实例...')
    
    // 根据用户输入的地址或已有坐标确定地图中心点
    let center = null
    let cityName = null
    
    // 优先从用户输入的地址中解析城市信息
    const addressKeyword = mapSearchKeyword.value.trim()
    console.log('地址搜索关键词:', addressKeyword)
    
    if (addressKeyword) {
      // 解析城市名称 - 优先匹配直辖市和省会城市
      if (addressKeyword.includes('重庆')) {
        cityName = '重庆市'
      } else if (addressKeyword.includes('北京')) {
        cityName = '北京市'
      } else if (addressKeyword.includes('上海')) {
        cityName = '上海市'
      } else if (addressKeyword.includes('天津')) {
        cityName = '天津市'
      } else {
        // 其他城市用正则表达式匹配
        const cityMatch = addressKeyword.match(/(.*?[市县])/);
        if (cityMatch) {
          cityName = cityMatch[1];
        }
      }
      console.log('从地址中解析到城市:', cityName);
    }
    
    // 优先根据解析到的城市设置地图中心点
    if (cityName) {
      if (cityName.includes('重庆')) {
        center = [106.504962, 29.533155] // 重庆市中心
      } else if (cityName.includes('北京')) {
        center = [116.397128, 39.916527] // 北京市中心
      } else if (cityName.includes('上海')) {
        center = [121.473701, 31.230416] // 上海市中心
      } else if (cityName.includes('广州')) {
        center = [113.280637, 23.125178] // 广州市中心
      } else if (cityName.includes('深圳')) {
        center = [114.085947, 22.547] // 深圳市中心
      } else if (cityName.includes('成都')) {
        center = [104.065735, 30.659462] // 成都市中心
      } else if (cityName.includes('杭州')) {
        center = [120.153576, 30.287459] // 杭州市中心
      } else if (cityName.includes('武汉')) {
        center = [114.298572, 30.584355] // 武汉市中心
      } else if (cityName.includes('西安')) {
        center = [108.948024, 34.263161] // 西安市中心
      } else if (cityName.includes('南京')) {
        center = [118.767413, 32.041544] // 南京市中心
      } else if (cityName.includes('天津')) {
        center = [117.190182, 39.125596] // 天津市中心
      } else if (cityName.includes('苏州')) {
        center = [120.619585, 31.299379] // 苏州市中心
      } else if (cityName.includes('长沙')) {
        center = [112.982279, 28.19409] // 长沙市中心
      } else if (cityName.includes('郑州')) {
        center = [113.665412, 34.757975] // 郑州市中心
      } else if (cityName.includes('青岛')) {
        center = [120.355173, 36.082982] // 青岛市中心
      } else if (cityName.includes('大连')) {
        center = [121.618622, 38.91459] // 大连市中心
      } else if (cityName.includes('宁波')) {
        center = [121.549792, 29.868388] // 宁波市中心
      } else if (cityName.includes('厦门')) {
        center = [118.11022, 24.490474] // 厦门市中心
      } else if (cityName.includes('福州')) {
        center = [119.306239, 26.075302] // 福州市中心
      } else if (cityName.includes('昆明')) {
        center = [102.712251, 25.040609] // 昆明市中心
      } else if (cityName.includes('沈阳')) {
        center = [123.429096, 41.796767] // 沈阳市中心
      } else if (cityName.includes('济南')) {
        center = [117.000923, 36.675807] // 济南市中心
      } else if (cityName.includes('哈尔滨')) {
        center = [126.642464, 45.756967] // 哈尔滨市中心
      } else if (cityName.includes('长春')) {
        center = [125.3245, 43.886841] // 长春市中心
      } else if (cityName.includes('石家庄')) {
        center = [114.502461, 38.045474] // 石家庄市中心
      } else if (cityName.includes('南昌')) {
        center = [115.892151, 28.676493] // 南昌市中心
      } else if (cityName.includes('贵阳')) {
        center = [106.713478, 26.578343] // 贵阳市中心
      } else if (cityName.includes('海口')) {
        center = [110.35, 20.02] // 海口市中心
      } else if (cityName.includes('南宁')) {
        center = [108.320004, 22.82402] // 南宁市中心
      } else if (cityName.includes('银川')) {
        center = [106.278179, 38.46637] // 银川市中心
      } else if (cityName.includes('西宁')) {
        center = [101.778916, 36.623178] // 西宁市中心
      } else if (cityName.includes('兰州')) {
        center = [103.73, 36.03] // 兰州市中心
      } else if (cityName.includes('乌鲁木齐')) {
        center = [87.68, 43.77] // 乌鲁木齐市中心
      } else if (cityName.includes('拉萨')) {
        center = [91.132212, 29.660361] // 拉萨市中心
      } else {
        // 如果没有匹配到具体城市，使用中国地理中心
        center = [104.195397, 35.86166] // 中国地理中心
      }
      console.log('根据城市设置地图中心点:', center, '城市:', cityName)
    } else if (form.latitude && form.longitude) {
      // 如果没有搜索关键词但表单中有坐标，使用表单坐标作为中心点
      center = [parseFloat(form.longitude), parseFloat(form.latitude)]
      selectedLocation.lat = form.latitude
      selectedLocation.lng = form.longitude
      selectedLocation.address = form.address || ''
      console.log('使用表单中的坐标作为地图中心:', center)
    } else {
      // 如果无法解析城市且没有表单坐标，使用中国地理中心
      center = [104.195397, 35.86166] // 中国地理中心
      console.log('使用默认中国地理中心:', center)
    }
    
    console.log('设置地图中心点:', center, '城市:', cityName)
    
    amapInstance = new AMap.Map('amap-container', {
      center: center,
      zoom: 15,
      mapStyle: 'amap://styles/normal'
    })
    
    console.log('地图实例创建成功')
    
    // 初始化地理编码插件
    amapGeocoder = new AMap.Geocoder()
    console.log('地理编码插件初始化成功')
    
    // 初始化地点搜索插件 - 根据解析到的城市设置搜索范围
    let searchCity = '010' // 默认全国搜索
    let cityLimit = false  // 默认不限制城市
    
    if (cityName) {
      // 根据城市名称设置搜索城市编码
      if (cityName.includes('重庆')) {
        searchCity = '023'
        cityLimit = true
      } else if (cityName.includes('北京')) {
        searchCity = '010'
        cityLimit = true
      } else if (cityName.includes('上海')) {
        searchCity = '021'
        cityLimit = true
      } else if (cityName.includes('广州')) {
        searchCity = '020'
        cityLimit = true
      } else if (cityName.includes('深圳')) {
        searchCity = '0755'
        cityLimit = true
      } else if (cityName.includes('成都')) {
        searchCity = '028'
        cityLimit = true
      } else if (cityName.includes('杭州')) {
        searchCity = '0571'
        cityLimit = true
      } else if (cityName.includes('武汉')) {
        searchCity = '027'
        cityLimit = true
      } else if (cityName.includes('西安')) {
        searchCity = '029'
        cityLimit = true
      } else if (cityName.includes('南京')) {
        searchCity = '025'
        cityLimit = true
      } else if (cityName.includes('天津')) {
        searchCity = '022'
        cityLimit = true
      } else if (cityName.includes('苏州')) {
        searchCity = '0512'
        cityLimit = true
      } else if (cityName.includes('长沙')) {
        searchCity = '0731'
        cityLimit = true
      } else if (cityName.includes('郑州')) {
        searchCity = '0371'
        cityLimit = true
      } else if (cityName.includes('青岛')) {
        searchCity = '0532'
        cityLimit = true
      } else if (cityName.includes('大连')) {
        searchCity = '0411'
        cityLimit = true
      } else if (cityName.includes('宁波')) {
        searchCity = '0574'
        cityLimit = true
      } else if (cityName.includes('厦门')) {
        searchCity = '0592'
        cityLimit = true
      } else if (cityName.includes('福州')) {
        searchCity = '0591'
        cityLimit = true
      } else if (cityName.includes('昆明')) {
        searchCity = '0871'
        cityLimit = true
      } else if (cityName.includes('沈阳')) {
        searchCity = '024'
        cityLimit = true
      } else if (cityName.includes('济南')) {
        searchCity = '0531'
        cityLimit = true
      } else if (cityName.includes('哈尔滨')) {
        searchCity = '0451'
        cityLimit = true
      } else if (cityName.includes('长春')) {
        searchCity = '0431'
        cityLimit = true
      } else if (cityName.includes('石家庄')) {
        searchCity = '0311'
        cityLimit = true
      } else if (cityName.includes('南昌')) {
        searchCity = '0791'
        cityLimit = true
      } else if (cityName.includes('贵阳')) {
        searchCity = '0851'
        cityLimit = true
      } else if (cityName.includes('海口')) {
        searchCity = '0898'
        cityLimit = true
      } else if (cityName.includes('南宁')) {
        searchCity = '0771'
        cityLimit = true
      } else if (cityName.includes('银川')) {
        searchCity = '0951'
        cityLimit = true
      } else if (cityName.includes('西宁')) {
        searchCity = '0971'
        cityLimit = true
      } else if (cityName.includes('兰州')) {
        searchCity = '0931'
        cityLimit = true
      } else if (cityName.includes('乌鲁木齐')) {
        searchCity = '0991'
        cityLimit = true
      } else if (cityName.includes('拉萨')) {
        searchCity = '0891'
        cityLimit = true
      }
      
      console.log('根据城市设置搜索范围:', cityName, '城市编码:', searchCity, '限制城市:', cityLimit)
    }
    
    amapPlaceSearch = new AMap.PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
      city: searchCity,
      citylimit: cityLimit,
      map: amapInstance,
      panel: false,
      autoFitView: false // 不自动调整视野
    })
    console.log('地点搜索插件初始化成功，搜索城市:', searchCity)
    
    // 如果有初始坐标，添加标记
    if (form.latitude && form.longitude) {
      updateAmapMarker(parseFloat(form.latitude), parseFloat(form.longitude))
      console.log('已添加初始坐标标记')
    }
    
    // 添加地图点击事件
    amapInstance.on('click', (e) => {
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()
      console.log('地图被点击，坐标:', lat, lng)
      
      updateAmapMarker(lat, lng)
      reverseGeocode(lat, lng)
    })
    
    mapStatus.value = 'ready'
    console.log('地图初始化完成')
    
    // 如果有搜索关键词（用户输入的详细地址），自动搜索
    if (mapSearchKeyword.value.trim()) {
      console.log('检测到用户输入的地址，自动搜索:', mapSearchKeyword.value)
      // 延迟一点时间确保地图完全加载
      setTimeout(() => {
        searchLocation(true) // 传递true表示这是自动搜索
      }, 500)
    }
    
  } catch (error) {
    console.error('创建地图实例时发生错误:', error)
    mapStatus.value = 'error'
    ElMessage.error('地图初始化失败: ' + error.message)
  }
}

// 更新地图标记
const updateAmapMarker = (lat, lng) => {
  // 移除旧标记
  if (amapMarker) {
    amapInstance.remove(amapMarker)
  }
  
  // 添加新标记
  amapMarker = new AMap.Marker({
    position: [lng, lat],
    map: amapInstance,
    title: '取水点位置'
  })
  
  // 更新选中位置
  selectedLocation.lat = lat.toFixed(6)
  selectedLocation.lng = lng.toFixed(6)
  
  // 地图居中到新位置
  amapInstance.setCenter([lng, lat])
}

// 重试地图初始化
const retryMapInit = () => {
  console.log('重试地图初始化')
  mapStatus.value = ''
  
  // 清理旧的地图实例
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
  }
  amapMarker = null
  amapGeocoder = null
  amapPlaceSearch = null
  
  // 重新初始化
  setTimeout(() => {
    initMap()
  }, 100)
}

// 逆地理编码（根据坐标获取地址）
const reverseGeocode = (lat, lng) => {
  if (!amapGeocoder) {
    console.error('地理编码插件未初始化')
    return
  }
  
  amapGeocoder.getAddress([lng, lat], (status, result) => {
    if (status === 'complete' && result.regeocode) {
      selectedLocation.address = result.regeocode.formattedAddress
      console.log('逆地理编码成功:', selectedLocation.address)
    } else {
      console.error('逆地理编码失败:', status, result)
      selectedLocation.address = '地址解析失败'
    }
  })
}

// 搜索位置
const searchLocation = (isAutoSearch = false) => {
  if (!mapSearchKeyword.value.trim()) {
    if (!isAutoSearch) {
      ElMessage.warning('请输入搜索关键词')
    }
    return
  }
  
  if (!amapPlaceSearch) {
    console.error('地图搜索功能未就绪')
    if (!isAutoSearch) {
      ElMessage.error('地图搜索功能未就绪，请等待地图加载完成')
    } else {
      // 自动搜索时，等待一段时间后重试
      setTimeout(() => {
        if (amapPlaceSearch) {
          searchLocation(true)
        } else {
          console.error('地图搜索功能初始化失败')
        }
      }, 1000)
    }
    return
  }
  
  console.log('开始搜索位置:', mapSearchKeyword.value)
  searching.value = true
  searchResults.value = []
  
  // 如果是自动搜索，显示提示信息
  if (isAutoSearch) {
    ElMessage.info('正在根据您输入的地址自动搜索相近位置...')
  }
  
  // 设置搜索超时
  const searchTimeout = setTimeout(() => {
    searching.value = false
    console.error('搜索超时')
    if (isAutoSearch) {
      console.log('自动搜索超时，不显示错误提示')
      // 自动搜索超时时不显示错误提示，避免干扰用户
    } else {
      ElMessage.error('搜索超时，请检查网络连接或尝试其他关键词')
    }
    // 超时后尝试备用搜索
    tryBackupSearch(isAutoSearch)
  }, 10000) // 10秒超时，给更多时间
  
  try {
    amapPlaceSearch.search(mapSearchKeyword.value, (status, result) => {
      clearTimeout(searchTimeout)
      searching.value = false
      console.log('搜索状态:', status)
      console.log('搜索结果:', result)
      
      if (status === 'complete') {
        if (result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
          console.log('原始搜索结果:', result.poiList.pois)
          
          // 验证搜索结果的坐标是否在预期的城市范围内
          const validResults = result.poiList.pois.filter(poi => {
            const lat = poi.location.lat
            const lng = poi.location.lng
            
            console.log(`验证坐标: ${poi.name} - 纬度:${lat}, 经度:${lng}`)
            
            // 根据搜索的城市验证坐标范围
            const addressKeyword = mapSearchKeyword.value.toLowerCase()
            console.log('搜索关键词:', addressKeyword)
            
            if (addressKeyword.includes('重庆')) {
              // 重庆市坐标范围：纬度28.1-32.2，经度105.2-110.2
              const isValid = lat >= 28.1 && lat <= 32.2 && lng >= 105.2 && lng <= 110.2
              console.log(`重庆坐标验证: ${poi.name} - 纬度:${lat}(${lat >= 28.1 && lat <= 32.2 ? '✓' : '✗'}), 经度:${lng}(${lng >= 105.2 && lng <= 110.2 ? '✓' : '✗'}) = ${isValid ? '有效' : '无效'}`)
              
              // 如果坐标在福州范围内，明确标记为无效
              if (lat >= 25.1 && lat <= 26.8 && lng >= 118.1 && lng <= 120.0) {
                console.log(`❌ 检测到福州坐标 ${poi.name}: 纬度${lat}, 经度${lng} - 这是错误的！`)
                return false
              }
              
              return isValid
            } else if (addressKeyword.includes('北京')) {
              // 北京市坐标范围：纬度39.4-41.1，经度115.4-117.5
              const isValid = lat >= 39.4 && lat <= 41.1 && lng >= 115.4 && lng <= 117.5
              console.log(`北京坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('上海')) {
              // 上海市坐标范围：纬度30.7-31.9，经度120.9-122.0
              const isValid = lat >= 30.7 && lat <= 31.9 && lng >= 120.9 && lng <= 122.0
              console.log(`上海坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('广州')) {
              // 广州市坐标范围：纬度22.5-24.0，经度112.9-114.0
              const isValid = lat >= 22.5 && lat <= 24.0 && lng >= 112.9 && lng <= 114.0
              console.log(`广州坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('深圳')) {
              // 深圳市坐标范围：纬度22.4-22.9，经度113.7-114.6
              const isValid = lat >= 22.4 && lat <= 22.9 && lng >= 113.7 && lng <= 114.6
              console.log(`深圳坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('成都')) {
              // 成都市坐标范围：纬度30.1-31.4，经度103.0-105.0
              const isValid = lat >= 30.1 && lat <= 31.4 && lng >= 103.0 && lng <= 105.0
              console.log(`成都坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('杭州')) {
              // 杭州市坐标范围：纬度29.1-30.6，经度118.2-120.9
              const isValid = lat >= 29.1 && lat <= 30.6 && lng >= 118.2 && lng <= 120.9
              console.log(`杭州坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('武汉')) {
              // 武汉市坐标范围：纬度29.9-31.4，经度113.7-115.1
              const isValid = lat >= 29.9 && lat <= 31.4 && lng >= 113.7 && lng <= 115.1
              console.log(`武汉坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('西安')) {
              // 西安市坐标范围：纬度33.4-34.8，经度107.4-109.8
              const isValid = lat >= 33.4 && lat <= 34.8 && lng >= 107.4 && lng <= 109.8
              console.log(`西安坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('南京')) {
              // 南京市坐标范围：纬度31.1-32.9，经度118.1-119.2
              const isValid = lat >= 31.1 && lat <= 32.9 && lng >= 118.1 && lng <= 119.2
              console.log(`南京坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('天津')) {
              // 天津市坐标范围：纬度38.5-40.3，经度116.4-118.2
              const isValid = lat >= 38.5 && lat <= 40.3 && lng >= 116.4 && lng <= 118.2
              console.log(`天津坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            } else if (addressKeyword.includes('福州')) {
              // 福州市坐标范围：纬度25.1-26.8，经度118.1-120.0
              const isValid = lat >= 25.1 && lat <= 26.8 && lng >= 118.1 && lng <= 120.0
              console.log(`福州坐标验证: ${poi.name} - 结果:${isValid ? '有效' : '无效'}`)
              return isValid
            }
            
            // 其他城市或无法识别城市时，不进行坐标验证
            console.log(`未识别城市，跳过坐标验证: ${poi.name}`)
            return true
          })
          
          console.log('原始搜索结果数量:', result.poiList.pois.length)
          console.log('坐标验证后的结果数量:', validResults.length)
          
          if (validResults.length > 0) {
            searchResults.value = validResults.map(poi => ({
              name: poi.name,
              address: poi.address || poi.district || '',
              location: poi.location
            }))
            
            console.log('处理后的搜索结果:', searchResults.value)
            if (isAutoSearch) {
              ElMessage.success(`根据您输入的地址找到 ${searchResults.value.length} 个相近位置，请选择最合适的`)
            } else {
              ElMessage.success(`找到 ${searchResults.value.length} 个相关地址`)
            }
          } else {
            console.log('❌ 搜索结果坐标验证失败，所有结果都不在预期城市范围内')
            searchResults.value = []
            if (isAutoSearch) {
              console.log('自动搜索的结果坐标不正确，尝试备用搜索')
              ElMessage.warning('检测到搜索结果坐标异常，正在尝试备用搜索方式...')
            } else {
              ElMessage.warning('搜索结果坐标异常，请尝试更具体的地址或直接在地图上点击选择')
            }
            // 坐标验证失败时尝试备用搜索
            tryBackupSearch(isAutoSearch)
          }
        } else {
          console.log('搜索完成但无结果')
          searchResults.value = []
          if (isAutoSearch) {
            ElMessage.info('未找到与您输入地址完全匹配的位置，请尝试手动搜索更具体的关键词或直接在地图上点击选择')
          } else {
            ElMessage.info('未找到相关地址，请尝试其他关键词或直接在地图上点击选择')
          }
          // 没有结果时尝试备用搜索
          tryBackupSearch(isAutoSearch)
        }
      } else {
        console.error('搜索失败，状态:', status)
        console.error('错误详情:', result)
        
        // 根据不同错误状态给出不同提示
        let errorMessage = '搜索失败'
        if (status === 'no_data') {
          errorMessage = '未找到相关地址，请尝试其他关键词'
        } else if (status === 'error') {
          errorMessage = '搜索服务异常，请稍后重试'
        } else if (status === 'timeout') {
          errorMessage = '搜索超时，请检查网络连接'
        } else {
          errorMessage = `搜索失败 (${status})，请检查网络连接或稍后重试`
        }
        
        // 自动搜索失败时不显示错误提示，避免干扰用户
        if (!isAutoSearch) {
          ElMessage.error(errorMessage)
        } else {
          console.log('自动搜索失败，不显示错误提示:', errorMessage)
        }
        
        // 搜索失败时尝试备用搜索策略
        if (mapSearchKeyword.value.length > 2) {
          setTimeout(() => {
            tryBackupSearch(isAutoSearch)
          }, 1000)
        }
      }
    })
  } catch (error) {
    clearTimeout(searchTimeout)
    searching.value = false
    console.error('搜索调用异常:', error)
    if (!isAutoSearch) {
      ElMessage.error('搜索功能异常，请稍后重试')
    }
    // 异常时尝试备用搜索
    tryBackupSearch(isAutoSearch)
  }
}

// 测试网络连接
const testNetworkConnection = async () => {
  try {
    const response = await fetch('https://webapi.amap.com/v3/config/district?key=eb59997c3fcabbaceebc01ca65d360bf&keywords=中国&subdistrict=0', {
      method: 'GET',
      timeout: 5000
    })
    return response.ok
  } catch (error) {
    console.error('网络连接测试失败:', error)
    return false
  }
}

// 备用搜索策略
const tryBackupSearch = async (isAutoSearch = false) => {
  console.log('尝试备用搜索策略...')
  
  // 先测试网络连接
  const networkOk = await testNetworkConnection()
  if (!networkOk) {
    if (!isAutoSearch) {
      ElMessage.error('网络连接异常，请检查网络设置')
    }
    return
  }
  
  // 使用地理编码服务进行搜索
  if (amapGeocoder) {
    console.log('使用地理编码服务搜索:', mapSearchKeyword.value)
    
    try {
      amapGeocoder.getLocation(mapSearchKeyword.value, (status, result) => {
        console.log('地理编码搜索结果:', status, result)
        
        if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
          const geocode = result.geocodes[0]
          searchResults.value = [{
            name: geocode.formattedAddress || mapSearchKeyword.value,
            address: geocode.formattedAddress || '地址信息不完整',
            location: geocode.location
          }]
          if (!isAutoSearch) {
            ElMessage.success('通过备用方式找到地址')
          }
        } else {
          console.log('备用搜索也未找到结果')
          // 提供本地搜索建议
          provideLocalSearchSuggestions()
        }
      })
    } catch (error) {
      console.error('地理编码搜索异常:', error)
      provideLocalSearchSuggestions()
    }
  } else {
    console.log('地理编码服务未就绪')
    provideLocalSearchSuggestions()
  }
}

// 提供本地搜索建议
const provideLocalSearchSuggestions = () => {
  const keyword = mapSearchKeyword.value.toLowerCase()
  const suggestions = []
  
  // 根据关键词提供智能建议
  if (keyword.includes('重庆')) {
    console.log('提供重庆地址建议')
    
    // 针对具体地址提供精确建议
    if (keyword.includes('九龙坡') && keyword.includes('五四路')) {
      suggestions.push({
        name: '重庆市九龙坡区五四路100号',
        address: '重庆市九龙坡区五四路100号',
        location: { lng: 106.458357, lat: 29.499280 }
      })
    }
    
    if (keyword.includes('九龙坡') || keyword.includes('石龙') || keyword.includes('菜鸟驿站')) {
      suggestions.push({
        name: '重庆市九龙坡区石龙小区菜鸟驿站',
        address: '重庆市九龙坡区石龙小区菜鸟驿站',
        location: { lng: 106.458357, lat: 29.499280 }
      })
    }
    
    if (keyword.includes('大渡口') || keyword.includes('通兴路')) {
      suggestions.push({
        name: '重庆市大渡口区通兴路1888号',
        address: '重庆市大渡口区通兴路1888号',
        location: { lng: 106.478357, lat: 29.479280 }
      })
    }
    
    // 重庆各区的中心位置
    if (keyword.includes('渝中')) {
      suggestions.push({
        name: '重庆市渝中区人民大礼堂',
        address: '重庆市渝中区人民路173号',
        location: { lng: 106.504962, lat: 29.533155 }
      })
    }
    
    if (keyword.includes('江北')) {
      suggestions.push({
        name: '重庆市江北区观音桥',
        address: '重庆市江北区观音桥商圈',
        location: { lng: 106.539525, lat: 29.575429 }
      })
    }
    
    if (keyword.includes('南岸')) {
      suggestions.push({
        name: '重庆市南岸区南坪',
        address: '重庆市南岸区南坪商圈',
        location: { lng: 106.559525, lat: 29.523429 }
      })
    }
    
    if (keyword.includes('沙坪坝')) {
      suggestions.push({
        name: '重庆市沙坪坝区三峡广场',
        address: '重庆市沙坪坝区三峡广场',
        location: { lng: 106.456525, lat: 29.541429 }
      })
    }
    
    if (keyword.includes('渝北')) {
      suggestions.push({
        name: '重庆市渝北区龙溪',
        address: '重庆市渝北区龙溪街道',
        location: { lng: 106.619525, lat: 29.641429 }
      })
    }
    
    if (keyword.includes('巴南')) {
      suggestions.push({
        name: '重庆市巴南区鱼洞',
        address: '重庆市巴南区鱼洞街道',
        location: { lng: 106.519525, lat: 29.381429 }
      })
    }
    
    if (keyword.includes('北碚')) {
      suggestions.push({
        name: '重庆市北碚区缙云山',
        address: '重庆市北碚区天生路',
        location: { lng: 106.437525, lat: 29.825429 }
      })
    }
    
    if (keyword.includes('万州')) {
      suggestions.push({
        name: '重庆市万州区万达广场',
        address: '重庆市万州区高笋塘',
        location: { lng: 108.408525, lat: 30.807429 }
      })
    }
    
    // 如果没有具体区域匹配，提供重庆市中心
    if (suggestions.length === 0) {
      suggestions.push({
        name: '重庆市中心',
        address: '重庆市渝中区人民大礼堂',
        location: { lng: 106.504962, lat: 29.533155 }
      })
    }
  }
  
  // 其他城市的建议保持不变
  if (keyword.includes('福建') || keyword.includes('南平') || keyword.includes('武夷山')) {
    suggestions.push({
      name: '福建省南平市武夷山市',
      address: '福建省南平市武夷山市中心区域',
      location: { lng: 118.0350, lat: 27.7560 }
    })
  }
  
  if (keyword.includes('北京') || keyword.includes('天安门')) {
    suggestions.push({
      name: '北京市天安门广场',
      address: '北京市东城区天安门广场',
      location: { lng: 116.397477, lat: 39.908692 }
    })
  }
  
  if (suggestions.length > 0) {
    searchResults.value = suggestions
    ElMessage.info(`根据您的搜索为您推荐 ${suggestions.length} 个位置`)
  } else {
    ElMessage.warning('建议尝试更具体的地址关键词，如"XX市XX区XX路"，或直接在地图上点击选择位置')
  }
}

// 手动重新搜索
const retrySearch = () => {
  console.log('手动重试搜索')
  searchLocation()
}

// 选择搜索结果
const selectSearchResult = (result) => {
  const lng = result.location.lng
  const lat = result.location.lat
  
  console.log('选择搜索结果:', result.name, '坐标:', lat, lng)
  
  // 再次验证坐标是否有效（防止意外选择无效坐标）
  const addressKeyword = mapSearchKeyword.value.toLowerCase()
  let isValidCoordinate = true
  
  if (addressKeyword.includes('重庆')) {
    // 重庆市坐标范围验证
    if (lat < 28.1 || lat > 32.2 || lng < 105.2 || lng > 110.2) {
      isValidCoordinate = false
      console.log('❌ 重庆地址坐标验证失败:', lat, lng)
    }
    
    // 特别检查福州坐标
    if (lat >= 25.1 && lat <= 26.8 && lng >= 118.1 && lng <= 120.0) {
      isValidCoordinate = false
      console.log('❌ 检测到福州坐标，拒绝选择:', lat, lng)
    }
  }
  
  if (!isValidCoordinate) {
    ElMessage.error('选择的坐标位置不正确，请重新选择或直接在地图上点击')
    return
  }
  
  console.log('✅ 坐标验证通过，更新地图标记')
  
  updateAmapMarker(lat, lng)
  selectedLocation.address = result.address
  
  // 清空搜索结果
  searchResults.value = []
  selectedSearchIndex.value = -1
  
  ElMessage.success(`已选择：${result.name}`)
}

// 确认位置选择
const confirmLocation = () => {
  form.latitude = selectedLocation.lat
  form.longitude = selectedLocation.lng
  
  // 如果有地址信息且表单地址为空，更新表单地址
  if (selectedLocation.address && !form.address) {
    form.address = selectedLocation.address
  }
  
  mapDialogVisible.value = false
  ElMessage.success('位置设置成功')
}
</script>

<style scoped>
.branch-water-points {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px 0;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stats-number.active {
  color: #67c23a;
}

.stats-number.inactive {
  color: #e6a23c;
}

.stats-number.maintenance {
  color: #f56c6c;
}

.stats-number.open {
  color: #409eff;
}

.stats-number.closed {
  color: #909399;
}

.stats-label {
  font-size: 12px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.check-in-stats {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

/* 二维码查看弹窗样式 */
.qr-code-viewer {
  text-align: center;
}

.qr-code-info {
  margin-bottom: 20px;
}

.qr-code-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.qr-code-info .address {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.qr-code-container {
  margin-bottom: 20px;
}

.loading-container {
  padding: 40px;
  color: #666;
}

.loading-container p {
  margin-top: 10px;
  font-size: 14px;
}

.qr-code-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.qr-code-link {
  width: 100%;
  max-width: 400px;
}

.link-label {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
  text-align: left;
}

.link-input {
  width: 100%;
}

.error-container {
  padding: 40px;
  color: #f56c6c;
}

.stat-item .stat-label {
  font-size: 14px;
  color: #606266;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

/* 签到记录表格样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.user-details .user-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-details .user-phone {
  font-size: 12px;
  color: #909399;
}

.referrer-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.referrer-avatar {
  flex-shrink: 0;
}

.referrer-details {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.referrer-details .referrer-name {
  font-weight: 500;
  color: #303133;
  font-size: 12px;
  margin-bottom: 2px;
}

.referrer-details .referrer-phone {
  font-size: 11px;
  color: #909399;
}

.no-referrer {
  display: flex;
  justify-content: center;
}

.water-point-info {
  text-align: left;
}

.point-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.point-address {
  font-size: 12px;
  color: #909399;
}
</style> 