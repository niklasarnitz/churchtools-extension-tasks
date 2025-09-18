import { deleteConfirm } from '@churchtools/styleguide';
import {
    t,
    useCustomModuleDataCategoriesQuery,
    useCustomModuleDataCategoryMutations,
    useToasts,
} from '@churchtools/utils';
import { computed } from 'vue';
import { usePlugin } from '../composables/usePlugin';
import { ICONS, txx } from '../utils/utils';

export default function useProjects() {
    const { moduleId } = usePlugin();
    const { successToast } = useToasts();
    const { data: categories } = useCustomModuleDataCategoriesQuery<Project>(moduleId);
    const { createDataCategory, updateDataCategory, deleteDataCategory } =
        useCustomModuleDataCategoryMutations<Project>(moduleId);

    const projects = computed(() => (categories.value ?? []).filter(cat => cat.shorty?.startsWith('project')));

    const createProject = async (project: Project) => {
        const lastId = projects.value[projects.value.length - 1]?.id ?? 0;
        await createDataCategory({
            color: 'basic',
            icon: ICONS.DEFAULT_PROJECT,
            ...project,
            description: project.description ?? '',
            shorty: `project_${lastId + 1}`,
            securityLevelId: 1,
            customModuleId: moduleId.value,
        });
        successToast(t('actions.create.success'));
    };
    const updateProject = async (project: Project) => {
        await updateDataCategory({ ...project, description: project.description ?? '' });
        successToast(t('actions.save.success'));
    };

    const deleteProject = async (id: number) => {
        const confirmed = await deleteConfirm(txx('Das Projekt und alle seine Aufgaben werden gelöscht.'), {
            rejectOnCancel: false,
        });
        if (confirmed === 'ok') {
            const result = await deleteDataCategory(id);
            successToast(t('actions.delete.success'));
            return result;
        }
    };
    return {
        projects,
        createProject,
        updateProject,
        deleteProject,
    };
}
