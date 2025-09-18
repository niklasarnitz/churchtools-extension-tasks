<script setup lang="ts">
import { DialogSmall, Input, SelectDropdown } from '@churchtools/styleguide';
import { useColors } from '@churchtools/utils';
import { computed, ref, toRef } from 'vue';
import { useTags } from '../composables/useTags';

const props = defineProps<{
    projectId: number;
}>();
const { ctColors } = useColors();

const emit = defineEmits<{ (event: 'close'): void }>();

const colors = computed(() => ctColors.map(c => ({ id: c.key, label: c.key, color: c, icon: 'fas fa-circle' })));
const { createTag } = useTags(toRef(() => props.projectId));
const tag = ref({} as Tag);
const onSave = (close: () => void) => {
    createTag(tag.value);
    close();
};
</script>
<template>
    <DialogSmall title="Neuen Tag anlegen" @close="emit('close')" @save="onSave">
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
