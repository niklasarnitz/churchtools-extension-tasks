<script setup lang="ts">
import { DialogSmall, SelectDropdown } from '@churchtools/styleguide';
import { t, useToasts } from '@churchtools/utils';
import { computed, ref } from 'vue';
import useProjects from '../project/useProjects';

const props = defineProps<{
    task: TransformedTask;
    currentProjectId: number;
}>();
const emit = defineEmits<{ (event: 'close'): void; (event: 'moved', projectId: number): void }>();

const { projects } = useProjects();
const { successToast } = useToasts();

const availableProjects = computed(() =>
    projects.value
        .filter(p => p.id !== props.currentProjectId)
        .map(p => ({
            id: p.id,
            label: p.name,
            icon: p.icon,
            color: p.color,
        })),
);

const selectedProjectId = ref<number>();

const onSave = async (close: () => void) => {
    if (selectedProjectId.value) {
        emit('moved', selectedProjectId.value);
        successToast(t('actions.save.success'));
        close();
    }
};
</script>
<template>
    <DialogSmall title="Aufgabe in anderes Projekt verschieben" @close="emit('close')" @save="onSave">
        <div class="flex flex-col gap-4">
            <div class="rounded bg-gray-50 p-3">
                <div class="text-sm font-medium text-gray-600">Aufgabe</div>
                <div class="font-semibold">{{ task.name }}</div>
            </div>
            <SelectDropdown
                v-model="selectedProjectId"
                :clear="false"
                emit-id
                label="Ziel-Projekt"
                :options="availableProjects"
                placeholder="Projekt auswählen..."
            />
        </div>
    </DialogSmall>
</template>
