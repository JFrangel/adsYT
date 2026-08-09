// Script para migrar manifest.json de main branch a data branch
// Usa fetch nativo para evitar dependencias adicionales

async function migrateManifest() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const owner = 'JFrangel';
  const repo = 'adsYT';
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    console.log('🔄 Starting manifest migration from main to data branch...');

    // 1. Obtener manifest.json desde main branch
    let mainManifest = null;
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/manifest.json?ref=main`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        mainManifest = {
          content: JSON.parse(content),
          sha: data.sha
        };
        console.log('✅ Found manifest.json in main branch');
      }
    } catch (error) {
      console.log('ℹ️ No manifest.json found in main branch:', error.message);
    }

    if (!mainManifest) {
      console.log('✅ Migration not needed - no manifest in main branch');
      return;
    }

    // 2. Crear data branch si no existe
    try {
      const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/data`, {
        headers
      });
      
      if (!branchResponse.ok) {
        console.log('📋 Creating data branch...');
        
        // Obtener último commit de main
        const mainBranch = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/main`, {
          headers
        });
        const mainData = await mainBranch.json();
        
        // Crear data branch
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ref: 'refs/heads/data',
            sha: mainData.commit.sha
          })
        });
        
        console.log('✅ Data branch created');
      }
    } catch (error) {
      console.log('⚠️ Error managing data branch:', error.message);
    }

    // 3. Verificar si ya existe manifest.json en data branch
    let dataManifestSha = null;
    try {
      const dataResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/manifest.json?ref=data`, {
        headers
      });
      
      if (dataResponse.ok) {
        const dataManifestData = await dataResponse.json();
        dataManifestSha = dataManifestData.sha;
        console.log('ℹ️ manifest.json already exists in data branch');
      }
    } catch (error) {
      console.log('📋 manifest.json does not exist in data branch yet');
    }

    // 4. Crear/actualizar manifest.json en data branch
    const createFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/manifest.json`;
    const fileContent = Buffer.from(JSON.stringify(mainManifest.content, null, 2)).toString('base64');
    
    const createResponse = await fetch(createFileUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: '[DATA] Migrate manifest.json from main branch [skip ci][skip netlify]',
        content: fileContent,
        branch: 'data',
        ...(dataManifestSha && { sha: dataManifestSha })
      })
    });

    if (createResponse.ok) {
      console.log('✅ manifest.json migrated to data branch');
    } else {
      throw new Error(`Failed to create file in data branch: ${createResponse.statusText}`);
    }

    // 5. Eliminar manifest.json de main branch
    const deleteResponse = await fetch(createFileUrl, {
      method: 'DELETE', 
      headers,
      body: JSON.stringify({
        message: '[CLEANUP] Remove manifest.json from main - now in data branch [skip ci][skip netlify]',
        sha: mainManifest.sha,
        branch: 'main'
      })
    });

    if (deleteResponse.ok) {
      console.log('✅ manifest.json removed from main branch');
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️ Could not delete from main branch - this is okay if it was already deleted');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateManifest();
}

module.exports = { migrateManifest };