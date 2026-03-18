
'use client';

import { Home, Heart, LogOut, User, Bell } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useNotifications } from '@/hooks/useNotifications';

interface SidebarProps {
    userEmail?: string;
    onSignOut: () => void;
}

export default function Sidebar({ userEmail, onSignOut }: SidebarProps) {
    const { unreadCount } = useNotifications();
    return (
        <aside className="w-64 bg-white dark:bg-black border-r border-[var(--border)] hidden md:flex flex-col h-full z-20 shadow-sm">
            <div className="p-6 flex items-center gap-3 border-b border-[var(--border)] shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[#3B0764] flex items-center justify-center text-white shadow-sm">
                    <Logo className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-xl tracking-tight block leading-none">Fynd Fuel</span>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Precision fuel discovery</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <Link href="/dashboard" className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--primary)] text-white font-medium transition-colors">
                    <Home size={20} /> Dashboard
                </Link>
                <Link href="/dashboard/favorites" className="flex items-center gap-3 w-full p-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors font-medium opacity-70 hover:opacity-100">
                    <Heart size={20} /> Favorites
                </Link>
                <Link href="/dashboard/profile" className="flex items-center gap-3 w-full p-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors font-medium opacity-70 hover:opacity-100">
                    <User size={20} /> Profile
                </Link>
                <Link href="/dashboard/notifications" className="flex items-center gap-3 w-full p-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors font-medium opacity-70 hover:opacity-100 relative">
                    <Bell size={20} /> Notifications
                    {unreadCount > 0 && (
                        <span className="absolute left-7 top-3 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black" />
                    )}
                </Link>
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
