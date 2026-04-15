<template>
  <div class="institution-policy">
    <van-nav-bar
      title="美团收钱助手 · 2025年政策"
      left-arrow
      fixed
      placeholder
      @click-left="$router.back()"
    />
    <div class="policy-content">
      <section class="policy-intro">
        <p>以下政策适用于正在拓展美团收钱助手渠道的机构与团队，针对不同发展阶段提供对应的名额、物料与分润标准。</p>
      </section>
      <section class="policy-table-section">
        <table class="policy-table">
          <thead>
            <tr>
              <th>套餐</th>
              <th>价格</th>
              <th>播报器（台）</th>
              <th>客户资源礼包</th>
              <th>发展名额</th>
              <th>密训名额</th>
              <th>分润标准</th>
            </tr>
          </thead>
          <tbody>
            <tr :class="{ highlight: focusRow === 'operation_center' }">
              <td>
                <span class="tier-name">运营中心</span>
              </td>
              <td>
                <div class="price">¥19,800</div>
                <div class="price-note">咨询服务费</div>
              </td>
              <td>50</td>
              <td>100 位意向客户</td>
              <td>20 名合伙人（≈600 名销售经理）</td>
              <td>20 个密训名额</td>
              <td><span class="rebate">万12 ~ 万14</span></td>
            </tr>
            <tr :class="{ highlight: focusRow === 'partner' }">
              <td>
                <span class="tier-name">合伙人</span>
              </td>
              <td>
                <div class="price">¥3,980</div>
                <div class="price-note">策略型押金</div>
              </td>
              <td>10</td>
              <td>50 位意向客户</td>
              <td>30 名销售经理</td>
              <td>—</td>
              <td><span class="rebate">万10 ~ 万12</span></td>
            </tr>
            <tr :class="{ highlight: focusRow === 'salesman' }">
              <td>
                <span class="tier-name">销售经理</span>
              </td>
              <td>
                <div class="price">¥598</div>
                <div class="price-note">策略型押金</div>
              </td>
              <td>1</td>
              <td>5 位意向客户</td>
              <td>—</td>
              <td>—</td>
              <td><span class="rebate">万8 ~ 万10</span></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="policy-notes">
        <h3>说明</h3>
        <ul>
          <li>意向客户礼包由总部统一分配，开通后 3 个工作日内完成派发。</li>
          <li>播报器支持扫码收款与到账播报，含一年保修。</li>
          <li>运营中心密训名额可用于核心骨干线下实战培训，需提前预约；销售经理与合伙人可自费报名，学费 ¥1,980（不含食宿与差旅）。</li>
          <li>分润标准为团队内直属交易万分比，档位可按机构策略独立配置，以上区间为推荐范围，具体结算以合同约定为准。</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const focusRow = ref('')

onMounted(() => {
  const focus = route.query.focus
  if (['salesman', 'partner', 'operation_center'].includes(focus)) {
    focusRow.value = focus
  }
})
</script>

<style scoped>
.institution-policy {
  background: #fff7ef;
  min-height: 100vh;
}

.policy-content {
  padding: 16px;
}

.policy-intro p {
  font-size: 13px;
  color: #7c4b23;
  line-height: 1.6;
  margin: 0 0 16px;
  background: linear-gradient(135deg, rgba(255, 238, 213, 0.9), rgba(255, 226, 185, 0.9));
  padding: 12px 14px;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(255, 140, 66, 0.18);
}

.policy-table-section {
  overflow-x: auto;
  background: #fffaf5;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(255, 152, 78, 0.16);
  margin-bottom: 16px;
}

.policy-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  color: #1f2d3d;
}

.policy-table thead tr {
  background: linear-gradient(135deg, #ffe7c0, #ffd6a0);
}

.policy-table th,
.policy-table td {
  padding: 14px 12px;
  text-align: center;
  border-bottom: 1px solid rgba(31, 45, 61, 0.08);
  border-right: 1px solid rgba(31, 45, 61, 0.05);
}

.policy-table th:last-child,
.policy-table td:last-child {
  border-right: none;
}

.policy-table th {
  font-weight: 600;
  color: #5b3310;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.policy-table tbody tr:last-child td {
  border-bottom: none;
}

.policy-table tbody tr {
  transition: background 0.2s ease;
}

.policy-table tbody tr:hover {
  background: rgba(255, 153, 85, 0.08);
}

.policy-table tr.highlight {
  background: rgba(255, 152, 78, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 132, 0, 0.3);
}

.tier-name {
  display: block;
  font-weight: 600;
  color: #5b3310;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: #5b3310;
}

.price-note {
  font-size: 11px;
  color: #a26228;
  margin-top: 2px;
}

.rebate {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 153, 85, 0.16);
  color: #d36514;
  font-weight: 600;
}

.policy-notes {
  background: #fffaf5;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(255, 152, 78, 0.12);
}

.policy-notes h3 {
  font-size: 14px;
  font-weight: 600;
  color: #5b3310;
  margin-bottom: 10px;
}

.policy-notes ul {
  padding-left: 18px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-notes li {
  font-size: 13px;
  color: #7c4b23;
  line-height: 1.5;
}
</style>
