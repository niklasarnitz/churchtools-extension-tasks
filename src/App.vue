<script setup lang="ts">
import { Grid, GridHeader } from '@churchtools/styleguide';
import { useBodyScrollbarWidth } from '@churchtools/utils';
import { computed } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useRoute } from 'vue-router';
import { createOrEditProject } from './project/projectHelper';
import useProjects from './project/useProjects';
import { ICONS, txx } from './utils/utils';

useBodyScrollbarWidth();

const isSmallScreen = computed(() => window.innerWidth < 768);
const route = useRoute();

const actions = computed(() => {
    const actions: ComponentProps<typeof GridHeader>['actions'] = [
        [
            {
                color: 'violet',
                icon: 'fas fa-bug',
                href: 'https://github.com/aschojz/churchtools-tasks/issues',
                label: isSmallScreen.value ? '' : txx('Fehler melden'),
                outlined: true,
                size: 'S',
                target: '_blank',
            },
        ],
    ];

    if (route.name === 'overview') {
        actions.push([
            {
                color: 'green',
                icon: 'fas fa-plus',
                label: isSmallScreen.value ? '' : txx('Neues Projekt'),
                size: 'S',
                onClick: createOrEditProject,
            },
        ]);
    }
    return actions;
});

const { projects: p } = useProjects();
const projects = computed(() => {
    const menu: ComponentProps<typeof Grid>['menu'] = [{ items: [] }];
    p.value.forEach(proj =>
        menu[0].items.push({
            title: proj.name,
            icon: proj.icon ?? ICONS.DEFAULT_PROJECT,
            color: proj.color ?? 'basic',
            key: proj.id.toString(),
            to: { name: 'project', params: { projectId: proj.id } },
        }),
    );
    return menu;
});
</script>
<template>
    <div id="tasks" class="flex grow flex-col" style="--menu-height: 0px">
        <Grid :menu="projects" min-height="56px" storage-key="ext-tasks">
            <template #header>
                <GridHeader :actions="actions" :icon="ICONS.MAIN" :title="txx('Aufgabenverwaltung')" />
            </template>
            <RouterView />
        </Grid>
    </div>
    <div id="modal-container"></div>
</template>
<style>
#tasks {
    --color-link: var(--color-accent-bright);
    a {
        color: inherit;
        text-decoration: none;
    }
    a:hover {
        text-decoration: none;
    }
}
</style>
