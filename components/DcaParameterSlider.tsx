'use client';

import React, { useId } from 'react';

interface DcaParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  name?: string;
  onChange: (val: number) => void;
  hint?: string;
  isDanger?: boolean;
}

export default function DcaParameterSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  name,
  onChange,
  hint,
  isDanger = false,
}: DcaParameterSliderProps) {
  const inputId = useId();
  const safeMax = Math.max(min + step, max);
  const clampedValue = Math.min(safeMax, Math.max(min, value));

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#181D24] border border-[#262E3B]">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-medium text-[#8B95A5]">
          {label}
        </label>
        <div className="flex items-center gap-1 font-mono text-sm font-semibold text-[#F0F4F8] tabular-nums">
          <span className={isDanger ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>
            {clampedValue}
          </span>
          {unit && <span className="text-[#8B95A5] text-xs">{unit}</span>}
        </div>
      </div>

      <div className="relative py-2">
        <input
          id={inputId}
          type="range"
          name={name}
          min={min}
          max={safeMax}
          step={step}
          value={clampedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-[#262E3B] rounded-lg appearance-none cursor-pointer accent-[#F59E0B] focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
        />
      </div>

      {hint && (
        <span className={`text-[11px] ${isDanger ? 'text-[#EF4444]' : 'text-[#8B95A5]'}`}>
          {hint}
        </span>
      )}
    </div>
  );
}
