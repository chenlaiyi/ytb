<template>
  <div class="conditionMenu menu-post-page" id="conditionMenuDesigner">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>微信自定义菜单</h2>
      <p class="text-muted">为您的公众号设置自定义菜单，提升用户体验</p>
    </div>

    <!-- 菜单状态控制 -->
    <div class="platform-menu-status" style="margin-bottom: 20px;">
      <div class="status-card" style="display: flex; align-items: center; padding: 15px; background: #f8f8f8; border-radius: 6px;">
        <div class="icon" style="margin-right: 15px;">
          <i class="el-icon-menu" style="font-size: 24px; color: #409eff;"></i>
        </div>
        <div class="desc" style="flex: 1;">
          <div class="item" style="font-size: 16px; font-weight: bold;">自定义菜单</div>
          <div class="item color-gray" style="color: #999; font-size: 14px;">该功能{{ menuStatus ? '已开启' : '未启用' }}</div>
        </div>
        <div class="action">
          <el-button 
            :type="menuStatus ? 'danger' : 'primary'" 
            @click="toggleMenuStatus"
            :loading="statusLoading"
          >
            {{ menuStatus ? '停用' : '启用' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 菜单功能未开启提示 -->
    <div v-if="!menuStatus" class="platform-menu-close" style="text-align: center; padding: 40px; color: #999;">
      <i class="el-icon-info" style="font-size: 48px; margin-bottom: 15px;"></i>
      <p>自定义菜单功能未开启，开启后可以进行菜单编辑</p>
    </div>

    <!-- 菜单编辑区域 -->
    <div v-if="menuStatus" class="menu-setting-area" style="display: flex; gap: 20px;">
      <!-- 左侧手机预览 -->
      <div class="menu-preview-area" style="flex: 0 0 350px;">
        <div class="mobile-menu-preview" style="width: 320px; border: 1px solid #e5e5e5; border-radius: 18px; background: #fff; overflow: hidden;">
          <!-- 手机头部 -->
          <div class="mobile-hd" style="height: 60px; background: url('/admin/images/iphone_head.png') center center no-repeat; position: relative;">
            <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px;">
              {{ currentBranch.name }}微信公众号
            </div>
          </div>
          
          <!-- 手机内容区 -->
          <div class="mobile-bd" style="min-height: 568px; background: #f9f9f9; position: relative;">
            <!-- 微信菜单栏 -->
            <div class="nav-menu-wx" 
                 style="position: absolute; bottom: 0; left: 0; right: 0; background: #fafafa; border-top: 1px solid #e5e5e5; height: 50px;"
                 :class="`has-nav-${menuData.length}`">
              <ul class="pre-menu-list" style="display: flex; height: 100%; margin: 0; padding: 0; list-style: none;">
                <!-- 主菜单项 -->
                <li v-for="(menu, index) in menuData" 
                    :key="index"
                    class="pre-menu-item"
                    :class="{ 'active': selectedMenu === menu }"
                    style="flex: 1; height: 100%; border-right: 1px solid #e5e5e5; position: relative;"
                    @click="selectMenu(menu)">
                  <a href="javascript:void(0);" 
                     class="pre-menu-link" 
                     style="display: block; height: 100%; line-height: 50px; text-align: center; color: #333; text-decoration: none; font-size: 14px; position: relative;">
                    <i v-if="menu.sub_button && menu.sub_button.length > 0" 
                       class="icon-menu-dot" 
                       style="position: absolute; top: 8px; right: 8px; width: 4px; height: 4px; background: #999; border-radius: 50%;"></i>
                    {{ menu.name }}
                  </a>
                  
                  <!-- 子菜单 -->
                  <div v-if="menu.sub_button && menu.sub_button.length > 0 && selectedMenu === menu" 
                       class="sub-pre-menu-box"
                       style="position: absolute; bottom: 50px; left: 0; right: 0; background: #fff; border: 1px solid #e5e5e5; border-bottom: none;">
                    <ul class="sub-pre-menu-list" style="margin: 0; padding: 0; list-style: none;">
                      <li v-for="(subMenu, subIndex) in menu.sub_button" 
                          :key="subIndex"
                          style="border-bottom: 1px solid #e5e5e5; height: 40px; line-height: 40px;"
                          @click.stop="selectSubMenu(subMenu, menu)">
                        <span class="sub-pre-menu-inner" 
                              style="display: block; padding: 0 15px; color: #333; cursor: pointer; font-size: 14px;"
                              :class="{ 'active': selectedSubMenu === subMenu }">
                          {{ subMenu.name }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </li>
                
                <!-- 添加菜单按钮 -->
                <li v-if="menuData.length < 3" 
                    class="pre-menu-item add-menu"
                    style="flex: 1; height: 100%; border-right: 1px solid #e5e5e5;"
                    @click="addMainMenu">
                  <a href="javascript:void(0);" 
                     class="pre-menu-link" 
                     style="display: block; height: 100%; line-height: 50px; text-align: center; color: #999; text-decoration: none; font-size: 14px;">
                    <i class="el-icon-plus" style="margin-right: 5px;"></i>
                    添加菜单
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧配置表单 -->
      <div class="menu-form-area" style="flex: 1;">
        <!-- 默认提示 -->
        <div v-if="!selectedMenu && !selectedSubMenu" class="menu-initial-tips" style="text-align: center; padding: 60px; color: #999; font-size: 16px;">
          <i class="el-icon-edit" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
          点击左侧菜单进行编辑操作
        </div>

        <!-- 菜单编辑表单 -->
        <div v-if="selectedMenu || selectedSubMenu" class="portable-editor" style="background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px;">
          <div class="menu-form-hd" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e5e5e5;">
            <span class="font-default" style="font-size: 16px; font-weight: bold;">
              {{ selectedSubMenu ? '子菜单设置' : '主菜单设置' }}
            </span>
            <div class="text-right">
              <el-button type="text" @click="removeCurrentMenu" style="color: #f56c6c;">
                删除该菜单
              </el-button>
            </div>
          </div>

          <el-form :model="currentEditMenu" label-width="100px">
            <!-- 菜单名称 -->
            <el-form-item label="菜单名称" required>
              <el-input 
                v-model="currentEditMenu.name" 
                placeholder="请输入菜单名称"
                maxlength="8"
                show-word-limit>
                <template #append>
                  <el-button @click="selectEmoji">添加表情</el-button>
                </template>
              </el-input>
              <div class="help-text" style="color: #999; font-size: 12px; margin-top: 5px;">
                字数不超过5个汉字或8个字母
              </div>
            </el-form-item>

            <!-- 菜单内容类型 -->
            <el-form-item v-if="!hasSubMenus" label="菜单内容">
              <el-radio-group v-model="currentEditMenu.type">
                <el-radio label="click">发送消息</el-radio>
                <el-radio label="view">跳转网页</el-radio>
                <el-radio label="miniprogram">关联小程序</el-radio>
                <el-radio label="scancode_push">扫码</el-radio>
                <el-radio label="scancode_waitmsg">扫码（等待信息）</el-radio>
                <el-radio label="location_select">地理位置</el-radio>
                <el-radio label="pic_sysphoto">拍照发图</el-radio>
                <el-radio label="pic_photo_or_album">拍照相册</el-radio>
                <el-radio label="pic_weixin">相册发图</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 跳转网页配置 -->
            <div v-if="currentEditMenu.type === 'view'" class="menu-content">
              <el-form-item label="页面地址" required>
                <el-input 
                  v-model="currentEditMenu.url" 
                  placeholder="请输入网页链接地址">
                </el-input>
                <div class="help-text" style="color: #999; font-size: 12px; margin-top: 5px;">
                  请输入完整的网页地址，如：https://www.example.com
                </div>
              </el-form-item>
            </div>

            <!-- 小程序配置 -->
            <div v-if="currentEditMenu.type === 'miniprogram'" class="menu-content">
              <el-form-item label="小程序AppID" required>
                <el-input 
                  v-model="currentEditMenu.appid" 
                  placeholder="请输入小程序AppID">
                </el-input>
              </el-form-item>
              <el-form-item label="小程序页面路径" required>
                <el-input 
                  v-model="currentEditMenu.pagepath" 
                  placeholder="请输入小程序页面路径">
                </el-input>
              </el-form-item>
              <el-form-item label="备用网页" required>
                <el-input 
                  v-model="currentEditMenu.url" 
                  placeholder="不支持小程序的老版本客户端将打开本网页">
                </el-input>
              </el-form-item>
            </div>

            <!-- 发送消息配置 -->
            <div v-if="currentEditMenu.type === 'click'" class="menu-content">
              <el-form-item label="关键词">
                <el-input 
                  v-model="currentEditMenu.key" 
                  placeholder="请输入关键词">
                </el-input>
                <div class="help-text" style="color: #999; font-size: 12px; margin-top: 5px;">
                  用户点击菜单时，将发送此关键词到公众号
                </div>
              </el-form-item>

              <el-form-item label="回复类型">
                <el-radio-group v-model="replyType">
                  <el-radio label="text">文字</el-radio>
                  <el-radio label="image">图片</el-radio>
                  <el-radio label="news">图文</el-radio>
                  <el-radio label="voice">语音</el-radio>
                  <el-radio label="video">视频</el-radio>
                  <el-radio label="music">音乐</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 文字回复 -->
              <el-form-item v-if="replyType === 'text'" label="回复内容">
                <el-input 
                  type="textarea" 
                  v-model="replyContent.text" 
                  :rows="4"
                  placeholder="请输入回复的文字内容"
                  maxlength="600"
                  show-word-limit>
                </el-input>
              </el-form-item>

              <!-- 图片回复 -->
              <el-form-item v-if="replyType === 'image'" label="选择图片">
                <el-upload
                  class="image-uploader"
                  action="/admin/api/upload"
                  :show-file-list="false"
                  :on-success="handleImageSuccess"
                  accept="image/*">
                  <img v-if="replyContent.image" :src="replyContent.image" class="image-preview" style="width: 200px; height: 150px; object-fit: cover;">
                  <i v-else class="el-icon-plus image-uploader-icon" style="font-size: 28px; color: #8c939d; width: 200px; height: 150px; line-height: 150px; text-align: center; border: 1px dashed #d9d9d9;"></i>
                </el-upload>
              </el-form-item>
            </div>

            <!-- 子菜单管理 -->
            <div v-if="selectedMenu && !selectedSubMenu" class="sub-menu-management" style="margin-top: 30px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 14px;">子菜单管理</h4>
                <el-button 
                  v-if="selectedMenu.sub_button.length < 5" 
                  type="primary" 
                  size="small" 
                  @click="addSubMenu">
                  添加子菜单
                </el-button>
              </div>
              
              <div v-if="selectedMenu.sub_button.length > 0" class="sub-menu-list">
                <div v-for="(subMenu, index) in selectedMenu.sub_button" 
                     :key="index" 
                     class="sub-menu-item"
                     style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #e5e5e5; margin-bottom: 10px; border-radius: 4px;">
                  <span>{{ subMenu.name || '未命名子菜单' }}</span>
                  <div>
                    <el-button type="text" @click="selectSubMenu(subMenu, selectedMenu)">编辑</el-button>
                    <el-button type="text" @click="removeSubMenu(index)" style="color: #f56c6c;">删除</el-button>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-sub-menu" style="text-align: center; padding: 20px; color: #999; border: 1px dashed #e5e5e5; border-radius: 4px;">
                暂无子菜单，点击上方按钮添加
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div v-if="menuStatus" class="menu-actions" style="margin-top: 30px; text-align: center; padding: 20px; border-top: 1px solid #e5e5e5;">
      <el-button @click="syncFromWechat" :loading="syncLoading">从微信同步</el-button>
      <el-button type="primary" @click="saveMenu" :loading="saveLoading">保存配置</el-button>
      <el-button type="success" @click="publishToWechat" :loading="publishLoading">发布到微信</el-button>
    </div>

    <!-- 表情选择器弹窗 -->
    <el-dialog v-model="emojiDialogVisible" title="选择表情" width="600px">
      <div class="emoji-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; max-height: 300px; overflow-y: auto;">
        <div v-for="emoji in emojiList" 
             :key="emoji" 
             class="emoji-item"
             style="padding: 10px; text-align: center; cursor: pointer; border: 1px solid #e5e5e5; border-radius: 4px; font-size: 20px;"
             @click="insertEmoji(emoji)">
          {{ emoji }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { branchApi } from '@/api/branch'

export default {
  name: 'WechatMenu',
  setup() {
    // 响应式数据
    const menuStatus = ref(true)
    const statusLoading = ref(false)
    const menuData = ref([])
    const selectedMenu = ref(null)
    const selectedSubMenu = ref(null)
    const currentEditMenu = ref({})
    const currentBranch = ref({ name: '分支机构' })
    const replyType = ref('text')
    const replyContent = reactive({
      text: '',
      image: '',
      news: [],
      voice: '',
      video: '',
      music: {}
    })
    const syncLoading = ref(false)
    const saveLoading = ref(false)
    const publishLoading = ref(false)
    const emojiDialogVisible = ref(false)
    const emojiList = ref(['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'])

    // 计算属性
    const hasSubMenus = computed(() => {
      return selectedMenu.value && selectedMenu.value.sub_button && selectedMenu.value.sub_button.length > 0
    })

    // 方法
    const toggleMenuStatus = async () => {
      statusLoading.value = true
      try {
        // 调用API切换菜单状态
        await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
        menuStatus.value = !menuStatus.value
        ElMessage.success(menuStatus.value ? '菜单已启用' : '菜单已停用')
      } catch (error) {
        ElMessage.error('操作失败：' + error.message)
      } finally {
        statusLoading.value = false
      }
    }

    const selectMenu = (menu) => {
      selectedMenu.value = menu
      selectedSubMenu.value = null
      currentEditMenu.value = { ...menu }
    }

    const selectSubMenu = (subMenu, parentMenu) => {
      selectedMenu.value = parentMenu
      selectedSubMenu.value = subMenu
      currentEditMenu.value = { ...subMenu }
    }

    const addMainMenu = () => {
      if (menuData.value.length >= 3) {
        ElMessage.warning('最多只能添加3个主菜单')
        return
      }
      
      const newMenu = {
        name: '新菜单',
        type: 'click',
        key: '',
        url: '',
        sub_button: []
      }
      
      menuData.value.push(newMenu)
      selectMenu(newMenu)
    }

    const addSubMenu = () => {
      if (!selectedMenu.value) return
      
      if (selectedMenu.value.sub_button.length >= 5) {
        ElMessage.warning('每个主菜单最多只能添加5个子菜单')
        return
      }
      
      const newSubMenu = {
        name: '新子菜单',
        type: 'click',
        key: '',
        url: ''
      }
      
      selectedMenu.value.sub_button.push(newSubMenu)
      selectSubMenu(newSubMenu, selectedMenu.value)
    }

    const removeCurrentMenu = async () => {
      try {
        await ElMessageBox.confirm('确定要删除这个菜单吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        if (selectedSubMenu.value) {
          // 删除子菜单
          const index = selectedMenu.value.sub_button.indexOf(selectedSubMenu.value)
          if (index > -1) {
            selectedMenu.value.sub_button.splice(index, 1)
          }
          selectedSubMenu.value = null
        } else if (selectedMenu.value) {
          // 删除主菜单
          const index = menuData.value.indexOf(selectedMenu.value)
          if (index > -1) {
            menuData.value.splice(index, 1)
          }
          selectedMenu.value = null
        }
        
        currentEditMenu.value = {}
        ElMessage.success('菜单已删除')
      } catch (error) {
        // 用户取消删除
      }
    }

    const removeSubMenu = async (index) => {
      try {
        await ElMessageBox.confirm('确定要删除这个子菜单吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        selectedMenu.value.sub_button.splice(index, 1)
        ElMessage.success('子菜单已删除')
      } catch (error) {
        // 用户取消删除
      }
    }

    const selectEmoji = () => {
      emojiDialogVisible.value = true
    }

    const insertEmoji = (emoji) => {
      if (currentEditMenu.value.name) {
        currentEditMenu.value.name += emoji
      } else {
        currentEditMenu.value.name = emoji
      }
      emojiDialogVisible.value = false
    }

    const handleImageSuccess = (response) => {
      replyContent.image = response.url
      ElMessage.success('图片上传成功')
    }

    const syncFromWechat = async () => {
      syncLoading.value = true
      try {
        // 调用同步API
        const response = await branchApi.syncWechatMenu(1) // 假设分支机构ID为1
        menuData.value = response.data || []
        ElMessage.success('从微信同步成功')
      } catch (error) {
        ElMessage.error('同步失败：' + error.message)
      } finally {
        syncLoading.value = false
      }
    }

    const saveMenu = async () => {
      saveLoading.value = true
      try {
        // 保存当前编辑的菜单
        if (selectedSubMenu.value) {
          Object.assign(selectedSubMenu.value, currentEditMenu.value)
        } else if (selectedMenu.value) {
          Object.assign(selectedMenu.value, currentEditMenu.value)
        }
        
        // 调用保存API
        await branchApi.saveWechatMenu(1, { menu: menuData.value })
        ElMessage.success('菜单配置已保存')
      } catch (error) {
        ElMessage.error('保存失败：' + error.message)
      } finally {
        saveLoading.value = false
      }
    }

    const publishToWechat = async () => {
      publishLoading.value = true
      try {
        // 调用发布API
        await branchApi.publishWechatMenu(1, { menu: menuData.value })
        ElMessage.success('菜单已发布到微信服务器')
      } catch (error) {
        ElMessage.error('发布失败：' + error.message)
      } finally {
        publishLoading.value = false
      }
    }

    const loadMenuData = async () => {
      try {
        const response = await branchApi.getWechatMenu(1)
        menuData.value = response.data || []
        
        // 获取分支机构信息
        const branchResponse = await branchApi.getBranchInfo(1)
        currentBranch.value = branchResponse.data || { name: '分支机构' }
      } catch (error) {
        console.error('加载菜单数据失败：', error)
        // 设置默认数据
        menuData.value = [
          {
            name: 'VIP中心',
            type: 'view',
            url: 'https://pay.itapgo.com/app/#/?branch_code=YXY02',
            sub_button: []
          }
        ]
      }
    }

    // 生命周期
    onMounted(() => {
      loadMenuData()
    })

    return {
      menuStatus,
      statusLoading,
      menuData,
      selectedMenu,
      selectedSubMenu,
      currentEditMenu,
      currentBranch,
      replyType,
      replyContent,
      syncLoading,
      saveLoading,
      publishLoading,
      emojiDialogVisible,
      emojiList,
      hasSubMenus,
      toggleMenuStatus,
      selectMenu,
      selectSubMenu,
      addMainMenu,
      addSubMenu,
      removeCurrentMenu,
      removeSubMenu,
      selectEmoji,
      insertEmoji,
      handleImageSuccess,
      syncFromWechat,
      saveMenu,
      publishToWechat
    }
  }
}
</script>

<style scoped>
.conditionMenu {
  padding: 20px;
  background: #fff;
}

.menu-setting-area {
  min-height: 600px;
}

.mobile-menu-preview {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pre-menu-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.pre-menu-item:hover {
  background-color: #f5f5f5;
}

.pre-menu-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.pre-menu-item:last-child {
  border-right: none;
}

.sub-pre-menu-box {
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sub-pre-menu-inner:hover {
  background-color: #f5f5f5;
}

.sub-pre-menu-inner.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.portable-editor {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.help-text {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.emoji-item:hover {
  background-color: #f5f5f5;
  border-color: #1890ff;
}

.image-preview {
  border-radius: 4px;
  border: 1px solid #e5e5e5;
}

.sub-menu-item:hover {
  background-color: #f5f5f5;
}

.menu-actions {
  background: #f8f9fa;
}
</style> 