# AWS Customer Playbook Advisor MCP

※ このリポジトリは非公式のものであり、クローンしてもらって試してもらっても良いですが責任は負いません。

AWS公式の[AWS Customer Playbook Framework](https://github.com/aws-samples/aws-customer-playbook-framework)リポジトリを活用して、リアルタイムでAWSセキュリティガイダンスを提供するModel Context Protocol (MCP)サーバーです。

## 概要

AWS Customer Playbook Advisor MCPは、Claude Desktopユーザーが自然言語でAWSセキュリティのベストプラクティス、インシデント対応プレイブック、予防的セキュリティ対策にアクセスできるようにします。このサーバーはAWSの公式リポジトリから最新のセキュリティプレイブックを動的に取得し、常に最新のセキュリティガイダンスを提供します。

## 主な機能

- **動的なプレイブック取得**: AWS公式GitHubリポジトリから直接セキュリティプレイブックを取得
- **スマートなコンテンツ抽出**: プレイブックから要約や予防ガイダンスを自動抽出
- **サービス固有のガイダンス**: S3、IAM、EC2、RDSなどのAWSサービスに特化したセキュリティアドバイスを提供
- **キャッシング**: パフォーマンス最適化のための5分間キャッシュを実装
- **認証不要**: パブリックなGitHub APIエンドポイントを使用

## 利用可能なツール

### 1. `get_aws_playbook`
シナリオキーワードに基づいて特定のAWSセキュリティプレイブックを取得します。

**パラメータ:**
- `scenario` (必須): セキュリティシナリオまたはサービス名（例: "s3", "iam", "ransomware"）
- `playbook_name` (オプション): 取得する特定のプレイブック名

**使用例:**
```
"S3セキュリティのAWSプレイブックを取得して"
"ランサムウェアインシデント対応プレイブックを表示して"
```

### 2. `get_prevention_guidance`
特定のAWSサービスの予防的セキュリティガイダンスを提供します。

**パラメータ:**
- `service` (必須): AWSサービス名（例: "S3", "IAM", "EC2", "RDS", "VPC", "SES", "SageMaker", "Bedrock"）

**使用例:**
```
"S3の予防対策を教えて"
"IAMのセキュリティベストプラクティスを表示して"
```

### 3. `list_available_playbooks`
AWSリポジトリから利用可能なすべてのセキュリティプレイブックをリストします。

**使用例:**
```
"利用可能なAWSセキュリティプレイブックをすべてリストして"
"どのようなプレイブックが利用できますか？"
```

## インストール

### 前提条件
- Node.js 18以上
- npmまたはyarn
- Claude Desktop

### セットアップ手順

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/aws-customer-playbook-advisor-mcp.git
cd aws-customer-playbook-advisor-mcp
```

2. 依存関係をインストール:
```bash
npm install
```

3. プロジェクトをビルド:
```bash
npm run build
```

4. Claude Desktopを設定:

以下をClaude Desktopの設定ファイルに追加します：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aws-security-advisor": {
      "command": "node",
      "args": ["/path/to/aws-customer-playbook-advisor-mcp/dist/index.js"]
    }
  }
}
```

5. Claude Desktopを再起動

## 使用例

設定が完了したら、Claude Desktop内でAWSセキュリティアドバイザーと対話できます：

- **特定のプレイブックを取得**: 「S3データ漏洩に対処するAWSプレイブックを表示して」
- **予防ガイダンス**: 「AWS IAMのセキュリティベストプラクティスは何ですか？」
- **リソースをリスト**: 「どのようなセキュリティプレイブックが利用できますか？」
- **インシデント対応**: 「AWSでランサムウェア攻撃に対応する方法は？」

## 開発

### プロジェクト構造
```
aws-customer-playbook-advisor-mcp/
├── src/
│   └── index.ts          # メインサーバー実装
├── dist/                 # コンパイル済みJavaScript出力
├── package.json          # プロジェクト設定
├── tsconfig.json         # TypeScript設定
└── manifest.json         # MCPマニフェストファイル
```

### ソースからビルド
```bash
# 依存関係をインストール
npm install

# プロジェクトをビルド
npm run build

# 開発モードで実行
npm run dev
```

### 技術詳細

- **言語**: TypeScript
- **ランタイム**: Node.js (ES2022モジュール)
- **プロトコル**: Model Context Protocol (MCP)
- **主要依存関係**: `@modelcontextprotocol/sdk`

## コントリビューション

コントリビューションを歓迎します！イシューやプルリクエストをお気軽に提出してください。

## ライセンス

MITライセンス - 詳細はLICENSEファイルを参照してください。

## 謝辞

このプロジェクトはAWSが管理する公式の[AWS Customer Playbook Framework](https://github.com/aws-samples/aws-customer-playbook-framework)を活用しています。すべてのセキュリティプレイブックとガイダンスはこのリポジトリから取得されています。

## 免責事項

このツールは情報提供を目的としてAWSセキュリティプレイブックへのアクセスを提供します。セキュリティガイダンスは常に公式のAWSドキュメントで確認し、重要なセキュリティ決定についてはセキュリティ専門家に相談してください。