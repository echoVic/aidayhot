const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// 手动加载环境变量
function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

// 加载环境变量
loadEnvVariables();

// 导入爬虫
const ArxivCrawler = require('../src/crawlers/arxivCrawler.js');
const GitHubCrawler = require('../src/crawlers/githubCrawler.js');
const RSSCrawler = require('../src/crawlers/rssCrawler.js');

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 环境变量检查:');
console.log('   SUPABASE_URL:', supabaseUrl ? '已配置' : '❌ 未配置');
console.log('   SERVICE_KEY:', supabaseServiceKey ? '已配置' : '❌ 未配置');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 初始化爬虫
const arxivCrawler = new ArxivCrawler();
const githubCrawler = new GitHubCrawler(process.env.GITHUB_TOKEN); // 可选的GitHub token
const rssCrawler = new RSSCrawler();

// 定义分类映射
const categoryMap = {
  '人工智能': 'ai',
  '机器学习': 'ml', 
  '自然语言处理': 'nlp',
  '计算机视觉': 'cv',
  '神经网络': 'nn',
  'GitHub仓库': 'github',
  'AI博客': 'blog',
  '技术新闻': 'news'
};

// 初始化分类数据
async function initializeCategories() {
  console.log('📂 初始化分类数据...');
  
  const categories = [
    { name: '人工智能', description: 'AI相关论文和资讯', slug: 'ai' },
    { name: '机器学习', description: '机器学习算法和应用', slug: 'ml' },
    { name: '自然语言处理', description: 'NLP技术和模型', slug: 'nlp' },
    { name: '计算机视觉', description: '计算机视觉和图像处理', slug: 'cv' },
    { name: '神经网络', description: '神经网络和深度学习', slug: 'nn' },
    { name: 'GitHub仓库', description: '热门的AI相关开源项目', slug: 'github' },
    { name: 'AI博客', description: 'AI技术博客和文章', slug: 'blog' },
    { name: '技术新闻', description: '最新的AI技术新闻', slug: 'news' }
  ];

  try {
    // 检查是否已有分类
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('name');

    if (existingCategories && existingCategories.length > 0) {
      console.log('✅ 分类已存在，跳过初始化');
      return true;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (error) throw error;

    console.log(`✅ 成功初始化 ${data.length} 个分类`);
    return true;
  } catch (error) {
    console.error('❌ 分类初始化失败:', error);
    return false;
  }
}

// 转换 ArXiv 论文数据格式
function transformArxivData(paper, category) {
  return {
    id: paper.contentId,
    title: paper.title,
    summary: paper.summary,
    category: category,
    author: paper.authors.join(', ').substring(0, 95) + (paper.authors.join(', ').length > 95 ? '...' : ''),
    publish_time: paper.published.toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
    read_time: `${Math.ceil(paper.summary.length / 200)}分钟`, // 格式化为字符串
    views: Math.floor(Math.random() * 1000) + 100,
    likes: Math.floor(Math.random() * 50) + 10,
    tags: paper.categories,
    image_url: `https://picsum.photos/400/300?random=${paper.contentId}`,
    is_hot: Math.random() > 0.8,
    is_new: true,
    source_url: paper.originalUrl,
    source_type: 'arxiv',
    content_id: paper.contentId,
    arxiv_id: paper.arxivId,
    metadata: {
      authors: paper.authors,
      categories: paper.categories,
      pdfUrl: paper.pdfUrl,
      ...paper.metadata
    }
  };
}

// 转换 GitHub 仓库数据格式
function transformGithubData(repo) {
  const description = repo.content || repo.readmeContent?.substring(0, 500) || '无描述';
  
  return {
    id: repo.contentId,
    title: `${repo.fullName} - ${repo.title}`,
    summary: description,
    category: 'GitHub仓库'.substring(0, 45),
    author: repo.owner.login,
    publish_time: new Date(repo.publishedAt).toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
    read_time: `${Math.ceil(description.length / 200)}分钟`, // 格式化为字符串
    views: repo.watchers || 0,
    likes: repo.stars || 0,
    tags: repo.topics || [],
    image_url: repo.owner.avatarUrl || `https://picsum.photos/400/300?random=${repo.contentId}`,
    is_hot: repo.stars > 1000,
    is_new: (new Date() - new Date(repo.updatedAt)) < 7 * 24 * 60 * 60 * 1000, // 7天内更新
    source_url: repo.originalUrl,
    source_type: 'github',
    content_id: repo.contentId,
    repo_id: repo.repoId,
    metadata: {
      fullName: repo.fullName,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      topics: repo.topics,
      license: repo.license,
      ...repo.metadata
    }
  };
}

// 转换 RSS 数据格式
function transformRSSData(item, sourceCategory) {
  const content = item.content || '';
  const summary = content.length > 300 ? content.substring(0, 300) + '...' : content;
  const publishDate = item.publishedAt ? new Date(item.publishedAt) : new Date();
  
  return {
    id: item.contentId,
    title: item.title,
    summary: summary,
    category: sourceCategory,
    author: item.author || '未知作者',
    publish_time: publishDate.toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
    read_time: `${Math.ceil(content.length / 200)}分钟`, // 格式化为字符串
    views: Math.floor(Math.random() * 500) + 50,
    likes: Math.floor(Math.random() * 20) + 5,
    tags: item.metadata?.categories || [],
    image_url: `https://picsum.photos/400/300?random=${item.contentId}`,
    is_hot: Math.random() > 0.85,
    is_new: true,
    source_url: item.originalUrl,
    source_type: 'rss',
    content_id: item.contentId,
    metadata: {
      feedTitle: item.metadata?.feedTitle,
      feedDescription: item.metadata?.feedDescription,
      guid: item.metadata?.guid
    }
  };
}

// 爬取 ArXiv 论文
async function collectArxivPapers() {
  console.log('📖 开始爬取 ArXiv 论文...');
  
  try {
    const results = await arxivCrawler.fetchLatestAIPapers(20); // 每个分类20篇
    let totalInserted = 0;

    for (const [categoryName, result] of Object.entries(results)) {
      if (!result.success) {
        console.log(`❌ ${categoryName} 爬取失败: ${result.error}`);
        continue;
      }

      console.log(`📝 处理 ${categoryName}: ${result.papers.length} 篇论文`);

      const articles = result.papers.map(paper => 
        transformArxivData(paper, categoryName)
      );

      if (articles.length > 0) {
        const { data, error } = await supabase
          .from('articles')
          .insert(articles)
          .select();

        if (error) {
          console.error(`❌ ${categoryName} 插入失败:`, error);
        } else {
          totalInserted += data.length;
          console.log(`✅ ${categoryName}: 成功插入 ${data.length} 篇论文`);
        }
      }

      // 延迟避免频繁请求
      await delay(2000);
    }

    console.log(`📖 ArXiv 爬取完成，总计插入 ${totalInserted} 篇论文`);
    return totalInserted;
  } catch (error) {
    console.error('❌ ArXiv 爬取失败:', error);
    return 0;
  }
}

// 爬取 GitHub 仓库
async function collectGithubRepos() {
  console.log('🔗 开始爬取 GitHub 仓库...');
  
  try {
    const aiQueries = [
      'machine learning stars:>1000',
      'deep learning stars:>500',
      'natural language processing stars:>300',
      'computer vision stars:>300',
      'artificial intelligence stars:>500'
    ];

    let totalInserted = 0;

    for (const query of aiQueries) {
      console.log(`🔍 搜索: ${query}`);
      
      const result = await githubCrawler.searchRepositories(query, 'stars', 'desc', 10);
      
      if (!result.success) {
        console.log(`❌ GitHub搜索失败: ${result.error}`);
        continue;
      }

      const articles = result.repositories.map(repo => 
        transformGithubData(repo)
      );

      if (articles.length > 0) {
        const { data, error } = await supabase
          .from('articles')
          .insert(articles)
          .select();

        if (error) {
          console.error(`❌ GitHub插入失败:`, error);
        } else {
          totalInserted += data.length;
          console.log(`✅ 成功插入 ${data.length} 个仓库`);
        }
      }

      // 延迟避免API限制
      await delay(3000);
    }

    console.log(`🔗 GitHub 爬取完成，总计插入 ${totalInserted} 个仓库`);
    return totalInserted;
  } catch (error) {
    console.error('❌ GitHub 爬取失败:', error);
    return 0;
  }
}

// 爬取 RSS 订阅源
async function collectRSSFeeds() {
  console.log('📰 开始爬取 RSS 订阅源...');
  
  try {
    const rssFeeds = rssCrawler.getAIRSSFeeds();
    const results = await rssCrawler.fetchMultipleRSSFeeds(rssFeeds);
    let totalInserted = 0;

    for (const [sourceName, result] of Object.entries(results)) {
      if (!result.success) {
        console.log(`❌ ${sourceName} 爬取失败: ${result.error}`);
        continue;
      }

      console.log(`📄 处理 ${sourceName}: ${result.items.length} 篇文章`);

      // 只取最新的10篇文章
      const recentItems = result.items.slice(0, 10);
      const articles = recentItems.map(item => 
        transformRSSData(item, 'AI博客')
      );

      if (articles.length > 0) {
        const { data, error } = await supabase
          .from('articles')
          .insert(articles)
          .select();

        if (error) {
          console.error(`❌ ${sourceName} 插入失败:`, error);
        } else {
          totalInserted += data.length;
          console.log(`✅ ${sourceName}: 成功插入 ${data.length} 篇文章`);
        }
      }

      // 延迟避免频繁请求
      await delay(1000);
    }

    console.log(`📰 RSS 爬取完成，总计插入 ${totalInserted} 篇文章`);
    return totalInserted;
  } catch (error) {
    console.error('❌ RSS 爬取失败:', error);
    return 0;
  }
}

// 清理旧数据（可选）
async function cleanOldData(daysToKeep = 30) {
  console.log(`🧹 清理 ${daysToKeep} 天前的数据...`);
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('articles')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;

    console.log(`🧹 成功清理 ${data?.length || 0} 条旧数据`);
  } catch (error) {
    console.error('❌ 清理数据失败:', error);
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('🚀 开始数据采集任务...\n');

  // 检查环境变量
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
    console.log('在项目根目录创建 .env.local 文件，添加：');
    console.log('NEXT_PUBLIC_SUPABASE_URL=你的项目URL');
    console.log('SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥');
    console.log('GITHUB_TOKEN=你的GitHub令牌（可选）');
    process.exit(1);
  }

  console.log('🔗 连接到 Supabase:', supabaseUrl);

  try {
    // 测试连接
    const { error: connectionError } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Supabase 连接失败:', connectionError);
      process.exit(1);
    }

    console.log('✅ Supabase 连接成功\n');

    // 1. 初始化分类
    const categoriesSuccess = await initializeCategories();
    if (!categoriesSuccess) {
      console.error('❌ 分类初始化失败');
      process.exit(1);
    }

    // 2. 清理旧数据（可选）
    // await cleanOldData(30);

    // 3. 爬取数据
    let totalArticles = 0;
    
    // ArXiv 论文
    totalArticles += await collectArxivPapers();
    
    // GitHub 仓库
    totalArticles += await collectGithubRepos();
    
    // RSS 订阅源
    totalArticles += await collectRSSFeeds();

    console.log('\n🎉 数据采集完成！');
    console.log(`📊 总计采集文章: ${totalArticles} 篇`);
    console.log('');
    console.log('🚀 下一步：');
    console.log('1. 启动开发服务器：pnpm dev');
    console.log('2. 查看网站：http://localhost:3000');
    console.log('3. 测试搜索和筛选功能');

  } catch (error) {
    console.error('❌ 数据采集失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  collectArxivPapers, 
  collectGithubRepos, 
  collectRSSFeeds,
  initializeCategories 
}; 