'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import { resetPasswordWithToken } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';

type ResetPasswordFormValues = {
    newPassword: string;
    confirmPassword: string;
};

const ResetPasswordPage = () => {
    const router = useRouter();

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ResetPasswordFormValues) => {
        const result = await resetPasswordWithToken({
            newPassword: data.newPassword,
            confirmPassword: data.confirmPassword,
        });

        if (!result.success) {
            toast.error('Reset failed', {
                description: result.error,
            });
            return;
        }

        toast.success('Password reset successful', {
            description: 'Please sign in with your new password.',
        });
        router.replace('/sign-in');
    };

    return (
        <>
            <h1 className="form-title">Set New Password</h1>
            <p className="text-sm text-gray-500 mb-6">
                Choose a strong password with at least 8 characters.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <InputField
                    name="newPassword"
                    label="New Password"
                    placeholder="Enter your new password"
                    type="password"
                    showPasswordToggle
                    register={register}
                    error={errors.newPassword}
                    validation={{
                        required: 'Password is required',
                        minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                        },
                    }}
                />

                <InputField
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Re-enter your new password"
                    type="password"
                    showPasswordToggle
                    register={register}
                    error={errors.confirmPassword}
                    validation={{
                        required: 'Please confirm your password',
                        validate: (value: string) =>
                            value === watch('newPassword') || 'Passwords do not match',
                    }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Updating password...' : 'Reset Password'}
                </Button>
            </form>
        </>
    );
};

export default ResetPasswordPage;
