// GitHub APIクライアントを別ファイルに分離
export class GitHubPlaybookClient {
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