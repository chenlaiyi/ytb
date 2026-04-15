<template>
  <div class="nav-manager">
    <van-nav-bar 
      title="导航管理" 
      left-arrow 
      @click-left="$router.back()" 
      fixed
    />
    
    <div class="content">
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="底部导航">
          <div class="tab-content">
            <div class="action-bar">
              <van-button type="primary" size="small" icon="plus" @click="showTabbarForm(null)">添加底部导航</van-button>
              <van-button plain type="primary" size="small" icon="replay" @click="fetchTabbarData">刷新</van-button>
            </div>
            
            <div class="preview-section">
              <div class="section-title">预览效果</div>
              <div class="tabbar-preview">
                <div 
                  v-for="item in tabbarItems.filter(i => i.status === 1)" 
                  :key="item.id"
                  class="tabbar-preview-item"
                >
                  <van-icon :name="item.icon" size="22" />
                  <div class="preview-item-text">{{ item.nav_name }}</div>
                </div>
              </div>
            </div>
            
            <van-cell-group inset title="底部导航列表">
              <van-cell 
                v-for="item in tabbarItems" 
                :key="item.id"
                class="nav-item-cell"
              >
                <template #title>
                  <div class="nav-item-title">
                    <van-icon :name="item.icon" class="nav-icon" />
                    <span>{{ item.nav_name }}</span>
                    <van-tag type="primary" v-if="item.highlight === 1" size="small" style="margin-left: 8px;">高亮</van-tag>
                  </div>
                </template>
                
                <template #label>
                  <div class="nav-item-info">
                    <div>ID: {{ item.nav_id }}</div>
                    <div>路径: {{ item.path }}</div>
                    <div>排序: {{ item.sort_order }}</div>
                    <div>状态: {{ item.status === 1 ? '启用' : '禁用' }}</div>
                  </div>
                </template>
                
                <template #right-icon>
                  <div class="action-buttons">
                    <van-button type="primary" size="small" plain @click="showTabbarForm(item)">编辑</van-button>
                    <van-button type="danger" size="small" plain @click="confirmDeleteTabbar(item)">删除</van-button>
                    <van-switch 
                      v-model="item.status" 
                      :checked-value="1" 
                      :unchecked-value="0"
                      size="24" 
                      @change="toggleTabbarStatus(item)"
                    />
                  </div>
                </template>
              </van-cell>
              
              <div v-if="tabbarItems.length === 0" class="empty-list">
                <van-empty description="暂无数据" />
                <van-button type="primary" size="small" @click="showTabbarForm(null)">添加底部导航</van-button>
              </div>
            </van-cell-group>
          </div>
        </van-tab>
        
        <van-tab title="首页导航">
          <div class="tab-content">
            <div class="action-bar">
              <van-button type="primary" size="small" icon="plus" @click="showHomeNavForm(null)">添加首页导航</van-button>
              <van-button plain type="primary" size="small" icon="replay" @click="fetchHomeNavData">刷新</van-button>
            </div>
            
            <div class="preview-section">
              <div class="section-title">预览效果</div>
              <div class="home-nav-preview">
                <div 
                  v-for="item in homeNavItems.filter(i => i.status === 1)" 
                  :key="item.id"
                  class="home-nav-preview-item"
                >
                  <van-icon :name="item.icon" size="28" />
                  <div class="preview-item-text">{{ item.title }}</div>
                </div>
              </div>
            </div>
            
            <van-cell-group inset title="首页导航列表">
              <van-cell 
                v-for="item in homeNavItems" 
                :key="item.id"
                class="nav-item-cell"
              >
                <template #title>
                  <div class="nav-item-title">
                    <van-icon :name="item.icon" class="nav-icon" />
                    <span>{{ item.title }}</span>
                  </div>
                </template>
                
                <template #label>
                  <div class="nav-item-info">
                    <div>链接类型: {{ item.link_type }}</div>
                    <div>链接地址: {{ item.link_url }}</div>
                    <div>排序: {{ item.sort_order }}</div>
                    <div>状态: {{ item.status === 1 ? '启用' : '禁用' }}</div>
                  </div>
                </template>
                
                <template #right-icon>
                  <div class="action-buttons">
                    <van-button type="primary" size="small" plain @click="showHomeNavForm(item)">编辑</van-button>
                    <van-button type="danger" size="small" plain @click="confirmDeleteHomeNav(item)">删除</van-button>
                    <van-switch 
                      v-model="item.status" 
                      :checked-value="1" 
                      :unchecked-value="0"
                      size="24" 
                      @change="toggleHomeNavStatus(item)"
                    />
                  </div>
                </template>
              </van-cell>
              
              <div v-if="homeNavItems.length === 0" class="empty-list">
                <van-empty description="暂无数据" />
                <van-button type="primary" size="small" @click="showHomeNavForm(null)">添加首页导航</van-button>
              </div>
            </van-cell-group>
          </div>
        </van-tab>
      </van-tabs>
    </div>
    
    <!-- 底部导航表单弹窗 -->
    <van-popup
      v-model:show="showTabbarPopup"
      position="bottom"
      round
      closeable
      :style="{ height: '80%' }"
    >
      <div class="popup-container">
        <div class="popup-title">{{ editingItem ? '编辑底部导航' : '添加底部导航' }}</div>
        
        <van-form @submit="submitTabbarForm">
          <van-cell-group inset>
            <van-field
              v-model="tabbarForm.nav_name"
              name="nav_name"
              label="导航名称"
              placeholder="请输入导航名称"
              :rules="[{ required: true, message: '请填写导航名称' }]"
            />
            
            <van-field
              v-model="tabbarForm.nav_id"
              name="nav_id"
              label="导航ID"
              placeholder="请输入导航ID"
              :disabled="!!editingItem"
              :rules="[{ required: true, message: '请填写导航ID' }]"
            />
            
            <van-field
              v-model="tabbarForm.path"
              name="path"
              label="路径"
              placeholder="请输入路径"
              :rules="[{ required: true, message: '请填写路径' }]"
            />
            
            <van-field name="icon" label="图标" :rules="[{ required: true, message: '请选择图标' }]">
              <template #input>
                <icon-selector v-model="tabbarForm.icon" placeholder="请选择图标" />
              </template>
            </van-field>
            
            <van-field name="highlight" label="是否高亮">
              <template #input>
                <van-switch v-model="tabbarForm.highlight" :checked-value="1" :unchecked-value="0" size="24" />
              </template>
            </van-field>
            
            <van-field name="badge_type" label="徽标类型">
              <template #input>
                <van-field
                  v-model="tabbarForm.badge_type"
                  placeholder="徽标类型（选填）"
                />
              </template>
            </van-field>
            
            <van-field
              v-model="tabbarForm.sort_order"
              name="sort_order"
              label="排序"
              type="digit"
              placeholder="排序值（越小越靠前）"
              :rules="[{ required: true, message: '请填写排序值' }]"
            />
            
            <van-field name="status" label="状态">
              <template #input>
                <van-switch v-model="tabbarForm.status" :checked-value="1" :unchecked-value="0" size="24" />
              </template>
            </van-field>
          </van-cell-group>
          
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              {{ editingItem ? '保存修改' : '添加导航' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 首页导航表单弹窗 -->
    <van-popup
      v-model:show="showHomeNavPopup"
      position="bottom"
      round
      closeable
      :style="{ height: '70%' }"
    >
      <div class="popup-container">
        <div class="popup-title">{{ editingItem ? '编辑首页导航' : '添加首页导航' }}</div>
        
        <van-form @submit="submitHomeNavForm">
          <van-cell-group inset>
            <van-field
              v-model="homeNavForm.title"
              name="title"
              label="标题"
              placeholder="请输入导航标题"
              :rules="[{ required: true, message: '请填写导航标题' }]"
            />
            
            <van-field name="icon" label="图标" :rules="[{ required: true, message: '请选择图标' }]">
              <template #input>
                <icon-selector v-model="homeNavForm.icon" placeholder="请选择图标" />
              </template>
            </van-field>
            
            <van-field
              v-model="homeNavForm.link_type"
              name="link_type"
              label="链接类型"
              placeholder="请选择链接类型"
              readonly
              is-link
              @click="showLinkTypePicker = true"
              :rules="[{ required: true, message: '请选择链接类型' }]"
            />
            
            <van-field
              v-model="homeNavForm.link_url"
              name="link_url"
              label="链接地址"
              placeholder="请输入链接地址"
              :rules="[{ required: true, message: '请填写链接地址' }]"
            />
            
            <van-field
              v-model="homeNavForm.sort_order"
              name="sort_order"
              label="排序"
              type="digit"
              placeholder="排序值（越小越靠前）"
              :rules="[{ required: true, message: '请填写排序值' }]"
            />
            
            <van-field name="status" label="状态">
              <template #input>
                <van-switch v-model="homeNavForm.status" :checked-value="1" :unchecked-value="0" size="24" />
              </template>
            </van-field>
          </van-cell-group>
          
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              {{ editingItem ? '保存修改' : '添加导航' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 链接类型选择器 -->
    <van-popup v-model:show="showLinkTypePicker" position="bottom" round>
      <van-picker
        show-toolbar
        title="选择链接类型"
        :columns="linkTypeColumns"
        @confirm="onLinkTypeConfirm"
        @cancel="showLinkTypePicker = false"
      />
    </van-popup>
    
    <!-- 删除确认对话框 -->
    <van-dialog v-model:show="showDeleteDialog" title="确认删除" show-cancel-button @confirm="confirmDelete">
      <div class="dialog-content">
        <p>确定要删除这个导航项吗？</p>
        <p class="warning-text">删除后将无法恢复！</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { 
  showToast, 
  showDialog, 
  showLoadingToast,
  closeToast
} from 'vant'
import request from '@/utils/request'
import IconSelector from '@/components/IconSelector.vue'

// API 基础地址
const apiBaseUrl = 'https://pay.itapgo.com/Tapp/admin/api/nav_manager.php'

// 主要状态
const activeTab = ref(0)
const tabbarItems = ref([])
const homeNavItems = ref([])
const editingItem = ref(null)
const itemToDelete = ref(null)

// 弹窗状态
const showTabbarPopup = ref(false)
const showHomeNavPopup = ref(false)
const showLinkTypePicker = ref(false)
const showDeleteDialog = ref(false)

// 链接类型选项
const linkTypeColumns = ['path', 'url', 'none']

// 表单数据
const tabbarForm = reactive({
  nav_id: '',
  nav_name: '',
  icon: '',
  path: '/',
  highlight: 0,
  badge_type: '',
  sort_order: 0,
  status: 1
})

const homeNavForm = reactive({
  title: '',
  icon: '',
  link_type: 'path',
  link_url: '/',
  sort_order: 0,
  status: 1
})

// 获取底部导航数据
const fetchTabbarData = async () => {
  try {
    const loadingToast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })
    
    const response = await request.get(`${apiBaseUrl}?type=tabbar`)
    
    if (response.data.code === 0) {
      tabbarItems.value = response.data.data || []
      // 按排序值排序
      tabbarItems.value.sort((a, b) => a.sort_order - b.sort_order)
    } else {
      showToast('获取底部导航数据失败: ' + response.data.message)
    }
    
    closeToast()
  } catch (error) {
    closeToast()
    showToast('获取底部导航数据失败: ' + error.message)
  }
}

// 获取首页导航数据
const fetchHomeNavData = async () => {
  try {
    const loadingToast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })
    
    const response = await request.get(`${apiBaseUrl}?type=home`)
    
    if (response.data.code === 0) {
      homeNavItems.value = response.data.data || []
      // 按排序值排序
      homeNavItems.value.sort((a, b) => a.sort_order - b.sort_order)
    } else {
      showToast('获取首页导航数据失败: ' + response.data.message)
    }
    
    closeToast()
  } catch (error) {
    closeToast()
    showToast('获取首页导航数据失败: ' + error.message)
  }
}

