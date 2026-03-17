'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
    ArrowLeft, Fuel, MapPin, Calendar, Gift, 
    UserPlus, Banknote, Lock, Undo, Heart, 
    Star, Share2, UserCheck, Crown, Coins
} from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

interface Transaction {
    id: number;
    created_at: string;
    action: string;
    points: number;
    is_debit: boolean;
    note: string | null;
    title?: string | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    price_report: { label: 'Price Report', icon: <Fuel className="w-5 h-5" />, color: 'text-emerald-500' },
    station_add: { label: 'Added Station', icon: <MapPin className="w-5 h-5" />, color: 'text-emerald-500' },
    daily_login: { label: 'Daily Login', icon: <Calendar className="w-5 h-5" />, color: 'text-emerald-500' },
    signup_bonus: { label: 'Signup Bonus', icon: <Gift className="w-5 h-5" />, color: 'text-emerald-500' },
    referral_bonus: { label: 'Referral Bonus', icon: <UserPlus className="w-5 h-5" />, color: 'text-emerald-500' },
    redemption: { label: 'Redemption', icon: <Banknote className="w-5 h-5" />, color: 'text-rose-500' },
    redemption_hold: { label: 'Points Hold', icon: <Lock className="w-5 h-5" />, color: 'text-rose-500' },
    redemption_refund: { label: 'Refund', icon: <Undo className="w-5 h-5" />, color: 'text-emerald-500' },
    save_station_favorite: { label: 'Save a Station', icon: <Heart className="w-5 h-5" />, color: 'text-emerald-500' },
    submit_station_review: { label: 'Station Review', icon: <Star className="w-5 h-5" />, color: 'text-emerald-500' },
    share_station_link: { label: 'Shared Station', icon: <Share2 className="w-5 h-5" />, color: 'text-emerald-500' },
    complete_user_profile: { label: 'Profile Completed', icon: <UserCheck className="w-5 h-5" />, color: 'text-emerald-500' },
    admin_grant: { label: 'Admin Bonus', icon: <Crown className="w-5 h-5" />, color: 'text-emerald-500' },
};

export default function PointsHistoryPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_transactions');
            if (error) throw error;
            setTransactions(data || []);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white">Points History</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pt-8">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#3B0764]/5 flex items-center justify-center mb-4">
                            <Coins className="w-10 h-10 text-[#3B0764]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-2">No transactions yet</h3>
                        <p className="text-[#1A1A1A]/50 dark:text-white/50 max-w-xs mx-auto">
                            Start earning points by reporting prices and sharing stations!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((item, index) => {
                            const actionInfo = ACTION_LABELS[item.action] || { label: item.action, icon: <Coins className="w-5 h-5" />, color: 'text-emerald-500' };
                            const isPositive = !item.is_debit;
                            const displayLabel = item.title || actionInfo.label;

                            return (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-[#3B0764]/5 dark:border-white/5 flex items-center gap-4 group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                        isPositive ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10'
                                    }`}>
                                        <span className={actionInfo.color}>{actionInfo.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                                            {displayLabel}
                                        </h4>
                                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 dark:text-white/30 uppercase tracking-widest mt-0.5">
                                            {formatDate(item.created_at)}
                                        </p>
                                        {item.note && (
                                            <p className="text-xs italic text-[#1A1A1A]/50 dark:text-white/50 mt-1">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`text-lg font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isPositive ? '+' : '-'}{item.points}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
