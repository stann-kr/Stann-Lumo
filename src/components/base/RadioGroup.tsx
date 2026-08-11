'use client';
import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { createBorderFaint } from '@/utils/colorMix';

interface RadioGroupProps<T extends string | number> extends Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | 'id'
  | 'name'
  | 'disabled'
  | 'required'
  | 'aria-describedby'
  | 'aria-invalid'
> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/**
 * 어드민 RadioGroup 공통 컴포넌트
 * 갤러리, Display Settings 등 모든 어드민 페이지에서 재사용
 */
function RadioGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  id: suppliedId,
  name: suppliedName,
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: RadioGroupProps<T>) {
  const borderStyle = createBorderFaint();
  const generatedId = useId();
  const groupId = suppliedId ?? generatedId;
  const groupName = suppliedName ?? groupId;

  return (
    <fieldset
      id={groupId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className="flex flex-col gap-1.5"
    >
      <legend className="text-xs text-[var(--color-accent)] tracking-widest">{label}</legend>
      <div className="flex gap-3 flex-wrap">
        {options.map((opt, index) => {
          const optionId = `${groupId}-${index}`;
          const isSelected = value === opt.value;

          return (
            <div key={String(opt.value)} className="relative">
              <input
                id={optionId}
                name={groupName}
                type="radio"
                value={String(opt.value)}
                checked={isSelected}
                disabled={disabled}
                required={required && index === 0}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={optionId}
                className={`block px-3 py-1.5 text-xs tracking-wider border transition-colors cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)] ${
                  isSelected
                    ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/60 text-[var(--color-accent)]'
                    : 'text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                style={isSelected ? undefined : borderStyle}
              >
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default RadioGroup;
