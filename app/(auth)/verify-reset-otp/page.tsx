'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { resendPasswordResetOtp, verifyPasswordResetOtp } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

const VerifyResetOtpPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [secondsLeft, setSecondsLeft] = useState<number>(RESEND_SECONDS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const otpValue = useMemo(() => digits.join(''), [digits]);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = window.setInterval(() => {
            setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [secondsLeft]);

    const handleDigitChange = (index: number, value: string) => {
        const next = value.replace(/\D/g, '').slice(-1);
        const updated = [...digits];
        updated[index] = next;
        setDigits(updated);

        if (next && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;

        const updated = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((char, idx) => {
            updated[idx] = char;
        });

        setDigits(updated);
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputsRef.current[focusIndex]?.focus();
    };

    const onVerify = async () => {
        if (!email) {
            toast.error('Missing email context. Please restart reset flow.');
            return;
        }

        if (otpValue.length !== OTP_LENGTH) {
            toast.error('Please enter the 4-digit OTP.');
            return;
        }

        setIsSubmitting(true);
        const result = await verifyPasswordResetOtp({ email, otp: otpValue });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error('Verification failed', { description: result.error });
            return;
        }

        toast.success('OTP verified');
        router.push('/reset-password');
    };

    const onResend = async () => {
        if (secondsLeft > 0) return;
        if (!email) {
            toast.error('Missing email context. Please restart reset flow.');
            return;
        }

        setIsResending(true);
        const result = await resendPasswordResetOtp({ email });
        setIsResending(false);

        if (!result.success) {
            toast.error('Unable to resend OTP', { description: result.error });
            return;
        }

        setDigits(Array(OTP_LENGTH).fill(''));
        setSecondsLeft(RESEND_SECONDS);
        toast.success('A new OTP has been sent');
    };

    if (!email) {
        return (
            <>
                <h1 className="form-title">Invalid verification session</h1>
                <p className="text-sm text-gray-500 mb-6">Please start again from Forgot Password.</p>
                <Link href="/forgot-password" className="footer-link">Go to Forgot Password</Link>
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Email Verification</h1>
            <p className="text-sm text-gray-500 mb-6">
                We sent a 4-digit code to {email}. It expires in 60 seconds.
            </p>

            <div className="flex items-center justify-between gap-3 mb-6">
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputsRef.current[index] = el;
                        }}
                        value={digit}
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        onPaste={handlePaste}
                        maxLength={1}
                        inputMode="numeric"
                        aria-label={`OTP digit ${index + 1}`}
                        className="h-14 w-14 rounded-xl border border-gray-600 bg-gray-800 text-center text-2xl font-semibold text-white outline-none focus:border-yellow-500"
                    />
                ))}
            </div>

            <Button onClick={onVerify} disabled={isSubmitting} className="yellow-btn w-full">
                {isSubmitting ? 'Verifying...' : 'Verify Account'}
            </Button>

            <div className="mt-6 text-center text-sm text-gray-500">
                <span>Didn&apos;t receive code? </span>
                {secondsLeft > 0 ? (
                    <span>Resend OTP in {secondsLeft}s</span>
                ) : (
                    <button
                        type="button"
                        className="footer-link"
                        onClick={onResend}
                        disabled={isResending}
                    >
                        {isResending ? 'Resending...' : 'Resend OTP'}
                    </button>
                )}
            </div>
        </>
    );
};

export default VerifyResetOtpPage;
