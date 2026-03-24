'use client';

import { useState, useEffect, useRef } from 'react';

interface PercentInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  id: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

export function PercentInput({
  value,
  onChange,
  label,
  id,
  min = 0,
  max = 100,
  step = 0.5,
  decimals = 1,
  helpText,
  error,
  disabled = false,
}: PercentInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number preserving the user's original precision
  // e.g. 3.95 stays "3.95", 4 stays "4", 3.5 stays "3.5"
  const formatValue = (num: number): string => {
    // Use parseFloat(toFixed(10)) to clean up floating point artifacts
    // then toString() to get natural precision (no trailing zeros)
    return parseFloat(num.toFixed(10)).toString();
  };

  // Parse string to number
  const parseValue = (str: string): number => {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    }
  }, [value, isFocused, decimals]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseValue(displayValue);
    const clamped = Math.min(Math.max(parsed, min), max);
    onChange(clamped);
    setDisplayValue(formatValue(clamped));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(value + step, max);
      onChange(parseFloat(newValue.toFixed(10)));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(value - step, min);
      onChange(parseFloat(newValue.toFixed(10)));
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`block w-full rounded-lg border-0 py-2.5 pl-3 pr-8 text-foreground ring-1 ring-inset
            ${error ? 'ring-destructive focus:ring-destructive' : 'ring-border focus:ring-accent'}
            placeholder:text-muted-foreground focus:ring-2 focus:ring-inset text-sm
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
            transition-shadow duration-200`}
          placeholder="0"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-muted-foreground text-sm">%</span>
        </div>
      </div>
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
