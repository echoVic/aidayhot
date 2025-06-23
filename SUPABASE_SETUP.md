# Supabase 集成设置指南

本指南将帮助您完成从 mockData 到 Supabase 的完整迁移。

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 账号登录
4. 创建新项目：
   - 项目名称：`aidayhot`
   - 数据库密码：请设置一个强密码并记住
   - 地区：选择离您最近的地区

### 2. 获取项目配置

在 Supabase 项目仪表板中：

1. 点击左侧 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (保密！)

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

### 4. 创建数据库结构

🎉 **现在推荐使用优化版本**，已解决所有兼容性问题！

#### 推荐方案：优化版（已解决中文搜索问题）
1. 在 Supabase 仪表板中，点击 "SQL Editor"
2. 复制 `database/schema.sql` 的内容
3. 粘贴并执行 SQL

✅ **新版本特性**：
- 自动创建中文搜索配置：`CREATE TEXT SEARCH CONFIGURATION chinese (COPY = pg_catalog.simple)`
- 解决了 `"chinese" does not exist` 错误
- 优化的中英文混合搜索
- 支持标签搜索
- 智能搜索结果排序

#### 备选方案：兼容版（如果仍有问题）
如果仍然遇到问题，使用 `database/schema-simple.sql`

### 5. 安装依赖并迁移数据

```bash
# 安装新依赖
pnpm install

# 测试迁移脚本（推荐先运行）
pnpm run test-migrate

# 运行数据迁移
pnpm run migrate
```

**💡 建议先运行测试命令**，它会：
- ✅ 验证数据文件加载
- ✅ 检查环境变量配置
- ✅ 提供详细的设置指导
- ✅ 不会修改任何数据

## 📊 功能特性

### ✅ 已实现功能

- **数据持久化**: 替换了 mockData，使用真实数据库
- **实时更新**: 支持数据实时同步
- **🔍 优化搜索**: 支持中英文混合搜索，智能排序
- **分类管理**: 动态分类和文章计数
- **性能优化**: 索引优化，查询性能提升
- **用户认证**: 基础认证框架已就绪

### 🔍 搜索功能详解

**优化版搜索功能**：

1. **多层次匹配**：
   - 标题精确匹配（优先级最高）
   - 摘要精确匹配
   - 全文搜索匹配
   - 标签匹配

2. **中英文支持**：
   ```typescript
   // 中文搜索示例
   search("机器学习") // ✅ 完美支持
   search("AI技术") // ✅ 完美支持
   
   // 英文搜索示例  
   search("machine learning") // ✅ 完美支持
   search("artificial intelligence") // ✅ 完美支持
   
   // 混合搜索
   search("AI机器学习") // ✅ 完美支持
   ```

3. **智能排序**：
   - 相关性排序
   - 时间排序
   - 优先级排序

### 🔄 实时功能

组件会自动订阅数据库变化：

```typescript
// 自动更新文章列表
useEffect(() => {
  const subscription = RealtimeService.subscribeToArticles((payload) => {
    console.log('文章数据变化:', payload);
    loadArticles(); // 重新加载
  });

  return () => subscription.unsubscribe();
}, []);
```

### 📈 统计功能

```typescript
// 增加浏览量
await ArticleService.incrementViews(articleId);

// 增加点赞数
await ArticleService.incrementLikes(articleId);

// 获取分类统计
const stats = await CategoryService.getAll();
```

## 🔧 开发指南

### 添加新文章

```typescript
const newArticle = {
  id: 'unique-id',
  title: '新文章标题',
  summary: '文章摘要',
  category: '机器学习',
  author: '作者名',
  publish_time: '2025-01-20',
  read_time: '5分钟',
  views: 0,
  likes: 0,
  tags: ['AI', '技术'],
  image_url: 'https://example.com/image.jpg',
  is_hot: false,
  is_new: true
};

await ArticleService.create(newArticle);
```

### 高级搜索示例

```typescript
// 搜索包含特定标签的文章
const aiArticles = await ArticleService.search('AI');

// 搜索特定分类
const mlArticles = await ArticleService.getByCategory('机器学习');

// 获取热门文章
const hotArticles = await ArticleService.getHot();
```

## 🔐 安全配置

### Row Level Security (RLS)

已启用 RLS 策略：

- **公开读取**: 所有用户可以读取文章和分类
- **匿名更新**: 支持匿名用户更新浏览量和点赞
- **管理权限**: 只有服务角色可以增删文章

