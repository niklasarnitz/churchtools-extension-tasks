<script setup lang="ts">
import { Card, ContentWrapper, EmptyState, LoadingMessage } from '@churchtools/styleguide';
import { useCustomModuleDataCategoriesQuery } from '@churchtools/utils';
import { computed } from 'vue';
import { usePlugin } from '../composables/usePlugin';
import { createOrEditProject } from '../project/projectHelper';
import { ICONS, txx } from '../utils/utils';

defineEmits<{ (event: 'edit-project', project: Project): void }>();
const { moduleId, isLoading } = usePlugin();
const { data } = useCustomModuleDataCategoriesQuery(moduleId);
const projects = computed(() => (data.value ?? []).filter(cat => cat.shorty.startsWith('project')) as Project[]);
</script>
<template>
    <div>
        <LoadingMessage v-if="isLoading" />
        <EmptyState
            v-else-if="projects.length === 0"
            :action="{
                label: txx('Neues Projekt'),
                color: 'green',
                icon: 'fas fa-plus',
                onClick: createOrEditProject,
            }"
            icon="fas fa-tasks"
            :title="txx('Noch keine Projekte')"
        />
        <ContentWrapper v-else :icon="ICONS.MAIN" max-width :title="txx('Projekte')">
            <div class="grid h-full w-full auto-rows-min place-items-center gap-4 md:grid-cols-2">
                <RouterLink
                    v-for="project in projects"
                    :key="project.id"
                    class="h-full w-full"
                    :to="{ name: 'project', params: { projectId: project.id } }"
                >
                    <Card class="hover:border-basic-300 h-full">
                        <div class="flex items-center gap-4">
                            <div
                                class="flex h-10 w-10 items-center justify-center rounded-full"
                                :style="`color: var(--color-${project.color}-bright); background: var(--color-${project.color}-b-pale)`"
                            >
                                <i :class="project.icon"></i>
                            </div>
                            <div class="flex-grow text-xl font-bold">
                                {{ project.name }}
                            </div>
                            <i class="fas fa-chevron-right text-ter fa-fw"></i>
                        </div>
                        <div v-if="project.description" class="text-sec mt-3 line-clamp-3">
                            {{ project.description }}
                        </div>
                    </Card>
                </RouterLink>
            </div>
        </ContentWrapper>
    </div>
</template>
