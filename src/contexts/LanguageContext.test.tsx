import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext';

const LanguageControls = () => {
  const { setLanguage } = useLanguage();

  return <button type="button" onClick={() => setLanguage('ko')}>한국어</button>;
};

describe('LanguageProvider', () => {
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
