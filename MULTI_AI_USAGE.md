# 複数AI対応ガイド

このドキュメントでは、AWS Security Advisor を Claude Desktop (MCP) 以外のAIからも利用する方法を説明します。

## 1. REST API として利用

### セットアップ

```bash
# 依存関係をインストール
npm install

# ビルド
npm run build

# APIサーバーを起動
npm run start:api
```

サーバーは http://localhost:3000 で起動します。

### API エンドポイント

#### プレイブック一覧取得
```bash
curl http://localhost:3000/api/playbooks
```

#### サービス別予防策取得
```bash
# S3のセキュリティガイダンス
curl "http://localhost:3000/api/prevention/s3"

# 質問付きリクエスト
curl "http://localhost:3000/api/prevention/iam?question=MFA設定について"
```

#### シナリオ別プレイブック取得
```bash
# ランサムウェア対応プレイブック
curl "http://localhost:3000/api/playbook/ransomware"

# 特定のプレイブック取得
curl "http://localhost:3000/api/playbook/security?playbook_name=S3_Public_Access"
```

## 2. 各AIプラットフォームでの利用方法

### 2.1 OpenAI GPTs (ChatGPT Plus)

GPTsのActionsに以下のOpenAPI仕様を追加：

```yaml
openapi: 3.0.0
info:
  title: AWS Security Advisor
  version: 2.0.0
servers:
  - url: http://your-server.com:3000
paths:
  /api/prevention/{service}:
    get:
      operationId: getPreventionGuidance
      summary: Get AWS service security guidance
      parameters:
        - name: service
          in: path
          required: true
          schema:
            type: string
          description: AWS service name
        - name: question
          in: query
          schema:
            type: string
          description: Specific question
      responses:
        '200':
          description: Security guidance
```

### 2.2 Google Bard/Gemini

Bardでは直接HTTP APIを呼び出せないため、中間サービスが必要：

```javascript
// Google Apps Script例
function getAWSGuidance(service, question = '') {
  const url = `http://your-server.com:3000/api/prevention/${service}?question=${encodeURIComponent(question)}`;
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}
```

### 2.3 Microsoft Copilot

Power Automate経由でHTTP APIを呼び出し：

```json
{
  "method": "GET",
  "uri": "http://your-server.com:3000/api/prevention/@{variables('service')}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 2.4 Anthropic Claude API

Claude APIから直接HTTPリクエスト：

```python
import requests
import json

def get_aws_guidance(service, question=None):
    url = f"http://localhost:3000/api/prevention/{service}"
    params = {"question": question} if question else {}
    
    response = requests.get(url, params=params)
    return response.json()

# 使用例
guidance = get_aws_guidance("s3", "バケット暗号化について")
print(guidance['data']['guidance'])
```

## 3. Docker での本番運用

### 3.1 Docker Compose で起動

```bash
# ビルドして起動
docker-compose up -d

# ログ確認
docker-compose logs -f aws-security-api
```

### 3.2 環境変数設定

```bash
# .env ファイル作成
echo "PORT=3000" > .env
echo "NODE_ENV=production" >> .env
```

### 3.3 ロードバランサー対応

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  aws-security-api:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
```

## 4. Webhook 対応（GitHub更新時の自動キャッシュクリア）

### 4.1 Webhook エンドポイント追加

```typescript
// src/api-server.ts に追加
app.post('/api/webhook/github', (req, res) => {
  const { repository } = req.body;
  
  if (repository?.full_name === 'aws-samples/aws-customer-playbook-framework') {
    // キャッシュをクリア
    githubClient.clearCache();
    console.log('Cache cleared due to GitHub webhook');
  }
  
  res.status(200).json({ status: 'ok' });
});
```

### 4.2 GitHub Webhook 設定

1. リポジトリの Settings → Webhooks
2. Payload URL: `http://your-server.com:3000/api/webhook/github`
3. Content type: `application/json`
4. Events: `push`

## 5. レート制限とキャッシュ戦略

### 5.1 Redis キャッシュ（オプション）

```bash
# Redis コンテナ追加
docker run -d --name redis -p 6379:6379 redis:alpine
```

```typescript
// Redisキャッシュクライアント
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class CacheManager {
  async get(key: string) {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl = 300) {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

## 6. モニタリングとログ

### 6.1 Prometheus メトリクス

```typescript
// メトリクス追加
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});

// メトリクス用エンドポイント
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### 6.2 ログ出力

```typescript
// 構造化ログ
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 7. セキュリティ考慮事項

### 7.1 レート制限

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 7.2 API キー認証（オプション）

```typescript
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

app.use('/api/', apiKeyAuth);
```

## 8. トラブルシューティング

### よくある問題

1. **CORS エラー**
   ```typescript
   app.use(cors({
     origin: ['http://localhost:3000', 'https://your-domain.com']
   }));
   ```

2. **GitHub API レート制限**
   - GitHub トークンを設定してレート制限を緩和
   - キャッシュ時間を延長

3. **メモリ使用量**
   - キャッシュサイズの制限
   - 定期的なガベージコレクション

これで、Claude Desktop以外の様々なAIプラットフォームからAWS Security Advisorを利用できるようになります。