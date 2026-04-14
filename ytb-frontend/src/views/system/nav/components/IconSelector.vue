<template>
  <div class="icon-selector">
    <el-input
      v-model="iconValue"
      :placeholder="placeholder"
      @input="updateIcon"
      clearable
    >
      <template #prepend>
        <div class="icon-preview-box">
          <i :class="['van-icon', `van-icon-${iconValue}`]"
             :style="{color: iconValue ? '#409EFF' : '#c8c9cc', fontSize: '18px', backgroundColor: iconValue ? '#409EFF' : '#c8c9cc'}"></i>
        </div>
      </template>
      <template #append>
        <el-button @click="showIconDialog = true" type="primary">选择图标</el-button>
      </template>
    </el-input>

    <!-- 图标选择对话框 -->
    <el-dialog
      v-model="showIconDialog"
      title="选择图标"
      width="800px"
      destroy-on-close
      center
      class="icon-selector-dialog"
    >
      <div class="dialog-header">
        <div class="selected-icon" v-if="iconValue">
          <div class="selected-preview">
            <i :class="['van-icon', `van-icon-${iconValue}`]"
              :style="{color: primaryColor, fontSize: '32px'}"></i>
          </div>
          <div class="selected-name">已选: {{ iconValue }}</div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="icon-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索图标名称"
          prefix-icon="Search"
          clearable
          @input="filterIcons"
        >
          <template #append>
            <el-button @click="filterIcons" :disabled="!searchKeyword">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 常用图标 -->
      <div class="icon-category" v-if="!searchKeyword">
        <div class="category-title">
          <el-tag type="primary" effect="plain" size="small">常用图标</el-tag>
        </div>
        <div class="icon-grid">
          <div
            v-for="(icon, index) in commonIcons"
            :key="`common-${index}`"
            class="icon-item"
            :class="{'active': iconValue === icon.name}"
            @click="selectIcon(icon.name)"
          >
            <div class="icon-box">
              <i :class="['van-icon', `van-icon-${icon.name}`]"
                :style="{color: '#fff', backgroundColor: iconValue === icon.name ? primaryColor : '#606266'}"></i>
            </div>
            <span>{{ icon.label }}</span>
          </div>
        </div>
      </div>

      <!-- 全部图标或搜索结果 -->
      <div class="icon-category">
        <div class="category-title">
          <el-tag type="success" effect="plain" size="small">
            {{ searchKeyword ? `搜索结果 (${displayIcons.length})` : '全部图标' }}
          </el-tag>
        </div>

        <div class="empty-result" v-if="displayIcons.length === 0">
          <el-empty description="没有找到匹配的图标" :image-size="100"></el-empty>
        </div>

        <div class="icon-grid" v-else>
          <div
            v-for="(icon, index) in displayIcons"
            :key="`all-${index}`"
            class="icon-item"
            :class="{'active': iconValue === icon.name}"
            @click="selectIcon(icon.name)"
          >
            <div class="icon-box">
              <i :class="['van-icon', `van-icon-${icon.name}`]"
                :style="{color: '#fff', backgroundColor: iconValue === icon.name ? primaryColor : '#606266'}"></i>
            </div>
            <span>{{ icon.name }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showIconDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmIconSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

// 组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择图标'
  }
})

// 事件
const emit = defineEmits(['update:modelValue', 'change'])

// 状态变量
const iconValue = ref(props.modelValue)
const showIconDialog = ref(false)
const searchKeyword = ref('')
const primaryColor = '#409EFF'

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  iconValue.value = newVal
})

// 常用图标
const commonIcons = [
  { name: 'home-o', label: '首页' },
  { name: 'cart-o', label: '购物车' },
  { name: 'shop-o', label: '商店' },
  { name: 'gift-o', label: '礼品' },
  { name: 'coupon-o', label: '优惠券' },
  { name: 'location-o', label: '位置' },
  { name: 'gem-o', label: '宝石' },
  { name: 'gold-coin-o', label: '金币' },
  { name: 'user-o', label: '用户' },
  { name: 'setting-o', label: '设置' },
  { name: 'apps-o', label: '应用' },
  { name: 'star-o', label: '星星' },
  { name: 'friends-o', label: '好友' },
  { name: 'chat-o', label: '消息' },
  { name: 'service-o', label: '客服' },
  { name: 'smile-o', label: '笑脸' },
  { name: 'balance-o', label: '钱包' },
  { name: 'photo-o', label: '相册' },
  { name: 'question-o', label: '问题' },
  { name: 'label-o', label: '标签' },
  { name: 'phone-o', label: '电话' },
  { name: 'point-gift-o', label: '礼物' },
  { name: 'orders-o', label: '订单' },
  { name: 'free-postage', label: '免邮' },
  { name: 'bag-o', label: '包包' },
  { name: 'cluster-o', label: '集群' },
  { name: 'todo-list-o', label: '列表' },
  { name: 'thumb-circle-o', label: '点赞' },
  { name: 'idcard', label: '身份证' },
  { name: 'cash-back-record', label: '返现' },
]

