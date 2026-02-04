import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface SavedFilter {
    id: number;
    name: string;
    projectId: number;
    status?: string;
    priority?: string;
    assignedTo?: number[];
    tags?: number[];
    sortBy?: string;
    dateRange?: {
        from?: string;
        to?: string;
    };
}

export const useFilterStore = defineStore('filters', () => {
    const filters = ref<SavedFilter[]>([]);
    let nextId = 1;

    const addFilter = (filter: Omit<SavedFilter, 'id'>) => {
        const newFilter: SavedFilter = {
            ...filter,
            id: nextId++,
        };
        filters.value.push(newFilter);
        return newFilter;
    };

    const updateFilter = (id: number, updates: Partial<SavedFilter>) => {
        const index = filters.value.findIndex(f => f.id === id);
        if (index >= 0) {
            filters.value[index] = { ...filters.value[index], ...updates };
        }
    };

    const deleteFilter = (id: number) => {
        filters.value = filters.value.filter(f => f.id !== id);
    };

    const getFiltersByProject = (projectId: number) => {
        return computed(() => filters.value.filter(f => f.projectId === projectId));
    };

    return {
        filters,
        addFilter,
        updateFilter,
        deleteFilter,
        getFiltersByProject,
    };
});
