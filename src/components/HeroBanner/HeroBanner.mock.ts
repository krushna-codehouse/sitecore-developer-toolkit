import type { HeroBannerProps } from './HeroBanner.types';

/** Shared fixture for tests (and Storybook, if you add it). */
export const mockHeroBannerProps: HeroBannerProps = {
  rendering: { componentName: 'HeroBanner', uid: '00000000-0000-0000-0000-000000000000' },
  fields: {
    heading: { value: 'Hero Banner heading' },
    body: { value: '<p>Example body copy for Hero Banner.</p>' },
    link: { value: { href: '/example', text: 'Learn more' } },
  },
  params: { styles: '', RenderingIdentifier: 'hero-banner' },
};
