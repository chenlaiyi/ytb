<template>
  <div class="water-points-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>取水点管理</h1>
      <p>管理所有取水点信息，包括位置、状态、图片等</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总取水点</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💚</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">正常营业</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.open }}</div>
          <div class="stat-label">营业中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.maintenance }}</div>
          <div class="stat-label">维护中</div>
        </div>
      </div>
    </div>

    <!-- 搜索和操作区域 -->
    <div class="search-section">
      <div class="search-controls">
        <el-input
          v-model="searchKeyword" 
          placeholder="搜索取水点名称、地址或联系人"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 120px"
          clearable
          @change="handleSearch"
        >
          <el-option label="正常营业" value="active" />
          <el-option label="暂停营业" value="inactive" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
        
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <div class="action-controls">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增取水点
        </el-button>
      </div>
    </div>

    <!-- 取水点列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="waterPoints"
        style="width: 100%"
        row-key="id"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="取水点信息" min-width="200">
          <template #default="{ row }">
            <div class="point-info">
              <div class="point-name">{{ row.name }}</div>
              <div class="point-address">{{ row.address }}</div>
              <div class="point-contact">
                联系人：{{ row.contact_person }} | {{ row.contact_phone }}
      </div>
    </div>
          </template>
        </el-table-column>
        
        <el-table-column label="图片" width="140">
          <template #default="{ row }">
            <div class="image-preview">
              <div v-if="row.storefront_image" class="image-item">
                <el-image
                  :src="getImageUrl(row.storefront_image)"
                  :preview-src-list="getPreviewImages(row)"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 4px;"
                  preview-teleported
                />
                <span class="image-label">门头</span>
              </div>
              <div v-if="row.water_location_image" class="image-item">
                <el-image
                  :src="getImageUrl(row.water_location_image)"
                  :preview-src-list="getPreviewImages(row)"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 4px;"
                  preview-teleported
                />
                <span class="image-label">取水</span>
              </div>
              <div v-if="!row.storefront_image && !row.water_location_image" class="no-image">
                暂无图片
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
            <br>
            <el-tag :type="row.is_open ? 'success' : 'danger'" size="small" style="margin-top: 5px;">
              {{ row.is_open ? '营业中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="位置信息" width="150">
          <template #default="{ row }">
            <div class="location-info">
              <div>纬度：{{ row.latitude }}</div>
              <div>经度：{{ row.longitude }}</div>
              <el-button 
                type="text" 
                size="small" 
                @click="showLocationOnMap(row)"
              >
                <el-icon><Location /></el-icon>
                查看地图
              </el-button>
      </div>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchWaterPoints"
          @current-change="fetchWaterPoints"
        />
      </div>
      </div>

    <!-- 新增/编辑取水点弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增取水点' : '编辑取水点'"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        style="max-height: 70vh; overflow-y: auto;"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="取水点名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入取水点名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact_person">
                <el-input v-model="form.contact_person" placeholder="请输入联系人姓名" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="contact_phone">
                <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="form.status" style="width: 100%">
                  <el-option label="正常营业" value="active" />
                  <el-option label="暂停营业" value="inactive" />
                  <el-option label="维护中" value="maintenance" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="营业状态">
            <el-switch
              v-model="form.is_open"
              active-text="营业中"
              inactive-text="已关闭"
            />
          </el-form-item>
        </div>

        <!-- 位置信息 -->
        <div class="form-section">
          <h3>位置信息</h3>
          <el-form-item label="详细地址" prop="address">
            <el-input 
              v-model="form.address" 
              placeholder="请输入详细地址"
              @blur="handleAddressChange"
            />
          </el-form-item>
          
          <el-form-item label="地理坐标" prop="latitude">
            <div class="coordinate-section">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input 
                    v-model="form.latitude" 
                    placeholder="纬度"
                    readonly
                  />
                </el-col>
                <el-col :span="8">
                  <el-input 
                    v-model="form.longitude" 
                    placeholder="经度"
                    readonly
                  />
                </el-col>
                <el-col :span="8">
                  <el-button type="primary" @click="showMapSelector">
                    <el-icon><Location /></el-icon>
                    选择位置
                  </el-button>
                </el-col>
              </el-row>
              <div v-if="form.latitude && form.longitude" class="coordinate-info">
                <span class="coordinate-text">已选择位置：{{ form.latitude }}, {{ form.longitude }}</span>
                <el-button type="text" size="small" @click="clearCoordinates">清除</el-button>
              </div>
              </div>
          </el-form-item>
        </div>

        <!-- 图片上传 -->
        <div class="form-section">
          <h3>图片信息 <span style="color: #f56c6c;">*</span></h3>
          <p style="color: #909399; margin-bottom: 20px;">
            <strong>必须上传门头照片和取水位置照片各一张</strong>，图片格式支持JPG/PNG，单张不超过5MB
          </p>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="门头照片" prop="storefront_image">
                <div class="image-upload-section">
                  <el-upload
                    class="image-uploader"
                    action="#"
                    :http-request="(options) => handleImageUpload(options, 'storefront')"
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    accept="image/*"
                  >
                    <img 
                      v-if="form.storefront_image" 
                      :src="getImageUrl(form.storefront_image)" 
                      class="uploaded-image"
                    />
                    <div v-else class="upload-placeholder">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">上传门头照片</div>
              </div>
                  </el-upload>
              </div>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="取水位置照片" prop="water_location_image">
                <div class="image-upload-section">
                  <el-upload
                    class="image-uploader"
                    action="#"
                    :http-request="(options) => handleImageUpload(options, 'water_location')"
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    accept="image/*"
                  >
                    <img 
                      v-if="form.water_location_image" 
                      :src="getImageUrl(form.water_location_image)" 
                      class="uploaded-image"
                    />
                    <div v-else class="upload-placeholder">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">上传取水位置照片</div>
              </div>
                  </el-upload>
    </div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="其他图片">
            <el-upload
              class="additional-images-uploader"
              action="#"
              :http-request="handleAdditionalImageUpload"
              :file-list="additionalImageList"
              :before-upload="beforeImageUpload"
              list-type="picture-card"
              :on-remove="handleRemoveAdditionalImage"
              accept="image/*"
              multiple
            >
              <el-icon class="upload-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">可上传更多取水点相关图片，最多9张</div>
          </el-form-item>
      </div>

        <!-- 营业信息 -->
        <div class="form-section">
          <h3>营业信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始营业时间">
                <el-time-picker
                  v-model="form.open_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择开始时间"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束营业时间">
                <el-time-picker
                  v-model="form.close_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择结束时间"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="营业时间说明">
            <el-input 
              v-model="form.business_hours" 
              placeholder="例如：周一至周日 08:00-22:00"
            />
          </el-form-item>
          
          <el-form-item label="水价">
            <el-input 
              v-model="form.price" 
              placeholder="例如：1元/升"
            />
          </el-form-item>
        </div>

        <!-- 其他信息 -->
        <div class="form-section">
          <h3>其他信息</h3>
          <el-form-item label="取水点描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入取水点描述信息"
            />
          </el-form-item>
          
          <el-form-item label="标签">
            <el-tag
              v-for="tag in form.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              style="margin-right: 10px;"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="inputRef"
              v-model="inputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              + 新标签
            </el-button>
          </el-form-item>
          
          <el-form-item label="设施">
            <el-checkbox-group v-model="form.facilities">
              <el-checkbox label="免费WiFi">免费WiFi</el-checkbox>
              <el-checkbox label="停车场">停车场</el-checkbox>
              <el-checkbox label="24小时营业">24小时营业</el-checkbox>
              <el-checkbox label="无障碍设施">无障碍设施</el-checkbox>
              <el-checkbox label="休息区">休息区</el-checkbox>
              <el-checkbox label="洗手间">洗手间</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ dialogMode === 'create' ? '创建' : '更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 地图选择器弹窗 -->
    <el-dialog
      v-model="mapDialogVisible"
      title="选择取水点位置"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="map-selector">
        <div class="map-search">
          <el-input
            v-model="mapSearchKeyword"
            placeholder="搜索地址，例如：福建省南平市武夷山市朱子路200号"
            style="width: 500px; margin-bottom: 10px;"
            @keyup.enter="searchLocation"
          >
            <template #append>
              <el-button @click="searchLocation" :loading="searching">
                {{ searching ? '搜索中...' : '搜索' }}
              </el-button>
            </template>
          </el-input>
          
          <!-- API状态提示 -->
          <div v-if="!mapApiLoaded" style="margin-bottom: 10px; width: 500px;">
            <el-alert
              title="地图API未加载，正在使用本地地址库"
              type="info"
              :closable="false"
              show-icon
            />
      </div>
          
          <!-- 搜索提示 -->
          <div style="margin-bottom: 10px; font-size: 12px; color: #666; width: 500px;">
            💡 支持搜索：地名、路名、门牌号、小区名等。如果搜索无结果，可直接在地图上点击选择位置。
    </div>
          
          <!-- 搜索结果列表 -->
          <div v-if="searchResults.length > 0" class="search-results" style="margin-bottom: 10px;">
            <div class="search-results-header">
              <span>搜索结果（点击选择）：</span>
  </div>
            <div class="search-results-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 4px;">
              <div 
                v-for="(result, index) in searchResults" 
                :key="index"
                class="search-result-item"
                style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; hover:background-color: #f5f7fa;"
                @click="selectSearchResult(result)"
                @mouseenter="$event.target.style.backgroundColor = '#f5f7fa'"
                @mouseleave="$event.target.style.backgroundColor = 'transparent'"
              >
                <div style="font-weight: 500; color: #303133;">{{ result.name }}</div>
                <div style="font-size: 12px; color: #909399;">{{ result.address }}</div>
                <div style="font-size: 11px; color: #c0c4cc;">{{ result.cityname }} {{ result.adname }}</div>
              </div>
            </div>
          </div>
        </div>
        <div id="tencent-map" style="width: 100%; height: 400px;"></div>
        <div class="selected-location" v-if="selectedLocation.address">
          <p><strong>已选择位置：</strong>{{ selectedLocation.address }}</p>
          <p><strong>坐标：</strong>{{ selectedLocation.lat }}, {{ selectedLocation.lng }}</p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mapDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmLocation" :disabled="!selectedLocation.lat">
            确认位置
          </el-button>
        </span>
</template>
    </el-dialog>

    <!-- 地图查看弹窗 -->
    <el-dialog
      v-model="viewMapDialogVisible"
      title="取水点位置"
      width="60%"
    >
      <div id="view-map" style="width: 100%; height: 400px;"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Refresh, Plus, Edit, Delete, Location 
} from '@element-plus/icons-vue'
import { 
  getWaterPointList, 
  createWaterPoint, 
  updateWaterPoint, 
  deleteWaterPoint, 
  updateWaterPointStatus,
  getWaterPointStatistics
} from '@/api/v1/waterPoint'
import { uploadImage } from '@/api/v1/upload'
import { getAdminToken } from '@/utils/admin-token-bridge'
    
    // 响应式数据
    const loading = ref(false)
    const waterPoints = ref([])
    const total = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(15)
    const searchKeyword = ref('')
const statusFilter = ref('')

    // 统计数据
    const stats = reactive({
      total: 0,
      active: 0,
      open: 0,
      maintenance: 0
    })

// 弹窗相关
const dialogVisible = ref(false)
const dialogMode = ref('create') // create | edit
const submitting = ref(false)
const formRef = ref()

// 地图相关
const mapDialogVisible = ref(false)
const viewMapDialogVisible = ref(false)
const mapSearchKeyword = ref('')
const searching = ref(false)
const mapApiLoaded = ref(false)

// 安全检查AMap是否可用
const isAmapAvailable = () => {
  return typeof window !== 'undefined' && window.AMap
}
const searchResults = ref([])
const selectedLocation = reactive({
  lat: '',
  lng: '',
  address: ''
})
let tencentMap = null
let marker = null

// 表单数据
const defaultForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  contact_person: '',
  contact_phone: '',
  open_time: '',
  close_time: '',
  status: 'active',
  is_open: true,
  description: '',
  storefront_image: '', // 门头照片
  water_location_image: '', // 取水位置照片
  images: [],
  tags: [],
  price: '',
  business_hours: '',
  facilities: []
}

