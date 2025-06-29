# AWSセキュリティアドバイザーMCP：1時間MVP→GitHub API完全統合まで

## 自己紹介
- エンジニア
- AWSセキュリティに興味あり
- Claude Desktopユーザー

---

## 今日話すこと

1. **MCPって何？**
2. **作ったもの**
3. **フェーズ1: 1時間MVP実装**
4. **フェーズ2: GitHub API完全統合**
5. **技術的なチャレンジ**
6. **デモ**
7. **成果と学び**

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

### AWS Security Advisor MCP v2.0
**AWS公式プレイブックフレームワークと統合したリアルタイムセキュリティアドバイザー**

### 進化の流れ
- **v1.0 (1時間MVP)**: ハードコーディングされたガイダンス
- **v2.0 (完全版)**: GitHub API + AWS公式プレイブック統合

### 現在の機能
- 🔄 **リアルタイムプレイブック取得** (aws-customer-playbook-framework)
- 🎯 **サービス別予防策抽出** (S3, IAM, EC2, RDS, VPC, SES等)
- 📚 **インシデント対応プレイブック** (ランサムウェア、侵害対応等)
- ⚡ **5分キャッシュ** で高速応答
- 🔍 **インテリジェント検索** でコンテンツ自動抽出

### 使用例
```
👤「S3のセキュリティを強化したい」
↓
🤖 GitHub APIでAWS公式プレイブックを取得
↓
📋 最新の予防策を自動抽出して返却
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

## フェーズ1: 1時間MVP実装

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
// src/index.ts - ハードコーディング版
const SECURITY_GUIDANCE = {
  general: '基本原則...',
  s3: 'S3セキュリティ...',
  iam: 'IAMベストプラクティス...',
  // ...
};

const server = new Server({
  name: 'aws-security-advisor',
  version: '1.0.0'
});
```

### 45-60分: 動作確認・ドキュメント
- Claude Desktop設定
- README作成
- 動作テスト

### 結果: ✅ 1時間でMVP完成！

---

## フェーズ2: GitHub API完全統合

### ⚠️ MVP版の課題
- **ハードコーディングされた情報**
- **更新されない古い情報**
- **AWS公式との乖離リスク**

### 🎯 解決策: AWS公式プレイブックとの統合
- **データソース**: aws-samples/aws-customer-playbook-framework
- **プレイブック数**: 20+個の公式セキュリティプレイブック
- **カバー範囲**: S3, IAM, EC2, RDS, ランサムウェア、暗号化マイニング等

### GitHub APIクライアント実装
```typescript
class GitHubPlaybookClient {
  private baseUrl = 'https://api.github.com';
  private repo = 'aws-samples/aws-customer-playbook-framework';
  private cache = new Map(); // 5分キャッシュ

  async getPlaybookList(): Promise<string[]> {
    // /docs ディレクトリから.mdファイル一覧を取得
  }

  async getPlaybookContent(filename: string): Promise<string> {
    // Base64デコードでMarkdownコンテンツを取得
  }

  async searchByServiceName(service: string) {
    // サービス名でプレイブックを検索
  }

  extractPreventionGuidance(content: string): string {
    // 予防策セクションを自動抽出
  }
}
```

---

## 技術的なチャレンジ

### v1.0 → v2.0 での主要な変更

#### 1. アーキテクチャの完全刷新
```typescript
// v1.0: ハードコーディング
const SECURITY_GUIDANCE = {
  s3: "パブリックアクセスブロック..."
};

// v2.0: 動的取得
const content = await githubClient.getPlaybookContent('S3_Public_Access');
const guidance = githubClient.extractPreventionGuidance(content);
```

#### 2. インテリジェントコンテンツ抽出
- **課題**: Markdownから「予防策」セクションを自動判定
- **解決**: キーワードベース解析 + セクション構造理解

```typescript
extractPreventionGuidance(content: string): string {
  // "prevention", "mitigation", "best practices"等を探索
  // セクション構造を理解して関連部分を抽出
}
```

#### 3. サービス名マッピング
```typescript
const serviceKeywords: Record<string, string[]> = {
  's3': ['s3', 'public_access'],
  'iam': ['iam', 'credentials', 'compromised'],
  'ransomware': ['ransom'],
  // ...
};
```

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

### フェーズ1（MVP）での課題

#### 1. package.jsonの`bin`セクション
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

#### 2. Claude Desktop設定ファイル
**混乱**: どっちが正しい？
- `config.json` (既存の設定ファイル)
- `claude_desktop_config.json` (MCP用の設定ファイル)

**解決**: 公式ドキュメントでは`claude_desktop_config.json`が推奨

### フェーズ2（GitHub API）での課題

#### 3. GitHub APIレート制限
**問題**: 頻繁なアクセスで制限に引っかかる
```typescript
// ✅ 解決策: キャッシュ機能
private cache = new Map<string, { content: string; timestamp: number }>();
private cacheTimeout = 5 * 60 * 1000; // 5分
```

#### 4. プレイブック構造の多様性
**問題**: プレイブックごとに異なるMarkdown構造
```typescript
// ✅ 解決策: 複数キーワードでの柔軟な検索
if (line.includes('## Summary') || 
    line.includes('## 概要') || 
    line.includes('# Overview')) {
  // ...
}
```

---

