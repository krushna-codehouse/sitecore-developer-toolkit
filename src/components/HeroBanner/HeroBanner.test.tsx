import { render, screen } from '@testing-library/react';
import HeroBanner from './HeroBanner';
import { mockHeroBannerProps } from './HeroBanner.mock';

describe('HeroBanner', () => {
  it('renders the heading field', () => {
    render(<HeroBanner {...mockHeroBannerProps} />);
    expect(screen.getByRole('heading', { name: 'Hero Banner heading' })).toBeInTheDocument();
  });

  it('renders the link field', () => {
    render(<HeroBanner {...mockHeroBannerProps} />);
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/example');
  });

  it('shows a placeholder when the datasource is missing', () => {
    render(<HeroBanner rendering={mockHeroBannerProps.rendering} />);
    expect(screen.getByText(/datasource is not set/i)).toBeInTheDocument();
  });

  it('renders editable chrome in editing mode', () => {
    const { container } = render(
      <HeroBanner
        {...mockHeroBannerProps}
        fields={{ heading: { value: 'Heading', editable: '<span class="scChromeData">Heading</span>' } }}
      />,
    );
    expect(container.querySelector('.scChromeData')).not.toBeNull();
  });
});
