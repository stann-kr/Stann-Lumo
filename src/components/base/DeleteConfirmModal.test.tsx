import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import DeleteConfirmModal from './DeleteConfirmModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name: string }) => values?.name ? `${key}:${values.name}` : key,
  }),
}));

const DeleteHarness = () => {
  const { isOpen, openConfirm, closeConfirm } = useDeleteConfirm();

  return (
    <div>
      <button type="button" onClick={() => openConfirm(0)}>OPEN DELETE</button>
      <DeleteConfirmModal
        show={isOpen}
        itemName="Fixture"
        onConfirm={closeConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

describe('DeleteConfirmModal', () => {
  it('uses dialog semantics, focuses cancel first, and restores the opener on escape', async () => {
    const user = userEvent.setup();
    render(<DeleteHarness />);

    const opener = screen.getByRole('button', { name: 'OPEN DELETE' });
    await user.click(opener);

    const dialog = await screen.findByRole('dialog', { name: 'DELETE ITEM' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('msg_confirm_delete_item:Fixture');
    await waitFor(() => expect(screen.getByRole('button', { name: 'btn_cancel' })).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
