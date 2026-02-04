<script setup lang="ts">
import { Button, DialogLarge } from '@churchtools/styleguide';
import { computed, toRef } from 'vue';
import { useLists } from '../composables/useLists';

const props = defineProps<{
    projectId: number;
}>();
const emit = defineEmits<{ (event: 'close'): void }>();

const { lists, updateList } = useLists(toRef(() => props.projectId));

const allShowSubTasks = computed(() => lists.value.every(l => l.showSubTasks));
const allShowCompleted = computed(() => lists.value.every(l => l.showCompleted));

const someShowSubTasks = computed(() => lists.value.some(l => l.showSubTasks) && !allShowSubTasks.value);
const someShowCompleted = computed(() => lists.value.some(l => l.showCompleted) && !allShowCompleted.value);

const toggleAllSubTasks = () => {
    const newValue = !allShowSubTasks.value;
    lists.value.forEach(list => {
        updateList({ ...list, showSubTasks: newValue });
    });
};

const toggleAllCompleted = () => {
    const newValue = !allShowCompleted.value;
    lists.value.forEach(list => {
        updateList({ ...list, showCompleted: newValue });
    });
};

const onSave = (close: () => void) => {
    close();
};
</script>
<template>
    <DialogLarge context="Board-Einstellungen" @close="emit('close')" @save="onSave">
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-3">
                <h3 class="text-lg font-semibold">Anzeigeoptionen für alle Listen</h3>
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="flex items-center gap-3">
                        <i
                            class="text-xl"
                            :class="
                                allShowSubTasks
                                    ? 'fas fa-toggle-on text-green-500'
                                    : someShowSubTasks
                                      ? 'fas fa-toggle-on text-gray-400'
                                      : 'fas fa-toggle-off text-gray-400'
                            "
                        ></i>
                        <span class="font-medium">Unteraufgaben anzeigen</span>
                    </div>
                    <Button color="basic" outlined @click="toggleAllSubTasks">
                        {{ allShowSubTasks ? 'Alle ausblenden' : 'Alle einblenden' }}
                    </Button>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="flex items-center gap-3">
                        <i
                            class="text-xl"
                            :class="
                                allShowCompleted
                                    ? 'fas fa-toggle-on text-green-500'
                                    : someShowCompleted
                                      ? 'fas fa-toggle-on text-gray-400'
                                      : 'fas fa-toggle-off text-gray-400'
                            "
                        ></i>
                        <span class="font-medium">Erledigte Aufgaben anzeigen</span>
                    </div>
                    <Button color="basic" outlined @click="toggleAllCompleted">
                        {{ allShowCompleted ? 'Alle ausblenden' : 'Alle einblenden' }}
                    </Button>
                </div>
            </div>
        </div>
    </DialogLarge>
</template>
