import crypto from 'crypto';

export function hashPhoneNumber(phone: string) {    
    return crypto
        .createHash('sha256')
        .update(phone + process.env.PHONE_HASH_SALT)
        .digest('hex');
}