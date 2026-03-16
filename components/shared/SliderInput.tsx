'use client';

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  id: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  helpText?: string;
  disabled?: boolean;
}

export function SliderInput({
  value,
  onChange,
  label,
  id,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  showValue = true,
  formatValue,
  helpText,
  disabled = false,
}: SliderInputProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  // Calculate percentage for gradient background
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
        {showValue && (
          <span className="text-sm font-semibold text-accent tabular-nums">
            {displayValue}
          </span>
        )}
      </div>
      <input
        type="range"
        id={id}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:bg-amber-700
          [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-accent
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, rgb(217 119 6) ${percentage}%, rgb(231 229 228) ${percentage}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
