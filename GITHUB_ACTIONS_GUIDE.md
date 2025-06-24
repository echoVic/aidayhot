# GitHub Actions 自动数据收集指南

本指南将帮助你设置 GitHub Actions 来自动执行 AI 日报的数据收集任务。

## 🎯 方案优势

✅ **完全免费** - 公开仓库享受无限制使用  
✅ **长时间执行** - 单任务可运行最长6小时  
✅ **定时触发** - 支持 Cron 表达式定时执行  
✅ **手动触发** - 支持按需执行，可指定参数  
✅ **原生支持** - 无需修改现有爬虫代码  
✅ **详细日志** - 完整的执行报告和错误追踪  

## 📋 环境要求

1. GitHub 公开仓库（私有仓库有时间限制）
2. Supabase 数据库
3. 必要的环境变量配置

## ⚙️ 配置步骤

### 1. 设置 GitHub Secrets

在你的 GitHub 仓库中设置以下 Secrets：

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret" 添加以下变量：

```bash
# 必需的环境变量
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥

# 可选的环境变量
GH_TOKEN=你的GitHub Personal Access Token（用于提高API限制）
```

### 2. 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings → API
4. 复制以下信息：
   - Project URL (用作 `SUPABASE_URL`)
   - anon public key (用作 `SUPABASE_ANON_KEY`)
   - service_role secret key (用作 `SUPABASE_SERVICE_ROLE_KEY`)

### 3. 获取 GitHub Token（可选）

1. 进入 GitHub Settings → Developer settings → Personal access tokens
2. 生成新 token，选择 `public_repo` 权限
3. 将 token 添加为 `GH_TOKEN` secret

## 🚀 使用方法

### 自动执行

工作流会在以下时间自动运行：
- **每天早上 8:00** (北京时间)
- **每天晚上 8:00** (北京时间)

### 手动执行

1. 进入仓库的 Actions 页面
2. 选择 "AI 日报数据收集" 工作流
3. 点击 "Run workflow"
4. 可选择：
   - **指定爬取源**: `all`, `arxiv`, `github`, `papers-with-code`, `stackoverflow`, `rss`
   - **最大结果数**: 每个源的最大文章数量

### 命令行参数

工作流支持以下参数：

```bash
--sources=all                    # 爬取所有源
--sources=arxiv                  # 只爬取ArXiv
--max-results=10                 # 每个源最多10篇文章
--timeout=25                     # 25秒超时
--verbose                        # 详细日志输出
```

## 📊 监控和日志

### 查看执行状态

1. 进入 Actions 页面
2. 查看最新的工作流运行
3. 点击进入查看详细步骤和日志

### 执行报告

每次运行会生成详细报告，包含：
- 执行时间和触发方式
- 各个爬虫源的统计信息
- 成功/失败的文章数量
- 错误详情

### 失败通知

当数据收集失败时，你会在以下地方看到通知：
- GitHub Actions 页面显示红色 ❌
- 邮件通知（如果启用了 GitHub 通知）

## 🔧 自定义配置

### 修改执行时间

编辑 `.github/workflows/data-collection.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 0 * * *'    # 早上8点北京时间 (UTC 0点)
  - cron: '0 12 * * *'   # 晚上8点北京时间 (UTC 12点)
```

### 调整超时时间

修改工作流中的 `timeout-minutes`:

```yaml
jobs:
  collect-data:
    timeout-minutes: 30  # 30分钟超时
```

### 修改默认参数

编辑工作流中的运行命令：

```yaml
run: |
  node scripts/collectDataToSupabase.js \
    --sources="all" \
    --max-results="15" \     # 修改默认数量
    --timeout=25 \
    --verbose
```

## 🛠️ 故障排查

### 常见问题

1. **环境变量未设置**
   ```
   缺少必需的环境变量: SUPABASE_URL
   ```
   解决：检查 GitHub Secrets 配置

2. **Supabase 连接失败**
   ```
   Supabase 客户端初始化失败
   ```
   解决：验证 SUPABASE_URL 和密钥是否正确

3. **爬虫模块加载失败**
   ```
   加载 arxiv 爬虫失败: Cannot find module
   ```
   解决：检查依赖是否正确安装

4. **执行超时**
   ```
   The job was canceled because it exceeded the maximum execution time
   ```
   解决：增加 timeout-minutes 或减少 max-results

### 调试方法

1. **启用详细日志**：在手动触发时选择详细输出
2. **单独测试爬虫**：指定单个源进行测试
3. **本地测试**：在本地运行 `collectDataToSupabase.js` 脚本

### 性能优化

1. **减少并发请求**：降低 max-results 参数
2. **分时段执行**：避开高峰期
3. **错误重试**：失败时手动重新触发

## 📈 最佳实践

1. **监控频率**：定期检查 Actions 执行状态
2. **数据验证**：通过网站前端验证数据更新
3. **错误处理**：及时处理失败的执行
4. **资源管理**：合理设置爬取数量和频率
5. **备份策略**：定期备份重要数据

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 的详细日志
2. 检查本文档的故障排查部分
3. 验证所有环境变量是否正确设置
4. 在本地环境测试爬虫脚本

---

通过 GitHub Actions，你的 AI 日报将实现全自动的数据更新，无需任何服务器成本！🎉 