<template>
  <div class="menu-action-config">
    <!-- 菜单类型选择 -->
    <el-form-item label="菜单类型">
      <el-select 
        v-model="localMenuData.type" 
        :disabled="disabled"
        @change="onTypeChange"
        style="width: 100%"
      >
        <el-option-group label="基础类型">
          <el-option label="点击推事件" value="click" />
          <el-option label="跳转URL" value="view" />
        </el-option-group>
        <el-option-group label="扫码类型">
          <el-option label="扫码推事件" value="scancode_push" />
          <el-option label="扫码带提示" value="scancode_waitmsg" />
        </el-option-group>
        <el-option-group label="发图类型">
          <el-option label="系统拍照发图" value="pic_sysphoto" />
          <el-option label="拍照或者相册发图" value="pic_photo_or_album" />
          <el-option label="微信相册发图" value="pic_weixin" />
        </el-option-group>
        <el-option-group label="其他类型">
          <el-option label="发送位置" value="location_select" />
          <el-option label="下发消息（除文本消息）" value="media_id" />
          <el-option label="跳转图文消息URL" value="view_limited" />
          <el-option label="调起小程序" value="miniprogram" />
        </el-option-group>
      </el-select>
    </el-form-item>

    <!-- 根据类型显示不同的配置 -->
    <div v-if="localMenuData.type === 'click'" class="action-config">
      <!-- 点击推事件配置 -->
      <el-form-item label="事件类型">
        <el-radio-group v-model="eventType" @change="onEventTypeChange" :disabled="disabled">
          <el-radio label="keyword">关键字回复</el-radio>
          <el-radio label="material">素材回复</el-radio>
          <el-radio label="module">功能模块</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 关键字回复 -->
      <div v-if="eventType === 'keyword'" class="keyword-config">
        <el-form-item label="关键字">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input 
              v-model="keywordValue" 
              placeholder="输入关键字"
              :disabled="disabled"
              @input="updateKeyword"
            />
            <el-button @click="selectKeyword" :disabled="disabled">选择关键字</el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 素材回复 -->
      <div v-if="eventType === 'material'" class="material-config">
        <el-form-item label="素材类型">
          <el-select v-model="materialType" @change="onMaterialTypeChange" :disabled="disabled">
            <el-option label="图文消息" value="news" />
            <el-option label="图片" value="image" />
            <el-option label="语音" value="voice" />
            <el-option label="视频" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择素材">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input 
              v-model="materialName" 
              placeholder="选择素材"
              readonly
              :disabled="disabled"
            />
            <el-button @click="selectMaterial" :disabled="disabled">选择素材</el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 功能模块 -->
      <div v-if="eventType === 'module'" class="module-config">
        <el-form-item label="功能模块">
          <el-select v-model="moduleValue" @change="updateModule" :disabled="disabled" style="width: 100%">
            <el-option 
              v-for="module in moduleList" 
              :key="module.value" 
              :label="module.label" 
              :value="module.value" 
            />
          </el-select>
        </el-form-item>
      </div>
    </div>

    <!-- 跳转URL配置 -->
    <div v-if="localMenuData.type === 'view'" class="url-config">
      <el-form-item label="跳转链接">
        <el-input 
          v-model="localMenuData.url" 
          placeholder="请输入完整的URL地址，如：https://www.example.com"
          :disabled="disabled"
          @input="onChange"
        />
        <div class="config-tips">
          <el-alert type="info" :closable="false" show-icon>
            链接必须以http://或https://开头
          </el-alert>
        </div>
      </el-form-item>
    </div>

    <!-- 小程序配置 -->
    <div v-if="localMenuData.type === 'miniprogram'" class="miniprogram-config">
      <el-form-item label="小程序AppID">
        <el-input 
          v-model="localMenuData.appid" 
          placeholder="小程序的AppID"
          :disabled="disabled"
          @input="onChange"
        />
      </el-form-item>
      <el-form-item label="小程序页面路径">
        <el-input 
          v-model="localMenuData.pagepath" 
          placeholder="小程序页面路径，如：pages/index/index"
          :disabled="disabled"
          @input="onChange"
        />
      </el-form-item>
      <el-form-item label="备用网页">
        <el-input 
          v-model="localMenuData.url" 
          placeholder="不支持小程序的老版本客户端将打开本网页"
          :disabled="disabled"
          @input="onChange"
        />
      </el-form-item>
    </div>

    <!-- 素材消息配置 -->
    <div v-if="localMenuData.type === 'media_id'" class="media-config">
      <el-form-item label="素材类型">
        <el-select v-model="materialType" @change="onMaterialTypeChange" :disabled="disabled">
          <el-option label="图文消息" value="news" />
          <el-option label="图片" value="image" />
          <el-option label="语音" value="voice" />
          <el-option label="视频" value="video" />
        </el-select>
      </el-form-item>
      <el-form-item label="选择素材">
        <div style="display: flex; gap: 10px; width: 100%;">
          <el-input 
            v-model="materialName" 
            placeholder="选择素材"
            readonly
            :disabled="disabled"
          />
          <el-button @click="selectMaterial" :disabled="disabled">选择素材</el-button>
        </div>
      </el-form-item>
    </div>

    <!-- 图文消息URL配置 -->
    <div v-if="localMenuData.type === 'view_limited'" class="view-limited-config">
      <el-form-item label="图文消息">
        <div style="display: flex; gap: 10px; width: 100%;">
          <el-input 
            v-model="materialName" 
            placeholder="选择图文消息"
            readonly
            :disabled="disabled"
          />
          <el-button @click="selectNewsMaterial" :disabled="disabled">选择图文</el-button>
        </div>
      </el-form-item>
    </div>

    <!-- 其他类型的提示 -->
    <div v-if="['scancode_push', 'scancode_waitmsg', 'pic_sysphoto', 'pic_photo_or_album', 'pic_weixin', 'location_select'].includes(localMenuData.type)" class="other-config">
      <el-alert type="info" :closable="false" show-icon>
        {{ getTypeDescription(localMenuData.type) }}
      </el-alert>
    </div>

    <!-- 素材选择对话框 -->
    <MaterialSelector
      v-model:visible="materialSelectorVisible"
      :material-type="materialType"
      @select="onMaterialSelect"
    />

    <!-- 关键字选择对话框 -->
    <KeywordSelector
      v-model:visible="keywordSelectorVisible"
      @select="onKeywordSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import MaterialSelector from './MaterialSelector.vue'
