<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    percent: number;
}>();
const radius = 10;
const strokeWidth = 2;
const circumference = radius * 2 * Math.PI;

const strokeDasharray = computed(() => `${circumference} ${circumference}`);
const strokeDashoffset = computed(() => {
    const offset = circumference - (props.percent / 100) * circumference;
    return offset;
});
const width = computed(() => 22);
</script>
<template>
    <div class="relative">
        <svg class="progress-ring" :height="width" :width="width">
            <circle
                class="progress-ring__circle"
                :cx="radius + strokeWidth / 2"
                :cy="radius + strokeWidth / 2"
                fill="transparent"
                :r="radius"
                :stroke-width="strokeWidth"
                :style="`stroke-dasharray: ${strokeDasharray}; stroke-dashoffset: ${strokeDashoffset}`"
            />
        </svg>
        <span class="absolute">{{ percent }}%</span>
    </div>
</template>
<style scoped>
.progress-ring {
    flex-shrink: 0;
}

.progress-ring__circle {
    fill: var(--color-basic-b-pale);
    stroke: var(--color-green-bright);
    transition: 0.35s stroke-dashoffset;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
}
span {
    color: black;
    font-size: 8px;
    top: 0;
    width: 22px;
    text-align: center;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
