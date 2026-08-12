import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  show: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 어드민 삭제 확인 모달 컴포넌트
 * - 삭제 작업 확인 UI 재사용
 * - 일관된 스타일 및 버튼 동작 제공
 */
const DeleteConfirmModal = ({
  show,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!show) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      const trigger = previousFocusRef.current;
      previousFocusRef.current = null;
      window.requestAnimationFrame(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [show]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;
    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!buttons || buttons.length === 0) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md space-y-4 border border-[var(--color-secondary)]/30 bg-[var(--color-bg)] p-6 font-mono shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="sr-only">DELETE ITEM</h2>
        <p id={descriptionId} className="text-sm text-[var(--color-secondary)] tracking-wider">
          {t('msg_confirm_delete_item', { name: itemName })}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm tracking-wider hover:bg-[var(--color-accent)]/20 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('msg_confirm_delete_action')}
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-sm tracking-wider hover:bg-[var(--color-secondary)]/20 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('btn_cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
