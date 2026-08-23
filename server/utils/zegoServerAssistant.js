import crypto from 'crypto';

function makeNonce() {
    return crypto.randomBytes(12);
}

function aesGcmEncrypt(plainText, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAutoPadding(true);
    const encrypted = cipher.update(plainText, 'utf8');
    const final = cipher.final();
    const tag = cipher.getAuthTag();
    return Buffer.concat([encrypted, final, tag]);
}

/**
 * Generates a standard ZEGOCLOUD Token04 in Node.js
 * @param {number} appId - ZEGOCLOUD App ID
 * @param {string} userId - User ID
 * @param {string} secret - 32-character server secret
 * @param {number} effectiveTimeInSeconds - Token validity in seconds
 * @param {string} payload - Optional privilege payload
 * @returns {string} Token04
 */
export function generateToken04(appId, userId, secret, effectiveTimeInSeconds = 3600, payload = '') {
    if (!appId || isNaN(Number(appId))) {
        throw new Error('Invalid appId');
    }
    if (!userId) {
        throw new Error('Invalid userId');
    }
    if (!secret || secret.length !== 32) {
        throw new Error('Invalid secret: must be a 32-byte string');
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: Number(appId),
        user_id: String(userId),
        nonce: crypto.randomInt(-2147483648, 2147483647),
        ctime: createTime,
        expire: createTime + Number(effectiveTimeInSeconds),
        payload: payload || ''
    };

    const plainText = JSON.stringify(tokenInfo);
    const iv = makeNonce();
    const encryptBuf = aesGcmEncrypt(plainText, secret, iv);

    const b1 = Buffer.alloc(8);
    b1.writeBigInt64BE(BigInt(tokenInfo.expire), 0);
    const b2 = Buffer.alloc(2);
    b2.writeUInt16BE(iv.length, 0);
    const b3 = Buffer.alloc(2);
    b3.writeUInt16BE(encryptBuf.length, 0);

    const buf = Buffer.concat([b1, b2, iv, b3, encryptBuf]);
    return '04' + buf.toString('base64');
}