// 显示底部导航表单
const showTabbarForm = (item) => {
  editingItem.value = item
  
  if (item) {
    // 编辑模式，填充表单数据
    Object.keys(tabbarForm).forEach(key => {
      if (key in item) {
        tabbarForm[key] = item[key]
      }
    })
  } else {
    // 添加模式，重置表单
    Object.keys(tabbarForm).forEach(key => {
      tabbarForm[key] = key === 'status' ? 1 : (key === 'highlight' ? 0 : (key === 'path' ? '/' : ''))
    })
  }
  
  showTabbarPopup.value = true
}

// 显示首页导航表单
const showHomeNavForm = (item) => {
  editingItem.value = item
  
  if (item) {
    // 编辑模式，填充表单数据
    Object.keys(homeNavForm).forEach(key => {
      if (key in item) {
        homeNavForm[key] = item[key]
      }
    })
  } else {
    // 添加模式，重置表单
    Object.keys(homeNavForm).forEach(key => {
      homeNavForm[key] = key === 'status' ? 1 : (key === 'link_type' ? 'path' : (key === 'link_url' ? '/' : (key === 'sort_order' ? 0 : '')))
    })
  }
  
  showHomeNavPopup.value = true
}

// 提交底部导航表单
const submitTabbarForm = async () => {
  try {
    const loadingToast = showLoadingToast({
      message: '保存中...',
      forbidClick: true,
      duration: 0
    })
    
    let response
    
    if (editingItem.value) {
      // 编辑模式
      const updateData = { ...tabbarForm, id: editingItem.value.id }
      response = await request.put(`${apiBaseUrl}?type=tabbar`, updateData)
    } else {
      // 添加模式
      response = await request.post(`${apiBaseUrl}?type=tabbar`, tabbarForm)
    }
    
    closeToast()
    
    if (response.data.code === 0) {
      showToast('保存成功')
      showTabbarPopup.value = false
      fetchTabbarData() // 刷新数据
    } else {
      showToast('操作失败: ' + response.data.message)
    }
  } catch (error) {
    closeToast()
    showToast('操作失败: ' + error.message)
  }
}

