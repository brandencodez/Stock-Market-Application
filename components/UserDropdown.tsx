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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, Edit } from "lucide-react";
import NavItems from "@/components/NavItems"; 
import { signOut, updateUserProfile } from "@/lib/actions/auth.actions";
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
    
    const [formData, setFormData] = useState({
        country: user.country || '',
        investmentGoals: user.investmentGoals || '',
        riskTolerance: user.riskTolerance || '',
        preferredIndustry: user.preferredIndustry || '',
    });

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const result = await updateUserProfile(formData);
            
            if (result.success) {
                setIsEditMode(false);
                setIsProfileOpen(false);
                window.location.reload();
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

            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-[500px] bg-gray-800 text-gray-100 border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-500">
                            {isEditMode ? 'Edit Profile' : `${user.name}'s Profile`}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {isEditMode ? 'Update your investment preferences' : 'View your profile information'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
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
                            <Input 
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                disabled={!isEditMode}
                                className={`${!isEditMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-900 border-gray-600'}`}
                                placeholder="Enter your country"
                            />
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