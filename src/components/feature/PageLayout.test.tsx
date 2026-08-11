import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageLayout from './PageLayout';

describe('PageLayout', () => {
  it('renders the page heading and content synchronously without a cipher reveal', () => {
    render(
      <PageLayout title="Archive" titleExtra={['Signal']} subtitle="Current index">
        <p>Archive content is available immediately.</p>
      </PageLayout>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'ArchiveSignal' })).toBeVisible();
    expect(screen.getByText('Archive content is available immediately.')).toBeVisible();
  });
});
