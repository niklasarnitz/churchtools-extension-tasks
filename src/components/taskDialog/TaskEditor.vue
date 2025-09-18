<script setup lang="ts">
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Button, Input, InputDate, SelectDropdown, Textarea } from '@churchtools/styleguide';
import {
    type DomainObjectPerson,
    getFirstOrSelf,
    transformPersonToDomainObject,
    usePersonsQueryAllPages,
    useToasts,
} from '@churchtools/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useTags } from '../../composables/useTags';
import { useTasks } from '../../composables/useTasks';

const props = defineProps<{
    taskId?: number;
    projectId: number;
}>();
const emit = defineEmits<{
    (event: 'change', payload: TransformedTask): void;
}>();

const projectId = computed(() => props.projectId);
const taskId = computed(() => props.taskId);

const { tasksMap, isLoading } = useTasks(projectId);
const { tagsArray } = useTags(projectId);

const internTask = ref<TransformedTask>({} as TransformedTask);
watch(internTask, () => emit('change', internTask.value), { deep: true });
onMounted(() => initTask());
watch(isLoading, () => initTask());
onBeforeRouteUpdate(to => initTask(getFirstOrSelf(to.params.taskId)));
const initTask = (id?: string) => {
    const tId = id ? parseInt(id) : taskId.value;
    internTask.value = tId ? tasksMap.value[tId] : ({} as TransformedTask);
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

const { successToast } = useToasts();
const onCreateTag = () => successToast('TODO: Tag erstellen implementieren');

const onSearchForPerson = async (query: string) => {
    const result = await churchtoolsClient.get<DomainObjectPerson[]>(`/search?query=${query}&domainTypes[]=person`);
    return result
        .filter(r => !internTask.value.assignedTo?.includes(parseInt(r.domainIdentifier)))
        .map(r => ({ ...r, id: r.domainIdentifier, label: r.title }));
};
const assignees = computed(() => (internTask.value.assignedTo ?? []).map(id => personMap.value[id]));
const onSelectAssignee = (ids: string[]) => (internTask.value.assignedTo = ids.map(id => parseInt(id)));
</script>
<template>
    <div class="flex flex-col gap-2">
        <Input v-model="internTask.name" :horizontal="true" label="Titel" required />
        <Textarea v-model="internTask.description" :horizontal="true" label="Beschreibung" :rows="10" />
        <InputDate v-model="internTask.dueDate" class="max-w-[520px]" :horizontal="true" label="Fällig am" />
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
    </div>
</template>
