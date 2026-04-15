<template>
  <div class="settings-simple-page">
    <NavBar
      title="联系我们"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />
    <div class="page-content">
      <Empty description="如需协助，可通过以下方式联系我们。">
        <div class="contact-info">
          <div class="contact-line">客服电话：400-000-0000</div>
          <div class="contact-line">客服邮箱：support@itapgo.com</div>
          <div class="contact-line">工作时间：工作日 09:00-18:00</div>
        </div>
        <Button round type="primary" size="small" @click="dialPhone">
          拨打客服电话
        </Button>
      </Empty>
    </div>
  </div>
</template>

<script setup>
import { NavBar, Empty, Button, Toast } from 'vant'

const PHONE_NUMBER = '4000000000'

const dialPhone = () => {
  const telLink = `tel:${PHONE_NUMBER}`
  try {
    window.location.href = telLink
  } catch (error) {
    console.error('拨打电话失败', error)
    Toast({ type: 'fail', message: '无法直接拨号，请手动拨打 400-000-0000' })
  }
}
</script>

<style scoped>
.settings-simple-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-content {
  padding: 64px 16px 24px;
}

.contact-info {
  margin-bottom: 12px;
  color: #646566;
  font-size: 14px;
  line-height: 1.6;
}

.contact-line {
  margin-bottom: 4px;
}
</style>
