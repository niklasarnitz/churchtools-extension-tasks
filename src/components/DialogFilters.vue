<script setup lang="ts">
import { Button, Checkbox, DialogLarge, Input, SelectDropdown } from '@churchtools/styleguide';
import { computed, ref } from 'vue';
import { useFilterStore, type SavedFilter } from '../composables/storeFilters';
import { useTags } from '../composables/useTags';
import { getPriorityOptionsWithTranslations, getStatusOptionsWithTranslations } from '../constants/taskConfig';

const props = defineProps<{
    projectId: number;
}>();

const emit = defineEmits<{
    (event: 'close'): void;
    (event: 'apply-filter', filter: SavedFilter): void;
}>();

const filterStore = useFilterStore();
const { tagsArray } = useTags(props.projectId);

const filterName = ref('');
const selectedFilters = ref({
    status: undefined as string | undefined,
    priority: undefined as string | undefined,
    tags: [] as number[],
    assignedToMe: false,
    dueDateRange: undefined as { from?: string; to?: string } | undefined,
});

const statusOptions = getStatusOptionsWithTranslations();

const priorityOptions = getPriorityOptionsWithTranslations();

const projectFilters = computed(() => filterStore.getFiltersByProject(props.projectId));

const saveFilter = () => {
    if (!filterName.value) {
        return;
    }

    filterStore.addFilter({
        name: filterName.value,
        projectId: props.projectId,
        status: selectedFilters.value.status,
        priority: selectedFilters.value.priority,
        tags: selectedFilters.value.tags,
        dateRange: selectedFilters.value.dueDateRange,
    });

    filterName.value = '';
    selectedFilters.value = {
        status: undefined,
        priority: undefined,
        tags: [],
        assignedToMe: false,
        dueDateRange: undefined,
    };
};

const applyFilter = (filter: SavedFilter) => {
    emit('apply-filter', filter);
    emit('close');
};

const deleteFilter = (id: number) => {
    filterStore.deleteFilter(id);
};
</script>

<template>
    <DialogLarge title="Filter verwalten" @close="$emit('close')">
        <div class="flex flex-col gap-4">
            <div class="border-b pb-4">
                <h3 class="mb-3 font-bold">Neuen Filter speichern</h3>
                <Input v-model="filterName" label="Filter-Name" placeholder="z.B. 'Hochprioritäts-Tasks'" />

                <div class="mt-4 space-y-3">
                    <SelectDropdown
                        v-model="selectedFilters.status"
                        :emit-id="true"
                        label="Status"
                        :multiple="false"
                        :options="statusOptions"
                    />
                    <SelectDropdown
                        v-model="selectedFilters.priority"
                        :emit-id="true"
                        label="Priorität"
                        :multiple="false"
                        :options="priorityOptions"
                    />
                    <SelectDropdown
                        v-model="selectedFilters.tags"
                        :emit-id="true"
                        label="Tags"
                        :multiple="true"
                        :options="tagsArray"
                    />
                    <Checkbox v-model="selectedFilters.assignedToMe" label="Nur mir zugewiesen" />
                </div>

                <Button class="mt-4 w-full" color="green" @click="saveFilter">Filter speichern</Button>
            </div>

            <div v-if="projectFilters.value.length > 0">
                <h3 class="mb-3 font-bold">Gespeicherte Filter</h3>
                <div class="space-y-2">
                    <div
                        v-for="filter in projectFilters.value"
                        :key="filter.id"
                        class="flex items-center justify-between rounded border bg-gray-50 p-3"
                    >
                        <div>
                            <div class="font-bold">{{ filter.name }}</div>
                            <div class="text-sm text-gray-500">
                                <span v-if="filter.status" class="mr-2">Status: {{ filter.status }}</span>
                                <span v-if="filter.priority" class="mr-2">Priorität: {{ filter.priority }}</span>
                                <span v-if="filter.tags?.length">Tags: {{ filter.tags.length }}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button color="blue" outlined size="S" @click="applyFilter(filter)"> Anwenden </Button>
                            <Button
                                color="red"
                                icon="fas fa-trash"
                                outlined
                                size="S"
                                @click="deleteFilter(filter.id)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="py-4 text-center text-gray-400">Keine gespeicherten Filter</div>
        </div>
    </DialogLarge>
</template>
