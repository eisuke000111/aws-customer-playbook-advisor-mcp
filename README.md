# AWS Security Advisor MCP

AWSセキュリティのベストプラクティスを提供するMCP（Model Context Protocol）サーバーです。

## 機能

- AWSセキュリティの基本原則ガイダンス
- 主要サービス（S3、IAM、EC2、VPC）のセキュリティベストプラクティス
- Claude Desktopからの簡単なアクセス

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/eisuke000111/aws-customer-playbook-advisor-mcp.git
cd aws-customer-playbook-advisor-mcp

# 依存関係のインストール
npm install

# ビルド
npm run build
```

## Claude Desktop設定

1. Claude Desktopの設定ファイルを開きます：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 以下の設定を追加します：

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

3. Claude Desktopを再起動します。

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