// 全部图标
const allIcons = [
  { name: 'apps-o' },
  { name: 'arrow-down' },
  { name: 'arrow-left' },
  { name: 'arrow-up' },
  { name: 'arrow' },
  { name: 'cart-o' },
  { name: 'cart' },
  { name: 'close' },
  { name: 'contact' },
  { name: 'coupon-o' },
  { name: 'coupon' },
  { name: 'delete' },
  { name: 'edit' },
  { name: 'gem-o' },
  { name: 'gift-o' },
  { name: 'gold-coin-o' },
  { name: 'home-o' },
  { name: 'info-o' },
  { name: 'location-o' },
  { name: 'orders-o' },
  { name: 'plus' },
  { name: 'records' },
  { name: 'search' },
  { name: 'setting-o' },
  { name: 'shop-o' },
  { name: 'shop' },
  { name: 'star-o' },
  { name: 'star' },
  { name: 'todo-list-o' },
  { name: 'todo-list' },
  { name: 'upgrade' },
  { name: 'user-circle-o' },
  { name: 'user-o' },
  { name: 'like-o' },
  { name: 'like' },
  { name: 'chat' },
  { name: 'chat-o' },
  { name: 'bag-o' },
  { name: 'bag' },
  { name: 'medal' },
  { name: 'medal-o' },
  { name: 'cluster-o' },
  { name: 'cluster' },
  { name: 'friends-o' },
  { name: 'friends' },
  { name: 'question-o' },
  { name: 'question' },
  { name: 'balance-o' },
  { name: 'service-o' },
  { name: 'service' },
  { name: 'refund-o' },
  { name: 'send-gift-o' },
  { name: 'logistics' },
  { name: 'cash-back-record' },
  { name: 'manager-o' },
  { name: 'label' },
  { name: 'label-o' },
  { name: 'more-o' },
  { name: 'more' },
  { name: 'phone-o' },
  { name: 'phone' },
  { name: 'smile' },
  { name: 'smile-o' },
  { name: 'music' },
  { name: 'music-o' },
  { name: 'thumb-circle-o' },
  { name: 'thumb-circle' },
  { name: 'free-postage' },
  { name: 'enlarge' },
  { name: 'photograph' },
  { name: 'photo-o' },
  { name: 'photo' },
  { name: 'idcard' },
  { name: 'play-circle-o' },
  { name: 'play-circle' },
  { name: 'pause-circle-o' },
  { name: 'pause' },
  { name: 'pause-circle' },
  { name: 'share' },
  { name: 'share-o' },
  { name: 'point-gift' },
  { name: 'point-gift-o' },
  { name: 'paid' },
  { name: 'after-sale' },
  { name: 'flower-o' },
  { name: 'vip-card-o' },
  { name: 'discount' },
  { name: 'clock-o' },
  { name: 'new-o' },
  { name: 'new-arrival-o' },
  { name: 'underway-o' },
  { name: 'description' },
  { name: 'comment-o' },
  { name: 'comment' },
  { name: 'completed' },
  { name: 'certificate' },
  { name: 'desktop-o' },
  { name: 'warn-o' }
]

// 过滤图标
const displayIcons = ref(allIcons)

const filterIcons = () => {
  if (!searchKeyword.value) {
    displayIcons.value = allIcons
    return
  }

  const keyword = searchKeyword.value.toLowerCase()
  displayIcons.value = allIcons.filter(icon =>
    icon.name.toLowerCase().includes(keyword)
  )
}

// 方法
const updateIcon = () => {
  emit('update:modelValue', iconValue.value)
  emit('change', iconValue.value)
}

const selectIcon = (iconName) => {
  iconValue.value = iconName
  updateIcon()
}

const confirmIconSelection = () => {
  updateIcon()
  showIconDialog.value = false
}
</script>

<style scoped>
.icon-selector {
  width: 100%;
}

.icon-preview-box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-selector-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.dialog-header {
  padding-bottom: 15px;
  display: flex;
  justify-content: center;
}

.selected-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 30px;
  border-radius: 6px;
  background-color: #f5f7fa;
}

.selected-preview {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 50%;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selected-name {
  font-size: 14px;
  color: #606266;
}

.icon-search {
  margin-bottom: 20px;
}

.category-title {
  margin-bottom: 15px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
}

.icon-item:hover {
  background-color: #f5f7fa;
}

.icon-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
}

.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.icon-box i {
  width: 24px;
  height: 24px;
  mask-size: cover !important;
  -webkit-mask-size: cover !important;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-position: center;
}

.icon-item.active .icon-box {
  background-color: #409EFF;
  color: #fff;
}

.icon-item.active .icon-box i {
  color: #fff !important;
  background-color: #fff !important;
}

.icon-item span {
  font-size: 12px;
  word-break: break-all;
  text-align: center;
  line-height: 1.2;
}

.empty-result {
  padding: 30px 0;
}
</style>