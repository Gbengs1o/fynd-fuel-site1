'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LetterAvatar } from '@/components/LetterAvatar';
import { getVehicleStatus } from '@/lib/gamification';
import LoadingAnimation from '@/components/LoadingAnimation';
import { ArrowLeft, MapPin, Award, Activity, Calendar, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface Profile {
    id: string;
    full_name: string;
    nickname: string | null;
    avatar_url: string | null;
    created_at: string;
    points: number;
}

interface RecentReport {
    id: number;
    station_id: number;
    price: number;
    fuel_type: string;
    created_at: string;
    stations: {
        name: string;
        brand: string | null;
    } | null;
}

export default function ScoutingProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [reports, setReports] = useState<RecentReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchProfile = async () => {
            try {
                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, nickname, avatar_url, created_at, points')
                    .eq('id', id)
                    .single();

                if (profileError) throw profileError;
                setProfile(profileData);

                // 2. Fetch Recent Reports
                const { data: reportsData, error: reportsError } = await supabase
                    .from('price_reports')
                    .select(`
                        id, 
                        station_id, 
                        price, 
                        fuel_type, 
                        created_at,
                        stations ( name, brand )
                    `)
                    .eq('user_id', id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (reportsError) throw reportsError;
                setReports(reportsData as any[] || []);

            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError(err.message || 'Profile not found');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    const vehicleStatus = useMemo(() => {
        return getVehicleStatus(profile?.points || 0);
    }, [profile]);

    const stats = useMemo(() => {
        return [
            { label: 'Reports', value: reports.length, icon: <Activity className="w-5 h-5 text-blue-500" /> },
            { label: 'Reputation', value: profile?.points || 0, icon: <Trophy className="w-5 h-5 text-amber-500" /> },
            { label: 'Experience', value: vehicleStatus.level, icon: <Award className="w-5 h-5 text-purple-500" /> }
        ];
    }, [reports, profile, vehicleStatus]);

    if (isLoading) return <LoadingAnimation />;

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-lg font-bold text-red-500">User not found</p>
                    <button onClick={() => router.back()} className="text-[#3B0764] dark:text-purple-400 font-bold underline">Go Back</button>
                </div>
            </div>
        );
    }

    const displayName = profile.nickname || profile.full_name;

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header / Banner */}
            <div className="h-48 bg-[#3B0764] relative">
                <button 
                    onClick={() => router.back()}
                    className="absolute top-6 left-4 z-20 p-2 rounded-xl bg-black/20 text-white backdrop-blur-md hover:bg-black/30 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="absolute inset-x-0 -bottom-16 flex flex-col items-center px-4">
                    <div className="relative">
                        <LetterAvatar 
                            name={displayName} 
                            avatarUrl={profile.avatar_url} 
                            size={120} 
                            className="border-4 border-white dark:border-[#121212] shadow-xl"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#1A1A1A] p-2 rounded-2xl shadow-lg border border-[#3B0764]/10 text-2xl">
                            {vehicleStatus.icon}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 mt-20 text-center">
                <h1 className="text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tight">{displayName}</h1>
                <div className="flex items-center justify-center gap-2 mt-1 text-sm font-bold text-[#1A1A1A]/40 dark:text-white/40 uppercase tracking-widest">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-3xl shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex flex-col items-center">
                            <div className="mb-2">{stat.icon}</div>
                            <span className="text-lg font-black text-[#1A1A1A] dark:text-white truncate w-full">{stat.value}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/30">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="mt-12 text-left">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/30">Recent Scouting Activity</h2>
                        <span className="px-3 py-1 bg-[#3B0764]/5 dark:bg-white/5 rounded-full text-[10px] font-black text-[#3B0764] dark:text-purple-400">LAST 10 REPORTS</span>
                    </div>

                    <div className="space-y-3">
                        {reports.length > 0 ? reports.map((report) => (
                            <motion.div 
                                key={report.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-[#1A1A1A] p-5 rounded-[28px] shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center text-[#3B0764] dark:text-purple-400 group-hover:scale-110 transition-transform">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#1A1A1A] dark:text-white truncate">{report.stations?.name || 'Unknown Station'}</h3>
                                    <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40 font-medium">
                                        Reported price for <span className="font-bold text-[#3B0764] dark:text-purple-400">{report.fuel_type}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-[#1A1A1A] dark:text-white">₦{report.price}</p>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-green-500">Verified</p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="bg-white/50 dark:bg-[#1A1A1A]/50 border-2 border-dashed border-[#1A1A1A]/5 dark:border-white/5 p-10 rounded-[32px] text-center">
                                <p className="text-sm font-bold text-[#1A1A1A]/20 dark:text-white/20">No recent reports found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
