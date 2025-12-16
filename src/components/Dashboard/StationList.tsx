
'use client';

import { MapPin, Navigation } from 'lucide-react';

interface Station {
    id: number;
    name: string;
    address: string;
    price: number;
    status: 'Available' | 'Busy' | 'Unavailable';
    fuelTypes: string[];
}

interface StationListProps {
    stations: Station[];
    activeStationId: number | null;
    onStationSelect: (id: number) => void;
    className?: string; // Allow passing visibility classes
}

export default function StationList({ stations, activeStationId, onStationSelect, className = '' }: StationListProps) {
    return (
        <div className={`flex-col gap-3 p-4 pb-24 md:pb-4 overflow-y-auto ${className}`}>
            {stations.map(station => (
                <div
                    key={station.id}
                    onClick={() => onStationSelect(station.id)}
                    className={`
            p-4 rounded-xl border transition-all cursor-pointer card bg-[var(--card)]
            ${activeStationId === station.id
                            ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] shadow-md'
                            : 'border-[var(--border)] hover:border-[var(--foreground)]/20'}
          `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-base">{station.name}</h3>
                            <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} className="shrink-0" /> <span className="truncate">{station.address}</span>
                            </p>
                        </div>
                        <span className={`
              text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap
              ${station.status === 'Available' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                station.status === 'Busy' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}
            `}>
                            {station.status}
                        </span>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                        <div>
                            <p className="text-xl font-bold tracking-tight">₦{station.price}</p>
                            <p className="text-[10px] opacity-50 font-medium">per liter</p>
                        </div>
                        <button className="p-2 rounded-full bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                            <Navigation size={18} />
                        </button>
                    </div>
                </div>
            ))}

            {stations.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    <p className="text-sm font-medium">No stations found.</p>
                </div>
            )}
        </div>
    );
}
