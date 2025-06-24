"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectData = collectData;
const supabase_js_1 = require("@supabase/supabase-js");
const fs = __importStar(require("fs"));
const crawlers_1 = require("../src/crawlers");
const SOURCE_CONFIGS = {
    'arxiv': {
        maxResults: 18, // ✅ 工作正常 - 学术论文，质量高
        timeout: 10,
        priority: 'high',
        status: 'working',
        description: '📚 学术论文 - 高质量研究内容'
    },
    'github': {
        maxResults: 12, // ✅ 工作正常 - 开源项目
        timeout: 10,
        priority: 'high',
        status: 'working',
        description: '🐙 开源项目 - 热门AI/ML项目'
    },
    'rss': {
        maxResults: 25, // ⚠️ 部分RSS源可能不稳定，但总体可用
        timeout: 12,
        priority: 'high',
        status: 'partial', // 使用更可靠的RSS源
        description: '📰 技术博客 - 丰富的技术观点和趋势'
    },
    'papers-with-code': {
        maxResults: 5, // ❌ API不稳定 - 减少依赖
        timeout: 8,
        priority: 'low',
        status: 'unstable',
        description: '🔬 ML论文+代码 - 实用研究 (备用)'
    },
    'stackoverflow': {
        maxResults: 5, // ❌ API问题 - 减少依赖
        timeout: 6,
        priority: 'low',
        status: 'unstable',
        description: '💬 技术问答 - 精选高质量问题 (备用)'
    }
};
// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        sources: 'all',
        maxResults: null, // 使用源配置的默认值
        timeout: 25,
        verbose: false,
        useSourceConfig: true,
        continueOnError: true // 新增：错误时继续执行
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--sources=')) {
            options.sources = arg.split('=')[1];
        }
        else if (arg.startsWith('--max-results=')) {
            options.maxResults = parseInt(arg.split('=')[1]);
            options.useSourceConfig = false;
        }
        else if (arg.startsWith('--timeout=')) {
            options.timeout = parseInt(arg.split('=')[1]);
        }
        else if (arg === '--verbose') {
            options.verbose = true;
        }
        else if (arg === '--uniform-config') {
            options.useSourceConfig = false;
        }
        else if (arg === '--fail-fast') {
            options.continueOnError = false;
        }
    }
    return options;
}
// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    const logMessage = `${timestamp} ${prefix} ${message}`;
    console.log(logMessage);
    try {
        fs.appendFileSync('collection_log.txt', logMessage + '\n');
    }
    catch (error) {
        // 忽略文件写入错误
    }
}
async function collectData() {
    const options = parseArgs();
    log(`开始 AI 日报数据收集`, 'info');
    log(`配置: ${JSON.stringify(options)}`, 'info');
    // 检查环境变量
    const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    for (const env of requiredEnvs) {
        if (!process.env[env]) {
            log(`缺少必需的环境变量: ${env}`, 'error');
            if (!options.continueOnError) {
                process.exit(1);
            }
            log('继续执行但跳过数据保存...', 'info');
            break;
        }
    }
    const stats = {
        total: 0,
        success: 0,
        errors: 0,
        sources: {},
        crawlerSuccess: 0,
        saveErrors: 0
    };
    try {
        const timeoutMs = options.timeout * 1000;
        const startTime = Date.now();
        log(`设置执行超时: ${options.timeout} 秒`, 'info');
        // 初始化 Supabase（使用 try-catch 包装）
        let supabase = null;
        let canSaveToDatabase = false;
        try {
            if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
                const supabaseUrl = process.env.SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
                log(`Supabase URL: ${supabaseUrl}`, 'info');
                log(`使用的密钥类型: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}`, 'info');
                supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
                // 测试连接
                try {
                    log('开始测试数据库连接...', 'info');
                    const { data, error } = await supabase.from('articles').select('count').limit(1);
                    if (error) {
                        log(`数据库连接测试失败: ${error.message}`, 'error');
                        log(`连接错误详情: ${JSON.stringify(error)}`, 'error');
                        throw error;
                    }
                    log('数据库连接测试成功', 'success');
                    canSaveToDatabase = true;
                }
                catch (connError) {
                    log(`数据库连接失败: ${connError instanceof Error ? connError.message : 'Unknown connection error'}`, 'error');
                    log(`连接错误完整信息: ${JSON.stringify(connError)}`, 'error');
                    if (!options.continueOnError) {
                        throw connError;
                    }
                    log('继续执行爬虫测试（跳过数据保存）...', 'info');
                }
                log('Supabase 客户端初始化成功', 'success');
            }
            else {
                log('Supabase 环境变量缺失，将只运行爬虫测试', 'info');
                log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '已设置' : '未设置'}`, 'info');
                log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置'}`, 'info');
                log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置'}`, 'info');
            }
        }
        catch (error) {
            log(`Supabase 初始化失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            if (options.verbose) {
                log(`初始化错误详情: ${JSON.stringify(error)}`, 'error');
            }
            if (!options.continueOnError) {
                throw error;
            }
            log('继续执行爬虫测试...', 'info');
        }
        // 确定要爬取的源
        const allSources = ['arxiv', 'github', 'rss', 'papers-with-code', 'stackoverflow'];
        const targetSources = options.sources === 'all'
            ? allSources
            : options.sources.split(',').map(s => s.trim()).filter(s => s.length > 0);
        log(`目标爬取源: ${targetSources.join(', ')}`, 'info');
        // 显示智能配置信息
        if (options.useSourceConfig) {
            log('使用智能源配置:', 'info');
            targetSources.forEach(source => {
                const config = SOURCE_CONFIGS[source];
                if (config) {
                    log(`  ${source}: ${config.maxResults}篇 - ${config.description}`, 'info');
                }
            });
        }
        // 创建爬虫实例
        const crawlers = {};
        for (const source of targetSources) {
            try {
                switch (source) {
                    case 'arxiv':
                        crawlers[source] = new crawlers_1.ArxivCrawler();
                        break;
                    case 'github':
                        crawlers[source] = new crawlers_1.GitHubCrawler();
                        break;
                    case 'rss':
                        crawlers[source] = new crawlers_1.RSSCrawler();
                        break;
                    case 'papers-with-code':
                        crawlers[source] = new crawlers_1.PapersWithCodeCrawler({ useMockData: true }); // 使用模拟数据
                        break;
                    case 'stackoverflow':
                        crawlers[source] = new crawlers_1.StackOverflowCrawler();
                        break;
                    default:
                        log(`未支持的爬虫源: ${source}`, 'error');
                        continue;
                }
                log(`${source} 爬虫实例创建成功`, 'success');
            }
            catch (error) {
                log(`创建 ${source} 爬虫失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                stats.errors++;
                if (!options.continueOnError) {
                    throw error;
                }
            }
        }
        // 并发执行爬取任务
        const crawlerPromises = Object.entries(crawlers).map(async ([source, crawler]) => {
            const sourceStats = { total: 0, success: 0, errors: 0, crawlerError: false };
            stats.sources[source] = sourceStats;
            try {
                // 获取该源的配置
                const sourceConfig = SOURCE_CONFIGS[source];
                const maxResults = options.useSourceConfig && sourceConfig
                    ? sourceConfig.maxResults
                    : (options.maxResults || 10);
                log(`开始爬取 ${source} (${maxResults}篇)`, 'info');
                let results = [];
                // 根据不同源调用对应的方法
                switch (source) {
                    case 'arxiv': {
                        const arxivResults = await crawler.fetchLatestAIPapers(maxResults);
                        // 展平多个分类的结果
                        for (const [category, result] of Object.entries(arxivResults)) {
                            if (result.success && result.papers) {
                                results.push(...result.papers.slice(0, Math.ceil(maxResults / 5)).map((paper) => ({
                                    title: paper.title,
                                    url: paper.abstractUrl || paper.pdfUrl, // 使用正确的URL字段
                                    description: paper.summary,
                                    author: paper.authors.join(', '),
                                    publishedDate: paper.published.toISOString(),
                                    category: category,
                                    tags: paper.categories || [],
                                    source: 'arxiv',
                                    arxivId: paper.id // 添加 ArXiv ID
                                })));
                            }
                        }
                        break;
                    }
                    case 'github': {
                        const githubResult = await crawler.searchRepositories('machine learning', 'stars', 'desc', maxResults);
                        if (githubResult.success && githubResult.repositories) {
                            results = githubResult.repositories.map((repo) => ({
                                title: repo.fullName,
                                url: repo.url, // 使用正确的URL字段
                                description: repo.content || repo.description || '',
                                author: repo.owner.login,
                                publishedDate: repo.updatedAt, // 使用updatedAt而不是publishedAt
                                category: 'GitHub项目',
                                tags: repo.topics || [],
                                source: 'github',
                                repoId: repo.owner.id // 使用owner.id，这是真正的数字ID
                            }));
                        }
                        break;
                    }
                    case 'rss': {
                        const rssFeeds = crawler.getAIRSSFeeds();
                        const feedResults = await crawler.fetchMultipleRSSFeeds(rssFeeds);
                        for (const [feedName, feedResult] of Object.entries(feedResults)) {
                            if (feedResult.success && feedResult.items) {
                                const itemsToAdd = feedResult.items.slice(0, Math.ceil(maxResults / Object.keys(rssFeeds).length));
                                results.push(...itemsToAdd.map((item) => ({
                                    title: item.title,
                                    url: item.link, // 使用正确的URL字段
                                    description: (item.description || item.content || '').substring(0, 500) + (((item.description || item.content || '').length > 500) ? '...' : ''),
                                    author: item.author || feedName,
                                    publishedDate: item.pubDate ? item.pubDate.toISOString() : new Date().toISOString(),
                                    category: 'RSS文章',
                                    tags: item.categories || [],
                                    source: 'rss'
                                })));
                            }
                        }
                        break;
                    }
                    case 'papers-with-code': {
                        const papersResult = await crawler.getAIPapers(maxResults);
                        if (papersResult.success && papersResult.papers) {
                            results = papersResult.papers.map((paper) => ({
                                title: paper.title,
                                url: paper.url,
                                description: paper.abstract,
                                author: paper.authors.join(', '),
                                publishedDate: paper.publishedAt.toISOString(),
                                category: 'ML论文',
                                tags: paper.tasks || [],
                                source: 'papers-with-code'
                            }));
                        }
                        break;
                    }
                    case 'stackoverflow': {
                        const soResult = await crawler.getAIQuestions(maxResults);
                        if (soResult.success && soResult.questions) {
                            results = soResult.questions.map((question) => ({
                                title: question.title,
                                url: question.url,
                                description: question.excerpt || question.body?.substring(0, 500) || '',
                                author: question.owner.displayName,
                                publishedDate: question.creationDate.toISOString(),
                                category: 'Stack Overflow',
                                tags: question.tags || [],
                                source: 'stackoverflow'
                            }));
                        }
                        break;
                    }
                    default:
                        throw new Error(`未支持的爬虫源: ${source}`);
                }
                sourceStats.total = results.length;
                stats.crawlerSuccess += results.length;
                if (results.length === 0) {
                    log(`${source}: 没有获取到数据`, 'info');
                    return;
                }
                // 如果可以保存到数据库，则保存数据
                if (canSaveToDatabase && supabase) {
                    for (const item of results) {
                        try {
                            if (Date.now() - startTime > timeoutMs) {
                                throw new Error('执行超时');
                            }
                            // 生成唯一的内容ID和文章ID
                            const crypto = require('crypto');
                            const urlHash = crypto.createHash('md5').update(item.url).digest('hex').substring(0, 16);
                            const contentId = `${item.source}_${urlHash}`; // 使用hash缩短长度
                            const articleId = `${item.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            // 准备基础数据
                            const articleData = {
                                id: articleId,
                                title: item.title,
                                summary: item.description || '',
                                category: item.category || 'general',
                                author: item.author || '',
                                publish_time: item.publishedDate ? new Date(item.publishedDate).toISOString() : new Date().toISOString(),
                                source_url: item.url,
                                source_type: item.source,
                                content_id: contentId,
                                tags: item.tags || [],
                                is_new: true,
                                is_hot: false,
                                views: 0,
                                likes: 0,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };
                            // 为特定源添加额外字段
                            if (item.source === 'arxiv' && item.arxivId) {
                                articleData.arxiv_id = item.arxivId;
                                if (options.verbose) {
                                    log(`${source}: 添加ArXiv ID: ${item.arxivId}`, 'info');
                                }
                            }
                            if (item.source === 'github' && item.repoId) {
                                // GitHub repo_id 暂时设为null，因为我们当前使用的是hash字符串而不是数字ID
                                articleData.repo_id = null;
                                if (options.verbose) {
                                    log(`${source}: GitHub仓库hash: ${item.repoId}`, 'info');
                                }
                            }
                            // 数据验证
                            const requiredFields = ['id', 'title', 'source_url', 'source_type', 'content_id'];
                            const missingFields = requiredFields.filter(field => !articleData[field]);
                            if (missingFields.length > 0) {
                                log(`${source}: 数据验证失败，缺少必需字段: ${missingFields.join(', ')}`, 'error');
                                if (options.verbose) {
                                    log(`完整数据: ${JSON.stringify(articleData, null, 2)}`, 'error');
                                }
                                throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
                            }
                            // 新的表结构使用更合理的字段长度，只做基本的长度检查
                            if (articleData.title && articleData.title.length > 1000) {
                                articleData.title = articleData.title.substring(0, 997) + '...';
                                log(`${source}: 标题过长，已截断`, 'info');
                            }
                            if (articleData.summary && articleData.summary.length > 5000) {
                                articleData.summary = articleData.summary.substring(0, 4997) + '...';
                                log(`${source}: 摘要过长，已截断`, 'info');
                            }
                            if (articleData.category && articleData.category.length > 100) {
                                articleData.category = articleData.category.substring(0, 97) + '...';
                                log(`${source}: 分类名称过长，已截断`, 'info');
                            }
                            // 详细调试信息
                            if (options.verbose) {
                                log(`${source}: 准备保存文章数据: ${JSON.stringify({
                                    id: articleData.id,
                                    title: articleData.title.substring(0, 50) + '...',
                                    content_id: articleData.content_id,
                                    source_type: articleData.source_type
                                })}`, 'info');
                            }
                            // 先尝试查找是否已存在相同内容
                            const { data: existingData } = await supabase
                                .from('articles')
                                .select('id')
                                .eq('content_id', articleData.content_id)
                                .limit(1);
                            let data, error;
                            if (existingData && existingData.length > 0) {
                                // 如果存在，更新现有记录
                                const { data: updateData, error: updateError } = await supabase
                                    .from('articles')
                                    .update(articleData)
                                    .eq('content_id', articleData.content_id)
                                    .select();
                                data = updateData;
                                error = updateError;
                                if (options.verbose && !error) {
                                    log(`${source}: 更新已存在的文章`, 'info');
                                }
                            }
                            else {
                                // 如果不存在，插入新记录
                                const { data: insertData, error: insertError } = await supabase
                                    .from('articles')
                                    .insert([articleData])
                                    .select();
                                data = insertData;
                                error = insertError;
                                if (options.verbose && !error) {
                                    log(`${source}: 插入新文章`, 'info');
                                }
                            }
                            if (error) {
                                // 详细的错误信息
                                log(`${source}: Supabase错误详情:`, 'error');
                                log(`  - 错误代码: ${error.code}`, 'error');
                                log(`  - 错误消息: ${error.message}`, 'error');
                                log(`  - 错误详情: ${JSON.stringify(error.details)}`, 'error');
                                log(`  - 错误提示: ${error.hint}`, 'error');
                                log(`  - 尝试插入的数据: ${JSON.stringify(articleData, null, 2)}`, 'error');
                                throw error;
                            }
                            if (options.verbose && data) {
                                log(`${source}: 数据库返回: ${JSON.stringify(data)}`, 'info');
                            }
                            sourceStats.success++;
                            stats.success++;
                            if (options.verbose) {
                                log(`${source}: 保存文章 "${item.title}"`, 'success');
                            }
                        }
                        catch (error) {
                            sourceStats.errors++;
                            stats.errors++;
                            stats.saveErrors++;
                            // 详细错误日志 - 始终显示基本信息
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            log(`${source}: 保存文章失败 - ${errorMessage}`, 'error');
                            log(`${source}: 失败文章标题: "${item.title}"`, 'error');
                            log(`${source}: 失败文章URL: ${item.url}`, 'error');
                            // 详细的错误信息
                            if (error instanceof Error) {
                                log(`${source}: 错误类型: ${error.constructor.name}`, 'error');
                                if (error.stack) {
                                    log(`${source}: 错误堆栈: ${error.stack}`, 'error');
                                }
                            }
                            // 输出完整的错误对象
                            try {
                                log(`${source}: 完整错误对象: ${JSON.stringify(error, null, 2)}`, 'error');
                            }
                            catch (jsonError) {
                                log(`${source}: 无法序列化错误对象: ${String(error)}`, 'error');
                            }
                            // 如果是 Supabase 错误，显示更多信息
                            if (error && typeof error === 'object') {
                                if ('code' in error) {
                                    const code = error.code;
                                    log(`${source}: Supabase错误代码: ${code}`, 'error');
                                    if (code === '23505') {
                                        log(`${source}: 解决方案 - 唯一约束冲突，可能是重复数据`, 'error');
                                    }
                                    else if (code === '23502') {
                                        log(`${source}: 解决方案 - 非空约束违反，检查必需字段`, 'error');
                                    }
                                    else if (code === '23503') {
                                        log(`${source}: 解决方案 - 外键约束违反，检查分类是否存在`, 'error');
                                    }
                                    else if (code === 'PGRST116') {
                                        log(`${source}: 解决方案 - 权限问题，检查RLS策略`, 'error');
                                    }
                                    else {
                                        log(`${source}: 解决方案 - 未知错误代码: ${code}`, 'error');
                                    }
                                }
                                if ('message' in error) {
                                    log(`${source}: Supabase错误消息: ${error.message}`, 'error');
                                }
                                if ('details' in error) {
                                    log(`${source}: Supabase错误详情: ${JSON.stringify(error.details)}`, 'error');
                                }
                                if ('hint' in error) {
                                    log(`${source}: Supabase错误提示: ${error.hint}`, 'error');
                                }
                            }
                            // 如果不是 continue-on-error 模式，在连续多次保存失败时停止
                            if (!options.continueOnError && sourceStats.errors > 5) {
                                log(`${source}: 连续保存失败，停止该源的数据保存`, 'error');
                                break;
                            }
                        }
                    }
                }
                else {
                    // 模拟保存成功，只用于测试
                    sourceStats.success = results.length;
                    stats.success += results.length;
                    log(`${source}: 测试模式 - 模拟保存 ${results.length} 篇文章`, 'info');
                }
                stats.total += sourceStats.total;
                log(`${source} 完成: ${sourceStats.success}/${sourceStats.total} 成功`, 'success');
            }
            catch (error) {
                sourceStats.errors++;
                stats.errors++;
                log(`${source} 爬取失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                if (!options.continueOnError) {
                    throw error;
                }
            }
        });
        await Promise.allSettled(crawlerPromises);
        // 输出最终统计
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log('', 'info');
        log('=== 执行完成 ===', 'info');
        log(`总执行时间: ${duration} 秒`, 'info');
        log(`爬虫获取: ${stats.crawlerSuccess} 篇文章`, 'info');
        log(`成功保存: ${stats.success}`, 'info');
        log(`保存失败: ${stats.saveErrors}`, 'info');
        log(`爬虫失败: ${stats.errors - stats.saveErrors}`, 'info');
        log('', 'info');
        // 按源统计
        log('📊 各源收集统计:', 'info');
        for (const [source, sourceStats] of Object.entries(stats.sources)) {
            const config = SOURCE_CONFIGS[source];
            const configInfo = config ? ` (配置:${config.maxResults})` : '';
            const errorInfo = sourceStats.crawlerError ? ' [爬虫错误]' : '';
            log(`${source}: ${sourceStats.success}/${sourceStats.total} 成功${configInfo}${errorInfo}`, 'info');
        }
        // 写入最终统计到文件
        const finalStats = generateFinalStats(stats, duration);
        try {
            fs.writeFileSync('collection_log.txt', finalStats);
        }
        catch (error) {
            // 忽略文件写入错误
        }
        // 根据选项决定退出码
        if (options.continueOnError) {
            // 如果设置了 continue-on-error，只有在没有任何数据被爬取时才失败
            if (stats.crawlerSuccess === 0) {
                log('没有成功爬取任何数据', 'error');
                process.exit(1);
            }
            else {
                log(`虽然有 ${stats.errors} 个错误，但成功获取了 ${stats.crawlerSuccess} 篇文章`, 'info');
            }
        }
        else if (stats.errors > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        log(`数据收集过程中发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        console.error(error);
        process.exit(1);
    }
}
function generateFinalStats(stats, duration) {
    return `
🎯 AI日报数据收集统计

执行时间: ${duration} 秒
爬虫获取: ${stats.crawlerSuccess} 篇
成功保存: ${stats.success}
保存失败: ${stats.saveErrors}
爬虫失败: ${stats.errors - stats.saveErrors}

📊 各源详细统计:
${Object.entries(stats.sources).map(([source, sourceStats]) => {
        const config = SOURCE_CONFIGS[source];
        const errorInfo = sourceStats.crawlerError ? ' [爬虫API错误]' : '';
        return `${source}: ${sourceStats.success}/${sourceStats.total} 成功 (配置:${config?.maxResults || 'N/A'})${errorInfo} - ${config?.description || ''}`;
    }).join('\n')}

📈 每日预期收集量 (早晚各一次):
${Object.entries(SOURCE_CONFIGS).map(([source, config]) => {
        const status = config.status === 'working' ? '✅' : config.status === 'partial' ? '⚠️' : '❌';
        return `${status} ${source}: ${config.maxResults} × 2 = ${config.maxResults * 2}篇/天 (${config.status})`;
    }).join('\n')}

🎯 可靠源总预期: ${Object.values(SOURCE_CONFIGS)
        .filter(config => config.status === 'working' || config.status === 'partial')
        .reduce((sum, config) => sum + config.maxResults * 2, 0)}篇/天

📊 按优先级分布:
- 高优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'high').length} 个源
- 中优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'medium').length} 个源  
- 低优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'low').length} 个源
`;
}
if (require.main === module) {
    collectData().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
