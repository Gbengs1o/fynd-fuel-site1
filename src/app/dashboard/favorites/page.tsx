'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Search, Bell, BellOff, XCircle } from 'lucide-react';
import StationCard, { Station } from '@/components/StationCard';
import AdvertCard, { Advert } from '@/components/AdvertCard';
import { motion } from 'framer-motion';

// Extended Station Interface for Favourites
interface FavouriteStationData extends Station {
    notifications_enabled: boolean;
    latest_pms_price: number | null;
    last_updated_at: string | null;
    logo_url?: string;
    review_count?: number;
    rating?: number;
}

const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'No updates';
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return `Up. ${Math.floor(interval)}hrs ago`;
    interval = seconds / 60;
    if (interval > 1) return `Up. ${Math.floor(interval)}mins ago`;
    return "Just now";
};

export default function FavoritesPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allFavourites, setAllFavourites] = useState<FavouriteStationData[]>([]);
    const [adverts, setAdverts] = useState<Advert[]>([]);

    // 1. Check Auth
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
            }
        };
        checkUser();
    }, [router]);

    // 2. Fetch Favourites
    const fetchFavourites = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_favourite_stations_for_app', { p_user_id: user.id });
            if (error) {
                console.error('Error loading favourites:', error);
            } else if (data) {
                // Map RPC data to our interface
                const mappedData = (data as any[]).map(item => ({
                    ...item,
                    fuel_type: 'PMS', // Default to PMS for display if missing
                    price: item.latest_pms_price || 0, // Map for StationCard compatibility
                    status: item.status || 'Available' // Default status
                }));
                setAllFavourites(mappedData);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // 3. Fetch Ads
    useEffect(() => {
        const fetchAdverts = async () => {
            // Check Global Kill Switch
            const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'global_ads_enabled').single();
            if (settingsData && settingsData.value === false) {
                setAdverts([]);
                return;
            }

            const { data } = await supabase
                .from('adverts')
                .select('*')
                .eq('is_active', true)
                .in('type', ['card', 'video', 'banner'])
                .limit(2);

            if (data) {
                setAdverts(data as Advert[]);
            }
        };
        fetchAdverts();
    }, []);

    useEffect(() => {
        if (user) {
            fetchFavourites();
        }
    }, [user, fetchFavourites]);

    // 4. Handlers
    const handleRemoveFavourite = async (stationId: number) => {
        if (!confirm("Are you sure you want to stop tracking this station?")) return;

        // Optimistic UI update
        const previousFavourites = [...allFavourites];
        setAllFavourites(current => current.filter(fav => fav.id !== stationId));

        const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: stationId });

        if (error) {
            alert('Could not stop tracking.');
            setAllFavourites(previousFavourites); // Revert
        }
    };

    const handleToggleNotification = async (favourite: FavouriteStationData) => {
        const newStatus = !favourite.notifications_enabled;

        // Optimistic UI update
        setAllFavourites(current => current.map(fav => fav.id === favourite.id ? { ...fav, notifications_enabled: newStatus } : fav));

        const { error } = await supabase.from('favourite_stations').update({ notifications_enabled: newStatus }).match({ user_id: user.id, station_id: favourite.id });

        if (error) {
            console.error('Could not update notification preference.');
            fetchFavourites(); // Revert by refetching
        }
    };

    // 5. Combine Data & Ads
    const filteredData = useMemo(() => {
        let data: (FavouriteStationData | Advert)[] = [...allFavourites];

        if (searchTerm.trim()) {
            data = data.filter(item =>
                'name' in item && item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Inject Ads
        if (adverts.length > 0 && data.length > 0) {
            // Inject first ad after 2nd item
            if (data.length >= 2 && adverts[0]) {
                data.splice(2, 0, adverts[0]);
            } else if (adverts[0]) {
                data.push(adverts[0]);
            }

            // Inject second ad after 6th item
            if (data.length >= 6 && adverts[1]) {
                data.splice(6, 0, adverts[1]);
            }
        }
        return data;
    }, [searchTerm, allFavourites, adverts]);

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#3B0764]/10 dark:border-white/10 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="text-lg font-bold text-[#1A1A1A] dark:text-white">Track Activities</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/40 dark:text-white/40" />
                    <input
                        type="text"
                        placeholder="Search tracked stations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-[#3B0764]/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[#1A1A1A] dark:text-white placeholder:text-[#1A1A1A]/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B0764]/50"
                    />
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B0764]"></div>
                    </div>
                ) : allFavourites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-[#3B0764]/10 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-[#3B0764]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-2">No tracked stations</h3>
                        <p className="text-[#1A1A1A]/60 dark:text-white/60 max-w-sm">
                            You aren't tracking any stations yet. Tap the bookmark button on any station to start tracking its activity.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredData.map((item, index) => {
                            // Render Ad
                            if ('type' in item) {
                                return (
                                    <AdvertCard key={`ad-${item.id}-${index}`} advert={item as Advert} />
                                );
                            }

                            // Render Station
                            const fav = item as FavouriteStationData;
                            return (
                                <div key={fav.id} className="relative group">
                                    <StationCard
                                        station={fav}
                                        onClick={() => router.push(`/station/${fav.id}`)}
                                    // Custom rendering for actions often handled inside Card, but StationCard is simpler. 
                                    // We might use StationCard as base design but wrap it or customize it.
                                    // Actually StationCard has onTrack/onNavigate.
                                    // But here we need specific "Remove" and "Notify" actions.
                                    // Let's use StationCard for display but add our custom actions overlay or sidebar?
                                    // The mobile app puts actions INSIDE the card.
                                    // Our StationCard doesn't support custom slots yet, but supports onTrack.
                                    />

                                    {/* Custom Action Overlays for Favorites Page - mimicing the mobile app layout */}
                                    {/* The mobile app has actions on the right side of the card. 
                                         Our StationCard puts them at bottom right.
                                         We can just overwrite the buttons if we want, or add an absolute overlay.
                                         For now let's add a "Management Bar" below the card or just use absolute positioning.
                                     */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleNotification(fav); }}
                                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${fav.notifications_enabled
                                                ? 'bg-[#3B0764] text-white'
                                                : 'bg-[#F5F5F0] dark:bg-white/10 text-[#1A1A1A]/40 dark:text-white/40'}`}
                                        >
                                            {fav.notifications_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveFavourite(fav.id); }}
                                            className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 backdrop-blur-md hover:bg-red-200 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
