<template>
  <div class="api-management-container">
    <!-- 顶部标题区域 -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-area">
          <div class="main-title">
            <span class="title-icon">🚀</span>
            <h1>API接口管理中心</h1>
            <span class="beta-badge">Pro</span>
          </div>
          <p class="subtitle">智能管理和监控点点够系统中的所有API接口，实时统计与性能分析</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Refresh" @click="refreshApiList" :loading="loading">
            刷新数据
          </el-button>
          <el-button type="success" :icon="Download" @click="exportApiList">
            导出Excel
          </el-button>
          <el-button type="info" :icon="Reading" @click="showApiDocumentation">
            API文档
          </el-button>
        </div>
      </div>
    </div>



    <!-- 筛选工具栏 -->
    <div class="filter-section">
      <div class="filter-header">
        <div class="filter-title">
          <h3>{{ getTabTitle() }}</h3>
          <span class="filter-count">共 {{ filteredApiList.length }} 个接口</span>
        </div>
        <div class="filter-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索API路径、方法、描述、控制器..."
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
            <el-option label="按路径排序" value="path" />
            <el-option label="按方法排序" value="method" />
            <el-option label="按类型排序" value="type" />
            <el-option label="按模块排序" value="module" />
          </el-select>
          <el-button-group class="view-toggle">
            <el-button 
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              :icon="List"
            >
              列表视图
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : 'default'"
              @click="viewMode = 'card'"
              :icon="Reading"
            >
              卡片视图
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <!-- API分类标签 -->
      <div class="filter-tabs">
        <div class="tab-list">
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'all'}"
            @click="switchTab('all')"
          >
            <span class="tab-icon">🌐</span>
            <span class="tab-label">全部接口</span>
            <span class="tab-count">{{ apiStats.total || 0 }}</span>
          </div>
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'admin'}"
            @click="switchTab('admin')"
          >
            <span class="tab-icon">⚙️</span>
            <span class="tab-label">管理后台</span>
            <span class="tab-count">{{ apiStats.admin || 0 }}</span>
          </div>
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'mobile'}"
            @click="switchTab('mobile')"
          >
            <span class="tab-icon">📱</span>
            <span class="tab-label">手机端</span>
            <span class="tab-count">{{ apiStats.mobile || 0 }}</span>
          </div>
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'app'}"
            @click="switchTab('app')"
          >
            <span class="tab-icon">📲</span>
            <span class="tab-label">APP端</span>
            <span class="tab-count">{{ apiStats.app || 0 }}</span>
          </div>
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'branch'}"
            @click="switchTab('branch')"
          >
            <span class="tab-icon">🏢</span>
            <span class="tab-label">分支机构</span>
            <span class="tab-count">{{ apiStats.branch || 0 }}</span>
          </div>
          <div 
            class="tab-item" 
            :class="{active: activeTab === 'legacy'}"
            @click="switchTab('legacy')"
          >
            <span class="tab-icon">📄</span>
            <span class="tab-label">存量原生</span>
            <span class="tab-count">{{ apiStats.legacy || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- API列表展示区 -->
    <div class="api-content">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table 
          :data="paginatedApiList" 
          v-loading="loading"
          element-loading-text="正在加载API数据..."
          stripe
          border
          style="width: 100%"
          :default-sort="{prop: 'path', order: 'ascending'}"
        >
          <el-table-column prop="method" label="请求方法" width="100" align="center">
            <template #default="{row}">
              <el-tag 
                :type="getMethodTagType(row.method)"
                size="small"
                effect="dark"
              >
                {{ row.method }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="path" label="API路径" min-width="300">
            <template #default="{row}">
              <div class="api-path">
                <code class="path-code">{{ row.path }}</code>
                <el-tag v-if="row.module" size="small" type="info" class="module-tag">
                  {{ row.module }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="接口描述" min-width="200">
            <template #default="{row}">
              <span class="api-description">
                {{ row.description || '暂无描述' }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="API类型" width="120" align="center">
            <template #default="{row}">
              <el-tag 
                :type="getTypeTagType(row.type)"
                size="small"
              >
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="controller" label="控制器" width="180">
            <template #default="{row}">
              <span class="controller-name">{{ row.controller || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{row}">
              <el-button-group size="small">
                <el-button 
                  type="primary" 
                  :icon="View" 
                  @click="handleShowDetail(row)"
                  size="small"
                >
                  详情
                </el-button>
                <el-button 
                  type="success" 
                  :icon="Promotion" 
                  @click="handleTestApi(row)"
                  size="small"
                >
                  测试
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <div class="api-cards">
          <div 
            v-for="api in paginatedApiList" 
            :key="api.id || api.path"
            class="api-card"
            @click="handleShowDetail(api)"
          >
            <div class="card-header">
              <div class="method-badge">
                <el-tag 
                  :type="getMethodTagType(api.method)"
                  size="small"
                  effect="dark"
                >
                  {{ api.method }}
                </el-tag>
              </div>
              <div class="card-actions">
                <el-button 
                  type="text" 
                  :icon="Promotion" 
                  @click.stop="handleTestApi(api)"
                  size="small"
                >
                  测试
                </el-button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="api-path">
                <code>{{ api.path }}</code>
              </div>
              <div class="api-description">
                {{ api.description || '暂无描述' }}
              </div>
              <div class="api-meta">
                <el-tag 
                  :type="getTypeTagType(api.type)"
                  size="small"
                >
                  {{ getTypeLabel(api.type) }}
                </el-tag>
                <span v-if="api.module" class="module-info">
                  模块: {{ api.module }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && filteredApiList.length === 0"
        description="暂无API数据"
        :image-size="120"
      >
        <el-button type="primary" @click="refreshApiList">
          重新加载
        </el-button>
      </el-empty>
      
      <!-- 分页组件 -->
      <div v-if="!loading && paginatedApiList.length > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredApiList.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- API测试对话框 -->
    <ApiTestDialog
      v-model="testDialogVisible"
      :api="selectedApi"
      @close="testDialogVisible = false"
    />

    <!-- API详情对话框 -->
    <ApiDetailDialog
      v-model="detailDialogVisible"
      :api="selectedApi"
      @close="detailDialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Reading, Search, Filter, Setting, Cellphone, Monitor, OfficeBuilding, Document, View, Promotion } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const activeTab = ref('all')
const sortBy = ref('path')
const viewMode = ref('list')
const apiList = ref([])
const apiStats = ref({
  admin: 0,
  mobile: 0,
  app: 0,
  branch: 0,
  legacy: 0,
  total: 0
})

// 分页相关变量
const currentPage = ref(1)
const pageSize = ref(20)

// 已在上面声明的对话框状态变量

// 计算属性
const filteredApiList = computed(() => {
  let apis = apiList.value
  
  console.log('filteredApiList - 原始API数据:', apis.length, apis.slice(0, 3))
  console.log('filteredApiList - 当前activeTab:', activeTab.value)
  
  // 按标签筛选
  if (activeTab.value !== 'all') {
    console.log('filteredApiList - 开始按标签筛选')
    apis = apis.filter(api => {
      // 处理不同类型的映射
      const typeMap = {
        'admin': ['admin_v1', 'admin'],
        'mobile': ['mobile_v1', 'mobile', 'mobile_legacy'],
        'app': ['app_v1', 'app', 'app_legacy'],
        'branch': ['branch'],
        'legacy': ['legacy_php', 'legacy']
      }
      const result = typeMap[activeTab.value]?.includes(api.type)
      if (activeTab.value === 'mobile') {
        console.log('filteredApiList - mobile类型检查:', api.type, result, api.path)
      }
      return result
    })
    console.log('filteredApiList - 筛选后数据:', apis.length, apis.slice(0, 3))
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    apis = apis.filter(api => 
      api.path.toLowerCase().includes(keyword) ||
      api.method.toLowerCase().includes(keyword) ||
      (api.description && api.description.toLowerCase().includes(keyword)) ||
      (api.controller && api.controller.toLowerCase().includes(keyword)) ||
      (api.module && api.module.toLowerCase().includes(keyword))
    )
  }
  
  // 排序
  apis.sort((a, b) => {
    switch (sortBy.value) {
      case 'method':
        return a.method.localeCompare(b.method)
      case 'type':
        return a.type.localeCompare(b.type)
      case 'module':
        return (a.module || '').localeCompare(b.module || '')
      default:
        return a.path.localeCompare(b.path)
    }
  })
  
  return apis
})

// 分页后的API列表
const paginatedApiList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredApiList.value.slice(start, end)
})

// 标签切换
const switchTab = (tab) => {
  activeTab.value = tab
  currentPage.value = 1 // 切换标签时重置到第一页
}

// 此函数已在下方声明，避免重复

// 显示API文档
const showApiDocumentation = () => {
  ElMessageBox.alert(`
    <div style="text-align: left; line-height: 1.6;">
      <h3>🚀 API管理模块说明</h3>
      <p>本模块集成了点点够系统的所有API接口，包括：</p>
      
      <h4>🖥️ 管理后台API (Admin)</h4>
      <p><strong>路径前缀:</strong> /api/admin/v1/</p>
      <p><strong>认证方式:</strong> auth:admin-api guard + JWT Token</p>
      <p><strong>主要用途:</strong> 管理后台功能，包括用户管理、设备管理、分支机构管理等</p>
      
      <h4>📱 手机端API (Mobile)</h4>
      <p><strong>路径前缀:</strong> /api/mobile/v1/</p>
      <p><strong>认证方式:</strong> auth:sanctum + JWT Token</p>
      <p><strong>主要用途:</strong> 微信公众号H5页面，VIP系统、取水点管理等</p>
      
      <h4>📲 APP端API (App)</h4>
      <p><strong>路径前缀:</strong> /api/app/v1/</p>
      <p><strong>认证方式:</strong> auth:sanctum + JWT Token</p>
      <p><strong>主要用途:</strong> iOS/Android原生APP，业务中心、积分商城等</p>
      
      <h4>🏢 分支机构API (Branch)</h4>
      <p><strong>路径前缀:</strong> /api/branch/</p>
      <p><strong>认证方式:</strong> 自定义Token验证</p>
      <p><strong>主要用途:</strong> 分支机构专用接口，业务员管理、签到系统等</p>
      
      <h4>🔧 存量原生API (Legacy)</h4>
      <p><strong>路径前缀:</strong> /api/ (直接访问PHP文件)</p>
      <p><strong>认证方式:</strong> 自定义Token验证</p>
      <p><strong>主要用途:</strong> 历史遗留接口，正在逐步迁移到Laravel RESTful</p>
    </div>
  `, 'API架构文档', {
    dangerouslyUseHTMLString: true,
    customClass: 'api-doc-dialog'
  })
}

// 方法
const loadApiList = async () => {
  loading.value = true
  try {
    console.log('开始加载API数据...')
    
    // 使用与独立页面相同的逻辑
    const token = getToken()
    if (!token) {
      throw new Error('未找到认证token，请重新登录')
    }
    
    const response = await fetch('/api/admin/v1/api-management', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('API响应状态:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('API返回数据:', result)
    
    if (result.code !== 200) {
      throw new Error(result.message || '获取API列表失败')
    }
    
    // 使用与独立页面相同的数据处理逻辑
    const allApis = []
    const data = result.data
    
    console.log('开始处理API数据，grouped数据:', data.grouped)
    
    if (data.grouped) {
      // 处理各类型API - 修复对象格式数据处理
      Object.keys(data.grouped).forEach(type => {
        const typeData = data.grouped[type]
        if (typeData) {
          console.log(`处理${type}类型API，数据类型:`, typeof typeData, '数量:', Array.isArray(typeData) ? typeData.length : Object.keys(typeData).length)
          
          // 支持数组和对象两种格式
          if (Array.isArray(typeData)) {
            // 数组格式处理
            typeData.forEach((api, index) => {
              allApis.push({
                id: `${type}_${index}`,
                name: api.name || api.path,
                path: api.path,
                method: Array.isArray(api.methods) ? api.methods[0] : (api.method || 'GET'),
                controller: api.controller || '',
                description: api.description || '',
                type: api.type || type,
                module: api.module || '',
                status: api.status || 'active',
                middleware: api.middleware || [],
                parameters: api.parameters || [],
                full_url: api.full_url || ''
              })
            })
          } else if (typeof typeData === 'object') {
            // 对象格式处理
            Object.keys(typeData).forEach((key, index) => {
              const api = typeData[key]
              allApis.push({
                id: `${type}_${key}`,
                name: api.name || api.path,
                path: api.path,
                method: Array.isArray(api.methods) ? api.methods[0] : (api.method || 'GET'),
                controller: api.controller || '',
                description: api.description || '',
                type: api.type || type,
                module: api.module || '',
                status: api.status || 'active',
                middleware: api.middleware || [],
                parameters: api.parameters || [],
                full_url: api.full_url || ''
              })
            })
          }
        }
      })
    }
    
    console.log('API数据处理完成，总数量:', allApis.length)
    
    // 更新API列表和统计数据 - 使用与独立页面相同的逻辑
    apiList.value = allApis
    
    console.log('API统计数据:', data.summary)
    
    apiStats.value = {
      total: data.total || allApis.length,
      admin: data.summary?.admin_v1_count || 0,
      mobile: data.summary?.mobile_v1_count || 0,
      app: data.summary?.app_v1_count || 0,
      branch: data.summary?.branch_count || 0,  // 修复字段映射：branch_count 而不是 branch_v1_count
      legacy: data.summary?.legacy_php_count || 0
    }
    
    ElMessage.success(`成功加载 ${allApis.length} 个API接口`)
    
    } catch (error) {
      console.error('获取API列表失败:', error)
      ElMessage.error('获取API列表失败，使用备用数据')
      
      // 使用备用模拟数据
      const mockApis = [
      // 管理后台API
      {
        id: 1,
        name: '管理员登录',
        path: '/api/admin/v1/auth/login',
        method: 'POST',
        controller: 'AdminAuthController@login',
        description: '管理员账号密码登录',
        type: 'admin',
        module: '认证模块',
        status: 'active'
      },
      {
        id: 2,
        name: 'APP用户管理',
        path: '/api/admin/v1/app-users',
        method: 'GET',
        controller: 'AppUserController@index',
        description: '获取APP用户列表',
        type: 'admin',
        module: '用户管理',
        status: 'active'
      },
      {
        id: 3,
        name: '设备管理',
        path: '/api/admin/v1/tapp-devices',
        method: 'GET',
        controller: 'TappDeviceApiController@index',
        description: '获取设备列表',
        type: 'admin',
        module: '设备管理',
        status: 'active'
      },
      {
        id: 4,
        name: '分支机构管理',
        path: '/api/admin/v1/branch-organizations',
        method: 'GET',
        controller: 'BranchManagementController@index',
        description: '获取分支机构列表',
        type: 'admin',
        module: '机构管理',
        status: 'active'
      },
      
      // 手机端API
      {
        id: 5,
        name: 'VIP团队信息',
        path: '/api/mobile/v1/vip/team-info',
        method: 'GET',
        controller: 'VipController@getTeamInfo',
        description: '获取VIP团队信息',
        type: 'mobile',
        module: 'VIP系统',
        status: 'active'
      },
      {
        id: 6,
        name: '取水点列表',
        path: '/api/mobile/v1/water-points',
        method: 'GET',
        controller: 'WaterPointController@index',
        description: '获取取水点列表',
        type: 'mobile',
        module: '取水点管理',
        status: 'active'
      },
      {
        id: 7,
        name: '用户认证',
        path: '/api/mobile/v1/auth/user-info',
        method: 'GET',
        controller: 'AuthController@getUserInfo',
        description: '获取用户认证信息',
        type: 'mobile',
        module: '认证模块',
        status: 'active'
      },
      
      // APP端API
      {
        id: 8,
        name: '业务中心',
        path: '/api/app/v1/business-center',
        method: 'GET',
        controller: 'BusinessCenterController@index',
        description: '业务中心数据',
        type: 'app',
        module: '业务中心',
        status: 'active'
      },
      {
        id: 9,
        name: '积分信息',
        path: '/api/app/v1/points/user',
        method: 'GET',
        controller: 'PointController@getUserPoints',
        description: '获取用户积分信息',
        type: 'app',
        module: '积分系统',
        status: 'active'
      },
      
      // 存量原生API
      {
        id: 10,
        name: '分支签到',
        path: '/api/branch/check_in.php',
        method: 'POST',
        controller: 'check_in.php',
        description: '分支机构签到接口',
        type: 'legacy',
        module: '签到系统',
        status: 'active'
      },
      {
        id: 11,
        name: '业务员信息',
        path: '/api/salesman/info.php',
        method: 'GET',
        controller: 'info.php',
        description: '获取业务员信息',
        type: 'legacy',
        module: '业务员管理',
        status: 'active'
      },
      {
        id: 12,
        name: '安装预约',
        path: '/api/installation/create_booking.php',
        method: 'POST',
        controller: 'create_booking.php',
        description: '创建安装预约',
        type: 'legacy',
        module: '安装服务',
        status: 'active'
      }
      ]
      
      apiList.value = mockApis
      
      // 计算统计数据
      apiStats.value = {
        total: mockApis.length,
        admin: mockApis.filter(api => api.type === 'admin').length,
        mobile: mockApis.filter(api => api.type === 'mobile').length,
        app: mockApis.filter(api => api.type === 'app').length,
        legacy: mockApis.filter(api => api.type === 'legacy').length
      }
    } finally {
      loading.value = false
    }
  }

// 方法定义
const refreshApiList = () => {
  loadApiList()
}

// 分页处理函数
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleTestApi = (api) => {
  selectedApi.value = api
  testDialogVisible.value = true
}

const handleShowDetail = (api) => {
  selectedApi.value = api
  detailDialogVisible.value = true
}

// 计算进度条宽度百分比
const getProgressWidth = (type) => {
  if (!apiStats.value.total || apiStats.value.total === 0) {
    return 0
  }
  const count = apiStats.value[type] || 0
  return Math.round((count / apiStats.value.total) * 100)
}

// 获取进度条文本
const getProgressText = (type) => {
  const count = apiStats.value[type] || 0
  const percentage = getProgressWidth(type)
  return `${count} (${percentage}%)`
}

// 获取标签标题
const getTabTitle = () => {
  const titles = {
    all: '全部API接口',
    admin: '管理后台API',
    mobile: '手机端API',
    app: 'APP端API',
    branch: '分支机构API',
    legacy: '存量原生API'
  }
  return titles[activeTab.value] || '全部API接口'
}

// 获取方法标签类型
const getMethodTagType = (method) => {
  const typeMap = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  }
  return typeMap[method?.toUpperCase()] || 'info'
}

// 获取API类型标签类型
const getTypeTagType = (type) => {
  const typeMap = {
    'admin_v1': 'primary',
    'admin': 'primary',
    'mobile_v1': 'success',
    'mobile': 'success',
    'mobile_legacy': 'success',
    'app_v1': 'warning',
    'app': 'warning',
    'app_legacy': 'warning',
    'branch': 'info',
    'legacy_php': 'danger',
    'legacy': 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取API类型标签文本
const getTypeLabel = (type) => {
  const labelMap = {
    'admin_v1': '管理后台',
    'admin': '管理后台',
    'mobile_v1': '手机端',
    'mobile': '手机端',
    'mobile_legacy': '手机端(旧)',
    'app_v1': 'APP端',
    'app': 'APP端',
    'app_legacy': 'APP端(旧)',
    'branch': '分支机构',
    'legacy_php': '原生PHP',
    'legacy': '存量API'
  }
  return labelMap[type] || type
}

const exportApiList = () => {
  ElMessageBox.confirm(
    '确定要导出API列表吗？',
    '确认导出',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 导出逻辑
    const csvContent = generateCSV(apiList.value)
    downloadCSV(csvContent, 'api-list.csv')
    ElMessage.success('导出成功')
  }).catch(() => {
    // 用户取消
  })
}

const generateCSV = (data) => {
  const headers = ['类型', '名称', '路径', '方法', '控制器', '描述', '完整URL']
  const rows = data.map(api => [
    api.type,
    api.name,
    api.path,
    Array.isArray(api.methods) ? api.methods.join('|') : api.methods,
    api.controller,
    api.description,
    api.full_url
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  return csvContent
}

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 生命周期
onMounted(() => {
  loadApiList()
})
</script>

<style scoped>
/* 基础布局样式 */
.api-management-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 兼容旧版本样式 */
.api-management {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
}

.header-subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  max-width: 1200px;
}

.stat-card {
  border-radius: 12px;
  padding: 18px;
  color: white;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(15px);
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 16px;
  z-index: 1;
}

.stat-card > * {
  position: relative;
  z-index: 2;
}

.stat-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:active {
  transform: translateY(-2px) scale(1.01);
}

/* 统计卡片背景色 */
.stat-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.mobile {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.app {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card.branch {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card.legacy {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #374151;
}

/* 卡片内容样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(255, 255, 255, 0.25);
}

.card-trend {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.card-body {
  flex: 1;
}

.card-body h3 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 6px 0;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover .card-body h3 {
  transform: scale(1.03);
}

.card-body p {
  font-size: 13px;
  margin: 0;
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-section {
  margin-top: 16px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%);
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 筛选工具栏样式 */
.filter-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
}

.filter-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 320px;
}

.sort-select {
  width: 160px;
}

.view-toggle .el-button {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 500;
}

/* API分类标签样式 */
.filter-tabs {
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

.tab-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  color: #64748b;
  user-select: none;
}

.tab-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.tab-item.active {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-size: 14px;
  font-weight: 600;
}

.tab-count {
  background: #e2e8f0;
  color: #475569;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  min-width: 22px;
  text-align: center;
  line-height: 1;
}

.tab-item.active .tab-count {
  background: #3b82f6;
  color: white;
}

/* API列表样式 */
.api-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.list-view {
  padding: 0;
}

.api-path {
  display: flex;
  align-items: center;
  gap: 8px;
}

.path-code {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #374151;
}

.module-tag {
  margin-left: 8px;
}

.api-description {
  color: #6b7280;
  font-size: 14px;
}

.controller-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #6b7280;
}

/* 卡片视图样式 */
.card-view {
  padding: 24px;
}

.api-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.api-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.api-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.api-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.method-badge {
  flex-shrink: 0;
}

.card-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.api-card:hover .card-actions {
  opacity: 1;
}

.api-card .card-body {
  color: inherit;
}

.api-card .api-path {
  margin-bottom: 12px;
}

.api-card .api-path code {
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #1f2937;
  display: block;
  word-break: break-all;
}

.api-card .api-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  min-height: 42px;
}

.api-card .api-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.module-info {
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
  
  .api-cards {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .api-management {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .filter-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .api-cards {
    grid-template-columns: 1fr;
  }
  
  .tab-list {
    justify-content: center;
  }
}

/* 动画效果 */
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

.stat-card {
  animation: fadeInUp 0.6s ease forwards;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }
.stat-card:nth-child(5) { animation-delay: 0.5s; }
.stat-card:nth-child(6) { animation-delay: 0.6s; }

/* Element Plus 组件样式覆盖 */
.el-table {
  border-radius: 0;
}

.el-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

.el-table td {
  padding: 16px 12px;
}

.el-button-group .el-button {
  border-radius: 8px;
}

.el-button-group .el-button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.el-button-group .el-button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.el-input__wrapper {
  border-radius: 8px;
}

.el-select .el-input__wrapper {
  border-radius: 8px;
}

/* 分页组件样式 */
.pagination-section {
  padding: 24px;
  display: flex;
  justify-content: center;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.el-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: #f8fafc;
  --el-pagination-text-color: #64748b;
  --el-pagination-border-radius: 8px;
}

.el-pagination .btn-next,
.el-pagination .btn-prev {
  border-radius: 8px;
}

.el-pagination .el-pager li {
  border-radius: 8px;
  margin: 0 2px;
}

.el-pagination .el-pager li.is-active {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
</style>