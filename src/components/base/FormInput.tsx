import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { createBorderMid, createBorderAccent } from '../../utils/colorMix';

/**
 * FormInput Props 정의
 */
interface FormInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  /** 입력 필드 라벨 */
  label: string;
  /** 현재 입력값 */
  value: string;
  /** 값 변경 시 호출될 콜백 함수 */
  onChange: (value: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
}

/**
 * 폼 입력 필드 컴포넌트
 * 
 * 라벨과 입력 필드를 포함한 통일된 폼 요소를 제공함
 * - CSS 변수 기반 테마 색상 적용
 * - 포커스 시 테두리 색상 변경
 * - 읽기 전용 모드 지원
 * 
 * @example
 * ```tsx
 * <FormInput
 *   label="EMAIL"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   placeholder="your@email.com"
 * />
 * ```
 */
const FormInput = ({
  label,
  value,
  onChange,
  id: suppliedId,
  name: suppliedName,
  className,
  onFocus,
  onBlur,
  ...inputProps
}: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = suppliedId ?? generatedId;
  const inputName = suppliedName ?? inputId;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs text-[var(--color-accent)] tracking-widest mb-2"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={inputName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
        className={`w-full bg-transparent border-b text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
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

export default FormInput;
