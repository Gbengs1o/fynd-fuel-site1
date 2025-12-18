'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fuel, Mail, Lock, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUpPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !phone || !password) {
            setError('Please fill out all fields.');
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
            const { error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        phone: phone.trim()
                    }
                },
            });

            if (error) throw error;

            setError('Success! Please check your email to verify your account.');
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

            {/* Left Panel - Premium Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/heroimage2.png"
                        alt="Fuel Station"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#3B0764]/70 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3B0764] via-transparent to-transparent" />
                </div>

                <div className="relative z-10 p-12 flex flex-col justify-between text-white w-full">
                    <div>
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-12 h-12 border-[1.5px] border-white/50 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
                                <Fuel className="w-5 h-5" />
                            </div>
                            <span className="font-serif font-bold text-2xl tracking-tighter">Fynd Fuel</span>
                        </Link>
                    </div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="inline-block border border-white/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md mb-6">
                                Join The Community
                            </div>
                            <h1 className="font-serif text-5xl xl:text-6xl leading-[1.1] tracking-tight mb-6">
                                Start Your<br />Journey Today.
                            </h1>
                            <p className="text-xl text-white/70 leading-relaxed max-w-md">
                                Join thousands of drivers who save time and money with real-time fuel prices and station availability.
                            </p>
                        </motion.div>
                    </div>

                    <p className="text-sm text-white/40 font-serif">
                        © 2025 Fynd Fuel. Crafted with patience.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">

                {/* Back Button */}
                <Link
                    href="/"
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
                    className="w-full max-w-md py-16"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 border-[1.5px] border-[#3B0764]/30 rounded-full flex items-center justify-center text-[#3B0764]">
                            <Fuel className="w-5 h-5" />
                        </div>
                        <span className="font-serif font-bold text-2xl tracking-tighter">Fynd Fuel</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-3 text-[#1A1A1A]">
                            Sign up
                        </h2>
                        <p className="text-[#1A1A1A]/60 text-lg">
                            Create an account to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Email address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+234 xxx xxx xxxx"
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
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
                            <p className="text-xs text-[#1A1A1A]/50 mt-1">Password must be at least 6 characters long.</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-2">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30 group-focus-within:text-[#3B0764] transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    minLength={6}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#3B0764] focus:ring-4 focus:ring-[#3B0764]/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Error/Success Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-4 rounded-2xl text-sm font-medium ${error.includes('Success')
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'}`}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
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
                                <>
                                    Sign Up
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Toggle to Login */}
                    <div className="text-center mt-8">
                        <Link href="/login" className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors">
                            Already have an account?{' '}
                            <span className="text-[#3B0764] font-bold hover:underline">Sign in</span>
                        </Link>
                    </div>

                    {/* Terms */}
                    <p className="text-xs text-[#1A1A1A]/40 text-center mt-6">
                        By signing up, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-[#3B0764]">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="underline hover:text-[#3B0764]">Privacy Policy</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
