import { computed, type MaybeRefOrGetter } from 'vue';
import { useTasks } from './useTasks';

const recurrenceIntervals = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    yearly: 365,
};

export function useRecurrentTasks(projectId: MaybeRefOrGetter<number>) {
    const { tasks, updateTask } = useTasks(projectId);

    const shouldCreateNewInstance = (task: TransformedTask) => {
        if (!task.recurrencePattern || !task.dueDate) {
            return false;
        }

        const lastCreated = task.recurrenceLastCreated ? new Date(task.recurrenceLastCreated) : new Date(task.dueDate);
        const now = new Date();
        const daysSince = (now.getTime() - lastCreated.getTime()) / (1000 * 60 * 60 * 24);
        const interval = recurrenceIntervals[task.recurrencePattern as keyof typeof recurrenceIntervals];

        return daysSince >= interval;
    };

    const createNewInstance = async (task: TransformedTask) => {
        if (!shouldCreateNewInstance(task) || !task.recurrencePattern) {
            return;
        }

        // Calculate new due date based on recurrence pattern
        const currentDueDate = new Date(task.dueDate!);
        const interval = recurrenceIntervals[task.recurrencePattern as keyof typeof recurrenceIntervals];
        const newDueDate = new Date(currentDueDate.getTime() + interval * 24 * 60 * 60 * 1000);

        // Update original task with new lastCreated timestamp
        const updatedTask = {
            ...task,
            recurrenceLastCreated: new Date().toISOString(),
        };
        await updateTask(updatedTask);

        // The new instance would be created by the user on demand
        return {
            ...task,
            id: undefined,
            dueDate: newDueDate.toISOString(),
            fullfilled: false,
            activity: undefined,
        };
    };

    const getRecurrentTasksToCreate = computed(() => {
        return tasks.value.filter(task => shouldCreateNewInstance(task));
    });

    return {
        shouldCreateNewInstance,
        createNewInstance,
        getRecurrentTasksToCreate,
    };
}
