'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import MapBackground from '@/components/Map/GoogleMap';
import { MapPin, Navigation, Search, Menu, X, Home, Heart, User, LogOut, Fuel, ChevronRight, Scan, Plus, Bookmark, Eye, Locate, Compass, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LetterAvatar } from '@/components/LetterAvatar';
import Logo from '@/components/Logo';

interface Station {
    id: number;
    name: string;
    address: string;
    price: number;
    status: string;
    fuelTypes: string[];
    distance?: string;
    lat: number;
    lng: number;
    brand?: string;
    fuel_type?: string;
}

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    properties: {
        id: number;
        name: string;
        address?: string;
        brand?: string;
        price?: number;
        fuel_type?: string;
    };
}

interface GeoJSONData {
    type: string;
    features: GeoJSONFeature[];
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStation, setActiveStation] = useState<number | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'map'>('map');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('Locating...');
    const [stations, setStations] = useState<Station[]>([]);
    const [stationGeoJSON, setStationGeoJSON] = useState<GeoJSONData | null>(null);
    const [trackedStations, setTrackedStations] = useState<Set<number>>(new Set());
    const [nearbyCount, setNearbyCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Check user session
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) router.push('/login');
            else setUser(session.user);
        };
        checkUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // Fetch real station data from Supabase (GeoJSON)
    useEffect(() => {
        const fetchStations = async () => {
            setIsLoading(true);
            try {
                // Call the same RPC function as the mobile app
                const { data, error } = await supabase.rpc('get_stations_geojson');

                if (error) {
                    console.error('Error fetching stations:', error);
                    return;
                }

                if (data) {
                    setStationGeoJSON(data);

                    // Convert GeoJSON features to Station array for the list view
                    const stationList: Station[] = data.features.map((feature: GeoJSONFeature) => ({
                        id: feature.properties.id,
                        name: feature.properties.name,
                        address: feature.properties.address || 'Address not available',
                        price: feature.properties.price || 0,
                        status: 'Available', // Default status since not in GeoJSON
                        fuelTypes: feature.properties.fuel_type ? [feature.properties.fuel_type] : ['PMS'],
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        brand: feature.properties.brand,
                        fuel_type: feature.properties.fuel_type,
                    }));

                    setStations(stationList);
                    setNearbyCount(stationList.length);
                }
            } catch (err) {
                console.error('Failed to fetch stations:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStations();
    }, []);

    // Fetch user's tracked/favourite stations
    useEffect(() => {
        const fetchTrackedStations = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('favourite_stations')
                .select('station_id')
                .eq('user_id', user.id);

            if (data) {
                setTrackedStations(new Set(data.map(f => f.station_id)));
            }
        };

        if (user) {
            fetchTrackedStations();
        }
    }, [user]);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });

                    // Reverse geocode for location name
                    try {
                        const response = await fetch(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
                        );
                        const data = await response.json();
                        if (data.results && data.results[0]) {
                            const addressComponents = data.results[0].address_components;
                            const neighborhood = addressComponents.find((c: any) => c.types.includes('neighborhood'))?.long_name;
                            const locality = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
                            setLocationName(neighborhood || locality || 'Current Location');
                        }
                    } catch (error) {
                        setLocationName('Lagos, Nigeria');
                    }
                },
                () => {
                    setUserLocation({ lat: 6.5244, lng: 3.3792 }); // Lagos default
                    setLocationName('Lagos, Nigeria');
                }
            );
        }
    }, []);

    // Calculate nearby stations based on user location
    useEffect(() => {
        if (userLocation && stations.length > 0) {
            const nearby = stations.filter(station => {
                const distance = getDistance(userLocation.lat, userLocation.lng, station.lat, station.lng);
                return distance <= 10; // 10km radius
            });
            setNearbyCount(nearby.length);
        }
    }, [stations, userLocation]);

    // Helper function to calculate distance between two points (Haversine)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleScanArea = async () => {
        if (!userLocation) return;

        setIsScanning(true);
        setShowQuickActions(false);

        try {
            // Call the scan-area edge function just like the mobile app
            const { data, error } = await supabase.functions.invoke('scan-area', {
                body: { lat: userLocation.lat, lon: userLocation.lng }
            });

            if (error) throw error;

            if (data?.status === 'scanned') {
                // Refresh station data after scan
                const { data: stationData } = await supabase.rpc('get_stations_geojson');
                if (stationData) {
                    setStationGeoJSON(stationData);
                    const stationList: Station[] = stationData.features.map((feature: GeoJSONFeature) => ({
                        id: feature.properties.id,
                        name: feature.properties.name,
                        address: feature.properties.address || 'Address not available',
                        price: feature.properties.price || 0,
                        status: 'Available',
                        fuelTypes: feature.properties.fuel_type ? [feature.properties.fuel_type] : ['PMS'],
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        brand: feature.properties.brand,
                    }));
                    setStations(stationList);
                }
                alert(`✨ Scan Complete! ${data.message || `Found ${data.count || 0} new stations.`}`);
            } else if (data?.status === 'cached') {
                alert(`ℹ️ ${data.message || 'This area has already been scanned recently.'}`);
            }
        } catch (error: any) {
            console.error('Scan failed:', error);
            alert('Scan failed. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleRecenter = () => {
        if (userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            });
        }
    };

    const handleTrackStation = async (stationId: number) => {
        if (!user) {
            alert('Please sign in to track stations.');
            return;
        }

        const isCurrentlyTracked = trackedStations.has(stationId);

        try {
            if (isCurrentlyTracked) {
                // Remove from favourites
                await supabase
                    .from('favourite_stations')
                    .delete()
                    .match({ user_id: user.id, station_id: stationId });

                setTrackedStations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(stationId);
                    return newSet;
                });
            } else {
                // Add to favourites
                await supabase
                    .from('favourite_stations')
                    .insert({ user_id: user.id, station_id: stationId, notifications_enabled: true });

                setTrackedStations(prev => new Set(prev).add(stationId));
            }
        } catch (error: any) {
            console.error('Track station error:', error);
            alert('Failed to update tracking. Please try again.');
        }
    };

    const filteredStations = stations.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedStation = stations.find(s => s.id === activeStation);

    const handlePlaceSelected = useCallback((location: { lat: number, lng: number }, placeName: string) => {
        setUserLocation(location);
        setLocationName(placeName);
        setSearchTerm('');
    }, []);

    return (
        <div className="h-screen flex bg-[#F5F5F0] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white">

            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#1A1A1A] border-r border-[#3B0764]/10 dark:border-white/10 z-40">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-[#3B0764]/10 dark:border-white/10 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#3B0764] flex items-center justify-center">
                        <Logo className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-xl tracking-tight">Fynd Fuel</h1>
                        <p className="text-xs text-[#1A1A1A]/60 dark:text-white/60">Precision fuel discovery</p>
                    </div>
                </div>

                {/* Scrollable Navigation Container */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#3B0764] text-white font-medium">
                            <Home className="w-5 h-5" />
                            Dashboard
                        </Link>
                        <Link href="/dashboard/search" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/5 dark:hover:bg-white/5 hover:text-[#3B0764] dark:hover:text-white transition-colors">
                            <Search className="w-5 h-5" />
                            Find Gas
                        </Link>
                        <Link href="/dashboard/favorites" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/5 dark:hover:bg-white/5 hover:text-[#3B0764] dark:hover:text-white transition-colors">
                            <Heart className="w-5 h-5" />
                            Tracked Stations
                            {trackedStations.size > 0 && (
                                <span className="ml-auto bg-[#3B0764] text-white text-xs px-2 py-0.5 rounded-full">{trackedStations.size}</span>
                            )}
                        </Link>
                        <Link href="/dashboard/submit-station" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/5 dark:hover:bg-white/5 hover:text-[#3B0764] dark:hover:text-white transition-colors">
                            <Plus className="w-5 h-5" />
                            Suggest Station
                        </Link>
                        <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/5 dark:hover:bg-white/5 hover:text-[#3B0764] dark:hover:text-white transition-colors">
                            <User className="w-5 h-5" />
                            Profile
                        </Link>
                    </nav>

                    {/* User Profile - Always visible at bottom */}
                    <div className="p-4 border-t border-[#3B0764]/10 dark:border-white/10 shrink-0">
                        <Link href="/dashboard/profile" className="flex items-center gap-3 p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-colors group">
                            <LetterAvatar name={user?.email || 'User'} className="w-11 h-11 text-lg" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-[#3B0764] dark:group-hover:text-white transition-colors">{user?.email}</p>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-bold"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 z-50"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <motion.aside
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-[#1A1A1A] shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[#3B0764]/10 dark:border-white/10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#3B0764] flex items-center justify-center">
                                        <Logo className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="font-serif font-bold text-lg">Fynd Fuel</h1>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-[#F5F5F0] dark:hover:bg-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto">
                                <nav className="px-4 py-6 space-y-2">
                                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#3B0764] text-white font-medium">
                                        <Home className="w-5 h-5" />
                                        Dashboard
                                    </Link>
                                    <Link href="/dashboard/search" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#F5F5F0] dark:hover:bg-white/5">
                                        <Search className="w-5 h-5" />
                                        Find Gas
                                    </Link>
                                    <Link href="/dashboard/favorites" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#F5F5F0] dark:hover:bg-white/5">
                                        <Heart className="w-5 h-5" />
                                        Tracked Stations
                                    </Link>
                                    <Link href="/dashboard/submit-station" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#F5F5F0] dark:hover:bg-white/5">
                                        <Plus className="w-5 h-5" />
                                        Suggest Station
                                    </Link>
                                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#F5F5F0] dark:hover:bg-white/5">
                                        <User className="w-5 h-5" />
                                        Profile
                                    </Link>
                                </nav>
                            </div>

                            {/* Fixed Logout Button at Bottom */}
                            <div className="p-4 border-t border-[#3B0764]/10 dark:border-white/10 shrink-0">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-bold"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 lg:pl-80 flex flex-col h-full relative">

                {/* Map takes full screen on mobile */}
                <div className={`absolute inset-0 ${mobileView === 'map' || typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'}`}>
                    <MapBackground
                        stations={filteredStations}
                        userLocation={userLocation || undefined}
                        selectedStation={selectedStation}
                        onStationClick={(station) => setActiveStation(station.id)}
                        onClosePopup={() => setActiveStation(null)}
                        onPlaceSelected={handlePlaceSelected}
                        searchInputRef={searchInputRef}
                    />
                </div>

                {/* Top Bar - Floating */}
                <header className="relative z-30 m-3 sm:m-4 lg:m-6">
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-2xl border border-[#3B0764]/10 dark:border-white/10 shadow-lg">
                        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl hover:bg-[#F5F5F0] dark:hover:bg-white/5 shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {/* Search Bar */}
                            <div className="flex-1 relative min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40 dark:text-white/40" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search places, stations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchTerm.trim()) {
                                            router.push(`/dashboard/search`);
                                        }
                                    }}
                                    className="w-full pl-10 pr-2 sm:pr-4 py-2.5 rounded-xl bg-[#F5F5F0] dark:bg-white/5 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B0764]"
                                />
                            </div>

                            <Link
                                href="/dashboard/notifications"
                                className="p-2 rounded-xl text-[#1A1A1A]/40 dark:text-white/40 hover:bg-[#F5F5F0] dark:hover:bg-white/5 hover:text-[#3B0764] dark:hover:text-white transition-colors shrink-0"
                            >
                                <Bell className="w-5 h-5" />
                            </Link>
                            <div className="shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Control Panel - Bottom */}
                <div className="absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4 lg:bottom-6 lg:left-6 lg:right-auto z-30">
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-2xl border border-[#3B0764]/10 dark:border-white/10 shadow-lg p-3 sm:p-4 lg:min-w-[360px] w-full lg:w-auto">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:justify-between">
                            {/* Stats */}
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-[#3B0764] dark:text-white">{nearbyCount}</p>
                                    <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50 uppercase tracking-wider">Nearby</p>
                                </div>
                                <div className="w-px h-10 bg-[#3B0764]/10 dark:bg-white/10" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-sm sm:text-base">{locationName}</p>
                                    <div className="flex items-center gap-1 text-xs text-[#1A1A1A]/50 dark:text-white/50">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">Current Location</span>
                                    </div>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleRecenter}
                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center hover:bg-[#3B0764] hover:text-white transition-colors shrink-0 touch-manipulation"
                                    aria-label="Recenter map"
                                >
                                    <Locate className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAB Button */}
                <div className="absolute bottom-36 right-3 sm:right-4 lg:bottom-28 lg:right-6 z-30">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowQuickActions(true)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#3B0764] to-[#5C0CA7] text-white flex items-center justify-center shadow-lg shadow-[#3B0764]/30 touch-manipulation"
                        aria-label="Quick actions"
                    >
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
                    </motion.button>
                </div>

                {/* Station List Panel - Desktop */}
                <div className={`absolute top-24 right-4 lg:right-6 bottom-24 w-[360px] z-30 hidden lg:block`}>
                    <div className="h-full bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-2xl border border-[#3B0764]/10 dark:border-white/10 shadow-lg overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-[#3B0764]/10 dark:border-white/10 flex items-center justify-between">
                            <h2 className="font-semibold">Nearby Stations</h2>
                            <span className="text-xs text-[#1A1A1A]/50 dark:text-white/50">{filteredStations.length} found</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {filteredStations.map((station) => (
                                <motion.div
                                    key={station.id}
                                    layout
                                    onClick={() => setActiveStation(station.id === activeStation ? null : station.id)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeStation === station.id
                                        ? 'bg-[#3B0764]/5 dark:bg-[#3B0764]/20 border-[#3B0764]'
                                        : 'bg-white dark:bg-white/5 border-transparent hover:border-[#3B0764]/20'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{station.name}</h3>
                                            <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50 flex items-center gap-1 mt-0.5 truncate">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                {station.address}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 ml-2 text-xs font-medium px-2 py-1 rounded-full ${station.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            station.status === 'Busy' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {station.status}
                                        </span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xl font-bold text-[#3B0764] dark:text-white">₦{station.price}</p>
                                            <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40">per liter (PMS)</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTrackStation(station.id); }}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${trackedStations.has(station.id)
                                                    ? 'bg-[#3B0764] text-white'
                                                    : 'bg-[#F5F5F0] dark:bg-white/5 text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/10'
                                                    }`}
                                            >
                                                <Bookmark className="w-4 h-4" fill={trackedStations.has(station.id) ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/station/${station.id}`); }}
                                                className="w-9 h-9 rounded-xl bg-[#3B0764] text-white flex items-center justify-center hover:bg-[#4C0D8C] transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Station Popup */}
                <AnimatePresence>
                    {selectedStation && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="lg:hidden absolute bottom-44 left-3 right-3 sm:left-4 sm:right-4 z-40 max-w-md mx-auto"
                        >
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#3B0764]/10 dark:border-white/10 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#3B0764] to-[#5C0CA7] p-3 sm:p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white/70 uppercase tracking-wider truncate">{selectedStation.brand || 'Fuel Station'}</p>
                                            <h3 className="text-lg sm:text-xl font-bold text-white truncate">{selectedStation.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => setActiveStation(null)}
                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 touch-manipulation"
                                            aria-label="Close"
                                        >
                                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 sm:p-4">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center shrink-0">
                                            <MapPin className="w-4 h-4 text-[#3B0764]" />
                                        </div>
                                        <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70 truncate">{selectedStation.address}</p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5F5F0] dark:bg-white/5 flex items-center justify-center shrink-0">
                                            <Fuel className="w-4 h-4 text-[#3B0764]" />
                                        </div>
                                        <p className="text-sm">
                                            <span className="font-bold text-[#3B0764] dark:text-white">₦{selectedStation.price}/L</span>
                                            <span className="text-[#1A1A1A]/50 dark:text-white/50"> • PMS</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 sm:gap-3">
                                        <button
                                            onClick={() => handleTrackStation(selectedStation.id)}
                                            className={`flex-1 py-3 sm:py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation transition-colors ${trackedStations.has(selectedStation.id)
                                                ? 'bg-green-500 text-white'
                                                : 'bg-[#F5F5F0] dark:bg-white/5 text-[#1A1A1A] dark:text-white hover:bg-[#3B0764]/10'
                                                }`}
                                        >
                                            <Bookmark className="w-4 h-4" fill={trackedStations.has(selectedStation.id) ? 'currentColor' : 'none'} />
                                            <span className="hidden xs:inline">{trackedStations.has(selectedStation.id) ? 'Tracking' : 'Track'}</span>
                                        </button>
                                        <button
                                            onClick={() => router.push(`/station/${selectedStation.id}`)}
                                            className="flex-1 py-3 sm:py-3.5 rounded-xl bg-[#3B0764] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#4C0D8C] transition-colors text-sm sm:text-base touch-manipulation"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Actions Modal */}
                <AnimatePresence>
                    {showQuickActions && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-end justify-center"
                            onClick={() => setShowQuickActions(false)}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ y: 300 }}
                                animate={{ y: 0 }}
                                exit={{ y: 300 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-t-3xl p-6 pb-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-10 h-1 bg-[#1A1A1A]/20 dark:bg-white/20 rounded-full mx-auto mb-6" />
                                <h2 className="text-xl font-bold mb-6">Quick Actions</h2>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleScanArea}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                                            <Scan className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">Scan Area</p>
                                            <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">Find missing stations nearby</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/30" />
                                    </button>

                                    <button
                                        onClick={() => router.push('/dashboard/submit-station')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f093fb] to-[#f5576c] flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">Suggest Station</p>
                                            <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">Add a new fuel station</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/30" />
                                    </button>

                                    <button
                                        onClick={() => router.push('/dashboard/search')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center">
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">Find Gas</p>
                                            <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">Search for stations</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/30" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Overlay */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center"
                        >
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-[#3B0764]/20 border-t-[#3B0764] rounded-full animate-spin mb-4" />
                                <p className="font-semibold">Scanning area...</p>
                                <p className="text-sm text-[#1A1A1A]/50 dark:text-white/50">Finding nearby stations</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile View Toggle */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-[#3B0764]/10 dark:border-white/10 flex pb-safe">
                    <button
                        onClick={() => setMobileView('map')}
                        className={`flex-1 py-4 text-sm sm:text-base font-medium text-center transition-all touch-manipulation ${mobileView === 'map' ? 'text-[#3B0764] dark:text-white bg-[#3B0764]/10 dark:bg-white/10 border-t-2 border-[#3B0764]' : 'text-[#1A1A1A]/50 dark:text-white/50 hover:bg-[#F5F5F0] dark:hover:bg-white/5'}`}
                    >
                        Map View
                    </button>
                    <button
                        onClick={() => setMobileView('list')}
                        className={`flex-1 py-4 text-sm sm:text-base font-medium text-center transition-all touch-manipulation ${mobileView === 'list' ? 'text-[#3B0764] dark:text-white bg-[#3B0764]/10 dark:bg-white/10 border-t-2 border-[#3B0764]' : 'text-[#1A1A1A]/50 dark:text-white/50 hover:bg-[#F5F5F0] dark:hover:bg-white/5'}`}
                    >
                        Station List
                    </button>
                </div>

                {/* Mobile Station List */}
                <AnimatePresence>
                    {mobileView === 'list' && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden absolute inset-0 z-20 bg-white dark:bg-[#1A1A1A] pt-20 pb-16"
                        >
                            <div className="h-full overflow-y-auto p-4 space-y-3">
                                {filteredStations.map((station) => (
                                    <div
                                        key={station.id}
                                        onClick={() => {
                                            setActiveStation(station.id);
                                            setMobileView('map');
                                        }}
                                        className="p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 border border-transparent hover:border-[#3B0764]/20"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{station.name}</h3>
                                                <p className="text-xs text-[#1A1A1A]/50 dark:text-white/50 flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    {station.address}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 ml-2 text-xs font-medium px-2 py-1 rounded-full ${station.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                station.status === 'Busy' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {station.status}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xl font-bold text-[#3B0764] dark:text-white">₦{station.price}</p>
                                                <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40">per liter (PMS)</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/station/${station.id}`); }}
                                                className="w-10 h-10 rounded-xl bg-[#3B0764] text-white flex items-center justify-center hover:bg-[#4C0D8C] transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
