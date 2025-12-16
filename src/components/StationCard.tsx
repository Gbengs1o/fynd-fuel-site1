import React from 'react';
import { MapPin, Bookmark, Eye } from 'lucide-react';
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
    updated_at?: string; // Added for Last Updated feature
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
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${isActive
                ? 'bg-[#3B0764]/5 dark:bg-[#3B0764]/20 border-[#3B0764]'
                : 'bg-white dark:bg-white/5 border-transparent hover:border-[#3B0764]/20'
                } ${className}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-[#1A1A1A] dark:text-white">{station.name}</h3>
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
                    <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40">per liter ({station.fuel_type || 'PMS'})</p>
                </div>
                <div className="flex gap-2">
                    {onTrack && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onTrack(station.id); }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isTracked
                                ? 'bg-[#3B0764] text-white'
                                : 'bg-[#F5F5F0] dark:bg-white/5 text-[#1A1A1A]/60 dark:text-white/60 hover:bg-[#3B0764]/10'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" fill={isTracked ? 'currentColor' : 'none'} />
                        </button>
                    )}
                    {onNavigate && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                            className="w-9 h-9 rounded-xl bg-[#3B0764] text-white flex items-center justify-center hover:bg-[#4C0D8C] transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default StationCard;
