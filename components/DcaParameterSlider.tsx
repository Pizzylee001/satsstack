'use client';

import React from 'react';

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
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-[#181D24] border border-[#262E3B]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#8B95A5]">{label}</label>
        <div className="flex items-center gap-1 font-mono text-sm font-semibold text-[#F0F4F8] tabular-nums">
          <span className={isDanger ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>{value}</span>
          {unit && <span className="text-[#8B95A5] text-xs">{unit}</span>}
        </div>
      </div>

      <div className="relative py-1">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#262E3B] rounded-lg appearance-none cursor-pointer accent-[#F59E0B] focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
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
