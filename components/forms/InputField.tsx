import React from 'react'
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import { Eye, EyeOff } from 'lucide-react';

const InputField = ({
    name,
    label,
    placeholder,
    type = "text",
    showPasswordToggle = false,
    register,
    error,
    validation,
    disabled,
    value,
}: FormInputProps) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const canTogglePassword = showPasswordToggle && type === 'password';

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>
            <div className="relative">
                <Input
                    type={canTogglePassword && showPassword ? 'text' : type}
                    id={name}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value}
                    className={cn('form-input', {
                        'opacity-50 cursor-not-allowed': disabled,
                        'pr-11': canTogglePassword,
                    })}
                    {...register(name, validation)}
                />

                {canTogglePassword ? (
                    <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                        onClick={() => setShowPassword((prev) => !prev)}
                    >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                ) : null}
            </div>
            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    )
}
export default InputField
