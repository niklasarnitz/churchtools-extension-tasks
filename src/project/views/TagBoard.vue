<script setup lang="ts">
import { Button, DropdownMenu, Tag, deleteConfirm } from '@churchtools/styleguide';
import { t } from '@churchtools/utils';
import { computed, ref } from 'vue';
import DialogTag from '../../components/DialogTag.vue';
import List from '../../components/List.vue';
import { useTags } from '../../composables/useTags';
import { useTasks } from '../../composables/useTasks';
import ViewWrapper from './ViewWrapper.vue';

const props = defineProps<{ projectId: string }>();
const projectId = computed(() => parseInt(props.projectId));

const { tasks, showTask } = useTasks(projectId);
const { tagsArray, deleteTag } = useTags(projectId);

const editTag = ref<TransformedTag | undefined>();
const openEditTag = (tag: TransformedTag) => {
    editTag.value = tag;
};
const onDeleteTag = async (tag: TransformedTag) => {
    const confirmed = await deleteConfirm(`"${tag.name}" ${t('actions.delete.confirmation')}`, {
        rejectOnCancel: false,
    });
    if (confirmed === 'ok') {
        await deleteTag(tag.id);
    }
};

const getTagMenu = (tag: TransformedTag) => [
    {
        title: `Tag "${tag.name}"`,
        items: [
            { id: 'edit', label: 'Bearbeiten', icon: 'fas fa-pen', callback: () => openEditTag(tag) },
            {
                id: 'delete',
                label: 'Löschen',
                icon: { icon: 'fas fa-trash', class: 'text-red-500' },
                callback: () => onDeleteTag(tag),
            },
        ],
    },
];

const tasksByTag = computed(() => {
    const tagLists: Record<number, TransformedTask[]> = { 0: [] };
    tasks.value.forEach(task => {
        if (showTask(task)) {
            if (task.tags?.length) {
                task.tags?.forEach(tag => {
                    tagLists[tag] ??= [];
                    tagLists[tag].push(task);
                });
            } else {
                tagLists[0].push(task);
            }
        }
    });
    return tagLists;
});

const boardlists = computed(() => {
    const li: TransformedList[] = tagsArray.value.map(tag => ({ ...tag }));
    li.unshift({ id: 0, name: 'Kein Tag', dataCategoryId: projectId.value, sortKey: 0, type: 'list' });
    return li;
});
</script>
<template>
    <ViewWrapper :project-id="projectId">
        <template v-for="list in boardlists" :key="list.id">
            <List
                v-if="tasksByTag[list.id]"
                :allow-new-task="false"
                :is-draggable="false"
                :items="tasksByTag[list.id]"
                :list="list"
                :project-id="projectId"
            >
                <template #header>
                    <div class="flex items-center gap-2">
                        <Tag :color="list.color?.key ?? 'basic'" :label="list.name" />
                        <DropdownMenu v-if="list.id !== 0" :menu-items="getTagMenu(list)">
                            <Button color="basic" icon="fas fa-ellipsis-h" size="S" text />
                        </DropdownMenu>
                    </div>
                </template>
            </List>
        </template>
    </ViewWrapper>
    <DialogTag v-if="editTag" :project-id="projectId" :tag="editTag" @close="editTag = undefined" />
</template>
