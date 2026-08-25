import type { Preview } from '@storybook/react-vite';

import '../../../resources/css/app.css';

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'app',
            values: [{ name: 'app', value: 'var(--background)' }],
        },
    },
    decorators: [
        (Story) => (
            <div className="dark bg-background p-6 text-foreground">
                <Story />
            </div>
        ),
    ],
};

export default preview;
