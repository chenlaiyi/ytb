<template>
  <div class="legal-page">
    <NavBar
      title="用户协议"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />
    <div class="page-content">
      <section class="legal-header">
        <h3 class="legal-title">用户服务协议</h3>
        <p class="legal-date">生效日期：{{ agreementEffectiveDate }}</p>
      </section>

      <section
        v-for="section in agreementSections"
        :key="section.title"
        class="legal-section"
      >
        <h4 class="section-title">{{ section.title }}</h4>
        <p
          v-for="paragraph in section.paragraphs"
          :key="paragraph"
          class="section-text"
        >
          {{ paragraph }}
        </p>
        <ul v-if="section.items" class="section-list">
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="legal-contact">
        <p>客服电话：{{ agreementContact.phone }}</p>
        <p>客服邮箱：{{ agreementContact.email }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NavBar } from 'vant'
import { agreementEffectiveDate, agreementSections, agreementContact } from './legalContent'
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-content {
  padding: 64px 16px 24px;
}

.legal-header {
  text-align: center;
  margin-bottom: 24px;
}

.legal-title {
  margin: 0;
  font-size: 20px;
  color: #1989fa;
}

.legal-date {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
}

.legal-section {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.section-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.7;
}

.section-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 14px;
  line-height: 1.7;
}

.legal-contact {
  margin-top: 32px;
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #e5e6eb;
}

.legal-contact p {
  margin: 4px 0;
}
</style>
