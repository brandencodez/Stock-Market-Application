import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordChangedEmail, sendPasswordResetEmail } from "@/lib/nodemailer";
import {
    createPasswordResetOtpRecord,
    getOtpExpirySeconds,
} from "@/lib/security/password-reset";

const RESET_TOKEN_EXPIRY_SECONDS = 10 * 60;

const getSafeAppBaseUrl = () => {
    const explicitBaseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (explicitBaseUrl) return explicitBaseUrl;

    const authBaseUrl = process.env.BETTER_AUTH_URL || "";
    return authBaseUrl.replace(/\/api\/auth\/?$/, "");
};

let authInstance: ReturnType<typeof betterAuth> | null = null;

export async function auth() {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection failed");

    authInstance = betterAuth({
        database: mongodbAdapter(db as unknown as Parameters<typeof mongodbAdapter>[0]),
        secret: process.env.BETTER_AUTH_SECRET!,
        baseURL: process.env.BETTER_AUTH_URL!,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false, 
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
            resetPasswordTokenExpiresIn: RESET_TOKEN_EXPIRY_SECONDS,
            revokeSessionsOnPasswordReset: true,
            sendResetPassword: async ({ user, token }) => {
                const otpPayload = await createPasswordResetOtpRecord({
                    email: user.email,
                    betterResetToken: token,
                });

                await sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    otpCode: otpPayload.otp,
                    expirySeconds: getOtpExpirySeconds(),
                });
            },
            onPasswordReset: async ({ user }) => {
                await sendPasswordChangedEmail({
                    email: user.email,
                    name: user.name,
                });
            },
        },
        plugins: [nextCookies()],
        user: {
            additionalFields: {
                country: {
                    type: "string",
                    required: false,
                },
                investmentGoals: {
                    type: "string",
                    required: false,
                },
                riskTolerance: {
                    type: "string",
                    required: false,
                },
                preferredIndustry: {
                    type: "string",
                    required: false,
                },
            },
        },
    });

    return authInstance;
}

export { getSafeAppBaseUrl };