import KeywordSelector from './KeywordSelector.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const localMenuData = ref({})
const eventType = ref('keyword') // keyword, material, module
const keywordValue = ref('')
const materialType = ref('news')
const materialName = ref('')
const moduleValue = ref('')

// 对话框状态
const materialSelectorVisible = ref(false)
const keywordSelectorVisible = ref(false)

// 模块列表
const moduleList = ref([
  { label: '商城首页', value: 'shop:index' },
  { label: '个人中心', value: 'user:profile' },
  { label: '订单查询', value: 'order:list' },
  { label: '积分商城', value: 'points:shop' },
  { label: '优惠券', value: 'coupon:list' },
  { label: '客服中心', value: 'service:center' },
  { label: '关于我们', value: 'about:us' },
  { label: '联系我们', value: 'contact:us' }
])

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localMenuData.value = { ...newValue }
    parseMenuData()
  }
}, { immediate: true, deep: true })

// 监听本地数据变化
watch(localMenuData, (newValue) => {
  emit('update:modelValue', newValue)
  emit('change', newValue)
}, { deep: true })

// 方法
const parseMenuData = () => {
  const menu = localMenuData.value
  
  if (menu.type === 'click' && menu.key) {
    if (menu.key.startsWith('keyword:')) {
      eventType.value = 'keyword'
      keywordValue.value = menu.key.substring(8)
    } else if (menu.key.includes(':')) {
      const parts = menu.key.split(':')
      if (parts[0] === 'module') {
        eventType.value = 'module'
        moduleValue.value = menu.key
      } else {
        eventType.value = 'material'
        // 解析素材信息
      }
    }
  }
}

