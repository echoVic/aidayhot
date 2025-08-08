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