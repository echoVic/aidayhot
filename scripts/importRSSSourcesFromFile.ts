#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { supabase } from './supabaseClient';

interface RSSSourceConfig {
  name: string;
  url: string;
  category: string;
  isActive: boolean;
  validationStatus: string;
  itemCount?: number;
}

/**
 * 根据名称自动分类RSS源
 */
function categorizeFeed(name: string): string {
  const title = name.toLowerCase();
  
  // AI和机器学习相关
  if (title.includes('ai') || title.includes('机器学习') || title.includes('deeplearning') || 
      title.includes('openai') || title.includes('anthropic') || title.includes('hugging face') ||
      title.includes('机器之心') || title.includes('量子位') || title.includes('deepmind') ||
      title.includes('智谱') || title.includes('moonshot') || title.includes('kimi') ||
      title.includes('百度ai') || title.includes('通往agi') || title.includes('混元') ||
      title.includes('阶跃星辰') || title.includes('deepseek') || title.includes('jina') ||
      title.includes('groq') || title.includes('llama') || title.includes('mem0') ||
      title.includes('langchain') || title.includes('perplexity') || title.includes('cohere') ||
      title.includes('elevenlabs') || title.includes('character.ai') || title.includes('midjourney') ||
      title.includes('runway') || title.includes('recraft') || title.includes('dify') ||
      title.includes('ollama') || title.includes('flowise')) {
    return 'AI/机器学习';
  }
  
  // 技术和开发相关
  if (title.includes('tech') || title.includes('engineering') || title.includes('developer') ||
      title.includes('技术') || title.includes('开发') || title.includes('github') ||
      title.includes('stackoverflow') || title.includes('博客') || title.includes('程序') ||
      title.includes('代码') || title.includes('docker') || title.includes('kubernetes') ||
      title.includes('云') || title.includes('aws') || title.includes('azure') ||
      title.includes('google cloud') || title.includes('mongodb') || title.includes('spring') ||
      title.includes('jetbrains') || title.includes('visual studio') || title.includes('node.js') ||
      title.includes('next.js') || title.includes('react') || title.includes('vue') ||
      title.includes('掘金') || title.includes('infoq') || title.includes('thoughtworks') ||
      title.includes('美团技术') || title.includes('滴滴技术') || title.includes('阿里') ||
      title.includes('腾讯') || title.includes('字节') || title.includes('netflix') ||
      title.includes('meta') || title.includes('microsoft') || title.includes('elastic') ||
      title.includes('grafana') || title.includes('cloudflare') || title.includes('canva') ||
      title.includes('datawhale')) {
    return '技术/开发';
  }
  
  // 新闻和资讯
  if (title.includes('news') || title.includes('新闻') || title.includes('资讯') ||
      title.includes('日报') || title.includes('周刊') || title.includes('报告') ||
      title.includes('分析') || title.includes('观察') || title.includes('评论') ||
      title.includes('爱范儿') || title.includes('智东西') || title.includes('白鲸出海') ||
      title.includes('甲子光年') || title.includes('经纬') || title.includes('真格') ||
      title.includes('投资') || title.includes('创投') || title.includes('研究院') ||
      title.includes('腾讯研究') || title.includes('阿里研究') || title.includes('麻省理工') ||
      title.includes('keyword') || title.includes('blog.google')) {
    return '新闻/资讯';
  }
  
  // 播客
  if (title.includes('podcast') || title.includes('播客') || title.includes('小宇宙') ||
      title.includes('什么next') || title.includes('硅谷101') || title.includes('三五环') ||
      title.includes('商业访谈') || title.includes('42章经') || title.includes('十字路口') ||
      title.includes('知行小酒馆') || title.includes('纵横四海') || title.includes('乱翻书') ||
      title.includes('onboard') || title.includes('硬地骇客') || title.includes('ai炼金术') ||
      title.includes('人民公园说ai') || title.includes('保持偏见') || title.includes('枫言枫语') ||
      title.includes('屠龙之术') || title.includes('晚点聊') || title.includes('开始连接') ||
      title.includes('此话当真') || title.includes('无人知晓')) {
    return '播客';
  }
  
  // 学术和研究
  if (title.includes('research') || title.includes('paper') || title.includes('学术') ||
      title.includes('研究') || title.includes('论文') || title.includes('科研') ||
      title.includes('university') || title.includes('stanford') || title.includes('berkeley') ||
      title.includes('mit') || title.includes('microsoft research') || title.includes('arxiv')) {
    return '学术/研究';
  }
  
  // 社交媒体
  if (title.includes('@') || title.includes('twitter') || title.includes('x.com') ||
      title.includes('微博') || title.includes('推特')) {
    return '社交媒体';
  }
  
  // 设计和用户体验
  if (title.includes('design') || title.includes('ux') || title.includes('ui') ||
      title.includes('设计') || title.includes('用户体验') || title.includes('界面') ||
      title.includes('优设') || title.includes('体验进阶') || title.includes('isux') ||
      title.includes('体验') || title.includes('设计师') || title.includes('创意')) {
    return '设计/用户体验';
  }
  
  return '其他';
}

async function importRSSSourcesFromFile() {
  try {
    const configFilePath = path.join(process.cwd(), 'src/config/rss-sources.json');
    
    // 检查文件是否存在
    if (!fs.existsSync(configFilePath)) {
      console.error('❌ RSS源配置文件不存在:', configFilePath);
      console.log('请先运行: npm run parse-opml');
      return;
    }

    // 读取RSS源配置
    console.log('📖 读取RSS源配置文件...');
    const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
    
    // 转换键值对格式为数组格式
    const rssSources = Object.entries(configData).map(([name, url]) => ({
      name,
      url: url as string,
      category: categorizeFeed(name),
      isActive: true,
      validationStatus: 'success' // 假设文件中的都是有效的
    }));

    console.log(`✅ 发现 ${rssSources.length} 个RSS源`);

    if (rssSources.length === 0) {
      console.log('❌ 没有找到RSS源');
      return;
    }

    // 转换为数据库格式
    const feedSources = rssSources.map(source => ({
      name: source.name,
      url: source.url,
      category: source.category,
      is_active: true,
      last_crawled: null,
      item_count: 0,
      error_count: 0,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('💾 准备导入RSS源到数据库...');

    // 批量插入，使用upsert避免重复
    const { data, error } = await supabase
      .from('feed_sources')
      .upsert(feedSources, { 
        onConflict: 'url',
        ignoreDuplicates: true 
      })
      .select();

    if (error) {
      console.error('❌ 导入RSS源失败:', error);
      throw error;
    }

    console.log(`🎉 成功导入 ${rssSources.length} 个RSS源到数据库！`);
    
    // 显示统计信息
    const { data: totalSources } = await supabase
      .from('feed_sources')
      .select('id', { count: 'exact' });

    const { data: activeSources } = await supabase
      .from('feed_sources')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    console.log('\n📊 数据库RSS源统计:');
    console.log(`   总数: ${totalSources?.length || 0}`);
    console.log(`   活跃: ${activeSources?.length || 0}`);

    // 按分类统计
    const { data: categories } = await supabase
      .from('feed_sources')
      .select('category')
      .eq('is_active', true);

    if (categories) {
      const categoryStats = categories.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n📂 分类统计:');
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    }

    console.log('\n📋 下一步操作:');
    console.log('1. 运行: npm run collect-rss 开始收集RSS数据');
    console.log('2. 运行: npm run dev 启动应用');

  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

importRSSSourcesFromFile(); 