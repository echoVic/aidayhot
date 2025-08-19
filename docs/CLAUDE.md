# CLAUDE.md

always respond in Chinese

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server
- `pnpm build` - Build production version
- `pnpm lint` - Run ESLint
- `pnpm start` - Start production server

### Data Management
- `pnpm update-openai` - Update OpenAI news data
- `pnpm setup` - Quick setup for development

### Database Management
- `pnpm create-tables` - Create database tables

## Architecture Overview

### AI日报系统架构
项目是一个基于Next.js的AI日报平台，专注于展示每日AI相关新闻和内容。

### 数据层
- **数据库**: Supabase PostgreSQL，主要表结构：
  - `daily_reports`: 存储每日AI报告内容
  - `subscriptions`: 用户订阅信息
- **数据服务**: `src/lib/database.ts` 提供数据查询和管理功能
- **实时更新**: 使用Supabase实时订阅

### 内容管理
- **OpenAI新闻更新**: 通过 `scripts/updateOpenAINews.ts` 更新AI相关新闻
- **日报生成**: 自动化生成每日AI内容摘要
- **邮件订阅**: 集成Resend服务提供邮件订阅功能

### 前端架构
- **框架**: Next.js 15 with App Router
- **UI**: React 19 with Tailwind CSS 4
- **组件**: 模块化系统，包含日报卡片、布局组件和移动端导航
- **错误处理**: React Error Boundary 和 toast 通知

## 核心技术细节

### 页面结构
```
src/app/
├── layout.tsx          # 根布局和导航
├── page.tsx           # 首页 (AI日报展示)
├── subscribe/         # 订阅页面
└── api/               # API路由
```

### 数据流
1. OpenAI新闻脚本更新AI相关内容
2. 数据存储在Supabase数据库
3. 页面通过API获取日报数据
4. 组件渲染日报内容和订阅功能

### 配置文件
- `next.config.ts`: 图片优化和webpack配置
- `eslint.config.mjs`: ESLint 9 flat config
- `tsconfig.json`: TypeScript严格模式和路径映射

### 环境变量
必需:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (邮件服务)

可选:
- `GITHUB_TOKEN` (用于GitHub API限制)

## 重要模式

### 组件组织
- 日报卡片 (DailyReportCard) 处理日报内容展示
- 布局组件 (Header, SubscriptionSidebar) 提供一致的结构
- 移动优先的响应式设计

### 错误处理
- React Error Boundary 包装主要内容
- Toast 通知提供用户反馈
- 网络错误的优雅降级

### 性能优化
- Next.js Image 组件的图片懒加载
- 组件级加载状态
- 数据库索引优化
- 响应式设计优化

### 数据处理
- 日报内容通过OpenAI API更新
- 邮件订阅通过Resend服务处理
- 用户订阅信息安全存储

## 开发说明

### 脚本开发
- 使用 `tsx` 运行TypeScript脚本
- OpenAI新闻更新脚本位于 `scripts/updateOpenAI News.ts`
- 数据库操作通过Supabase客户端进行

### 数据库架构
`daily_reports` 表包含:
- 基础字段: title, content, publish_date
- 元数据: source, category, tags
- 技术字段: id, created_at, updated_at

`subscriptions` 表包含:
- 用户信息: email, name
- 订阅设置: is_active, subscription_type
- 时间戳: created_at, updated_at

### 移动端考虑
- 响应式设计适配各种设备
- 触摸友好的交互模式
- 优化的移动端布局

该代码库强调模块化、类型安全和可维护性，专注于AI日报内容的展示和用户订阅管理。