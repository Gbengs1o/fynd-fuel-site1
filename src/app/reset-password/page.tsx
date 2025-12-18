'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fuel, Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setError('Please enter and confirm your new password.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#3B0764] selection:text-white">

            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.04] mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Centered Content */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-14 h-14 border-[1.5px] border-[#3B0764]/30 rounded-full flex items-center justify-center text-[#3B0764] group-hover:border-[#3B0764] transition-colors">
                                <Fuel className="w-6 h-6" />
                            </div>
                        </Link>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="font-serif text-4xl font-bold mb-3 text-[#1A1A1A]">
                                    Password Updated
                                </h2>
                                <p className="text-[#1A1A1A]/60 text-lg mb-8">
                                    Your password has been successfully updated. Redirecting to sign in...
                                </p>
                                <div className="flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#3B0764]" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Header */}
                                <div className="text-center mb-10">
                                    <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-3 text-[#1A1A1A]">
                                        Set New Password
                                    </h2>
                                    <p className="text-[#1A1A1A]/60 text-lg">
                                        You're almost done. Enter your new password below.
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                required
                                                minLength={6}
                                                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#3B0764] transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Confirm New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                required
                                                minLength={6}
                                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="p-4 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full h-14 bg-[#3B0764] text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-[#4C0D8C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#3B0764]/20"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Update Password'
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
