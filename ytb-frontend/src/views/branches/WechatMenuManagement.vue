<template>
  <div class="wechat-menu-management">
    <van-nav-bar title="微信菜单管理" left-arrow @click-left="$router.go(-1)" />
    
    <!-- 状态信息 -->
    <div class="status-info">
      <van-cell-group>
        <van-cell title="分支机构" :value="branchInfo.name" />
        <van-cell title="公众号名称" :value="wechatConfig.nickname || '未设置'" />
        <van-cell title="AppID" :value="wechatConfig.app_id" />
        <van-cell title="授权类型" :value="wechatConfig.authorization_type === 'third_party' ? '第三方平台授权' : '直接授权'" />
      </van-cell-group>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-row gutter="12">
        <van-col span="8">
          <van-button type="primary" block @click="syncMenu" :loading="syncing">
            同步到微信
          </van-button>
        </van-col>
        <van-col span="8">
          <van-button type="warning" block @click="showTemplates = true">
            选择模板
          </van-button>
        </van-col>
        <van-col span="8">
          <van-button type="danger" block @click="deleteMenu" :loading="deleting">
            删除菜单
          </van-button>
        </van-col>
      </van-row>
    </div>

    <!-- 菜单编辑器 -->
    <div class="menu-editor">
      <van-cell-group title="菜单配置">
        <div v-for="(menu, index) in menus" :key="index" class="menu-item">
          <van-card>
            <template #title>
              <div class="menu-title">
                <span>一级菜单 {{ index + 1 }}</span>
                <van-button size="mini" type="danger" @click="removeMenu(index)">删除</van-button>
              </div>
            </template>
            
            <div class="menu-form">
              <van-field v-model="menu.name" label="菜单名称" placeholder="请输入菜单名称" />
              
              <van-field 
                v-model="menu.type" 
                label="菜单类型" 
                readonly 
                @click="showMenuTypeSelect(index)"
              />
              
              <van-field 
                v-if="menu.type === 'view'"
                v-model="menu.url" 
                label="链接地址" 
                placeholder="请输入链接地址"
              />
              
              <van-field 
                v-if="menu.type === 'click'"
                v-model="menu.key" 
                label="菜单KEY" 
                placeholder="请输入菜单KEY"
              />
              
              <van-field 
                v-if="menu.type === 'miniprogram'"
                v-model="menu.appid" 
                label="小程序AppID" 
                placeholder="请输入小程序AppID"
              />
              
              <van-field 
                v-if="menu.type === 'miniprogram'"
                v-model="menu.pagepath" 
                label="小程序页面路径" 
                placeholder="请输入页面路径"
              />
              
              <van-field 
                v-if="menu.type === 'miniprogram'"
                v-model="menu.url" 
                label="备用链接" 
                placeholder="不支持小程序时的备用链接"
              />
            </div>
            
            <!-- 子菜单 -->
            <div class="sub-menus">
              <div class="sub-menu-header">
                <span>子菜单</span>
                <van-button size="mini" type="primary" @click="addSubMenu(index)">添加子菜单</van-button>
              </div>
              
              <div v-for="(subMenu, subIndex) in menu.sub_button" :key="subIndex" class="sub-menu-item">
                <van-card>
                  <template #title>
                    <div class="menu-title">
                      <span>子菜单 {{ subIndex + 1 }}</span>
                      <van-button size="mini" type="danger" @click="removeSubMenu(index, subIndex)">删除</van-button>
                    </div>
                  </template>
                  
                  <div class="menu-form">
                    <van-field v-model="subMenu.name" label="菜单名称" placeholder="请输入菜单名称" />
                    
                    <van-field 
                      v-model="subMenu.type" 
                      label="菜单类型" 
                      readonly 
                      @click="showSubMenuTypeSelect(index, subIndex)"
                    />
                    
                    <van-field 
                      v-if="subMenu.type === 'view'"
                      v-model="subMenu.url" 
                      label="链接地址" 
                      placeholder="请输入链接地址"
                    />
                    
                    <van-field 
                      v-if="subMenu.type === 'click'"
                      v-model="subMenu.key" 
                      label="菜单KEY" 
                      placeholder="请输入菜单KEY"
                    />
                    
                    <van-field 
                      v-if="subMenu.type === 'miniprogram'"
                      v-model="subMenu.appid" 
                      label="小程序AppID" 
                      placeholder="请输入小程序AppID"
                    />
                    
                    <van-field 
                      v-if="subMenu.type === 'miniprogram'"
                      v-model="subMenu.pagepath" 
                      label="小程序页面路径" 
                      placeholder="请输入页面路径"
                    />
                    
                    <van-field 
                      v-if="subMenu.type === 'miniprogram'"
                      v-model="subMenu.url" 
                      label="备用链接" 
                      placeholder="不支持小程序时的备用链接"
                    />
                  </div>
                </van-card>
              </div>
            </div>
          </van-card>
        </div>
        
        <div class="add-menu-button">
          <van-button type="primary" block @click="addMenu" :disabled="menus.length >= 3">
            添加一级菜单 ({{ menus.length }}/3)
          </van-button>
        </div>
      </van-cell-group>
    </div>

    <!-- 保存按钮 -->
    <div class="save-button">
      <van-button type="success" block @click="saveMenu" :loading="saving">
        保存菜单配置
      </van-button>
    </div>

    <!-- 菜单类型选择 -->
    <van-action-sheet 
      v-model:show="showMenuType" 
      :actions="menuTypeActions" 
      @select="onMenuTypeSelect"
      cancel-text="取消"
      title="选择菜单类型"
    />

    <!-- 模板选择 -->
    <van-action-sheet 
      v-model:show="showTemplates" 
      title="选择菜单模板"
      cancel-text="取消"
    >
      <div class="template-list">
        <div v-for="template in templates" :key="template.id" class="template-item">
          <van-cell 
            :title="template.name" 
            :label="template.description"
            is-link
            @click="applyTemplate(template.id)"
          />
        </div>
      </div>
    </van-action-sheet>

    <!-- 当前微信菜单 -->
    <van-collapse v-if="currentWechatMenu" v-model="activeCollapse">
      <van-collapse-item title="当前微信菜单" name="1">
        <pre>{{ JSON.stringify(currentWechatMenu, null, 2) }}</pre>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from '@/utils/vant-compat'
