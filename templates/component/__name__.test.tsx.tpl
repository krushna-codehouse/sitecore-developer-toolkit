import { render, screen } from '@testing-library/react';
import {{name}} from './{{name}}';
import { mock{{name}}Props } from './{{name}}.mock';

describe('{{name}}', () => {
  it('renders the heading field', () => {
    render(<{{name}} {...mock{{name}}Props} />);
    expect(screen.getByRole('heading', { name: '{{titleName}} heading' })).toBeInTheDocument();
  });

  it('renders the link field', () => {
    render(<{{name}} {...mock{{name}}Props} />);
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/example');
  });

  it('shows a placeholder when the datasource is missing', () => {
    render(<{{name}} rendering={mock{{name}}Props.rendering} />);
    expect(screen.getByText(/datasource is not set/i)).toBeInTheDocument();
  });

  it('renders editable chrome in editing mode', () => {
    const { container } = render(
      <{{name}}
        {...mock{{name}}Props}
        fields={{ heading: { value: 'Heading', editable: '<span class="scChromeData">Heading</span>' } }}
      />,
    );
    expect(container.querySelector('.scChromeData')).not.toBeNull();
  });
});
