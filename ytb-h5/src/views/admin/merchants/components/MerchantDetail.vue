<template>
  <div class="merchant-detail">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="基本信息" :span="2">
        <div class="merchant-header">
          <div class="merchant-logo">
            <a-avatar :src="logoUrl" :size="64">
              {{ merchant.name ? merchant.name.charAt(0) : 'M' }}
            </a-avatar>
          </div>
          <div class="merchant-info">
            <h2>{{ merchant.name }}</h2>
            <div>商户ID: {{ merchant.merchant_id }}</div>
            <div>状态: 
              <a-tag :color="getStatusColor(merchant.status)">
                {{ merchant.status_text }}
              </a-tag>
            </div>
          </div>
        </div>
      </a-descriptions-item>

      <a-descriptions-item label="联系人信息" :span="2">
        <div>负责人: {{ merchant.principal_name }}</div>
        <div>联系电话: {{ merchant.principal_mobile }}</div>
      </a-descriptions-item>

      <a-descriptions-item label="计费信息" :span="2">
        <div>费率: {{ merchant.fee_rate }}%</div>
      </a-descriptions-item>

      <a-descriptions-item label="业务资质" :span="2">
        <div v-if="businessLicenseUrl">
          <div class="business-license">
            <img :src="businessLicenseUrl" alt="营业执照" style="max-width: 100%; max-height: 300px;" />
          </div>
        </div>
        <div v-else>暂无营业执照信息</div>
      </a-descriptions-item>

      <a-descriptions-item label="结算信息" :span="2">
        <div>银行名称: {{ merchant.bank_name || '未设置' }}</div>
        <div>支行名称: {{ merchant.bank_branch || '未设置' }}</div>
        <div>开户名: {{ merchant.bank_account_name || '未设置' }}</div>
        <div>银行账号: {{ merchant.bank_account_no || '未设置' }}</div>
      </a-descriptions-item>

      <a-descriptions-item label="地址信息" :span="2">
        <div>{{ getFullAddress }}</div>
      </a-descriptions-item>

      <a-descriptions-item label="交易数据" :span="2">
        <div class="stat-cards">
          <a-card class="stat-card">
            <template #title>总交易金额</template>
            <div class="stat-value">¥{{ formatAmount(merchant.trade_stats?.total_amount || 0) }}</div>
            <div class="stat-desc">{{ merchant.trade_stats?.total_count || 0 }}笔</div>
          </a-card>
          <a-card class="stat-card">
            <template #title>本月交易</template>
            <div class="stat-value">¥{{ formatAmount(merchant.trade_stats?.month_amount || 0) }}</div>
          </a-card>
          <a-card class="stat-card">
            <template #title>今日交易</template>
            <div class="stat-value">¥{{ formatAmount(merchant.trade_stats?.today_amount || 0) }}</div>
          </a-card>
        </div>
      </a-descriptions-item>

      <a-descriptions-item label="时间信息" :span="2">
        <div>创建时间: {{ merchant.created_at }}</div>
        <div>更新时间: {{ merchant.updated_at }}</div>
      </a-descriptions-item>
    </a-descriptions>

    <div
      v-if="hasActions"
      class="action-buttons"
      style="margin-top: 16px;"
    >
      <a-space>
        <a-button type="primary" @click="$emit('edit')">
          编辑商户
        </a-button>
        <a-button @click="$emit('view-trades')">
          查看交易记录
        </a-button>
        <a-button @click="$emit('view-settlements')">
          查看结算记录
        </a-button>
        <a-button @click="$emit('create-settlement')">
          创建结算
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { normalizeImageUrl } from '@/utils/asset';

export default defineComponent({
  name: 'MerchantDetail',
  props: {
    merchant: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // 获取完整地址
    const getFullAddress = computed(() => {
      const { province, city, district, address } = props.merchant;
      return [province, city, district, address].filter(Boolean).join(' ');
    });

    const DEFAULT_MERCHANT_LOGO = '/app/images/profile/default-avatar.png';

    const resolveLogoCandidate = (merchant) => {
      if (!merchant || typeof merchant !== 'object') {
        return '';
      }
      return (
        merchant.logo ??
        merchant.logo_url ??
        merchant.logoUrl ??
        merchant.avatar ??
        merchant.avatar_url ??
        merchant.avatarUrl ??
        ''
      );
    };

    const logoUrl = computed(() => {
      const candidate = resolveLogoCandidate(props.merchant);
      const normalized = normalizeImageUrl(candidate, { fallback: '' });
      if (normalized) {
        return normalized;
      }
      return normalizeImageUrl(DEFAULT_MERCHANT_LOGO, { fallback: DEFAULT_MERCHANT_LOGO });
    });

    const businessLicenseUrl = computed(() => {
      const license = props.merchant?.business_license ?? props.merchant?.businessLicense;
      return normalizeImageUrl(license, { fallback: '' });
    });

    // 获取状态颜色
    const getStatusColor = (status) => {
      const colors = {
        pending: 'orange',
        active: 'green',
        suspended: 'volcano',
        terminated: 'red'
      };
      return colors[status] || 'default';
    };

    // 格式化金额
    const formatAmount = (amount) => {
      return parseFloat(amount).toFixed(2);
    };

    const isDraft = computed(() => {
      const recordSource = props.merchant?.record_source || props.merchant?.source;
      const draftFlag = props.merchant?.is_draft;
      return recordSource === 'draft' || draftFlag === true;
    });

    const hasActions = computed(() => {
      if (isDraft.value) {
        return false;
      }
      return Boolean(props.merchant && (props.merchant.id || props.merchant.merchant_id));
    });

    return {
      getFullAddress,
      getStatusColor,
      formatAmount,
      hasActions,
      logoUrl,
      businessLicenseUrl
    };
  }
});
</script>

<style scoped>
.merchant-detail {
  padding: 8px;
}

.merchant-header {
  display: flex;
  align-items: center;
  padding: 16px 0;
}

.merchant-logo {
  margin-right: 16px;
}

.merchant-info h2 {
  margin-bottom: 8px;
}

.stat-cards {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.stat-card {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin: 8px 0;
}

.stat-desc {
  font-size: 12px;
  color: #999;
}

.business-license {
  text-align: center;
  margin: 16px 0;
}
</style> 
