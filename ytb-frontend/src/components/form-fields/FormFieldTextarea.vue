<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name"
    :required="field.required"
  >
    <div class="field-wrapper">
      <el-input
        v-model="inputValue"
        type="textarea"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :readonly="readonly"
        :disabled="disabled"
        :maxlength="field.max_length"
        :show-word-limit="field.max_length > 0"
        :rows="field.rows || 4"
        :autosize="field.autosize || false"
        resize="vertical"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
      />
      
      <div v-if="field.help_text" class="help-text">
        {{ field.help_text }}
      </div>
    </div>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
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

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input'])

const inputValue = computed({
  get: () => props.modelValue || '',
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleInput = (value) => {
  emit('input', value)
}
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
  resize: vertical;
}

:deep(.el-input__count) {
  background: transparent;
  right: 8px;
  bottom: 8px;
}
</style> 