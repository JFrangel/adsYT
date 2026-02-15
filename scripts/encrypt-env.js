#!/usr/bin/env node

/**
 * Script to encrypt GitHub token before storing in .env
 * Usage: node scripts/encrypt-env.js <your-github-token>
 * 
 * Example:
 *   node scripts/encrypt-env.js ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * 
 * Then copy the encrypted output to .env.local as:
 *   GITHUB_TOKEN_ENCRYPTED=<encrypted-output>
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this';
const ALGORITHM = 'aes-256-cbc';

function deriveKey(key) {
  return crypto.createHash('sha256').update(String(key)).digest();
}

function encrypt(text) {
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const result = iv.toString('hex') + ':' + encrypted;
  return result;
}

function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.error('❌ Error: Token no proporcionado');
    console.log('Uso: node scripts/encrypt-env.js <github-token>');
    console.log('Ejemplo: node scripts/encrypt-env.js ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }
  
  if (token.length < 10) {
    console.error('❌ Error: El token parece demasiado corto');
    process.exit(1);
  }
  
  try {
    const encrypted = encrypt(token);
    
    console.log('\n✅ Token encriptado exitosamente\n');
    console.log('📋 Copia esta línea a tu archivo .env.local:\n');
    console.log(`GITHUB_TOKEN_ENCRYPTED=${encrypted}\n`);
    console.log('⚠️  Asegúrate de que ENCRYPTION_KEY esté configurada en tu .env.local\n');
    console.log('💡 Ejemplo:');
    console.log('   ENCRYPTION_KEY=tu-clave-secreta-aqui');
    console.log(`   GITHUB_TOKEN_ENCRYPTED=${encrypted}\n`);
    
  } catch (error) {
    console.error('❌ Error al encriptar:', error.message);
    process.exit(1);
  }
}

main();
