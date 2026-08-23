import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

vi.mock('@/components/feature/ProtectedRoute', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/contexts/ContentContext', () => ({
  ContentProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/feature/AdminLayout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <section>
      <button type="button">BACK TO SITE</button>
      <button type="button">LOGOUT</button>
      {children}
    </section>
  ),
}));
vi.mock('@/components/feature/AdminContentGate', () => ({
  default: () => <p role="status">LOADING CONTENT...</p>,
}));

describe('DashboardLayout', () => {
  it('keeps the admin shell available while the content gate suppresses the editor', () => {
    render(
      <DashboardLayout>
        <button type="button">EDITOR SAVE</button>
      </DashboardLayout>,
    );

    expect(screen.getByRole('button', { name: 'BACK TO SITE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LOGOUT' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('LOADING CONTENT...');
    expect(screen.queryByRole('button', { name: 'EDITOR SAVE' })).not.toBeInTheDocument();
  });
});
