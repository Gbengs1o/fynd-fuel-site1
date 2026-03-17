import { supabase } from './supabaseClient';

export type VehicleLevel = 'Legedis Benz' | 'Keke Napep' | 'Danfo' | 'G-Wagon';

interface VehicleStatus {
    level: VehicleLevel;
    icon: string;
    minPoints: number;
    maxPoints: number;
    nextLevel?: VehicleLevel;
}

// Vehicle levels (display only, aligned with mobile app)
export const VEHICLE_LEVELS: VehicleStatus[] = [
    {
        level: 'Legedis Benz',
        icon: '🚶🏾‍♂️',
        minPoints: 0,
        maxPoints: 500,
        nextLevel: 'Keke Napep'
    },
    {
        level: 'Keke Napep',
        icon: '🛺',
        minPoints: 500,
        maxPoints: 2000,
        nextLevel: 'Danfo'
    },
    {
        level: 'Danfo',
        icon: '🚌',
        minPoints: 2000,
        maxPoints: 5000,
        nextLevel: 'G-Wagon'
    },
    {
        level: 'G-Wagon',
        icon: '🚙',
        minPoints: 5000,
        maxPoints: 1000000,
        nextLevel: undefined
    }
];

export function getVehicleStatus(points: number): VehicleStatus {
    return VEHICLE_LEVELS.find(v => points >= v.minPoints && points < v.maxPoints)
        || VEHICLE_LEVELS[VEHICLE_LEVELS.length - 1];
}

export function getProgressToNextLevel(points: number): number {
    const status = getVehicleStatus(points);
    if (!status.nextLevel) return 100;

    const range = status.maxPoints - status.minPoints;
    const progress = points - status.minPoints;
    return Math.min(Math.max((progress / range) * 100, 0), 100);
}
