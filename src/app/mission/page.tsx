'use client';

import Link from 'next/link';
import { Fuel, ArrowLeft, Target, Heart, Compass, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function MissionPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#3B0764] selection:text-white">

            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.04] mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#3B0764]/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#3B0764] transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[1.5px] border-[#3B0764] rounded-full flex items-center justify-center text-[#3B0764]">
                            <Fuel size={18} />
                        </div>
                        <span className="font-serif font-bold text-2xl tracking-tighter text-[#1A1A1A]">Fynd Fuel</span>
                    </div>
                    <Link
                        href="/login"
                        className="px-6 py-2 bg-[#1A1A1A] text-white rounded-full font-bold hover:bg-[#3B0764] transition-colors"
                    >
                        Get App
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6">
                <div className="max-w-5xl mx-auto">

                    {/* Hero Section */}
                    <FadeIn>
                        <div className="text-center mb-24">
                            <div className="inline-block border border-[#3B0764]/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-8 text-[#3B0764]">
                                Our Mission
                            </div>
                            <h1 className="font-serif text-6xl md:text-8xl text-[#1A1A1A] leading-[0.9] tracking-tight mb-8">
                                Clarity in <br />
                                <span className="text-[#3B0764] italic">every drop.</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-[#1A1A1A]/60 font-serif max-w-2xl mx-auto leading-relaxed">
                                We're building the most trusted fuel discovery platform in Nigeria—one station, one price, one community at a time.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Values Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-24">

                        <FadeIn delay={0.1}>
                            <div className="bg-white border border-[#1A1A1A]/10 rounded-[2rem] p-10 h-full hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-full border border-[#3B0764]/20 flex items-center justify-center text-[#3B0764] mb-8">
                                    <Target size={24} />
                                </div>
                                <h3 className="font-serif text-3xl mb-4 text-[#1A1A1A]">Precision First</h3>
                                <p className="text-[#1A1A1A]/60 text-lg leading-relaxed">
                                    Every station on our map is verified. Every price is real. We don't guess—we know. Because when you're running low, you need certainty, not approximations.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <div className="bg-[#3B0764] text-white rounded-[2rem] p-10 h-full hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mb-8">
                                    <Heart size={24} />
                                </div>
                                <h3 className="font-serif text-3xl mb-4">Human-Centered</h3>
                                <p className="text-white/70 text-lg leading-relaxed">
                                    Tech should serve people, not the other way around. Our design respects your time, your attention, and your wallet. Simple. Clear. Honest.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.3}>
                            <div className="bg-[#1A1A1A] text-white rounded-[2rem] p-10 h-full hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mb-8">
                                    <Compass size={24} />
                                </div>
                                <h3 className="font-serif text-3xl mb-4">Always Guiding</h3>
                                <p className="text-white/60 text-lg leading-relaxed">
                                    Whether you're on a familiar route or exploring new roads, we're your co-pilot. Real-time updates mean you're never driving blind.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.4}>
                            <div className="bg-white border border-[#1A1A1A]/10 rounded-[2rem] p-10 h-full hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-full border border-[#3B0764]/20 flex items-center justify-center text-[#3B0764] mb-8">
                                    <Users size={24} />
                                </div>
                                <h3 className="font-serif text-3xl mb-4 text-[#1A1A1A]">Community Powered</h3>
                                <p className="text-[#1A1A1A]/60 text-lg leading-relaxed">
                                    Our data comes from real drivers sharing real experiences. Together, we build a network of trust that benefits everyone on the road.
                                </p>
                            </div>
                        </FadeIn>

                    </div>

                    {/* CTA Section */}
                    <FadeIn delay={0.5}>
                        <div className="text-center border-t border-[#3B0764]/10 pt-16">
                            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-6">
                                Ready to join the movement?
                            </h2>
                            <p className="text-[#1A1A1A]/60 text-lg mb-10 max-w-xl mx-auto">
                                Download Fynd Fuel and experience clarity on every journey.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-10 py-5 bg-[#3B0764] text-white rounded-full font-bold text-lg hover:bg-[#1A1A1A] transition-all active:scale-95"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </FadeIn>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-10 border-t border-[#3B0764]/5 text-center">
                <p className="text-[#1A1A1A]/40 text-sm font-serif">© 2024 Fynd Fuel. Crafted with patience.</p>
            </footer>

        </div>
    );
}
