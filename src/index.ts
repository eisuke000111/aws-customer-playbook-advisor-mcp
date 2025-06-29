#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// GitHub APIクライアント
class GitHubPlaybookClient {
  private baseUrl = 'https://api.github.com';
  private repo = 'aws-samples/aws-customer-playbook-framework';
  private cache = new Map<string, { content: string; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分キャッシュ

  async getPlaybookList(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/docs`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const files = await response.json() as any[];
      return files
        .filter(file => file.name.endsWith('.md') && file.name !== 'README.md')
        .map(file => file.name.replace('.md', ''));
    } catch (error) {
      console.error('Error fetching playbook list:', error);
      return [];
    }
  }

  async getPlaybookContent(filename: string): Promise<string> {
    const cacheKey = `playbook_${filename}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.content;
    }

    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/docs/${filename}.md`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json() as any;
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      // キャッシュに保存
      this.cache.set(cacheKey, { content, timestamp: Date.now() });
      
      return content;
    } catch (error) {
      console.error(`Error fetching playbook ${filename}:`, error);
      return '';
    }
  }

  async searchPlaybooks(query: string): Promise<{ filename: string; content: string }[]> {
    const playbooks = await this.getPlaybookList();
    const results: { filename: string; content: string }[] = [];
    
    for (const playbook of playbooks) {
      if (playbook.toLowerCase().includes(query.toLowerCase())) {
        const content = await this.getPlaybookContent(playbook);
        if (content) {
          results.push({ filename: playbook, content });
        }
      }
    }
    
    return results;
  }

  async searchByServiceName(serviceName: string): Promise<{ filename: string; content: string }[]> {
    const playbooks = await this.getPlaybookList();
    const results: { filename: string; content: string }[] = [];
    
    // サービス名に基づくファイル名フィルタリング
    const serviceKeywords: Record<string, string[]> = {
      's3': ['s3', 'public_access'],
      'iam': ['iam', 'credentials', 'compromised'],
      'ec2': ['ec2', 'ransom_response_ec2'],
      'rds': ['rds', 'ransom_response_rds'],
      'vpc': ['vpc', 'network'],
      'ses': ['ses'],
      'sagemaker': ['sagemaker'],
      'bedrock': ['bedrock'],
      'ransomware': ['ransom'],
      'cryptojacking': ['cryptojacking']
    };

    const keywords = serviceKeywords[serviceName.toLowerCase()] || [serviceName.toLowerCase()];
    
    for (const playbook of playbooks) {
      const playbookLower = playbook.toLowerCase();
      if (keywords.some((keyword: string) => playbookLower.includes(keyword))) {
        const content = await this.getPlaybookContent(playbook);
        if (content) {
          results.push({ filename: playbook, content });
        }
      }
    }
    
    return results;
  }

  extractSummary(content: string): string {
    const lines = content.split('\n');
    let summary = '';
    let inSummary = false;
    
    for (const line of lines) {
      if (line.includes('## Summary') || line.includes('## 概要') || line.includes('# Overview')) {
        inSummary = true;
        continue;
      }
      if (inSummary && line.startsWith('##') && !line.includes('Summary') && !line.includes('概要')) {
        break;
      }
      if (inSummary && line.trim()) {
        summary += line + '\n';
      }
    }
    
    // サマリーが見つからない場合は最初の数行を使用
    if (!summary.trim()) {
      const firstLines = lines.slice(0, 10).filter(line => line.trim() && !line.startsWith('#')).slice(0, 3);
      summary = firstLines.join('\n');
    }
    
    return summary.trim() || content.substring(0, 500) + '...';
  }

  extractPreventionGuidance(content: string): string {
    const lines = content.split('\n');
    let guidance = '';
    let inPrevention = false;
    
    // 予防策に関するセクションを探す
    for (const line of lines) {
      if (line.toLowerCase().includes('prevention') || 
          line.toLowerCase().includes('mitigation') || 
          line.toLowerCase().includes('best practices') ||
          line.toLowerCase().includes('security controls') ||
          line.includes('予防')) {
        inPrevention = true;
        guidance += line + '\n';
        continue;
      }
      
      if (inPrevention && line.startsWith('##') && 
          !line.toLowerCase().includes('prevention') &&
          !line.toLowerCase().includes('mitigation') &&
          !line.toLowerCase().includes('best practices')) {
        break;
      }
      
      if (inPrevention && line.trim()) {
        guidance += line + '\n';
      }
    }
    
    return guidance.trim() || this.extractSummary(content);
  }
}

const githubClient = new GitHubPlaybookClient();

// MCPサーバーの初期化
const server = new Server(
  {
    name: 'aws-security-advisor',
    version: '2.0.0',
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
        name: 'get_aws_playbook',
        description: 'AWS公式プレイブックフレームワークから最新のセキュリティプレイブックを取得します',
        inputSchema: {
          type: 'object',
          properties: {
            scenario: {
              type: 'string',
              description: 'セキュリティシナリオ（例: s3, iam, ransomware, compromised, public_access等）',
            },
            playbook_name: {
              type: 'string',
              description: '特定のプレイブック名（オプション）',
            },
          },
          required: ['scenario'],
        },
      },
      {
        name: 'get_prevention_guidance',
        description: 'AWSサービスの予防的セキュリティガイダンスを公式プレイブックから取得します',
        inputSchema: {
          type: 'object',
          properties: {
            service: {
              type: 'string',
              description: 'AWSサービス名（例: S3, IAM, EC2, VPC, RDS等）',
            },
            question: {
              type: 'string',
              description: '具体的な質問（オプション）',
            },
          },
          required: ['service'],
        },
      },
      {
        name: 'list_available_playbooks',
        description: '利用可能なAWSセキュリティプレイブックの一覧を取得します',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_prevention_guidance': {
      const { service, question } = args as { service?: string; question?: string };
      
      if (!service) {
        return {
          content: [{ type: 'text', text: 'エラー: serviceパラメータが必要です。' }],
        };
      }

      try {
        const results = await githubClient.searchByServiceName(service);
        
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `サービス "${service}" に関連するプレイブックが見つかりませんでした。利用可能なサービス: S3, IAM, EC2, RDS, VPC, SES, SageMaker, Bedrock` }],
          };
        }

        let response = question ? `### 質問: ${question}\n\n` : '';
        response += `# ${service.toUpperCase()}セキュリティガイダンス\n\n`;
        
        for (const result of results) {
          const preventionGuidance = githubClient.extractPreventionGuidance(result.content);
          response += `## ${result.filename}\n\n${preventionGuidance}\n\n---\n\n`;
        }
        
        return {
          content: [{ type: 'text', text: response }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `エラー: ガイダンスの取得に失敗しました - ${error}` }],
        };
      }
    }

    case 'list_available_playbooks': {
      try {
        const playbooks = await githubClient.getPlaybookList();
        const playbookList = playbooks.length > 0 
          ? `## 利用可能なAWSセキュリティプレイブック\n\n${playbooks.map(name => `- ${name}`).join('\n')}\n\n合計: ${playbooks.length}個のプレイブック`
          : 'プレイブック一覧の取得に失敗しました。';
        
        return {
          content: [{ type: 'text', text: playbookList }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `エラー: プレイブック一覧の取得に失敗しました - ${error}` }],
        };
      }
    }

    case 'get_aws_playbook': {
      const { scenario, playbook_name } = args as { scenario?: string; playbook_name?: string };
      
      if (!scenario) {
        return {
          content: [{ type: 'text', text: 'エラー: scenarioパラメータが必要です。' }],
        };
      }

      try {
        // 特定のプレイブックが指定されている場合
        if (playbook_name) {
          const content = await githubClient.getPlaybookContent(playbook_name);
          if (content) {
            return {
              content: [{ type: 'text', text: `# ${playbook_name}\n\n${content}` }],
            };
          } else {
            return {
              content: [{ type: 'text', text: `エラー: プレイブック "${playbook_name}" が見つかりませんでした。` }],
            };
          }
        }

        // シナリオベースで検索
        const results = await githubClient.searchPlaybooks(scenario);
        
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `シナリオ "${scenario}" に関連するプレイブックが見つかりませんでした。` }],
          };
        }

        // 最初の結果を返す（複数ある場合は最初のもの）
        const firstResult = results[0];
        const summary = githubClient.extractSummary(firstResult.content);
        
        let response = `# ${firstResult.filename}\n\n## 概要\n${summary}\n\n`;
        
        if (results.length > 1) {
          response += `## その他の関連プレイブック\n${results.slice(1).map(r => `- ${r.filename}`).join('\n')}\n\n`;
        }
        
        response += `## 詳細コンテンツ\n${firstResult.content}`;
        
        return {
          content: [{ type: 'text', text: response }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `エラー: プレイブックの取得に失敗しました - ${error}` }],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AWS Security Advisor MCP Server v2.0 started (GitHub API only)');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});