/**
 * GitHub Models AI 服务测试脚本
 * 用于验证GitHub Models API集成是否正常工作
 */

import { createGitHubModelsAI } from '../src/services/githubModelsAI';

// 加载环境变量
if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_ACTIONS) {
  const dotenv = require('dotenv');
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env.local');
  try {
    dotenv.config({ path: envPath });
    console.log('🔧 从 .env.local 加载环境变量');
  } catch (error) {
    console.log('🔧 使用系统环境变量');
  }
}

async function testGitHubModels() {
  console.log('🧪 开始测试 GitHub Models AI 服务...');
  
  // 检查环境变量
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;
  const githubModel = process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini';
  
  if (!githubToken) {
    console.error('❌ 缺少 GITHUB_TOKEN 环境变量');
    console.log('💡 请在 .env.local 文件中设置 GITHUB_TOKEN');
    console.log('💡 获取方式: https://github.com/settings/tokens');
    process.exit(1);
  }
  
  console.log(`🔑 使用模型: ${githubModel}`);
  console.log(`🔑 Token长度: ${githubToken.length} 字符`);
  
  try {
    // 创建GitHub Models AI实例
    const githubModelsAI = createGitHubModelsAI({
      token: githubToken,
      model: githubModel
    });
    
    console.log('✅ GitHub Models AI 实例创建成功');
    
    // 测试数据
    const testArticles = [
      {
        title: 'OpenAI发布GPT-4 Turbo新版本',
        description: 'OpenAI宣布推出GPT-4 Turbo的最新版本，具有更强的推理能力和更低的成本。',
        content: 'OpenAI今天宣布推出GPT-4 Turbo的最新版本，这个版本在保持高质量输出的同时，显著降低了API调用成本。新版本还增强了代码生成和数学推理能力。',
        url: 'https://example.com/openai-gpt4-turbo',
        category: 'AI/机器学习',
        source: 'OpenAI官方博客',
        publishTime: new Date().toISOString()
      },
      {
        title: 'GitHub Copilot集成新的AI模型',
        description: 'GitHub Copilot现在支持多种AI模型，为开发者提供更好的代码建议。',
        content: 'GitHub宣布Copilot现在集成了多种先进的AI模型，包括GPT-4和Claude，开发者可以根据需要选择不同的模型来获得最佳的代码建议和自动补全体验。',
        url: 'https://example.com/github-copilot-update',
        category: '技术/开发',
        source: 'GitHub官方博客',
        publishTime: new Date().toISOString()
      }
    ];
    
    console.log('\n📝 测试文章摘要生成...');
    
    // 测试单篇文章摘要
    console.log('\n1️⃣ 测试单篇文章摘要:');
    const singleSummary = await githubModelsAI.generateArticleSummary(testArticles[0]);
    console.log(`✅ 单篇摘要生成成功:`);
    console.log(`   ${singleSummary}`);
    
    // 测试批量文章摘要
    console.log('\n2️⃣ 测试批量文章摘要:');
    const batchSummaries = await githubModelsAI.generateArticleSummaries(testArticles);
    console.log(`✅ 批量摘要生成成功:`);
    Object.entries(batchSummaries).forEach(([url, summary], index) => {
      console.log(`   文章${index + 1}: ${summary.substring(0, 100)}...`);
    });
    
    // 测试整体摘要
    console.log('\n3️⃣ 测试整体日报摘要:');
    const overallSummary = await githubModelsAI.generateOverallSummary(testArticles, batchSummaries);
    console.log(`✅ 整体摘要生成成功:`);
    console.log(`   ${overallSummary}`);
    
    // 测试标题生成
    console.log('\n4️⃣ 测试日报标题生成:');
    const title = await githubModelsAI.generateTitle(testArticles);
    console.log(`✅ 标题生成成功:`);
    console.log(`   ${title}`);
    
    console.log('\n🎉 所有测试通过！GitHub Models AI 服务工作正常');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('💡 可能的原因: GitHub Token无效或权限不足');
        console.log('💡 请检查Token是否正确，并确保有访问GitHub Models的权限');
      } else if (error.message.includes('403')) {
        console.log('💡 可能的原因: API调用频率限制或权限不足');
        console.log('💡 请稍后重试或检查GitHub Models服务状态');
      } else if (error.message.includes('404')) {
        console.log('💡 可能的原因: 模型不存在或API端点错误');
        console.log(`💡 请检查模型名称: ${githubModel}`);
      }
    }
    
    process.exit(1);
  }
}

// 运行测试
testGitHubModels().catch(console.error);