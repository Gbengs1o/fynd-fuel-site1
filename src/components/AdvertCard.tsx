import React from 'react';
import { ExternalLink, Play } from 'lucide-react';
import Image from 'next/image';

export interface Advert {
    id: number;
    title: string;
    content: string; // URL for image/video or text content
    cta_text?: string;
    cta_link?: string;
    type: 'banner' | 'card' | 'native' | 'video';
    brand_name?: string;
    brand_logo?: string;
}

interface AdvertCardProps {
    advert: Advert;
    className?: string;
}

const AdvertCard: React.FC<AdvertCardProps> = ({ advert, className = '' }) => {
    const handlePress = () => {
        if (advert.cta_link) {
            window.open(advert.cta_link, '_blank');
        }
    };

    if (advert.type === 'banner') {
        return (
            <div
                onClick={handlePress}
                className={`w-full h-32 relative rounded-2xl overflow-hidden cursor-pointer group ${className}`}
            >
                {/* Fallback pattern if no image */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900" />

                {advert.content && (
                    <img
                        src={advert.content}
                        alt={advert.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                        <span className="text-[10px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Ad</span>
                        <h3 className="text-white font-bold text-lg leading-tight mt-1">{advert.title}</h3>
                    </div>
                    {advert.cta_text && (
                        <span className="bg-white text-purple-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                            {advert.cta_text}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (advert.type === 'video') {
        return (
            <div
                onClick={handlePress}
                className={`w-full relative rounded-2xl overflow-hidden bg-black aspect-video group cursor-pointer ${className}`}
            >
                {/* Video Placeholder - In a real app, this would be a video player */}
                {advert.content && (
                    <img
                        src={advert.content}  // Using thumbnail logic for now
                        alt={advert.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                    </div>
                </div>
                <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider">Sponsored</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="text-white font-bold mb-1">{advert.title}</h3>
                    {advert.cta_text && (
                        <div className="flex items-center text-purple-300 text-xs font-semibold">
                            {advert.cta_text} <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default 'card' or 'native'
    return (
        <div
            onClick={handlePress}
            className={`p-4 rounded-2xl bg-[#F5F5F0] dark:bg-white/5 border border-transparent hover:border-[#3B0764]/20 cursor-pointer transition-all ${className}`}
        >
            <div className="flex gap-3">
                {/* Image/Icon */}
                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0 overflow-hidden relative">
                    {advert.content ? (
                        <img src={advert.content} alt={advert.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Ad</div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-semibold text-[#3B0764] dark:text-white/60 uppercase tracking-wider mb-0.5">Sponsored</span>
                    </div>
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white truncate">{advert.title}</h3>
                    <p className="text-xs text-[#1A1A1A]/60 dark:text-white/60 line-clamp-2 mt-1">
                        {advert.brand_name || 'Check this out'}
                    </p>

                    {advert.cta_text && (
                        <div className="mt-2 flex items-center text-xs font-bold text-[#3B0764] dark:text-purple-300">
                            {advert.cta_text} <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvertCard;
