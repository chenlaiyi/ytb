<template>
  <div class="upload-card">
    <van-uploader
      class="upload-card__uploader"
      :file-list="fileList"
      :max-count="maxCount"
      :accept="accept"
      :preview-full-image="previewFullImage"
      :preview-image="previewImage"
      :after-read="handleAfterRead"
      @delete="handleDelete"
    />
    <div v-if="hasFile && previewSrc" class="upload-card__preview">
      <img :src="previewSrc" alt="已上传图片" />
      <button class="upload-card__delete" type="button" @click.stop="handleDelete">
        <van-icon name="cross" size="14" />
      </button>
    </div>
    <div v-if="!hasFile" class="upload-card__overlay">
      <div
        v-if="placeholderBackground"
        class="upload-card__illustration"
        :style="{ backgroundImage: placeholderBackground }"
      />
      <div class="upload-card__content">
        <van-icon :name="placeholderIcon" size="34" />
        <span>上传{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  },
  placeholderIcon: {
    type: String,
    default: 'photograph'
  },
  fileList: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 1
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  variant: {
    type: String,
    default: ''
  },
  previewFullImage: {
    type: Boolean,
    default: true
  },
  previewImage: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['upload', 'remove'])

const illustrationMap = {
  business_license:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjIwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEyMCIgcng9IjE4IiBmaWxsPSIjRkZFRkYyIiBzdHJva2U9IiNGRjlCQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iOCAxMCIvPjxyZWN0IHg9IjcwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEyIiByeD0iNiIgZmlsbD0iI0ZGRDBEQSIvPjxyZWN0IHg9IjcwIiB5PSI4MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEyIiByeD0iNiIgZmlsbD0iI0ZGRTFFOCIvPjxyZWN0IHg9IjcwIiB5PSIxMTAiIHdpZHRoPSI5MCIgaGVpZ2h0PSIxMiIgcng9IjYiIGZpbGw9IiNGRkYyRjUiLz48L3N2Zz4=')",
  handheld_id:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTEwIiBjeT0iNjAiIHI9IjM0IiBmaWxsPSIjRkZFRkYyIi8+PHJlY3QgeD0iNjAiIHk9IjkwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiByeD0iMjUiIGZpbGw9IiNGRkQ1REYiLz48cmVjdCB4PSI5NSIgeT0iMzgiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0NCIgcng9IjE1IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjciLz48cmVjdCB4PSI4NSIgeT0iMTAwIiB3aWR0aD0iNTAiIGhlaWdodD0iMzAiIHJ4PSIxNSIgZmlsbD0iI0ZGRTRFQyIvPjwvc3ZnPg==')",
  storefront:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMzUiIHk9IjY1IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjgwIiByeD0iMTgiIGZpbGw9IiNGRkYzRUMiLz48cGF0aCBkPSJNNTUgNjUgTDE2NSA2NSBMMTUwIDM1IEg3MCBMNTUgNjUgWiIgZmlsbD0iI0ZGRDhDMiIvPjxyZWN0IHg9Ijc1IiB5PSI5NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjUwIiByeD0iMTAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjEzMCIgeT0iOTUiIHdpZHRoPSIzNSIgaGVpZ2h0PSIyOCIgcng9IjgiIGZpbGw9IiNGRkU2RDgiLz48cmVjdCB4PSI0NSIgeT0iMTEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIHJ4PSI2IiBmaWxsPSIjRkZFMENGIiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=')",
  cashier:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNTAiIHk9IjQ1IiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiByeD0iMTYiIGZpbGw9IiNFREY2RkYiIHN0cm9rZT0iI0IxRDVGRiIvPjxyZWN0IHg9IjY1IiB5PSI2MCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjM1IiByeD0iMTIiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB4PSI3OCIgeT0iMTA4IiB3aWR0aD0iNjQiIGhlaWdodD0iMzAiIHJ4PSIxMiIgZmlsbD0iI0RERUJGRiIvPjxyZWN0IHg9Ijg1IiB5PSI2OCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjYiIHJ4PSIzIiBmaWxsPSIjQzJEOUZGIi8+PHJlY3QgeD0iMTEwIiB5PSI2OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjYiIHJ4PSIzIiBmaWxsPSIjQzJEOUZGIi8+PC9zdmc+')",
  indoor:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjMwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjExMCIgcng9IjE4IiBmaWxsPSIjRjNGOEZGIi8+PHJlY3QgeD0iNTUiIHk9IjQ1IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjE4IiByeD0iOSIgZmlsbD0iI0UyRURGRiIvPjxyZWN0IHg9IjU1IiB5PSI3NiIgd2lkdGg9IjExMCIgaGVpZ2h0PSIxOCIgcng9IjkiIGZpbGw9IiNFQUYxRkYiLz48cmVjdCB4PSI1NSIgeT0iMTA3IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjE4IiByeD0iOSIgZmlsbD0iI0Y1RjhGRiIvPjxyZWN0IHg9IjcwIiB5PSI0NyIgd2lkdGg9IjI1IiBoZWlnaHQ9IjE0IiByeD0iNiIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjcwIiB5PSI3OCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjE0IiByeD0iNiIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjcwIiB5PSIxMDkiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxNCIgcng9IjYiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')",
  legal_id_front:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjMwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjRkZFRkYyIi8+PHJlY3QgeD0iNjAiIHk9IjUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiNGRkRFRkYiLz48Y2lyY2xlIGN4PSI5MCIgY3k9IjgwIiByPSIxNSIgZmlsbD0iI0ZGQ0ZEMCIvPjxyZWN0IHg9IjExNSIgeT0iNzAiIHdpZHRoPSIzNSIgaGVpZ2h0PSI4IiByeD0iNCIgZmlsbD0iI0ZGRjdGRCIvPjwvc3ZnPg==')",
  legal_id_back:
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIyMCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNDAiIHk9IjMwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjRjNGOEZGIi8+PHJlY3QgeD0iNjAiIHk9IjUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiNFQ0Y4RkYiLz48Y2lyY2xlIGN4PSI5MCIgY3k9IjgwIiByPSIxNSIgZmlsbD0iI0U2RUZGRiIvPjwvc3ZnPg==')"
}

