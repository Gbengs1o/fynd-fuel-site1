'use client';

import React from 'react';
import Link from 'next/link';
import { Fuel, ArrowLeft, Smartphone, MapPin, TrendingDown, Star, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: MapPin,
        title: 'Find Nearby Stations',
        description: 'Discover fuel stations around you with real-time availability and accurate directions.'
    },
    {
        icon: TrendingDown,
        title: 'Compare Prices',
        description: 'See current fuel prices across stations and never overpay for fuel again.'
    },
    {
        icon: Star,
        title: 'Community Reviews',
        description: 'Read honest reviews from other drivers before you visit any station.'
    },
    {
        icon: Shield,
        title: 'Verified Data',
        description: 'All prices are verified by our community of contributors for accuracy.'
    }
];

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#3B0764] selection:text-white">

            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.04] mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#3B0764]/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 border-[1.5px] border-[#3B0764]/30 rounded-full flex items-center justify-center text-[#3B0764] group-hover:border-[#3B0764] transition-colors">
                            <Fuel size={18} />
                        </div>
                        <span className="font-serif font-bold text-2xl tracking-tighter">Fynd Fuel</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/" className="hidden sm:flex items-center gap-2 text-[#1A1A1A]/60 hover:text-[#3B0764] transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <Link href="/login" className="px-6 py-2 bg-[#3B0764] text-white rounded-full font-bold hover:bg-[#4C0D8C] transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-block border border-[#3B0764]/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase text-[#3B0764] mb-6">
                                <Smartphone className="w-3 h-3 inline mr-2" />
                                Available Now
                            </div>

                            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#1A1A1A] mb-6">
                                Fuel Discovery,<br />
                                <span className="text-[#3B0764]">Reimagined.</span>
                            </h1>

                            <p className="text-xl text-[#1A1A1A]/60 leading-relaxed mb-10 max-w-lg">
                                Download Fynd Fuel and join thousands of smart drivers who save time and money with real-time fuel prices across Nigeria.
                            </p>

                            {/* Download Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); alert('Coming to the apple store soon'); }}
                                    className="group flex items-center gap-4 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl hover:bg-[#3B0764] transition-all hover:scale-105"
                                >
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                    </svg>
                                    <div className="text-left">
                                        <p className="text-xs text-white/60">Download on the</p>
                                        <p className="text-lg font-bold">App Store</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>

                                <a
                                    href="https://play.google.com/store/apps/details?id=com.smahilehub.fyndfuel&pli=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl hover:bg-[#3B0764] transition-all hover:scale-105"
                                >
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                                    </svg>
                                    <div className="text-left">
                                        <p className="text-xs text-white/60">Get it on</p>
                                        <p className="text-lg font-bold">Google Play</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-8 mt-12 pt-8 border-t border-[#1A1A1A]/10">
                                <div>
                                    <p className="text-3xl font-bold font-serif text-[#3B0764]">2,500+</p>
                                    <p className="text-sm text-[#1A1A1A]/50">Stations</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold font-serif text-[#3B0764]">36</p>
                                    <p className="text-sm text-[#1A1A1A]/50">States</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold font-serif text-[#3B0764]">Free</p>
                                    <p className="text-sm text-[#1A1A1A]/50">Forever</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Phone Mockup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative z-10">
                                <img
                                    src="/app-mockup-1.png"
                                    alt="Fynd Fuel App"
                                    className="w-full max-w-md mx-auto drop-shadow-2xl"
                                />
                            </div>
                            {/* Background Decoration */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3B0764]/10 rounded-full blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-[#1A1A1A]/60 max-w-2xl mx-auto">
                            Powerful features designed to make finding fuel effortless
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#F5F5F0] rounded-3xl p-8 hover:shadow-xl transition-shadow group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#3B0764]/10 flex items-center justify-center text-[#3B0764] mb-6 group-hover:bg-[#3B0764] group-hover:text-white transition-colors">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-xl text-[#1A1A1A] mb-3">{feature.title}</h3>
                                <p className="text-[#1A1A1A]/60 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Screenshots Section */}
            <section className="py-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
                            Beautiful & Intuitive
                        </h2>
                        <p className="text-xl text-[#1A1A1A]/60">
                            Designed with care for the best user experience
                        </p>
                    </motion.div>

                    <div className="flex justify-center gap-8 flex-wrap">
                        <motion.img
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            src="/app-mockup-2.png"
                            alt="Fynd Fuel Price List"
                            className="w-72 rounded-3xl shadow-2xl"
                        />
                        <motion.img
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            src="/app-mockup-3.png"
                            alt="Fynd Fuel App Screens"
                            className="w-96 rounded-3xl shadow-2xl hidden md:block"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-[#3B0764] text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <circle cx="5" cy="5" r="1" fill="white" />
                        </pattern>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-serif text-4xl md:text-6xl mb-6">
                            Ready to Save on Fuel?
                        </h2>
                        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                            Download Fynd Fuel today and never overpay for fuel again. It's free, fast, and trusted by drivers across Nigeria.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert('Coming to the apple store soon'); }}
                                className="group flex items-center justify-center gap-4 bg-white text-[#3B0764] px-8 py-4 rounded-2xl hover:bg-[#F5F5F0] transition-all hover:scale-105 font-bold"
                            >
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                App Store
                            </a>

                            <a
                                href="https://play.google.com/store/apps/details?id=com.smahilehub.fyndfuel&pli=1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-4 bg-white text-[#3B0764] px-8 py-4 rounded-2xl hover:bg-[#F5F5F0] transition-all hover:scale-105 font-bold"
                            >
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                                </svg>
                                Google Play
                            </a>
                        </div>

                        <div className="flex items-center justify-center gap-6 mt-10 text-white/60 text-sm">
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Free Download</span>
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No delay</span>
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Works Offline</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-6 border-t border-[#3B0764]/5 text-center">
                <p className="text-[#1A1A1A]/40 text-sm font-serif">© 2025 Fynd Fuel. Crafted with patience.</p>
            </footer>
        </div>
    );
}
