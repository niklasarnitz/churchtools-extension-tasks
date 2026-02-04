import { useCustomModuleDataValuesMutations, useCustomModuleDataValuesQuery } from '@churchtools/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usePlugin } from './usePlugin';

export function useTags(projectId: MaybeRefOrGetter<number>) {
    const { moduleId } = usePlugin();
    const pId = computed(() => toValue(projectId));

    const { data } = useCustomModuleDataValuesQuery<Tag>(moduleId, pId);
    const { createCustomDataValue, updateCustomDataValue, deleteCustomDataValue } =
        useCustomModuleDataValuesMutations<Tag>(moduleId, pId);

    const tags = computed(() => {
        const tags = (data.value ?? []).filter(v => v.type === 'tag' && v.dataCategoryId === pId.value);
        return Object.fromEntries(tags.map(tag => [tag.id, tag]));
    });
    const tagsArray = computed(() =>
        Object.values(tags.value).map(tag => ({
            ...tag,
            icon: 'fas fa-circle',
            color: { key: tag.color },
        })),
    );

    const createTag = (tag: Tag) => {
        const nextSortKey = Math.max(0, ...Object.values(tags.value).map(t => t.sortKey ?? 0)) + 1;
        return createCustomDataValue({
            ...tag,
            sortKey: tag.sortKey ?? nextSortKey,
            dataCategoryId: pId.value,
            type: 'tag',
        });
    };

    const updateTag = (tag: TransformedTag) =>
        updateCustomDataValue({ ...tag, dataCategoryId: pId.value, type: 'tag' });

    const deleteTag = (tagId: number) => deleteCustomDataValue({ id: tagId, dataCategoryId: pId.value });

    return { tags, tagsArray, createTag, updateTag, deleteTag };
}
