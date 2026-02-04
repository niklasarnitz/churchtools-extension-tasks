<script setup lang="ts">
import { DialogSmall, Input, SelectDropdown } from '@churchtools/styleguide';
import { useColors } from '@churchtools/utils';
import { computed, ref, toRef, watch } from 'vue';
import { useTags } from '../composables/useTags';

const props = withDefaults(
    defineProps<{
        projectId: number;
        tag?: Tag | TransformedTag;
    }>(),
    { tag: undefined },
);
const { ctColors } = useColors();

const emit = defineEmits<{ (event: 'close'): void }>();

const colors = computed(() =>
    ctColors.map(c => ({ id: c.key, label: c.label ?? c.name ?? c.key, color: c, icon: 'fas fa-circle' })),
);
const { createTag, updateTag } = useTags(toRef(() => props.projectId));
const tag = ref({ ...(props.tag ?? {}) } as Tag | TransformedTag);
const isEdit = computed(() => !!props.tag?.id);
watch(
    () => props.tag,
    value => {
        tag.value = { ...(value ?? {}) } as Tag | TransformedTag;
    },
);
const onSave = (close: () => void) => {
    if (isEdit.value) {
        updateTag(tag.value as TransformedTag);
    } else {
        createTag(tag.value as Tag);
    }
    close();
};
</script>
<template>
    <DialogSmall :title="isEdit ? 'Tag bearbeiten' : 'Neuen Tag anlegen'" @close="emit('close')" @save="onSave">
        <div class="flex flex-col gap-4">
            <Input v-model="tag.name" label="Name" />
            <SelectDropdown
                v-model="tag.color"
                class="max-w-[320px]"
                :clear="false"
                emit-id
                label="Farbe"
                :options="colors"
            />
        </div>
    </DialogSmall>
</template>
