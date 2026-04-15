<template>
  <div class="profile-container">
    <NavBar
      title="个人资料"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="profile-content">
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="handleUploadAvatar">
          <img :src="userInfo.wechat_avatar || userInfo.avatar || '/images/default-avatar.png'" alt="头像" class="avatar-image" />
          <div class="avatar-edit">
            <Icon name="photograph-o" size="20" />
          </div>
        </div>
        <div class="avatar-hint">点击修改头像</div>
      </div>
      
      <Form @submit="handleSubmit" class="form-section">
        <Field 
          v-model="userInfo.name" 
          name="name"
          label="姓名" 
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请输入姓名' }]"
        />
        
        <Field 
          v-model="userInfo.phone" 
          name="phone"
          label="手机号" 
          readonly
          is-link
          @click="goToChangePhone"
        />
        
        <Field 
          v-model="userInfo.email" 
          name="email"
          label="邮箱" 
          placeholder="请输入邮箱"
          type="email"
          :rules="emailRules"
        />
        
        <Field 
          v-model="formattedBirthday" 
          name="birthday"
          label="生日" 
          readonly
          is-link
          placeholder="请选择生日"
          @click="openBirthdayPicker"
        />
        
        <Field 
          v-model="genderText" 
          name="gender"
          label="性别" 
          readonly
          is-link
          placeholder="请选择性别"
          @click="showGenderPicker = true"
        />
        
        <Field 
          v-if="userInfo.wechat_nickname" 
          v-model="userInfo.wechat_nickname" 
          name="wechat_nickname"
          label="微信昵称" 
          readonly
        />
        
        <div class="submit-btn">
          <Button round block type="primary" native-type="submit">保存</Button>
        </div>
      </Form>
    </div>
    
    <!-- 日期选择器 -->
    <Popup v-model:show="showBirthdayPicker" position="bottom" round>
      <div class="date-picker-container">
        <div class="date-picker-header">
          <div class="cancel-btn" @click="showBirthdayPicker = false">取消</div>
          <div class="title">选择生日</div>
          <div class="confirm-btn" @click="confirmBirthday">确定</div>
        </div>
        <div class="date-picker-body">
          <div class="date-column">
            <div class="column-title">年</div>
            <div class="column-items">
              <div 
                v-for="year in yearOptions" 
                :key="year"
                class="date-item" 
                :class="{ active: selectedYear === year }"
                @click="selectedYear = year"
              >
                {{ year }}
              </div>
            </div>
          </div>
          <div class="date-column">
            <div class="column-title">月</div>
            <div class="column-items">
              <div 
                v-for="month in 12" 
                :key="month"
                class="date-item" 
                :class="{ active: selectedMonth === month }"
                @click="selectedMonth = month; updateDays()"
              >
                {{ month }}
              </div>
            </div>
          </div>
          <div class="date-column">
            <div class="column-title">日</div>
            <div class="column-items">
              <div 
                v-for="day in dayOptions" 
                :key="day"
                class="date-item" 
                :class="{ active: selectedDay === day }"
                @click="selectedDay = day"
              >
                {{ day }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Popup>
    
    <!-- 性别选择器 -->
    <Popup v-model:show="showGenderPicker" position="bottom" round>
      <Picker 
        title="选择性别" 
        :columns="genderOptions" 
        @confirm="onGenderConfirm" 
        @cancel="showGenderPicker = false" 
        show-toolbar
      />
    </Popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Field, Button, Icon, Popup, Picker, Form } from 'vant'
import { getUserInfo, updateUserProfile, uploadAvatar } from '@/api/user'
import Toast from '@/utils/toast-fix'
import { formatDate } from '@/utils/format'

const router = useRouter()
const userInfo = ref({
  name: '',           // 对应 app_users 表的 name 字段
  phone: '',          // 对应 app_users 表的 phone 字段
  email: '',          // 对应 app_users 表的 email 字段
  avatar: '',         // 对应 app_users 表的 avatar 字段
  birthday: '',       // 对应 app_users 表的 birthday 字段
  gender: 0,          // 对应 app_users 表的 gender 字段: 0-未知, 1-男, 2-女
  wechat_nickname: '', // 对应 app_users 表的 wechat_nickname 字段
  wechat_avatar: '',   // 对应 app_users 表的 wechat_avatar 字段
  id: null,
  user_id: null
})

// 邮箱验证规则
const emailRules = [
  { 
    pattern: /^$|^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, 
    message: '请输入正确的邮箱格式' 
  }
]

// 日期选择器相关
const showBirthdayPicker = ref(false)

const normalizeBirthdayString = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed)
      return Number.isNaN(date.getTime()) ? '' : trimmed
    }
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed.replace(/\s+/, 'T'))
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
    }
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const formatBirthdayDisplay = (value) => {
  const normalized = normalizeBirthdayString(value)
  return normalized || '请选择'
}

const formattedBirthday = computed(() => formatBirthdayDisplay(userInfo.value.birthday))

// 生成年份选项（1950年到当前年份）
const generateYears = () => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let year = 1950; year <= currentYear; year++) {
    years.push(year)
  }
  return years
}