const form = reactive({ ...defaultForm })

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入取水点名称', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  contact_person: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  storefront_image: [
    { required: true, message: '请上传门头照片', trigger: 'change' }
  ],
  water_location_image: [
    { required: true, message: '请上传取水位置照片', trigger: 'change' }
  ]
}

// 标签输入相关
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref()

// 额外图片列表
const additionalImageList = ref([])

// 地图选择器方法
const showMapSelector = () => {
  mapDialogVisible.value = true
  // 重置搜索状态
  searchResults.value = []
  
  // 如果已有地址，设置为搜索关键词
  if (form.address) {
    mapSearchKeyword.value = form.address
    console.log('设置地图搜索关键词为表单地址:', form.address)
  } else {
    mapSearchKeyword.value = ''
  }
  
  nextTick(() => {
    initTencentMap()
  })
}

// 初始化腾讯地图
const initTencentMap = () => {
  if (isAmapAvailable()) {
    mapApiLoaded.value = true
    createMap()
  } else {
    loadTencentMapScript().then(() => {
      mapApiLoaded.value = true
      createMap()
    }).catch(() => {
      mapApiLoaded.value = false
      ElMessage.error('地图API加载失败，将使用本地地址库')
      showLocationSuggestions()
    })
  }
}

// 加载腾讯地图脚本
const loadTencentMapScript = () => {
  return new Promise((resolve, reject) => {
    if (isAmapAvailable()) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=eb59997c3fcabbaceebc01ca65d360bf&plugin=AMap.Geocoder,AMap.PlaceSearch'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 创建地图
const createMap = () => {
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
  
  tencentMap = new window.AMap.Map('tencent-map', {
    center: center,
    zoom: 13,
    mapStyle: 'amap://styles/normal'
  })
  
  // 添加点击事件
  tencentMap.on('click', (evt) => {
    const lng = evt.lnglat.getLng()
    const lat = evt.lnglat.getLat()
    
    // 更新标记位置
    updateMarker(lat, lng)
    
    // 逆地理编码获取地址
    reverseGeocode(lat, lng)
  })
  
  // 如果有搜索关键词（用户输入的详细地址），自动搜索
  if (mapSearchKeyword.value.trim()) {
    console.log('检测到用户输入的地址，自动搜索:', mapSearchKeyword.value)
    // 延迟一点时间确保地图完全加载
    setTimeout(() => {
      searchLocation(true) // 传递true表示这是自动搜索
    }, 500)
  }
}

// 更新标记
const updateMarker = (lat, lng) => {
  if (marker) {
    tencentMap.remove(marker)
  }
  
  marker = new window.AMap.Marker({
    position: [lng, lat],
    map: tencentMap
  })
  
  selectedLocation.lat = lat.toFixed(6)
  selectedLocation.lng = lng.toFixed(6)
}

// 逆地理编码
const reverseGeocode = (lat, lng) => {
  const geocoder = new window.AMap.Geocoder()
  
  geocoder.getAddress([lng, lat], (status, result) => {
    if (status === 'complete' && result.regeocode) {
      selectedLocation.address = result.regeocode.formattedAddress
    } else {
      console.error('逆地理编码失败:', status, result)
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
  
  searching.value = true
  searchResults.value = []
  
  // 如果是自动搜索，显示提示信息
  if (isAutoSearch) {
    ElMessage.info('正在根据您输入的地址自动搜索相近位置...')
  }
  
  // 首先尝试本地地址库搜索
  const localResults = searchLocalDatabase(mapSearchKeyword.value)
  if (localResults.length > 0) {
    searchResults.value = localResults
    searching.value = false
    if (isAutoSearch) {
      ElMessage.success(`根据您输入的地址在本地数据库找到 ${localResults.length} 个相近位置，请选择最合适的`)
    } else {
      ElMessage.success(`在本地数据库找到 ${localResults.length} 个相关地址`)
    }
    return
  }
  
  // 如果本地搜索无结果，尝试高德地图API
  if (isAmapAvailable()) {
    window.AMap.plugin('AMap.PlaceSearch', () => {
      // 根据用户输入的地址解析城市信息来设置搜索范围
      let searchCity = '全国' // 默认全国搜索
      let cityLimit = false   // 默认不限制城市
      
      const addressKeyword = mapSearchKeyword.value.trim()
      if (addressKeyword) {
        // 解析城市名称
        const cityMatch = addressKeyword.match(/(.*?[市县区])/);
        if (cityMatch) {
          const cityName = cityMatch[1];
          console.log('从搜索地址中解析到城市:', cityName);
          
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
      }
      
      const placeSearch = new window.AMap.PlaceSearch({
        pageSize: 10, // 返回结果数量
        pageIndex: 1, // 页码
        city: searchCity, // 根据解析的城市设置搜索范围
        citylimit: cityLimit, // 根据解析结果决定是否限制城市
        map: null, // 不关联地图实例，手动处理结果
        panel: false // 不显示结果面板
      })
      
      placeSearch.search(mapSearchKeyword.value, (status, result) => {
        searching.value = false
        
        if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
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
            // 显示所有搜索结果供用户选择
            searchResults.value = validResults.map(poi => ({
              name: poi.name,
              address: poi.address,
              location: poi.location,
              cityname: poi.cityname,
              adname: poi.adname,
              district: poi.district,
              type: poi.type
            }))
            
            // 自动选择第一个结果
            if (searchResults.value.length > 0) {
              selectSearchResult(searchResults.value[0])
            }
            
            if (isAutoSearch) {
              ElMessage.success(`根据您输入的地址找到 ${searchResults.value.length} 个相近位置，请选择最合适的`)
            } else {
              ElMessage.success(`找到 ${searchResults.value.length} 个相关地址`)
            }
          } else {
            console.log('❌ 搜索结果坐标验证失败，所有结果都不在预期城市范围内')
            // 坐标验证失败时使用备用搜索
            if (isAutoSearch) {
              console.log('自动搜索的结果坐标不正确，尝试备用搜索')
              ElMessage.warning('检测到搜索结果坐标异常，正在尝试备用搜索方式...')
            } else {
              ElMessage.warning('搜索结果坐标异常，请尝试更具体的地址或直接在地图上点击选择')
            }
            // 使用备用搜索
            fallbackLocalSearch()
          }
        } else {
          // 检查是否是API密钥问题
          if (status === 'error' || (result && result.info && result.info.includes('USERKEY'))) {
            ElMessage.warning('地图API配置问题，正在使用本地搜索...')
            fallbackLocalSearch()
          } else {
            // 如果POI搜索失败，尝试使用地理编码
            fallbackGeocode()
          }
        }
      })
    })
  } else {
    // 如果高德地图API未加载，直接使用本地备用方案
    fallbackLocalSearch()
  }
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
  
  // 移动地图中心
  tencentMap.setCenter([lng, lat])
  tencentMap.setZoom(17) // 提高缩放级别以显示更多细节
  
  // 更新标记
  updateMarker(lat, lng)
  selectedLocation.address = result.name + ' ' + result.address
  
  // 清空搜索结果列表
  searchResults.value = []
  
  ElMessage.success(`已选择：${result.name}`)
}

// 备用地理编码搜索
const fallbackGeocode = () => {
  const geocoder = new window.AMap.Geocoder({
    city: '全国', // 设置搜索范围为全国
    radius: 1000, // 搜索半径
    extensions: 'all' // 返回详细信息
  })
  
  geocoder.getLocation(mapSearchKeyword.value, (status, result) => {
    searching.value = false
    
    if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
      const geocode = result.geocodes[0]
      const location = geocode.location
      const lng = location.lng
      const lat = location.lat
      
      // 移动地图中心
      tencentMap.setCenter([lng, lat])
      tencentMap.setZoom(15)
      
      // 更新标记
      updateMarker(lat, lng)
      selectedLocation.address = geocode.formattedAddress || mapSearchKeyword.value
      
      ElMessage.success('找到地址')
    } else {
      // 如果API密钥有问题，提供手动输入坐标的选项
      if (status === 'error' && result === 'USERKEY_PLAT_NOMATCH') {
        ElMessage.error('地图API配置问题，请联系管理员检查API密钥设置。\n您可以直接在地图上点击选择位置，或手动输入经纬度。')
        
        // 提供一些常见地点的坐标作为参考
        showLocationSuggestions()
      } else {
                    if (isAutoSearch) {
              ElMessage.error('未找到与您输入地址完全匹配的位置，请尝试以下方式：\n1. 手动搜索更具体的地址信息\n2. 尝试输入地标建筑名称\n3. 直接在地图上点击选择位置')
            } else {
              ElMessage.error('未找到该地址，请尝试以下方式：\n1. 输入更详细的地址信息\n2. 尝试输入地标建筑名称\n3. 直接在地图上点击选择位置')
            }
      }
      console.log('搜索失败:', status, result)
    }
  })
}

// 本地地址数据库
const localAddressDatabase = [
  // 武夷山市主要地点
  { name: '武夷山市政府', lat: 27.7565, lng: 118.0354, address: '福建省南平市武夷山市崇安街道', keywords: ['政府', '市政府', '武夷山市政府'] },
  { name: '武夷山风景区', lat: 27.7319, lng: 117.9834, address: '福建省南平市武夷山市', keywords: ['风景区', '景区', '武夷山', '旅游'] },
  { name: '武夷山北站', lat: 27.7892, lng: 118.0456, address: '福建省南平市武夷山市', keywords: ['火车站', '高铁站', '北站', '车站'] },
  { name: '武夷山机场', lat: 27.7018, lng: 118.0011, address: '福建省南平市武夷山市', keywords: ['机场', '航空', '飞机场'] },
  { name: '朱子路', lat: 27.7550, lng: 118.0380, address: '福建省南平市武夷山市朱子路', keywords: ['朱子路', '朱子', '路'] },
  { name: '朱子路200号', lat: 27.7548, lng: 118.0385, address: '福建省南平市武夷山市朱子路200号', keywords: ['朱子路200号', '200号', '朱子路200'] },
  { name: '南一嘉苑', lat: 27.7545, lng: 118.0390, address: '福建省南平市武夷山市朱子路南一嘉苑', keywords: ['南一嘉苑', '嘉苑', '小区'] },
  { name: '武夷山市中心', lat: 27.7560, lng: 118.0350, address: '福建省南平市武夷山市中心区域', keywords: ['市中心', '中心', '市区'] },
  { name: '武夷山大学', lat: 27.7600, lng: 118.0400, address: '福建省南平市武夷山市', keywords: ['大学', '学校', '武夷山大学'] },
  { name: '武夷山医院', lat: 27.7580, lng: 118.0370, address: '福建省南平市武夷山市', keywords: ['医院', '医疗', '卫生'] },
  
  // 南平市其他区域
  { name: '南平市政府', lat: 26.6436, lng: 118.1782, address: '福建省南平市延平区', keywords: ['南平', '市政府', '延平区'] },
  { name: '建阳区', lat: 27.3316, lng: 118.1205, address: '福建省南平市建阳区', keywords: ['建阳', '建阳区'] },
  { name: '邵武市', lat: 27.3409, lng: 117.4831, address: '福建省南平市邵武市', keywords: ['邵武', '邵武市'] },
  
  // 福建省主要城市
  { name: '福州市', lat: 26.0745, lng: 119.2965, address: '福建省福州市', keywords: ['福州', '福州市', '省会'] },
  { name: '厦门市', lat: 24.4798, lng: 118.0894, address: '福建省厦门市', keywords: ['厦门', '厦门市'] },
  { name: '泉州市', lat: 24.8740, lng: 118.6758, address: '福建省泉州市', keywords: ['泉州', '泉州市'] }
]

// 本地地址搜索
const searchLocalDatabase = (keyword) => {
  const results = []
  const searchTerm = keyword.toLowerCase().trim()
  
  localAddressDatabase.forEach(item => {
    // 检查名称匹配
    if (item.name.toLowerCase().includes(searchTerm)) {
      results.push({
        name: item.name,
        address: item.address,
        location: { lng: item.lng, lat: item.lat },
        cityname: '南平市',
        adname: '武夷山市',
        type: '本地数据'
      })
      return
    }
    
    // 检查地址匹配
    if (item.address.toLowerCase().includes(searchTerm)) {
      results.push({
        name: item.name,
        address: item.address,
        location: { lng: item.lng, lat: item.lat },
        cityname: '南平市',
        adname: '武夷山市',
        type: '本地数据'
      })
      return
    }
    
    // 检查关键词匹配
    if (item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))) {
      results.push({
        name: item.name,
        address: item.address,
        location: { lng: item.lng, lat: item.lat },
        cityname: '南平市',
        adname: '武夷山市',
        type: '本地数据'
      })
    }
  })
  
  return results
}

// 备用本地搜索
const fallbackLocalSearch = () => {
  searching.value = false
  
  // 提供智能建议
  const suggestions = []
  const keyword = mapSearchKeyword.value.toLowerCase()
  
  console.log('启动备用搜索，关键词:', keyword)
  
  // 重庆地址建议
  if (keyword.includes('重庆')) {
    console.log('提供重庆地址建议')
    
    // 针对具体地址提供精确建议
    if (keyword.includes('九龙坡') && keyword.includes('五四路')) {
      suggestions.push({
        name: '重庆市九龙坡区五四路100号',
        address: '重庆市九龙坡区五四路100号',
        location: { lng: 106.458357, lat: 29.499280 },
        cityname: '重庆市',
        adname: '九龙坡区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('九龙坡') || keyword.includes('石龙') || keyword.includes('菜鸟驿站')) {
      suggestions.push({
        name: '重庆市九龙坡区石龙小区菜鸟驿站',
        address: '重庆市九龙坡区石龙小区菜鸟驿站',
        location: { lng: 106.458357, lat: 29.499280 },
        cityname: '重庆市',
        adname: '九龙坡区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('大渡口') || keyword.includes('通兴路')) {
      suggestions.push({
        name: '重庆市大渡口区通兴路1888号',
        address: '重庆市大渡口区通兴路1888号',
        location: { lng: 106.478357, lat: 29.479280 },
        cityname: '重庆市',
        adname: '大渡口区',
        type: '智能匹配'
      })
    }
    
    // 重庆各区的中心位置
    if (keyword.includes('渝中')) {
      suggestions.push({
        name: '重庆市渝中区人民大礼堂',
        address: '重庆市渝中区人民路173号',
        location: { lng: 106.504962, lat: 29.533155 },
        cityname: '重庆市',
        adname: '渝中区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('江北')) {
      suggestions.push({
        name: '重庆市江北区观音桥',
        address: '重庆市江北区观音桥商圈',
        location: { lng: 106.539525, lat: 29.575429 },
        cityname: '重庆市',
        adname: '江北区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('南岸')) {
      suggestions.push({
        name: '重庆市南岸区南坪',
        address: '重庆市南岸区南坪商圈',
        location: { lng: 106.559525, lat: 29.523429 },
        cityname: '重庆市',
        adname: '南岸区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('沙坪坝')) {
      suggestions.push({
        name: '重庆市沙坪坝区三峡广场',
        address: '重庆市沙坪坝区三峡广场',
        location: { lng: 106.456525, lat: 29.541429 },
        cityname: '重庆市',
        adname: '沙坪坝区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('渝北')) {
      suggestions.push({
        name: '重庆市渝北区龙溪',
        address: '重庆市渝北区龙溪街道',
        location: { lng: 106.619525, lat: 29.641429 },
        cityname: '重庆市',
        adname: '渝北区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('巴南')) {
      suggestions.push({
        name: '重庆市巴南区鱼洞',
        address: '重庆市巴南区鱼洞街道',
        location: { lng: 106.519525, lat: 29.381429 },
        cityname: '重庆市',
        adname: '巴南区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('北碚')) {
      suggestions.push({
        name: '重庆市北碚区缙云山',
        address: '重庆市北碚区天生路',
        location: { lng: 106.437525, lat: 29.825429 },
        cityname: '重庆市',
        adname: '北碚区',
        type: '智能匹配'
      })
    }
    
    if (keyword.includes('万州')) {
      suggestions.push({
        name: '重庆市万州区万达广场',
        address: '重庆市万州区高笋塘',
        location: { lng: 108.408525, lat: 30.807429 },
        cityname: '重庆市',
        adname: '万州区',
        type: '智能匹配'
      })
    }
    
    // 如果没有具体区域匹配，提供重庆市中心
    if (suggestions.length === 0) {
      suggestions.push({
        name: '重庆市中心',
        address: '重庆市渝中区人民大礼堂',
        location: { lng: 106.504962, lat: 29.533155 },
        cityname: '重庆市',
        adname: '渝中区',
        type: '智能匹配'
      })
    }
  }
  
  // 武夷山地址建议保持不变
  if (keyword.includes('朱子路') || keyword.includes('200号') || keyword.includes('南一嘉苑')) {
    suggestions.push({
      name: '朱子路200号南一嘉苑A幢',
      address: '福建省南平市武夷山市朱子路200号南一嘉苑A幢',
      location: { lng: 118.0388, lat: 27.7546 },
      cityname: '南平市',
      adname: '武夷山市',
      type: '智能匹配'
    })
  }
  
  if (keyword.includes('武夷山')) {
    suggestions.push(
      {
        name: '武夷山市中心',
        address: '福建省南平市武夷山市中心区域',
        location: { lng: 118.0350, lat: 27.7560 },
        cityname: '南平市',
        adname: '武夷山市',
        type: '智能匹配'
      },
      {
        name: '武夷山风景区',
        address: '福建省南平市武夷山市风景区',
        location: { lng: 117.9834, lat: 27.7319 },
        cityname: '南平市',
        adname: '武夷山市',
        type: '智能匹配'
      }
    )
  }
  
  if (suggestions.length > 0) {
    searchResults.value = suggestions
    ElMessage.info(`根据您的搜索为您推荐 ${suggestions.length} 个位置`)
  } else {
    showLocationSuggestions()
  }
}

// 显示位置建议
const showLocationSuggestions = () => {
  const suggestions = [
    { name: '武夷山市政府', lat: 27.7565, lng: 118.0354, address: '福建省南平市武夷山市崇安街道' },
    { name: '武夷山风景区', lat: 27.7319, lng: 117.9834, address: '福建省南平市武夷山市' },
    { name: '武夷山北站', lat: 27.7892, lng: 118.0456, address: '福建省南平市武夷山市' },
    { name: '朱子路200号', lat: 27.7548, lng: 118.0385, address: '福建省南平市武夷山市朱子路200号' }
  ]
  
  // 创建建议列表
  searchResults.value = suggestions.map(item => ({
    name: item.name,
    address: item.address,
    location: { lng: item.lng, lat: item.lat },
    cityname: '南平市',
    adname: '武夷山市',
    type: '推荐位置'
  }))
  
  ElMessage.info('为您推荐一些武夷山市的常见位置，您也可以直接在地图上点击选择')
}

// 确认位置选择
const confirmLocation = () => {
  if (!selectedLocation.lat || !selectedLocation.lng) {
    ElMessage.warning('请先选择位置')
    return
  }
  
  form.latitude = selectedLocation.lat
  form.longitude = selectedLocation.lng
  if (selectedLocation.address) {
    form.address = selectedLocation.address
  }
  
  mapDialogVisible.value = false
  ElMessage.success('位置选择成功')
}

// 清除坐标
const clearCoordinates = () => {
  form.latitude = ''
  form.longitude = ''
  selectedLocation.lat = ''
  selectedLocation.lng = ''
  selectedLocation.address = ''
}

// 地址变化处理
const handleAddressChange = () => {
  // 当地址改变时，可以自动进行地理编码
  if (form.address && form.address.length > 5) {
    // 这里可以添加自动地理编码逻辑
  }
}

    // 获取取水点列表
    const fetchWaterPoints = async () => {
      loading.value = true
      
      try {
        const params = {
          page: currentPage.value,
          per_page: pageSize.value
        }
        
        if (searchKeyword.value) {
          params.keyword = searchKeyword.value
        }
    
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
        
        const response = await getWaterPointList(params)
        
        if (response.code === 0) {
          waterPoints.value = response.data || []
          total.value = response.meta?.total || 0
          
          // 更新统计数据
          if (response.statistics) {
        Object.assign(stats, response.statistics)
          }
        } else {
          throw new Error(response.message || '获取数据失败')
        }
        
      } catch (error) {
        console.error('获取取水点数据失败:', error)
        ElMessage.error('获取取水点数据失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 搜索处理
    const handleSearch = () => {
  currentPage.value = 1
      fetchWaterPoints()
    }

    // 刷新数据
    const handleRefresh = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
      fetchWaterPoints()
    }

// 新增取水点
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(form, defaultForm)
  form.tags = []
  form.facilities = []
  form.images = []
  additionalImageList.value = []
  dialogVisible.value = true
}

// 编辑取水点
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(form, {
    ...row,
    tags: row.tags || [],
    facilities: row.facilities || [],
    images: row.images || []
  })
  
  // 处理额外图片列表
  const additionalImages = (row.images || []).filter(img => 
    img !== row.storefront_image && img !== row.water_location_image
  )
  additionalImageList.value = additionalImages.map((url, index) => ({
    name: `image_${index}`,
    url: url
  }))
  
  dialogVisible.value = true
}

// 删除取水点
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除取水点"${row.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await deleteWaterPoint(row.id)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      fetchWaterPoints()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除取水点失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    const response = await updateWaterPointStatus(row.id, newStatus)
    
    if (response.code === 0) {
      ElMessage.success('状态更新成功')
      fetchWaterPoints()
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('状态更新失败: ' + error.message)
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 准备提交数据
    const submitData = {
      ...form,
      images: [
        form.storefront_image,
        form.water_location_image,
        ...additionalImageList.value.map(item => item.url)
      ].filter(Boolean)
    }
    
    let response
    if (dialogMode.value === 'create') {
      response = await createWaterPoint(submitData)
    } else {
      response = await updateWaterPoint(form.id, submitData)
    }
    
    if (response.code === 0) {
      ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      fetchWaterPoints()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
      } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 图片上传前验证
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 处理图片上传
const handleImageUpload = async (options, type) => {
  try {
    // 检查是否有token
    const token = getAdminToken()
    if (!token) {
      ElMessage.error('请先登录')
        return
      }

    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('type', 'image')
    formData.append('folder', 'water-points')
    
    const response = await uploadImage(formData)
    
    if (response && (response.code === 0 || response.code === 200)) {
      if (type === 'storefront') {
        form.storefront_image = response.data.url
      } else if (type === 'water_location') {
        form.water_location_image = response.data.url
      }
      ElMessage.success('图片上传成功')
      
      // 调用成功回调
      if (options.onSuccess) {
        options.onSuccess(response, options.file)
      }
    } else {
      const errorMsg = response?.message || '图片上传失败'
      ElMessage.error(errorMsg)
      
      // 调用失败回调
      if (options.onError) {
        options.onError(new Error(errorMsg), options.file)
      }
    }
      } catch (error) {
    console.error('图片上传失败:', error)
    
    // 检查是否是认证错误
    if (error.message && (error.message.includes('401') || error.message.includes('未授权') || error.message.includes('令牌'))) {
      ElMessage.error('登录已过期，请重新登录')
      // 不要在这里直接跳转，让拦截器处理
    } else {
      ElMessage.error('图片上传失败: ' + (error.message || '网络错误'))
    }
    
    // 调用失败回调
    if (options.onError) {
      options.onError(error, options.file)
    }
  }
}

// 处理额外图片上传
const handleAdditionalImageUpload = async (options) => {
  try {
    // 检查是否有token
    const token = getAdminToken()
    if (!token) {
      ElMessage.error('请先登录')
      return
    }

    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('type', 'image')
    formData.append('folder', 'water-points')
    
    const response = await uploadImage(formData)
    
    if (response && (response.code === 0 || response.code === 200)) {
      additionalImageList.value.push({
        name: options.file.name,
        url: response.data.url
      })
      ElMessage.success('图片上传成功')
      
      // 调用成功回调
      if (options.onSuccess) {
        options.onSuccess(response, options.file)
      }
    } else {
      const errorMsg = response?.message || '图片上传失败'
      ElMessage.error(errorMsg)
      
      // 调用失败回调
      if (options.onError) {
        options.onError(new Error(errorMsg), options.file)
      }
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    
    // 检查是否是认证错误
    if (error.message && (error.message.includes('401') || error.message.includes('未授权') || error.message.includes('令牌'))) {
      ElMessage.error('登录已过期，请重新登录')
      // 不要在这里直接跳转，让拦截器处理
    } else {
      ElMessage.error('图片上传失败: ' + (error.message || '网络错误'))
    }
    
    // 调用失败回调
    if (options.onError) {
      options.onError(error, options.file)
    }
  }
}

// 移除额外图片
const handleRemoveAdditionalImage = (file) => {
  const index = additionalImageList.value.findIndex(item => item.name === file.name)
  if (index > -1) {
    additionalImageList.value.splice(index, 1)
  }
}

// 获取图片URL
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `https://pay.itapgo.com${url.startsWith('/') ? '' : '/'}${url}`
}

// 获取预览图片列表
const getPreviewImages = (row) => {
  const images = []
  if (row.storefront_image) images.push(getImageUrl(row.storefront_image))
  if (row.water_location_image) images.push(getImageUrl(row.water_location_image))
  if (row.images && Array.isArray(row.images)) {
    row.images.forEach(img => {
      if (img !== row.storefront_image && img !== row.water_location_image) {
        images.push(getImageUrl(img))
      }
    })
  }
  return images
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'active': 'success',
    'inactive': 'warning',
    'maintenance': 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'active': '正常营业',
    'inactive': '暂停营业',
    'maintenance': '维护中'
  }
  return statusMap[status] || '未知状态'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 在地图上查看位置
const showLocationOnMap = (row) => {
  if (!row.latitude || !row.longitude) {
    ElMessage.warning('该取水点没有位置信息')
    return
  }
  
  viewMapDialogVisible.value = true
  nextTick(() => {
    initViewMap(row)
  })
}

// 初始化查看地图
const initViewMap = (waterPoint) => {
  if (isAmapAvailable()) {
    createViewMap(waterPoint)
      } else {
    loadTencentMapScript().then(() => {
      createViewMap(waterPoint)
    })
  }
}

// 创建查看地图
const createViewMap = (waterPoint) => {
  const center = [parseFloat(waterPoint.longitude), parseFloat(waterPoint.latitude)]
  
  const viewMap = new window.AMap.Map('view-map', {
    center: center,
    zoom: 15,
    mapStyle: 'amap://styles/normal'
  })
  
  // 添加标记
  new window.AMap.Marker({
    position: center,
    map: viewMap
  })
  
  // 添加信息窗口
  const infoWindow = new window.AMap.InfoWindow({
    content: `
      <div style="padding: 10px;">
        <h4>${waterPoint.name}</h4>
        <p>${waterPoint.address}</p>
        <p>联系人：${waterPoint.contact_person}</p>
        <p>电话：${waterPoint.contact_phone}</p>
      </div>
    `
  })
  
  infoWindow.open(viewMap, center)
}

// 标签相关方法
const removeTag = (tag) => {
  form.tags.splice(form.tags.indexOf(tag), 1)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value.input.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !form.tags.includes(inputValue.value)) {
    form.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 页面加载时获取数据
onMounted(() => {
  fetchWaterPoints()
})
</script>

<style scoped>
.water-points-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 32px;
  margin-right: 15px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.point-info {
  line-height: 1.5;
}

.point-name {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.point-address {
  color: #606266;
  font-size: 13px;
  margin-bottom: 3px;
}

.point-contact {
  color: #909399;
  font-size: 12px;
}

.image-preview {
  display: flex;
  gap: 8px;
  align-items: center;
}

.image-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-label {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  text-align: center;
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}

.location-info {
  font-size: 12px;
  line-height: 1.4;
}

.pagination-section {
  margin-top: 20px;
  text-align: right;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.coordinate-section {
  width: 100%;
}

.coordinate-info {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coordinate-text {
  font-size: 13px;
  color: #409eff;
}

.image-upload-section {
  width: 100%;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 200px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader:hover {
  border-color: #409eff;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  text-align: center;
  color: #8c939d;
}

.upload-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
}

.additional-images-uploader {
  width: 100%;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.tag-input {
  width: 78px;
  margin-left: 10px;
  vertical-align: bottom;
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.map-selector {
  width: 100%;
}

.map-search {
  margin-bottom: 10px;
}

.selected-location {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-location p {
  margin: 5px 0;
  font-size: 14px;
}
</style> 