## デモ時間 🎬

### v2.0で利用可能なコマンド

#### 1. プレイブック一覧取得
```
👤「利用可能なセキュリティプレイブックを教えて」
↓
🤖 list_available_playbooks 実行
↓
📋 20+個のプレイブック一覧表示
```

#### 2. サービス別予防策取得
```
👤「S3のセキュリティ対策を教えて」
↓
🤖 get_prevention_guidance(service="s3") 実行
↓
📋 S3_Public_Access.mdから予防策を自動抽出
```

#### 3. インシデント対応プレイブック取得
```
👤「ランサムウェア攻撃への対応方法を教えて」
↓
🤖 get_aws_playbook(scenario="ransomware") 実行
↓
📋 ランサムウェア対応プレイブック全文表示
```

### リアルタイム更新の威力
- **常に最新**: AWSが更新すると自動反映
- **公式情報**: aws-customer-playbook-frameworkから直接取得
- **網羅性**: 20+のセキュリティシナリオをカバー

---

## 成果と学び

### 🏆 達成できたこと

#### 技術的成果
- ✅ **1時間でMVP完成** → **GitHub API完全統合**
- ✅ **ハードコーディング → 動的データ取得**
- ✅ **20+の公式プレイブック統合**
- ✅ **インテリジェントコンテンツ抽出**
- ✅ **5分キャッシュで高速化**

#### ビジネス価値
- 🎯 **常に最新のセキュリティ情報**
- 📚 **AWS公式の信頼性**
- ⚡ **Claude Desktop統合で使いやすさ向上**
- 🔄 **メンテナンスフリー（自動更新）**

### 📖 技術的な学び

#### MCPプロトコル
- **Tools**: 外部機能をClaude Desktopに追加
- **stdio通信**: リアルタイムでデータ交換
- **Schema定義**: 型安全なパラメータ受け渡し

#### GitHub API活用
- **Contents API**: リポジトリファイルの動的取得
- **Base64デコード**: バイナリコンテンツの処理
- **レート制限対策**: キャッシュとエラーハンドリング

#### コンテンツ解析
- **Markdown解析**: 構造化データからの情報抽出
- **セクション検出**: キーワードベースの柔軟な検索
- **要約生成**: 長文から重要部分を自動抽出

---

## 今後の展開

### 短期的な改善
- 🔍 **検索精度の向上** (自然言語処理)
- 📊 **メトリクス収集** (使用状況分析)
- 🌐 **多言語対応** (日本語プレイブック)

### 長期的なビジョン
- 🤖 **AI要約機能** (LLMによるコンテンツ要約)
- 🔗 **他社セキュリティフレームワーク統合**
- 👥 **コミュニティプレイブック対応**
- 📱 **マルチプラットフォーム展開**

---

## まとめ

### 🎯 プロジェクトの進化
```
MVP (1時間) → 完全版 (GitHub API統合)
ハードコーディング → 動的データ取得
静的情報 → リアルタイム更新
限定機能 → 20+プレイブック対応
```

### 💡 MCPの革新性
- **AI + 外部ツール** の新しい連携パターン
- **ドメイン特化型AIアシスタント** の実現
- **リアルタイムデータアクセス** でAIの可能性拡張

### 🚀 実用性の証明
- **実際に動作**: Claude Desktopで日常使用可能
- **メンテナンスフリー**: AWS更新時の自動反映
- **スケーラブル**: 他のセキュリティフレームワークにも応用可能

### 🔮 未来への示唆
- **AIツールエコシステム** の発展
- **専門知識のリアルタイム統合**
- **開発者体験の革新**

---

## 行動喚起 🎪

### あなたも試してみませんか？

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/eisuke000111/aws-customer-playbook-advisor-mcp
   ```

2. **Claude Desktopで試用**
   - npm install & build
   - Claude Desktop設定
   - 実際のセキュリティ質問で体験

3. **自分のドメインでMCP作成**
   - 医療 × MCP
   - 金融 × MCP  
   - 教育 × MCP
   - あなたの専門分野 × MCP

---

## リンク

- 🔗 **GitHub Repository**: https://github.com/eisuke000111/aws-customer-playbook-advisor-mcp
- 📚 **MCP公式ドキュメント**: https://modelcontextprotocol.io/
- 🎯 **AWS Playbook Framework**: https://github.com/aws-samples/aws-customer-playbook-framework

---

## Q&A

**ご質問をお待ちしています！**

### よくある質問

**Q: 他のクラウドプロバイダーにも対応予定は？**
A: Azure、GCPのセキュリティフレームワークとの統合も検討中です！

**Q: プライベートなプレイブックも利用できる？**
A: 企業内のプライベートリポジトリにも対応可能な設計です。

**Q: APIキーは必要？**
A: 現在は公開リポジトリのみなので不要。プライベート対応時に追加予定。

**Q: どのくらいの頻度で更新される？**
A: AWSが公式プレイブックを更新すると即座に反映されます（キャッシュは5分）。

---

**ありがとうございました！** 🙏

### 今日のキーメッセージ
🚀 **MCPでAIの可能性は無限大**  
🔗 **リアルタイムデータ統合が次世代AI体験を創る**  
🎯 **あなたの専門分野 × MCP = 新しい価値創造**

*一緒にMCPの未来を創りましょう！*