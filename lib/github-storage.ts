// GitHub API para guardar checkpoints de clicks
import { decrypt } from './encryption';

interface CheckpointData {
  [linkId: string]: number;
  lastUpdated: number;
  totalCheckpoints: number;
}

function getGitHubToken(): string | null {
  let token = process.env.GITHUB_TOKEN || '';
  
  // Si el token está encriptado, desencriptarlo
  if (process.env.GITHUB_TOKEN_ENCRYPTED) {
    try {
      token = decrypt(process.env.GITHUB_TOKEN_ENCRYPTED);
    } catch (error) {
      console.error('Failed to decrypt GitHub token:', error);
      return null;
    }
  }
  
  return token || null;
}

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'JFrangel';
const GITHUB_REPO = process.env.GITHUB_REPO || 'adsYT';
const CHECKPOINT_FILE = 'data/click-checkpoints.json';

export async function saveCheckpointToGitHub(data: CheckpointData): Promise<boolean> {
  const GITHUB_TOKEN = getGitHubToken();
  
  if (!GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN not configured, skipping checkpoint save');
    return false;
  }

  try {
    // 1. Obtener el SHA actual del archivo
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let sha: string | undefined;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // 2. Actualizar el archivo
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update click checkpoints: ${data.totalCheckpoints} saves`,
          content,
          sha,
          branch: 'main',
        }),
      }
    );

    if (updateResponse.ok) {
      console.log('✅ Checkpoint saved to GitHub:', data);
      return true;
    } else {
      const error = await updateResponse.text();
      console.error('❌ Failed to save checkpoint:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving checkpoint to GitHub:', error);
    return false;
  }
}

export async function loadCheckpointFromGitHub(): Promise<CheckpointData | null> {
  const GITHUB_TOKEN = getGitHubToken();
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}`,
      {
        headers: {
          Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : '',
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const data = JSON.parse(content);
      console.log('✅ Checkpoint loaded from GitHub:', data);
      return data;
    }
  } catch (error) {
    console.error('❌ Error loading checkpoint from GitHub:', error);
  }
  
  return null;
}
