<template>
  <section class="announcement-ticker" v-if="announcements.length">
    <van-notice-bar
      left-icon="volume-o"
      scrollable
      background="#fff7ed"
      color="#c2410c"
    >
      <span v-for="(item, index) in announcements" :key="item.id">
        {{ item.title }}（{{ item.date }}）
        <span v-if="index !== announcements.length - 1"> ｜ </span>
      </span>
    </van-notice-bar>
  </section>
</template>

<script setup>
defineProps({
  announcements: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.announcement-ticker {
  margin-bottom: 16px;
}
</style>
