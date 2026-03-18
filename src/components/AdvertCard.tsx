import React, { useMemo } from 'react';
import { ExternalLink, Play, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Advert {
    id: string | number;
    title: string;
    content?: string; // Backwards compatibility
    content_url?: string; // New DB field
    cta_text?: string;
    cta_link?: string;
    type: 'banner' | 'card' | 'native' | 'video';
    brand_name?: string;
    brand_logo?: string;
    end_date?: string | null;
    is_active?: boolean;
}

interface AdvertCardProps {
    advert: Advert;
    className?: string;
    showExpiryStatus?: boolean; // Whether to show a badge if expired
}

const AdvertCard: React.FC<AdvertCardProps> = ({ advert, className = '', showExpiryStatus = false }) => {
    const mediaUrl = advert.content_url || advert.content;
    
    const isExpired = useMemo(() => {
        if (!advert.end_date) return false;
        return new Date(advert.end_date) < new Date();
    }, [advert.end_date]);

    // If an ad is inactive or expired, we might want to hide it, 
    // but the component should handle it gracefully if it's passed.
    if (advert.is_active === false && !showExpiryStatus) return null;

    const handlePress = () => {
        if (isExpired) return;
        if (advert.cta_link) {
            window.open(advert.cta_link, '_blank');
        }
    };

    const containerVariants = {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        hover: { scale: 1.01, transition: { duration: 0.2 } },
        tap: { scale: 0.98 }
    };

    const StatusBadge = () => {
        if (!isExpired) return (
            <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-[0.1em] bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                    Sponsored
                </span>
            </div>
        );

        if (showExpiryStatus && isExpired) return (
            <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-[0.1em] bg-red-500/80 backdrop-blur-md border border-red-400/20 shadow-lg flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expired
                </span>
            </div>
        );

        return null;
    };

    if (advert.type === 'banner') {
        return (
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                whileHover={!isExpired ? "hover" : ""}
                whileTap={!isExpired ? "tap" : ""}
                onClick={handlePress}
                className={`w-full h-36 relative rounded-[28px] overflow-hidden cursor-pointer group shadow-xl ${isExpired ? 'grayscale opacity-60' : ''} ${className}`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#3B0764] via-[#1A1A1A] to-[#0D0D0D]" />
                
                {mediaUrl && (
                    <img
                        src={mediaUrl}
                        alt={advert.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                    />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <StatusBadge />

                <div className="absolute inset-x-0 bottom-0 p-5 flex justify-between items-end">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-white font-black text-xl leading-tight tracking-tight drop-shadow-md truncate">
                            {advert.title}
                        </h3>
                        {advert.brand_name && (
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">{advert.brand_name}</p>
                        )}
                    </div>
                    {advert.cta_text && (
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest hover:bg-white/20 transition-colors">
                            {advert.cta_text}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    if (advert.type === 'video') {
        return (
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                whileHover={!isExpired ? "hover" : ""}
                whileTap={!isExpired ? "tap" : ""}
                onClick={handlePress}
                className={`w-full relative rounded-[32px] overflow-hidden bg-black aspect-video group cursor-pointer shadow-2xl border border-white/5 ${isExpired ? 'grayscale opacity-60' : ''} ${className}`}
            >
                {mediaUrl && (
                    <img
                        src={mediaUrl}
                        alt={advert.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 blur-[2px] group-hover:blur-0"
                    />
                )}
                
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <Play className="w-7 h-7 text-white ml-1 fill-white" />
                    </div>
                </div>

                <StatusBadge />

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
                    <h3 className="text-white text-lg font-black tracking-tight mb-2 drop-shadow-lg">{advert.title}</h3>
                    {advert.cta_text && (
                        <div className="flex items-center text-white/80 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                            {advert.cta_text} <ExternalLink className="w-3 h-3 ml-2 stroke-[3px]" />
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // Default 'card' or 'native'
    return (
        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            whileHover={!isExpired ? "hover" : ""}
            whileTap={!isExpired ? "tap" : ""}
            onClick={handlePress}
            className={`p-5 rounded-[32px] bg-white dark:bg-[#1A1A1A] border border-[#3B0764]/5 dark:border-white/5 hover:border-[#3B0764]/20 shadow-sm cursor-pointer transition-all ${isExpired ? 'grayscale opacity-60' : ''} ${className}`}
        >
            <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#1A1A1A] shrink-0 overflow-hidden relative shadow-inner">
                    {mediaUrl ? (
                        <img src={mediaUrl} alt={advert.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white/20" />
                        </div>
                    )}
                    {isExpired && (
                        <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                           <Clock className="w-8 h-8 text-white/40" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-[#3B0764] dark:text-purple-400 bg-[#3B0764]/5 dark:bg-purple-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {isExpired ? 'Expired' : 'Sponsored'}
                        </span>
                    </div>
                    <h3 className="font-black text-[#1A1A1A] dark:text-white truncate text-lg tracking-tight">{advert.title}</h3>
                    <p className="text-xs text-[#1A1A1A]/40 dark:text-white/40 font-bold uppercase tracking-wider line-clamp-1 mt-0.5">
                        {advert.brand_name || 'Premium Partner'}
                    </p>

                    {advert.cta_text && (
                        <div className="mt-3 flex items-center text-[10px] font-black text-[#3B0764] dark:text-purple-300 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                            {advert.cta_text} <ExternalLink className="w-3 h-3 ml-2 stroke-[3px]" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdvertCard;
