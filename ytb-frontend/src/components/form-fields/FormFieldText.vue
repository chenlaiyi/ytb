<template>
  <div class="form-field-text">
    <el-form-item
      :label="field.label"
      :required="field.required"
      :class="fieldClass"
    >
      <el-input
        v-if="!readonly"
        v-model="fieldValue"
        :placeholder="field.placeholder"
        :maxlength="field.max_length"
        :disabled="disabled"
        show-word-limit
        @input="handleInput"
      />
      <div v-else class="field-preview-text">
        {{ field.placeholder || '文本输入框' }}
      </div>
      
      <div v-if="field.help_text" class="help-text">
        {{ field.help_text }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      label: '',
      placeholder: '',
      required: false,
      max_length: 100,
      help_text: '',
      width: '100%'
    })
  },
  modelValue: {
    type: String,
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
    'field-text',
    `field-width-${props.field.width?.replace('%', '')}`
  ]
})

const handleInput = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

watch(() => props.modelValue, (newValue) => {
  fieldValue.value = newValue
})

watch(fieldValue, (newValue) => {
  handleInput(newValue)
})
</script>

<style scoped>
.form-field-text {
  margin-bottom: 16px;
}

.field-preview-text {
  padding: 8px 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #999;
  background: #fafafa;
  min-height: 32px;
  line-height: 32px;
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