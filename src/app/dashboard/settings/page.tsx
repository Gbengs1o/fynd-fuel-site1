'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
    ArrowLeft, User, Lock, Bell, Bookmark, Trophy, 
    Shield, Mail, Trash2, LogOut, Moon, Sun, ChevronRight,
    Gauge, Share2
} from 'lucide-react';
import { LetterAvatar } from '@/components/LetterAvatar';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

interface SettingsItemProps {
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    onClick: () => void;
    destructive?: boolean;
    rightElement?: React.ReactNode;
}

const SettingsItem = ({ icon, label, subtitle, onClick, destructive, rightElement }: SettingsItemProps) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 dark:border-white/5 last:border-0"
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            destructive 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
            : 'bg-gray-50 dark:bg-white/5 text-[#1A1A1A]/60 dark:text-white/60 group-hover:bg-white dark:group-hover:bg-white/10'
        }`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className={`font-semibold text-sm ${destructive ? 'text-red-600' : 'text-[#1A1A1A] dark:text-white'}`}>
                {label}
            </p>
            {subtitle && (
                <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40 mt-0.5">{subtitle}</p>
            )}
        </div>
        <div className="flex items-center gap-2">
            {rightElement}
            {!rightElement && <ChevronRight className="w-4 h-4 text-[#1A1A1A]/20 dark:text-white/20 group-hover:translate-x-0.5 transition-transform" />}
        </div>
    </button>
);

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/30 ml-4 mb-3">
            {title}
        </h3>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[24px] shadow-sm border border-[#3B0764]/5 dark:border-white/5 overflow-hidden">
            {children}
        </div>
    </div>
);

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profile);

            // Check system theme
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
            
            setIsLoading(false);
        };
        checkAuth();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    if (isLoading) return <LoadingAnimation />;

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#3B0764]/10 dark:border-white/10 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4 text-center">
                    <button 
                        onClick={() => router.back()}
                        className="absolute left-4 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white">Settings</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pt-8">
                {/* Profile Peek */}
                <button 
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full bg-white dark:bg-[#1A1A1A] p-5 rounded-[32px] mb-8 shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex items-center gap-4 text-left group transition-all active:scale-[0.98]"
                >
                    <LetterAvatar 
                        name={profile?.nickname || profile?.full_name || 'U'} 
                        avatarUrl={profile?.avatar_url} 
                        size={60}
                        className="shadow-xl shadow-[#3B0764]/10"
                    />
                    <div className="flex-1">
                        <h2 className="font-black text-lg text-[#1A1A1A] dark:text-white leading-tight">
                            {profile?.nickname || profile?.full_name || 'User'}
                        </h2>
                        <p className="text-sm text-[#1A1A1A]/40 dark:text-white/40">{user?.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#1A1A1A]/20 dark:text-white/20 group-hover:translate-x-1 transition-transform" />
                </button>

                <Section title="Appearance">
                    <SettingsItem 
                        icon={isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        label="Dark Mode"
                        onClick={toggleTheme}
                        rightElement={
                            <div className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-[#3B0764]' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                            </div>
                        }
                    />
                </Section>

                <Section title="Account">
                    <SettingsItem 
                        icon={<User className="w-5 h-5" />}
                        label="Edit Profile"
                        onClick={() => router.push('/dashboard/profile')}
                    />
                    <SettingsItem 
                        icon={<Lock className="w-5 h-5" />}
                        label="Security"
                        subtitle="Change password and session management"
                        onClick={() => router.push('/dashboard/security')}
                    />
                </Section>

                <Section title="Gamification">
                    <SettingsItem 
                        icon={<Trophy className="w-5 h-5" />}
                        label="Leaderboard"
                        onClick={() => router.push('/dashboard/leaderboard')}
                    />
                    <SettingsItem 
                        icon={<Share2 className="w-5 h-5" />}
                        label="Refer & Earn"
                        subtitle="Invite friends and get points"
                        onClick={() => router.push('/dashboard/referrals')}
                    />
                </Section>

                <Section title="Pro Features">
                    <SettingsItem 
                        icon={<Gauge className="w-5 h-5 text-amber-500" />}
                        label="Generator Manager"
                        subtitle="Track fuel usage & costs"
                        onClick={() => router.push('/dashboard/generator')}
                    />
                </Section>

                <Section title="App Settings">
                    <SettingsItem 
                        icon={<Bell className="w-5 h-5" />}
                        label="Notifications"
                        onClick={() => router.push('/dashboard/notifications')}
                    />
                    <SettingsItem 
                        icon={<Bookmark className="w-5 h-5" />}
                        label="Tracked Activities"
                        onClick={() => router.push('/dashboard/favorites')}
                    />
                </Section>

                <Section title="Support">
                    <SettingsItem 
                        icon={<Shield className="w-5 h-5" />}
                        label="Privacy Policy"
                        onClick={() => router.push('/privacy')}
                    />
                    <SettingsItem 
                        icon={<Mail className="w-5 h-5" />}
                        label="Contact Us"
                        onClick={() => router.push('/contact')}
                    />
                </Section>

                <div className="px-4">
                    <button 
                        onClick={handleSignOut}
                        className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100 dark:border-red-900/30"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>

                    <p className="text-center text-[10px] font-bold text-[#1A1A1A]/30 dark:text-white/30 mt-8 mb-4">
                        FYND FUEL v1.0.4 • MADE WITH ❤️ IN NIGERIA
                    </p>
                </div>
            </main>
        </div>
    );
}
