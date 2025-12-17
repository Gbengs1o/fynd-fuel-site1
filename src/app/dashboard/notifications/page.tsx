'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Megaphone, Tag, Flag, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion } from 'framer-motion';

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    station_id: number | null;
    title?: string | null;
}

type TabType = 'updates' | 'messages';

export default function NotificationsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('updates');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Derived state - filter by tab
    const updates = useMemo(() => allNotifications.filter(n => !n.title || n.title.trim().length === 0), [allNotifications]);
    const messages = useMemo(() => allNotifications.filter(n => n.title && n.title.trim().length > 0), [allNotifications]);

    const unreadUpdatesCount = useMemo(() => updates.filter(n => !n.is_read).length, [updates]);
    const unreadMessagesCount = useMemo(() => messages.filter(n => !n.is_read).length, [messages]);

    const displayedNotifications = activeTab === 'updates' ? updates : messages;

    const fetchNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setAllNotifications(data as Notification[] || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications();
        setIsRefreshing(false);
    };

    const markTabAsRead = useCallback(async () => {
        if (!user) return;

        const targetList = activeTab === 'updates' ? updates : messages;
        const unreadIds = targetList.filter(n => !n.is_read).map(n => n.id);

        if (unreadIds.length === 0) return;

        const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);

        if (!error) {
            setAllNotifications(prev => prev.map(n =>
                unreadIds.includes(n.id) ? { ...n, is_read: true } : n
            ));
        }
    }, [user, activeTab, updates, messages]);

    const handleNotificationPress = (notification: Notification) => {
        if (notification.station_id) {
            router.push(`/dashboard/search?station=${notification.station_id}`);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchNotifications();
    }, [fetchNotifications]);

    // Auto-mark as read timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const currentUnreadCount = activeTab === 'updates' ? unreadUpdatesCount : unreadMessagesCount;

        if (currentUnreadCount > 0) {
            timer = setTimeout(() => { markTabAsRead(); }, 2000);
        }
        return () => clearTimeout(timer);
    }, [activeTab, unreadUpdatesCount, unreadMessagesCount, markTabAsRead]);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchNotifications]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212]">
                <LoadingAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-[#1A1A1A] pt-6 pb-4 rounded-b-3xl shadow-sm border-b border-[#3B0764]/5 dark:border-white/5">
                <div className="flex items-center px-4 mb-4 relative">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="absolute left-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="flex-1 text-center font-bold text-lg text-[#1A1A1A] dark:text-white">Notifications</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="absolute right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 text-[#1A1A1A] dark:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-4 border-b border-gray-100 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab('updates')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'updates'
                                ? 'border-[#3B0764] text-[#3B0764] dark:text-purple-400'
                                : 'border-transparent text-gray-500'
                            }`}
                    >
                        <span className="font-semibold text-sm">Station Updates</span>
                        {unreadUpdatesCount > 0 && (
                            <span className="bg-[#3B0764] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadUpdatesCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'messages'
                                ? 'border-[#3B0764] text-[#3B0764] dark:text-purple-400'
                                : 'border-transparent text-gray-500'
                            }`}
                    >
                        <span className="font-semibold text-sm">Company Messages</span>
                        {unreadMessagesCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadMessagesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <main className="max-w-md mx-auto px-4 mt-6 space-y-3">
                {displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        {activeTab === 'updates' ? (
                            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        ) : (
                            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        )}
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            {activeTab === 'updates' ? 'No station updates yet.' : 'No messages from company.'}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            {activeTab === 'updates'
                                ? 'Updates about your favorite stations will appear here.'
                                : 'Company announcements will appear here.'}
                        </p>
                    </div>
                ) : (
                    displayedNotifications.map((notification, index) => {
                        const isBroadcast = !!notification.title;

                        return (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleNotificationPress(notification)}
                                className={`relative flex items-start gap-4 p-4 rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md ${isBroadcast
                                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30'
                                        : 'bg-white dark:bg-[#1A1A1A] border border-[#3B0764]/5 dark:border-white/5'
                                    } ${notification.is_read ? 'opacity-70' : ''}`}
                            >
                                {/* Unread Dot */}
                                {!notification.is_read && (
                                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isBroadcast ? 'bg-red-500' : 'bg-[#3B0764]'
                                        }`} />
                                )}

                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBroadcast
                                        ? 'bg-red-100 dark:bg-red-900/20'
                                        : 'bg-[#3B0764]/10 dark:bg-purple-900/20'
                                    }`}>
                                    {isBroadcast ? (
                                        <Megaphone className="w-5 h-5 text-red-500" />
                                    ) : notification.message.includes('flagged') ? (
                                        <Flag className="w-5 h-5 text-orange-500" />
                                    ) : (
                                        <Tag className="w-5 h-5 text-[#3B0764] dark:text-purple-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {isBroadcast && notification.title && (
                                        <h4 className="font-bold text-[#1A1A1A] dark:text-white mb-1">
                                            {notification.title}
                                        </h4>
                                    )}
                                    <p className={`${isBroadcast ? 'text-sm text-gray-600 dark:text-gray-400' : 'font-medium text-[#1A1A1A] dark:text-white'} leading-relaxed`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                    {notification.station_id && !isBroadcast && (
                                        <p className="text-xs font-semibold text-[#3B0764] dark:text-purple-400 mt-2">
                                            Tap to view station →
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </main>
        </div>
    );
}
