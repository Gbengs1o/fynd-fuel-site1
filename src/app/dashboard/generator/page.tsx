'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Power, Zap, Fuel, Timer, 
    Banknote, Settings2, RotateCcw, Plus,
    AlertCircle, Info, TrendingDown, Clock,
    ChevronDown, Save, Gauge, History, Settings,
    Trash2, MapPin, CheckCircle2, XCircle, InfoIcon,
    Flame, ZapOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const STORAGE_KEY = 'fyndfuel_generator_v2';
const LOW_FUEL_THRESHOLD = 0.15; // 15%
const CRITICAL_FUEL_THRESHOLD = 0.05; // 5%

interface GeneratorPreset {
    name: string;
    capacity: number;
    burnRate: number;
    image: string;
    icon: string;
}

const PRESETS: GeneratorPreset[] = [
    { name: 'I Better (Small)', capacity: 5, burnRate: 0.5, image: '/assets/images/small_gen.png', icon: '🔌' },
    { name: 'Tiger 2.5KVA', capacity: 15, burnRate: 1.2, image: '/assets/images/medium_gen.png', icon: '🐯' },
    { name: 'Sumec Firman', capacity: 25, burnRate: 1.8, image: '/assets/images/large_gen.png', icon: '⚡' },
    { name: 'Lutian 10KVA', capacity: 35, burnRate: 3.5, image: '/assets/images/industrial_gen.png', icon: '🔥' },
    { name: 'Custom', capacity: 0, burnRate: 0, image: '/assets/images/industrial_gen.png', icon: '⚙️' },
];

interface FuelSession {
    id: string;
    startTime: number;
    endTime: number | null;
    fuelUsed: number;
    cost: number;
}

interface GeneratorState {
    // Core
    capacity: number;
    currentFuel: number;
    burnRate: number;
    isRunning: boolean;
    lastUpdated: number;
    presetName: string;

    // Cost tracking
    fuelPricePerLiter: number;
    totalCostThisMonth: number;
    totalLitersThisMonth: number;

    // Session tracking
    currentSessionStart: number | null;
    sessions: FuelSession[];
}

