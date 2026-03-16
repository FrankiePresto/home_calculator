'use client';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  label: string;
  id: string;
  options: SelectOption[];
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

export function SelectInput({
  value,
  onChange,
  label,
  id,
  options,
  helpText,
  error,
  disabled = false,
}: SelectInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    // Try to parse as number if it looks like one
    const numValue = parseFloat(selectedValue);
    onChange(isNaN(numValue) ? selectedValue : numValue);
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-foreground ring-1 ring-inset
          ${error ? 'ring-destructive focus:ring-destructive' : 'ring-border focus:ring-accent'}
          focus:ring-2 focus:ring-inset text-sm bg-background
          disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
          transition-shadow duration-200`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
