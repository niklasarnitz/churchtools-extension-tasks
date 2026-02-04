<script setup lang="ts">
import { Button, DomainObject, DropdownMenu, Tag } from '@churchtools/styleguide';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTask } from '../composables/useTask.ts';
import { useTasks } from '../composables/useTasks.ts';
import { PRIORITY_BADGE_COLORS, STATUS_BADGE_COLORS, getPriorityLabel, getStatusLabel } from '../constants/taskConfig';
import DialogChangeProject from './DialogChangeProject.vue';
import ProgressRing from './ProgressRing.vue';

const EDIT_ICON = 'fas fa-pen';
const DELETE_ICON = 'fas fa-trash';

const props = defineProps<{
    item: TransformedTask;
    showTask?: boolean;
    projectId: number;
}>();

const id = computed(() => props.item.id);
const pId = computed(() => props.projectId);
const {
    superParent,
    parent,
    hasSubTasks,
    percentFullfilled,
    assignees,
    dueColor,
    dueDate,
    toggleTask,
    comments,
    task,
    sortedTags,
    toDayMonth,
} = useTask(pId, id);

const router = useRouter();
const openTask = () => {
    router.push({ ...router.currentRoute.value, params: { taskId: props.item.id } });
};

const showLastRow = computed(() => dueDate.value || comments.value?.length || props.item.tags?.length);

const { tasksMap, createTask, deleteTask, moveTask } = useTasks(pId);

const createTaskOrSubtask = async ({ id, ...data }: TransformedTask) => {
    void id; // ensure we don't pass an id when creating a new task
    return await createTask(data);
};

async function duplicateTask() {
    const originalTask = props.item;
    const newSubtaskIds = await duplicateSubtasks(originalTask.subTasks);
    const newTask = await createTaskOrSubtask({ ...originalTask, subTasks: newSubtaskIds });
    return newTask;
}
async function duplicateSubtasks(subtaskIds?: number[]) {
    const newSubtaskIds = [];

    if (subtaskIds?.length) {
        for (const subtaskId of subtaskIds) {
            const originalSubtask = tasksMap.value[subtaskId];
            if (!originalSubtask) {
                continue;
            }
            const nestedSubtaskIds = await duplicateSubtasks(originalSubtask.subTasks);
            const newSubtask = await createTaskOrSubtask({ ...originalSubtask, subTasks: nestedSubtaskIds });
            if (newSubtask) {
                newSubtaskIds.push(newSubtask.id);
            }
        }
    }

    return newSubtaskIds;
}

const deleteRecursive = async (task: TransformedTask) => {
    if (!task) {
        return;
    }
    if (task.subTasks?.length) {
        for (const subtaskId of task.subTasks) {
            const subtask = tasksMap.value[subtaskId];
            await deleteRecursive(subtask);
        }
    }
    await deleteTask(task.id);
};

const changeProjectDialogIsOpen = ref(false);
const openChangeProjectDialog = () => {
    changeProjectDialogIsOpen.value = true;
};

const onTaskMoved = async (newProjectId: number) => {
    await moveTask(props.item, newProjectId);
    changeProjectDialogIsOpen.value = false;
};

const contextMenu = computed(() => [
    {
        title: `Aufgabe "${props.item.name}"`,
        items: [
            {
                id: 'fullfilled',
                label: props.item.fullfilled ? 'Als nicht-erfüllt markieren' : 'Abhaken',
                icon: props.item.fullfilled ? 'far fa-square' : 'fas fa-check-square',
                callback: () => toggleTask(),
            },
            {
                id: 'move',
                label: 'In anderes Projekt verschieben',
                icon: 'fas fa-arrow-left-long',
                callback: () => openChangeProjectDialog(),
            },
        ],
    },
    {
        items: [
            { id: 'edit', label: 'Bearbeiten', icon: EDIT_ICON, callback: () => openTask() },
            { id: 'duplicate', label: 'Duplizieren', icon: 'fas fa-copy', callback: () => duplicateTask() },
            {
                id: 'delete',
                label: 'Löschen',
                icon: { icon: DELETE_ICON, class: 'text-red-500' },
                callback: () => void deleteRecursive(props.item),
            },
        ],
    },
]);

