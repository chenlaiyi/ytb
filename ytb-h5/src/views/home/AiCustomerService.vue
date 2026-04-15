<template>
  <div class="ai-customer-service">
    <!-- 顶部标题栏 -->
    <div class="header">
      <h1 class="title">AI智能客服</h1>
      <p class="subtitle">智能助手为您解答问题</p>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-container" ref="chatContainer">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="ai-avatar">
          <van-icon name="service-o" size="24" />
        </div>
        <div class="welcome-content">
          <h3>{{ config.welcome_message || '您好！我是您的AI智能客服助手' }}</h3>
          <p>{{ config.description || '我可以帮助您解答各种问题，请随时向我提问。' }}</p>
        </div>
        
        <!-- 快捷问题 -->
        <div v-if="config.quick_replies && config.quick_replies.length > 0" class="quick-replies">
          <h4>常见问题：</h4>
          <div class="quick-reply-list">
            <van-tag 
              v-for="(reply, index) in config.quick_replies" 
              :key="index"
              class="quick-reply-item"
              @click="() => sendQuickReply(reply)"
            >
              {{ reply }}
            </van-tag>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.role]"
        >
          <div class="message-content">
            <div class="avatar">
              <van-icon 
                :name="message.role === 'user' ? 'user-circle-o' : 'service-o'" 
                size="20" 
              />
            </div>
            <div class="text">
              <!-- 思考中状态 -->
              <div v-if="message.isThinking" class="thinking-indicator">
                <span class="thinking-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </span>
                <span class="thinking-text">AI正在思考中...</span>
              </div>
              <!-- 正常消息内容 -->
              <div v-else v-html="sanitize(formatMessage(message.content))"></div>
              <!-- 打字光标效果 -->
              <span v-if="message.isTyping && message.content" class="typing-cursor">|</span>
              <div class="time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <van-field
        v-model="inputMessage"
        placeholder="请输入您的问题..."
        rows="1"
        autosize
        type="textarea"
        class="message-input"
        @keyup.enter.prevent="sendMessage"
      />
      <van-button 
        type="primary" 
        class="send-button"
        :disabled="!inputMessage.trim() || sending"
        @click.prevent="sendMessage"
      >
        发送
      </van-button>
    </div>
    
    <!-- 底部功能按钮 -->
    <div class="footer-actions">
      <van-button 
        size="small" 
        class="action-btn"
        @click.prevent="handleClearHistory"
      >
        清除历史
      </van-button>
      <van-button 
        size="small" 
        class="action-btn"
        @click.prevent="handleEndSession"
      >
        结束会话
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Toast } from 'vant'
import { sendAiMessage, createAiSession, getAiConfig, clearAiHistory, endAiSession } from '@/api/aiService'
import { getUserInfo } from '@/utils/auth'
import sanitize from '@/utils/sanitize'

// 响应式数据
const chatContainer = ref(null)
const inputMessage = ref('')
const sending = ref(false)
const sessionId = ref('')
const messages = ref([])
const config = reactive({
  welcome_message: '您好！我是您的AI智能客服助手',
  description: '我可以帮助您解答各种问题，请随时向我提问。',
  quick_replies: []
})

