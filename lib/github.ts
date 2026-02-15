import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export class GitHubService {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  async getFile(path: string): Promise<any> {
    try {
      const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<any> {
    const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    const encodedContent = Buffer.from(content).toString('base64');
    
    const body: any = {
      message,
      content: encodedContent,
      branch: this.config.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await axios.put(url, body, { headers: this.getHeaders() });
    return response.data;
  }

  async deleteFile(path: string, sha: string, message: string): Promise<any> {
    const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    const response = await axios.delete(url, {
      headers: this.getHeaders(),
      data: {
        message,
        sha,
        branch: this.config.branch,
      },
    });
    return response.data;
  }

  async uploadFile(path: string, fileBuffer: Buffer, message: string): Promise<any> {
    const encodedContent = fileBuffer.toString('base64');
    const url = `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    
    const response = await axios.put(url, {
      message,
      content: encodedContent,
      branch: this.config.branch,
    }, { headers: this.getHeaders() });

    return response.data;
  }

  getRawUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;
  }
}

export function createGitHubService(): GitHubService {
  return new GitHubService({
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
  });
}
