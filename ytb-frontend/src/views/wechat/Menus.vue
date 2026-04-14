<template>
  <div class="wechat-menus-page">
    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary" @click="addMenu(0)">
            <el-icon><Plus /></el-icon>
            添加一级菜单
          </el-button>
          <el-alert 
            title="微信公众号菜单最多支持3个一级菜单，每个一级菜单下最多5个二级菜单" 
            type="info" 
            :closable="false"
            show-icon
            style="margin-left: 16px; flex: 1;"
          />
        </div>
        <div class="action-right">
          <el-button @click="loadMenus" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="success" @click="publishMenus" :loading="publishing">
            <el-icon><Upload /></el-icon>
            发布到微信
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 菜单预览 -->
    <el-row :gutter="20">
      <!-- 左侧：菜单编辑区 -->
      <el-col :span="16">
        <el-card shadow="never" class="menu-card">
          <template #header>
            <span>菜单配置</span>
          </template>

          <div v-if="menuList.length === 0" class="empty-menus">
            <el-empty description="暂无菜单，点击上方按钮添加">
              <el-button type="primary" @click="addMenu(0)">添加一级菜单</el-button>
            </el-empty>
          </div>

          <div v-else class="menu-list">
            <div v-for="(menu, index) in menuList" :key="menu.id" class="menu-item">
              <div class="menu-header" @click="selectMenu(menu)">
                <div class="menu-info">
                  <el-icon><Menu /></el-icon>
                  <span class="menu-name">{{ menu.name }}</span>
                  <el-tag v-if="menu.children && menu.children.length > 0" size="small" type="info">
                    {{ menu.children.length }}个子菜单
                  </el-tag>
                </div>
                <div class="menu-actions">
                  <el-button size="small" @click.stop="addMenu(menu.id)" v-if="!menu.children || menu.children.length < 5">
                    添加子菜单
                  </el-button>
                  <el-button size="small" @click.stop="editMenu(menu)">编辑</el-button>
                  <el-button size="small" type="danger" @click.stop="deleteMenu(menu)">删除</el-button>
                </div>
              </div>
              
              <!-- 子菜单 -->
              <div v-if="menu.children && menu.children.length > 0" class="sub-menu-list">
                <div 
                  v-for="subMenu in menu.children" 
                  :key="subMenu.id" 
                  class="sub-menu-item"
                  @click="selectMenu(subMenu)"
                >
                  <div class="sub-menu-info">
                    <el-icon><Document /></el-icon>
                    <span class="menu-name">{{ subMenu.name }}</span>
                    <el-tag size="small">{{ getTypeText(subMenu.type) }}</el-tag>
                  </div>
                  <div class="menu-actions">
                    <el-button size="small" @click.stop="editMenu(subMenu)">编辑</el-button>
                    <el-button size="small" type="danger" @click.stop="deleteMenu(subMenu)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：手机预览 -->
      <el-col :span="8">
        <el-card shadow="never" class="preview-card">
          <template #header>
            <span>手机预览</span>
          </template>
          <div class="phone-preview">
            <div class="phone-frame">
              <div class="phone-screen">
                <div class="phone-header">公众号</div>
                <div class="phone-content"></div>
                <div class="phone-menu-bar">
                  <div 
                    v-for="menu in menuList" 
                    :key="menu.id" 
                    class="phone-menu-item"
                    :class="{ active: selectedMenu?.id === menu.id }"
                    @click="selectMenu(menu)"
                  >
                    {{ menu.name }}
                  </div>
                  <div v-if="menuList.length === 0" class="phone-menu-item placeholder">
                    点击添加菜单
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 菜单编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑菜单' : '添加菜单'"
      width="600px"
    >
      <el-form :model="menuForm" :rules="menuRules" ref="menuFormRef" label-width="100px">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称" maxlength="16" show-word-limit />
        </el-form-item>
        
        <el-form-item label="菜单类型" prop="type" v-if="menuForm.parent_id > 0 || !hasChildren">
          <el-select v-model="menuForm.type" placeholder="请选择菜单类型" style="width: 100%;">
            <el-option 
              v-for="(label, value) in typeOptions" 
              :key="value" 
              :label="label" 
              :value="value" 
            />
          </el-select>
        </el-form-item>

        <!-- 根据类型显示不同的配置项 -->
        <el-form-item label="菜单KEY" v-if="needKey">
          <el-input v-model="menuForm.key" placeholder="用于消息接口推送" />
        </el-form-item>

        <el-form-item label="网页链接" v-if="menuForm.type === 'view'">
          <el-input v-model="menuForm.url" placeholder="请输入网页链接" />
        </el-form-item>

        <el-form-item label="小程序AppID" v-if="menuForm.type === 'miniprogram'">
          <el-input v-model="menuForm.appid_miniprogram" placeholder="请输入小程序AppID" />
        </el-form-item>

        <el-form-item label="小程序页面" v-if="menuForm.type === 'miniprogram'">
          <el-input v-model="menuForm.pagepath" placeholder="请输入小程序页面路径" />
        </el-form-item>

        <el-form-item label="备用链接" v-if="menuForm.type === 'miniprogram'">
          <el-input v-model="menuForm.url" placeholder="旧版微信客户端无法支持小程序时打开的网页" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="menuForm.sort_order" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMenu" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, Menu, Document } from '@element-plus/icons-vue'