// 生成月份选项
const generateMonths = () => {
  const months = []
  for (let month = 1; month <= 12; month++) {
    months.push(month < 10 ? `0${month}` : `${month}`)
  }
  return months
}

// 生成天数选项（根据年月判断天数）
const generateDays = (year, month) => {
  const days = []
  const daysInMonth = new Date(year, month, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day < 10 ? `0${day}` : `${day}`)
  }
  return days
}

// 当前选择的年月日
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1 < 10 ? 
  `0${new Date().getMonth() + 1}` : 
  `${new Date().getMonth() + 1}`)
const selectedDay = ref(new Date().getDate() < 10 ? 
  `0${new Date().getDate()}` : 
  `${new Date().getDate()}`)

// 生成选择器数据
let yearOptions = ref(generateYears())
let dayOptions = ref(generateDays(selectedYear.value, parseInt(selectedMonth.value)))

// 初始化生日选择器
const isValidBirthdayString = (value) => {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

const initBirthdayPicker = () => {
  try {
    if (userInfo.value.birthday) {
      const birthday = normalizeBirthdayString(userInfo.value.birthday)
      if (birthday) {
        const [year, month, day] = birthday.split('-')
        selectedYear.value = Number(year)
        selectedMonth.value = month
        selectedDay.value = day
      } else {
        // 如果日期无效，使用当前日期
        const now = new Date()
        selectedYear.value = now.getFullYear()
        selectedMonth.value = now.getMonth() + 1 < 10 ? 
          `0${now.getMonth() + 1}` : 
          `${now.getMonth() + 1}`
        selectedDay.value = now.getDate() < 10 ? 
          `0${now.getDate()}` : 
          `${now.getDate()}`
      }
    } else {
      // 如果没有生日，默认选择一个合理的日期(例如1990年)
      selectedYear.value = 1990
      selectedMonth.value = '01'
      selectedDay.value = '01'
    }
    
    // 更新选择器的数据
    yearOptions.value = generateYears()
    dayOptions.value = generateDays(selectedYear.value, parseInt(selectedMonth.value))
  } catch (error) {
    console.error('初始化生日选择器错误:', error)
  }
}

// 日期变化处理（当选择年或月时，重新计算天数）
const updateDays = () => {
  try {
    dayOptions.value = generateDays(selectedYear.value, parseInt(selectedMonth.value))
  } catch (error) {
    console.error('生日选择变化处理错误:', error)
  }
}

// 日期确认
const confirmBirthday = () => {
  try {
    console.log('生日选择器确认结果:', { year: selectedYear.value, month: selectedMonth.value, day: selectedDay.value })
    
    if (!selectedYear.value || !selectedMonth.value || !selectedDay.value) {
      console.error('生日选择器确认值不完整:', { year: selectedYear.value, month: selectedMonth.value, day: selectedDay.value })
      showBirthdayPicker.value = false
      return
    }
    const year = String(selectedYear.value).padStart(4, '0')
    const month = String(selectedMonth.value).padStart(2, '0')
    const day = String(selectedDay.value).padStart(2, '0')
    const candidate = `${year}-${month}-${day}`
    if (!normalizeBirthdayString(candidate)) {
      Toast({ type: 'fail', message: '生日格式不正确，请重新选择' })
      return
    }

    // 格式化生日字符串
    userInfo.value.birthday = candidate
    showBirthdayPicker.value = false
  } catch (error) {
    console.error('生日确认处理错误:', error)
    showBirthdayPicker.value = false
  }
}

// 性别选择器相关
const showGenderPicker = ref(false)
const genderOptions = [
  { text: '男', value: 1 },
  { text: '女', value: 2 },
  { text: '保密', value: 0 }
]

const apiGenderToValue = (raw) => {
  if (raw === null || raw === undefined) return 0
  if (typeof raw === 'number') {
    return [0, 1, 2].includes(raw) ? raw : 0
  }
  const normalized = String(raw).toLowerCase()
  if (['1', 'male', 'm', '男'].includes(normalized)) return 1
  if (['2', 'female', 'f', '女'].includes(normalized)) return 2
  return 0
}

const valueToApiGender = (value) => {
  const num = apiGenderToValue(value)
  if (num === 1) return 'male'
  if (num === 2) return 'female'
  return 'other'
}
const genderText = computed(() => {
  const gender = apiGenderToValue(userInfo.value.gender)
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '保密'
})

const userIdForSubmit = computed(() => {
  const info = userInfo.value || {}
  return Number(info.id || info.user_id || info.userId || info.uid || 0)
})

// 性别确认
const onGenderConfirm = ({ selectedValues }) => {
  userInfo.value.gender = apiGenderToValue(selectedValues?.[0])
  showGenderPicker.value = false
}

// 修改手机号
const goToChangePhone = () => {
  router.push('/user/settings/change-phone')
}

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!userInfo.value.name) {
    Toast({ type: 'fail', message: '请输入姓名' })
    return
  }
  const submitUserId = userIdForSubmit.value
  if (!submitUserId) {
    Toast({ type: 'fail', message: '无法识别用户身份，请重新登录后再试' })
    return
  }
  
  // 邮箱验证
  if (userInfo.value.email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(userInfo.value.email)) {
    Toast({ type: 'fail', message: '请输入正确的邮箱格式' })
    return
  }
  
  // 调用更新API
  try {
    Toast.loading({
      message: '保存中...',
      forbidClick: true,
    })
    
    const birthdayPayload = normalizeBirthdayString(userInfo.value.birthday)
    const payload = {
      user_id: submitUserId,
      name: userInfo.value.name,
      email: userInfo.value.email,
      gender: valueToApiGender(userInfo.value.gender),
      // 不需要提交phone，因为修改手机号有专门的流程
    }
    if (birthdayPayload) {
      payload.birthday = birthdayPayload
    }
    if (!payload.email) {
      delete payload.email
    }

    const res = await updateUserProfile(payload)
    
    Toast.clear()
    
    if (res.code === 0) {
      Toast.success('保存成功')
      // 更新成功后返回
      setTimeout(() => {
        router.back()
      }, 1000)
    } else {
      Toast({ type: 'fail', message: res.message || '保存失败' })
    }
  } catch (error) {
    Toast.clear()
    console.error('保存个人资料失败', error)
    Toast({ type: 'fail', message: '保存失败，请稍后重试' })
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    Toast.loading({
      message: '加载中...',
      forbidClick: true
    })
    
    const res = await getUserInfo()
    
    Toast.clear()
    
    if (res.code === 0 && res.data) {
      // 将API返回的数据映射到本地表单
      userInfo.value = {
        ...userInfo.value,
        ...res.data,
        // 确保字段名称一致性
        name: res.data.name || res.data.nickname || res.data.wechat_nickname || '',
        gender: apiGenderToValue(res.data.gender),
        birthday: normalizeBirthdayString(res.data.birthday),
        id: res.data.id ?? userInfo.value.id ?? null,
        user_id: res.data.user_id ?? res.data.id ?? userInfo.value.user_id ?? null
      }
      
      // 如果有生日数据，设置日期选择器的初始值
      initBirthdayPicker()
    } else {
      Toast({ type: 'fail', message: '获取用户信息失败' })
    }
  } catch (error) {
    Toast.clear()
    console.error('获取用户信息失败', error)
    Toast({ type: 'fail', message: '获取用户信息失败，请稍后重试' })
  }
}

