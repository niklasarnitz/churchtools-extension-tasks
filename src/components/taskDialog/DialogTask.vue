<script setup lang="ts">
import { DialogLarge } from '@churchtools/styleguide';
import { EDIT_ICON } from '@churchtools/utils';
import { computed, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useTask } from '../../composables/useTask';
import { useTasks } from '../../composables/useTasks';
import { useProject } from '../../project/useProject';
import { txx } from '../../utils/utils';
import TaskDisplay from './TaskDisplay.vue';
import TaskEditor from './TaskEditor.vue';

const props = defineProps<{ taskId: string; projectId: number }>();
const projectId = computed(() => props.projectId);
const taskId = computed(() => (isCreate.value ? undefined : parseInt(props.taskId)));

const isCreate = computed(() => props.taskId === 'new');
const isEdit = ref(false);
const showEditor = computed(() => isCreate.value || isEdit.value);

const { project } = useProject(toRef(() => props.projectId));

const router = useRouter();
const resetRoute = () => {
    router.push({ ...router.currentRoute.value, params: undefined });
};

const { task } = useTask(projectId, taskId);
const { updateTask, getObjectDiff, createTask } = useTasks(projectId);

const actions = computed(() => {
    if (isCreate.value || isEdit.value) {
        return [];
    }
    return [
        {
            icon: EDIT_ICON,
            label: txx('Bearbeiten'),
            outlined: true,
            onClick: () => (isEdit.value = true),
        },
    ];
});
const cancelButton = computed(() => (isCreate.value || isEdit.value ? txx('Abbrechen') : txx('Schließen')));
const primaryButton = computed(() =>
    isCreate.value
        ? txx('Erstellen')
        : isEdit.value
          ? txx('Speichern')
          : task.value?.fullfilled
            ? { label: txx('Als unerledigt markieren'), color: 'red', icon: 'fas fa-undo', outlined: true }
            : { label: txx('Als erledigt markieren'), color: 'green', icon: 'fas fa-check' },
);

const internTask = ref({} as TransformedTask);
const onTaskChange = (updatedTask: TransformedTask) => {
    internTask.value = updatedTask;
};
const onSave = async () => {
    if (isCreate.value) {
        await createTask(internTask.value);
        resetRoute();
    } else if (isEdit.value) {
        const diff = getObjectDiff(internTask.value, task.value ?? {});
        await updateTask(internTask.value, diff);
        isEdit.value = false;
    }
};
</script>
<template>
    <DialogLarge
        :button="primaryButton"
        :cancel-button="cancelButton"
        :context="project?.name"
        :header="{
            icon: task?.fullfilled ? 'fas fa-square-check' : 'far fa-square',
            color: task?.fullfilled ? 'green' : 'basic',
            title: isCreate
                ? txx('Aufgabe erstellen')
                : isEdit
                  ? txx('Aufgabe bearbeiten')
                  : (task?.name ?? txx('Aufgabe anzeigen')),
            actions,
        }"
        @close="resetRoute"
        @save="onSave"
    >
        <TaskEditor v-if="showEditor" :project-id="projectId" :task-id="taskId" @change="onTaskChange" />
        <TaskDisplay v-else-if="taskId" :projectId="projectId" :taskId="taskId" />
    </DialogLarge>
</template>
