'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Search as SearchIcon, Map as MapIcon, SlidersHorizontal,
    Navigation, RefreshCw, ChevronDown, Check, X, ArrowLeft
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useFilterStore } from '@/stores/useFilterStore';
import StationCard, { Station } from '@/components/StationCard';
import AdvertCard, { Advert } from '@/components/AdvertCard';
import FyndFuelLogo from '@/components/icons/FyndFuelLogo';
import { motion, AnimatePresence } from 'framer-motion';

// Extended Station Interface
interface SearchStation extends Station {
    distance_meters: number;
    amenities: string[];
    products: string[];
    average_rating?: number;
    latest_pms_price?: number;
    latest_ago_price?: number;
    latest_lpg_price?: number;
    latest_dpk_price?: number;
}

const POPULAR_BRANDS = ["Mobil", "NNPC", "Rainoil", "Conoil", "PPMC", "Total", "Ascon Oil", "OANDO", "AP"];

export default function SearchPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const [allStations, setAllStations] = useState<SearchStation[]>([]);
    const [adverts, setAdverts] = useState<Advert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);

    // Store
    const { filters, location, setLocation, setFilters } = useFilterStore();
    const [showBrandsModal, setShowBrandsModal] = useState(false);

    // Auth
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    // 1. Location Tracking
    const startLocationTracking = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setIsTrackingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    name: 'Current Location',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setIsTrackingLocation(false);
            },
            (error) => {
                console.error('Error getting location', error);
                setIsTrackingLocation(false);
                alert('Unable to retrieve your location');
            }
        );
    }, [setLocation]);

    // Initial load
    useEffect(() => {
        if (!location) startLocationTracking();
    }, []);

    // 2. Fetch Stations
    const fetchFilteredStations = useCallback(async () => {
        if (!location) return;
        setIsLoading(true);

        try {
            // Using existing RPC or creating a local filter if RPC is missing/different
            // The user snippet uses `get_stations_for_app`
            const { data: baseStations, error } = await supabase.rpc('get_stations_for_app', {
                search_term: debouncedSearchQuery,
                target_latitude: location.latitude,
                target_longitude: location.longitude,
                search_radius_meters: 50000,
            });

            if (error) throw error;

            if (baseStations) {
                // Determine missing fields and fill defaults or fetch more data if needed
                // Assuming baseStations returns enough or we map it
                const stationsWithDistance = baseStations.map((s: any) => ({
                    ...s,
                    status: s.status || 'Available', // Default
                    price: s.latest_pms_price || 0, // Fallback
                    average_rating: s.rating || 0, // Fallback logic
                    products: s.fuel_types || [],
                    distance_meters: s.distance_meters || 0
                }));
                setAllStations(stationsWithDistance);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Fallback to fetching table directly if RPC fails or doesn't exist in Web setup
            // Not implementing fallback here to stick to plan, assuming RPC works.
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, location]);

    useEffect(() => {
        if (location) fetchFilteredStations();
    }, [location, debouncedSearchQuery, fetchFilteredStations]);

    // 3. Fetch Ads (Similar logic to Favorites)
    useEffect(() => {
        const fetchAdverts = async () => {
            const { data: settings } = await supabase.from('app_settings').select('value').eq('key', 'global_ads_enabled').single();
            if (settings?.value === false) return;

            const { data } = await supabase.from('adverts')
                .select('*')
                .eq('is_active', true)
                .in('type', ['card', 'video', 'banner'])
                .limit(2);

            if (data) setAdverts(data as Advert[]);
        };
        fetchAdverts();
    }, []);

    // 4. Filtering & Sorting Logic
    const processedStations = useMemo(() => {
        let items = [...allStations];

        // Apply filters
        items = items.filter(station => {
            // Price Range
            if (filters.priceRange.min && station.latest_pms_price && station.latest_pms_price < parseFloat(filters.priceRange.min)) return false;
            if (filters.priceRange.max && station.latest_pms_price && station.latest_pms_price > parseFloat(filters.priceRange.max)) return false;

            // Rating
            if (filters.rating > 0 && (station.average_rating || 0) < filters.rating) return false;

            // Fuel Type (simple check on products string array)
            if (filters.fuelType && !station.products?.includes(filters.fuelType)) return false;

            return true;
        });

        // Sorting
        if (filters.sortBy === 'price') {
            items.sort((a, b) => (a.latest_pms_price || 0) - (b.latest_pms_price || 0));
        } else {
            // Default distance
            items.sort((a, b) => a.distance_meters - b.distance_meters);
        }

        return items;
    }, [allStations, filters]);

    // 5. Sectioning by Distance
    const sectionedData = useMemo(() => {
        if (processedStations.length === 0) return [];

        const sections: { title: string, data: (SearchStation | Advert)[] }[] = [];
        const groups: Record<string, SearchStation[]> = {};
        const GROUP_KM = 5;

        processedStations.forEach(station => {
            const distKm = station.distance_meters / 1000;
            const groupKey = Math.ceil(distKm / GROUP_KM) * GROUP_KM;
            const finalKey = groupKey === 0 ? GROUP_KM : groupKey;
            const title = `Within ${finalKey}km`;

            if (!groups[title]) groups[title] = [];
            groups[title].push(station);
        });

        Object.keys(groups).forEach(title => {
            sections.push({ title, data: groups[title] });
        });

        // Inject Ads into first section
        if (adverts.length > 0 && sections.length > 0) {
            const firstData = sections[0].data;
            if (adverts[0]) {
                if (firstData.length >= 2) firstData.splice(2, 0, adverts[0]);
                else firstData.push(adverts[0]);
            }
            // Inject second ad if possible
            if (adverts[1]) {
                if (sections.length > 1) sections[1].data.unshift(adverts[1]);
                else if (firstData.length > 6) firstData.splice(6, 0, adverts[1]);
            }
        }

        return sections;
    }, [processedStations, adverts]);

    // Price Summary Calculation
    const priceSummary = useMemo(() => {
        const stationsWithPrice = processedStations.filter(s => s.latest_pms_price);
        if (stationsWithPrice.length < 2) return null;

        const lowest = stationsWithPrice.reduce((p, c) => (p.latest_pms_price! < c.latest_pms_price! ? p : c));
        const highest = stationsWithPrice.reduce((p, c) => (p.latest_pms_price! > c.latest_pms_price! ? p : c));

        if (lowest.id === highest.id) return null;

        return {
            lowest,
            highest,
            savings: (highest.latest_pms_price! - lowest.latest_pms_price!)
        };
    }, [processedStations]);

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-20">
            {/* Brands Modal */}
            <AnimatePresence>
                {showBrandsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowBrandsModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="bg-white dark:bg-[#1E1E1E] w-full max-w-md rounded-2xl p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4 text-[#1A1A1A] dark:text-white">Popular Brands</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {POPULAR_BRANDS.map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => {
                                            setSearchQuery(brand);
                                            setShowBrandsModal(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-[#3B0764]/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center mb-2">
                                            <FyndFuelLogo size={20} color="white" />
                                        </div>
                                        <span className="text-xs font-medium text-center text-[#1A1A1A] dark:text-white">{brand}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-b-3xl shadow-sm px-4 pt-4 pb-6 sticky top-0 z-40">
                <div className="flex justify-between items-center mb-4 max-w-3xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/dashboard')} className="lg:hidden">
                            <ArrowLeft className="w-6 h-6 text-[#1A1A1A] dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Find Gas ⛽</h1>
                            {location && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-medium text-green-500">Live Location</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl px-4 border border-transparent focus-within:border-[#3B0764] transition-colors">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search stations or brands..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none py-3.5 px-3 focus:outline-none text-[#1A1A1A] dark:text-white"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="p-1">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <MapIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-medium text-[#1A1A1A] dark:text-white whitespace-nowrap">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </button>
                        <button
                            onClick={() => setShowBrandsModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-medium text-[#1A1A1A] dark:text-white whitespace-nowrap"
                        >
                            <FyndFuelLogo size={16} className="text-[#1A1A1A] dark:text-white" />
                            Brands
                        </button>
                        <button
                            onClick={startLocationTracking}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium whitespace-nowrap"
                        >
                            <Navigation className="w-3 h-3" />
                            {location?.name || 'Set Location'}
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Stats Bar */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm flex divide-x divide-gray-100 dark:divide-white/5">
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-xl font-bold text-[#3B0764] dark:text-white">{processedStations.length}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Stations</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">
                            {processedStations[0] ? (processedStations[0].distance_meters / 1000).toFixed(1) : '-'} <span className="text-sm">km</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Nearest</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">50 <span className="text-sm">km</span></span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Radius</span>
                    </div>
                </div>

                {/* Price Summary */}
                {priceSummary && (
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-[#3B0764] uppercase tracking-wider mb-1">⬇ Lowest Price</div>
                            <div className="text-lg font-bold text-[#1A1A1A] dark:text-white">₦{priceSummary.lowest.latest_pms_price}</div>
                            <div className="text-xs text-gray-400 truncate w-24">{priceSummary.lowest.name}</div>
                        </div>
                        <div className="px-4 flex flex-col items-center">
                            <div className="text-[10px] text-gray-400 mb-1">SAVE</div>
                            <div className="text-lg font-extrabold text-green-500">₦{priceSummary.savings}</div>
                        </div>
                        <div className="flex-1 text-right">
                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">⬆ Highest Price</div>
                            <div className="text-lg font-bold text-[#1A1A1A] dark:text-white">₦{priceSummary.highest.latest_pms_price}</div>
                            <div className="text-xs text-gray-400">{(priceSummary.highest.distance_meters / 1000).toFixed(1)}km away</div>
                        </div>
                    </div>
                )}

                {/* Loading or List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#3B0764] mb-4" />
                        <p className="text-gray-500">Finding nearby stations...</p>
                    </div>
                ) : sectionedData.length === 0 ? (
                    <div className="text-center py-12">
                        <MapIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">No stations found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search area.</p>
                        <button
                            onClick={() => fetchFilteredStations()}
                            className="mt-4 px-6 py-2 bg-[#3B0764] text-white rounded-xl font-medium"
                        >
                            Refresh Search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sectionedData.map((section) => (
                            <div key={section.title}>
                                <div className="flex justify-between items-center mb-3 px-2">
                                    <h3 className="font-bold text-[#1A1A1A] dark:text-white">{section.title}</h3>
                                    <span className="text-xs font-semibold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-[#3B0764] dark:text-purple-300">
                                        {section.data.filter((i: any) => !i.type).length} stations
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {section.data.map((item: any, idx) => (
                                        item.type ? (
                                            <AdvertCard key={`ad-${item.id}-${idx}`} advert={item} />
                                        ) : (
                                            <StationCard
                                                key={item.id}
                                                station={item}
                                                onNavigate={() => router.push(`/station/${item.id}`)}
                                            // Add onTrack if we want bookmarking here. We need `isTracked` state.
                                            // For this MVP, I'm omitting tracking in search to save state complexity, but can add if needed.
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
