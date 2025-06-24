#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log(`
🤖 AI日报爬虫调度器 - 快速启动向导
═══════════════════════════════════════
`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    console.log('👋 欢迎使用 AI日报爬虫调度器！');
    console.log('本向导将帮助您快速设置和启动调度器系统。\n');

    // 检查环境变量文件
    const envPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envPath);

    if (!envExists) {
      console.log('📝 首次使用，需要创建环境变量配置文件\n');
      
      console.log('请输入您的 Supabase 配置信息：');
      const supabaseUrl = await question('🔗 Supabase URL: ');
      const supabaseKey = await question('🔑 Supabase Service Role Key: ');
      const githubToken = await question('🐙 GitHub Token (可选，按回车跳过): ');

      if (!supabaseUrl || !supabaseKey) {
        console.log('\n❌ Supabase URL 和 Service Role Key 是必需的！');
        console.log('请访问 https://supabase.com/dashboard 获取这些信息。');
        process.exit(1);
      }

      // 创建 .env.local 文件
      const envContent = `# AI日报爬虫调度器环境变量配置
# 由快速启动向导生成 - ${new Date().toISOString()}

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseKey}

# GitHub API 令牌（可选，用于提高API限制）
${githubToken ? `GITHUB_TOKEN=${githubToken}` : '# GITHUB_TOKEN=你的GitHub令牌'}

# 运行环境
NODE_ENV=development
`;

      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ 环境变量配置文件已创建！');
    } else {
      console.log('✅ 找到现有的环境变量配置文件');
    }

    // 运行测试
    console.log('\n🧪 正在运行系统测试...');
    const { spawn } = require('child_process');
    
    const testProcess = spawn('node', ['scripts/test-scheduler.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`测试失败，退出码: ${code}`));
        }
      });
    });

    // 询问用户是否要立即启动
    console.log('\n🚀 系统测试通过！');
    const shouldStart = await question('是否现在启动调度器？(y/N): ');

    if (shouldStart.toLowerCase() === 'y' || shouldStart.toLowerCase() === 'yes') {
      console.log('\n启动选项：');
      console.log('1. 开发模式（前台运行，可查看实时日志）');
      console.log('2. 后台模式（使用 PM2，适合生产环境）');
      console.log('3. 手动执行一次（测试用）');
      
      const mode = await question('请选择启动模式 (1-3): ');

      switch (mode) {
        case '1':
          console.log('\n🔄 启动开发模式...');
          console.log('💡 使用 Ctrl+C 停止调度器');
          startDevelopmentMode();
          break;
        case '2':
          console.log('\n🔄 启动生产模式（PM2）...');
          await startProductionMode();
          break;
        case '3':
          console.log('\n🔄 手动执行一次...');
          await runOnce();
          break;
        default:
          showManualInstructions();
          break;
      }
    } else {
      showManualInstructions();
    }

  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function startDevelopmentMode() {
  const { spawn } = require('child_process');
  const child = spawn('pnpm', ['run', 'scheduler:start'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('error', (error) => {
    console.error('启动失败:', error);
  });
}

async function startProductionMode() {
  const { spawn } = require('child_process');
  
  try {
    console.log('正在启动 PM2...');
    const child = spawn('pnpm', ['run', 'pm2:start'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PM2 启动失败，退出码: ${code}`));
        }
      });
    });

    console.log('\n✅ 调度器已在后台启动！');
    console.log('\n📋 常用命令：');
    console.log('  查看状态: pnpm run pm2:status');
    console.log('  查看日志: pnpm run pm2:logs');
    console.log('  停止服务: pnpm run pm2:stop');
    console.log('  重启服务: pnpm run pm2:restart');

  } catch (error) {
    console.error('PM2 启动失败:', error.message);
    console.log('\n💡 请确保已安装 PM2: npm install -g pm2');
  }
}

async function runOnce() {
  const { spawn } = require('child_process');
  
  const child = spawn('pnpm', ['run', 'scheduler:run'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  await new Promise((resolve) => {
    child.on('close', () => {
      resolve();
    });
  });

  console.log('\n✅ 手动执行完成！');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('\n📋 手动启动说明：');
  console.log('');
  console.log('🔧 开发环境：');
  console.log('  启动: pnpm run scheduler:start');
  console.log('  状态: pnpm run scheduler:status');
  console.log('  日志: pnpm run scheduler:logs');
  console.log('  停止: Ctrl+C 或 pnpm run scheduler:stop');
  console.log('');
  console.log('🚀 生产环境（PM2）：');
  console.log('  启动: pnpm run pm2:start');
  console.log('  状态: pnpm run pm2:status');
  console.log('  日志: pnpm run pm2:logs');
  console.log('  停止: pnpm run pm2:stop');
  console.log('');
  console.log('🐳 Docker：');
  console.log('  构建: pnpm run docker:build');
  console.log('  启动: pnpm run docker:run');
  console.log('  日志: pnpm run docker:logs');
  console.log('  停止: pnpm run docker:stop');
  console.log('');
  console.log('📚 详细文档：请查看 SCHEDULER_GUIDE.md');
  console.log('');
  console.log('🎉 设置完成！祝您使用愉快！');
}

if (require.main === module) {
  main();
} 