-- 简化版数据库表更新脚本
-- 重点解决字段长度限制问题

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS articles CASCADE;

-- 创建新的 articles 表，字段长度更宽松
CREATE TABLE articles (
  -- 主键
  id VARCHAR(100) PRIMARY KEY,
  
  -- 基本信息 - 使用 TEXT 避免长度限制
  title TEXT NOT NULL,
  summary TEXT,
  category VARCHAR(100) DEFAULT 'general',
  author TEXT,
  
  -- 时间字段
  publish_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- URL和源信息 - 使用 TEXT 避免长度限制
  source_url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- 标签 - 使用 JSONB
  tags JSONB DEFAULT '[]',
  
  -- 状态和统计
  is_new BOOLEAN DEFAULT true,
  is_hot BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- 源特定字段 - 使用更宽松的长度
  arxiv_id VARCHAR(100),
  repo_id BIGINT,
  paper_id VARCHAR(100),
  question_id BIGINT,
  
  -- 元数据
  metadata JSONB DEFAULT '{}'
);

-- 创建基本索引
CREATE INDEX idx_articles_source_type ON articles(source_type);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_publish_time ON articles(publish_time DESC);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_content_id ON articles(content_id);

-- 为 JSONB 字段创建索引
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- 自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE articles IS 'AI日报文章数据表 - 优化版';
COMMENT ON COLUMN articles.content_id IS '内容唯一标识，用于去重'; 