'use server';

import { auth } from "@/lib/better-auth/auth";
import { getSafeAppBaseUrl } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import {
    consumeResetGrant,
    getResendSecondsRemaining,
    getOtpResendCooldownSeconds,
    verifyOtpAndIssueResetGrant,
} from "@/lib/security/password-reset";

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;

    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
    ) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        const responseMessage = response?.data?.message;
        if (responseMessage) return responseMessage;
    }

    return fallback;
};


// --- Validation Schemas ---
const forgotPasswordSchema = z.object({
    email: z.string().trim().email("Please enter a valid email address"),
});

const verifyOtpSchema = z.object({
    email: z.string().trim().email("Please enter a valid email address"),
    otp: z.string().trim().regex(/^\d{4}$/, "OTP must be exactly 4 digits"),
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "New password must be at least 8 characters")
        .max(128, "New password is too long")
        .regex(/[A-Z]/, "New password must include an uppercase letter")
        .regex(/[a-z]/, "New password must include a lowercase letter")
        .regex(/[0-9]/, "New password must include a number")
        .regex(/[^A-Za-z0-9]/, "New password must include a special character"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});

// --- Auth Actions ---
export const signUpWithEmail = async ({ 
    email, 
    password, 
    fullName, 
    country, 
    investmentGoals, 
    riskTolerance, 
    preferredIndustry 
}: SignUpFormData) => {
    try {
        const a = await auth();
        
        console.log('Signing up with data:', { 
            email, 
            name: fullName, 
            country, 
            investmentGoals, 
            riskTolerance, 
            preferredIndustry 
        });
        
        const signUpBody = {
                email, 
                password, 
                name: fullName,
                country,
                investmentGoals,
                riskTolerance,
                preferredIndustry
            };

        const response = await a.api.signUpEmail({ 
            body: signUpBody,
        });

        console.log('Signup response:', JSON.stringify(response, null, 2));
 
        // Only send the event once we have confirmed the user was created
        if(response?.user?.id) {
            await inngest.send({
                name: 'app/user.created',
                data: { 
                    email, 
                    name: fullName, 
                    country, 
                    investmentGoals, 
                    riskTolerance, 
                    preferredIndustry 
                }
            });
        }

        return { success: true, data: response };
    } catch (e: unknown) {
        console.log('Sign up failed', JSON.stringify(e, null, 2));
        return { success: false, error: getErrorMessage(e, 'Sign up failed') };
    }
}


/** Authenticates an existing user with email and password. */
export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const a = await auth();
        const response = await a.api.signInEmail({
            body: { email, password }
        });

        return { success: true, data: response };
    } catch (e: unknown) {
        console.log("SignIn error:", e);
        return {
            success: false,
            error: getErrorMessage(e, "Invalid email or password")
        };
    }
};

/** Invalidates the current session server-side. */
export const signOut = async () => {
    try {
        const a = await auth();
        await a.api.signOut({ headers: await headers() });
        return { success: true };
    } catch (e) {
        console.log('Sign out failed', e);
        return { success: false, error: 'Sign out failed' };
    }
}


/** Updates the authenticated user's investor profile fields. */
export const updateUserProfile = async ({ 
    country, 
    investmentGoals, 
    riskTolerance, 
    preferredIndustry 
}: {
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}) => {
    try {
        const a = await auth();
        
        const session = await a.api.getSession({ headers: await headers() });
        
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await a.api.updateUser({
            headers: await headers(),
            body: {
                country,
                investmentGoals,
                riskTolerance,
                preferredIndustry
            } as Record<string, unknown>
        });

        return { success: true, data: response };
    } catch (e: unknown) {
        console.log('Profile update failed', JSON.stringify(e, null, 2));
        return { success: false, error: getErrorMessage(e, 'Failed to update profile') };
    }
}

/**
 * Changes password for the currently authenticated user.
 * Requires current password verification and enforces strength constraints.
 */
export const changeCurrentUserPassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
}: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}) => {
    try {
        const parsed = changePasswordSchema.safeParse({
            currentPassword,
            newPassword,
            confirmPassword,
        });

        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || "Invalid password update request",
            };
        }

        const a = await auth();
        const requestHeaders = await headers();
        const session = await a.api.getSession({ headers: requestHeaders });

        if (!session?.user?.email) {
            return { success: false, error: "Not authenticated" };
        }

        // Verify current password before attempting to rotate it.
        await a.api.signInEmail({
            body: {
                email: session.user.email,
                password: parsed.data.currentPassword,
            },
        });

        await a.api.changePassword({
            headers: requestHeaders,
            body: {
                currentPassword: parsed.data.currentPassword,
                newPassword: parsed.data.newPassword,
                revokeOtherSessions: true,
            },
        });

        return { success: true };
    } catch (e: unknown) {
        console.log("Password change failed", JSON.stringify(e, null, 2));
        return {
            success: false,
            error: getErrorMessage(e, "Failed to change password"),
        };
    }
}

