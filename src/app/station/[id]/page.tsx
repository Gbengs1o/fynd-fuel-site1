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
    Send, Phone, Globe, ChevronDown, ChevronUp, X, Share2, ShieldCheck,
    Gauge, Beaker, Rocket, AlertTriangle, CheckCircle2, History, Info
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
    opening_time?: string | null;
    closing_time?: string | null;
    is_out_of_stock?: boolean;
    state?: string;
    official_price_pms?: number;
    official_price_ago?: number;
    official_price_dpk?: number;
    official_price_lpg?: number;
}

interface PriceReport {
    id: number;
    user_id: string;
    fuel_type: string;
    price: number | null;
    notes: string | null;
    rating: number | null;
    created_at: string;
    profiles: { full_name: string | null; nickname?: string | null; avatar_url?: string } | null;
    other_fuel_prices: { [key: string]: number } | null;
    amenities_update: { add: string[] } | null;
    payment_methods_update: { add: string[] } | null;
    availability_status?: string;
    meter_accuracy?: number;
    response?: string;
    responded_at?: string;
}

interface Review {
    id: string;
    station_id: number;
    user_id: string;
    rating: number;
    rating_meter: number;
    rating_quality: number;
    comment: string | null;
    sentiment: string | null;
    response: string | null;
    responded_at: string | null;
    created_at: string;
    report_price?: number | null;
    report_fuel_type?: string | null;
    user?: {
        full_name: string | null;
        nickname?: string | null;
        avatar_url: string | null;
    };
}

interface TrustMetrics {
    trustScore: number;
    meterAccuracy: number;
    fuelQuality: number;
    totalReviews: number;
    responseRate: number;
    isGoldVerified: boolean;
    criteriaMet: number;
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

const isStationOpen = (openingTime: string | null, closingTime: string | null): boolean => {
    if (!openingTime || !closingTime) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);
    
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    if (closeMinutes < openMinutes) {
        return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
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
    const [reviews, setReviews] = useState<Review[]>([]);
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
    const [isManagerForStation, setIsManagerForStation] = useState(false);
    const [managerUserId, setManagerUserId] = useState<string | null>(null);
    const [isBoosted, setIsBoosted] = useState(false);
    const [promotionTier, setPromotionTier] = useState<string | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isAmenitiesModalVisible, setIsAmenitiesModalVisible] = useState(false);
    const [isComplaintModalVisible, setIsComplaintModalVisible] = useState(false);
    const [priceDetailVisible, setPriceDetailVisible] = useState(false);
    const [selectedFuelForDetail, setSelectedFuelForDetail] = useState<string | null>(null);
    const [amenityActiveIndex, setAmenityActiveIndex] = useState(0);

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
                    .select('*, opening_time, closing_time')
                    .eq('id', id)
                    .single();

                if (stationError) throw stationError;

                // Set station and fetch official prices if state exists
                if (stationData.state) {
                    const { data: opData } = await supabase
                        .from('official_prices')
                        .select('pms_price, ago_price, dpk_price, lpg_price')
                        .eq('state', stationData.state)
                        .single();
                    if (opData) {
                        setStation({
                            ...stationData,
                            official_price_pms: opData.pms_price,
                            official_price_ago: opData.ago_price,
                            official_price_dpk: opData.dpk_price,
                            official_price_lpg: opData.lpg_price
                        });
                    } else {
                        setStation(stationData);
                    }
                } else {
                    setStation(stationData);
                }

                // Fetch price reports
                const { data: reportsData } = await supabase
                    .from('price_reports')
                    .select('*, profiles(full_name, nickname, avatar_url)')
                    .eq('station_id', id)
                    .order('created_at', { ascending: false });

                const consolidatedReports = reportsData || [];
                setReports(consolidatedReports);

