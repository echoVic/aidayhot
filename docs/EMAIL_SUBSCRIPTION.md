# 邮箱订阅功能说明

## 功能概述

邮箱订阅功能允许用户通过邮箱订阅 AI 日报，每日自动接收精选的 AI 技术资讯和深度分析。

## 功能特性

- ✅ 邮箱验证机制
- ✅ 每日自动发送 AI 日报
- ✅ 一键取消订阅
- ✅ 订阅状态管理
- ✅ 邮件发送日志记录
- ✅ 响应式订阅界面

## 环境配置

### 1. 环境变量设置

复制 `env.template` 文件为 `.env.local` 并配置以下环境变量：

```bash
# 邮件服务配置 (使用 Resend)
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL="AI 日报" <noreply@yourdomain.com>

# 网站配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 定时任务密钥
CRON_SECRET=your_random_secret_key
```

### 2. Resend 配置

使用 Resend 发送邮件的步骤：

1. 注册 [Resend](https://resend.com) 账户
2. 在控制台创建 API Key
3. 验证发送域名（添加 SPF/DKIM 记录）
4. 配置 `RESEND_API_KEY` 和 `FROM_EMAIL`

**优势：**
- 无需配置 SMTP 服务器
- 更好的送达率和统计
- 简化的 API 接口
- 内置退信处理

### 3. 数据库表结构

运行以下 SQL 创建必要的数据库表：

```sql
-- 执行 database/subscribers.sql 文件中的 SQL 语句
```

## API 接口

### 1. 订阅接口

**POST** `/api/subscribe`

请求体：
```json
{
  "email": "user@example.com",
  "preferences": {
    "frequency": "daily",
    "categories": ["all"]
  }
}
```

响应：
```json
{
  "message": "订阅成功！请检查您的邮箱并点击验证链接"
}
```

### 2. 取消订阅接口

**DELETE** `/api/subscribe`

请求体：
```json
{
  "email": "user@example.com"
}
```

### 3. 邮箱验证接口

**GET** `/api/verify?token=verification_token`

验证成功后重定向到 `/subscription/success`
验证失败后重定向到 `/subscription/error`

### 4. 发送日报接口

**POST** `/api/jobs/send-daily-email`

需要在请求头中包含授权令牌：
```
Authorization: Bearer your_cron_secret
```

## 定时任务设置

### 使用 Vercel Cron Jobs（推荐）

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/jobs/send-daily-email",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**说明：**
- Cron 使用 UTC 时间，`0 0 * * *` = 北京时间 08:00
- Vercel Cron 会自动添加 `x-vercel-cron: 1` 头，无需额外认证
- 支持 GET 和 POST 请求

### 使用外部 Cron 服务

可以使用 cron-job.org、GitHub Actions 或其他服务定时调用：

```bash
# 使用 Bearer token
curl -X POST https://your-domain.com/api/jobs/send-daily-email \
  -H "Authorization: Bearer your_cron_secret"

# 或使用 URL 参数
curl -X GET "https://your-domain.com/api/jobs/send-daily-email?token=your_cron_secret"
```

### 使用 GitHub Actions

创建 `.github/workflows/daily-email.yml`：

```yaml
name: Daily Email
on:
  schedule:
    - cron: "0 0 * * *"  # UTC 00:00 = 北京 08:00
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST "$API_URL/api/jobs/send-daily-email" \
            -H "Authorization: Bearer $CRON_SECRET"
        env:
          API_URL: https://your-domain.com
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

## 组件使用

### 1. 邮箱订阅组件

```tsx
import EmailSubscription from '@/components/EmailSubscription';

// 基本使用
<EmailSubscription />

// 自定义大小和样式
<EmailSubscription 
  size="lg" 
  className="my-4"
  showDescription={false}
/>
```

### 2. 订阅侧边栏

```tsx
import SubscriptionSidebar from '@/components/SubscriptionSidebar';

<SubscriptionSidebar />
```

## 邮件模板

### 验证邮件模板

- 包含验证链接
- 品牌化设计
- 移动端友好

### 日报邮件模板

- AI 日报内容摘要
- 前10条重要资讯链接
- 取消订阅链接
- 响应式设计

## 测试

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试订阅功能
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 测试发送日报
curl -X GET "http://localhost:3000/api/jobs/send-daily-email?date=2024-01-01"
```

### 2. 邮件发送测试

确保 SMTP 配置正确后，可以通过订阅流程测试邮件发送功能。

## 监控和日志

### 邮件发送日志

所有邮件发送记录都会保存在 `email_logs` 表中，包括：

- 发送时间
- 收件人
- 邮件类型
- 发送状态
- 错误信息（如有）

### 订阅统计

可以通过查询 `subscribers` 表获取订阅统计信息：

```sql
-- 总订阅数
SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed';

-- 今日新增订阅
SELECT COUNT(*) FROM subscribers 
WHERE status = 'confirmed' 
AND DATE(confirmed_at) = CURRENT_DATE;
```

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查 SMTP 配置
   - 确认网络连接
   - 查看邮件服务商限制

2. **验证链接失效**
   - 检查 token 是否正确
   - 确认链接未过期（24小时）

3. **重复订阅**
   - 系统会自动处理重复邮箱
   - 已订阅用户会收到重新激活邮件

### 日志查看

```sql
-- 查看最近的邮件发送日志
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看失败的邮件发送
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## 安全考虑

- 使用 HTTPS 传输敏感信息
- 验证 token 具有时效性
- 防止邮箱地址泄露
- 实施速率限制防止滥用
- 定期清理过期的验证 token
