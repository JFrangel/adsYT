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
    console.log('💾 Saving to GitHub data branch to avoid Netlify builds...');
    
    // 1. Obtener el SHA actual del archivo desde la rama data
    let getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}?ref=data`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let sha: string | undefined;
    
    // Si la rama data no existe, necesitamos crearla
    if (getResponse.status === 404) {
      console.log('🌿 Branch "data" not found, creating it...');
      
      // Obtener el SHA del último commit de main
      const mainBranchResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/main`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (mainBranchResponse.ok) {
        const mainData = await mainBranchResponse.json();
        const mainSha = mainData.object.sha;
        
        // Crear la rama data basada en main
        const createBranchResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`,
          {
            method: 'POST',
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'refs/heads/data',
              sha: mainSha,
            }),
          }
        );
        
        if (createBranchResponse.ok) {
          console.log('✅ Branch "data" created successfully');
          // Intentar obtener el archivo de nuevo
          getResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}?ref=data`,
            {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
        } else {
          console.error('❌ Failed to create data branch');
        }
      }
    }
    
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // 2. Actualizar el archivo en la rama data
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
          message: `Update click checkpoints: ${data.totalCheckpoints} saves [skip ci]`,
          content,
          sha,
          branch: 'data', // Usar rama separada para no triggerear builds
        }),
      }
    );

    if (updateResponse.ok) {
      console.log('✅ Checkpoint saved to GitHub data branch (no build triggered)');
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
    console.log('📥 Loading checkpoints from GitHub data branch...');
    
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CHECKPOINT_FILE}?ref=data`,
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
      console.log('✅ Checkpoint loaded from GitHub data branch:', data);
      return data;
    } else if (response.status === 404) {
      console.log('ℹ️ No checkpoint file found in data branch (this is normal for first run)');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading checkpoint from GitHub:', error);
  }
  
  return null;
}
