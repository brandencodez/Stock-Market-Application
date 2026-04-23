import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PasswordResetOtpDocument extends Document {
    email: string;
    otpHash: string;
    otpExpiresAt: Date;
    resendAvailableAt: Date;
    attemptCount: number;
    betterResetTokenEncrypted: string;
    grantHash?: string;
    grantExpiresAt?: Date;
    consumedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PasswordResetOtpSchema = new Schema<PasswordResetOtpDocument>(
    {
        email: { type: String, required: true, index: true, lowercase: true, trim: true },
        otpHash: { type: String, required: true },
        otpExpiresAt: { type: Date, required: true },
        resendAvailableAt: { type: Date, required: true },
        attemptCount: { type: Number, default: 0 },
        betterResetTokenEncrypted: { type: String, required: true },
        grantHash: { type: String },
        grantExpiresAt: { type: Date },
        consumedAt: { type: Date },
    },
    { timestamps: true }
);

PasswordResetOtpSchema.index({ email: 1, createdAt: -1 });

export const PasswordResetOtp: Model<PasswordResetOtpDocument> =
    (models?.PasswordResetOtp as Model<PasswordResetOtpDocument>) ||
    model<PasswordResetOtpDocument>('PasswordResetOtp', PasswordResetOtpSchema);
