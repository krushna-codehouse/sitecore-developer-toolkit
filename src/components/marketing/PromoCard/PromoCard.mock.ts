import type { PromoCardProps } from './PromoCard.types';

/** Shared fixture for tests (and Storybook, if you add it). */
export const mockPromoCardProps: PromoCardProps = {
  rendering: { componentName: 'PromoCard', uid: '00000000-0000-0000-0000-000000000000' },
  fields: {
    heading: { value: 'Promo Card heading' },
    body: { value: '<p>Example body copy for Promo Card.</p>' },
    link: { value: { href: '/example', text: 'Learn more' } },
  },
  params: { styles: '', RenderingIdentifier: 'promo-card' },
};
