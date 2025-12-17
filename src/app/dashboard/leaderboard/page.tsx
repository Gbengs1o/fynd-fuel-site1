'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LetterAvatar } from '@/components/LetterAvatar';
import AdvertCard, { Advert } from '@/components/AdvertCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    report_count: number;
    rank_number: number;
}

const PodiumItem = ({ user, rank }: { user: LeaderboardEntry, rank: number }) => {
    const isFirst = rank === 1;
    const size = isFirst ? 80 : 60;

    const rankColors: Record<number, string> = {
        1: 'bg-yellow-400 border-yellow-500',
        2: 'bg-gray-300 border-gray-400',
        3: 'bg-orange-400 border-orange-500'
    };

    return (
        <div className={`flex flex-col items-center ${isFirst ? '-mt-4 z-10' : 'mt-4'}`}>
            <div className="relative">
                <LetterAvatar
                    avatarUrl={user.avatar_url}
                    name={user.full_name}
                    size={size}
                    className="shadow-lg border-4 border-white dark:border-[#1A1A1A]"
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-[#1A1A1A] shadow-sm ${rankColors[rank]}`}>
                    {rank}
                </div>
            </div>
            <p className="mt-3 font-bold text-sm text-[#1A1A1A] dark:text-white max-w-[100px] truncate text-center">{user.full_name}</p>
            <p className="text-xs font-semibold text-[#3B0764] dark:text-purple-400">{user.report_count} pts</p>
        </div>
    );
};

export default function LeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sponsoredAd, setSponsoredAd] = useState<Advert | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const { data, error } = await supabase.rpc('get_leaderboard');
            if (error) throw error;
            setLeaderboard(data || []);

            // Fetch Ad
            const { data: settings } = await supabase.from('app_settings').select('value').eq('key', 'global_ads_enabled').single();
            if (settings?.value !== false) {
                const { data: ads } = await supabase.from('adverts')
                    .select('*')
                    .eq('is_active', true)
                    .in('type', ['card', 'video'])
                    .limit(5);

                if (ads && ads.length > 0) {
                    setSponsoredAd(ads[Math.floor(Math.random() * ads.length)] as Advert);
                }
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const { topThree, restOfBoard, currentUserRank } = useMemo(() => {
        const topThree = leaderboard.slice(0, 3);
        const restOfBoard = leaderboard.slice(3);
        const currentUserRank = leaderboard.find(u => u.user_id === currentUser?.id);
        return { topThree, restOfBoard, currentUserRank };
    }, [leaderboard, currentUser]);

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-[#1A1A1A] pt-6 pb-6 rounded-b-[40px] shadow-sm border-b border-[#3B0764]/5 dark:border-white/5 relative z-10">
                <div className="flex items-center px-4 mb-4 relative">
                    <button onClick={() => router.push('/dashboard')} className="absolute left-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="flex-1 text-center font-bold text-lg text-[#1A1A1A] dark:text-white">Leaderboard</h1>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <Trophy className="w-10 h-10 text-[#FFB800] mb-2" />
                    <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Top Contributors</h2>
                    <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">Based on verified price reports</p>
                </div>

                {/* Podium */}
                {!isLoading && topThree.length > 0 && (
                    <div className="flex justify-center items-end gap-2 sm:gap-8 px-4 pb-4">
                        {topThree[1] && <PodiumItem user={topThree[1]} rank={2} />}
                        {topThree[0] && <PodiumItem user={topThree[0]} rank={1} />}
                        {topThree[2] && <PodiumItem user={topThree[2]} rank={3} />}
                    </div>
                )}
            </div>

            {/* List */}
            <main className="max-w-md mx-auto px-4 mt-8 space-y-3">
                <h3 className="font-bold text-[#1A1A1A] dark:text-white ml-2 mb-2">All Ranks</h3>

                {isLoading ? (
                    <LoadingAnimation />
                ) : restOfBoard.length === 0 && topThree.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No data available yet.</div>
                ) : (
                    <>
                        {restOfBoard.map((item, index) => (
                            <React.Fragment key={item.user_id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className={`flex items-center p-3 rounded-2xl border ${item.user_id === currentUser?.id ? 'bg-[#3B0764]/5 border-[#3B0764]/20' : 'bg-white dark:bg-[#1A1A1A] border-transparent'} shadow-sm`}
                                >
                                    <span className="w-8 text-center font-bold text-gray-400 mr-2">#{item.rank_number}</span>
                                    <LetterAvatar name={item.full_name} avatarUrl={item.avatar_url} size={40} />
                                    <div className="flex-1 ml-3">
                                        <p className={`font-semibold text-sm ${item.user_id === currentUser?.id ? 'text-[#3B0764] dark:text-purple-300' : 'text-[#1A1A1A] dark:text-white'}`}>
                                            {item.full_name} {item.user_id === currentUser?.id && '(You)'}
                                        </p>
                                    </div>
                                    <span className="font-bold text-[#3B0764] dark:text-purple-400 text-sm">{item.report_count} pts</span>
                                </motion.div>

                                {/* Ad Injection after 3rd item in list */}
                                {index === 2 && sponsoredAd && (
                                    <div className="py-2">
                                        <AdvertCard advert={sponsoredAd} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}
            </main>

            {/* Current User Fixed Banner */}
            {!isLoading && currentUserRank && currentUserRank.rank_number > 3 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#3B0764] text-white p-4 pb-6 z-40 lg:hidden">
                    <div className="flex items-center max-w-md mx-auto">
                        <span className="w-8 text-center font-bold text-white/80 mr-2">#{currentUserRank.rank_number}</span>
                        <LetterAvatar name={currentUserRank.full_name} avatarUrl={currentUserRank.avatar_url} size={40} className="border-white/20" />
                        <div className="flex-1 ml-3">
                            <p className="font-bold text-sm">Your Rank</p>
                            <p className="text-xs text-white/60">Keep reporting to climb up!</p>
                        </div>
                        <span className="font-bold text-white text-sm">{currentUserRank.report_count} pts</span>
                    </div>
                </div>
            )}
        </div>
    );
}
