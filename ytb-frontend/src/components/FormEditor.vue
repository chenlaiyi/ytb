<template>
  <div class="form-editor">
    <div class="form-editor-container">
      <!-- 左侧：字段组件库 -->
      <div class="field-library">
        <h4>表单组件</h4>
        <div class="field-list">
          <div
            v-for="field in fieldTemplates"
            :key="field.type"
            class="field-item"
            draggable="true"
            @dragstart="handleDragStart($event, field)"
          >
            <i :class="field.icon"></i>
            <span>{{ field.label }}</span>
          </div>
        </div>
      </div>

      <!-- 中间：表单设计区域 -->
      <div class="form-designer">
        <h4>表单设计</h4>
        <div
          class="form-canvas"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
        >
          <div v-if="formFields.length === 0" class="empty-canvas">
            <p>从左侧拖拽组件到这里开始设计表单</p>
          </div>
          
          <draggable
            v-model="formFields"
            group="form-fields"
            item-key="id"
            class="field-container"
            @change="handleFieldsChange"
          >
            <template #item="{ element, index }">
              <div
                class="form-field-wrapper"
                :class="{ active: selectedFieldIndex === index }"
                @click="selectField(index)"
              >
                <!-- 字段预览 -->
                <div class="field-preview">
                  <component
                    :is="getFieldComponent(element.type)"
                    :field="element"
                    :readonly="true"
                  />
                </div>
                
                <!-- 字段操作按钮 -->
                <div class="field-actions">
                  <el-button
                    type="primary"
                    size="small"
                    icon="Edit"
                    @click.stop="editField(index)"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    icon="Delete"
                    @click.stop="removeField(index)"
                  />
                  <el-button
                    size="small"
                    icon="CopyDocument"
                    @click.stop="duplicateField(index)"
                  />
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- 右侧：字段属性配置 -->
      <div class="field-properties">
        <h4>字段属性</h4>
        <div v-if="selectedField" class="property-panel">
          <el-form :model="selectedField" label-width="80px">
            <!-- 基础属性 -->
            <el-form-item label="字段名称">
              <el-input v-model="selectedField.name" placeholder="字段唯一标识" />
            </el-form-item>
            
            <el-form-item label="字段标签">
              <el-input v-model="selectedField.label" placeholder="显示标签" />
            </el-form-item>
            
            <el-form-item label="占位符">
              <el-input
                v-model="selectedField.placeholder"
                placeholder="输入提示文字"
              />
            </el-form-item>
            
            <el-form-item label="是否必填">
              <el-switch v-model="selectedField.required" />
            </el-form-item>
            
            <!-- 类型特定属性 -->
            <template v-if="selectedField.type === 'text' || selectedField.type === 'textarea'">
              <el-form-item label="最大长度">
                <el-input-number
                  v-model="selectedField.max_length"
                  :min="1"
                  :max="1000"
                />
              </el-form-item>
            </template>
            
            <template v-if="selectedField.type === 'textarea'">
              <el-form-item label="行数">
                <el-input-number
                  v-model="selectedField.rows"
                  :min="2"
                  :max="10"
                />
              </el-form-item>
            </template>
            
            <template v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)">
              <el-form-item label="选项配置">
                <div class="options-config">
                  <div
                    v-for="(option, index) in selectedField.options"
                    :key="index"
                    class="option-item"
                  >
                    <el-input
                      v-model="option.label"
                      placeholder="选项标签"
                      class="option-label"
                    />
                    <el-input
                      v-model="option.value"
                      placeholder="选项值"
                      class="option-value"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      icon="Delete"
                      @click="removeOption(index)"
                    />
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    icon="Plus"
                    @click="addOption"
                  >
                    添加选项
                  </el-button>
                </div>
              </el-form-item>
            </template>
            
            <template v-if="selectedField.type === 'phone'">
              <el-form-item label="验证规则">
                <el-input
                  v-model="selectedField.pattern"
                  placeholder="正则表达式"
                />
              </el-form-item>
            </template>
            
            <template v-if="selectedField.type === 'date'">
              <el-form-item label="日期格式">
                <el-select v-model="selectedField.format">
                  <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                  <el-option label="YYYY-MM-DD HH:mm" value="YYYY-MM-DD HH:mm" />
                  <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
                </el-select>
              </el-form-item>
            </template>
            
            <!-- 样式设置 -->
            <el-form-item label="字段宽度">
              <el-select v-model="selectedField.width">
                <el-option label="100%" value="100%" />
                <el-option label="50%" value="50%" />
                <el-option label="33%" value="33%" />
                <el-option label="25%" value="25%" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="帮助文本">
              <el-input
                v-model="selectedField.help_text"
                type="textarea"
                placeholder="字段说明文字"
                :rows="2"
              />
            </el-form-item>
          </el-form>
        </div>
        
        <div v-else class="no-selection">
          <p>请选择要配置的字段</p>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="表单预览"
      width="600px"
      @closed="previewVisible = false"
    >
      <div class="form-preview">
        <component
          :is="getFormComponent()"
          :fields="formFields"
          :readonly="true"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'

