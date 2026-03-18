'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import LoadingAnimation from '@/components/LoadingAnimation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecurityPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setIsLoading(false);
        };
        checkAuth();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingAnimation />;

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#3B0764]/10 dark:border-white/10 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white text-center mr-9">Security</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 pt-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[32px] shadow-sm border border-[#3B0764]/5 dark:border-white/5"
                >
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center text-[#3B0764] dark:text-purple-400 mb-4">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-[#1A1A1A] dark:text-white mb-2">Change Password</h2>
                        <p className="text-sm text-[#1A1A1A]/40 dark:text-white/40 max-w-xs">
                            Secure your account with a strong password of at least 6 characters.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/30 ml-4">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[#F5F5F0] dark:bg-white/5 border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#3B0764] transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 dark:text-white/20 hover:text-[#3B0764] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 dark:text-white/30 ml-4">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#F5F5F0] dark:bg-white/5 border-0 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#3B0764] transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold ${
                                        message.type === 'success' 
                                        ? 'bg-green-50 dark:bg-green-900/10 text-green-600 border border-green-100 dark:border-green-900/30' 
                                        : 'bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-100 dark:border-red-900/30'
                                    }`}
                                >
                                    {message.type === 'success' && <ShieldCheck className="w-5 h-5 shrink-0" />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#3B0764] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#3B0764]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {isSubmitting ? 'UPDATING...' : 'SAVE CHANGES'}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
