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

const proj = ref(props.project ?? ({} as Project));

const { ctColors } = useColors();
const colors = computed(() => ctColors.map(c => ({ id: c.key, label: c.key, color: c, icon: 'fas fa-circle' })));

const { createProject, updateProject } = useProjects();
const onSave = (close: () => void) => {
    (props.project?.id ? updateProject : createProject)(proj.value);
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
const { load, variables, result } = useLazyQuery<{
    search: FASearchResult[];
}>(CHARACTERS_QUERY, { query: '' });
const onSearchForIcon = (query: string) => {
    variables.value = { query };
    load();
    return Promise.resolve();
};
</script>
<template>
    <DialogLarge
        :context="txx('Aufgabenverwaltung')"
        :title="txx('Neues Projekt erstellen')"
        @close="emit('close')"
        @save="onSave"
    >
        <div class="flex flex-col gap-4">
            <Input v-model="proj.name" label="Name" />
            <Textarea v-model="proj.description" label="Beschreibung" />
            <SelectDropdown
                v-model="proj.icon"
                emit-id
                label="Icon"
                note="Nach englischen Bezeichnungen suchen"
                :options="
                    (result?.search ?? [])
                        .filter(s => s.familyStylesByLicense.free.filter(i => i.style === 'solid').length)
                        .map(s => ({ id: `fas fa-${s.id}`, label: s.label, icon: `fas fa-${s.id}` }))
                "
                :search-function="onSearchForIcon"
            />
            <SelectDropdown v-model="proj.color" emit-id label="Farbe" :options="colors" />
        </div>
    </DialogLarge>
</template>
