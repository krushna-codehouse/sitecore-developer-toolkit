import { render, screen } from '@testing-library/react';
import PromoCard from './PromoCard';
import { mockPromoCardProps } from './PromoCard.mock';

describe('PromoCard', () => {
  it('renders the heading field', () => {
    render(<PromoCard {...mockPromoCardProps} />);
    expect(screen.getByRole('heading', { name: 'Promo Card heading' })).toBeInTheDocument();
  });

  it('renders the link field', () => {
    render(<PromoCard {...mockPromoCardProps} />);
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/example');
  });

  it('shows a placeholder when the datasource is missing', () => {
    render(<PromoCard rendering={mockPromoCardProps.rendering} />);
    expect(screen.getByText(/datasource is not set/i)).toBeInTheDocument();
  });

  it('renders editable chrome in editing mode', () => {
    const { container } = render(
      <PromoCard
        {...mockPromoCardProps}
        fields={{ heading: { value: 'Heading', editable: '<span class="scChromeData">Heading</span>' } }}
      />,
    );
    expect(container.querySelector('.scChromeData')).not.toBeNull();
  });
});
