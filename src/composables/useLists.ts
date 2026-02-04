import { useCustomModuleDataValuesMutations, useCustomModuleDataValuesQuery } from '@churchtools/utils';
import { computed, onMounted, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { taskStore } from './storeTasks';
import { usePlugin } from './usePlugin';

export function useLists(projectId: MaybeRefOrGetter<number>) {
    const { moduleId } = usePlugin();
    const store = taskStore();
    const pId = computed(() => toValue(projectId));

    const { data, isLoading } = useCustomModuleDataValuesQuery<TaskList>(moduleId, pId);
    const { createCustomDataValue, updateCustomDataValue, deleteCustomDataValue } =
        useCustomModuleDataValuesMutations<TaskList>(moduleId, pId);

    const lists = computed(() => (data.value ?? []).filter(v => v.type === 'list' && v.dataCategoryId === pId.value));

    onMounted(() => createDefaultList());
    watch([() => pId.value, () => isLoading.value], () => createDefaultList());
    const createDefaultList = async () => {
        const creating = store.isCreatingDefaultList[pId.value] ?? false;
        if (!isLoading.value && !lists.value.some(l => l.isDefault) && !creating) {
            store.isCreatingDefaultList[pId.value] = true;
            await createList({
                name: 'Unsortiert',
                sortKey: 0,
                type: 'list',
                isDefault: true,
                isCollapsed: false,
            });
            store.isCreatingDefaultList[pId.value] = false;
        }
    };

    const createList = (list: TaskList) => {
        return createCustomDataValue({
            ...list,
            dataCategoryId: pId.value,
            type: 'list',
        });
    };

    const updateList = (list: TransformedList) =>
        updateCustomDataValue({ ...list, dataCategoryId: pId.value, type: 'list' });
    const deleteList = (listId: number) => deleteCustomDataValue({ id: listId, dataCategoryId: pId.value });

    const getListById = (id: number) => lists.value.find(l => l.id === id);

    return { lists, createList, updateList, getListById, deleteList };
}
