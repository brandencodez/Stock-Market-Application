'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, Edit, Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react";
import NavItems from "@/components/NavItems"; 
import { changeCurrentUserPassword, signOut, updateUserProfile } from "@/lib/actions/auth.actions";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import countryList from "react-select-country-list";

interface ExtendedUser {
    id: string;
    name: string;
    email: string;
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}

const UserDropdown = ({ user }: { user: ExtendedUser }) => {
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        next: false,
        confirm: false,
    });
    const countries = countryList().getData();
    
    const [formData, setFormData] = useState({
        country: user.country || '',
        investmentGoals: user.investmentGoals || '',
        riskTolerance: user.riskTolerance || '',
        preferredIndustry: user.preferredIndustry || '',
    });

    const getFlagEmoji = (countryCode: string) => {
        if (!countryCode || countryCode.length !== 2) return '';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    const getCountryLabel = (countryCode: string) => {
        if (!countryCode) return 'Not set';
        return countries.find((country) => country.value === countryCode)?.label || countryCode;
    };

    const clearPasswordFields = () => {
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setShowPasswords({
            current: false,
            next: false,
            confirm: false,
        });
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const isPasswordSectionTouched =
                passwordData.currentPassword.length > 0 ||
                passwordData.newPassword.length > 0 ||
                passwordData.confirmPassword.length > 0;

            if (isPasswordSectionTouched) {
                if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                    alert('Please fill all password fields or leave all empty.');
                    return;
                }

                const passwordResult = await changeCurrentUserPassword(passwordData);
                if (!passwordResult.success) {
                    alert(passwordResult.error || 'Failed to change password');
                    return;
                }
            }

            const result = await updateUserProfile(formData);
            
            if (result.success) {
                setIsEditMode(false);
                setIsProfileOpen(false);
                clearPasswordFields();
                router.refresh();
            } else {
                console.error('Failed to update profile:', result.error);
                alert(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleCancelEdit = () => {
        setFormData({
            country: user.country || '',
            investmentGoals: user.investmentGoals || '',
            riskTolerance: user.riskTolerance || '',
            preferredIndustry: user.preferredIndustry || '',
        });
        clearPasswordFields();
        setIsEditMode(false);
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-500">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="text-gray-400">
                    <DropdownMenuLabel>
                        <div className="flex relative items-center gap-3 py-2">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                    {user.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className='text-base font-medium text-gray-400'>
                                    {user.name}
                                </span>
                                <span className="text-sm text-gray-500">{user.email}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600"/>
                    
                    <DropdownMenuItem 
                        onClick={() => setIsProfileOpen(true)} 
                        className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
                    >
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
                    >
                        <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                        Logout
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
                    
                    <nav className="sm:hidden">
                        <NavItems /> 
                    </nav>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={isProfileOpen}
                onOpenChange={(open) => {
                    setIsProfileOpen(open);
                    if (!open) {
                        setIsEditMode(false);
                        clearPasswordFields();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px] bg-gray-800 text-gray-100 border-gray-700 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-500">
                            {isEditMode ? 'Edit Profile' : `${user.name}'s Profile`}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {isEditMode ? 'Update your investment preferences and optionally change your password' : 'View your profile information'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 pr-1">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Name</Label>
                            <Input 
                                value={user.name} 
                                disabled 
                                className="bg-gray-700 border-gray-600 text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Email</Label>
                            <Input 
                                value={user.email} 
                                disabled 
                                className="bg-gray-700 border-gray-600 text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Country</Label>
                            {isEditMode ? (
                                <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            role='combobox'
                                            aria-expanded={isCountryOpen}
                                            className='country-select-trigger'
                                        >
                                            {formData.country ? (
                                                <span className='flex items-center gap-2'>
                                                    <span>{getFlagEmoji(formData.country)}</span>
                                                    <span>{getCountryLabel(formData.country)}</span>
                                                </span>
                                            ) : (
                                                'Select your country...'
                                            )}
                                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-full p-0 bg-gray-800 border-gray-600'
                                        align='start'
                                    >
                                        <Command className='bg-gray-800 border-gray-600'>
                                            <CommandInput
                                                placeholder='Search countries...'
                                                className='country-select-input'
                                            />
                                            <CommandEmpty className='country-select-empty'>
                                                No country found.
                                            </CommandEmpty>
                                            <CommandList className='max-h-60 bg-gray-800 scrollbar-hide-default'>
                                                <CommandGroup className='bg-gray-800'>
                                                    {countries.map((country) => (
                                                        <CommandItem
                                                            key={country.value}
                                                            value={`${country.label} ${country.value}`}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, country: country.value });
                                                                setIsCountryOpen(false);
                                                            }}
                                                            className='country-select-item'
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4 text-yellow-500',
                                                                    formData.country === country.value ? 'opacity-100' : 'opacity-0'
                                                                )}
                                                            />
                                                            <span className='flex items-center gap-2'>
                                                                <span>{getFlagEmoji(country.value)}</span>
                                                                <span>{country.label}</span>
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <Input
                                    value={formData.country ? `${getFlagEmoji(formData.country)} ${getCountryLabel(formData.country)}` : 'Not set'}
                                    disabled
                                    className='bg-gray-700 border-gray-600 text-gray-400'
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Investment Goals</Label>
                            {isEditMode ? (
                                <Select 
                                    value={formData.investmentGoals}
                                    onValueChange={(value) => setFormData({ ...formData, investmentGoals: value })}
                                >
                                    <SelectTrigger className="bg-gray-900 border-gray-600">
                                        <SelectValue placeholder="Select investment goals" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="growth">Growth</SelectItem>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="balanced">Balanced</SelectItem>
                                        <SelectItem value="preservation">Capital Preservation</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input 
                                    value={formData.investmentGoals || 'Not set'}
                                    disabled 
                                    className="bg-gray-700 border-gray-600 text-gray-400 capitalize"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Risk Tolerance</Label>
                            {isEditMode ? (
                                <Select 
                                    value={formData.riskTolerance}
                                    onValueChange={(value) => setFormData({ ...formData, riskTolerance: value })}
                                >
                                    <SelectTrigger className="bg-gray-900 border-gray-600">
                                        <SelectValue placeholder="Select risk tolerance" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="conservative">Conservative</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="aggressive">Aggressive</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input 
                                    value={formData.riskTolerance || 'Not set'}
                                    disabled 
                                    className="bg-gray-700 border-gray-600 text-gray-400 capitalize"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Preferred Industry</Label>
                            {isEditMode ? (
                                <Select 
                                    value={formData.preferredIndustry}
                                    onValueChange={(value) => setFormData({ ...formData, preferredIndustry: value })}
                                >
                                    <SelectTrigger className="bg-gray-900 border-gray-600">
                                        <SelectValue placeholder="Select preferred industry" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="technology">Technology</SelectItem>
                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="energy">Energy</SelectItem>
                                        <SelectItem value="consumer">Consumer Goods</SelectItem>
                                        <SelectItem value="real-estate">Real Estate</SelectItem>
                                        <SelectItem value="mixed">Mixed/Diversified</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input 
                                    value={formData.preferredIndustry || 'Not set'}
                                    disabled 
                                    className="bg-gray-700 border-gray-600 text-gray-400 capitalize"
                                />
                            )}
                        </div>

                        {isEditMode && (
                            <>
                                <div className="border-t border-gray-700 pt-4">
                                    <p className="text-sm text-gray-400 mb-3">Change Password (optional)</p>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="bg-gray-900 border-gray-600 pr-10"
                                                autoComplete="current-password"
                                                placeholder="Enter your current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                                aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                                            >
                                                {showPasswords.current ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-300">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.next ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="bg-gray-900 border-gray-600 pr-10"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                            aria-label={showPasswords.next ? "Hide new password" : "Show new password"}
                                        >
                                            {showPasswords.next ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-300">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="bg-gray-900 border-gray-600 pr-10"
                                            autoComplete="new-password"
                                            placeholder="Re-enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                            aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                                        >
                                            {showPasswords.confirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        {isEditMode ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={isLoading}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className="bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setIsEditMode(true)}
                                className="bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default UserDropdown