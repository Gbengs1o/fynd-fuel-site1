import React from 'react';

interface LetterAvatarProps {
    name?: string;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
    name = 'User',
    avatarUrl,
    size = 40,
    className = ''
}) => {
    const safeName = name || 'User';

    const initials = safeName
        ? safeName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                style={{ width: size, height: size }}
                className={`rounded-full object-cover border-2 border-white dark:border-[#3B0764]/20 ${className}`}
            />
        );
    }

    // Hash name to get a consistent color
    const colors = [
        ['#F0FDF4', '#16A34A'], // Green
        ['#FEF2F2', '#DC2626'], // Red
        ['#EFF6FF', '#2563EB'], // Blue
        ['#F5F3FF', '#7C3AED'], // Purple
        ['#FFFBEB', '#D97706'], // Yellow
        ['#FDF2F8', '#DB2777'], // Pink
    ];

    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
        hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const [bg, text] = colors[colorIndex];

    return (
        <div
            style={{
                width: size,
                height: size,
                backgroundColor: bg,
                color: text,
                fontSize: size * 0.4
            }}
            className={`rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-[#3B0764]/20 ${className}`}
        >
            {initials}
        </div>
    );
};
