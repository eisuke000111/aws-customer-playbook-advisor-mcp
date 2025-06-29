# AWS Security Advisor MCP

AWSセキュリティのベストプラクティスを提供するMCP（Model Context Protocol）サーバーです。

## 機能

- AWSセキュリティの基本原則ガイダンス
- 主要サービス（S3、IAM、EC2、VPC）のセキュリティベストプラクティス
- Claude Desktopからの簡単なアクセス

## インストール

### 方法1: uvx での実行（推奨）

```bash
# 最新版を直接実行
uvx aws-security-advisor-mcp@latest

# 特定のバージョンを実行
uvx aws-security-advisor-mcp@1.0.0
```

### 方法2: npx での実行

```bash
# 最新版を直接実行
npx aws-security-advisor-mcp@latest
```

### 方法3: ローカル開発

```bash
# リポジトリのクローン
git clone https://github.com/your-org/aws-customer-playbook-advisor-mcp.git
cd aws-customer-playbook-advisor-mcp

# 依存関係のインストール
npm install

# ビルド
npm run build
```

## Claude Desktop設定

### 方法1: uvx を使用（推奨）

1. Claude Desktopの設定ファイルを開きます：
   - macOS: `~/Library/Application Support/Claude/config.json`
   - Windows: `%APPDATA%\Claude\config.json`

2. 以下の設定を追加します：

```json
{
  "mcpServers": {
    "aws-security-advisor": {
      "command": "uvx",
      "args": ["aws-security-advisor-mcp@latest"]
    }
  }
}
```

### 方法2: npx を使用

```json
{
  "mcpServers": {
    "aws-security-advisor": {
      "command": "npx",
      "args": ["aws-security-advisor-mcp@latest"]
    }
  }
}
```

### 方法3: ローカル開発用

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

注意: パスは絶対パスで指定してください。

3. Claude Desktopを完全に終了（Cmd+Q または Alt+F4）して再起動します。

### トラブルシューティング

- Claude Desktopが最新版であることを確認
- ビルドが完了していることを確認: `npm run build`
- ログを確認: Claude Desktopのコンソールでエラーメッセージを確認

## 使用方法

Claude Desktopで以下のように質問できます：

- 「AWSのセキュリティ基本原則を教えて」
- 「S3のセキュリティ強化方法は？」
- 「IAMのベストプラクティスを知りたい」
- 「EC2インスタンスを安全に運用する方法」
- 「VPCのセキュリティ設定について」

## サポートされているサービス

- **General**: AWSセキュリティの基本原則
- **S3**: オブジェクトストレージのセキュリティ
- **IAM**: アクセス管理のベストプラクティス
- **EC2**: コンピューティングインスタンスのセキュリティ
- **VPC**: ネットワークセキュリティの設定

## ライセンス

MIT