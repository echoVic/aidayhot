import { supabase } from './supabaseClient';

async function activateRecommendedSources() {
  console.log('🚀 激活推荐的信息源（不包含Anthropic）...\n');

  const recommendedSources = [
    {
      name: 'Google AI Blog',
      url: 'https://blog.google/technology/ai/rss/',
      category: 'AI/机器学习'
    },
    {
      name: 'OpenAI News',
      url: 'https://openai.com/news/rss.xml',
      category: 'AI/机器学习'
    },
    {
      name: 'Berkeley AI Research',
      url: 'https://bair.berkeley.edu/blog/feed.xml',
      category: 'AI/机器学习'
    },
    {
      name: 'Google DeepMind Blog',
      url: 'https://deepmind.com/blog/feed/basic/',
      category: 'AI/机器学习'
    },
    {
      name: '量子位',
      url: 'https://www.qbitai.com/feed',
      category: 'AI/机器学习'
    },
    {
      name: 'AWS Machine Learning Blog',
      url: 'https://aws.amazon.com/blogs/amazon-ai/feed/',
      category: '技术/开发'
    },
    {
      name: 'Engineering at Meta',
      url: 'https://engineering.fb.com/feed/',
      category: '技术/开发'
    },
    {
      name: 'Google Developers Blog',
      url: 'https://developers.googleblog.com/feeds/posts/default',
      category: '技术/开发'
    },
    {
      name: 'Microsoft Azure Blog',
      url: 'https://azure.microsoft.com/en-us/blog/feed/',
      category: '技术/开发'
    },
    {
      name: 'Hugging Face Blog',
      url: 'https://huggingface.co/blog/feed.xml',
      category: 'AI/机器学习'
    },
    {
      name: 'Apple Machine Learning Research',
      url: 'https://machinelearning.apple.com/rss.xml',
      category: 'AI/机器学习'
    }
  ];

  let activatedCount = 0;
  let updatedCount = 0;

  for (const source of recommendedSources) {
    console.log(`📡 处理: ${source.name}`);
    
    try {
      // 检查是否已存在
      const { data: existingSource, error: checkError } = await supabase
        .from('feed_sources')
        .select('id, is_active')
        .eq('url', source.url)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log(`   ❌ 查询失败: ${checkError.message}`);
        continue;
      }

      if (existingSource) {
        // 更新现有记录
        const { error: updateError } = await supabase
          .from('feed_sources')
          .update({
            is_active: true,
            category: source.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSource.id);

        if (updateError) {
          console.log(`   ❌ 更新失败: ${updateError.message}`);
        } else {
          console.log(`   ✅ 已激活 (更新现有记录)`);
          updatedCount++;
        }
      } else {
        // 插入新记录
        const { error: insertError } = await supabase
          .from('feed_sources')
          .insert({
            name: source.name,
            url: source.url,
            category: source.category,
            is_active: true
          });

        if (insertError) {
          console.log(`   ❌ 插入失败: ${insertError.message}`);
        } else {
          console.log(`   ✅ 已激活 (新增记录)`);
          activatedCount++;
        }
      }
    } catch (error) {
      console.log(`   ❌ 处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  console.log('\n📊 激活结果总结:');
  console.log(`✅ 新增激活: ${activatedCount} 个`);
  console.log(`🔄 更新激活: ${updatedCount} 个`);
  console.log(`📈 总计处理: ${activatedCount + updatedCount} 个信息源`);

  // 验证激活状态
  console.log('\n🔍 验证激活状态:');
  const { data: activeSources, error: verifyError } = await supabase
    .from('feed_sources')
    .select('name, category, is_active')
    .eq('is_active', true)
    .in('url', recommendedSources.map(s => s.url));

  if (verifyError) {
    console.log(`❌ 验证失败: ${verifyError.message}`);
  } else if (activeSources) {
    console.log(`✅ 成功激活 ${activeSources.length} 个信息源:`);
    activeSources.forEach(source => {
      console.log(`   - ${source.name} (${source.category})`);
    });
  }

  // 显示当前激活的信息源统计
  console.log('\n📈 当前激活信息源统计:');
  const { data: allActiveSources, error: statsError } = await supabase
    .from('feed_sources')
    .select('category')
    .eq('is_active', true);

  if (!statsError && allActiveSources) {
    const categoryStats = allActiveSources.reduce((acc, source) => {
      const category = source.category || '其他';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 个`);
    });
  }
}

// 运行激活
activateRecommendedSources(); 