### 环境变量安全

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - 可以公开
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 可以公开  
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - 保密！仅服务端使用

## 🚨 故障排除

### 常见问题

1. **CREATE TEXT SEARCH CONFIGURATION 语法错误**
   ```sql
   ERROR: 42601: syntax error at or near "NOT"
   ```
   
   **解决方案**：
   - **选项A**：使用优化的主方案（推荐）
     ```sql
     -- 复制并执行 database/schema.sql 中的内容
     -- 已使用DO块解决语法问题
     ```
   
   - **选项B**：如果仍有问题，使用兼容版
     ```sql
     -- 使用 database/schema-simple.sql
     -- 完全避免中文搜索配置问题
     ```

2. **环境变量未生效**
   ```bash
   # 重启开发服务器
   pnpm dev
   ```

3. **数据迁移失败**
   ```bash
   # 先运行测试检查环境
   pnpm run test-migrate
   
   # 检查环境变量
   echo $SUPABASE_SERVICE_ROLE_KEY
   
   # 重新运行迁移
   pnpm run migrate
   ```
   
   **ES6 导入错误（已解决）**：
   ```bash
   # 如果遇到：SyntaxError: Unexpected token 'export'
   # ✅ 已通过创建 scripts/mockData.js 解决
   ```

4. **实时功能不工作**
   - 检查 Supabase 项目的 Realtime 是否启用
   - 确认 RLS 策略允许订阅

### 执行SQL的正确步骤

1. **登录 Supabase 仪表板**
2. **选择你的项目**
3. **进入 SQL Editor**
4. **选择方案执行**：

   **方案A：优化版（推荐）**
   ```sql
   -- 复制 database/schema.sql 的完整内容
   -- 点击 Run 按钮执行
   ```
   
   **方案B：兼容版（如果遇到语法错误）**
   ```sql
   -- 复制 database/schema-simple.sql 的完整内容  
   -- 点击 Run 按钮执行
   ```

   **方案C：紧急版（如果以上都失败）**
   ```sql
   -- 复制 database/schema-emergency.sql 的完整内容
   -- 使用最简单的语法，确保成功执行
   ```

5. **验证执行结果**
   ```sql
   -- 检查表是否创建成功
   SELECT * FROM categories;
   SELECT * FROM articles LIMIT 5;
   
   -- 测试搜索功能
   SELECT * FROM search_articles('测试', 5);
   ```

### 不同版本对比

| 功能特性 | 优化版 | 兼容版 | 紧急版 |
|---------|-------|-------|-------|
| 中文搜索配置 | ✅ 自动创建 | ❌ 避免使用 | ❌ 避免使用 |
| 全文搜索 | ✅ 高级搜索 | ✅ ILIKE+相似性 | ✅ 基础ILIKE |
| 标签搜索 | ✅ 支持 | ✅ 支持 | ❌ 暂不支持 |
| 搜索排序 | ✅ 智能排序 | ✅ 优先级排序 | ✅ 简单排序 |
| RLS策略 | ✅ 完整 | ✅ 完整 | ✅ 简化版 |
| 兼容性 | 🟡 需要DO块 | 🟢 高 | 🟢 最高 |
| 推荐场景 | 生产环境 | 开发测试 | 紧急情况 |

### 调试模式

```typescript
// 在组件中添加调试日志
useEffect(() => {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}, []);
```

### 搜索功能测试

```sql
-- 在 Supabase SQL Editor 中测试搜索
SELECT * FROM search_articles('机器学习', 10);
SELECT * FROM search_articles('AI', 10);
SELECT * FROM search_articles('machine learning', 10);
```

## 🎯 下一步计划

1. **用户认证系统**
   - 登录/注册功能
   - 用户个人中心
   - 文章收藏功能

2. **内容管理**
   - 管理员后台
   - 文章编辑器
   - 批量操作

3. **AI 功能集成**
   - 文章智能分类
   - 内容推荐算法
   - 智能摘要生成

## 📞 支持

如果遇到问题：

1. 检查 [Supabase 文档](https://supabase.com/docs)
2. 查看项目的 Issues
3. 联系技术支持

---

🎉 **恭喜！您已成功完成优化版 Supabase 集成！**

现在您的应用已经具备：
- ✅ 真实数据库存储
- ✅ 实时数据同步  
- ✅ **优化的中英文搜索**
- ✅ 智能搜索排序
- ✅ 标签搜索支持
- ✅ 安全访问控制
- ✅ 自动备份和扩展

可以开始享受现代化的数据管理和搜索体验了！