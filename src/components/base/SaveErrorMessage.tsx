import { useEffect, useRef } from 'react';

interface SaveErrorMessageProps {
  message: string;
}

/** 저장 실패 영역과 재시도 안내를 일관되게 표시한다. */
const SaveErrorMessage = ({ message }: SaveErrorMessageProps) => {
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message]);

  if (!message) return null;

  return (
    <p
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className="text-sm text-red-400 tracking-wider"
    >
      {message}
    </p>
  );
};

export default SaveErrorMessage;
