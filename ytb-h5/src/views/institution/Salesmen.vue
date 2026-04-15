<template>
  <div class="inst-salesmen">
    <van-nav-bar title="业务员管理" left-arrow fixed placeholder @click-left="router.back" />

    <div class="filter">
      <van-field v-model="query.salesman_name" label="姓名" placeholder="业务员姓名" clearable />
      <van-field v-model="query.salesman_code" label="编号" placeholder="业务员编号" clearable />
      <van-field v-model="query.salesman_phone" label="手机号" placeholder="业务员手机号" clearable />
      <van-field v-model="query.invite_code" label="邀请码" placeholder="业务员邀请码" clearable />
      <div class="filter-actions">
        <van-button type="primary" block @click="refreshList">查询</van-button>
      </div>
    </div>

    <van-tabs v-model:active="active" sticky>
      <van-tab title="业务员" name="list">
        <van-pull-refresh v-model="state.refreshing" @refresh="refreshList">
          <van-list v-model:loading="state.loading" :finished="state.finished" finished-text="没有更多了" @load="loadMore">
            <van-cell
              v-for="item in state.items"
              :key="item.id"
              :title="item.salesman_name"
              :label="`编号：${item.salesman_code || '—'} · 机构：${item.channelname || ''} · 邀请码：${item.invite_code || '—'}`"
            >
              <template #right-icon>
                <van-tag type="primary" plain>{{ statusText(item.status) }}</van-tag>
              </template>
            </van-cell>
          </van-list>
        </van-pull-refresh>
        <div class="fab">
          <van-button round type="primary" icon="add" @click="openForm">新增业务员</van-button>
        </div>
      </van-tab>
      <van-tab title="提现审核" name="withdraw">
        <van-pull-refresh v-model="withdrawState.refreshing" @refresh="refreshWithdraw">
          <van-list
            v-model:loading="withdrawState.loading"
            :finished="withdrawState.finished"
            finished-text="没有更多了"
            @load="loadMoreWithdraw"
          >
            <van-cell
              v-for="item in withdrawState.items"
              :key="item.id"
              :title="`${item.salesman_name} 提现 ¥${item.price}`"
              :label="`编号：${item.salesman_code} · 时间：${item.cate_time}`"
            >
              <template #default>
                <div class="withdraw-actions">
                  <van-tag :type="withdrawTag(item.status)">{{ withdrawText(item.status) }}</van-tag>
                  <div v-if="item.status === 1" class="btn-group">
                    <van-button size="small" type="success" plain @click="review(item, 2)">通过</van-button>
                    <van-button size="small" type="danger" plain @click="review(item, 3)">拒绝</van-button>
                  </div>
                </div>
              </template>
            </van-cell>
          </van-list>
        </van-pull-refresh>
      </van-tab>
      <van-tab title="邀请码" name="invite">
        <div class="invite-card">
          <div class="code">{{ invite.code || '--' }}</div>
          <van-button type="primary" block @click="fetchInvite">获取/生成邀请码</van-button>
          <p class="hint">机构业务员招募邀请码。</p>
        </div>
      </van-tab>
    </van-tabs>

    <van-popup v-model:show="form.show" position="bottom" round :style="{ height: '70%' }">
      <div class="form-wrap">
        <div class="title">{{ form.id ? '编辑业务员' : '新增业务员' }}</div>
        <van-form @submit="submit">
          <van-field v-model="form.salesman_name" label="姓名" placeholder="请输入姓名" required />
          <van-field v-model="form.salesman_code" label="编号" placeholder="唯一编号" required />
          <van-field v-model="form.salesman_phone" label="手机号" placeholder="请输入手机号" required />
          <van-field v-model.number="form.s_id" label="上级业务员ID" placeholder="可为空" type="number" />
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit" :loading="form.saving">
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant';
import {
  getInstitutionSalesmen,
  createInstitutionSalesman,
  updateInstitutionSalesman,
  getInstitutionSalesmanWithdrawals,
  reviewInstitutionSalesmanWithdrawal,
  getInstitutionSalesmanInviteCode
} from '@/api/institution';

const router = useRouter();
const active = ref('list');

const query = reactive({
  salesman_name: '',
  salesman_code: '',
  salesman_phone: '',
  invite_code: '',
});

const state = reactive({
  items: [],
  page: 1,
  finished: false,
  loading: false,
  refreshing: false,
});

