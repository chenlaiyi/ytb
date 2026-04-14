<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="dialogTitle"
    width="800px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="loading"
    >
      <!-- 菜单组名称 -->
      <el-form-item label="菜单组名称" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入菜单组名称"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <!-- 菜单类型（个性化菜单才显示） -->
      <el-form-item v-if="menuType === 3" label="菜单类型">
        <el-radio-group v-model="formData.type">
          <el-radio :label="1">默认菜单</el-radio>
          <el-radio :label="3">个性化菜单</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 个性化菜单匹配规则 -->
      <template v-if="formData.type === 3">
        <el-form-item label="性别">
          <el-select v-model="formData.sex" placeholder="请选择性别" clearable>
            <el-option label="全部" :value="0" />
            <el-option label="男性" :value="1" />
            <el-option label="女性" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="粉丝标签">
          <el-select v-model="formData.group_id" placeholder="请选择粉丝标签" clearable>
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="客户端类型">
          <el-select v-model="formData.client_platform_type" placeholder="请选择客户端类型" clearable>
            <el-option label="全部" :value="0" />
            <el-option label="IOS" :value="1" />
            <el-option label="Android" :value="2" />
            <el-option label="其他" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="地区">
          <el-input
            v-model="formData.area"
            placeholder="请输入地区，如：北京"
            clearable
          />
        </el-form-item>
      </template>

      <!-- 菜单内容 -->
      <el-form-item label="菜单内容" prop="button">
        <div class="menu-builder">
          <div
            v-for="(menu, index) in formData.button"
            :key="index"
            class="menu-item"
          >
            <el-card>
              <template #header>
                <div class="menu-header">
                  <span>一级菜单 {{ index + 1 }}</span>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="removeMenu(index)"
                  >
                    删除
                  </el-button>
                </div>
              </template>

              <!-- 菜单名称 -->
              <el-form-item label="菜单名称" required>
                <el-input
                  v-model="menu.name"
                  placeholder="请输入菜单名称"
                  maxlength="16"
                  show-word-limit
                />
              </el-form-item>

              <!-- 菜单类型 -->
              <el-form-item label="菜单类型">
                <el-select v-model="menu.type" placeholder="请选择菜单类型">
                  <el-option label="点击事件" value="click" />
                  <el-option label="跳转链接" value="view" />
                  <el-option label="小程序" value="miniprogram" />
                  <el-option label="扫码推事件" value="scancode_push" />
                  <el-option label="扫码带提示" value="scancode_waitmsg" />
                  <el-option label="系统拍照发图" value="pic_sysphoto" />
                  <el-option label="拍照或者相册发图" value="pic_photo_or_album" />
                  <el-option label="微信相册发图" value="pic_weixin" />
                  <el-option label="发送位置" value="location_select" />
                </el-select>
              </el-form-item>

              <!-- 根据类型显示不同配置 -->
              <template v-if="menu.type === 'click'">
                <el-form-item label="事件KEY">
                  <el-input v-model="menu.key" placeholder="请输入事件KEY" />
                </el-form-item>
              </template>

              <template v-if="menu.type === 'view'">
                <el-form-item label="链接地址">
                  <el-input v-model="menu.url" placeholder="请输入链接地址" />
                </el-form-item>
              </template>

              <template v-if="menu.type === 'miniprogram'">
                <el-form-item label="小程序AppID">
                  <el-input v-model="menu.appid" placeholder="请输入小程序AppID" />
                </el-form-item>
                <el-form-item label="页面路径">
                  <el-input v-model="menu.pagepath" placeholder="请输入页面路径" />
                </el-form-item>
                <el-form-item label="备用链接">
                  <el-input v-model="menu.url" placeholder="不支持小程序时的备用链接" />
                </el-form-item>
              </template>

              <!-- 子菜单 -->
              <div v-if="menu.sub_button && menu.sub_button.length > 0" class="sub-menus">
                <el-divider>子菜单</el-divider>
                <div
                  v-for="(subMenu, subIndex) in menu.sub_button"
                  :key="subIndex"
                  class="sub-menu-item"
                >
                  <el-card>
                    <template #header>
                      <div class="menu-header">
                        <span>子菜单 {{ subIndex + 1 }}</span>
                        <el-button
                          type="danger"
                          size="small"
                          text
                          @click="removeSubMenu(index, subIndex)"
                        >
                          删除
                        </el-button>
                      </div>
                    </template>

                    <!-- 子菜单配置 -->
                    <el-form-item label="菜单名称" required>
                      <el-input
                        v-model="subMenu.name"
                        placeholder="请输入子菜单名称"
                        maxlength="16"
                        show-word-limit
                      />
                    </el-form-item>

                    <el-form-item label="菜单类型">
                      <el-select v-model="subMenu.type" placeholder="请选择菜单类型">
                        <el-option label="点击事件" value="click" />
                        <el-option label="跳转链接" value="view" />
                        <el-option label="小程序" value="miniprogram" />
                        <el-option label="扫码推事件" value="scancode_push" />
                        <el-option label="扫码带提示" value="scancode_waitmsg" />
                        <el-option label="系统拍照发图" value="pic_sysphoto" />
                        <el-option label="拍照或者相册发图" value="pic_photo_or_album" />
                        <el-option label="微信相册发图" value="pic_weixin" />
                        <el-option label="发送位置" value="location_select" />
                      </el-select>
                    </el-form-item>

                    <!-- 子菜单配置项 -->
                    <template v-if="subMenu.type === 'click'">
                      <el-form-item label="事件KEY">
                        <el-input v-model="subMenu.key" placeholder="请输入事件KEY" />
                      </el-form-item>
                    </template>

                    <template v-if="subMenu.type === 'view'">
                      <el-form-item label="链接地址">
                        <el-input v-model="subMenu.url" placeholder="请输入链接地址" />
                      </el-form-item>
                    </template>

                    <template v-if="subMenu.type === 'miniprogram'">
                      <el-form-item label="小程序AppID">
                        <el-input v-model="subMenu.appid" placeholder="请输入小程序AppID" />
                      </el-form-item>
                      <el-form-item label="页面路径">
                        <el-input v-model="subMenu.pagepath" placeholder="请输入页面路径" />
                      </el-form-item>
                      <el-form-item label="备用链接">
                        <el-input v-model="subMenu.url" placeholder="不支持小程序时的备用链接" />
                      </el-form-item>
                    </template>
                  </el-card>
                </div>

                <el-button
                  v-if="menu.sub_button.length < 5"
                  @click="addSubMenu(index)"
                  type="primary"
                  text
                >
                  添加子菜单
                </el-button>
              </div>
              <el-button
                v-else
                @click="addSubMenu(index)"
                type="primary"
                text
              >
                添加子菜单
              </el-button>
            </el-card>
          </div>

          <el-button
            v-if="formData.button.length < 3"
            @click="addMenu"
            type="primary"
            class="add-menu-btn"
          >
            添加一级菜单
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ readonly ? '关闭' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { branchWechatMenuApi } from '@/api/branchWechatMenu'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  menuData: {
    type: Object,
    default: null
  },
  menuType: {
    type: Number,
    default: 1
  },
  branchId: {
    type: [String, Number],
    required: true
  }
})

