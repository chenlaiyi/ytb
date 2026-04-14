<template>
  <div class="form-field-select" :style="{ width: field.width }">
    <el-form-item
      :label="field.label"
      :required="field.required"
      :prop="field.name"
    >
      <el-select
        v-model="fieldValue"
        :placeholder="field.placeholder"
        :disabled="readonly"
        clearable
        @change="handleChange"
      >
        <el-option
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <div v-if="field.help_text" class="field-help-text">
        {{ field.help_text }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

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
  }
})

const emit = defineEmits(['update:modelValue'])

const fieldValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  fieldValue.value = newValue
})

const handleChange = () => {
  emit('update:modelValue', fieldValue.value)
}
</script>

<style scoped>
.form-field-select {
  margin-bottom: 16px;
}

.field-help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style> 