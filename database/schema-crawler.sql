-- 创建自定义中文搜索配置（解决 "chinese" 配置不存在的问题）
DO $$
BEGIN
    -- 检查配置是否已存在，如果不存在则创建
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION chinese (COPY = pg_catalog.simple);
    END IF;
END $$;

-- 启用 Row Level Security (RLS)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 创建分类表
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(50) UNIQUE,
  href VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文章表（支持爬虫数据）
CREATE TABLE IF NOT EXISTS public.articles (
  id VARCHAR(50) PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category VARCHAR(50) NOT NULL,
  author VARCHAR(100),
  publish_time TIMESTAMP WITH TIME ZONE,
  read_time VARCHAR(20),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_hot BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT TRUE,
  
  -- 爬虫相关字段
  source_url TEXT,              -- 原文链接
  source_type VARCHAR(20),      -- 数据源类型 (arxiv/github/rss)
  content_id VARCHAR(100),      -- 内容唯一标识
  arxiv_id VARCHAR(50),         -- ArXiv ID (仅ArXiv数据)
  repo_id BIGINT,               -- GitHub 仓库ID (仅GitHub数据)
  metadata JSONB,               -- 元数据存储
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_category FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_hot ON articles(is_hot);
CREATE INDEX IF NOT EXISTS idx_articles_is_new ON articles(is_new);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_publish_time ON articles(publish_time);
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views);
CREATE INDEX IF NOT EXISTS idx_articles_likes ON articles(likes);
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_content_id ON articles(content_id);
CREATE INDEX IF NOT EXISTS idx_articles_arxiv_id ON articles(arxiv_id);

-- 创建中文全文搜索索引（使用自定义配置）
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('chinese', title || ' ' || summary));

-- 创建 JSONB 元数据索引
CREATE INDEX IF NOT EXISTS idx_articles_metadata ON articles USING gin(metadata);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_views(article_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE articles 
  SET views = views + 1, updated_at = NOW()
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- 创建增加点赞数的函数
CREATE OR REPLACE FUNCTION increment_likes(article_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET likes = likes + 1, updated_at = NOW()
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索文章函数（支持分页）
CREATE OR REPLACE FUNCTION search_articles(
  search_query TEXT,
  search_limit INTEGER DEFAULT 20,
  search_offset INTEGER DEFAULT 0
)
RETURNS SETOF articles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM articles
  WHERE
    -- 全文搜索匹配（使用自定义中文配置）
    to_tsvector('chinese', title || ' ' || summary) @@ plainto_tsquery('chinese', search_query)
    -- 精确匹配（对中文特别重要）
    OR title ILIKE '%' || search_query || '%'
    OR summary ILIKE '%' || search_query || '%'
    -- 标签匹配
    OR EXISTS (
      SELECT 1 FROM unnest(tags) AS tag
      WHERE tag ILIKE '%' || search_query || '%'
    )
  ORDER BY
    -- 优先级排序：标题匹配 > 全文搜索 > 标签匹配
    CASE
      WHEN title ILIKE '%' || search_query || '%' THEN 1
      WHEN to_tsvector('chinese', title || ' ' || summary) @@ plainto_tsquery('chinese', search_query) THEN 2
      ELSE 3
    END,
    created_at DESC
  LIMIT search_limit
  OFFSET search_offset;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索结果计数函数
CREATE OR REPLACE FUNCTION search_articles_count(search_query TEXT)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM articles
  WHERE
    -- 全文搜索匹配（使用自定义中文配置）
    to_tsvector('chinese', title || ' ' || summary) @@ plainto_tsquery('chinese', search_query)
    -- 精确匹配（对中文特别重要）
    OR title ILIKE '%' || search_query || '%'
    OR summary ILIKE '%' || search_query || '%'
    -- 标签匹配
    OR EXISTS (
      SELECT 1 FROM unnest(tags) AS tag
      WHERE tag ILIKE '%' || search_query || '%'
    );
END;
$$ LANGUAGE plpgsql;

-- 创建获取分类文章统计的函数
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(category_name TEXT, article_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.category, COUNT(*)
  FROM articles a
  GROUP BY a.category;
END;
$$ LANGUAGE plpgsql;

-- 创建优化的搜索文章函数（支持中英文混合搜索）
CREATE OR REPLACE FUNCTION search_articles(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS SETOF articles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM articles
  WHERE 
    -- 全文搜索匹配（使用自定义中文配置）
    to_tsvector('chinese', title || ' ' || summary) @@ plainto_tsquery('chinese', search_query)
    -- 精确匹配（对中文特别重要）
    OR title ILIKE '%' || search_query || '%'
    OR summary ILIKE '%' || search_query || '%'
    -- 标签匹配
    OR EXISTS (
      SELECT 1 FROM unnest(tags) AS tag 
      WHERE tag ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- 搜索结果优先级排序
    CASE 
      WHEN title ILIKE '%' || search_query || '%' THEN 1  -- 标题精确匹配优先
      WHEN summary ILIKE '%' || search_query || '%' THEN 2  -- 摘要精确匹配
      WHEN to_tsvector('chinese', title || ' ' || summary) @@ plainto_tsquery('chinese', search_query) THEN 3  -- 全文搜索
      ELSE 4  -- 标签匹配
    END,
    -- 相关性排序
    ts_rank(to_tsvector('chinese', title || ' ' || summary), plainto_tsquery('chinese', search_query)) DESC,
    created_at DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- 创建清理旧数据的函数
CREATE OR REPLACE FUNCTION clean_old_articles(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM articles 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建根据内容ID查找重复文章的函数
CREATE OR REPLACE FUNCTION find_duplicate_articles(new_content_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM articles WHERE content_id = new_content_id
  );
END;
$$ LANGUAGE plpgsql;

-- 设置 Row Level Security 策略
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取分类和文章（公开访问）
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON articles;
CREATE POLICY "Enable read access for all users" ON articles FOR SELECT USING (true);

-- 只允许认证用户增加浏览量和点赞（调整为支持匿名用户）
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON articles;
CREATE POLICY "Enable update for authenticated users only" ON articles 
FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 只允许特定角色插入和删除文章（管理员功能）
DROP POLICY IF EXISTS "Enable insert for service role only" ON articles;
CREATE POLICY "Enable insert for service role only" ON articles 
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Enable delete for service role only" ON articles;
CREATE POLICY "Enable delete for service role only" ON articles 
FOR DELETE USING (auth.role() = 'service_role');

-- 插入支持爬虫的分类数据
INSERT INTO public.categories (name, description, slug, href, count) 
VALUES 
  ('全部', '所有文章和资讯', 'all', '/', 0),
  ('人工智能', 'AI相关论文和资讯', 'ai', '/category/ai', 0),
  ('机器学习', '机器学习算法和应用', 'ml', '/category/ml', 0),
  ('自然语言处理', 'NLP技术和模型', 'nlp', '/category/nlp', 0),
  ('计算机视觉', '计算机视觉和图像处理', 'cv', '/category/cv', 0),
  ('神经网络', '神经网络和深度学习', 'nn', '/category/nn', 0),
  ('GitHub仓库', '热门的AI相关开源项目', 'github', '/category/github', 0),
  ('AI博客', 'AI技术博客和文章', 'blog', '/category/blog', 0),
  ('技术新闻', '最新的AI技术新闻', 'news', '/category/news', 0)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  slug = EXCLUDED.slug; 