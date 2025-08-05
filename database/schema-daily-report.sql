-- =================================================================
-- Schema for the new AI Daily Report feature
-- 替代原有的articles表，采用更轻量化的日报存储结构
-- =================================================================

-- -----------------------------------------------------------------
-- Table: daily_reports
-- 存储每日AI生成的报告主体内容
-- -----------------------------------------------------------------
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  introduction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加表和字段注释
COMMENT ON TABLE daily_reports IS '存储AI生成的每日报告';
COMMENT ON COLUMN daily_reports.report_date IS '报告日期，确保每天只有一份报告';
COMMENT ON COLUMN daily_reports.introduction IS 'AI生成的当日导读或执行摘要';

-- 为报告日期创建索引，支持快速查询
CREATE INDEX idx_daily_reports_report_date ON daily_reports(report_date DESC);


-- -----------------------------------------------------------------
-- Table: report_items
-- 存储每日报告中的具体新闻条目
-- -----------------------------------------------------------------
CREATE TABLE report_items (
  id SERIAL PRIMARY KEY,
  daily_report_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name VARCHAR(50),
  display_order SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 定义外键关联
  CONSTRAINT fk_daily_report
    FOREIGN KEY(daily_report_id) 
    REFERENCES daily_reports(id)
    ON DELETE CASCADE -- 删除报告时，相关条目也会被删除
);

-- 添加表和字段注释
COMMENT ON TABLE report_items IS '存储每日报告中的具体新闻条目';
COMMENT ON COLUMN report_items.daily_report_id IS '关联到daily_reports表的外键';
COMMENT ON COLUMN report_items.summary IS '该新闻条目的AI生成摘要';
COMMENT ON COLUMN report_items.source_name IS '原始来源，如"GitHub"、"ArXiv"、"TechCrunch"';
COMMENT ON COLUMN report_items.display_order IS '条目在报告中的显示顺序';

-- 为外键创建索引，提高关联查询效率
CREATE INDEX idx_report_items_daily_report_id ON report_items(daily_report_id);

-- 为显示顺序创建索引，支持排序查询
CREATE INDEX idx_report_items_display_order ON report_items(daily_report_id, display_order);
