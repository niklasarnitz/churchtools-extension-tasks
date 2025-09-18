import { useCustomModuleDataCategoriesQuery, useCustomModuleDataCategoryMutations } from '@churchtools/utils';
import { computed } from 'vue';
import { usePlugin } from '../composables/usePlugin';

export default function useProjects() {
    const { moduleId } = usePlugin();
    const { data: categories } = useCustomModuleDataCategoriesQuery<Project>(moduleId);
    const { createDataCategory, updateDataCategory, deleteDataCategory } =
        useCustomModuleDataCategoryMutations<Project>(moduleId);

    const projects = computed(() => (categories.value ?? []).filter(cat => cat.shorty?.startsWith('project')));

    const createProject = (project: Project) => {
        const lastId = projects.value[projects.value.length - 1]?.id ?? 0;
        createDataCategory({
            color: 'basic',
            icon: 'fas fa-circle',
            ...project,
            description: project.description ?? '',
            shorty: `project_${lastId + 1}`,
            securityLevelId: 1,
            customModuleId: moduleId.value,
        });
    };
    const updateProject = (project: Project) => {
        updateDataCategory({ ...project, description: project.description ?? '' });
    };

    const deleteProject = (id: number) => {
        deleteDataCategory(id);
    };
    return {
        projects,
        createProject,
        updateProject,
        deleteProject,
    };
}
