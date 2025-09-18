<script setup lang="ts">
import { Button, DropdownMenu, LoadingMessage, PageHeader, Subgrid } from '@churchtools/styleguide';
import { ADD_ICON, DELETE_ICON, EDIT_ICON } from '@churchtools/utils';
import { computed, toRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ICONS } from '../utils/utils';
import { createOrEditProject } from './projectHelper';
import { useProject } from './useProject';

const props = defineProps<{ projectId: string }>();
defineEmits<{ (event: 'edit-project', project: Project): void }>();

const route = useRoute();
const router = useRouter();

const { project, deleteProject } = useProject(toRef(() => parseInt(props.projectId)));
const projectContextMenu = computed(() => {
    return [
        {
            items: [
                {
                    icon: EDIT_ICON,
                    nameTranslated: 'Bearbeiten',
                    callback: () => createOrEditProject(project.value ?? undefined),
                },
                {
                    icon: { icon: DELETE_ICON, class: 'text-error-bright' },
                    nameTranslated: 'Löschen',
                    callback: async () => {
                        await deleteProject();
                        router.push({ name: 'overview' });
                    },
                },
            ],
        },
    ];
});
</script>
<template>
    <Subgrid class="grow">
        <LoadingMessage v-if="!project" />
        <div v-else class="flex grow flex-col">
            <PageHeader
                :actions="[
                    {
                        icon: ADD_ICON,
                        label: 'Aufgabe erstellen',
                        color: 'green',
                        to: { ...route, params: { ...route.params, taskId: 'new' } },
                    },
                ]"
                :breadcrumbs="[
                    { title: 'Projekte', to: { name: 'overview' } },
                    { title: project.name ?? '...', to: { name: 'project', params: { projectId: project.id } } },
                ]"
                class="pt-page-header-full-width mb-page-header-full-width mx-4 lg:mx-6"
                :color="project.color ?? 'basic'"
                :description="project.description"
                :icon="project.icon ?? ICONS.DEFAULT_PROJECT"
                :title="project.name"
            >
                <template #title-after>
                    <DropdownMenu :menu-items="projectContextMenu">
                        <Button color="basic" icon="fas fa-ellipsis" size="S" text />
                    </DropdownMenu>
                </template>
            </PageHeader>

            <RouterView />
        </div>
    </Subgrid>
</template>
