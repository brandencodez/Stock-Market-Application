'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { requestPasswordReset } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type ForgotPasswordFormValues = {
    email: string;
};

const ForgotPasswordPage = () => {
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
        defaultValues: { email: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        const result = await requestPasswordReset(data);

        if (!result.success) {
            toast.error('Request failed', {
                description: result.error,
            });
            return;
        }

        toast.success('Check your inbox', {
            description: 'If the email exists, we sent a 4-digit OTP.',
        });

        router.push(`/verify-reset-otp?email=${encodeURIComponent(data.email)}`);
    };

    return (
        <>
            <h1 className="form-title">Forgot Password</h1>

            <p className="text-sm text-gray-500 mb-6">
                Enter your email to receive a 4-digit verification OTP.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <InputField
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: 'Invalid email format',
                        },
                    }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                <FooterLink
                    text="Remembered your password?"
                    linkText="Sign in"
                    href="/sign-in"
                />
            </form>
        </>
    );
};

export default ForgotPasswordPage;
