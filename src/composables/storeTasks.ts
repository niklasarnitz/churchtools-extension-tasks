import { defineStore } from 'pinia';
import { ref } from 'vue';

export const taskStore = defineStore('tasks', () => {
    const showSubTasks = ref(true),
        showFullfilled = ref(true),
        sortBy = ref('dueDate'),
        search = ref('');

    const isCreatingDefaultList = ref<Record<number, boolean>>({});

    return {
        showSubTasks,
        showFullfilled,
        sortBy,
        isCreatingDefaultList,
        search,
    };
});
