<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name"
    :required="field.required"
  >
    <div class="field-wrapper">
      <el-date-picker
        v-model="dateValue"
        :type="field.date_type || 'date'"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :readonly="readonly"
        :disabled="disabled"
        :size="field.size || 'default'"
        :format="displayFormat"
        :value-format="valueFormat"
        :disabled-date="disabledDate"
        :clearable="field.clearable !== false"
        :start-placeholder="field.start_placeholder"
        :end-placeholder="field.end_placeholder"
        :range-separator="field.range_separator || '至'"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
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
    type: [String, Date, Array],
    default: null
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

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const dateValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// 显示格式
const displayFormat = computed(() => {
  const type = props.field.date_type || 'date'
  const formats = {
    date: 'YYYY-MM-DD',
    datetime: 'YYYY-MM-DD HH:mm:ss',
    year: 'YYYY',
    month: 'YYYY-MM',
    week: 'YYYY 第 ww 周',
    dates: 'YYYY-MM-DD',
    daterange: 'YYYY-MM-DD',
    datetimerange: 'YYYY-MM-DD HH:mm:ss',
    monthrange: 'YYYY-MM',
    yearrange: 'YYYY'
  }
  return props.field.display_format || formats[type] || 'YYYY-MM-DD'
})

// 值格式
const valueFormat = computed(() => {
  const type = props.field.date_type || 'date'
  const formats = {
    date: 'YYYY-MM-DD',
    datetime: 'YYYY-MM-DD HH:mm:ss',
    year: 'YYYY',
    month: 'YYYY-MM',
    week: 'YYYY-ww',
    dates: 'YYYY-MM-DD',
    daterange: 'YYYY-MM-DD',
    datetimerange: 'YYYY-MM-DD HH:mm:ss',
    monthrange: 'YYYY-MM',
    yearrange: 'YYYY'
  }
  return props.field.value_format || formats[type] || 'YYYY-MM-DD'
})

// 禁用日期
const disabledDate = (time) => {
  const config = props.field.date_config || {}
  
  // 禁用今天之前的日期
  if (config.disable_past) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return time.getTime() < today.getTime()
  }
  
  // 禁用今天之后的日期
  if (config.disable_future) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return time.getTime() > today.getTime()
  }
  
  // 自定义日期范围
  if (config.min_date) {
    const minDate = new Date(config.min_date)
    if (time.getTime() < minDate.getTime()) {
      return true
    }
  }
  
  if (config.max_date) {
    const maxDate = new Date(config.max_date)
    if (time.getTime() > maxDate.getTime()) {
      return true
    }
  }
  
  // 禁用特定日期
  if (config.disabled_dates && Array.isArray(config.disabled_dates)) {
    const timeStr = time.toISOString().split('T')[0]
    return config.disabled_dates.includes(timeStr)
  }
  
  // 只允许工作日
  if (config.workdays_only) {
    const day = time.getDay()
    return day === 0 || day === 6 // 0=周日, 6=周六
  }
  
  // 只允许周末
  if (config.weekends_only) {
    const day = time.getDay()
    return day !== 0 && day !== 6
  }
  
  return false
}

const handleChange = (value) => {
  emit('change', value)
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
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

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-range-editor) {
  width: 100%;
}

:deep(.el-date-editor .el-range__icon) {
  color: #c0c4cc;
}

:deep(.el-date-editor .el-range-input) {
  background-color: transparent;
}
</style> 