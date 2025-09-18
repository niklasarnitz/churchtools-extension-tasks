import { mountDialog } from '@churchtools/styleguide';
import { createApp, h } from 'vue';
import DialogProject from './DialogProject.vue';

export function createOrEditProject(project: Project | undefined = undefined) {
    return new Promise<void>(resolve => {
        const app = createApp({
            render: function () {
                return h(DialogProject, {
                    project,
                    onClose: () => {
                        resolve(undefined);
                        app.unmount();
                    },
                });
            },
        });
        mountDialog(app);
    });
}
