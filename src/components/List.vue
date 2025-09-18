<script setup lang="ts">
import { Button, DropdownMenu, Tag } from '@churchtools/styleguide';
import { DELETE_ICON, EDIT_ICON } from '@churchtools/utils';
import { sortBy } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { taskStore } from '../composables/storeTasks';
import { useLists } from '../composables/useLists';
import { useTasks } from '../composables/useTasks.ts';
import DialogList from './DialogList.vue';
import NewTask from './NewTask.vue';
import Task from './TaskItem.vue';

const store = taskStore();

const props = withDefaults(
    defineProps<{
        list: TransformedList;
        items: TransformedTask[];
        showTask?: boolean;
        isDraggable?: boolean;
        projectId: number;
    }>(),
    { items: () => [], isDraggable: true },
);

const pId = computed(() => props.projectId);
const { updateList, deleteList } = useLists(pId);
const onUpdateList = (list: Partial<TaskList>) => {
    updateList({ ...props.list, ...list });
};

const newTaskIsOpen = ref(false);

const initItems = (items: TransformedTask[]) => {
    internItems.value = sortBy(items, store.search ? 'score' : store.sortBy, 'sortKey');
};
onMounted(() => initItems(props.items));
watch(
    () => props.items,
    () => {
        initItems(props.items);
    },
);
const internItems = ref<TransformedTask[]>([]);
watch(internItems, (newValue, oldValue) => {
    if (newValue.length >= oldValue.length) {
        updateSortKeys(newValue);
    }
});
const { updateTask } = useTasks(pId);
const updateSortKeys = (newAr: TransformedTask[]) => {
    const half = 2,
        distance = 10000;

    const newArray = sortBy(
        newAr.map(task => ({
            ...task,
            list: props.list.id,
            sortKey: props.list.id === task.list ? task.sortKey : 0,
            added: props.list.id !== task.list,
        })),
        'dueDate',
    );

    const itemsToUpdate: TransformedTask[] = [];

    newArray.forEach((item, index) => {
        const prevSortKey = index > 0 ? (newArray[index - 1].sortKey ?? index - 1) : 0;
        const nextSortKey =
            index < newArray.length - 1 ? (newArray[index + 1].sortKey ?? index + 1) : prevSortKey + distance;
        let distanceToAdd = Math.round((nextSortKey - prevSortKey) / half);
        distanceToAdd = distanceToAdd > 0 ? distanceToAdd : distance;

        if (item.dueDate && item.added) {
            itemsToUpdate.push(item);
        } else if (
            ((item.sortKey < prevSortKey || (item.sortKey > nextSortKey && distanceToAdd < 1)) && !item.dueDate) ||
            item.added
        ) {
            const newSortKey = prevSortKey + (distanceToAdd > 1 ? distanceToAdd : distance);
            const updatedItem = { ...newArray[index], sortKey: newSortKey };
            delete updatedItem.added;
            itemsToUpdate.push(updatedItem);
            newArray[index].sortKey = newSortKey;
        }
    });
    if (itemsToUpdate.length > 0) {
        itemsToUpdate.forEach(item => updateTask(item));
    }
};

