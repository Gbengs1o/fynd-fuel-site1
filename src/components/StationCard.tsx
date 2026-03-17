import React from 'react';
import { MapPin, Bookmark, Eye, Star, ShieldCheck, CheckCircle, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Station {
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
    updated_at?: string;
    is_boosted?: boolean;
    is_out_of_stock?: boolean;
    reporter_name?: string;
    price_type?: string;
    rating?: number;
}

interface StationCardProps {
    station: Station;
    isActive?: boolean;
    isTracked?: boolean;
    onTrack?: (id: number) => void;
    onClick?: () => void;
    onNavigate?: () => void;
    className?: string;
}

const StationCard: React.FC<StationCardProps> = ({
    station,
    isActive = false,
    isTracked = false,
    onTrack,
    onClick,
    onNavigate,
    className = ''
}) => {
    const isBoosted = station.is_boosted;
    const isOutOfStock = station.is_out_of_stock;

    return (
        <motion.div
            layout
            onClick={onClick}
            className={`p-5 rounded-3xl cursor-pointer transition-all border relative overflow-hidden ${isActive
                ? 'bg-[#3B0764]/5 dark:bg-[#3B0764]/20 border-[#3B0764]'
                : `bg-white dark:bg-white/5 border-transparent hover:border-[#3B0764]/10 shadow-sm hover:shadow-md ${isBoosted ? 'ring-2 ring-[#FFD700]/30 border-[#FFD700]/30' : ''}`
                } ${className}`}
        >
            {isBoosted && (
                <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10">
                    <Zap className="w-3 h-3 fill-current" />
                    BOOSTED
                </div>
            )}

            <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${isBoosted ? 'bg-[#FFD700]/20' : 'bg-[#F5F5F0] dark:bg-white/5'
                    }`}>
                    {isBoosted ? (
                        <Star className="w-7 h-7 text-[#FFD700]" fill="currentColor" />
                    ) : (
                        <div className="text-2xl font-black text-[#3B0764]/20 dark:text-white/20">
                            {station.name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0 pr-12">
                            <h3 className="text-lg font-black truncate text-[#1A1A1A] dark:text-white tracking-tight">{station.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-[#1A1A1A]/40 dark:text-white/40 uppercase font-black tracking-widest truncate">
                                    {station.brand || (isBoosted ? 'Gold Partner' : 'Fuel Station')}
                                </p>
                                {isOutOfStock && (
                                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Out of Stock</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-white/5 text-[11px] font-bold text-[#1A1A1A]/60 dark:text-white/60 border border-black/5 dark:border-white/5">
                            <MapPin className="w-3 h-3 text-[#3B0764]" />
                            {station.distance || '0.0 km'}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-600/10">
                            <Star className="w-3 h-3" fill="currentColor" />
                            {station.rating || (isBoosted ? '5.0' : '0.0')}
                        </div>
                    </div>

                    <div className="flex items-end justify-between mt-5">
                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-[#3B0764] underline decoration-[#3B0764]/30">₦</span>
                                <span className="text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tighter">
                                    {station.price ? Math.floor(station.price) : '---'}
                                </span>
                            </div>
                            <p className="text-[9px] text-[#1A1A1A]/30 dark:text-white/30 font-bold uppercase tracking-widest">per liter ({station.fuel_type || 'PMS'})</p>
                        </div>

                        <div className="flex gap-2">
                            {onTrack && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTrack(station.id); }}
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isTracked
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                        : 'bg-[#F5F5F0] dark:bg-white/5 text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/10 border border-black/5 dark:border-white/5'
                                        }`}
                                >
                                    <Bookmark className="w-5 h-5" fill={isTracked ? 'currentColor' : 'none'} />
                                </button>
                            )}
                            {onNavigate && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                                    className="w-11 h-11 rounded-2xl bg-[#3B0764] text-white flex items-center justify-center hover:bg-[#4C0D8C] transition-all active:scale-95 shadow-lg shadow-[#3B0764]/20"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {station.price_type === 'official' ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            ) : station.price_type === 'station' ? (
                                <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                                <User className="w-3.5 h-3.5 text-[#3B0764]/40" />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-wider ${station.price_type === 'official' ? 'text-green-500' :
                                station.price_type === 'station' ? 'text-amber-500' : 'text-[#1A1A1A]/40'
                                }`}>
                                {station.price_type === 'official' ? 'Official' : station.price_type === 'station' ? 'Station' : station.reporter_name || 'Verified User'}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#1A1A1A]/30 font-medium italic">
                            {station.updated_at ? new Date(station.updated_at).toLocaleDateString() : 'Updated recently'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StationCard;
