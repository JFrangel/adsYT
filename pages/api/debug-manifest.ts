import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubDataService } from '@/lib/github';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const githubData = createGitHubDataService();
    const manifestFile = await githubData.getFile('manifest.json');
    if (!manifestFile) {
        return res.status(404).json({ error: 'Manifest not found' });
    }
    const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(content);
    
    if (manifest.files.length === 0) return res.status(200).json({ error: 'No files' });
    
    const file = manifest.files[0];
    const fileContent = await githubData.getFile(`files/${file.filename}`);
    const downloadUrl = fileContent.download_url || githubData.getRawUrl(`files/${file.filename}`);
    
    let streamResp;
    try {
        streamResp = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    } catch (e: any) {
        return res.status(500).json({ 
            error: 'Axios GET failed',
            status: e.response?.status,
            message: e.message,
            githubUrl: downloadUrl.substring(0, 100) + '...'
        });
    }

    const buffer = Buffer.from(streamResp.data);
    
    return res.status(200).json({ 
        fileId: file.id,
        fileName: file.filename,
        hasDownloadUrlOriginal: !!fileContent.download_url,
        usedUrl: downloadUrl.substring(0, 100) + '...',
        cdnStatus: streamResp.status,
        byteCountDownloaded: buffer.length,
        first50Chars: buffer.slice(0, 50).toString('utf-8')
    });
  } catch (error: any) {
    return res.status(500).json({ 
        error: error.message,
        responseContent: error.response?.data?.toString()
    });
  }
}
