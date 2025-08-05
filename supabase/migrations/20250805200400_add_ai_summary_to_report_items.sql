-- =================================================================
-- 添加 ai_summary 字段到 report_items 表
-- 用于存储AI生成的详细中文总结，区别于原始的简短摘要
-- =================================================================

-- 添加 ai_summary 字段
ALTER TABLE report_items 
ADD COLUMN ai_summary TEXT;

-- 添加字段注释
COMMENT ON COLUMN report_items.ai_summary IS 'AI生成的详细中文总结，基于完整文章内容生成';

-- 为 ai_summary 创建索引，支持全文搜索
CREATE INDEX idx_report_items_ai_summary ON report_items USING gin(to_tsvector('chinese', ai_summary));
