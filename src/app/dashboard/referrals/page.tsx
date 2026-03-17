'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
    ArrowLeft, Users, Copy, Check, Share2, 
    Gift, Sparkles, AlertCircle, Info
} from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReferralPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Get referral code
            const { data: profile } = await supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user.id)
                .single();
            if (profile) setReferralCode(profile.referral_code);

            // Get referral count
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by', user.id);
            setReferralCount(count || 0);

            setIsLoading(false);
        };
        fetchData();
    }, [router]);

    const handleCopy = () => {
        if (!referralCode) return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!referralCode) return;
        const shareData = {
            title: 'Join Fynd Fuel',
            text: `Join me on Fynd Fuel and save money on fuel! Use my code ${referralCode} to get 200 bonus points!`,
            url: window.location.origin
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            handleCopy();
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
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white">Refer & Earn</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pt-8">
                {/* Hero Card */}
                <div className="bg-[#3B0764] dark:bg-[#3B0764]/20 p-8 rounded-[40px] mb-8 relative overflow-hidden text-white border border-[#3B0764]/10 shadow-2xl shadow-[#3B0764]/20">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full -ml-16 -mb-16 blur-2xl opacity-50" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-4xl mb-6 shadow-inner">
                            👥
                        </div>
                        <h2 className="text-3xl font-black leading-tight mb-3">Invite Friends,<br/>Get Rewards</h2>
                        <p className="text-white/70 text-sm max-w-xs mx-auto mb-2">
                            Earn <span className="text-amber-400 font-black">500 Pts</span> for every friend who joins. They get <span className="text-amber-400 font-black">200 Pts</span> too!
                        </p>
                    </div>
                </div>

                {/* Referral Code Box */}
                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[32px] mb-8 shadow-sm border border-[#3B0764]/5 dark:border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/30 dark:text-white/30 mb-6">Your Unique Referral Code</p>
                    
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="bg-[#3B0764]/5 dark:bg-white/5 px-8 py-5 rounded-[24px] border-2 border-dashed border-[#3B0764]/20 dark:border-white/10 group active:scale-[0.98] transition-all cursor-pointer" onClick={handleCopy}>
                            <span className="text-3xl font-black tracking-[0.15em] text-[#3B0764] dark:text-purple-400">
                                {referralCode || '------'}
                            </span>
                        </div>
                        <button 
                            onClick={handleCopy}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                copied ? 'bg-emerald-500 text-white' : 'bg-[#3B0764] text-white hover:scale-105 active:scale-95'
                            }`}
                        >
                            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </button>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="w-full bg-[#3B0764] dark:bg-purple-600 text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 shadow-lg shadow-[#3B0764]/20 hover:bg-[#2A0548] transition-all active:scale-[0.98]"
                    >
                        <Share2 className="w-5 h-5" />
                        SHARE CODE
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[28px] border border-[#3B0764]/5 dark:border-white/5 shadow-sm text-center">
                        <p className="text-3xl font-black text-[#1A1A1A] dark:text-white mb-1">{referralCount}</p>
                        <p className="text-[10px] font-bold text-[#1A1A1A]/40 dark:text-white/40 uppercase tracking-widest">Friends Invited</p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[28px] border border-[#3B0764]/5 dark:border-white/5 shadow-sm text-center">
                        <p className="text-3xl font-black text-emerald-500 mb-1">{referralCount * 500}</p>
                        <p className="text-[10px] font-bold text-[#1A1A1A]/40 dark:text-white/40 uppercase tracking-widest">Points Earned</p>
                    </div>
                </div>

                {/* How it Works */}
                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[32px] border border-[#3B0764]/5 dark:border-white/5 shadow-sm">
                    <h3 className="font-black text-lg text-[#1A1A1A] dark:text-white mb-6">How it works</h3>
                    
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black flex-shrink-0">1</div>
                            <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 pt-2 leading-relaxed">
                                Share your unique code with friends through any platform.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black flex-shrink-0">2</div>
                            <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 pt-2 leading-relaxed">
                                They enter it when creating their account on Fynd Fuel.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black flex-shrink-0">
                                <Check className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 pt-2 leading-relaxed">
                                Once they join, you both earn points instantly!
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] font-bold text-[#1A1A1A]/30 dark:text-white/30 mt-12 mb-4 flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" />
                    POINTS ARE AWARDED AFTER EMAIL VERIFICATION
                </p>
            </main>
        </div>
    );
}
