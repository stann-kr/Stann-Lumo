import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  onChange: (value: string) => void;
  labelClassName?: string;
}

/** 어드민 선택 필드의 label, id, name 계약을 일관되게 제공한다. */
const FormSelect = ({
  label,
  onChange,
  id: suppliedId,
  name: suppliedName,
  className,
  labelClassName,
  ...selectProps
}: FormSelectProps) => {
  const generatedId = useId();
  const selectId = suppliedId ?? generatedId;
  const selectName = suppliedName ?? selectId;

  return (
    <div>
      <label
        htmlFor={selectId}
        className={labelClassName ?? 'block text-xs text-[var(--color-accent)] tracking-widest mb-2'}
      >
        {label}
      </label>
      <select
        id={selectId}
        name={selectName}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
        {...selectProps}
      />
    </div>
  );
};

export default FormSelect;