const listContextMenu = computed(() => {
    const menu = [
        {
            title: `Liste "${props.list.name}"`,
            items: [
                {
                    id: 'showSubTasks',
                    label: 'Unteraufgaben anzeigen',
                    icon: props.list.showSubTasks
                        ? { icon: 'fas fa-toggle-on', class: 'text-green-500' }
                        : 'fas fa-toggle-off',
                    callback: () => {
                        onUpdateList({ showSubTasks: !props.list.showSubTasks });
                    },
                },
                {
                    id: 'showCompleted',
                    label: 'Erledigte Aufgaben anzeigen',
                    icon: props.list.showCompleted
                        ? { icon: 'fas fa-toggle-on', class: 'text-green-500' }
                        : 'fas fa-toggle-off',
                    callback: () => {
                        onUpdateList({ showCompleted: !props.list.showCompleted });
                    },
                },
            ],
        },
        {
            items: [
                {
                    id: 'edit',
                    label: 'Bearbeiten',
                    icon: EDIT_ICON,
                    callback: () => (listIsOpen.value = props.list),
                },
                {
                    id: 'delete',
                    label: 'Löschen',
                    disabled: props.list.isDefault,
                    icon: { icon: DELETE_ICON, class: 'text-red-500' },
                    callback: () => deleteList(props.list.id),
                },
            ],
        },
    ];
    return menu;
});
const listIsOpen = ref();
</script>
<template>
    <div
        class="flex max-h-[700px] flex-shrink-0 flex-col rounded-lg bg-gray-50 shadow-md"
        :class="list.isCollapsed ? 'min-h-[300px] w-12' : 'w-96'"
    >
        <div
            class="px-2 pt-2"
            :class="{
                'mb-3 flex items-center justify-between gap-2': !list.isCollapsed,
                'flex min-h-96 flex-col items-center gap-2': list.isCollapsed,
            }"
        >
            <button
                v-if="$route.name === 'project-board'"
                class="my-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-50 text-gray-400"
                :class="{ 'm-2': list.isCollapsed }"
                @click="onUpdateList({ isCollapsed: !list.isCollapsed })"
            >
                <i v-if="list.isCollapsed" class="fas fa-angle-down relative left-px"></i>
                <i v-else class="fas fa-angle-right relative top-px"></i>
            </button>
            <div class="inline-flex flex-grow items-center overflow-hidden">
                <span
                    class="flex items-center gap-2 overflow-hidden text-xl font-bold text-ellipsis whitespace-nowrap"
                    :style="list.isCollapsed ? 'margin: calc(50% - 8px) 0; transform: rotate(90deg)' : ''"
                    :title="list.name"
                >
                    <slot :list="list" name="header">{{ list.name }}</slot>
                </span>
            </div>
            <div class="inline-flex">
                <span
                    class="flex gap-1 whitespace-nowrap"
                    :class="{ 'items-center': !list.isCollapsed }"
                    :style="list.isCollapsed ? 'margin: calc(50% - 8px) 0; transform: rotate(90deg)' : ''"
                >
                    <Tag
                        v-if="internItems?.length"
                        color="secondary"
                        icon="fas fa-tasks"
                        :label="String(internItems?.length)"
                        size="0"
                    />
                    <Button
                        v-if="!list.isCollapsed"
                        color="green"
                        icon="fas fa-plus"
                        size="S"
                        text
                        @click="newTaskIsOpen = !newTaskIsOpen"
                    />
                    <DropdownMenu v-if="$route.name === 'project-board'" :menu-items="listContextMenu">
                        <Button v-if="!list.isCollapsed" color="basic" icon="fas fa-ellipsis-h" size="S" text />
                    </DropdownMenu>
                </span>
            </div>
        </div>
        <div v-if="!list.isCollapsed" class="flex flex-grow flex-col gap-2 overflow-y-auto px-2 pb-2">
            <draggable
                v-if="isDraggable"
                v-model="internItems"
                animation="200"
                class="flex min-h-full flex-col gap-2"
                group="tasks"
                item-key="id"
            >
                <template #header>
                    <NewTask v-if="newTaskIsOpen" :list="list" :project-id="projectId" @close="newTaskIsOpen = false" />
                </template>
                <template #item="{ element }">
                    <Task :item="element" :project-id="projectId" :show-task="showTask" />
                </template>
                <template #footer><div class="pt-px"></div></template>
            </draggable>
            <template v-else>
                <NewTask v-if="newTaskIsOpen" :list="list" :project-id="projectId" @close="newTaskIsOpen = false" />
                <Task
                    v-for="item in internItems"
                    :key="item.id"
                    :item="item"
                    :project-id="projectId"
                    :show-task="showTask"
                />
            </template>
        </div>
        <DialogList v-if="listIsOpen" :list="listIsOpen" :project-id="projectId" @close="listIsOpen = undefined" />
    </div>
</template>
<style>
.sortable-ghost {
    border: 2px dashed var(--color-basic-bright);
}
.sortable-ghost > * {
    opacity: 0;
}
</style>
