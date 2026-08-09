const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Naive env parser
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/\r/g, '');
    }
});
Object.assign(process.env, env);

function decrypt(encryptedText) {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_secure_key_123!@#', 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const token = process.env.GITHUB_TOKEN_ENCRYPTED ? decrypt(process.env.GITHUB_TOKEN_ENCRYPTED) : process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

console.log('Fetching files from GitHub data branch directly...');
console.log(`Repo: ${owner}/${repo}`);

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/contents/manifest.json?ref=data`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'NodeJS',
    'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.message) { console.error('GitHub API Error:', json.message); return; }
        
        const content = Buffer.from(json.content, 'base64').toString('utf8');
        const manifest = JSON.parse(content);
        console.log('\n--- MANIFEST.JSON FILES ---');
        manifest.files.forEach(f => {
            console.log(`- ID: ${f.id} | Name: ${f.filename} | Size: ${(f.size/1024/1024).toFixed(2)} MB`);
        });
        
        if (manifest.files.length > 0) {
            const firstFile = manifest.files[0];
            console.log('\nTesting download API (localhost:3007) for:', firstFile.id);
            const http = require('http');
            http.get('http://localhost:3007/api/download?file=' + firstFile.id, (dlRes) => {
                console.log('STATUS:', dlRes.statusCode);
                console.log('HEADERS:', dlRes.headers);
                let body = '';
                dlRes.on('data', chunk => {
                    body += chunk.toString('utf8');
                    if (body.length > 500) {
                        dlRes.destroy(); // Stop downloading early
                    }
                });
                dlRes.on('close', () => {
                    console.log('Downloaded content snippet:\n' + body.substring(0, 500));
                });
            });
        }
      } catch(e) {
          console.error('Parse error:', e, data.substring(0, 100));
      }
  });
});
req.on('error', e => console.error(e));
req.end();
