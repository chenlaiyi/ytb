<template>
  <div class="debug-container">
    <h1>调试页面</h1>
    <p>如果您能看到这个页面，说明基本渲染正常。</p>
    <div class="debug-info">
      <h2>调试信息</h2>
      <pre>{{ debugInfo }}</pre>
    </div>
    <div class="error-info" v-if="errorMessage">
      <h2>错误信息</h2>
      <pre>{{ errorMessage }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SmsDebug',
  data() {
    return {
      debugInfo: 'Loading...',
      errorMessage: ''
    }
  },
  mounted() {
    try {
      // 收集调试信息
      this.debugInfo = {
        vueVersion: this.$root.$options.version || 'Unknown',
        routePath: this.$route.path,
        routeFullPath: this.$route.fullPath,
        routeName: this.$route.name,
        routeMeta: this.$route.meta,
        routeParams: this.$route.params,
        routeQuery: this.$route.query,
        windowLocation: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      };
      
      // 转换为字符串以便显示
      this.debugInfo = JSON.stringify(this.debugInfo, null, 2);
      
      // 添加一个全局错误处理器
      window.onerror = (message, source, lineno, colno, error) => {
        this.errorMessage += `\nError: ${message}\nSource: ${source}\nLine: ${lineno}:${colno}\n`;
        if (error && error.stack) {
          this.errorMessage += `Stack: ${error.stack}\n`;
        }
        return false;
      };
      
      // 添加Vue错误处理器
      this.$root.$on('error', (err) => {
        this.errorMessage += `\nVue Error: ${err.message}\n`;
        if (err.stack) {
          this.errorMessage += `Stack: ${err.stack}\n`;
        }
      });
      
      // 尝试触发一些常见的Vue操作
      setTimeout(() => {
        this.debugInfo += '\nTimeout executed successfully';
      }, 1000);
      
    } catch (err) {
      this.errorMessage = `Error in mounted hook: ${err.message}\n${err.stack}`;
    }
  }
}
</script>

<style scoped>
.debug-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}
h1 {
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}
.debug-info, .error-info {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}
.debug-info {
  background-color: #f5f5f5;
}
.error-info {
  background-color: #fff0f0;
  border: 1px solid #ffcccc;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow: auto;
}
</style>