const onTypeChange = () => {
  // 重置相关字段
  localMenuData.value.key = ''
  localMenuData.value.url = ''
  localMenuData.value.media_id = ''
  localMenuData.value.appid = ''
  localMenuData.value.pagepath = ''
  
  // 根据类型设置默认的key
  if (localMenuData.value.type !== 'view' && localMenuData.value.type !== 'miniprogram') {
    localMenuData.value.key = localMenuData.value.type
  }
  
  onChange()
}

const onEventTypeChange = () => {
  keywordValue.value = ''
  materialName.value = ''
  moduleValue.value = ''
  localMenuData.value.key = ''
  onChange()
}

const updateKeyword = () => {
  if (keywordValue.value) {
    localMenuData.value.key = `keyword:${keywordValue.value}`
  } else {
    localMenuData.value.key = ''
  }
  onChange()
}

const updateModule = () => {
  localMenuData.value.key = moduleValue.value
  onChange()
}

const onMaterialTypeChange = () => {
  materialName.value = ''
  localMenuData.value.media_id = ''
  onChange()
}

const selectKeyword = () => {
  keywordSelectorVisible.value = true
}

const selectMaterial = () => {
  materialSelectorVisible.value = true
}

const selectNewsMaterial = () => {
  materialType.value = 'news'
  materialSelectorVisible.value = true
}

const onKeywordSelect = (keyword) => {
  keywordValue.value = keyword.keyword
  updateKeyword()
}

const onMaterialSelect = (material) => {
  materialName.value = material.title || material.name
  
  if (localMenuData.value.type === 'click') {
    localMenuData.value.key = material.media_id
  } else if (localMenuData.value.type === 'media_id') {
    localMenuData.value.media_id = material.media_id
  } else if (localMenuData.value.type === 'view_limited') {
    localMenuData.value.media_id = material.media_id
  }
  
  onChange()
}

const getTypeDescription = (type) => {
  const descriptions = {
    'scancode_push': '用户点击按钮后，微信客户端将调起扫一扫工具，完成扫码操作后显示扫描结果（如果是URL，将进入URL），且会将扫码的结果传给开发者，开发者可以下发消息。',
    'scancode_waitmsg': '用户点击按钮后，微信客户端将调起扫一扫工具，完成扫码操作后，将扫码的结果传给开发者，同时收起扫一扫工具，然后弹出"消息接收中"提示框，随后可能会收到开发者下发的消息。',
    'pic_sysphoto': '用户点击按钮后，微信客户端将调起系统相机，完成拍照操作后，会将拍摄的照片发送给开发者，并推送事件给开发者，同时收起系统相机，随后可能会收到开发者下发的消息。',
    'pic_photo_or_album': '用户点击按钮后，微信客户端将弹出选择器供用户选择"拍照"或者"从手机相册选择"。用户选择后即走其他两种流程。',
    'pic_weixin': '用户点击按钮后，微信客户端将调起微信相册，完成选择操作后，将选择的照片发送给开发者的服务器，并推送事件给开发者，同时收起相册，随后可能会收到开发者下发的消息。',
    'location_select': '用户点击按钮后，微信客户端将调起地理位置选择工具，完成选择操作后，将选择的地理位置发送给开发者的服务器，同时收起位置选择工具，随后可能会收到开发者下发的消息。'
  }
  return descriptions[type] || '该类型菜单将推送事件给开发者。'
}

const onChange = () => {
  emit('update:modelValue', localMenuData.value)
  emit('change', localMenuData.value)
}
</script>

<style scoped>
.menu-action-config {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
}

.action-config,
.url-config,
.miniprogram-config,
.media-config,
.view-limited-config,
.other-config {
  margin-top: 15px;
}

.config-tips {
  margin-top: 8px;
}

.keyword-config,
.material-config,
.module-config {
  margin-top: 15px;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-alert) {
  font-size: 12px;
}

:deep(.el-alert .el-alert__content) {
  line-height: 1.4;
}
</style> 