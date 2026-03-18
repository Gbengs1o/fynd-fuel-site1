'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#3B0764]/10 dark:border-white/10 px-4 py-4">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white text-center mr-9">Privacy Policy</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 pt-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1A1A1A] p-8 md:p-12 rounded-[40px] shadow-sm border border-[#3B0764]/5 dark:border-white/5"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center text-[#3B0764] dark:text-purple-400 mb-8">
                        <Shield className="w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-black text-[#1A1A1A] dark:text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm font-bold text-[#1A1A1A]/30 dark:text-white/30 italic mb-10">Last updated: October 26, 2023</p>

                    <div className="space-y-10 text-[#1A1A1A] dark:text-white/80">
                        <section className="space-y-4">
                            <p className="leading-relaxed">
                                Welcome to FYND FUEL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (the &quot;App&quot;).
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">1. Information We Collect</h2>
                            <p className="leading-relaxed">
                                We may collect information about you in a variety of ways. The information we may collect via the App depends on the content and materials you use, and includes:
                            </p>
                            
                            <div className="space-y-6 pl-4 border-l-2 border-[#3B0764]/10">
                                <div>
                                    <h3 className="font-bold mb-2">a) Personal and Account Data</h3>
                                    <p className="text-sm leading-relaxed opacity-80">
                                        If you choose to create an account to use features like saving &apos;Favourite Stations&apos;, we collect personal information, such as your user ID and email address, provided through our authentication provider (Supabase Auth).
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold mb-2">b) Location Data</h3>
                                    <p className="text-sm leading-relaxed opacity-80">
                                        This is the core of our service. We request and collect precise, real-time location information from your device to provide location-based services, such as:
                                    </p>
                                    <ul className="list-disc ml-5 mt-2 space-y-1 text-xs opacity-70">
                                        <li>Finding and displaying nearby fuel stations on the map.</li>
                                        <li>Calculating the distance to each station.</li>
                                        <li>Powering features to find stations in your current area.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold mb-2">c) Usage Data</h3>
                                    <p className="text-sm leading-relaxed opacity-80">
                                        We collect information about your activity in the App, specifically which fuel stations you mark as &apos;Favourite&apos; and the price reports you submit. This helps personalize your experience and contributes to our community data.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">2. How We Use Your Information</h2>
                            <p className="leading-relaxed">
                                Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we use information collected via the App to:
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Provide the core service of finding nearby fuel stations and their details.',
                                    'Create and manage your account and your list of \'Favourite Stations\'.',
                                    'Improve our database. When you search, your location is used to query sources for new station info. This helps keep our data accurate for all.'
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 border border-transparent hover:border-[#3B0764]/10 transition-colors text-sm">
                                        <div className="w-5 h-5 rounded-full bg-[#3B0764] text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">3. Contact Us</h2>
                            <p className="leading-relaxed">
                                If you have questions or comments about this Privacy Policy, please reach out to us using the details below:
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                <a href="mailto:hello@fyndfuel.com" className="flex items-center gap-4 p-5 rounded-3xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-all border border-[#3B0764]/5">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-[#3B0764] dark:text-purple-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Email</p>
                                        <p className="font-bold truncate">hello@fyndfuel.com</p>
                                    </div>
                                </a>
                                
                                <a href="tel:+2349055566889" className="flex items-center gap-4 p-5 rounded-3xl bg-[#F5F5F0] dark:bg-white/5 hover:bg-[#3B0764]/5 dark:hover:bg-white/10 transition-all border border-[#3B0764]/5">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-green-500">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Phone</p>
                                        <p className="font-bold truncate">+234 905 556 6889</p>
                                    </div>
                                </a>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
