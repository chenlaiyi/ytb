# 认证问题诊断和修复工具

本目录包含了用于诊断和修复管理后台认证问题的工具。

## 工具列表

### 1. token-helper.js
提供基础的token验证和管理功能。

**主要函数：**
- `checkTokenValidity()` - 检查token是否有效
- `diagnoseAuthStatus()` - 诊断认证状态
- `clearTokenAndRedirect()` - 清除token并跳转登录页
- `refreshToken()` - 刷新token

### 2. auth-test.js
提供认证系统的测试功能，可在浏览器控制台中使用。

**使用方法：**
```javascript
// 在浏览器控制台中运行
authTest.runAllTests()  // 运行所有测试
authTest.testTokenValidity()  // 测试token有效性
authTest.testSalesmenAPI()  // 测试业务员API
```

### 3. token-fix.js
提供常见认证问题的自动修复功能。

**使用方法：**
```javascript
// 在浏览器控制台中运行
tokenFix.autoFixCommonIssues()  // 自动修复常见问题
tokenFix.forceRelogin()  // 强制重新登录
```

## 问题排查步骤

### 遇到"无效的令牌或已过期"错误时：

1. **打开浏览器控制台** (F12)

2. **运行诊断测试：**
   ```javascript
   authTest.runAllTests()
   ```

3. **查看诊断结果，如果发现问题，运行自动修复：**
   ```javascript
   tokenFix.autoFixCommonIssues()
   ```

4. **如果自动修复无效，强制重新登录：**
   ```javascript
   tokenFix.forceRelogin()
   ```

### 使用图形界面诊断工具：

访问管理后台的Token诊断页面：
`/admin/#/debug/token-diagnostic`

该页面提供可视化的诊断界面，包括：
- 认证状态检查
- Token详情显示
- API测试功能
- 一键修复按钮

## 常见问题和解决方案

### 1. Token格式错误
**症状：** API调用返回401错误
**解决：** `tokenFix.fixTokenFormat()`

### 2. 损坏的认证数据
**症状：** 页面加载异常，控制台有JSON解析错误
**解决：** `tokenFix.cleanupCorruptedAuth()`

### 3. Axios配置问题
**症状：** 请求头缺少Authorization
**解决：** `tokenFix.fixAxiosConfig()`

### 4. API路径问题
**症状：** 404错误，找不到API端点
**解决：** `tokenFix.fixAPIBasePath()`

## 开发者注意事项

1. 这些工具主要用于调试和问题排查，不应在生产代码中依赖
2. 所有工具函数都会在控制台输出详细日志
3. 修复工具会自动备份重要数据（如有必要）
4. 强制重新登录会清除所有本地认证数据

## 更新日志

- v1.0.0 - 初始版本，包含基础诊断和修复功能
- v1.1.0 - 添加图形界面诊断工具
- v1.2.0 - 增强API路径检测和修复功能 