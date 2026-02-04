<script setup lang="ts">
import { Button, Input } from '@churchtools/styleguide';
import { computed, ref } from 'vue';

const props = defineProps<{
    task: TransformedTask;
}>();

const emit = defineEmits<{
    (event: 'update:task', task: TransformedTask): void;
}>();

const newChecklistItem = ref('');
const timeEstimate = ref(props.task.timeEstimate || 0);
const timeSpent = ref(props.task.timeSpent || 0);

const checklist = computed({
    get: () => props.task.checklist || [],
    set: value => {
        emit('update:task', { ...props.task, checklist: value });
    },
});

const addChecklistItem = () => {
    if (newChecklistItem.value.trim()) {
        const newItem: ChecklistItem = {
            id: `${Date.now()}`,
            title: newChecklistItem.value,
            completed: false,
        };
        checklist.value = [...checklist.value, newItem];
        newChecklistItem.value = '';
    }
};

const toggleChecklistItem = (id: string) => {
    checklist.value = checklist.value.map(item => (item.id === id ? { ...item, completed: !item.completed } : item));
};

const deleteChecklistItem = (id: string) => {
    checklist.value = checklist.value.filter(item => item.id !== id);
};

const updateTimeEstimate = (value: number) => {
    timeEstimate.value = value;
    emit('update:task', { ...props.task, timeEstimate: value });
};

const updateTimeSpent = (value: number) => {
    timeSpent.value = value;
    emit('update:task', { ...props.task, timeSpent: value });
};

const completionPercentage = computed(() => {
    if (checklist.value.length === 0) return 0;
    const completed = checklist.value.filter(item => item.completed).length;
    return Math.round((completed / checklist.value.length) * 100);
});
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Checklist Section -->
        <div class="border-t pt-4">
            <h3 class="mb-3 text-lg font-bold">Checkliste</h3>
            <div v-if="checklist.length > 0" class="mb-4">
                <div class="mb-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                        class="h-2 rounded-full bg-green-500 transition-all"
                        :style="{ width: `${completionPercentage}%` }"
                    ></div>
                </div>
                <p class="text-sm text-gray-600">{{ completionPercentage }}% abgeschlossen</p>
            </div>

            <div class="mb-3 space-y-2">
                <div
                    v-for="item in checklist"
                    :key="item.id"
                    class="flex items-center gap-2 rounded p-2 hover:bg-gray-50"
                >
                    <input
                        :checked="item.completed"
                        class="h-4 w-4"
                        type="checkbox"
                        @change="toggleChecklistItem(item.id)"
                    />
                    <span :class="{ 'text-gray-400 line-through': item.completed }">
                        {{ item.title }}
                    </span>
                    <button
                        class="ml-auto text-sm text-red-500 hover:text-red-700"
                        @click="deleteChecklistItem(item.id)"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="flex gap-2">
                <Input
                    v-model="newChecklistItem"
                    placeholder="Neues Listenelemt..."
                    :show-label="false"
                    @keyup.enter="addChecklistItem"
                />
                <Button color="green" icon="fas fa-plus" @click="addChecklistItem" />
            </div>
        </div>

        <!-- Time Tracking Section -->
        <div class="border-t pt-4">
            <h3 class="mb-3 text-lg font-bold">Zeitaufwand</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="mb-1 block text-sm font-bold">Geschätzter Aufwand (Stunden)</label>
                    <Input
                        :model-value="timeEstimate"
                        placeholder="0"
                        :show-label="false"
                        type="number"
                        @update:model-value="updateTimeEstimate"
                    />
                </div>
                <div>
                    <label class="mb-1 block text-sm font-bold">Zeitaufwand (Stunden)</label>
                    <Input
                        :model-value="timeSpent"
                        placeholder="0"
                        :show-label="false"
                        type="number"
                        @update:model-value="updateTimeSpent"
                    />
                </div>
            </div>
            <div v-if="timeSpent > 0 && timeEstimate > 0" class="mt-3 text-sm">
                <p class="text-gray-600">
                    Verbrauchte Zeit:
                    <span class="font-bold" :class="{ 'text-red-500': timeSpent > timeEstimate }">
                        {{ timeSpent }} / {{ timeEstimate }} Stunden
                    </span>
                </p>
            </div>
        </div>
    </div>
</template>
