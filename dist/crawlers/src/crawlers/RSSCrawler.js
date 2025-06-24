"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSSCrawler = void 0;
const crypto_1 = __importDefault(require("crypto"));
// @ts-ignore - rss-parser doesn't have official TypeScript types
const rss_parser_1 = __importDefault(require("rss-parser"));
const BaseCrawler_1 = require("./BaseCrawler");
class RSSCrawler extends BaseCrawler_1.BaseCrawler {
    constructor(options = {}) {
        super('RSSCrawler', options);
        this.parser = new rss_parser_1.default({
            timeout: this.options.timeout || 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                ...this.options.headers
            }
        });
    }
    async crawl(url, sourceInfo = {}) {
        try {
            if (!url) {
                throw new Error('RSS URL is required');
            }
            console.log(`开始爬取RSS源: ${url}`);
            const parsedFeed = await this.parser.parseURL(url);
            console.log(`RSS源标题: ${parsedFeed.title}`);
            console.log(`获取到 ${parsedFeed.items.length} 条内容`);
            const items = parsedFeed.items.map(item => {
                // 生成内容ID
                const id = this.generateContentId(item.link || item.guid);
                return {
                    id,
                    title: item.title || '',
                    description: item.content || item.contentSnippet || item.summary || '',
                    link: item.link || '',
                    pubDate: item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : new Date()),
                    author: item.creator || item.author,
                    categories: item.categories || [],
                    guid: item.guid,
                    content: item.content,
                    contentSnippet: item.contentSnippet,
                    checksum: this.calculateChecksum(item.content || item.contentSnippet || item.title || '')
                };
            });
            const feed = {
                title: parsedFeed.title || '',
                description: parsedFeed.description || '',
                link: parsedFeed.link || '',
                language: parsedFeed.language,
                lastBuildDate: parsedFeed.lastBuildDate ? new Date(parsedFeed.lastBuildDate) : undefined,
                items
            };
            return this.createResult(feed, true, undefined, {
                feedUrl: url,
                sourceId: sourceInfo.sourceId || this.generateSourceId(url),
                itemCount: items.length
            });
        }
        catch (error) {
            const message = `RSS爬取失败 ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(message);
            const emptyFeed = {
                title: '',
                description: '',
                link: '',
                items: []
            };
            return this.createResult(emptyFeed, false, message);
        }
    }
    // 批量爬取多个RSS源
    async fetchMultipleRSSFeeds(rssUrls) {
        const results = {};
        for (const [name, url] of Object.entries(rssUrls)) {
            try {
                console.log(`正在处理RSS源: ${name}...`);
                results[name] = await this.crawl(url, { sourceId: name });
                // 延迟，避免频繁请求
                await this.sleep(this.options.delay || 1000);
            }
            catch (error) {
                console.error(`处理RSS源失败 ${name}:`, error);
                const emptyFeed = {
                    title: '',
                    description: '',
                    link: '',
                    items: []
                };
                results[name] = this.createResult(emptyFeed, false, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        return results;
    }
    // 生成内容ID
    generateContentId(url) {
        if (!url) {
            return crypto_1.default.randomUUID();
        }
        return crypto_1.default.createHash('md5').update(url).digest('hex');
    }
    // 生成源ID
    generateSourceId(url) {
        return crypto_1.default.createHash('md5').update(url).digest('hex').substring(0, 8);
    }
    // 获取AI相关的RSS源列表
    getAIRSSFeeds() {
        return {
            'Google AI Blog': 'http://googleaiblog.blogspot.com/atom.xml',
            'OpenAI Blog': 'https://openai.com/blog/rss.xml',
            'Microsoft Research Blog': 'https://www.microsoft.com/en-us/research/feed/',
            'KDnuggets': 'https://www.kdnuggets.com/feed',
            'Analytics Vidhya': 'https://www.analyticsvidhya.com/blog/feed/',
            'AI News': 'https://artificialintelligence-news.com/feed/',
            'Synced': 'https://syncedreview.com/feed/',
            'VentureBeat AI': 'https://venturebeat.com/ai/feed/'
        };
    }
    // 获取测试用的RSS源
    getTestRSSFeeds() {
        return {
            'Google AI Blog': 'http://googleaiblog.blogspot.com/atom.xml',
            'AI News': 'https://artificialintelligence-news.com/feed/'
        };
    }
    // 测试单个RSS源
    async testRSSFeed(url) {
        console.log(`测试RSS源: ${url}`);
        const result = await this.crawl(url);
        if (result.success && result.data) {
            console.log('✅ RSS源测试成功');
            console.log(`   - 订阅源: ${result.data.title}`);
            console.log(`   - 描述: ${result.data.description}`);
            console.log(`   - 链接: ${result.data.link}`);
            console.log(`   - 文章数量: ${result.data.items.length}`);
            if (result.data.items.length > 0) {
                console.log(`   - 示例文章: ${result.data.items[0].title}`);
                console.log(`   - 发布时间: ${result.data.items[0].pubDate}`);
            }
        }
        else {
            console.log('❌ RSS源测试失败');
            console.log(`   - 错误: ${result.error}`);
        }
        return result;
    }
    // 测试所有预定义的AI RSS源
    async testAllAIRSSFeeds() {
        console.log('开始测试所有AI相关RSS源...\n');
        const rssFeeds = this.getAIRSSFeeds();
        const results = await this.fetchMultipleRSSFeeds(rssFeeds);
        console.log('\n=== 测试结果汇总 ===');
        let successCount = 0;
        let totalItems = 0;
        for (const [name, result] of Object.entries(results)) {
            if (result.success && result.data) {
                successCount++;
                totalItems += result.data.items.length;
                console.log(`✅ ${name}: ${result.data.items.length} 篇文章`);
            }
            else {
                console.log(`❌ ${name}: ${result.error}`);
            }
        }
        console.log(`\n总计: ${successCount}/${Object.keys(rssFeeds).length} 个源成功, 共获取 ${totalItems} 篇文章`);
        return results;
    }
}
exports.RSSCrawler = RSSCrawler;
