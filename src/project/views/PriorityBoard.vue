<script setup lang="ts">
import { t } from '@churchtools/utils';
import { computed } from 'vue';
import List from '../../components/List.vue';
import { useTasks } from '../../composables/useTasks';
import { TASK_PRIORITIES } from '../../constants/taskConfig';
import ViewWrapper from './ViewWrapper.vue';

const props = defineProps<{ projectId: string }>();
const projectId = computed(() => parseInt(props.projectId));

const { tasks, showTask } = useTasks(projectId);

const priorities = computed(() =>
    TASK_PRIORITIES.map(p => ({ key: p.id, label: t(p.label), icon: p.icon, color: p.color })),
);

const tasksByPriority = computed(() => {
    const result: Record<string, TransformedTask[]> = {
        critical: [],
        high: [],
        medium: [],
        low: [],
    };

    tasks.value.forEach(task => {
        if (showTask(task)) {
            const priority = task.priority || 'low';
            if (priority in result) {
                result[priority as keyof typeof result].push(task);
            }
        }
    });

    return result;
});
</script>

<template>
    <ViewWrapper :project-id="projectId">
        <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
            <div v-for="priority in priorities" :key="priority.key" class="flex flex-col">
                <div class="mb-2 flex items-center gap-2 px-2 text-sm font-semibold">
                    <i :class="`${priority.icon}`" :style="{ color: priority.color }"></i>
                    {{ priority.label }}
                    <span class="ml-auto text-xs text-gray-500"
                        >({{ tasksByPriority[priority.key]?.length || 0 }})</span
                    >
                </div>
                <List
                    :allow-new-task="false"
                    :is-kanban="true"
                    :project-id="projectId"
                    :tasks="tasksByPriority[priority.key]"
                />
            </div>
        </div>
    </ViewWrapper>
</template>
