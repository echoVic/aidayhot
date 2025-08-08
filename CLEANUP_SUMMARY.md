# Articles 功能清理总结

## 已删除的数据库表
- `articles` 表及其相关索引、触发器和函数

## 已删除的文件
### 组件文件
- `src/components/ArticleCard.tsx` - 文章卡片组件
- `src/components/ArxivCard.tsx` - Arxiv论文卡片组件
- `src/components/CommunityCard.tsx` - 社区动态卡片组件
- `src/components/GitHubCard.tsx` - GitHub项目卡片组件
- `src/components/PaperCard.tsx` - 学术论文卡片组件
- `src/components/StackOverflowCard.tsx` - StackOverflow问答卡片组件

### 筛选器组件
- `src/components/CommunityFilter.tsx` - 社区内容筛选器
- `src/components/ResearchFilter.tsx` - 学术研究筛选器
- `src/components/TechFilter.tsx` - 技术内容筛选器

### 类型定义文件
- `src/types/article.ts` - Article 类型定义
- `src/types/community.ts` - 社区相关类型定义

## 已修改的文件
### 主要内容组件（简化为占位符）
- `src/components/MainContent.tsx` - 主页内容组件
- `src/components/CommunityContent.tsx` - 社区动态页面
- `src/components/TechContent.tsx` - 技术动态页面
- `src/components/ResearchContent.tsx` - 学术研究页面
- `src/components/RightSidebar.tsx` - 右侧边栏

### 数据库和类型文件
- `src/lib/database.ts` - 移除了 ArticleService 类
- `src/lib/supabase.ts` - 移除了 Article 类型定义

## 保留的功能
- 日报功能（DailyReport 组件）- 使用 `daily_reports` 表
- 分类功能（CategoryService）- 使用 `categories` 表
- 基础数据库服务（DatabaseService）
- 实时订阅服务（RealtimeService）
- 导航和布局组件

## 数据库清理脚本
- `database/drop-articles-table.sql` - 删除 articles 表的 SQL 脚本

## 注意事项
1. 所有与文章相关的页面现在显示"功能已移除"的占位符
2. 如需恢复文章功能，需要重新创建数据库表和相关组件
3. 日报功能独立于文章功能，仍然正常工作
4. 项目的基础架构和导航保持完整