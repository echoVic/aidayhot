#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCommunityStats() {
  console.log('🔍 检查社区动态统计...\n');

  try {
    // 1. 查询所有RSS文章的分类分布
    const { data: allRssArticles, error: rssError } = await supabase
      .from('articles')
      .select('category')
      .eq('source_type', 'rss');

    if (rssError) {
      console.error('查询RSS文章失败:', rssError);
      return;
    }

    console.log('📊 RSS文章分类分布:');
    const categoryStats: Record<string, number> = {};
    allRssArticles?.forEach(article => {
      const category = article.category || '未分类';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} 篇`);
      });

    console.log(`\n📈 RSS文章总数: ${allRssArticles?.length || 0}\n`);

    // 2. 查询社区动态相关的文章
    const { data: communityArticles, error: communityError } = await supabase
      .from('articles')
      .select('category, title')
      .eq('source_type', 'rss')
      .in('category', ['社交媒体', '播客']);

    if (communityError) {
      console.error('查询社区动态文章失败:', communityError);
      return;
    }

    console.log('🎯 社区动态文章统计:');
    const communityStats: Record<string, number> = {};
    communityArticles?.forEach(article => {
      const category = article.category || '未分类';
      communityStats[category] = (communityStats[category] || 0) + 1;
    });

    Object.entries(communityStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 篇`);
    });

    const totalCommunity = communityArticles?.length || 0;
    console.log(`\n🎙️ 社区动态总数: ${totalCommunity}\n`);

    // 3. 显示一些示例文章
    if (communityArticles && communityArticles.length > 0) {
      console.log('📝 示例文章:');
      communityArticles.slice(0, 5).forEach((article, index) => {
        console.log(`  ${index + 1}. [${article.category}] ${article.title?.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('检查统计失败:', error);
  }
}

checkCommunityStats();
