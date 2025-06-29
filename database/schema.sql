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
  href VARCHAR(100) NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文章表
CREATE TABLE IF NOT EXISTS public.articles (
  id VARCHAR(50) PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category VARCHAR(50) NOT NULL,
  source_type VARCHAR(50),
  author VARCHAR(100),
  publish_time VARCHAR(20),
  read_time VARCHAR(20),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_hot BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_category FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_is_hot ON articles(is_hot);
CREATE INDEX IF NOT EXISTS idx_articles_is_new ON articles(is_new);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views);
CREATE INDEX IF NOT EXISTS idx_articles_likes ON articles(likes);

-- 创建中文全文搜索索引（使用自定义配置）
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('chinese', title || ' ' || summary));

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

-- 创建获取分类文章统计的函数
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(category_name TEXT, article_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.category::TEXT, COUNT(*)::BIGINT
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

-- 插入初始分类数据（如果不存在）
INSERT INTO public.categories (name, href, count) 
VALUES 
  ('全部', '/', 286),
  ('AI/机器学习', '/category/ai-ml', 83),
  ('社交媒体', '/category/social', 95),
  ('技术/开发', '/category/tech', 33),
  ('新闻/资讯', '/category/news', 12),
  ('播客', '/category/podcast', 17),
  ('设计/UX', '/category/design', 3),
  ('学术/研究', '/category/academic', 1),
  ('其他', '/category/other', 42)
ON CONFLICT (name) DO NOTHING;