                // Fetch reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select(`
                        *,
                        user:user_id (
                            full_name,
                            nickname,
                            avatar_url
                        )
                    `)
                    .eq('station_id', id)
                    .order('created_at', { ascending: false });

                // Check manager status
                const currentUser = (await supabase.auth.getSession()).data.session?.user;
                if (currentUser && id) {
                    const { data: managerData } = await supabase
                        .from('manager_profiles')
                        .select('id, user_id')
                        .eq('station_id', id)
                        .eq('verification_status', 'verified')
                        .single();

                    if (managerData) {
                        setManagerUserId(managerData.user_id);
                        setIsManagerForStation(managerData.user_id === currentUser.id);
                    }
                }

                // Check boosting
                try {
                    const { data: promoData } = await supabase
                        .from('station_promotions')
                        .select('id, promotion_tiers(name)')
                        .eq('station_id', id)
                        .eq('status', 'active')
                        .gt('end_time', new Date().toISOString())
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (promoData) {
                        setIsBoosted(true);
                        setPromotionTier((promoData as any).promotion_tiers?.name || 'Promoted');
                    }
                } catch { setIsBoosted(false); }

                // Combine reviews
                const baseReviews = reviewsData || [];
                const reportReviews = consolidatedReports
                    .filter(r => r.notes || r.response || r.fuel_type === 'Review')
                    .map(r => ({
                        id: `pr-${r.id}`,
                        station_id: r.station_id,
                        user_id: r.user_id,
                        rating: r.rating || 5,
                        rating_meter: r.meter_accuracy || 5,
                        rating_quality: 5,
                        comment: r.notes,
                        sentiment: null,
                        response: r.response,
                        responded_at: r.responded_at,
                        created_at: r.created_at,
                        report_price: r.price,
                        report_fuel_type: r.fuel_type ? normalizeFuelName(r.fuel_type) : null,
                        user: {
                            full_name: r.profiles?.nickname || r.profiles?.full_name || 'Anonymous Scout',
                            avatar_url: r.profiles?.avatar_url || null
                        }
                    })) as Review[];

                const combinedReviews = [...baseReviews, ...reportReviews].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setReviews(combinedReviews);

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
    const { priceHistories, allAmenities, ratingSummary, leaderboard, trustMetrics } = useMemo(() => {
        const histories = new Map<string, any[]>();
        ALL_FUEL_TYPES.forEach(fuel => histories.set(fuel, []));

        const amenitySet = new Set<string>();
        if (station?.amenities) station.amenities.forEach(a => amenitySet.add(a));
        if (station?.payment_methods) station.payment_methods.forEach(p => amenitySet.add(p));

        const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0, ratingCount = 0;
        const userReportCounts = new Map<string, { profile: any, count: number }>();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const report of reports) {
            if (report.price && report.fuel_type) {
                const normFuel = normalizeFuelName(report.fuel_type);
                if (histories.has(normFuel)) {
                    histories.get(normFuel)?.push({
                        price: report.price,
                        created_at: report.created_at,
                        user_id: report.user_id,
                        profiles: report.profiles
                    });
                }
            }
            if (report.other_fuel_prices) {
                for (const [fuel, price] of Object.entries(report.other_fuel_prices)) {
                    if (price) {
                        const normFuel = normalizeFuelName(fuel);
                        if (histories.has(normFuel)) {
                            histories.get(normFuel)?.push({
                                price,
                                created_at: report.created_at,
                                user_id: report.user_id,
                                profiles: report.profiles
                            });
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
            .map(([userId, data]) => ({ 
                userId, 
                fullName: data.profile?.nickname || data.profile?.full_name || 'Anonymous User',
                avatarUrl: data.profile?.avatar_url || null,
                reportCount: data.count 
            }))
            .sort((a, b) => b.reportCount - a.reportCount)
            .slice(0, 5);

        // Trust Score Calculation
        const totalReviews = reviews.length;
        const totalPossiblePoints = (totalReviews || 1) * 2 * 5;
        const totalPoints = reviews.reduce((acc, r) => acc + (r.rating_meter || 5) + (r.rating_quality || 5), 0);
        const trustScore = Math.round((totalPoints / totalPossiblePoints) * 100);

        const avgMeter = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + (r.rating_meter || 5), 0) / totalReviews).toFixed(1)
            : "5.0";
        const avgQuality = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + (r.rating_quality || 5), 0) / totalReviews).toFixed(1)
            : "5.0";

        const responseRate = Math.round(
            (reviews.filter(r => r.response).length / (totalReviews || 1)) * 100
        );

        const criteriaMet =
            (trustScore >= 90 ? 1 : 0) +
            (totalReviews >= 10 ? 1 : 0) +
            (responseRate >= 90 ? 1 : 0);

        const isGoldVerified = criteriaMet === 3;

        return {
            priceHistories: histories,
            allAmenities: Array.from(amenitySet),
            ratingSummary: { average: averageRating, count: ratingCount, distribution: ratingDistribution },
            leaderboard: sortedLeaderboard,
            trustMetrics: { 
                trustScore, 
                meterAccuracy: parseFloat(avgMeter), 
                fuelQuality: parseFloat(avgQuality), 
                totalReviews, 
                responseRate, 
                isGoldVerified, 
                criteriaMet 
            }
        };
    }, [reports, station, reviews]);

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

    const handleToggleStock = async () => {
        if (!user || !station) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('stations')
                .update({ is_out_of_stock: !station.is_out_of_stock })
                .eq('id', station.id);

            if (error) throw error;

            setStation(prev => prev ? { ...prev, is_out_of_stock: !prev.is_out_of_stock } : null);
            alert(`Station is now marked as ${!station.is_out_of_stock ? 'OUT OF STOCK' : 'IN STOCK'}.`);
        } catch (error: any) {
            alert(`Failed to update stock status: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFlagToggle = async () => {
        if (!user) {
            alert('Please sign in to report or flag a station.');
            return;
        }
        if (!station) return;
        // Reset complaint text and show modal
        // (Complaint modal logic will be implemented in the JSX)
        setIsComplaintModalVisible(true);
    };

