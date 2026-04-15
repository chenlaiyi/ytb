<template>
  <div class="vip-test-container">
    <van-nav-bar title="VIP测试页面" left-arrow @click-left="$router.back()" />
    
    <van-cell-group title="当前localStorage数据">
      <van-cell title="branch_userInfo" :value="currentBranchUserInfo" />
      <van-cell title="userInfo" :value="currentUserInfo" />
    </van-cell-group>
    
    <van-cell-group title="设置测试数据">
      <van-field
        v-model="testBranchCode"
        label="分支机构代码"
        placeholder="输入分支机构代码，如YXY01"
      />
      <van-field
        v-model="testBranchId"
        label="分支机构ID"
        placeholder="输入分支机构ID，如2"
        type="number"
      />
    </van-cell-group>
    
    <div class="action-buttons">
      <van-button type="primary" @click="setTestData" block>设置测试数据</van-button>
      <van-button type="warning" @click="clearData" block style="margin-top: 10px;">清除所有数据</van-button>
      <van-button type="success" @click="goToVipList" block style="margin-top: 10px;">跳转到VIP列表</van-button>
    </div>
    
    <van-cell-group title="API测试">
      <van-button @click="testApi" type="info" size="small">测试API调用</van-button>
      <div v-if="apiResult" class="api-result">
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </van-cell-group>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Toast } from 'vant';
import { getBranchVipUsers } from '@/api/branchVip';

export default {
  name: 'BranchVipTest',
  setup() {
    const router = useRouter();
    
    const currentBranchUserInfo = ref('');
    const currentUserInfo = ref('');
    const testBranchCode = ref('YXY01');
    const testBranchId = ref('2');
    const apiResult = ref(null);
    
    const loadCurrentData = () => {
      currentBranchUserInfo.value = localStorage.getItem('branch_userInfo') || '未设置';
      currentUserInfo.value = localStorage.getItem('userInfo') || '未设置';
    };
    
    const setTestData = () => {
      const branchUserInfo = {
        branch_code: testBranchCode.value,
        branch_id: parseInt(testBranchId.value),
        code: testBranchCode.value,
        id: parseInt(testBranchId.value),
        name: '测试分支机构'
      };
      
      localStorage.setItem('branch_userInfo', JSON.stringify(branchUserInfo));
      localStorage.setItem('userInfo', JSON.stringify(branchUserInfo));
      
      loadCurrentData();
      Toast.success('测试数据设置成功');
    };
    
    const clearData = () => {
      localStorage.removeItem('branch_userInfo');
      localStorage.removeItem('userInfo');
      loadCurrentData();
      Toast.success('数据清除成功');
    };
    
    const goToVipList = () => {
      router.push('/branch/vip/vip-list');
    };
    
    const testApi = async () => {
      try {
        Toast.loading('测试API调用...');
        const response = await getBranchVipUsers({
          branch_code: testBranchCode.value,
          page: 1,
          limit: 10
        });
        apiResult.value = response;
        Toast.success('API调用成功');
      } catch (error) {
        apiResult.value = { error: error.message };
        Toast({ type: 'fail', message: 'API调用失败' });
      }
    };
    
    onMounted(() => {
      loadCurrentData();
    });
    
    return {
      currentBranchUserInfo,
      currentUserInfo,
      testBranchCode,
      testBranchId,
      apiResult,
      setTestData,
      clearData,
      goToVipList,
      testApi
    };
  }
};
</script>

<style scoped>
.vip-test-container {
  padding-bottom: 20px;
}

.action-buttons {
  padding: 20px;
}

.api-result {
  margin: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 5px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}
</style> 