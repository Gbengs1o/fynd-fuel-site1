'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, MapPin, Building2, LocateFixed } from 'lucide-react';

export default function SubmitStationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        latitude: '',
        longitude: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
            },
            () => alert('Unable to retrieve your location')
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.latitude || !formData.longitude) {
            alert('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('stations').insert({
                name: formData.name,
                brand: formData.brand || null,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                status: 'Available' // Default status
            });

            if (error) throw error;

            alert('New station has been added successfully!');
            router.back();
        } catch (error: any) {
            console.error('Error adding station:', error);
            alert(`Failed to add station: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#121212]">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#3B0764]/10 dark:border-white/10 px-4 py-3">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>
                    <h1 className="text-lg font-bold text-[#1A1A1A] dark:text-white">Suggest Station</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#3B0764]" />
                                Station Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Conoil - Garki"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-[#3B0764] focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#3B0764]" opacity={0.5} />
                                Brand <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                name="brand"
                                placeholder="e.g. Conoil"
                                value={formData.brand}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-[#3B0764] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#3B0764]" />
                                Location Coordinates <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                className="text-xs font-bold text-[#3B0764] bg-[#3B0764]/10 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-[#3B0764]/20 transition-colors"
                            >
                                <LocateFixed className="w-3 h-3" />
                                Use Current
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <input
                                    type="number"
                                    name="latitude"
                                    step="any"
                                    placeholder="Latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-[#3B0764] focus:border-transparent outline-none transition-all"
                                />
                                <span className="text-[10px] text-gray-400 pl-1">Latitude</span>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="number"
                                    name="longitude"
                                    step="any"
                                    placeholder="Longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-white focus:ring-2 focus:ring-[#3B0764] focus:border-transparent outline-none transition-all"
                                />
                                <span className="text-[10px] text-gray-400 pl-1">Longitude</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#3B0764] text-white font-bold text-lg rounded-2xl py-4 shadow-lg hover:bg-[#4C0D8C] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Suggest Station
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
