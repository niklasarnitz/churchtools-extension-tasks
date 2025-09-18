import { createApp, h } from 'vue';

import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { ctStyleguide } from '@churchtools/styleguide';
import { ctUtils } from '@churchtools/utils';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { provideApolloClient } from '@vue/apollo-composable';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './tailwind.css';
import '/node_modules/@churchtools/styleguide/dist/styleguide.css';

// only import reset.css in development mode to keep the production bundle small and to simulate CT environment
if (import.meta.env.MODE === 'development') {
    import('./assets/fontawesome/css/all.css');
    import('./utils/reset.css');
}

declare const window: Window &
    typeof globalThis & {
        settings: {
            base_url?: string;
        };
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

const KEY = import.meta.env.VITE_KEY;
export { KEY };

const pinia = createPinia();
if (import.meta.env.MODE === 'development') {
    window.tx = (e: string) => e;
    window.t = (e: string) => e;
    window.i18n = (e: string) => e;
    window.escapeHtmlMD = (e: string) => e;
    window.escapeHtmlRelaxed = (e: string) => e;
}

const cache = new InMemoryCache();
const apolloClient = new ApolloClient({ cache, uri: 'https://api.fontawesome.com' });
const app = createApp({
    setup() {
        provideApolloClient(apolloClient);
    },
    render: () => h(App),
});
app.use(ctUtils, { baseUrl, pinia, t: window.t ?? ((e: string) => e) });
app.use(ctStyleguide, { baseUrl, t: window.t ?? ((e: string) => e) });
app.use(pinia);
app.use(router);
app.use(VueQueryPlugin);
app.mount('#app');
