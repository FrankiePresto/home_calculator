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

  // Format number with fixed decimals
  const formatValue = (num: number): string => {
    return num.toFixed(decimals);
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
      onChange(Math.round(newValue * 10) / 10);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(value - step, min);
      onChange(Math.round(newValue * 10) / 10);
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
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
          className={`block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset
            ${error ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-blue-500'}
            placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
            disabled:bg-gray-50 disabled:text-gray-500`}
          placeholder="0"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-gray-500 sm:text-sm">%</span>
        </div>
      </div>
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
