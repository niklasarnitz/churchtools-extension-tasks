import { useCustomModuleDataValuesMutations, useCustomModuleDataValuesQuery } from '@churchtools/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usePlugin } from './usePlugin';

export function useTags(projectId: MaybeRefOrGetter<number>) {
    const { moduleId } = usePlugin();
    const pId = computed(() => toValue(projectId));

    const { data } = useCustomModuleDataValuesQuery<Tag>(moduleId, pId);
    const { createCustomDataValue, updateCustomDataValue } = useCustomModuleDataValuesMutations<Tag>(moduleId, pId);

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

    const createTag = (tag: Tag) => createCustomDataValue({ ...tag, dataCategoryId: pId.value, type: 'tag' });

    const updateTag = (tag: TransformedTag) =>
        updateCustomDataValue({ ...tag, dataCategoryId: pId.value, type: 'tag' });

    return { tags, tagsArray, createTag, updateTag };
}
