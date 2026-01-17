import * as crypto from 'crypto';

export class EncryptionUtil {
    private static algorithm = 'aes-256-gcm';
    private static ivLength = 16;
    private static saltLength = 64;
    private static tagLength = 16;
    private static keyLength = 32;
    private static iterations = 10000;

    private static getKey(): Buffer {
        const secret = process.env.ENCRYPTION_KEY;
        if (!secret) {
            // Fallback for dev only - strictly warn in logs
            console.warn('WARNING: ENCRYPTION_KEY not set. Using insecure default.');
            return crypto.scryptSync('default-insecure-secret', 'salt', this.keyLength);
        }
        // We derive a key from the secret to ensure it's correct length
        return crypto.scryptSync(secret, 'salt', this.keyLength);
    }

    static encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const key = this.getKey();

        // Cast to CipherGCM to access getAuthTag
        const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    static decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }

        const [ivHex, authTagHex, encrypted] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = this.getKey();

        // Cast to DecipherGCM to access setAuthTag
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
