import { useCurrentUser, useCustomModuleDataValuesMutations, useCustomModuleDataValuesQuery } from '@churchtools/utils';
import Fuse from 'fuse.js';
import { isEqual } from 'lodash-es';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { taskStore } from './storeTasks';
import { useLists } from './useLists';
import { usePlugin } from './usePlugin';

export function useTasks(projectId: MaybeRefOrGetter<number>) {
    const { moduleId } = usePlugin();
    const pId = computed(() => toValue(projectId));

    const currentUser = useCurrentUser();
    const { data, isLoading } = useCustomModuleDataValuesQuery<Task>(moduleId, pId);
    const { createCustomDataValue, updateCustomDataValue, deleteCustomDataValue } =
        useCustomModuleDataValuesMutations<Task>(moduleId, pId);

    const createTask = async (newTask: Task) => {
        return await createCustomDataValue({
            ...newTask,
            activity: [{ personId: currentUser.id, date: new Date().toISOString(), type: 'create' }],
            dataCategoryId: pId.value,
            type: 'task',
        });
    };
    const updateTask = async (task: TransformedTask, diff: Partial<TransformedTask> = {}) => {
        const activity = task.activity;
        activity?.push({ personId: currentUser.id, date: new Date().toISOString(), type: 'update', value: diff });
        const payload = { ...task, type: 'task' as const, dataCategoryId: pId.value };
        await updateCustomDataValue(payload);
    };
    const deleteTask = async (taskId: number) => {
        return await deleteCustomDataValue({ id: taskId, dataCategoryId: pId.value });
    };

    const store = taskStore();

    const getPercentFullfilled = (task: TransformedTask) => {
        const all = task.subTasks?.length ?? 0;
        const fullfilled = (task.subTasks ?? [])?.map(st => tasksMap.value[st]).filter(st => st?.fullfilled);
        return Math.floor((fullfilled.length / all) * 100);
    };

    const tasks = computed<TransformedTask[]>(() => {
        const tasks: TransformedTask[] = (data.value ?? []).filter(
            (v: TransformedTask | TransformedList) => v.type === 'task',
        );
        return tasks;
    });
    const transformedTasks = computed(() => {
        return tasks.value.map(task => ({
            ...task,
            parent: tasks.value.find(t => t.subTasks?.includes(task.id))?.id,
            score: tasksInSearch.value[task.id]?.score,
        }));
    });
    const tasksMap = computed(() => Object.fromEntries(tasks.value.map(t => [t.id, t])));

    const getObjectDiff = (obj1: Partial<Task>, obj2: Partial<Task>): (keyof Task)[] => {
        return (Object.keys(obj1) as (keyof Task)[]).reduce<(keyof Task)[]>(
            (result, key) => {
                if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
                    result.push(key);
                } else if (isEqual(obj1[key], obj2[key])) {
                    const resultKeyIndex = result.indexOf(key);
                    result.splice(resultKeyIndex, 1);
                }
                return result as (keyof Task)[];
            },
            Object.keys(obj2) as (keyof Task)[],
        );
    };

    const tasksInSearch = computed(() => {
        if (store.search) {
            const fuse = new Fuse(tasks.value, {
                includeScore: true,
                minMatchCharLength: 2,
                threshold: 0.4,
                keys: ['name', { name: 'description', weight: 0.5 }, { name: 'url', weight: 0.3 }],
            });
            return Object.fromEntries(
                fuse.search(store.search).map(task => [task.item.id, { ...task.item, score: task.score }]),
            );
        }
        return Object.fromEntries(tasks.value.map(task => [task.id, { ...task, score: undefined }]));
    });

    const { getListById, lists } = useLists(pId);
    const showTask = (task: TransformedTask) => {
        const defaultListId = lists.value.find(l => l.isDefault)?.id ?? 0;
        const listId = task.list && getListById(task.list) ? task.list : defaultListId;
        const showCompleted = getListById(listId)?.showCompleted ?? false;
        const showSubTasks = getListById(listId)?.showSubTasks ?? false;
        return (
            tasksInSearch.value[task.id] &&
            ((!showCompleted && !task.fullfilled) || showCompleted) &&
            ((!showSubTasks && !task.parent) || showSubTasks)
        );
    };

    const findParent = (t: TransformedTask) => tasks.value.find(task => task.subTasks?.includes(t?.id));

    const calculateDueDate = (t: TransformedTask): Date | undefined => {
        let dueDate = t.dueDate ? new Date(t.dueDate) : undefined;

        if (t.dueDateRelative) {
            const parentTask = findParent(t);

            if (parentTask) {
                const parentDueDate = calculateDueDate(parentTask);
                if (parentDueDate) {
                    dueDate = new Date(parentDueDate.getTime() - t.dueDateRelative * 24 * 60 * 60 * 1000);
                }
            }
        }
        return dueDate;
    };

    const getSuperParent = (t: TransformedTask): TransformedTask => {
        const parent = findParent(t);
        if (parent) {
            return getSuperParent(parent);
        }
        return t;
    };
    return {
        projectId,
        tasksMap,
        tasks,
        showTask,
        createTask,
        updateTask,
        getObjectDiff,
        calculateDueDate,
        deleteTask,
        isLoading,
        findParent,
        getSuperParent,
        getPercentFullfilled,
        transformedTasks,
    };
}
