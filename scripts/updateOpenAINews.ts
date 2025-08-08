import * as fs from 'fs';
import { RSSCrawler } from '../src/crawlers';
import { supabase } from './supabaseClient';

interface ParsedArgs {
  hoursBack: number;
  verbose: boolean;
  maxResults: number;
  dryRun: boolean;
}

interface UpdateStats {
  crawled: number;
  new: number;
  updated: number;
  errors: number;
  filtered: number;
}

// OpenAI RSS源配置
const OPENAI_RSS_CONFIGS = [
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    fallbackUrl: 'https://openai.com/blog/rss.xml' // 备用URL，支持重定向
  }
];

// 分类映射
const CATEGORY_MAPPING: Record<string, string> = {
  'OpenAI News': 'AI/机器学习',
  'OpenAI Blog': 'AI/机器学习',
  'RSS文章': 'AI/机器学习',
  '人工智能': 'AI/机器学习',
  'AI技术': 'AI/机器学习'
};

// 解析命令行参数
function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const options: ParsedArgs = {
    hoursBack: 24, // 默认拉取过去24小时的文章
    verbose: false,
    maxResults: 50,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--hours-back=')) {
      options.hoursBack = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--max-results=')) {
      options.maxResults = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--last-12h') {
      options.hoursBack = 12;
    } else if (arg === '--last-6h') {
      options.hoursBack = 6;
    } else if (arg === '--all') {
      options.hoursBack = 0; // 不使用时间过滤
    }
  }

  return options;
}

// 日志函数
function log(message: string, type: 'info' | 'error' | 'success' | 'warn' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefixMap = {
    'error': '❌',
    'success': '✅', 
    'warn': '⚠️',
    'info': 'ℹ️'
  };
  const prefix = prefixMap[type];
  const logMessage = `${timestamp} ${prefix} [OpenAI] ${message}`;
  
  console.log(logMessage);
  
  try {
    fs.appendFileSync('openai_update_log.txt', logMessage + '\n');
  } catch (error) {
    // 忽略文件写入错误
  }
}

// 计算时间范围
function calculateTimeRange(hoursBack: number): { fromTime: Date; toTime: Date } | null {
  if (hoursBack <= 0) {
    return null; // 不使用时间过滤
  }
  
  const toTime = new Date();
  const fromTime = new Date(toTime.getTime() - hoursBack * 60 * 60 * 1000);
  
  return { fromTime, toTime };
}

// 生成内容ID和文章ID
function generateIds(url: string, source: string): { contentId: string; articleId: string } {
  const crypto = require('crypto');
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
  const contentId = `${source}_${urlHash}`;
  const articleId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return { contentId, articleId };
}

