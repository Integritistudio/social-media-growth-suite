const crypto = require('crypto');

const ALGO = 'aes-256-cbc';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return Buffer.from(raw.padEnd(64, '0').slice(0, 64), 'hex');
}

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return '';
  try {
    const [ivHex, encHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

module.exports = { encrypt, decrypt };
