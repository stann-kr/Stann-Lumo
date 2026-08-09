import { useId, useState } from 'react';
import type { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react';
import { createBorderMid, createBorderAccent } from '../../utils/colorMix';

/**
 * FormInput Props 정의
 */
interface FormInputProps extends Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | 'id'
  | 'name'
  | 'disabled'
  | 'autoComplete'
  | 'required'
  | 'aria-describedby'
  | 'aria-invalid'
> {
  /** 입력 필드 라벨 */
  label: string;
  /** 입력 필드 타입 (기본값: 'text') */
  type?: HTMLInputTypeAttribute;
  /** 현재 입력값 */
  value: string;
  /** 값 변경 시 호출될 콜백 함수 */
  onChange: (value: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 읽기 전용 여부 */
  readOnly?: boolean;
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
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly = false,
  id,
  name,
  disabled,
  autoComplete,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

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
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className="w-full bg-transparent border-b text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={isFocused ? createBorderAccent() : createBorderMid()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
};

export default FormInput;
