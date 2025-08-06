-- 创建简化的日报表结构
-- 去掉 report_items 表，直接在 daily_reports 表中以 JSON 格式存储完整日报数据

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS report_items;
DROP TABLE IF EXISTS daily_reports;

-- 创建新的简化日报表
CREATE TABLE daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    content JSONB NOT NULL, -- 存储完整的日报数据（文章列表、元数据等）
    summary TEXT, -- AI 生成的日报总结
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_daily_reports_created_at ON daily_reports(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_reports_updated_at 
    BEFORE UPDATE ON daily_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE daily_reports IS '每日AI报告表，以JSON格式存储完整日报数据';
COMMENT ON COLUMN daily_reports.content IS 'JSON格式的日报内容，包含文章列表和元数据';
COMMENT ON COLUMN daily_reports.summary IS 'AI生成的日报总结';
