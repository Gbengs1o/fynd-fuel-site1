'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, Star, Clock, ChevronLeft, ChevronRight,
    Bookmark, Flag, MessageSquare, Fuel, User, Car, PersonStanding,
    Zap, CreditCard, Wifi, ShoppingCart, Coffee, Droplets, ArrowLeft,
    Send, Phone, Globe, ChevronDown, ChevronUp, X
} from 'lucide-react';

interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    brand: string | null;
    amenities: string[] | null;
    payment_methods: string[] | null;
    logo_url: string | null;
    address?: string;
}

interface PriceReport {
    id: number;
    user_id: string;
    fuel_type: string;
    price: number | null;
    notes: string | null;
    rating: number | null;
    created_at: string;
    profiles: { full_name: string | null; avatar_url?: string } | null;
    other_fuel_prices: { [key: string]: number } | null;
    amenities_update: { add: string[] } | null;
    payment_methods_update: { add: string[] } | null;
}

interface Advert {
    id: number;
    title: string;
    type: 'banner' | 'card' | 'native' | 'video';
    content_url: string;
    cta_text?: string;
    cta_link?: string;
}

const ALL_FUEL_TYPES = ['Petrol', 'Gas', 'Kerosine', 'Diesel'];

// Helper functions
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180, dLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
};

const calculateTravelTime = (distanceMeters: number) => {
    const walkSpeedKph = 5, runSpeedKph = 10, driveSpeedKph = 30;
    const toMinutes = (speedKph: number) => Math.round(distanceMeters / 1000 / speedKph * 60);
    const formatTime = (minutes: number) => {
        if (minutes < 1) return "< 1 min";
        if (minutes < 60) return `${minutes} min`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };
    return { walk: formatTime(toMinutes(walkSpeedKph)), run: formatTime(toMinutes(runSpeedKph)), drive: formatTime(toMinutes(driveSpeedKph)) };
};

const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / 1000 / 3600);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const normalizeFuelName = (dbName: string): string => {
    const name = dbName.toLowerCase();
    if (name.includes('pms') || name.includes('petrol')) return 'Petrol';
    if (name.includes('gas')) return 'Gas';
    if (name.includes('diesel') || name.includes('ago')) return 'Diesel';
    if (name.includes('kerosine') || name.includes('dpk')) return 'Kerosine';
    return dbName.charAt(0).toUpperCase() + dbName.slice(1);
};

const amenityIcons: { [key: string]: any } = {
    "Supermarket": ShoppingCart, "Restaurant": Coffee, "Car wash": Car, "ATM": CreditCard,
    "POS Machine": CreditCard, "Air Pump": Zap, "Restrooms": User, "Full service": User,
    "Open 24/7": Clock, "Power": Zap, "Cash": CreditCard, "Transfer": Send, "Wifi": Wifi
};

