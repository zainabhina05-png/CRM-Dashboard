/**
 * Custom render utility — wraps components with all required providers.
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Minimal mock providers
const MockAuthContext = ({ children, user = null, loading = false }) => {
  const ctx = {
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
  };

  // Dynamically inject context — components call useAuth() which uses React.useContext
  // We mock the module instead so we don't need to replicate provider internals
  return children;
};

const MockToastContext = ({ children }) => children;

/**
 * Renders with MemoryRouter + mocked providers.
 * @param {ReactElement} ui
 * @param {object} opts
 * @param {string[]} opts.initialEntries  MemoryRouter initial entries
 * @param {object}  opts.user             Authenticated user object (or null)
 */
export function renderWithRouter(ui, {
  initialEntries = ['/'],
  user = null,
  loading = false,
  ...renderOpts
} = {}) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...renderOpts });
}

export { render };
export * from '@testing-library/react';
