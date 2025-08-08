-- 清理 articles 相关的数据表和功能
-- 执行此脚本将完全删除 articles 表及相关功能

-- 删除视图
DROP VIEW IF EXISTS recent_articles;

-- 删除触发器
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS increment_views(TEXT);
DROP FUNCTION IF EXISTS increment_likes(TEXT);
DROP FUNCTION IF EXISTS get_category_stats();
DROP FUNCTION IF EXISTS search_articles(TEXT, INTEGER);
DROP FUNCTION IF EXISTS search_articles_count(TEXT);

-- 删除索引（会随表一起删除，但明确列出）
DROP INDEX IF EXISTS idx_articles_category;
DROP INDEX IF EXISTS idx_articles_source_type;
DROP INDEX IF EXISTS idx_articles_is_hot;
DROP INDEX IF EXISTS idx_articles_is_new;
DROP INDEX IF EXISTS idx_articles_created_at;
DROP INDEX IF EXISTS idx_articles_views;
DROP INDEX IF EXISTS idx_articles_likes;
DROP INDEX IF EXISTS idx_articles_search;
DROP INDEX IF EXISTS idx_articles_publish_time;
DROP INDEX IF EXISTS idx_articles_content_id;
DROP INDEX IF EXISTS idx_articles_arxiv_id;
DROP INDEX IF EXISTS idx_articles_tags;
DROP INDEX IF EXISTS idx_articles_metadata;
DROP INDEX IF EXISTS idx_articles_source_name;
DROP INDEX IF EXISTS idx_articles_source_category;

-- 删除 articles 表
DROP TABLE IF EXISTS articles CASCADE;

-- 删除相关的 RLS 策略（如果存在）
-- 注意：由于表已删除，这些策略也会自动删除

-- 清理完成
SELECT 'Articles table and related functions have been cleaned up successfully.' as status;