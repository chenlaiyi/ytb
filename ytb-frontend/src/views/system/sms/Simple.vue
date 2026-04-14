<template>
  <div style="padding: 20px; background-color: white;">
    <h1>简单测试页面</h1>
    <p>这是一个非常简单的页面，不使用任何复杂的组件或布局。</p>
    <p>如果您能看到这个页面，说明基本的Vue渲染是正常的。</p>
    <button @click="count++">点击我: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'SmsSimple',
  data() {
    return {
      count: 0
    }
  }
}
</script>
