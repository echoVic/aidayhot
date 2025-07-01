# Categories表迁移指南

## 📋 概述

本文档指导如何从传统的`categories`表架构迁移到新的页面映射架构。新架构基于`source_type`和`feed_categories`来组织内容，更灵活且易于维护。

## 🤔 为什么要迁移？

### 🏚️ 旧架构问题
- **静态分类表**：需要手动维护categories表
- **松耦合**：文章分类与页面结构关联性弱
- **维护负担**：需要定期更新统计数据
- **扩展困难**：添加新分类需要数据库迁移

### 🌟 新架构优势
- **动态配置**：通过`pageConfig.ts`灵活调整页面内容
- **用户导向**：按实际用户需求（首页/技术/学术）组织内容
- **实时统计**：基于实际数据动态计算，无需维护
- **高性能**：减少JOIN查询，直接基于索引字段筛选
- **易扩展**：配置变更无需数据库操作

## 🏗️ 新架构概览

### 页面映射配置
```typescript
// src/config/pageConfig.ts
export const PAGE_CONFIGS = {
  homepage: {
    sourceTypes: ['rss', 'openai'],
    feedCategories: ['AI/机器学习', '新闻/资讯'],
    title: '📰 每日热点'
  },
  tech: {
    sourceTypes: ['github', 'stackoverflow'], 
    feedCategories: ['技术/开发'],
    title: '💻 技术动态'
  },
  research: {
    sourceTypes: ['arxiv', 'paper'],
    feedCategories: ['学术/研究'], 
    title: '📚 学术研究'
  }
  // ... 更多页面配置
}
```

### 数据组织方式
```
旧方式: articles.category → categories.name → 固定分类导航
新方式: source_type + feed_categories → 页面映射 → 动态页面导航
```

## 🛠️ 迁移步骤

### 第一步：迁移前检查
```bash
# 运行迁移检查
pnpm run migrate:check
```

检查项目：
- ✅ 验证PageContentService工作正常
- ✅ 检查数据库依赖和约束
- ✅ 分析迁移影响
- ✅ 生成迁移报告

### 第二步：备份数据
```sql
-- 在Supabase Dashboard SQL Editor中执行
CREATE TABLE categories_backup AS SELECT * FROM categories;
```

### 第三步：测试新架构
```bash
# 启动开发服务器测试
pnpm run dev
```

验证以下功能：
- [ ] 页面导航正常工作
- [ ] 文章筛选功能正常
- [ ] 统计数据准确
- [ ] 移动端导航正常

### 第四步：删除categories表
```bash
# 确认一切正常后执行
pnpm run migrate:drop-categories
```

或手动执行SQL：
```sql
DROP TABLE IF EXISTS categories CASCADE;
```

### 第五步：清理废弃代码
删除以下废弃文件：
- `scripts/resetAndUpdateCategories.ts`
- `scripts/updateCategoryStats.ts`  
- `scripts/checkCategories.ts`

更新package.json，移除相关命令：
```json
{
  "scripts": {
    // 移除这些命令
    // "reset-categories": "...",
    // "update-category-stats": "..."
  }
}
```

## 📊 迁移前后对比

| 方面 | 旧架构 | 新架构 |
|------|--------|--------|
| **数据表** | categories + articles | articles + feed_sources |
| **导航生成** | 查询categories表 | 动态计算页面统计 |
| **分类管理** | 手动维护数据库 | 配置文件管理 |
| **查询性能** | JOIN查询 | 索引字段直查 |
| **扩展性** | 需要数据库迁移 | 修改配置文件 |
| **维护成本** | 高（需要同步统计） | 低（自动计算） |

## 🔄 API变更

### CategoryService → PageContentService

```typescript
// 🏚️ 旧API
const categories = await CategoryService.getAll();

// 🌟 新API  
const pageNav = await PageContentService.getPageNavigation();
const pageFilters = await PageContentService.getPageFilters('homepage');
const rssStats = await PageContentService.getRSSCategoryStats();
```

### 组件更新

```typescript
// Sidebar组件
- import { CategoryService } from '../lib/database';
+ import { PageContentService } from '../lib/database';

// 使用新的导航数据
- const categories = await CategoryService.getRSSCategories();
+ const pageNavigation = await PageContentService.getPageNavigation();
```

## 🚨 注意事项

### 保留的字段
- `articles.category` 字段**保留不变**，仍用于文章元数据
- 现有文章的分类信息不会丢失
- 可以继续基于category字段进行搜索和筛选

### 向后兼容
- CategoryService保留兼容性接口，但会显示废弃警告
- 现有的文章查询API继续工作
- 可以逐步迁移前端组件

### 回滚计划
如果迁移出现问题，可以快速回滚：
```sql
-- 恢复categories表
CREATE TABLE categories AS SELECT * FROM categories_backup;

-- 恢复组件代码（通过git）
git checkout HEAD~1 src/components/Sidebar.tsx
git checkout HEAD~1 src/lib/database.ts
```

## 📈 预期收益

### 性能提升
- **查询速度**：减少70%的JOIN查询
- **页面加载**：导航数据实时计算，无缓存不一致问题
- **扩展性**：添加新页面无需数据库操作

### 维护简化
- **自动统计**：无需手动维护分类统计
- **配置化管理**：页面内容通过代码配置，版本可控
- **灵活调整**：页面映射可以快速调整，适应用户需求变化

### 用户体验
- **语义化导航**：页面名称更直观（技术动态、学术研究）
- **内容聚焦**：每个页面内容更加聚焦和专业
- **发现性更好**：用户更容易找到感兴趣的内容

## 🆘 故障排除

### 常见问题

**Q: PageContentService返回空数据**
A: 检查articles表中是否有数据，确认source_type字段有值

**Q: 页面导航显示0篇文章**  
A: 检查pageConfig中的sourceTypes配置是否与数据库中的source_type匹配

**Q: RSS分类筛选不工作**
A: 确认feed_sources表中有数据，且category字段不为空

**Q: 迁移后性能没有提升**
A: 检查数据库索引是否正确创建：
```sql
-- 确认这些索引存在
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_feed_sources_category ON feed_sources(category);
```

## 📞 支持

如果在迁移过程中遇到问题：

1. **检查日志**：查看浏览器控制台和服务器日志
2. **运行诊断**：`pnpm run migrate:check`
3. **查看文档**：参考本指南和相关代码注释
4. **快速回滚**：使用上述回滚步骤恢复到旧架构

---

## ✅ 迁移清单

- [ ] 运行迁移检查
- [ ] 备份categories表数据  
- [ ] 测试新架构功能
- [ ] 确认性能改善
- [ ] 删除categories表
- [ ] 清理废弃代码
- [ ] 更新部署配置
- [ ] 通知团队成员

**迁移完成后，您将拥有一个更现代、更灵活、更易维护的内容管理架构！** 🎉 