export default function StationProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [station, setStation] = useState<Station | null>(null);
    const [reports, setReports] = useState<PriceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [nativeAd, setNativeAd] = useState<Advert | null>(null);
    const [user, setUser] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [travelTimes, setTravelTimes] = useState<{ walk: string; run: string; drive: string } | null>(null);
    const [historyIndex, setHistoryIndex] = useState<{ [key: string]: number }>({});
    const [isTracked, setIsTracked] = useState(false);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [isFlagged, setIsFlagged] = useState(false);
    const [isFlagging, setIsFlagging] = useState(false);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);

    // Check user session
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUser(session.user);
        };
        checkUser();
    }, []);

    // Fetch station data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // Fetch station details
                const { data: stationData, error: stationError } = await supabase
                    .from('stations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (stationError) throw stationError;
                setStation(stationData);

                // Fetch price reports
                const { data: reportsData } = await supabase
                    .from('price_reports')
                    .select('*, profiles(full_name, avatar_url)')
                    .eq('station_id', id)
                    .order('created_at', { ascending: false });

                setReports(reportsData || []);

                // Fetch ads
                const { data: settingsData } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'global_ads_enabled')
                    .single();

                const areAdsEnabled = settingsData?.value ?? true;
                if (areAdsEnabled) {
                    const { data: adsData } = await supabase
                        .from('adverts')
                        .select('*')
                        .eq('is_active', true)
                        .limit(3);

                    if (adsData && adsData.length > 0) {
                        const now = new Date();
                        const validAds = adsData.filter(ad =>
                            new Date(ad.start_date) <= now && new Date(ad.end_date) >= now
                        );
                        if (validAds.length > 0) {
                            setNativeAd(validAds[Math.floor(Math.random() * validAds.length)]);
                        }
                    }
                }

            } catch (error: any) {
                console.error('Error fetching station:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                },
                () => {
                    setUserLocation({ lat: 6.5244, lng: 3.3792 });
                }
            );
        }
    }, []);

    // Calculate distance and travel times
    useEffect(() => {
        if (station && userLocation) {
            const dist = haversineDistance(userLocation.lat, userLocation.lng, station.latitude, station.longitude);
            setDistance(dist);
            setTravelTimes(calculateTravelTime(dist));
        }
    }, [station, userLocation]);

    // Check tracking status
    useEffect(() => {
        const checkTrackStatus = async () => {
            if (!user || !id) return;
            const { data } = await supabase
                .from('favourite_stations')
                .select('station_id')
                .eq('station_id', id)
                .eq('user_id', user.id)
                .single();
            setIsTracked(!!data);
        };
        if (user) checkTrackStatus();
    }, [user, id]);

    // Check flag status
    useEffect(() => {
        const checkFlagStatus = async () => {
            if (!user || !id) return;
            const { data } = await supabase
                .from('flagged_stations')
                .select('id')
                .eq('station_id', id)
                .eq('user_id', user.id)
                .single();
            setIsFlagged(!!data);
        };
        if (user) checkFlagStatus();
    }, [user, id]);

    // Initialize history index
    useEffect(() => {
        const initialIndexState: { [key: string]: number } = {};
        ALL_FUEL_TYPES.forEach(fuel => { initialIndexState[fuel] = 0; });
        setHistoryIndex(initialIndexState);
    }, [reports]);

    // Calculate derived data
    const { priceHistories, allAmenities, ratingSummary, leaderboard } = useMemo(() => {
        const histories = new Map<string, { price: number; created_at: string }[]>();
        ALL_FUEL_TYPES.forEach(fuel => histories.set(fuel, []));

        const amenitySet = new Set<string>();
        if (station?.amenities) station.amenities.forEach(a => amenitySet.add(a));
        if (station?.payment_methods) station.payment_methods.forEach(p => amenitySet.add(p));

        const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0, ratingCount = 0;
        const userReportCounts = new Map<string, { profile: PriceReport['profiles'], count: number }>();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const report of reports) {
            if (report.price && report.fuel_type) {
                const normFuel = normalizeFuelName(report.fuel_type);
                if (histories.has(normFuel)) {
                    histories.get(normFuel)?.push({ price: report.price, created_at: report.created_at });
                }
            }
            if (report.other_fuel_prices) {
                for (const [fuel, price] of Object.entries(report.other_fuel_prices)) {
                    if (price) {
                        const normFuel = normalizeFuelName(fuel);
                        if (histories.has(normFuel)) {
                            histories.get(normFuel)?.push({ price, created_at: report.created_at });
                        }
                    }
                }
            }
            report.amenities_update?.add?.forEach(a => amenitySet.add(a));
            report.payment_methods_update?.add?.forEach(p => amenitySet.add(p));

            if (report.rating && report.rating >= 1 && report.rating <= 5) {
                ratingDistribution[report.rating]++;
                totalRating += report.rating;
                ratingCount++;
            }

            if (report.user_id && new Date(report.created_at) >= thirtyDaysAgo) {
                const existing = userReportCounts.get(report.user_id);
                if (existing) existing.count++;
                else userReportCounts.set(report.user_id, { profile: report.profiles, count: 1 });
            }
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0";
        const sortedLeaderboard = Array.from(userReportCounts.entries())
            .map(([userId, data]) => ({ userId, fullName: data.profile?.full_name || 'Anonymous User', reportCount: data.count }))
            .sort((a, b) => b.reportCount - a.reportCount)
            .slice(0, 5);

        return {
            priceHistories: histories,
            allAmenities: Array.from(amenitySet),
            ratingSummary: { average: averageRating, count: ratingCount, distribution: ratingDistribution },
            leaderboard: sortedLeaderboard
        };
    }, [reports, station]);

    const handleToggleTrack = async () => {
        if (!user) {
            alert('Please sign in to track stations.');
            return;
        }
        if (!station) return;

        setIsTrackingLoading(true);
        try {
            if (isTracked) {
                await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: station.id });
                setIsTracked(false);
            } else {
                await supabase.from('favourite_stations').insert({ user_id: user.id, station_id: station.id, notifications_enabled: true });
                setIsTracked(true);
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsTrackingLoading(false);
        }
    };

    const handleFlagToggle = async () => {
        if (!user) {
            alert('Please sign in to flag stations.');
            return;
        }
        if (!station) return;

        setIsFlagging(true);
        try {
            if (isFlagged) {
                await supabase.from('flagged_stations').delete().eq('station_id', station.id).eq('user_id', user.id);
                setIsFlagged(false);
                alert('You have removed your flag from this station.');
            } else {
                await supabase.from('flagged_stations').insert({ station_id: station.id, user_id: user.id, reason: 'Station does not exist' });
                setIsFlagged(true);
                alert('Thank you for reporting this station. We will review it.');
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsFlagging(false);
        }
    };

    const handleHistoryNavigation = (fuel: string, direction: 'newer' | 'older') => {
        const history = priceHistories.get(fuel) || [];
        const maxIndex = history.length > 0 ? history.length - 1 : 0;
        setHistoryIndex(prev => {
            const currentIndex = prev[fuel] || 0;
            if (direction === 'older' && currentIndex < maxIndex) return { ...prev, [fuel]: currentIndex + 1 };
            if (direction === 'newer' && currentIndex > 0) return { ...prev, [fuel]: currentIndex - 1 };
            return prev;
        });
    };

    const handleTakeMeThere = () => {
        if (!station) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1A1A1A] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#3B0764]/20 border-t-[#3B0764] rounded-full animate-spin" />
                    <p className="mt-4 text-[#1A1A1A]/60 dark:text-white/60">Loading station...</p>
                </div>
            </div>
        );
    }

    if (!station) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1A1A1A] flex items-center justify-center">
                <div className="text-center">
                    <Fuel className="w-16 h-16 text-[#3B0764]/30 mx-auto mb-4" />
                    <h1 className="text-xl font-bold mb-2">Station not found</h1>
                    <Link href="/dashboard" className="text-[#3B0764] hover:underline">← Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const reportsWithComments = reports.filter(r => r.notes && r.notes.trim() !== '');
    const amenitiesToShow = showAllAmenities ? allAmenities : allAmenities.slice(0, 6);
    const commentsToShow = showAllComments ? reportsWithComments : reportsWithComments.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white">
            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-[#3B0764]/10 dark:border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center hover:bg-[#3B0764]/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg truncate">{station.name}</h1>
                        <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60">{station.brand || 'Fuel Station'}</p>
                    </div>
                </div>
            </header>

            {/* Map Section */}
            <div className="h-64 bg-[#1A1A2E] relative overflow-hidden">
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${station.latitude},${station.longitude}&zoom=15&maptype=roadmap`}
                />
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={handleTakeMeThere}
                        className="bg-[#3B0764] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:bg-[#4C0D8C] transition-colors"
                    >
                        <Navigation className="w-4 h-4" />
                        Directions
                    </button>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Station Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-[#3B0764]/10 dark:border-white/10"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#3B0764] flex items-center justify-center shrink-0">
                            {station.logo_url ? (
                                <img src={station.logo_url} alt={station.name} className="w-12 h-12 object-contain" />
                            ) : (
                                <Fuel className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{station.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{ratingSummary.average}</span>
                                <span className="text-[#1A1A1A]/50 dark:text-white/50">({ratingSummary.count} reviews)</span>
                            </div>
                            {allAmenities.includes("Open 24/7") && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Open 24/7</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            onClick={handleToggleTrack}
                            disabled={isTrackingLoading}
                            className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${isTracked
                                ? 'bg-green-500 text-white'
                                : 'bg-[#F5F5F0] dark:bg-white/5 border border-green-500 text-green-500'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" fill={isTracked ? 'currentColor' : 'none'} />
                            {isTracked ? 'Tracking' : 'Track Activity'}
                        </button>
                        <button
                            onClick={handleFlagToggle}
                            disabled={isFlagging}
                            className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${isFlagged
                                ? 'bg-red-500 text-white'
                                : 'bg-[#F5F5F0] dark:bg-white/5 border border-red-500 text-red-500'
                                }`}
                        >
                            <Flag className="w-4 h-4" fill={isFlagged ? 'currentColor' : 'none'} />
                            {isFlagged ? 'Flagged' : 'Report Issue'}
                        </button>
                    </div>
                </motion.div>

                {/* Ad Section */}
                {nativeAd && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-[#3B0764] to-[#5C0CA7] rounded-2xl p-4 overflow-hidden"
                    >
                        <div className="flex items-center gap-4">
                            {nativeAd.type === 'video' ? (
                                <video
                                    src={nativeAd.content_url}
                                    className="w-24 h-24 rounded-xl object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={nativeAd.content_url}
                                    alt={nativeAd.title}
                                    className="w-24 h-24 rounded-xl object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Sponsored</p>
                                <h3 className="font-bold text-white">{nativeAd.title}</h3>
                                {nativeAd.cta_text && nativeAd.cta_link && (
                                    <a
                                        href={nativeAd.cta_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 px-4 py-1.5 bg-white text-[#3B0764] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                                    >
                                        {nativeAd.cta_text}
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Price Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-white/5 rounded-2xl border border-[#3B0764]/10 dark:border-white/10 overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-[#3B0764]/10 dark:border-white/10">
                        <h3 className="font-bold">Station Prices</h3>
                    </div>
                    <div className="divide-y divide-[#3B0764]/10 dark:divide-white/10">
                        {ALL_FUEL_TYPES.map(fuel => {
                            const history = priceHistories.get(fuel) || [];
                            const currentIndex = historyIndex[fuel] || 0;
                            const currentData = history[currentIndex];
                            const isNewerDisabled = currentIndex === 0;
                            const isOlderDisabled = currentIndex >= history.length - 1;

                            return (
                                <div key={fuel} className="px-4 py-3 flex items-center justify-between">
                                    <span className="font-medium">{fuel}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleHistoryNavigation(fuel, 'newer')}
                                            disabled={isNewerDisabled}
                                            className={`p-1.5 rounded-lg ${isNewerDisabled ? 'opacity-30' : 'hover:bg-[#3B0764]/10'}`}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="min-w-[120px] text-center px-3 py-1.5 border border-[#3B0764] rounded-lg">
                                            {currentData ? (
                                                <>
                                                    <p className="font-bold text-[#3B0764] dark:text-white">
                                                        ₦{currentData.price}/{fuel === 'Gas' ? 'KG' : 'L'}
                                                    </p>
                                                    <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50">
                                                        {formatTimestamp(currentData.created_at)}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-[#1A1A1A]/50 dark:text-white/50">N/A</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleHistoryNavigation(fuel, 'older')}
                                            disabled={isOlderDisabled}
                                            className={`p-1.5 rounded-lg ${isOlderDisabled ? 'opacity-30' : 'hover:bg-[#3B0764]/10'}`}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Travel Estimates */}
                {travelTimes && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10"
                    >
                        <h3 className="font-bold mb-4">Travel Estimates</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center mx-auto mb-2">
                                    <PersonStanding className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-lg">{travelTimes.walk}</p>
                                <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50">Walk</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center mx-auto mb-2">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-lg">{travelTimes.run}</p>
                                <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50">Run</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center mx-auto mb-2">
                                    <Car className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-lg">{travelTimes.drive}</p>
                                <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50">Drive</p>
                            </div>
                        </div>
                        {distance && (
                            <p className="text-center text-sm text-[#1A1A1A]/50 dark:text-white/50 mt-4">
                                {(distance / 1000).toFixed(1)} km from your location
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Amenities */}
                {allAmenities.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10"
                    >
                        <h3 className="font-bold mb-4">Amenities</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {amenitiesToShow.map(item => {
                                const IconComponent = amenityIcons[item] || Zap;
                                return (
                                    <div key={item} className="text-center">
                                        <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center mx-auto mb-2">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs">{item}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {allAmenities.length > 6 && (
                            <button
                                onClick={() => setShowAllAmenities(!showAllAmenities)}
                                className="w-full mt-4 text-center text-[#3B0764] font-medium flex items-center justify-center gap-1"
                            >
                                {showAllAmenities ? 'Show Less' : 'View All'}
                                {showAllAmenities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Ratings Summary */}
                {ratingSummary.count > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10"
                    >
                        <h3 className="font-bold mb-4">Ratings & Reviews</h3>
                        <div className="flex gap-6">
                            <div className="flex-1 space-y-2">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="text-sm w-3">{star}</span>
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <div className="flex-1 h-2 bg-[#F5F5F0] dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-500 rounded-full"
                                                style={{ width: `${(ratingSummary.distribution[star] / ratingSummary.count) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center px-6 py-4 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
                                <p className="text-4xl font-bold">{ratingSummary.average}</p>
                                <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">out of 5</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Comments */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10"
                >
                    <h3 className="font-bold mb-4">Comments ({reportsWithComments.length})</h3>
                    {commentsToShow.length > 0 ? (
                        <div className="space-y-4">
                            {commentsToShow.map(report => (
                                <div key={report.id} className="border-b border-[#3B0764]/10 dark:border-white/10 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#3B0764] text-white flex items-center justify-center font-bold">
                                            {report.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{report.profiles?.full_name || 'Anonymous'}</p>
                                                <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50">{formatTimestamp(report.created_at)}</p>
                                            </div>
                                            <div className="flex gap-0.5 my-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i <= (report.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70">{report.notes}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[#1A1A1A]/50 dark:text-white/50 py-8">No comments yet.</p>
                    )}
                    {reportsWithComments.length > 3 && (
                        <button
                            onClick={() => setShowAllComments(!showAllComments)}
                            className="w-full mt-4 text-center text-[#3B0764] font-medium flex items-center justify-center gap-1"
                        >
                            {showAllComments ? 'Show Less' : 'View All Comments'}
                            {showAllComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </motion.div>

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Top Update Gurus</h3>
                            <span className="text-xs text-[#1A1A1A]/50 dark:text-white/50">Last 30 days</span>
                        </div>
                        <div className="space-y-2">
                            {leaderboard.map((guru, index) => (
                                <div key={guru.userId} className="flex items-center gap-3 p-3 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
                                    <span className="font-bold text-sm w-5 text-center">{index + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-[#3B0764] text-white flex items-center justify-center text-sm font-bold">
                                        {guru.fullName[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="flex-1 font-medium text-sm truncate">{guru.fullName}</span>
                                    <span className="text-xs font-semibold bg-[#3B0764]/10 text-[#3B0764] dark:bg-white/10 dark:text-white px-2 py-1 rounded-lg">
                                        {guru.reportCount} reports
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
