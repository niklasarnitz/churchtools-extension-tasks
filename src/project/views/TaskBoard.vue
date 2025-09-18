<script setup lang="ts">
import { computed, toRef } from 'vue';
import List from '../../components/List.vue';
import ProgressRing from '../../components/ProgressRing.vue';
import { taskStore } from '../../composables/storeTasks';
import { useTasks } from '../../composables/useTasks';
import ViewWrapper from './ViewWrapper.vue';

const props = defineProps<{
    projectId: string;
}>();

const { tasks, tasksMap, getPercentFullfilled } = useTasks(toRef(() => parseInt(props.projectId)));
const store = taskStore();

const tasksByParent = computed(() => {
    const tasksWithSub = tasks.value.filter(task => task.subTasks?.length);
    return Object.fromEntries(
        tasksWithSub.map(parent => [
            parent.id,
            parent.subTasks
                ?.map(st => tasksMap.value[st])
                .filter(st => !!st && ((!store.showFullfilled && !st.fullfilled) || store.showFullfilled)),
        ]),
    );
});

const boardlists = computed(() => {
    const li: TransformedList[] = tasks.value
        .filter(task => task.subTasks?.filter(st => tasksMap.value[st]).length)
        .map(task => ({ id: task.id, name: task.name, percentage: getPercentFullfilled(task) }));
    return li;
});
</script>
<template>
    <ViewWrapper :sub-task-toggle="false">
        <template v-for="list in boardlists" :key="list.id">
            <List :items="tasksByParent[list.id]" :list="list" :show-task="true">
                <template #header>
                    <ProgressRing class="progress-icon relative text-[20px] text-gray-500" :percent="list.percentage" />
                    <span>{{ list.name }}</span>
                </template>
            </List>
        </template>
    </ViewWrapper>
</template>
