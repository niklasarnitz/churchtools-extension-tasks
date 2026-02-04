<script setup lang="ts">
import { Button, Input } from '@churchtools/styleguide';
import { getFirstOrSelf } from '@churchtools/utils';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import DialogBoardSettings from '../../components/DialogBoardSettings.vue';
import DialogExport from '../../components/DialogExport.vue';
import DialogFilters from '../../components/DialogFilters.vue';
import DialogList from '../../components/DialogList.vue';
import DialogTask from '../../components/taskDialog/DialogTask.vue';
import { taskStore } from '../../composables/storeTasks';

const props = withDefaults(
    defineProps<{
        subTaskToggle?: boolean;
        projectId: number;
    }>(),
    { subTaskToggle: true },
);

const fullscreen = ref(false);
const onFullscreen = () => {
    fullscreen.value = !fullscreen.value;
};

const boardSettingsIsOpen = ref(false);
const openBoardSettings = () => {
    boardSettingsIsOpen.value = true;
};
const filtersIsOpen = ref(false);
const openFilters = () => {
    filtersIsOpen.value = true;
};
const exportIsOpen = ref(false);
const openExport = () => {
    exportIsOpen.value = true;
};
const store = taskStore();
const listIsOpen = ref(false);

const toggleShowCompleted = () => {
    store.showFullfilled = !store.showFullfilled;
};
const toggleShowSubTasks = () => {
    store.showSubTasks = !store.showSubTasks;
};

const route = useRoute();
const taskIsOpen = computed(() => !!getFirstOrSelf(route.params.taskId));
</script>
<template>
    <div
        class="flex w-full flex-grow flex-col"
        :class="{ 'fixed top-0 left-0 z-[2000] h-screen w-screen bg-gray-100': fullscreen }"
    >
        <div class="w-full items-center border-b border-solid border-gray-300 px-4 lg:px-6">
            <div class="flex gap-2 py-4">
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
                <slot name="actions">
                    <Button
                        v-if="$route.name === 'project-board'"
                        icon="fas fa-plus"
                        outlined
                        @click="listIsOpen = true"
                    />
                    <Button color="basic" icon="fas fa-filter" outlined title="Filter" @click="openFilters" />
                    <Button color="basic" icon="fas fa-download" outlined title="Exportieren" @click="openExport" />
                    <Button color="basic" icon="fas fa-cog" outlined @click="openBoardSettings" />
                    <Button
                        color="basic"
                        :icon="fullscreen ? 'fas fa-compress' : 'fas fa-expand'"
                        outlined
                        @click="onFullscreen"
                    />
                </slot>
            </div>
            <div class="flex justify-between">
                <div class="tabs flex gap-1">
                    <RouterLink :to="{ name: 'my-tasks' }">Meine Aufgaben</RouterLink>
                    <RouterLink :to="{ name: 'project-board' }">Board</RouterLink>
                    <RouterLink :to="{ name: 'project-status' }">Status</RouterLink>
                    <RouterLink :to="{ name: 'project-priority' }">Priorität</RouterLink>
                    <RouterLink :to="{ name: 'project-list' }">Liste</RouterLink>
                    <RouterLink :to="{ name: 'project-tags' }">Tags</RouterLink>
                    <RouterLink :to="{ name: 'project-tasks' }">Aufgaben</RouterLink>
                </div>
                <div class="flex gap-4"></div>
            </div>
        </div>
        <div class="max-w-full grow overflow-x-auto p-4 lg:p-6">
            <div class="flex h-full gap-4">
                <slot></slot>
            </div>
        </div>
        <DialogTask v-if="taskIsOpen" :project-id="projectId" :task-id="getFirstOrSelf(route.params.taskId)" />
        <DialogList v-if="listIsOpen" :project-id="projectId" @close="listIsOpen = false" />
        <DialogFilters v-if="filtersIsOpen" :project-id="projectId" @close="filtersIsOpen = false" />
        <DialogExport v-if="exportIsOpen" :project-id="projectId" @close="exportIsOpen = false" />
        <DialogBoardSettings
            v-if="boardSettingsIsOpen"
            :project-id="props.projectId"
            @close="boardSettingsIsOpen = false"
        />
    </div>
</template>
<style scoped>
@reference '@churchtools/styleguide/tailwind';
.tabs a {
    padding: 8px 12px;
    @apply rounded-t bg-gray-200;
}
a.router-link-active {
    background: var(--color-accent-bright);
    color: white;
}
</style>
