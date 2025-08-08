# 数据库清理说明

## 手动执行 Articles 表删除

由于项目中没有安装 Supabase CLI，需要手动在 Supabase Dashboard 中执行以下 SQL 脚本：

### 1. 登录 Supabase Dashboard
访问 [https://app.supabase.com](https://app.supabase.com) 并登录您的账户

### 2. 选择项目
选择对应的项目

### 3. 打开 SQL Editor
在左侧导航栏中点击 "SQL Editor"

### 4. 执行清理脚本
复制并执行 `drop-articles-table.sql` 文件中的内容：

```sql
-- 删除 articles 表及相关索引和触发器
DROP TABLE IF EXISTS articles CASCADE;

-- 删除相关的索引（如果存在）
DROP INDEX IF EXISTS idx_articles_category;
DROP INDEX IF EXISTS idx_articles_publish_time;
DROP INDEX IF EXISTS idx_articles_source_type;
DROP INDEX IF EXISTS idx_articles_is_hot;
DROP INDEX IF EXISTS idx_articles_is_new;
DROP INDEX IF EXISTS idx_articles_views;
DROP INDEX IF EXISTS idx_articles_likes;
DROP INDEX IF EXISTS idx_articles_search;

-- 删除全文搜索索引（如果存在）
DROP INDEX IF EXISTS articles_search_idx;

-- 删除相关的触发器（如果存在）
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;

-- 删除相关的函数（如果存在）
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 清理完成
SELECT 'Articles table and related objects have been dropped successfully' as result;
```

### 5. 验证清理结果
执行后应该看到成功消息，确认 articles 表及相关对象已被删除。

## 注意事项
- 此操作不可逆，请确保已备份重要数据
- 删除后所有文章相关功能将不可用
- 日报功能使用独立的 `daily_reports` 表，不受影响