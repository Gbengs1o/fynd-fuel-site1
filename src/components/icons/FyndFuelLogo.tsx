import React from 'react';
import Logo from '../Logo';

interface FyndFuelLogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
}

export default function FyndFuelLogo({ size = 24, color, style, className, ...props }: FyndFuelLogoProps) {
    return (
        <div style={{ width: size, height: size, color: color, ...style }} className={className}>
            <Logo width="100%" height="100%" {...props} style={{ fill: color }} />
        </div>
    );
}
