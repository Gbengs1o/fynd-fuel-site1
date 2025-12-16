
'use client';

import { Home, Heart, Settings, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';

interface SidebarProps {
    userEmail?: string;
    onSignOut: () => void;
}

export default function Sidebar({ userEmail, onSignOut }: SidebarProps) {
    return (
        <aside className="w-64 bg-white dark:bg-black border-r border-[var(--border)] hidden md:flex flex-col h-full z-20 shadow-sm">
            <div className="p-6 flex items-center gap-3 border-b border-[var(--border)] shrink-0">
                <Logo className="w-8 h-8 text-[var(--primary)]" />
                <span className="font-bold text-xl tracking-tight">Fynd Fuel</span>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--primary)] text-white font-medium transition-colors">
                    <Home size={20} /> Dashboard
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors font-medium opacity-70 hover:opacity-100">
                    <Heart size={20} /> Favorites
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors font-medium opacity-70 hover:opacity-100">
                    <Settings size={20} /> Settings
                </button>
            </nav>

            <div className="p-4 border-t border-[var(--border)] shrink-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                        {userEmail?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Signed in as</p>
                        <p className="text-sm font-medium truncate">{userEmail}</p>
                    </div>
                </div>
                <button
                    onClick={onSignOut}
                    className="flex items-center gap-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium text-sm"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
