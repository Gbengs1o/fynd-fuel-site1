'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MessageSquare, Twitter, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactUsPage() {
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
                    <h1 className="flex-1 font-bold text-lg text-[#1A1A1A] dark:text-white text-center mr-9">Contact Us</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 pt-12">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Intro */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-[#3B0764] text-white text-[10px] font-black uppercase tracking-widest">
                            Get In Touch
                        </div>
                        <h1 className="text-5xl font-black text-[#1A1A1A] dark:text-white leading-[0.9] tracking-tighter">
                            Have a question? We&apos;d love to hear from you.
                        </h1>
                        <p className="text-lg text-[#1A1A1A]/60 dark:text-white/60 font-medium leading-relaxed">
                            Whether you have feedback, a feature request, or just want to say hi, our team is ready to listen.
                        </p>

                    </motion.div>

                    {/* Right Column - Cards */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <a href="mailto:hello@fyndfuel.com" className="group block p-8 rounded-[32px] bg-white dark:bg-[#1A1A1A] border border-[#3B0764]/5 hover:border-[#3B0764]/20 transition-all shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center text-[#3B0764] dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                <Mail className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white mb-2">Email Us</h3>
                            <p className="text-sm text-[#1A1A1A]/40 dark:text-white/40 mb-4">Send us an email anytime and we'll get back to you within 24 hours.</p>
                            <span className="font-bold text-[#3B0764] dark:text-purple-400 group-hover:underline underline-offset-4 pointer-events-none">hello@fyndfuel.com</span>
                        </a>

                        <a href="tel:+2349055566889" className="group block p-8 rounded-[32px] bg-white dark:bg-[#1A1A1A] border border-[#3B0764]/5 hover:border-[#3B0764]/20 transition-all shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-green-500/5 dark:bg-green-500/10 flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
                                <Phone className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white mb-2">Call Us</h3>
                            <p className="text-sm text-[#1A1A1A]/40 dark:text-white/40 mb-4">Speak directly with our support team Mon-Fri from 9am to 6pm.</p>
                            <span className="font-bold text-green-600 dark:text-green-500 group-hover:underline underline-offset-4 pointer-events-none">+234 905 556 6889</span>
                        </a>

                        <div className="p-8 rounded-[32px] bg-[#3B0764] text-white shadow-xl shadow-[#3B0764]/20">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-black mb-2">Help Center</h3>
                            <p className="text-sm text-white/60">Coming soon: A dedicated portal for all your questions and tutorials.</p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