const breadcrumbs = computed(() => {
    const bc = [];
    if (superParent.value) {
        bc.push(superParent.value.name);
    }
    if (parent.value && parent.value.id !== superParent.value?.id) {
        bc.push(parent.value.name);
    }
    return bc;
});
</script>
<template>
    <div
        class="task-item group relative flex cursor-pointer flex-col justify-between gap-2 rounded border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-gray-200"
        @click="openTask"
    >
        <div v-if="superParent && !showTask" class="-mb-1 flex items-center gap-2 text-xs text-gray-400">
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <span>{{ crumb }}</span>
                <i v-if="index === breadcrumbs.length - 1" class="fas fa-arrow-turn-up fa-rotate-270"></i>
                <i v-else class="fas fa-arrow-left-long"></i>
            </template>
        </div>
        <div class="flex items-start justify-end gap-4">
            <div class="flex flex-grow items-start gap-2">
                <ProgressRing
                    v-if="hasSubTasks"
                    class="progress-icon relative text-[20px] text-gray-500"
                    :percent="percentFullfilled"
                />
                <template v-else>
                    <i
                        v-if="item.fullfilled"
                        class="far fa-check-square text-[20px] text-green-500"
                        @click.stop="toggleTask"
                    ></i>
                    <i v-else class="far fa-square text-[20px] text-gray-500" @click.stop="toggleTask"></i>
                </template>
                <span class="font-bold"> {{ item.name }} </span>
            </div>
            <div v-if="item.assignedTo?.length" class="flex flex-shrink-0 gap-1">
                <DomainObject
                    v-for="assignee in assignees"
                    :key="assignee.domainIdentifier"
                    :domain-object="assignee"
                    size="XS"
                />
            </div>
            <DropdownMenu
                :button-bind="{ class: 'absolute hidden right-1 top-1 group-hover:inline-flex' }"
                :menu-items="contextMenu"
            >
                <Button color="basic" icon="fas fa-ellipsis" outlined size="S" />
            </DropdownMenu>
        </div>
        <div v-if="item.description" class="l line-clamp-1">
            {{ item.description }}
        </div>
        <div v-if="showLastRow" class="flex flex-wrap justify-end gap-2">
            <div class="flex flex-grow items-center gap-2 text-gray-400">
                <span
                    v-if="item.status"
                    class="rounded px-2 py-1 text-xs font-semibold text-white"
                    :style="{ backgroundColor: STATUS_BADGE_COLORS[item.status] || '#808080' }"
                >
                    {{ (window as any).i18n?.(getStatusLabel(item.status)) || getStatusLabel(item.status) }}
                </span>
                <span
                    v-if="item.priority"
                    class="rounded px-2 py-1 text-xs font-semibold text-white"
                    :style="{ backgroundColor: PRIORITY_BADGE_COLORS[item.priority] || '#808080' }"
                >
                    {{ (window as any).i18n?.(getPriorityLabel(item.priority)) || getPriorityLabel(item.priority) }}
                </span>
                <Tag
                    v-if="dueDate"
                    :color="dueColor ?? 'basic'"
                    icon="far fa-clock"
                    :label="
                        task.dueDateRelative ? `${toDayMonth(dueDate)} (${task.dueDateRelative})` : toDayMonth(dueDate)
                    "
                    size="S"
                />
                <Tag v-if="comments?.length" icon="far fa-comments" :label="String(comments.length)" size="0" />
                <Button
                    v-if="item.url"
                    color="gray"
                    :href="item.url"
                    icon="fas fa-link"
                    size="S"
                    target="_blank"
                    text
                    @click.stop
                />
            </div>
            <div class="flex gap-2">
                <Tag v-for="tag in sortedTags" :key="tag.id" :color="tag.color" :label="tag.name" size="S" />
            </div>
        </div>
    </div>
    <DialogChangeProject
        v-if="changeProjectDialogIsOpen"
        :current-project-id="pId"
        :task="item"
        @close="changeProjectDialogIsOpen = false"
        @moved="onTaskMoved"
    />
</template>
