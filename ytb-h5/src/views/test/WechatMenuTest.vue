<template>
  <div class="test-page">
    <h2>微信菜单管理测试</h2>
    
    <div class="test-section">
      <h3>API测试</h3>
      <div class="test-buttons">
        <button @click="testGetMenuList" class="btn btn-primary">
          测试获取菜单列表
        </button>
        <button @click="testCreateMenu" class="btn btn-success">
          测试创建菜单
        </button>
        <button @click="testValidateMenu" class="btn btn-default">
          测试菜单验证
        </button>
      </div>
    </div>
    
    <div class="test-section">
      <h3>测试结果</h3>
      <div class="test-result">
        <pre>{{ testResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>快速跳转</h3>
      <div class="test-buttons">
        <button @click="goToWechatMenu" class="btn btn-primary">
          跳转到微信菜单管理
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { wechatMenuApi } from '@/api/wechatMenu'

export default {
  name: 'WechatMenuTest',
  setup() {
    const router = useRouter()
    const testResult = ref('等待测试...')
    
    const testGetMenuList = async () => {
      try {
        testResult.value = '正在测试获取菜单列表...'
        const response = await wechatMenuApi.getMenuList({
          branch_id: 1,
          type: 1,
          page: 1,
          per_page: 10
        })
        testResult.value = JSON.stringify(response, null, 2)
      } catch (error) {
        testResult.value = `测试失败: ${error.message}`
      }
    }
    
    const testCreateMenu = async () => {
      try {
        testResult.value = '正在测试创建菜单...'
        const menuData = {
          title: '测试菜单',
          type: 1,
          branch_id: 1,
          menu_data: {
            button: [
              {
                name: '测试按钮',
                type: 'click',
                key: 'test_key'
              }
            ]
          }
        }
        
        const response = await wechatMenuApi.saveMenu(menuData)
        testResult.value = JSON.stringify(response, null, 2)
      } catch (error) {
        testResult.value = `测试失败: ${error.message}`
      }
    }
    
    const testValidateMenu = async () => {
      try {
        testResult.value = '正在测试菜单验证...'
        const menuData = {
          button: [
            {
              name: '测试按钮',
              type: 'click',
              key: 'test_key'
            }
          ]
        }
        
        const response = await wechatMenuApi.validateMenu(menuData)
        testResult.value = JSON.stringify(response, null, 2)
      } catch (error) {
        testResult.value = `测试失败: ${error.message}`
      }
    }
    
    const goToWechatMenu = () => {
      router.push('/branch/wechat-menu')
    }
    
    return {
      testResult,
      testGetMenuList,
      testCreateMenu,
      testValidateMenu,
      goToWechatMenu
    }
  }
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.test-result {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.test-result pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-default {
  background: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

h2, h3 {
  margin-top: 0;
  color: #333;
}
</style> 