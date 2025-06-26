-- 创建RSS源表
CREATE TABLE IF NOT EXISTS feed_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  category VARCHAR(100) DEFAULT '其他',
  is_active BOOLEAN DEFAULT true,
  last_crawled TIMESTAMP WITH TIME ZONE,
  item_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_feed_sources_url ON feed_sources(url);
CREATE INDEX IF NOT EXISTS idx_feed_sources_category ON feed_sources(category);
CREATE INDEX IF NOT EXISTS idx_feed_sources_active ON feed_sources(is_active);

-- 添加source_name字段到articles表（如果不存在）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_category VARCHAR(100);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_articles_source_name ON articles(source_name);
CREATE INDEX IF NOT EXISTS idx_articles_source_category ON articles(source_category);

-- 插入一些默认的RSS源（如果表为空）
INSERT INTO feed_sources (name, url, category, is_active) VALUES
('OpenAI Blog', 'https://openai.com/blog/rss.xml', 'AI/机器学习', true),
('Google AI Blog', 'https://blog.google/technology/ai/rss/', 'AI/机器学习', true),
('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'AI/机器学习', true),
('TechCrunch', 'https://techcrunch.com/feed/', '新闻/资讯', true),
('The Verge', 'https://www.theverge.com/rss/index.xml', '新闻/资讯', true)
ON CONFLICT (url) DO NOTHING; 