<template>
  <div class="about-container">
    <NavBar
      title="关于我们"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />
    
    <div class="about-content">
      <div class="app-info">
        <img src="/images/logo.png" alt="点点够Logo" class="app-logo" />
        <div class="app-name">点点够</div>
        <div class="app-version">版本 1.0.409</div>
      </div>
      
      <div class="about-section">
        <Cell title="公司介绍" is-link @click="goToIntroduction">
          <template #icon>
            <Icon name="shop-o" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell title="联系我们" is-link @click="goToContact">
          <template #icon>
            <Icon name="service-o" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell title="官方网站" is-link @click="openOfficialWebsite">
          <template #icon>
            <Icon name="link-o" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <div class="about-section">
        <Cell title="用户协议" is-link @click="goToAgreement">
          <template #icon>
            <Icon name="notes-o" class="cell-icon" />
          </template>
        </Cell>
        
        <Cell title="隐私政策" is-link @click="goToPrivacy">
          <template #icon>
            <Icon name="shield-o" class="cell-icon" />
          </template>
        </Cell>
      </div>
      
      <div class="about-section">
        <Cell title="版本更新" is-link @click="checkUpdate">
          <template #icon>
            <Icon name="upgrade" class="cell-icon" />
          </template>
          <template #right-icon>
            <Tag v-if="hasNewVersion" type="danger" round>有新版本</Tag>
          </template>
        </Cell>
      </div>
      
      <div class="company-info">

        <div class="company-copyright">Copyright © 2023 点点够 All Rights Reserved</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Cell, Icon, Tag } from 'vant'
import Toast from '@/utils/toast-fix'
import { checkAppVersion } from '@/api/user'

const router = useRouter()
const hasNewVersion = ref(false)
const appInfo = ref({
  version: '1.0.409',
  buildNumber: '409',
  lastUpdated: '2023-01-01'
})

// 跳转到公司介绍
const goToIntroduction = () => {
  router.push('/user/settings/introduction')
}

// 跳转到联系我们
const goToContact = () => {
  router.push('/user/settings/contact')
}

// 跳转到用户协议
const goToAgreement = () => {
  router.push('/user/settings/agreement')
}

// 跳转到隐私政策
const goToPrivacy = () => {
  router.push('/user/settings/privacy')
}

// 打开官方网站
const openOfficialWebsite = () => {
  window.open('https://www.itapgo.com', '_blank')
}

// 检查更新
const checkUpdate = async () => {
  try {
    Toast.loading({
      message: '检查更新中...',
      forbidClick: true,
    })
    
    const res = await checkAppVersion({
      currentVersion: appInfo.value.version,
      platform: 'h5'
    })
    
    Toast.clear()
    
    if (res.code === 0) {
      if (res.data && res.data.hasNewVersion) {
        // 有新版本
        Toast.confirm({
          title: '发现新版本',
          message: `最新版本：${res.data.latestVersion}\n${res.data.updateContent}`,
          confirmButtonText: '立即更新',
          confirmButtonColor: '#1989fa',
          cancelButtonText: '稍后再说'
        }).then(() => {
          // 执行更新操作
          if (res.data.downloadUrl) {
            window.location.href = res.data.downloadUrl
          }
        }).catch(() => {
          // 取消更新
        })
      } else {
        // 已是最新版本
        Toast.success('已是最新版本')
      }
    } else {
      Toast({ type: 'fail', message: res.message || '检查更新失败' })
    }
  } catch (error) {
    Toast.clear()
    console.error('检查更新失败', error)
    Toast({ type: 'fail', message: '检查更新失败，请稍后重试' })
  }
}
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.about-content {
  padding: 16px;
}

.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
}

.app-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.app-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.app-version {
  font-size: 14px;
  color: #999;
}

.about-section {
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.cell-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--primary-color, #1989fa);
}

.company-info {
  margin-top: 30px;
  padding: 16px;
  font-size: 12px;
  color: #999;
  text-align: center;
  line-height: 1.8;
}

.company-copyright {
  margin-top: 10px;
  font-size: 11px;
}
</style> 
