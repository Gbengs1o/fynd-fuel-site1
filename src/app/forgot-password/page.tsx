'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fuel, Mail, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [stage, setStage] = useState<'enterEmail' | 'enterCode'>('enterEmail');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sendRecoveryCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
            if (error) throw error;
            setStage('enterCode');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const verifyRecoveryCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Please enter the 6-digit code.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: token.trim(),
                type: 'recovery'
            });
            if (error) throw error;
            router.push('/reset-password');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'The code is invalid or has expired.');
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

                {/* Back Button */}
                <Link
                    href="/login"
                    className="absolute top-6 left-6 flex items-center gap-2 text-[#1A1A1A]/60 hover:text-[#3B0764] transition-colors group"
                >
                    <div className="w-10 h-10 rounded-full border border-[#1A1A1A]/10 flex items-center justify-center group-hover:border-[#3B0764]/30 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">Back</span>
                </Link>

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
                        {stage === 'enterEmail' ? (
                            <motion.div
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                {/* Header */}
                                <div className="text-center mb-10">
                                    <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-3 text-[#1A1A1A]">
                                        Reset Password
                                    </h2>
                                    <p className="text-[#1A1A1A]/60 text-lg">
                                        Enter your email to receive a 6-digit recovery code.
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={sendRecoveryCode} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Email address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your.email@example.com"
                                                required
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
                                            'Send Code'
                                        )}
                                    </motion.button>
                                </form>

                                <div className="text-center mt-8">
                                    <Link href="/login" className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors">
                                        Back to{' '}
                                        <span className="text-[#3B0764] font-bold hover:underline">Sign In</span>
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="code"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Header */}
                                <div className="text-center mb-10">
                                    <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-3 text-[#1A1A1A]">
                                        Check Your Email
                                    </h2>
                                    <p className="text-[#1A1A1A]/60 text-lg">
                                        A 6-digit code was sent to <span className="font-semibold text-[#3B0764]">{email}</span>. Enter it below to continue.
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={verifyRecoveryCode} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Recovery Code</label>
                                        <div className="relative group">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                            <input
                                                type="text"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                placeholder="123456"
                                                required
                                                maxLength={6}
                                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all text-center text-2xl tracking-widest font-mono"
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
                                            'Verify Code'
                                        )}
                                    </motion.button>
                                </form>

                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => { setStage('enterEmail'); setError(''); }}
                                        className="text-[#3B0764] font-medium hover:underline"
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