// 处理上传头像
const handleUploadAvatar = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 检查文件类型和大小
    if (!file.type.includes('image')) {
      Toast({ type: 'fail', message: '请上传图片文件' })
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      Toast({ type: 'fail', message: '图片大小不能超过2MB' })
      return
    }
    
    // 调用上传API
    try {
      Toast.loading({
        message: '上传中...',
        forbidClick: true,
      })
      
      const res = await uploadAvatar({
        file: file
      })
      
      Toast.clear()
      
      if (res.code === 0 && res.data && res.data.avatarUrl) {
        Toast.success('头像上传成功')
        
        // 更新头像URL
        userInfo.value.avatar = res.data.avatarUrl
      } else {
        Toast({ type: 'fail', message: res.message || '上传失败' })
      }
    } catch (error) {
      Toast.clear()
      console.error('上传头像失败', error)
      Toast({ type: 'fail', message: '上传失败，请稍后重试' })
    }
  }
  input.click()
}

// 打开生日选择器
const openBirthdayPicker = () => {
  // 每次打开前重新初始化选择器
  initBirthdayPicker()
  showBirthdayPicker.value = true
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.profile-content {
  padding: 16px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 30px;
}

.avatar-wrapper {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #333;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.avatar-hint {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.form-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 8px 0;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.submit-btn {
  margin: 24px 16px;
}

/* 适配深色模式 */
@media (prefers-color-scheme: dark) {
  .avatar-wrapper {
    border-color: #333;
  }
  
  .form-section {
    background-color: #1a1a1a;
    box-shadow: none;
  }
  
  .avatar-image {
    background-color: #333;
  }
}

/* 生日选择器样式 */
.date-picker-container {
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.title {
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn, .confirm-btn {
  font-size: 14px;
  padding: 10px 0;
  cursor: pointer;
}

.cancel-btn {
  color: #666;
}

.confirm-btn {
  color: #1989fa;
  font-weight: 500;
}

.date-picker-body {
  display: flex;
  height: 260px;
  overflow: hidden;
}

.date-column {
  flex: 1;
  text-align: center;
  overflow: hidden;
}

.column-title {
  padding: 10px 0;
  font-size: 14px;
  color: #646566;
  background-color: #f7f8fa;
}

.column-items {
  height: 220px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.date-item {
  height: 44px;
  line-height: 44px;
  cursor: pointer;
  font-size: 16px;
  color: #323233;
}

.date-item.active {
  color: #1989fa;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .date-picker-container {
    background-color: #2c2c2c;
  }
  
  .date-picker-header {
    border-bottom-color: #3a3a3a;
  }
  
  .title {
    color: #fff;
  }
  
  .cancel-btn {
    color: #aaa;
  }
  
  .column-title {
    color: #aaa;
    background-color: #333;
  }
  
  .date-item {
    color: #fff;
  }
}
</style> 
