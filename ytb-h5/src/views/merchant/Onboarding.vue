<template>
  <div class="merchant-type-page">
    <van-nav-bar
      title="选择进件类型"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    />

    <div class="merchant-type-page__body">
      <section class="section-card">
        <div class="section-card__title">请选择商户类型</div>
        <div class="section-card__underline" />
        <van-radio-group
          v-model="form.merchantType"
          direction="horizontal"
          class="type-radio-group"
        >
          <van-radio
            v-for="option in merchantTypeOptions"
            :key="option.value"
            :name="option.value"
            class="type-radio"
          >
            {{ option.label }}
          </van-radio>
        </van-radio-group>
      </section>

      <section class="section-card">
        <div class="section-card__title">准备资料</div>
        <div class="section-card__underline" />
        <p class="section-card__description">
          申请开户前，请准备如下资料：
        </p>
        <ul class="requirements-list">
          <li>身份证件正反面照、门头照片；</li>
          <li>营业执照照，小微商户可不提供；</li>
          <li>结算银行卡照片或对公开户证明（开户许可证）；</li>
          <li>经营场所照片，小微需提供手持身份证与场景合影；</li>
        </ul>
      </section>

      <section class="section-card">
        <div class="section-card__title">邀请码</div>
        <div class="section-card__underline" />
        <van-field
          v-model="form.inviteCode"
          placeholder="请输入正确的邀请码"
          maxlength="20"
          clearable
          label-width="0"
          input-align="center"
          class="invite-field"
        />
        <p class="invite-hint">邀请码从点点够团队成员获取</p>
      </section>

      <van-button type="primary" block class="next-button" @click="handleNext">
        下一步
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const merchantTypeOptions = [
  { label: '企业', value: 'enterprise' },
  { label: '个体户', value: 'individual' },
  { label: '小微', value: 'micro' }
]

const requirementList = [
  '身份证件正反面照片、门头照片；',
  '营业执照，小微商户可免提供；',
  '结算银行卡照片或者对公开户证明（开户许可证）；',
  '经营场所照片，小微需提供手持身份证与场景合影。'
]

const form = reactive({
  merchantType: merchantTypeOptions[0].value,
  inviteCode: ''
})

const handleNext = () => {
  const invite = form.inviteCode.trim()
  if (!invite) {
    showToast('请输入正确的邀请码')
    return
  }

  if (router.hasRoute('MerchantOnboardingForm')) {
    router.push({
      name: 'MerchantOnboardingForm',
      query: {
        type: form.merchantType,
        invite_code: invite
      }
    })
    return
  }

  showToast('邀请提交已记录，请联系客服完成后续步骤')
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.merchant-type-page {
  min-height: 100vh;
  background: #f6f7fb;
}

.merchant-type-page__body {
  padding: 12px 12px 40px;
  box-sizing: border-box;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 16px;
  margin-bottom: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
}

.section-card__title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: #1f2d3d;
}

.section-card__underline {
  width: 60px;
  height: 3px;
  background: #ff2d55;
  margin: 6px auto 12px;
  border-radius: 999px;
}

.section-card__description {
  margin: 0 0 6px;
  font-size: 13px;
  color: #4f5054;
  line-height: 1.4;
}

.type-radio-group {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
}

.type-radio {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #1f2d3d;
}

.type-radio :deep(.van-radio__icon) {
  margin-right: 6px;
}

.requirements-list {
  list-style: decimal;
  padding-left: 18px;
  margin: 0;
  color: #4f5054;
  font-size: 13px;
  line-height: 1.6;
}

.invite-field {
  margin-top: 8px;
  border-radius: 8px;
  border: 1px solid #ff8a54;
  background: linear-gradient(135deg, #fff8f3 0%, #ffece3 100%);
  box-shadow: 0 4px 16px rgba(255, 138, 84, 0.18);
}

.invite-field :deep(.van-field__control) {
  color: #c6401d;
  font-weight: 600;
}

.invite-field :deep(.van-field__control::placeholder) {
  color: #ff9b7a;
}

.invite-hint {
  text-align: center;
  font-size: 12px;
  color: #8a8c95;
  margin-top: 8px;
}

.next-button {
  margin-top: 20px;
  height: 46px;
  font-size: 16px;
  background: #ff2d2d;
  border: none;
  border-radius: 6px;
}
</style>
