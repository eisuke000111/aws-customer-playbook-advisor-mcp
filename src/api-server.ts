#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { GitHubPlaybookClient } from './github-client.js';

const app = express();
const port = process.env.PORT || 3000;
const githubClient = new GitHubPlaybookClient();

// ミドルウェア
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AWS Security Advisor API', version: '2.0.0' });
});

// プレイブック一覧取得
app.get('/api/playbooks', async (req, res) => {
  try {
    const playbooks = await githubClient.getPlaybookList();
    res.json({
      success: true,
      data: playbooks,
      count: playbooks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playbook list',
      details: error.message
    });
  }
});

// サービス別予防策取得
app.get('/api/prevention/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { question } = req.query;
    
    const results = await githubClient.searchByServiceName(service);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No playbooks found for service: ${service}`,
        supportedServices: ['S3', 'IAM', 'EC2', 'RDS', 'VPC', 'SES', 'SageMaker', 'Bedrock']
      });
    }

    let response = question ? `Question: ${question}\n\n` : '';
    response += `# ${service.toUpperCase()} Security Guidance\n\n`;
    
    for (const result of results) {
      const preventionGuidance = githubClient.extractPreventionGuidance(result.content);
      response += `## ${result.filename}\n\n${preventionGuidance}\n\n---\n\n`;
    }
    
    res.json({
      success: true,
      data: {
        service: service.toUpperCase(),
        question: question || null,
        guidance: response,
        sources: results.map(r => r.filename)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prevention guidance',
      details: error.message
    });
  }
});

// シナリオ別プレイブック取得
app.get('/api/playbook/:scenario', async (req, res) => {
  try {
    const { scenario } = req.params;
    const { playbook_name } = req.query;
    
    // 特定のプレイブックが指定されている場合
    if (playbook_name) {
      const content = await githubClient.getPlaybookContent(playbook_name as string);
      if (content) {
        return res.json({
          success: true,
          data: {
            filename: playbook_name,
            content: content,
            summary: githubClient.extractSummary(content)
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          error: `Playbook not found: ${playbook_name}`
        });
      }
    }

    // シナリオベースで検索
    const results = await githubClient.searchPlaybooks(scenario);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No playbooks found for scenario: ${scenario}`
      });
    }

    const firstResult = results[0];
    const summary = githubClient.extractSummary(firstResult.content);
    
    res.json({
      success: true,
      data: {
        primary: {
          filename: firstResult.filename,
          summary: summary,
          content: firstResult.content
        },
        related: results.slice(1).map(r => ({
          filename: r.filename,
          summary: githubClient.extractSummary(r.content)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playbook',
      details: error.message
    });
  }
});

// OpenAPI仕様書エンドポイント
app.get('/api/docs', (req, res) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'AWS Security Advisor API',
      version: '2.0.0',
      description: 'AWS Security Playbook Framework Integration API'
    },
    servers: [
      { url: `http://localhost:${port}`, description: 'Local server' }
    ],
    paths: {
      '/api/playbooks': {
        get: {
          summary: 'Get all available playbooks',
          responses: {
            '200': {
              description: 'List of playbooks',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { type: 'string' } },
                      count: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/prevention/{service}': {
        get: {
          summary: 'Get prevention guidance for AWS service',
          parameters: [
            {
              name: 'service',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'AWS service name (s3, iam, ec2, etc.)'
            },
            {
              name: 'question',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Specific question about the service'
            }
          ]
        }
      }
    }
  };
  
  res.json(openApiSpec);
});

app.listen(port, () => {
  console.log(`AWS Security Advisor API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API docs: http://localhost:${port}/api/docs`);
});