<template>
  <div class="form-field-text" :style="{ width: field.width }">
    <el-form-item
      :label="field.label"
      :required="field.required"
      :prop="field.name"
    >
      <el-input
        v-model="fieldValue"
        :placeholder="field.placeholder"
        :maxlength="field.max_length"
        :disabled="readonly"
        show-word-limit
        clearable
        @input="handleInput"
      />
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
    type: String,
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

const handleInput = () => {
  emit('update:modelValue', fieldValue.value)
}
</script>

<style scoped>
.form-field-text {
  margin-bottom: 16px;
}

.field-help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style> 