<script setup lang="ts">
import { Button, Input } from '@churchtools/styleguide';
import type { CustomModuleDataValue } from '@churchtools/utils';
import { onMounted, ref, toRef } from 'vue';
import { useTasks } from '../composables/useTasks';

const props = defineProps<{
    list: TransformedList;
    projectId: number;
}>();
const emit = defineEmits<{
    (event: 'close'): void;
    (event: 'created', value: CustomModuleDataValue): void;
}>();

const { createTask } = useTasks(toRef(() => props.projectId));

const inputRef = ref();
onMounted(() => {
    inputRef.value.focus();
});

const task = ref({ list: props.list.id } as Task);
const onCreateTask = async () => {
    const newTask = await createTask({ ...task.value });
    if (newTask) {
        emit('created', newTask);
        resetTask();
    }
};
const resetTask = () => {
    task.value = { list: props.list.id } as Task;
    emit('close');
};
</script>
<template>
    <div
        class="flex cursor-pointer flex-col justify-between gap-2 rounded border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-gray-200"
        @keydown.escape="resetTask"
    >
        <Input ref="inputRef" v-model="task.name" label="Titel" @enter="onCreateTask" />
        <div class="flex justify-between">
            <Button color="basic" outlined size="S" @click="resetTask"> Abbrechen </Button>
            <Button :disabled="!task.name" size="S" @click="onCreateTask"> Erstellen </Button>
        </div>
    </div>
</template>
