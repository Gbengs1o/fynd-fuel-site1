
'use client';

import { Heart, Settings, Map, List } from 'lucide-react';

interface MobileNavProps {
    viewMode: 'list' | 'map';
    setViewMode: (mode: 'list' | 'map') => void;
}

export default function MobileNav({ viewMode, setViewMode }: MobileNavProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-[var(--border)] z-50 flex justify-around items-center h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
            <button
                onClick={() => setViewMode('list')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewMode === 'list' ? 'text-[var(--primary)]' : 'text-[var(--foreground)] opacity-50'}`}
            >
                <List size={22} />
                <span className="text-[10px] font-bold">Stations</span>
            </button>

            <button
                onClick={() => setViewMode('map')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewMode === 'map' ? 'text-[var(--primary)]' : 'text-[var(--foreground)] opacity-50'}`}
            >
                <Map size={22} />
                <span className="text-[10px] font-bold">Map</span>
            </button>

            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[var(--foreground)] opacity-50">
                <Heart size={22} />
                <span className="text-[10px] font-bold">Saved</span>
            </button>

            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[var(--foreground)] opacity-50">
                <Settings size={22} />
                <span className="text-[10px] font-bold">Settings</span>
            </button>
        </nav>
    );
}
