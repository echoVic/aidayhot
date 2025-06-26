# RSS源管理指南

本指南介绍如何使用aidayhot项目中的RSS源管理功能，包括从OPML文件导入、验证RSS源、数据收集等。

## 功能概览

1. **OPML文件解析与验证** - 从OPML文件批量导入RSS源并验证可用性
2. **RSS源数据库管理** - 统一管理所有RSS源信息
3. **增强数据收集** - 支持来源标识的RSS数据收集
4. **默认列表模式** - 优化用户体验，默认使用列表视图

## 数据库结构

### feed_sources表
```sql
- id: RSS源ID
- name: RSS源名称
- url: RSS源URL
- category: 分类
- is_active: 是否启用
- last_crawled: 最后爬取时间
- item_count: 条目数量
- error_count: 错误次数
- last_error: 最后错误信息
```

### articles表新增字段
```sql
- source_name: 来源名称
- source_category: 来源分类
```

## 使用方法

### 1. 环境变量设置

首先需要设置Supabase环境变量。创建`.env.local`文件（如果还没有）：

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

在`.env.local`中添加：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**获取这些值的方法：**
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 在左侧菜单选择 "Settings" -> "API"
4. 复制 "URL" 和 "service_role" 密钥

### 2. 数据库初始化

设置环境变量后，执行数据库初始化：

```bash
# 方式1: 使用TypeScript脚本（推荐）
npm run db-setup

# 方式2: 手动在Supabase Dashboard中执行
# 如果自动脚本失败，请在Supabase SQL Editor中手动执行database/schema-feed-sources.sql文件
```

**自动脚本的功能：**
- 检查Supabase连接
- 尝试创建`feed_sources`表
- 为`articles`表添加`source_name`和`source_category`列
- 插入一些默认的RSS源
- 如果失败，显示手动操作指南

### 2. 从OPML文件导入RSS源

将OPML文件放在项目根目录，然后运行：

```bash
# 解析并验证OPML文件中的RSS源
npm run parse-opml

# 或者指定文件路径
npm run parse-opml path/to/your/file.opml
```

这个脚本会：
- 解析OPML文件中的所有RSS源
- 验证每个源的可用性
- 自动分类RSS源
- 将有效源保存到数据库
- 生成验证报告

### 3. 收集RSS数据

```bash
# 从数据库中的所有活跃RSS源收集数据
npm run collect-rss
```

这个脚本会：
- 从feed_sources表获取所有活跃的RSS源
- 爬取每个源的最新内容
- 转换为标准文章格式
- 包含来源信息（source_name, source_category）
- 去重并保存到articles表
- 生成收集报告

## 配置说明

### 环境变量

确保设置了以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### RSS源分类

系统会根据RSS源名称自动分类：

- **AI/机器学习**: 包含"ai"、"人工智能"、"机器学习"关键词
- **技术/开发**: 包含"tech"、"技术"、"开发"关键词  
- **新闻/资讯**: 包含"news"、"新闻"、"资讯"关键词
- **博客**: 包含"blog"、"博客"关键词
- **学术/研究**: 包含"research"、"研究"、"论文"关键词
- **其他**: 不符合以上分类的源

## 用户界面更新

### 默认列表模式

现在主页默认使用列表模式显示文章，用户可以手动切换到网格模式。

### 来源标识

文章卡片现在会显示来源信息：
- 列表模式：在元信息区域显示蓝色来源标签
- 网格模式：在文章内容区域显示灰色来源标签

## 报告和监控

### 验证报告

RSS源验证完成后会生成详细报告：

```json
{
  "summary": {
    "total": 100,
    "successful": 85,
    "failed": 10,
    "timeout": 5
  },
  "details": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 收集报告

数据收集完成后会生成统计报告：

```json
{
  "summary": {
    "successCount": 80,
    "failedCount": 5,
    "newArticles": 150,
    "duplicateArticles": 20
  },
  "sourceStats": {
    "OpenAI Blog": 5,
    "TechCrunch": 12,
    ...
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 最佳实践

### 1. RSS源管理

- 定期检查RSS源的有效性
- 移除长期无响应的源
- 根据内容质量调整源的优先级

### 2. 数据收集

- 设置合理的爬取频率（建议每小时一次）
- 监控错误日志，及时处理问题源
- 定期清理重复和低质量内容

### 3. 性能优化

- 使用批量处理避免过多并发请求
- 设置合理的超时时间
- 缓存频繁访问的数据

## 故障排除

### 常见问题

1. **OPML解析失败**
   - 检查文件格式是否正确
   - 确认文件编码为UTF-8

2. **RSS源验证超时**
   - 增加超时时间设置
   - 检查网络连接

3. **数据库连接错误**
   - 确认环境变量设置正确
   - 检查数据库权限

4. **重复文章问题**
   - 系统会自动根据source_url去重
   - 如需重新导入，先清理相关记录

### 调试模式

在脚本中添加详细日志：

```typescript
// 启用详细日志
console.log('Debug info:', { url, sourceInfo, result });
```

## 扩展功能

### 自定义分类规则

可以在`parseOpmlAndVerifyFeeds.ts`中修改分类逻辑：

```typescript
private categorizeFeed(title: string): string {
  // 添加自定义分类规则
  if (title.includes('your_keyword')) {
    return '自定义分类';
  }
  // ... 现有逻辑
}
```

### 添加新的RSS源

可以通过数据库直接添加：

```sql
INSERT INTO feed_sources (name, url, category, is_active) 
VALUES ('新RSS源', 'https://example.com/rss.xml', 'AI/机器学习', true);
```

或使用脚本批量添加：

```typescript
const newSources = [
  { name: '源1', url: 'url1', category: '分类1' },
  { name: '源2', url: 'url2', category: '分类2' }
];

await supabase.from('feed_sources').insert(newSources);
```

## 总结

通过这套RSS源管理系统，您可以：
- 轻松管理大量RSS源
- 自动验证源的可用性
- 收集高质量的内容
- 为用户提供清晰的来源标识
- 获得详细的统计报告

这大大提升了内容聚合的效率和质量。 