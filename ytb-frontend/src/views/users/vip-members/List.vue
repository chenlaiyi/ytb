<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>CP会员管理</h2>
        <p class="page-description">管理和查看所有CP会员信息</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" size="large" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- CP会员模块导航标签页 -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="vip-tabs">
        <el-tab-pane label="CP会员列表" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              CP会员列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP分红管理" name="dividends">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              CP分红管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP排行榜" name="rankings">
          <template #label>
            <span class="tab-label">
              <el-icon><Trophy /></el-icon>
              CP排行榜
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP余额管理" name="balance">
          <template #label>
            <span class="tab-label">
              <el-icon><Wallet /></el-icon>
              CP余额管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP等级管理" name="levels">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              CP等级管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="CP统计分析" name="statistics">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              CP统计分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>CP会员列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计面板 -->
      <div class="stats-panel mb-4">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <el-icon class="stats-icon"><User /></el-icon>
                  <span>CP会员总数</span>
                </div>
              </template>
              <div class="stats-value primary">{{ stats.total_vip || 0 }}人</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <el-icon class="stats-icon"><TrendCharts /></el-icon>
                  <span>本月新增</span>
                </div>
              </template>
              <div class="stats-value success">{{ stats.month_new_vip || 0 }}人</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <el-icon class="stats-icon"><Calendar /></el-icon>
                  <span>上月新增</span>
                </div>
              </template>
              <div class="stats-value info">{{ stats.last_month_new_vip || 0 }}人</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stats-card">
              <template #header>
                <div class="stats-header">
                  <el-icon class="stats-icon"><Money /></el-icon>
                  <span>总余额</span>
                </div>
              </template>
              <div class="stats-value warning">{{ formatCurrency(stats.total_balance) }}元</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索区域 -->
      <div class="search-box mb-4">
        <el-input
          v-model="searchQuery"
          placeholder="输入用户名、手机号或ID搜索"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="userList"
        border
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="ID" prop="id" width="80" align="center" />
        
        <el-table-column label="用户信息" min-width="220">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="50" :src="scope.row.wechat_avatar || scope.row.avatar || defaultAvatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">
                  <span class="real-name">{{ scope.row.name || '未设置姓名' }}</span>
                </div>
                <div class="user-nickname">
                  <el-icon class="wechat-icon"><ChatDotRound /></el-icon>
                  {{ scope.row.nickname || '未设置微信昵称' }}
                </div>
                <div class="user-mobile">
                  <el-icon class="phone-icon"><Phone /></el-icon>
                  {{ scope.row.mobile || scope.row.phone || '未绑定手机' }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账户余额" width="120" align="right">
          <template #default="scope">
            <span class="balance">{{ formatCurrency(scope.row.balance) }}元</span>
          </template>
        </el-table-column>

        <el-table-column label="推荐人" width="150">
          <template #default="scope">
            <div v-if="scope.row.referrer_id">
              <div class="referrer-name">{{ scope.row.referrer_name || '未知' }}</div>
              <small class="text-muted">ID: {{ scope.row.referrer_id }}</small>
            </div>
            <span v-else class="text-muted">无推荐人</span>
          </template>
        </el-table-column>

        <el-table-column label="团队数据" width="200" align="center">
          <template #default="scope">
            <div class="team-stats">
              <div class="team-item">
                <span class="team-label">直推CP:</span>
                <span class="team-value primary">{{ scope.row.direct_vip_count }}</span>
              </div>
              <div class="team-item">
                <span class="team-label">团队CP:</span>
                <span class="team-value success">{{ scope.row.team_vip_count }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="本月新增" width="150" align="center">
          <template #default="scope">
            <div class="month-stats">
              <div class="month-item">
                <span class="month-label">直推:</span>
                <span class="month-value">{{ scope.row.month_direct_vip }}</span>
              </div>
              <div class="month-item">
                <span class="month-label">团队:</span>
                <span class="month-value">{{ scope.row.month_team_vip }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="上月新增" width="150" align="center">
          <template #default="scope">
            <div class="month-stats">
              <div class="month-item">
                <span class="month-label">直推:</span>
                <span class="month-value">{{ scope.row.last_month_direct_vip }}</span>
              </div>
              <div class="month-item">
                <span class="month-label">团队:</span>
                <span class="month-value">{{ scope.row.last_month_team_vip }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="CP时间" width="200" align="center">
          <template #default="scope">
            <div class="vip-time-info">
              <div class="vip-time-item">
                <span class="time-label">成为CP:</span>
                <span class="time-value">{{ formatDate(scope.row.vip_at) }}</span>
              </div>
              <div class="vip-time-item">
                <span class="time-label">完款时间:</span>
                <span class="time-value">{{ formatDate(scope.row.vip_paid_at) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" width="180" align="center">
          <template #default="scope">
            <div class="time-info">
              {{ formatDate(scope.row.created_at) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="150" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewDetail(scope.row)"
              link
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="showTeamTree(scope.row)"
              link
            >
              <el-icon><UserFilled /></el-icon>
              团队
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-if="total > 0"
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 团队关系树弹窗 -->
    <el-dialog
      v-model="teamDialogVisible"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog-header-custom">
          <span :id="titleId" :class="titleClass">
            {{ `${currentUser?.nickname || currentUser?.name}的团队关系树` }}
          </span>
          <div class="header-actions">
            <!-- 时间选择器 -->
            <el-select 
              v-model="selectedTimeRange" 
              placeholder="选择时间范围" 
              size="small" 
              style="width: 120px; margin-right: 10px;"
              @change="handleTimeRangeChange"
            >
              <el-option label="所有" value="all" />
              <el-option label="本月" value="current_month" />
              <el-option label="上月" value="last_month" />
            </el-select>
            <el-button
              type="primary"
              size="small"
              :loading="saveImageLoading"
              @click="saveAsImage"
            >
              <el-icon><Camera /></el-icon>
              保存为图片
            </el-button>
            <el-button
              type="info"
              size="small"
              circle
              @click="close"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      <div v-loading="teamLoading" class="team-dialog-content" ref="teamTreeContainer">
        <!-- 团队统计面板 -->
        <div v-if="teamStats" class="team-stats-panel mb-4">
          <el-row :gutter="15">
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value primary">{{ teamStats.total_members }}</div>
                  <div class="stat-label">团队总人数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value info">{{ teamStats.month_new_vip }}</div>
                  <div class="stat-label">本月新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value danger">{{ teamStats.last_month_new_vip }}</div>
                  <div class="stat-label">上月新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="team-stat-card">
                <div class="stat-item">
                  <div class="stat-value purple">{{ teamStats.max_level }}</div>
                  <div class="stat-label">最大层级</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 团队关系树可视化 -->
        <TeamTreeVisualization
          :root-user="currentUser"
          :team-members="teamMembers"
          @node-click="handleNodeClick"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, 
  Refresh, 
  User, 
  TrendCharts, 
  Calendar, 
  Money, 
  View, 
  UserFilled,
  ChatDotRound,
  Phone,
  Trophy,
  Wallet,
  Star,
  DataAnalysis,
  Camera,
  Close,
  ArrowDown,
  Picture
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import html2canvas from 'html2canvas';
import TeamTreeVisualization from '@/components/TeamTreeVisualization.vue';

// 路由
const router = useRouter();

const LEGACY_USER_API_BASE = '/Tapp/admin/api/user';

const buildLegacyUserApiUrl = (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${LEGACY_USER_API_BASE}/${normalizedEndpoint}`;
};

// 状态数据
const loading = ref(false);
const userList = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const searchQuery = ref('');
const defaultAvatar = '/admin/images/default-avatar.png';

// CP会员模块导航标签页
const activeTab = ref('list');

// 统计数据
const stats = reactive({
  total_vip: 0,
  month_new_vip: 0,
  last_month_new_vip: 0,
  total_balance: 0
});

// 团队关系树相关状态
const teamDialogVisible = ref(false);
const teamLoading = ref(false);
const currentUser = ref(null);
const rootUser = ref(null);
const teamMembers = ref([]);
const teamTreeContainer = ref(null);
const saveImageLoading = ref(false);
const teamStats = ref(null);
const selectedTimeRange = ref('all');

// 获取CP会员列表
async function getVipList() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value
    };
    
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    
    const response = await axios.get(buildLegacyUserApiUrl('vip_list.php'), { params });
    
    if (response.data.code === 0) {
      userList.value = response.data.data.list || [];
      total.value = response.data.data.total || 0;
      
      // 更新统计数据
      if (response.data.data.stats) {
        Object.assign(stats, response.data.data.stats);
      }
    } else {
      ElMessage.error(response.data.message || '获取CP会员列表失败');
    }
  } catch (error) {
    console.error('获取CP会员列表失败:', error);
    ElMessage.error('获取CP会员列表失败');
  } finally {
    loading.value = false;
  }
}

// 初始化
onMounted(() => {
  getVipList();
});

// 搜索处理
const handleSearch = () => {
  page.value = 1;
  getVipList();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  limit.value = size;
  page.value = 1;
  getVipList();
};

// 处理页码变化
const handleCurrentChange = (currentPage) => {
  page.value = currentPage;
  getVipList();
};

// 刷新数据
const refreshData = () => {
  getVipList();
};

// 格式化金额
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  if (rowIndex % 2 === 1) {
    return 'warning-row';
  }
  return '';
};

// 查看用户详情
const viewDetail = (user) => {
  ElMessageBox.alert(
    `用户ID: ${user.id}\n昵称: ${user.nickname || user.name || '未设置'}\n手机号: ${user.mobile || user.phone || '未绑定'}\n余额: ${formatCurrency(user.balance)}元\n直推CP: ${user.direct_vip_count}人\n团队CP: ${user.team_vip_count}人\n成为CP时间: ${formatDate(user.vip_at)}\nCP完款时间: ${formatDate(user.vip_paid_at)}`,
    '用户详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  );
};

// 显示团队关系树
const showTeamTree = async (user) => {
  currentUser.value = user;
  teamDialogVisible.value = true;
  selectedTimeRange.value = 'all'; // 重置时间范围为默认值
  await loadTeamData(user.id);
};

// 加载团队数据
const loadTeamData = async (userId) => {
  teamLoading.value = true;
  
  try {
    const params = {
      user_id: userId
    };
    
    // 根据时间范围添加参数
    if (selectedTimeRange.value !== 'all') {
      params.time_range = selectedTimeRange.value;
    }
    
    const response = await axios.get(buildLegacyUserApiUrl('vip_team.php'), {
      params
    });
    
    if (response.data.code === 0) {
      const data = response.data.data;
      
      // 处理根用户头像字段映射
      const processedUser = {
        ...data.user,
        avatar: data.user?.wechat_avatar || data.user?.avatar || '/admin/public/images/default-avatar.png'
      };
      
      // 处理团队成员头像字段映射
      const processedMembers = (data.team_members || []).map(member => ({
        ...member,
        avatar: member.wechat_avatar || member.avatar || '/admin/public/images/default-avatar.png'
      }));

      teamMembers.value = processedMembers;
      teamStats.value = data.team_stats || null;
      rootUser.value = processedUser;
    } else {
      ElMessage.error(response.data.message || '获取团队数据失败');
    }
  } catch (error) {
    console.error('获取团队数据失败:', error);
    ElMessage.error('获取团队数据失败，请稍后重试');
  } finally {
    teamLoading.value = false;
  }
};

// 处理团队关系树展开/收起事件
const handleTreeToggle = (data) => {
};

// 保存为图片功能
const saveAsImage = async () => {
  if (!teamTreeContainer.value) {
    ElMessage.error('无法获取团队关系树容器');
    return;
  }

  saveImageLoading.value = true;
  
  try {
    console.log('=== 开始高质量保存图片流程 ===');
    
    // 验证html2canvas是否可用
    if (typeof html2canvas !== 'function') {
      console.error('❌ html2canvas不可用，类型:', typeof html2canvas);
      ElMessage.error('图片生成库未正确加载，请刷新页面重试');
      return;
    }
    
    console.log('✅ html2canvas已准备就绪，类型:', typeof html2canvas);
    
    // 获取团队关系树容器
    const container = teamTreeContainer.value;
    console.log('✅ 容器获取成功');
    
    // 添加截图优化样式类
    container.classList.add('capturing');
    
    // 预处理所有头像图片，确保显示
    const images = container.querySelectorAll('img');
    console.log(`📷 发现 ${images.length} 个图片元素`);
    
    // 预加载默认头像，确保在截图时可用
    const defaultAvatarPath = '/admin/public/images/default-avatar.png';
    const preloadImg = new Image();
    preloadImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      preloadImg.onload = () => {
        console.log('✅ 默认头像预加载成功');
        resolve();
      };
      preloadImg.onerror = () => {
        console.warn('⚠️ 默认头像加载失败，使用备用方案');
        resolve(); // 继续执行，不阻断流程
      };
      preloadImg.src = defaultAvatarPath;
      // 设置超时，避免无限等待
      setTimeout(resolve, 2000);
    });
    
    // 处理所有头像，确保跨域兼容
    const imagePromises = Array.from(images).map((img, index) => {
      return new Promise(async (resolve) => {
        const originalSrc = img.src;
        
        // 如果是微信头像，通过代理API获取
        if (originalSrc.includes('wx.qlogo.cn') || originalSrc.includes('thirdwx.qlogo.cn')) {
          console.log(`🔄 处理第 ${index + 1} 个微信头像`);
          
          try {
            // 调用代理API获取头像
            const proxyUrl = `${buildLegacyUserApiUrl('avatar_proxy.php')}?url=${encodeURIComponent(originalSrc)}`;
            const response = await fetch(proxyUrl);
            const result = await response.json();
            
            if (result.success && result.data_uri) {
              console.log(`✅ 微信头像代理成功，大小: ${Math.round(result.size / 1024)}KB`);
              img.src = result.data_uri;
              img.crossOrigin = 'anonymous';
              
              // 等待图片加载
              img.onload = () => resolve();
              img.onerror = () => {
                console.warn(`⚠️ 代理头像加载失败，使用默认头像`);
                img.src = defaultAvatarPath;
                resolve();
              };
              setTimeout(() => {
                console.warn(`⚠️ 代理头像加载超时，使用默认头像`);
                img.src = defaultAvatarPath;
                resolve();
              }, 3000);
            } else {
              console.warn(`⚠️ 微信头像代理失败，使用默认头像:`, result.error);
              img.src = defaultAvatarPath;
              img.crossOrigin = 'anonymous';
              resolve();
            }
          } catch (error) {
            console.warn(`⚠️ 微信头像代理异常，使用默认头像:`, error);
            img.src = defaultAvatarPath;
            img.crossOrigin = 'anonymous';
            resolve();
          }
        } else if (originalSrc.includes('http') && !originalSrc.includes(window.location.host)) {
          // 其他外部头像，替换为默认头像
          console.log(`🔄 替换第 ${index + 1} 个外部头像`);
          img.crossOrigin = 'anonymous';
          img.src = defaultAvatarPath;
          
          // 等待图片加载
          img.onload = () => resolve();
          img.onerror = () => resolve(); // 即使失败也继续
          setTimeout(resolve, 1000); // 超时保护
        } else {
          // 本地图片，设置跨域属性
          img.crossOrigin = 'anonymous';
          resolve();
        }
      });
    });
    
    // 等待所有图片处理完成
    await Promise.all(imagePromises);
    console.log('✅ 所有图片处理完成');
    
    // 等待DOM更新和样式应用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 获取容器实际尺寸
    const containerRect = container.getBoundingClientRect();
    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    
    // 计算最佳尺寸
    const actualWidth = Math.max(scrollWidth, containerRect.width, 800);
    const actualHeight = Math.max(scrollHeight, containerRect.height, 600);
    
    console.log('📏 容器尺寸分析:', { 
      scrollWidth, 
      scrollHeight, 
      rectWidth: containerRect.width, 
      rectHeight: containerRect.height,
      finalWidth: actualWidth,
      finalHeight: actualHeight
    });
    
    // 高质量配置
    const options = {
      backgroundColor: '#f5f7fa', // 匹配背景色
      scale: 2, // 高质量缩放
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      imageTimeout: 5000,
      removeContainer: false,
      logging: false,
      width: actualWidth,
      height: actualHeight,
      windowWidth: actualWidth,
      windowHeight: actualHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      // 优化渲染质量
      letterRendering: true,
      onclone: (clonedDoc) => {
        // 在克隆文档中确保样式正确应用
        const clonedContainer = clonedDoc.querySelector('.team-dialog-content');
        if (clonedContainer) {
          clonedContainer.style.maxHeight = 'none';
          clonedContainer.style.overflow = 'visible';
          clonedContainer.style.height = 'auto';
          
          // 确保所有卡片阴影正确显示
          const cards = clonedContainer.querySelectorAll('.team-stat-card, .root-node, .member-card');
          cards.forEach(card => {
            card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
          });
          
          // 确保头像正确显示
          const avatars = clonedContainer.querySelectorAll('img');
          avatars.forEach(avatar => {
            avatar.style.display = 'block';
            avatar.style.visibility = 'visible';
            avatar.style.opacity = '1';
          });
        }
      }
    };
    
    console.log('🎨 开始生成高质量canvas...');
    ElMessage.info('正在生成高质量图片，请稍候...');
    
    // 生成canvas
    const canvas = await html2canvas(container, options);
    console.log('✅ canvas生成成功，尺寸:', { width: canvas.width, height: canvas.height });
    
    // 移除截图样式类
    container.classList.remove('capturing');
    
    // 验证canvas有效性
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('生成的canvas无效或尺寸为0');
    }
    
    // 创建下载文件名
    const userName = currentUser.value?.nickname || currentUser.value?.name || '团队长';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `CP团队关系树_${userName}_${timestamp}.png`;
    
    console.log('📁 准备下载文件:', fileName);
    
    // 使用高质量PNG格式下载
    try {
      const dataURL = canvas.toDataURL('image/png', 1.0); // 最高质量
      console.log('✅ 高质量图片数据生成成功，大小:', Math.round(dataURL.length / 1024), 'KB');
      
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataURL;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('高质量图片保存成功！');
      console.log('✅ 高质量图片下载完成');
      
    } catch (downloadError) {
      console.error('❌ 下载失败:', downloadError);
      throw new Error('图片下载失败: ' + downloadError.message);
    }
    
  } catch (error) {
    console.error('❌ 保存图片失败详细信息:', error);
    console.error('❌ 错误堆栈:', error.stack);
    
    // 提供更详细的错误信息
    let errorMessage = '保存图片失败';
    if (error.message) {
      if (error.message.includes('html2canvas')) {
        errorMessage = '图片生成库错误，请刷新页面重试';
      } else if (error.message.includes('canvas')) {
        errorMessage = '图片生成失败，请检查浏览器兼容性';
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        errorMessage = '内存不足，请关闭其他标签页后重试';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = '生成超时，请尝试简化版保存';
      } else {
        errorMessage = `保存失败：${error.message}`;
      }
    }
    
    ElMessage.error(errorMessage);
    
  } finally {
    saveImageLoading.value = false;
    console.log('=== 保存图片流程结束 ===');
  }
};

// 处理CP会员模块导航标签页点击
const handleTabClick = (tab) => {
  const tabName = tab.props.name;
  
  // 根据标签页名称跳转到对应的路由
  switch (tabName) {
    case 'list':
      // 当前页面，不需要跳转
      break;
    case 'dividends':
      router.push({ name: 'VipDividends' });
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

// 查看团队信息（保留原有功能）
const viewTeam = (user) => {
  ElMessageBox.alert(
    `团队统计信息:\n\n直推CP数量: ${user.direct_vip_count}人\n团队CP数量: ${user.team_vip_count}人\n\n本月新增:\n- 直推CP: ${user.month_direct_vip}人\n- 团队CP: ${user.month_team_vip}人\n\n上月新增:\n- 直推CP: ${user.last_month_direct_vip}人\n- 团队CP: ${user.last_month_team_vip}人`,
    `${user.nickname || user.name}的团队信息`,
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  );
};

// 处理时间范围变化
const handleTimeRangeChange = async (value) => {
  if (currentUser.value) {
    await loadTeamData(currentUser.value.id);
  }
};

// 处理团队关系树节点点击
const handleNodeClick = (node) => {
  // 实现团队关系树节点点击的处理逻辑
};
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

/* 团队对话框样式 */
.team-dialog-content {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  min-height: 400px;
}

/* 团队统计面板样式 */
.team-stats-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.team-stat-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.team-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.warning { color: #E6A23C; }
.stat-value.info { color: #909399; }
.stat-value.danger { color: #F56C6C; }
.stat-value.purple { color: #722ED1; }

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 团队关系树样式 */
.team-tree-visualization {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

/* 最大层级信息样式 */
.max-level-info {
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
  border-radius: 6px;
  border: 1px solid #d1ecf1;
}

/* 截图时的优化样式 */
.capturing {
  position: static !important;
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  transform: none !important;
  width: auto !important;
  min-width: 800px !important;
}

.capturing .team-dialog-content {
  background: #f5f7fa !important;
  padding: 30px !important;
  border-radius: 12px !important;
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  width: auto !important;
  min-width: 800px !important;
}

.capturing .team-stats-panel {
  background: white !important;
  padding: 20px !important;
  border-radius: 12px !important;
  margin-bottom: 30px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e4e7ed !important;
}

.capturing .team-stat-card {
  background: white !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  transition: none !important;
}

.capturing .team-tree-visualization {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
  padding: 30px !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  border: 1px solid #e4e7ed !important;
}

.capturing .root-node {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 2px solid !important;
}

.capturing .member-card {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 2px solid !important;
}

.capturing img {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  border-radius: 50% !important;
  width: 35px !important;
  height: 35px !important;
  object-fit: cover !important;
}

.capturing .el-avatar {
  background: #f0f0f0 !important;
  border: 2px solid #e4e7ed !important;
}

/* 确保截图时文字清晰 */
.capturing * {
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}

/* CP会员模块导航标签页 */
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 团队弹窗样式 */
.team-dialog-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* 截图时的样式 */
.team-dialog-content.capturing {
  max-height: none !important;
  overflow: visible !important;
  height: auto !important;
}

/* 截图时团队关系树组件的样式 */
.team-dialog-content.capturing .team-tree-visualization {
  overflow: visible !important;
  min-height: auto !important;
  height: auto !important;
}

.team-stats-panel {
  margin-bottom: 20px;
}

.team-stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.team-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.info { color: #909399; }
.stat-value.danger { color: #f56c6c; }
.stat-value.purple { color: #9c27b0; }

.stat-label {
  font-size: 12px;
  color: #909399;
}

.max-level-info {
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
}

.max-level-info .el-tag {
  font-size: 13px;
  padding: 8px 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .team-stats-panel .el-col {
    margin-bottom: 10px;
  }
  
  .team-dialog-content {
    max-height: 75vh;
  }
}

.dialog-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-panel {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.stats-icon {
  font-size: 16px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
}

.stats-value.primary {
  color: #409EFF;
}

.stats-value.success {
  color: #67C23A;
}

.stats-value.info {
  color: #909399;
}

.stats-value.warning {
  color: #E6A23C;
}

.search-box {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.search-input {
  width: 400px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
}

.user-name {
  margin-bottom: 4px;
}

.real-name {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.user-nickname {
  font-size: 12px;
  color: #67C23A;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.wechat-icon {
  font-size: 12px;
  color: #67C23A;
}

.user-mobile {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.phone-icon {
  font-size: 12px;
  color: #909399;
}

.balance {
  font-weight: bold;
  color: #F56C6C;
  font-size: 14px;
}

.referrer-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.team-stats, .month-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.team-item, .month-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.team-label, .month-label {
  font-size: 12px;
  color: #606266;
}

.team-value {
  font-weight: bold;
  font-size: 13px;
}

.team-value.primary {
  color: #409EFF;
}

.team-value.success {
  color: #67C23A;
}

.month-value {
  font-weight: bold;
  font-size: 13px;
  color: #E6A23C;
}

.time-info {
  font-size: 12px;
  color: #606266;
}

.vip-time-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vip-time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 11px;
}

.time-label {
  color: #909399;
  font-size: 10px;
  margin-bottom: 1px;
}

.time-value {
  color: #303133;
  font-weight: 500;
  font-size: 11px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-table .warning-row) {
  background: #fdf6ec;
}

:deep(.el-table .warning-row:hover > td) {
  background-color: #faecd8 !important;
}
</style>
