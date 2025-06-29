#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// AWSセキュリティガイダンスをハードコーディング
const SECURITY_GUIDANCE = {
  general: `## AWSセキュリティ基本原則

1. **最小権限の原則**
   - IAMポリシーは必要最小限の権限のみ付与
   - リソースベースのポリシーも同様に制限

2. **多層防御**
   - 複数のセキュリティレイヤーを実装
   - 単一障害点を作らない

3. **データの暗号化**
   - 保存時の暗号化（EBS、S3、RDS等）
   - 転送時の暗号化（TLS/SSL）

4. **ログとモニタリング**
   - CloudTrailでAPI呼び出しを記録
   - CloudWatchでメトリクスとログを監視

5. **自動化による一貫性**
   - Infrastructure as Codeで構成管理
   - AWS Configで継続的なコンプライアンス確認`,
  
  s3: `## S3セキュリティベストプラクティス

1. **パブリックアクセスのブロック**
   - バケットレベルでパブリックアクセスブロックを有効化
   - アカウントレベルでも制限を適用

2. **暗号化の実装**
   - デフォルト暗号化を有効化（SSE-S3またはSSE-KMS）
   - バケットポリシーでHTTPS通信を強制

3. **アクセスログの有効化**
   - S3アクセスログを別バケットに保存
   - ログバケット自体も適切に保護

4. **バージョニングとMFA削除**
   - バージョニングを有効化して誤削除に対応
   - 重要なバケットはMFA削除を要求

5. **ライフサイクルポリシー**
   - 古いデータの自動アーカイブ/削除
   - コスト最適化とセキュリティの両立`,
  
  iam: `## IAMセキュリティベストプラクティス

1. **MFA（多要素認証）の有効化**
   - ルートユーザーは必須
   - 特権ユーザーにも強く推奨

2. **アクセスキーの管理**
   - 定期的なローテーション（90日推奨）
   - 不要なアクセスキーは即座に削除

3. **IAMロールの活用**
   - EC2インスタンスにはロールを使用
   - クロスアカウントアクセスもロールで

4. **ポリシーの最小権限化**
   - 必要な権限のみを付与
   - ワイルドカード（*）の使用は最小限に

5. **定期的な権限レビュー**
   - IAM Access Analyzerの活用
   - 未使用の権限を定期的に削除`,
  
  ec2: `## EC2セキュリティベストプラクティス

1. **セキュリティグループの最小化**
   - 必要なポートのみ開放
   - ソースIPを可能な限り制限

2. **最新のAMI使用**
   - 定期的にパッチを適用
   - カスタムAMIも定期的に更新

3. **Systems Manager Session Manager**
   - SSHキーの代わりに使用
   - 監査ログが自動的に記録

4. **IMDSv2の強制**
   - メタデータサービスの悪用を防止
   - インスタンスレベルで設定

5. **EBSボリュームの暗号化**
   - デフォルトで暗号化を有効化
   - スナップショットも自動的に暗号化`,
  
  vpc: `## VPCセキュリティベストプラクティス

1. **プライベートサブネットの活用**
   - データベース等はプライベートに配置
   - NATゲートウェイ経由でアウトバウンド

2. **NACLとセキュリティグループ**
   - NACLでサブネットレベルの制御
   - セキュリティグループでインスタンスレベル

3. **VPCフローログ**
   - 全トラフィックを記録
   - 異常なパターンの検知に活用

4. **VPCエンドポイント**
   - AWSサービスへのプライベート接続
   - インターネット経由を回避

5. **複数AZへの展開**
   - 可用性とセキュリティの向上
   - 単一障害点の排除`
};

// MCPサーバーの初期化
const server = new Server(
  {
    name: 'aws-security-advisor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールハンドラーの設定
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_prevention_guidance',
        description: 'AWSサービスのセキュリティ予防策を取得します',
        inputSchema: {
          type: 'object',
          properties: {
            service: {
              type: 'string',
              description: 'AWSサービス名（例: S3, IAM, EC2, VPC）または "general" で全般的なガイダンス',
            },
            question: {
              type: 'string',
              description: '具体的な質問（オプション）',
            },
          },
          required: ['service'],
        },
      },
    ],
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'get_prevention_guidance') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments as { service?: string; question?: string };
  const serviceName = args.service?.toLowerCase() || 'general';
  
  let guidance = SECURITY_GUIDANCE.general;
  
  // サービス固有のガイダンスを追加
  if (serviceName.includes('s3')) {
    guidance += '\n\n' + SECURITY_GUIDANCE.s3;
  } else if (serviceName.includes('iam')) {
    guidance += '\n\n' + SECURITY_GUIDANCE.iam;
  } else if (serviceName.includes('ec2')) {
    guidance += '\n\n' + SECURITY_GUIDANCE.ec2;
  } else if (serviceName.includes('vpc')) {
    guidance += '\n\n' + SECURITY_GUIDANCE.vpc;
  } else if (serviceName === 'all' || serviceName === '全部') {
    // 全サービスのガイダンスを返す
    guidance = Object.values(SECURITY_GUIDANCE).join('\n\n---\n\n');
  }
  
  // 質問が含まれている場合は、それを明示
  if (args.question) {
    guidance = `### 質問: ${args.question}\n\n${guidance}`;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: guidance,
      },
    ],
  };
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AWS Security Advisor MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});