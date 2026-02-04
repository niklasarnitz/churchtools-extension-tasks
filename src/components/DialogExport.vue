<script setup lang="ts">
import { Button, Checkbox, DialogLarge, SelectDropdown } from '@churchtools/styleguide';
import { computed, ref } from 'vue';
import { useTasks } from '../composables/useTasks';

const props = defineProps<{
    projectId: number;
}>();

const emit = defineEmits<{
    (event: 'close'): void;
}>();

const { tasks } = useTasks(props.projectId);

const exportFormat = ref<'csv' | 'json'>('csv');
const includeCompleted = ref(true);
const includeTags = ref(true);
const includeAssignees = ref(true);
const archiveAfterExport = ref(false);

const visibleTasks = computed(() => {
    return includeCompleted.value ? tasks.value : tasks.value.filter(t => !t.fullfilled);
});

const exportAsCSV = () => {
    const headers = ['Name', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Tags'];
    const rows = visibleTasks.value.map(task => [
        task.name,
        task.status || 'open',
        task.priority || 'low',
        task.dueDate || '',
        task.assignedTo?.length ? task.assignedTo.join(', ') : '',
        task.tags?.length ? task.tags.join(', ') : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    downloadFile(csv, 'tasks-export.csv', 'text/csv');
};

const exportAsJSON = () => {
    const data = visibleTasks.value.map(task => ({
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        tags: task.tags,
        checklist: task.checklist,
        timeEstimate: task.timeEstimate,
    }));

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'tasks-export.json', 'application/json');
};

const downloadFile = (content: string, filename: string, type: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

const onExport = () => {
    if (exportFormat.value === 'csv') {
        exportAsCSV();
    } else {
        exportAsJSON();
    }
    emit('close');
};
</script>

<template>
    <DialogLarge title="Tasks exportieren" @close="$emit('close')">
        <div class="flex flex-col gap-4">
            <SelectDropdown
                v-model="exportFormat"
                :emit-id="true"
                label="Export-Format"
                :options="[
                    { id: 'csv', label: 'CSV (Excel)' },
                    { id: 'json', label: 'JSON' },
                ]"
            />

            <div class="border-t pt-4">
                <h3 class="mb-3 font-bold">Optionen</h3>
                <Checkbox v-model="includeCompleted" label="Erledigte Aufgaben einschließen" />
                <Checkbox v-model="includeTags" label="Tags einschließen" />
                <Checkbox v-model="includeAssignees" label="Zuweisungen einschließen" />
                <Checkbox
                    v-model="archiveAfterExport"
                    disabled
                    label="Nach Export archivieren"
                    title="Diese Funktion wird in einer zukünftigen Version verfügbar sein"
                />
            </div>

            <div class="rounded border border-blue-200 bg-blue-50 p-3">
                <p class="text-sm text-blue-800">
                    {{ visibleTasks.length }} Task{{ visibleTasks.length === 1 ? '' : 's' }} werden exportiert
                </p>
            </div>

            <div class="flex justify-end gap-2">
                <Button color="basic" outlined @click="$emit('close')">Abbrechen</Button>
                <Button color="green" @click="onExport">Exportieren</Button>
            </div>
        </div>
    </DialogLarge>
</template>