const hasFile = computed(() => (props.fileList?.length || 0) > 0)
const firstFile = computed(() => (props.fileList && props.fileList.length ? props.fileList[0] : null))
const previewSrc = computed(() => firstFile.value?.url || firstFile.value?.content || '')

const placeholderBackground = computed(() => illustrationMap[props.variant] || '')

const handleAfterRead = (payload) => {
  emit('upload', payload)
}

const handleDelete = () => {
  emit('remove')
}
</script>

<style scoped>
.upload-card {
  width: 100%;
  position: relative;
  padding-top: 100%;
  border-radius: 18px;
  border: 1px dashed rgba(255, 77, 97, 0.35);
  background: #fff8f9;
  overflow: hidden;
}

.upload-card :deep(.van-uploader) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.upload-card :deep(.van-uploader__wrapper) {
  width: 100%;
  height: 100%;
}

.upload-card :deep(.van-uploader__upload) {
  width: 100%;
  height: 100%;
  margin: 0;
  border: none;
  background: transparent;
  display: block;
}

.upload-card :deep(.van-uploader__upload .van-icon) {
  display: none;
}

.upload-card :deep(.van-uploader__upload-icon) {
  display: none;
}

.upload-card :deep(.van-uploader__upload::before),
.upload-card :deep(.van-uploader__upload::after) {
  display: none;
}


.upload-card :deep(.van-uploader__upload-text),
.upload-card :deep(.van-uploader__upload-icon),
.upload-card :deep(.van-uploader__upload-hint) {
  display: none;
}

.upload-card :deep(.van-uploader__input) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-card :deep(.van-uploader__preview) {
  display: none;
}

.upload-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 45, 85, 0.04);
  overflow: hidden;
  pointer-events: none;
}

.upload-card__preview {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  overflow: hidden;
  pointer-events: none;
}

.upload-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-card__delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}

.upload-card__delete:active {
  opacity: 0.85;
}

.upload-card__illustration {
  position: absolute;
  inset: auto 10px 10px;
  height: 60%;
  width: calc(100% - 20px);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: contain;
  opacity: 0.4;
}

.upload-card__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: #ff2d55;
  font-size: 13px;
  font-weight: 500;
}

</style>

<style>
.upload-card .van-uploader__upload .van-icon,
.upload-card .van-uploader__upload-icon,
.upload-card .van-uploader__upload::before,
.upload-card .van-uploader__upload::after {
  display: none !important;
}
</style>