// 格式化消息内容
const formatMessage = (content) => {
  // 简单的换行处理
  return content.replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 发送快捷回复
const sendQuickReply = (reply) => {
  inputMessage.value = reply
  sendMessage().catch(error => {
    console.error('快捷回复失败:', error)
  })
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || sending.value) return

  try {
    // 添加用户消息到列表
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)
    
    // 清空输入框
    inputMessage.value = ''
    
    // 添加思考中的提示消息
    const thinkingMessage = {
      role: 'ai',
      content: '',
      timestamp: Date.now(),
      isThinking: true,
      isTyping: false
    }
    messages.value.push(thinkingMessage)
    
    // 滚动到底部
    scrollToBottom()
    
    // 设置发送状态
    sending.value = true
    
    // 获取用户信息
    const userInfo = getUserInfo()
    const userId = userInfo?.id || userInfo?.userId
    
    // 如果没有会话ID，先创建会话
    if (!sessionId.value) {
      const sessionRes = await createAiSession({ user_id: userId })
      if (sessionRes.code === 0) {
        sessionId.value = sessionRes.data.session_id
      } else {
        throw new Error('创建会话失败')
      }
    }
    
    // 发送消息到AI
    const res = await sendAiMessage({
      message: message,
      session_id: sessionId.value,
      user_id: userId
    })
    
    if (res.code === 0) {
      // 移除思考中的消息
      const thinkingIndex = messages.value.findIndex(msg => msg.isThinking)
      if (thinkingIndex !== -1) {
        messages.value.splice(thinkingIndex, 1)
      }
      
      const replyContent = res.data.reply || res.data.response
      console.log('AI回复内容:', replyContent)
      
      if (replyContent && replyContent.trim()) {
        // 直接添加AI回复消息（暂时不使用逐字显示）
        const aiMessage = {
          role: 'ai',
          content: replyContent,
          timestamp: Date.now()
        }
        messages.value.push(aiMessage)
        scrollToBottom()
      } else {
        // 如果没有回复内容，显示默认消息
        const aiMessage = {
          role: 'ai',
          content: '抱歉，我暂时无法回答您的问题，请稍后重试。',
          timestamp: Date.now()
        }
        messages.value.push(aiMessage)
      }
    } else {
      throw new Error(res.message || '发送消息失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    })
    Toast.fail(error.message || '发送消息失败，请重试')
    
    // 移除思考中的消息
    const thinkingIndex = messages.value.findIndex(msg => msg.isThinking)
    if (thinkingIndex !== -1) {
      messages.value.splice(thinkingIndex, 1)
    }
    
    // 添加错误消息
    const errorMessage = {
      role: 'ai',
      content: `抱歉，我暂时无法回答您的问题，请稍后重试。错误信息：${error.message}`,
      timestamp: Date.now()
    }
    messages.value.push(errorMessage)
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// 逐字显示效果
const typewriterEffect = async (message) => {
  try {
    const fullText = message.fullContent || ''
    const delay = 30 // 每个字符的延迟时间（毫秒）
    
    for (let i = 0; i <= fullText.length; i++) {
      message.content = fullText.substring(0, i)
      scrollToBottom()
      
      if (i < fullText.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 完成打字效果
    message.isTyping = false
    delete message.fullContent
  } catch (error) {
    console.error('打字效果出错:', error)
    // 如果打字效果出错，直接显示完整内容
    message.content = message.fullContent || '回答出现错误'
    message.isTyping = false
    delete message.fullContent
  }
}

// 获取配置信息
const loadConfig = async () => {
  try {
    const res = await getAiConfig()
    if (res.code === 0) {
      Object.assign(config, res.data)
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

// 清除历史记录
const clearHistory = async () => {
  if (!sessionId.value) {
    messages.value = []
    return
  }
  
  try {
    const res = await clearAiHistory(sessionId.value)
    if (res.code === 0) {
      messages.value = []
      Toast.success('历史记录已清除')
    } else {
      throw new Error(res.message || '清除历史记录失败')
    }
  } catch (error) {
    console.error('清除历史记录失败:', error)
    Toast.fail(error.message || '清除历史记录失败')
  }
}

// 结束会话
const endSession = async () => {
  if (!sessionId.value) {
    messages.value = []
    return
  }
  
  try {
    const res = await endAiSession(sessionId.value)
    if (res.code === 0) {
      messages.value = []
      sessionId.value = ''
      Toast.success('会话已结束')
      
      // 重新创建会话
      const userInfo = getUserInfo()
      const userId = userInfo?.id || userInfo?.userId
      const sessionRes = await createAiSession({ user_id: userId })
      if (sessionRes.code === 0) {
        sessionId.value = sessionRes.data.session_id
      }
    } else {
      throw new Error(res.message || '结束会话失败')
    }
  } catch (error) {
    console.error('结束会话失败:', error)
    Toast.fail(error.message || '结束会话失败')
  }
}

// 处理清除历史记录按钮点击
const handleClearHistory = () => {
  clearHistory().catch(error => {
    console.error('处理清除历史失败:', error)
  })
}

// 处理结束会话按钮点击
const handleEndSession = () => {
  endSession().catch(error => {
    console.error('处理结束会话失败:', error)
  })
}

// 初始化
onMounted(async () => {
  // 获取配置
  await loadConfig()
  
  // 创建会话
  try {
    const userInfo = getUserInfo()
    const userId = userInfo?.id || userInfo?.userId
    const res = await createAiSession({ user_id: userId })
    if (res.code === 0) {
      sessionId.value = res.data.session_id
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
  
  // 滚动到底部
  scrollToBottom()
})
</script>

<style scoped>
.ai-customer-service {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  padding: 20px 16px;
  background: linear-gradient(135deg, #1989fa 0%, #07c160 100%);
  color: #fff;
  text-align: center;
  position: relative;
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-message {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.ai-avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1989fa 0%, #07c160 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto 20px;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(25, 137, 250, 0.5);
  }
  100% {
    box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3);
  }
}

.welcome-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px;
  text-align: center;
  line-height: 1.4;
}

.welcome-content p {
  font-size: 15px;
  color: #6c757d;
  margin: 0 0 20px;
  text-align: center;
  line-height: 1.5;
}

.quick-replies h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  text-align: center;
  position: relative;
}

.quick-replies h4::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #1989fa, #07c160);
  border-radius: 1px;
}

.quick-reply-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.quick-reply-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.quick-reply-item:hover {
  background-color: #1989fa;
  color: #fff;
  border-color: #1989fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(25, 137, 250, 0.2);
}

.quick-reply-item:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(25, 137, 250, 0.15);
}

.messages {
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 16px;
}

.message.user {
  align-self: flex-end;
}

.message.ai {
  align-self: flex-start;
}

.message-content {
  display: flex;
  align-items: flex-start;
}

.message.user .message-content {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  background-color: #1989fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 8px;
}

.message.user .avatar {
  background-color: #07c160;
}

.text {
  max-width: 70%;
}

.message.user .text {
  text-align: right;
}

.content {
  background-color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.user .content {
  background-color: #1989fa;
  color: #fff;
}

.message.ai .content {
  border-top-left-radius: 0;
}

.message.user .content {
  border-top-right-radius: 0;
}

.time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message.user .time {
  text-align: right;
}

.message.ai .message-content {
  background: #f5f5f5;
  color: #333;
}

.message .text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.message .time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-style: italic;
}

.thinking-dots {
  display: inline-flex;
  gap: 2px;
}

.thinking-dots .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #666;
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking-dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #007aff;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.input-container {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.message-input {
  flex: 1;
  margin-right: 8px;
}

.send-button {
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  gap: 16px;
}

.action-btn {
  flex: 1;
  max-width: 120px;
}
</style>
