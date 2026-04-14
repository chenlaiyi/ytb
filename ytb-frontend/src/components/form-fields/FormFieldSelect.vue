<template>
  <div class="form-field-select">
    <el-form-item
      :label="field.label"
      :required="field.required"
      :class="fieldClass"
    >
      <el-select
        v-if="!readonly"
        v-model="fieldValue"
        :placeholder="field.placeholder"
        :disabled="disabled"
        clearable
        style="width: 100%"
        @change="handleChange"
      >
        <el-option
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <div v-else class="field-preview-select">
        {{ field.placeholder || '下拉选择框' }}
        <el-icon class="select-icon"><ArrowDown /></el-icon>
      </div>
      
      <div v-if="field.help_text" class="help-text">
        {{ field.help_text }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  field: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      help_text: '',
      width: '100%'
    })
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const fieldValue = ref(props.modelValue)

const fieldClass = computed(() => {
  return [
    'field-select',
    `field-width-${props.field.width?.replace('%', '')}`
  ]
})

const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

watch(() => props.modelValue, (newValue) => {
  fieldValue.value = newValue
})

watch(fieldValue, (newValue) => {
  handleChange(newValue)
})
</script>

<style scoped>
.form-field-select {
  margin-bottom: 16px;
}

.field-preview-select {
  padding: 8px 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #999;
  background: #fafafa;
  min-height: 32px;
  line-height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-icon {
  color: #c0c4cc;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.field-width-100 {
  width: 100%;
}

.field-width-50 {
  width: 50%;
}

.field-width-33 {
  width: 33.33%;
}

.field-width-25 {
  width: 25%;
}
</style> 