# GitHub Actions 中使用 GitHub Models 指南

本文档介绍如何在GitHub Actions工作流中配置和使用GitHub Models AI服务。

## 🎯 概述

项目的GitHub Actions工作流现已支持GitHub Models AI服务，可以在自动执行和手动触发时灵活选择AI服务提供商。

## 🔧 配置方法

### 方法1: 使用Repository Secrets (推荐)

在GitHub仓库的Settings > Secrets and variables > Actions中添加以下secrets:

| Secret名称 | 描述 | 示例值 |
|-----------|------|--------|
| `AI_SERVICE` | 默认AI服务类型 | `github-models` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_MODELS_MODEL` | 使用的模型名称 | `gpt-4o-mini` |

**注意**: `GITHUB_TOKEN` 通常已经自动提供，但如果需要特定权限，可能需要自定义Token。

### 方法2: 手动触发时选择

1. 访问仓库的 Actions 页面
2. 选择 "Generate Daily AI Report" 工作流
3. 点击 "Run workflow"
4. 在 "AI服务选择" 下拉菜单中选择:
   - `volcengine`: 使用火山引擎AI服务
   - `github-models`: 使用GitHub Models服务
5. 配置其他参数后点击 "Run workflow"

## 📋 环境变量优先级

工作流中的环境变量按以下优先级设置:

1. **用户输入** (手动触发时的选择)
2. **Repository Secrets** (在Settings中配置的值)
3. **默认值** (`volcengine`)

```yaml
AI_SERVICE: ${{ github.event.inputs.ai_service || secrets.AI_SERVICE || 'volcengine' }}
```

## 🚀 工作流配置详解

### 输入参数

```yaml
workflow_dispatch:
  inputs:
    ai_service:
      description: 'AI服务选择'
      required: false
      default: 'volcengine'
      type: choice
      options:
        - volcengine
        - github-models
```

### 环境变量配置

```yaml
env:
  # AI服务配置
  AI_SERVICE: ${{ github.event.inputs.ai_service || secrets.AI_SERVICE || 'volcengine' }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GITHUB_MODELS_MODEL: ${{ secrets.GITHUB_MODELS_MODEL || 'gpt-4o-mini' }}
  
  # 火山引擎配置 (向后兼容)
  VOLCENGINE_API_KEY: ${{ secrets.VOLCENGINE_API_KEY }}
  VOLCENGINE_MODEL: ${{ secrets.VOLCENGINE_MODEL }}
```

## 🔍 运行日志

工作流运行时会显示当前使用的AI服务:

```
🚀 开始生成AI日报...
🤖 AI服务: github-models
⏰ 时间范围: 过去 24 小时
📊 GitHub/ArXiv每源文章数: 3
📰 RSS每源文章数: 3
🎯 数据源类型: all
```

## 🛠️ 故障排除

### 常见问题

#### Q: 提示 "GITHUB_TOKEN" 未设置
**A**: 
1. 检查Repository Secrets中是否有 `GITHUB_TOKEN`
2. 如果没有，GitHub Actions通常会自动提供 `${{ secrets.GITHUB_TOKEN }}`
3. 确保Token有足够的权限访问GitHub Models

#### Q: GitHub Models API调用失败
**A**: 
1. 确认GitHub账号有GitHub Models访问权限
2. 检查Token权限是否正确
3. 验证模型名称是否正确 (如 `gpt-4o-mini`)
4. 查看是否达到免费额度限制

#### Q: 工作流仍然使用火山引擎AI
**A**: 
1. 检查 `AI_SERVICE` 环境变量是否正确设置
2. 确认手动触发时选择了 `github-models`
3. 查看工作流日志中的 "🤖 AI服务" 输出

### 调试步骤

1. **检查环境变量**:
   ```yaml
   - name: Debug Environment
     run: |
       echo "AI_SERVICE: $AI_SERVICE"
       echo "GITHUB_TOKEN length: ${#GITHUB_TOKEN}"
       echo "GITHUB_MODELS_MODEL: $GITHUB_MODELS_MODEL"
   ```

2. **测试GitHub Models连接**:
   ```yaml
   - name: Test GitHub Models
     run: pnpm tsx scripts/testGitHubModels.ts
   ```

## 📊 性能对比

| 特性 | 火山引擎AI | GitHub Models |
|------|------------|---------------|
| 成本 | 付费 | 免费 (有限额) |
| 设置复杂度 | 需要API Key | 使用GitHub Token |
| 在GitHub Actions中 | 需要配置Secrets | 可使用内置Token |
| 模型选择 | 有限 | 多种选择 |
| 稳定性 | 高 | 中等 |
| 免费额度 | 无 | 有限制 |

## 🔄 迁移建议

### 渐进式迁移

1. **阶段1**: 保持默认使用火山引擎AI，偶尔手动测试GitHub Models
2. **阶段2**: 设置 `AI_SERVICE=github-models` 作为默认值
3. **阶段3**: 完全迁移到GitHub Models，移除火山引擎配置

### 混合使用策略

```yaml
# 工作日使用GitHub Models (免费)
# 周末使用火山引擎AI (付费但稳定)
AI_SERVICE: ${{ 
  github.event.schedule && 
  (github.event.schedule == '0 0 * * 1-5') && 
  'github-models' || 
  'volcengine' 
}}
```

## 📝 最佳实践

1. **监控使用量**: 定期检查GitHub Models的使用情况，避免超出免费额度
2. **备用方案**: 保持火山引擎AI配置作为备用
3. **模型选择**: 推荐使用 `gpt-4o-mini` 获得最佳性价比
4. **错误处理**: 利用现有的降级策略处理API失败
5. **日志监控**: 关注工作流日志中的AI服务类型和错误信息

## 🔗 相关文档

- [GitHub Models 集成指南](./GITHUB_MODELS_SETUP.md)
- [GitHub Actions 使用指南](./GITHUB_ACTIONS_GUIDE.md)
- [GitHub Models 官方文档](https://docs.github.com/en/github-models)
- [GitHub Actions Secrets 管理](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 📅 更新日志

- **2025-01-XX**: 初始版本，支持GitHub Models集成
- **2025-01-XX**: 添加手动触发AI服务选择
- **2025-01-XX**: 完善故障排除和最佳实践指南