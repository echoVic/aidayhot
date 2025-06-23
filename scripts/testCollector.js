// 手动加载环境变量
const path = require('path');
const fs = require('fs');

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

const { 
  initializeCategories, 
  collectArxivPapers, 
  collectGithubRepos, 
  collectRSSFeeds 
} = require('./collectDataToSupabase.js');

// 测试函数
async function testDataCollection() {
  console.log('🧪 开始测试数据采集功能...\n');

  try {
    // 1. 测试分类初始化
    console.log('1️⃣ 测试分类初始化...');
    await initializeCategories();
    console.log('✅ 分类初始化测试完成\n');

    // 2. 测试 ArXiv 论文采集（小量数据）
    console.log('2️⃣ 测试 ArXiv 论文采集...');
    // 注意：这里会实际请求 ArXiv API
    const arxivCount = await testArxivCollection();
    console.log(`✅ ArXiv 测试完成，采集 ${arxivCount} 篇论文\n`);

    // 3. 测试 RSS 订阅源采集
    console.log('3️⃣ 测试 RSS 订阅源采集...');
    const rssCount = await testRSSCollection();
    console.log(`✅ RSS 测试完成，采集 ${rssCount} 篇文章\n`);

    // 4. 测试 GitHub 仓库采集
    console.log('4️⃣ 测试 GitHub 仓库采集...');
    const githubCount = await testGithubCollection();
    console.log(`✅ GitHub 测试完成，采集 ${githubCount} 个仓库\n`);

    const totalCollected = arxivCount + rssCount + githubCount;
    console.log('🎉 所有测试完成！');
    console.log(`📊 总计测试采集: ${totalCollected} 条数据`);
    console.log('\n💡 如果测试成功，可以运行：');
    console.log('   pnpm collect          # 完整数据采集');
    console.log('   pnpm collect:arxiv    # 只采集 ArXiv 论文');
    console.log('   pnpm collect:github   # 只采集 GitHub 仓库');
    console.log('   pnpm collect:rss      # 只采集 RSS 文章');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 测试 ArXiv 采集（只采集少量数据）
async function testArxivCollection() {
  try {
    const ArxivCrawler = require('../src/crawlers/arxivCrawler.js');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const arxivCrawler = new ArxivCrawler();
    
    // 只测试获取少量AI论文
    const result = await arxivCrawler.fetchArxivPapers('cat:cs.AI', 0, 3); // 只要3篇
    
    if (!result.success) {
      console.log('⚠️  ArXiv API 请求失败:', result.error);
      return 0;
    }
    
    console.log(`   📝 获取到 ${result.papers.length} 篇论文`);
    
    if (result.papers.length > 0) {
      // 转换并插入一篇测试数据
      const testPaper = result.papers[0];
              const article = {
          id: testPaper.contentId + '_test',
          title: testPaper.title,
          summary: testPaper.summary,
          category: '人工智能',
          author: testPaper.authors.join(', ').substring(0, 95) + (testPaper.authors.join(', ').length > 95 ? '...' : ''),
          publish_time: testPaper.published.toISOString().split('T')[0],
          read_time: `${Math.ceil(testPaper.summary.length / 200)}分钟`,
        views: 100,
        likes: 10,
        tags: testPaper.categories,
        image_url: `https://picsum.photos/400/300?random=${testPaper.contentId}`,
        is_hot: false,
        is_new: true,
        source_url: testPaper.originalUrl,
        source_type: 'arxiv',
        content_id: testPaper.contentId + '_test',
        arxiv_id: testPaper.arxivId,
        metadata: {
          test: true,
          authors: testPaper.authors,
          categories: testPaper.categories
        }
      };
      
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select();
      
      if (error) {
        console.log('⚠️  数据插入失败:', error.message);
        return 0;
      }
      
      console.log(`   ✅ 成功插入测试数据: ${article.title.substring(0, 50)}...`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.log('⚠️  ArXiv 测试出错:', error.message);
    return 0;
  }
}

// 测试 RSS 采集
async function testRSSCollection() {
  try {
    const RSSCrawler = require('../src/crawlers/rssCrawler.js');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const rssCrawler = new RSSCrawler();
    
    // 测试一个简单的RSS源
    const testFeeds = rssCrawler.getTestRSSFeeds();
    const sourceName = Object.keys(testFeeds)[0]; // 取第一个源
    
    console.log(`   🔍 测试 ${sourceName} RSS...`);
    
    const results = await rssCrawler.fetchMultipleRSSFeeds({ [sourceName]: testFeeds[sourceName] });
    
    if (results[sourceName]?.success) {
      const items = results[sourceName].items.slice(0, 1); // 只取1篇
      
      if (items.length > 0) {
        const item = items[0];
        const article = {
          id: item.contentId + '_test',
          title: item.title,
          summary: (item.content || '').substring(0, 300) + '...',
          category: 'AI博客',
          author: item.author || '未知作者',
          publish_time: (item.publishedAt ? new Date(item.publishedAt) : new Date()).toISOString().split('T')[0],
          read_time: '5分钟',
          views: 50,
          likes: 5,
          tags: item.metadata?.categories || [],
          image_url: `https://picsum.photos/400/300?random=${item.contentId}`,
          is_hot: false,
          is_new: true,
          source_url: item.originalUrl,
          source_type: 'rss',
          content_id: item.contentId + '_test',
          metadata: {
            test: true,
            feedTitle: item.metadata?.feedTitle
          }
        };
        
        const { data, error } = await supabase
          .from('articles')
          .insert([article])
          .select();
        
        if (error) {
          console.log('⚠️  RSS数据插入失败:', error.message);
          return 0;
        }
        
        console.log(`   ✅ 成功插入RSS测试数据: ${article.title.substring(0, 50)}...`);
        return 1;
      }
    } else {
      console.log('⚠️  RSS测试失败:', results[sourceName]?.error);
    }
    
    return 0;
  } catch (error) {
    console.log('⚠️  RSS 测试出错:', error.message);
    return 0;
  }
}

// 测试 GitHub 采集
async function testGithubCollection() {
  try {
    const GitHubCrawler = require('../src/crawlers/githubCrawler.js');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const githubCrawler = new GitHubCrawler(process.env.GITHUB_TOKEN);
    
    console.log('   🔍 测试 GitHub 仓库搜索...');
    
    // 搜索一个简单的AI相关仓库
    const result = await githubCrawler.searchRepositories('machine learning', 'stars', 'desc', 1);
    
    if (!result.success) {
      console.log('⚠️  GitHub搜索失败:', result.error);
      return 0;
    }
    
    if (result.repositories.length > 0) {
      const repo = result.repositories[0];
      const article = {
        id: repo.contentId + '_test',
        title: `${repo.fullName} - ${repo.name}`,
        summary: (repo.content || '无描述').substring(0, 300),
        category: 'GitHub仓库',
        author: repo.owner.login,
        publish_time: new Date(repo.publishedAt).toISOString().split('T')[0],
        read_time: '3分钟',
        views: repo.watchers || 0,
        likes: repo.stars || 0,
        tags: repo.topics || [],
        image_url: repo.owner.avatarUrl || `https://picsum.photos/400/300?random=${repo.contentId}`,
        is_hot: repo.stars > 1000,
        is_new: false,
        source_url: repo.originalUrl,
        source_type: 'github',
        content_id: repo.contentId + '_test',
        repo_id: repo.repoId,
        metadata: {
          test: true,
          fullName: repo.fullName,
          stars: repo.stars,
          language: repo.language
        }
      };
      
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select();
      
      if (error) {
        console.log('⚠️  GitHub数据插入失败:', error.message);
        return 0;
      }
      
      console.log(`   ✅ 成功插入GitHub测试数据: ${article.title.substring(0, 50)}...`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.log('⚠️  GitHub 测试出错:', error.message);
    return 0;
  }
}

// 运行测试
if (require.main === module) {
  testDataCollection();
}

module.exports = { testDataCollection }; 