const withdrawState = reactive({
  items: [],
  page: 1,
  finished: false,
  loading: false,
  refreshing: false,
});

const invite = reactive({ code: '' });

const form = reactive({
  show: false,
  id: null,
  salesman_name: '',
  salesman_code: '',
  salesman_phone: '',
  s_id: '',
  saving: false,
});

const statusText = (s) => ({ 1: '审核通过', 2: '审核拒绝', 3: '禁用', 4: '待审核', 5: '恢复' }[s] || '未知');
const withdrawText = (s) => ({ 1: '审核中', 2: '已通过', 3: '已拒绝' }[s] || '');
const withdrawTag = (s) => ({ 1: 'warning', 2: 'success', 3: 'danger' }[s] || 'default');

const refreshList = async () => {
  state.page = 1;
  state.finished = false;
  state.items = [];
  state.refreshing = true;
  await loadMore();
  state.refreshing = false;
};

const loadMore = async () => {
  if (state.loading || state.finished) return;
  state.loading = true;
  try {
    const response = await getInstitutionSalesmen({
      ...query,
      page: state.page,
      per_page: 20,
    });
    const payload = response?.data || response || {};
    const items = payload.items || payload.data || [];
    state.items.push(...items);
    state.finished = items.length < 20;
    state.page += 1;
  } catch (e) {
    showFailToast(e.message || '加载失败');
    state.finished = true;
  } finally {
    state.loading = false;
  }
};

const refreshWithdraw = async () => {
  withdrawState.page = 1;
  withdrawState.finished = false;
  withdrawState.items = [];
  withdrawState.refreshing = true;
  await loadMoreWithdraw();
  withdrawState.refreshing = false;
};

const loadMoreWithdraw = async () => {
  if (withdrawState.loading || withdrawState.finished) return;
  withdrawState.loading = true;
  try {
    const response = await getInstitutionSalesmanWithdrawals({
      page: withdrawState.page,
      per_page: 20,
    });
    const payload = response?.data || response || {};
    const items = payload.items || payload.data || [];
    withdrawState.items.push(...items);
    withdrawState.finished = items.length < 20;
    withdrawState.page += 1;
  } catch (e) {
    showFailToast(e.message || '加载失败');
    withdrawState.finished = true;
  } finally {
    withdrawState.loading = false;
  }
};

const openForm = (row = null) => {
  form.id = row?.id || null;
  form.salesman_name = row?.salesman_name || '';
  form.salesman_code = row?.salesman_code || '';
  form.salesman_phone = row?.salesman_phone || '';
  form.s_id = row?.s_id || '';
  form.show = true;
};

const submit = async () => {
  form.saving = true;
  try {
    if (form.id) {
      await updateInstitutionSalesman(form.id, form);
    } else {
      await createInstitutionSalesman(form);
    }
    showSuccessToast('保存成功');
    form.show = false;
    refreshList();
  } catch (e) {
    showFailToast(e.message || '保存失败');
  } finally {
    form.saving = false;
  }
};

const review = (row, status) => {
  showConfirmDialog({
    title: status === 2 ? '通过提现' : '拒绝提现',
    message: status === 2 ? '确认通过该申请？' : '确认拒绝并退回？'
  }).then(async () => {
    await reviewInstitutionSalesmanWithdrawal(row.id, { status });
    showSuccessToast('处理成功');
    refreshWithdraw();
    refreshList();
  }).catch(() => {});
};

const fetchInvite = async () => {
  try {
    const { data } = await getInstitutionSalesmanInviteCode();
    invite.code = data.code;
    showSuccessToast('获取成功');
  } catch (e) {
    showFailToast(e.message || '获取失败');
  }
};

refreshList();
refreshWithdraw();
</script>

<style scoped>
.inst-salesmen {
  min-height: 100vh;
  background: #f7f8fa;
}
.filter {
  padding: 12px 16px;
  background: #fff;
  margin-bottom: 8px;
}
.filter-actions {
  margin-top: 8px;
}
.fab {
  padding: 12px 16px;
}
.withdraw-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.btn-group {
  display: flex;
  gap: 6px;
}
.invite-card {
  padding: 24px 16px;
  text-align: center;
}
.invite-card .code {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 12px;
}
.invite-card .hint {
  color: #999;
  margin-top: 8px;
}
.form-wrap {
  padding: 12px 16px 24px;
}
.form-wrap .title {
  text-align: center;
  font-weight: 600;
  margin-bottom: 12px;
}
</style>
