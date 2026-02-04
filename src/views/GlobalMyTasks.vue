<script setup lang="ts">
import { Button, Input, PageHeader, Subgrid } from '@churchtools/styleguide';
import { useCurrentUser } from '@churchtools/utils';
import { computed, ref, watch } from 'vue';
import { taskStore } from '../composables/storeTasks';
import useProjects from '../project/useProjects';
import GlobalMyTasksProjectGroup from './GlobalMyTasksProjectGroup.vue';

const currentUser = useCurrentUser();
const store = taskStore();
const { projects } = useProjects();

const toggleShowCompleted = () => {
    store.showFullfilled = !store.showFullfilled;
};
const toggleShowSubTasks = () => {
    store.showSubTasks = !store.showSubTasks;
};

const projectCounts = ref<Record<number, number>>({});
const onCount = ({ projectId, count }: { projectId: number; count: number }) => {
    projectCounts.value = { ...projectCounts.value, [projectId]: count };
};

watch(
    projects,
    value => {
        const nextCounts: Record<number, number> = {};
        value.forEach(project => {
            if (projectCounts.value[project.id]) {
                nextCounts[project.id] = projectCounts.value[project.id];
            }
        });
        projectCounts.value = nextCounts;
    },
    { immediate: true },
);

const totalTasks = computed(() => Object.values(projectCounts.value).reduce((sum, count) => sum + count, 0));
</script>

<template>
    <Subgrid class="grow">
        <div class="flex grow flex-col">
            <PageHeader
                :breadcrumbs="[{ title: 'Meine Aufgaben (Alle Projekte)', to: { name: 'overview' } }]"
                class="pt-page-header-full-width mb-page-header-full-width mx-4 lg:mx-6"
                color="basic"
                description="Alle dir zugewiesenen Aufgaben aus allen Projekten"
                icon="fas fa-tasks"
                title="Meine Aufgaben"
            />

            <div class="flex flex-col gap-4 p-4 lg:p-6">
                <div class="mb-4 flex gap-2">
                    <Input
                        v-model="store.search"
                        class="flex-grow"
                        clear
                        label="Suche"
                        placeholder="Suchen"
                        :show-label="false"
                    />
                    <Button
                        :color="store.showFullfilled ? 'green' : 'basic'"
                        :icon="store.showFullfilled ? 'fas fa-check-square' : 'far fa-square'"
                        outlined
                        :title="store.showFullfilled ? 'Erledigte Aufgaben ausblenden' : 'Erledigte Aufgaben anzeigen'"
                        @click="toggleShowCompleted"
                    />
                    <Button
                        :color="store.showSubTasks ? 'green' : 'basic'"
                        icon="fas fa-sitemap"
                        outlined
                        :title="store.showSubTasks ? 'Unteraufgaben ausblenden' : 'Unteraufgaben anzeigen'"
                        @click="toggleShowSubTasks"
                    />
                </div>

                <div v-if="totalTasks === 0" class="py-8 text-center text-gray-400">
                    <i class="fas fa-inbox mb-4 block text-4xl"></i>
                    <p>Keine Aufgaben zugewiesen</p>
                </div>

                <template v-else>
                    <GlobalMyTasksProjectGroup
                        v-for="project in projects"
                        :key="project.id"
                        :current-user-id="currentUser.id"
                        :project="project"
                        @count="onCount"
                    />
                </template>
            </div>
        </div>
    </Subgrid>
</template>
