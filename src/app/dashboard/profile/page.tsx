'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Settings, LogOut, Camera, Star, TrendingUp, User, Leaf,
    Tag, MapPin, MessageCircle, Phone, Building2, ChevronRight,
    Trophy, Bell, Bookmark
} from 'lucide-react';
import { LetterAvatar } from '@/components/LetterAvatar';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

// Types
interface Profile {
    full_name: string;
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
    const [stats, setStats] = useState({
        priceReportCount: 0,
        stationAddCount: 0,
        reviewCount: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Contribution Level Logic
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
                supabase.from('profiles').select('full_name, street, city, phone_number, avatar_url').eq('id', user.id).single(),
                supabase.rpc('get_user_stats').match({ user_id: user.id }) // Passing user_id explicitly if RPC requires arg, or rely on auth.uid()
            ]);

            // Handling RPC returning array or object
            let statsData = { price_report_count: 0, station_add_count: 0, review_count: 0 };

            // If RPC relies on auth.uid(), it might return a single row, or array
            if (statsRes.data) {
                if (Array.isArray(statsRes.data) && statsRes.data[0]) {
                    statsData = statsRes.data[0];
                } else if (!Array.isArray(statsRes.data)) {
                    statsData = statsRes.data as any;
                }
            }

            if (profileRes.data) setProfile(profileRes.data as Profile);
            setStats({
                priceReportCount: statsData.price_report_count || 0,
                stationAddCount: statsData.station_add_count || 0,
                reviewCount: statsData.review_count || 0
            });
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

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212]"><LoadingAnimation /></div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212]">Could not load profile.</div>;

    const LevelIcon = contributionLevel.icon;

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-[#1A1A1A] pb-8 pt-12 px-6 rounded-b-3xl shadow-sm border-b border-[#3B0764]/10 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Settings className="w-6 h-6 text-[#1A1A1A]/60 dark:text-white/60" />
                    </button>
                    <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="w-6 h-6 text-[#1A1A1A]/60 dark:text-white/60 hover:text-red-500" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <LetterAvatar
                            avatarUrl={profile.avatar_url}
                            name={profile.full_name}
                            size={100}
                            className="shadow-xl"
                        />
                        <div className="absolute bottom-0 right-0 bg-[#3B0764] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#1A1A1A] shadow-sm transform group-hover:scale-110 transition-transform">
                            <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-1">{profile.full_name}</h1>
                    <p className="text-[#1A1A1A]/50 dark:text-white/50 text-sm mb-4">{user.email}</p>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${contributionLevel.bg}`}>
                        <LevelIcon className="w-4 h-4" style={{ color: contributionLevel.color }} />
                        <span className="text-xs font-bold" style={{ color: contributionLevel.color }}>
                            {contributionLevel.name} Contributor
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-4 -mt-6 relative z-10 space-y-6">
                {/* Stats */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex divide-x divide-gray-100 dark:divide-white/5"
                >
                    <div className="flex-1 flex flex-col items-center p-2">
                        <div className="w-9 h-9 rounded-lg bg-[#3B0764]/10 flex items-center justify-center mb-2">
                            <Tag className="w-4 h-4 text-[#3B0764]" />
                        </div>
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">{stats.priceReportCount}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reports</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center p-2">
                        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                            <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">{stats.stationAddCount}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Stations</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center p-2">
                        <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-2">
                            <MessageCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">{stats.reviewCount}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reviews</span>
                    </div>
                </motion.div>

                {/* Profile Info */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-[#1A1A1A] dark:text-white">Profile Information</h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-sm font-semibold text-[#3B0764] dark:text-purple-400 hover:text-[#4C0D8C]"
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Phone */}
                        <div className="flex items-start gap-4">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1 border-b border-gray-100 dark:border-white/5 pb-4">
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={profile.phone_number || ''}
                                        onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                        className="w-full bg-transparent border-b border-[#3B0764] focus:outline-none py-1"
                                        placeholder="Enter phone"
                                    />
                                ) : (
                                    <p className="font-medium text-[#1A1A1A] dark:text-white">{profile.phone_number || 'Not set'}</p>
                                )}
                            </div>
                        </div>

                        {/* Street */}
                        <div className="flex items-start gap-4">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1 border-b border-gray-100 dark:border-white/5 pb-4">
                                <p className="text-xs text-gray-500 mb-1">Street</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profile.street || ''}
                                        onChange={e => setProfile({ ...profile, street: e.target.value })}
                                        className="w-full bg-transparent border-b border-[#3B0764] focus:outline-none py-1"
                                        placeholder="Enter street"
                                    />
                                ) : (
                                    <p className="font-medium text-[#1A1A1A] dark:text-white">{profile.street || 'Not set'}</p>
                                )}
                            </div>
                        </div>

                        {/* City */}
                        <div className="flex items-start gap-4">
                            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1 pb-2">
                                <p className="text-xs text-gray-500 mb-1">City</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profile.city || ''}
                                        onChange={e => setProfile({ ...profile, city: e.target.value })}
                                        className="w-full bg-transparent border-b border-[#3B0764] focus:outline-none py-1"
                                        placeholder="Enter city"
                                    />
                                ) : (
                                    <p className="font-medium text-[#1A1A1A] dark:text-white">{profile.city || 'Not set'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="w-full mt-6 bg-[#3B0764] text-white font-bold py-3 rounded-xl disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>

                {/* Quick Links */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5">
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-4">Quick Links</h3>

                    <div className="space-y-3">
                        <button onClick={() => router.push('/dashboard/favorites')} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                <Bookmark className="w-5 h-5" />
                            </div>
                            <span className="flex-1 text-left font-medium text-[#1A1A1A] dark:text-white">Track Activities</span>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                        </button>

                        <button onClick={() => router.push('/dashboard/leaderboard')} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <span className="flex-1 text-left font-medium text-[#1A1A1A] dark:text-white">Leaderboard</span>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                        </button>

                        <button onClick={() => router.push('/dashboard/notifications')} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-[#3B0764] dark:text-purple-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <span className="flex-1 text-left font-medium text-[#1A1A1A] dark:text-white">Notifications</span>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
