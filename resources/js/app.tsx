import axios from 'axios';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

const appName = import.meta.env.VITE_APP_NAME || 'Nexus Inventory';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const loader = pages[`./pages/${name}.tsx`];
        if (!loader) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        const module = await loader();
        return module.default;
    },
    setup({ el, App, props }) {
        if (el) {
            createRoot(el).render(
                <StrictMode>
                    <App {...props} />
                </StrictMode>,
            );
        }
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