const DEFAULT_STATE: GeneratorState = {
    capacity: 25,
    currentFuel: 0,
    burnRate: 1.8,
    isRunning: false,
    lastUpdated: Date.now(),
    presetName: 'Sumec Firman',
    fuelPricePerLiter: 900,
    totalCostThisMonth: 0,
    totalLitersThisMonth: 0,
    currentSessionStart: null,
    sessions: [],
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function GeneratorManagerPage() {
    const router = useRouter();
    const [state, setState] = useState<GeneratorState | null>(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [addFuelAmount, setAddFuelAmount] = useState('');
    const [showPresets, setShowPresets] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [tempPrice, setTempPrice] = useState('');
    const [showCustomGen, setShowCustomGen] = useState(false);
    const [customCapacity, setCustomCapacity] = useState('');
    const [customBurnRate, setCustomBurnRate] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    // Interval Ref
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    useEffect(() => {
        loadState();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (state) {
            saveState(state);
        }
    }, [state]);

    useEffect(() => {
        if (state?.isRunning) {
            intervalRef.current = setInterval(calculateConsumption, 5000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state?.isRunning]);

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    const loadState = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Calculate fuel lost while site was closed
                if (parsed.isRunning) {
                    const now = Date.now();
                    const hoursPassed = (now - parsed.lastUpdated) / (1000 * 60 * 60);
                    const consumed = hoursPassed * parsed.burnRate;
                    parsed.currentFuel = Math.max(0, parsed.currentFuel - consumed);
                    parsed.lastUpdated = now;

                    // Update totals
                    parsed.totalLitersThisMonth = (parsed.totalLitersThisMonth || 0) + consumed;
                    parsed.totalCostThisMonth = (parsed.totalCostThisMonth || 0) + (consumed * parsed.fuelPricePerLiter);
                    
                    // If fuel hit zero while away, stop the generator
                    if (parsed.currentFuel <= 0) {
                        parsed.isRunning = false;
                        if (parsed.currentSessionStart) {
                            const session: FuelSession = {
                                id: Date.now().toString(),
                                startTime: parsed.currentSessionStart,
                                endTime: now,
                                fuelUsed: consumed,
                                cost: consumed * parsed.fuelPricePerLiter,
                            };
                            parsed.sessions = [session, ...(parsed.sessions || [])].slice(0, 20);
                        }
                        parsed.currentSessionStart = null;
                    }
                }
                setState({ ...DEFAULT_STATE, ...parsed });
            } else {
                setState(DEFAULT_STATE);
            }
        } catch (e) {
            setState(DEFAULT_STATE);
        } finally {
            setLoading(false);
        }
    };

    const saveState = (newState: GeneratorState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (e) {
            console.error('Error saving state:', e);
        }
    };

    // ========================================================================
    // CORE LOGIC
    // ========================================================================

    const calculateConsumption = useCallback(() => {
        setState(prev => {
            if (!prev || !prev.isRunning) return prev;

            const now = Date.now();
            const hoursPassed = (now - prev.lastUpdated) / (1000 * 60 * 60);
            const consumed = hoursPassed * prev.burnRate;
            const newFuel = Math.max(0, prev.currentFuel - consumed);

            let updates: Partial<GeneratorState> = {
                currentFuel: newFuel,
                lastUpdated: now,
                totalLitersThisMonth: prev.totalLitersThisMonth + consumed,
                totalCostThisMonth: prev.totalCostThisMonth + (consumed * prev.fuelPricePerLiter),
            };

            // Auto-stop if empty
            if (newFuel <= 0) {
                const session: FuelSession = {
                    id: Date.now().toString(),
                    startTime: prev.currentSessionStart || now,
                    endTime: now,
                    fuelUsed: prev.currentFuel,
                    cost: prev.currentFuel * prev.fuelPricePerLiter,
                };
                return {
                    ...prev,
                    ...updates,
                    currentFuel: 0,
                    isRunning: false,
                    currentSessionStart: null,
                    sessions: [session, ...prev.sessions].slice(0, 20),
                };
            }

            return { ...prev, ...updates };
        });
    }, []);

    const toggleGenerator = () => {
        if (!state) return;

        if (!state.isRunning && state.currentFuel <= 0) {
            alert('Tank Empty! Please add fuel before starting.');
            return;
        }

        const now = Date.now();

        if (state.isRunning) {
            // Stopping - save session
            const sessionHours = (now - (state.currentSessionStart || now)) / (1000 * 60 * 60);
            const fuelUsed = sessionHours * state.burnRate;
            const session: FuelSession = {
                id: now.toString(),
                startTime: state.currentSessionStart || now,
                endTime: now,
                fuelUsed: fuelUsed,
                cost: fuelUsed * state.fuelPricePerLiter,
            };

            setState(prev => (!prev ? null : {
                ...prev,
                isRunning: false,
                lastUpdated: now,
                currentSessionStart: null,
                sessions: [session, ...prev.sessions].slice(0, 20),
            }));
        } else {
            // Starting
            setState(prev => (!prev ? null : {
                ...prev,
                isRunning: true,
                lastUpdated: now,
                currentSessionStart: now,
            }));
        }
    };

    const addFuel = () => {
        const amount = parseFloat(addFuelAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid number of liters.');
            return;
        }

        setState(prev => {
            if (!prev) return null;
            const newFuel = Math.min(prev.capacity, prev.currentFuel + amount);
            return {
                ...prev,
                currentFuel: newFuel,
                lastUpdated: Date.now(),
            };
        });
        setAddFuelAmount('');
        alert(`Refueled ⛽! Added ${amount}L to your tank.`);
    };

    const selectPreset = (preset: GeneratorPreset) => {
        if (preset.name === 'Custom') {
            setShowPresets(false);
            setCustomCapacity(state?.capacity.toString() || '25');
            setCustomBurnRate(state?.burnRate.toString() || '1.8');
            setShowCustomGen(true);
            return;
        }
        setState(prev => (!prev ? null : {
            ...prev,
            capacity: preset.capacity,
            burnRate: preset.burnRate,
            presetName: preset.name,
            currentFuel: Math.min(prev.currentFuel, preset.capacity),
        }));
        setShowPresets(false);
    };

    const saveCustomGenerator = () => {
        const capacity = parseFloat(customCapacity);
        const burnRate = parseFloat(customBurnRate);

        if (isNaN(capacity) || capacity <= 0 || isNaN(burnRate) || burnRate <= 0) {
            alert('Please enter valid capacity and burn rate values.');
            return;
        }

        setState(prev => (!prev ? null : {
            ...prev,
            capacity,
            burnRate,
            presetName: 'Custom Generator',
            currentFuel: Math.min(prev.currentFuel, capacity),
        }));
        setShowCustomGen(false);
    };

    const updateFuelPrice = () => {
        const price = parseFloat(tempPrice);
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price per liter.');
            return;
        }
        setState(prev => (!prev ? null : { ...prev, fuelPricePerLiter: price }));
        setShowSettings(false);
    };

    const resetGeneratorData = () => {
        if (confirm('Are you sure you want to clear all generator data and history? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            setState(DEFAULT_STATE);
            setShowSettings(false);
        }
    };

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    if (loading || !state) return null;

    const fuelPercentage = Math.min(100, Math.max(0, (state.currentFuel / state.capacity) * 100));
    const hoursRemaining = state.currentFuel > 0 ? state.currentFuel / state.burnRate : 0;
    const isLow = fuelPercentage < LOW_FUEL_THRESHOLD * 100;
    const isCritical = fuelPercentage < CRITICAL_FUEL_THRESHOLD * 100;

    const formatNaira = (amount: number) => {
        return '₦' + amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const getGaugeColor = () => {
        if (isCritical) return 'bg-red-500';
        if (isLow) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212] pb-24 font-sans selection:bg-[#3B0764] selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border-b border-[#3B0764]/5 dark:border-white/5 px-6 py-4">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="text-lg font-black tracking-tight text-[#1A1A1A] dark:text-white">POWER HUB</h1>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 -mr-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Settings className="w-6 h-6 text-[#3B0764] dark:text-purple-400" />
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-8 space-y-6">
                {/* 1. Hero Power Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-[#1A1A1A] rounded-[48px] p-8 shadow-2xl shadow-[#3B0764]/5 border border-[#3B0764]/5 dark:border-white/5 relative overflow-hidden flex flex-col items-center"
                >
                    {/* Status Badge */}
                    <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 ${
                        state.isRunning ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        <div className={`w-2 h-2 rounded-full bg-white ${state.isRunning ? 'animate-pulse' : ''}`} />
                        {state.isRunning ? 'SYSTEM RUNNING' : 'SYSTEM OFFLINE'}
                    </div>

                    <div className="mt-10 mb-8 flex flex-col items-center">
                        <motion.div 
                            animate={state.isRunning ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`w-40 h-40 rounded-full flex items-center justify-center relative cursor-pointer group active:scale-95 transition-transform ${
                                state.isRunning 
                                ? 'bg-red-500 shadow-xl shadow-red-500/20' 
                                : 'bg-emerald-500 shadow-xl shadow-emerald-500/20'
                            }`}
                            onClick={toggleGenerator}
                        >
                            <div className="absolute inset-2 rounded-full border-2 border-white/20 border-dashed animate-[spin_10s_linear_infinite]" />
                            <Power className="w-16 h-16 text-white stroke-[3px]" />
                        </motion.div>
                        <p className="mt-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                            {state.isRunning ? 'Tap to Stop Engine' : 'Tap to Start Engine'}
                        </p>
                    </div>

                    <div className="w-full pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Unit</p>
                            <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white">{state.presetName}</h3>
                        </div>
                        <button 
                            onClick={() => setShowPresets(true)}
                            className="bg-[#3B0764] dark:bg-purple-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
                        >
                            Change
                        </button>
                    </div>
                </motion.div>

                {/* 2. Fuel Gauge Card */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[40px] p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                <Fuel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] dark:text-white uppercase tracking-widest text-sm">Fuel Analysis</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-[#1A1A1A] dark:text-white">{fuelPercentage.toFixed(0)}%</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining</p>
                        </div>
                    </div>

                    <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden p-1 shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fuelPercentage}%` }}
                            className={`h-full rounded-full transition-colors duration-500 ${getGaugeColor()}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F5F5F0] dark:bg-white/5 rounded-3xl p-4 border border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-[#3B0764]" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</span>
                            </div>
                            <p className="text-xl font-black text-[#1A1A1A] dark:text-white">{state.currentFuel.toFixed(1)}<span className="text-xs ml-1 opacity-30">L</span></p>
                            <p className="text-[9px] font-bold text-gray-400">Total: {state.capacity}L</p>
                        </div>
                        <div className="bg-[#F5F5F0] dark:bg-white/5 rounded-3xl p-4 border border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-[#3B0764]" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Runtime</span>
                            </div>
                            <p className="text-xl font-black text-[#1A1A1A] dark:text-white">
                                {Math.floor(hoursRemaining)}<span className="text-xs ml-0.5 opacity-30">h</span> {Math.round((hoursRemaining % 1) * 60)}<span className="text-xs ml-0.5 opacity-30">m</span>
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Est. Termination</p>
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-6 shadow-sm border border-[#3B0764]/5 dark:border-white/5 group">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Add Fuel</h4>
                        <div className="relative mb-4">
                            <input 
                                type="number" 
                                value={addFuelAmount}
                                onChange={(e) => setAddFuelAmount(e.target.value)}
                                className="w-full bg-[#F5F5F0] dark:bg-white/5 border-2 border-transparent rounded-2xl py-3 px-4 text-xl font-black text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#3B0764]/20 transition-all text-center"
                                placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">L</span>
                        </div>
                        <button 
                            onClick={addFuel}
                            className="w-full bg-emerald-500 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                        >
                            Top Up Tank
                        </button>
                    </div>

                    <div className="bg-[#3B0764] rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer active:scale-95 transition-all" onClick={() => router.push('/dashboard')}>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <MapPin className="w-8 h-8 text-white/40 mb-2" />
                        <div>
                            <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">Need Fuel?</h4>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Find Closest Station</p>
                        </div>
                    </div>
                </div>

                {/* 4. Cost Summary Analytics */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[40px] p-8 shadow-sm border border-[#3B0764]/5 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white tracking-tight">Cost Analysis</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usage this month</p>
                        </div>
                        <div className="px-4 py-2 bg-[#3B0764]/5 dark:bg-purple-900/20 rounded-2xl">
                            <span className="text-xs font-black text-[#3B0764] dark:text-purple-400 tracking-tighter uppercase">{formatNaira(state.fuelPricePerLiter)}/L</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <Banknote className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Spent</p>
                                    <h4 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">{formatNaira(state.totalCostThisMonth)}</h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Efficiency</p>
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                                    <TrendingDown className="w-3 h-3" />
                                    -12% Vol
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#F5F5F0] dark:bg-white/5 rounded-3xl p-5 border border-black/5 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-2xl bg-white/50 dark:bg-white/10 flex items-center justify-center">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Fuel Consumed</span>
                            </div>
                            <span className="text-lg font-black text-[#1A1A1A] dark:text-white">{state.totalLitersThisMonth.toFixed(1)}<small className="ml-1 opacity-30">Liters</small></span>
                        </div>
                    </div>
                </div>

                {/* 5. Recent Sessions */}
                {state.sessions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">Session History</h3>
                             <History className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="space-y-3">
                            {state.sessions.slice(0, 5).map((session) => {
                                const duration = session.endTime
                                    ? ((session.endTime - session.startTime) / (1000 * 60 * 60)).toFixed(1)
                                    : '?';
                                return (
                                    <motion.div 
                                        key={session.id}
                                        whileHover={{ x: 4 }}
                                        className="bg-white dark:bg-[#1A1A1A] p-5 rounded-[32px] border border-[#3B0764]/5 dark:border-white/5 flex items-center justify-between shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-[#3B0764]/5 dark:bg-white/5 flex items-center justify-center">
                                                <Timer className="w-5 h-5 text-[#3B0764] dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#1A1A1A] dark:text-white uppercase tracking-tight">{new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{duration}h duration • {session.fuelUsed.toFixed(1)}L</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-[#3B0764] dark:text-purple-400">{formatNaira(session.cost)}</p>
                                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Charged</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* MODALS */}
            <AnimatePresence>
                {/* 1. Generator Presets Modal */}
                {showPresets && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 sm:px-0">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPresets(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-xl bg-white dark:bg-[#1A1A1A] rounded-t-[48px] p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-2 text-center uppercase tracking-tighter">Choose Your Unit</h2>
                            <p className="text-sm text-gray-400 text-center mb-8 font-medium">Select a preset to auto-calibrate your monitor.</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {PRESETS.map((preset) => (
                                    <button 
                                        key={preset.name}
                                        onClick={() => selectPreset(preset)}
                                        className={`group relative flex items-center gap-6 p-6 rounded-[32px] border-2 transition-all active:scale-[0.98] ${
                                            state.presetName === preset.name 
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-[#3B0764] dark:border-purple-600' 
                                            : 'bg-[#F5F5F0] dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                                        }`}
                                    >
                                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-black/20 flex items-center justify-center p-2 shadow-inner border border-black/5 dark:border-white/5 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                                            <img src={preset.image} alt={preset.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-lg text-[#1A1A1A] dark:text-white tracking-tight">{preset.name}</h3>
                                                <span className="text-lg">{preset.icon}</span>
                                            </div>
                                            {preset.capacity > 0 && (
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{preset.capacity}L Tank • {preset.burnRate} L/hr Rate</p>
                                            )}
                                        </div>
                                        {state.presetName === preset.name && (
                                            <CheckCircle2 className="w-8 h-8 text-[#3B0764] dark:text-purple-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 2. Custom Generator Modal */}
                {showCustomGen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowCustomGen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-[40px] p-8 shadow-2xl overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B0764]/5 rounded-full -mr-16 -mt-16" />
                             <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white mb-8 uppercase tracking-widest text-center">Unit Calibration</h3>
                             
                             <div className="space-y-6 relative">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tank Capacity (Liters)</label>
                                    <input 
                                        type="number" 
                                        value={customCapacity}
                                        onChange={(e) => setCustomCapacity(e.target.value)}
                                        className="w-full bg-[#F5F5F0] dark:bg-white/5 border-2 border-transparent rounded-2xl p-4 text-center font-black focus:border-[#3B0764]/20 transition-all"
                                        placeholder="e.g. 100"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Burn Rate (L/Hour)</label>
                                    <input 
                                        type="number" 
                                        value={customBurnRate}
                                        onChange={(e) => setCustomBurnRate(e.target.value)}
                                        className="w-full bg-[#F5F5F0] dark:bg-white/5 border-2 border-transparent rounded-2xl p-4 text-center font-black focus:border-[#3B0764]/20 transition-all"
                                        placeholder="e.g. 5.0"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowCustomGen(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 transition-colors">Abort</button>
                                    <button onClick={saveCustomGenerator} className="flex-1 bg-[#3B0764] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all">Save Config</button>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                )}

                {/* 3. Settings Sidebar/Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-[44px] p-8 shadow-2xl">
                             <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white uppercase tracking-tight">System Settings</h3>
                                <XCircle onClick={() => setShowSettings(false)} className="w-6 h-6 text-gray-300 cursor-pointer" />
                             </div>

                             <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Fuel Price (₦/L)</label>
                                    <div className="flex gap-3">
                                        <input 
                                            type="number" 
                                            value={tempPrice}
                                            onChange={(e) => setTempPrice(e.target.value)}
                                            className="flex-1 bg-[#F5F5F0] dark:bg-white/5 border-0 rounded-2xl p-4 font-black"
                                            placeholder={state.fuelPricePerLiter.toString()}
                                        />
                                        <button onClick={updateFuelPrice} className="bg-[#3B0764] text-white px-6 rounded-2xl font-black text-xs">SET</button>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                                    <button 
                                        onClick={resetGeneratorData}
                                        className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                        </div>
                                        <span className="font-black text-red-600 text-xs uppercase tracking-widest">Hard Reset Data</span>
                                    </button>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
