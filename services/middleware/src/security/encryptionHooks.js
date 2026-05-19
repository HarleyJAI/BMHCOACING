const crypto = require('crypto');

/**
 * Sketch encryption-at-rest hook:
 * Replace implementation with KMS/HSM-backed envelope encryption.
 */
function encryptForStorage(payload) {
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'dev-key').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    keyRef: process.env.ENCRYPTION_KEY_REF || 'local-dev-key-ref',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    createdAt: new Date().toISOString()
  };
}

module.exports = { encryptForStorage };
