-- =================================================================
-- 添加 publish_time 字段到 report_items 表
-- 用于记录每篇文章的原始发布时间
-- =================================================================

-- 添加 publish_time 字段
ALTER TABLE report_items 
ADD COLUMN publish_time TIMESTAMP WITH TIME ZONE;

-- 添加字段注释
COMMENT ON COLUMN report_items.publish_time IS '文章原始发布时间';

-- 为 publish_time 创建索引，支持按时间排序查询
CREATE INDEX idx_report_items_publish_time ON report_items(publish_time DESC);
