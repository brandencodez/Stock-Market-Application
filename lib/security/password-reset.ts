import crypto from 'crypto';
import { connectToDatabase } from '@/database/mongoose';
import { PasswordResetOtp } from '@/database/models/password-reset-otp.model';

const OTP_EXPIRY_MS = 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const GRANT_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

 //Derives a stable 32-byte AES key
const getCryptoKey = () => {
    const secret = process.env.BETTER_AUTH_SECRET || '';
    return crypto.createHash('sha256').update(secret).digest();
};

const sha256Hex = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

//Compares a stored SHA-256 hex hash against a plain-text value 
const timingSafeEqualHex = (hashHex: string, plainText: string) => {
    const a = Buffer.from(hashHex, 'hex');
    const b = crypto.createHash('sha256').update(plainText).digest();
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// AES-256-GCM: authenticated encryption — detects tampering via the auth tag
const encryptText = (plainText: string) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getCryptoKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
};

const decryptText = (encryptedValue: string) => {
    const [ivB64, tagB64, dataB64] = encryptedValue.split('.');
    if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted value');

    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', getCryptoKey(), iv);
    decipher.setAuthTag(authTag); // GCM will throw if the tag doesn't match, preventing use of tampered data

    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return plain.toString('utf8');
};

// Produces a zero-padded 4-digit string e.g. "0042"
const generateOtp = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');

export const getOtpExpirySeconds = () => Math.floor(OTP_EXPIRY_MS / 1000);
export const getOtpResendCooldownSeconds = () => Math.floor(RESEND_COOLDOWN_MS / 1000);

export const createPasswordResetOtpRecord = async ({
    email,
    betterResetToken,
}: {
    email: string;
    betterResetToken: string;
}) => {
    await connectToDatabase();

    const otp = generateOtp();
    const now = Date.now();
    
    /* Delete any previous OTP records for this email so only one active
     reset request can exist at a time*/
    await PasswordResetOtp.deleteMany({ email: email.toLowerCase() });

    await PasswordResetOtp.create({
        email: email.toLowerCase(),
        otpHash: sha256Hex(otp),
        otpExpiresAt: new Date(now + OTP_EXPIRY_MS),
        resendAvailableAt: new Date(now + RESEND_COOLDOWN_MS),
        attemptCount: 0,
        betterResetTokenEncrypted: encryptText(betterResetToken),
    });

    return {
        otp,
        otpExpirySeconds: getOtpExpirySeconds(),
    };
};

export const getResendSecondsRemaining = async (email: string) => {
    await connectToDatabase();

    const doc = await PasswordResetOtp.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
    if (!doc) return 0;

    const remainingMs = doc.resendAvailableAt.getTime() - Date.now();
    if (remainingMs <= 0) return 0;

    return Math.ceil(remainingMs / 1000);
};

export const verifyOtpAndIssueResetGrant = async ({
    email,
    otp,
}: {
    email: string;
    otp: string;
}): Promise<{ success: true; grantToken: string } | { success: false; error: string }> => {
    await connectToDatabase();

    const doc = await PasswordResetOtp.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
    if (!doc) return { success: false, error: 'Invalid or expired OTP.' };

    if (doc.otpExpiresAt.getTime() < Date.now()) {
        return { success: false, error: 'Invalid or expired OTP.' };
    }

    if (doc.attemptCount >= MAX_ATTEMPTS) {
        return { success: false, error: 'Too many failed attempts. Request a new OTP.' };
    }

 // Use timing-safe comparison to prevent timing attacks on OTP verification
    if (!timingSafeEqualHex(doc.otpHash, otp)) {
        doc.attemptCount += 1;
        await doc.save();
        return { success: false, error: 'Invalid or expired OTP.' };
    }

     /*OTP verified — issue a single-use grant token and store only its hash.
    The grant bridges OTP verification and the actual password reset step.*/
    const grantToken = crypto.randomBytes(32).toString('hex');
    doc.grantHash = sha256Hex(grantToken);
    doc.grantExpiresAt = new Date(Date.now() + GRANT_EXPIRY_MS);
    doc.consumedAt = new Date();
    await doc.save();

    return { success: true, grantToken };
};

export const consumeResetGrant = async (
    grantToken: string
): Promise<{ success: true; resetToken: string } | { success: false; error: string }> => {
    await connectToDatabase();

    const grantHash = sha256Hex(grantToken);

    const doc = await PasswordResetOtp.findOne({
        grantHash,
        grantExpiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!doc) {
        return { success: false, error: 'Reset session expired. Request a new OTP.' };
    }

    const resetToken = decryptText(doc.betterResetTokenEncrypted);
    
// Invalidate the grant by clearing its hash so it cannot be reused
    doc.grantHash = undefined;
    doc.grantExpiresAt = undefined;
    await doc.save();

    return { success: true, resetToken };
};
