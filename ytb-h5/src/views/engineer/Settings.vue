<template>
  <div class="engineer-settings-page">
    <!-- 自定义导航栏 -->
    <div class="custom-navbar">
      <div class="navbar-content">
        <div class="navbar-left" @click="$router.go(-1)">
          <van-icon name="arrow-left" />
          <span>返回</span>
        </div>
        <div class="navbar-title">工作设置</div>
        <div class="navbar-right"></div>
      </div>
    </div>

    <div class="content">
      <!-- 个人信息 -->
      <div class="settings-card">
        <div class="card-title">个人信息</div>
        <div class="settings-list">
          <div class="setting-item" @click="editProfile">
            <van-icon name="user-o" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">头像</div>
              <div class="setting-value">
                <van-image
                  round
                  width="40"
                  height="40"
                  fit="cover"
                  :src="engineerInfo.avatar || '/app/images/profile/default-avatar.png'"
                />
              </div>
            </div>
            <van-icon name="arrow" class="setting-arrow" />
          </div>
          <div class="setting-item" @click="editName">
            <van-icon name="contact" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">姓名</div>
              <div class="setting-value">{{ engineerInfo.name || '未设置' }}</div>
            </div>
            <van-icon name="arrow" class="setting-arrow" />
          </div>
          <div class="setting-item" @click="editPhone">
            <van-icon name="phone-o" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">联系电话</div>
              <div class="setting-value">{{ engineerInfo.phone || '未设置' }}</div>
            </div>
            <van-icon name="arrow" class="setting-arrow" />
          </div>
          <div class="setting-item" @click="editRegion">
            <van-icon name="location-o" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">负责区域</div>
              <div class="setting-value">{{ engineerInfo.region || '未设置' }}</div>
            </div>
            <van-icon name="arrow" class="setting-arrow" />
          </div>
        </div>
      </div>

      <!-- 工作设置 -->
      <div class="settings-card">
        <div class="card-title">工作设置</div>
        <div class="settings-list">
          <div class="setting-item">
            <van-icon name="bell" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">新工单提醒</div>
              <div class="setting-value">
                <van-switch v-model="notifications.newOrder" size="20" />
              </div>
            </div>
          </div>
          <div class="setting-item">
            <van-icon name="volume" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">声音提醒</div>
              <div class="setting-value">
                <van-switch v-model="notifications.sound" size="20" />
              </div>
            </div>
          </div>
          <div class="setting-item">
            <van-icon name="location-o" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">位置上报</div>
              <div class="setting-value">
                <van-switch v-model="notifications.location" size="20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 在线状态 -->
      <div class="settings-card">
        <div class="card-title">在线状态</div>
        <div class="settings-list">
          <div class="setting-item">
            <van-icon name="passed" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">在线接单</div>
              <div class="setting-value">
                <van-switch v-model="onlineStatus" size="20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="settings-card">
        <div class="card-title">安全设置</div>
        <div class="settings-list">
          <div class="setting-item" @click="changePassword">
            <van-icon name="shield-o" class="setting-icon" />
            <div class="setting-content">
              <div class="setting-label">修改密码</div>
            </div>
            <van-icon name="arrow" class="setting-arrow" />
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button type="danger" block @click="logout">退出登录</van-button>
      </div>
    </div>

    <!-- 编辑姓名弹窗 -->
    <van-dialog 
      v-model:show="showNameDialog" 
      title="编辑姓名" 
      show-cancel-button
      @confirm="saveName"
    >
      <div class="dialog-content">
        <van-field
          v-model="editNameValue"
          placeholder="请输入姓名"
        />
      </div>
    </van-dialog>

    <!-- 编辑电话弹窗 -->
    <van-dialog 
      v-model:show="showPhoneDialog" 
      title="编辑电话" 
      show-cancel-button
      @confirm="savePhone"
    >
      <div class="dialog-content">
        <van-field
          v-model="editPhoneValue"
          type="tel"
          placeholder="请输入联系电话"
        />
      </div>
    </van-dialog>

    <!-- 编辑区域弹窗 -->
    <van-dialog 
      v-model:show="showRegionDialog" 
      title="编辑负责区域" 
      show-cancel-button
      @confirm="saveRegion"
    >
      <div class="dialog-content">
        <van-field
          v-model="editRegionValue"
          placeholder="请输入负责区域"
        />
      </div>
    </van-dialog>

    <!-- 修改密码弹窗 -->
    <van-dialog 
      v-model:show="showPasswordDialog" 
      title="修改密码" 
      show-cancel-button
      @confirm="savePassword"
    >
      <div class="dialog-content">
        <van-field
          v-model="oldPassword"
          type="password"
          label="原密码"
          placeholder="请输入原密码"
        />
        <van-field
          v-model="newPassword"
          type="password"
          label="新密码"
          placeholder="请输入新密码"
        />
        <van-field
          v-model="confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入新密码"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon as VanIcon, Image as VanImage, Switch as VanSwitch, Button as VanButton, Dialog as VanDialog, Field as VanField, Toast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 工程师信息
