import {
    notNullish,
    transformPersonToDomainObject,
    useCurrentUser,
    useCustomModuleDataValuesMutations,
    usePersonsQueryAllPages,
} from '@churchtools/utils';
import { sortBy } from 'lodash-es';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usePlugin } from './usePlugin';
import { useTags } from './useTags';
import { useTasks } from './useTasks';

export function useTask(projectId: MaybeRefOrGetter<number>, taskId: MaybeRefOrGetter<number | undefined>) {
    const pId = computed(() => toValue(projectId));
    const tId = computed(() => toValue(taskId));
    const { moduleId } = usePlugin();
    const { updateCustomDataValue, deleteCustomDataValue } = useCustomModuleDataValuesMutations<Task>(moduleId, pId);
    const { tasksMap, findParent, calculateDueDate, getSuperParent, getPercentFullfilled } = useTasks(pId);

    const task = computed(() => (tId.value ? (tasksMap.value[tId.value] ?? {}) : undefined));

    const percentFullfilled = computed(() => {
        return getPercentFullfilled(task.value);
    });

    const parent = computed(() => {
        const parent = findParent(task.value);
        if (parent) {
            parent.dueDate = calculateDueDate(parent);
        }
        return parent;
    });

    const superParent = computed(() => findParent(task.value) && getSuperParent(task.value));

    const hasSubTasks = computed(
        () => !!(task.value?.subTasks ?? []).map(st => tasksMap.value[st]).filter(st => st).length,
    );

    const filter = computed(() => ({ ids: task.value?.assignedTo ?? [] }));
    const { data } = usePersonsQueryAllPages(filter, { enabled: () => !!filter.value.ids.length });
    const personMap = computed(() =>
        Object.fromEntries((data.value ?? []).map(p => [p.id, transformPersonToDomainObject(p)])),
    );

    const assignees = computed(() => (task.value?.assignedTo ?? [])?.map(id => personMap.value[id]).filter(notNullish));

    const { tags } = useTags(pId);
    const sortedTags = computed(() => {
        const tt = (task.value?.tags ?? [])?.map(t => tags.value[t]).filter(t => !!t);
        return sortBy(tt, 'name');
    });

    const currentUser = useCurrentUser();
    const toggleTask = () => {
        const activity = task.value?.activity ?? [];
        activity.push({
            personId: currentUser.id,
            date: new Date().toISOString(),
            type: 'fullfilled',
            value: !task.value.fullfilled,
        });
        const payload = { ...task.value, fullfilled: !task.value.fullfilled, activity };
        updateCustomDataValue(payload);
    };
    const deleteTask = () => deleteCustomDataValue({ id: tId.value, dataCategoryId: pId.value });

    const comments = computed(() => (task.value?.activity ?? [])?.filter(a => a.type === 'comment'));

    const dueDate = computed(() => calculateDueDate(task.value));
    const dueColor = computed(() => {
        if (!dueDate.value) {
            return;
        }
        const dd = new Date(dueDate.value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (dd < now) {
            return 'red';
        }
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const diff = dd.getTime() - now.getTime();

        const nextDay = 1;
        if (diff < millisecondsPerDay * nextDay) {
            return 'green';
        }
        return 'basic';
    });

    const toDayMonth = (date: string) => {
        return new Date(date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    };

    return {
        projectId,
        task,
        assignees,
        sortedTags,
        dueColor,
        dueDate,
        comments,
        parent,
        hasSubTasks,
        toggleTask,
        deleteTask,
        toDayMonth,
        superParent,
        calculateDueDate,
        percentFullfilled,
    };
}