import * as wechatApi from '@/api/v1/wechat'

// 状态
const loading = ref(false)
const publishing = ref(false)
const saving = ref(false)
const menuList = ref([])
const typeOptions = ref({})
const selectedMenu = ref(null)

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const hasChildren = ref(false)
const menuFormRef = ref()
const menuForm = reactive({
  id: null,
  parent_id: 0,
  name: '',
  type: '',
  key: '',
  url: '',
  appid_miniprogram: '',
  pagepath: '',
  sort_order: 0
})

const menuRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { max: 16, message: '菜单名称不能超过16个字符', trigger: 'blur' }
  ]
}

// 计算属性
const needKey = computed(() => {
  return ['click', 'scancode_push', 'scancode_waitmsg', 'pic_sysphoto', 
          'pic_photo_or_album', 'pic_weixin', 'location_select'].includes(menuForm.type)
})

// 生命周期
onMounted(() => {
  loadMenus()
  loadTypeOptions()
})

// 方法
const loadMenus = async () => {
  loading.value = true
  try {
    const res = await wechatApi.getMenuList()
    if (res.code === 0) {
      menuList.value = res.data || []
    }
  } catch (error) {
    console.error('加载菜单失败:', error)
    ElMessage.error('加载菜单失败')
  } finally {
    loading.value = false
  }
}

const loadTypeOptions = async () => {
  try {
    const res = await wechatApi.getMenuTypeOptions()
    if (res.code === 0) {
      typeOptions.value = res.data || {}
    }
  } catch (error) {
    console.error('加载类型选项失败:', error)
  }
}

const getTypeText = (type) => {
  return typeOptions.value[type] || type || '目录'
}

const selectMenu = (menu) => {
  selectedMenu.value = menu
}

const addMenu = (parentId) => {
  // 检查一级菜单数量
  if (parentId === 0 && menuList.value.length >= 3) {
    ElMessage.warning('一级菜单最多只能有3个')
    return
  }

  isEdit.value = false
  hasChildren.value = false
  Object.assign(menuForm, {
    id: null,
    parent_id: parentId,
    name: '',
    type: parentId > 0 ? 'view' : '',
    key: '',
    url: '',
    appid_miniprogram: '',
    pagepath: '',
    sort_order: 0
  })
  dialogVisible.value = true
}

const editMenu = (menu) => {
  isEdit.value = true
  hasChildren.value = menu.children && menu.children.length > 0
  Object.assign(menuForm, {
    id: menu.id,
    parent_id: menu.parent_id || 0,
    name: menu.name,
    type: menu.type || '',
    key: menu.key || '',
    url: menu.url || '',
    appid_miniprogram: menu.appid_miniprogram || '',
    pagepath: menu.pagepath || '',
    sort_order: menu.sort_order || 0
  })
  dialogVisible.value = true
}

const saveMenu = async () => {
  try {
    await menuFormRef.value?.validate()
    saving.value = true

    let res
    if (isEdit.value) {
      res = await wechatApi.updateMenu(menuForm.id, menuForm)
    } else {
      res = await wechatApi.createMenu(menuForm)
    }

    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadMenus()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteMenu = async (menu) => {
  try {
    await ElMessageBox.confirm(
      menu.children && menu.children.length > 0 
        ? '删除一级菜单将同时删除其下所有子菜单，确定删除吗？' 
        : '确定要删除这个菜单吗？',
      '确认删除',
      { type: 'warning' }
    )

    const res = await wechatApi.deleteMenu(menu.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadMenus()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const publishMenus = async () => {
  try {
    await ElMessageBox.confirm('确定要将菜单发布到微信公众号吗？', '确认发布', { type: 'warning' })
    
    publishing.value = true
    const res = await wechatApi.publishMenus()
    if (res.code === 0) {
      ElMessage.success('发布成功')
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败')
    }
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.wechat-menus-page {
  padding: 0;
}

.action-card {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.action-right {
  display: flex;
  gap: 12px;
}

.menu-card {
  min-height: 400px;
}

.empty-menus {
  padding: 60px 0;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.3s;
}

.menu-header:hover {
  background: #ecf5ff;
}

.menu-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-name {
  font-weight: 500;
  color: #303133;
}

.menu-actions {
  display: flex;
  gap: 8px;
}

.sub-menu-list {
  border-top: 1px solid #e4e7ed;
}

.sub-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 12px 40px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background 0.3s;
}

.sub-menu-item:last-child {
  border-bottom: none;
}

.sub-menu-item:hover {
  background: #f5f7fa;
}

.sub-menu-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-card {
  position: sticky;
  top: 20px;
}

.phone-preview {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.phone-frame {
  width: 280px;
  height: 500px;
  border: 8px solid #333;
  border-radius: 30px;
  background: #fff;
  overflow: hidden;
}

.phone-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.phone-header {
  height: 44px;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
}

.phone-content {
  flex: 1;
  background: #ededed;
}

.phone-menu-bar {
  display: flex;
  border-top: 1px solid #e4e7ed;
  background: #f7f7f7;
}

.phone-menu-item {
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  font-size: 13px;
  color: #333;
  border-right: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phone-menu-item:last-child {
  border-right: none;
}

.phone-menu-item:hover,
.phone-menu-item.active {
  background: #e4e7ed;
}

.phone-menu-item.placeholder {
  color: #909399;
  font-size: 12px;
}
</style>
