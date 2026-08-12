import { useId, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { createBorderMid, createBorderAccent } from '../../utils/colorMix';

interface FormTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'rows' | 'className'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  /** 컴포넌트 컨테이너에 적용할 추가 클래스 */
  className?: string;
}

/**
 * 어드민 폼 텍스트 영역 컴포넌트
 * - label + textarea 반복 패턴 통합
 * - 일관된 스타일 및 포커스 효과 제공
 */
const FormTextarea = ({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  className = '',
  id: suppliedId,
  name: suppliedName,
  onFocus,
  onBlur,
  ...textareaProps
}: FormTextareaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const textareaId = suppliedId ?? generatedId;
  const textareaName = suppliedName ?? textareaId;

  return (
    <div className={className}>
      <label
        htmlFor={textareaId}
        className="block text-xs text-[var(--color-accent)] tracking-widest mb-2"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        name={textareaName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        {...textareaProps}
        className="w-full bg-transparent border text-[var(--color-secondary)] text-sm leading-relaxed p-3 focus:outline-none transition-colors resize-none"
        style={isFocused ? createBorderAccent() : createBorderMid()}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
      />
    </div>
  );
};

export default FormTextarea;
