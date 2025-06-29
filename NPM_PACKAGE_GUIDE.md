# NPMパッケージとして公開する方法

## 1. パッケージ構成の整理

### 1.1 エクスポート可能なモジュール構造に変更

```typescript
// src/index.ts を更新
export { GitHubPlaybookClient } from './github-client.js';
export { createMCPServer } from './mcp-server.js';
export { createAPIServer } from './api-server.js';

// デフォルトエクスポートも提供
export default {
  GitHubPlaybookClient,
  createMCPServer,
  createAPIServer,
};
```

### 1.2 package.json の更新

```json
{
  "name": "aws-security-advisor",
  "version": "2.1.0",
  "description": "AWS Security Playbook Framework client with MCP and REST API support",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./client": "./dist/github-client.js",
    "./mcp": "./dist/mcp-server.js",
    "./api": "./dist/api-server.js"
  },
  "bin": {
    "aws-security-advisor": "./dist/cli.js",
    "aws-security-advisor-mcp": "./dist/mcp-server.js",
    "aws-security-advisor-api": "./dist/api-server.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "build:cjs": "tsc --module commonjs --outDir dist-cjs",
    "prepublishOnly": "npm run build && npm run build:cjs",
    "test": "jest"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/eisuke000111/aws-security-advisor.git"
  },
  "keywords": [
    "aws",
    "security",
    "playbook",
    "mcp",
    "model-context-protocol",
    "api",
    "aws-security"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/eisuke000111/aws-security-advisor/issues"
  },
  "homepage": "https://github.com/eisuke000111/aws-security-advisor#readme"
}
```

## 2. プログラマティックな使用例

### 2.1 基本的な使用方法

```typescript
// NPMインストール
// npm install aws-security-advisor

import { GitHubPlaybookClient } from 'aws-security-advisor';

// クライアントの初期化
const client = new GitHubPlaybookClient();

// プレイブック一覧取得
const playbooks = await client.getPlaybookList();
console.log(playbooks);

// S3のセキュリティガイダンス取得
const s3Guidance = await client.searchByServiceName('s3');
for (const guide of s3Guidance) {
  console.log(guide.filename);
  console.log(client.extractPreventionGuidance(guide.content));
}
```

### 2.2 Express アプリケーションでの使用

```typescript
import express from 'express';
import { GitHubPlaybookClient } from 'aws-security-advisor';

const app = express();
const securityClient = new GitHubPlaybookClient();

app.get('/api/security/:service', async (req, res) => {
  const { service } = req.params;
  const guidance = await securityClient.searchByServiceName(service);
  res.json(guidance);
});

app.listen(3000);
```

### 2.3 Next.js API Routes での使用

```typescript
// pages/api/security/[service].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GitHubPlaybookClient } from 'aws-security-advisor';

const client = new GitHubPlaybookClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { service } = req.query;
  
  try {
    const guidance = await client.searchByServiceName(service as string);
    res.status(200).json({ success: true, data: guidance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### 2.4 AWS Lambda での使用

```typescript
import { GitHubPlaybookClient } from 'aws-security-advisor';

const client = new GitHubPlaybookClient();

