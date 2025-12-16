import { create } from 'zustand';

interface PriceRange {
    min: string;
    max: string;
}

interface LocationFilter {
    name: string;
    latitude: number;
    longitude: number;
}

interface FilterState {
    filters: {
        fuelType: string | null;
        priceRange: PriceRange;
        rating: number;
        amenities: string[];
        sortBy: 'distance' | 'price' | 'last_update';
    };
    location: LocationFilter | null;
    setFilters: (filters: Partial<FilterState['filters']>) => void;
    setLocation: (location: LocationFilter | null) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    filters: {
        fuelType: null,
        priceRange: { min: '', max: '' },
        rating: 0,
        amenities: [],
        sortBy: 'distance'
    },
    location: null,
    setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
    setLocation: (location) => set({ location }),
    resetFilters: () =>
        set({
            filters: {
                fuelType: null,
                priceRange: { min: '', max: '' },
                rating: 0,
                amenities: [],
                sortBy: 'distance'
            }
        })
}));
