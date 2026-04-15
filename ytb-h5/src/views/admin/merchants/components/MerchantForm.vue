<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 18 }"
  >
    <a-form-item label="商户名称" name="name">
      <a-input v-model:value="formState.name" placeholder="请输入商户名称" />
    </a-form-item>
    
    <a-form-item label="商户Logo" name="logo">
      <a-input v-model:value="formState.logo" placeholder="请输入Logo URL地址" />
      <!-- 实际使用时可以添加图片上传组件 -->
    </a-form-item>
    
    <a-form-item label="负责人姓名" name="principal_name">
      <a-input v-model:value="formState.principal_name" placeholder="请输入负责人姓名" />
    </a-form-item>
    
    <a-form-item label="联系电话" name="principal_mobile">
      <a-input v-model:value="formState.principal_mobile" placeholder="请输入联系电话" />
    </a-form-item>
    
    <a-form-item label="营业执照" name="business_license">
      <a-input v-model:value="formState.business_license" placeholder="请输入营业执照URL地址" />
      <!-- 实际使用时可以添加图片上传组件 -->
    </a-form-item>
    
    <a-form-item label="费率(%)" name="fee_rate">
      <a-input-number
        v-model:value="formState.fee_rate"
        style="width: 100%"
        :min="0"
        :max="100"
        :precision="2"
        placeholder="请输入费率(百分比)"
      />
    </a-form-item>
    
    <a-divider>银行账户信息</a-divider>
    
    <a-form-item label="银行名称" name="bank_name">
      <a-input v-model:value="formState.bank_name" placeholder="请输入银行名称" />
    </a-form-item>
    
    <a-form-item label="支行名称" name="bank_branch">
      <a-input v-model:value="formState.bank_branch" placeholder="请输入支行名称" />
    </a-form-item>
    
    <a-form-item label="开户名" name="bank_account_name">
      <a-input v-model:value="formState.bank_account_name" placeholder="请输入开户名" />
    </a-form-item>
    
    <a-form-item label="银行账号" name="bank_account_no">
      <a-input v-model:value="formState.bank_account_no" placeholder="请输入银行账号" />
    </a-form-item>
    
    <a-divider>地址信息</a-divider>
    
    <a-form-item label="省/市/区" required>
      <a-row :gutter="8">
        <a-col :span="8">
          <a-form-item name="province" noStyle>
            <a-input v-model:value="formState.province" placeholder="省份" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item name="city" noStyle>
            <a-input v-model:value="formState.city" placeholder="城市" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item name="district" noStyle>
            <a-input v-model:value="formState.district" placeholder="区县" />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form-item>
    
    <a-form-item label="详细地址" name="address">
      <a-textarea v-model:value="formState.address" placeholder="请输入详细地址" :rows="2" />
    </a-form-item>
  </a-form>
</template>

<script>
import { defineComponent, reactive, ref, watch } from 'vue';

export default defineComponent({
  name: 'MerchantForm',
  props: {
    merchant: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 表单状态
    const formState = reactive({
      id: undefined,
      name: '',
      logo: '',
      principal_name: '',
      principal_mobile: '',
      business_license: '',
      fee_rate: 0,
      bank_name: '',
      bank_branch: '',
      bank_account_name: '',
      bank_account_no: '',
      province: '',
      city: '',
      district: '',
      address: ''
    });

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入商户名称', trigger: 'blur' },
        { min: 2, max: 50, message: '商户名称长度必须在2-50个字符之间', trigger: 'blur' }
      ],
      principal_name: [
        { required: true, message: '请输入负责人姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '负责人姓名长度必须在2-20个字符之间', trigger: 'blur' }
      ],
      principal_mobile: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      fee_rate: [
        { required: true, message: '请输入费率', trigger: 'blur' },
        { type: 'number', min: 0, max: 100, message: '费率必须在0-100之间', trigger: 'blur' }
      ]
    };

    const formRef = ref(null);

    // 监听商户数据变化，更新表单数据
    watch(
      () => props.merchant,
      (merchant) => {
        if (merchant) {
          Object.keys(formState).forEach(key => {
            if (merchant[key] !== undefined) {
              formState[key] = merchant[key];
            }
          });
        } else {
          // 重置表单
          Object.keys(formState).forEach(key => {
            formState[key] = key === 'fee_rate' ? 0 : '';
          });
          formState.id = undefined;
        }
      },
      { immediate: true, deep: true }
    );

    // 表单验证方法
    const validate = () => {
      return new Promise((resolve, reject) => {
        formRef.value
          .validate()
          .then(() => {
            resolve({ ...formState });
          })
          .catch(error => {
            reject(error);
          });
      });
    };

    return {
      formState,
      rules,
      formRef,
      validate
    };
  }
});
</script> 