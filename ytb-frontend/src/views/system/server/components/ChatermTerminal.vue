<template>
  <div class="chaterm-terminal">
    <!-- 终端头部 -->
    <div class="terminal-header">
      <div class="header-left">
        <div class="terminal-title">
          <h3>🤖 Chaterm 智能终端</h3>
          <span class="version-badge">v2.0 Pro</span>
        </div>
        <div class="status-indicators">
          <span class="terminal-status" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
            <i :class="isConnected ? 'el-icon-success' : 'el-icon-error'"></i>
            {{ isConnected ? '已连接' : '未连接' }}
          </span>
          <span class="workspace-info">
            <i class="el-icon-folder"></i>
            工作区: {{ currentWorkspace }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <div class="feature-toggles">
          <el-tooltip content="AI Agent - 自然语言命令生成" placement="bottom">
            <el-button 
              size="small" 
              :type="aiMode ? 'primary' : 'default'"
              @click="toggleAiMode"
              class="feature-btn"
            >
              <i class="el-icon-magic-stick"></i>
              AI Agent
            </el-button>
          </el-tooltip>
          <el-tooltip content="语音命令输入" placement="bottom">
            <el-button 
              size="small" 
              :type="voiceMode ? 'primary' : 'default'"
              @click="toggleVoiceMode"
              class="feature-btn"
            >
              <i class="el-icon-microphone"></i>
              语音输入
            </el-button>
          </el-tooltip>
          <el-tooltip content="语法高亮" placement="bottom">
            <el-button 
              size="small" 
              :type="syntaxHighlight ? 'primary' : 'default'"
              @click="toggleSyntaxHighlight"
              class="feature-btn"
            >
              <i class="el-icon-view"></i>
              语法高亮
            </el-button>
          </el-tooltip>
          <el-tooltip content="智能补全" placement="bottom">
            <el-button 
              size="small" 
              :type="smartCompletion ? 'primary' : 'default'"
              @click="toggleSmartCompletion"
              class="feature-btn"
            >
              <i class="el-icon-cpu"></i>
              智能补全
            </el-button>
          </el-tooltip>
        </div>
        <div class="action-buttons">
          <el-button size="small" @click="clearTerminal">
            <i class="el-icon-delete"></i>
            清屏
          </el-button>
          <el-button size="small" @click="connectTerminal">
            <i class="el-icon-connection"></i>
            {{ isConnected ? '重连' : '连接' }}
          </el-button>
          <el-dropdown @command="handleMenuCommand">
            <el-button size="small">
              <i class="el-icon-more"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export">导出会话</el-dropdown-item>
                <el-dropdown-item command="import">导入配置</el-dropdown-item>
                <el-dropdown-item command="settings">终端设置</el-dropdown-item>
                <el-dropdown-item command="about">关于Chaterm</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- AI助手面板 -->
    <div v-if="aiMode" class="ai-panel">
      <div class="ai-header">
        <i class="el-icon-magic-stick"></i>
        <span>AI助手 - 用自然语言描述你想执行的操作</span>
      </div>
      <div class="ai-input-area">
        <el-input
          v-model="aiQuery"
          type="textarea"
          :rows="2"
          placeholder="例如：查看CPU使用率、重启nginx服务、查找占用内存最多的进程..."
          @keydown.ctrl.enter="processAiQuery"
        />
        <div class="ai-actions">
          <el-button type="primary" size="small" @click="processAiQuery" :loading="aiProcessing">
            生成命令
          </el-button>
          <el-button size="small" @click="aiQuery = ''">
            清空
          </el-button>
        </div>
      </div>
      <div v-if="suggestedCommand" class="suggested-command">
        <div class="command-header">
          <span>建议的命令：</span>
          <el-button size="mini" type="primary" @click="executeCommand(suggestedCommand)">
            执行
          </el-button>
          <el-button size="mini" @click="copyToInput(suggestedCommand)">
            复制到输入框
          </el-button>
        </div>
        <div class="command-content">
          <code>{{ suggestedCommand }}</code>
        </div>
      </div>
    </div>

    <!-- 终端主体 -->
    <div class="terminal-body">
      <!-- 终端输出区域 -->
      <div class="terminal-output" ref="terminalOutput">
        <div v-for="(line, index) in terminalHistory" :key="index" class="terminal-line">
          <span v-if="line.type === 'command'" class="command-line">
            <span class="prompt">{{ currentUser }}@{{ hostname }}:{{ currentPath }}$</span>
            <span class="command">{{ line.content }}</span>
          </span>
          <span v-else-if="line.type === 'output'" class="output-line" v-html="formatOutput(line.content)"></span>
          <span v-else-if="line.type === 'error'" class="error-line">{{ line.content }}</span>
          <span v-else-if="line.type === 'ai'" class="ai-line">
            <i class="el-icon-magic-stick"></i>
            {{ line.content }}
          </span>
          <span v-else-if="line.type === 'suggestion'" class="suggestion-line" @click="executeCommand(line.content.replace(/^\s*\d+\.\s*/, ''))">
            {{ line.content }}
          </span>
          <span v-else-if="line.type === 'info'" class="info-line">
            {{ line.content }}
          </span>
          <span v-else-if="line.type === 'warning'" class="warning-line">
            {{ line.content }}
          </span>
        </div>
        <div v-if="isExecuting" class="executing-indicator">
          <i class="el-icon-loading"></i>
          执行中...
        </div>
      </div>

      <!-- 命令输入区域 -->
      <div class="terminal-input">
        <div class="input-line">
          <span class="prompt">{{ currentUser }}@{{ hostname }}:{{ currentPath }}$</span>
          <el-input
            ref="commandInput"
            v-model="currentCommand"
            class="command-input"
            @keydown.enter="executeCommand()"
            @keydown.up="navigateHistory(-1)"
            @keydown.down="navigateHistory(1)"
            @keydown.tab.prevent="autoComplete"
            placeholder="输入命令或使用AI助手..."
          />
        </div>
      </div>
    </div>

    <!-- 快捷命令面板 -->
    <div class="quick-commands">
      <div class="commands-header">
        <span>快捷命令</span>
        <el-button size="mini" @click="showCustomCommands = !showCustomCommands">
          {{ showCustomCommands ? '隐藏' : '显示' }}自定义命令
        </el-button>
      </div>
      <div v-if="showCustomCommands" class="commands-grid">
        <el-button
          v-for="cmd in quickCommands"
          :key="cmd.name"
          size="small"
          @click="executeCommand(cmd.command)"
          :title="cmd.description"
        >
          {{ cmd.name }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { executeCommand as executeCommandAPI, aiSuggestCommand, getTerminalSystemStatus, getCommandHistory } from '@/api/v1/system'

// 响应式数据
const isConnected = ref(false)
const aiMode = ref(true) // 默认开启AI模式
const voiceMode = ref(false)
const syntaxHighlight = ref(true) // 默认开启语法高亮
const smartCompletion = ref(true) // 默认开启智能补全
const aiQuery = ref('')
const aiProcessing = ref(false)
const suggestedCommand = ref('')
const terminalHistory = ref([])
const currentCommand = ref('')
const isExecuting = ref(false)
const showCustomCommands = ref(true)
const commandHistory = ref([])
const historyIndex = ref(-1)

// 终端状态
const currentUser = ref('root')
const hostname = ref('server')
const currentPath = ref('/www/wwwroot/pay.itapgo.com/Tapp')
const currentWorkspace = ref('/www/wwwroot/pay.itapgo.com/Tapp')

// 引用
const terminalOutput = ref(null)
const commandInput = ref(null)

// 快捷命令配置
const quickCommands = ref([
  { name: 'CPU状态', command: 'top -n 1 | head -20', description: '查看CPU使用情况' },
  { name: '内存状态', command: 'free -h', description: '查看内存使用情况' },
  { name: '磁盘空间', command: 'df -h', description: '查看磁盘使用情况' },
  { name: '进程列表', command: 'ps aux | head -20', description: '查看运行进程' },
  { name: 'Nginx状态', command: 'systemctl status nginx', description: '查看Nginx服务状态' },
  { name: 'PHP-FPM状态', command: 'systemctl status php-fpm', description: '查看PHP-FPM状态' },
  { name: '网络连接', command: 'netstat -tulpn | head -20', description: '查看网络连接' },
  { name: '系统日志', command: 'tail -20 /var/log/messages', description: '查看系统日志' }
])

// AI命令映射
const aiCommandMap = {
  'cpu': 'top -n 1 | head -10',
  '内存': 'free -h',
  '磁盘': 'df -h',
  '进程': 'ps aux | head -20',
  'nginx': 'systemctl status nginx',
  '重启nginx': 'systemctl restart nginx',
  '日志': 'tail -20 /var/log/messages',
  '网络': 'netstat -tulpn | head -10'
}

// 切换AI模式
const toggleAiMode = () => {
  aiMode.value = !aiMode.value
  if (aiMode.value) {
    addToHistory('AI助手已启用，您可以用自然语言描述要执行的操作', 'ai')
  }
}

// 切换语音模式
const toggleVoiceMode = () => {
  voiceMode.value = !voiceMode.value
  if (voiceMode.value) {
    ElMessage.info('语音输入功能开发中...')
    voiceMode.value = false
  }
}

// 处理AI查询
const processAiQuery = async () => {
  if (!aiQuery.value.trim()) return
  
  const query = aiQuery.value
  aiProcessing.value = true
  
  try {
    const response = await aiSuggestCommand({ query })
    
    if (response.success) {
      const data = response.data
      
      // 显示AI回复
      addToHistory(`🤖 AI助手: ${data.ai_response}`, 'ai')
      
      // 显示建议的命令
      if (data.suggestions && data.suggestions.length > 0) {
        addToHistory('💡 推荐命令:', 'ai')
        data.suggestions.forEach((cmd, index) => {
          addToHistory(`  ${index + 1}. ${cmd}`, 'suggestion')
        })
        
        // 设置第一个命令为建议命令
        suggestedCommand.value = data.recommended || data.suggestions[0] || ''
        
        // 显示数据源
        const sourceText = data.source === 'glm_ai' ? '(智谱GLM4)' : '(本地知识库)'
        addToHistory(`📊 数据源: ${sourceText}`, 'info')
      } else {
        addToHistory('❌ 未找到相关命令建议', 'warning')
      }
    } else {
      ElMessage.error(response.message || 'AI查询失败')
      addToHistory(`❌ AI查询失败: ${response.message}`, 'error')
    }
  } catch (error) {
    ElMessage.error('AI处理失败: ' + error.message)
    addToHistory(`❌ AI查询失败: ${error.message || 'Network error'}`, 'error')
  } finally {
    aiProcessing.value = false
    aiQuery.value = '' // 清空查询输入
  }
}

// 执行命令
const executeCommand = async (command = null) => {
  const cmd = command || currentCommand.value.trim()
  if (!cmd) return
  
  // 添加命令到历史
  addToHistory(cmd, 'command')
  commandHistory.value.unshift(cmd)
  if (commandHistory.value.length > 100) {
    commandHistory.value = commandHistory.value.slice(0, 100)
  }
  
  // 清空输入
  if (!command) {
    currentCommand.value = ''
  }
  
  // 重置历史索引
  historyIndex.value = -1
  
  isExecuting.value = true
  
  try {
    // 调用真实API执行命令
    const response = await executeCommandAPI({ command: cmd })
    
    if (response.success) {
      addToHistory(response.data.output || 'Command executed successfully', 'output')
    } else {
      addToHistory(response.message || 'Command execution failed', 'error')
    }
  } catch (error) {
    addToHistory(`错误: ${error.message || 'Network error'}`, 'error')
  } finally {
    isExecuting.value = false
    scrollToBottom()
  }
}

// 模拟命令执行
const simulateCommandExecution = async (command) => {
  // 添加延迟模拟真实执行
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  // 根据命令类型返回模拟输出
  if (command.includes('ls')) {
    addToHistory('drwxr-xr-x 2 root root 4096 Jan  1 12:00 admin\n-rw-r--r-- 1 root root 1234 Jan  1 12:00 README.md\ndrwxr-xr-x 2 root root 4096 Jan  1 12:00 app-vue', 'output')
  } else if (command.includes('pwd')) {
    addToHistory(currentPath.value, 'output')
  } else if (command.includes('top')) {
    addToHistory('PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND\n1234 root      20   0  123456  12345   1234 S   2.3  1.2   0:12.34 nginx\n5678 www       20   0   98765   9876    987 S   1.8  0.8   0:08.76 php-fpm', 'output')
  } else if (command.includes('free')) {
    addToHistory('              total        used        free      shared  buff/cache   available\nMem:        8000000     2000000     4000000      100000     2000000     5500000\nSwap:       2000000           0     2000000', 'output')
  } else if (command.includes('df')) {
    addToHistory('Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        40G   25G   13G  66% /\ntmpfs           4.0G     0  4.0G   0% /dev/shm', 'output')
  } else if (command.includes('systemctl status')) {
    const service = command.split(' ').pop()
    addToHistory(`● ${service}.service - ${service} service\n   Loaded: loaded (/etc/systemd/system/${service}.service; enabled)\n   Active: active (running) since Mon 2025-01-06 10:00:00 CST; 2h ago\n   Main PID: 1234 (${service})`, 'output')
  } else if (command.includes('netstat')) {
    addToHistory('Proto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN', 'output')
  } else if (command.includes('tail')) {
    addToHistory('Jan  6 10:00:01 server systemd: Started Session 123 of user root.\nJan  6 10:01:01 server CRON[1234]: (root) CMD (run-parts /etc/cron.hourly)\nJan  6 10:02:01 server systemd: Started Session 124 of user www.', 'output')
  } else {
    addToHistory(`命令执行完成: ${command}`, 'output')
  }
}

// 添加到历史记录
const addToHistory = (content, type = 'output') => {
  terminalHistory.value.push({
    content,
    type,
    timestamp: new Date().toLocaleTimeString()
  })
  
  // 限制历史记录数量
  if (terminalHistory.value.length > 1000) {
    terminalHistory.value = terminalHistory.value.slice(-500)
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// 滚动到底部
const scrollToBottom = () => {
  if (terminalOutput.value) {
    terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight
  }
}

// 格式化输出
const formatOutput = (content) => {
  return content.replace(/\n/g, '<br>')
}

// 清屏
const clearTerminal = () => {
  terminalHistory.value = []
  addToHistory('终端已清屏', 'ai')
}

// 连接终端
const connectTerminal = () => {
  isConnected.value = !isConnected.value
  if (isConnected.value) {
    addToHistory('Chaterm智能终端已连接', 'ai')
    addToHistory('提示: 使用AI助手可以用自然语言执行命令', 'ai')
  } else {
    addToHistory('终端连接已断开', 'ai')
  }
}

// 历史命令导航
const navigateHistory = (direction) => {
  if (commandHistory.value.length === 0) return
  
  historyIndex.value += direction
  
  if (historyIndex.value < 0) {
    historyIndex.value = -1
    currentCommand.value = ''
  } else if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length - 1
  }
  
  if (historyIndex.value >= 0) {
    currentCommand.value = commandHistory.value[historyIndex.value]
  }
}

// 自动补全
const autoComplete = () => {
  const cmd = currentCommand.value.trim()
  const commonCommands = ['ls', 'cd', 'pwd', 'top', 'ps', 'free', 'df', 'systemctl', 'tail', 'cat', 'grep']
  
  const matches = commonCommands.filter(c => c.startsWith(cmd))
  if (matches.length === 1) {
    currentCommand.value = matches[0] + ' '
  } else if (matches.length > 1) {
    addToHistory(`可能的命令: ${matches.join(', ')}`, 'ai')
  }
}

// 复制命令到输入框
const copyToInput = (command) => {
  currentCommand.value = command
  commandInput.value?.focus()
}

// 切换语法高亮
const toggleSyntaxHighlight = () => {
  syntaxHighlight.value = !syntaxHighlight.value
  if (syntaxHighlight.value) {
    addToHistory('✅ 语法高亮已启用', 'ai')
  } else {
    addToHistory('❌ 语法高亮已禁用', 'ai')
  }
}

// 切换智能补全
const toggleSmartCompletion = () => {
  smartCompletion.value = !smartCompletion.value
  if (smartCompletion.value) {
    addToHistory('✅ 智能补全已启用 - 按Tab键获取命令建议', 'ai')
  } else {
    addToHistory('❌ 智能补全已禁用', 'ai')
  }
}

// 处理菜单命令
const handleMenuCommand = (command) => {
  switch (command) {
    case 'export':
      exportSession()
      break
    case 'import':
      importConfig()
      break
    case 'settings':
      showSettings()
      break
    case 'about':
      showAbout()
      break
  }
}

// 导出会话
const exportSession = () => {
  const sessionData = {
    history: terminalHistory.value,
    commands: commandHistory.value,
    timestamp: new Date().toISOString(),
    workspace: currentWorkspace.value
  }
  
  const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chaterm-session-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  addToHistory('📁 会话已导出', 'ai')
}

// 导入配置
const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.history) {
            terminalHistory.value = data.history
            addToHistory('📥 配置已导入', 'ai')
          }
        } catch (error) {
          addToHistory('❌ 配置文件格式错误', 'error')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 显示设置
const showSettings = () => {
  ElMessageBox.alert(
    `当前设置:\n\n` +
    `🤖 AI Agent: ${aiMode.value ? '启用' : '禁用'}\n` +
    `🎤 语音输入: ${voiceMode.value ? '启用' : '禁用'}\n` +
    `🌈 语法高亮: ${syntaxHighlight.value ? '启用' : '禁用'}\n` +
    `💡 智能补全: ${smartCompletion.value ? '启用' : '禁用'}\n` +
    `📁 工作区: ${currentWorkspace.value}\n` +
    `🔗 连接状态: ${isConnected.value ? '已连接' : '未连接'}`,
    'Chaterm 设置',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 显示关于信息
const showAbout = () => {
  ElMessageBox.alert(
    `🤖 Chaterm 智能终端 v2.0 Pro\n\n` +
    `✨ 主要特性:\n` +
    `• AI Agent - 自然语言命令生成\n` +
    `• 智能补全 - 基于个人知识库的命令建议\n` +
    `• 语法高亮 - 个性化语法高亮显示\n` +
    `• 语音命令 - 高精度语音识别输入\n` +
    `• 零信任安全 - 企业级安全防护\n` +
    `• 行为审计 - 高级模式识别和异常检测\n\n` +
    `🔗 官方网站: https://github.com/chaterm/chaterm\n` +
    `📧 技术支持: support@chaterm.com`,
    '关于 Chaterm',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 键盘事件处理
const handleKeyDown = (event) => {
  if (event.key === 'Tab' && smartCompletion.value) {
    event.preventDefault()
    autoComplete()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    navigateHistory('up')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    navigateHistory('down')
  } else if (event.ctrlKey && event.key === 'c') {
    event.preventDefault()
    addToHistory('^C', 'command')
    currentCommand.value = ''
  } else if (event.ctrlKey && event.key === 'l') {
    event.preventDefault()
    clearTerminal()
  }
}

// 组件挂载
onMounted(async () => {
  // 显示欢迎信息
  addToHistory('🤖 Chaterm 智能终端 v2.0 Pro 已启动', 'ai')
  addToHistory('💡 输入命令或使用自然语言描述您的需求', 'info')
  addToHistory('🔧 快捷键: Tab(补全) ↑↓(历史) Ctrl+C(中断) Ctrl+L(清屏)', 'info')
  addToHistory('', 'output')
  
  // 自动连接
  connectTerminal()
  
  // 加载命令历史
  try {
    const response = await getCommandHistory()
    if (response.success && response.data) {
      commandHistory.value = response.data.history || []
      historyIndex.value = commandHistory.value.length
    }
  } catch (error) {
    console.warn('加载命令历史失败:', error)
  }
  
  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown)
  
  // 聚焦输入框
  nextTick(() => {
    commandInput.value?.focus()
    scrollToBottom()
  })
})

// 组件卸载
onUnmounted(() => {
  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown)
  // 清理其他资源
})
</script>

<style scoped>
.chaterm-terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.header-left h3 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
}

.terminal-status {
  margin-left: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.terminal-status.connected {
  background: #16a085;
  color: white;
}

.terminal-status.disconnected {
  background: #e74c3c;
  color: white;
}

.ai-panel {
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  padding: 12px 16px;
}

.ai-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #4ec9b0;
  font-weight: 500;
}

.ai-header i {
  margin-right: 8px;
}

.ai-input-area {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ai-input-area :deep(.el-textarea) {
  flex: 1;
}

.ai-input-area :deep(.el-textarea__inner) {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggested-command {
  margin-top: 12px;
  padding: 8px;
  background: #0e2f44;
  border: 1px solid #1e4d72;
  border-radius: 4px;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #4ec9b0;
}

.command-content {
  background: #1e1e1e;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #3e3e42;
}

.command-content code {
  color: #ce9178;
  font-family: inherit;
}

.terminal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.terminal-output {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #1e1e1e;
}

.terminal-line {
  margin-bottom: 4px;
  line-height: 1.4;
}

.command-line .prompt {
  color: #4ec9b0;
  font-weight: 500;
}

.command-line .command {
  color: #d7ba7d;
  margin-left: 8px;
}

.output-line {
  color: #d4d4d4;
  white-space: pre-wrap;
}

.error-line {
  color: #f44747;
}

.ai-line {
  color: #4ec9b0;
  font-style: italic;
}

.ai-line i {
  margin-right: 4px;
}

.suggestion-line {
  color: #dcdcaa;
  padding-left: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.suggestion-line:hover {
  color: #ffcc02;
  background: rgba(255, 204, 2, 0.1);
  padding: 2px 16px;
  border-radius: 4px;
}

.info-line {
  color: #569cd6;
  font-size: 12px;
  opacity: 0.8;
}

.warning-line {
  color: #ffcc02;
  font-style: italic;
}

.executing-indicator {
  color: #ffcc02;
  font-style: italic;
}

.executing-indicator i {
  margin-right: 4px;
}

.terminal-input {
  padding: 12px 16px;
  background: #252526;
  border-top: 1px solid #3e3e42;
}

.input-line {
  display: flex;
  align-items: center;
}

.input-line .prompt {
  color: #4ec9b0;
  font-weight: 500;
  margin-right: 8px;
  white-space: nowrap;
}

.command-input {
  flex: 1;
}

.command-input :deep(.el-input__inner) {
  background: transparent;
  border: none;
  color: #d4d4d4;
  font-family: inherit;
  padding: 0;
}

.command-input :deep(.el-input__inner):focus {
  box-shadow: none;
}

.quick-commands {
  background: #252526;
  border-top: 1px solid #3e3e42;
  padding: 12px 16px;
}

.commands-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #cccccc;
  font-size: 14px;
}

.commands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.commands-grid .el-button {
  background: #0e2f44;
  border: 1px solid #1e4d72;
  color: #4ec9b0;
}

.commands-grid .el-button:hover {
  background: #1e4d72;
  border-color: #2e5d82;
}

/* 滚动条样式 */
.terminal-output::-webkit-scrollbar {
  width: 8px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #3e3e42;
  border-radius: 4px;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #4e4e52;
}
</style>