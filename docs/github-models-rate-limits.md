# GitHub Models API 速率限制说明

## 问题描述

GitHub Models API 对每个用户实施严格的速率限制：
- **每分钟最多 10 次 API 调用**
- 超出限制时返回 429 错误码
- 需要等待指定时间后才能重试

## 错误示例

```
Error: GitHub Models API错误 (429): {
  "error": {
    "code": "RateLimitReached",
    "message": "Rate limit of 10 per 60s exceeded for UserByModelByMinute. Please wait 46 seconds before retrying.",
    "details": "Rate limit of 10 per 60s exceeded for UserByModelByMinute. Please wait 46 seconds before retrying."
  }
}
```

## 解决方案

### 1. 智能重试机制

我们的系统现在包含以下优化：

- **自动解析等待时间**：从错误消息中提取具体的等待秒数
- **智能重试**：遇到 429 错误时自动等待指定时间后重试
- **额外缓冲**：在建议等待时间基础上增加 5 秒缓冲

### 2. 并发控制优化

- **降低并发数**：从 3 个并发请求降至 2 个
- **增加批次延迟**：批次间等待时间从 1 秒增至 15 秒
- **速率控制**：确保每分钟 API 调用不超过 4-5 次

### 3. 代码实现

```typescript
// 特殊处理速率限制错误
if (response.status === 429) {
  const errorData = JSON.parse(errorText);
  const retryAfter = this.extractRetryAfter(errorData);
  
  if (attempt < maxRetries) {
    console.log(`⏳ 遇到速率限制，等待 ${retryAfter} 秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    continue;
  }
}

// 智能解析等待时间
private extractRetryAfter(errorData: any): number {
  try {
    if (errorData.error && errorData.error.message) {
      const message = errorData.error.message;
      const match = message.match(/wait (\d+) seconds/);
      if (match) {
        return parseInt(match[1], 10) + 5; // 额外增加5秒缓冲
      }
    }
  } catch (e) {
    console.warn('无法解析重试等待时间，使用默认值');
  }
  return 60; // 默认等待60秒
}
```

## 最佳实践

### 1. 开发环境
- 使用较少的测试数据
- 避免频繁运行完整测试
- 考虑使用模拟数据进行开发

### 2. 生产环境
- 系统会自动处理速率限制
- 日报生成可能需要更长时间
- 监控日志中的速率限制警告

### 3. 监控建议
- 关注 429 错误的频率
- 监控 API 调用的时间分布
- 根据需要调整并发参数

## 常见问题

### Q: 为什么会出现 429 错误？
A: GitHub Models API 限制每分钟最多 10 次调用，当系统处理大量文章时容易超出限制。

### Q: 系统如何处理速率限制？
A: 系统会自动检测 429 错误，解析等待时间，并在等待后自动重试。

### Q: 如何减少速率限制的影响？
A: 系统已经优化了并发控制和重试机制，用户无需手动干预。

### Q: 日报生成需要多长时间？
A: 根据文章数量，可能需要几分钟到十几分钟不等，系统会自动处理所有重试。

## 更新日志

- **2024-01-XX**: 添加智能速率限制处理
- **2024-01-XX**: 优化并发控制参数
- **2024-01-XX**: 完善错误处理和重试机制