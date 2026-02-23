import axios from 'axios';
import { decrypt } from './encryption';

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
    
    console.log('📡 GitHub Upload Start:', {
      url,
      branch: this.config.branch,
      fileBufferLength: fileBuffer.length,
      encodedContentLength: encodedContent.length,
      messageLength: message.length,
    });
    
    if (fileBuffer.length === 0) {
      console.error('❌ ERROR: Attempting to upload empty buffer!', {
        path,
        bufferLength: 0,
      });
      throw new Error('Cannot upload empty file - buffer length is 0');
    }
    
    try {
      // Check if file already exists to get the SHA
      const existingFile = await this.getFile(path);
      const body: any = {
        message,
        content: encodedContent,
        branch: this.config.branch,
      };
      
      // If file exists, include the SHA for update
      if (existingFile && existingFile.sha) {
        body.sha = existingFile.sha;
        console.log('📝 File exists, updating with SHA:', existingFile.sha);
      }
      
      console.log('📤 Sending to GitHub API...', {
        contentLength: body.content.length,
        bodySize: JSON.stringify(body).length,
      });
      
      const response = await axios.put(url, body, { headers: this.getHeaders() });

      console.log('✅ GitHub Upload Complete:', {
        status: response.status,
        dataSize: JSON.stringify(response.data).length,
        hasSha: !!response.data.content?.sha,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ GitHub API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        documentation_url: error.response?.data?.documentation_url,
        errors: error.response?.data?.errors,
      });
      throw error;
    }
  }

  getRawUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;
  }
}

export function createGitHubService(): GitHubService {
  let token = process.env.GITHUB_TOKEN || '';
  
  // If token is encrypted, decrypt it
  if (process.env.GITHUB_TOKEN_ENCRYPTED) {
    try {
      token = decrypt(process.env.GITHUB_TOKEN_ENCRYPTED);
    } catch (error) {
      console.error('Failed to decrypt GitHub token:', error);
      throw new Error('Invalid GITHUB_TOKEN_ENCRYPTED. Make sure ENCRYPTION_KEY is set correctly.');
    }
  }
  
  if (!token) {
    throw new Error('GitHub token not found. Set GITHUB_TOKEN or GITHUB_TOKEN_ENCRYPTED in .env');
  }
  
  return new GitHubService({
    token,
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
  });
}

export function createGitHubDataService(): GitHubService {
  let token = process.env.GITHUB_TOKEN || '';
  
  // If token is encrypted, decrypt it
  if (process.env.GITHUB_TOKEN_ENCRYPTED) {
    try {
      token = decrypt(process.env.GITHUB_TOKEN_ENCRYPTED);
    } catch (error) {
      console.error('Failed to decrypt GitHub token:', error);
      throw new Error('Invalid GITHUB_TOKEN_ENCRYPTED. Make sure ENCRYPTION_KEY is set correctly.');
    }
  }
  
  if (!token) {
    throw new Error('GitHub token not found. Set GITHUB_TOKEN or GITHUB_TOKEN_ENCRYPTED in .env');
  }
  
  return new GitHubService({
    token,
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: 'data', // Usar rama data para evitar builds en Netlify
  });
}
