<template>
  <div class="menu-designer">
    <div class="designer-layout">
      <!-- 左侧手机预览区 -->
      <div class="phone-preview">
        <div class="phone-container">
          <div class="phone-header">
            <div class="status-bar">
              <span class="time">9:41</span>
              <span class="signal">
                <i class="el-icon-signal"></i>
                <i class="el-icon-wifi"></i>
                <i class="el-icon-battery-2"></i>
              </span>
            </div>
            <div class="wechat-header">
              <span class="wechat-title">{{ accountName || '微信公众号' }}</span>
            </div>
          </div>
          
          <div class="phone-content">
            <div class="chat-area">
              <!-- 模拟聊天内容 -->
              <div class="chat-message">
                <div class="message-avatar">
                  <img :src="accountAvatar || '/admin/assets/images/default-avatar.png'" />
                </div>
                <div class="message-content">
                  <div class="message-bubble">
                    欢迎关注{{ accountName || '我们的公众号' }}！
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 自定义菜单预览 -->
            <div class="menu-preview" v-if="menuButtons.length > 0">
              <div class="menu-row">
                <div 
                  v-for="(button, index) in menuButtons" 
                  :key="index"
                  class="menu-button"
                  :class="{ 'active': selectedButtonIndex === index }"
                  @click="selectButton(index)"
                >
                  <div class="button-content">
                    <span class="button-text">{{ button.name || '菜单' + (index + 1) }}</span>
                    <i v-if="button.sub_button && button.sub_button.length > 0" class="el-icon-arrow-up"></i>
                  </div>
                  
                  <!-- 子菜单预览 -->
                  <div 
                    v-if="button.sub_button && button.sub_button.length > 0 && selectedButtonIndex === index"
                    class="sub-menu-panel"
                  >
                    <div 
                      v-for="(subButton, subIndex) in button.sub_button"
                      :key="subIndex"
                      class="sub-menu-item"
                      :class="{ 'active': selectedSubButtonIndex === subIndex }"
                      @click.stop="selectSubButton(subIndex)"
                    >
                      {{ subButton.name || '子菜单' + (subIndex + 1) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 无菜单提示 -->
            <div v-else class="no-menu-tip">
              <p>暂无自定义菜单</p>
              <p>请在右侧编辑区添加菜单</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区 -->
      <div class="edit-panel">
        <!-- 菜单基本信息 -->
        <div class="panel-section">
          <h3>菜单设置</h3>
          <el-form :model="menuForm" label-width="100px">
            <el-form-item label="菜单组名称" required>
              <el-input 
                v-model="menuForm.title" 
                placeholder="给菜单组起个名字吧！"
                maxlength="30"
                show-word-limit
              />
            </el-form-item>
            
            <!-- 个性化菜单设置 -->
            <template v-if="menuType === 3">
              <el-form-item label="显示对象">
                <div class="matchrule-config">
                  <div class="config-row">
                    <el-select v-model="menuForm.matchrule.sex" placeholder="性别">
                      <el-option label="不限" :value="0" />
                      <el-option label="男" :value="1" />
                      <el-option label="女" :value="2" />
                    </el-select>
                    
                    <el-select v-model="menuForm.matchrule.group_id" placeholder="粉丝分组">
                      <el-option label="不限" :value="-1" />
                      <el-option 
                        v-for="group in fanGroups" 
                        :key="group.id" 
                        :label="group.name" 
                        :value="group.id" 
                      />
                    </el-select>
                  </div>
                  
                  <div class="config-row">
                    <el-select v-model="menuForm.matchrule.client_platform_type" placeholder="手机系统">
                      <el-option label="不限" :value="0" />
                      <el-option label="iOS" :value="1" />
                      <el-option label="Android" :value="2" />
                      <el-option label="其他" :value="3" />
                    </el-select>
                    
                    <el-select v-model="menuForm.matchrule.language" placeholder="语言">
                      <el-option label="不限" value="" />
                      <el-option label="简体中文" value="zh_CN" />
                      <el-option label="繁体中文" value="zh_TW" />
                      <el-option label="英语" value="en" />
                    </el-select>
                  </div>
                  
                  <div class="config-row">
                    <el-input v-model="menuForm.matchrule.country" placeholder="国家" />
                    <el-input v-model="menuForm.matchrule.province" placeholder="省份" />
                    <el-input v-model="menuForm.matchrule.city" placeholder="城市" />
                  </div>
                </div>
              </el-form-item>
            </template>
          </el-form>
        </div>

        <!-- 菜单结构编辑 -->
        <div class="panel-section">
          <div class="section-header">
            <h3>菜单结构</h3>
            <el-button 
              type="primary" 
              size="small" 
              @click="addMainButton"
              :disabled="menuButtons.length >= 3"
            >
              添加主菜单
            </el-button>
          </div>
          
          <div class="menu-structure">
            <div 
              v-for="(button, index) in menuButtons" 
              :key="index"
              class="button-item"
              :class="{ 'active': selectedButtonIndex === index }"
            >
              <div class="button-header" @click="selectButton(index)">
                <div class="button-info">
                  <span class="button-name">{{ button.name || '菜单' + (index + 1) }}</span>
                  <span class="button-type">{{ getButtonTypeText(button) }}</span>
                </div>
                <div class="button-actions">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop="editButton(index)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop="deleteButton(index)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              
              <!-- 子菜单列表 -->
              <div v-if="button.sub_button && button.sub_button.length > 0" class="sub-buttons">
                <div 
                  v-for="(subButton, subIndex) in button.sub_button"
                  :key="subIndex"
                  class="sub-button-item"
                  :class="{ 'active': selectedButtonIndex === index && selectedSubButtonIndex === subIndex }"
                >
                  <div class="sub-button-header" @click="selectSubButton(subIndex)">
                    <div class="sub-button-info">
                      <span class="sub-button-name">{{ subButton.name || '子菜单' + (subIndex + 1) }}</span>
                      <span class="sub-button-type">{{ getButtonTypeText(subButton) }}</span>
                    </div>
                    <div class="sub-button-actions">
                      <el-button 
                        type="text" 
                        size="small" 
                        @click.stop="editSubButton(index, subIndex)"
                      >
                        编辑
                      </el-button>
                      <el-button 
                        type="text" 
                        size="small" 
                        @click.stop="deleteSubButton(index, subIndex)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <el-button 
                  v-if="button.sub_button.length < 5"
                  type="dashed" 
                  size="small" 
                  class="add-sub-button"
                  @click="addSubButton(index)"
                >
                  添加子菜单
                </el-button>
              </div>
              
              <!-- 添加子菜单按钮 -->
              <div v-else class="add-sub-menu">
                <el-button 
                  type="dashed" 
                  size="small" 
                  @click="addSubButton(index)"
                >
                  添加子菜单
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveMenu"
            :loading="saveLoading"
          >
            保存
          </el-button>
          <el-button 
            type="success" 
            @click="publishMenu"
            :loading="publishLoading"
          >
            保存并发布
          </el-button>
        </div>
      </div>
    </div>

    <!-- 菜单配置弹窗 -->
    <el-dialog 
      v-model="showConfigDialog" 
      :title="configDialogTitle"
      width="600px"
      @close="closeConfigDialog"
    >
      <MenuActionConfig 
        v-if="showConfigDialog"
        :button-data="editingButton"
        :is-sub-button="isEditingSubButton"
        @save="handleConfigSave"
        @cancel="closeConfigDialog"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MenuActionConfig from './MenuActionConfig.vue'
import { saveMenuData, publishMenuData } from '@/api/branchWechatMenu'

const props = defineProps({
  branchId: {
    type: [String, Number],
    required: true
  },
  menuType: {
    type: Number,
    default: 1 // 1=当前菜单, 3=个性化菜单
  },
  menuData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['menu-saved', 'menu-published'])

// 响应式数据
const accountName = ref('微信公众号')
const accountAvatar = ref('')
const selectedButtonIndex = ref(-1)
const selectedSubButtonIndex = ref(-1)
const showConfigDialog = ref(false)
const editingButton = ref(null)
const isEditingSubButton = ref(false)
const editingButtonIndex = ref(-1)
const editingSubButtonIndex = ref(-1)
const saveLoading = ref(false)
const publishLoading = ref(false)

// 菜单表单数据
const menuForm = reactive({
  title: '',
  type: props.menuType,
  button: [],
  matchrule: {
    sex: 0,
    group_id: -1,
    client_platform_type: 0,
    language: '',
    country: '',
    province: '',
    city: ''
  }
})

// 粉丝分组数据
const fanGroups = ref([])

// 计算属性
const menuButtons = computed(() => menuForm.button || [])

const configDialogTitle = computed(() => {
  if (isEditingSubButton.value) {
    return '编辑子菜单'
  } else {
    return editingButtonIndex.value >= 0 ? '编辑主菜单' : '添加主菜单'
  }
})

// 方法
const initMenuData = () => {
  if (props.menuData) {
    menuForm.title = props.menuData.title || ''
    menuForm.type = props.menuData.type || props.menuType
    menuForm.button = props.menuData.button || []
    if (props.menuData.matchrule) {
      Object.assign(menuForm.matchrule, props.menuData.matchrule)
    }
  }
}

const selectButton = (index) => {
  selectedButtonIndex.value = index
  selectedSubButtonIndex.value = -1
}

const selectSubButton = (subIndex) => {
  selectedSubButtonIndex.value = subIndex
}

const addMainButton = () => {
  if (menuButtons.value.length >= 3) {
    ElMessage.warning('最多只能添加3个主菜单')
    return
  }
  
  editingButton.value = {
    name: '',
    type: 'click',
    key: '',
    url: '',
    media_id: '',
    sub_button: []
  }
  editingButtonIndex.value = -1
  isEditingSubButton.value = false
  showConfigDialog.value = true
}

const editButton = (index) => {
  editingButton.value = { ...menuButtons.value[index] }
  editingButtonIndex.value = index
  isEditingSubButton.value = false
  showConfigDialog.value = true
}

const deleteButton = (index) => {
  ElMessageBox.confirm('确定要删除这个主菜单吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    menuForm.button.splice(index, 1)
    if (selectedButtonIndex.value === index) {
      selectedButtonIndex.value = -1
      selectedSubButtonIndex.value = -1
    }
    ElMessage.success('删除成功')
  })
}

const addSubButton = (buttonIndex) => {
  const button = menuButtons.value[buttonIndex]
  if (!button.sub_button) {
    button.sub_button = []
  }
  
  if (button.sub_button.length >= 5) {
    ElMessage.warning('每个主菜单最多只能添加5个子菜单')
    return
  }
  
  editingButton.value = {
    name: '',
    type: 'click',
    key: '',
    url: '',
    media_id: ''
  }
  editingButtonIndex.value = buttonIndex
  editingSubButtonIndex.value = -1
  isEditingSubButton.value = true
  showConfigDialog.value = true
}

const editSubButton = (buttonIndex, subButtonIndex) => {
  const subButton = menuButtons.value[buttonIndex].sub_button[subButtonIndex]
  editingButton.value = { ...subButton }
  editingButtonIndex.value = buttonIndex
  editingSubButtonIndex.value = subButtonIndex
  isEditingSubButton.value = true
  showConfigDialog.value = true
}

const deleteSubButton = (buttonIndex, subButtonIndex) => {
  ElMessageBox.confirm('确定要删除这个子菜单吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    menuForm.button[buttonIndex].sub_button.splice(subButtonIndex, 1)
    if (selectedButtonIndex.value === buttonIndex && selectedSubButtonIndex.value === subButtonIndex) {
      selectedSubButtonIndex.value = -1
    }
    ElMessage.success('删除成功')
  })
}

const handleConfigSave = (buttonData) => {
  if (isEditingSubButton.value) {
    // 保存子菜单
    if (editingSubButtonIndex.value >= 0) {
      // 编辑现有子菜单
      menuForm.button[editingButtonIndex.value].sub_button[editingSubButtonIndex.value] = buttonData
    } else {
      // 添加新子菜单
      if (!menuForm.button[editingButtonIndex.value].sub_button) {
        menuForm.button[editingButtonIndex.value].sub_button = []
      }
      menuForm.button[editingButtonIndex.value].sub_button.push(buttonData)
    }
  } else {
    // 保存主菜单
    if (editingButtonIndex.value >= 0) {
      // 编辑现有主菜单
      menuForm.button[editingButtonIndex.value] = buttonData
    } else {
      // 添加新主菜单
      menuForm.button.push(buttonData)
    }
  }
  
  closeConfigDialog()
  ElMessage.success('菜单配置保存成功')
}

const closeConfigDialog = () => {
  showConfigDialog.value = false
  editingButton.value = null
  editingButtonIndex.value = -1
  editingSubButtonIndex.value = -1
  isEditingSubButton.value = false
}

const getButtonTypeText = (button) => {
  const typeMap = {
    'click': '点击推事件',
    'view': '跳转URL',
    'scancode_push': '扫码推事件',
    'scancode_waitmsg': '扫码推事件且弹出等待消息',
    'pic_sysphoto': '系统拍照发图',
    'pic_photo_or_album': '拍照或者相册发图',
    'pic_weixin': '微信相册发图',
    'location_select': '发送位置',
    'media_id': '下发消息（除文本消息）',
    'view_limited': '跳转图文消息URL',
    'miniprogram': '小程序'
  }
  return typeMap[button.type] || '未知类型'
}

const validateMenu = () => {
  if (!menuForm.title.trim()) {
    ElMessage.error('请填写菜单组名称')
    return false
  }
  
  if (menuForm.button.length === 0) {
    ElMessage.error('请至少添加一个菜单')
    return false
  }
  
  for (let i = 0; i < menuForm.button.length; i++) {
    const button = menuForm.button[i]
    if (!button.name.trim()) {
      ElMessage.error(`请填写第${i + 1}个主菜单的名称`)
      return false
    }
    
    if (button.sub_button && button.sub_button.length > 0) {
      for (let j = 0; j < button.sub_button.length; j++) {
        const subButton = button.sub_button[j]
        if (!subButton.name.trim()) {
          ElMessage.error(`请填写第${i + 1}个主菜单下第${j + 1}个子菜单的名称`)
          return false
        }
      }
    }
  }
  
  // 个性化菜单需要检查匹配规则
  if (menuForm.type === 3) {
    const matchrule = menuForm.matchrule
    if (matchrule.sex === 0 && matchrule.group_id === -1 && 
        matchrule.client_platform_type === 0 && !matchrule.language &&
        !matchrule.country && !matchrule.province && !matchrule.city) {
      ElMessage.error('个性化菜单请至少设置一个显示条件')
      return false
    }
  }
  
  return true
}

const saveMenu = async () => {
  if (!validateMenu()) {
    return
  }
  
  try {
    saveLoading.value = true
    const response = await saveMenuData(props.branchId, {
      group: {
        ...menuForm,
        status: 0
      },
      submit_type: 'save'
    })
    
    if (response.code === 0) {
      ElMessage.success('菜单保存成功')
      emit('menu-saved', menuForm)
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存菜单失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const publishMenu = async () => {
  if (!validateMenu()) {
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要保存并发布菜单吗？发布后将立即在微信中生效。', '确认发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    publishLoading.value = true
    const response = await saveMenuData(props.branchId, {
      group: {
        ...menuForm,
        status: 1
      },
      submit_type: 'publish'
    })
    
    if (response.code === 0) {
      ElMessage.success('菜单发布成功')
      emit('menu-published', menuForm)
    } else {
      ElMessage.error(response.message || '发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布菜单失败:', error)
      ElMessage.error('发布失败')
    }
  } finally {
    publishLoading.value = false
  }
}

const handleCancel = () => {
  // 返回上一页或重置表单
  ElMessageBox.confirm('确定要取消编辑吗？未保存的更改将丢失。', '确认取消', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning'
  }).then(() => {
    // 触发取消事件或返回列表页
    emit('cancel')
  })
}

// 监听菜单数据变化
watch(() => props.menuData, (newData) => {
  if (newData) {
    initMenuData()
  }
}, { immediate: true, deep: true })

// 生命周期
onMounted(() => {
  initMenuData()
  // 加载粉丝分组等数据
  loadFanGroups()
})

const loadFanGroups = async () => {
  // 这里加载粉丝分组数据
  fanGroups.value = [
    { id: 100, name: '默认分组' },
    { id: 101, name: 'VIP用户' },
    { id: 102, name: '普通用户' }
  ]
}
</script>

<style scoped>
.menu-designer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.designer-layout {
  display: flex;
  gap: 20px;
  flex: 1;
}

.phone-preview {
  width: 320px;
  flex-shrink: 0;
}

.phone-container {
  width: 320px;
  height: 568px;
  background: #000;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.phone-header {
  background: #1aad19;
  border-radius: 10px 10px 0 0;
  padding: 8px 12px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 12px;
  margin-bottom: 8px;
}

.wechat-header {
  text-align: center;
  color: white;
  font-weight: 500;
}

.phone-content {
  background: #f5f5f5;
  height: 480px;
  border-radius: 0 0 10px 10px;
  display: flex;
  flex-direction: column;
}

.chat-area {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.chat-message {
  display: flex;
  margin-bottom: 10px;
}

.message-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.message-content {
  margin-left: 8px;
}

.message-bubble {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  max-width: 200px;
  font-size: 14px;
  position: relative;
}

.message-bubble::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 8px;
  width: 0;
  height: 0;
  border-right: 6px solid white;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

.menu-preview {
  border-top: 1px solid #e5e5e5;
  background: white;
}

.menu-row {
  display: flex;
}

.menu-button {
  flex: 1;
  border-right: 1px solid #e5e5e5;
  position: relative;
}

.menu-button:last-child {
  border-right: none;
}

.button-content {
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-content:hover,
.menu-button.active .button-content {
  background: #f0f0f0;
}

.button-text {
  font-size: 12px;
  color: #333;
  display: block;
}

.sub-menu-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e5e5;
  border-bottom: none;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.sub-menu-item {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sub-menu-item:hover,
.sub-menu-item.active {
  background: #f0f0f0;
}

.sub-menu-item:last-child {
  border-bottom: none;
}

.no-menu-tip {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.edit-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.matchrule-config {
  width: 100%;
}

.config-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.config-row .el-select,
.config-row .el-input {
  flex: 1;
}

.menu-structure {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
}

.button-item {
  border-bottom: 1px solid #e5e5e5;
}

.button-item:last-child {
  border-bottom: none;
}

.button-item.active {
  background: #f8f9fa;
}

.button-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-header:hover {
  background: #f5f7fa;
}

.button-info {
  flex: 1;
}

.button-name {
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

.button-type {
  font-size: 12px;
  color: #666;
}

.button-actions {
  display: flex;
  gap: 8px;
}

.sub-buttons {
  background: #f8f9fa;
  border-top: 1px solid #e5e5e5;
}

.sub-button-item {
  border-bottom: 1px solid #e5e5e5;
  margin-left: 32px;
}

.sub-button-item:last-child {
  border-bottom: none;
}

.sub-button-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sub-button-header:hover,
.sub-button-item.active .sub-button-header {
  background: #eef2f6;
}

.sub-button-info {
  flex: 1;
}

.sub-button-name {
  font-size: 14px;
  color: #333;
  margin-right: 8px;
}

.sub-button-type {
  font-size: 12px;
  color: #666;
}

.sub-button-actions {
  display: flex;
  gap: 8px;
}

.add-sub-button,
.add-sub-menu {
  padding: 8px 16px;
  margin-left: 32px;
}

.add-sub-menu {
  border-top: 1px solid #e5e5e5;
  background: #f8f9fa;
}

.panel-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e5e5;
}

:deep(.el-dialog__header) {
  background: #f8f9fa;
  padding: 16px 20px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style> 