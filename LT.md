# 1時間でAWSセキュリティアドバイザーMCPサーバーを作ってみた

## 自己紹介
- エンジニア
- AWSセキュリティに興味あり
- Claude Desktopユーザー

---

## 今日話すこと

1. **MCPって何？**
2. **作ったもの**
3. **実装の流れ**
4. **ハマったポイント**
5. **デモ**
6. **今後の展開**

---

## MCPとは？

### Model Context Protocol
- **Claude DesktopとAIツールを連携させるプロトコル**
- 外部データをClaude Desktopから直接利用可能
- リアルタイムで情報を取得・処理

### 従来の問題
```
👤 ユーザー: 「S3のセキュリティ設定教えて」
🤖 Claude: 「一般的なベストプラクティスは...（古い情報かも）」
```

### MCPで解決
```
👤 ユーザー: 「S3のセキュリティ設定教えて」
🤖 Claude: [MCPツール呼び出し] → 最新のプレイブックから取得
🤖 Claude: 「最新のAWS公式ガイドでは...」
```

---

## 作ったもの

### AWS Security Advisor MCP
**AWSセキュリティのベストプラクティスを提供するMCPサーバー**

### 機能
- ✅ AWSセキュリティ基本原則
- ✅ S3セキュリティガイダンス
- ✅ IAMベストプラクティス
- ✅ EC2セキュリティ設定
- ✅ VPCネットワークセキュリティ

### 使用例
```
👤「S3のセキュリティを強化したい」
↓
🤖 MCPツール `get_prevention_guidance` を呼び出し
↓
📋 S3セキュリティベストプラクティスを返却
```

---

## なぜ作ったのか？

### 課題
- **AWSセキュリティの情報が散在**
- **ベストプラクティスを毎回検索するのが面倒**
- **最新情報への追従が大変**

### 解決したいこと
- Claude Desktopから直接セキュリティガイダンス取得
- 統一されたフォーマットでの情報提供
- 迅速な意思決定支援

---

## 実装の流れ（1時間チャレンジ）

### 0-15分: プロジェクトセットアップ
```bash
# プロジェクト初期化
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node

# TypeScript設定
# package.json設定
```

### 15-45分: MCPサーバー実装
```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'aws-security-advisor',
  version: '1.0.0'
});

// ツール登録
server.setRequestHandler(ListToolsRequestSchema, ...);
server.setRequestHandler(CallToolRequestSchema, ...);
```

### 45-60分: 動作確認・ドキュメント
- Claude Desktop設定
- README作成
- 動作テスト

---

## 技術スタック

### フロントエンド
- **Claude Desktop** (MCPクライアント)

### バックエンド
- **Node.js + TypeScript**
- **MCP SDK** (@modelcontextprotocol/sdk)
- **stdio通信** (Claude DesktopとMCPサーバー間)

### データソース（MVP版）
- **ハードコーディング** (1時間制約のため)
- 将来: AWS公式プレイブックフレームワーク

---

## 実装のポイント

### 1. MCPサーバーの基本構造
```typescript
// ツール定義
const tools = [{
  name: 'get_prevention_guidance',
  description: 'AWSセキュリティガイダンスを取得',
  inputSchema: {
    type: 'object',
    properties: {
      service: { type: 'string' },
      question: { type: 'string' }
    }
  }
}];

// ツール実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // ガイダンス生成ロジック
});
```

### 2. セキュリティガイダンスの構造化
```typescript
const SECURITY_GUIDANCE = {
  general: '基本原則...',
  s3: 'S3セキュリティ...',
  iam: 'IAMベストプラクティス...',
  ec2: 'EC2セキュリティ...',
  vpc: 'VPCセキュリティ...'
};
```

---

## ハマったポイント 🤯

### 1. package.jsonの`bin`セクション
**問題**: MCPサーバーが実行できない
```json
// ❌ 不足していた
{
  "main": "dist/index.js"
}

// ✅ 必要だった
{
  "main": "dist/index.js",
  "bin": {
    "aws-security-advisor-mcp": "./dist/index.js"
  }
}
```

### 2. Claude Desktop設定ファイル
**混乱**: どっちが正しい？
- `config.json` (既存の設定ファイル)
- `claude_desktop_config.json` (MCP用の設定ファイル)

**解決**: 公式ドキュメントでは`claude_desktop_config.json`が推奨

### 3. 絶対パスの必要性
```json
// ❌ 相対パスはNG
"args": ["./dist/index.js"]

// ✅ 絶対パスが必要
"args": ["/Users/username/project/dist/index.js"]
```

---

## デモ時間 🎬

### 1. Claude Desktop設定確認
```json
{
  "mcpServers": {
    "aws-security-advisor": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

### 2. 実際の使用例
- 「S3のセキュリティ対策を教えて」
- 「IAMのベストプラクティスは？」
- 「AWSセキュリティ全般について」

### 3. MCPツール呼び出しの様子
- Claude Desktopでのツール実行
- 構造化されたガイダンスの表示

---

## 現在の制限事項

### MVP版の制約
- ❌ **ハードコーディングされたデータ**
- ❌ **GitHub APIとの連携なし**
- ❌ **動的なコンテンツ更新なし**

### なぜこの制約？
- ⏰ **1時間という時間制限**
- 🎯 **MVPとしての最小機能に集中**
- 🚀 **動作確認を最優先**

---

## 今後の展開

### Phase 2: GitHub API連携
```typescript
// AWS公式プレイブックフレームワークから動的取得
const playbook = await fetchFromGitHub(
  'aws-samples/aws-customer-playbook-framework'
);
```

### Phase 3: 機能拡張
- 🔍 **より多くのAWSサービス対応**
- 📊 **インシデント対応ガイダンス**
- 💾 **キャッシュ機能**
- 🔄 **自動更新機能**

### Phase 4: コミュニティ
- 🌟 **オープンソース化**
- 👥 **コントリビューション受付**
- 📚 **ドキュメント充実**

---

## 学んだこと

### 技術面
- ✅ **MCPの基本的な仕組み**
- ✅ **TypeScriptでのMCPサーバー実装**
- ✅ **Claude Desktopとの連携方法**

### プロジェクト管理
- ⏰ **時間制約下での優先順位付け**
- 📋 **MVPスコープの重要性**
- 🔄 **段階的な機能実装の効果**

### ツール活用
- 🤖 **Claude Code との協働開発**
- 📝 **実装計画書の有効性**
- ✅ **TODO管理の重要性**

---

## まとめ

### 1時間で実現できたこと
- ✅ **動作するMCPサーバー**
- ✅ **Claude Desktopとの連携**
- ✅ **AWSセキュリティガイダンス提供**
- ✅ **完全なドキュメント**

### MCPの可能性
- 🚀 **AIとツールの新しい連携方法**
- 🔗 **リアルタイムデータアクセス**
- 🎯 **特定ドメインに特化したAIアシスタント**

### 次のアクション
1. **GitHub API連携の実装**
2. **コミュニティフィードバック収集**
3. **実際の業務での活用**

---

## リンク

- 🔗 **GitHub Repository**: https://github.com/eisuke000111/aws-customer-playbook-advisor-mcp
- 📚 **MCP公式ドキュメント**: https://modelcontextprotocol.io/
- 🎯 **AWS Playbook Framework**: https://github.com/aws-samples/aws-customer-playbook-framework

---

## Q&A

**ご質問をお待ちしています！**

- MCPについて
- 実装について
- AWSセキュリティについて
- 今後の展開について

---

**ありがとうございました！** 🙏

*1時間でここまでできるMCPの可能性を一緒に探求しましょう！*