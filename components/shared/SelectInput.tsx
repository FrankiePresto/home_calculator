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
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset
          ${error ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-blue-500'}
          focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
          disabled:bg-gray-50 disabled:text-gray-500`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
