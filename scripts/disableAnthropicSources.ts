import { supabase } from './supabaseClient';

async function disableAnthropicSources() {
  console.log('🚫 停用所有 Anthropic 相关的信息源...\n');

  try {
    // 查找所有包含 Anthropic 的信息源
    const { data: anthropicSources, error } = await supabase
      .from('feed_sources')
      .select('id, name, url, is_active')
      .or('name.ilike.%anthropic%,url.ilike.%anthropic%');

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    if (!anthropicSources || anthropicSources.length === 0) {
      console.log('✅ 没有找到 Anthropic 相关的信息源');
      return;
    }

    console.log(`📋 找到 ${anthropicSources.length} 个 Anthropic 相关的信息源:`);
    anthropicSources.forEach(source => {
      console.log(`   - ${source.name} (${source.url})`);
    });

    // 停用这些信息源
    const sourceIds = anthropicSources.map(s => s.id);
    const { error: updateError } = await supabase
      .from('feed_sources')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in('id', sourceIds);

    if (updateError) {
      console.error('❌ 停用失败:', updateError);
      return;
    }

    console.log(`✅ 成功停用 ${anthropicSources.length} 个 Anthropic 相关的信息源`);

    // 验证停用状态
    const { data: disabledSources, error: verifyError } = await supabase
      .from('feed_sources')
      .select('name, is_active')
      .in('id', sourceIds);

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError);
    } else if (disabledSources) {
      console.log('\n🔍 停用状态验证:');
      disabledSources.forEach(source => {
        console.log(`   - ${source.name}: ${source.is_active ? '❌ 仍激活' : '✅ 已停用'}`);
      });
    }

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 运行停用
disableAnthropicSources(); 