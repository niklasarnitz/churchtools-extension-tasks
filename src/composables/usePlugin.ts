import { useCustomModuleQuery } from '@churchtools/utils';
import { computed } from 'vue';

export function usePlugin() {
    const { data, isLoading } = useCustomModuleQuery(import.meta.env.VITE_KEY);
    const moduleId = computed(() => data.value?.id ?? -1);

    return {
        moduleId,
        isLoading,
    };
}
