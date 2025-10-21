import crypto from 'crypto';


const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SECRET = process.env.ENCRYPTION_KEY!;

export function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf-8'),
        cipher.final()
    ]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string) {
    const [ivPart, encryptedPart] = text.split(':');
    const iv = Buffer.from(ivPart, 'hex');
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        SECRET,
        iv
    );

    return Buffer.concat([
        decipher.update(Buffer.from(encryptedPart, 'hex')),
        decipher.final()
    ]).toString();
}