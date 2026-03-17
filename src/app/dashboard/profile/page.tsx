'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Settings, LogOut, Camera, Star, TrendingUp, User, Leaf,
    Tag, MapPin, MessageCircle, Phone, Building2, ChevronRight,
    Trophy, Bell, Bookmark, ArrowLeft, Gift, Gauge, Lock, History, AlertCircle, Pencil, AtSign
} from 'lucide-react';
import { LetterAvatar } from '@/components/LetterAvatar';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { getVehicleStatus, getProgressToNextLevel } from '@/lib/gamification';

// Types
interface Profile {
    full_name: string;
    nickname: string | null;
    street: string | null;
    city: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [stats, setStats] = useState({
        priceReportCount: 0,
        stationAddCount: 0,
        reviewCount: 0,
        totalPoints: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [redeemPhone, setRedeemPhone] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Contribution Level Logic (UI Badge)
    const contributionLevel = useMemo(() => {
        const total = stats.priceReportCount + stats.stationAddCount + stats.reviewCount;
        if (total >= 100) return { name: 'Expert', icon: Star, color: '#FFB800', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
        if (total >= 50) return { name: 'Active', icon: TrendingUp, color: '#9333EA', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        if (total >= 10) return { name: 'Regular', icon: User, color: '#16A34A', bg: 'bg-green-100 dark:bg-green-900/30' };
        return { name: 'Newcomer', icon: Leaf, color: '#71717A', bg: 'bg-gray-100 dark:bg-gray-800' };
    }, [stats]);

    // Data Fetching
    const fetchProfileAndStats = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        try {
            const [profileRes, statsRes] = await Promise.all([
                supabase.from('profiles').select('full_name, nickname, street, city, phone_number, avatar_url').eq('id', user.id).single(),
                supabase.rpc('get_user_stats')
            ]);

            let statsData = { price_report_count: 0, station_add_count: 0, review_count: 0, total_points: 0 };
            if (statsRes.data) {
                if (Array.isArray(statsRes.data) && statsRes.data[0]) statsData = statsRes.data[0];
                else if (!Array.isArray(statsRes.data)) statsData = statsRes.data as any;
            }

            if (profileRes.data) setProfile(profileRes.data as Profile);
            setStats({
                priceReportCount: statsData.price_report_count || 0,
                stationAddCount: statsData.station_add_count || 0,
                reviewCount: statsData.review_count || 0,
                totalPoints: statsData.total_points || 0
            });
            setWalletBalance(statsData.total_points || 0); // Assuming totalPoints is wallet balance for now
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfileAndStats();
    }, [fetchProfileAndStats]);

    // Handlers
    const handleUpdateProfile = async () => {
        if (!user || !profile) return;
        setIsSaving(true);
        const { error } = await supabase.from('profiles').update({
            full_name: profile.full_name,
            nickname: profile.nickname,
            street: profile.street,
            city: profile.city,
            phone_number: profile.phone_number
        }).eq('id', user.id);

        if (error) {
            alert('Failed to update profile.');
        } else {
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !event.target.files[0] || !user) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${fileExt}`;
        setIsSaving(true);

        try {
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

            if (updateError) throw updateError;

            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Failed to upload avatar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRedeem = async () => {
        if (!redeemPhone || redeemPhone.length < 11) {
            alert("Please enter a valid 11-digit phone number.");
            return;
        }

        if (confirm(`Redeem ${walletBalance} Pts for ₦${(walletBalance * 0.1).toFixed(0)} Airtime to ${redeemPhone}?`)) {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.rpc('submit_redemption_request', {
                    p_points_amount: walletBalance,
                    p_phone_number: redeemPhone
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.message);

                alert("Redemption request submitted! You will receive your airtime shortly.");
                fetchProfileAndStats(); // Refresh balance
            } catch (e: any) {
                alert(e.message || "Redemption failed.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212]"><LoadingAnimation /></div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212]">Could not load profile.</div>;

    const vehicleStatus = getVehicleStatus(stats.totalPoints);
    const progressToNext = getProgressToNextLevel(stats.totalPoints);
    const LevelIcon = contributionLevel.icon;

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-20">
            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Redesigned Header - Horizontal Card Style */}
            <header className="px-6 pt-12 pb-4">
                <div className="max-w-xl mx-auto bg-white dark:bg-[#1A1A1A] p-4 rounded-3xl shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex items-center relative gap-4">
                    <div className="absolute top-2 left-2">
                        <button onClick={() => router.push('/dashboard')} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]/40 dark:text-white/40" />
                        </button>
                    </div>

                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <LetterAvatar
                            avatarUrl={profile.avatar_url}
                            name={profile.full_name}
                            size={70}
                            className="shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-[#3B0764] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1A1A1A] shadow-sm transform group-hover:scale-110 transition-transform">
                            <Camera className="w-3 h-3 text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-lg font-bold text-[#1A1A1A] dark:text-white truncate">{profile.full_name || 'User'}</h1>
                            <LevelIcon className="w-4 h-4" style={{ color: contributionLevel.color }} />
                        </div>
                        <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50 truncate font-medium">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsEditing(true)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <Pencil className="w-5 h-5 text-[#3B0764]/60 dark:text-purple-400/60" />
                        </button>
                        <button onClick={() => router.push('/dashboard/settings')} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <Settings className="w-5 h-5 text-[#3B0764]/60 dark:text-purple-400/60" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 space-y-6">
                {/* 1. My Garage - Premium Status Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                <Gauge className="w-5 h-5 text-[#3B0764] dark:text-purple-400" />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] dark:text-white">My Garage</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-xs font-bold text-[#3B0764] dark:text-purple-400">
                            {stats.totalPoints} XP
                        </span>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#F5F5F0] dark:bg-[#121212] flex items-center justify-center text-4xl shadow-inner border border-black/5 dark:border-white/5">
                            {vehicleStatus.icon}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Current Ride</p>
                            <h4 className="text-xl font-black text-[#3B0764] dark:text-white">{vehicleStatus.level}</h4>
                        </div>
                    </div>

                    {vehicleStatus.nextLevel && (
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNext}%` }}
                                    className="h-full bg-gradient-to-r from-[#3B0764] to-[#6366F1] rounded-full"
                                />
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-gray-400">{Math.round(progressToNext)}% Complete</span>
                                <span className="text-[#3B0764] dark:text-purple-400">Next: {vehicleStatus.nextLevel}</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* 2. Rewards Wallet */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#3B0764] dark:bg-purple-950 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
                >
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-white">Rewards Wallet</h3>
                        </div>

                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-1">Available Balance</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-white">{walletBalance}</span>
                                    <span className="text-sm font-bold text-white/70">Pts</span>
                                </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                                <span className="text-xs font-bold text-white">≈ ₦{(walletBalance * 0.1).toFixed(0)}</span>
                            </div>
                        </div>

                        {walletBalance >= 500 ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="tel"
                                        placeholder="Enter Phone Number"
                                        value={redeemPhone}
                                        onChange={(e) => setRedeemPhone(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleRedeem}
                                    className="w-full bg-white text-[#3B0764] font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg"
                                >
                                    Claim Airtime
                                </button>
                                <div className="flex items-center justify-center gap-1.5 opacity-60">
                                    <AlertCircle className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Rewards expire in 2 days!</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                                <Lock className="w-6 h-6 text-white/30" />
                                <span className="text-[11px] font-bold text-white/50 text-center px-6 uppercase tracking-wider">Earn 500 Pts to unlock payout</span>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
                            <button onClick={() => router.push('/dashboard/points-history')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                                <History className="w-4 h-4 text-white/60 group-hover:text-white" />
                                <span className="text-xs font-bold text-white/60 group-hover:text-white">History</span>
                            </button>
                            <button onClick={() => router.push('/dashboard/points-board')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                                <Trophy className="w-4 h-4 text-white/60 group-hover:text-white" />
                                <span className="text-xs font-bold text-white/60 group-hover:text-white">Earn More</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-[#3B0764]/5 dark:border-white/5 flex flex-col items-center shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                            <Tag className="w-5 h-5 text-[#3B0764] dark:text-purple-400" />
                        </div>
                        <span className="text-xl font-black text-[#1A1A1A] dark:text-white">{stats.priceReportCount}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Reports</span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-[#3B0764]/5 dark:border-white/5 flex flex-col items-center shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
                            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xl font-black text-[#1A1A1A] dark:text-white">{stats.stationAddCount}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Stations</span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-[#3B0764]/5 dark:border-white/5 flex flex-col items-center shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-2">
                            <MessageCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-xl font-black text-[#1A1A1A] dark:text-white">{stats.reviewCount}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Reviews</span>
                    </div>
                </div>

                {/* 4. Quick Links / Menu */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5">
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-6">Explore More</h3>
                    
                    <div className="space-y-2">
                        <MenuButton
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Refer & Earn"
                            badge="NEW"
                            color="text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20"
                            onClick={() => router.push('/dashboard/referrals')}
                        />
                        <MenuButton
                            icon={<Trophy className="w-5 h-5" />}
                            label="Leaderboard"
                            color="text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                            onClick={() => router.push('/dashboard/leaderboard')}
                        />
                        <MenuButton
                            icon={<Bookmark className="w-5 h-5" />}
                            label="Saved Stations"
                            color="text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                            onClick={() => router.push('/dashboard/favorites')}
                        />
                        <MenuButton
                            icon={<Gauge className="w-5 h-5" />}
                            label="Generator Manager"
                            badge="NEW"
                            color="text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20"
                            onClick={() => router.push('/dashboard/generator')}
                        />
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                            <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="flex-1 text-left font-bold text-red-600 dark:text-red-400">Log Out Account</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal (Ported from Mobile UI) */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 sm:px-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditing(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-lg bg-white dark:bg-[#1A1A1A] rounded-t-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-8" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white">Edit Profile</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                                    <ArrowLeft className="w-6 h-6 text-gray-400 rotate-90" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <InputGroup
                                    label="Full Name"
                                    icon={<User className="w-5 h-5" />}
                                    value={profile.full_name || ''}
                                    onChange={(val) => setProfile({ ...profile, full_name: val })}
                                    placeholder="Enter your name"
                                />
                                <InputGroup
                                    label="Nickname / Display Name"
                                    icon={<AtSign className="w-5 h-5" />}
                                    value={profile.nickname || ''}
                                    onChange={(val) => setProfile({ ...profile, nickname: val })}
                                    placeholder="Enter privacy nickname"
                                />
                                <InputGroup
                                    label="Phone Number"
                                    icon={<Phone className="w-5 h-5" />}
                                    value={profile.phone_number || ''}
                                    onChange={(val) => setProfile({ ...profile, phone_number: val })}
                                    placeholder="Enter mobile number"
                                    type="tel"
                                />
                                <InputGroup
                                    label="City"
                                    icon={<MapPin className="w-5 h-5" />}
                                    value={profile.city || ''}
                                    onChange={(val) => setProfile({ ...profile, city: val })}
                                    placeholder="Enter current city"
                                />
                                <InputGroup
                                    label="Street Address"
                                    icon={<Building2 className="w-5 h-5" />}
                                    value={profile.street || ''}
                                    onChange={(val) => setProfile({ ...profile, street: val })}
                                    placeholder="Enter street name"
                                />

                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isSaving}
                                    className="w-full bg-[#3B0764] text-white font-black py-5 rounded-3xl hover:bg-[#4C0D8C] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-purple-900/20 mt-8"
                                >
                                    {isSaving ? 'Saving Changes...' : 'Save Profile'}
                                </button>
                                <div className="h-10" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper Components
function MenuButton({ icon, label, badge, color, onClick }: { icon: any, label: string, badge?: string, color: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group active:scale-[0.99]">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                {icon}
            </div>
            <span className="flex-1 text-left font-bold text-[#1A1A1A] dark:text-white">{label}</span>
            {badge && (
                <span className="px-2 py-0.5 rounded-lg bg-[#3B0764] text-[8px] font-black text-white">
                    {badge}
                </span>
            )}
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
        </button>
    );
}

function InputGroup({ label, icon, value, onChange, placeholder, type = "text" }: { label: string, icon: any, value: string, onChange: (val: string) => void, placeholder: string, type?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B0764] transition-colors">
                    {icon}
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl py-4 pl-14 pr-6 text-sm font-bold text-[#1A1A1A] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-[#3B0764]/5 focus:border-[#3B0764]/20 transition-all"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}
