'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Fuel, MapPin, Shield, Star, ArrowRight, Menu, CheckCircle, X } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

const heroImages = [
  "/heroimage1.png",
  "/heroimage2.png",
  "/heroimage3.png"
];

export default function Home() {
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- MAJESTIC SCROLL LOGIC ---
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"] // Track whole container
  });

  // Smooth out the raw scroll data for a "heavy/luxurious" feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // 1. Image Scale: Starts full (1) -> shrinks to "Card" (0.9)
  const scale = useTransform(smoothProgress, [0, 0.4], [1, 0.92]);

  // 2. Borders: Starts sharp (0px) -> Becomes rounded (40px)
  const borderRadius = useTransform(smoothProgress, [0, 0.4], ["0px", "48px"]);

  // 3. Image Margin: Pulls away from edges
  const padding = useTransform(smoothProgress, [0, 0.4], ["0px", "40px"]);

  // 4. Text Parallax: Moves up and fades out fast
  const textY = useTransform(smoothProgress, [0, 0.3], ["0%", "-50%"]);
  const textOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  // 5. Overlay: Darkens the image slightly as it recedes so text stays readable
  const overlayOpacity = useTransform(smoothProgress, [0, 0.4], [0.2, 0.5]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#3B0764] selection:text-white">

      {/* Hand-Crafted Grain Texture (Essential for the look) */}
      <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <span className="font-serif font-bold text-2xl tracking-tighter">Fynd Fuel</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-white font-medium text-sm tracking-wide">
            <Link href="/mission" className="hover:underline underline-offset-4 decoration-1">Mission</Link>
            <Link href="/login" className="hover:underline underline-offset-4 decoration-1">Map</Link>
            <Link href="/download" className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-[#F5F5F0] transition-colors">
              Get App
            </Link>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white z-50">
            <Menu />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-[#1a1a1a] text-white flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <span className="font-serif font-bold text-2xl tracking-tighter">Fynd Fuel</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={32} />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-2xl font-serif">
              <Link href="/mission" onClick={() => setIsMobileMenuOpen(false)}>Mission</Link>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Map</Link>
              <Link href="/download" onClick={() => setIsMobileMenuOpen(false)}>Get App</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main ref={containerRef} className="relative">

        {/* --- HERO WRAPPER (High Height for Scroll Track) --- */}
        <div className="h-[180vh] relative">

          {/* --- STICKY VIEWPORT --- */}
          <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

            {/* 1. DYNAMIC CONTAINER (Handles Padding/Border Radius) */}
            <motion.div
              style={{ padding: padding }}
              className="absolute inset-0 w-full h-full z-0 flex items-center justify-center"
            >
              {/* 2. IMAGE CARD (Handles Scale/Radius) */}
              <motion.div
                style={{ scale: scale, borderRadius: borderRadius }}
                className="relative w-full h-full overflow-hidden shadow-2xl bg-[#1a1a1a]"
              >
                {/* High-Res Image Carousel */}
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentImageIndex}
                    className="absolute inset-0 w-full h-full"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <Image
                      src={heroImages[currentImageIndex]}
                      alt="Hero Carousel"
                      fill
                      priority={currentImageIndex === 0}
                      className="object-cover object-[center_20%]"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Dark Overlay that gets darker on scroll */}
                <motion.div
                  style={{ opacity: overlayOpacity }}
                  className="absolute inset-0 bg-[#3B0764] mix-blend-multiply"
                />
              </motion.div>
            </motion.div>

            {/* 3. HERO TEXT (Moves independently) */}
            <motion.div
              style={{ y: textY, opacity: textOpacity }}
              className="relative z-10 text-center text-[#F5F5F0] px-6 max-w-4xl mx-auto"
            >
              <div className="mb-6 inline-block border border-white/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md">
                Hand-Crafted Navigation
              </div>
              <h1 className="font-serif text-6xl md:text-9xl leading-[0.85] tracking-tight mb-8">
                The Road <br /> Less Taken.
              </h1>
              <p className="text-lg md:text-2xl font-light text-white/80 max-w-xl mx-auto leading-relaxed">
                Experience the clarity of uncompromised fuel data. <br /> No noise. Just the journey.
              </p>
            </motion.div>
          </div>
        </div>

        {/* --- CONTENT LAYER --- */}
        {/* This slides up OVER the sticky hero */}
        <div className="relative z-20 bg-[#F5F5F0] -mt-20 pt-24 pb-32 shadow-[0_-50px_100px_rgba(0,0,0,0.1)] border-t border-[#3B0764]/10 rounded-t-[3rem]">

          <div className="max-w-7xl mx-auto px-6">

            {/* Intro Section with Logo */}
            <div className="mb-32 flex flex-col items-center text-center">
              {/* Animated Logo */}
              <div className="w-32 h-32 mb-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3599.99 3599.99" className="w-full h-full">
                  <g>
                    <path fill="#5C0CA7" d="M2080.09 1779.17l-399.8 431.48c-250.48,-267.45 -647.12,-598.63 -611.66,-987.72 42.49,-229.11 165.69,-378.48 337.95,-458.04 561.87,-259.46 1219.06,330.74 673.5,1014.27zm-656.23 -1219.88c-245.02,77.89 -424.48,252.2 -507.11,478.69 -48.21,140.04 -56.07,235.01 -35.54,392.65 40.4,237.64 194,415.22 323.13,523.46l-257.78 276.33c34.95,76.41 652.87,766.45 733.73,853.57l219.09 -242.71c32.92,-39.63 30.13,-36.82 72.2,-80.94l279.66 -334.14c202.17,-246.37 407.12,-386.76 467.12,-755.49 109.61,-704.46 -616.95,-1326.82 -1294.51,-1111.43zm-223.41 1667.67l136.93 -116.6 342.91 383.01c32.5,-18.62 6.75,0.2 32.47,-24.41 312.09,-347.83 743.69,-685.12 782.67,-1177.8 258.26,442.89 -432.16,1075.64 -696.59,1381.85 -56.88,62.01 -61.41,56.62 -97.19,125.29l-501.21 -571.34z" />
                    <path fill="#5C0CA7" d="M1449.09 1008.46c-18.41,3.83 -30.31,13.3 -37.68,26.18 -9.49,16.58 -8.05,34.82 -8.04,56.5l0 516.83c0,67.18 -5.06,71.46 58.22,71.45 86.84,-0 173.68,0 260.52,0 80.83,0 73.56,12.57 73.56,-119.77 0,-21.31 -6.59,-46.76 16.7,-48.37 58.39,-4.06 29.61,47.51 44.69,85.65 27.67,70 122.86,72.35 154.58,6.44 12.65,-26.28 8.21,-87.5 8.21,-121.46 0,-86.83 -0.12,-173.68 0,-260.52 0.07,-50.76 -9.26,-66.76 -38.52,-89.04 -24.37,-18.56 -49.78,-37.3 -74.46,-55.8 -11.8,-8.84 -26.63,-21.22 -44.9,-7.36 -14.64,11.11 -12.3,34.4 1.22,44.74 48.54,37.14 44.42,21.59 44.41,86.44 0,49.08 1.87,69.32 42.41,85.22 18.8,7.37 13.7,19.38 13.7,51.34l0 195.39c0,21.44 3.96,43.51 -9.41,55.7 -14.79,13.5 -36.91,6.43 -43.33,-7.14 -14.73,-31.11 12.65,-58.7 -27.84,-100.32 -44.1,-45.33 -85.7,-6.33 -87.52,-42.65 -2.06,-41.12 0.06,-88.56 0.06,-130.39 0,-36.4 2.59,-238.31 -1.56,-257.02 -10.62,-47.85 -57.65,-43.44 -86.7,-43.44 -36.99,0 -239.44,-2.54 -258.31,1.38zm10.42 74.27l0 184.88c0,15.96 5.06,19.51 20.99,19.51l239.51 0c15.48,0 19.51,-4.03 19.51,-19.51l0 -184.88c0,-15.5 -4.01,-19.51 -19.51,-19.51l-240.04 0c-14.87,0 -20.46,4.2 -20.46,19.51z" />
                  </g>
                </svg>
              </div>

              <h2 className="font-serif text-5xl md:text-7xl text-[#3B0764] leading-tight mb-8">
                Refueling, <span className="italic">reimagined</span>.
              </h2>
              <p className="text-xl text-[#1A1A1A]/70 leading-relaxed font-serif max-w-2xl">
                Precision-crafted for those who value clarity. Fynd Fuel strips away the noise and guides you effortlessly to fair prices and trusted stations across the country.
              </p>
            </div>

            {/* "Hand-Crafted" Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-32">

              {/* Card 1 */}
              <div className="group relative h-[500px] bg-white border border-[#1A1A1A]/10 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-[#3B0764] opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="p-10 h-full flex flex-col justify-between relative z-10">
                  <div className="w-14 h-14 rounded-full border border-[#3B0764]/20 flex items-center justify-center text-[#3B0764]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl mb-4 text-[#1A1A1A]">Curated Mapping</h3>
                    <p className="text-[#1A1A1A]/60 text-lg leading-relaxed">
                      Our maps aren&apos;t auto-generated. They are verified by a community of enthusiasts who ensure every pin is precise.
                    </p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-64 h-64 translate-x-1/3 translate-y-1/3">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-[#3B0764]/5 fill-current animate-[spin_20s_linear_infinite]">
                      <path d="M100,0 C155.2,0 200,44.8 200,100 C200,155.2 155.2,200 100,200 C44.8,200 0,155.2 0,100 C0,44.8 44.8,0 100,0 Z M100,180 C144.2,180 180,144.2 180,100 C180,55.8 144.2,20 100,20 C55.8,20 20,55.8 20,100 C20,144.2 55.8,180 100,180 Z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative h-[500px] bg-[#3B0764] rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 text-white">
                <div className="p-10 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center">
                      <Shield size={24} />
                    </div>
                    <Star className="text-white/20 fill-white/20 w-24 h-24 absolute -top-4 -right-4 rotate-12" />
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl mb-4">Verified Trust</h3>
                    <p className="text-white/70 text-lg leading-relaxed">
                      No algorithms guessing prices. Real receipts, real people, real savings. A solid connection between you and the pump.
                    </p>
                  </div>
                  <div className="w-full h-px bg-white/20 mt-6" />
                  <div className="flex gap-4 text-sm font-medium text-white/60">
                    <span className="flex items-center gap-2"><CheckCircle size={14} /> 99.9% Uptime</span>
                    <span className="flex items-center gap-2"><CheckCircle size={14} /> Encryption</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Editorial Feature */}
            <div className="relative border-y border-[#3B0764]/10 py-20">
              <div className="flex flex-col items-center text-center">
                <span className="font-serif italic text-2xl text-[#3B0764] mb-4">The Collection</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight text-[#1A1A1A]">Join the movement</h2>
                <Link
                  href="/download"
                  className="group relative inline-flex items-center justify-center px-12 py-6 bg-[#1A1A1A] text-white rounded-full overflow-hidden transition-transform active:scale-95"
                >
                  <span className="relative z-10 text-lg font-bold flex items-center gap-2">
                    Download Now <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-[#3B0764] transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                </Link>
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="mt-20 pt-10 border-t border-[#3B0764]/5 text-center">
            <p className="text-[#1A1A1A]/40 text-sm font-serif">© 2025 Fynd Fuel. Crafted with patience.</p>
          </footer>
        </div>

      </main>
    </div>
  );
}