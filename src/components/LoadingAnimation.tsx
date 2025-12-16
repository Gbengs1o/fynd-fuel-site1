import React from 'react';

interface LoadingAnimationProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export default function LoadingAnimation({
    message = 'Loading...',
    size = 'medium',
    className = ''
}: LoadingAnimationProps) {
    const sizeClasses = {
        small: 'w-5 h-5 border-2',
        medium: 'w-8 h-8 border-3',
        large: 'w-12 h-12 border-4'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <div className={`${sizeClasses[size]} rounded-full border-gray-200 dark:border-white/10 border-t-[#3B0764] animate-spin mb-3`} />
            {message && (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
}