// Emits
const emit = defineEmits(['update:visible', 'saved'])

// 响应式数据
const formRef = ref()
const loading = ref(false)
const saving = ref(false)
const groups = ref([])

const formData = reactive({
  title: '',
  type: 1,
  sex: 0,
  group_id: null,
  client_platform_type: 0,
  area: '',
  button: []
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入菜单组名称', trigger: 'blur' }
  ],
  button: [
    { required: true, message: '请至少添加一个菜单', trigger: 'change' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  if (props.menuData?.readonly) return '查看菜单'
  return props.menuData ? '编辑菜单' : '创建菜单'
})

const readonly = computed(() => props.menuData?.readonly)

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initFormData()
    loadGroups()
  }
})

// 方法
const initFormData = () => {
  if (props.menuData) {
    Object.assign(formData, {
      title: props.menuData.title || '',
      type: props.menuData.type || props.menuType,
      sex: props.menuData.sex || 0,
      group_id: props.menuData.group_id || null,
      client_platform_type: props.menuData.client_platform_type || 0,
      area: props.menuData.area || '',
      button: JSON.parse(JSON.stringify(props.menuData.button || []))
    })
  } else {
    Object.assign(formData, {
      title: '',
      type: props.menuType,
      sex: 0,
      group_id: null,
      client_platform_type: 0,
      area: '',
      button: []
    })
  }
}

const loadGroups = async () => {
  try {
    const res = await branchWechatMenuApi.getGroups()
    groups.value = res.data || []
  } catch (error) {
    console.error('加载粉丝分组失败:', error)
  }
}

const addMenu = () => {
  if (formData.button.length >= 3) {
    ElMessage.warning('最多只能添加3个一级菜单')
    return
  }
  
  formData.button.push({
    name: '',
    type: 'click',
    key: '',
    url: '',
    appid: '',
    pagepath: '',
    sub_button: []
  })
}

const removeMenu = (index) => {
  formData.button.splice(index, 1)
}

const addSubMenu = (menuIndex) => {
  const menu = formData.button[menuIndex]
  if (!menu.sub_button) {
    menu.sub_button = []
  }
  
  if (menu.sub_button.length >= 5) {
    ElMessage.warning('每个一级菜单最多只能添加5个子菜单')
    return
  }
  
  menu.sub_button.push({
    name: '',
    type: 'click',
    key: '',
    url: '',
    appid: '',
    pagepath: ''
  })
}

const removeSubMenu = (menuIndex, subIndex) => {
  formData.button[menuIndex].sub_button.splice(subIndex, 1)
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = async () => {
  if (readonly.value) {
    handleClose()
    return
  }

  try {
    await formRef.value.validate()
    
    saving.value = true
    
    if (props.menuData) {
      await branchWechatMenuApi.updateMenu(props.branchId, props.menuData.id, formData)
      ElMessage.success('菜单更新成功')
    } else {
      await branchWechatMenuApi.createMenu(props.branchId, formData)
      ElMessage.success('菜单创建成功')
    }
    
    emit('saved')
    handleClose()
  } catch (error) {
    if (error.message) {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.menu-builder {
  .menu-item {
    margin-bottom: 20px;
  }
  
  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .sub-menus {
    margin-top: 20px;
    
    .sub-menu-item {
      margin-bottom: 15px;
    }
  }
  
  .add-menu-btn {
    width: 100%;
    margin-top: 10px;
  }
}

.dialog-footer {
  text-align: right;
}
</style> 