<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name"
    :required="field.required"
  >
    <div class="field-wrapper">
      <el-checkbox-group
        v-model="checkboxValue"
        :disabled="disabled || readonly"
        :size="field.size || 'default'"
        :min="field.min_selections || 0"
        :max="field.max_selections || undefined"
        @change="handleChange"
      >
        <template v-if="field.display_type === 'button'">
          <el-checkbox-button
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </el-checkbox-button>
        </template>
        
        <template v-else>
          <el-checkbox
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </el-checkbox>
        </template>
      </el-checkbox-group>
      
      <div v-if="field.help_text || selectionHint" class="help-text">
        <div v-if="field.help_text">{{ field.help_text }}</div>
        <div v-if="selectionHint" class="selection-hint">{{ selectionHint }}</div>
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
    type: Array,
    default: () => []
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

const checkboxValue = computed({
  get: () => props.modelValue || [],
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// 处理选项数据
const options = computed(() => {
  if (!props.field.options) return []
  
  // 如果是字符串数组，转换为对象数组
  if (Array.isArray(props.field.options)) {
    return props.field.options.map(option => {
      if (typeof option === 'string') {
        return { label: option, value: option }
      }
      return {
        label: option.label || option.value,
        value: option.value,
        disabled: option.disabled || false
      }
    })
  }
  
  // 如果是对象格式 {key: value}
  if (typeof props.field.options === 'object') {
    return Object.entries(props.field.options).map(([value, label]) => ({
      label: label,
      value: value
    }))
  }
  
  return []
})

// 选择数量提示
const selectionHint = computed(() => {
  const selected = checkboxValue.value.length
  const min = props.field.min_selections || 0
  const max = props.field.max_selections
  
  if (min > 0 && max) {
    return `请选择 ${min}-${max} 项（已选择 ${selected} 项）`
  } else if (min > 0) {
    return `至少选择 ${min} 项（已选择 ${selected} 项）`
  } else if (max) {
    return `最多选择 ${max} 项（已选择 ${selected} 项）`
  }
  
  return ''
})

const handleChange = (value) => {
  emit('change', value)
}
</script>

<style scoped>
.field-wrapper {
  width: 100%;
}

.help-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.selection-hint {
  margin-top: 4px;
  color: #67c23a;
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-checkbox) {
  margin-right: 0;
  white-space: normal;
}

:deep(.el-checkbox__label) {
  padding-left: 8px;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.el-checkbox-button) {
  margin: 0;
}

/* 垂直布局 */
.field-wrapper :deep(.el-checkbox-group[data-layout="vertical"]) {
  flex-direction: column;
  align-items: flex-start;
}

/* 当达到最大选择数时的样式 */
.field-wrapper :deep(.el-checkbox-group.is-max .el-checkbox:not(.is-checked)) {
  opacity: 0.5;
}
</style> 