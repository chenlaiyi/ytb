/**
 * 自定义Toast实现
 * 完全重写Toast组件，避免Vant组件可能存在的问题
 */

// 创建一个兼容的Toast对象
const Toast = {
  // 当前活动的Toast元素
  activeToast: null,
  // 当前活动的对话框元素
  activeDialog: null,
  // 正在显示loading状态
  isLoading: false,
  
  // 创建DOM元素
  createToastElement(message, type = 'text') {
    // 移除所有现有toast
    this.clear();
    
    // 创建toast容器
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;
    
    // 设置内容
    let content = '';
    
    if (type === 'loading') {
      content = `
        <div class="custom-toast-icon">
          <svg viewBox="25 25 50 50" class="custom-loading-circular">
            <circle cx="50" cy="50" r="20" fill="none" class="custom-loading-path"></circle>
          </svg>
        </div>
      `;
    } else if (type === 'success') {
      content = `
        <div class="custom-toast-icon">
          <svg viewBox="0 0 1024 1024" class="custom-icon-success">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
          </svg>
        </div>
      `;
    } else if (type === 'fail') {
      content = `
        <div class="custom-toast-icon">
          <svg viewBox="0 0 1024 1024" class="custom-icon-fail">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-0.3L512 563.4l-99.3 118.4-66.1 0.3c-4.4 0-8-3.5-8-8 0-1.9 0.7-3.7 1.9-5.2l130.1-155L340.5 359c-1.2-1.5-1.9-3.3-1.9-5.2 0-4.4 3.6-8 8-8l66.1 0.3L512 464.6l99.3-118.4 66-0.3c4.4 0 8 3.5 8 8 0 1.9-0.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path>
          </svg>
        </div>
      `;
    }
    
    // 处理消息内容
    let messageStr = '';
    if (message !== null && message !== undefined) {
      // 确保消息是字符串类型
      if (typeof message === 'object') {
        try {
          // 如果是JSON对象，尝试格式化
          messageStr = JSON.stringify(message);
        } catch (e) {
          // 如果无法序列化，则使用对象的message属性或默认提示
          messageStr = message.message || message.msg || message.text || '系统提示';
        }
      } else {
        messageStr = String(message);
      }
      
      content += `<div class="custom-toast-message">${messageStr}</div>`;
    }
    
    toast.innerHTML = content;
    
    // 添加到body
    document.body.appendChild(toast);
    
    // 添加样式表（如果不存在）
    if (!document.getElementById('custom-toast-styles')) {
      this.addStylesheet();
    }
    
    return toast;
  },
  
  // 添加自定义样式
  addStylesheet() {
    // 检查样式是否已经存在
    const existingStyle = document.getElementById('custom-toast-styles');
    if (existingStyle) {
      // 如果已经存在，先移除它
      existingStyle.parentNode.removeChild(existingStyle);
    }
    
    const style = document.createElement('style');
    style.id = 'custom-toast-styles';
    style.textContent = `
      /* 移动设备适配样式 */
      @media screen and (max-width: 767px) {
        .custom-dialog {
          width: 85% !important;
          min-width: 280px;
          max-width: 320px;
        }
        
        .custom-dialog-header {
          padding: 16px 16px 10px;
          font-size: 16px;
        }
        
        .custom-dialog-content {
          padding: 10px 15px 15px;
          font-size: 14px;
        }
        
        .custom-dialog-footer {
          height: 44px;
        }
        
        .custom-dialog-cancel, .custom-dialog-confirm {
          height: 44px;
          line-height: 44px;
          font-size: 15px;
          padding: 0;
        }
      }
      
      .custom-toast {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        padding: 16px 20px;
        min-width: 120px;
        max-width: 80%;
        box-sizing: border-box;
        border-radius: 8px;
        background: rgba(50, 50, 50, 0.9);
        color: #FFFFFF;
        text-align: center;
        font-size: 14px;
        line-height: 1.4;
        word-break: break-all;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .custom-toast-icon {
        margin-bottom: 8px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .custom-toast-message {
        font-size: 14px;
        line-height: 1.4;
        color: #FFFFFF;
        text-align: center;
        margin: 0;
        padding: 0;
      }
      
      .custom-loading-circular {
        width: 100%;
        height: 100%;
        animation: custom-loading-rotate 2s linear infinite;
      }
      
      .custom-loading-path {
        stroke: #ffffff;
        stroke-width: 4;
        stroke-dasharray: 80, 160;
        stroke-dashoffset: 0;
        animation: custom-loading-dash 1.5s ease-in-out infinite;
      }
      
      .custom-icon-success, .custom-icon-fail {
        fill: #FFFFFF;
        width: 100%;
        height: 100%;
      }
      
      .custom-toast-loading {
        background: rgba(0, 0, 0, 0.8);
      }
      
      .custom-toast-success {
        background: rgba(40, 170, 80, 0.9);
      }
      
      .custom-toast-fail {
        background: rgba(240, 50, 50, 0.9);
      }
      
      .custom-dialog-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .custom-dialog-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 9998;
      }
      
      .custom-dialog {
        position: relative;
        width: 80%;
        max-width: 300px;
        background-color: #fff;
        border-radius: 12px;
        overflow: hidden;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      }
      
      .custom-dialog-header {
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        padding: 20px 16px 10px;
        color: #323233;
      }
      
      .custom-dialog-content {
        padding: 10px 15px 20px;
        font-size: 14px;
        line-height: 1.5;
        color: #646566;
        -webkit-overflow-scrolling: touch;
        overflow-x: hidden;
        text-align: center;
        word-break: break-word;
      }
      
      .custom-dialog-footer {
        display: flex;
        flex-direction: row;
        border-top: 1px solid #ebedf0;
        height: 44px;
        width: 100%;
      }
      
      .custom-dialog-footer-single {
        flex-direction: column;
      }
      
      .custom-dialog-cancel, .custom-dialog-confirm {
        flex: 1;
        height: 44px;
        border: 0;
        background-color: #fff;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        padding: 0;
        margin: 0;
        line-height: 44px;
        text-align: center;
        width: 50%;
        outline: none;
        overflow: hidden;
      }
      
      button.custom-dialog-cancel, button.custom-dialog-confirm {
        background-color: #fff;
        border-radius: 0;
      }
      
      button.custom-dialog-cancel:active, button.custom-dialog-confirm:active {
        background-color: #f2f3f5;
      }
      
      .custom-dialog-cancel {
        border-right: 1px solid #ebedf0;
      }
      
      /* 角色对话框特殊样式 */
      .role-dialog .custom-dialog-content {
        text-align: left !important;
        white-space: pre-line;
      }
      
      @keyframes custom-loading-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes custom-loading-dash {
        0% {
          stroke-dasharray: 1, 200;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 90, 150;
          stroke-dashoffset: -40;
        }
        100% {
          stroke-dasharray: 90, 150;
          stroke-dashoffset: -120;
        }
      }
    `;
    
    document.head.appendChild(style);
  },
  
  // 普通提示
  text(message, options = {}) {
    // 确保message处理
    if (typeof message === 'object' && message !== null) {
      if (message.message) {
        message = message.message;
      } else if (options && options.defaultText) {
        message = options.defaultText;
      } else {
        message = '系统提示';
      }
    }
    
    const duration = options.duration || 3000;
    const toast = this.createToastElement(message, 'text');
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeElement(toast);
      }, duration);
    }
    
    return {
      clear: () => this.removeElement(toast)
    };
  },
  
  // 普通显示 - 兼容旧代码的show方法
  show(message, options = {}) {
    return this.text(message, options);
  },
  
  // 成功提示
  success(message, options = {}) {
    // 确保message处理
    if (typeof message === 'object' && message !== null) {
      if (message.message) {
        message = message.message;
      } else if (options && options.defaultText) {
        message = options.defaultText;
      } else {
        message = '操作成功';
      }
    }
    
    const duration = options.duration || 3000;
    const toast = this.createToastElement(message, 'success');
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeElement(toast);
      }, duration);
    }
    
    return {
      clear: () => this.removeElement(toast)
    };
  },
  
  // 失败提示
  fail(message, options = {}) {
    // 确保message处理
    if (typeof message === 'object' && message !== null) {
      if (message.message) {
        message = message.message;
      } else if (options && options.defaultText) {
        message = options.defaultText;
      } else {
        message = '操作失败';
      }
    }
    
    const duration = options.duration || 3000;
    const toast = this.createToastElement(message, 'fail');
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeElement(toast);
      }, duration);
    }
    
    return {
      clear: () => this.removeElement(toast)
    };
  },
  
  // 加载提示
  loading(options) {
    let message = '';
    let duration = 0;
    
    if (typeof options === 'string') {
      message = options;
    } else if (options && typeof options === 'object') {
      message = options.message || '';
      duration = options.duration || 0;
    }
    
    const toast = this.createToastElement(message, 'loading');
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeElement(toast);
      }, duration);
    }
    
    return {
      clear: () => this.removeElement(toast)
    };
  },
  
  // 移除元素
  removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },
  
  // 清除所有提示
  clear() {
    const toasts = document.querySelectorAll('.custom-toast');
    toasts.forEach(toast => {
      this.removeElement(toast);
    });
  },
  
  // 对话框方法
  confirm(options) {
    return new Promise((resolve, reject) => {
      // 移除现有对话框
      this.closeDialog();
      
      // 确保样式表已添加
      if (!document.getElementById('custom-toast-styles')) {
        this.addStylesheet();
      } else {
        // 强制重新添加样式表，避免缓存清除后样式丢失
        this.addStylesheet();
      }
      
      // 创建对话框容器
      const dialog = document.createElement('div');
      dialog.className = 'custom-dialog-container';
      
      // 添加自定义类名
      if (options.className) {
        dialog.classList.add(options.className);
      }
      
      // 设置样式
      const messageAlign = options.messageAlign || 'center';
      const confirmButtonColor = options.confirmButtonColor || '#1989fa';
      const cancelButtonColor = options.cancelButtonColor || '#7d7e80';
      
      // 构建对话框HTML
      dialog.innerHTML = `
        <div class="custom-dialog-mask"></div>
        <div class="custom-dialog">
          ${options.title ? `<div class="custom-dialog-header">${options.title}</div>` : ''}
          <div class="custom-dialog-content" style="text-align: ${messageAlign};">
            ${options.message || ''}
          </div>
          <div class="custom-dialog-footer ${options.showCancelButton === false ? 'custom-dialog-footer-single' : ''}">
            ${options.showCancelButton !== false ? 
              `<button type="button" class="custom-dialog-cancel" style="color: ${cancelButtonColor};">${options.cancelButtonText || '取消'}</button>` : ''}
            <button type="button" class="custom-dialog-confirm" style="color: ${confirmButtonColor};">${options.confirmButtonText || '确定'}</button>
          </div>
        </div>
      `;
      
      // 添加到文档中
      document.body.appendChild(dialog);
      
      // 绑定点击事件
      const closeDialog = (result) => {
        document.body.removeChild(dialog);
        this.activeDialog = null;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Dialog canceled'));
        }
      };
      
      // 点击蒙层关闭
      if (options.closeOnClickOverlay !== false) {
        dialog.querySelector('.custom-dialog-mask').addEventListener('click', () => {
          closeDialog(false);
        });
      }
      
      // 取消按钮
      if (options.showCancelButton !== false) {
        dialog.querySelector('.custom-dialog-cancel').addEventListener('click', () => {
          closeDialog(false);
        });
      }
      
      // 确认按钮
      dialog.querySelector('.custom-dialog-confirm').addEventListener('click', () => {
        closeDialog(true);
      });
      
      // 存储当前对话框引用
      this.activeDialog = dialog;
    });
  },
  
  // 提示弹窗
  alert(message, options = {}) {
    // 支持字符串参数，转换为对象
    if (typeof message === 'string') {
      options = { message, ...options };
    } else if (typeof message === 'object') {
      options = { ...message, ...options };
    }
    
    // 确保有消息内容
    if (!options.message && typeof message === 'object' && message !== null) {
      if (message.message) {
        options.message = message.message;
      } else if (message.msg) {
        options.message = message.msg;
      } else if (message.text) {
        options.message = message.text;
      }
    }
    
    return this.confirm({
      title: options.title || '提示',
      message: options.message || '系统提示',
      confirmButtonText: options.confirmButtonText || '确定',
      confirmButtonColor: options.confirmButtonColor || '#1989fa',
      messageAlign: options.messageAlign || 'center',
      className: options.className || '',
      showCancelButton: false,
      closeOnClickOverlay: options.closeOnClickOverlay !== false
    });
  },
  
  // 关闭当前对话框
  closeDialog() {
    if (this.activeDialog && document.body.contains(this.activeDialog)) {
      document.body.removeChild(this.activeDialog);
      this.activeDialog = null;
    }
  }
};

// 直接添加到window对象上，确保在任何地方都能访问
window.Toast = Toast;

export default Toast; 