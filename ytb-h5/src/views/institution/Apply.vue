<template>
  <div class="institution-apply">
    <van-nav-bar
      title="开通支付机构"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    />

    <section class="hero">
      <van-icon name="friends-o" size="48" />
      <h1>您还不是支付机构</h1>
      <p>请联系点点够官方完成资质审核，开通支付机构能力。</p>
    </section>

    <section class="tips">
      <h2>开通流程</h2>
      <ol>
        <li>准备企业营业执照、法人身份证等基础资料。</li>
        <li>联系点点够官方客服提交资料并完成线下签约。</li>
        <li>通过资质审核后，平台将为您开通支付机构权限。</li>
      </ol>
    </section>

    <van-cell-group inset title="官方渠道">
      <van-cell
        title="客服电话"
        :value="officialPhone"
        is-link
        icon="phone-o"
        @click="callPhone"
      />
      <van-cell
        title="商务邮箱"
        :value="officialEmail"
        icon="envelop-o"
        @click="copyEmail"
      />
      <van-cell
        title="AI 智能客服"
        value="立即咨询"
        is-link
        icon="service-o"
        @click="openAiService"
      />
    </van-cell-group>

    <div class="actions">
      <van-button block type="primary" @click="openAiService">
        联系点点够官方
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Dialog, Toast } from 'vant'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const officialPhone = '4006625818'
const officialEmail = 'service@itapgo.com'

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.replace('/user')
}

const openAiService = () => {
  router.push({ name: 'AiCustomerService' })
}

const callPhone = () => {
  window.location.href = `tel:${officialPhone}`
}

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(officialEmail)
    Toast.success('邮箱已复制')
  } catch (error) {
    console.warn('复制邮箱失败:', error)
    Toast(officialEmail)
  }
}

onMounted(() => {
  const reason = route.query.reason
  if (reason === 'missing-role' || reason === 'no-match') {
    Dialog.alert({
      title: '提示',
      message: '您还不是支付机构，请联系点点够官方进行开通'
    }).finally(() => {
      if (route.query.reason) {
        const nextQuery = { ...route.query }
        delete nextQuery.reason
        router.replace({
          name: 'InstitutionApply',
          query: nextQuery
        })
      }
    })
  }
})
</script>

<style scoped>
.institution-apply {
  min-height: 100vh;
  background-color: #f5f6f9;
  padding-bottom: 32px;
}

.hero {
  margin: 88px 24px 24px;
  padding: 24px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(25, 137, 250, 0.08);
}

.hero h1 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #1989fa;
}

.hero p {
  margin: 0;
  color: #646566;
  line-height: 1.5;
}

.tips {
  margin: 0 24px 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 16px;
}

.tips h2 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #323233;
}

.tips ol {
  margin: 0;
  padding-left: 20px;
  color: #646566;
  line-height: 1.6;
}

.actions {
  margin: 24px 24px 0;
}
</style>
