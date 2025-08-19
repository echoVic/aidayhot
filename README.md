# AI Day Hot - AI每日热点

一个基于 Next.js 的 AI 日报平台，专注于提供高质量的 AI 相关日报内容。

## ✨ 当前功能 (2025-08-19)

### 📰 AI 日报系统
- **每日报告**: 精心策划的 AI 相关新闻和资讯日报
- **智能总结**: 每日 AI 动态的智能摘要和分析
- **分类展示**: 按主题分类的新闻内容
- **响应式设计**: 完美适配桌面端和移动端

### 🛡️ 用户体验优化
- **全局错误边界**: React Error Boundary 优雅处理组件错误
- **Toast 通知系统**: 完整的消息通知系统（成功、错误、警告、信息）
- **加载状态优化**: 改进的加载动画和错误重试机制
- **SEO 优化**: 完整的 SEO 配置和结构化数据

### 📱 移动端优化
- **响应式导航**: 桌面端和移动端的统一导航体验
- **移动端友好**: 专为移动设备优化的界面设计
- **快速加载**: 优化的性能和加载速度

### 📧 订阅功能
- **邮件订阅**: 支持邮件订阅日报内容
- **订阅管理**: 完整的订阅和取消订阅流程

## 🏗️ 项目架构

### 技术栈
- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **邮件服务**: Resend
- **部署**: Vercel
- **样式**: Tailwind CSS + HeroUI

### 核心组件
- `DailyReport`: 日报主组件，支持虚拟滚动和分页
- `DailyReportCard`: 日报卡片组件
- `Header`: 顶部导航和搜索
- `SubscriptionSidebar`: 订阅侧边栏
- `Toast`: 全局消息通知系统
- `ErrorBoundary`: 错误边界和错误处理

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 环境配置
复制环境变量模板：
```bash
cp .env.example .env.local
```

配置必要的环境变量：
```bash
# Supabase 配置（必须）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub Token（可选，但推荐）
GITHUB_TOKEN=your_github_personal_access_token
```

### 3. 数据库设置
参考 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 设置数据库。

### 4. 数据采集
```bash
# 测试数据采集
pnpm collect:test

# 完整数据采集
pnpm collect
```

### 5. 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看结果。

## 📊 数据采集

### 支持的数据源
- **ArXiv 论文**: AI、机器学习、NLP、计算机视觉等领域的最新论文
- **GitHub 仓库**: 热门的 AI 相关开源项目
- **RSS 订阅源**: Google AI Blog、OpenAI Blog、Towards Data Science 等

### 采集命令
```bash
# 分别采集不同数据源
pnpm collect:arxiv    # ArXiv 论文
pnpm collect:github   # GitHub 仓库
pnpm collect:rss      # RSS 文章

# 完整采集
pnpm collect
```

详细信息请参考 [DATA_COLLECTION_GUIDE.md](./DATA_COLLECTION_GUIDE.md)。

## 🔧 开发指南

### 项目结构
```
src/
├── app/                 # Next.js App Router
├── components/          # React 组件
│   ├── Toast.tsx       # 消息通知系统
│   ├── ErrorBoundary.tsx # 错误边界
│   ├── MobileNavigation.tsx # 移动端导航
│   └── ...
├── lib/                # 工具库
│   ├── database.ts     # 数据库服务层
│   └── supabase.ts     # Supabase 配置
└── crawlers/           # 爬虫系统
```

### 核心功能

#### 分页系统
```typescript
// 获取分页数据
const result = await ArticleService.getAll(page, pageSize);
// result: { data, total, hasMore, page, pageSize }
```

#### 错误处理
```typescript
// 使用 Toast 通知
const { showSuccess, showError, showWarning, showInfo } = useToast();

// 使用错误边界
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### 移动端导航
```typescript
<MobileNavigation
  currentCategory={category}
  onCategoryChange={handleCategoryChange}
  onSearch={handleSearch}
/>
```

## 🧪 测试

```bash
# 运行所有爬虫测试
node test/runAllCrawlerTests.js

# 测试特定爬虫
node test/testArxivCrawler.js
node test/testGitHubCrawler.js
```

## 📈 性能优化

### 已实现的优化
- ✅ 分页加载，避免大数据量性能问题
- ✅ 数据库索引优化
- ✅ 组件懒加载和错误边界
- ✅ 图片优化（Next.js Image 组件）
- ✅ 实时数据订阅

### 计划中的优化
- 🔄 Redis 缓存层
- 🔄 CDN 图片存储
- 🔄 服务端渲染优化
- 🔄 PWA 支持

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
