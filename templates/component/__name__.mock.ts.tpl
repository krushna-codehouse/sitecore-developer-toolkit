import type { {{name}}Props } from './{{name}}.types';

/** Shared fixture for tests (and Storybook, if you add it). */
export const mock{{name}}Props: {{name}}Props = {
  rendering: { componentName: '{{name}}', uid: '00000000-0000-0000-0000-000000000000' },
  fields: {
    heading: { value: '{{titleName}} heading' },
    body: { value: '<p>Example body copy for {{titleName}}.</p>' },
    link: { value: { href: '/example', text: 'Learn more' } },
  },
  params: { styles: '', RenderingIdentifier: '{{kebabName}}' },
};
