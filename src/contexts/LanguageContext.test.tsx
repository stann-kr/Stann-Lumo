import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const LanguageControls = () => {
  const { setLanguage } = useLanguage();

  return <button type="button" onClick={() => setLanguage('ko')}>한국어</button>;
};

describe('LanguageProvider', () => {
  beforeEach(() => {
    document.cookie = 'stann_lumo_language=; Max-Age=0; path=/';
    window.localStorage.clear();
    refresh.mockReset();
  });

  it('keeps the document language aligned with the selected content language', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('app_language', 'en');

    render(
      <LanguageProvider>
        <LanguageControls />
      </LanguageProvider>,
    );

    await waitFor(() => expect(document.documentElement).toHaveAttribute('lang', 'en'));
    await user.click(screen.getByRole('button', { name: '한국어' }));
    await waitFor(() => expect(document.documentElement).toHaveAttribute('lang', 'ko'));
  });
});
