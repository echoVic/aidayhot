-- 更新后的 articles 表结构
-- 基于实际数据需求重新设计字段长度

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS articles;

-- 创建新的 articles 表
CREATE TABLE articles (
  -- 主键：使用较长的字符串以容纳复杂ID格式
  id VARCHAR(100) PRIMARY KEY,
  
  -- 标题：论文和项目标题可能很长
  title TEXT NOT NULL,
  
  -- 摘要/描述：内容较长，使用TEXT
  summary TEXT,
  
  -- 分类：AI相关的分类名称，中文可能较长
  category VARCHAR(100) DEFAULT 'general',
  
  -- 作者：多个作者名字连接，可能很长
  author TEXT,
  
  -- 发布时间
  publish_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 源URL：论文和项目URL可能很长
  source_url TEXT NOT NULL,
  
  -- 源类型：arxiv, github, rss, papers-with-code, stackoverflow
  source_type VARCHAR(50) NOT NULL,
  
  -- 内容唯一ID：用于去重，基于URL hash
  content_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- 标签：存储为JSONB数组
  tags JSONB DEFAULT '[]',
  
  -- 状态标识
  is_new BOOLEAN DEFAULT true,
  is_hot BOOLEAN DEFAULT false,
  
  -- 统计数据
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 源特定字段（可选）
  arxiv_id VARCHAR(100),        -- ArXiv ID，包含版本号
  repo_id BIGINT,               -- GitHub仓库ID
  paper_id VARCHAR(100),        -- Papers with Code ID
  question_id BIGINT,           -- Stack Overflow问题ID
  
  -- 额外的元数据
  metadata JSONB DEFAULT '{}'
);

-- 创建索引以提高查询性能
CREATE INDEX idx_articles_source_type ON articles(source_type);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_publish_time ON articles(publish_time DESC);
CREATE INDEX idx_articles_is_new ON articles(is_new);
CREATE INDEX idx_articles_is_hot ON articles(is_hot);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_content_id ON articles(content_id);

-- 为标签创建GIN索引（支持JSONB查询）
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- 为元数据创建GIN索引
CREATE INDEX idx_articles_metadata ON articles USING GIN(metadata);

-- 创建全文搜索索引
CREATE INDEX idx_articles_search ON articles USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(summary, '') || ' ' || 
    COALESCE(author, '')
  )
);

-- 创建更新时间自动更新的触发器
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

-- 添加表注释
COMMENT ON TABLE articles IS 'AI日报文章数据表';
COMMENT ON COLUMN articles.id IS '文章唯一标识符';
COMMENT ON COLUMN articles.title IS '文章标题';
COMMENT ON COLUMN articles.summary IS '文章摘要或描述';
COMMENT ON COLUMN articles.category IS '文章分类';
COMMENT ON COLUMN articles.author IS '作者信息';
COMMENT ON COLUMN articles.source_url IS '原文链接';
COMMENT ON COLUMN articles.source_type IS '来源类型：arxiv, github, rss, papers-with-code, stackoverflow';
COMMENT ON COLUMN articles.content_id IS '内容唯一标识，用于去重';
COMMENT ON COLUMN articles.tags IS '标签数组（JSONB格式）';
COMMENT ON COLUMN articles.arxiv_id IS 'ArXiv论文ID';
COMMENT ON COLUMN articles.repo_id IS 'GitHub仓库ID';
COMMENT ON COLUMN articles.paper_id IS 'Papers with Code论文ID';
COMMENT ON COLUMN articles.question_id IS 'Stack Overflow问题ID';
COMMENT ON COLUMN articles.metadata IS '额外的元数据（JSONB格式）';

-- 创建示例数据查询视图
CREATE OR REPLACE VIEW recent_articles AS
SELECT 
  id,
  title,
  summary,
  category,
  author,
  source_type,
  source_url,
  tags,
  is_new,
  is_hot,
  views,
  likes,
  publish_time,
  created_at
FROM articles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

COMMENT ON VIEW recent_articles IS '最近7天的文章视图'; 