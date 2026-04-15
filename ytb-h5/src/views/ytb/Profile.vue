<template>
  <div class="ytb-profile">
    <van-nav-bar title="个人中心" left-arrow @click-left="goBack" />

    <!-- 用户信息 -->
    <div class="user-section">
      <van-cell-group inset>
        <van-cell title="头像" is-link center>
          <template #value>
            <van-image
              round
              width="48"
              height="48"
              :src="userInfo.avatar || defaultAvatar"
            />
          </template>
        </van-cell>
        <van-cell title="昵称" :value="userInfo.nickname || '未设置'" />
        <van-cell title="角色" :value="userInfo.role_name || '普通用户'" />
        <van-cell title="邀请码" :value="userInfo.invite_code || '暂无'" v-if="userInfo.can_invite" />
      </van-cell-group>
    </div>

    <!-- 基本信息 -->
    <div class="info-section">
      <van-cell-group inset title="基本信息">
        <van-cell title="真实姓名" is-link @click="editField('real_name')">
          <template #value>
            {{ userInfo.real_name || '未填写' }}
          </template>
        </van-cell>
        <van-cell title="手机号" is-link @click="editField('phone')">
          <template #value>
            {{ maskPhone(userInfo.phone) || '未绑定' }}
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 上级信息 -->
    <div class="parent-section" v-if="userInfo.parent">
      <van-cell-group inset title="我的上级">
        <van-cell 
          :title="userInfo.parent.nickname || '未知'"
          :label="userInfo.parent.role_name"
        >
          <template #icon>
            <van-image
              round
              width="40"
              height="40"
              :src="userInfo.parent.avatar || defaultAvatar"
              style="margin-right: 12px;"
            />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 其他操作 -->
    <div class="action-section">
      <van-cell-group inset>
        <van-cell title="关于亿拓宝" is-link @click="showAbout" />
        <van-cell title="联系客服" is-link @click="contactService" />
      </van-cell-group>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <van-button type="danger" plain block @click="handleLogout">
        退出登录
      </van-button>
    </div>

    <!-- 编辑弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      :title="editTitle"
      show-cancel-button
      @confirm="confirmEdit"
    >
      <van-field
        v-model="editValue"
        :placeholder="editPlaceholder"
        :type="editType"
        :maxlength="editMaxLength"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { getUserInfo, updateUserInfo, logout, clearAuth, isLoggedIn } from '@/api/ytb'
import { useYtbShare } from '@/composables/useYtbShare'

// 设置亿拓宝分享配置
useYtbShare('亿拓宝联盟 - 个人中心')

const router = useRouter()

// 默认头像
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="50"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle">Y</text></svg>'

// 状态
const userInfo = ref({})
const showEditDialog = ref(false)
const currentEditField = ref('')
const editValue = ref('')
const editTitle = ref('')
const editPlaceholder = ref('')
const editType = ref('text')
const editMaxLength = ref(50)

// 初始化
onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace('/ytb/login')
    return
  }

  await loadUserInfo()
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0) {
      userInfo.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 编辑字段
const editField = (field) => {
  currentEditField.value = field
  
  if (field === 'real_name') {
    editTitle.value = '修改真实姓名'
    editPlaceholder.value = '请输入真实姓名'
    editValue.value = userInfo.value.real_name || ''
    editType.value = 'text'
    editMaxLength.value = 50
  } else if (field === 'phone') {
    editTitle.value = '修改手机号'
    editPlaceholder.value = '请输入手机号'
    editValue.value = userInfo.value.phone || ''
    editType.value = 'tel'
    editMaxLength.value = 11
  }
  
  showEditDialog.value = true
}

// 确认编辑
const confirmEdit = async () => {
  if (!editValue.value.trim()) {
    showToast('请输入内容')
    return
  }

  try {
    const res = await updateUserInfo({
      [currentEditField.value]: editValue.value.trim()
    })
    
    if (res.code === 0) {
      showSuccessToast('修改成功')
      userInfo.value[currentEditField.value] = editValue.value.trim()
    } else {
      showToast(res.message || '修改失败')
    }
  } catch (error) {
    showToast('网络错误')
  }
}

// 手机号脱敏
const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

// 显示关于
const showAbout = () => {
  showDialog({
    title: '关于亿拓宝',
    message: '亿拓宝联盟是一个专业的分销平台，致力于为合作伙伴提供优质的服务和丰厚的回报。\n\n版本：1.0.0',
    confirmButtonText: '我知道了'
  })
}

// 联系客服
const contactService = () => {
  showDialog({
    title: '联系客服',
    message: '客服热线：400-xxx-xxxx\n工作时间：9:00-18:00',
    confirmButtonText: '我知道了'
  })
}

// 退出登录
const handleLogout = async () => {
  try {
    await showDialog({
      title: '提示',
      message: '确定要退出登录吗？',
      showCancelButton: true
    })
    
    await logout()
    clearAuth()
    router.replace('/ytb/login')
  } catch (error) {
    // 用户取消
  }
}

// 返回
const goBack = () => router.back()
</script>

<style scoped>
.ytb-profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.user-section,
.info-section,
.parent-section,
.action-section {
  margin-top: 12px;
}

.logout-section {
  padding: 20px 16px;
}
</style>