import api from '@/utils/request'

export default {
  name: 'WechatMenuManagement',
  setup() {
    const route = useRoute()
    const branchId = route.params.id

    // 响应式数据
    const branchInfo = ref({})
    const wechatConfig = ref({})
    const menus = ref([])
    const currentWechatMenu = ref(null)
    const templates = ref([])
    const activeCollapse = ref([])
    
    // 状态
    const loading = ref(false)
    const saving = ref(false)
    const syncing = ref(false)
    const deleting = ref(false)
    
    // 弹窗状态
    const showMenuType = ref(false)
    const showTemplates = ref(false)
    const currentMenuIndex = ref(-1)
    const currentSubMenuIndex = ref(-1)

    // 菜单类型选项
    const menuTypeActions = [
      { name: '网页链接', value: 'view' },
      { name: '点击事件', value: 'click' },
      { name: '小程序', value: 'miniprogram' },
      { name: '素材', value: 'media_id' }
    ]

    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true
        const response = await api.get(`/api/branches/${branchId}/wechat/menu`)
        
        if (response.data.success) {
          branchInfo.value = response.data.data.branch
          wechatConfig.value = response.data.data.wechat_config
          menus.value = response.data.data.menus || []
          currentWechatMenu.value = response.data.data.current_wechat_menu
        }
      } catch (error) {
        showToast('加载数据失败')
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    // 加载模板
    const loadTemplates = async () => {
      try {
        const response = await api.get(`/api/branches/${branchId}/wechat/menu/templates`)
        if (response.data.success) {
          templates.value = response.data.data
        }
      } catch (error) {
        console.error('加载模板失败:', error)
      }
    }

    // 添加菜单
    const addMenu = () => {
      if (menus.value.length >= 3) {
        showToast('最多只能添加3个一级菜单')
        return
      }
      
      menus.value.push({
        name: '',
        type: 'click',
        key: '',
        url: '',
        media_id: '',
        appid: '',
        pagepath: '',
        sub_button: []
      })
    }

    // 删除菜单
    const removeMenu = (index) => {
      menus.value.splice(index, 1)
    }

    // 添加子菜单
    const addSubMenu = (menuIndex) => {
      if (menus.value[menuIndex].sub_button.length >= 5) {
        showToast('每个一级菜单最多只能添加5个子菜单')
        return
      }
      
      menus.value[menuIndex].sub_button.push({
        name: '',
        type: 'click',
        key: '',
        url: '',
        media_id: '',
        appid: '',
        pagepath: ''
      })
    }

    // 删除子菜单
    const removeSubMenu = (menuIndex, subIndex) => {
      menus.value[menuIndex].sub_button.splice(subIndex, 1)
    }

    // 显示菜单类型选择
    const showMenuTypeSelect = (index) => {
      currentMenuIndex.value = index
      currentSubMenuIndex.value = -1
      showMenuType.value = true
    }

    // 显示子菜单类型选择
    const showSubMenuTypeSelect = (menuIndex, subIndex) => {
      currentMenuIndex.value = menuIndex
      currentSubMenuIndex.value = subIndex
      showMenuType.value = true
    }

    // 选择菜单类型
    const onMenuTypeSelect = (action) => {
      if (currentSubMenuIndex.value >= 0) {
        // 子菜单
        menus.value[currentMenuIndex.value].sub_button[currentSubMenuIndex.value].type = action.value
      } else {
        // 主菜单
        menus.value[currentMenuIndex.value].type = action.value
      }
      showMenuType.value = false
    }

    // 保存菜单
    const saveMenu = async () => {
      try {
        saving.value = true
        
        const response = await api.post(`/api/branches/${branchId}/wechat/menu`, {
          menu: menus.value
        })
        
        if (response.data.success) {
          showToast('保存成功')
        } else {
          showToast(response.data.message || '保存失败')
        }
      } catch (error) {
        showToast('保存失败')
        console.error(error)
      } finally {
        saving.value = false
      }
    }

    // 同步菜单
    const syncMenu = async () => {
      try {
        syncing.value = true
        
        const response = await api.post(`/api/branches/${branchId}/wechat/menu/sync`)
        
        if (response.data.success) {
          showToast('同步成功')
          // 重新加载当前微信菜单
          loadData()
        } else {
          showToast(response.data.message || '同步失败')
        }
      } catch (error) {
        showToast('同步失败')
        console.error(error)
      } finally {
        syncing.value = false
      }
    }

    // 删除菜单
    const deleteMenu = async () => {
      try {
        await showConfirmDialog({
          title: '确认删除',
          message: '确定要删除微信菜单吗？此操作不可恢复。'
        })
        
        deleting.value = true
        
        const response = await api.delete(`/api/branches/${branchId}/wechat/menu`)
        
        if (response.data.success) {
          showToast('删除成功')
          // 重新加载数据
          loadData()
        } else {
          showToast(response.data.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          showToast('删除失败')
          console.error(error)
        }
      } finally {
        deleting.value = false
      }
    }

    // 应用模板
    const applyTemplate = async (templateId) => {
      try {
        await showConfirmDialog({
          title: '确认应用模板',
          message: '应用模板将覆盖当前菜单配置，确定继续吗？'
        })
        
        const response = await api.post(`/api/branches/${branchId}/wechat/menu/apply-template`, {
          template_id: templateId
        })
        
        if (response.data.success) {
          showToast('模板应用成功')
          showTemplates.value = false
          // 重新加载数据
          loadData()
        } else {
          showToast(response.data.message || '应用模板失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          showToast('应用模板失败')
          console.error(error)
        }
      }
    }

    // 生命周期
    onMounted(() => {
      loadData()
      loadTemplates()
    })

    return {
      branchInfo,
      wechatConfig,
      menus,
      currentWechatMenu,
      templates,
      activeCollapse,
      loading,
      saving,
      syncing,
      deleting,
      showMenuType,
      showTemplates,
      menuTypeActions,
      addMenu,
      removeMenu,
      addSubMenu,
      removeSubMenu,
      showMenuTypeSelect,
      showSubMenuTypeSelect,
      onMenuTypeSelect,
      saveMenu,
      syncMenu,
      deleteMenu,
      applyTemplate
    }
  }
}
</script>

<style scoped>
.wechat-menu-management {
  padding-bottom: 20px;
}

.status-info {
  margin: 16px;
}

.action-buttons {
  margin: 16px;
}

.menu-editor {
  margin: 16px;
}

.menu-item {
  margin-bottom: 16px;
}

.menu-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-form {
  padding: 12px;
}

.sub-menus {
  margin-top: 12px;
}

.sub-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f7f8fa;
  font-weight: bold;
}

.sub-menu-item {
  margin-top: 8px;
}

.add-menu-button {
  margin-top: 16px;
}

.save-button {
  margin: 16px;
}

.template-list {
  padding: 16px;
}

.template-item {
  margin-bottom: 8px;
}

pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style> 