import { render, screen } from '@testing-library/react';
import App from './App';

test('renders search form and button', () => {
  render(<App />);
  const searchForm = screen.getByRole('search');
  const searchButton = screen.getByRole('button', { name: 'Search' });

  expect(searchForm).toBeInTheDocument();
  expect(searchButton).toBeInTheDocument();
});
