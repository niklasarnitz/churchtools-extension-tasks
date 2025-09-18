<script setup lang="ts">
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Button, DialogLarge, Input, InputDate, SelectDropdown, Tag, Textarea, Toggle } from '@churchtools/styleguide';
import { type DomainObjectPerson, transformPersonToDomainObject, usePersonsQueryAllPages } from '@churchtools/utils';
import { computed, onMounted, onUpdated, ref, watch } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';
import { useTags } from '../../composables/useTags';
import { useTask } from '../../composables/useTask';
import { useTasks } from '../../composables/useTasks';
import { router } from '../../router';
import DialogTag from '../DialogTag.vue';
import NewTask from '../NewTask.vue';
import TaskItem from '../TaskItem.vue';
import Activities from './Activities.vue';

const props = defineProps<{
    taskId: number;
    projectId: number;
}>();
const projectId = computed(() => props.projectId);
const taskId = computed(() => props.taskId);

const { updateTask, deleteTask, tasksMap, getObjectDiff, isLoading } = useTasks(projectId);
const { tagsArray } = useTags(projectId);

onMounted(() => {
    initTask();
    pathArray.value = (window.history.state.back ?? '').split('/');
});
watch(isLoading, () => initTask());
onBeforeRouteUpdate(to => {
    initTask(to.params.taskId as string);
});
const internTask = ref<TransformedTask>({} as TransformedTask);

onUpdated(() => {
    setTimeout(() => {
        pathArray.value = (window.history.state.back ?? '').split('/');
        showRelativeDate.value = (!!internTask.value?.dueDateRelative || !!parent.value) && !internTask.value.dueDate;
    }, 500);
});
const pathArray = ref([]);
const initTask = (id?: string) => {
    internTask.value = tasksMap.value[id ?? taskId.value] ?? {};
    showRelativeDate.value = (!!internTask.value.dueDateRelative || !!parent.value) && !internTask.value.dueDate;
    name.value = internTask.value.name;
};

const filter = computed(() => ({ ids: internTask.value?.assignedTo ?? [] }));
const { data } = usePersonsQueryAllPages(filter, { enabled: () => !!filter.value.ids.length });
const personMap = computed(() =>
    Object.fromEntries(
        (data.value ?? []).map(p => {
            const domainObject = transformPersonToDomainObject(p);
            return [p.id, { ...p, domainObject }];
        }),
    ),
);
const name = ref('');

const { parent, calculateDueDate, dueColor, toDayMonth } = useTask(projectId, taskId);

const { currentRoute, push } = useRouter();

const onSave = (close: () => void) => {
    const oldTask = tasksMap.value[taskId.value];
    const diffs = getObjectDiff(internTask.value, oldTask);
    const diffObject = Object.fromEntries(
        diffs.map(key => [key, `${oldTask[key] ?? 'Nichts'} => ${internTask.value[key] ?? 'Nichts'}`]),
    );
    updateTask(internTask.value, diffObject);
    if (showBackButton.value) {
        router.back();
    } else {
        close();
        resetRoute();
    }
};

const saveComment = (activities: ActivityEntry[]) => {
    internTask.value.activity = activities;
    updateTask(internTask.value);
};

const onDelete = (close: () => void) => {
    deleteTask(internTask.value.id);
    close();
    resetRoute();
};
const resetRoute = () => {
    push({ ...currentRoute.value, params: {} });
};

const createTagIsOpen = ref(false);

const subTasks = computed(() => (internTask.value?.subTasks ?? []).map(st => tasksMap.value[st]).filter(st => st));
const subTaskOpen = ref(false);
const onAddTask = () => {
    subTaskOpen.value = true;
};
const onSubTask = async (value: CustomdataValue) => {
    const subTasks = [...(internTask.value.subTasks ?? [])].filter(sT => tasksMap.value[sT]);
    subTasks.push(value.id);
    const payload = { ...internTask.value, subTasks };
    const oldTask = tasksMap.value[taskId.value];
    const diffs = getObjectDiff(payload, oldTask);
    const diffObject = Object.fromEntries(
        diffs.map(key => [key, `${oldTask[key] ?? 'Nichts'} => ${payload[key] ?? 'Nichts'}`]),
    );
    await updateTask(payload, diffObject);
    internTask.value = tasksMap.value[taskId.value];
};

const showBackButton = computed(() => {
    return !isNaN(parseInt(pathArray.value[pathArray.value.length - 1]));
});

const showRelativeDate = ref(false);
const isSmallScreen = computed(() => window.innerWidth < 768);

