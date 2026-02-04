<script setup lang="ts">
import { DialogLarge, Input, SelectDropdown, Textarea } from '@churchtools/styleguide';
import { useColors } from '@churchtools/utils';
import { useLazyQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, ref } from 'vue';
import { txx } from '../utils/utils';
import useProjects from './useProjects';

const props = defineProps<{ project?: Project }>();
const emit = defineEmits<{ (event: 'close'): void }>();

const proj = ref({ ...(props.project ?? ({} as Project)) });
const isSaving = ref(false);

const { ctColors } = useColors();
const colors = computed(() =>
    ctColors.map(c => ({ id: c.key, label: c.label ?? c.name ?? c.key, color: c, icon: 'fas fa-circle' })),
);

const { createProject, updateProject } = useProjects();
const onSave = async (close: () => void) => {
    if (!proj.value?.name || isSaving.value) {
        return;
    }
    isSaving.value = true;
    await (props.project?.id ? updateProject : createProject)(proj.value);
    isSaving.value = false;
    close();
};

const CHARACTERS_QUERY = gql`
    query getIcons($query: String!) {
        search(version: "7.x", query: $query) {
            id
            label
            familyStylesByLicense {
                free {
                    family
                    style
                }
            }
        }
    }
`;
type FASearchResult = {
    id: string;
    label: string;
    familyStylesByLicense: { free: { family: string; style: string }[] };
};
const { load, variables, result, loading } = useLazyQuery<{
    search: FASearchResult[];
}>(CHARACTERS_QUERY, { query: '' });
const iconSearchQuery = ref('');
const defaultIcons = [
    { id: 'fas fa-folder', label: 'Folder', icon: 'fas fa-folder' },
    { id: 'fas fa-tasks', label: 'Tasks', icon: 'fas fa-tasks' },
    { id: 'fas fa-list-check', label: 'List', icon: 'fas fa-list-check' },
    { id: 'fas fa-clipboard-check', label: 'Clipboard', icon: 'fas fa-clipboard-check' },
    { id: 'fas fa-bullseye', label: 'Target', icon: 'fas fa-bullseye' },
];
const iconOptions = computed(() => {
    if (!iconSearchQuery.value) {
        return defaultIcons;
    }
    return (result?.value?.search ?? [])
        .filter(s => s.familyStylesByLicense.free.some(i => i.style === 'solid'))
        .map(s => ({ id: `fas fa-${s.id}`, label: s.label, icon: `fas fa-${s.id}` }));
});
const onSearchForIcon = (query: string) => {
    iconSearchQuery.value = query.trim();
    if (iconSearchQuery.value.length < 2) {
        return Promise.resolve();
    }
    variables.value = { query: iconSearchQuery.value };
    load();
    return Promise.resolve();
};
</script>
<template>
    <DialogLarge
        :button="{
            label: project ? txx('Speichern') : txx('Erstellen'),
            disabled: !proj.name || isSaving,
            loading: isSaving,
        }"
        :context="txx('Aufgabenverwaltung')"
        :title="project ? txx('Projekt bearbeiten') : txx('Neues Projekt erstellen')"
        @close="emit('close')"
        @save="onSave"
    >
        <div class="flex flex-col gap-4">
            <Input v-model="proj.name" label="Name" :max-length="100" />
            <Textarea v-model="proj.description" label="Beschreibung" :max-length="300" />
            <SelectDropdown
                v-model="proj.icon"
                emit-id
                label="Icon"
                :loading="loading"
                note="Nach englischen Bezeichnungen suchen"
                :options="iconOptions"
                :search-function="onSearchForIcon"
            />
            <SelectDropdown v-model="proj.color" emit-id label="Farbe" :options="colors" />
        </div>
    </DialogLarge>
</template>
