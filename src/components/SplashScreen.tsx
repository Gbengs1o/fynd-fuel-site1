'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        // Unmount after animations complete (approx 4-5s)
        const timer = setTimeout(() => {
            onFinish();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden">
            <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                {/* Logo SVG */}
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 3599.99 3599.99"
                    className="w-[300px] h-[300px] block z-10"
                    animate={{ y: [0, -30, 0] }}
                    transition={{
                        duration: 6,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                >
                    <g id="FyndFuel_Logo">
                        {/* Outer Shape */}
                        <motion.path
                            id="outer-shape"
                            d="M2080.09 1779.17l-399.8 431.48c-250.48,-267.45 -647.12,-598.63 -611.66,-987.72 42.49,-229.11 165.69,-378.48 337.95,-458.04 561.87,-259.46 1219.06,330.74 673.5,1014.27zm-656.23 -1219.88c-245.02,77.89 -424.48,252.2 -507.11,478.69 -48.21,140.04 -56.07,235.01 -35.54,392.65 40.4,237.64 194,415.22 323.13,523.46l-257.78 276.33c34.95,76.41 652.87,766.45 733.73,853.57l219.09 -242.71c32.92,-39.63 30.13,-36.82 72.2,-80.94l279.66 -334.14c202.17,-246.37 407.12,-386.76 467.12,-755.49 109.61,-704.46 -616.95,-1326.82 -1294.51,-1111.43zm-223.41 1667.67l136.93 -116.6 342.91 383.01c32.5,-18.62 6.75,0.2 32.47,-24.41 312.09,-347.83 743.69,-685.12 782.67,-1177.8 258.26,442.89 -432.16,1075.64 -696.59,1381.85 -56.88,62.01 -61.41,56.62 -97.19,125.29l-501.21 -571.34z"
                            fill="#5C0CA7"
                            stroke="#5C0CA7"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, fillOpacity: 0, strokeWidth: 20 }}
                            animate={{
                                pathLength: 1,
                                fillOpacity: 1,
                                strokeWidth: 0
                            }}
                            transition={{
                                pathLength: { duration: 2.5, ease: "easeInOut" },
                                fillOpacity: { duration: 1, ease: "easeOut", delay: 2 },
                                strokeWidth: { duration: 1, ease: "easeOut", delay: 2 }
                            }}
                        />
                        {/* Inner Shape */}
                        <motion.path
                            id="inner-shape"
                            d="M1449.09 1008.46c-18.41,3.83 -30.31,13.3 -37.68,26.18 -9.49,16.58 -8.05,34.82 -8.04,56.5l0 516.83c0,67.18 -5.06,71.46 58.22,71.45 86.84,-0 173.68,0 260.52,0 80.83,0 73.56,12.57 73.56,-119.77 0,-21.31 -6.59,-46.76 16.7,-48.37 58.39,-4.06 29.61,47.51 44.69,85.65 27.67,70 122.86,72.35 154.58,6.44 12.65,-26.28 8.21,-87.5 8.21,-121.46 0,-86.83 -0.12,-173.68 0,-260.52 0.07,-50.76 -9.26,-66.76 -38.52,-89.04 -24.37,-18.56 -49.78,-37.3 -74.46,-55.8 -11.8,-8.84 -26.63,-21.22 -44.9,-7.36 -14.64,11.11 -12.3,34.4 1.22,44.74 48.54,37.14 44.42,21.59 44.41,86.44 0,49.08 1.87,69.32 42.41,85.22 18.8,7.37 13.7,19.38 13.7,51.34l0 195.39c0,21.44 3.96,43.51 -9.41,55.7 -14.79,13.5 -36.91,6.43 -43.33,-7.14 -14.73,-31.11 12.65,-58.7 -27.84,-100.32 -44.1,-45.33 -85.7,-6.33 -87.52,-42.65 -2.06,-41.12 0.06,-88.56 0.06,-130.39 0,-36.4 2.59,-238.31 -1.56,-257.02 -10.62,-47.85 -57.65,-43.44 -86.7,-43.44 -36.99,0 -239.44,-2.54 -258.31,1.38zm10.42 74.27l0 184.88c0,15.96 5.06,19.51 20.99,19.51l239.51 0c15.48,0 19.51,-4.03 19.51,-19.51l0 -184.88c0,-15.5 -4.01,-19.51 -19.51,-19.51l-240.04 0c-14.87,0 -20.46,4.2 -20.46,19.51z"
                            fill="#5C0CA7"
                            stroke="#5C0CA7"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, fillOpacity: 0, strokeWidth: 20 }}
                            animate={{
                                pathLength: 1,
                                fillOpacity: 1,
                                strokeWidth: 0
                            }}
                            transition={{
                                pathLength: { duration: 2.5, ease: "easeInOut", delay: 0.3 },
                                fillOpacity: { duration: 1, ease: "easeOut", delay: 2.2 },
                                strokeWidth: { duration: 1, ease: "easeOut", delay: 2.2 }
                            }}
                        />
                    </g>
                </motion.svg>

                {/* Shadow */}
                <motion.div
                    className="w-[180px] h-[20px] rounded-[50%] -mt-[30px] z-[1]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(92, 12, 167, 0.4) 0%, rgba(255, 255, 255, 0) 70%)'
                    }}
                    animate={{
                        scale: [1, 0.7, 1],
                        opacity: [1, 0.5, 1]
                    }}
                    transition={{
                        duration: 6,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
            </motion.div>
        </div>
    );
}
