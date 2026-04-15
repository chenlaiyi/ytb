<template>
  <div class="system-overview-page">
    <header class="hero">
      <div class="hero-text">
        <p class="eyebrow">Infographic</p>
        <h1>点点够系统概览</h1>
        <p class="subtitle">基于当前仓库目录结构与 README 汇总，用 Infographic 生成与渲染</p>
      </div>
    </header>

    <section class="canvas-section">
      <div ref="containerRef" class="infographic-container"></div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Infographic } from '@antv/infographic'

const containerRef = ref(null)
let infographicInstance = null

const systemOverviewData = {
  title: '点点够应用系统（OctTapgo）',
  desc: '多端一体：H5（Vue3+Vite）/ Flutter App / 微信小程序；后端：Laravel 10 + REST API',
  items: [
    {
      label: 'OctTapgo 平台',
      desc: '统一业务底座：设备、商户、用户、VIP、社区、数据看板',
      children: [
        {
          label: '客户端（面向用户/运营）',
          desc: '多端交付与体验入口',
          children: [
            { label: 'H5 管理端（H5/）', desc: 'Vue 3 + Vite；构建产物同步到 /app' },
            { label: 'Flutter 移动端（app/）', desc: 'Android / iOS 平台工程' },
            { label: '微信小程序（miniprogram/）', desc: '小程序端源码与页面逻辑' },
          ],
        },
        {
          label: '后端服务（admin/）',
          desc: 'Laravel 10：控制器、中间件、队列、迁移、单测',
          children: [
            { label: '管理后台 + API', desc: '管理端接口、业务服务与管理页面' },
            { label: '遗留直连脚本（admin/api/）', desc: '灰度兼容层：非紧急尽量不改' },
          ],
        },
        {
          label: '核心业务模块（节选）',
          desc: '以当前仓库现有页面/文档为准',
          children: [
            { label: '设备管理', desc: '设备列表/详情/监控/安装/滤芯等' },
            { label: '商户中心', desc: '进件/商品/订单/交易/结算等' },
            { label: '用户体系', desc: '登录注册、钱包、积分、优惠券、地址等' },
            { label: 'VIP 会员', desc: '团队、分红、奖励与权益' },
            { label: '社区论坛', desc: '讨论区/帖子/回复（README: 2025-10 上线）' },
            { label: '美团数据', desc: '上传与驾驶舱：商户/销售/终端/人员' },
          ],
        },
        {
          label: '文档 & 工具链',
          desc: '构建、部署、迁移、接口说明与自检脚本',
          children: [
            { label: 'docs/', desc: '产品、迁移与接口文档（含 legacy 映射说明）' },
            { label: 'scripts/validate-repo.sh', desc: '提交前自检，避免危险文件入库' },
            { label: 'H5/.build.sh', desc: '安装依赖 + vite build，发布 dist 到 /app' },
            { label: 'admin/.build.sh', desc: '构建 Laravel 管理后台静态资源并同步部署' },
          ],
        },
        {
          label: '外部集成（节选）',
          desc: '按 README / 目录命名整理',
          children: [
            { label: '微信登录/回调', desc: '账号绑定与回调流程' },
            { label: '支付与交易数据', desc: '美团/盛付通/引流进件等来源（README 提及）' },
            { label: 'CodexZH 集成', desc: '套餐映射、Key 管理与文档沉淀（docs/）' },
          ],
        },
      ],
    },
  ],
}

onMounted(() => {
  if (!containerRef.value) return

  infographicInstance = new Infographic({
    container: containerRef.value,
    template: 'hierarchy-tree-tech-style-compact-card',
    padding: 24,
    svg: {
      style: {
        width: '100%',
        height: 'auto',
        display: 'block',
      },
    },
    data: systemOverviewData,
  })

  infographicInstance.render()
})

onBeforeUnmount(() => {
  infographicInstance?.destroy()
  infographicInstance = null
})
</script>

<style scoped>
.system-overview-page {
  min-height: 100vh;
  padding: 16px;
  background: linear-gradient(180deg, #f6f8ff 0%, #ffffff 55%);
}

.hero {
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: radial-gradient(circle at 10% 0%, rgba(22, 119, 255, 0.16) 0%, rgba(255, 255, 255, 0) 62%),
    #ffffff;
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.08);
}

.hero-text .eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(51, 65, 85, 0.7);
}

.hero-text h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: #0f172a;
}

.hero-text .subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(51, 65, 85, 0.86);
}

.canvas-section {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.infographic-container {
  padding: 12px;
  overflow: auto;
}

.infographic-container :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
