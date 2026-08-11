interface SaveErrorMessageProps {
  message: string;
}

/** 저장 실패 영역과 재시도 안내를 일관되게 표시한다. */
const SaveErrorMessage = ({ message }: SaveErrorMessageProps) => {
  if (!message) return null;

  return (
    <p role="alert" className="text-sm text-red-400 tracking-wider">
      {message}
    </p>
  );
};

export default SaveErrorMessage;
