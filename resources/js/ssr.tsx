import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import type { ComponentType } from 'react';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Nexus Inventory';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', {
    eager: true,
});

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => {
            const pageModule = pages[`./pages/${name}.tsx`];
            if (!pageModule) {
                throw new Error(`Inertia page not found: ${name}`);
            }
            return pageModule;
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
);
