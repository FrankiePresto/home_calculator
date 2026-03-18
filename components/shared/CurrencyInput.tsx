'use client';

import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  id: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  id,
  min = 0,
  max = Infinity,
  step = 100,
  helpText,
  error,
  disabled = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with commas
  const formatWithCommas = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Parse string to number, removing non-numeric characters
  const parseValue = (str: string): number => {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatWithCommas(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseValue(displayValue);
    const clamped = Math.min(Math.max(parsed, min), max);
    onChange(clamped);
    setDisplayValue(formatWithCommas(clamped));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(value + step, max);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(value - step, min);
      onChange(newValue);
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="label"
      >
        {label}
      </label>
      <div className="relative rounded-lg">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-muted-foreground text-sm">$</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`block w-full rounded-lg border-0 py-2.5 pl-7 pr-3 text-foreground ring-1 ring-inset
            ${error ? 'ring-destructive focus:ring-destructive' : 'ring-border focus:ring-accent'}
            placeholder:text-muted-foreground focus:ring-2 focus:ring-inset text-sm
            disabled:bg-secondary disabled:text-muted-foreground`}
          placeholder="0"
        />
      </div>
      {helpText && !error && (
        <p className="helper-text">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
