<template>
  <div class="address-container">
    <NavBar
      title="我的地址"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="address-content">
      <!-- 地址列表 -->
      <div v-if="loading" class="loading-container">
        <Loading />
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="addressList.length === 0" class="empty-state">
        <Icon name="location-o" size="48" />
        <p>暂无收货地址</p>
      </div>
      
      <!-- 地址列表 -->
      <div v-else class="address-list">
        <SwipeCell v-for="(item, index) in addressList" :key="item.id">
          <div class="address-item" @click="handleEdit(item)">
            <div class="address-info">
              <div class="address-contact">
                <span class="contact-name">{{ item.name }}</span>
                <span class="contact-tel">{{ item.tel }}</span>
                <Tag type="primary" v-if="item.isDefault">默认</Tag>
              </div>
              <div class="address-detail">
                {{ item.province }} {{ item.city }} {{ item.county }} {{ item.addressDetail }}
              </div>
            </div>
            <Icon name="edit" class="edit-icon" @click.stop="handleEdit(item)" />
          </div>
          
          <template #right>
            <div class="delete-button" @click="handleDelete(item, index)">
              删除
            </div>
          </template>
        </SwipeCell>
      </div>
      
      <!-- 底部按钮 -->
      <div class="address-footer">
        <Button round block type="primary" icon="plus" @click="handleAdd">
          新增地址
        </Button>
      </div>
    </div>
    
    <!-- 地址编辑弹窗 -->
    <Popup v-model:show="showAddressForm" position="bottom" round :style="{ height: '90%' }">
      <div class="form-header">
        <div class="form-title">{{ isEdit ? '编辑地址' : '新增地址' }}</div>
        <Icon name="cross" @click="showAddressForm = false" />
      </div>
      
      <div class="form-content">
        <AddressEdit
          :address-info="currentAddress"
          :area-list="areaList"
          :show-delete="isEdit"
          :show-set-default="true"
          :show-search-result="false"
          :show-area="true"
          :area-columns-placeholder="['请选择省', '请选择市', '请选择区']"
          @save="onSave"
          @delete="onDelete"
        />
      </div>
    </Popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NavBar, 
  Button, 
  Icon, 
  SwipeCell, 
  Tag, 
  Popup, 
  AddressEdit, 
  Loading 
} from 'vant'
import Toast from '@/utils/toast-fix'
import { areaList } from '@vant/area-data'

const router = useRouter()
const loading = ref(false)
const showAddressForm = ref(false)
const isEdit = ref(false)

// 当前编辑的地址
const currentAddress = ref({})

// 地址列表
const addressList = ref([
  {
    id: '1',
    name: '张三',
    tel: '13000000000',
    province: '广东省',
    city: '深圳市',
    county: '南山区',
    addressDetail: '科技园1号楼',
    areaCode: '440305',
    isDefault: true
  },
  {
    id: '2',
    name: '李四',
    tel: '13111111111',
    province: '广东省',
    city: '广州市',
    county: '天河区',
    addressDetail: '天河路123号',
    areaCode: '440106',
    isDefault: false
  }
])

// 获取地址列表
const fetchAddressList = () => {
  loading.value = true
  
  // 模拟API请求
  setTimeout(() => {
    // 在实际项目中，应该通过API获取地址数据
    // addressList.value = res.data
    loading.value = false
  }, 1000)
}

// 编辑地址
const handleEdit = (address) => {
  isEdit.value = true
  currentAddress.value = JSON.parse(JSON.stringify(address)) // 深拷贝
  showAddressForm.value = true
}

// 新增地址
const handleAdd = () => {
  isEdit.value = false
  currentAddress.value = {}
  showAddressForm.value = true
}

// 删除地址
const handleDelete = (address, index) => {
  Toast.confirm({
    title: '提示',
    message: '确定要删除此地址吗？',
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24',
    cancelButtonText: '取消'
  }).then(() => {
    // 在实际项目中，应该通过API删除地址
    addressList.value.splice(index, 1)
    Toast.success('删除成功')
  }).catch(() => {
    // 取消操作
  })
}

// 保存地址
const onSave = (content) => {
  if (isEdit.value) {
    // 编辑模式 - 更新现有地址
    const index = addressList.value.findIndex(item => item.id === content.id)
    if (index !== -1) {
      addressList.value[index] = content
    }
  } else {
    // 添加模式 - 创建新地址
    content.id = new Date().getTime().toString() // 模拟ID生成
    addressList.value.push(content)
    
    // 如果设为默认地址，取消其他地址的默认状态
    if (content.isDefault) {
      addressList.value.forEach(item => {
        if (item.id !== content.id) {
          item.isDefault = false
        }
      })
    }
  }
  
  showAddressForm.value = false
  Toast.success('保存成功')
}

// 删除地址（从编辑表单中）
const onDelete = (content) => {
  Toast.confirm({
    title: '提示',
    message: '确定要删除此地址吗？',
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24',
    cancelButtonText: '取消'
  }).then(() => {
    const index = addressList.value.findIndex(item => item.id === content.id)
    if (index !== -1) {
      addressList.value.splice(index, 1)
    }
    showAddressForm.value = false
    Toast.success('删除成功')
  }).catch(() => {
    // 取消操作
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchAddressList()
})
</script>

<style scoped>
.address-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.address-content {
  flex: 1;
  padding-bottom: 80px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state :deep(.van-icon) {
  color: #ddd;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 14px;
  color: #999;
}

.address-list {
  padding: 12px;
}

.address-item {
  position: relative;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.address-info {
  flex: 1;
}

.address-contact {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  margin-right: 10px;
}

.contact-tel {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.edit-icon {
  color: #999;
  font-size: 20px;
  margin-left: 10px;
}

.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 100%;
  background-color: #ee0a24;
  color: #fff;
}

.address-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.form-title {
  font-size: 16px;
  font-weight: 500;
}

.form-content {
  height: calc(100% - 50px);
  overflow-y: auto;
}
</style>