// 导入所有字段组件
import FormFieldText from './form-fields/FormFieldText.vue'
import FormFieldTextarea from './form-fields/FormFieldTextarea.vue'
import FormFieldSelect from './form-fields/FormFieldSelect.vue'
import FormFieldRadio from './form-fields/FormFieldRadio.vue'
import FormFieldCheckbox from './form-fields/FormFieldCheckbox.vue'
import FormFieldDate from './form-fields/FormFieldDate.vue'
import FormFieldPhone from './form-fields/FormFieldPhone.vue'
import FormFieldEmail from './form-fields/FormFieldEmail.vue'
import DynamicForm from './DynamicForm.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  fieldTemplates: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const formFields = ref([...props.modelValue])
const selectedFieldIndex = ref(-1)
const previewVisible = ref(false)
const draggedField = ref(null)

// 计算属性
const selectedField = computed(() => {
  if (selectedFieldIndex.value >= 0 && selectedFieldIndex.value < formFields.value.length) {
    return formFields.value[selectedFieldIndex.value]
  }
  return null
})

// 监听数据变化
const handleFieldsChange = () => {
  emit('update:modelValue', formFields.value)
  emit('change', formFields.value)
}

// 拖拽开始
const handleDragStart = (event, field) => {
  draggedField.value = field
  event.dataTransfer.effectAllowed = 'copy'
}

// 拖拽放置
const handleDrop = (event) => {
  event.preventDefault()
  
  if (draggedField.value) {
    const newField = createFieldFromTemplate(draggedField.value)
    formFields.value.push(newField)
    handleFieldsChange()
    
    // 选中新添加的字段
    selectedFieldIndex.value = formFields.value.length - 1
    
    draggedField.value = null
  }
}

// 从模板创建字段
const createFieldFromTemplate = (template) => {
  const timestamp = Date.now()
  return {
    id: `${template.type}_${timestamp}`,
    type: template.type,
    name: `${template.config.name}_${timestamp}`,
    label: template.config.label,
    placeholder: template.config.placeholder || '',
    required: template.config.required || false,
    options: template.config.options ? [...template.config.options] : [],
    max_length: template.config.max_length || 100,
    rows: template.config.rows || 4,
    pattern: template.config.pattern || '',
    format: template.config.format || 'YYYY-MM-DD',
    width: '100%',
    help_text: ''
  }
}

// 选择字段
const selectField = (index) => {
  selectedFieldIndex.value = index
}

// 编辑字段
const editField = (index) => {
  selectedFieldIndex.value = index
}

// 删除字段
const removeField = (index) => {
  if (formFields.value.length > 0) {
    formFields.value.splice(index, 1)
    
    // 调整选中索引
    if (selectedFieldIndex.value >= formFields.value.length) {
      selectedFieldIndex.value = formFields.value.length - 1
    }
    
    handleFieldsChange()
  }
}

// 复制字段
const duplicateField = (index) => {
  const originalField = formFields.value[index]
  const timestamp = Date.now()
  
  const duplicatedField = {
    ...originalField,
    id: `${originalField.type}_${timestamp}`,
    name: `${originalField.name}_copy_${timestamp}`,
    label: `${originalField.label}_副本`
  }
  
  formFields.value.splice(index + 1, 0, duplicatedField)
  handleFieldsChange()
  
  ElMessage.success('字段复制成功')
}

// 添加选项
const addOption = () => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.push({
      label: `选项${selectedField.value.options.length + 1}`,
      value: `option_${selectedField.value.options.length + 1}`
    })
    handleFieldsChange()
  }
}

// 删除选项
const removeOption = (index) => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.splice(index, 1)
    handleFieldsChange()
  }
}

// 获取字段组件
const getFieldComponent = (type) => {
  const components = {
    text: 'FormFieldText',
    textarea: 'FormFieldTextarea',
    select: 'FormFieldSelect',
    radio: 'FormFieldRadio',
    checkbox: 'FormFieldCheckbox',
    date: 'FormFieldDate',
    phone: 'FormFieldPhone',
    email: 'FormFieldEmail'
  }
  return components[type] || 'FormFieldText'
}

// 获取表单组件
const getFormComponent = () => {
  return 'DynamicForm'
}

// 预览表单
const previewForm = () => {
  previewVisible.value = true
}

// 清空表单
const clearForm = () => {
  formFields.value = []
  selectedFieldIndex.value = -1
  handleFieldsChange()
  ElMessage.success('表单已清空')
}

// 导出配置
const exportConfig = () => {
  const config = JSON.stringify(formFields.value, null, 2)
  const blob = new Blob([config], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 暴露方法给父组件
defineExpose({
  previewForm,
  clearForm,
  exportConfig
})
</script>

<style scoped>
.form-editor {
  height: 100%;
  background: #f5f5f5;
}

.form-editor-container {
  display: flex;
  height: 600px;
  gap: 16px;
}

.field-library {
  width: 200px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-library h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s ease;
}

.field-item:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: translateY(-1px);
}

.field-item i {
  font-size: 16px;
  color: #666;
}

.field-item span {
  font-size: 12px;
  color: #333;
}

.form-designer {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-designer h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.form-canvas {
  min-height: 400px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.empty-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-field-wrapper {
  position: relative;
  padding: 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-field-wrapper:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.form-field-wrapper.active {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.field-preview {
  pointer-events: none;
}

.field-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.form-field-wrapper:hover .field-actions,
.form-field-wrapper.active .field-actions {
  opacity: 1;
}

.field-properties {
  width: 300px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-properties h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.property-panel {
  max-height: 500px;
  overflow-y: auto;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.options-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-label {
  flex: 1;
}

.option-value {
  flex: 1;
}

.form-preview {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}
</style> 