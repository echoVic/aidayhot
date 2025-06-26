#!/usr/bin/env node

import { supabase } from './supabaseClient';

async function createTables() {
  console.log('🚀 开始创建数据库表...');

  try {
    // 先检查categories表
console.log('🔍 检查categories表...');
const { data: categoriesExists, error: categoriesError } = await supabase
  .from('categories')
  .select('id')
  .limit(1);

if (categoriesError) {
  console.log('📋 需要创建categories表，请执行以下SQL:');
  console.log(`
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  href VARCHAR(100) NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `);
} else {
  console.log('✅ categories表已存在');
}

// 检查articles表是否存在
    console.log('🔍 检查articles表...');
    const { data: articlesExists, error: articlesError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (articlesError) {
      console.log('❌ articles表不存在或无法访问:', articlesError.message);
      console.log('📋 请在Supabase Dashboard中创建articles表，参考以下结构:');
      console.log(`
CREATE TABLE articles (
  id VARCHAR(50) PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category VARCHAR(50) NOT NULL,
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
  CONSTRAINT fk_category FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE
);
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  url VARCHAR(1000) NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  source_name VARCHAR(255),
  source_category VARCHAR(100),
  category VARCHAR(100),
  tags TEXT[],
  image_url VARCHAR(1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      console.log('✅ articles表已存在');
      
      // 检查是否有source_name列
      const { data: sourceNameTest, error: sourceNameError } = await supabase
        .from('articles')
        .select('source_name')
        .limit(1);
        
      if (sourceNameError && sourceNameError.message.includes('column "source_name" does not exist')) {
        console.log('📝 需要添加source_name和source_category列到articles表');
        console.log('请在Supabase Dashboard的SQL Editor中执行:');
        console.log('ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);');
        console.log('ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_category VARCHAR(100);');
      } else {
        console.log('✅ articles表结构完整');
      }
    }

    // 检查feed_sources表是否存在
    console.log('🔍 检查feed_sources表...');
    const { data: feedExists, error: feedError } = await supabase
      .from('feed_sources')
      .select('id')
      .limit(1);

    if (feedError) {
      console.log('📋 需要创建feed_sources表');
      console.log('请在Supabase Dashboard的SQL Editor中执行以下SQL:');
      console.log(`
-- 创建feed_sources表
CREATE TABLE feed_sources (
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
CREATE INDEX idx_feed_sources_url ON feed_sources(url);
CREATE INDEX idx_feed_sources_category ON feed_sources(category);
CREATE INDEX idx_feed_sources_active ON feed_sources(is_active);
      `);
    } else {
      console.log('✅ feed_sources表已存在');
      
      // 插入一些默认的RSS源
      console.log('📥 插入默认RSS源...');
      const defaultSources = [
        {
          name: 'OpenAI Blog',
          url: 'https://openai.com/blog/rss.xml',
          category: 'AI/机器学习',
          is_active: true
        },
        {
          name: 'Google AI Blog', 
          url: 'https://blog.google/technology/ai/rss/',
          category: 'AI/机器学习',
          is_active: true
        },
        {
          name: 'Hugging Face Blog',
          url: 'https://huggingface.co/blog/feed.xml',
          category: 'AI/机器学习',
          is_active: true
        },
        {
          name: 'TechCrunch',
          url: 'https://techcrunch.com/feed/',
          category: '新闻/资讯',
          is_active: true
        },
        {
          name: 'The Verge',
          url: 'https://www.theverge.com/rss/index.xml',
          category: '新闻/资讯',
          is_active: true
        }
      ];

      for (const source of defaultSources) {
        const { error: insertError } = await supabase
          .from('feed_sources')
          .upsert(source, { onConflict: 'url', ignoreDuplicates: true });

        if (insertError) {
          console.log(`⚠️  插入${source.name}失败:`, insertError.message);
        } else {
          console.log(`✅ 插入/更新RSS源: ${source.name}`);
        }
      }
    }

    console.log('\n🎉 数据库表检查完成！');
    
    // 提供下一步指引
    console.log('\n📋 下一步操作:');
    console.log('1. 如果上面显示需要手动创建表，请在Supabase Dashboard中执行相应SQL');
    console.log('2. 表创建完成后，运行: npm run parse-opml');
    console.log('3. RSS源导入后，运行: npm run collect-rss');
    console.log('4. 最后运行: npm run dev');

  } catch (error) {
    console.error('❌ 创建表时出错:', error);
  }
}

createTables();