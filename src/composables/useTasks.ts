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
    const updateTask = async (task: TransformedTask, diff?: any) => {
        const activity = task.activity;
        if (diff) {
            activity?.push({ personId: currentUser.id, date: new Date().toISOString(), type: 'update', value: diff });
        }
        const payload = { ...task, type: 'task' as const, dataCategoryId: pId.value };
        await updateCustomDataValue(payload);
    };
    const deleteTask = async (taskId: number) => {
        return await deleteCustomDataValue({ id: taskId, dataCategoryId: pId.value });
    };

    const moveTask = async (task: TransformedTask, newProjectId: number) => {
        const { createCustomDataValue: createInNewProject } = useCustomModuleDataValuesMutations<Task>(
            moduleId.value,
            newProjectId,
        );

        const removeFromParent = async (child: TransformedTask) => {
            const parent = findParent(child);
            if (!parent) {
                return;
            }
            const subTasks = (parent.subTasks ?? []).filter(id => id !== child.id);
            await updateCustomDataValue({ ...parent, subTasks, dataCategoryId: pId.value, type: 'task' });
        };

        const cloneTaskTree = async (source: TransformedTask): Promise<TransformedTask> => {
            const newSubTaskIds: number[] = [];
            if (source.subTasks?.length) {
                for (const subTaskId of source.subTasks) {
                    const subTask = tasksMap.value[subTaskId];
                    if (subTask) {
                        const createdSubTask = await cloneTaskTree(subTask);
                        newSubTaskIds.push(createdSubTask.id);
                    }
                }
            }

            const { id: _id, dataCategoryId: _dataCategoryId, ...payload } = source;
            void _id;
            void _dataCategoryId;
            return (await createInNewProject({
                ...payload,
                list: undefined,
                subTasks: newSubTaskIds,
                dataCategoryId: newProjectId,
                type: 'task',
            })) as unknown as TransformedTask;
        };

        const deleteTaskTree = async (source: TransformedTask) => {
            if (source.subTasks?.length) {
                for (const subTaskId of source.subTasks) {
                    const subTask = tasksMap.value[subTaskId];
                    if (subTask) {
                        await deleteTaskTree(subTask);
                    }
                }
            }
            await deleteCustomDataValue({ id: source.id, dataCategoryId: pId.value });
        };

        await removeFromParent(task);
        const newTask = await cloneTaskTree(task);
        await deleteTaskTree(task);
        return newTask;
    };

    const store = taskStore();

    const getPercentFullfilled = (task: TransformedTask) => {
        const all = task.subTasks?.length ?? 0;
        if (all === 0) {
            return 0;
        }
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

    const getObjectDiff = (obj1: Partial<Task>, obj2: Partial<Task>) => {
        const allKeys = new Set<keyof Task>([
            ...(Object.keys(obj1) as (keyof Task)[]),
            ...(Object.keys(obj2) as (keyof Task)[]),
        ]) as Set<keyof Task>;
        return Array.from(allKeys).reduce<Partial<Record<keyof Task, { from: any; to: any }>>>((result, key) => {
            if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
                result[key] = { from: obj2[key], to: undefined };
            } else if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
                result[key] = { from: undefined, to: obj1[key] };
            } else if (!isEqual(obj1[key], obj2[key])) {
                result[key] = { from: obj2[key], to: obj1[key] };
            }
            return result;
        }, {});
    };

    const fuseInstance = computed(() => {
        if (store.search) {
            return new Fuse(tasks.value, {
                includeScore: true,
                minMatchCharLength: 2,
                threshold: 0.4,
                keys: ['name', { name: 'description', weight: 0.5 }, { name: 'url', weight: 0.3 }],
            });
        }
        return null;
    });
    const tasksInSearch = computed(() => {
        if (!fuseInstance.value) {
            return Object.fromEntries(tasks.value.map(task => [task.id, { ...task, score: undefined }]));
        }
        return Object.fromEntries(
            fuseInstance.value.search(store.search).map(task => [task.item.id, { ...task.item, score: task.score }]),
        );
    });

    const { getListById, lists } = useLists(pId);
    const showTask = (task: TransformedTask) => {
        const defaultListId = lists.value.find(l => l.isDefault)?.id ?? 0;
        const listId = task.list && getListById(task.list) ? task.list : defaultListId;
        const listShowCompleted = getListById(listId)?.showCompleted ?? false;
        const listShowSubTasks = getListById(listId)?.showSubTasks ?? false;
        const showCompleted = store.showFullfilled ? listShowCompleted : false;
        const showSubTasks = store.showSubTasks ? listShowSubTasks : false;
        const parent = findParent(task);
        return (
            tasksInSearch.value[task.id] &&
            ((!showCompleted && !task.fullfilled) || showCompleted) &&
            ((!showSubTasks && !parent) || showSubTasks)
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
        moveTask,
        isLoading,
        findParent,
        getSuperParent,
        getPercentFullfilled,
        transformedTasks,
    };
}