export const handler = async (event: any) => {
  const { service } = event.pathParameters || {};
  
  try {
    const guidance = await client.searchByServiceName(service);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: guidance
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
```

## 3. CLIツールとしての使用

### 3.1 グローバルインストール

```bash
# グローバルインストール
npm install -g aws-security-advisor

# CLIとして使用
aws-security-advisor --help
aws-security-advisor playbooks list
aws-security-advisor guidance s3
aws-security-advisor playbook ransomware
```

### 3.2 CLI実装例

```typescript
// src/cli.ts
#!/usr/bin/env node
import { Command } from 'commander';
import { GitHubPlaybookClient } from './github-client.js';

const program = new Command();
const client = new GitHubPlaybookClient();

program
  .name('aws-security-advisor')
  .description('AWS Security Playbook CLI')
  .version('2.1.0');

program
  .command('playbooks')
  .description('List all available playbooks')
  .action(async () => {
    const playbooks = await client.getPlaybookList();
    console.log('Available playbooks:');
    playbooks.forEach(p => console.log(`- ${p}`));
  });

program
  .command('guidance <service>')
  .description('Get security guidance for AWS service')
  .option('-q, --question <question>', 'Specific question')
  .action(async (service, options) => {
    const results = await client.searchByServiceName(service);
    for (const result of results) {
      console.log(`\n## ${result.filename}\n`);
      console.log(client.extractPreventionGuidance(result.content));
    }
  });

program.parse();
```

## 4. TypeScript型定義の提供

```typescript
// src/types.ts
export interface PlaybookContent {
  filename: string;
  content: string;
}

export interface SecurityGuidance {
  service: string;
  guidance: string;
  sources: string[];
}

export interface GitHubClientOptions {
  repo?: string;
  cacheTimeout?: number;
  githubToken?: string;
}

// index.d.ts (型定義ファイル)
declare module 'aws-security-advisor' {
  export class GitHubPlaybookClient {
    constructor(options?: GitHubClientOptions);
    getPlaybookList(): Promise<string[]>;
    getPlaybookContent(filename: string): Promise<string>;
    searchPlaybooks(query: string): Promise<PlaybookContent[]>;
    searchByServiceName(serviceName: string): Promise<PlaybookContent[]>;
    extractSummary(content: string): string;
    extractPreventionGuidance(content: string): string;
  }
}
```

## 5. NPM公開手順

### 5.1 事前準備

```bash
# NPMアカウント作成（未作成の場合）
npm adduser

# ログイン確認
npm whoami
```

### 5.2 パッケージ名の確認

```bash
# 名前が利用可能か確認
npm view aws-security-advisor

# 代替案
# - @yourusername/aws-security-advisor
# - aws-security-playbook-client
# - aws-playbook-advisor
```

### 5.3 公開前チェック

```bash
# dry-run で確認
npm publish --dry-run

# パッケージサイズ確認
npm pack
```

### 5.4 公開

```bash
# 初回公開
npm publish

# スコープ付きパッケージの場合
npm publish --access public
```

## 6. バージョン管理

### 6.1 セマンティックバージョニング

```bash
# パッチリリース (bug fixes)
npm version patch

# マイナーリリース (new features)
npm version minor

# メジャーリリース (breaking changes)
npm version major
```

### 6.2 プレリリース版

```bash
# ベータ版
npm version prerelease --preid=beta
# 2.1.0-beta.0

# リリース候補
npm version prerelease --preid=rc
# 2.1.0-rc.0
```

## 7. 使用例集

### 7.1 React コンポーネント

```tsx
import React, { useState, useEffect } from 'react';
import { GitHubPlaybookClient } from 'aws-security-advisor';

const SecurityGuidance: React.FC<{ service: string }> = ({ service }) => {
  const [guidance, setGuidance] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = new GitHubPlaybookClient();
    
    client.searchByServiceName(service)
      .then(results => {
        if (results.length > 0) {
          setGuidance(client.extractPreventionGuidance(results[0].content));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [service]);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>{service.toUpperCase()} Security Guidance</h2>
      <pre>{guidance}</pre>
    </div>
  );
};
```

### 7.2 Vue.js での使用

```vue
<template>
  <div>
    <h2>{{ service }} Security Guidance</h2>
    <div v-if="loading">Loading...</div>
    <pre v-else>{{ guidance }}</pre>
  </div>
</template>

<script>
import { GitHubPlaybookClient } from 'aws-security-advisor';

export default {
  props: ['service'],
  data() {
    return {
      guidance: '',
      loading: true
    };
  },
  async mounted() {
    const client = new GitHubPlaybookClient();
    try {
      const results = await client.searchByServiceName(this.service);
      if (results.length > 0) {
        this.guidance = client.extractPreventionGuidance(results[0].content);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

## 8. 継続的インテグレーション

### 8.1 GitHub Actions での自動公開

```yaml
# .github/workflows/npm-publish.yml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### 8.2 自動バージョン更新

```json
// package.json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major"
  }
}
```

これで、NPMパッケージとして公開し、様々なプロジェクトやAIツールから簡単に利用できるようになります！