const onSearchForPerson = async (query: string) => {
    const result = await churchtoolsClient.get<DomainObjectPerson[]>(`/search?query=${query}&domainTypes[]=person`);
    return result
        .filter(r => !internTask.value.assignedTo?.includes(parseInt(r.domainIdentifier)))
        .map(r => ({ ...r, id: r.domainIdentifier, label: r.title }));
};
const assignees = computed(() => (internTask.value.assignedTo ?? []).map(id => personMap.value[id]));

const onSelectAssignee = (ids: number[]) => {
    internTask.value.assignedTo = ids.map(id => id);
};
</script>
<template>
    <DialogLarge
        :button="{ disabled: !internTask.name, label: 'Speichern' }"
        :context="'Aufgabe bearbeiten'"
        style="--dialog-width: 100%"
        @close="resetRoute"
        @save="e => onSave(e)"
    >
        <div class="absolute top-[88px]">
            <Button v-if="showBackButton" color="basic" icon="fas fa-arrow-left" size="S" text @click="$router.back()">
                Zurück
            </Button>
        </div>
        <div class="flex flex-col gap-4">
            <div class="text-lg font-bold">
                {{ name }}
            </div>
            <Input v-model="internTask.name" :horizontal="!isSmallScreen" label="Titel" required />
            <Textarea v-model="internTask.description" :horizontal="!isSmallScreen" label="Beschreibung" :rows="10" />
            <div class="flex items-center justify-between">
                <div v-if="showRelativeDate" class="flex items-center gap-2">
                    <Input
                        v-model="internTask.dueDateRelative"
                        class="max-w-[420px]"
                        label="Fällig am"
                        note="Tage relativ zur Oberaufgabe"
                        placeholder="Anzahl Tage im Voraus"
                        type="number"
                    />
                    <Tag
                        v-if="internTask.dueDateRelative"
                        :color="dueColor"
                        :label="toDayMonth(calculateDueDate(internTask))"
                        size="S"
                    />
                </div>
                <InputDate
                    v-else
                    v-model="internTask.dueDate"
                    class="max-w-[520px] grow"
                    :horizontal="!isSmallScreen"
                    label="Fällig am"
                />
                <div v-if="parent" class="flex gap-2">
                    <span>Relatives Datum</span>
                    <Toggle v-model="showRelativeDate" label="Relatives Datum" />
                </div>
            </div>
            <Input v-model="internTask.url" :horizontal="!isSmallScreen" label="Link" />
            <div class="flex items-end gap-2">
                <SelectDropdown
                    v-model="internTask.tags"
                    class="flex-grow"
                    emit-id
                    :horizontal="!isSmallScreen"
                    label="Tags"
                    :multiple="true"
                    :options="tagsArray"
                />
                <Button icon="fas fa-plus" outlined @click="createTagIsOpen = true" />
            </div>
            <SelectDropdown
                emit-id
                horizontal
                label="Assignee"
                :model-value="assignees"
                multiple
                :options="assignees"
                :search-function="onSearchForPerson"
                @update:model-value="onSelectAssignee"
            />
            <div class="flex flex-col gap-4 md:flex-row">
                <div class="flex-shrink-0 font-bold md:w-48">Unteraufgaben</div>
                <div class="flex-grow">
                    <div class="task_wrapper">
                        <TaskItem
                            v-for="(subtask, index) in subTasks"
                            :key="index"
                            :item="subtask"
                            :project-id="projectId"
                            :show-task="true"
                        />
                        <NewTask
                            v-if="subTaskOpen"
                            :list="{ id: internTask.list }"
                            :project-id="projectId"
                            @close="subTaskOpen = false"
                            @created="onSubTask"
                        />
                        <div>
                            <button
                                class="border-basic-interactive flex w-full items-center gap-3 rounded-b border bg-white px-4 py-3 font-bold text-gray-500"
                                :class="{ 'rounded-t': !subTasks.length }"
                                @click="onAddTask"
                            >
                                <i class="fas fa-plus"></i>
                                Unteraufgabe hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="border-basic-divider my-6 border-b"></div>
            <Activities v-if="internTask.activity" :activities="internTask.activity" @comment="saveComment" />
        </div>
        <DialogTag v-if="createTagIsOpen" :project-id="projectId" @close="createTagIsOpen = false" />
        <template #footer-left="{ close }">
            <Button color="red" icon="fas fa-trash-alt" outlined @click="onDelete(close)">Löschen</Button>
        </template>
    </DialogLarge>
</template>
<style>
@reference '@churchtools/styleguide/tailwind';
.task_wrapper > div:first-child {
    @apply border-basic-divider rounded-t;
}
.task_wrapper > div:last-child {
    @apply border-basic-divider rounded-b border-b;
}
.task_wrapper > div {
    box-shadow: none;
    border-radius: 0;
    @apply border-basic-divider border-b-0;
}
</style>
