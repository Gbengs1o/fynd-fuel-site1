'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fuel, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/dashboard');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setError('Check your email to confirm your account!');
                setIsLogin(true);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/80 p-12 flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Fuel className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-2xl">Fynd Fuel</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                        Find fuel stations instantly.
                    </h1>
                    <p className="text-xl text-white/80 leading-relaxed">
                        Compare prices, check availability, and get directions to the nearest fuel stations in real-time.
                    </p>
                </div>

                <p className="text-sm text-white/60">
                    © 2024 Fynd Fuel. All rights reserved.
                </p>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Fuel className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl">Fynd Fuel</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-muted-foreground">
                            {isLogin ? 'Sign in to continue to Fynd Fuel' : 'Get started with Fynd Fuel today'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="input pl-11"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    minLength={6}
                                    className="input pl-11"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={`p-3 rounded-lg text-sm ${error.includes('Check your email') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-12 text-base"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <span className="text-primary font-medium">
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </span>
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border">
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
