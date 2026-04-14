<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>

  <!-- 添加404错误提示 -->
  <el-dialog
    v-model="show404Dialog"
    title="页面加载失败"
    width="30%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <p>当前页面（{{ currentPath }}）加载失败，这可能是因为:</p>
    <ul>
      <li>页面路由未正确配置</li>
      <li>对应的后端API不存在</li>
      <li>组件文件丢失或未正确导入</li>
    </ul>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="goToDashboard">返回首页</el-button>
        <el-button type="primary" @click="retryPath">重试</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, onMounted, onBeforeMount, onErrorCaptured, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// 导入短信模块路径修复工具
import { autoFixSmsPath, isSmsPath, fixSmsPath, getSmsSubPath } from '@/utils/smsPathFixer';
// 导入路由帮助工具
import { fixRoutePath, checkRoutePath, handleRouteError, safeGetRouteProp } from '@/utils/routeHelper';

export default {
  name: 'App',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const currentPath = ref('');
    const show404Dialog = ref(false);
    const is404 = ref(false);

    // 监听路由变化
    watch(() => route.path, (newPath) => {
      currentPath.value = newPath;
      checkCurrentPath();
    });

    // 检查当前路径是否有问题
    const checkCurrentPath = () => {
      const routeCheck = checkRoutePath(currentPath.value);
      if (routeCheck) {
        console.warn('路由问题:', routeCheck.message, routeCheck.suggestion);
      }

      // 检查是否为404页面
      if ((currentPath.value === '/404' || document.title.includes('404')) && !is404.value) {
        is404.value = true;
        handlePageNotFound();
      } else {
        is404.value = false;
        show404Dialog.value = false;
      }
    };

    // 处理页面不存在的情况
    const handlePageNotFound = () => {
      show404Dialog.value = true;
      console.error('页面不存在:', currentPath.value);
    };

    // 返回首页
    const goToDashboard = () => {
      show404Dialog.value = false;
      router.push('/dashboard');
    };

    // 重试当前路径
    const retryPath = () => {
      show404Dialog.value = false;
      // 尝试修复路径
      const fixedPath = fixRoutePath(currentPath.value);

      if (fixedPath !== currentPath.value) {
        router.replace(fixedPath);
      } else {
        // 如果路径没变，尝试强制刷新
        window.location.reload();
      }
    };

    // 捕获组件级别的错误
    onErrorCaptured((err, instance, info) => {
      console.error('应用错误:', err);


      // 使用全局路由错误处理函数
      if (err.message && (
        err.message.includes('router') ||
        err.message.includes('navigation') ||
        err.message.includes('fullPath') ||
        err.message.includes('undefined')
      )) {
        const handled = handleRouteError(err, router);

        if (!handled) {
          // 如果全局处理失败，尝试恢复到首页
          try {
            router.push('/dashboard');
          } catch (e) {
            console.error('重定向到首页失败，尝试直接刷新页面', e);
            window.location.href = '/admin/#/dashboard';
          }
        }
      }

      return false; // 阻止错误向上传播
    });

    // 在组件挂载前获取当前路径
    onBeforeMount(() => {
      currentPath.value = route.path;
    });

    // 在组件挂载时检查和恢复路由状态
    onMounted(() => {
      // 获取当前完整路径
      const fullPath = window.location.pathname;
      // 处理Tapp/admin/public前缀，但不移除它
      const path = fullPath;

      currentPath.value = route.path;

      // 检查当前路径
      checkCurrentPath();

      // 尝试自动修复短信模块路径问题
      if (autoFixSmsPath(router)) {
        return;
      }

      // 检测和修复短信模块路径问题 - 重复的Tapp/admin/public
      if (fullPath.includes('/Tapp/admin/public/Tapp/admin/public')) {
        const correctedPath = fullPath.replace('/Tapp/admin/public/Tapp/admin/public', '/admin');

        window.location.href = correctedPath;
        return;
      }

      // 修复旧路径到新路径的转换
      if (fullPath.includes('/Tapp/admin/public')) {
        const newPath = fullPath.replace('/Tapp/admin/public', '/admin');

        window.location.href = newPath;
        return;
      }

      // 处理业务员路由
      if ((path.includes('/users/salesmen') || path.includes('/users/salesman-stats')) &&
          !sessionStorage.getItem('routeSafe')) {
        sessionStorage.setItem('routeSafe', 'true');

        // 延迟执行路由恢复，确保应用已完全初始化
        setTimeout(() => {
          if (path.includes('/users/salesmen')) {
            router.replace('/users/salesmen');
          } else if (path.includes('/users/salesman-stats')) {
            router.replace('/users/salesman-stats');
          }
        }, 100);
      }

      // 特别处理SMS路径 - sms-logs, sms-statistics, sms-codes 转向 sms/logs, sms/statistics, sms/codes
      if (isSmsPath(path) && path.includes('/system/sms-')) {
        const newPath = fixSmsPath(fullPath);

        window.location.href = newPath;
        return;
      }

      // 修复SMS页面的404错误 - 处理URL格式变更导致的问题
      setTimeout(() => {
        // 如果当前页面是404错误页面
        if (currentPath.value === '/404' || document.title.includes('404')) {
          handlePageNotFound();

          // 处理短信模块路径问题
          if (isSmsPath(fullPath)) {

            // 提取短信模块的子路径（logs, statistics 或 codes）
            const smsSubPath = getSmsSubPath(fullPath);

            // 构建正确的路由路径
            const correctPath = '/system/sms/' + smsSubPath;

            // 使用router.replace而不是修改location，避免页面刷新
            router.replace(correctPath);

            // 延迟一下再刷新页面，确保路由已经切换
            setTimeout(() => {
              window.location.reload();
            }, 100);
            return;
          }
        }
      }, 500);
    });

    return {
      currentPath,
      show404Dialog,
      goToDashboard,
      retryPath
    };
  }
};
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

#app {
  height: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>