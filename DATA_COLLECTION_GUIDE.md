# 数据采集指南

## 概述

本指南介绍如何使用真实的爬虫数据来填充 AI Day Hot 网站的数据库。与原来的模拟数据迁移不同，这里我们使用真实的爬虫来获取最新的 AI 相关内容。

## 环境配置

在开始之前，请确保正确配置环境变量：

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件，添加以下内容：

```bash
# Supabase 配置（必须）
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥

# GitHub Token（可选，但推荐）
GITHUB_TOKEN=你的GitHub个人访问令牌
```

### 2. 环境变量说明

- **NEXT_PUBLIC_SUPABASE_URL**: 你的 Supabase 项目 URL
- **SUPABASE_SERVICE_ROLE_KEY**: 服务角色密钥（具有完整数据库权限）
- **GITHUB_TOKEN**: GitHub 个人访问令牌（可选，但可以提高 API 请求限制）

## 数据源

我们的数据采集系统支持以下数据源：

### 📖 ArXiv 论文
- **来源**: arXiv.org API
- **内容**: AI、机器学习、自然语言处理、计算机视觉等领域的最新论文
- **分类**: 人工智能、机器学习、自然语言处理、计算机视觉、神经网络
- **更新频率**: 建议每日运行

### 🔗 GitHub 仓库
- **来源**: GitHub API
- **内容**: 热门的 AI 相关开源项目
- **筛选条件**: 按星标数排序的机器学习、深度学习等项目
- **分类**: GitHub仓库
- **更新频率**: 建议每周运行

### 📰 RSS 订阅源
- **来源**: 多个 AI 技术博客的 RSS 订阅
- **内容**: Google AI Blog、OpenAI Blog、Towards Data Science 等
- **分类**: AI博客、技术新闻
- **更新频率**: 建议每日运行

## 使用方法

### 1. 测试数据采集功能

在正式运行之前，建议先测试数据采集功能：

```bash
# 测试所有数据采集功能（小量数据）
pnpm collect:test
```

这个命令会：
- 初始化数据库分类
- 测试 ArXiv 论文采集（3篇论文）
- 测试 RSS 订阅源采集（1篇文章）
- 测试 GitHub 仓库采集（1个仓库）

### 2. 完整数据采集

测试成功后，运行完整的数据采集：

```bash
# 完整的数据采集（所有数据源）
pnpm collect
```

### 3. 分别采集不同数据源

你也可以只采集特定类型的数据：

```bash
# 只采集 ArXiv 论文
pnpm collect:arxiv

# 只采集 GitHub 仓库
pnpm collect:github

# 只采集 RSS 文章
pnpm collect:rss
```

### 4. 传统模拟数据迁移（已弃用）

如果你仍想使用模拟数据：

```bash
# 迁移模拟数据到 Supabase
pnpm migrate
```

## 数据采集详情

### ArXiv 论文采集
- **每个分类采集**: 20篇最新论文
- **包含分类**: AI、机器学习、NLP、计算机视觉、神经网络
- **数据字段**: 标题、摘要、作者、发布时间、原文链接、PDF链接、分类标签
- **请求间隔**: 2秒（避免API限制）

### GitHub 仓库采集
- **搜索条件**: 
  - `machine learning stars:>1000` (10个仓库)
  - `deep learning stars:>500` (10个仓库)
  - `natural language processing stars:>300` (10个仓库)
  - `computer vision stars:>300` (10个仓库)
  - `artificial intelligence stars:>500` (10个仓库)
- **数据字段**: 仓库名、描述、作者、星标数、编程语言、话题标签
- **请求间隔**: 3秒（避免API限制）

### RSS 订阅源采集
- **订阅源**: Google AI Blog、OpenAI Blog、Microsoft Research、Towards Data Science 等
- **每个源采集**: 10篇最新文章
- **数据字段**: 标题、内容摘要、作者、发布时间、原文链接
- **请求间隔**: 1秒

## 数据结构

采集的数据会存储到 Supabase 的 `articles` 表中，包含以下字段：

```sql
- id (自增主键)
- title (标题)
- summary (摘要)
- category (分类)
- author (作者)
- publish_time (发布时间)
- read_time (阅读时间，分钟)
- views (浏览量)
- likes (点赞数)
- tags (标签数组)
- image_url (封面图片)
- is_hot (是否热门)
- is_new (是否新文章)
- source_url (原文链接)
- source_type (数据源类型: arxiv/github/rss)
- content_id (内容唯一标识)
- metadata (元数据 JSON)
- created_at (创建时间)
- updated_at (更新时间)
```

## 常见问题

### Q: 为什么 GitHub 采集失败？
A: 可能是 API 限制问题。建议：
1. 配置 `GITHUB_TOKEN` 环境变量
2. 检查网络连接
3. 等待一段时间后重试

### Q: ArXiv 采集很慢怎么办？
A: ArXiv API 有请求限制，建议：
1. 减少采集数量
2. 增加请求间隔
3. 分时段运行

### Q: RSS 订阅源无法访问？
A: 某些 RSS 源可能有访问限制，建议：
1. 检查网络连接
2. 使用 VPN（如果需要）
3. 跳过失败的源，继续其他源

### Q: 如何清理旧数据？
A: 在数据采集脚本中有清理函数，可以取消注释：
```javascript
// 清理30天前的数据
await cleanOldData(30);
```

## 自动化运行

### 使用 Cron Job（Linux/macOS）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨2点运行）
0 2 * * * cd /path/to/your/project && pnpm collect

# 每周日运行 GitHub 采集
0 3 * * 0 cd /path/to/your/project && pnpm collect:github
```

### 使用 GitHub Actions

创建 `.github/workflows/data-collection.yml`：

```yaml
name: Data Collection
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch:      # 手动触发

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm collect
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 监控和日志

数据采集过程中会输出详细的日志信息：

```
🚀 开始数据采集任务...
🔗 连接到 Supabase: https://xxx.supabase.co
✅ Supabase 连接成功

📂 初始化分类数据...
✅ 成功初始化 8 个分类

📖 开始爬取 ArXiv 论文...
📝 处理 人工智能: 20 篇论文
✅ 人工智能: 成功插入 20 篇论文
...

🎉 数据采集完成！
📊 总计采集文章: 150 篇
```

## 下一步

数据采集成功后：

1. 启动开发服务器：`pnpm dev`
2. 访问网站：http://localhost:3000
3. 测试搜索和筛选功能
4. 检查数据显示是否正常

## 注意事项

1. **API 限制**: 各个数据源都有 API 请求限制，请适当控制采集频率
2. **网络环境**: 某些国外数据源可能需要良好的网络环境
3. **数据质量**: 爬取的数据可能需要进一步清理和处理
4. **版权问题**: 请确保遵守各数据源的使用条款
5. **存储空间**: 大量数据采集可能占用较多数据库存储空间

## 故障排除

如果遇到问题，请检查：

1. 环境变量是否正确配置
2. 网络连接是否正常
3. Supabase 数据库结构是否已创建
4. API 密钥是否有效
5. 日志输出的具体错误信息

需要帮助时，请查看控制台输出的详细错误信息。 