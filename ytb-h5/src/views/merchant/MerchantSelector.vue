<template>
  <div class="merchant-selector">
    <div class="merchant-list">
      <div v-if="loading" class="loading-container">
        <van-loading color="#1989fa" />
        <div class="loading-text">加载中...</div>
      </div>
      
      <template v-else>
        <div 
          v-for="(merchant, index) in merchants" 
          :key="merchant.merchant_id"
          class="merchant-item"
          :class="{'merchant-active': selectedMerchantId === merchant.merchant_id}"
          @click="selectMerchant(merchant)"
        >
          <div class="merchant-logo">
            <van-image
              round
              width="50"
              height="50"
              :src="merchant.logo || undefined"
              :error-icon="'shop-o'"
              :show-error="true"
            />
          </div>
          <div class="merchant-info">
            <div class="merchant-name">{{ merchant.display_name || merchant.name }}</div>
            <div class="merchant-id">ID: {{ merchant.merchant_id }}</div>
          </div>
          <div class="merchant-status" :class="getStatusClass(merchant.status)">
            {{ getStatusText(merchant.status) }}
          </div>
        </div>
        
        <div v-if="merchants.length === 0" class="empty-container">
          <van-empty image="search" description="暂无商户数据" />
        </div>
      </template>
    </div>
    
    <div class="selector-actions">
      <van-button 
        type="primary" 
        block 
        :disabled="!selectedMerchantId || loading || switching" 
        :loading="switching"
        loading-text="切换中..."
        @click="confirmSelection"
      >
        确认选择
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Toast } from 'vant';
import { useMerchantStore } from '@/stores/merchant';
import { useUserStore } from '@/stores/user';

const props = defineProps({
  value: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['input', 'change', 'select', 'cancel']);

const router = useRouter();
const loading = ref(false);
const switching = ref(false);
const merchants = ref([]);
const selectedMerchantId = ref(props.value || '');
const merchantStore = useMerchantStore();
const userStore = useUserStore();

const currentMerchant = computed(() => merchantStore.getCurrentMerchant || null);
const currentMerchantId = computed(() => currentMerchant.value?.merchant_id || '');

const updateMerchants = (list) => {
  if (Array.isArray(list)) {
    merchants.value = list.filter(Boolean);
  } else {
    merchants.value = [];
  }
};

const extractMerchantsFromUser = () => {
  const userInfo = userStore.userInfo || userStore.userData || {};
  const roles = Array.isArray(userInfo.roles) ? userInfo.roles : [];
  const roleDetails = userInfo.roleDetails || {};

  if (roles.includes('merchant') && roleDetails.merchant) {
    return roleDetails.merchant.items || [];
  }

  if (Array.isArray(userInfo.merchants)) {
    return userInfo.merchants;
  }

  return [];
};

const ensureSelectionValid = () => {
  let nextId = selectedMerchantId.value;

  if (!merchants.value.length) {
    nextId = '';
  } else if (!merchants.value.some(m => m && m.merchant_id === nextId)) {
    nextId = currentMerchantId.value || merchants.value[0]?.merchant_id || '';
  }

  if (nextId !== selectedMerchantId.value) {
    selectedMerchantId.value = nextId;
    emit('input', nextId);
    if (nextId) {
      const matched = merchants.value.find(m => m && m.merchant_id === nextId);
      if (matched) {
        emit('select', matched);
      }
    }
  }
};

// 获取商户状态文本
const getStatusText = (status) => {
  const statusMap = {
    'active': '已激活',
    'pending': '待审核',
    'suspended': '已暂停',
    'rejected': '已拒绝'
  };
  return statusMap[status] || '未知状态';
};

// 获取商户状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'active': 'status-active',
    'pending': 'status-pending',
    'suspended': 'status-suspended',
    'rejected': 'status-rejected'
  };
  return classMap[status] || '';
};

// 选择商户
const selectMerchant = (merchant) => {
  selectedMerchantId.value = merchant.merchant_id;
  emit('input', merchant.merchant_id);
  emit('select', merchant);
};

// 确认选择
const confirmSelection = async () => {
  if (!selectedMerchantId.value) {
    Toast('请选择一个商户');
    return;
  }
  
  const selected = merchants.value.find(m => m.merchant_id === selectedMerchantId.value);
  if (!selected) {
    Toast('所选商户不存在或已失效');
    ensureSelectionValid();
    return;
  }

  switching.value = true;
  try {
    await merchantStore.switchMerchant(selected);
    emit('change', selected);
    router.push({ name: 'Merchant' });
  } catch (error) {
    console.error('切换商户失败', error);
    Toast('切换商户失败');
  } finally {
    switching.value = false;
  }
};

// 获取商户列表
const fetchMerchants = async () => {
  loading.value = true;
  try {
    if (!merchantStore.getAvailableMerchants.length) {
      await merchantStore.fetchWorkspaceData();
    }

    updateMerchants(merchantStore.getAvailableMerchants);

    if (!merchants.value.length) {
      const fallbackMerchants = extractMerchantsFromUser();
      if (fallbackMerchants.length) {
        updateMerchants(fallbackMerchants);
        merchantStore.setAvailableMerchants(fallbackMerchants);
      }
    }

    ensureSelectionValid();

    if (merchants.value.length === 1) {
      selectMerchant(merchants.value[0]);
    }
  } catch (error) {
    console.error('获取商户列表失败', error);
    Toast('获取商户列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMerchants();
});

watch(
  () => merchantStore.getAvailableMerchants,
  (list) => {
    updateMerchants(list);
    ensureSelectionValid();
  },
  { deep: true }
);

watch(currentMerchantId, (id) => {
  if (!id) {
    ensureSelectionValid();
    return;
  }

  if (selectedMerchantId.value !== id) {
    selectedMerchantId.value = id;
    emit('input', id);
    const matched = merchants.value.find(m => m && m.merchant_id === id);
    if (matched) {
      emit('select', matched);
    }
  }
});

watch(
  () => props.value,
  (val) => {
    if (val) {
      selectedMerchantId.value = val;
    } else if (!val && !selectedMerchantId.value) {
      ensureSelectionValid();
    }
  }
);
</script>

<style scoped>
.merchant-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.merchant-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.merchant-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  position: relative;
}

.merchant-active {
  border: 2px solid #1989fa;
}

.merchant-logo {
  margin-right: 12px;
}

.merchant-info {
  flex: 1;
}

.merchant-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.merchant-id {
  font-size: 12px;
  color: #666;
}

.merchant-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  background-color: #f2f3f5;
  color: #666;
}

.status-active {
  background-color: #07c160;
  color: #fff;
}

.status-pending {
  background-color: #ff9500;
  color: #fff;
}

.status-suspended {
  background-color: #909399;
  color: #fff;
}

.status-rejected {
  background-color: #ee0a24;
  color: #fff;
}

.selector-actions {
  padding: 12px;
  box-shadow: 0 -2px 12px rgba(100, 101, 102, 0.08);
  background-color: #fff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 10px;
  color: #999;
  font-size: 14px;
}

.empty-container {
  padding: 40px 0;
}
</style>
