<script setup lang="ts">
import { computed, watch } from 'vue';
import TaskItem from '../components/TaskItem.vue';
import { useTasks } from '../composables/useTasks';

const props = defineProps<{
    project: Project;
    currentUserId: number;
}>();

const emit = defineEmits<{
    (event: 'count', payload: { projectId: number; count: number }): void;
}>();

const { tasks, showTask, calculateDueDate } = useTasks(props.project.id);

const projectTasks = computed(() =>
    tasks.value
        .filter(
            task => showTask(task) && task.assignedTo?.map(a => parseInt(a.toString())).includes(props.currentUserId),
        )
        .map(t => ({
            ...t,
            dueDate: calculateDueDate(t),
            projectId: props.project.id,
            projectName: props.project.name,
        })),
);

watch(projectTasks, value => emit('count', { projectId: props.project.id, count: value.length }), { immediate: true });
</script>

<template>
    <div v-if="projectTasks.length" class="mb-6">
        <h2 class="mb-3 text-lg font-bold text-gray-700">{{ project.name }}</h2>
        <div class="flex flex-col gap-2">
            <TaskItem v-for="task in projectTasks" :key="task.id" :item="task" :project-id="project.id" />
        </div>
    </div>
</template>
