<template>
  <div id="wechat_menu">
    <div class="conditionMenu menu-post-page">
      <!-- 面包屑导航 -->
      <ol class="breadcrumb we7-breadcrumb">
        <a href="/admin/#/platform/menu"><i class="wi wi-back-circle"></i></a>
        <li>
          <a href="/admin/#/platform/menu">自定义菜单</a>
        </li>
        <li>
          {{ menuId ? '编辑菜单' : '新建菜单' }}
        </li>
      </ol>

      <div class="we7-form">
        <!-- 菜单组名称 -->
        <div class="form-group">
          <label class="control-label col-sm-2">菜单组名称</label>
          <div class="form-controls col-sm-8">
            <input 
              type="text" 
              style="width: 600px" 
              class="form-control" 
              v-model="menuGroup.title"
              :disabled="menuGroup.disabled"
            />
            <span class="help-block">给菜单组起个名字吧</span>
          </div>
        </div>

        <!-- 菜单显示对象 -->
        <div class="form-group" v-if="menuGroup.type == 3">
          <label class="control-label col-sm-2">菜单显示对象</label>
          <div class="form-controls col-sm-8">
            <div class="help-block">个性化菜单配置...</div>
          </div>
        </div>

        <!-- 菜单设计器主体 -->
        <div class="form-group">
          <label class="control-label col-sm-2">菜单设计</label>
          <div class="form-controls col-sm-10">
            <div class="menu-designer">
              <!-- 顶部工具栏 -->
              <div class="menu-toolbar">
                <div class="toolbar-left">
                  <button 
                    class="btn btn-primary btn-sm"
                    @click="addMainMenu"
                    :disabled="menuGroup.button.length >= 3"
                  >
                    <i class="fa fa-plus"></i>
                    添加菜单({{ menuGroup.button.length }}/3)
                  </button>
                  <button class="btn btn-default btn-sm" @click="selectTemplate">
                    <i class="fa fa-list"></i>
                    选择模板
                  </button>
                  <button class="btn btn-default btn-sm" @click="syncFromWechat">
                    <i class="fa fa-refresh"></i>
                    从微信同步
                  </button>
                </div>
                <div class="toolbar-right">
                  <button class="btn btn-success btn-sm" @click="saveConfig">
                    <i class="fa fa-save"></i>
                    保存配置
                  </button>
                  <button class="btn btn-warning btn-sm" @click="publishToWechat">
                    <i class="fa fa-send"></i>
                    发布到微信
                  </button>
                </div>
              </div>

              <!-- 菜单编辑区域 -->
              <div class="menu-editor-container">
                <!-- 左侧菜单列表 -->
                <div class="menu-list-panel">
                  <div class="menu-items">
                    <div 
                      v-for="(menu, index) in menuGroup.button" 
                      :key="index"
                      class="menu-item"
                      :class="{ active: activeMenuIndex === index }"
                      @click="selectMenu(index)"
                    >
                      <div class="menu-item-header">
                        <div class="menu-name">
                          {{ menu.name || `菜单${index + 1}` }}
                        </div>
                        <div class="menu-actions">
                          <button 
                            class="btn btn-xs btn-danger"
                            @click.stop="deleteMenu(index)"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <div class="menu-type">
                        {{ getMenuTypeText(menu.type) }}
                      </div>
                      
                      <!-- 子菜单列表 -->
                      <div v-if="menu.sub_button && menu.sub_button.length > 0" class="sub-menu-list">
                        <div 
                          v-for="(subMenu, subIndex) in menu.sub_button"
                          :key="subIndex"
                          class="sub-menu-item"
                          :class="{ active: activeMenuIndex === index && activeSubMenuIndex === subIndex }"
                          @click.stop="selectSubMenu(index, subIndex)"
                        >
                          <div class="sub-menu-name">
                            {{ subMenu.name || `子菜单${subIndex + 1}` }}
                          </div>
                          <div class="sub-menu-type">
                            {{ getMenuTypeText(subMenu.type) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 右侧编辑面板 -->
                <div class="menu-edit-panel">
                  <div v-if="activeItem" class="edit-form">
                    <div class="panel panel-default">
                      <div class="panel-heading">
                        <h4 class="panel-title">
                          编辑菜单
                          <button 
                            v-if="!activeItem.isSubMenu && (!activeItem.sub_button || activeItem.sub_button.length < 5)"
                            class="btn btn-primary btn-xs pull-right"
                            @click="addSubMenu"
                          >
                            添加子菜单({{ (activeItem.sub_button || []).length }}/5)
                          </button>
                        </h4>
                      </div>
                      <div class="panel-body">
                        <!-- 菜单名称 -->
                        <div class="form-group">
                          <label>菜单名称</label>
                          <input 
                            type="text" 
                            class="form-control"
                            v-model="activeItem.name"
                            maxlength="16"
                            placeholder="请输入菜单名称"
                          />
                          <span class="help-block">{{ (activeItem.name || '').length }}/16</span>
                        </div>

                        <!-- 菜单类型 -->
                        <div class="form-group">
                          <label>菜单类型</label>
                          <select class="form-control" v-model="activeItem.type" @change="onMenuTypeChange">
                            <option value="click">点击事件</option>
                            <option value="view">跳转网页</option>
                            <option value="scancode_push">扫码推事件</option>
                            <option value="scancode_waitmsg">扫码带提示</option>
                            <option value="pic_sysphoto">系统拍照发图</option>
                            <option value="pic_photo_or_album">拍照或者相册发图</option>
                            <option value="pic_weixin">微信相册发图</option>
                            <option value="location_select">发送位置</option>
                            <option value="media_id">下发消息</option>
                            <option value="view_limited">跳转图文消息URL</option>
                            <option value="miniprogram">小程序</option>
                          </select>
                        </div>

                        <!-- 事件KEY -->
                        <div v-if="needsKey(activeItem.type)" class="form-group">
                          <label>事件KEY</label>
                          <input 
                            type="text" 
                            class="form-control"
                            v-model="activeItem.key"
                            placeholder="请输入事件KEY"
                          />
                        </div>

                        <!-- 页面地址 -->
                        <div v-if="activeItem.type === 'view'" class="form-group">
                          <label>页面地址</label>
                          <input 
                            type="url" 
                            class="form-control"
                            v-model="activeItem.url"
                            placeholder="请输入完整的网页链接"
                          />
                        </div>

                        <!-- 小程序配置 -->
                        <div v-if="activeItem.type === 'miniprogram'">
                          <div class="form-group">
                            <label>小程序AppID</label>
                            <input 
                              type="text" 
                              class="form-control"
                              v-model="activeItem.appid"
                              placeholder="请输入小程序AppID"
                            />
                          </div>
                          <div class="form-group">
                            <label>小程序页面路径</label>
                            <input 
                              type="text" 
                              class="form-control"
                              v-model="activeItem.pagepath"
                              placeholder="请输入小程序页面路径"
                            />
                          </div>
                          <div class="form-group">
                            <label>备用网页</label>
                            <input 
                              type="url" 
                              class="form-control"
                              v-model="activeItem.url"
                              placeholder="不支持小程序的老版本客户端将打开本网页"
                            />
                          </div>
                        </div>

                        <!-- 素材选择 -->
                        <div v-if="activeItem.type === 'media_id' || activeItem.type === 'view_limited'" class="form-group">
                          <label>选择素材</label>
                          <div class="material-selector">
                            <div v-if="activeItem.material && activeItem.material.length > 0" class="selected-material">
                              <!-- 显示已选择的素材 -->
                              <div class="material-preview">
                                {{ activeItem.material[0].title || '已选择素材' }}
                              </div>
                            </div>
                            <button class="btn btn-default" @click="selectMaterial">
                              选择素材
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 未选择菜单时的提示 -->
                  <div v-else class="no-selection">
                    <div class="empty-state">
                      <i class="fa fa-hand-pointer-o fa-3x"></i>
                      <p>请点击左侧菜单进行编辑</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 底部操作按钮 -->
              <div class="menu-submit">
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="submitMenu('publish')"
                >
                  完成
                </button>
                <button 
                  type="button" 
                  class="btn btn-default"
                  @click="submitMenu('save')"
                >
                  仅保存
                </button>
                <button 
                  type="button" 
                  class="btn btn-default"
                  @click="previewMenu"
                >
                  预览
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div class="modal fade" id="previewModal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-sm">
        <div class="mobile-preview">
          <div class="mobile-preview-hd">
            <strong class="nickname">{{ menuGroup.type == 3 ? "个性化菜单" : "默认菜单" }}</strong>
          </div>
          <div class="mobile-preview-bd">
            <ul class="show-list"></ul>
          </div>
          <div class="mobile-preview-ft">
            <ul class="pre-menu-list grid-line">
              <li 
                v-for="(menu, index) in menuGroup.button" 
                :key="index"
                class="pre-menu-item grid-item"
              >
                <a href="javascript:void(0);" class="pre-menu-link">
                  <i class="icon-menu-dot"></i>
                  {{ menu.name }}
                </a>
                <div v-if="menu.sub_button && menu.sub_button.length > 0" class="sub-pre-menu-box">
                  <ul class="sub-pre-menu-list">
                    <li v-for="(subMenu, subIndex) in menu.sub_button" :key="subIndex">
                      <a href="javascript:void(0);">{{ subMenu.name }}</a>
                    </li>
                  </ul>
                  <i class="arrow arrow-out"></i>
                  <i class="arrow arrow-in"></i>
                </div>
              </li>
            </ul>
          </div>
          <button class="mobile-preview-closed btn btn-default" @click="closePreview">
            退出预览
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  saveMenu, 
  publishMenu, 
  getMenuList 
} from '@/api/branchWechatMenu'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 响应式数据
const menuId = ref(route.params.id || null)
const activeMenuIndex = ref(-1)
const activeSubMenuIndex = ref(-1)

// 菜单组数据
const menuGroup = reactive({
  title: '默认菜单',
  type: 1, // 1: 默认菜单, 3: 个性化菜单
  disabled: false,
  button: []
})

// 计算当前活动的菜单项
const activeItem = computed(() => {
  if (activeMenuIndex.value >= 0) {
    const mainMenu = menuGroup.button[activeMenuIndex.value]
    if (activeSubMenuIndex.value >= 0 && mainMenu.sub_button) {
      return {
        ...mainMenu.sub_button[activeSubMenuIndex.value],
        isSubMenu: true,
        parentIndex: activeMenuIndex.value,
        index: activeSubMenuIndex.value
      }
    }
    return {
      ...mainMenu,
      isSubMenu: false,
      index: activeMenuIndex.value
    }
  }
  return null
})

// 菜单类型文本映射
const getMenuTypeText = (type) => {
  const typeMap = {
    'click': '点击事件',
    'view': '跳转网页',
    'scancode_push': '扫码推事件',
    'scancode_waitmsg': '扫码带提示',
    'pic_sysphoto': '系统拍照发图',
    'pic_photo_or_album': '拍照或者相册发图',
    'pic_weixin': '微信相册发图',
    'location_select': '发送位置',
    'media_id': '下发消息',
    'view_limited': '跳转图文消息URL',
    'miniprogram': '小程序'
  }
  return typeMap[type] || '未知类型'
}

// 判断是否需要KEY字段
const needsKey = (type) => {
  return ['click', 'scancode_push', 'scancode_waitmsg', 'pic_sysphoto', 
          'pic_photo_or_album', 'pic_weixin', 'location_select'].includes(type)
}

// 添加主菜单
const addMainMenu = () => {
  if (menuGroup.button.length >= 3) {
    ElMessage.warning('最多只能添加3个主菜单')
    return
  }
  
  const newMenu = {
    name: `菜单${menuGroup.button.length + 1}`,
    type: 'click',
    key: `menu_${Date.now()}`,
    sub_button: []
  }
  
  menuGroup.button.push(newMenu)
  selectMenu(menuGroup.button.length - 1)
}

// 添加子菜单
const addSubMenu = () => {
  if (activeMenuIndex.value < 0) return
  
  const mainMenu = menuGroup.button[activeMenuIndex.value]
  if (!mainMenu.sub_button) {
    mainMenu.sub_button = []
  }
  
  if (mainMenu.sub_button.length >= 5) {
    ElMessage.warning('最多只能添加5个子菜单')
    return
  }
  
  const newSubMenu = {
    name: `子菜单${mainMenu.sub_button.length + 1}`,
    type: 'click',
    key: `submenu_${Date.now()}`
  }
  
  mainMenu.sub_button.push(newSubMenu)
  selectSubMenu(activeMenuIndex.value, mainMenu.sub_button.length - 1)
}

// 选择主菜单
const selectMenu = (index) => {
  activeMenuIndex.value = index
  activeSubMenuIndex.value = -1
}

// 选择子菜单
const selectSubMenu = (menuIndex, subIndex) => {
  activeMenuIndex.value = menuIndex
  activeSubMenuIndex.value = subIndex
}

// 删除菜单
const deleteMenu = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这个菜单吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    menuGroup.button.splice(index, 1)
    
    // 重置选择状态
    if (activeMenuIndex.value === index) {
      activeMenuIndex.value = -1
      activeSubMenuIndex.value = -1
    } else if (activeMenuIndex.value > index) {
      activeMenuIndex.value--
    }
    
    ElMessage.success('菜单删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 菜单类型变化处理
const onMenuTypeChange = () => {
  if (!activeItem.value) return
  
  // 清理不需要的字段
  if (!needsKey(activeItem.value.type)) {
    delete activeItem.value.key
  }
  if (activeItem.value.type !== 'view' && activeItem.value.type !== 'miniprogram') {
    delete activeItem.value.url
  }
  if (activeItem.value.type !== 'miniprogram') {
    delete activeItem.value.appid
    delete activeItem.value.pagepath
  }
}

// 选择模板
const selectTemplate = () => {
  ElMessage.info('模板选择功能待实现')
}

// 从微信同步
const syncFromWechat = () => {
  ElMessage.info('从微信同步功能待实现')
}

// 选择素材
const selectMaterial = () => {
  ElMessage.info('素材选择功能待实现')
}

// 保存配置
const saveConfig = async () => {
  try {
    const res = await saveMenu({
      id: menuId.value,
      title: menuGroup.title,
      type: menuGroup.type,
      button: menuGroup.button
    })
    
    if (res.code === 0) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 发布到微信
const publishToWechat = async () => {
  try {
    const res = await publishMenu({
      id: menuId.value,
      button: menuGroup.button
    })
    
    if (res.code === 0) {
      ElMessage.success('发布成功')
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

// 提交菜单
const submitMenu = async (action) => {
  if (action === 'publish') {
    await publishToWechat()
  } else {
    await saveConfig()
  }
}

// 预览菜单
const previewMenu = () => {
  // 使用Bootstrap模态框显示预览
  const modal = new bootstrap.Modal(document.getElementById('previewModal'))
  modal.show()
}

// 关闭预览
const closePreview = () => {
  const modal = bootstrap.Modal.getInstance(document.getElementById('previewModal'))
  if (modal) {
    modal.hide()
  }
}

// 初始化
onMounted(() => {
  // 如果是编辑模式，加载菜单数据
  if (menuId.value) {
    // loadMenuData()
  } else {
    // 新建模式，添加一个默认菜单
    addMainMenu()
  }
})
</script>

<style scoped>
/* 基础样式 */
.conditionMenu {
  background: #fff;
  padding: 20px;
}

.we7-breadcrumb {
  background: transparent;
  padding: 8px 0;
  margin-bottom: 20px;
}

.we7-form {
  max-width: 1200px;
}

/* 菜单设计器 */
.menu-designer {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

/* 工具栏 */
.menu-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

/* 编辑器容器 */
.menu-editor-container {
  display: flex;
  min-height: 500px;
}

/* 左侧菜单列表 */
.menu-list-panel {
  width: 300px;
  border-right: 1px solid #ddd;
  background: #f8f9fa;
}

.menu-items {
  padding: 10px;
}

.menu-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  border-color: #007bff;
}

.menu-item.active {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.menu-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
}

.menu-name {
  font-weight: bold;
  color: #333;
}

.menu-type {
  padding: 0 12px 8px;
  font-size: 12px;
  color: #666;
}

.sub-menu-list {
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.sub-menu-item {
  padding: 8px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sub-menu-item:hover {
  background: #e9ecef;
}

.sub-menu-item.active {
  background: #e3f2fd;
}

.sub-menu-item:last-child {
  border-bottom: none;
}

.sub-menu-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.sub-menu-type {
  font-size: 11px;
  color: #666;
}

/* 右侧编辑面板 */
.menu-edit-panel {
  flex: 1;
  padding: 20px;
}

.edit-form .panel {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.edit-form .panel-heading {
  background: #f8f9fa;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
}

.edit-form .panel-title {
  margin: 0;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-form .panel-body {
  padding: 20px;
}

.edit-form .form-group {
  margin-bottom: 15px;
}

.edit-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.edit-form .form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.edit-form .help-block {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* 未选择状态 */
.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.empty-state {
  text-align: center;
  color: #999;
}

.empty-state i {
  margin-bottom: 15px;
  color: #ccc;
}

/* 底部提交按钮 */
.menu-submit {
  padding: 20px;
  border-top: 1px solid #ddd;
  background: #f8f9fa;
  text-align: center;
}

.menu-submit .btn {
  margin: 0 5px;
  min-width: 80px;
}

/* 手机预览样式 */
.mobile-preview {
  width: 320px;
  margin: 20px auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.mobile-preview-hd {
  background: #393a3f;
  color: white;
  text-align: center;
  padding: 10px;
  font-size: 14px;
}

.mobile-preview-bd {
  height: 200px;
  background: #f0f0f0;
}

.mobile-preview-ft {
  background: #f8f8f8;
  border-top: 1px solid #ddd;
}

.pre-menu-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.pre-menu-item {
  flex: 1;
  position: relative;
  border-right: 1px solid #ddd;
}

.pre-menu-item:last-child {
  border-right: none;
}

.pre-menu-link {
  display: block;
  padding: 12px 8px;
  text-align: center;
  color: #333;
  text-decoration: none;
  font-size: 12px;
}

.pre-menu-link:hover {
  background: #e9ecef;
}

.icon-menu-dot {
  display: block;
  width: 4px;
  height: 4px;
  background: #666;
  border-radius: 50%;
  margin: 0 auto 5px;
}

.sub-pre-menu-box {
  position: absolute;
  bottom: 100%;
  left: -1px;
  right: -1px;
  background: white;
  border: 1px solid #ddd;
  border-bottom: none;
  display: none;
}

.pre-menu-item:hover .sub-pre-menu-box {
  display: block;
}

.sub-pre-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sub-pre-menu-list li {
  border-bottom: 1px solid #eee;
}

.sub-pre-menu-list li:last-child {
  border-bottom: none;
}

.sub-pre-menu-list a {
  display: block;
  padding: 10px 12px;
  color: #333;
  text-decoration: none;
  font-size: 12px;
}

.sub-pre-menu-list a:hover {
  background: #f0f0f0;
}

.mobile-preview-closed {
  display: block;
  width: 100%;
  margin: 15px 0;
  border: none;
}

/* 素材选择器 */
.material-selector {
  border: 1px dashed #ddd;
  padding: 20px;
  text-align: center;
  border-radius: 4px;
}

.selected-material {
  margin-bottom: 10px;
}

.material-preview {
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-editor-container {
    flex-direction: column;
  }
  
  .menu-list-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  
  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
  }
}
</style> 