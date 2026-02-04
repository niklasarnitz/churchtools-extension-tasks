<script setup lang="ts">
import { DomainObject, Tag } from '@churchtools/styleguide';
import { computed, ref } from 'vue';
import { useTask } from '../../composables/useTask';
import { useTasks } from '../../composables/useTasks';
import TaskItem from '../TaskItem.vue';
import Activities from './Activities.vue';
import TaskDetails from './TaskDetails.vue';

const props = defineProps<{ taskId: number; projectId: number }>();
const tId = computed(() => props.taskId);
const pId = computed(() => props.projectId);

const { task, sortedTags, assignees } = useTask(pId, tId);
const subTasks = computed(() => (task.value?.subTasks ?? []).map(st => tasksMap.value[st]).filter(st => st));

const { updateTask, tasksMap } = useTasks(pId);

const currentTab = ref<'overview' | 'details'>('overview');

const onComment = (activities: ActivityEntry[]) => {
    if (!task.value) {
        return;
    }
    updateTask({ ...task.value, activity: activities });
};

const onUpdateTask = (updatedTask: TransformedTask) => {
    updateTask(updatedTask);
};
</script>
<template>
    <div class="flex flex-col gap-4">
        <div class="flex gap-2 border-b">
            <button
                class="px-3 py-2 font-bold"
                :class="currentTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'"
                @click="currentTab = 'overview'"
            >
                Übersicht
            </button>
            <button
                class="px-3 py-2 font-bold"
                :class="currentTab === 'details' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'"
                @click="currentTab = 'details'"
            >
                Details
            </button>
        </div>

        <div v-if="currentTab === 'overview'" class="grid grid-cols-4 gap-3">
            <div class="col-span-3 flex flex-col gap-8">
                <div class="whitespace-pre-line">{{ task?.description }}</div>
                <div class="border-basic-divider border-b"></div>
                <div v-if="subTasks.length" class="flex flex-col gap-4">
                    <div>
                        <div class="text-lg font-bold">Unteraufgaben</div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <TaskItem
                            v-for="subtask in subTasks"
                            :key="subtask.id"
                            :item="subtask"
                            :project-id="projectId"
                        />
                    </div>
                </div>
                <Activities v-if="task?.activity" :activities="task?.activity" @comment="onComment" />
            </div>
            <div class="flex flex-col gap-4">
                <div v-if="sortedTags.length">
                    <div class="text-basic-secondary">Tags:</div>
                    <div class="flex gap-2">
                        <Tag v-for="tag in sortedTags" :key="tag.id" :color="tag.color" :label="tag.name" size="S" />
                    </div>
                </div>
                <div v-if="assignees.length">
                    <div class="text-basic-secondary">Assignee:</div>
                    <div class="flex flex-col gap-2">
                        <div
                            v-for="assignee in assignees"
                            :key="assignee.domainIdentifier"
                            class="flex items-center gap-2"
                        >
                            <DomainObject :domain-object="assignee" size="S" />
                            <span class="font-bold">{{ assignee.title }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="currentTab === 'details' && task">
            <TaskDetails :task="task" @update:task="onUpdateTask" />
        </div>
    </div>
</template>
