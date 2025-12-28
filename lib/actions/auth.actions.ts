'use server';

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

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
        
        const response = await a.api.signUpEmail({ 
            body: { 
                email, 
                password, 
                name: fullName,
                country,
                investmentGoals,
                riskTolerance,
                preferredIndustry
            } as any
        });

        console.log('Signup response:', JSON.stringify(response, null, 2));

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
    } catch (e: any) {
        console.log('Sign up failed', JSON.stringify(e, null, 2));
        return { success: false, error: e?.message || JSON.stringify(e) };
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const a = await auth();
        const response = await a.api.signInEmail({
            body: { email, password }
        });

        return { success: true, data: response };
    } catch (e: any) {
        console.log("SignIn error:", e);
        return {
            success: false,
            error: e?.message ?? e?.response?.data?.message ?? "Invalid email or password"
        };
    }
};

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
            } as any
        });

        return { success: true, data: response };
    } catch (e: any) {
        console.log('Profile update failed', JSON.stringify(e, null, 2));
        return { success: false, error: e?.message || 'Failed to update profile' };
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

        const user = session.user as any;

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