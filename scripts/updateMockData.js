const fs = require('fs');
const path = require('path');

// 导入爬虫模块
const RSSCrawler = require('../src/crawlers/rssCrawler.js');
const ArxivCrawler = require('../src/crawlers/arxivCrawler.js');
const GitHubCrawler = require('../src/crawlers/githubCrawler.js');
const StackOverflowCrawler = require('../src/crawlers/stackOverflowCrawler.js');
const PapersWithCodeCrawler = require('../src/crawlers/papersWithCodeCrawler.js');
const SocialMediaCrawler = require('../src/crawlers/socialMediaCrawler.js');
const WebCrawler = require('../src/crawlers/webCrawler.js');
const VideoCrawler = require('../src/crawlers/videoCrawler.js');

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// 工具函数：生成阅读时间
function estimateReadTime(content) {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200); // 假设每分钟200字
    return `${minutes}分钟`;
}

// 工具函数：生成随机浏览量和点赞数
function generateStats() {
    return {
        views: Math.floor(Math.random() * 50000) + 1000,
        likes: Math.floor(Math.random() * 2000) + 100
    };
}

// 工具函数：将内容转换为文章格式
function convertToArticle(content, index) {
    const stats = generateStats();
    const categories = ['大模型', 'AI芯片', '开源AI', '自动驾驶', 'AI绘画', '办公AI', '科学AI', '机器学习', '计算机视觉'];
    const authors = ['AI研究员', '技术专家', '开源贡献者', '学术研究者', '科技记者', '产品经理'];
    
    let category = '机器学习';
    let tags = ['AI', '技术'];
    
    // 根据内容类型和标题智能分类
    const title = content.title || content.content || '未知标题';
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('gpt') || titleLower.includes('language model') || titleLower.includes('llm')) {
        category = '大模型';
        tags = ['大模型', 'LLM', 'GPT'];
    } else if (titleLower.includes('chip') || titleLower.includes('gpu') || titleLower.includes('tpu')) {
        category = 'AI芯片';
        tags = ['AI芯片', '硬件', 'GPU'];
    } else if (titleLower.includes('open source') || titleLower.includes('开源')) {
        category = '开源AI';
        tags = ['开源', 'GitHub', '社区'];
    } else if (titleLower.includes('autonomous') || titleLower.includes('self-driving')) {
        category = '自动驾驶';
        tags = ['自动驾驶', '汽车', '机器人'];
    } else if (titleLower.includes('image') || titleLower.includes('vision') || titleLower.includes('stable diffusion')) {
        category = 'AI绘画';
        tags = ['AI绘画', '计算机视觉', '生成模型'];
    } else if (titleLower.includes('office') || titleLower.includes('productivity')) {
        category = '办公AI';
        tags = ['办公助手', '生产力', '工具'];
    } else if (titleLower.includes('research') || titleLower.includes('paper')) {
        category = '科学AI';
        tags = ['科学研究', '论文', '学术'];
    } else if (titleLower.includes('computer vision') || titleLower.includes('cv')) {
        category = '计算机视觉';
        tags = ['计算机视觉', 'CV', '图像处理'];
    }

    return {
        id: (index + 1).toString(),
        title: title.length > 80 ? title.substring(0, 80) + '...' : title,
        summary: content.content || content.summary || content.description || '暂无描述',
        category,
        author: authors[Math.floor(Math.random() * authors.length)],
        publishTime: formatDate(content.publishedAt || content.crawledAt || new Date().toISOString()),
        readTime: estimateReadTime(content.content || content.summary || ''),
        views: stats.views,
        likes: stats.likes,
        tags,
        imageUrl: getImageUrl(category),
        isHot: stats.views > 15000,
        isNew: new Date(content.publishedAt || content.crawledAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };
}

// 工具函数：根据分类获取图片URL
function getImageUrl(category) {
    const imageMap = {
        '大模型': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        'AI芯片': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
        '开源AI': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
        '自动驾驶': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=400&fit=crop',
        'AI绘画': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
        '办公AI': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
        '科学AI': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        '机器学习': 'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop',
        '计算机视觉': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
    };
    return imageMap[category] || imageMap['机器学习'];
}