const engineerInfo = ref({
  name: '',
  phone: '',
  region: '',
  avatar: ''
})

// 通知设置
const notifications = ref({
  newOrder: true,
  sound: true,
  location: true
})

// 在线状态
const onlineStatus = ref(true)

// 弹窗状态
const showNameDialog = ref(false)
const showPhoneDialog = ref(false)
const showRegionDialog = ref(false)
const showPasswordDialog = ref(false)

// 编辑值
const editNameValue = ref('')
const editPhoneValue = ref('')
const editRegionValue = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// 页面加载时获取工程师信息
onMounted(() => {
  fetchEngineerInfo()
})

// 获取工程师信息
const fetchEngineerInfo = async () => {
  try {
    // 这里应该调用API获取工程师信息
    // 暂时使用用户存储中的信息
    engineerInfo.value = {
      name: userStore.userName || '',
      phone: userStore.userPhone || '',
      region: '广州市天河区',
      avatar: userStore.userAvatar || ''
    }
  } catch (error) {
    console.error('获取工程师信息失败:', error)
    Toast.fail('获取信息失败')
  }
}

// 编辑姓名
const editName = () => {
  editNameValue.value = engineerInfo.value.name
  showNameDialog.value = true
}

// 保存姓名
const saveName = () => {
  if (!editNameValue.value.trim()) {
    Toast.fail('请输入姓名')
    return false
  }
  engineerInfo.value.name = editNameValue.value
  Toast.success('保存成功')
}

// 编辑电话
const editPhone = () => {
  editPhoneValue.value = engineerInfo.value.phone
  showPhoneDialog.value = true
}

// 保存电话
const savePhone = () => {
  if (!editPhoneValue.value.trim()) {
    Toast.fail('请输入联系电话')
    return false
  }
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(editPhoneValue.value)) {
    Toast.fail('请输入正确的手机号')
    return false
  }
  engineerInfo.value.phone = editPhoneValue.value
  Toast.success('保存成功')
}

// 编辑区域
const editRegion = () => {
  editRegionValue.value = engineerInfo.value.region
  showRegionDialog.value = true
}

// 保存区域
const saveRegion = () => {
  if (!editRegionValue.value.trim()) {
    Toast.fail('请输入负责区域')
    return false
  }
  engineerInfo.value.region = editRegionValue.value
  Toast.success('保存成功')
}

// 修改密码
const changePassword = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showPasswordDialog.value = true
}

// 保存密码
const savePassword = () => {
  if (!oldPassword.value.trim()) {
    Toast.fail('请输入原密码')
    return false
  }
  if (!newPassword.value.trim()) {
    Toast.fail('请输入新密码')
    return false
  }
  if (newPassword.value.length < 6) {
    Toast.fail('密码长度不能少于6位')
    return false
  }
  if (newPassword.value !== confirmPassword.value) {
    Toast.fail('两次输入的密码不一致')
    return false
  }
  
  // 这里应该调用API修改密码
  Toast.success('密码修改成功')
  showPasswordDialog.value = false
}

// 退出登录
const logout = () => {
  VanDialog.confirm({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(() => {
    // 清除用户信息
    userStore.logout()
    // 跳转到登录页面
    router.push('/login')
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.engineer-settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 0 12px;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  cursor: pointer;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  padding: 12px;
}

/* 设置卡片 */
.settings-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.settings-list {
  margin-top: 10px;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  font-size: 20px;
  color: #1989fa;
  margin-right: 10px;
}

.setting-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

.setting-value {
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
}

.setting-arrow {
  color: #ccc;
  font-size: 16px;
  margin-left: 10px;
}

/* 退出登录 */
.logout-section {
  margin-top: 20px;
  padding: 0 12px;
}

/* 弹窗内容 */
.dialog-content {
  padding: 16px;
}

.dialog-content :deep(.van-field) {
  margin-bottom: 12px;
}

.dialog-content :deep(.van-field__label) {
  width: 70px;
}
</style>