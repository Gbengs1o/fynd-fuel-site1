'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashFinish = () => {
        setShowSplash(false);
    };

    return (
        <>
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        key="splash"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999] bg-white"
                    >
                        <SplashScreen onFinish={handleSplashFinish} />
                    </motion.div>
                )}
            </AnimatePresence>
            {/*
               We render children always, or we could hide them.
               Rendering them behind allows app to hydrate/load data while splash is showing.
            */}
            <div className={showSplash ? 'hidden' : 'block'}>
                {children}
            </div>
        </>
    );
}
