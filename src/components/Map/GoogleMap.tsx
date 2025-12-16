
'use client';

import { useLoadScript, GoogleMap, MarkerF, OverlayView } from '@react-google-maps/api';
import { useMemo, useCallback } from 'react';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

// Custom Fynd Fuel Logo Marker Component
const LogoMarker = ({ position, onClick }: { position: { lat: number, lng: number }, onClick?: () => void }) => (
    <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
        <div
            onClick={onClick}
            className="cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
            style={{ width: 40, height: 40 }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3599.99 3599.99"
                className="w-full h-full drop-shadow-lg"
            >
                {/* White circle background */}
                <circle cx="1800" cy="1800" r="1700" fill="white" stroke="#5C0CA7" strokeWidth="100" />
                <g transform="translate(200, 200) scale(0.9)">
                    <path
                        fill="#5C0CA7"
                        d="M2080.09 1779.17l-399.8 431.48c-250.48,-267.45 -647.12,-598.63 -611.66,-987.72 42.49,-229.11 165.69,-378.48 337.95,-458.04 561.87,-259.46 1219.06,330.74 673.5,1014.27zm-656.23 -1219.88c-245.02,77.89 -424.48,252.2 -507.11,478.69 -48.21,140.04 -56.07,235.01 -35.54,392.65 40.4,237.64 194,415.22 323.13,523.46l-257.78 276.33c34.95,76.41 652.87,766.45 733.73,853.57l219.09 -242.71c32.92,-39.63 30.13,-36.82 72.2,-80.94l279.66 -334.14c202.17,-246.37 407.12,-386.76 467.12,-755.49 109.61,-704.46 -616.95,-1326.82 -1294.51,-1111.43zm-223.41 1667.67l136.93 -116.6 342.91 383.01c32.5,-18.62 6.75,0.2 32.47,-24.41 312.09,-347.83 743.69,-685.12 782.67,-1177.8 258.26,442.89 -432.16,1075.64 -696.59,1381.85 -56.88,62.01 -61.41,56.62 -97.19,125.29l-501.21 -571.34z"
                    />
                    <path
                        fill="#5C0CA7"
                        d="M1449.09 1008.46c-18.41,3.83 -30.31,13.3 -37.68,26.18 -9.49,16.58 -8.05,34.82 -8.04,56.5l0 516.83c0,67.18 -5.06,71.46 58.22,71.45 86.84,-0 173.68,0 260.52,0 80.83,0 73.56,12.57 73.56,-119.77 0,-21.31 -6.59,-46.76 16.7,-48.37 58.39,-4.06 29.61,47.51 44.69,85.65 27.67,70 122.86,72.35 154.58,6.44 12.65,-26.28 8.21,-87.5 8.21,-121.46 0,-86.83 -0.12,-173.68 0,-260.52 0.07,-50.76 -9.26,-66.76 -38.52,-89.04 -24.37,-18.56 -49.78,-37.3 -74.46,-55.8 -11.8,-8.84 -26.63,-21.22 -44.9,-7.36 -14.64,11.11 -12.3,34.4 1.22,44.74 48.54,37.14 44.42,21.59 44.41,86.44 0,49.08 1.87,69.32 42.41,85.22 18.8,7.37 13.7,19.38 13.7,51.34l0 195.39c0,21.44 3.96,43.51 -9.41,55.7 -14.79,13.5 -36.91,6.43 -43.33,-7.14 -14.73,-31.11 12.65,-58.7 -27.84,-100.32 -44.1,-45.33 -85.7,-6.33 -87.52,-42.65 -2.06,-41.12 0.06,-88.56 0.06,-130.39 0,-36.4 2.59,-238.31 -1.56,-257.02 -10.62,-47.85 -57.65,-43.44 -86.7,-43.44 -36.99,0 -239.44,-2.54 -258.31,1.38zm10.42 74.27l0 184.88c0,15.96 5.06,19.51 20.99,19.51l239.51 0c15.48,0 19.51,-4.03 19.51,-19.51l0 -184.88c0,-15.5 -4.01,-19.51 -19.51,-19.51l-240.04 0c-14.87,0 -20.46,4.2 -20.46,19.51z"
                    />
                </g>
            </svg>
        </div>
    </OverlayView>
);

export default function MapBackground({ stations, userLocation, onStationClick }: {
    stations: any[],
    userLocation?: { lat: number, lng: number },
    onStationClick?: (station: any) => void
}) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
        libraries,
    });

    const center = useMemo(() => userLocation || { lat: 6.5244, lng: 3.3792 }, [userLocation]); // Default: Lagos

    // Custom Dark Mode Map Style - More premium feel
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        scrollwheel: true,
        zoomControl: true,
        zoomControlOptions: {
            position: typeof window !== 'undefined' && window.google ? window.google.maps.ControlPosition.RIGHT_CENTER : undefined,
        },
        styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d4a574" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9a8478" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#1e3a2f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#4a7c59" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#2d2d44" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1a1a2e" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#3B0764" }], // Purple highways!
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#c9a8e0" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#0f1729" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#0f1729" }],
            },
        ]
    }), []);

    if (loadError) return <div className="w-full h-full flex items-center justify-center text-red-500">Error loading maps</div>;
    if (!isLoaded) return (
        <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5C0CA7]"></div>
            <span className="ml-3 font-semibold text-white">Loading Maps...</span>
        </div>
    );

    return (
        <GoogleMap
            zoom={14}
            center={center}
            mapContainerClassName="w-full h-full absolute top-0 left-0 z-0"
            options={mapOptions}
        >
            {/* Custom Logo Markers */}
            {stations.map((station) => (
                <LogoMarker
                    key={station.id}
                    position={{
                        lat: station.lat || 6.5244,
                        lng: station.lng || 3.3792
                    }}
                    onClick={() => onStationClick?.(station)}
                />
            ))}

            {/* User Location Marker */}
            {userLocation && (
                <MarkerF
                    position={userLocation}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: "#3B0764",
                        fillOpacity: 1,
                        strokeWeight: 3,
                        strokeColor: "#FFFFFF",
                        scale: 8,
                    }}
                />
            )}
        </GoogleMap>
    );
}
