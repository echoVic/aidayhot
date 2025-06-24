/**
 * 编译 TypeScript 爬虫为 JavaScript
 * 用于 GitHub Actions 和生产环境
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
};

async function compileCrawlers() {
  log('开始编译 TypeScript 爬虫...');
  
  try {
    // 创建 dist 目录
    const distCrawlersDir = path.join(__dirname, '../dist/crawlers');
    const distScriptsDir = path.join(__dirname, '../dist/scripts');
    if (!fs.existsSync(distCrawlersDir)) {
      fs.mkdirSync(distCrawlersDir, { recursive: true });
      log('创建 dist/crawlers 目录');
    }
    if (!fs.existsSync(distScriptsDir)) {
      fs.mkdirSync(distScriptsDir, { recursive: true });
      log('创建 dist/scripts 目录');
    }

    // 爬虫 TS 文件
    const crawlerFiles = [
      'src/crawlers/types.ts',
      'src/crawlers/BaseCrawler.ts', 
      'src/crawlers/ArxivCrawler.ts',
      'src/crawlers/GitHubCrawler.ts',
      'src/crawlers/RSSCrawler.ts',
      'src/crawlers/PapersWithCodeCrawler.ts',
      'src/crawlers/StackOverflowCrawler.ts'
    ];

    // 脚本 TS 文件
    const scriptFiles = [
      'scripts/collectDataToSupabase.ts'
    ];

    // 编译爬虫文件
    const crawlerTscOptions = [
      '--outDir dist/crawlers',
      '--module commonjs', 
      '--target es2020',
      '--esModuleInterop true',
      '--allowSyntheticDefaultImports true',
      '--skipLibCheck true',
      '--declaration false'
    ].join(' ');

    for (const tsFile of crawlerFiles) {
      const filePath = path.join(__dirname, '../', tsFile);
      
      if (!fs.existsSync(filePath)) {
        log(`跳过不存在的文件: ${tsFile}`, 'error');
        continue;
      }

      log(`编译 ${tsFile}...`);
      
      const command = `npx tsc ${tsFile} ${crawlerTscOptions}`;
      
      await new Promise((resolve, reject) => {
        exec(command, { cwd: path.join(__dirname, '../') }, (error, stdout, stderr) => {
          if (error) {
            log(`编译 ${tsFile} 失败: ${error.message}`, 'error');
            reject(error);
          } else {
            log(`编译 ${tsFile} 成功`, 'success');
            resolve();
          }
        });
      });
    }

    // 编译脚本文件
    const scriptTscOptions = [
      '--outDir dist/scripts',
      '--module commonjs', 
      '--target es2020',
      '--esModuleInterop true',
      '--allowSyntheticDefaultImports true',
      '--skipLibCheck true',
      '--declaration false'
    ].join(' ');

    for (const tsFile of scriptFiles) {
      const filePath = path.join(__dirname, '../', tsFile);
      
      if (!fs.existsSync(filePath)) {
        log(`跳过不存在的文件: ${tsFile}`, 'error');
        continue;
      }

      log(`编译 ${tsFile}...`);
      
      const command = `npx tsc ${tsFile} ${scriptTscOptions}`;
      
      await new Promise((resolve, reject) => {
        exec(command, { cwd: path.join(__dirname, '../') }, (error, stdout, stderr) => {
          if (error) {
            log(`编译 ${tsFile} 失败: ${error.message}`, 'error');
            reject(error);
          } else {
            log(`编译 ${tsFile} 成功`, 'success');
            resolve();
          }
        });
      });
    }

    // 验证编译结果
    const expectedJSFiles = [
      'dist/crawlers/types.js',
      'dist/crawlers/BaseCrawler.js',
      'dist/crawlers/ArxivCrawler.js', 
      'dist/crawlers/GitHubCrawler.js',
      'dist/crawlers/RSSCrawler.js',
      'dist/crawlers/PapersWithCodeCrawler.js',
      'dist/crawlers/StackOverflowCrawler.js',
      'dist/crawlers/index.js',
      'dist/scripts/collectDataToSupabase.js'
    ];

    let allFilesExist = true;
    for (const jsFile of expectedJSFiles) {
      const filePath = path.join(__dirname, '../', jsFile);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        log(`✓ ${jsFile} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        log(`✗ ${jsFile} 不存在`, 'error');
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      log('🎉 所有爬虫编译成功！', 'success');
      log('编译后的文件可用于 GitHub Actions 和生产环境');
    } else {
      throw new Error('部分文件编译失败');
    }

  } catch (error) {
    log(`编译过程失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  compileCrawlers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { compileCrawlers }; 