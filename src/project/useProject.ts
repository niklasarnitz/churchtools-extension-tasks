import { computed, unref, type MaybeRefOrGetter } from 'vue';
import useProjects from './useProjects';

export function useProject(projectId: MaybeRefOrGetter<number>) {
    const { projects } = useProjects();
    const project = computed(() => projects.value.find(p => p.id === unref(projectId)) ?? null);
    return { project };
}
