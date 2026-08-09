import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this';
const ALGORITHM = 'aes-256-cbc';

// Derive a fixed 32-byte key from the encryption key
function deriveKey(key: string): Buffer {
  return crypto.createHash('sha256').update(String(key)).digest();
}

/**
 * Encrypt a value using AES-256-CBC
 */
export function encrypt(text: string): string {
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine IV and encrypted data
  const result = iv.toString('hex') + ':' + encrypted;
  return result;
}

/**
 * Decrypt a value encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  const key = deriveKey(ENCRYPTION_KEY);
  
  try {
    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Make sure ENCRYPTION_KEY is correct.');
  }
}