// 提交首页导航表单
const submitHomeNavForm = async () => {
  try {
    const loadingToast = showLoadingToast({
      message: '保存中...',
      forbidClick: true,
      duration: 0
    })
    
    let response
    
    if (editingItem.value) {
      // 编辑模式
      const updateData = { ...homeNavForm, id: editingItem.value.id }
      response = await request.put(`${apiBaseUrl}?type=home`, updateData)
    } else {
      // 添加模式
      response = await request.post(`${apiBaseUrl}?type=home`, homeNavForm)
    }
    
    closeToast()
    
    if (response.data.code === 0) {
      showToast('保存成功')
      showHomeNavPopup.value = false
      fetchHomeNavData() // 刷新数据
    } else {
      showToast('操作失败: ' + response.data.message)
    }
  } catch (error) {
    closeToast()
    showToast('操作失败: ' + error.message)
  }
}

// 切换底部导航状态
const toggleTabbarStatus = async (item) => {
  try {
    const loadingToast = showLoadingToast({
      message: '更新中...',
      forbidClick: true,
      duration: 0
    })
    
    const updateData = { 
      id: item.id, 
      status: item.status 
    }
    
    const response = await request.put(`${apiBaseUrl}?type=tabbar`, updateData)
    
    closeToast()
    
    if (response.data.code === 0) {
      showToast('状态更新成功')
    } else {
      // 恢复状态
      item.status = item.status === 1 ? 0 : 1
      showToast('状态更新失败: ' + response.data.message)
    }
  } catch (error) {
    closeToast()
    // 恢复状态
    item.status = item.status === 1 ? 0 : 1
    showToast('状态更新失败: ' + error.message)
  }
}

