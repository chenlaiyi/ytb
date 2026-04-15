<template>
  <div class="navigation-test">
    <NavHeader title="导航测试页面" />
    
    <div class="content">
      <van-cell-group title="导航组件测试">
        <van-cell title="当前路径" :value="currentPath" />
        <van-cell title="是否显示返回按钮" :value="shouldShowBackButton ? '是' : '否'" />
        <van-cell title="历史记录长度" :value="historyLength" />
      </van-cell-group>
      
      <van-cell-group title="测试链接" style="margin-top: 20px;">
        <van-cell title="主页面测试" is-link @click="testMainPage" />
        <van-cell title="子页面测试" is-link @click="testSubPage" />
        <van-cell title="深层子页面测试" is-link @click="testDeepPage" />
      </van-cell-group>
      
      <div class="test-buttons" style="padding: 20px;">
        <van-button type="primary" block @click="testBackButton">
          测试返回按钮
        </van-button>
        <van-button type="success" block style="margin-top: 10px;" @click="reloadPage">
          重新加载页面
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavHeader from '@/components/NavHeader.vue'
import { useNavigation } from '@/composables/useNavigation'

const router = useRouter()
const route = useRoute()
const { shouldShowBackButton, handleBack } = useNavigation()

const currentPath = computed(() => route.path)
const historyLength = ref(window.history.length)

const testMainPage = () => {
  router.push('/')
}

const testSubPage = () => {
  router.push('/agent/team')
}

const testDeepPage = () => {
  router.push('/vip/list')
}

const testBackButton = () => {
  handleBack()
}

const reloadPage = () => {
  window.location.reload()
}

onMounted(() => {
  console.log('导航测试页面加载完成')
  console.log('当前路径:', route.path)
  console.log('是否显示返回按钮:', shouldShowBackButton.value)
})
</script>

<style scoped>
.navigation-test {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}

.test-buttons {
  padding: 20px;
}
</style>