    const handleSharePress = async () => {
        if (!station) return;
        const shareUrl = `${window.location.origin}/station/${station.id}`;
        const shareText = `Check out ${station.name} on FyndFuel! Fuel availability and prices: ${shareUrl}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'FyndFuel Station',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
    };

    const handleConfirmPrice = async (price: number, fuelType: string) => {
        if (!user || !station) {
            alert("Please sign in to confirm prices.");
            return;
        }
        
        try {
            const { error } = await supabase
                .from('price_reports')
                .insert({
                    station_id: station.id,
                    user_id: user.id,
                    fuel_type: fuelType,
                    price: price,
                    rating: 5, // Auto 5 stars for confirmation
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            alert(`Confirmed ₦${price} for ${fuelType}. Thank you!`);
            // Refresh logic could go here, but priceHistories will update via useEffect/fetchData if needed
        } catch (error: any) {
            alert("Error: " + error.message);
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
    const commentsToShow = showAllComments ? reviews : reviews.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-white font-sans pb-20 overflow-x-hidden">
            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#3B0764]/5 dark:border-white/5">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.push('/dashboard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F5F5F0] dark:bg-white/5 hover:scale-95 transition-transform">
                        <ArrowLeft className="w-5 h-5 text-[#3B0764] dark:text-white" />
                    </button>
                    <div className="flex-1 px-4 text-center">
                        <h1 className="font-black text-xs uppercase tracking-widest text-[#3B0764]/40 dark:text-white/40 mb-0.5">Station Profile</h1>
                        <p className="font-bold text-base truncate">{station.name}</p>
                    </div>
                    <button onClick={handleSharePress} className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F5F5F0] dark:bg-white/5 hover:scale-95 transition-transform">
                        <Share2 className="w-4 h-4 text-[#3B0764] dark:text-white" />
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto">
                {/* Hero Section: Map + Info */}
                <section className="relative h-[300px] overflow-hidden group">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                        loading="lazy"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${station.latitude},${station.longitude}&zoom=15&maptype=roadmap`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    
                    {/* Operating Status overlay */}
                    <div className="absolute bottom-6 left-4 right-4 flex items-end justify-between">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isStationOpen(station.opening_time || null, station.closing_time || null) ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}>
                                    {isStationOpen(station.opening_time || null, station.closing_time || null) ? 'Open Now' : 'Closed'}
                                </div>
                                {isBoosted && (
                                    <div className="bg-[#FFD700] text-[#1A1A1A] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-[#FFD700]/30 animate-pulse">
                                        <Rocket className="w-3 h-3" />
                                        {promotionTier}
                                    </div>
                                )}
                             </div>
                             <div className="text-white">
                                <h2 className="text-2xl font-black leading-tight drop-shadow-md">{station.name}</h2>
                                <p className="text-white/70 text-sm font-medium flex items-center gap-1.5 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {station.address || `${station.brand || 'Fuel Station'}`}
                                </p>
                             </div>
                        </div>
                    </div>
                </section>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Horizontal Price Grid */}
                <section className="mt-4 px-4">
                    <div className="bg-white dark:bg-[#121212] rounded-3xl overflow-hidden border border-[#3B0764]/5 dark:border-white/5 shadow-xl">
                        <div className="p-4 border-b border-[#3B0764]/5 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#3B0764]/40 dark:text-white/20">Station Prices</h3>
                            {station.is_out_of_stock && (
                                <span className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Out of Stock</span>
                            )}
                        </div>
                        <div className="flex overflow-x-auto no-scrollbar divide-x divide-[#3B0764]/5 dark:divide-white/5">
                            {ALL_FUEL_TYPES.map((fuel, idx) => {
                                const history = priceHistories.get(fuel) || [];
                                const currentData = history[0];
                                
                                return (
                                    <button 
                                        key={fuel} 
                                        onClick={() => {
                                            setSelectedFuelForDetail(fuel);
                                            setPriceDetailVisible(true);
                                        }}
                                        className="flex-1 min-w-[120px] p-4 text-left hover:bg-[#F5F5F0] dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[#3B0764]/40 dark:text-white/30 mb-2 group-hover:text-[#3B0764] dark:group-hover:text-white transition-colors">{fuel}</p>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black text-[#3B0764] dark:text-white mb-1">
                                                {currentData ? `₦${currentData.price}` : '—'}
                                            </span>
                                            <span className="text-[10px] text-[#1A1A1A]/40 dark:text-white/20 font-bold truncate">
                                                {currentData ? (currentData.profiles?.nickname || currentData.profiles?.full_name || 'Scout') : 'No Report'}
                                            </span>
                                            <span className="text-[9px] text-[#1A1A1A]/30 dark:text-white/10 font-medium">
                                                {currentData ? formatTimestamp(currentData.created_at) : ''}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => {
                                setSelectedFuelForDetail(ALL_FUEL_TYPES[0]);
                                setPriceDetailVisible(true);
                            }}
                            className="w-full py-4 bg-[#3B0764] text-white text-xs font-black uppercase tracking-widest hover:bg-[#4C0D8C] transition-colors flex items-center justify-center gap-2"
                        >
                            <History className="w-4 h-4" />
                            Report / View History
                        </button>
                    </div>
                </section>

                {/* Compact Action Row */}
                <section className="px-4 mt-4 grid grid-cols-3 gap-3">
                    <button 
                        onClick={handleTakeMeThere}
                        className="bg-white dark:bg-[#121212] p-4 rounded-3xl flex flex-col items-center gap-2 border border-[#3B0764]/5 dark:border-white/5 shadow-md active:scale-95 transition-transform"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-[#3B0764] dark:text-white" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider">Navigate</span>
                    </button>
                    <button 
                        onClick={handleToggleTrack}
                        disabled={isTrackingLoading}
                        className={`p-4 rounded-3xl flex flex-col items-center gap-2 border shadow-md active:scale-95 transition-all
                            ${isTracked 
                                ? 'bg-green-500 border-green-500 text-white shadow-green-500/20' 
                                : 'bg-white dark:bg-[#121212] border-[#3B0764]/5 dark:border-white/5'}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isTracked ? 'bg-white/20' : 'bg-[#3B0764]/5 dark:bg-white/5'}`}>
                            {isTrackingLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Bookmark className={`w-5 h-5 ${isTracked ? 'text-white' : 'text-[#3B0764] dark:text-white'}`} fill={isTracked ? 'currentColor' : 'none'} />
                            )}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider">{isTracked ? 'Tracked' : 'Track'}</span>
                    </button>
                    <button 
                        onClick={handleFlagToggle}
                        className="bg-white dark:bg-[#121212] p-4 rounded-3xl flex flex-col items-center gap-2 border border-[#3B0764]/5 dark:border-white/5 shadow-md active:scale-95 transition-transform"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-red-500/5 dark:bg-red-500/10 flex items-center justify-center">
                            <Flag className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-500">Report</span>
                    </button>
                </section>

                {/* Ad Section */}
                {nativeAd && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-gradient-to-r from-[#3B0764] to-[#5C0CA7] rounded-3xl p-4 overflow-hidden mt-6 mx-4"
                    >
                        <div className="flex items-center gap-4">
                            {nativeAd.type === 'video' ? (
                                <video
                                    src={nativeAd.content_url}
                                    className="w-20 h-20 rounded-2xl object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={nativeAd.content_url}
                                    alt={nativeAd.title}
                                    className="w-20 h-20 rounded-2xl object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Sponsored Content</p>
                                <h3 className="font-black text-white text-sm">{nativeAd.title}</h3>
                                {nativeAd.cta_text && nativeAd.cta_link && (
                                    <a
                                        href={nativeAd.cta_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 px-4 py-1.5 bg-white text-[#3B0764] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/90 transition-colors"
                                    >
                                        {nativeAd.cta_text}
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Trust Analytics Card */}
                <section className="px-4 mt-6">
                    <div className="bg-gradient-to-br from-[#3B0764] to-[#1A032D] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Trust Analytics</p>
                                <h3 className="text-5xl font-black">{trustMetrics.trustScore}<span className="text-2xl text-white/40">%</span></h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${trustMetrics.isGoldVerified ? 'bg-[#FFD700] text-[#1A1A1A]' : 'bg-white/10 text-white/60'}`}>
                                        <ShieldCheck className="w-3 h-3" />
                                        {trustMetrics.isGoldVerified ? 'Gold Verified' : 'Standard Station'}
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40">{trustMetrics.totalReviews} Reviews</span>
                                </div>
                            </div>
                            <ShieldCheck className={`w-16 h-16 ${trustMetrics.isGoldVerified ? 'text-[#FFD700]' : 'text-white/5'}`} />
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10 border-t border-white/10 pt-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-white/40 mb-1">
                                    <Gauge className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Meter Accuracy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white rounded-full opacity-60"
                                            style={{ width: `${(trustMetrics.meterAccuracy / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black">{trustMetrics.meterAccuracy}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-white/40 mb-1">
                                    <Droplets className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Fuel Quality</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white rounded-full opacity-60"
                                            style={{ width: `${(trustMetrics.fuelQuality / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black">{trustMetrics.fuelQuality}</span>
                                </div>
                            </div>
                        </div>

                        {/* Gold Status Checklist */}
                        {!trustMetrics.isGoldVerified && (
                             <div className="mt-6 bg-white/5 rounded-2xl p-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">To become Gold Verified:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className={`text-[9px] font-bold flex items-center gap-1 ${trustMetrics.trustScore >= 90 ? 'text-green-400' : 'text-white/40'}`}>
                                        <CheckCircle2 className="w-3 h-3" /> 90%+ Score
                                    </div>
                                    <div className={`text-[9px] font-bold flex items-center gap-1 ${trustMetrics.totalReviews >= 10 ? 'text-green-400' : 'text-white/40'}`}>
                                        <CheckCircle2 className="w-3 h-3" /> 10+ Reviews
                                    </div>
                                    <div className={`text-[9px] font-bold flex items-center gap-1 ${trustMetrics.responseRate >= 90 ? 'text-green-400' : 'text-white/40'}`}>
                                        <CheckCircle2 className="w-3 h-3" /> 90%+ Replies
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </section>

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
                     
                {/* Ratings Summary */}
                {ratingSummary.count > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-[#3B0764]/10 dark:border-white/10 mt-6 mx-4"
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


                {/* Amenities - Horizontal Scroll */}
                <section className="mt-8">
                    <div className="px-6 flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3B0764]/40 dark:text-white/20">Amenities</h3>
                        {allAmenities.length > 5 && (
                            <button onClick={() => setIsAmenitiesModalVisible(true)} className="text-[10px] font-black uppercase text-[#3B0764] dark:text-[#FFD700]">View All</button>
                        )}
                    </div>
                    {allAmenities.length > 0 ? (
                        <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 pb-2">
                            {allAmenities.map((item) => {
                                const IconComponent = amenityIcons[item] || Zap;
                                return (
                                    <div key={item} className="bg-white dark:bg-[#121212] flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#3B0764]/5 dark:border-white/5 shadow-sm shrink-0">
                                        <IconComponent className="w-4 h-4 text-[#3B0764] dark:text-white/60" />
                                        <span className="text-[11px] font-black uppercase tracking-wider text-[#1A1A1A]/70 dark:text-white/70 whitespace-nowrap">{item}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="px-6 text-xs font-bold text-[#1A1A1A]/30 italic">No amenities listed yet.</p>
                    )}
                </section>

                {/* Citizen Feedback - Reviews */}
                <section className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3B0764]/40 dark:text-white/20">Citizen Feedback</h3>
                        <button 
                            onClick={() => router.push(`/report/submit?stationId=${station.id}`)}
                            className="bg-[#3B0764]/5 dark:bg-white/5 text-[#3B0764] dark:text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-[#3B0764] hover:text-white transition-all"
                        >
                            Write Review
                        </button>
                    </div>
                    <div className="space-y-4">
                        {reviews.length > 0 ? (
                            reviews.slice(0, showAllComments ? undefined : 3).map((review) => (
                                <div key={review.id} className="bg-white dark:bg-[#121212] p-6 rounded-[32px] border border-[#3B0764]/5 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#1A032D] flex items-center justify-center text-white font-black text-sm uppercase shadow-inner">
                                                {review.user?.avatar_url ? (
                                                    <img src={review.user.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="User Avatar" />
                                                ) : (
                                                    (review.user?.nickname || review.user?.full_name || 'U')[0]
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-[#3B0764] dark:text-white">{review.user?.nickname || review.user?.full_name || 'Anonymous User'}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#F5F5F0] dark:text-white/5'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-black text-[#1A1A1A]/30 uppercase ml-1">{formatTimestamp(review.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {review.report_price && (
                                            <div className="bg-[#3B0764]/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                                                <p className="text-[10px] font-black text-[#3B0764] dark:text-white">₦{review.report_price}</p>
                                            </div>
                                        )}
                                     </div>
                                     {review.comment && (
                                        <p className="mt-4 text-sm font-medium leading-relaxed text-[#1A1A1A]/70 dark:text-white/70 italic">&ldquo;{review.comment}&rdquo;</p>
                                     )}
                                     {review.response && (
                                         <div className="mt-4 bg-[#F5F5F0] dark:bg-white/5 rounded-2xl p-4 border-l-4 border-orange-500">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">Station Management</span>
                                            </div>
                                            <p className="text-xs font-bold text-[#1A1A1A]/80 dark:text-white/80">{review.response}</p>
                                         </div>
                                     )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-[#121212] p-12 rounded-[40px] border border-dashed border-[#3B0764]/10 dark:border-white/10 text-center">
                                <MessageSquare className="w-10 h-10 text-[#3B0764]/10 mx-auto mb-3" />
                                <p className="text-xs font-black uppercase tracking-widest text-[#3B0764]/40">No citizen feedback yet</p>
                            </div>
                        )}
                        {reviews.length > 3 && (
                            <button 
                                onClick={() => setShowAllComments(!showAllComments)}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-[#3B0764] dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                            >
                                {showAllComments ? 'Collapse Feedback' : `View All ${reviews.length} Reviews`}
                            </button>
                        )}
                    </div>
                </section>

                {/* Manager Portal */}
                {isManagerForStation ? (
                    <section className="px-4 mt-6">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-orange-600">Manager Terminal</h4>
                                    <p className="text-sm font-bold text-orange-900">Verified Access</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleToggleStock}
                                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                        ${station.is_out_of_stock 
                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                            : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                                >
                                    {station.is_out_of_stock ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    {station.is_out_of_stock ? 'Mark In Stock' : 'Mark Out Stock'}
                                </button>
                                <button 
                                    onClick={() => router.push(`/dashboard/promote?stationId=${station.id}`)}
                                    className="bg-[#3B0764] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#3B0764]/20"
                                >
                                    <Rocket className="w-4 h-4" />
                                    Promote Station
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                     <section className="px-4 mt-8">
                        <button 
                            onClick={() => router.push('/manager/onboarding')}
                            className="w-full bg-[#121212] dark:bg-white text-white dark:text-[#121212] p-6 rounded-[32px] flex items-center justify-between group overflow-hidden relative"
                        >
                            <div className="relative z-10 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Are you the manager?</p>
                                <h4 className="text-lg font-black tracking-tight">Claim this Station</h4>
                            </div>
                            <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform relative z-10" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full translate-x-12 -translate-y-12" />
                        </button>
                    </section>
                )}

                {/* Contributor Leaderboard */}
                {leaderboard.length > 0 && (
                    <section className="mt-8 mb-12">
                        <div className="px-6 flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3B0764]/40 dark:text-white/20">Update Gurus</h3>
                            <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Active This Month</span>
                        </div>
                        <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-2">
                            {leaderboard.map((guru, idx) => (
                                <div key={guru.userId} className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-[#3B0764]/5 dark:border-white/5 shadow-sm shrink-0 min-w-[160px] relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-12 h-12 bg-[#3B0764]/5 rounded-bl-3xl flex items-center justify-center font-black text-lg text-[#3B0764]/20">#{idx + 1}</div>
                                     <div className="relative z-10">
                                         <div className="w-10 h-10 rounded-full bg-[#3B0764] text-white flex items-center justify-center font-black text-xs uppercase mb-3">
                                            {guru.avatarUrl ? (
                                                <img src={guru.avatarUrl} className="w-full h-full rounded-full object-cover" alt={guru.fullName} />
                                            ) : (
                                                guru.fullName[0]
                                            )}
                                         </div>
                                         <p className="font-black text-xs text-[#3B0764] dark:text-white truncate">{guru.fullName}</p>
                                         <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase mt-1">{guru.reportCount} Reports</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>

            {/* Price Detail Modal - Bottom Sheet Style */}
            <AnimatePresence>
                {priceDetailVisible && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPriceDetailVisible(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-xl bg-white dark:bg-[#0A0A0A] rounded-t-[40px] shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            <div className="w-12 h-1.5 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-full mx-auto mt-4 mb-8" />
                            
                            <div className="px-8 pb-12">
                                {selectedFuelForDetail && (() => {
                                    const fuel = selectedFuelForDetail;
                                    const history = priceHistories.get(fuel) || [];
                                    const currentData = history[0];
                                    
                                    return (
                                        <>
                                            <div className="text-center mb-8">
                                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#3B0764] dark:text-white/40 mb-2">{fuel} Dashboard</h4>
                                                <div className="flex items-start justify-center gap-1">
                                                    <span className="text-3xl font-black mt-2 text-[#3B0764]/40">₦</span>
                                                    <span className="text-8xl font-black text-[#3B0764] dark:text-white tracking-tighter">{currentData?.price || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-[#F5F5F0] dark:bg-white/5 rounded-3xl p-6 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-[#3B0764] flex items-center justify-center text-white font-black">
                                                            {(currentData?.profiles?.nickname || currentData?.profiles?.full_name || 'U')[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#3B0764]/40 dark:text-white/40 mb-1">Last Update By</p>
                                                            <p className="text-sm font-black">{currentData?.profiles?.nickname || currentData?.profiles?.full_name || 'Anonymous Scout'}</p>
                                                            <p className="text-[10px] font-bold text-[#1A1A1A]/30 uppercase">{currentData ? formatTimestamp(currentData.created_at) : 'No recent reports'}</p>
                                                        </div>
                                                    </div>
                                                    <Info className="w-5 h-5 text-[#3B0764]/20" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button 
                                                        onClick={() => {
                                                            handleConfirmPrice(currentData?.price || 0, fuel);
                                                            setPriceDetailVisible(false);
                                                        }}
                                                        disabled={!currentData}
                                                        className="h-16 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Confirm Price
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setPriceDetailVisible(false);
                                                            router.push(`/report/submit?stationId=${station.id}&fuelType=${fuel}`);
                                                        }}
                                                        className="h-16 bg-[#3B0764] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#3B0764]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Gauge className="w-4 h-4" /> New Report
                                                    </button>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => setPriceDetailVisible(false)}
                                                    className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-[#3B0764]/40 dark:text-white/20 active:scale-95 transition-all"
                                                >
                                                    Close Details
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Amenities Modal */}
            <AnimatePresence>
                {isAmenitiesModalVisible && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAmenitiesModalVisible(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#121212] rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <h4 className="text-xl font-black mb-6 uppercase tracking-widest text-[#3B0764] dark:text-white">All Amenities</h4>
                                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                                    {allAmenities.map((item) => {
                                        const IconComponent = amenityIcons[item] || Zap;
                                        return (
                                            <div key={item} className="bg-[#F5F5F0] dark:bg-white/5 p-4 rounded-3xl border border-[#3B0764]/5 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm">
                                                    <IconComponent className="w-4 h-4 text-[#3B0764] dark:text-white/60" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]/70 dark:text-white/70">{item}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setIsAmenitiesModalVisible(false)}
                                    className="w-full mt-8 h-16 bg-[#3B0764] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Complaint Modal */}
            <AnimatePresence>
                {isComplaintModalVisible && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsComplaintModalVisible(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#121212] rounded-[40px] shadow-2xl overflow-hidden p-8"
                        >
                            <h4 className="text-xl font-black mb-2">Report Station</h4>
                            <p className="text-sm font-medium text-[#1A1A1A]/40 dark:text-white/40 mb-8">If this station is closed permanently or does not exist, flag it. For other issues, submit a complaint.</p>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={async () => {
                                        setIsComplaintModalVisible(false);
                                        await handleFlagToggle();
                                    }}
                                    className="w-full h-16 bg-red-500 rounded-3xl text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                                >
                                    <Flag className="w-4 h-4" /> Flag as Non-Existent
                                </button>
                                
                                <div className="py-4 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-[#1A1A1A]/5 dark:bg-white/5" />
                                    <span className="text-[10px] font-black uppercase text-[#1A1A1A]/20">Or</span>
                                    <div className="flex-1 h-px bg-[#1A1A1A]/5 dark:bg-white/5" />
                                </div>
                                
                                <textarea 
                                    placeholder="Write your complaint here..."
                                    className="w-full h-32 bg-[#F5F5F0] dark:bg-white/5 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#3B0764] outline-none transition-all resize-none"
                                />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setIsComplaintModalVisible(false)}
                                        className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            alert("Complaint submitted. Our team will review it.");
                                            setIsComplaintModalVisible(false);
                                        }}
                                        className="h-14 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Nav Padding */}
            <div className="h-20" />
        </div>
    );
}
