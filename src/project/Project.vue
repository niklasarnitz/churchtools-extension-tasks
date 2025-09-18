<script setup lang="ts">
import { PageHeader, Subgrid } from '@churchtools/styleguide';
import { toRef } from 'vue';
import { ICONS } from '../utils/utils';
import { useProject } from './useProject';
const props = defineProps<{ projectId: string }>();
defineEmits<{ (event: 'edit-project', project: Project): void }>();

const { project } = useProject(toRef(() => parseInt(props.projectId)));
</script>
<template>
    <Subgrid class="grow">
        <div class="flex grow flex-col">
            <PageHeader
                class="pt-page-header-full-width mb-page-header-full-width mx-4 lg:mx-6"
                :color="project?.color ?? 'basic'"
                :description="project?.description"
                :icon="project?.icon ?? ICONS.DEFAULT_PROJECT"
                :title="project?.name"
            >
            </PageHeader>

            <RouterView />
        </div>
    </Subgrid>
</template>