export async function getCurrentUser() {
    try {
        const a = await auth();
        const session = await a.api.getSession({ 
            headers: await headers() 
        });

        if (!session?.user) {
            return null;
        }

        const user = session.user as {
            id: string;
            name: string;
            email: string;
            country?: string;
            investmentGoals?: string;
            riskTolerance?: string;
            preferredIndustry?: string;
        };

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('getCurrentUser - User loaded');
        }

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            country: user.country || '',
            investmentGoals: user.investmentGoals || '',
            riskTolerance: user.riskTolerance || '',
            preferredIndustry: user.preferredIndustry || '',
        };

        return userData;
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}

// --- Password Reset Flow ---
// The flow is: requestPasswordReset → verifyPasswordResetOtp → resetPasswordWithToken
export const requestPasswordReset = async ({ email }: { email: string }) => {
    const genericMessage = "If the email exists, an OTP has been sent.";

    try {
        const parsed = forgotPasswordSchema.safeParse({ email });
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid email" };
        }

        const retryAfterSeconds = await getResendSecondsRemaining(parsed.data.email);
        if (retryAfterSeconds > 0) {
            return {
                success: false,
                error: `Please wait ${retryAfterSeconds}s before requesting a new OTP.`,
                retryAfterSeconds,
            };
        }

        const a = await auth();
        const redirectTo = `${getSafeAppBaseUrl()}/reset-password`;

        await a.api.requestPasswordReset({
            body: {
                email: parsed.data.email,
                redirectTo,
            },
        });

        return {
            success: true,
            message: genericMessage,
            resendCooldownSeconds: getOtpResendCooldownSeconds(),
        };
    } catch {
        // Return generic success to avoid account enumeration hints.
        // the email exists or whether the mail provider failed
        return {
            success: true,
            message: genericMessage,
            resendCooldownSeconds: getOtpResendCooldownSeconds(),
        };
    }
};

export const resendPasswordResetOtp = async ({ email }: { email: string }) => {
    return requestPasswordReset({ email });
};

/**
 * Validates the OTP the user entered and, if correct, issues a short-lived
 * reset grant stored in an HTTP-only cookie (10-minute TTL).
 * The cookie is scoped to `/reset-password` to limit its exposure.
 */
export const verifyPasswordResetOtp = async ({ email, otp }: { email: string; otp: string }) => {
    const parsed = verifyOtpSchema.safeParse({ email, otp });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || 'Invalid OTP' };
    }

    const verificationResult = await verifyOtpAndIssueResetGrant(parsed.data);
    if (!verificationResult.success) {
        return { success: false, error: verificationResult.error };
    }

    // Store the grant token in an HTTP-only cookie so the client never sees it
    const cookieStore = await cookies();
    cookieStore.set('password_reset_grant', verificationResult.grantToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/reset-password',
        maxAge: 10 * 60,
    });

    return { success: true };
};

/**
 * Consumes the reset grant cookie and updates the user's password.
 * The grant is single-use — `consumeResetGrant` deletes it after reading,
 * so replaying the request with the same cookie will fail.
 */
export const resetPasswordWithToken = async ({
    newPassword,
    confirmPassword,
}: {
    newPassword: string;
    confirmPassword: string;
}) => {
    try {
        const parsed = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid reset request" };
        }

        const cookieStore = await cookies();
        const grantCookie = cookieStore.get('password_reset_grant')?.value;
        if (!grantCookie) {
            return { success: false, error: 'Reset session expired. Verify OTP again.' };
        }

        const grantResult = await consumeResetGrant(grantCookie);
        if (!grantResult.success) {
             // Clear the invalid/expired cookie to force a fresh OTP request
            cookieStore.delete('password_reset_grant');
            return { success: false, error: grantResult.error };
        }

        const a = await auth();

        await a.api.resetPassword({
            body: {
                token: grantResult.resetToken,
                newPassword: parsed.data.newPassword,
            },
        });
         // Clean up the grant cookie now that the reset is complete
        cookieStore.delete('password_reset_grant');

        return { success: true };
    } catch {
        return {
            success: false,
            error: "This reset link is invalid or expired. Please request a new one.",
        };
    }
};