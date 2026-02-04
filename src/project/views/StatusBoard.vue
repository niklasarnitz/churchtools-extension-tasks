<script setup lang="ts">
import { t } from '@churchtools/utils';
import { computed } from 'vue';
import List from '../../components/List.vue';
import { useTasks } from '../../composables/useTasks';
import { TASK_STATUSES } from '../../constants/taskConfig';
import ViewWrapper from './ViewWrapper.vue';

const props = defineProps<{ projectId: string }>();
const projectId = computed(() => parseInt(props.projectId));

const { tasks, showTask } = useTasks(projectId);

const statuses = computed(() =>
    TASK_STATUSES.map(s => ({ key: s.id, label: t(s.label), icon: s.icon, color: s.color })),
);

const tasksByStatus = computed(() => {
    const result: Record<string, TransformedTask[]> = {
        open: [],
        'in-progress': [],
        blocked: [],
        done: [],
    };

    tasks.value.forEach(task => {
        if (showTask(task)) {
            const status = task.status || 'open';
            if (status in result) {
                result[status as keyof typeof result].push(task);
            }
        }
    });

    return result;
});

const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus as any;
    }
};
</script>

<template>
    <ViewWrapper :project-id="projectId">
        <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
            <div v-for="status in statuses" :key="status.key" class="flex flex-col">
                <div class="mb-2 flex items-center gap-2 px-2 text-sm font-semibold">
                    <i :class="`${status.icon}`" :style="{ color: status.color }"></i>
                    {{ status.label }}
                    <span class="ml-auto text-xs text-gray-500">({{ tasksByStatus[status.key]?.length || 0 }})</span>
                </div>
                <List
                    :allow-new-task="false"
                    :is-kanban="true"
                    :project-id="projectId"
                    :tasks="tasksByStatus[status.key]"
                    @task-status-changed="updateTaskStatus"
                />
            </div>
        </div>
    </ViewWrapper>
</template>
