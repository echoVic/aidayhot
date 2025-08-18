# GitHub Models AI 服务集成指南

本文档介绍如何配置和使用GitHub Models作为AI日报生成服务。

## 🌟 GitHub Models 优势

- **免费使用**: GitHub用户可免费使用多种AI模型
- **多模型支持**: 支持GPT-4o、DeepSeek-R1、Llama 3等主流模型
- **OpenAI兼容**: 完全兼容OpenAI API规范，迁移简单
- **国内可访问**: 无需科学上网，直接访问
- **GitHub集成**: 与GitHub Actions无缝集成

## 📋 前置要求

1. GitHub账号
2. GitHub Personal Access Token (PAT)
3. 访问GitHub Models服务的权限

## 🔧 配置步骤

### 1. 获取GitHub Personal Access Token

1. 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 设置Token名称，如 "AI Daily Report"
4. 选择适当的过期时间
5. 勾选必要的权限范围:
   - `repo` (如果需要访问私有仓库)
   - `read:user` (读取用户信息)
   - 其他GitHub Models相关权限
6. 点击 "Generate token"
7. **重要**: 复制并保存生成的Token，页面刷新后将无法再次查看

### 2. 配置环境变量

在 `.env.local` 文件中添加以下配置:

```bash
# AI服务选择配置
AI_SERVICE=github-models

# GitHub Models 配置
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_MODELS_MODEL=gpt-4o-mini
```

### 3. 可用模型列表

| 模型名称 | 描述 | 免费额度 |
|---------|------|----------|
| `gpt-4o` | OpenAI GPT-4o，最强性能 | 有限制 |
| `gpt-4o-mini` | GPT-4o轻量版，性价比高 | 较高额度 |
| `deepseek-r1` | DeepSeek推理模型 | 有限制 |
| `llama-3-70b-instruct` | Meta Llama 3 70B | 有限制 |
| `phi-3-medium-instruct` | Microsoft Phi-3 | 较高额度 |

**推荐**: 对于日报生成，建议使用 `gpt-4o-mini`，它提供了良好的性能和较高的免费额度。

## 🧪 测试配置

运行测试脚本验证配置是否正确:

```bash
# 安装依赖
pnpm install

# 运行GitHub Models测试
pnpm tsx scripts/testGitHubModels.ts
```

测试脚本将验证:
- ✅ Token有效性
- ✅ 模型可用性
- ✅ 文章摘要生成
- ✅ 批量处理功能
- ✅ 整体摘要生成
- ✅ 标题生成

## 🚀 使用方法

### 方法1: 环境变量切换

```bash
# 设置使用GitHub Models
export AI_SERVICE=github-models

# 运行日报生成
pnpm run generate-report
```

### 方法2: 修改.env.local

```bash
# 在.env.local中设置
AI_SERVICE=github-models
```

### 方法3: GitHub Actions中使用

在GitHub Actions workflow中:

```yaml
env:
  AI_SERVICE: github-models
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GITHUB_MODELS_MODEL: gpt-4o-mini
```

## 🔄 服务切换

项目支持在火山引擎AI和GitHub Models之间灵活切换:

```bash
# 使用火山引擎AI (默认)
AI_SERVICE=volcengine

# 使用GitHub Models
AI_SERVICE=github-models
```

## 🐛 常见问题

### Q: 提示"401 Unauthorized"错误
**A**: 检查GitHub Token是否正确设置，确保Token有效且未过期。

### Q: 提示"403 Forbidden"错误
**A**: 可能是API调用频率限制，请稍后重试，或检查是否有GitHub Models访问权限。

### Q: 提示"404 Not Found"错误
**A**: 检查模型名称是否正确，确保使用的是支持的模型。

### Q: 响应速度较慢
**A**: GitHub Models服务可能有延迟，这是正常现象。可以考虑使用更轻量的模型如`gpt-4o-mini`。

### Q: 免费额度用完了怎么办？
**A**: 
1. 等待额度重置（通常按月重置）
2. 切换到其他免费模型
3. 临时切换回火山引擎AI服务
4. 考虑升级到付费版本

## 📊 性能对比

| 特性 | 火山引擎AI | GitHub Models |
|------|------------|---------------|
| 成本 | 付费 | 免费（有限额） |
| 访问性 | 需要API Key | 需要GitHub Token |
| 模型选择 | 有限 | 多种主流模型 |
| 国内访问 | 良好 | 良好 |
| 集成难度 | 中等 | 简单 |
| 稳定性 | 高 | 中等 |

## 🔗 相关链接

- [GitHub Models 官方文档](https://docs.github.com/en/github-models)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [OpenAI API 兼容性](https://platform.openai.com/docs/api-reference)

## 📝 更新日志

- **2025-01-XX**: 初始版本，支持基本的GitHub Models集成
- **2025-01-XX**: 添加多模型支持和错误处理
- **2025-01-XX**: 完善文档和测试脚本