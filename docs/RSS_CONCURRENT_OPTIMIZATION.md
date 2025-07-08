# RSS 并发处理优化说明

## 问题诊断

### 原始问题
从GitHub Actions日志分析发现：
- RSS收集在处理第21个源时被取消（`Error: The operation was canceled.`）
- GitHub Actions超时设置：30分钟
- 脚本超时设置：1800秒（30分钟）
- RSS源数量：145个活跃源
- 处理方式：串行处理，每个源最多重试3次

### 时间估算
- 145个RSS源 × 平均2秒 × 最多3次重试 ≈ 15-20分钟（理想情况）
- 实际情况：某些RSS源响应慢、网络问题、服务器限流
- 导致总时间超过30分钟限制

## 优化方案

### 1. 增加超时时间 ✅
```yaml
# .github/workflows/data-collection.yml
timeout-minutes: 60    # 从30分钟增加到60分钟
```

```bash
CMD="$CMD --timeout=3600"    # 从1800秒增加到3600秒（1小时）
```

### 2. 优化单源超时 ✅
```typescript
// scripts/collectDataToSupabase.ts
'rss': { 
  timeout: 8,    // 从15秒减少到8秒，提高整体效率
  // ...
}
```

### 3. 实现并发处理 ✅
```typescript
// 新的并发处理逻辑
const CONCURRENT_RSS_LIMIT = 8; // 同时处理8个RSS源
const chunks = [];

// 将RSS源分成多个批次
for (let i = 0; i < feedEntries.length; i += CONCURRENT_RSS_LIMIT) {
  chunks.push(feedEntries.slice(i, i + CONCURRENT_RSS_LIMIT));
}

// 逐批并发处理RSS源
for (const chunk of chunks) {
  const batchPromises = chunk.map(async ([feedName, feedInfo]) => {
    return await processSingleRSSFeed(/* ... */);
  });
  
  const batchResults = await Promise.allSettled(batchPromises);
  // 批次间短暂延迟，避免过载
  await new Promise(resolve => setTimeout(resolve, 200));
}
```

### 4. 减少重试次数 ✅
```typescript
// 从3次重试减少到2次重试
for (let attempt = 1; attempt <= 2; attempt++) {
  // ...
}
```

## 性能提升预期

### 原始性能
- 处理方式：串行
- 重试次数：3次
- 单源超时：15秒
- 预估时间：15-30分钟

### 优化后性能
- 处理方式：并发（8个源同时处理）
- 重试次数：2次
- 单源超时：8秒
- 预估时间：**3-8分钟**

### 时间计算
```
原始：145源 ÷ 1并发 × 8秒 × 2重试 = 2320秒 ≈ 39分钟
优化：145源 ÷ 8并发 × 8秒 × 2重试 = 290秒 ≈ 5分钟
```

**理论提升：8倍性能提升**

## 风险控制

### 1. 服务器保护
- 批次间延迟200ms，避免过载
- 限制并发数为8，避免过多连接

### 2. 错误处理
- 使用`Promise.allSettled`，单个源失败不影响整批
- 保持重试机制，确保临时网络问题能自恢复

### 3. 数据一致性
- 每个源独立处理和保存
- 避免并发访问共享的results数组

## 监控指标

### 执行日志示例
```
[RSS] 🚀 启用并发处理模式：145 个源分为 19 批，每批最多 8 个
[RSS] 📦 开始处理第 1/19 批 (8 个源)
[RSS] ✅ 第 1 批完成: 7 成功, 1 失败
[RSS] 📦 开始处理第 2/19 批 (8 个源)
...
```

### 性能指标
- 批次处理数量
- 每批成功/失败数量
- 总处理时间
- 平均每源处理时间

## 后续优化建议

### 1. 智能重试
- 根据错误类型决定是否重试
- 网络超时：重试
- 404错误：不重试

### 2. RSS源优先级
- 高质量源优先处理
- 失败源降低优先级

### 3. 缓存机制
- RSS内容缓存，避免重复请求
- 增量更新，只获取新内容

### 4. 动态并发数
- 根据系统负载动态调整并发数
- 监控响应时间，自动优化

## 验证方法

### 1. 本地测试
```bash
npx tsx scripts/collectDataToSupabase.ts \
  --sources=rss \
  --timeout=3600 \
  --verbose \
  --continue-on-error \
  --hours-back=12 \
  --max-results=10
```

### 2. GitHub Actions测试
- 手动触发工作流
- 监控执行时间
- 检查并发处理日志

### 3. 性能对比
- 记录优化前后的执行时间
- 对比成功率
- 监控错误类型和频率

---

**总结：通过超时优化和并发处理，预期将RSS收集时间从30+分钟降低到5-8分钟，解决GitHub Actions超时问题。** 