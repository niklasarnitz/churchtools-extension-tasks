<script setup lang="ts">
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Button, Input, InputDate, SelectDropdown, Tag, Textarea, Toggle } from '@churchtools/styleguide';
import {
    type CustomModuleDataValue,
    type DomainObjectPerson,
    getFirstOrSelf,
    getParams,
    transformPersonToDomainObject,
    usePersonsQueryAllPages,
} from '@churchtools/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useTags } from '../../composables/useTags';
import { useTask } from '../../composables/useTask';
import { useTasks } from '../../composables/useTasks';
import {
    getPriorityOptionsWithTranslations,
    getRecurrenceOptionsWithTranslations,
    getReminderOptionsWithTranslations,
    getStatusOptionsWithTranslations,
} from '../../constants/taskConfig';
import DialogTag from '../DialogTag.vue';
import NewTask from '../NewTask.vue';
import TaskItem from '../TaskItem.vue';

const props = defineProps<{
    taskId?: number;
    projectId: number;
}>();
const emit = defineEmits<{
    (event: 'change', payload: TransformedTask): void;
}>();

const projectId = computed(() => props.projectId);
const taskId = computed(() => props.taskId);

const { tasksMap, updateTask, getObjectDiff } = useTasks(projectId);
const { tagsArray } = useTags(projectId);
const { parent, calculateDueDate, dueColor, toDayMonth } = useTask(projectId, taskId);

const cloneTask = (source?: TransformedTask) => (source ? structuredClone(source) : ({} as TransformedTask));

const internTask = ref<TransformedTask>({} as TransformedTask);
watch(internTask, () => emit('change', internTask.value), { deep: true });
onMounted(() => initTask());
onBeforeRouteUpdate(to => initTask(getFirstOrSelf(to.params.taskId)));
const initTask = (id?: string) => {
    const tId = id ? parseInt(id) : taskId.value;
    internTask.value = cloneTask(tId ? tasksMap.value[tId] : undefined);
    showRelativeDate.value = (!!internTask.value.dueDateRelative || !!parent.value) && !internTask.value.dueDate;
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

watch(showRelativeDate, value => {
    if (value) {
        internTask.value.dueDate = undefined;
    } else {
        internTask.value.dueDateRelative = undefined;
    }
});

const tagDialogIsOpen = ref(false);
const onCreateTag = () => {
    tagDialogIsOpen.value = true;
};

const onSearchForPerson = async (query: string) => {
    if (query.length < 2) {
        return Promise.resolve([]);
    }
    const params = getParams({ domain_types: ['person'], query });
    const result = await churchtoolsClient.get<DomainObjectPerson[]>(`/search${params}`);
    return result
        .filter(r => !internTask.value.assignedTo?.includes(parseInt(r.domainIdentifier)))
        .map(r => ({ ...r, id: r.domainIdentifier, label: r.title }));
};
const assignees = computed(() => (internTask.value.assignedTo ?? []).map(id => personMap.value[id]));
const onSelectAssignee = (ids: string[]) => (internTask.value.assignedTo = ids.map(id => parseInt(id)));

const statusOptions = getStatusOptionsWithTranslations();
const priorityOptions = getPriorityOptionsWithTranslations();
const recurrenceOptions = getRecurrenceOptionsWithTranslations();
const reminderOptions = getReminderOptionsWithTranslations();

const subTasks = computed(() => (internTask.value?.subTasks ?? []).map(st => tasksMap.value[st]).filter(st => st));
const subTaskOpen = ref(false);
const onAddTask = () => {
    subTaskOpen.value = true;
};
const onSubTask = async (value: CustomModuleDataValue) => {
    if (!internTask.value?.id) {
        return;
    }
    const newSubTasks = [...(internTask.value.subTasks ?? [])].filter(sT => tasksMap.value[sT]);
    newSubTasks.push(value.id);
    const payload = { ...internTask.value, subTasks: newSubTasks } as TransformedTask;
    const diff = getObjectDiff(payload, tasksMap.value[internTask.value.id] ?? {});
    await updateTask(payload, diff);
    internTask.value = cloneTask(tasksMap.value[internTask.value.id]);
};
</script>
<template>
    <div class="flex flex-col gap-2">
        <Input v-model="internTask.name" :horizontal="true" label="Titel" required />
        <Textarea v-model="internTask.description" :horizontal="true" label="Beschreibung" :rows="10" />
        <div class="flex items-center justify-between">
            <div v-if="showRelativeDate" class="flex items-center gap-2">
                <Input
                    v-model="internTask.dueDateRelative"
                    class="max-w-[420px]"
                    :horizontal="true"
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
                :horizontal="true"
                label="Fällig am"
            />
            <div v-if="parent" class="flex gap-2">
                <span>Relatives Datum</span>
                <Toggle v-model="showRelativeDate" label="Relatives Datum" />
            </div>
        </div>
        <Input v-model="internTask.url" :horizontal="true" label="Link" />
        <div class="flex items-end gap-2">
            <SelectDropdown
                v-model="internTask.tags"
                class="flex-grow"
                :emit-id="true"
                :horizontal="true"
                label="Tags"
                :multiple="true"
                :options="tagsArray"
            />
            <Button icon="fas fa-plus" outlined @click="onCreateTag" />
        </div>
        <SelectDropdown
            :emit-id="true"
            :horizontal="true"
            label="Assignee"
            :model-value="assignees"
            :multiple="true"
            :options="assignees"
            :search-function="onSearchForPerson"
            @update:model-value="onSelectAssignee"
        />
        <SelectDropdown
            v-model="internTask.recurrencePattern"
            :emit-id="true"
            :horizontal="true"
            label="Wiederholung"
            :options="recurrenceOptions"
            placeholder="Keine Wiederholung"
        />
        <SelectDropdown
            v-model="internTask.reminderMinutes"
            :emit-id="true"
            :horizontal="true"
            label="Erinnerung"
            :options="reminderOptions"
            placeholder="Keine Erinnerung"
        />
        <div class="flex flex-col gap-4 md:flex-row">
            <div class="flex-shrink-0 font-bold md:w-48"></div>
            <div class="flex flex-grow gap-4">
                <SelectDropdown
                    v-model="internTask.status"
                    class="flex-1"
                    :emit-id="true"
                    :horizontal="false"
                    label="Status"
                    :options="statusOptions"
                />
                <SelectDropdown
                    v-model="internTask.priority"
                    class="flex-1"
                    :emit-id="true"
                    :horizontal="false"
                    label="Priorität"
                    :options="priorityOptions"
                />
            </div>
        </div>
        <div v-if="internTask.id" class="flex flex-col gap-4 md:flex-row">
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
    </div>
    <DialogTag v-if="tagDialogIsOpen" :project-id="projectId" @close="tagDialogIsOpen = false" />
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