// 主函数：获取真实数据并更新mockData
async function updateMockDataWithRealData() {
    console.log('🚀 开始获取真实AI数据...\n');
    
    const allData = [];
    
    try {
        // 1. RSS数据
        console.log('📰 获取RSS数据...');
        const rssCrawler = new RSSCrawler();
        const rssResults = await rssCrawler.testAllAIRSSFeeds();
        const rssData = [];
        for (const [name, result] of Object.entries(rssResults)) {
            if (result.success && result.items) {
                rssData.push(...result.items.slice(0, 1)); // 每个源取1条
            }
        }
        console.log(`✅ RSS数据: ${rssData.length} 条`);
        allData.push(...rssData.slice(0, 3)); // 总共取前3条
        
        // 2. arXiv论文数据
        console.log('📚 获取arXiv论文数据...');
        const arxivCrawler = new ArxivCrawler();
        const arxivResult = await arxivCrawler.searchPapers('machine learning', 2);
        const arxivData = arxivResult.success ? arxivResult.papers : [];
        console.log(`✅ arXiv数据: ${arxivData.length} 条`);
        allData.push(...arxivData.slice(0, 2)); // 取前2条
        
        // 3. GitHub项目数据
        console.log('💻 获取GitHub项目数据...');
        const githubCrawler = new GitHubCrawler();
        const githubResult = await githubCrawler.searchRepositories('artificial intelligence', 2);
        const githubData = githubResult.success ? githubResult.repositories : [];
        console.log(`✅ GitHub数据: ${githubData.length} 条`);
        allData.push(...githubData.slice(0, 1)); // 取前1条
        
        // 4. Papers with Code数据 
        console.log('🔬 获取Papers with Code数据...');
        const pwcCrawler = new PapersWithCodeCrawler();
        const pwcResult = await pwcCrawler.getAIPapers();
        const pwcData = pwcResult || [];
        console.log(`✅ Papers with Code数据: ${pwcData.length} 条`);
        allData.push(...pwcData.slice(0, 1)); // 取前1条
        
        // 5. Stack Overflow数据
        console.log('💬 获取Stack Overflow数据...');
        const stackCrawler = new StackOverflowCrawler();
        const stackResult = await stackCrawler.getAIQuestions();
        const stackData = stackResult.success ? stackResult.questions : [];
        console.log(`✅ Stack Overflow数据: ${stackData.length} 条`);
        allData.push(...stackData.slice(0, 1)); // 取前1条
        
    } catch (error) {
        console.error('❌ 获取数据时发生错误:', error.message);
        console.log('⚠️  使用模拟数据继续...');
    }
    
    // 转换为文章格式
    console.log('\n🔄 转换数据格式...');
    const articles = allData.map((item, index) => convertToArticle(item, index));
    
    // 确保至少有8篇文章
    while (articles.length < 8) {
        const mockArticle = {
            id: (articles.length + 1).toString(),
            title: `AI技术发展趋势第${articles.length + 1}期`,
            summary: '人工智能技术正在快速发展，本文探讨了最新的技术趋势和应用场景，为读者提供全面的AI行业洞察。',
            category: '机器学习',
            author: 'AI研究员',
            publishTime: formatDate(new Date().toISOString()),
            readTime: '5分钟',
            views: Math.floor(Math.random() * 20000) + 5000,
            likes: Math.floor(Math.random() * 1000) + 200,
            tags: ['AI', '技术趋势', '机器学习'],
            imageUrl: 'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop',
            isHot: false,
            isNew: true
        };
        articles.push(mockArticle);
    }
    
    // 更新分类统计
    const categoryStats = {};
    articles.forEach(article => {
        categoryStats[article.category] = (categoryStats[article.category] || 0) + 1;
    });
    
    const categories = [
        { name: '全部', href: '/', count: articles.length * 50 },
        { name: '大模型', href: '/category/llm', count: (categoryStats['大模型'] || 0) * 20 },
        { name: 'AI芯片', href: '/category/chip', count: (categoryStats['AI芯片'] || 0) * 15 },
        { name: '自动驾驶', href: '/category/auto', count: (categoryStats['自动驾驶'] || 0) * 18 },
        { name: '开源AI', href: '/category/opensource', count: (categoryStats['开源AI'] || 0) * 25 },
        { name: 'AI绘画', href: '/category/aiart', count: (categoryStats['AI绘画'] || 0) * 12 },
        { name: '办公AI', href: '/category/office', count: (categoryStats['办公AI'] || 0) * 10 },
        { name: '科学AI', href: '/category/science', count: (categoryStats['科学AI'] || 0) * 8 },
        { name: '机器学习', href: '/category/ml', count: (categoryStats['机器学习'] || 0) * 30 },
        { name: '计算机视觉', href: '/category/cv', count: (categoryStats['计算机视觉'] || 0) * 22 }
    ];
    
    // 生成新的mockData.ts内容
    const mockDataContent = `// 基于真实AI数据生成的内容
export const mockArticles = ${JSON.stringify(articles, null, 2)};

export const categories = ${JSON.stringify(categories, null, 2)};
`;
    
    // 写入文件
    const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
    fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
    
    console.log('\n✅ 成功更新mockData.ts文件！');
    console.log(`📊 统计信息:`);
    console.log(`   - 总文章数: ${articles.length}`);
    console.log(`   - 分类分布:`, categoryStats);
    console.log(`   - 热门文章: ${articles.filter(a => a.isHot).length}`);
    console.log(`   - 最新文章: ${articles.filter(a => a.isNew).length}`);
    
    return articles;
}

// 如果直接运行此脚本
if (require.main === module) {
    updateMockDataWithRealData()
        .then(articles => {
            console.log('\n🎉 数据更新完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ 更新失败:', error);
            process.exit(1);
        });
}

module.exports = { updateMockDataWithRealData }; 