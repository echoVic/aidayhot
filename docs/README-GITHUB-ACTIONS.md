# AI 日报系统 - GitHub Actions 自动化部署指南

## 🎯 系统概述

这是一个完全自动化的 AI 日报生成系统，使用 GitHub Actions 实现云端定时执行，集成火山引擎大模型进行智能摘要生成。

## 🏗️ 系统架构

```
GitHub Actions (定时触发)
    ↓
数据抓取 (ArXiv + GitHub + RSS)
    ↓
火山引擎 AI 摘要生成
    ↓
Supabase 数据库存储
    ↓
Next.js 前端展示
```

## 🚀 部署步骤

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "feat: 完成 AI 日报系统 GitHub Actions 自动化"
git push origin main
```

### 2. 配置 GitHub Secrets

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下环境变量：

#### 必需配置：
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `SUPABASE_ANON_KEY`: Supabase 匿名访问密钥

#### 可选配置（火山引擎 AI）：
- `VOLCENGINE_API_KEY`: 火山引擎 API 密钥
- `VOLCENGINE_ENDPOINT`: API 端点（可选，有默认值）
- `VOLCENGINE_MODEL`: 模型名称（可选，有默认值）

### 3. 自动执行

GitHub Actions 会在以下情况执行：
- **每天北京时间 8:00** 自动执行
- **手动触发**：在 Actions 页面点击 "Run workflow"

## 🔧 火山引擎配置

### 获取 API 密钥

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 开通大模型服务
3. 获取 API Key 和 Endpoint
4. 在 GitHub Secrets 中配置

### 配置示例

```
VOLCENGINE_API_KEY=your_api_key_here
VOLCENGINE_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
VOLCENGINE_MODEL=ep-20241230140207-8xhzc
```

## 📊 功能特性

### ✅ 已实现功能

- **多源数据抓取**：ArXiv 论文、GitHub 项目、RSS 资讯
- **智能 AI 摘要**：火山引擎大模型生成专业摘要
- **自动化执行**：GitHub Actions 云端定时任务
- **数据存储**：Supabase 数据库持久化
- **前端展示**：Next.js 响应式界面
- **备用机制**：API 不可用时自动降级

### 🎨 数据源

1. **ArXiv**：最新 AI/ML 学术论文
2. **GitHub**：热门 AI 开源项目
3. **RSS 资讯**：
   - Google DeepMind Blog
   - AWS AI Blog
   - TechCrunch AI 资讯

## 🔍 监控和调试

### 查看执行日志

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择最新的 workflow 运行记录
4. 查看详细执行日志

### 常见问题

**Q: 为什么没有生成日报？**
A: 检查 GitHub Secrets 配置，确保 Supabase 连接正常

**Q: AI 摘要质量不高？**
A: 配置火山引擎 API 密钥，或调整模型参数

**Q: 数据抓取失败？**
A: 检查网络连接，某些数据源可能临时不可用

## 📁 项目结构

```
├── .github/workflows/
│   └── daily-report.yml          # GitHub Actions 配置
├── scripts/
│   └── generateDailyReportForGitHub.ts  # 主执行脚本
├── src/
│   ├── crawlers/                 # 数据抓取器
│   ├── services/
│   │   └── volcengineAI.ts      # 火山引擎 AI 服务
│   └── components/
│       └── DailyReport.tsx      # 前端展示组件
└── supabase/migrations/         # 数据库迁移文件
```

## 🎉 成功标志

当系统正常运行时，你会看到：

1. **GitHub Actions** 显示绿色 ✅
2. **Supabase 数据库** 中有新的日报记录
3. **Next.js 前端** 可以查看最新日报
4. **执行日志** 显示数据抓取和保存成功

## 💡 优化建议

1. **调整抓取频率**：修改 `.github/workflows/daily-report.yml` 中的 cron 表达式
2. **增加数据源**：在 `generateDailyReportForGitHub.ts` 中添加新的 RSS 源
3. **优化摘要质量**：调整火山引擎模型参数
4. **添加通知**：配置邮件或 Slack 通知

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Supabase 文档](https://supabase.com/docs)
- [火山引擎大模型](https://www.volcengine.com/products/ark)
- [Next.js 文档](https://nextjs.org/docs)

---

🎊 **恭喜！你的 AI 日报系统已经完全自动化，每天都会为你生成精选的 AI 资讯！**
