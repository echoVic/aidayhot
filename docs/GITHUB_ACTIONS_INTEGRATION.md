# GitHub Actions 数据收集集成指南

## 概述

本项目已完全集成 GitHub Actions 自动化数据收集功能，支持定时和手动触发两种模式。

## 功能特性

### ✅ 已完成功能
- **定时收集**: 每天早上8点和晚上8点(北京时间)自动运行
- **手动触发**: 支持手动指定数据源和参数
- **多数据源**: 支持 ArXiv、GitHub、RSS、Papers with Code、Stack Overflow
- **智能配置**: 自动根据数据源特性优化收集参数
- **并发收集**: 支持多个数据源同时收集
- **错误处理**: 遇到错误时可继续执行其他源
- **详细报告**: 生成执行统计和结果验证
- **TypeScript 支持**: 完整的类型安全和编译验证

### 📊 支持的数据源
1. **ArXiv** - AI/ML 相关论文 (5篇/次)
2. **GitHub** - 热门 AI 项目 (前10个趋势项目)
3. **RSS** - AI 新闻源 (5篇/次)
4. **Papers with Code** - 论文和代码 (5篇/次)
5. **Stack Overflow** - AI 相关问答 (5篇/次)

## 使用方法

### 1. 环境变量配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中设置：

```
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
GH_TOKEN=你的GitHub Personal Access Token
```

### 2. 手动触发收集

1. 进入 GitHub 仓库的 Actions 标签
2. 选择 "AI 日报数据收集" 工作流
3. 点击 "Run workflow"
4. 配置参数：
   - **指定源**: 选择要收集的数据源
   - **智能配置**: 是否使用预设的最优参数
   - **统一结果数**: 关闭智能配置时的统一结果数量
   - **继续执行**: 遇到错误时是否继续执行其他源

### 3. 查看执行结果

执行完成后可以查看：
- **Actions 日志**: 详细的执行过程和调试信息
- **执行报告**: 包含收集统计和状态总结
- **数据验证**: 自动检查最近1小时收集到的数据

## 配置选项详解

### 数据源选择
- `all` - 收集所有数据源
- `arxiv` - 仅收集 ArXiv 论文
- `github` - 仅收集 GitHub 项目
- `rss` - 仅收集 RSS 新闻
- `papers-with-code` - 仅收集论文代码
- `stackoverflow` - 仅收集 Stack Overflow 问答
- `arxiv,github` - 收集多个指定源(用逗号分隔)

### 智能配置系统
启用后自动使用以下优化参数：
```javascript
const sourceConfigs = {
  arxiv: { maxResults: 5, timeout: 30000 },
  github: { maxResults: 10, timeout: 60000 },
  rss: { maxResults: 5, timeout: 30000 },
  'papers-with-code': { maxResults: 5, timeout: 45000 },
  stackoverflow: { maxResults: 5, timeout: 30000 }
};
```

## 定时任务说明

### 执行时间表
- **早上 8:00** (北京时间) - UTC 0:00
- **晚上 8:00** (北京时间) - UTC 12:00

### 修改定时任务
编辑 `.github/workflows/data-collection.yml` 中的 `cron` 表达式：
```yaml
schedule:
  - cron: '0 0 * * *'    # 早上8点北京时间
  - cron: '0 12 * * *'   # 晚上8点北京时间
```

## 故障排除

### 常见问题

1. **环境变量未设置**
   - 检查 GitHub Secrets 是否正确配置
   - 验证 Supabase 项目 URL 和密钥

2. **编译失败**
   - 检查 TypeScript 代码语法
   - 确保所有依赖项已正确安装

3. **数据收集失败**
   - 查看 Actions 日志中的详细错误信息
   - 检查 Supabase 数据库连接状态
   - 验证各数据源 API 的可用性

4. **数据库写入失败**
   - 确认数据库表结构与代码匹配
   - 检查字段长度限制
   - 验证数据类型兼容性

### 调试模式
手动触发时启用 `--verbose` 参数可查看详细日志：
- API 请求和响应
- 数据转换过程
- 数据库操作详情
- 错误堆栈信息

## 数据库表结构

使用 `database/schema-simple.sql` 中定义的表结构：
```sql
CREATE TABLE articles (
  id VARCHAR(100) PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  author TEXT,
  source_url TEXT,
  source_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(100),
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 监控和报告

### 执行报告内容
- 执行时间和触发方式
- 配置参数详情
- 各数据源收集统计
- 成功/失败状态
- 数据库验证结果

### 成功指标
- ✅ 所有数据源正常执行
- ✅ 数据成功保存到 Supabase
- ✅ 无重复数据插入
- ✅ 字段长度自动处理
- ✅ 执行时间在预期范围内

## 下一步改进

### 计划功能
- [ ] 邮件/Slack 通知集成
- [ ] 数据质量监控
- [ ] 收集频率自适应调整
- [ ] 数据源健康状态检查
- [ ] 历史数据统计分析

### 性能优化
- [ ] 缓存机制优化
- [ ] 并发数量动态调整
- [ ] 失败重试机制
- [ ] 增量更新支持

---

🚀 **系统已完全就绪，可投入生产使用！**

如需技术支持或功能建议，请创建 GitHub Issue。 