// 切换首页导航状态
const toggleHomeNavStatus = async (item) => {
  try {
    const loadingToast = showLoadingToast({
      message: '更新中...',
      forbidClick: true,
      duration: 0
    })
    
    const updateData = { 
      id: item.id, 
      status: item.status 
    }
    
    const response = await request.put(`${apiBaseUrl}?type=home`, updateData)
    
    closeToast()
    
    if (response.data.code === 0) {
      showToast('状态更新成功')
    } else {
      // 恢复状态
      item.status = item.status === 1 ? 0 : 1
      showToast('状态更新失败: ' + response.data.message)
    }
  } catch (error) {
    closeToast()
    // 恢复状态
    item.status = item.status === 1 ? 0 : 1
    showToast('状态更新失败: ' + error.message)
  }
}

// 确认删除底部导航
const confirmDeleteTabbar = (item) => {
  itemToDelete.value = { item, type: 'tabbar' }
  showDeleteDialog.value = true
}

// 确认删除首页导航
const confirmDeleteHomeNav = (item) => {
  itemToDelete.value = { item, type: 'home' }
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    const loadingToast = showLoadingToast({
      message: '删除中...',
      forbidClick: true,
      duration: 0
    })
    
    const { item, type } = itemToDelete.value
    const response = await request.delete(`${apiBaseUrl}?type=${type}&id=${item.id}`)
    
    closeToast()
    
    if (response.data.code === 0) {
      showToast('删除成功')
      if (type === 'tabbar') {
        fetchTabbarData()
      } else {
        fetchHomeNavData()
      }
    } else {
      showToast('删除失败: ' + response.data.message)
    }
  } catch (error) {
    closeToast()
    showToast('删除失败: ' + error.message)
  }
}

// 链接类型确认
const onLinkTypeConfirm = (value) => {
  homeNavForm.link_type = value
  showLinkTypePicker.value = false
}

// 初始化
onMounted(() => {
  fetchTabbarData()
  fetchHomeNavData()
})
</script>

<style scoped>
.nav-manager {
  padding-top: 46px;
  height: 100vh;
  background: #f8f8f8;
}

.content {
  padding-bottom: 20px;
}

.tab-content {
  padding: 16px;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.preview-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #323233;
}

.tabbar-preview {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fafafa;
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid #ebedf0;
}

.tabbar-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
}

.home-nav-preview {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebedf0;
}

.home-nav-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 12px 8px;
  box-shadow: 0 2px 8px rgba(100, 101, 102, 0.05);
}

.preview-item-text {
  margin-top: 4px;
  font-size: 12px;
  color: #646566;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item-cell {
  padding: 12px 16px;
}

.nav-item-title {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.nav-icon {
  margin-right: 8px;
  font-size: 18px;
}

.nav-item-info {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-list {
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.popup-container {
  padding: 20px 0;
  height: 100%;
  overflow-y: auto;
}

.popup-title {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
}

.dialog-content {
  padding: 16px 24px;
  text-align: center;
}

.warning-text {
  color: #ee0a24;
  font-weight: 500;
}
</style> 