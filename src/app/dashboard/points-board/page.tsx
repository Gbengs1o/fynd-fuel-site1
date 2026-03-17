'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
    ArrowLeft, Fuel, MapPin, Calendar, Gift, 
    UserPlus, Heart, Star, Share2, UserCheck, 
    ChevronRight, History, Info, Sparkles, Repeat
} from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

interface RewardRule {
    action_key: string;
    display_name: string;
    description: string;
    points: number;
    frequency_limit: string;
}

const ACTION_ICONS: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    price_report: { icon: <Fuel className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    station_add: { icon: <MapPin className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    daily_login: { icon: <Calendar className="w-5 h-5" />, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
    signup_bonus: { icon: <Gift className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
    referral_bonus: { icon: <UserPlus className="w-5 h-5" />, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
    save_station_favorite: { icon: <Heart className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
    submit_station_review: { icon: <Star className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
    share_station_link: { icon: <Share2 className="w-5 h-5" />, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
    complete_user_profile: { icon: <UserCheck className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

const getFrequencyText = (freq: string) => {
    switch (freq?.toLowerCase().trim()) {
        case 'once_ever': return 'One Time Only';
        case 'once_daily': return 'Once Per Day';
        case 'unlimited': return 'Every Time';
        default: return freq || 'Every Time';
    }
};

export default function PointsBoardPage() {
    const router = useRouter();
    const [rules, setRules] = useState<RewardRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRules = async () => {
        try {
            const { data, error } = await supabase.rpc('get_public_gamification_rules');
            if (error) throw error;
            setRules(data || []);
        } catch (err) {
            console.error('Failed to fetch reward rules:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

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
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white">Earn Points</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pt-8">
                {/* Banner */}
                <div className="bg-[#3B0764] dark:bg-[#3B0764]/20 p-6 rounded-[32px] mb-8 relative overflow-hidden text-white border border-[#3B0764]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                            🎯
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-tight">Ways to Earn</h2>
                            <p className="text-white/60 text-sm mt-1">Complete actions to earn points & rewards!</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {rules.map((rule, index) => {
                        const iconInfo = ACTION_ICONS[rule.action_key] || { 
                            icon: <Sparkles className="w-5 h-5" />, 
                            color: 'text-amber-500', 
                            bgColor: 'bg-amber-50 dark:bg-amber-900/20' 
                        };

                        return (
                            <motion.div 
                                key={rule.action_key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-[#1A1A1A] p-5 rounded-[24px] shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex items-center gap-5 group hover:border-[#3B0764]/20 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconInfo.bgColor}`}>
                                    <span className={iconInfo.color}>{iconInfo.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-[15px] text-[#1A1A1A] dark:text-white">
                                        {rule.display_name}
                                    </h4>
                                    {rule.description && (
                                        <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50 mt-1 line-clamp-1">
                                            {rule.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Repeat className="w-3 h-3 text-[#1A1A1A]/30 dark:text-white/30" />
                                        <span className="text-[10px] font-bold text-[#1A1A1A]/30 dark:text-white/30 uppercase tracking-widest">
                                            {getFrequencyText(rule.frequency_limit)}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[60px]">
                                    <span className="text-emerald-500 font-black text-lg">+{rule.points}</span>
                                    <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter">Points</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer History Link */}
                <button 
                    onClick={() => router.push('/dashboard/points-history')}
                    className="w-full mt-8 bg-white dark:bg-[#1A1A1A] flex items-center justify-center gap-3 p-5 rounded-3xl border border-[#3B0764]/5 dark:border-white/5 shadow-sm group hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                    <History className="w-5 h-5 text-[#3B0764] dark:text-purple-400" />
                    <span className="font-black text-sm text-[#3B0764] dark:text-purple-400 uppercase tracking-widest">View Points History</span>
                    <ChevronRight className="w-4 h-4 text-[#3B0764]/30 dark:text-purple-400/30 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-[10px] font-bold text-[#1A1A1A]/30 dark:text-white/30 mt-12 mb-4 flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" />
                    STATION REVIEWS REQUIRE A VERIFIED PRICE REPORT
                </p>
            </main>
        </div>
    );
}