// 主要更新函数
async function updateOpenAINews(): Promise<void> {
  const options = parseArgs();
  const stats: UpdateStats = {
    crawled: 0,
    new: 0,
    updated: 0,
    errors: 0,
    filtered: 0
  };

  log(`开始更新 OpenAI News`);
  log(`配置: ${JSON.stringify(options)}`);

  if (options.dryRun) {
    log('🧪 运行模式：预览模式 (不会实际保存到数据库)', 'warn');
  }

  try {
    // 检查数据库连接
    if (!supabase) {
      throw new Error('Supabase 客户端未初始化，请检查环境变量配置');
    }

    log('数据库连接检查通过', 'success');

    // 计算时间范围
    const timeRange = calculateTimeRange(options.hoursBack);
    if (timeRange) {
      log(`时间过滤: ${timeRange.fromTime.toISOString()} 到 ${timeRange.toTime.toISOString()} (过去${options.hoursBack}小时)`, 'info');
    } else {
      log('时间过滤: 不限制 (获取所有文章)', 'info');
    }

    // 创建RSS爬虫
    const crawler = new RSSCrawler({
      timeout: 15000,
      delay: 1000
    });

    // 处理每个OpenAI RSS源
    for (const config of OPENAI_RSS_CONFIGS) {
      log(`开始处理源: ${config.name} - ${config.url}`, 'info');
      
      try {
        // 尝试主URL
        let rssResult;
        try {
          rssResult = await crawler.crawl(config.url, {
            sourceName: config.name,
            sourceCategory: 'AI/机器学习'
          });
        } catch (error) {
          log(`主URL失败，尝试备用URL: ${config.fallbackUrl}`, 'warn');
          rssResult = await crawler.crawl(config.fallbackUrl, {
            sourceName: config.name,
            sourceCategory: 'AI/机器学习'
          });
        }

        if (!rssResult.success || !rssResult.data) {
          log(`获取RSS源失败: ${rssResult.error}`, 'error');
          stats.errors++;
          continue;
        }

        let items = rssResult.data.items || [];
        log(`获取到 ${items.length} 篇文章`, 'info');
        stats.crawled += items.length;

        // 应用时间过滤
        if (timeRange) {
          const originalCount = items.length;
          items = items.filter((item: any) => {
            if (!item.pubDate) return false;
            const pubDate = new Date(item.pubDate);
            return pubDate >= timeRange.fromTime && pubDate <= timeRange.toTime;
          });
          stats.filtered += originalCount - items.length;
          log(`时间过滤后保留 ${items.length} 篇文章 (过滤掉 ${originalCount - items.length} 篇)`, 'info');
        }

        // 限制最大结果数
        if (items.length > options.maxResults) {
          items = items.slice(0, options.maxResults);
          log(`限制结果数为 ${options.maxResults} 篇`, 'info');
        }

        if (items.length === 0) {
          log('没有符合条件的文章', 'warn');
          continue;
        }

        // 处理每篇文章
        for (const item of items) {
          try {
            if (!item.title || !item.link) {
              log(`跳过无效文章：缺少标题或链接`, 'warn');
              continue;
            }

            const { contentId, articleId } = generateIds(item.link, 'openai');
            
            // 使用分类映射
            const mappedCategory = CATEGORY_MAPPING[config.name] || CATEGORY_MAPPING['RSS文章'] || 'AI/机器学习';
            
            const articleData = {
              id: articleId,
              title: item.title.substring(0, 997), // 确保不超过长度限制
              summary: (item.description || item.content || '').substring(0, 4997),
              category: mappedCategory,
              author: item.author || 'OpenAI',
              publish_time: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              source_url: item.link,
              source_type: 'openai',
              content_id: contentId,
              tags: item.categories || ['OpenAI', '人工智能'],
              is_new: true,
              is_hot: false,
              views: 0,
              likes: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            if (options.verbose) {
              log(`准备处理文章: "${articleData.title.substring(0, 50)}..." (${item.pubDate})`);
            }

            if (options.dryRun) {
              log(`[预览] 将处理文章: "${articleData.title}"`, 'info');
              stats.new++;
              continue;
            }

            // 检查是否已存在
            const { data: existingData, error: checkError } = await Promise.race([
              supabase
                .from('articles')
                .select('id, title, updated_at')
                .eq('content_id', contentId)
                .limit(1),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('查询超时')), 10000)
              )
            ]) as any;

            if (checkError) {
              throw new Error(`查询现有文章失败: ${checkError.message}`);
            }

            let data, error;
            let isUpdate = false;

            if (existingData && existingData.length > 0) {
              // 更新现有记录
              const updateResult = await Promise.race([
                supabase
                  .from('articles')
                  .update(articleData)
                  .eq('content_id', contentId)
                  .select(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('更新超时')), 15000)
                )
              ]) as any;
              
              data = updateResult.data;
              error = updateResult.error;
              isUpdate = true;
              
              if (!error) {
                stats.updated++;
                if (options.verbose) {
                  log(`更新文章: "${articleData.title.substring(0, 50)}..."`, 'success');
                }
              }
            } else {
              // 插入新记录
              const insertResult = await Promise.race([
                supabase
                  .from('articles')
                  .insert([articleData])
                  .select(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('插入超时')), 15000)
                )
              ]) as any;
              
              data = insertResult.data;
              error = insertResult.error;
              
              if (!error) {
                stats.new++;
                if (options.verbose) {
                  log(`新增文章: "${articleData.title.substring(0, 50)}..."`, 'success');
                }
              }
            }

            if (error) {
              throw new Error(`${isUpdate ? '更新' : '插入'}文章失败: ${error.message}`);
            }

          } catch (error) {
            stats.errors++;
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            log(`处理文章失败: "${item.title}" - ${errorMessage}`, 'error');
            
            if (options.verbose) {
              log(`失败文章URL: ${item.link}`, 'error');
            }
          }
        }

      } catch (error) {
        stats.errors++;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        log(`处理RSS源失败: ${config.name} - ${errorMessage}`, 'error');
      }
    }

    // 输出统计结果
    log('', 'info');
    log('=== 更新完成 ===', 'info');
    log(`爬取文章数: ${stats.crawled}`, 'info');
    log(`时间过滤掉: ${stats.filtered}`, 'info');
    log(`新增文章: ${stats.new}`, 'success');
    log(`更新文章: ${stats.updated}`, 'success');
    log(`错误数: ${stats.errors}`, stats.errors > 0 ? 'error' : 'info');
    
    if (options.dryRun) {
      log('🧪 预览模式完成，没有实际修改数据库', 'warn');
    }

    // 显示最新文章示例（如果有的话）
    if (!options.dryRun && (stats.new > 0 || stats.updated > 0)) {
      try {
        const { data: latestArticles } = await supabase
          .from('articles')
          .select('title, publish_time, source_url')
          .eq('source_type', 'openai')
          .order('publish_time', { ascending: false })
          .limit(3);

        if (latestArticles && latestArticles.length > 0) {
          log('', 'info');
          log('📰 最新的OpenAI文章:', 'info');
          latestArticles.forEach((article, index) => {
            const publishTime = new Date(article.publish_time).toLocaleString('zh-CN');
            log(`${index + 1}. ${article.title}`, 'info');
            log(`   发布时间: ${publishTime}`, 'info');
            log(`   链接: ${article.source_url}`, 'info');
          });
        }
      } catch (error) {
        log(`获取最新文章失败: ${error}`, 'warn');
      }
    }

    // 根据结果决定退出码
    if (stats.errors > 0 && stats.new === 0 && stats.updated === 0) {
      log('更新失败：没有成功处理任何文章', 'error');
      process.exit(1);
    } else if (stats.errors > 0) {
      log(`部分成功：处理了 ${stats.new + stats.updated} 篇文章，但有 ${stats.errors} 个错误`, 'warn');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    log(`更新过程中发生严重错误: ${errorMessage}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateOpenAINews().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { updateOpenAINews };
