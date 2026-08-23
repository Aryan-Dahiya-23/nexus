import React from 'react';

interface NexusLogoProps {
    className?: string;
    size?: number | string;
    showText?: boolean;
    textClassName?: string;
    animated?: boolean;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
    className = 'h-9 w-9',
    size,
    showText = false,
    textClassName = 'text-xl font-extrabold tracking-tight',
    animated = false,
}) => {
    const sizeStyle = size ? { width: size, height: size } : undefined;

    return (
        <div className="inline-flex items-center space-x-2.5 shrink-0">
            <div
                style={sizeStyle}
                className={`relative flex items-center justify-center shrink-0 ${className || 'h-9 w-9'}`}
            >
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full max-w-full max-h-full drop-shadow-md shrink-0 block"
                >
                    <defs>
                        <linearGradient id="nexusCompGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#00D5FA" />
                            <stop offset="50%" stop-color="#0284c7" />
                            <stop offset="100%" stop-color="#2563eb" />
                        </linearGradient>
                        <filter id="nexusDrop" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00D5FA" flood-opacity="0.5" />
                        </filter>
                    </defs>

                    {/* Outer Rounded Container */}
                    <rect
                        x="3"
                        y="3"
                        width="94"
                        height="94"
                        rx="26"
                        fill="url(#nexusCompGrad)"
                        fillOpacity="0.12"
                        stroke="#00D5FA"
                        strokeWidth="2.5"
                        strokeOpacity="0.35"
                    />

                    {/* Emblem Group */}
                    <g filter="url(#nexusDrop)">
                        {/* Left Pillar */}
                        <rect x="22" y="24" width="11.5" height="52" rx="5.75" fill="url(#nexusCompGrad)" />

                        {/* Right Pillar */}
                        <rect x="66.5" y="24" width="11.5" height="52" rx="5.75" fill="url(#nexusCompGrad)" />

                        {/* Diagonal Link */}
                        <path d="M22 28 L78 72" stroke="url(#nexusCompGrad)" strokeWidth="12" strokeLinecap="round" />

                        {/* Core Pulse Core */}
                        <circle cx="50" cy="50" r="6.5" fill="#ffffff" />
                        <circle
                            cx="50"
                            cy="50"
                            r="10.5"
                            fill="#00D5FA"
                            fillOpacity="0.6"
                            className={animated ? "animate-ping" : ""}
                        />
                    </g>
                </svg>
            </div>

            {showText && (
                <span className={`bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent ${textClassName}`}>
                    Nexus
                </span>
            )}
        </div>
    );
};

export default NexusLogo;
